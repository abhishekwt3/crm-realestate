package config

import (
	"os"
	"strings"
	"time"
)

// Config stores the application configuration
type Config struct {
	Environment      string
	DatabasePath     string    // This is the correct field name
	JWTSecret        string
	CORSAllowOrigins string
	StartTime        time.Time
	EmailAPIKey      string
	EmailSender      string
	FrontendURL      string
}

// LoadConfig loads the configuration from environment variables
func LoadConfig() *Config {
	config := &Config{
		Environment:      getEnv("GO_ENV", "development"),
		DatabasePath:     getEnv("DATABASE_PATH", "./data/crmdash.db"),
		JWTSecret:        getEnv("JWT_SECRET", "your-secret-key-should-be-in-env-file"),
		CORSAllowOrigins: getEnv("CORS_ALLOW_ORIGINS", "*"),
		StartTime:        time.Now(),
		EmailAPIKey:      getEnv("EMAIL_API_KEY", ""),
		EmailSender:      getEnv("EMAIL_SENDER", "noreply@example.com"),
		FrontendURL:      getEnv("FRONTEND_URL", "http://localhost:3000"),
	}
	return config
}

// getEnv retrieves an environment variable or returns a default value
func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}

// GetAllowedOrigins returns a slice of allowed origins for CORS
func (c *Config) GetAllowedOrigins() []string {
	return strings.Split(c.CORSAllowOrigins, ",")
}