export const formatCurrency = (amount: number): string =>
  `₹${amount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

export const formatDate = (iso: string): string => {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};
