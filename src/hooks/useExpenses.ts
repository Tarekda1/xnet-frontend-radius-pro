import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createExpense, deleteExpense, fetchExpenseMonthlyTotals, fetchExpenses, updateExpense } from "@/api/expenses";

export function useExpenses(params: {
  page: number;
  limit: number;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  category?: string;
  status?: "paid" | "unpaid";
}) {
  const queryClient = useQueryClient();

  const invalidateExpenseQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["expenses"] }),
      queryClient.invalidateQueries({ queryKey: ["expenseMonthlyTotals"] }),
    ]);
  };

  const query = useQuery({
    queryKey: [
      "expenses",
      params.page,
      params.limit,
      params.search,
      params.dateFrom,
      params.dateTo,
      params.category,
      params.status,
    ],
    queryFn: () => fetchExpenses(params),
  });

  const createMutation = useMutation({
    mutationFn: createExpense,
    onSuccess: () => {
      return invalidateExpenseQueries();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: number; input: Parameters<typeof updateExpense>[1] }) =>
      updateExpense(id, input),
    onSuccess: () => {
      return invalidateExpenseQueries();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteExpense,
    onSuccess: () => {
      return invalidateExpenseQueries();
    },
  });

  return { ...query, createMutation, updateMutation, deleteMutation };
}

export function useExpenseMonthlyTotals(params?: { dateFrom?: string; dateTo?: string }) {
  return useQuery({
    queryKey: ["expenseMonthlyTotals", params?.dateFrom, params?.dateTo],
    queryFn: () => fetchExpenseMonthlyTotals(params),
  });
}


