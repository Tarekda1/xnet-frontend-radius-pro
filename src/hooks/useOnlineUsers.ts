import { apiClient } from '@/api/client';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export interface OnlineUser {
  session_username: string;
  session_mac_address: string;
  session_start_time: string;
  session_last_update: string | null;
  session_status: string;
  session_session_time: number;
  profile_profile_name: string;
  profile_daily_quota: string;
  profile_monthly_quota: string;
  monthly_usage: string;
  total_bytes_in: string;
  total_bytes_out: string;
  total_daily_usage: string;
  real_time_data_usage: string;
  remaining_daily_quota: string;
  remaining_monthly_quota: string;
  userDetails_full_name: string;
  is_fallback: number;
}

interface OnlineUsersResponse {
  success: boolean;
  message: string;
  totalPages: number;
  currentPage: number;
  limit: number;
  totalUsers: number;
  data: OnlineUser[];
}

interface ResetDailyQuotaResponse {
  success: boolean;
  message: string;
}

const fetchOnlineUsers = async (page: number = 1, limit: number = 10, search: string): Promise<OnlineUsersResponse> => {
  const response = await apiClient.get<OnlineUsersResponse>(`/online-users?page=${page}&limit=${limit}&search=${search}`);
  return response.data;
};

// Define the API call for resetting the daily quota
const resetDailyQuota = async ({ username }: { username: string }): Promise<ResetDailyQuotaResponse> => {
  const response = await apiClient.put<ResetDailyQuotaResponse>(`/radius/users/resetQuota/${username}`);
  return response.data;
};

export const useOnlineUsers = (search = "", initialPage: number = 1, initialLimit: number = 100) => {
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  //const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  const userQuery = useQuery({
    queryKey: ['onlineUsers', page, limit, search],
    queryFn: () => fetchOnlineUsers(page, limit, search),
  });

  const resetDailyUserQuotaMutation = useMutation<ResetDailyQuotaResponse, Error, { username: string }>({
    mutationFn: resetDailyQuota,
    onSuccess: () => {
      // Optionally, you can invalidate queries that need updating, e.g., the online users list
      queryClient.invalidateQueries({ queryKey: ['onlineUsers'] });
    },
  });

  return {
    ...userQuery,
    resetDailyUserQuotaMutation,
    page,
    setPage,
    limit,
    setLimit,
  };
};
