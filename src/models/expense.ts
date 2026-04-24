export interface Expense {
  id: string;
  amountCents: number;
  category: string;
  description: string;
  date: string;
  createdAt: string;
}

export interface NewExpense {
  amountCents: number;
  category: string;
  description: string;
  date: string;
  idempotencyKey: string | null;
}
