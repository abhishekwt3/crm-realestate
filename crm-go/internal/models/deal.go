package models

import (
	"time"

	"gorm.io/gorm"
)

// Deal represents a business deal or transaction in the system
type Deal struct {
	ID          uint           `gorm:"primaryKey" json:"id"`
	Name        string         `gorm:"not null" json:"name"`
	PropertyID  *uint          `json:"property_id,omitempty"`
	Property    *Property      `gorm:"foreignKey:PropertyID" json:"property,omitempty"`
	AssignedTo  *uint          `json:"assigned_to,omitempty"`
	TeamMember  *TeamMember    `gorm:"foreignKey:AssignedTo" json:"assigned_to_team_member,omitempty"`
	Status      string         `gorm:"not null;default:'New'" json:"status"`
	Value       *float64       `json:"value"`
	Discussions []Discussion   `gorm:"foreignKey:DealID" json:"discussions,omitempty"`
	Meetings    []Meeting      `gorm:"foreignKey:DealID" json:"meetings,omitempty"`
	Tasks       []Task         `gorm:"foreignKey:DealID" json:"tasks,omitempty"`
	Documents   []Document     `gorm:"foreignKey:DealID" json:"documents,omitempty"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
}