package models

import (
	"time"

	"gorm.io/gorm"
)

// Task represents a to-do item related to a deal
type Task struct {
	ID          uint           `gorm:"primaryKey" json:"id"`
	Title       string         `gorm:"not null" json:"title"`
	Description *string        `json:"description"`
	DueDate     *time.Time     `json:"due_date"`
	Status      string         `gorm:"not null;default:'Pending'" json:"status"`
	AssignedTo  *uint          `json:"assigned_to,omitempty"`
	TeamMember  *TeamMember    `gorm:"foreignKey:AssignedTo" json:"assigned_to_team_member,omitempty"`
	DealID      *uint          `json:"deal_id,omitempty"`
	Deal        *Deal          `gorm:"foreignKey:DealID" json:"deal,omitempty"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
}