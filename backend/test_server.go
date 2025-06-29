package main

import (
	"log"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all origins for testing
	},
}

type Message struct {
	Type string      `json:"type"`
	Data interface{} `json:"data"`
}

func handleWebSocket(c *gin.Context) {
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("WebSocket upgrade error: %v", err)
		return
	}
	defer conn.Close()

	log.Printf("WebSocket connection established from %s", conn.RemoteAddr())

	// Send initial connection confirmation
	welcomeMsg := Message{
		Type: "connection",
		Data: map[string]string{"status": "connected", "message": "Welcome to Arcane Chess"},
	}
	if err := conn.WriteJSON(welcomeMsg); err != nil {
		log.Printf("Error sending welcome message: %v", err)
		return
	}

	// Handle incoming messages
	for {
		var msg Message
		err := conn.ReadJSON(&msg)
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WebSocket error: %v", err)
			}
			break
		}

		log.Printf("Received message: %+v", msg)

		// Echo the message back for testing
		response := Message{
			Type: "echo",
			Data: map[string]interface{}{
				"original":  msg,
				"timestamp": "now",
			},
		}

		if err := conn.WriteJSON(response); err != nil {
			log.Printf("Error sending response: %v", err)
			break
		}
	}

	log.Printf("WebSocket connection closed for %s", conn.RemoteAddr())
}

func main() {
	port := "8080"
	if len(os.Args) > 1 {
		port = os.Args[1]
	}

	// Set Gin to release mode to reduce logging
	gin.SetMode(gin.ReleaseMode)

	router := gin.Default()

	// Enable CORS
	router.Use(func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Authorization")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	// Health check endpoint
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok", "service": "arcane-chess-test-server"})
	})

	// WebSocket endpoint
	router.GET("/ws", handleWebSocket)

	log.Printf("Test WebSocket server starting on port %s", port)
	log.Printf("WebSocket endpoint: ws://localhost:%s/ws", port)
	log.Printf("Health check: http://localhost:%s/health", port)

	if err := router.Run(":" + port); err != nil {
		log.Fatal("Server failed to start:", err)
	}
}
