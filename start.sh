#!/bin/bash

echo "🚀 Starting University Management System"
echo "========================================"

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "❌ Virtual environment not found. Please run: python -m venv venv"
    exit 1
fi

# Activate virtual environment
echo "📦 Activating virtual environment..."
source venv/bin/activate

# Install dependencies if needed
if [ ! -d "venv/lib/python3.13/site-packages/fastapi" ]; then
    echo "📥 Installing dependencies..."
    pip install -r requirements.txt
fi

# Start backend
echo "🔧 Starting backend server..."
cd backend
uvicorn main:app --reload --port 8000 &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start frontend
echo "🎨 Starting frontend server..."
cd ../frontend
npm start &
FRONTEND_PID=$!

echo ""
echo "✅ System started successfully!"
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:8000"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for user to stop
wait
