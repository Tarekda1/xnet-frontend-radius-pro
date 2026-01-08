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
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: number; input: Parameters<typeof updateExpense>[1] }) =>
      updateExpense(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
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


