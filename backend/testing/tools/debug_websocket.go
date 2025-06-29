package main

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/gorilla/websocket"
)

func main() {
	if len(os.Args) < 2 {
		log.Fatal("Usage: go run debug_websocket.go <websocket_url>")
	}

	wsURL := os.Args[1]
	if wsURL == "" {
		wsURL = "ws://localhost:8080/ws?user_id=debug-user&username=DebugUser"
	}

	fmt.Println("🐛 WebSocket Debug Client")
	fmt.Println("========================")
	fmt.Printf("🔗 Connecting to: %s\n\n", wsURL)

	// Connect to WebSocket
	conn, _, err := websocket.DefaultDialer.Dial(wsURL, nil)
	if err != nil {
		log.Fatal("Failed to connect:", err)
	}
	defer conn.Close()

	fmt.Println("✅ Connected! Listening for messages...")
	fmt.Println("📤 Sending test chat message in 2 seconds...")

	// Start message reader
	go func() {
		for {
			var message map[string]interface{}
			err := conn.ReadJSON(&message)
			if err != nil {
				log.Printf("Read error: %v\n", err)
				break
			}

			// Pretty print the received message
			messageBytes, _ := json.MarshalIndent(message, "", "  ")
			fmt.Printf("\n📥 RECEIVED MESSAGE:\n%s\n", string(messageBytes))
		}
	}()

	// Wait a bit, then send a test message
	time.Sleep(2 * time.Second)

	// First, join a room
	joinMessage := map[string]interface{}{
		"type": "join_room",
		"data": map[string]interface{}{
			"room_id": "test-room",
		},
	}

	fmt.Printf("\n📤 SENDING JOIN MESSAGE:\n")
	joinBytes, _ := json.MarshalIndent(joinMessage, "", "  ")
	fmt.Printf("%s\n", string(joinBytes))

	if err := conn.WriteJSON(joinMessage); err != nil {
		log.Printf("Write error: %v\n", err)
	}

	time.Sleep(1 * time.Second)

	// Send a chat message
	chatMessage := map[string]interface{}{
		"type": "chat_message",
		"data": map[string]interface{}{
			"user_id":  "debug-user",
			"username": "DebugUser",
			"message":  "Hello from debug client!",
			"room":     "test-room",
		},
		"room": "test-room",
	}

	fmt.Printf("\n📤 SENDING CHAT MESSAGE:\n")
	chatBytes, _ := json.MarshalIndent(chatMessage, "", "  ")
	fmt.Printf("%s\n", string(chatBytes))

	if err := conn.WriteJSON(chatMessage); err != nil {
		log.Printf("Write error: %v\n", err)
	}

	// Keep listening for a few more seconds
	fmt.Println("\n⏳ Listening for responses for 5 seconds...")
	time.Sleep(5 * time.Second)

	fmt.Println("\n👋 Debug session complete!")
}
