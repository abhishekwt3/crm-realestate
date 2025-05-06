package database

import (
	"log"
	"os"
	"path/filepath"
	"time"

	"crmgo/internal/models"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// InitDB initializes the database connection
func InitDB(dbPath string) (*gorm.DB, error) {
	// Create directory for database file if it doesn't exist
	dbDir := filepath.Dir(dbPath)
	if _, err := os.Stat(dbDir); os.IsNotExist(err) {
		if err := os.MkdirAll(dbDir, 0755); err != nil {
			return nil, err
		}
	}

	// Configure GORM logger
	gormLogger := logger.New(
		log.New(log.Writer(), "\r\n", log.LstdFlags),
		logger.Config{
			SlowThreshold:             time.Second, // Log queries that take longer than 1 second
			LogLevel:                  logger.Warn, // Only log warnings and errors
			IgnoreRecordNotFoundError: true,        // Don't log record not found errors
			Colorful:                  true,        // Use color in console output
		},
	)

	// Connect to the SQLite database
	db, err := gorm.Open(sqlite.Open(dbPath), &gorm.Config{
		Logger: gormLogger,
	})
	if err != nil {
		return nil, err
	}

	// Get underlying *sql.DB
	sqlDB, err := db.DB()
	if err != nil {
		return nil, err
	}

	// Configure connection pool
	// SQLite has different connection requirements than PostgreSQL
	sqlDB.SetMaxIdleConns(1)
	sqlDB.SetMaxOpenConns(1)
	sqlDB.SetConnMaxLifetime(time.Hour)

	// Auto-migrate the database
	err = migrateDatabase(db)
	if err != nil {
		return nil, err
	}

	return db, nil
}

// migrateDatabase runs auto-migrations for all models
func migrateDatabase(db *gorm.DB) error {
	log.Println("Running database migrations...")
	
	// Auto-migrate all models
	err := db.AutoMigrate(
		&models.User{},
		&models.Organisation{},
		&models.TeamMember{},
		&models.Contact{},
		&models.Property{},
		&models.Deal{},
		&models.Discussion{},
		&models.Meeting{},
		&models.MeetingNotes{},
		&models.Task{},
		&models.Document{},
		&models.Invitation{},
	)
	
	if err != nil {
		log.Printf("Database migration error: %v", err)
		return err
	}
	
	log.Println("Database migrations completed successfully")
	return nil
}