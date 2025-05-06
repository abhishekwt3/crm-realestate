package models

import (
	"time"

	"gorm.io/gorm"
)

// Invitation represents a team member invitation
type Invitation struct {
	ID             uint           `gorm:"primaryKey" json:"id"`
	Email          string         `gorm:"not null" json:"email"`
	Token          string         `gorm:"not null;unique" json:"token"`
	TeamMemberID   uint           `gorm:"not null" json:"team_member_id"`
	TeamMember     TeamMember     `gorm:"foreignKey:TeamMemberID" json:"team_member,omitempty"`
	OrganisationID uint           `gorm:"not null" json:"organisation_id"`
	Organisation   Organisation   `gorm:"foreignKey:OrganisationID" json:"organisation,omitempty"`
	InvitedBy      uint           `gorm:"not null" json:"invited_by"`
	Inviter        User           `gorm:"foreignKey:InvitedBy" json:"inviter,omitempty"`
	Status         string         `gorm:"not null;default:'pending'" json:"status"`
	ExpiresAt      time.Time      `gorm:"not null" json:"expires_at"`
	AcceptedAt     *time.Time     `json:"accepted_at"`
	CreatedAt      time.Time      `json:"created_at"`
	UpdatedAt      time.Time      `json:"updated_at"`
	DeletedAt      gorm.DeletedAt `gorm:"index" json:"-"`
}