#!/bin/bash

# Function to handle script termination
cleanup() {
    echo "Stopping all frontend services..."
    kill 0
}

# Trap SIGINT (Ctrl+C) to run cleanup
trap cleanup SIGINT

# Ensure we are using the correct node version
if [ -f "$HOME/.nvm/nvm.sh" ]; then
    . "$HOME/.nvm/nvm.sh"
    nvm use 20
else
    echo "Warning: nvm not found. Please ensure Node.js v20 is installed."
fi

# Get the absolute path to the project root
# Assuming this script is located in /misc-scripts/
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "Starting Bank Portal..."
cd "$PROJECT_ROOT/apps/bank-portal" && npm run dev &

echo "Starting Prover Wallet..."
cd "$PROJECT_ROOT/apps/prover-wallet" && npm run dev &

echo "Starting Verifier Service..."
cd "$PROJECT_ROOT/apps/verifier-service" && npm run dev &

# Wait for all background processes
wait
