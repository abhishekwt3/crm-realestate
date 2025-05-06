package models

import (
	"time"

	"gorm.io/gorm"
)

// Meeting represents a scheduled meeting related to a deal
type Meeting struct {
	ID           uint           `gorm:"primaryKey" json:"id"`
	Datetime     time.Time      `gorm:"not null" json:"datetime"`
	DealID       *uint          `json:"deal_id,omitempty"`
	Deal         *Deal          `gorm:"foreignKey:DealID" json:"deal,omitempty"`
	TeamMemberID *uint          `json:"team_member_id,omitempty"`
	TeamMember   *TeamMember    `gorm:"foreignKey:TeamMemberID" json:"team_member,omitempty"`
	Title        *string        `json:"title"`
	Description  *string        `json:"description"`
	Location     *string        `json:"location"`
	Notes        []MeetingNotes `gorm:"foreignKey:MeetingID" json:"notes,omitempty"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`
}

// MeetingNotes represents notes taken during a meeting
type MeetingNotes struct {
	ID           uint           `gorm:"primaryKey" json:"id"`
	MeetingID    uint           `gorm:"not null" json:"meeting_id"`
	Meeting      Meeting        `gorm:"foreignKey:MeetingID" json:"meeting,omitempty"`
	Timestamp    time.Time      `gorm:"not null;default:CURRENT_TIMESTAMP" json:"timestamp"`
	Content      string         `gorm:"not null" json:"content"`
	TeamMemberID *uint          `json:"team_member_id,omitempty"`
	TeamMember   *TeamMember    `gorm:"foreignKey:TeamMemberID" json:"team_member,omitempty"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`
}