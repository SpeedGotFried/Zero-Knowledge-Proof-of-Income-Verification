#!/bin/bash
# start.sh - Script to start the ZKP Income Verification Prototype

echo "======================================"
echo "Starting ZKP Proof of Income Prototype"
echo "======================================"

echo "Cleaning up old processes..."
killall zero_knowledge_proof_of_income_verification 2>/dev/null || true
pkill -f vite 2>/dev/null || true
sleep 1

echo "[1/3] Starting Rust Backend (Port 3000)..."
cargo run &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

echo "[2/3] Starting React Frontend (User Portal on Port 5173)..."
source $HOME/.nvm/nvm.sh 2>/dev/null || true
(cd apps/user-portal && npm run dev -- --port 5173) &
FRONTEND_PID=$!

echo "[3/3] Starting React Frontend (Bank Portal on Port 5174)..."
(cd apps/bank-portal && npm install && npm run dev -- --port 5174) &
BANK_PID=$!

echo ""
echo "======================================"
echo "Prototype is running!"
echo "- Backend:      http://localhost:3000"
echo "- User Portal:  http://localhost:5173"
echo "- Bank Portal:  http://localhost:5174"
echo "Press Ctrl+C to stop all services."
echo "======================================"

# Trap SIGINT (Ctrl+C) and terminate child processes
trap "echo -e '\nShutting down prototype...'; kill $BACKEND_PID $FRONTEND_PID $BANK_PID 2>/dev/null" SIGINT

# Wait indefinitely until interrupted
wait
