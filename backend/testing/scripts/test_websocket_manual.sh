#!/bin/bash

echo "🔧 Testing WebSocket Connection to Backend"
echo "=========================================="

# Test the health endpoint first
echo "📡 Testing Health Endpoint..."
HEALTH_RESPONSE=$(curl -s http://localhost:8080/health)
echo "Health Response: $HEALTH_RESPONSE"

if [[ $HEALTH_RESPONSE == *"ok"* ]]; then
    echo "✅ Backend is running!"
else
    echo "❌ Backend is not responding properly"
    exit 1
fi

echo ""
echo "🔌 Testing WebSocket Connection..."

# Use websocat if available, or provide alternative testing method
if command -v websocat &> /dev/null; then
    echo "Using websocat to test WebSocket connection..."
    echo '{"type":"test","payload":{"message":"Hello from test script"}}' | websocat "ws://localhost:8080/ws?user_id=test-script&username=TestScript"
else
    echo "websocat not found. Install with: brew install websocat"
    echo "Or use the browser frontend to test the WebSocket connection."
fi

echo ""
echo "🌐 Frontend should connect to: ws://localhost:8080/ws"
echo "📋 Required URL parameters: user_id and username"
echo "💡 Example: ws://localhost:8080/ws?user_id=test-user&username=TestUser"
