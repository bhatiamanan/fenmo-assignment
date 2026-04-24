// Service layer — components only ever call these functions, never fetch directly.

import { apiRequest } from "./apiClient";

export type Expense = {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string; // ISO string
};

export type NewExpense = Omit<Expense, "id">;

export type SortOrder = "date_desc" | "date_asc";

export type GetExpensesParams = {
  category?: string; // "all" or a category name
  sort?: SortOrder;
};

export const EXPENSE_CATEGORIES = [
  "Food",
  "Transport",
  "Shopping",
  "Bills",
  "Entertainment",
  "Health",
  "Other",
] as const;

export function getExpenses(params: GetExpensesParams = {}): Promise<Expense[]> {
  return apiRequest<Expense[]>("/expenses", {
    method: "GET",
    query: {
      category: params.category,
      sort: params.sort ?? "date_desc",
    },
  });
}

export function createExpense(data: NewExpense): Promise<Expense> {
  const idempotencyKey = crypto.randomUUID();
  return apiRequest<Expense>("/expenses", {
    method: "POST",
    body: data,
    headers: { "Idempotency-Key": idempotencyKey },
  });
}
