import { useState } from "react";
import { CalendarIcon, Loader2, Plus } from "lucide-react";
import { format } from "date-fns";
import { z } from "zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  EXPENSE_CATEGORIES,
  type NewExpense,
} from "@/services/expenseService";

const expenseSchema = z.object({
  amount: z
    .number({ invalid_type_error: "Amount is required" })
    .positive("Amount must be greater than 0")
    .max(10_000_000, "Amount is too large"),
  category: z.enum(EXPENSE_CATEGORIES, {
    errorMap: () => ({ message: "Pick a category" }),
  }),
  description: z
    .string()
    .trim()
    .min(1, "Description is required")
    .max(200, "Keep it under 200 characters"),
  date: z.date({ required_error: "Date is required" }),
});

type FieldErrors = Partial<Record<keyof NewExpense | "amount" | "date", string>>;

type Props = {
  onSubmit: (data: NewExpense) => Promise<unknown>;
};

export function ExpenseForm({ onSubmit }: Props) {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<string>("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setAmount("");
    setCategory("");
    setDescription("");
    setDate(new Date());
    setErrors({});
  };

  const clearFieldError = (field: keyof FieldErrors) => {
    setErrors((prev) => {
      const { [field]: _, ...rest } = prev;
      return rest;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return; // hard guard against rapid double-clicks

    const parsed = expenseSchema.safeParse({
      amount: Number(amount),
      category,
      description,
      date,
    });

    if (!parsed.success) {
      const fieldErrors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof FieldErrors;
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        amount: parsed.data.amount,
        category: parsed.data.category,
        description: parsed.data.description,
        date: parsed.data.date.toISOString(),
      });
      toast.success("Expense added");
      reset();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not add expense. Try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="amount">Amount (₹)</Label>
          <Input
            id="amount"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              if (errors.amount) clearFieldError("amount");
            }}
            disabled={submitting}
            aria-invalid={!!errors.amount}
          />
          {errors.amount && (
            <p className="text-xs text-destructive">{errors.amount}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="category">Category</Label>
          <Select
            value={category}
            onValueChange={(value) => {
              setCategory(value);
              if (errors.category) clearFieldError("category");
            }}
            disabled={submitting}
          >
            <SelectTrigger id="category" aria-invalid={!!errors.category}>
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {EXPENSE_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.category && (
            <p className="text-xs text-destructive">{errors.category}</p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="What was this expense for?"
          rows={2}
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            if (errors.description) clearFieldError("description");
          }}
          disabled={submitting}
          maxLength={200}
          aria-invalid={!!errors.description}
        />
        {errors.description && (
          <p className="text-xs text-destructive">{errors.description}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label>Date</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              disabled={submitting}
              className={cn(
                "w-full justify-start text-left font-normal",
                !date && "text-muted-foreground",
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "PPP") : "Pick a date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              disabled={(d) => d > new Date()}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>
        {errors.date && (
          <p className="text-xs text-destructive">{errors.date}</p>
        )}
      </div>

      <Button
        type="submit"
        disabled={submitting}
        className="w-full sm:w-auto"
        size="lg"
      >
        {submitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Adding…
          </>
        ) : (
          <>
            <Plus className="mr-2 h-4 w-4" />
            Add Expense
          </>
        )}
      </Button>
    </form>
  );
}
