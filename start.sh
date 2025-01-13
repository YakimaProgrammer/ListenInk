#!/bin/bash

set -e

if [ ! -f "backend/prisma/dev.db" ]; then
  cd backend
  . init-dev-database.sh
  cd ..
fi

# Start npm run start in both frontend and backend directories
( cd frontend/ && npm run start ) &
FRONTEND_PID=$!

( cd backend/ && npm run start ) &
BACKEND_PID=$!

# Function to clean up processes when script is interrupted
cleanup() {
    echo "Stopping both processes..."
    kill $FRONTEND_PID $BACKEND_PID
    wait $FRONTEND_PID $BACKEND_PID 2>/dev/null
    echo "Processes stopped. Exiting script."
}

# Trap SIGINT (Ctrl+C) and call the cleanup function
trap cleanup SIGINT

# Wait for both processes to complete
wait $FRONTEND_PID $BACKEND_PID
