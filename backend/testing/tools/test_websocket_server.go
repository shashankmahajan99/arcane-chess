package main

import (
	"fmt"
	"log"
	"net/http"
	"os"

	"arcane-chess/internal/handlers"
	"arcane-chess/internal/services"

	"github.com/gin-gonic/gin"
)

// Minimal server for testing WebSocket functionality without database
func main() {
	port := "8080"
	if len(os.Args) >= 2 {
		port = os.Args[1]
	}

	fmt.Printf("🎮 Starting Minimal WebSocket Test Server\n")
	fmt.Printf("=========================================\n")
	fmt.Printf("Port: %s\n", port)
	fmt.Printf("WebSocket URL: ws://localhost:%s/ws\n", port)
	fmt.Printf("Health URL: http://localhost:%s/health\n", port)
	fmt.Printf("Press Ctrl+C to stop\n\n")

	// Create minimal services (no database required)
	// For testing, we'll create services that can handle nil databases gracefully
	gameService := &services.GameService{}     // Empty service for WebSocket testing
	userService := &services.UserService{}     // Empty service for WebSocket testing
	avatarService := &services.AvatarService{} // Empty service for WebSocket testing

	// Create handler with test JWT secret
	handler := handlers.NewHandler(gameService, userService, avatarService, "test-jwt-secret")

	// Set Gin to release mode to reduce logs
	gin.SetMode(gin.ReleaseMode)

	// Create router
	router := gin.New()

	// Add basic middleware
	router.Use(gin.Recovery())

	// Setup routes (WebSocket and health check)
	handler.SetupRoutes(router)

	// Start server
	fmt.Printf("✅ Server starting on port %s...\n", port)
	log.Fatal(http.ListenAndServe(":"+port, router))
}
