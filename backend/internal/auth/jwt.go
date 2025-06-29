package auth

import (
	"time"
	"errors"
	"github.com/golang-jwt/jwt/v5"
)

// JWT key is loaded from configuration - no hardcoded keys

type Claims struct {
	UserID   string `json:"user_id"`
	Username string `json:"username"`
	Email    string `json:"email"`
	jwt.RegisteredClaims
}

func GenerateToken(userID, username, email, jwtSecret string) (string, error) {
	if jwtSecret == "" {
		return "", errors.New("JWT secret is required")
	}
	jwtKey := []byte(jwtSecret)
	expirationTime := time.Now().Add(24 * time.Hour)
	claims := &Claims{
		UserID:   userID,
		Username: username,
		Email:    email,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "arcane-chess",
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtKey)
}

func ValidateToken(tokenString, jwtSecret string) (*Claims, error) {
	if jwtSecret == "" {
		return nil, errors.New("JWT secret is required")
	}
	jwtKey := []byte(jwtSecret)
	claims := &Claims{}
	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		return jwtKey, nil
	})

	if err != nil {
		return nil, err
	}

	if !token.Valid {
		return nil, errors.New("invalid token")
	}

	return claims, nil
}

func RefreshToken(tokenString, jwtSecret string) (string, error) {
	claims, err := ValidateToken(tokenString, jwtSecret)
	if err != nil {
		return "", err
	}

	// Check if token expires within 30 minutes
	if time.Until(claims.ExpiresAt.Time) > 30*time.Minute {
		return "", errors.New("token doesn't need refresh yet")
	}

	return GenerateToken(claims.UserID, claims.Username, claims.Email, jwtSecret)
}