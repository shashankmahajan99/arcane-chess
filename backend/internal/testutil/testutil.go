package testutil

import (
	"arcane-chess/internal/config"
	"arcane-chess/internal/models"
	"database/sql"
	"database/sql/driver"
	"fmt"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/alicebob/miniredis/v2"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
	"github.com/stretchr/testify/require"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// TestConfig returns a test configuration
func TestConfig() *config.Config {
	jwtSecret := "test-jwt-secret-that-is-long-enough-for-validation-requirements"

	return &config.Config{
		Server: config.ServerConfig{
			Port:        "8080",
			Host:        "localhost",
			Environment: "test",
			CORSOrigins: []string{"http://localhost:3000"},
		},
		Database: config.DatabaseConfig{
			Host:     "localhost",
			Port:     5432,
			Name:     "test_db",
			User:     "test_user",
			Password: "test_password",
		},
		Redis: config.RedisConfig{
			Host:     "localhost",
			Port:     6379,
			Password: "",
			DB:       0,
		},
		JWT: config.JWTConfig{
			Secret: jwtSecret,
		},
	}
}

// MockDB creates a mock database connection for testing
func MockDB(t *testing.T) (*gorm.DB, sqlmock.Sqlmock) {
	sqlDB, mock, err := sqlmock.New()
	require.NoError(t, err)

	gormDB, err := gorm.Open(postgres.New(postgres.Config{
		Conn: sqlDB,
	}), &gorm.Config{})
	require.NoError(t, err)

	return gormDB, mock
}

// MockRedis creates a mock Redis instance for testing
func MockRedis(t *testing.T) (*redis.Client, *miniredis.Miniredis) {
	s, err := miniredis.Run()
	require.NoError(t, err)

	client := redis.NewClient(&redis.Options{
		Addr: s.Addr(),
	})

	return client, s
}

// TestUser creates a test user for testing purposes
func TestUser() *models.User {
	return &models.User{
		ID:       uuid.New(),
		Username: "testuser",
		Email:    "test@example.com",
		Password: "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", // "password"
		Rating:   1200,
		IsOnline: false,
		LastSeen: time.Now(),
	}
}

// TestGame creates a test game for testing purposes
func TestGame() *models.Game {
	arenaID := uuid.New()
	return &models.Game{
		ID:          uuid.New(),
		ArenaID:     arenaID,
		Status:      models.GameStatusWaiting,
		TimeControl: 600, // 10 minutes
		BoardState:  "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
		CurrentTurn: "white",
		WhiteTime:   600,
		BlackTime:   600,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}
}

// TestGameMove creates a test game move for testing purposes
func TestGameMove(gameID, playerID uuid.UUID) *models.GameMove {
	return &models.GameMove{
		ID:         uuid.New(),
		GameID:     gameID,
		PlayerID:   playerID,
		MoveNumber: 1,
		FromSquare: "e2",
		ToSquare:   "e4",
		Piece:      "P",
		Notation:   "e4",
		FENAfter:   "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1",
		TimeLeft:   595,
		CreatedAt:  time.Now(),
	}
}

// TestAvatar creates a test avatar for testing purposes
func TestAvatar(userID uuid.UUID) *models.Avatar {
	return &models.Avatar{
		ID:          uuid.New(),
		UserID:      userID,
		Name:        "Test Avatar",
		ModelType:   "wizard",
		ColorScheme: "blue",
		Accessories: `{"hat": "wizard_hat", "cape": "blue_cape"}`,
		Animations:  `{"idle": "wizard_idle", "victory": "wizard_victory"}`,
		PositionX:   0.0,
		PositionY:   0.0,
		PositionZ:   0.0,
		RotationY:   0.0,
		IsVisible:   true,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}
}

// SetupGin configures Gin for testing
func SetupGin() *gin.Engine {
	gin.SetMode(gin.TestMode)
	return gin.New()
}

// HTTPRecorder returns a new HTTP test recorder
func HTTPRecorder() *httptest.ResponseRecorder {
	return httptest.NewRecorder()
}

// AnyTime is a sqlmock matcher for any time value
type AnyTime struct{}

func (a AnyTime) Match(v driver.Value) bool {
	_, ok := v.(time.Time)
	return ok
}

// AnyUUID is a sqlmock matcher for any UUID value
type AnyUUID struct{}

func (a AnyUUID) Match(v driver.Value) bool {
	switch v := v.(type) {
	case string:
		_, err := uuid.Parse(v)
		return err == nil
	case []byte:
		_, err := uuid.ParseBytes(v)
		return err == nil
	default:
		return false
	}
}

// CleanupDB cleans up the database after tests
func CleanupDB(db *sql.DB) {
	if db != nil {
		db.Close()
	}
}

// CleanupRedis cleans up Redis after tests
func CleanupRedis(s *miniredis.Miniredis) {
	if s != nil {
		s.Close()
	}
}

// AssertJSONError checks if the response contains the expected error message
func AssertJSONError(t *testing.T, body string, expectedError string) {
	require.Contains(t, body, expectedError)
}

// ExpectUserCreate sets up SQL mock expectations for user creation
func ExpectUserCreate(mock sqlmock.Sqlmock, user *models.User) {
	mock.ExpectBegin()
	mock.ExpectQuery(`INSERT INTO "users"`).
		WithArgs(AnyUUID{}, user.Username, user.Email, user.Password, user.Rating, user.IsOnline, AnyTime{}, AnyTime{}, AnyTime{}).
		WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow(user.ID))
	mock.ExpectCommit()
}

// ExpectUserFind sets up SQL mock expectations for user lookup
func ExpectUserFind(mock sqlmock.Sqlmock, user *models.User, condition string) {
	rows := sqlmock.NewRows([]string{"id", "username", "email", "password", "rating", "is_online", "last_seen", "created_at", "updated_at"}).
		AddRow(user.ID, user.Username, user.Email, user.Password, user.Rating, user.IsOnline, user.LastSeen, user.CreatedAt, user.UpdatedAt)

	mock.ExpectQuery(`SELECT \* FROM "users"`).
		WithArgs(sqlmock.AnyArg()).
		WillReturnRows(rows)
}

// LoadTestEnv loads test environment variables
func LoadTestEnv() {
	// Set test environment variables
	cfg := TestConfig()
	_ = cfg // Use configuration as needed
}

// MockTime returns a fixed time for consistent testing
func MockTime() time.Time {
	return time.Date(2024, 1, 1, 12, 0, 0, 0, time.UTC)
}

// RandomString generates a random string for testing
func RandomString(length int) string {
	return fmt.Sprintf("test_%d_%d", time.Now().UnixNano(), length)
}
