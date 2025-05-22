import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AuthUsersApiResponse, AuthUser } from '../types/api';
import { apiClient } from '@/api/client';

interface AuthUserMutationData {
  username: string;
  email: string;
  password: string;
  role: string;
  isActive: boolean;
}

const fetchAuthUsers = async (): Promise<AuthUsersApiResponse> => {
  const response = await apiClient.get<AuthUsersApiResponse>('/auth/users');
  return response.data;
};

const createAuthUser = async (userData: AuthUserMutationData): Promise<AuthUser> => {
  const response = await apiClient.post<AuthUser>('/auth/register', userData);
  return response.data;
};

const updateAuthUser = async ({ id, ...userData }: AuthUserMutationData & { id: number }): Promise<AuthUser> => {
  const response = await apiClient.put<AuthUser>(`/auth/users/${id}`, userData);
  return response.data;
};



const useAuthUsers = () => {
  const queryClient = useQueryClient();

  const authUsersQuery = useQuery<AuthUsersApiResponse, Error>({
    queryKey: ['authUsers'],
    queryFn: fetchAuthUsers
  });

  const createAuthUserMutation = useMutation<AuthUser, Error, AuthUserMutationData>({
    mutationFn: createAuthUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['authUsers'] });
    },
  });

  const updateAuthUserMutation = useMutation<AuthUser, Error, AuthUserMutationData & { id: number }>({
    mutationFn: updateAuthUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['authUsers'] });
    },
  });

  const deleteAuthUserMutation = useMutation({
    mutationFn: async (username: string) => await apiClient.delete(`/auth/users/${username}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['authUsers'] });
    },
  });

  return {
    ...authUsersQuery,
    createAuthUserMutation,
    updateAuthUserMutation,
    deleteAuthUserMutation
  };
};

export default useAuthUsers;