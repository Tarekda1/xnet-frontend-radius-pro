import { apiClient } from "@/api/client";
import { useQuery } from "@tanstack/react-query";

export interface UserSessionRow {
  session_id: string;
  start_time: string | null;
  stop_time: string | null;
  session_time: number | null;
  bytes_in: string;
  bytes_out: string;
  total_bytes: string;
}

interface UserSessionsResponse {
  success: boolean;
  message: string;
  data: {
    username: string;
    totalSessions: number;
    totalPages: number;
    currentPage: number;
    limit: number;
    sessions: UserSessionRow[];
  };
}

async function fetchUserSessions(username: string, page: number, limit: number): Promise<UserSessionsResponse> {
  const res = await apiClient.get<UserSessionsResponse>(`/sessions/user/${encodeURIComponent(username)}`, {
    params: { page, limit },
  });
  return res.data;
}

export function useUserSessions(username: string, page: number, limit: number) {
  return useQuery<UserSessionsResponse, Error>({
    queryKey: ["userSessions", username, page, limit],
    queryFn: () => fetchUserSessions(username, page, limit),
    enabled: Boolean(username),
  });
}

