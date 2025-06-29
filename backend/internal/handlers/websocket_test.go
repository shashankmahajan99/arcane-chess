package handlers

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"arcane-chess/internal/services"
	"arcane-chess/internal/testutil"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func setupTestHandler() (*Handler, func()) {
	db, _ := testutil.MockDB(&testing.T{})
	redisClient, redisServer := testutil.MockRedis(&testing.T{})

	gameService := services.NewGameService(db, redisClient)
	userService := services.NewUserService(db)
	avatarService := services.NewAvatarService(db, redisClient)

	handler := NewHandler(gameService, userService, avatarService, "test-secret")

	cleanup := func() {
		sqlDB, _ := db.DB()
		testutil.CleanupDB(sqlDB)
		testutil.CleanupRedis(redisServer)
	}

	return handler, cleanup
}

func TestWebSocketConnection(t *testing.T) {
	gin.SetMode(gin.TestMode)
	handler, cleanup := setupTestHandler()
	defer cleanup()

	router := gin.New()
	handler.SetupRoutes(router)

	// Create test server
	server := httptest.NewServer(router)
	defer server.Close()

	// Convert HTTP URL to WebSocket URL
	wsURL := "ws" + strings.TrimPrefix(server.URL, "http") + "/ws?user_id=test-user&username=testuser"

	// Test WebSocket connection
	conn, resp, err := websocket.DefaultDialer.Dial(wsURL, nil)
	require.NoError(t, err)
	require.Equal(t, http.StatusSwitchingProtocols, resp.StatusCode)
	defer conn.Close()

	// Test connection establishment message
	var message services.Message
	err = conn.ReadJSON(&message)
	require.NoError(t, err)
	assert.Equal(t, "connection_established", message.Type)

	data, ok := message.Data.(map[string]interface{})
	require.True(t, ok)
	assert.Equal(t, "connected", data["status"])
	assert.NotEmpty(t, data["client_id"])
}

func TestWebSocketJoinRoom(t *testing.T) {
	gin.SetMode(gin.TestMode)
	handler, cleanup := setupTestHandler()
	defer cleanup()

	router := gin.New()
	handler.SetupRoutes(router)

	server := httptest.NewServer(router)
	defer server.Close()

	wsURL := "ws" + strings.TrimPrefix(server.URL, "http") + "/ws?user_id=test-user&username=testuser"

	conn, _, err := websocket.DefaultDialer.Dial(wsURL, nil)
	require.NoError(t, err)
	defer conn.Close()

	// Read connection established message
	var connectionMsg services.Message
	err = conn.ReadJSON(&connectionMsg)
	require.NoError(t, err)

	// Send join room message
	joinMsg := services.Message{
		Type: "join_room",
		Data: map[string]interface{}{
			"room_id": "arena-1",
		},
	}

	err = conn.WriteJSON(joinMsg)
	require.NoError(t, err)

	// Give some time for the message to be processed
	time.Sleep(100 * time.Millisecond)
}

func TestWebSocketMultipleClients(t *testing.T) {
	gin.SetMode(gin.TestMode)
	handler, cleanup := setupTestHandler()
	defer cleanup()

	router := gin.New()
	handler.SetupRoutes(router)

	server := httptest.NewServer(router)
	defer server.Close()

	// Connect first client
	wsURL1 := "ws" + strings.TrimPrefix(server.URL, "http") + "/ws?user_id=user1&username=player1"
	conn1, _, err := websocket.DefaultDialer.Dial(wsURL1, nil)
	require.NoError(t, err)
	defer conn1.Close()

	// Connect second client
	wsURL2 := "ws" + strings.TrimPrefix(server.URL, "http") + "/ws?user_id=user2&username=player2"
	conn2, _, err := websocket.DefaultDialer.Dial(wsURL2, nil)
	require.NoError(t, err)
	defer conn2.Close()

	// Read connection messages
	var msg1, msg2 services.Message
	err = conn1.ReadJSON(&msg1)
	require.NoError(t, err)
	err = conn2.ReadJSON(&msg2)
	require.NoError(t, err)

	// Both clients join the same room
	roomID := "test-arena"
	joinMsg := services.Message{
		Type: "join_room",
		Data: map[string]interface{}{
			"room_id": roomID,
		},
	}

	err = conn1.WriteJSON(joinMsg)
	require.NoError(t, err)
	err = conn2.WriteJSON(joinMsg)
	require.NoError(t, err)

	time.Sleep(100 * time.Millisecond)

	// Client 1 sends a chat message
	chatMsg := services.Message{
		Type: "chat_message",
		Room: roomID,
		Data: services.ChatMessage{
			UserID:   "user1",
			Username: "player1",
			Message:  "Hello from player 1!",
			Room:     roomID,
		},
	}

	err = conn1.WriteJSON(chatMsg)
	require.NoError(t, err)

	// Client 2 should receive the message
	conn2.SetReadDeadline(time.Now().Add(2 * time.Second))
	var receivedMsg services.Message
	err = conn2.ReadJSON(&receivedMsg)
	require.NoError(t, err)
	assert.Equal(t, "chat_message", receivedMsg.Type)
}

func TestWebSocketGameMove(t *testing.T) {
	gin.SetMode(gin.TestMode)
	handler, cleanup := setupTestHandler()
	defer cleanup()

	router := gin.New()
	handler.SetupRoutes(router)

	server := httptest.NewServer(router)
	defer server.Close()

	// Connect two clients
	wsURL1 := "ws" + strings.TrimPrefix(server.URL, "http") + "/ws?user_id=user1&username=player1"
	conn1, _, err := websocket.DefaultDialer.Dial(wsURL1, nil)
	require.NoError(t, err)
	defer conn1.Close()

	wsURL2 := "ws" + strings.TrimPrefix(server.URL, "http") + "/ws?user_id=user2&username=player2"
	conn2, _, err := websocket.DefaultDialer.Dial(wsURL2, nil)
	require.NoError(t, err)
	defer conn2.Close()

	// Clear connection messages
	var msg1, msg2 services.Message
	err = conn1.ReadJSON(&msg1)
	require.NoError(t, err)
	err = conn2.ReadJSON(&msg2)
	require.NoError(t, err)

	// Join same game room
	gameID := uuid.New().String()
	joinMsg := services.Message{
		Type: "join_room",
		Data: map[string]interface{}{
			"room_id": gameID,
		},
	}

	err = conn1.WriteJSON(joinMsg)
	require.NoError(t, err)
	err = conn2.WriteJSON(joinMsg)
	require.NoError(t, err)

	time.Sleep(100 * time.Millisecond)

	// Send game move from player 1
	moveMsg := services.Message{
		Type: "game_move",
		Room: gameID,
		Data: services.GameMoveMessage{
			GameID: gameID,
			From:   "e2",
			To:     "e4",
			Piece:  "P",
		},
	}

	err = conn1.WriteJSON(moveMsg)
	require.NoError(t, err)

	// Player 2 should receive the move
	conn2.SetReadDeadline(time.Now().Add(2 * time.Second))
	var receivedMove services.Message
	err = conn2.ReadJSON(&receivedMove)
	require.NoError(t, err)
	assert.Equal(t, "game_move", receivedMove.Type)

	// Verify move data
	moveData, ok := receivedMove.Data.(map[string]interface{})
	require.True(t, ok)
	assert.Equal(t, "e2", moveData["from"])
	assert.Equal(t, "e4", moveData["to"])
	assert.Equal(t, "P", moveData["piece"])
}

func TestWebSocketAvatarPosition(t *testing.T) {
	gin.SetMode(gin.TestMode)
	handler, cleanup := setupTestHandler()
	defer cleanup()

	router := gin.New()
	handler.SetupRoutes(router)

	server := httptest.NewServer(router)
	defer server.Close()

	// Connect two clients
	wsURL1 := "ws" + strings.TrimPrefix(server.URL, "http") + "/ws?user_id=user1&username=player1"
	conn1, _, err := websocket.DefaultDialer.Dial(wsURL1, nil)
	require.NoError(t, err)
	defer conn1.Close()

	wsURL2 := "ws" + strings.TrimPrefix(server.URL, "http") + "/ws?user_id=user2&username=player2"
	conn2, _, err := websocket.DefaultDialer.Dial(wsURL2, nil)
	require.NoError(t, err)
	defer conn2.Close()

	// Clear connection messages
	var msg1, msg2 services.Message
	err = conn1.ReadJSON(&msg1)
	require.NoError(t, err)
	err = conn2.ReadJSON(&msg2)
	require.NoError(t, err)

	// Join same arena
	arenaID := "arena-1"
	joinMsg := services.Message{
		Type: "join_room",
		Data: map[string]interface{}{
			"room_id": arenaID,
		},
	}

	err = conn1.WriteJSON(joinMsg)
	require.NoError(t, err)
	err = conn2.WriteJSON(joinMsg)
	require.NoError(t, err)

	time.Sleep(100 * time.Millisecond)

	// Send avatar position update
	positionMsg := services.Message{
		Type: "avatar_position",
		Room: arenaID,
		Data: services.AvatarPositionMessage{
			UserID:   "user1",
			Username: "player1",
			X:        10.5,
			Y:        0.0,
			Z:        15.2,
			Rotation: 90.0,
		},
	}

	err = conn1.WriteJSON(positionMsg)
	require.NoError(t, err)

	// Player 2 should receive the position update
	conn2.SetReadDeadline(time.Now().Add(2 * time.Second))
	var receivedPosition services.Message
	err = conn2.ReadJSON(&receivedPosition)
	require.NoError(t, err)
	assert.Equal(t, "avatar_position", receivedPosition.Type)

	// Verify position data
	posData, ok := receivedPosition.Data.(map[string]interface{})
	require.True(t, ok)
	assert.Equal(t, "user1", posData["user_id"])
	assert.Equal(t, 10.5, posData["x"])
	assert.Equal(t, 15.2, posData["z"])
	assert.Equal(t, 90.0, posData["rotation"])
}

func TestWebSocketConnectionRequiresUserID(t *testing.T) {
	gin.SetMode(gin.TestMode)
	handler, cleanup := setupTestHandler()
	defer cleanup()

	router := gin.New()
	handler.SetupRoutes(router)

	server := httptest.NewServer(router)
	defer server.Close()

	// Try to connect without user_id
	wsURL := "ws" + strings.TrimPrefix(server.URL, "http") + "/ws"

	_, resp, err := websocket.DefaultDialer.Dial(wsURL, nil)
	require.Error(t, err)
	require.Equal(t, http.StatusBadRequest, resp.StatusCode)
}

func TestWebSocketJoinLeaveRooms(t *testing.T) {
	gin.SetMode(gin.TestMode)
	handler, cleanup := setupTestHandler()
	defer cleanup()

	router := gin.New()
	handler.SetupRoutes(router)

	server := httptest.NewServer(router)
	defer server.Close()

	wsURL := "ws" + strings.TrimPrefix(server.URL, "http") + "/ws?user_id=test-user&username=testuser"

	conn, _, err := websocket.DefaultDialer.Dial(wsURL, nil)
	require.NoError(t, err)
	defer conn.Close()

	// Read connection message
	var connectionMsg services.Message
	err = conn.ReadJSON(&connectionMsg)
	require.NoError(t, err)

	// Join a room
	joinMsg := services.Message{
		Type: "join_room",
		Data: map[string]interface{}{
			"room_id": "arena-1",
		},
	}
	err = conn.WriteJSON(joinMsg)
	require.NoError(t, err)

	time.Sleep(50 * time.Millisecond)

	// Leave the room
	leaveMsg := services.Message{
		Type: "leave_room",
		Data: map[string]interface{}{
			"room_id": "arena-1",
		},
	}
	err = conn.WriteJSON(leaveMsg)
	require.NoError(t, err)

	time.Sleep(50 * time.Millisecond)
}
