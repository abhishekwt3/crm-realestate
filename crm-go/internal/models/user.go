package models

import (
	"time"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// User represents a user account in the system
type User struct {
	ID             uint           `gorm:"primaryKey" json:"id"`
	Email          string         `gorm:"unique;not null" json:"email"`
	Password       string         `gorm:"not null" json:"-"` // Password is not exposed in JSON
	Role           string         `gorm:"not null;default:'admin'" json:"role"`
	OrganisationID *uint          `json:"organisation_id"`
	Organisation   *Organisation  `gorm:"foreignKey:OrganisationID" json:"organisation,omitempty"`
	TeamMember     *TeamMember    `gorm:"foreignKey:UserID" json:"team_member,omitempty"`
	SentInvitations []Invitation  `gorm:"foreignKey:InvitedBy" json:"sent_invitations,omitempty"`
	CreatedAt      time.Time      `json:"created_at"`
	UpdatedAt      time.Time      `json:"updated_at"`
	DeletedAt      gorm.DeletedAt `gorm:"index" json:"-"`
}

// BeforeSave hook - hash the password before saving if it's not already hashed
func (u *User) BeforeSave(tx *gorm.DB) error {
	if u.Password != "" && !isHashedPassword(u.Password) {
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(u.Password), bcrypt.DefaultCost)
		if err != nil {
			return err
		}
		u.Password = string(hashedPassword)
	}
	return nil
}

// ComparePassword compares a hashed password with its potential plaintext equivalent
func (u *User) ComparePassword(password string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(u.Password), []byte(password))
	return err == nil
}

// isHashedPassword checks if the given password is already hashed
func isHashedPassword(password string) bool {
	// bcrypt hashes start with $2a$ or $2b$
	return len(password) == 60 && (password[:4] == "$2a$" || password[:4] == "$2b$")
}