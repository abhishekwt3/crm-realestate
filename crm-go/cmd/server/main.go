package main

import (
	"fmt"
	"log"
	"os"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/joho/godotenv"
	"crmgo/internal/config"
	"crmgo/internal/database"
)

func main() {
	// Load environment variables from .env file
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	// Initialize configuration
	cfg := config.LoadConfig()

	// Initialize database connection with DatabasePath
	// Use the blank identifier _ to explicitly ignore the db variable
	// This is just for testing - in a real app, you would use this variable
	_, err := database.InitDB(cfg.DatabasePath)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	log.Println("Database connection established to SQLite at", cfg.DatabasePath)

	// Create Fiber app
	app := fiber.New(fiber.Config{
		AppName: "CRM Dashboard API",
	})

	// Register middleware
	app.Use(logger.New())
	app.Use(recover.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins:     cfg.CORSAllowOrigins,
		AllowMethods:     "GET,POST,PUT,DELETE,OPTIONS",
		AllowHeaders:     "Origin, Content-Type, Accept, Authorization",
		AllowCredentials: true,
	}))

	// Simple GraphQL placeholder endpoint for now
	app.Post("/graphql", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"data": fiber.Map{
				"health": fiber.Map{
					"status":    "ok",
					"timestamp": fmt.Sprintf("%v", cfg.StartTime),
					"env":       cfg.Environment,
				},
			},
		})
	})

	// Simple GraphQL playground
	app.Get("/playground", func(c *fiber.Ctx) error {
		return c.SendFile("./playground.html")
	})

	// Add a simple health check endpoint
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status":    "ok",
			"timestamp": fmt.Sprintf("%v", cfg.StartTime),
			"env":       os.Getenv("GO_ENV"),
		})
	})

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "3001" // Default port
	}
	
	log.Printf("Server started on port %s", port)
	log.Fatal(app.Listen(":" + port))
}