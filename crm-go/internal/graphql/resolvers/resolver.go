package resolvers

import (
	"context"
	"time"

	"crmgo/internal/models"
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

// Query returns the query resolver
// func (r *Resolver) Query() QueryResolver {
// 	return &queryResolver{r}
// }

// // Mutation returns the mutation resolver
// func (r *Resolver) Mutation() MutationResolver {
// 	return &mutationResolver{r}
// }

// QueryResolver defines the methods for GraphQL queries
type QueryResolver interface {
	// Auth queries
	Me(ctx context.Context) (*models.User, error)

	// Organisation queries
	Organisations(ctx context.Context) ([]*models.Organisation, error)
	Organisation(ctx context.Context, id string) (*models.Organisation, error)

	// TeamMember queries
	TeamMembers(ctx context.Context) ([]*models.TeamMember, error)
	TeamMember(ctx context.Context, id string) (*models.TeamMember, error)

	// Contact queries
	Contacts(ctx context.Context, query *string) ([]*models.Contact, error)
	Contact(ctx context.Context, id string) (*models.Contact, error)

	// Property queries
	Properties(ctx context.Context, status *string) ([]*models.Property, error)
	Property(ctx context.Context, id string) (*models.Property, error)

	// Deal queries
	Deals(ctx context.Context, status *string, assignedTo *string, propertyId *string) ([]*models.Deal, error)
	Deal(ctx context.Context, id string) (*models.Deal, error)

	// Discussion queries
	Discussions(ctx context.Context, dealId string) ([]*models.Discussion, error)

	// Meeting queries
	Meetings(ctx context.Context, dealId string) ([]*models.Meeting, error)

	// Task queries
	Tasks(ctx context.Context, status *string, assignedTo *string, dealId *string) ([]*models.Task, error)
	Task(ctx context.Context, id string) (*models.Task, error)

	// Document queries
	Documents(ctx context.Context, dealId *string, propertyId *string) ([]*models.Document, error)
	Document(ctx context.Context, id string) (*models.Document, error)

	// Invitation queries
	VerifyInvitationToken(ctx context.Context, token string) (*TokenInfo, error)

	// Health check
	Health(ctx context.Context) (*HealthStatus, error)
}

// MutationResolver defines the methods for GraphQL mutations
type MutationResolver interface {
	// Auth mutations
	Register(ctx context.Context, input RegisterInput) (*AuthResult, error)
	Login(ctx context.Context, input LoginInput) (*AuthResult, error)
	Logout(ctx context.Context) (bool, error)

	// Organisation mutations
	CreateOrganisation(ctx context.Context, input CreateOrganisationInput) (*models.Organisation, error)
	UpdateOrganisation(ctx context.Context, id string, input UpdateOrganisationInput) (*models.Organisation, error)
	DeleteOrganisation(ctx context.Context, id string) (bool, error)

	// TeamMember mutations
	CreateTeamMember(ctx context.Context, input CreateTeamMemberInput) (*models.TeamMember, error)
	UpdateTeamMember(ctx context.Context, id string, input UpdateTeamMemberInput) (*models.TeamMember, error)
	DeleteTeamMember(ctx context.Context, id string) (bool, error)

	// Contact mutations
	CreateContact(ctx context.Context, input CreateContactInput) (*models.Contact, error)
	UpdateContact(ctx context.Context, id string, input UpdateContactInput) (*models.Contact, error)
	DeleteContact(ctx context.Context, id string) (bool, error)

	// Property mutations
	CreateProperty(ctx context.Context, input CreatePropertyInput) (*models.Property, error)
	UpdateProperty(ctx context.Context, id string, input UpdatePropertyInput) (*models.Property, error)
	DeleteProperty(ctx context.Context, id string) (bool, error)

	// Deal mutations
	CreateDeal(ctx context.Context, input CreateDealInput) (*models.Deal, error)
	UpdateDeal(ctx context.Context, id string, input UpdateDealInput) (*models.Deal, error)
	DeleteDeal(ctx context.Context, id string) (bool, error)

	// Discussion mutations
	CreateDiscussion(ctx context.Context, input CreateDiscussionInput) (*models.Discussion, error)

	// Meeting mutations
	CreateMeeting(ctx context.Context, input CreateMeetingInput) (*models.Meeting, error)

	// Task mutations
	CreateTask(ctx context.Context, input CreateTaskInput) (*models.Task, error)
	UpdateTask(ctx context.Context, id string, input UpdateTaskInput) (*models.Task, error)
	DeleteTask(ctx context.Context, id string) (bool, error)

	// Document mutations
	CreateDocument(ctx context.Context, input CreateDocumentInput) (*models.Document, error)
	DeleteDocument(ctx context.Context, id string) (bool, error)

	// Team invitation mutations
	InviteTeamMember(ctx context.Context, input InviteTeamMemberInput) (*models.TeamMember, error)
	JoinOrganisation(ctx context.Context, input JoinOrganisationInput) (*AuthResult, error)
	ResendInvitation(ctx context.Context, input ResendInvitationInput) (bool, error)
}

// Input types for mutations
type RegisterInput struct {
	Email    string  `json:"email"`
	Password string  `json:"password"`
	Role     *string `json:"role"`
}

type LoginInput struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type CreateOrganisationInput struct {
	OrganisationName string `json:"organisationName"`
}

type UpdateOrganisationInput struct {
	OrganisationName string `json:"organisationName"`
}

type CreateTeamMemberInput struct {
	TeamMemberName     string  `json:"teamMemberName"`
	TeamMemberEmailId  string  `json:"teamMemberEmailId"`
	Role               *string `json:"role"`
}

type UpdateTeamMemberInput struct {
	TeamMemberName    string `json:"teamMemberName"`
	TeamMemberEmailId string `json:"teamMemberEmailId"`
}

type CreateContactInput struct {
	Name           string  `json:"name"`
	Email          *string `json:"email"`
	Phone          *string `json:"phone"`
	OrganisationId *string `json:"organisationId"`
}

type UpdateContactInput struct {
	Name           string  `json:"name"`
	Email          *string `json:"email"`
	Phone          *string `json:"phone"`
	OrganisationId *string `json:"organisationId"`
}

type CreatePropertyInput struct {
	Name           string  `json:"name"`
	Address        *string `json:"address"`
	OwnerId        *string `json:"ownerId"`
	Status         *string `json:"status"`
	OrganisationId *string `json:"organisationId"`
}

type UpdatePropertyInput struct {
	Name    string  `json:"name"`
	Address *string `json:"address"`
	OwnerId *string `json:"ownerId"`
	Status  *string `json:"status"`
}

type CreateDealInput struct {
	Name        string   `json:"name"`
	PropertyId  string   `json:"propertyId"`
	AssignedTo  *string  `json:"assignedTo"`
	Status      *string  `json:"status"`
	Value       *float64 `json:"value"`
	InitialNote *string  `json:"initialNote"`
}

type UpdateDealInput struct {
	Name       string   `json:"name"`
	PropertyId *string  `json:"propertyId"`
	AssignedTo *string  `json:"assignedTo"`
	Status     *string  `json:"status"`
	Value      *float64 `json:"value"`
}

type CreateDiscussionInput struct {
	DealId   string `json:"dealId"`
	Comments string `json:"comments"`
}

type CreateMeetingInput struct {
	DealId      string     `json:"dealId"`
	Datetime    time.Time  `json:"datetime"`
	Title       *string    `json:"title"`
	Description *string    `json:"description"`
	Location    *string    `json:"location"`
}

type CreateTaskInput struct {
	Title       string     `json:"title"`
	Description *string    `json:"description"`
	DueDate     *time.Time `json:"dueDate"`
	Status      *string    `json:"status"`
	AssignedTo  *string    `json:"assignedTo"`
	DealId      *string    `json:"dealId"`
}

type UpdateTaskInput struct {
	Title       string     `json:"title"`
	Description *string    `json:"description"`
	DueDate     *time.Time `json:"dueDate"`
	Status      *string    `json:"status"`
	AssignedTo  *string    `json:"assignedTo"`
	DealId      *string    `json:"dealId"`
}

type CreateDocumentInput struct {
	Title      string  `json:"title"`
	FileUrl    string  `json:"fileUrl"`
	FileType   *string `json:"fileType"`
	DealId     *string `json:"dealId"`
	PropertyId *string `json:"propertyId"`
}

type JoinOrganisationInput struct {
	Token    string `json:"token"`
	Password string `json:"password"`
}

type InviteTeamMemberInput struct {
	TeamMemberName    string  `json:"teamMemberName"`
	TeamMemberEmailId string  `json:"teamMemberEmailId"`
	Role              *string `json:"role"`
}

type ResendInvitationInput struct {
	TeamMemberId string `json:"teamMemberId"`
}

// Output types for queries and mutations
type AuthResult struct {
	Token         string       `json:"token"`
	User          *models.User `json:"user"`
	SetupRequired *bool        `json:"setupRequired"`
	NextStep      *string      `json:"nextStep"`
}

type TokenInfo struct {
	Name             string `json:"name"`
	Email            string `json:"email"`
	OrganizationName string `json:"organizationName"`
	Role             string `json:"role"`
}

type HealthStatus struct {
	Status    string `json:"status"`
	Timestamp string `json:"timestamp"`
	Env       string `json:"env"`
}

// Query resolver implementation
type queryResolver struct{ *Resolver }

// Mutation resolver implementation
type mutationResolver struct{ *Resolver }