// This file contains unit tests for the expense service
// Run with: npm test

import { describe, it, expect, beforeAll } from 'vitest';
import { expenseService } from '../src/services/expenseService.js';

describe('Expense Service - Validation', () => {
  it('validates positive amount', () => {
    const payload = {
      amount: 25.50,
      category: 'food',
      description: 'Lunch',
      date: '2026-04-25T12:00:00Z',
    };
    const result = expenseService.validateExpensePayload(payload);
    expect(result).toMatchObject({ amount: 25.50 });
  });

  it('rejects negative amount', () => {
    const payload = {
      amount: -10,
      category: 'food',
      description: 'Invalid',
      date: '2026-04-25T12:00:00Z',
    };
    expect(() => expenseService.validateExpensePayload(payload)).toThrow('Invalid expense payload');
  });

  it('rejects zero amount', () => {
    const payload = {
      amount: 0,
      category: 'food',
      description: 'Free meal',
      date: '2026-04-25T12:00:00Z',
    };
    expect(() => expenseService.validateExpensePayload(payload)).toThrow('Invalid expense payload');
  });

  it('rejects empty category', () => {
    const payload = {
      amount: 25,
      category: '',
      description: 'No category',
      date: '2026-04-25T12:00:00Z',
    };
    expect(() => expenseService.validateExpensePayload(payload)).toThrow('Invalid expense payload');
  });

  it('rejects invalid date format', () => {
    const payload = {
      amount: 25,
      category: 'food',
      description: 'Invalid date',
      date: 'not-a-date',
    };
    expect(() => expenseService.validateExpensePayload(payload)).toThrow('Invalid expense payload');
  });

  it('accepts valid ISO date', () => {
    const payload = {
      amount: 25,
      category: 'food',
      description: 'Lunch',
      date: '2026-04-25T12:00:00.000Z',
    };
    const result = expenseService.validateExpensePayload(payload);
    expect(result.date).toBe('2026-04-25T12:00:00.000Z');
  });
});

describe('Expense Service - Request Hashing', () => {
  it('creates consistent hash for same payload', () => {
    const payload = {
      amount: 25.50,
      category: 'food',
      description: 'Lunch',
      date: '2026-04-25T12:00:00Z',
    };
    const hash1 = expenseService.buildRequestHash(payload);
    const hash2 = expenseService.buildRequestHash(payload);
    expect(hash1).toBe(hash2);
  });

  it('creates different hash for different amount', () => {
    const payload1 = {
      amount: 25.50,
      category: 'food',
      description: 'Lunch',
      date: '2026-04-25T12:00:00Z',
    };
    const payload2 = {
      amount: 25.51,
      category: 'food',
      description: 'Lunch',
      date: '2026-04-25T12:00:00Z',
    };
    const hash1 = expenseService.buildRequestHash(payload1);
    const hash2 = expenseService.buildRequestHash(payload2);
    expect(hash1).not.toBe(hash2);
  });

  it('creates different hash for different category', () => {
    const payload1 = {
      amount: 25.50,
      category: 'food',
      description: 'Lunch',
      date: '2026-04-25T12:00:00Z',
    };
    const payload2 = {
      amount: 25.50,
      category: 'drinks',
      description: 'Lunch',
      date: '2026-04-25T12:00:00Z',
    };
    const hash1 = expenseService.buildRequestHash(payload1);
    const hash2 = expenseService.buildRequestHash(payload2);
    expect(hash1).not.toBe(hash2);
  });
});
