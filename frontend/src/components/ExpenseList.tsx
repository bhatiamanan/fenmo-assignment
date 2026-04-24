import { ArrowDownUp, Inbox, RefreshCw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  EXPENSE_CATEGORIES,
  type Expense,
  type SortOrder,
} from "@/services/expenseService";

type Props = {
  expenses: Expense[];
  loading: boolean;
  error: string | null;
  category: string;
  sort: SortOrder;
  onCategoryChange: (v: string) => void;
  onToggleSort: () => void;
  onRetry: () => void;
};

export function ExpenseList({
  expenses,
  loading,
  error,
  category,
  sort,
  onCategoryChange,
  onToggleSort,
  onRetry,
}: Props) {
  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Select value={category} onValueChange={onCategoryChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {EXPENSE_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" onClick={onToggleSort}>
            <ArrowDownUp className="mr-2 h-4 w-4" />
            Date: {sort === "date_desc" ? "Newest" : "Oldest"} first
          </Button>
        </div>

        <div className="rounded-lg border bg-accent/40 px-4 py-2 text-sm font-medium">
          Total:{" "}
          <span className="text-base font-semibold text-primary">
            {formatCurrency(total)}
          </span>
        </div>
      </div>

      <div className="rounded-lg border bg-card shadow-[var(--shadow-card)]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && <LoadingRows />}

            {!loading && error && (
              <TableRow>
                <TableCell colSpan={4} className="py-10 text-center">
                  <p className="mb-3 text-sm text-destructive">{error}</p>
                  <Button variant="outline" size="sm" onClick={onRetry}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Retry
                  </Button>
                </TableCell>
              </TableRow>
            )}

            {!loading && !error && expenses.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="py-12 text-center">
                  <div className="mx-auto flex max-w-xs flex-col items-center gap-2 text-muted-foreground">
                    <Inbox className="h-8 w-8" />
                    <p className="text-sm">
                      No expenses to show. Add one to get started.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}

            {!loading &&
              !error &&
              expenses.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(e.date)}
                  </TableCell>
                  <TableCell className="font-medium">{e.description}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{e.category}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatCurrency(e.amount)}
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function LoadingRows() {
  return (
    <>
      {Array.from({ length: 4 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
          <TableCell><Skeleton className="h-4 w-48" /></TableCell>
          <TableCell><Skeleton className="h-5 w-16" /></TableCell>
          <TableCell className="text-right">
            <Skeleton className="ml-auto h-4 w-16" />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}
