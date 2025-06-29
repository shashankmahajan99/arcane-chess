package services

import (
	"encoding/json"
	"log"
	"sync"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

type Client struct {
	ID     string
	UserID string
	Conn   *websocket.Conn
	Send   chan []byte
	Hub    *Hub
}

type Hub struct {
	// Registered clients
	Clients map[*Client]bool

	// Register requests from the clients
	Register chan *Client

	// Unregister requests from clients
	Unregister chan *Client

	// Inbound messages from the clients
	Broadcast chan []byte

	// Room-based messaging
	Rooms map[string]map[*Client]bool
	mutex sync.RWMutex
}

type Message struct {
	Type     string      `json:"type"`
	Data     interface{} `json:"data"`
	Room     string      `json:"room,omitempty"`
	UserID   string      `json:"user_id,omitempty"`
	Username string      `json:"username,omitempty"`
}

// Game-specific message types
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

func NewHub() *Hub {
	return &Hub{
		Clients:    make(map[*Client]bool),
		Register:   make(chan *Client),
		Unregister: make(chan *Client),
		Broadcast:  make(chan []byte),
		Rooms:      make(map[string]map[*Client]bool),
	}
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.Register:
			h.mutex.Lock()
			h.Clients[client] = true
			h.mutex.Unlock()
			
			log.Printf("Client %s connected", client.ID)
			
			// Send connection confirmation
			message := Message{
				Type: "connection_established",
				Data: map[string]string{
					"client_id": client.ID,
					"status":    "connected",
				},
			}
			h.SendToClient(client, message)

		case client := <-h.Unregister:
			h.mutex.Lock()
			if _, ok := h.Clients[client]; ok {
				delete(h.Clients, client)
				close(client.Send)
				
				// Remove from all rooms
				for roomID, clients := range h.Rooms {
					if _, exists := clients[client]; exists {
						delete(clients, client)
						if len(clients) == 0 {
							delete(h.Rooms, roomID)
						}
					}
				}
			}
			h.mutex.Unlock()
			
			log.Printf("Client %s disconnected", client.ID)

		case message := <-h.Broadcast:
			h.mutex.RLock()
			for client := range h.Clients {
				select {
				case client.Send <- message:
				default:
					close(client.Send)
					delete(h.Clients, client)
				}
			}
			h.mutex.RUnlock()
		}
	}
}

func (h *Hub) JoinRoom(client *Client, roomID string) {
	h.mutex.Lock()
	defer h.mutex.Unlock()
	
	if h.Rooms[roomID] == nil {
		h.Rooms[roomID] = make(map[*Client]bool)
	}
	h.Rooms[roomID][client] = true
	
	log.Printf("Client %s joined room %s", client.ID, roomID)
}

func (h *Hub) LeaveRoom(client *Client, roomID string) {
	h.mutex.Lock()
	defer h.mutex.Unlock()
	
	if room, exists := h.Rooms[roomID]; exists {
		delete(room, client)
		if len(room) == 0 {
			delete(h.Rooms, roomID)
		}
	}
	
	log.Printf("Client %s left room %s", client.ID, roomID)
}

func (h *Hub) BroadcastToRoom(roomID string, message Message) {
	h.mutex.RLock()
	defer h.mutex.RUnlock()
	
	if room, exists := h.Rooms[roomID]; exists {
		messageBytes, err := json.Marshal(message)
		if err != nil {
			log.Printf("Error marshaling message: %v", err)
			return
		}
		
		for client := range room {
			select {
			case client.Send <- messageBytes:
			default:
				close(client.Send)
				delete(room, client)
			}
		}
	}
}

func (h *Hub) SendToClient(client *Client, message Message) {
	messageBytes, err := json.Marshal(message)
	if err != nil {
		log.Printf("Error marshaling message: %v", err)
		return
	}
	
	select {
	case client.Send <- messageBytes:
	default:
		close(client.Send)
		h.mutex.Lock()
		delete(h.Clients, client)
		h.mutex.Unlock()
	}
}

func (c *Client) WritePump() {
	defer func() {
		c.Conn.Close()
	}()
	
	for {
		select {
		case message, ok := <-c.Send:
			if !ok {
				c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}
			
			if err := c.Conn.WriteMessage(websocket.TextMessage, message); err != nil {
				log.Printf("Error writing message: %v", err)
				return
			}
		}
	}
}

func (c *Client) ReadPump() {
	defer func() {
		c.Hub.Unregister <- c
		c.Conn.Close()
	}()
	
	for {
		_, messageBytes, err := c.Conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WebSocket error: %v", err)
			}
			break
		}
		
		var message Message
		if err := json.Unmarshal(messageBytes, &message); err != nil {
			log.Printf("Error unmarshaling message: %v", err)
			continue
		}
		
		// Set user info from client
		message.UserID = c.UserID
		
		c.HandleMessage(message)
	}
}

func (c *Client) HandleMessage(message Message) {
	switch message.Type {
	case "join_room":
		if roomData, ok := message.Data.(map[string]interface{}); ok {
			if roomID, ok := roomData["room_id"].(string); ok {
				c.Hub.JoinRoom(c, roomID)
			}
		}
		
	case "leave_room":
		if roomData, ok := message.Data.(map[string]interface{}); ok {
			if roomID, ok := roomData["room_id"].(string); ok {
				c.Hub.LeaveRoom(c, roomID)
			}
		}
		
	case "game_move":
		// Handle chess move
		if message.Room != "" {
			c.Hub.BroadcastToRoom(message.Room, message)
		}
		
	case "avatar_position":
		// Handle avatar position update
		if message.Room != "" {
			c.Hub.BroadcastToRoom(message.Room, message)
		}
		
	case "chat_message":
		// Handle chat message
		if message.Room != "" {
			c.Hub.BroadcastToRoom(message.Room, message)
		}
		
	case "avatar_animation":
		// Handle avatar animation
		if message.Room != "" {
			c.Hub.BroadcastToRoom(message.Room, message)
		}
		
	default:
		log.Printf("Unknown message type: %s", message.Type)
	}
}

// WebSocket manager service
type WebSocketManager struct {
	Hub *Hub
}

func NewWebSocketManager() *WebSocketManager {
	hub := NewHub()
	go hub.Run()
	
	return &WebSocketManager{
		Hub: hub,
	}
}

func (wsm *WebSocketManager) HandleConnection(conn *websocket.Conn, userID, username string) {
	client := &Client{
		ID:     uuid.New().String(),
		UserID: userID,
		Conn:   conn,
		Send:   make(chan []byte, 256),
		Hub:    wsm.Hub,
	}
	
	client.Hub.Register <- client
	
	// Start goroutines for reading and writing
	go client.WritePump()
	go client.ReadPump()
}