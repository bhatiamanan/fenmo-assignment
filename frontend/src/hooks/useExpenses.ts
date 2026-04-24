import { useCallback, useEffect, useState } from "react";
import {
  createExpense,
  getExpenses,
  type Expense,
  type NewExpense,
  type SortOrder,
} from "@/services/expenseService";

export function useExpenses(category: string, sort: SortOrder) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setError(null);
      try {
        const data = await getExpenses({ category, sort });
        if (!signal?.aborted) setExpenses(data);
      } catch (e) {
        if (!signal?.aborted) {
          setError(e instanceof Error ? e.message : "Failed to load expenses");
        }
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [category, sort],
  );

  useEffect(() => {
    const ctrl = new AbortController();
    load(ctrl.signal);
    return () => ctrl.abort();
  }, [load]);

  const addExpense = useCallback(async (data: NewExpense) => {
    const created = await createExpense(data);
    // Optimistically prepend; server is source of truth on next refetch.
    setExpenses((prev) => [created, ...prev]);
    return created;
  }, []);

  return { expenses, loading, error, refetch: load, addExpense };
}
