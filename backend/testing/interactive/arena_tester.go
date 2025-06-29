package main

import (
	"bufio"
	"fmt"
	"log"
	"os"
	"strings"

	"github.com/gorilla/websocket"
)

type ArenaMessage struct {
	Type string `json:"type"`
	Data struct {
		ArenaID     string `json:"arena_id"`
		ArenaName   string `json:"arena_name"`
		Theme       string `json:"theme"`
		MaxPlayers  int    `json:"max_players"`
		MaxGames    int    `json:"max_games"`
		IsPublic    bool   `json:"is_public"`
		Description string `json:"description"`
	} `json:"data"`
	Room string `json:"room"`
}

type RoomMessage struct {
	Type string `json:"type"`
	Data struct {
		RoomID   string `json:"room_id"`
		Action   string `json:"action"`
		UserID   string `json:"user_id"`
		Username string `json:"username"`
	} `json:"data"`
}

type Message struct {
	Type     string      `json:"type"`
	Data     interface{} `json:"data"`
	UserID   string      `json:"user_id,omitempty"`
	Username string      `json:"username,omitempty"`
	Room     string      `json:"room,omitempty"`
}

var (
	currentRoom     = ""
	currentUsername = "ArenaManager"
	currentUserID   = "arena-manager-001"
	joinedRooms     = make(map[string]bool)
)

func main() {
	if len(os.Args) < 2 {
		log.Fatal("Usage: go run arena_tester.go <websocket_url>")
	}

	wsURL := os.Args[1]
	if !strings.Contains(wsURL, "user_id") {
		wsURL += fmt.Sprintf("?user_id=%s&username=%s", currentUserID, currentUsername)
	}

	fmt.Println("🏟️  Interactive Arena & Room Management Tester")
	fmt.Println("==============================================")
	fmt.Printf("🔗 Connecting to: %s\n", wsURL)
	fmt.Printf("👤 User: %s (%s)\n\n", currentUsername, currentUserID)

	// Connect to WebSocket
	conn, _, err := websocket.DefaultDialer.Dial(wsURL, nil)
	if err != nil {
		log.Fatal("Failed to connect:", err)
	}
	defer conn.Close()

	// Start message reader in background
	go readMessages(conn)

	// Main interaction loop
	scanner := bufio.NewScanner(os.Stdin)
	showMenu()

	for {
		fmt.Print("\n🎮 Enter command: ")
		if !scanner.Scan() {
			break
		}

		input := strings.TrimSpace(scanner.Text())
		if input == "" {
			continue
		}

		parts := strings.Fields(input)
		command := strings.ToLower(parts[0])

		switch command {
		case "help", "h":
			showMenu()

		case "join", "j":
			handleJoinCommand(conn, parts[1:])

		case "leave", "l":
			handleLeaveCommand(conn, parts[1:])

		case "create", "c":
			handleCreateArenaCommand(conn, parts[1:])

		case "list", "ls":
			handleListCommand(conn)

		case "switch", "s":
			handleSwitchCommand(conn, parts[1:])

		case "broadcast", "b":
			handleBroadcastCommand(conn, parts[1:])

		case "status", "st":
			showStatus()

		case "rooms":
			showJoinedRooms()

		case "explore", "e":
			handleExploreCommand(conn, parts[1:])

		case "quit", "q", "exit":
			fmt.Println("👋 Goodbye!")
			return

		default:
			fmt.Printf("❌ Unknown command: %s\n", command)
			fmt.Println("💡 Type 'help' to see available commands")
		}
	}
}

func showMenu() {
	fmt.Println("\n📋 Available Commands:")
	fmt.Println("🏠 Room Management:")
	fmt.Println("  join <room_id>        - Join a room/arena")
	fmt.Println("  leave <room_id>       - Leave a room/arena")
	fmt.Println("  switch <room_id>      - Switch active room")
	fmt.Println("  list                  - Request list of available arenas")
	fmt.Println("")
	fmt.Println("🏗️  Arena Creation:")
	fmt.Println("  create <name> <theme> - Create new arena")
	fmt.Println("    Themes: classic, mystic, future, nature, fire, ice")
	fmt.Println("")
	fmt.Println("📡 Communication:")
	fmt.Println("  broadcast <message>   - Send message to current room")
	fmt.Println("  explore <area>        - Explore area (lobby, games, chat)")
	fmt.Println("")
	fmt.Println("📊 Info:")
	fmt.Println("  status                - Show current status")
	fmt.Println("  rooms                 - Show joined rooms")
	fmt.Println("  help                  - Show this menu")
	fmt.Println("  quit                  - Exit tester")
}

func handleJoinCommand(conn *websocket.Conn, args []string) {
	if len(args) < 1 {
		fmt.Println("❌ Usage: join <room_id>")
		return
	}

	roomID := args[0]

	joinMsg := Message{
		Type: "join_room",
		Data: map[string]interface{}{
			"room_id": roomID,
		},
	}

	if err := conn.WriteJSON(joinMsg); err != nil {
		fmt.Printf("❌ Failed to join room: %v\n", err)
		return
	}

	joinedRooms[roomID] = true
	if currentRoom == "" {
		currentRoom = roomID
	}

	fmt.Printf("🚪 Joining room: %s\n", roomID)
}

func handleLeaveCommand(conn *websocket.Conn, args []string) {
	if len(args) < 1 {
		fmt.Println("❌ Usage: leave <room_id>")
		return
	}

	roomID := args[0]

	leaveMsg := Message{
		Type: "leave_room",
		Data: map[string]interface{}{
			"room_id": roomID,
		},
	}

	if err := conn.WriteJSON(leaveMsg); err != nil {
		fmt.Printf("❌ Failed to leave room: %v\n", err)
		return
	}

	delete(joinedRooms, roomID)
	if currentRoom == roomID {
		currentRoom = ""
		for room := range joinedRooms {
			currentRoom = room
			break
		}
	}

	fmt.Printf("🚪 Left room: %s\n", roomID)
}

func handleCreateArenaCommand(conn *websocket.Conn, args []string) {
	if len(args) < 2 {
		fmt.Println("❌ Usage: create <name> <theme>")
		fmt.Println("   Themes: classic, mystic, future, nature, fire, ice")
		return
	}

	name := args[0]
	theme := args[1]

	validThemes := []string{"classic", "mystic", "future", "nature", "fire", "ice"}
	valid := false
	for _, vt := range validThemes {
		if strings.ToLower(theme) == vt {
			valid = true
			theme = vt
			break
		}
	}

	if !valid {
		fmt.Printf("❌ Invalid theme. Choose from: %s\n", strings.Join(validThemes, ", "))
		return
	}

	createMsg := Message{
		Type: "create_arena",
		Data: map[string]interface{}{
			"name":        name,
			"theme":       theme,
			"max_players": 100,
			"max_games":   10,
			"is_public":   true,
			"description": fmt.Sprintf("Arena created by %s", currentUsername),
		},
	}

	if err := conn.WriteJSON(createMsg); err != nil {
		fmt.Printf("❌ Failed to create arena: %v\n", err)
		return
	}

	fmt.Printf("🏗️  Creating arena '%s' with theme '%s'\n", name, theme)
}

func handleListCommand(conn *websocket.Conn) {
	listMsg := Message{
		Type: "list_arenas",
		Data: map[string]interface{}{
			"request_type": "available_arenas",
		},
	}

	if err := conn.WriteJSON(listMsg); err != nil {
		fmt.Printf("❌ Failed to request arena list: %v\n", err)
		return
	}

	fmt.Println("📋 Requesting list of available arenas...")
}

func handleSwitchCommand(conn *websocket.Conn, args []string) {
	if len(args) < 1 {
		fmt.Println("❌ Usage: switch <room_id>")
		return
	}

	roomID := args[0]

	if !joinedRooms[roomID] {
		fmt.Printf("❌ You're not in room '%s'. Join it first.\n", roomID)
		return
	}

	currentRoom = roomID
	fmt.Printf("🔄 Switched active room to: %s\n", roomID)
}

func handleBroadcastCommand(conn *websocket.Conn, args []string) {
	if currentRoom == "" {
		fmt.Println("❌ No active room. Join a room first.")
		return
	}

	if len(args) < 1 {
		fmt.Println("❌ Usage: broadcast <message>")
		return
	}

	message := strings.Join(args, " ")

	broadcastMsg := Message{
		Type: "room_announcement",
		Data: map[string]interface{}{
			"user_id":  currentUserID,
			"username": currentUsername,
			"message":  message,
			"type":     "announcement",
		},
		Room: currentRoom,
	}

	if err := conn.WriteJSON(broadcastMsg); err != nil {
		fmt.Printf("❌ Failed to broadcast message: %v\n", err)
		return
	}

	fmt.Printf("📢 Broadcasted to room '%s': %s\n", currentRoom, message)
}

func handleExploreCommand(conn *websocket.Conn, args []string) {
	if len(args) < 1 {
		fmt.Println("❌ Usage: explore <area>")
		fmt.Println("   Areas: lobby, games, chat, leaderboard")
		return
	}

	area := args[0]

	exploreMsg := Message{
		Type: "explore_area",
		Data: map[string]interface{}{
			"user_id":  currentUserID,
			"username": currentUsername,
			"area":     area,
		},
	}

	if err := conn.WriteJSON(exploreMsg); err != nil {
		fmt.Printf("❌ Failed to explore area: %v\n", err)
		return
	}

	fmt.Printf("🗺️  Exploring area: %s\n", area)
}

func showStatus() {
	fmt.Println("\n📊 Current Status:")
	fmt.Printf("  👤 User: %s (%s)\n", currentUsername, currentUserID)
	fmt.Printf("  🏠 Active Room: %s\n", currentRoom)
	fmt.Printf("  📊 Joined Rooms: %d\n", len(joinedRooms))
}

func showJoinedRooms() {
	fmt.Println("\n🏠 Joined Rooms:")
	if len(joinedRooms) == 0 {
		fmt.Println("  No rooms joined yet")
		return
	}

	i := 1
	for roomID := range joinedRooms {
		marker := ""
		if roomID == currentRoom {
			marker = " (active)"
		}
		fmt.Printf("  %d. %s%s\n", i, roomID, marker)
		i++
	}
}

func readMessages(conn *websocket.Conn) {
	for {
		var message Message
		err := conn.ReadJSON(&message)
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WebSocket error: %v", err)
			}
			break
		}

		// Display received messages
		switch message.Type {
		case "connection_established":
			fmt.Printf("✅ Connected successfully!\n")

		case "room_joined":
			if data, ok := message.Data.(map[string]interface{}); ok {
				roomID, _ := data["room_id"].(string)
				userCount, _ := data["user_count"].(float64)
				fmt.Printf("🎉 Successfully joined room '%s' (%d users online)\n", roomID, int(userCount))
			}

		case "room_left":
			if data, ok := message.Data.(map[string]interface{}); ok {
				roomID, _ := data["room_id"].(string)
				fmt.Printf("👋 Left room '%s'\n", roomID)
			}

		case "user_joined":
			if data, ok := message.Data.(map[string]interface{}); ok {
				username, _ := data["username"].(string)
				roomID, _ := data["room_id"].(string)
				if username != currentUsername {
					fmt.Printf("👥 %s joined room '%s'\n", username, roomID)
				}
			}

		case "user_left":
			if data, ok := message.Data.(map[string]interface{}); ok {
				username, _ := data["username"].(string)
				roomID, _ := data["room_id"].(string)
				if username != currentUsername {
					fmt.Printf("👋 %s left room '%s'\n", username, roomID)
				}
			}

		case "arena_list":
			if data, ok := message.Data.(map[string]interface{}); ok {
				if arenas, ok := data["arenas"].([]interface{}); ok {
					fmt.Println("\n🏟️  Available Arenas:")
					for i, arena := range arenas {
						if arenaData, ok := arena.(map[string]interface{}); ok {
							name, _ := arenaData["name"].(string)
							theme, _ := arenaData["theme"].(string)
							players, _ := arenaData["current_players"].(float64)
							maxPlayers, _ := arenaData["max_players"].(float64)
							fmt.Printf("  %d. %s (%s theme) - %d/%d players\n",
								i+1, name, theme, int(players), int(maxPlayers))
						}
					}
				}
			}

		case "arena_created":
			if data, ok := message.Data.(map[string]interface{}); ok {
				arenaName, _ := data["name"].(string)
				arenaID, _ := data["arena_id"].(string)
				fmt.Printf("🎉 Arena '%s' created successfully! ID: %s\n", arenaName, arenaID)
			}

		case "room_announcement":
			if data, ok := message.Data.(map[string]interface{}); ok {
				username, _ := data["username"].(string)
				msg, _ := data["message"].(string)
				if username != currentUsername {
					fmt.Printf("📢 [%s]: %s\n", username, msg)
				}
			}

		case "explore_result":
			if data, ok := message.Data.(map[string]interface{}); ok {
				area, _ := data["area"].(string)
				info, _ := data["info"].(string)
				fmt.Printf("🗺️  [%s]: %s\n", area, info)
			}

		default:
			fmt.Printf("📨 Received: %s\n", message.Type)
		}
	}
}
