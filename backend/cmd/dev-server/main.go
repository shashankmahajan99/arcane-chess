package main

import (
	"log"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
)

// Mock handlers for development
func main() {
	// Set development mode
	gin.SetMode(gin.DebugMode)

	router := gin.New()
	router.Use(gin.Logger())
	router.Use(gin.Recovery())

	// CORS middleware
	router.Use(func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	// Mock API routes for development
	api := router.Group("/api/v1")
	{
		// Auth routes
		auth := api.Group("/auth")
		{
			auth.POST("/login", mockLogin)
			auth.POST("/register", mockRegister)
			auth.POST("/refresh", mockRefresh)
		}

		// Game routes
		games := api.Group("/games")
		{
			games.GET("/", mockGetGames)
			games.POST("/", mockCreateGame)
			games.GET("/:id", mockGetGame)
			games.POST("/:id/join", mockJoinGame)
			games.POST("/:id/move", mockMakeMove)
		}

		// Arena routes
		arenas := api.Group("/arenas")
		{
			arenas.GET("/", mockGetArenas)
			arenas.GET("/:id", mockGetArena)
			arenas.GET("/:id/games", mockGetArenaGames)
		}
	}

	// WebSocket endpoint (placeholder)
	router.GET("/ws", func(c *gin.Context) {
		c.JSON(200, gin.H{"message": "WebSocket endpoint - use a proper WebSocket client"})
	})

	// Health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok", "service": "arcane-chess-dev", "mode": "development"})
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("🚀 Development server starting on port %s", port)
	log.Printf("📱 Frontend should connect to: http://localhost:%s", port)
	log.Printf("🔧 This is a development server with mock data")
	
	if err := router.Run(":" + port); err != nil {
		log.Fatal("Failed to start development server:", err)
	}
}

// Mock authentication handlers
func mockLogin(c *gin.Context) {
	var request struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(400, gin.H{"error": "Invalid request format"})
		return
	}

	// Mock successful login
	c.JSON(200, gin.H{
		"user": gin.H{
			"id":       "user-123",
			"username": "testuser",
			"email":    request.Email,
			"rating":   1200,
			"is_online": true,
		},
		"token":         "mock-jwt-token-" + request.Email,
		"refresh_token": "mock-refresh-token-" + request.Email,
	})
}

func mockRegister(c *gin.Context) {
	var request struct {
		Username string `json:"username"`
		Email    string `json:"email"`
		Password string `json:"password"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(400, gin.H{"error": "Invalid request format"})
		return
	}

	// Mock successful registration
	c.JSON(201, gin.H{
		"user": gin.H{
			"id":       "user-new-123",
			"username": request.Username,
			"email":    request.Email,
			"rating":   1200,
			"is_online": true,
		},
		"token":         "mock-jwt-token-" + request.Email,
		"refresh_token": "mock-refresh-token-" + request.Email,
	})
}

func mockRefresh(c *gin.Context) {
	c.JSON(200, gin.H{
		"token":         "refreshed-mock-jwt-token",
		"refresh_token": "refreshed-mock-refresh-token",
		"user": gin.H{
			"id":       "user-123",
			"username": "testuser",
			"email":    "test@example.com",
			"rating":   1250,
			"is_online": true,
		},
	})
}

// Mock game handlers
func mockGetGames(c *gin.Context) {
	c.JSON(200, gin.H{
		"games": []gin.H{
			{
				"id":           "game-1",
				"arena_id":     "classic-arena",
				"status":       "active",
				"current_turn": "white",
				"board_state":  "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
				"move_count":   0,
				"time_control": 600,
				"white_time":   600,
				"black_time":   600,
			},
		},
	})
}

func mockCreateGame(c *gin.Context) {
	c.JSON(201, gin.H{
		"game": gin.H{
			"id":           "game-new-123",
			"arena_id":     "classic-arena",
			"status":       "waiting",
			"current_turn": "white",
			"board_state":  "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
			"move_count":   0,
			"time_control": 600,
			"white_time":   600,
			"black_time":   600,
		},
	})
}

func mockGetGame(c *gin.Context) {
	gameId := c.Param("id")
	c.JSON(200, gin.H{
		"game": gin.H{
			"id":           gameId,
			"arena_id":     "classic-arena",
			"status":       "active",
			"current_turn": "white",
			"board_state":  "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
			"move_count":   5,
			"time_control": 600,
			"white_time":   580,
			"black_time":   590,
		},
	})
}

func mockJoinGame(c *gin.Context) {
	gameId := c.Param("id")
	c.JSON(200, gin.H{"message": "Successfully joined game " + gameId})
}

func mockMakeMove(c *gin.Context) {
	gameId := c.Param("id")
	c.JSON(200, gin.H{"message": "Move made in game " + gameId})
}

// Mock arena handlers
func mockGetArenas(c *gin.Context) {
	c.JSON(200, gin.H{
		"arenas": []gin.H{
			{
				"id":          "classic-arena",
				"name":        "Classic Arena",
				"theme":       "classic",
				"max_players": 50,
				"max_games":   10,
				"is_public":   true,
				"description": "Traditional chess with classic pieces",
			},
			{
				"id":          "mystic-arena",
				"name":        "Mystic Realm",
				"theme":       "mystic",
				"max_players": 30,
				"max_games":   8,
				"is_public":   true,
				"description": "Magical chess arena with arcane effects",
			},
		},
	})
}

func mockGetArena(c *gin.Context) {
	arenaId := c.Param("id")
	c.JSON(200, gin.H{
		"arena": gin.H{
			"id":          arenaId,
			"name":        "Mock Arena",
			"theme":       "classic",
			"max_players": 50,
			"max_games":   10,
			"is_public":   true,
			"description": "A mock arena for development",
		},
	})
}

func mockGetArenaGames(c *gin.Context) {
	c.JSON(200, gin.H{
		"games": []gin.H{
			{
				"id":           "game-arena-1",
				"status":       "waiting",
				"current_turn": "white",
				"move_count":   0,
				"time_control": 600,
			},
		},
	})
}