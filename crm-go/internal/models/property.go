package models

import (
	"time"

	"gorm.io/gorm"
)

// Property represents a real estate property in the system
type Property struct {
	ID             uint           `gorm:"primaryKey" json:"id"`
	Name           string         `gorm:"not null" json:"name"`
	Address        *string        `json:"address"`
	OwnerID        *uint          `json:"owner_id,omitempty"`
	Owner          *Contact       `gorm:"foreignKey:OwnerID" json:"owner,omitempty"`
	OrganisationID uint           `gorm:"not null" json:"organisation_id"`
	Organisation   Organisation   `gorm:"foreignKey:OrganisationID" json:"organisation,omitempty"`
	Status         *string        `gorm:"default:'Available'" json:"status"`
	Deals          []Deal         `gorm:"foreignKey:PropertyID" json:"deals,omitempty"`
	Documents      []Document     `gorm:"foreignKey:PropertyID" json:"documents,omitempty"`
	CreatedAt      time.Time      `json:"created_at"`
	UpdatedAt      time.Time      `json:"updated_at"`
	DeletedAt      gorm.DeletedAt `gorm:"index" json:"-"`
}