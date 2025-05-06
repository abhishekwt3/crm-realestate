package routes

import (
	"github.com/99designs/gqlgen/graphql/handler"
	"github.com/99designs/gqlgen/graphql/playground"
	"github.com/gofiber/fiber/v2"
	"crmgo/internal/graphql/generated"
	"crmgo/internal/graphql/resolvers"
	"crmgo/internal/middleware"
	"gorm.io/gorm"
)

// SetupRoutes configures the API routes
func SetupRoutes(app *fiber.App, db *gorm.DB) {
	// Create GraphQL resolver
	resolver := resolvers.NewResolver(db, "your-jwt-secret")
	
	// Create GraphQL server
	graphqlHandler := handler.NewDefaultServer(generated.NewExecutableSchema(generated.Config{Resolvers: resolver}))
	
	// GraphQL endpoint
	app.Post("/graphql", func(c *fiber.Ctx) error {
		// Handle the GraphQL request
		graphqlHandler.ServeHTTP(c.Response().Writer(), c.Request())
		return nil
	})
	
	// Add authentication middleware to GraphQL endpoint for protected operations
	app.Use("/graphql", middleware.Authentication("your-jwt-secret"))
	
	// GraphQL playground (only in development)
	if app.Config().AppName == "development" {
		playgroundHandler := playground.Handler("GraphQL Playground", "/graphql")
		app.Get("/playground", func(c *fiber.Ctx) error {
			playgroundHandler.ServeHTTP(c.Response().Writer(), c.Request())
			return nil
		})
	}

	// Health check endpoint
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status": "ok",
		})
	})
}

// Note: Unlike traditional REST APIs which have many different route handlers,
// GraphQL typically uses just a single endpoint (/graphql) that handles all operations.
// The GraphQL schema (defined in schema.graphql) determines what operations are available.