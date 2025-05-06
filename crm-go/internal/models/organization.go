package models

import (
	"time"

	"gorm.io/gorm"
)

// Organisation represents an organization or company in the system
type Organisation struct {
	ID               uint           `gorm:"primaryKey" json:"id"`
	OrganisationName string         `gorm:"not null" json:"organisation_name"`
	TeamMembers      []TeamMember   `gorm:"foreignKey:OrganisationID" json:"team_members,omitempty"`
	Properties       []Property     `gorm:"foreignKey:OrganisationID" json:"properties,omitempty"`
	Users            []User         `gorm:"foreignKey:OrganisationID" json:"users,omitempty"`
	Contacts         []Contact      `gorm:"foreignKey:OrganisationID" json:"contacts,omitempty"`
	Invitations      []Invitation   `gorm:"foreignKey:OrganisationID" json:"invitations,omitempty"`
	CreatedAt        time.Time      `json:"created_at"`
	UpdatedAt        time.Time      `json:"updated_at"`
	DeletedAt        gorm.DeletedAt `gorm:"index" json:"-"`
}