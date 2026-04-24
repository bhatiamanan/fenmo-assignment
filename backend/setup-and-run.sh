#!/bin/bash
# Setup environment and run the backend

set -e

echo "📦 Fenmo Expense Tracker Backend - Setup"
echo "========================================\n"

# Check if .env exists
if [ ! -f .env ]; then
  echo "⚙️  Creating .env from template..."
  cp .env.example .env
  echo "✅ .env created"
else
  echo "✅ .env already exists"
fi

# Create data directory
mkdir -p data
echo "✅ Data directory ready"

# Install dependencies if needed
if [ ! -d node_modules ]; then
  echo "📥 Installing dependencies..."
  npm install
  echo "✅ Dependencies installed"
else
  echo "✅ Dependencies already installed"
fi

# Build project
echo "🔨 Building TypeScript..."
npm run build
echo "✅ Build complete"

echo "\n🚀 Starting server..."
echo "📍 Server will run on: http://localhost:4000"
echo "❓ Run: npm run dev (for development with hot-reload)"
echo ""

npm start
