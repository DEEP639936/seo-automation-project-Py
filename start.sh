#!/bin/bash

# SEO Automation System - Complete Runner Script
# This script starts both backend and frontend simultaneously

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  SEO Automation System - Launcher      ${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check prerequisites
check_prereq() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}ERROR: $1 is not installed.${NC}"
        echo "Please install $1 and try again."
        exit 1
    fi
}

echo -e "${YELLOW}Checking prerequisites...${NC}"
check_prereq python3
check_prereq node
check_prereq npm
echo -e "${GREEN}All prerequisites found!${NC}"
echo ""

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}Shutting down services...${NC}"
    if [ -n "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
    fi
    if [ -n "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
    fi
    echo -e "${GREEN}Done!${NC}"
}
trap cleanup EXIT INT TERM

# Setup Backend
echo -e "${BLUE}[1/4] Setting up Backend...${NC}"
cd backend

if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

echo "Activating virtual environment..."
source venv/bin/activate

echo "Installing backend dependencies..."
pip install -q -r requirements.txt

# Install playwright if not already installed
if ! python -c "import playwright" 2>/dev/null; then
    echo "Installing Playwright browsers..."
    playwright install chromium
fi

# Create .env if not exists
if [ ! -f ".env" ]; then
    echo "Creating .env from example..."
    cp .env.example .env
fi

echo -e "${GREEN}Backend ready!${NC}"
echo ""

# Start Backend
echo -e "${BLUE}[2/4] Starting Backend Server...${NC}"
python run.py &
BACKEND_PID=$!
echo -e "${GREEN}Backend started (PID: $BACKEND_PID)${NC}"
echo -e "${YELLOW}API: http://localhost:5000${NC}"
echo -e "${YELLOW}Docs: http://localhost:5000/docs${NC}"
echo ""

# Wait for backend to be ready
echo "Waiting for backend to initialize..."
for i in {1..30}; do
    if curl -s http://localhost:5000/api/health > /dev/null 2>&1; then
        echo -e "${GREEN}Backend is ready!${NC}"
        break
    fi
    sleep 1
    if [ $i -eq 30 ]; then
        echo -e "${RED}Backend failed to start. Check logs.${NC}"
        exit 1
    fi
done
echo ""

# Setup Frontend
cd "$SCRIPT_DIR"
echo -e "${BLUE}[3/4] Setting up Frontend...${NC}"
cd frontend

if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi

echo -e "${GREEN}Frontend ready!${NC}"
echo ""

# Start Frontend
echo -e "${BLUE}[4/4] Starting Frontend Dev Server...${NC}"
npm run dev &
FRONTEND_PID=$!
echo -e "${GREEN}Frontend started (PID: $FRONTEND_PID)${NC}"
echo -e "${YELLOW}App: http://localhost:3000${NC}"
echo ""

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  All services are running!             ${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}Frontend:${NC} http://localhost:3000"
echo -e "${BLUE}Backend API:${NC} http://localhost:5000"
echo -e "${BLUE}API Docs:${NC} http://localhost:5000/docs"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
echo ""

# Keep script running
wait
