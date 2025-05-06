package routes

import (
    "net/http"
    
    "github.com/99designs/gqlgen/graphql/handler"
    "github.com/99designs/gqlgen/graphql/playground"
    "crmgo/internal/graphql/generated"
    "crmgo/internal/graphql/resolvers"
    "crmgo/internal/middleware"
    "gorm.io/gorm"
)

// SetupRoutes configures the API routes
func SetupRoutes(mux *http.ServeMux, db *gorm.DB, jwtSecret string, environment string) {
    // Create GraphQL resolver
    resolver := resolvers.NewResolver(db, jwtSecret)
    
    // Create GraphQL server - use handler.New instead of deprecated NewDefaultServer
    graphqlHandler := handler.New(
        generated.NewExecutableSchema(generated.Config{Resolvers: resolver}),
    )
    
    // Optional: Configure the handler with additional options
    // graphqlHandler.AddTransport(transport.Options{})
    // graphqlHandler.Use(extension.Introspection{})
    
    // Add GraphQL endpoint with authentication
    mux.Handle("/graphql", middleware.JWTMiddleware(graphqlHandler, jwtSecret))
    
    // GraphQL playground (only in development)
    if environment == "development" {
        playgroundHandler := playground.Handler("GraphQL Playground", "/graphql")
        mux.Handle("/playground", playgroundHandler)
    }
    
    // Health check endpoint
    mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("Content-Type", "application/json")
        w.Write([]byte(`{"status":"ok"}`))
    })
}