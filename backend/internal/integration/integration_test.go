package integration

import (
	"arcane-chess/internal/database"
	"arcane-chess/internal/handlers"
	"arcane-chess/internal/services"
	"arcane-chess/internal/testutil"
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
	"github.com/stretchr/testify/suite"
	"gorm.io/gorm"
)

type IntegrationTestSuite struct {
	suite.Suite
	app            *gin.Engine
	server         *httptest.Server
	db             *gorm.DB
	redisClient    *redis.Client
	userService    *services.UserService
	gameService    *services.GameService
	avatarService  *services.AvatarService
	handler        *handlers.Handler
	testUser       map[string]interface{}
	testUserToken  string
	testUser2      map[string]interface{}
	testUser2Token string
}

func (suite *IntegrationTestSuite) SetupSuite() {
	// Skip integration tests if not running in CI or with integration flag
	if os.Getenv("RUN_INTEGRATION_TESTS") != "true" {
		suite.T().Skip("Skipping integration tests. Set RUN_INTEGRATION_TESTS=true to run.")
	}

	// Load test configuration
	cfg := testutil.TestConfig()

	// Setup test database
	dbInstance, err := database.Initialize(cfg.Database)
	suite.Require().NoError(err)
	suite.db = dbInstance

	// Setup test Redis
	redisInstance, err := database.InitializeRedis(cfg.Redis)
	suite.Require().NoError(err)
	suite.redisClient = redisInstance

	// Initialize services
	suite.userService = services.NewUserService(dbInstance)
	suite.gameService = services.NewGameService(dbInstance, redisInstance)
	suite.avatarService = services.NewAvatarService(dbInstance, redisInstance)

	// Initialize handlers
	suite.handler = handlers.NewHandler(
		suite.gameService,
		suite.userService,
		suite.avatarService,
		cfg.JWT.Secret,
	)

	// Setup Gin
	gin.SetMode(gin.TestMode)
	suite.app = gin.New()
	suite.handler.SetupRoutes(suite.app)

	// Start test server
	suite.server = httptest.NewServer(suite.app)

	// Create test users
	suite.createTestUsers()
}

func (suite *IntegrationTestSuite) TearDownSuite() {
	if suite.server != nil {
		suite.server.Close()
	}

	// Clean up test data
	if suite.db != nil {
		// Delete test data
		suite.db.Exec("DELETE FROM game_moves")
		suite.db.Exec("DELETE FROM games")
		suite.db.Exec("DELETE FROM avatars")
		suite.db.Exec("DELETE FROM users")

		sqlDB, _ := suite.db.DB()
		sqlDB.Close()
	}

	if suite.redisClient != nil {
		suite.redisClient.FlushAll(context.Background())
		suite.redisClient.Close()
	}
}

func (suite *IntegrationTestSuite) createTestUsers() {
	// Create first test user
	user1Data := map[string]interface{}{
		"username": "testuser1",
		"email":    "test1@example.com",
		"password": "password123",
	}

	resp := suite.makeRequest("POST", "/api/register", user1Data, "")
	suite.Require().Equal(http.StatusCreated, resp.Code)

	var registerResp map[string]interface{}
	err := json.Unmarshal(resp.Body.Bytes(), &registerResp)
	suite.Require().NoError(err)

	suite.testUser = registerResp
	suite.testUserToken = registerResp["token"].(string)

	// Create second test user
	user2Data := map[string]interface{}{
		"username": "testuser2",
		"email":    "test2@example.com",
		"password": "password123",
	}

	resp2 := suite.makeRequest("POST", "/api/register", user2Data, "")
	suite.Require().Equal(http.StatusCreated, resp2.Code)

	var registerResp2 map[string]interface{}
	err = json.Unmarshal(resp2.Body.Bytes(), &registerResp2)
	suite.Require().NoError(err)

	suite.testUser2 = registerResp2
	suite.testUser2Token = registerResp2["token"].(string)
}

func (suite *IntegrationTestSuite) makeRequest(method, url string, body interface{}, token string) *httptest.ResponseRecorder {
	var reqBody *bytes.Buffer
	if body != nil {
		jsonBody, _ := json.Marshal(body)
		reqBody = bytes.NewBuffer(jsonBody)
	} else {
		reqBody = bytes.NewBuffer([]byte{})
	}

	req, _ := http.NewRequest(method, url, reqBody)
	req.Header.Set("Content-Type", "application/json")

	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}

	w := httptest.NewRecorder()
	suite.app.ServeHTTP(w, req)
	return w
}

func (suite *IntegrationTestSuite) TestUserRegistrationAndLogin() {
	// Test user registration
	userData := map[string]interface{}{
		"username": "newuser",
		"email":    "newuser@example.com",
		"password": "password123",
	}

	resp := suite.makeRequest("POST", "/api/register", userData, "")
	suite.Assert().Equal(http.StatusCreated, resp.Code)

	var registerResp map[string]interface{}
	err := json.Unmarshal(resp.Body.Bytes(), &registerResp)
	suite.Require().NoError(err)
	suite.Assert().Contains(registerResp, "token")
	suite.Assert().Contains(registerResp, "user")

	// Test user login
	loginData := map[string]interface{}{
		"email":    "newuser@example.com",
		"password": "password123",
	}

	loginResp := suite.makeRequest("POST", "/api/login", loginData, "")
	suite.Assert().Equal(http.StatusOK, loginResp.Code)

	var loginRespData map[string]interface{}
	err = json.Unmarshal(loginResp.Body.Bytes(), &loginRespData)
	suite.Require().NoError(err)
	suite.Assert().Contains(loginRespData, "token")
	suite.Assert().Contains(loginRespData, "user")
}

func (suite *IntegrationTestSuite) TestCreateAndJoinGame() {
	// Create a game with user1
	gameData := map[string]interface{}{
		"arena_id": uuid.New().String(),
	}

	resp := suite.makeRequest("POST", "/api/games", gameData, suite.testUserToken)
	suite.Assert().Equal(http.StatusCreated, resp.Code)

	var gameResp map[string]interface{}
	err := json.Unmarshal(resp.Body.Bytes(), &gameResp)
	suite.Require().NoError(err)

	gameID := gameResp["id"].(string)
	suite.Assert().NotEmpty(gameID)
	suite.Assert().Equal("waiting", gameResp["status"])

	// User2 joins the game
	joinResp := suite.makeRequest("POST", fmt.Sprintf("/api/games/%s/join", gameID), nil, suite.testUser2Token)
	suite.Assert().Equal(http.StatusOK, joinResp.Code)

	var joinRespData map[string]interface{}
	err = json.Unmarshal(joinResp.Body.Bytes(), &joinRespData)
	suite.Require().NoError(err)
	suite.Assert().Equal("active", joinRespData["status"])
}

func (suite *IntegrationTestSuite) TestGameMove() {
	// Create and join a game first
	gameData := map[string]interface{}{
		"arena_id": uuid.New().String(),
	}

	gameResp := suite.makeRequest("POST", "/api/games", gameData, suite.testUserToken)
	suite.Require().Equal(http.StatusCreated, gameResp.Code)

	var game map[string]interface{}
	err := json.Unmarshal(gameResp.Body.Bytes(), &game)
	suite.Require().NoError(err)
	gameID := game["id"].(string)

	// User2 joins
	joinResp := suite.makeRequest("POST", fmt.Sprintf("/api/games/%s/join", gameID), nil, suite.testUser2Token)
	suite.Require().Equal(http.StatusOK, joinResp.Code)

	// Make a move as white player (user1)
	moveData := map[string]interface{}{
		"from": "e2",
		"to":   "e4",
	}

	moveResp := suite.makeRequest("POST", fmt.Sprintf("/api/games/%s/move", gameID), moveData, suite.testUserToken)
	suite.Assert().Equal(http.StatusOK, moveResp.Code)

	var moveRespData map[string]interface{}
	err = json.Unmarshal(moveResp.Body.Bytes(), &moveRespData)
	suite.Require().NoError(err)
	suite.Assert().Equal("e2", moveRespData["from_square"])
	suite.Assert().Equal("e4", moveRespData["to_square"])
}

func (suite *IntegrationTestSuite) TestAvatarOperations() {
	// Get user's avatar
	avatarResp := suite.makeRequest("GET", "/api/avatar", nil, suite.testUserToken)

	if avatarResp.Code == http.StatusNotFound {
		// Create avatar if it doesn't exist
		avatarData := map[string]interface{}{
			"name":         "Test Avatar",
			"model_type":   "wizard",
			"color_scheme": "blue",
		}

		createResp := suite.makeRequest("POST", "/api/avatar", avatarData, suite.testUserToken)
		suite.Assert().Equal(http.StatusCreated, createResp.Code)

		// Get avatar again
		avatarResp = suite.makeRequest("GET", "/api/avatar", nil, suite.testUserToken)
	}

	suite.Assert().Equal(http.StatusOK, avatarResp.Code)

	var avatar map[string]interface{}
	err := json.Unmarshal(avatarResp.Body.Bytes(), &avatar)
	suite.Require().NoError(err)
	suite.Assert().Contains(avatar, "id")
	suite.Assert().Contains(avatar, "name")

	// Update avatar position
	positionData := map[string]interface{}{
		"position_x": 10.5,
		"position_y": 20.0,
		"position_z": 15.2,
		"rotation_y": 90.0,
	}

	updateResp := suite.makeRequest("PUT", "/api/avatar/position", positionData, suite.testUserToken)
	suite.Assert().Equal(http.StatusOK, updateResp.Code)
}

func (suite *IntegrationTestSuite) TestAuthenticationRequired() {
	// Test endpoints that require authentication
	endpoints := []struct {
		method string
		path   string
	}{
		{"GET", "/api/profile"},
		{"GET", "/api/games"},
		{"POST", "/api/games"},
		{"GET", "/api/avatar"},
		{"PUT", "/api/avatar/position"},
	}

	for _, endpoint := range endpoints {
		resp := suite.makeRequest(endpoint.method, endpoint.path, nil, "")
		suite.Assert().Equal(http.StatusUnauthorized, resp.Code,
			"Expected 401 for %s %s without token", endpoint.method, endpoint.path)
	}
}

func (suite *IntegrationTestSuite) TestInvalidToken() {
	// Test with invalid token
	resp := suite.makeRequest("GET", "/api/profile", nil, "invalid-token")
	suite.Assert().Equal(http.StatusUnauthorized, resp.Code)
}

func (suite *IntegrationTestSuite) TestConcurrentGameOperations() {
	// Test concurrent game creation and joining
	gameData := map[string]interface{}{
		"arena_id": uuid.New().String(),
	}

	// Create multiple games concurrently
	results := make(chan *httptest.ResponseRecorder, 5)

	for i := 0; i < 5; i++ {
		go func() {
			resp := suite.makeRequest("POST", "/api/games", gameData, suite.testUserToken)
			results <- resp
		}()
	}

	// Collect results
	for i := 0; i < 5; i++ {
		resp := <-results
		suite.Assert().Equal(http.StatusCreated, resp.Code)
	}
}

func (suite *IntegrationTestSuite) TestDataConsistency() {
	// Create a game
	gameData := map[string]interface{}{
		"arena_id": uuid.New().String(),
	}

	gameResp := suite.makeRequest("POST", "/api/games", gameData, suite.testUserToken)
	suite.Require().Equal(http.StatusCreated, gameResp.Code)

	var game map[string]interface{}
	err := json.Unmarshal(gameResp.Body.Bytes(), &game)
	suite.Require().NoError(err)
	gameID := game["id"].(string)

	// Verify game exists in database
	var gameCount int64
	suite.db.Table("games").Where("id = ?", gameID).Count(&gameCount)
	suite.Assert().Equal(int64(1), gameCount)

	// Verify game is cached in Redis
	cachedGame, err := suite.redisClient.Get(
		context.Background(),
		fmt.Sprintf("game:%s", gameID),
	).Result()
	suite.Assert().NoError(err)
	suite.Assert().NotEmpty(cachedGame)
}

func (suite *IntegrationTestSuite) TestErrorHandling() {
	// Test with invalid game ID
	invalidGameID := "invalid-uuid"
	resp := suite.makeRequest("POST", fmt.Sprintf("/api/games/%s/join", invalidGameID), nil, suite.testUserToken)
	suite.Assert().Equal(http.StatusBadRequest, resp.Code)

	// Test joining non-existent game
	nonExistentGameID := uuid.New().String()
	resp2 := suite.makeRequest("POST", fmt.Sprintf("/api/games/%s/join", nonExistentGameID), nil, suite.testUserToken)
	suite.Assert().Equal(http.StatusNotFound, resp2.Code)
}

func (suite *IntegrationTestSuite) TestRateLimiting() {
	// Test multiple rapid requests (if rate limiting is implemented)
	for i := 0; i < 10; i++ {
		resp := suite.makeRequest("GET", "/api/profile", nil, suite.testUserToken)
		// Should not exceed rate limit for reasonable requests
		suite.Assert().NotEqual(http.StatusTooManyRequests, resp.Code)
		time.Sleep(10 * time.Millisecond)
	}
}

func TestIntegrationSuite(t *testing.T) {
	suite.Run(t, new(IntegrationTestSuite))
}

// Benchmark tests for integration
func BenchmarkIntegration_UserRegistration(b *testing.B) {
	if os.Getenv("RUN_INTEGRATION_TESTS") != "true" {
		b.Skip("Skipping integration benchmarks. Set RUN_INTEGRATION_TESTS=true to run.")
	}

	// Setup
	cfg := testutil.TestConfig()
	db, _ := database.Initialize(cfg.Database)
	redis, _ := database.InitializeRedis(cfg.Redis)

	userService := services.NewUserService(db)
	gameService := services.NewGameService(db, redis)
	avatarService := services.NewAvatarService(db, redis)

	handler := handlers.NewHandler(gameService, userService, avatarService, cfg.JWT.Secret)

	gin.SetMode(gin.TestMode)
	app := gin.New()
	handler.SetupRoutes(app)

	server := httptest.NewServer(app)
	defer server.Close()

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		userData := map[string]interface{}{
			"username": fmt.Sprintf("benchuser%d", i),
			"email":    fmt.Sprintf("bench%d@example.com", i),
			"password": "password123",
		}

		jsonBody, _ := json.Marshal(userData)
		req, _ := http.NewRequest("POST", server.URL+"/api/register", bytes.NewBuffer(jsonBody))
		req.Header.Set("Content-Type", "application/json")

		client := &http.Client{}
		resp, _ := client.Do(req)
		resp.Body.Close()
	}
}

func BenchmarkIntegration_GameCreation(b *testing.B) {
	if os.Getenv("RUN_INTEGRATION_TESTS") != "true" {
		b.Skip("Skipping integration benchmarks. Set RUN_INTEGRATION_TESTS=true to run.")
	}

	// Setup similar to above benchmark
	cfg := testutil.TestConfig()
	db, _ := database.Initialize(cfg.Database)
	redis, _ := database.InitializeRedis(cfg.Redis)

	userService := services.NewUserService(db)
	gameService := services.NewGameService(db, redis)
	avatarService := services.NewAvatarService(db, redis)

	handler := handlers.NewHandler(gameService, userService, avatarService, cfg.JWT.Secret)

	gin.SetMode(gin.TestMode)
	app := gin.New()
	handler.SetupRoutes(app)

	server := httptest.NewServer(app)
	defer server.Close()

	// Create a test user and get token
	user, _ := userService.CreateUserWithHashedPassword("benchuser", "bench@example.com", "password123")
	token := "mock-token" // In real scenario, generate proper JWT token

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		gameData := map[string]interface{}{
			"arena_id": uuid.New().String(),
		}

		jsonBody, _ := json.Marshal(gameData)
		req, _ := http.NewRequest("POST", server.URL+"/api/games", bytes.NewBuffer(jsonBody))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+token)

		client := &http.Client{}
		resp, _ := client.Do(req)
		resp.Body.Close()
	}

	_ = user // Silence unused variable warning
}
