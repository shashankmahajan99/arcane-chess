#!/bin/bash

# Interactive Chat Tester
# Tests chat functionality, room messaging, and real-time communication

cd "$(dirname "$0")/../interactive" || exit 1

echo "💬 Starting Interactive Chat Tester"
echo "==================================="
echo ""
echo "This tool allows you to:"
echo "  💬 Send and receive chat messages"
echo "  🏠 Join and leave chat rooms"
echo "  📡 Test real-time message broadcasting"
echo "  ⌨️  Test typing indicators"
echo ""

# Default WebSocket URL
WS_URL="ws://localhost:8080/ws"

# Check if custom URL provided
if [ $# -gt 0 ]; then
    WS_URL="$1"
fi

echo "🔗 Connecting to: $WS_URL"
echo ""

# Run the chat tester
go run chat_tester.go "$WS_URL"
