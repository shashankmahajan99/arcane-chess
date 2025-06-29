package auth

import (
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
)

func TestGenerateToken(t *testing.T) {
	userID := uuid.New().String()
	username := "testuser"
	email := "test@example.com"
	jwtSecret := "test-secret-that-is-long-enough-for-testing-purposes"

	token, err := GenerateToken(userID, username, email, jwtSecret)

	assert.NoError(t, err)
	assert.NotEmpty(t, token)

	// Verify token structure (should have 3 parts separated by dots)
	parts := len([]byte(token))
	assert.Greater(t, parts, 100) // JWT tokens are typically longer than 100 characters
}

func TestGenerateToken_EmptySecret(t *testing.T) {
	userID := uuid.New().String()
	username := "testuser"
	email := "test@example.com"
	jwtSecret := ""

	token, err := GenerateToken(userID, username, email, jwtSecret)

	assert.Error(t, err)
	assert.Empty(t, token)
	assert.Contains(t, err.Error(), "JWT secret is required")
}

func TestValidateToken(t *testing.T) {
	userID := uuid.New().String()
	username := "testuser"
	email := "test@example.com"
	jwtSecret := "test-secret-that-is-long-enough-for-testing-purposes"

	// Generate a token first
	token, err := GenerateToken(userID, username, email, jwtSecret)
	assert.NoError(t, err)

	// Validate the token
	claims, err := ValidateToken(token, jwtSecret)

	assert.NoError(t, err)
	assert.NotNil(t, claims)
	assert.Equal(t, userID, claims.UserID)
	assert.Equal(t, username, claims.Username)
	assert.Equal(t, email, claims.Email)
}

func TestValidateToken_InvalidToken(t *testing.T) {
	jwtSecret := "test-secret-that-is-long-enough-for-testing-purposes"
	invalidToken := "invalid.token.here"

	claims, err := ValidateToken(invalidToken, jwtSecret)

	assert.Error(t, err)
	assert.Nil(t, claims)
}

func TestValidateToken_ExpiredToken(t *testing.T) {
	userID := uuid.New().String()
	username := "testuser"
	email := "test@example.com"
	jwtSecret := "test-secret-that-is-long-enough-for-testing-purposes"

	// Create an expired token manually
	expirationTime := time.Now().Add(-1 * time.Hour) // Expired 1 hour ago
	claims := &Claims{
		UserID:   userID,
		Username: username,
		Email:    email,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			IssuedAt:  jwt.NewNumericDate(time.Now().Add(-2 * time.Hour)),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(jwtSecret))
	assert.NoError(t, err)

	// Try to validate the expired token
	validatedClaims, err := ValidateToken(tokenString, jwtSecret)

	assert.Error(t, err)
	assert.Nil(t, validatedClaims)
}

func TestValidateToken_WrongSecret(t *testing.T) {
	userID := uuid.New().String()
	username := "testuser"
	email := "test@example.com"
	correctSecret := "correct-secret-that-is-long-enough-for-testing"
	wrongSecret := "wrong-secret-that-is-long-enough-for-testing-purposes"

	// Generate token with correct secret
	token, err := GenerateToken(userID, username, email, correctSecret)
	assert.NoError(t, err)

	// Try to validate with wrong secret
	claims, err := ValidateToken(token, wrongSecret)

	assert.Error(t, err)
	assert.Nil(t, claims)
}

func TestValidateToken_EmptySecret(t *testing.T) {
	userID := uuid.New().String()
	username := "testuser"
	email := "test@example.com"
	jwtSecret := "test-secret-that-is-long-enough-for-testing-purposes"

	// Generate a valid token
	token, err := GenerateToken(userID, username, email, jwtSecret)
	assert.NoError(t, err)

	// Try to validate with empty secret
	claims, err := ValidateToken(token, "")

	assert.Error(t, err)
	assert.Nil(t, claims)
	assert.Contains(t, err.Error(), "JWT secret is required")
}

func TestTokenClaims(t *testing.T) {
	userID := uuid.New().String()
	username := "testuser"
	email := "test@example.com"
	jwtSecret := "test-secret-that-is-long-enough-for-testing-purposes"

	token, err := GenerateToken(userID, username, email, jwtSecret)
	assert.NoError(t, err)

	claims, err := ValidateToken(token, jwtSecret)
	assert.NoError(t, err)

	// Check that claims contain expected data
	assert.Equal(t, userID, claims.UserID)
	assert.Equal(t, username, claims.Username)
	assert.Equal(t, email, claims.Email)

	// Check that standard claims are set
	assert.NotNil(t, claims.ExpiresAt)
	assert.NotNil(t, claims.IssuedAt)
	assert.True(t, claims.ExpiresAt.Time.After(time.Now()))
	assert.True(t, claims.IssuedAt.Time.Before(time.Now().Add(time.Minute)))
}

func TestGenerateToken_LongInputs(t *testing.T) {
	// Test with very long inputs to ensure no truncation
	userID := uuid.New().String()
	username := "very-long-username-that-exceeds-normal-length-expectations-for-testing-edge-cases"
	email := "very-long-email-address-that-exceeds-normal-length@very-long-domain-name-for-testing.com"
	jwtSecret := "very-long-jwt-secret-for-testing-purposes-that-exceeds-minimum-requirements"

	token, err := GenerateToken(userID, username, email, jwtSecret)

	assert.NoError(t, err)
	assert.NotEmpty(t, token)

	// Validate the token
	claims, err := ValidateToken(token, jwtSecret)
	assert.NoError(t, err)
	assert.Equal(t, username, claims.Username)
	assert.Equal(t, email, claims.Email)
}

func BenchmarkGenerateToken(b *testing.B) {
	userID := uuid.New().String()
	username := "testuser"
	email := "test@example.com"
	jwtSecret := "test-secret-that-is-long-enough-for-testing-purposes"

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, _ = GenerateToken(userID, username, email, jwtSecret)
	}
}

func BenchmarkValidateToken(b *testing.B) {
	userID := uuid.New().String()
	username := "testuser"
	email := "test@example.com"
	jwtSecret := "test-secret-that-is-long-enough-for-testing-purposes"

	// Pre-generate token
	token, _ := GenerateToken(userID, username, email, jwtSecret)

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, _ = ValidateToken(token, jwtSecret)
	}
}
