#!/bin/bash

# Master Interactive Testing Script
# Provides a menu to run different backend functionality testers

echo "🎮 Arcane Chess Backend Interactive Testing Suite"
echo "=================================================="
echo ""
echo "Choose a testing module:"
echo ""
echo "1. ♟️  Chess Game Tester       - Test chess moves, game creation, joining"
echo "2. 💬 Chat Tester             - Test messaging, rooms, real-time chat"
echo "3. 🧙 Avatar Tester           - Test avatar movement, positioning, customization"
echo "4. 🏟️  Arena & Room Tester    - Test room management, arena creation"
echo "5. 🔧 WebSocket Tools         - Visual simulators and stress tests"
echo "6. ✅ Verify Backend          - Run comprehensive backend verification"
echo "7. 🌐 Frontend Test Tool      - Open HTML testing interface"
echo ""
echo "0. ❌ Exit"
echo ""

# Get user choice
read -p "Enter your choice (0-7): " choice

case $choice in
    1)
        echo ""
        echo "🏁 Starting Chess Game Tester..."
        ./testing/scripts/run_chess_tester.sh
        ;;
    2)
        echo ""
        echo "💬 Starting Chat Tester..."
        ./testing/scripts/run_chat_tester.sh
        ;;
    3)
        echo ""
        echo "🧙 Starting Avatar Tester..."
        ./testing/scripts/run_avatar_tester.sh
        ;;
    4)
        echo ""
        echo "🏟️  Starting Arena & Room Tester..."
        ./testing/scripts/run_arena_tester.sh
        ;;
    5)
        echo ""
        echo "🔧 WebSocket Tools Menu:"
        echo "  a) Visual WebSocket Simulator"
        echo "  b) WebSocket Stress Test"
        echo "  c) Minimal WebSocket Server"
        echo ""
        read -p "Choose tool (a/b/c): " tool_choice
        case $tool_choice in
            a)
                echo "🎯 Starting Visual WebSocket Simulator..."
                cd testing/tools || exit 1
                go run visual_websocket_simulator.go ws://localhost:8080/ws
                ;;
            b)
                echo "⚡ Starting WebSocket Stress Test..."
                cd testing/tools || exit 1
                go run test_websocket_server.go ws://localhost:8080/ws 10
                ;;
            c)
                echo "🔌 Starting Minimal WebSocket Server..."
                cd testing/tools || exit 1
                go run minimal_websocket_server.go
                ;;
            *)
                echo "❌ Invalid choice"
                ;;
        esac
        ;;
    6)
        echo ""
        echo "✅ Running Backend Verification..."
        ./testing/scripts/verify_backend.sh
        ;;
    7)
        echo ""
        echo "🌐 Opening Frontend Test Tool..."
        if command -v open >/dev/null 2>&1; then
            open testing/tools/frontend_test.html
        elif command -v xdg-open >/dev/null 2>&1; then
            xdg-open testing/tools/frontend_test.html
        else
            echo "Please open testing/tools/frontend_test.html in your browser"
        fi
        ;;
    0)
        echo ""
        echo "👋 Goodbye!"
        exit 0
        ;;
    *)
        echo ""
        echo "❌ Invalid choice. Please enter a number between 0-7."
        ;;
esac

echo ""
echo "🔄 Test completed. Run './test_backend.sh' again to test another module."
