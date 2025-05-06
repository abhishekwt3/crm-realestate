package models

import (
	"time"

	"gorm.io/gorm"
)

// Document represents a file or document in the system
type Document struct {
	ID          uint           `gorm:"primaryKey" json:"id"`
	Title       string         `gorm:"not null" json:"title"`
	FileURL     string         `gorm:"not null" json:"file_url"`
	FileType    *string        `json:"file_type"`
	UploadedBy  *uint          `json:"uploaded_by,omitempty"`
	TeamMember  *TeamMember    `gorm:"foreignKey:UploadedBy" json:"uploader,omitempty"`
	DealID      *uint          `json:"deal_id,omitempty"`
	Deal        *Deal          `gorm:"foreignKey:DealID" json:"deal,omitempty"`
	PropertyID  *uint          `json:"property_id,omitempty"`
	Property    *Property      `gorm:"foreignKey:PropertyID" json:"property,omitempty"`
	UploadedAt  time.Time      `gorm:"not null;default:CURRENT_TIMESTAMP" json:"uploaded_at"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
}