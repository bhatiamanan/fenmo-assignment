import fs from 'fs';
import path from 'path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

process.env.DATABASE_URL = 'sqlite://./data/test-expenses.db';
process.env.PORT = '0';
process.env.LOG_LEVEL = 'silent';

import { buildApp } from '../src/app.js';

const testDbPath = path.resolve(process.cwd(), 'data/test-expenses.db');
let app: Awaited<ReturnType<typeof buildApp>>;

beforeAll(async () => {
  const dataDir = path.resolve(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }

  app = buildApp();
});

afterAll(async () => {
  await app.close();
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }
});

describe('Expense API', () => {
  it('creates and returns an expense', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/expenses',
      headers: { 'Content-Type': 'application/json', 'Idempotency-Key': 'test-key' },
      payload: JSON.stringify({
        amount: 12.34,
        category: 'food',
        description: 'Lunch',
        date: '2026-04-25T12:00:00.000Z',
      }),
    });

    expect(response.statusCode).toBe(201);
    const body = response.json();
    expect(body.data).toMatchObject({
      category: 'food',
      description: 'Lunch',
    });
    expect(body.data.amountCents).toBe(1234);
  });

  it('returns the expense list and total amount', async () => {
    const response = await app.inject({ method: 'GET', url: '/expenses' });
    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.meta.totalAmountCents).toBeGreaterThan(0);
  });

  it('supports category filtering and newest-first sort', async () => {
    await app.inject({
      method: 'POST',
      url: '/expenses',
      headers: { 'Content-Type': 'application/json' },
      payload: JSON.stringify({
        amount: 5.0,
        category: 'transport',
        description: 'Bus ticket',
        date: '2026-04-26T08:00:00.000Z',
      }),
    });

    const response = await app.inject({ method: 'GET', url: '/expenses?category=transport&sort=date_desc' });
    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.data[0].category).toBe('transport');
    expect(body.data[0].date).toBe('2026-04-26T08:00:00.000Z');
  });
});
