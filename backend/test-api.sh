#!/bin/bash
# Quick API testing script

BASE_URL="http://localhost:4000"

echo "🧪 Testing Fenmo Expense API"
echo "============================\n"

# Test 1: Health check
echo "1️⃣ Health Check"
curl -s "${BASE_URL}/health" | jq .
echo "\n"

# Test 2: Create first expense
echo "2️⃣ Create Expense (Food)"
RESPONSE=$(curl -s -X POST "${BASE_URL}/expenses" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: food-123" \
  -d '{
    "amount": 25.50,
    "category": "food",
    "description": "Lunch at the cafe",
    "date": "2026-04-25T12:30:00Z"
  }')
echo "$RESPONSE" | jq .
EXPENSE_ID=$(echo "$RESPONSE" | jq -r '.data.id')
echo "\n"

# Test 3: Create second expense
echo "3️⃣ Create Expense (Transport)"
curl -s -X POST "${BASE_URL}/expenses" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 15.00,
    "category": "transport",
    "description": "Taxi to office",
    "date": "2026-04-24T08:00:00Z"
  }' | jq .
echo "\n"

# Test 4: List all expenses
echo "4️⃣ List All Expenses"
curl -s "${BASE_URL}/expenses" | jq .
echo "\n"

# Test 5: Filter by category
echo "5️⃣ Filter by Category (food)"
curl -s "${BASE_URL}/expenses?category=food" | jq .
echo "\n"

# Test 6: Sort by newest first
echo "6️⃣ Sort by Newest First"
curl -s "${BASE_URL}/expenses?sort=date_desc" | jq .
echo "\n"

# Test 7: Idempotency test
echo "7️⃣ Idempotency Test (same key = same response)"
echo "First call:"
curl -s -X POST "${BASE_URL}/expenses" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: idempotent-key-001" \
  -d '{
    "amount": 50.00,
    "category": "shopping",
    "description": "Books",
    "date": "2026-04-23T15:00:00Z"
  }' | jq '.data.id'

echo "Retry (same key):"
curl -s -X POST "${BASE_URL}/expenses" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: idempotent-key-001" \
  -d '{
    "amount": 50.00,
    "category": "shopping",
    "description": "Books",
    "date": "2026-04-23T15:00:00Z"
  }' | jq '.data.id'
echo "\n"

# Test 8: Validation error
echo "8️⃣ Validation Test (negative amount)"
curl -s -X POST "${BASE_URL}/expenses" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": -50,
    "category": "invalid",
    "description": "Should fail",
    "date": "2026-04-25T12:00:00Z"
  }' | jq .
echo "\n"

# Test 9: Missing required fields
echo "9️⃣ Validation Test (missing category)"
curl -s -X POST "${BASE_URL}/expenses" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 25,
    "description": "No category",
    "date": "2026-04-25T12:00:00Z"
  }' | jq .
echo "\n"

echo "✅ Tests completed!"
