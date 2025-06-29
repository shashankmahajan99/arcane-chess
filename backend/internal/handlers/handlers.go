package handlers

import (
	"net/http"

	"arcane-chess/internal/auth"
	"arcane-chess/internal/services"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

type Handler struct {
	gameService      *services.GameService
	userService      *services.UserService
	avatarService    *services.AvatarService
	websocketManager *services.WebSocketManager
	upgrader         websocket.Upgrader
}

func NewHandler(gameService *services.GameService, userService *services.UserService, avatarService *services.AvatarService) *Handler {
	return &Handler{
		gameService:      gameService,
		userService:      userService,
		avatarService:    avatarService,
		websocketManager: services.NewWebSocketManager(),
		upgrader: websocket.Upgrader{
			CheckOrigin: func(r *http.Request) bool {
				return true // Configure properly for production
			},
		},
	}
}

func (h *Handler) SetupRoutes(router *gin.Engine) {
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

	// API routes
	api := router.Group("/api/v1")
	{
		// Auth routes
		auth := api.Group("/auth")
		{
			auth.POST("/login", h.Login)
			auth.POST("/register", h.Register)
			auth.POST("/refresh", h.RefreshToken)
		}

		// Game routes
		games := api.Group("/games")
		{
			games.GET("/", h.GetGames)
			games.POST("/", h.AuthMiddleware(), h.CreateGame)
			games.GET("/:id", h.GetGame)
			games.POST("/:id/join", h.AuthMiddleware(), h.JoinGame)
			games.POST("/:id/move", h.AuthMiddleware(), h.MakeMove)
		}

		// Arena routes
		arenas := api.Group("/arenas")
		{
			arenas.GET("/", h.GetArenas)
			arenas.GET("/:id", h.GetArena)
			arenas.GET("/:id/games", h.GetArenaGames)
		}

		// Avatar routes
		avatars := api.Group("/avatars")
		{
			avatars.GET("/me", h.GetMyAvatar)
			avatars.PUT("/me", h.UpdateAvatar)
			avatars.POST("/me/position", h.UpdateAvatarPosition)
		}
	}

	// WebSocket endpoint
	router.GET("/ws", h.HandleWebSocket)

	// Health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok", "service": "arcane-chess"})
	})
}

// Auth middleware
func (h *Handler) AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header required"})
			c.Abort()
			return
		}

		// Remove "Bearer " prefix
		if len(authHeader) < 7 || authHeader[:7] != "Bearer " {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid authorization header format"})
			c.Abort()
			return
		}
		
		tokenString := authHeader[7:]
		claims, err := auth.ValidateToken(tokenString)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token"})
			c.Abort()
			return
		}

		// Set user info in context
		c.Set("user_id", claims.UserID)
		c.Set("username", claims.Username)
		c.Set("email", claims.Email)
		
		c.Next()
	}
}

// Auth handlers
func (h *Handler) Login(c *gin.Context) {
	var loginRequest struct {
		Email    string `json:"email" binding:"required,email"`
		Password string `json:"password" binding:"required,min=6"`
	}

	if err := c.ShouldBindJSON(&loginRequest); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, err := h.userService.AuthenticateUser(loginRequest.Email, loginRequest.Password)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	token, err := auth.GenerateToken(user.ID.String(), user.Username, user.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"token": token,
		"user": gin.H{
			"id":       user.ID,
			"username": user.Username,
			"email":    user.Email,
			"rating":   user.Rating,
			"is_online": user.IsOnline,
		},
	})
}

func (h *Handler) Register(c *gin.Context) {
	var registerRequest struct {
		Username string `json:"username" binding:"required,min=3,max=20"`
		Email    string `json:"email" binding:"required,email"`
		Password string `json:"password" binding:"required,min=6"`
	}

	if err := c.ShouldBindJSON(&registerRequest); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, err := h.userService.CreateUserWithHashedPassword(registerRequest.Username, registerRequest.Email, registerRequest.Password)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	token, err := auth.GenerateToken(user.ID.String(), user.Username, user.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "User registered successfully",
		"token":   token,
		"user": gin.H{
			"id":       user.ID,
			"username": user.Username,
			"email":    user.Email,
			"rating":   user.Rating,
			"is_online": user.IsOnline,
		},
	})
}

func (h *Handler) RefreshToken(c *gin.Context) {
	authHeader := c.GetHeader("Authorization")
	if authHeader == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header required"})
		return
	}

	// Remove "Bearer " prefix
	if len(authHeader) < 7 || authHeader[:7] != "Bearer " {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid authorization header format"})
		return
	}
	
	tokenString := authHeader[7:]
	newToken, err := auth.RefreshToken(tokenString)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"token": newToken,
	})
}

// Game handlers
func (h *Handler) GetGames(c *gin.Context) {
	arenaIDStr := c.Query("arena_id")
	if arenaIDStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "arena_id is required"})
		return
	}

	arenaID, err := uuid.Parse(arenaIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid arena_id format"})
		return
	}

	games, err := h.gameService.GetActiveGames(arenaID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch games"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"games": games,
		"total": len(games),
	})
}

func (h *Handler) CreateGame(c *gin.Context) {
	// Get user from context (set by auth middleware)
	userIDInterface, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	
	userIDStr, ok := userIDInterface.(string)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID"})
		return
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID format"})
		return
	}

	var createGameRequest struct {
		ArenaID string `json:"arena_id" binding:"required"`
	}

	if err := c.ShouldBindJSON(&createGameRequest); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	arenaID, err := uuid.Parse(createGameRequest.ArenaID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid arena_id format"})
		return
	}

	game, err := h.gameService.CreateGame(arenaID, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create game"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"id":       game.ID,
		"status":   game.Status,
		"arena_id": game.ArenaID,
		"white_player_id": game.WhitePlayerID,
		"black_player_id": game.BlackPlayerID,
		"current_turn": game.CurrentTurn,
		"board_state": game.BoardState,
	})
}

func (h *Handler) GetGame(c *gin.Context) {
	gameID := c.Param("id")
	c.JSON(200, gin.H{
		"id":     gameID,
		"status": "active",
	})
}

func (h *Handler) JoinGame(c *gin.Context) {
	gameID := c.Param("id")
	c.JSON(200, gin.H{
		"id":      gameID,
		"status":  "active",
		"message": "Joined game successfully",
	})
}

func (h *Handler) MakeMove(c *gin.Context) {
	gameID := c.Param("id")
	c.JSON(200, gin.H{
		"game_id": gameID,
		"move":    "e2e4",
		"status":  "success",
	})
}

// Arena handlers
func (h *Handler) GetArenas(c *gin.Context) {
	c.JSON(200, gin.H{
		"arenas": []gin.H{
			{
				"id":          "arena-1",
				"name":        "Mystic Sanctum",
				"theme":       "mystic",
				"players":     42,
				"max_players": 100,
			},
		},
	})
}

func (h *Handler) GetArena(c *gin.Context) {
	arenaID := c.Param("id")
	c.JSON(200, gin.H{
		"id":          arenaID,
		"name":        "Mystic Sanctum",
		"theme":       "mystic",
		"players":     42,
		"max_players": 100,
	})
}

func (h *Handler) GetArenaGames(c *gin.Context) {
	arenaID := c.Param("id")
	c.JSON(200, gin.H{
		"arena_id": arenaID,
		"games":    []gin.H{},
	})
}

// Avatar handlers
func (h *Handler) GetMyAvatar(c *gin.Context) {
	c.JSON(200, gin.H{
		"id":           "avatar-123",
		"user_id":      "user-123",
		"model_type":   "wizard",
		"color_scheme": "blue",
		"position_x":   0,
		"position_y":   0,
		"position_z":   0,
	})
}

func (h *Handler) UpdateAvatar(c *gin.Context) {
	c.JSON(200, gin.H{
		"message": "Avatar updated successfully",
	})
}

func (h *Handler) UpdateAvatarPosition(c *gin.Context) {
	c.JSON(200, gin.H{
		"message": "Position updated successfully",
	})
}

// WebSocket handler
func (h *Handler) HandleWebSocket(c *gin.Context) {
	// Get user info from query parameters (could also come from JWT token)
	userID := c.Query("user_id")
	username := c.Query("username")
	
	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user_id is required"})
		return
	}
	
	if username == "" {
		username = "Anonymous"
	}

	conn, err := h.upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to upgrade connection"})
		return
	}

	// Handle the connection using the WebSocket manager
	h.websocketManager.HandleConnection(conn, userID, username)
}
