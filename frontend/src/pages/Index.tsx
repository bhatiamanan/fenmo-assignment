import { useState } from "react";
import { Wallet } from "lucide-react";

import { ExpenseForm } from "@/components/ExpenseForm";
import { ExpenseList } from "@/components/ExpenseList";
import { useExpenses } from "@/hooks/useExpenses";
import type { SortOrder } from "@/services/expenseService";

const Index = () => {
  const [category, setCategory] = useState<string>("all");
  const [sort, setSort] = useState<SortOrder>("date_desc");

  const { expenses, loading, error, addExpense, refetch } = useExpenses(
    category,
    sort,
  );

  return (
    <div className="min-h-screen bg-[var(--gradient-surface)]">
      <header className="border-b bg-card/60 backdrop-blur">
        <div className="container flex items-center gap-3 py-5">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-lg text-primary-foreground shadow-[var(--shadow-elegant)]"
            style={{ backgroundImage: "var(--gradient-primary)" }}
          >
            <Wallet className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              Expense Tracker
            </h1>
            <p className="text-xs text-muted-foreground">
              Keep tabs on where your money goes
            </p>
          </div>
        </div>
      </header>

      <main className="container grid gap-6 py-8 lg:grid-cols-[420px_1fr]">
        <section className="rounded-xl border bg-card p-6 shadow-[var(--shadow-card)]">
          <h2 className="mb-4 text-lg font-semibold">Add an expense</h2>
          <ExpenseForm onSubmit={addExpense} />
        </section>

        <section className="rounded-xl border bg-card p-6 shadow-[var(--shadow-card)]">
          <h2 className="mb-4 text-lg font-semibold">Your expenses</h2>
          <ExpenseList
            expenses={expenses}
            loading={loading}
            error={error}
            category={category}
            sort={sort}
            onCategoryChange={setCategory}
            onToggleSort={() =>
              setSort((s) => (s === "date_desc" ? "date_asc" : "date_desc"))
            }
            onRetry={() => refetch()}
          />
        </section>
      </main>
    </div>
  );
};

export default Index;
