package resolvers

import (
	"context"
	"fmt"
	"strconv"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"crmgo/internal/models"
	"golang.org/x/crypto/bcrypt"
)

// Me retrieves the current authenticated user
func (r *queryResolver) Me(ctx context.Context) (*models.User, error) {
	// Get user ID from context
	userID, ok := ctx.Value("userId").(uint)
	if !ok {
		return nil, fmt.Errorf("unauthorized")
	}

	// Find user in database
	var user models.User
	if err := r.DB.Preload("Organisation").Preload("TeamMember").First(&user, userID).Error; err != nil {
		return nil, err
	}

	return &user, nil
}

// Register creates a new user account
func (r *mutationResolver) Register(ctx context.Context, input RegisterInput) (*AuthResult, error) {
	// Check if email already exists
	var existingUser models.User
	if err := r.DB.Where("email = ?", input.Email).First(&existingUser).Error; err == nil {
		return nil, fmt.Errorf("email already exists")
	}

	// Set default role if not provided
	role := "admin"
	if input.Role != nil {
		role = *input.Role
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	// Create new user
	user := models.User{
		Email:    input.Email,
		Password: string(hashedPassword),
		Role:     role,
	}

	if err := r.DB.Create(&user).Error; err != nil {
		return nil, err
	}

	// Generate JWT token
	token, err := r.generateToken(user)
	if err != nil {
		return nil, err
	}

	// Set setup required flag
	setupRequired := true
	nextStep := "create-organization"

	return &AuthResult{
		Token:         token,
		User:          &user,
		SetupRequired: &setupRequired,
		NextStep:      &nextStep,
	}, nil
}

// Login authenticates a user and returns a JWT token
func (r *mutationResolver) Login(ctx context.Context, input LoginInput) (*AuthResult, error) {
	// Find user by email
	var user models.User
	if err := r.DB.Preload("Organisation").Preload("TeamMember").Where("email = ?", input.Email).First(&user).Error; err != nil {
		return nil, fmt.Errorf("invalid email or password")
	}

	// Compare passwords
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(input.Password)); err != nil {
		return nil, fmt.Errorf("invalid email or password")
	}

	// Generate JWT token
	token, err := r.generateToken(user)
	if err != nil {
		return nil, err
	}

	// Check if setup is required
	var setupRequired *bool
	var nextStep *string
	if user.OrganisationID == nil {
		setup := true
		step := "create-organization"
		setupRequired = &setup
		nextStep = &step
	}

	return &AuthResult{
		Token:         token,
		User:          &user,
		SetupRequired: setupRequired,
		NextStep:      nextStep,
	}, nil
}

// Logout is a placeholder since JWT management is client-side
func (r *mutationResolver) Logout(ctx context.Context) (bool, error) {
	// JWT tokens are stateless, so server-side logout just returns success
	return true, nil
}

// VerifyInvitationToken validates an invitation token and returns information about it
func (r *queryResolver) VerifyInvitationToken(ctx context.Context, token string) (*TokenInfo, error) {
	// Parse and verify the token
	claims, err := r.parseInvitationToken(token)
	if err != nil {
		return nil, err
	}

	// Get team member ID from token
	teamMemberID, err := strconv.ParseUint(claims["teamMemberId"].(string), 10, 64)
	if err != nil {
		return nil, fmt.Errorf("invalid token")
	}

	// Find team member in database
	var teamMember models.TeamMember
	if err := r.DB.Preload("Organisation").First(&teamMember, teamMemberID).Error; err != nil {
		return nil, fmt.Errorf("team member not found")
	}

	// Check if team member already has a user account
	if teamMember.UserID != nil {
		return nil, fmt.Errorf("this invitation has already been accepted")
	}

	// Check if invitation exists and is pending
	var invitation models.Invitation
	if err := r.DB.Where("team_member_id = ? AND status = ? AND expires_at > ?", 
		teamMemberID, "pending", time.Now()).First(&invitation).Error; err != nil {
		return nil, fmt.Errorf("invitation not found or has expired")
	}

	// Return token info
	return &TokenInfo{
		Name:             teamMember.TeamMemberName,
		Email:            teamMember.TeamMemberEmailID,
		OrganizationName: teamMember.Organisation.OrganisationName,
		Role:             claims["role"].(string),
	}, nil
}

// JoinOrganisation processes a team join request with an invitation token
func (r *mutationResolver) JoinOrganisation(ctx context.Context, input JoinOrganisationInput) (*AuthResult, error) {
	// Parse and verify the token
	claims, err := r.parseInvitationToken(input.Token)
	if err != nil {
		return nil, err
	}

	// Get team member ID and organisation ID from token
	teamMemberID, err := strconv.ParseUint(claims["teamMemberId"].(string), 10, 64)
	if err != nil {
		return nil, fmt.Errorf("invalid token")
	}

	organisationID, err := strconv.ParseUint(claims["organisationId"].(string), 10, 64)
	if err != nil {
		return nil, fmt.Errorf("invalid token")
	}

	email := claims["email"].(string)
	role := claims["role"].(string)

	// Find team member in database
	var teamMember models.TeamMember
	if err := r.DB.First(&teamMember, teamMemberID).Error; err != nil {
		return nil, fmt.Errorf("team member not found")
	}

	// Check if user already exists
	var user models.User
	userExists := false
	if err := r.DB.Where("email = ?", email).First(&user).Error; err == nil {
		userExists = true

		// Check if user is already in this organisation
		if user.OrganisationID != nil && *user.OrganisationID == uint(organisationID) {
			// Link team member to user if not already linked
			if teamMember.UserID == nil {
				teamMember.UserID = &user.ID
				if err := r.DB.Save(&teamMember).Error; err != nil {
					return nil, err
				}
			}

			// Generate token
			token, err := r.generateToken(user)
			if err != nil {
				return nil, err
			}

			return &AuthResult{
				Token: token,
				User:  &user,
			}, nil
		} else {
			// User exists but in a different organisation
			return nil, fmt.Errorf("email already registered with a different organization")
		}
	}

	// If user doesn't exist, create new user account
	if !userExists {
		// Hash password
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
		if err != nil {
			return nil, err
		}

		// Create user
		orgID := uint(organisationID)
		user = models.User{
			Email:          email,
			Password:       string(hashedPassword),
			Role:           role,
			OrganisationID: &orgID,
		}

		if err := r.DB.Create(&user).Error; err != nil {
			return nil, err
		}
	}

	// Link team member to user
	teamMember.UserID = &user.ID
	if err := r.DB.Save(&teamMember).Error; err != nil {
		return nil, err
	}

	// Update invitation status
	now := time.Now()
	if err := r.DB.Model(&models.Invitation{}).
		Where("team_member_id = ? AND status = ?", teamMemberID, "pending").
		Updates(map[string]interface{}{
			"status":      "accepted",
			"accepted_at": now,
		}).Error; err != nil {
		return nil, err
	}

	// Generate JWT token
	token, err := r.generateToken(user)
	if err != nil {
		return nil, err
	}

	return &AuthResult{
		Token: token,
		User:  &user,
	}, nil
}

// generateToken creates a JWT token for a user
func (r *Resolver) generateToken(user models.User) (string, error) {
	// Create JWT claims
	claims := jwt.MapClaims{
		"id":    user.ID,
		"email": user.Email,
		"role":  user.Role,
		"exp":   time.Now().Add(time.Hour * 24 * 7).Unix(), // Token expires in 7 days
	}

	// Add organisation ID if user has one
	if user.OrganisationID != nil {
		claims["organisation_id"] = *user.OrganisationID
	}

	// Add team member ID if user has one
	if user.TeamMember != nil {
		claims["team_member_id"] = user.TeamMember.ID
	}

	// Create token with claims
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	// Sign token with secret
	tokenString, err := token.SignedString([]byte(r.JWTSecret))
	if err != nil {
		return "", err
	}

	return tokenString, nil
}

// parseInvitationToken parses and validates an invitation token
func (r *Resolver) parseInvitationToken(tokenString string) (jwt.MapClaims, error) {
	// Parse the token
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		// Validate signing method
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(r.JWTSecret), nil
	})

	if err != nil {
		return nil, fmt.Errorf("invalid or expired token")
	}

	// Validate claims
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok || !token.Valid {
		return nil, fmt.Errorf("invalid token")
	}

	// Check if token is an invitation token
	tokenType, ok := claims["type"].(string)
	if !ok || tokenType != "invitation" {
		return nil, fmt.Errorf("invalid token type")
	}

	return claims, nil
}

// Health check resolver
func (r *queryResolver) Health(ctx context.Context) (*HealthStatus, error) {
	return &HealthStatus{
		Status:    "ok",
		Timestamp: time.Now().Format(time.RFC3339),
		Env:       "development", // Get from environment in production
	}, nil
}