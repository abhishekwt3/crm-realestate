package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/99designs/gqlgen/graphql"
	"github.com/99designs/gqlgen/graphql/handler"
	"github.com/99designs/gqlgen/graphql/playground"
	"github.com/golang-jwt/jwt/v5"
	"github.com/joho/godotenv"
	//"gorm.io/gorm"
	
	"crmgo/internal/config"
	"crmgo/internal/database"
	"crmgo/internal/graphql/generated"
	"crmgo/internal/graphql/resolvers"
)

func main() {
	// Load environment variables from .env file
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	// Initialize configuration
	cfg := config.LoadConfig()

	// Initialize database connection
	db, err := database.InitDB(cfg.DatabasePath)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	log.Println("Database connection established to SQLite at", cfg.DatabasePath)

	// Create a resolver instance using the proper resolver type
	resolver := resolvers.NewResolver(db, cfg.JWTSecret)

	// Create GraphQL server
	srv := handler.NewDefaultServer(generated.NewExecutableSchema(generated.Config{
		Resolvers: resolver,
		Directives: generated.DirectiveRoot{
			Auth: authDirective,
		},
	}))

	// Create GraphQL playground handler
	playgroundHandler := playground.Handler("GraphQL Playground", "/graphql")

	// Set up routes with standard library
	mux := http.NewServeMux()

	// Add GraphQL endpoint with middleware chain
	graphqlHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Special handling for introspection queries and health checks
		if r.Method == "POST" {
			bodyBytes, _ := io.ReadAll(r.Body)
			r.Body.Close()
			
			// Restore the body for later use
			r.Body = io.NopCloser(strings.NewReader(string(bodyBytes)))
			
			var requestBody struct {
				Query string `json:"query"`
			}
			
			if err := json.Unmarshal(bodyBytes, &requestBody); err == nil {
				// Skip auth for introspection and health queries
				if strings.Contains(requestBody.Query, "__schema") || 
				   strings.Contains(requestBody.Query, "query Health") || 
				   strings.Contains(requestBody.Query, "health") {
					// Skip authentication for these queries
					srv.ServeHTTP(w, r)
					return
				}
			}
			
			// For all other queries, apply auth middleware
			authMiddleware(http.HandlerFunc(srv.ServeHTTP), cfg.JWTSecret).ServeHTTP(w, r)
			return
		}
		
		// Handle other methods
		srv.ServeHTTP(w, r)
	})
	
	// Apply middleware chain - Fix the type assertion errors by applying middleware directly
	var graphqlWithMiddleware http.Handler = graphqlHandler
	graphqlWithMiddleware = loggingMiddleware(graphqlWithMiddleware)
	graphqlWithMiddleware = corsMiddleware(graphqlWithMiddleware)
	mux.Handle("/graphql", graphqlWithMiddleware)
	
	// Add GraphQL playground with middleware
	var playgroundWithMiddleware http.Handler = playgroundHandler
	playgroundWithMiddleware = loggingMiddleware(playgroundWithMiddleware)
	playgroundWithMiddleware = corsMiddleware(playgroundWithMiddleware)
	mux.Handle("/playground", playgroundWithMiddleware)
	
	// Add health check with middleware
	healthHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"status":"ok","timestamp":"` + time.Now().Format(time.RFC3339) + `","env":"` + cfg.Environment + `"}`))
	})
	var healthWithMiddleware http.Handler = healthHandler
	healthWithMiddleware = loggingMiddleware(healthWithMiddleware)
	healthWithMiddleware = corsMiddleware(healthWithMiddleware)
	mux.Handle("/health", healthWithMiddleware)

	// Configure server
	port := os.Getenv("PORT")
	if port == "" {
		port = "3001" // Default port
	}
	
	server := &http.Server{
		Addr:    ":" + port,
		Handler: mux,
	}

	// Channel to listen for errors coming from the listener
	serverErrors := make(chan error, 1)
	
	// Start server
	go func() {
		log.Printf("Server started on port %s", port)
		log.Printf("GraphQL endpoint: http://localhost:%s/graphql", port)
		log.Printf("GraphQL playground: http://localhost:%s/playground", port)
		serverErrors <- server.ListenAndServe()
	}()

	// Graceful shutdown
	shutdown := make(chan os.Signal, 1)
	signal.Notify(shutdown, os.Interrupt, syscall.SIGTERM)

	select {
	case err := <-serverErrors:
		log.Fatalf("Error starting server: %v", err)

	case <-shutdown:
		log.Println("Shutting down server...")
		
		// Create context with timeout for shutdown
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		// Shutdown the server
		err := server.Shutdown(ctx)
		if err != nil {
			log.Fatalf("Server shutdown failed: %v", err)
		}
		
		log.Println("Server gracefully stopped")
	}
}

// authDirective implements the @auth directive for GraphQL
func authDirective(ctx context.Context, obj interface{}, next graphql.Resolver) (interface{}, error) {
	// Get user ID from context and use it in the condition
	userID, ok := ctx.Value("userId").(uint)
	if !ok || userID == 0 {
		return nil, fmt.Errorf("access denied: not authenticated")
	}
	
	return next(ctx)
}

// authMiddleware adds authentication to an http.Handler
func authMiddleware(next http.Handler, jwtSecret string) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Get the Authorization header
		authHeader := r.Header.Get("Authorization")
		
		// Check if auth required and token provided
		if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
			http.Error(w, `{"error":"Authentication required"}`, http.StatusUnauthorized)
			return
		}
		
		// Extract and validate token
		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method")
			}
			return []byte(jwtSecret), nil
		})
		
		if err != nil || !token.Valid {
			http.Error(w, `{"error":"Invalid token"}`, http.StatusUnauthorized)
			return
		}
		
		// Extract claims
		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			http.Error(w, `{"error":"Invalid token claims"}`, http.StatusUnauthorized)
			return
		}
		
		// Add user info to context
		ctx := context.WithValue(r.Context(), "userId", uint(claims["id"].(float64)))
		ctx = context.WithValue(ctx, "userEmail", claims["email"])
		ctx = context.WithValue(ctx, "userRole", claims["role"])
		
		if orgId, ok := claims["organisation_id"].(float64); ok {
			ctx = context.WithValue(ctx, "organisationId", uint(orgId))
		}
		
		// Call the next handler with updated context
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// CORS middleware to allow requests from all origins
func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Set CORS headers
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Origin, Content-Type, Accept, Authorization")
		
		// Handle preflight requests
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
		
		// Continue to next handler
		next.ServeHTTP(w, r)
	})
}

// Logging middleware to show request status
func loggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Create a custom response writer to capture status
		crw := &customResponseWriter{ResponseWriter: w, statusCode: http.StatusOK}
		
		start := time.Now()
		
		// Log request details
		log.Printf("→ %s %s %s", r.Method, r.URL.Path, r.RemoteAddr)
		
		// Call the next handler
		next.ServeHTTP(crw, r)
		
		// Log response details
		duration := time.Since(start)
		log.Printf("← [%d] %s %s %s (%.3fs)", 
			crw.statusCode, 
			r.Method, 
			r.URL.Path, 
			http.StatusText(crw.statusCode),
			duration.Seconds())
	})
}

// Custom response writer to capture status code
type customResponseWriter struct {
	http.ResponseWriter
	statusCode int
}

// Capture status code on WriteHeader
func (crw *customResponseWriter) WriteHeader(code int) {
	crw.statusCode = code
	crw.ResponseWriter.WriteHeader(code)
}

// Write function implementation to satisfy http.ResponseWriter interface
func (crw *customResponseWriter) Write(b []byte) (int, error) {
	if crw.statusCode == 0 {
		crw.statusCode = http.StatusOK
	}
	return crw.ResponseWriter.Write(b)
}