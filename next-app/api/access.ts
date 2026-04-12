import { apiClient } from "./client";

export type PermissionsResponse = { permissions: string[] };

export type RoleDto = {
  id: number;
  key: string;
  name: string;
  description: string | null;
  permissions: string[];
};

export async function fetchPermissions(): Promise<string[]> {
  const { data } = await apiClient.get("/access/permissions");
  return (data?.data?.permissions ?? []) as string[];
}

export async function fetchRoles(): Promise<RoleDto[]> {
  const { data } = await apiClient.get("/access/roles");
  return (data?.data?.roles ?? []) as RoleDto[];
}

export async function updateRolePermissions(roleKey: string, permissions: string[]): Promise<string[]> {
  const { data } = await apiClient.put(`/access/roles/${encodeURIComponent(roleKey)}/permissions`, { permissions });
  return (data?.data?.permissions ?? []) as string[];
}

export type UserOverride = { permission: string; effect: "allow" | "deny" };

export async function fetchUserOverrides(userId: number): Promise<UserOverride[]> {
  const { data } = await apiClient.get(`/access/users/${userId}/overrides`);
  return (data?.data?.overrides ?? []) as UserOverride[];
}

export async function updateUserOverrides(userId: number, overrides: UserOverride[]): Promise<UserOverride[]> {
  const { data } = await apiClient.put(`/access/users/${userId}/overrides`, { overrides });
  return (data?.data?.overrides ?? []) as UserOverride[];
}

export type AccessUserDto = {
  id: number;
  username: string;
  email: string;
  role: string | null;
};

export async function searchAccessUsers(search: string, limit = 20): Promise<AccessUserDto[]> {
  const { data } = await apiClient.get(`/access/users`, { params: { search, limit } });
  return (data?.data?.users ?? []) as AccessUserDto[];
}

