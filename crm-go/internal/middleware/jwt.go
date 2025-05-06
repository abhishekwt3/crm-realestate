package middleware

import (
	"context"
	"fmt"
	"net/http"
	"strings"

	"github.com/golang-jwt/jwt/v5"
)

type contextKey string
const (
	UserIDKey contextKey = "userId"
	UserEmailKey contextKey = "userEmail"
	UserRoleKey contextKey = "userRole"
	OrganisationIDKey contextKey = "organisationId"
)

// JWTMiddleware adds authentication to an http.Handler
func JWTMiddleware(next http.Handler, jwtSecret string) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Get the Authorization header
		authHeader := r.Header.Get("Authorization")
		
		// Check if the Authorization header exists and has the correct format
		if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
			http.Error(w, `{"error":"Authentication required"}`, http.StatusUnauthorized)
			return
		}
		
		// Extract the token from the Authorization header
		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		
		// Parse and verify the token
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			// Validate signing method
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
			}
			
			// Return the secret key
			return []byte(jwtSecret), nil
		})
		
		if err != nil {
			http.Error(w, `{"error":"Invalid token"}`, http.StatusUnauthorized)
			return
		}
		
		// Check if the token is valid
		if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
			// Set user ID and other claims in the context
			userId, ok := claims["id"].(float64)
			if !ok {
				http.Error(w, `{"error":"Invalid token claims"}`, http.StatusUnauthorized)
				return
			}
			
			// Create a new context with user information
			ctx := context.WithValue(r.Context(), UserIDKey, uint(userId))
			ctx = context.WithValue(ctx, UserEmailKey, claims["email"])
			ctx = context.WithValue(ctx, UserRoleKey, claims["role"])
			
			if orgId, ok := claims["organisation_id"].(float64); ok {
				ctx = context.WithValue(ctx, OrganisationIDKey, uint(orgId))
			}
			
			// Serve the request with the new context
			next.ServeHTTP(w, r.WithContext(ctx))
			return
		}
		
		http.Error(w, `{"error":"Invalid token"}`, http.StatusUnauthorized)
	})
}