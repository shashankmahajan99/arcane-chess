package main

import (
	"bufio"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	"github.com/gorilla/websocket"
)

type Message struct {
	Type     string      `json:"type"`
	Data     interface{} `json:"data"`
	UserID   string      `json:"user_id,omitempty"`
	Username string      `json:"username,omitempty"`
	Room     string      `json:"room,omitempty"`
}

func main() {
	if len(os.Args) < 2 {
		log.Fatal("Usage: go run chat_tester.go <websocket_url>")
	}

	wsURL := os.Args[1]
	if !strings.Contains(wsURL, "user_id") {
		wsURL += "?user_id=chat-tester&username=ChatUser"
	}

	fmt.Println("💬 Interactive Chat Tester")
	fmt.Println("==========================")
	fmt.Printf("🔗 Connecting to: %s\n\n", wsURL)

	// Connect to WebSocket
	conn, _, err := websocket.DefaultDialer.Dial(wsURL, nil)
	if err != nil {
		log.Fatal("Failed to connect:", err)
	}
	defer conn.Close()

	fmt.Println("✅ Connected! Welcome to the Chat Room")
	fmt.Println()

	// Start listening for messages
	go func() {
		for {
			_, message, err := conn.ReadMessage()
			if err != nil {
				log.Printf("❌ Read error: %v", err)
				return
			}

			var msg Message
			if err := json.Unmarshal(message, &msg); err == nil {
				switch msg.Type {
				case "chat":
					if data, ok := msg.Data.(map[string]interface{}); ok {
						username := data["username"]
						message := data["message"]
						timestamp := time.Now().Format("15:04:05")
						fmt.Printf("[%s] %s: %s\n", timestamp, username, message)
					}
				case "user_joined":
					if data, ok := msg.Data.(map[string]interface{}); ok {
						username := data["username"]
						fmt.Printf("👋 %s joined the chat\n", username)
					}
				case "user_left":
					if data, ok := msg.Data.(map[string]interface{}); ok {
						username := data["username"]
						fmt.Printf("👋 %s left the chat\n", username)
					}
				case "typing":
					if data, ok := msg.Data.(map[string]interface{}); ok {
						username := data["username"]
						typing := data["typing"]
						if typing == true {
							fmt.Printf("✏️  %s is typing...\n", username)
						}
					}
				case "connection_established":
					fmt.Printf("🤝 Connection established: %+v\n", msg.Data)
				default:
					fmt.Printf("📨 %s: %+v\n", msg.Type, msg.Data)
				}
			} else {
				fmt.Printf("📨 Raw message: %s\n", string(message))
			}
		}
	}()

	// Join a chat room
	joinMsg := Message{
		Type: "join_room",
		Data: map[string]interface{}{
			"room": "general",
		},
		UserID:   "chat-tester",
		Username: "ChatUser",
	}

	if err := conn.WriteJSON(joinMsg); err != nil {
		log.Printf("❌ Failed to join room: %v", err)
	} else {
		fmt.Println("✅ Joined chat room: general")
	}

	// Interactive commands
	scanner := bufio.NewScanner(os.Stdin)

	fmt.Println("\n💬 Chat Commands:")
	fmt.Println("  /join <room>     - Join a different room")
	fmt.Println("  /leave           - Leave current room")
	fmt.Println("  /typing          - Send typing indicator")
	fmt.Println("  /users           - List users in room")
	fmt.Println("  /help            - Show this help")
	fmt.Println("  /quit            - Exit")
	fmt.Println("  <message>        - Send a chat message")
	fmt.Println("\nStart typing messages or commands:")
	fmt.Print("chat> ")

	currentRoom := "general"

	for {
		if !scanner.Scan() {
			break
		}

		input := strings.TrimSpace(scanner.Text())
		if input == "" {
			fmt.Print("chat> ")
			continue
		}

		// Handle commands
		if strings.HasPrefix(input, "/") {
			parts := strings.Fields(input)
			command := parts[0]

			switch command {
			case "/join":
				if len(parts) < 2 {
					fmt.Println("❌ Usage: /join <room_name>")
				} else {
					newRoom := parts[1]
					joinMsg := Message{
						Type: "join_room",
						Data: map[string]interface{}{
							"room": newRoom,
						},
						UserID:   "chat-tester",
						Username: "ChatUser",
					}

					if err := conn.WriteJSON(joinMsg); err != nil {
						fmt.Printf("❌ Failed to join room: %v\n", err)
					} else {
						currentRoom = newRoom
						fmt.Printf("✅ Joined room: %s\n", newRoom)
					}
				}

			case "/leave":
				leaveMsg := Message{
					Type: "leave_room",
					Data: map[string]interface{}{
						"room": currentRoom,
					},
					UserID:   "chat-tester",
					Username: "ChatUser",
				}

				if err := conn.WriteJSON(leaveMsg); err != nil {
					fmt.Printf("❌ Failed to leave room: %v\n", err)
				} else {
					fmt.Printf("✅ Left room: %s\n", currentRoom)
				}

			case "/typing":
				typingMsg := Message{
					Type: "typing",
					Data: map[string]interface{}{
						"user_id":  "chat-tester",
						"username": "ChatUser",
						"typing":   true,
					},
					Room: currentRoom,
				}

				if err := conn.WriteJSON(typingMsg); err != nil {
					fmt.Printf("❌ Failed to send typing indicator: %v\n", err)
				} else {
					fmt.Println("✅ Sent typing indicator")
				}

			case "/users":
				usersMsg := Message{
					Type: "list_users",
					Data: map[string]interface{}{
						"room": currentRoom,
					},
					UserID:   "chat-tester",
					Username: "ChatUser",
				}

				if err := conn.WriteJSON(usersMsg); err != nil {
					fmt.Printf("❌ Failed to get user list: %v\n", err)
				} else {
					fmt.Printf("✅ Requested user list for room: %s\n", currentRoom)
				}

			case "/help":
				fmt.Println("\n💬 Chat Commands:")
				fmt.Println("  /join <room>     - Join a different room")
				fmt.Println("  /leave           - Leave current room")
				fmt.Println("  /typing          - Send typing indicator")
				fmt.Println("  /users           - List users in room")
				fmt.Println("  /help            - Show this help")
				fmt.Println("  /quit            - Exit")
				fmt.Println("  <message>        - Send a chat message")
				fmt.Printf("\n📍 Current room: %s\n", currentRoom)

			case "/quit", "/exit":
				fmt.Println("👋 Goodbye!")
				return

			default:
				fmt.Printf("❌ Unknown command: %s. Type '/help' for available commands.\n", command)
			}
		} else {
			// Send chat message
			chatMsg := Message{
				Type: "chat",
				Data: map[string]interface{}{
					"user_id":  "chat-tester",
					"username": "ChatUser",
					"message":  input,
					"room":     currentRoom,
				},
				Room: currentRoom,
			}

			if err := conn.WriteJSON(chatMsg); err != nil {
				fmt.Printf("❌ Failed to send message: %v\n", err)
			}
		}

		fmt.Print("chat> ")
	}
}
