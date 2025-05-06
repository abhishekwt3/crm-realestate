package models

import (
	"time"

	"gorm.io/gorm"
)

// Discussion represents a note or comment thread related to a deal
type Discussion struct {
	ID           uint           `gorm:"primaryKey" json:"id"`
	DealID       *uint          `json:"deal_id,omitempty"`
	Deal         *Deal          `gorm:"foreignKey:DealID" json:"deal,omitempty"`
	Timestamp    time.Time      `gorm:"not null;default:CURRENT_TIMESTAMP" json:"timestamp"`
	Comments     *string        `json:"comments"`
	TeamMemberID *uint          `json:"team_member_id,omitempty"`
	TeamMember   *TeamMember    `gorm:"foreignKey:TeamMemberID" json:"team_member,omitempty"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`
}