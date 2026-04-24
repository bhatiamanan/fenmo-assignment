# Deployment Guide

## Local Development

### Quick Start
```bash
# 1. Install dependencies
npm install

# 2. Create environment file
cp .env.example .env

# 3. Start dev server (with hot-reload)
npm run dev

# 4. Test API
curl http://localhost:4000/expenses
```

## Production Deployment

### Build for Production
```bash
# Compile TypeScript
npm run build

# Run production server
npm start
```

### Docker Deployment

Create `Dockerfile`:
```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist ./dist

ENV PORT=4000
ENV DATABASE_URL=file:///app/data/db.json

EXPOSE 4000

CMD ["node", "dist/server.js"]
```

Build and run:
```bash
docker build -t fenmo-backend .
docker run -p 4000:4000 -v fenmo-data:/app/data fenmo-backend
```

### Docker Compose

Create `docker-compose.yml`:
```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "4000:4000"
    environment:
      PORT: 4000
      DATABASE_URL: file:///app/data/db.json
      LOG_LEVEL: info
    volumes:
      - ./data:/app/data
    restart: unless-stopped
```

Run with:
```bash
docker-compose up -d
```

## Environment Variables

### Development
```env
PORT=4000
DATABASE_URL=file://./data/db.json
LOG_LEVEL=debug
```

### Production
```env
PORT=4000
DATABASE_URL=postgresql://user:password@localhost/fenmo
LOG_LEVEL=info
```

## Scaling Considerations

### Single Server (Current)
- Good for: MVP, testing, small deployments
- LowDB file storage
- Single Node process

### Multi-Server (Phase 2)
- Use PostgreSQL instead of LowDB
- Load balancer in front (nginx)
- Environment variables for database connection
- Stateless API (no local storage)

### Distributed (Phase 3)
- Add Redis for caching
- Message queue for background tasks
- Separate services (reports, notifications)
- API Gateway for routing

### Cloud Platforms

#### AWS Lambda
- Requires serverless adapter
- Cold start optimization needed

#### Google Cloud Run
```bash
# Create Dockerfile (shown above)
gcloud run deploy fenmo-backend --source . --platform managed
```

#### Vercel
- Use Fastify with Vercel adapter
- PostgreSQL for database

#### Heroku
```bash
git push heroku main
```

## Performance Optimization

### Caching
```typescript
// Add Redis caching in service layer
const expenses = await redis.get(`expenses:${categoryFilter}`);
if (!expenses) {
  expenses = await repository.list(categoryFilter);
  await redis.set(`expenses:${categoryFilter}`, expenses, 'EX', 3600);
}
```

### Database Indexes
For PostgreSQL (when migrating):
```sql
CREATE INDEX idx_expenses_category ON expenses(category);
CREATE INDEX idx_expenses_date ON expenses(date);
CREATE INDEX idx_expenses_created_at ON expenses(created_at);
```

### Request Batching
- Implement batch endpoint for bulk expense creation
- Reduce N+1 queries

## Monitoring & Logging

### Application Logs
- All logs go to stdout (12-factor app)
- Structured JSON format (Pino)
- Aggregate with ELK stack or Datadog

### Metrics to Track
- Request latency (p50, p95, p99)
- Error rates
- Expense creation volume
- List query latency

### Health Checks
```bash
curl http://localhost:4000/health
```

## Database Migrations

### Migrating from LowDB to PostgreSQL

1. **Update `src/data/db.ts`**:
```typescript
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: config.databaseUrl,
});

export const query = (text: string, params?: any[]) => pool.query(text, params);
```

2. **Update `src/repositories/expenseRepository.ts`**:
```typescript
export const expenseRepository = {
  async list(category?: string) {
    let query = 'SELECT * FROM expenses';
    if (category) {
      query += ` WHERE category = $1`;
      const result = await db.query(query, [category]);
      return result.rows;
    }
    const result = await db.query(query);
    return result.rows;
  }
};
```

3. **No changes needed** to:
   - Controllers
   - Services
   - Routes
   - Models

## Backup & Recovery

### LowDB (File-based)
```bash
# Simple backup
cp data/db.json data/db.backup.json

# Automated backup (cron)
0 2 * * * cp /app/data/db.json /backups/db-$(date +\%Y\%m\%d).json
```

### PostgreSQL
```bash
# Backup
pg_dump fenmo > fenmo-$(date +%Y%m%d).sql

# Restore
psql fenmo < fenmo-20260424.sql
```

## Security Checklist

- [ ] Set strong DATABASE_URL password
- [ ] Use HTTPS in production (TLS certificate)
- [ ] Add rate limiting middleware
- [ ] Validate all user inputs (already done with Zod)
- [ ] Add CORS configuration
- [ ] Use environment variables (not config files)
- [ ] Enable CSRF protection if handling forms
- [ ] Add authentication (JWT tokens)
- [ ] Add API key validation
- [ ] Use HSTS headers
- [ ] Implement request signing for critical operations
- [ ] Regular security audits (npm audit)

## Troubleshooting

### Port Already in Use
```bash
# Find process using port 4000
lsof -i :4000

# Kill it
kill -9 <PID>
```

### Database Lock
```bash
# LowDB: Remove stale lock file
rm data/.db.lock

# PostgreSQL: Kill idle connections
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE datname = 'fenmo';
```

### High Memory Usage
- Check for memory leaks with --inspect
- Verify database connection pooling
- Monitor array/object accumulation in memory

## Support & Debugging

### Enable Debug Logging
```bash
LOG_LEVEL=debug npm start
```

### Node Inspector
```bash
node --inspect dist/server.js
# Then open chrome://inspect in Chrome
```

### Database Console
```bash
# For PostgreSQL
psql -U postgres -d fenmo

# View recent expenses
SELECT * FROM expenses ORDER BY created_at DESC LIMIT 10;
```

## Maintenance

### Regular Tasks
- Monitor disk space
- Check error logs
- Review performance metrics
- Update dependencies (npm audit)
- Rotate logs
- Backup database

### Update Dependencies
```bash
npm outdated              # Check for updates
npm audit                 # Check for vulnerabilities
npm update               # Update to minor versions
npm install package@^latest  # Update specific package
```

## Performance Targets

- **API Latency**: < 100ms (p95)
- **Error Rate**: < 0.1%
- **Availability**: 99.9% uptime
- **Data Volume**: 10K+ expenses without degradation
