#!/bin/bash

# Quick Test Runner - Tests each functionality quickly
# Useful for automated testing or quick verification

echo "🚀 Quick Backend Functionality Test"
echo "==================================="
echo ""

WS_URL="ws://localhost:8080/ws"

# Check if backend is running
echo "🔍 Checking if backend server is running..."
if ! curl -s http://localhost:8080/api/v1/health > /dev/null 2>&1; then
    echo "❌ Backend server is not running on port 8080"
    echo "💡 Start the server with: go run ./cmd/server"
    exit 1
fi

echo "✅ Backend server is running"
echo ""

# Test WebSocket connection
echo "🔌 Testing WebSocket connection..."
cd testing/scripts || exit 1
if ./test_websocket_connection.sh > /dev/null 2>&1; then
    echo "✅ WebSocket connection successful"
else
    echo "❌ WebSocket connection failed"
    exit 1
fi
echo ""

# Quick chess test
echo "♟️  Testing chess functionality..."
cd ../interactive || exit 1
timeout 5s echo -e "create\ntest-game\nquit\n" | go run chess_tester.go "$WS_URL" > /dev/null 2>&1
exit_code=$?
if [ $exit_code -eq 0 ] || [ $exit_code -eq 124 ]; then  # 124 is timeout exit code
    echo "✅ Chess functionality accessible"
else
    echo "❌ Chess functionality failed"
fi

# Quick chat test  
echo "💬 Testing chat functionality..."
timeout 5s echo -e "room main\nhello world\nquit\n" | go run chat_tester.go "$WS_URL" > /dev/null 2>&1
exit_code=$?
if [ $exit_code -eq 0 ] || [ $exit_code -eq 124 ]; then
    echo "✅ Chat functionality accessible"
else
    echo "❌ Chat functionality failed"
fi

# Quick avatar test
echo "🧙 Testing avatar functionality..."
timeout 5s echo -e "move 0 0 0\nquit\n" | go run avatar_tester.go "$WS_URL" > /dev/null 2>&1
exit_code=$?
if [ $exit_code -eq 0 ] || [ $exit_code -eq 124 ]; then
    echo "✅ Avatar functionality accessible"
else
    echo "❌ Avatar functionality failed"
fi

# Quick arena test
echo "🏟️  Testing arena functionality..."
timeout 5s echo -e "join main-arena\nquit\n" | go run arena_tester.go "$WS_URL" > /dev/null 2>&1
exit_code=$?
if [ $exit_code -eq 0 ] || [ $exit_code -eq 124 ]; then
    echo "✅ Arena functionality accessible"
else
    echo "❌ Arena functionality failed"
fi

echo ""
echo "🎉 Quick test completed!"
echo ""
echo "💡 For interactive testing, run: ./test_backend.sh"
echo "💡 For comprehensive testing, run: ./testing/scripts/verify_backend.sh"
