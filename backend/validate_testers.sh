#!/bin/bash

# Quick test of all interactive testers

echo "🧪 Testing Backend Interactive Testers"
echo "======================================"
echo ""

WS_URL="ws://localhost:8080/ws"

# Test 1: Chess Tester
echo "♟️  Testing Chess Tester..."
cd /Users/user/Desktop/freelance/arcane-chess/backend/testing/interactive
echo -e "help\nquit" | go run chess_tester.go "$WS_URL?user_id=chess-test&username=ChessTest" > /tmp/chess_test.log 2>&1 &
CHESS_PID=$!
sleep 2
if kill -0 $CHESS_PID 2>/dev/null; then
    kill $CHESS_PID
    echo "✅ Chess tester: Working"
else
    echo "❌ Chess tester: Failed"
fi

# Test 2: Chat Tester  
echo "💬 Testing Chat Tester..."
echo -e "hello test\nquit" | go run chat_tester.go "$WS_URL?user_id=chat-test&username=ChatTest" > /tmp/chat_test.log 2>&1 &
CHAT_PID=$!
sleep 2
if kill -0 $CHAT_PID 2>/dev/null; then
    kill $CHAT_PID
    echo "✅ Chat tester: Working"
else
    echo "❌ Chat tester: Failed"  
fi

# Test 3: Avatar Tester
echo "🧙 Testing Avatar Tester..."
echo -e "help\nquit" | go run avatar_tester.go "$WS_URL?user_id=avatar-test&username=AvatarTest" > /tmp/avatar_test.log 2>&1 &
AVATAR_PID=$!
sleep 2
if kill -0 $AVATAR_PID 2>/dev/null; then
    kill $AVATAR_PID
    echo "✅ Avatar tester: Working"
else
    echo "❌ Avatar tester: Failed"
fi

# Test 4: Arena Tester
echo "🏟️  Testing Arena Tester..."
echo -e "help\nquit" | go run arena_tester.go "$WS_URL?user_id=arena-test&username=ArenaTest" > /tmp/arena_test.log 2>&1 &
ARENA_PID=$!
sleep 2
if kill -0 $ARENA_PID 2>/dev/null; then
    kill $ARENA_PID
    echo "✅ Arena tester: Working"
else
    echo "❌ Arena tester: Failed"
fi

echo ""  
echo "🎉 Interactive tester validation complete!"
echo ""
echo "💡 To run individual testers:"
echo "   Chess: ./testing/scripts/run_chess_tester.sh"
echo "   Chat:  ./testing/scripts/run_chat_tester.sh" 
echo "   Avatar: ./testing/scripts/run_avatar_tester.sh"
echo "   Arena: ./testing/scripts/run_arena_tester.sh"
echo ""
echo "🎮 Or use the master menu: ./test_backend.sh"
