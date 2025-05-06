package resolvers

import (
	"context"
	"fmt"
	"strconv"
	"time"

	//"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"

	"crmgo/internal/graphql/generated"
	models1 "crmgo/internal/graphql/models"
	"crmgo/internal/models"
)

// Helper function to convert uint to string ID
func idToString(id uint) string {
	return strconv.FormatUint(uint64(id), 10)
}

// Helper function to convert string to uint ID
func stringToID(id string) (uint, error) {
	parsed, err := strconv.ParseUint(id, 10, 64)
	if err != nil {
		return 0, err
	}
	return uint(parsed), nil
}

// ID is the resolver for the id field.
func (r *userResolver) ID(ctx context.Context, obj *models.User) (string, error) {
	return idToString(obj.ID), nil
}

// OrganisationID is the resolver for the organisationId field.
func (r *userResolver) OrganisationID(ctx context.Context, obj *models.User) (*string, error) {
	if obj.OrganisationID == nil {
		return nil, nil
	}
	id := idToString(*obj.OrganisationID)
	return &id, nil
}

// Health is the resolver for the health field.
func (r *queryResolver) Health(ctx context.Context) (*models1.HealthStatus, error) {
	env := "development" // Or get from config
	return &models1.HealthStatus{
		Status:    "ok",
		Timestamp: time.Now().Format(time.RFC3339),
		Env:       &env,
	}, nil
}

// Register is the resolver for the register field.
func (r *mutationResolver) Register(ctx context.Context, input models1.RegisterInput) (*models1.AuthResult, error) {
	// Check if email already exists
	var existingUser models.User
	if err := r.DB.Where("email = ?", input.Email).First(&existingUser).Error; err == nil {
		return nil, fmt.Errorf("email already exists")
	}

	// Set default role if not provided
	role := "user"
	if input.Role != nil {
		role = *input.Role
	}

	// Hash the password
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
		return nil, fmt.Errorf("failed to create user: %v", err)
	}

	// Generate JWT token
	token, err := r.generateToken(&user)
	if err != nil {
		return nil, fmt.Errorf("failed to generate token: %v", err)
	}

	// Set setup required flag
	setupRequired := true
	nextStep := "create-organization"

	return &models1.AuthResult{
		Token:         token,
		User:          &user,
		SetupRequired: &setupRequired,
		NextStep:      &nextStep,
	}, nil
}

// Login is the resolver for the login field.
func (r *mutationResolver) Login(ctx context.Context, input models1.LoginInput) (*models1.AuthResult, error) {
	// Find user by email
	var user models.User
	if err := r.DB.Where("email = ?", input.Email).First(&user).Error; err != nil {
		return nil, fmt.Errorf("invalid email or password")
	}

	// Compare passwords
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(input.Password)); err != nil {
		return nil, fmt.Errorf("invalid email or password")
	}

	// Load related data
	if err := r.DB.Preload("Organisation").Preload("TeamMember").First(&user, user.ID).Error; err != nil {
		return nil, fmt.Errorf("error loading user data: %v", err)
	}

	// Generate JWT token
	token, err := r.generateToken(&user)
	if err != nil {
		return nil, fmt.Errorf("failed to generate token: %v", err)
	}

	// Check if setup is required
	var setupRequired *bool
	var nextStep *string
	if user.OrganisationID == nil {
		required := true
		step := "create-organization"
		setupRequired = &required
		nextStep = &step
	}

	return &models1.AuthResult{
		Token:         token,
		User:          &user,
		SetupRequired: setupRequired,
		NextStep:      nextStep,
	}, nil
}

// Logout is the resolver for the logout field.
func (r *mutationResolver) Logout(ctx context.Context) (bool, error) {
	// JWT tokens are stateless, so server-side logout just returns success
	return true, nil
}

// CreateOrganisation is the resolver for the createOrganisation field.
func (r *mutationResolver) CreateOrganisation(ctx context.Context, input models1.CreateOrganisationInput) (*models.Organisation, error) {
	// Get user ID from context
	userID, ok := ctx.Value("userId").(uint)
	if !ok {
		return nil, fmt.Errorf("unauthorized")
	}

	// Create organisation
	organisation := models.Organisation{
		OrganisationName: input.OrganisationName,
	}

	// Start DB transaction
	tx := r.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Create organisation
	if err := tx.Create(&organisation).Error; err != nil {
		tx.Rollback()
		return nil, err
	}

	// Update user with organisation ID
	if err := tx.Model(&models.User{}).Where("id = ?", userID).Update("organisation_id", organisation.ID).Error; err != nil {
		tx.Rollback()
		return nil, err
	}

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		return nil, err
	}

	return &organisation, nil
}

// Me is the resolver for the me field.
func (r *queryResolver) Me(ctx context.Context) (*models.User, error) {
	// Get user ID from context
	userID, ok := ctx.Value("userId").(uint)
	if !ok {
		return nil, fmt.Errorf("unauthorized")
	}

	// Get user from database with related data
	var user models.User
	if err := r.DB.Preload("Organisation").Preload("TeamMember").First(&user, userID).Error; err != nil {
		return nil, err
	}

	return &user, nil
}

// CreateTeamMember is the resolver for the createTeamMember field.
func (r *mutationResolver) CreateTeamMember(ctx context.Context, input models1.CreateTeamMemberInput) (*models.TeamMember, error) {
	// Get user ID from context
	userID, ok := ctx.Value("userId").(uint)
	if !ok {
		return nil, fmt.Errorf("unauthorized")
	}

	// Get user from database
	var user models.User
	if err := r.DB.First(&user, userID).Error; err != nil {
		return nil, err
	}

	// Check if user has an organisation
	if user.OrganisationID == nil {
		return nil, fmt.Errorf("user does not belong to an organisation")
	}

	// Create team member
	teamMember := models.TeamMember{
		OrganisationID:    *user.OrganisationID,
		TeamMemberName:    input.TeamMemberName,
		TeamMemberEmailID: input.TeamMemberEmailID, // Note the correct case here
	}

	// Save to database
	if err := r.DB.Create(&teamMember).Error; err != nil {
		return nil, err
	}

	return &teamMember, nil
}

// Keep all other auto-generated resolver methods as-is

// Add any helper functions used by the above resolvers

// ID is the resolver for the id field.
func (r *contactResolver) ID(ctx context.Context, obj *models.Contact) (string, error) {
	panic(fmt.Errorf("not implemented: ID - id"))
}

// OrganisationID is the resolver for the organisationId field.
func (r *contactResolver) OrganisationID(ctx context.Context, obj *models.Contact) (*string, error) {
	panic(fmt.Errorf("not implemented: OrganisationID - organisationId"))
}

// ID is the resolver for the id field.
func (r *dealResolver) ID(ctx context.Context, obj *models.Deal) (string, error) {
	panic(fmt.Errorf("not implemented: ID - id"))
}

// PropertyID is the resolver for the propertyId field.
func (r *dealResolver) PropertyID(ctx context.Context, obj *models.Deal) (*string, error) {
	panic(fmt.Errorf("not implemented: PropertyID - propertyId"))
}

// AssignedTo is the resolver for the assignedTo field.
func (r *dealResolver) AssignedTo(ctx context.Context, obj *models.Deal) (*string, error) {
	panic(fmt.Errorf("not implemented: AssignedTo - assignedTo"))
}

// AssignedTeamMember is the resolver for the assignedTeamMember field.
func (r *dealResolver) AssignedTeamMember(ctx context.Context, obj *models.Deal) (*models.TeamMember, error) {
	panic(fmt.Errorf("not implemented: AssignedTeamMember - assignedTeamMember"))
}

// ID is the resolver for the id field.
func (r *discussionResolver) ID(ctx context.Context, obj *models.Discussion) (string, error) {
	panic(fmt.Errorf("not implemented: ID - id"))
}

// DealID is the resolver for the dealId field.
func (r *discussionResolver) DealID(ctx context.Context, obj *models.Discussion) (*string, error) {
	panic(fmt.Errorf("not implemented: DealID - dealId"))
}

// TeamMemberID is the resolver for the teamMemberId field.
func (r *discussionResolver) TeamMemberID(ctx context.Context, obj *models.Discussion) (*string, error) {
	panic(fmt.Errorf("not implemented: TeamMemberID - teamMemberId"))
}

// ID is the resolver for the id field.
func (r *documentResolver) ID(ctx context.Context, obj *models.Document) (string, error) {
	panic(fmt.Errorf("not implemented: ID - id"))
}

// UploadedBy is the resolver for the uploadedBy field.
func (r *documentResolver) UploadedBy(ctx context.Context, obj *models.Document) (*string, error) {
	panic(fmt.Errorf("not implemented: UploadedBy - uploadedBy"))
}

// DealID is the resolver for the dealId field.
func (r *documentResolver) DealID(ctx context.Context, obj *models.Document) (*string, error) {
	panic(fmt.Errorf("not implemented: DealID - dealId"))
}

// PropertyID is the resolver for the propertyId field.
func (r *documentResolver) PropertyID(ctx context.Context, obj *models.Document) (*string, error) {
	panic(fmt.Errorf("not implemented: PropertyID - propertyId"))
}

// ID is the resolver for the id field.
func (r *invitationResolver) ID(ctx context.Context, obj *models.Invitation) (string, error) {
	panic(fmt.Errorf("not implemented: ID - id"))
}

// TeamMemberID is the resolver for the teamMemberId field.
func (r *invitationResolver) TeamMemberID(ctx context.Context, obj *models.Invitation) (string, error) {
	panic(fmt.Errorf("not implemented: TeamMemberID - teamMemberId"))
}

// OrganisationID is the resolver for the organisationId field.
func (r *invitationResolver) OrganisationID(ctx context.Context, obj *models.Invitation) (string, error) {
	panic(fmt.Errorf("not implemented: OrganisationID - organisationId"))
}

// InvitedBy is the resolver for the invitedBy field.
func (r *invitationResolver) InvitedBy(ctx context.Context, obj *models.Invitation) (string, error) {
	panic(fmt.Errorf("not implemented: InvitedBy - invitedBy"))
}

// ID is the resolver for the id field.
func (r *meetingResolver) ID(ctx context.Context, obj *models.Meeting) (string, error) {
	panic(fmt.Errorf("not implemented: ID - id"))
}

// DealID is the resolver for the dealId field.
func (r *meetingResolver) DealID(ctx context.Context, obj *models.Meeting) (*string, error) {
	panic(fmt.Errorf("not implemented: DealID - dealId"))
}

// TeamMemberID is the resolver for the teamMemberId field.
func (r *meetingResolver) TeamMemberID(ctx context.Context, obj *models.Meeting) (*string, error) {
	panic(fmt.Errorf("not implemented: TeamMemberID - teamMemberId"))
}

// ID is the resolver for the id field.
func (r *meetingNotesResolver) ID(ctx context.Context, obj *models.MeetingNotes) (string, error) {
	panic(fmt.Errorf("not implemented: ID - id"))
}

// MeetingID is the resolver for the meetingId field.
func (r *meetingNotesResolver) MeetingID(ctx context.Context, obj *models.MeetingNotes) (string, error) {
	panic(fmt.Errorf("not implemented: MeetingID - meetingId"))
}

// TeamMemberID is the resolver for the teamMemberId field.
func (r *meetingNotesResolver) TeamMemberID(ctx context.Context, obj *models.MeetingNotes) (*string, error) {
	panic(fmt.Errorf("not implemented: TeamMemberID - teamMemberId"))
}

// Register is the resolver for the register field.
// func (r *mutationResolver) Register(ctx context.Context, input models1.RegisterInput) (*models1.AuthResult, error) {
// 	panic(fmt.Errorf("not implemented: Register - register"))
// }

// // Login is the resolver for the login field.
// func (r *mutationResolver) Login(ctx context.Context, input models1.LoginInput) (*models1.AuthResult, error) {
// 	panic(fmt.Errorf("not implemented: Login - login"))
// }

// // Logout is the resolver for the logout field.
// func (r *mutationResolver) Logout(ctx context.Context) (bool, error) {
// 	panic(fmt.Errorf("not implemented: Logout - logout"))
// }

// // CreateOrganisation is the resolver for the createOrganisation field.
// func (r *mutationResolver) CreateOrganisation(ctx context.Context, input models1.CreateOrganisationInput) (*models.Organisation, error) {
// 	panic(fmt.Errorf("not implemented: CreateOrganisation - createOrganisation"))
// }

// UpdateOrganisation is the resolver for the updateOrganisation field.
func (r *mutationResolver) UpdateOrganisation(ctx context.Context, id string, input models1.UpdateOrganisationInput) (*models.Organisation, error) {
	panic(fmt.Errorf("not implemented: UpdateOrganisation - updateOrganisation"))
}

// DeleteOrganisation is the resolver for the deleteOrganisation field.
func (r *mutationResolver) DeleteOrganisation(ctx context.Context, id string) (bool, error) {
	panic(fmt.Errorf("not implemented: DeleteOrganisation - deleteOrganisation"))
}

// CreateTeamMember is the resolver for the createTeamMember field.
// func (r *mutationResolver) CreateTeamMember(ctx context.Context, input models1.CreateTeamMemberInput) (*models.TeamMember, error) {
// 	panic(fmt.Errorf("not implemented: CreateTeamMember - createTeamMember"))
// }

// UpdateTeamMember is the resolver for the updateTeamMember field.
func (r *mutationResolver) UpdateTeamMember(ctx context.Context, id string, input models1.UpdateTeamMemberInput) (*models.TeamMember, error) {
	panic(fmt.Errorf("not implemented: UpdateTeamMember - updateTeamMember"))
}

// DeleteTeamMember is the resolver for the deleteTeamMember field.
func (r *mutationResolver) DeleteTeamMember(ctx context.Context, id string) (bool, error) {
	panic(fmt.Errorf("not implemented: DeleteTeamMember - deleteTeamMember"))
}

// CreateContact is the resolver for the createContact field.
func (r *mutationResolver) CreateContact(ctx context.Context, input models1.CreateContactInput) (*models.Contact, error) {
	panic(fmt.Errorf("not implemented: CreateContact - createContact"))
}

// UpdateContact is the resolver for the updateContact field.
func (r *mutationResolver) UpdateContact(ctx context.Context, id string, input models1.UpdateContactInput) (*models.Contact, error) {
	panic(fmt.Errorf("not implemented: UpdateContact - updateContact"))
}

// DeleteContact is the resolver for the deleteContact field.
func (r *mutationResolver) DeleteContact(ctx context.Context, id string) (bool, error) {
	panic(fmt.Errorf("not implemented: DeleteContact - deleteContact"))
}

// CreateProperty is the resolver for the createProperty field.
func (r *mutationResolver) CreateProperty(ctx context.Context, input models1.CreatePropertyInput) (*models.Property, error) {
	panic(fmt.Errorf("not implemented: CreateProperty - createProperty"))
}

// UpdateProperty is the resolver for the updateProperty field.
func (r *mutationResolver) UpdateProperty(ctx context.Context, id string, input models1.UpdatePropertyInput) (*models.Property, error) {
	panic(fmt.Errorf("not implemented: UpdateProperty - updateProperty"))
}

// DeleteProperty is the resolver for the deleteProperty field.
func (r *mutationResolver) DeleteProperty(ctx context.Context, id string) (bool, error) {
	panic(fmt.Errorf("not implemented: DeleteProperty - deleteProperty"))
}

// CreateDeal is the resolver for the createDeal field.
func (r *mutationResolver) CreateDeal(ctx context.Context, input models1.CreateDealInput) (*models.Deal, error) {
	panic(fmt.Errorf("not implemented: CreateDeal - createDeal"))
}

// UpdateDeal is the resolver for the updateDeal field.
func (r *mutationResolver) UpdateDeal(ctx context.Context, id string, input models1.UpdateDealInput) (*models.Deal, error) {
	panic(fmt.Errorf("not implemented: UpdateDeal - updateDeal"))
}

// DeleteDeal is the resolver for the deleteDeal field.
func (r *mutationResolver) DeleteDeal(ctx context.Context, id string) (bool, error) {
	panic(fmt.Errorf("not implemented: DeleteDeal - deleteDeal"))
}

// CreateDiscussion is the resolver for the createDiscussion field.
func (r *mutationResolver) CreateDiscussion(ctx context.Context, input models1.CreateDiscussionInput) (*models.Discussion, error) {
	panic(fmt.Errorf("not implemented: CreateDiscussion - createDiscussion"))
}

// CreateMeeting is the resolver for the createMeeting field.
func (r *mutationResolver) CreateMeeting(ctx context.Context, input models1.CreateMeetingInput) (*models.Meeting, error) {
	panic(fmt.Errorf("not implemented: CreateMeeting - createMeeting"))
}

// CreateTask is the resolver for the createTask field.
func (r *mutationResolver) CreateTask(ctx context.Context, input models1.CreateTaskInput) (*models.Task, error) {
	panic(fmt.Errorf("not implemented: CreateTask - createTask"))
}

// UpdateTask is the resolver for the updateTask field.
func (r *mutationResolver) UpdateTask(ctx context.Context, id string, input models1.UpdateTaskInput) (*models.Task, error) {
	panic(fmt.Errorf("not implemented: UpdateTask - updateTask"))
}

// DeleteTask is the resolver for the deleteTask field.
func (r *mutationResolver) DeleteTask(ctx context.Context, id string) (bool, error) {
	panic(fmt.Errorf("not implemented: DeleteTask - deleteTask"))
}

// CreateDocument is the resolver for the createDocument field.
func (r *mutationResolver) CreateDocument(ctx context.Context, input models1.CreateDocumentInput) (*models.Document, error) {
	panic(fmt.Errorf("not implemented: CreateDocument - createDocument"))
}

// DeleteDocument is the resolver for the deleteDocument field.
func (r *mutationResolver) DeleteDocument(ctx context.Context, id string) (bool, error) {
	panic(fmt.Errorf("not implemented: DeleteDocument - deleteDocument"))
}

// InviteTeamMember is the resolver for the inviteTeamMember field.
func (r *mutationResolver) InviteTeamMember(ctx context.Context, input models1.InviteTeamMemberInput) (*models.TeamMember, error) {
	panic(fmt.Errorf("not implemented: InviteTeamMember - inviteTeamMember"))
}

// JoinOrganisation is the resolver for the joinOrganisation field.
func (r *mutationResolver) JoinOrganisation(ctx context.Context, input models1.JoinOrganisationInput) (*models1.AuthResult, error) {
	panic(fmt.Errorf("not implemented: JoinOrganisation - joinOrganisation"))
}

// ResendInvitation is the resolver for the resendInvitation field.
func (r *mutationResolver) ResendInvitation(ctx context.Context, input models1.ResendInvitationInput) (bool, error) {
	panic(fmt.Errorf("not implemented: ResendInvitation - resendInvitation"))
}

// ID is the resolver for the id field.
func (r *organisationResolver) ID(ctx context.Context, obj *models.Organisation) (string, error) {
	panic(fmt.Errorf("not implemented: ID - id"))
}

// ID is the resolver for the id field.
func (r *propertyResolver) ID(ctx context.Context, obj *models.Property) (string, error) {
	panic(fmt.Errorf("not implemented: ID - id"))
}

// OwnerID is the resolver for the ownerId field.
func (r *propertyResolver) OwnerID(ctx context.Context, obj *models.Property) (*string, error) {
	panic(fmt.Errorf("not implemented: OwnerID - ownerId"))
}

// OrganisationID is the resolver for the organisationId field.
func (r *propertyResolver) OrganisationID(ctx context.Context, obj *models.Property) (string, error) {
	panic(fmt.Errorf("not implemented: OrganisationID - organisationId"))
}

// Me is the resolver for the me field.
// func (r *queryResolver) Me(ctx context.Context) (*models.User, error) {
// 	panic(fmt.Errorf("not implemented: Me - me"))
// }

// Organisations is the resolver for the organisations field.
func (r *queryResolver) Organisations(ctx context.Context) ([]*models.Organisation, error) {
	panic(fmt.Errorf("not implemented: Organisations - organisations"))
}

// Organisation is the resolver for the organisation field.
func (r *queryResolver) Organisation(ctx context.Context, id string) (*models.Organisation, error) {
	panic(fmt.Errorf("not implemented: Organisation - organisation"))
}

// TeamMembers is the resolver for the teamMembers field.
func (r *queryResolver) TeamMembers(ctx context.Context) ([]*models.TeamMember, error) {
	panic(fmt.Errorf("not implemented: TeamMembers - teamMembers"))
}

// TeamMember is the resolver for the teamMember field.
func (r *queryResolver) TeamMember(ctx context.Context, id string) (*models.TeamMember, error) {
	panic(fmt.Errorf("not implemented: TeamMember - teamMember"))
}

// Contacts is the resolver for the contacts field.
func (r *queryResolver) Contacts(ctx context.Context, query *string) ([]*models.Contact, error) {
	panic(fmt.Errorf("not implemented: Contacts - contacts"))
}

// Contact is the resolver for the contact field.
func (r *queryResolver) Contact(ctx context.Context, id string) (*models.Contact, error) {
	panic(fmt.Errorf("not implemented: Contact - contact"))
}

// Properties is the resolver for the properties field.
func (r *queryResolver) Properties(ctx context.Context, status *string) ([]*models.Property, error) {
	panic(fmt.Errorf("not implemented: Properties - properties"))
}

// Property is the resolver for the property field.
func (r *queryResolver) Property(ctx context.Context, id string) (*models.Property, error) {
	panic(fmt.Errorf("not implemented: Property - property"))
}

// Deals is the resolver for the deals field.
func (r *queryResolver) Deals(ctx context.Context, status *string, assignedTo *string, propertyID *string) ([]*models.Deal, error) {
	panic(fmt.Errorf("not implemented: Deals - deals"))
}

// Deal is the resolver for the deal field.
func (r *queryResolver) Deal(ctx context.Context, id string) (*models.Deal, error) {
	panic(fmt.Errorf("not implemented: Deal - deal"))
}

// Discussions is the resolver for the discussions field.
func (r *queryResolver) Discussions(ctx context.Context, dealID string) ([]*models.Discussion, error) {
	panic(fmt.Errorf("not implemented: Discussions - discussions"))
}

// Meetings is the resolver for the meetings field.
func (r *queryResolver) Meetings(ctx context.Context, dealID string) ([]*models.Meeting, error) {
	panic(fmt.Errorf("not implemented: Meetings - meetings"))
}

// Tasks is the resolver for the tasks field.
func (r *queryResolver) Tasks(ctx context.Context, status *string, assignedTo *string, dealID *string) ([]*models.Task, error) {
	panic(fmt.Errorf("not implemented: Tasks - tasks"))
}

// Task is the resolver for the task field.
func (r *queryResolver) Task(ctx context.Context, id string) (*models.Task, error) {
	panic(fmt.Errorf("not implemented: Task - task"))
}

// Documents is the resolver for the documents field.
func (r *queryResolver) Documents(ctx context.Context, dealID *string, propertyID *string) ([]*models.Document, error) {
	panic(fmt.Errorf("not implemented: Documents - documents"))
}

// Document is the resolver for the document field.
func (r *queryResolver) Document(ctx context.Context, id string) (*models.Document, error) {
	panic(fmt.Errorf("not implemented: Document - document"))
}

// VerifyInvitationToken is the resolver for the verifyInvitationToken field.
func (r *queryResolver) VerifyInvitationToken(ctx context.Context, token string) (*models1.TokenInfo, error) {
	panic(fmt.Errorf("not implemented: VerifyInvitationToken - verifyInvitationToken"))
}

// Health is the resolver for the health field.
// func (r *queryResolver) Health(ctx context.Context) (*models1.HealthStatus, error) {
// 	panic(fmt.Errorf("not implemented: Health - health"))
// }

// ID is the resolver for the id field.
func (r *taskResolver) ID(ctx context.Context, obj *models.Task) (string, error) {
	panic(fmt.Errorf("not implemented: ID - id"))
}

// AssignedTo is the resolver for the assignedTo field.
func (r *taskResolver) AssignedTo(ctx context.Context, obj *models.Task) (*string, error) {
	panic(fmt.Errorf("not implemented: AssignedTo - assignedTo"))
}

// AssignedTeamMember is the resolver for the assignedTeamMember field.
func (r *taskResolver) AssignedTeamMember(ctx context.Context, obj *models.Task) (*models.TeamMember, error) {
	panic(fmt.Errorf("not implemented: AssignedTeamMember - assignedTeamMember"))
}

// DealID is the resolver for the dealId field.
func (r *taskResolver) DealID(ctx context.Context, obj *models.Task) (*string, error) {
	panic(fmt.Errorf("not implemented: DealID - dealId"))
}

// ID is the resolver for the id field.
func (r *teamMemberResolver) ID(ctx context.Context, obj *models.TeamMember) (string, error) {
	panic(fmt.Errorf("not implemented: ID - id"))
}

// OrganisationID is the resolver for the organisationId field.
func (r *teamMemberResolver) OrganisationID(ctx context.Context, obj *models.TeamMember) (string, error) {
	panic(fmt.Errorf("not implemented: OrganisationID - organisationId"))
}

// UserID is the resolver for the userId field.
func (r *teamMemberResolver) UserID(ctx context.Context, obj *models.TeamMember) (*string, error) {
	panic(fmt.Errorf("not implemented: UserID - userId"))
}

// ID is the resolver for the id field.
// func (r *userResolver) ID(ctx context.Context, obj *models.User) (string, error) {
// 	panic(fmt.Errorf("not implemented: ID - id"))
// }

// OrganisationID is the resolver for the organisationId field.
// func (r *userResolver) OrganisationID(ctx context.Context, obj *models.User) (*string, error) {
// 	panic(fmt.Errorf("not implemented: OrganisationID - organisationId"))
// }

// Contact returns generated.ContactResolver implementation.
func (r *Resolver) Contact() generated.ContactResolver { return &contactResolver{r} }

// Deal returns generated.DealResolver implementation.
func (r *Resolver) Deal() generated.DealResolver { return &dealResolver{r} }

// Discussion returns generated.DiscussionResolver implementation.
func (r *Resolver) Discussion() generated.DiscussionResolver { return &discussionResolver{r} }

// Document returns generated.DocumentResolver implementation.
func (r *Resolver) Document() generated.DocumentResolver { return &documentResolver{r} }

// Invitation returns generated.InvitationResolver implementation.
func (r *Resolver) Invitation() generated.InvitationResolver { return &invitationResolver{r} }

// Meeting returns generated.MeetingResolver implementation.
func (r *Resolver) Meeting() generated.MeetingResolver { return &meetingResolver{r} }

// MeetingNotes returns generated.MeetingNotesResolver implementation.
func (r *Resolver) MeetingNotes() generated.MeetingNotesResolver { return &meetingNotesResolver{r} }

// Mutation returns generated.MutationResolver implementation.
func (r *Resolver) Mutation() generated.MutationResolver { return &mutationResolver{r} }

// Organisation returns generated.OrganisationResolver implementation.
func (r *Resolver) Organisation() generated.OrganisationResolver { return &organisationResolver{r} }

// Property returns generated.PropertyResolver implementation.
func (r *Resolver) Property() generated.PropertyResolver { return &propertyResolver{r} }

// Query returns generated.QueryResolver implementation.
func (r *Resolver) Query() generated.QueryResolver { return &queryResolver{r} }

// Task returns generated.TaskResolver implementation.
func (r *Resolver) Task() generated.TaskResolver { return &taskResolver{r} }

// TeamMember returns generated.TeamMemberResolver implementation.
func (r *Resolver) TeamMember() generated.TeamMemberResolver { return &teamMemberResolver{r} }

// User returns generated.UserResolver implementation.
func (r *Resolver) User() generated.UserResolver { return &userResolver{r} }

type contactResolver struct{ *Resolver }
type dealResolver struct{ *Resolver }
type discussionResolver struct{ *Resolver }
type documentResolver struct{ *Resolver }
type invitationResolver struct{ *Resolver }
type meetingResolver struct{ *Resolver }
type meetingNotesResolver struct{ *Resolver }
type mutationResolver struct{ *Resolver }
type organisationResolver struct{ *Resolver }
type propertyResolver struct{ *Resolver }
type queryResolver struct{ *Resolver }
type taskResolver struct{ *Resolver }
type teamMemberResolver struct{ *Resolver }
type userResolver struct{ *Resolver }
