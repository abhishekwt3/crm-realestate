package models

import (
	"time"

	"gorm.io/gorm"
)

// TeamMember represents a team member within an organization
type TeamMember struct {
	ID                 uint           `gorm:"primaryKey" json:"id"`
	OrganisationID     uint           `gorm:"not null" json:"organisation_id"`
	Organisation       Organisation   `gorm:"foreignKey:OrganisationID" json:"organisation,omitempty"`
	TeamMemberName     string         `gorm:"not null" json:"team_member_name"`
	TeamMemberEmailID  string         `gorm:"not null" json:"team_member_email_id"`
	UserID             *uint          `gorm:"unique" json:"user_id,omitempty"`
	User               *User          `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Deals              []Deal         `gorm:"foreignKey:AssignedTo" json:"deals,omitempty"`
	Discussions        []Discussion   `gorm:"foreignKey:TeamMemberID" json:"discussions,omitempty"`
	Meetings           []Meeting      `gorm:"foreignKey:TeamMemberID" json:"meetings,omitempty"`
	MeetingNotes       []MeetingNotes `gorm:"foreignKey:TeamMemberID" json:"meeting_notes,omitempty"`
	Tasks              []Task         `gorm:"foreignKey:AssignedTo" json:"tasks,omitempty"`
	Documents          []Document     `gorm:"foreignKey:UploadedBy" json:"documents,omitempty"`
	Invitations        []Invitation   `gorm:"foreignKey:TeamMemberID" json:"invitations,omitempty"`
	CreatedAt          time.Time      `json:"created_at"`
	UpdatedAt          time.Time      `json:"updated_at"`
	DeletedAt          gorm.DeletedAt `gorm:"index" json:"-"`
}