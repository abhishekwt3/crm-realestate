package resolvers

// This file will not be regenerated automatically.
//
// It serves as dependency injection for your app, add any dependencies you require here.
import (
	"crmgo/internal/models"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"gorm.io/gorm"
)

// Resolver is the root resolver for GraphQL queries and mutations
type Resolver struct {
	DB        *gorm.DB
	JWTSecret string
}

// NewResolver creates a new resolver with the provided database connection
func NewResolver(db *gorm.DB, jwtSecret string) *Resolver {
	return &Resolver{
		DB:        db,
		JWTSecret: jwtSecret,
	}
}

func (r *Resolver) generateToken(user *models.User) (string, error) {
    claims := jwt.MapClaims{
        "id":    user.ID,
        "email": user.Email,
        "role":  user.Role,
        "exp":   time.Now().Add(time.Hour * 24 * 7).Unix(), // 7 days
    }

    if user.OrganisationID != nil {
        claims["organisation_id"] = *user.OrganisationID
    }

    token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
    return token.SignedString([]byte(r.JWTSecret))
}





