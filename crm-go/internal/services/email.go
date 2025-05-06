package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
)

// EmailService handles email sending functionality
type EmailService struct {
	APIKey      string
	SenderEmail string
	SenderName  string
	IsMockMode  bool
}

// EmailParams represents the parameters for sending an email
type EmailParams struct {
	Sender      Sender      `json:"sender"`
	To          []Recipient `json:"to"`
	Subject     string      `json:"subject"`
	HTMLContent string      `json:"htmlContent"`
}

// Sender represents the email sender
type Sender struct {
	Email string `json:"email"`
	Name  string `json:"name"`
}

// Recipient represents an email recipient
type Recipient struct {
	Email string `json:"email"`
	Name  string `json:"name"`
}

// NewEmailService creates a new email service
func NewEmailService(apiKey, senderEmail, senderName string) *EmailService {
	// Check if in development mode
	isMockMode := os.Getenv("GO_ENV") != "production" || apiKey == ""
	
	if isMockMode {
		log.Println("Email service running in mock mode (emails will be logged but not sent)")
	}
	
	return &EmailService{
		APIKey:      apiKey,
		SenderEmail: senderEmail,
		SenderName:  senderName,
		IsMockMode:  isMockMode,
	}
}

// SendEmail sends an email using the configured email service
func (s *EmailService) SendEmail(to []Recipient, subject, htmlContent string) error {
	// Create email params
	params := EmailParams{
		Sender: Sender{
			Email: s.SenderEmail,
			Name:  s.SenderName,
		},
		To:          to,
		Subject:     subject,
		HTMLContent: htmlContent,
	}
	
	// If in mock mode, just log the email
	if s.IsMockMode {
		return s.mockSendEmail(params)
	}
	
	// Otherwise, send the email for real
	return s.sendRealEmail(params)
}

// mockSendEmail simulates sending an email by logging it
func (s *EmailService) mockSendEmail(params EmailParams) error {
	log.Println("=== MOCK EMAIL ===")
	log.Printf("From: %s <%s>\n", params.Sender.Name, params.Sender.Email)
	
	recipients := ""
	for i, r := range params.To {
		if i > 0 {
			recipients += ", "
		}
		recipients += fmt.Sprintf("%s <%s>", r.Name, r.Email)
	}
	
	log.Printf("To: %s\n", recipients)
	log.Printf("Subject: %s\n", params.Subject)
	log.Printf("Content: %s...\n", params.HTMLContent[:min(100, len(params.HTMLContent))])
	log.Println("=== END MOCK EMAIL ===")
	
	return nil
}

// sendRealEmail sends an actual email using the Brevo API
func (s *EmailService) sendRealEmail(params EmailParams) error {
	// Convert params to JSON
	payload, err := json.Marshal(params)
	if err != nil {
		return err
	}
	
	// Create request
	req, err := http.NewRequest("POST", "https://api.brevo.com/v3/smtp/email", bytes.NewBuffer(payload))
	if err != nil {
		return err
	}
	
	// Set headers
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("api-key", s.APIKey)
	
	// Send request
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	
	// Check response status
	if resp.StatusCode >= 400 {
		var errorResponse map[string]interface{}
		if err := json.NewDecoder(resp.Body).Decode(&errorResponse); err != nil {
			return fmt.Errorf("email API error: %d", resp.StatusCode)
		}
		return fmt.Errorf("email API error: %v", errorResponse)
	}
	
	return nil
}

// SendInvitationEmail sends an invitation email to a team member
func (s *EmailService) SendInvitationEmail(recipientEmail, recipientName, organizationName, inviterEmail, invitationURL string) error {
	// Create recipient
	recipients := []Recipient{
		{
			Email: recipientEmail,
			Name:  recipientName,
		},
	}
	
	// Create email subject
	subject := fmt.Sprintf("Invitation to join %s", organizationName)
	
	// Create email content
	htmlContent := fmt.Sprintf(`
		<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
			<h2>You've been invited to join %s</h2>
			<p>Hello %s,</p>
			<p>%s has invited you to join their organization on CRM Dashboard.</p>
			<div style="margin: 30px 0;">
				<a href="%s" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
					Accept Invitation
				</a>
			</div>
			<p>This invitation link will expire in 7 days.</p>
			<p>If you have any questions, please contact the person who invited you.</p>
		</div>
	`, organizationName, recipientName, inviterEmail, invitationURL)
	
	// Send email
	return s.SendEmail(recipients, subject, htmlContent)
}

// Helper function to get the minimum of two integers
func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}