import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AuthUsersApiResponse, AuthUser } from '../types/api';
import { apiClient } from '@/api/client';
import { notify } from '@/lib/notify';
import { MESSAGES } from '@/constants/messages';

export type AuthUserRole = "admin" | "manager" | "support" | "collector" | "reseller";

export interface CreateAuthUserInput {
  username: string;
  email: string;
  password: string;
  role: AuthUserRole;
  isActive: boolean;
}

export interface UpdateAuthUserInput {
  id: number;
  username: string;
  email?: string;
  password?: string; // omit to keep current
  role?: AuthUserRole;
  isActive?: boolean;
}

export interface ResetAuthUserPasswordInput {
  id: number;
  newPassword: string;
  mustChangePassword?: boolean;
}

const fetchAuthUsers = async (): Promise<AuthUsersApiResponse> => {
  const response = await apiClient.get<AuthUsersApiResponse>('/auth/users');
  return response.data;
};

const createAuthUser = async (userData: CreateAuthUserInput): Promise<AuthUser> => {
  const response = await apiClient.post<AuthUser>('/auth/register', userData);
  return response.data;
};

const updateAuthUser = async ({ id, ...userData }: UpdateAuthUserInput): Promise<AuthUser> => {
  const response = await apiClient.put<AuthUser>(`/auth/users/${id}`, userData);
  return response.data;
};

const resetAuthUserPassword = async ({ id, ...payload }: ResetAuthUserPasswordInput): Promise<void> => {
  await apiClient.post(`/auth/users/${id}/reset-password`, payload);
};



const useAuthUsers = () => {
  const queryClient = useQueryClient();

  const authUsersQuery = useQuery<AuthUsersApiResponse, Error>({
    queryKey: ['authUsers'],
    queryFn: fetchAuthUsers
  });

  const createAuthUserMutation = useMutation<AuthUser, Error, CreateAuthUserInput>({
    mutationFn: createAuthUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['authUsers'] });
      notify.success("Created", MESSAGES.authUsers.created);
    },
    onError: (error) => {
      notify.error("Create failed", error.message);
    },
  });

  const updateAuthUserMutation = useMutation<AuthUser, Error, UpdateAuthUserInput>({
    mutationFn: updateAuthUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['authUsers'] });
      notify.success("Saved", MESSAGES.authUsers.updated);
    },
    onError: (error) => {
      notify.error("Save failed", error.message);
    },
  });

  const resetAuthUserPasswordMutation = useMutation<void, Error, ResetAuthUserPasswordInput>({
    mutationFn: resetAuthUserPassword,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['authUsers'] });
      notify.success("Password reset", "New password has been set.");
    },
    onError: (error) => {
      notify.error("Reset failed", error.message);
    },
  });

  const deleteAuthUserMutation = useMutation({
    mutationFn: async (username: string) => await apiClient.delete(`/auth/users/${username}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['authUsers'] });
      notify.success("Deleted", MESSAGES.authUsers.deleted);
    },
    onError: (error: unknown) => {
      notify.error("Delete failed", error instanceof Error ? error.message : MESSAGES.common.deleteFailed);
    },
  });

  return {
    ...authUsersQuery,
    createAuthUserMutation,
    updateAuthUserMutation,
    resetAuthUserPasswordMutation,
    deleteAuthUserMutation
  };
};

export default useAuthUsers;