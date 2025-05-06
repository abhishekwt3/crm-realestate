package middleware

import (
	"fmt"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
)

// Authentication middleware verifies the JWT token in the Authorization header
func Authentication(jwtSecret string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		// Get the Authorization header
		authHeader := c.Get("Authorization")
		
		// Check if the Authorization header exists and has the correct format
		if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Authentication required",
			})
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
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Invalid token",
			})
		}
		
		// Check if the token is valid
		if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
			// Set user ID and other claims in the context
			userId, ok := claims["id"].(float64)
			if !ok {
				return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
					"error": "Invalid token claims",
				})
			}
			
			// Store user information in the context for later use
			c.Locals("userId", uint(userId))
			c.Locals("userEmail", claims["email"])
			c.Locals("userRole", claims["role"])
			
			if orgId, ok := claims["organisation_id"].(float64); ok {
				c.Locals("organisationId", uint(orgId))
			}
			
			return c.Next()
		}
		
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Invalid token",
		})
	}
}