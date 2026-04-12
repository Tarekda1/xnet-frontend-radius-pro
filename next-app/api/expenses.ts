import { apiClient } from "@/api/client";

export type Expense = {
  id: number;
  title: string;
  category: string | null;
  amount: number;
  currency: string;
  expenseDate: string; // YYYY-MM-DD
  status: "paid" | "unpaid";
  notes: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Paginated<T> = {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
};

type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
};

export async function fetchExpenses(params: {
  page?: number;
  limit?: number;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  category?: string;
  status?: "paid" | "unpaid";
}): Promise<ApiEnvelope<Paginated<Expense>>> {
  const qs = new URLSearchParams();
  if (params.page) qs.set("page", String(params.page));
  if (params.limit) qs.set("limit", String(params.limit));
  if (params.search) qs.set("search", params.search);
  if (params.dateFrom) qs.set("dateFrom", params.dateFrom);
  if (params.dateTo) qs.set("dateTo", params.dateTo);
  if (params.category) qs.set("category", params.category);
  if (params.status) qs.set("status", params.status);

  const { data } = await apiClient.get<ApiEnvelope<Paginated<Expense>>>(
    `/expenses?${qs.toString()}`
  );
  return data;
}

export async function createExpense(input: {
  title: string;
  category?: string | null;
  amount: number;
  currency?: string;
  expenseDate: string;
  status?: "paid" | "unpaid";
  notes?: string | null;
}): Promise<ApiEnvelope<Expense>> {
  const { data } = await apiClient.post<ApiEnvelope<Expense>>(`/expenses`, input);
  return data;
}

export async function updateExpense(
  id: number,
  input: Partial<{
    title: string;
    category: string | null;
    amount: number;
    currency: string;
    expenseDate: string;
    status: "paid" | "unpaid";
    notes: string | null;
  }>
): Promise<ApiEnvelope<Expense>> {
  const { data } = await apiClient.put<ApiEnvelope<Expense>>(`/expenses/${id}`, input);
  return data;
}

export async function deleteExpense(id: number): Promise<ApiEnvelope<{ ok: boolean }>> {
  const { data } = await apiClient.delete<ApiEnvelope<{ ok: boolean }>>(`/expenses/${id}`);
  return data;
}

export type ExpenseMonthlyTotal = {
  month: string; // YYYY-MM
  totalAmount: number;
  currency: string;
};

export async function fetchExpenseMonthlyTotals(params?: {
  dateFrom?: string;
  dateTo?: string;
}): Promise<ApiEnvelope<ExpenseMonthlyTotal[]>> {
  const qs = new URLSearchParams();
  if (params?.dateFrom) qs.set("dateFrom", params.dateFrom);
  if (params?.dateTo) qs.set("dateTo", params.dateTo);
  const { data } = await apiClient.get<ApiEnvelope<ExpenseMonthlyTotal[]>>(
    `/expenses/monthly-totals?${qs.toString()}`
  );
  return data;
}


