#!/bin/bash

# Interactive Arena & Room Management Tester
# Tests arena creation, room management, and multi-room functionality

cd "$(dirname "$0")/../interactive" || exit 1

echo "🏟️  Starting Interactive Arena & Room Tester"
echo "============================================="
echo ""
echo "This tool allows you to:"
echo "  🏠 Join and leave rooms/arenas"
echo "  🏗️  Create new arenas with themes"
echo "  📋 List available arenas"
echo "  📡 Broadcast messages to rooms"
echo "  🗺️  Explore different areas"
echo ""

# Default WebSocket URL
WS_URL="ws://localhost:8080/ws"

# Check if custom URL provided
if [ $# -gt 0 ]; then
    WS_URL="$1"
fi

echo "🔗 Connecting to: $WS_URL"
echo ""

# Run the arena tester
go run arena_tester.go "$WS_URL"
