package main

import (
	"log"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/googollee/go-socket.io/engineio"
	"github.com/googollee/go-socket.io/engineio/transport"
	"github.com/googollee/go-socket.io/engineio/transport/polling"
	"github.com/googollee/go-socket.io/engineio/transport/websocket"
)

func main() {
	port := "8080"
	if len(os.Args) > 1 {
		port = os.Args[1]
	}

	// Create Socket.IO server
	allowOriginFunc := func(r *http.Request) bool {
		return true
	}

	server := socketio.NewServer(&engineio.Options{
		Transports: []transport.Transport{
			&polling.Transport{
				CheckOrigin: allowOriginFunc,
			},
			&websocket.Transport{
				CheckOrigin: allowOriginFunc,
			},
		},
	})

	server.OnConnect("/", func(s socketio.Conn) error {
		s.SetContext("")
		log.Printf("Socket.IO connection established: %s", s.ID())
		return nil
	})

	server.OnEvent("/", "chat:message", func(s socketio.Conn, msg string) {
		log.Printf("Received chat message from %s: %s", s.ID(), msg)
		// Echo the message back to all clients
		server.BroadcastToRoom("/", "", "chat:message", map[string]interface{}{
			"user":      "Server",
			"message":   "Echo: " + msg,
			"timestamp": "now",
		})
	})

	server.OnEvent("/", "game:move", func(s socketio.Conn, move map[string]interface{}) {
		log.Printf("Received game move from %s: %+v", s.ID(), move)
		// Echo the move back
		server.BroadcastToRoom("/", "", "game:move", move)
	})

	server.OnDisconnect("/", func(s socketio.Conn, reason string) {
		log.Printf("Socket.IO connection disconnected: %s, reason: %s", s.ID(), reason)
	})

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
		c.JSON(200, gin.H{"status": "ok", "service": "arcane-chess-socketio-test-server"})
	})

	// Socket.IO endpoint
	router.GET("/socket.io/*any", gin.WrapH(server))
	router.POST("/socket.io/*any", gin.WrapH(server))

	log.Printf("Socket.IO test server starting on port %s", port)
	log.Printf("Socket.IO endpoint: http://localhost:%s/socket.io/", port)
	log.Printf("Health check: http://localhost:%s/health", port)

	go server.Serve()
	defer server.Close()

	if err := router.Run(":" + port); err != nil {
		log.Fatal("Server failed to start:", err)
	}
}
