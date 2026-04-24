import { randomUUID, createHash } from 'crypto';
import { z } from 'zod';
import { expenseRepository } from '../repositories/expenseRepository.js';
import { Expense, NewExpense } from '../models/expense.js';

const expenseInputSchema = z.object({
  amount: z.number().positive({ message: 'amount must be greater than 0' }),
  category: z.string().min(1, { message: 'category is required' }),
  description: z.string().min(1, { message: 'description is required' }),
  date: z.string().refine((value: string) => !Number.isNaN(Date.parse(value)), {
    message: 'date must be a valid ISO date string',
  }),
});

export type ExpenseInput = z.infer<typeof expenseInputSchema>;

export const expenseService = {
  validateExpensePayload(payload: unknown) {
    const parsed = expenseInputSchema.safeParse(payload);
    if (!parsed.success) {
      const errors = parsed.error.errors.map((error: z.ZodIssue) => ({
        field: error.path.join('.') || 'body',
        message: error.message,
      }));
      throw new ValidationError('Invalid expense payload', errors);
    }
    return parsed.data;
  },

  buildRequestHash(data: ExpenseInput) {
    return createHash('sha256')
      .update(JSON.stringify({
        amount: data.amount,
        category: data.category.trim(),
        description: data.description.trim(),
        date: new Date(data.date).toISOString(),
      }))
      .digest('hex');
  },

  async createExpense(payload: ExpenseInput, idempotencyKey?: string): Promise<Expense> {
    const normalizedKey = idempotencyKey?.trim();
    const requestHash = this.buildRequestHash(payload);

    if (normalizedKey) {
      const existing = await expenseRepository.findByIdempotencyKey(normalizedKey);
      if (existing) {
        return existing;
      }
    }

    const duplicate = await expenseRepository.findByRequestHash(requestHash);
    if (duplicate) {
      return duplicate;
    }

    const newExpense: NewExpense & { id: string; createdAt: string; requestHash: string } = {
      id: randomUUID(),
      amountCents: Math.round(payload.amount * 100),
      category: payload.category.trim(),
      description: payload.description.trim(),
      date: new Date(payload.date).toISOString(),
      createdAt: new Date().toISOString(),
      idempotencyKey: normalizedKey ?? null,
      requestHash,
    };

    return expenseRepository.create(newExpense);
  },

  async listExpenses(options: { category?: string; sort?: string }): Promise<Expense[]> {
    const sortDesc = options.sort === 'date_desc';
    return await expenseRepository.list(options.category?.trim(), sortDesc);
  },
};

export class ValidationError extends Error {
  public statusCode = 400;
  public details: Array<{ field: string; message: string }>;

  constructor(message: string, details: Array<{ field: string; message: string }>) {
    super(message);
    this.details = details;
    this.name = 'ValidationError';
  }
}
