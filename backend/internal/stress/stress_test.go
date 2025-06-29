package stress

import (
	"arcane-chess/internal/database"
	"arcane-chess/internal/handlers"
	"arcane-chess/internal/services"
	"arcane-chess/internal/testutil"
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"math/rand"
	"net/http"
	"net/http/httptest"
	"os"
	"sync"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

type StressTestSuite struct {
	app           *gin.Engine
	server        *httptest.Server
	userService   *services.UserService
	gameService   *services.GameService
	avatarService *services.AvatarService
	testTokens    []string
	testUsers     []map[string]interface{}
}

func (s *StressTestSuite) SetupSuite(t *testing.T) {
	// Skip stress tests unless explicitly enabled
	if os.Getenv("RUN_STRESS_TESTS") != "true" {
		t.Skip("Skipping stress tests. Set RUN_STRESS_TESTS=true to run.")
	}

	// Load test configuration
	cfg := testutil.TestConfig()

	// Setup test database
	db, err := database.Initialize(cfg.Database)
	require.NoError(t, err)

	// Setup test Redis
	redis, err := database.InitializeRedis(cfg.Redis)
	require.NoError(t, err)

	// Initialize services
	s.userService = services.NewUserService(db)
	s.gameService = services.NewGameService(db, redis)
	s.avatarService = services.NewAvatarService(db, redis)

	// Initialize handlers
	handler := handlers.NewHandler(s.gameService, s.userService, s.avatarService, cfg.JWT.Secret)

	// Setup Gin
	gin.SetMode(gin.TestMode)
	s.app = gin.New()
	handler.SetupRoutes(s.app)

	// Start test server
	s.server = httptest.NewServer(s.app)

	// Create test users for stress testing
	s.createTestUsers(t, 100) // Create 100 test users
}

func (s *StressTestSuite) TearDownSuite() {
	if s.server != nil {
		s.server.Close()
	}
}

func (s *StressTestSuite) createTestUsers(t *testing.T, count int) {
	s.testTokens = make([]string, count)
	s.testUsers = make([]map[string]interface{}, count)

	for i := 0; i < count; i++ {
		userData := map[string]interface{}{
			"username": fmt.Sprintf("stressuser%d", i),
			"email":    fmt.Sprintf("stress%d@example.com", i),
			"password": "password123",
		}

		resp := s.makeRequest(t, "POST", "/api/register", userData, "")
		require.Equal(t, http.StatusCreated, resp.Code)

		var registerResp map[string]interface{}
		err := json.Unmarshal(resp.Body.Bytes(), &registerResp)
		require.NoError(t, err)

		s.testUsers[i] = registerResp
		s.testTokens[i] = registerResp["token"].(string)
	}
}

func (s *StressTestSuite) makeRequest(t *testing.T, method, url string, body interface{}, token string) *httptest.ResponseRecorder {
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
	s.app.ServeHTTP(w, req)
	return w
}

// Test concurrent user registrations
func TestStressConcurrentUserRegistration(t *testing.T) {
	if os.Getenv("RUN_STRESS_TESTS") != "true" {
		t.Skip("Skipping stress tests. Set RUN_STRESS_TESTS=true to run.")
	}

	suite := &StressTestSuite{}
	suite.SetupSuite(t)
	defer suite.TearDownSuite()

	const numUsers = 1000
	const concurrency = 50

	// Channel to collect results
	results := make(chan error, numUsers)

	// Use a semaphore to limit concurrency
	semaphore := make(chan struct{}, concurrency)

	var wg sync.WaitGroup

	start := time.Now()

	for i := 0; i < numUsers; i++ {
		wg.Add(1)
		go func(userID int) {
			defer wg.Done()

			// Acquire semaphore
			semaphore <- struct{}{}
			defer func() { <-semaphore }()

			userData := map[string]interface{}{
				"username": fmt.Sprintf("stressuser%d_%d", userID, time.Now().UnixNano()),
				"email":    fmt.Sprintf("stress%d_%d@example.com", userID, time.Now().UnixNano()),
				"password": "password123",
			}

			resp := suite.makeRequest(t, "POST", "/api/register", userData, "")

			if resp.Code != http.StatusCreated {
				results <- fmt.Errorf("failed to register user %d: status %d", userID, resp.Code)
				return
			}

			results <- nil
		}(i)
	}

	wg.Wait()
	close(results)

	duration := time.Since(start)

	// Check results
	var errors []error
	for err := range results {
		if err != nil {
			errors = append(errors, err)
		}
	}

	successRate := float64(numUsers-len(errors)) / float64(numUsers) * 100
	throughput := float64(numUsers-len(errors)) / duration.Seconds()

	t.Logf("Stress Test Results:")
	t.Logf("  Total Users: %d", numUsers)
	t.Logf("  Successful: %d", numUsers-len(errors))
	t.Logf("  Failed: %d", len(errors))
	t.Logf("  Success Rate: %.2f%%", successRate)
	t.Logf("  Duration: %v", duration)
	t.Logf("  Throughput: %.2f requests/second", throughput)

	// Assert minimum success rate
	assert.GreaterOrEqual(t, successRate, 95.0, "Success rate should be at least 95%")
	assert.LessOrEqual(t, len(errors), 50, "Should have fewer than 50 errors")
}

// Test concurrent game creation and joining
func TestStressConcurrentGameOperations(t *testing.T) {
	if os.Getenv("RUN_STRESS_TESTS") != "true" {
		t.Skip("Skipping stress tests. Set RUN_STRESS_TESTS=true to run.")
	}

	suite := &StressTestSuite{}
	suite.SetupSuite(t)
	defer suite.TearDownSuite()

	const numGames = 500
	const concurrency = 25

	// Create games first
	gameIDs := make([]string, numGames)
	createResults := make(chan struct {
		gameID string
		err    error
	}, numGames)

	semaphore := make(chan struct{}, concurrency)
	var wg sync.WaitGroup

	start := time.Now()

	// Create games concurrently
	for i := 0; i < numGames; i++ {
		wg.Add(1)
		go func(gameIndex int) {
			defer wg.Done()

			semaphore <- struct{}{}
			defer func() { <-semaphore }()

			gameData := map[string]interface{}{
				"arena_id": uuid.New().String(),
			}

			token := suite.testTokens[gameIndex%len(suite.testTokens)]
			resp := suite.makeRequest(t, "POST", "/api/games", gameData, token)

			if resp.Code != http.StatusCreated {
				createResults <- struct {
					gameID string
					err    error
				}{
					gameID: "",
					err:    fmt.Errorf("failed to create game %d: status %d", gameIndex, resp.Code),
				}
				return
			}

			var gameResp map[string]interface{}
			err := json.Unmarshal(resp.Body.Bytes(), &gameResp)
			if err != nil {
				createResults <- struct {
					gameID string
					err    error
				}{
					gameID: "",
					err:    fmt.Errorf("failed to parse game response %d: %v", gameIndex, err),
				}
				return
			}

			createResults <- struct {
				gameID string
				err    error
			}{
				gameID: gameResp["id"].(string),
				err:    nil,
			}
		}(i)
	}

	wg.Wait()
	close(createResults)

	// Collect game IDs
	var createErrors []error
	gameIndex := 0
	for result := range createResults {
		if result.err != nil {
			createErrors = append(createErrors, result.err)
		} else {
			gameIDs[gameIndex] = result.gameID
			gameIndex++
		}
	}

	createDuration := time.Since(start)

	// Now join games concurrently
	joinStart := time.Now()
	joinResults := make(chan error, gameIndex)

	for i := 0; i < gameIndex; i++ {
		wg.Add(1)
		go func(joinIndex int) {
			defer wg.Done()

			semaphore <- struct{}{}
			defer func() { <-semaphore }()

			// Use a different user to join
			token := suite.testTokens[(joinIndex+50)%len(suite.testTokens)]
			resp := suite.makeRequest(t, "POST", fmt.Sprintf("/api/games/%s/join", gameIDs[joinIndex]), nil, token)

			if resp.Code != http.StatusOK {
				joinResults <- fmt.Errorf("failed to join game %d: status %d", joinIndex, resp.Code)
				return
			}

			joinResults <- nil
		}(i)
	}

	wg.Wait()
	close(joinResults)

	joinDuration := time.Since(joinStart)

	// Check join results
	var joinErrors []error
	for err := range joinResults {
		if err != nil {
			joinErrors = append(joinErrors, err)
		}
	}

	// Calculate metrics
	totalDuration := time.Since(start)
	createSuccessRate := float64(numGames-len(createErrors)) / float64(numGames) * 100
	joinSuccessRate := float64(gameIndex-len(joinErrors)) / float64(gameIndex) * 100

	createThroughput := float64(numGames-len(createErrors)) / createDuration.Seconds()
	joinThroughput := float64(gameIndex-len(joinErrors)) / joinDuration.Seconds()

	t.Logf("Game Operations Stress Test Results:")
	t.Logf("  Game Creation:")
	t.Logf("    Total: %d", numGames)
	t.Logf("    Successful: %d", numGames-len(createErrors))
	t.Logf("    Success Rate: %.2f%%", createSuccessRate)
	t.Logf("    Duration: %v", createDuration)
	t.Logf("    Throughput: %.2f games/second", createThroughput)
	t.Logf("  Game Joining:")
	t.Logf("    Total: %d", gameIndex)
	t.Logf("    Successful: %d", gameIndex-len(joinErrors))
	t.Logf("    Success Rate: %.2f%%", joinSuccessRate)
	t.Logf("    Duration: %v", joinDuration)
	t.Logf("    Throughput: %.2f joins/second", joinThroughput)
	t.Logf("  Total Duration: %v", totalDuration)

	// Assert minimum success rates
	assert.GreaterOrEqual(t, createSuccessRate, 90.0, "Game creation success rate should be at least 90%")
	assert.GreaterOrEqual(t, joinSuccessRate, 90.0, "Game join success rate should be at least 90%")
}

// Test concurrent avatar updates
func TestStressConcurrentAvatarUpdates(t *testing.T) {
	if os.Getenv("RUN_STRESS_TESTS") != "true" {
		t.Skip("Skipping stress tests. Set RUN_STRESS_TESTS=true to run.")
	}

	suite := &StressTestSuite{}
	suite.SetupSuite(t)
	defer suite.TearDownSuite()

	const numUpdates = 1000
	const concurrency = 50

	results := make(chan error, numUpdates)
	semaphore := make(chan struct{}, concurrency)
	var wg sync.WaitGroup

	start := time.Now()

	for i := 0; i < numUpdates; i++ {
		wg.Add(1)
		go func(updateIndex int) {
			defer wg.Done()

			semaphore <- struct{}{}
			defer func() { <-semaphore }()

			// Random position updates
			positionData := map[string]interface{}{
				"position_x": rand.Float64() * 100,
				"position_y": rand.Float64() * 100,
				"position_z": rand.Float64() * 100,
				"rotation_y": rand.Float64() * 360,
			}

			token := suite.testTokens[updateIndex%len(suite.testTokens)]
			resp := suite.makeRequest(t, "PUT", "/api/avatar/position", positionData, token)

			if resp.Code != http.StatusOK {
				results <- fmt.Errorf("failed to update avatar %d: status %d", updateIndex, resp.Code)
				return
			}

			results <- nil
		}(i)
	}

	wg.Wait()
	close(results)

	duration := time.Since(start)

	// Check results
	var errors []error
	for err := range results {
		if err != nil {
			errors = append(errors, err)
		}
	}

	successRate := float64(numUpdates-len(errors)) / float64(numUpdates) * 100
	throughput := float64(numUpdates-len(errors)) / duration.Seconds()

	t.Logf("Avatar Updates Stress Test Results:")
	t.Logf("  Total Updates: %d", numUpdates)
	t.Logf("  Successful: %d", numUpdates-len(errors))
	t.Logf("  Failed: %d", len(errors))
	t.Logf("  Success Rate: %.2f%%", successRate)
	t.Logf("  Duration: %v", duration)
	t.Logf("  Throughput: %.2f updates/second", throughput)

	// Assert minimum success rate
	assert.GreaterOrEqual(t, successRate, 95.0, "Success rate should be at least 95%")
}

// Test memory usage under load
func TestStressMemoryUsage(t *testing.T) {
	if os.Getenv("RUN_STRESS_TESTS") != "true" {
		t.Skip("Skipping stress tests. Set RUN_STRESS_TESTS=true to run.")
	}

	suite := &StressTestSuite{}
	suite.SetupSuite(t)
	defer suite.TearDownSuite()

	// Simulate sustained load
	const duration = 30 * time.Second
	const concurrency = 20

	ctx, cancel := context.WithTimeout(context.Background(), duration)
	defer cancel()

	var wg sync.WaitGroup
	requestCount := int64(0)
	errorCount := int64(0)

	// Start multiple goroutines making requests
	for i := 0; i < concurrency; i++ {
		wg.Add(1)
		go func(workerID int) {
			defer wg.Done()

			for {
				select {
				case <-ctx.Done():
					return
				default:
					// Make a random request
					requestType := rand.Intn(3)

					switch requestType {
					case 0: // Get profile
						token := suite.testTokens[rand.Intn(len(suite.testTokens))]
						resp := suite.makeRequest(t, "GET", "/api/profile", nil, token)
						if resp.Code != http.StatusOK {
							errorCount++
						}
					case 1: // Create game
						gameData := map[string]interface{}{
							"arena_id": uuid.New().String(),
						}
						token := suite.testTokens[rand.Intn(len(suite.testTokens))]
						resp := suite.makeRequest(t, "POST", "/api/games", gameData, token)
						if resp.Code != http.StatusCreated {
							errorCount++
						}
					case 2: // Update avatar position
						positionData := map[string]interface{}{
							"position_x": rand.Float64() * 100,
							"position_y": rand.Float64() * 100,
							"position_z": rand.Float64() * 100,
							"rotation_y": rand.Float64() * 360,
						}
						token := suite.testTokens[rand.Intn(len(suite.testTokens))]
						resp := suite.makeRequest(t, "PUT", "/api/avatar/position", positionData, token)
						if resp.Code != http.StatusOK {
							errorCount++
						}
					}

					requestCount++

					// Small delay to avoid overwhelming
					time.Sleep(10 * time.Millisecond)
				}
			}
		}(i)
	}

	wg.Wait()

	totalRequests := requestCount
	totalErrors := errorCount
	successRate := float64(totalRequests-totalErrors) / float64(totalRequests) * 100
	throughput := float64(totalRequests) / duration.Seconds()

	t.Logf("Sustained Load Test Results:")
	t.Logf("  Duration: %v", duration)
	t.Logf("  Concurrency: %d", concurrency)
	t.Logf("  Total Requests: %d", totalRequests)
	t.Logf("  Total Errors: %d", totalErrors)
	t.Logf("  Success Rate: %.2f%%", successRate)
	t.Logf("  Throughput: %.2f requests/second", throughput)

	// Assert minimum performance
	assert.GreaterOrEqual(t, successRate, 90.0, "Success rate should be at least 90%")
	assert.GreaterOrEqual(t, throughput, 50.0, "Throughput should be at least 50 requests/second")
}

// Test database connection pool under stress
func TestStressDatabaseConnections(t *testing.T) {
	if os.Getenv("RUN_STRESS_TESTS") != "true" {
		t.Skip("Skipping stress tests. Set RUN_STRESS_TESTS=true to run.")
	}

	suite := &StressTestSuite{}
	suite.SetupSuite(t)
	defer suite.TearDownSuite()

	const numConnections = 100
	const concurrency = 50

	results := make(chan error, numConnections)
	semaphore := make(chan struct{}, concurrency)
	var wg sync.WaitGroup

	start := time.Now()

	for i := 0; i < numConnections; i++ {
		wg.Add(1)
		go func(connIndex int) {
			defer wg.Done()

			semaphore <- struct{}{}
			defer func() { <-semaphore }()

			// Make database-heavy request
			token := suite.testTokens[connIndex%len(suite.testTokens)]
			resp := suite.makeRequest(t, "GET", "/api/profile", nil, token)

			if resp.Code != http.StatusOK {
				results <- fmt.Errorf("failed database connection test %d: status %d", connIndex, resp.Code)
				return
			}

			results <- nil
		}(i)
	}

	wg.Wait()
	close(results)

	duration := time.Since(start)

	// Check results
	var errors []error
	for err := range results {
		if err != nil {
			errors = append(errors, err)
		}
	}

	successRate := float64(numConnections-len(errors)) / float64(numConnections) * 100
	throughput := float64(numConnections-len(errors)) / duration.Seconds()

	t.Logf("Database Connection Stress Test Results:")
	t.Logf("  Total Connections: %d", numConnections)
	t.Logf("  Successful: %d", numConnections-len(errors))
	t.Logf("  Failed: %d", len(errors))
	t.Logf("  Success Rate: %.2f%%", successRate)
	t.Logf("  Duration: %v", duration)
	t.Logf("  Throughput: %.2f connections/second", throughput)

	// Assert minimum success rate
	assert.GreaterOrEqual(t, successRate, 95.0, "Success rate should be at least 95%")
}
