# Project Structure & Implementation Details

## Directory Structure

```
fenmo/
├── src/
│   ├── config/
│   │   └── index.ts                 # Environment config (PORT, DATABASE_URL, LOG_LEVEL)
│   │
│   ├── models/
│   │   └── expense.ts               # TypeScript interfaces for Expense entities
│   │
│   ├── data/
│   │   └── db.ts                    # LowDB initialization and schema setup
│   │
│   ├── repositories/
│   │   └── expenseRepository.ts     # Data access layer (CRUD operations)
│   │
│   ├── services/
│   │   └── expenseService.ts        # Business logic & validation
│   │
│   ├── controllers/
│   │   └── expenseController.ts     # HTTP request/response handling
│   │
│   ├── routes/
│   │   └── expenseRoutes.ts         # Route definitions
│   │
│   ├── middlewares/
│   │   ├── requestLogger.ts         # Request logging middleware
│   │   └── errorHandler.ts          # Global error handling
│   │
│   ├── app.ts                       # Fastify app setup & plugins
│   └── server.ts                    # Server entry point & startup
│
├── tests/
│   └── expense.spec.ts              # Integration tests
│
├── dist/                            # Compiled JavaScript (generated)
│
├── data/                            # Data directory (SQLite/JSON files)
│
├── .env.example                     # Environment variables template
├── .gitignore
├── package.json
├── tsconfig.json
├── README.md
└── ARCHITECTURE.md                  # This file
```

## Data Flow

### Create Expense Request

```
POST /expenses
    ↓
expenseController.create()
    ↓
expenseService.validateExpensePayload()     [Validates input]
    ↓
expenseService.buildRequestHash()          [Create hash for deduplication]
    ↓
expenseRepository.findByIdempotencyKey()   [Check for retry]
    ↓
expenseRepository.findByRequestHash()      [Check for duplicate]
    ↓
expenseRepository.create()                 [Insert into LowDB]
    ↓
response 201 with expense data
```

### List Expenses Request

```
GET /expenses?category=food&sort=date_desc
    ↓
expenseController.list()
    ↓
expenseService.listExpenses()
    ↓
expenseRepository.list(category, sortDesc)  [Query and sort]
    ↓
response 200 with expenses array + total amount
```

## Key Design Decisions

### 1. Layered Architecture

**Why?**
- Separation of concerns
- Easy to test each layer independently
- Business logic isolated from HTTP concerns
- Data access abstraction for easy persistence swapping

**Layers**:
- **Controller**: HTTP specifics only
- **Service**: Business logic, validation, deduplication
- **Repository**: Data access queries
- **Data**: Database connection & schema

### 2. Repository Pattern

**Why?**
- Abstract data access behind a repository interface
- Easy to swap LowDB with PostgreSQL/MongoDB later
- Single point to update query logic

**Example**:
```typescript
// Repository handles ALL data access
const expense = await expenseRepository.create(newExpense);
const existing = await expenseRepository.findByRequestHash(hash);

// Service doesn't know HOW data is stored
// Controller doesn't know data access details
```

### 3. Service Pattern

**Why?**
- Consolidates business logic
- Validation, hashing, deduplication in one place
- Reusable logic if multiple controllers needed

**Services handle**:
- Input validation (Zod schemas)
- Request hashing for deduplication
- Idempotency logic
- Business rule enforcement

### 4. Idempotency & Deduplication

**Two strategies**:

1. **Idempotency-Key Header** (preferred):
   - Client provides unique key
   - Server stores and checks
   - Safe for critical operations

2. **Request Hashing** (fallback):
   - Server hashes request payload
   - Detects duplicate payloads automatically
   - Prevents accidental duplicates from retries

**Benefits**:
- Network retries don't create duplicates
- Safe for distributed systems
- Frontend doesn't need to track keys

### 5. Money Handling (Cents-Based)

**Why store in cents?**
- Avoids floating-point precision issues
- `0.1 + 0.2 ≠ 0.3` in IEEE 754 floats
- Integer arithmetic is exact

**Example**:
```typescript
// Input: 25.50 USD
const amountCents = Math.round(25.50 * 100);  // 2550

// Display: 2550 cents → $25.50
const displayAmount = amountCents / 100;
```

### 6. LowDB for Persistence

**Why LowDB?**
- No external dependencies (no database server)
- File-based JSON storage
- Perfect for development/MVP
- Easy to migrate to SQL later

**Easily replaceable**:
```typescript
// Current: src/data/db.ts uses LowDB
// To switch to PostgreSQL:
// 1. Update src/data/db.ts
// 2. Update src/repositories/expenseRepository.ts
// Controllers/services remain unchanged!
```

## Scalability Path

### Current (MVP)
- LowDB (JSON file)
- Single process
- Good for: Development, single-user

### Phase 2
- SQLite with proper migrations
- Good for: Small production deployments

### Phase 3
- PostgreSQL or MongoDB
- Connection pooling
- Good for: Multi-user, distributed

### Phase 4
- Microservices
- API Gateway (Kong, Traefik)
- Service-to-service communication
- Message queues (RabbitMQ, Kafka)

**The architecture supports all phases** - just swap the repository implementation!

## Testing Strategy

### Unit Tests
- Service functions (validation, hashing)
- Individual repository methods

### Integration Tests
- Full request → response flow
- Database persistence
- Error scenarios

### Current Test Coverage
```typescript
// tests/expense.spec.ts covers:
- ✅ Create expense
- ✅ List all expenses
- ✅ Filter by category
- ✅ Sort by date (newest first)
- ✅ Total amount calculation
```

## Error Handling

### Validation Errors (400)
```typescript
// src/services/expenseService.ts
const parsed = expenseInputSchema.safeParse(payload);
if (!parsed.success) {
  throw new ValidationError('Invalid payload', errorDetails);
}
```

### Global Error Handler
```typescript
// src/middlewares/errorHandler.ts
app.setErrorHandler((error, request, reply) => {
  request.log.error(error);
  reply.status(500).send({ error: { message: 'Internal error' } });
});
```

## Logging

### Request Logging Middleware
```typescript
app.addHook('onRequest', async (request) => {
  request.log.info({ method, url }, 'Incoming request');
});
```

### Example Logs
```
[INFO] Incoming request method=POST url=/expenses
[INFO] Server listening on port 4000
[ERROR] Validation error: amount must be greater than 0
```

## Environment Configuration

### .env Variables
```bash
PORT=4000                           # Server port
DATABASE_URL=file://./data/db.json  # Database file
LOG_LEVEL=info                      # Logging level
```

### Configuration Access
```typescript
// src/config/index.ts
export const config = {
  port: getEnv('PORT', '4000'),
  databaseUrl: getEnv('DATABASE_URL', 'file://./data/db.json'),
  logLevel: getEnv('LOG_LEVEL', 'info'),
};

// Used everywhere as:
import { config } from '../config/index.js';
const port = config.port;  // No process.env anywhere else!
```

## Future Enhancements

1. **Recurring Expenses**
   - Add `frequency` field (daily, weekly, monthly)
   - Auto-create future expenses

2. **Budgeting**
   - Set budget limits by category
   - Get alerts when over budget

3. **Reports**
   - Monthly spending by category
   - Trend analysis

4. **Multi-User**
   - Add user authentication (JWT)
   - Expenses scoped to user

5. **Attachments**
   - Store receipt images
   - S3 integration

6. **Real Database**
   - Migrate to PostgreSQL
   - Add database migrations (Flyway)
   - Add connection pooling

All these can be added **without changing the API structure** - thanks to the layered architecture!
