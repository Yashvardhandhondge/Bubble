#!/bin/sh

# Exit on error
set -e

# Use the PORT environment variable if set, otherwise default to 3000
PORT=${PORT:-5173}

echo "🚀 Starting the Node.js application on port $PORT..."

# Start the application in development mode
exec npm run live