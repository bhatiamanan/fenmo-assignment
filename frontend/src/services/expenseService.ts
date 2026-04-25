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

type BackendExpense = {
  id: string;
  amountCents: number;
  category: string;
  description: string;
  date: string;
  createdAt: string;
};

type ExpensesResponse = { data: BackendExpense[]; meta: { totalAmountCents: number } };
type ExpenseResponse = { data: BackendExpense };

function normalizeExpense(expense: BackendExpense): Expense {
  return {
    id: expense.id,
    amount: expense.amountCents / 100,
    category: expense.category,
    description: expense.description,
    date: expense.date,
  };
}

export function getExpenses(params: GetExpensesParams = {}): Promise<Expense[]> {
  return apiRequest<ExpensesResponse>("/expenses", {
    method: "GET",
    query: {
      category: params.category,
      sort: params.sort ?? "date_desc",
    },
  }).then((response) => response.data.map(normalizeExpense));
}

export function createExpense(data: NewExpense): Promise<Expense> {
  const idempotencyKey = crypto.randomUUID();
  return apiRequest<ExpenseResponse>("/expenses", {
    method: "POST",
    body: data,
    headers: { "Idempotency-Key": idempotencyKey },
  }).then((response) => normalizeExpense(response.data));
}
