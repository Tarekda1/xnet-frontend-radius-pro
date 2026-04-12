import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { notify } from '@/lib/notify';
import { MESSAGES } from '@/constants/messages';

export interface Profile {
  id?: number;
  profileName: string;
  dailyQuota: string;
  monthlyQuota: string;
  price?: number | null;
  nightStart?: string;
  nightEnd?: string;
  speedDown?: number;
  speedUp?: number;
  sessionTimeout?: number;
  idleTimeout?: number;
  maxSessions?: number;
}

interface ProfileApiResponse {
  success: boolean;
  message: string;
  data: Profile[];
}

const fetchProfiles = async (): Promise<ProfileApiResponse> => {
  const response = await apiClient.get<ProfileApiResponse>('/profiles');
  return response.data;
};

const createProfile = async (profile: Omit<Profile, 'id'>): Promise<Profile> => {
  const response = await apiClient.post<{ success: boolean; message: string; data: Profile }>('/profiles', profile);
  return response.data.data;
};

const updateProfile = async (profile: Profile): Promise<Profile> => {
  const response = await apiClient.put<{ success: boolean; message: string; data: Profile }>(`/profiles/${profile.id}`, profile);
  return response.data.data;
};

const deleteProfile = async (id: number): Promise<void> => {
  await apiClient.delete(`/profiles/${id}`);
};
export const useProfiles = () => {
  const queryClient = useQueryClient();

  const query = useQuery<ProfileApiResponse, Error>({
    queryKey: ['profiles'],
    queryFn: fetchProfiles,
  });

  const createMutation = useMutation({
    mutationFn: createProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      notify.success("Created", MESSAGES.profiles.created);
    },
    onError: (error: unknown) => {
      notify.error("Create failed", error instanceof Error ? error.message : MESSAGES.common.createFailed);
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      notify.success("Saved", MESSAGES.profiles.updated);
    },
    onError: (error: unknown) => {
      notify.error("Save failed", error instanceof Error ? error.message : MESSAGES.common.updateFailed);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      notify.success("Deleted", MESSAGES.profiles.deleted);
    },
    onError: (error: unknown) => {
      notify.error("Delete failed", error instanceof Error ? error.message : MESSAGES.common.deleteFailed);
    },
  });

  return {
    ...query,
    createProfile: createMutation.mutate,
    updateProfile: updateMutation.mutate,
    deleteProfile: deleteMutation.mutate,
  };
};
