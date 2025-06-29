#!/bin/bash

# Interactive Chess Game Tester
# Tests chess moves, game creation, joining games, and move validation

cd "$(dirname "$0")/../interactive" || exit 1

echo "🏁 Starting Interactive Chess Game Tester"
echo "========================================"
echo ""
echo "This tool allows you to:"
echo "  ♟️  Create and join chess games"
echo "  🎯 Make chess moves interactively"
echo "  📊 Query game status and board state"
echo "  🔄 Test move validation"
echo ""

# Default WebSocket URL
WS_URL="ws://localhost:8080/ws"

# Check if custom URL provided
if [ $# -gt 0 ]; then
    WS_URL="$1"
fi

echo "🔗 Connecting to: $WS_URL"
echo ""

# Run the chess tester
go run chess_tester.go "$WS_URL"
