# Fenmo Expense Tracker Backend

A production-quality, clean-layered Node.js backend API for a personal expense tracker.

## Features

- ✅ **REST API** with well-defined endpoints
- ✅ **Idempotency & Deduplication** - safe retries and duplicate submissions
- ✅ **Money Handling** - safe currency using integer cents (avoids floating-point errors)
- ✅ **Filtering & Sorting** - by category, newest-first sorting
- ✅ **Validation** - request validation with detailed error feedback
- ✅ **Logging** - structured request logging and error tracking
- ✅ **Clean Architecture** - layered structure with separation of concerns

## Architecture

```
src/
├── config/          - Environment & configuration management
├── models/          - Data models (TypeScript interfaces)
├── data/            - Database/persistence layer (LowDB)
├── repositories/    - Data access layer (repository pattern)
├── services/        - Business logic (service pattern)
├── controllers/     - Request/response handling (thin controllers)
├── routes/          - Route definitions
├── middlewares/     - Error handling, request logging
├── app.ts           - Fastify app setup
└── server.ts        - Server entry point
```

## Quick Start

### Prerequisites
- Node.js 18+

### Installation
```bash
npm install
```

### Configuration
Create a `.env` file (copy from `.env.example`):
```env
PORT=4000
DATABASE_URL=sqlite://./data/expenses.db
LOG_LEVEL=info
```

### Run

**Development** (with hot-reload):
```bash
npm run dev
```

**Production**:
```bash
npm run build
npm start
```

## API Endpoints

### 1. Create Expense
```http
POST /expenses
Content-Type: application/json
Idempotency-Key: optional-unique-key

{
  "amount": 25.50,
  "category": "food",
  "description": "Lunch at restaurant",
  "date": "2026-04-25T12:00:00Z"
}
```

**Response** (201 Created):
```json
{
  "data": {
    "id": "uuid",
    "amountCents": 2550,
    "category": "food",
    "description": "Lunch at restaurant",
    "date": "2026-04-25T12:00:00.000Z",
    "createdAt": "2026-04-24T20:52:50.097Z"
  }
}
```

**Features**:
- Amount is stored in cents to avoid floating-point issues
- Idempotency-Key header makes the request safe to retry
- Duplicate request hashing prevents accidental duplicates
- Validates amount > 0, required fields, valid ISO date

### 2. List Expenses
```http
GET /expenses?category=food&sort=date_desc
```

**Query Parameters**:
- `category` (optional) - filter by category
- `sort=date_desc` (optional) - sort by newest first

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": "uuid",
      "amountCents": 2550,
      "category": "food",
      "description": "Lunch at restaurant",
      "date": "2026-04-25T12:00:00.000Z",
      "createdAt": "2026-04-24T20:52:50.097Z"
    }
  ],
  "meta": {
    "totalAmountCents": 2550
  }
}
```

## Design Patterns

### 1. **Repository Pattern**
- Data access abstraction in `src/repositories/expenseRepository.ts`
- Easy to swap persistence layer (LowDB → PostgreSQL/SQLite)

### 2. **Service Pattern**
- Business logic isolated in `src/services/expenseService.ts`
- Validation, hashing, deduplication logic
- Thin controllers delegate to services

### 3. **Dependency Injection**
- Services depend on repositories via imports
- Easy to test and mock

### 4. **DTO/Validation Layer**
- Zod schemas for request validation
- Type-safe input handling

## Idempotency & Safety

The API handles retries gracefully:

1. **Idempotency-Key Header**:
   - Send the same `Idempotency-Key` to safely retry
   - Server returns the same expense on retry

2. **Request Hashing**:
   - If no idempotency key provided, request is hashed
   - Detects duplicate submissions based on payload
   - Prevents accidental duplicates from network retries

Example:
```bash
# First request
curl -X POST http://localhost:4000/expenses \
  -H "Idempotency-Key: my-unique-id" \
  -d '{"amount": 25.50, ...}'
# Returns: id = "abc-123"

# Retry with same key
curl -X POST http://localhost:4000/expenses \
  -H "Idempotency-Key: my-unique-id" \
  -d '{"amount": 25.50, ...}'
# Returns: id = "abc-123" (same)
```

## Testing

Run the test suite:
```bash
npm test
```

Tests cover:
- Creating expenses
- Listing and filtering
- Category filtering
- Date sorting (newest first)
- Validation errors

## Error Handling

**Validation Error** (400):
```json
{
  "error": {
    "message": "Invalid expense payload",
    "details": [
      {
        "field": "amount",
        "message": "amount must be greater than 0"
      }
    ]
  }
}
```

**Server Error** (500):
```json
{
  "error": {
    "message": "Internal server error"
  }
}
```

## Money Handling

Amounts are stored as **integer cents** to avoid floating-point precision issues:
- Input: `25.50` → Stored: `2550` cents
- Response: `amountCents: 2550` → Display as `$25.50`

This prevents issues like `0.1 + 0.2 = 0.30000000000000004`.

## Logging

Structured logging with Pino:
- Request method, URL, timestamp
- Error stack traces
- Server startup confirmation

Example:
```
[timestamp] INFO - Incoming request method=POST url=/expenses
[timestamp] INFO - Server listening on port 4000
```

## Extensibility

The architecture makes it easy to:

1. **Switch database** - Replace LowDB with PostgreSQL/MySQL in `src/data/db.ts`
2. **Add validation rules** - Update Zod schema in `src/services/expenseService.ts`
3. **Add filters** - Extend repository list method in `src/repositories/expenseRepository.ts`
4. **Add endpoints** - Create new routes in `src/routes/`

## Tech Stack

- **Framework**: Fastify (lightweight, performant)
- **Language**: TypeScript (type safety)
- **Validation**: Zod (schema validation)
- **Database**: LowDB (file-based JSON, easily replaceable)
- **Logging**: Pino + Pino-Pretty (structured logging)
- **Testing**: Vitest (fast unit/integration tests)

## Production Considerations

For production deployment:

1. **Database**: Migrate to PostgreSQL or MongoDB
2. **Rate Limiting**: Add in middleware
3. **Authentication**: Add JWT/API key validation
4. **CORS**: Configure per deployment needs
5. **Monitoring**: Add APM tracking
6. **Error Tracking**: Integrate Sentry or similar
7. **Load Balancing**: Use reverse proxy (Nginx)
8. **Environment**: Use Docker for consistent deployment

## Development Notes

- All business logic is in services (not controllers)
- Data access is in repositories (not services)
- Controllers are thin (just call service → format response)
- Validation happens early in service layer
- Timestamps are ISO 8601 format for consistency
- IDs are UUIDs for distributed system compatibility

## License

MIT
