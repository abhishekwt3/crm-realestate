package models

import (
	"time"

	"gorm.io/gorm"
)

// Contact represents a contact or client in the system
type Contact struct {
	ID             uint           `gorm:"primaryKey" json:"id"`
	Name           string         `gorm:"not null" json:"name"`
	Email          *string        `json:"email"`
	Phone          *string        `json:"phone"`
	OrganisationID *uint          `json:"organisation_id,omitempty"`
	Organisation   *Organisation  `gorm:"foreignKey:OrganisationID" json:"organisation,omitempty"`
	Properties     []Property     `gorm:"foreignKey:OwnerID" json:"properties,omitempty"`
	CreatedAt      time.Time      `json:"created_at"`
	UpdatedAt      time.Time      `json:"updated_at"`
	DeletedAt      gorm.DeletedAt `gorm:"index" json:"-"`
}