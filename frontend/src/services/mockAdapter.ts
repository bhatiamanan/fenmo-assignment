// Mock backend that persists expenses in localStorage and simulates
// network latency. Lets us build & test the full UI without a server.

import type { RequestOptions } from "./apiClient";
import type { Expense, NewExpense } from "./expenseService";

const STORAGE_KEY = "expense-tracker:expenses";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

function readAll(): Expense[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Expense[]) : seed();
  } catch {
    return [];
  }
}

function writeAll(items: Expense[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function seed(): Expense[] {
  const now = new Date();
  const iso = (offset: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() - offset);
    return d.toISOString();
  };
  const seeded: Expense[] = [
    { id: "1", amount: 320, category: "Food", description: "Lunch with team", date: iso(0) },
    { id: "2", amount: 1200, category: "Transport", description: "Monthly metro pass", date: iso(2) },
    { id: "3", amount: 4999, category: "Shopping", description: "Wireless headphones", date: iso(5) },
    { id: "4", amount: 250, category: "Food", description: "Coffee run", date: iso(7) },
  ];
  writeAll(seeded);
  return seeded;
}

export async function mockRequest<T>(
  path: string,
  opts: RequestOptions,
): Promise<T> {
  await delay(350 + Math.random() * 250);

  // GET /expenses?category=&sort=
  if (path === "/expenses" && (opts.method ?? "GET") === "GET") {
    let items = readAll();
    const category = opts.query?.category;
    const sort = opts.query?.sort ?? "date_desc";

    if (category && category !== "all") {
      items = items.filter(
        (e) => e.category.toLowerCase() === category.toLowerCase(),
      );
    }
    items = [...items].sort((a, b) => {
      const diff = new Date(b.date).getTime() - new Date(a.date).getTime();
      return sort === "date_asc" ? -diff : diff;
    });
    return items as unknown as T;
  }

  // POST /expenses
  if (path === "/expenses" && opts.method === "POST") {
    const body = opts.body as NewExpense;
    const created: Expense = {
      ...body,
      id: crypto.randomUUID(),
    };
    const items = readAll();
    items.push(created);
    writeAll(items);
    return created as unknown as T;
  }

  throw new Error(`Mock: unhandled route ${opts.method ?? "GET"} ${path}`);
}
