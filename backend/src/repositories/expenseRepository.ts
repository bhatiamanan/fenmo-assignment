import { Expense, NewExpense } from '../models/expense.js';
import { db, ExpenseRow } from '../data/db.js';

const buildExpense = (row: ExpenseRow): Expense => ({
  id: row.id,
  amountCents: row.amount_cents,
  category: row.category,
  description: row.description,
  date: row.date,
  createdAt: row.created_at,
});

export const expenseRepository = {
  async create(expense: NewExpense & { id: string; createdAt: string; requestHash: string }): Promise<Expense> {
    db.data!.expenses.push({
      id: expense.id,
      amount_cents: expense.amountCents,
      category: expense.category,
      description: expense.description,
      date: expense.date,
      created_at: expense.createdAt,
      request_hash: expense.requestHash,
      idempotency_key: expense.idempotencyKey,
    });
    await db.write();
    return buildExpense(db.data!.expenses.find((row: ExpenseRow) => row.id === expense.id)!);
  },

  async findByIdempotencyKey(idempotencyKey: string): Promise<Expense | null> {
    const row = db.data!.expenses.find((item: ExpenseRow) => item.idempotency_key === idempotencyKey);
    return row ? buildExpense(row) : null;
  },

  async findByRequestHash(requestHash: string): Promise<Expense | null> {
    const row = db.data!.expenses.find((item: ExpenseRow) => item.request_hash === requestHash);
    return row ? buildExpense(row) : null;
  },

  async list(category?: string, sortDesc = false): Promise<Expense[]> {
    const normalizedCategory = category?.trim().toLowerCase();
    const filtered = normalizedCategory && normalizedCategory !== 'all'
      ? db.data!.expenses.filter(
          (item: ExpenseRow) => item.category.toLowerCase() === normalizedCategory,
        )
      : db.data!.expenses.slice();

    const sorted = filtered.sort((a: ExpenseRow, b: ExpenseRow) => {
      if (a.date === b.date) return 0;
      return sortDesc ? (a.date > b.date ? -1 : 1) : a.date > b.date ? 1 : -1;
    });

    return sorted.map(buildExpense);
  },
};
