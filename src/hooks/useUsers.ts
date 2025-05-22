import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UsersApiResponse, User } from '../types/api';
import { apiClient } from '@/api/client';
import { useState } from 'react';

export enum AccountStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

interface UserMutationData {
  username: string;
  password: string;
  profileId: number;
  accountStatus?:AccountStatus;
}

// const fetchUsers = async (page: number, pageSize: number): Promise<UsersApiResponse> => {
//   const response = await apiClient.get<UsersApiResponse>('/radius/users',{
//     params: { page, pageSize }
//   });
//   return response.data;
// };
const fetchUsers = async (page: number, pageSize: number, searchQuery: string): Promise<UsersApiResponse> => {
  if (searchQuery) {
    const response = await apiClient.get<UsersApiResponse>('/radius/users/search', {
      params: { query: searchQuery }
    });
    return response.data;
  } else {
    const response = await apiClient.get<UsersApiResponse>('/radius/users', {
      params: { page, pageSize }
    });
    return response.data;
  }
};

const createUser = async ({ username, ...userData }:  UserMutationData & { username: string }): Promise<User> => {
  const response = await apiClient.post<User>('/radius/users', { username, ...userData });
  return response.data;
};

const updateUser = async ({ username, ...userData }: UserMutationData & { username: string }): Promise<User> => {
  const response = await apiClient.put<User>(`/radius/users/${username}`, { username, ...userData });
  return response.data;
};

const deleteUser = async (username: string): Promise<void> => {
  await apiClient.delete(`/radius/users/${username}`);
};

const resetMacAddress = async (username: string): Promise<User> => {
  const response = await apiClient.post<User>(`/radius/users/resetAddress/${username}`);
  return response.data;
};


const useUsers = (initialPage = 1, pageSize = 10) => {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();

  const usersQuery = useQuery<UsersApiResponse, Error>({
    queryKey: ['users',currentPage, pageSize,searchQuery],
    queryFn: () => fetchUsers(currentPage, pageSize,searchQuery),
  });

  const createUserMutation = useMutation<User, Error, UserMutationData & { username: string }>({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const updateUserMutation = useMutation<User, Error, UserMutationData & { username: string }>({
    mutationFn: updateUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
  

  const deleteUserMutation = useMutation<void, Error, string>({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const resetMacAddressMutation = useMutation<User, Error, string>({
    mutationFn: resetMacAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  return {
    ...usersQuery,
    setSearchQuery,
    searchQuery,
    currentPage,
    setCurrentPage,
    deleteUserMutation,
    createUserMutation,
    updateUserMutation,
    resetMacAddressMutation
  };
};

export default useUsers;

