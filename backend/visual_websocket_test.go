package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/url"
	"os"
	"os/signal"
	"strings"
	"time"

	"github.com/gorilla/websocket"
)

// Message types matching the backend
type Message struct {
	Type     string      `json:"type"`
	Data     interface{} `json:"data"`
	Room     string      `json:"room,omitempty"`
	UserID   string      `json:"user_id,omitempty"`
	Username string      `json:"username,omitempty"`
}

type GameMoveMessage struct {
	GameID string `json:"game_id"`
	From   string `json:"from"`
	To     string `json:"to"`
	Piece  string `json:"piece"`
}

type AvatarPositionMessage struct {
	UserID   string  `json:"user_id"`
	Username string  `json:"username"`
	X        float64 `json:"x"`
	Y        float64 `json:"y"`
	Z        float64 `json:"z"`
	Rotation float64 `json:"rotation"`
}

type ChatMessage struct {
	UserID   string `json:"user_id"`
	Username string `json:"username"`
	Message  string `json:"message"`
	Room     string `json:"room"`
}

func main() {
	if len(os.Args) < 2 {
		fmt.Println("Usage: go run visual_websocket_test.go <server_url>")
		fmt.Println("Example: go run visual_websocket_test.go ws://localhost:8080/ws")
		os.Exit(1)
	}

	serverURL := os.Args[1]
	userID := "visual-test-user-1"
	username := "VisualTestUser"

	// Add user_id and username as query parameters
	u, err := url.Parse(serverURL)
	if err != nil {
		log.Fatal("Invalid server URL:", err)
	}

	q := u.Query()
	q.Set("user_id", userID)
	q.Set("username", username)
	u.RawQuery = q.Encode()

	fmt.Printf("🎮 Arcane Chess Backend Visual Test\n")
	fmt.Printf("=====================================\n")
	fmt.Printf("Connecting to: %s\n", u.String())
	fmt.Printf("User ID: %s\n", userID)
	fmt.Printf("Username: %s\n\n", username)

	// Connect to WebSocket
	conn, _, err := websocket.DefaultDialer.Dial(u.String(), nil)
	if err != nil {
		log.Fatal("❌ Failed to connect to WebSocket:", err)
	}
	defer conn.Close()

	fmt.Printf("✅ WebSocket connection established!\n\n")

	// Handle incoming messages in a goroutine
	done := make(chan struct{})
	go func() {
		defer close(done)
		for {
			_, message, err := conn.ReadMessage()
			if err != nil {
				if !websocket.IsCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
					log.Printf("❌ Read error: %v", err)
				}
				return
			}

			var msg Message
			if err := json.Unmarshal(message, &msg); err != nil {
				log.Printf("❌ JSON unmarshal error: %v", err)
				continue
			}

			fmt.Printf("📨 Received: %s\n", formatMessage(msg))
		}
	}()

	// Run visual tests
	runVisualTests(conn)

	// Wait for interrupt signal
	interrupt := make(chan os.Signal, 1)
	signal.Notify(interrupt, os.Interrupt)

	fmt.Println("\n⌨️  Press Ctrl+C to exit...")

	select {
	case <-done:
		fmt.Println("Connection closed by server")
	case <-interrupt:
		fmt.Println("\n👋 Disconnecting...")

		// Send close message
		err := conn.WriteMessage(websocket.CloseMessage, websocket.FormatCloseMessage(websocket.CloseNormalClosure, ""))
		if err != nil {
			log.Printf("❌ Close error: %v", err)
		}

		// Wait for close confirmation or timeout
		select {
		case <-done:
		case <-time.After(time.Second):
		}
	}
}

func runVisualTests(conn *websocket.Conn) {
	fmt.Printf("🧪 Running Visual Backend Tests\n")
	fmt.Printf("================================\n\n")

	tests := []struct {
		name string
		test func(*websocket.Conn)
	}{
		{"Room Join Test", testRoomJoin},
		{"Chat Message Test", testChatMessage},
		{"Game Move Test", testGameMove},
		{"Avatar Position Test", testAvatarPosition},
		{"Room Leave Test", testRoomLeave},
	}

	for i, test := range tests {
		fmt.Printf("🔹 Test %d/%d: %s\n", i+1, len(tests), test.name)
		test.test(conn)
		time.Sleep(1 * time.Second) // Wait between tests
		fmt.Println()
	}

	fmt.Printf("✅ All visual tests completed!\n\n")
}

func testRoomJoin(conn *websocket.Conn) {
	message := Message{
		Type: "join_room",
		Data: map[string]string{
			"room": "visual-test-arena",
		},
		UserID:   "visual-test-user-1",
		Username: "VisualTestUser",
	}

	sendMessage(conn, message, "Joining room 'visual-test-arena'")
}

func testChatMessage(conn *websocket.Conn) {
	chatMsg := ChatMessage{
		UserID:   "visual-test-user-1",
		Username: "VisualTestUser",
		Message:  "Hello from visual test client! 🎮",
		Room:     "visual-test-arena",
	}

	message := Message{
		Type:     "chat",
		Data:     chatMsg,
		Room:     "visual-test-arena",
		UserID:   "visual-test-user-1",
		Username: "VisualTestUser",
	}

	sendMessage(conn, message, "Sending chat message")
}

func testGameMove(conn *websocket.Conn) {
	gameMove := GameMoveMessage{
		GameID: "visual-test-game-123",
		From:   "e2",
		To:     "e4",
		Piece:  "pawn",
	}

	message := Message{
		Type:     "game_move",
		Data:     gameMove,
		Room:     "visual-test-arena",
		UserID:   "visual-test-user-1",
		Username: "VisualTestUser",
	}

	sendMessage(conn, message, "Making game move (e2 -> e4)")
}

func testAvatarPosition(conn *websocket.Conn) {
	avatarPos := AvatarPositionMessage{
		UserID:   "visual-test-user-1",
		Username: "VisualTestUser",
		X:        15.5,
		Y:        0.0,
		Z:        22.3,
		Rotation: 45.0,
	}

	message := Message{
		Type:     "avatar_position",
		Data:     avatarPos,
		Room:     "visual-test-arena",
		UserID:   "visual-test-user-1",
		Username: "VisualTestUser",
	}

	sendMessage(conn, message, "Updating avatar position")
}

func testRoomLeave(conn *websocket.Conn) {
	message := Message{
		Type: "leave_room",
		Data: map[string]string{
			"room": "visual-test-arena",
		},
		UserID:   "visual-test-user-1",
		Username: "VisualTestUser",
	}

	sendMessage(conn, message, "Leaving room 'visual-test-arena'")
}

func sendMessage(conn *websocket.Conn, message Message, description string) {
	data, err := json.Marshal(message)
	if err != nil {
		log.Printf("❌ JSON marshal error: %v", err)
		return
	}

	fmt.Printf("  📤 %s...\n", description)

	err = conn.WriteMessage(websocket.TextMessage, data)
	if err != nil {
		log.Printf("❌ Write error: %v", err)
		return
	}

	time.Sleep(100 * time.Millisecond) // Brief pause to see the response
}

func formatMessage(msg Message) string {
	var details []string

	details = append(details, fmt.Sprintf("Type: %s", msg.Type))

	if msg.Room != "" {
		details = append(details, fmt.Sprintf("Room: %s", msg.Room))
	}

	if msg.Username != "" {
		details = append(details, fmt.Sprintf("User: %s", msg.Username))
	}

	// Format data based on message type
	dataStr := ""
	switch msg.Type {
	case "connection_established":
		if data, ok := msg.Data.(map[string]interface{}); ok {
			if clientID, exists := data["client_id"]; exists {
				dataStr = fmt.Sprintf("Client ID: %v", clientID)
			}
		}
	case "chat":
		if data, ok := msg.Data.(map[string]interface{}); ok {
			if message, exists := data["message"]; exists {
				dataStr = fmt.Sprintf("Message: %v", message)
			}
		}
	case "game_move":
		if data, ok := msg.Data.(map[string]interface{}); ok {
			from, _ := data["from"].(string)
			to, _ := data["to"].(string)
			piece, _ := data["piece"].(string)
			dataStr = fmt.Sprintf("Move: %s %s->%s", piece, from, to)
		}
	case "avatar_position":
		if data, ok := msg.Data.(map[string]interface{}); ok {
			x, _ := data["x"].(float64)
			y, _ := data["y"].(float64)
			z, _ := data["z"].(float64)
			dataStr = fmt.Sprintf("Position: (%.1f, %.1f, %.1f)", x, y, z)
		}
	default:
		if dataBytes, err := json.Marshal(msg.Data); err == nil {
			dataStr = string(dataBytes)
			if len(dataStr) > 50 {
				dataStr = dataStr[:47] + "..."
			}
		}
	}

	if dataStr != "" {
		details = append(details, dataStr)
	}

	return strings.Join(details, " | ")
}
