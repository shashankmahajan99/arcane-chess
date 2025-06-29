#!/bin/bash

# Interactive Avatar Movement & Customization Tester
# Tests avatar positioning, movement, and appearance changes

cd "$(dirname "$0")/../interactive" || exit 1

echo "🧙 Starting Interactive Avatar Tester"
echo "====================================="
echo ""
echo "This tool allows you to:"
echo "  🏃‍♂️ Move avatars in 3D space"
echo "  🔄 Test rotation and positioning"
echo "  🎨 Customize avatar appearance"
echo "  🎭 Trigger avatar animations"
echo "  📡 Broadcast position updates"
echo ""

# Default WebSocket URL
WS_URL="ws://localhost:8080/ws"

# Check if custom URL provided
if [ $# -gt 0 ]; then
    WS_URL="$1"
fi

echo "🔗 Connecting to: $WS_URL"
echo ""

# Run the avatar tester
go run avatar_tester.go "$WS_URL"
