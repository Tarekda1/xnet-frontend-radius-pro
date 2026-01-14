import { apiClient } from "@/api/client";

export async function changePassword(input: { currentPassword: string; newPassword: string }) {
  const { data } = await apiClient.post("/auth/change-password", input);
  return data?.data as { mustChangePassword: false; passwordChangedAt?: string };
}

