import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { notify } from "@/lib/notify";
import type { CableVisionAccount, CableVisionInvoice, CableVisionProfile } from "@/types/api";

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

type AccountsPayload = {
  data: Array<CableVisionAccount & { profiles?: Array<CableVisionProfile & { currentInvoice?: CableVisionInvoice | null }> }>;
  total: number;
  page: number;
  totalPages: number;
  billingMonth: string;
};

function toBillingMonthYmd(monthInput: string): string | undefined {
  const m = String(monthInput || "").trim(); // YYYY-MM
  if (!m) return undefined;
  const match = /^(\d{4})-(\d{2})$/.exec(m);
  if (!match) return undefined;
  return `${match[1]}-${match[2]}-01`;
}

async function fetchAccounts(params: {
  page: number;
  limit: number;
  search: string;
  billingMonth?: string;
}): Promise<ApiResponse<AccountsPayload>> {
  const response = await apiClient.get("/cable-vision/accounts", {
    params: {
      page: params.page,
      limit: params.limit,
      search: params.search || undefined,
      billingMonth: params.billingMonth || undefined,
    },
  });
  return response.data;
}

export function useCableVisionAccounts(options?: { initialPage?: number; pageSize?: number }) {
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(options?.initialPage ?? 1);
  const [pageSize, setPageSize] = useState(options?.pageSize ?? 50);
  const [search, setSearch] = useState("");
  const [billingMonth, setBillingMonth] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  const billingMonthYmd = useMemo(() => toBillingMonthYmd(billingMonth), [billingMonth]);

  const accountsQuery = useQuery<ApiResponse<AccountsPayload>, Error>({
    queryKey: ["cableVision", "accounts", currentPage, pageSize, search, billingMonthYmd],
    queryFn: () => fetchAccounts({ page: currentPage, limit: pageSize, search, billingMonth: billingMonthYmd }),
  });

  const createAccountMutation = useMutation({
    mutationFn: async (input: { accountNumber: string; fullName: string; phoneNumber?: string; email?: string; address?: string }) => {
      const resp = await apiClient.post("/cable-vision/accounts", input);
      return resp.data as ApiResponse<CableVisionAccount>;
    },
    onSuccess: () => {
      notify.success("Created", "Cable Vision account created.");
      queryClient.invalidateQueries({ queryKey: ["cableVision", "accounts"] });
    },
    onError: (e: any) => {
      notify.error("Create failed", e?.response?.data?.message || e?.message || "Failed to create account");
    },
  });

  const updateAccountMutation = useMutation({
    mutationFn: async (input: {
      accountId: number;
      accountNumber?: string;
      fullName?: string;
      phoneNumber?: string | null;
      email?: string | null;
      address?: string | null;
    }) => {
      const resp = await apiClient.put(`/cable-vision/accounts/${input.accountId}`, {
        accountNumber: input.accountNumber,
        fullName: input.fullName,
        phoneNumber: typeof input.phoneNumber === "undefined" ? undefined : input.phoneNumber,
        email: typeof input.email === "undefined" ? undefined : input.email,
        address: typeof input.address === "undefined" ? undefined : input.address,
      });
      return resp.data as ApiResponse<CableVisionAccount>;
    },
    onSuccess: () => {
      notify.success("Saved", "Cable Vision account updated.");
      queryClient.invalidateQueries({ queryKey: ["cableVision", "accounts"] });
    },
    onError: (e: any) => {
      notify.error("Save failed", e?.response?.data?.message || e?.message || "Failed to update account");
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async (vars: { accountId: number }) => {
      const resp = await apiClient.delete(`/cable-vision/accounts/${vars.accountId}`);
      return resp.data as ApiResponse<CableVisionAccount>;
    },
    onSuccess: () => {
      notify.success("Deleted", "Cable Vision account deleted.");
      queryClient.invalidateQueries({ queryKey: ["cableVision", "accounts"] });
    },
    onError: (e: any) => {
      notify.error("Delete failed", e?.response?.data?.message || e?.message || "Failed to delete account");
    },
  });

  const createProfileMutation = useMutation({
    mutationFn: async (vars: {
      accountId: number;
      profileName: string;
      assignedTo?: string;
      deviceId?: string;
      monthlyFee?: number;
    }) => {
      const resp = await apiClient.post(`/cable-vision/accounts/${vars.accountId}/profiles`, {
        profileName: vars.profileName,
        assignedTo: vars.assignedTo || null,
        deviceId: vars.deviceId || null,
        monthlyFee: vars.monthlyFee ?? 0,
      });
      return resp.data as ApiResponse<CableVisionProfile>;
    },
    onSuccess: () => {
      notify.success("Created", "Profile added.");
      queryClient.invalidateQueries({ queryKey: ["cableVision", "accounts"] });
    },
    onError: (e: any) => {
      notify.error("Create failed", e?.response?.data?.message || e?.message || "Failed to create profile");
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (vars: {
      profileId: number;
      profileName: string;
      assignedTo?: string | null;
      deviceId?: string | null;
      monthlyFee?: number;
      status?: "active" | "inactive";
    }) => {
      const resp = await apiClient.put(`/cable-vision/profiles/${vars.profileId}`, {
        profileName: vars.profileName,
        assignedTo: typeof vars.assignedTo === "undefined" ? undefined : vars.assignedTo,
        deviceId: typeof vars.deviceId === "undefined" ? undefined : vars.deviceId,
        monthlyFee: typeof vars.monthlyFee === "undefined" ? undefined : vars.monthlyFee,
        status: typeof vars.status === "undefined" ? undefined : vars.status,
      });
      return resp.data as ApiResponse<CableVisionProfile>;
    },
    onSuccess: () => {
      notify.success("Saved", "Profile updated.");
      queryClient.invalidateQueries({ queryKey: ["cableVision", "accounts"] });
    },
    onError: (e: any) => {
      notify.error("Save failed", e?.response?.data?.message || e?.message || "Failed to update profile");
    },
  });

  const deleteProfileMutation = useMutation({
    mutationFn: async (vars: { profileId: number }) => {
      const resp = await apiClient.delete(`/cable-vision/profiles/${vars.profileId}`);
      return resp.data as ApiResponse<CableVisionProfile>;
    },
    onSuccess: () => {
      notify.success("Deleted", "Profile deleted.");
      queryClient.invalidateQueries({ queryKey: ["cableVision", "accounts"] });
    },
    onError: (e: any) => {
      notify.error("Delete failed", e?.response?.data?.message || e?.message || "Failed to delete profile");
    },
  });

  const generateMonthlyInvoicesMutation = useMutation({
    mutationFn: async (vars: { billingMonth?: string }) => {
      const resp = await apiClient.post("/cable-vision/invoices/generate-monthly", {
        billingMonth: vars.billingMonth,
      });
      return resp.data as ApiResponse<{ createdCount: number; billingMonth: string }>;
    },
    onSuccess: (data) => {
      const created = Number(data?.data?.createdCount ?? 0);
      notify.success("Generated", `Created ${created} invoice(s).`);
      queryClient.invalidateQueries({ queryKey: ["cableVision", "accounts"] });
      queryClient.invalidateQueries({ queryKey: ["cableVision", "invoices"] });
    },
    onError: (e: any) => {
      notify.error("Generate failed", e?.response?.data?.message || e?.message || "Failed to generate invoices");
    },
  });

  const payInvoiceMutation = useMutation({
    mutationFn: async (vars: { invoiceId: number; paymentMethod?: "cash" | "pos" | "transfer" | "other" }) => {
      const resp = await apiClient.post(`/cable-vision/invoices/pay/${vars.invoiceId}`, {
        paymentMethod: vars.paymentMethod || "cash",
      });
      return resp.data as ApiResponse<CableVisionInvoice>;
    },
    onSuccess: () => {
      notify.success("Paid", "Invoice marked as paid.");
      queryClient.invalidateQueries({ queryKey: ["cableVision", "accounts"] });
    },
    onError: (e: any) => {
      notify.error("Action failed", e?.response?.data?.message || e?.message || "Failed to pay invoice");
    },
  });

  const unpayInvoiceMutation = useMutation({
    mutationFn: async (vars: { invoiceId: number }) => {
      const resp = await apiClient.post(`/cable-vision/invoices/unpay/${vars.invoiceId}`);
      return resp.data as ApiResponse<CableVisionInvoice>;
    },
    onSuccess: () => {
      notify.success("Updated", "Invoice marked as unpaid.");
      queryClient.invalidateQueries({ queryKey: ["cableVision", "accounts"] });
    },
    onError: (e: any) => {
      notify.error("Action failed", e?.response?.data?.message || e?.message || "Failed to unpay invoice");
    },
  });

  return {
    accountsQuery,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    search,
    setSearch,
    billingMonth,
    setBillingMonth,
    billingMonthYmd,
    createAccountMutation,
    updateAccountMutation,
    deleteAccountMutation,
    createProfileMutation,
    updateProfileMutation,
    deleteProfileMutation,
    generateMonthlyInvoicesMutation,
    payInvoiceMutation,
    unpayInvoiceMutation,
  };
}

