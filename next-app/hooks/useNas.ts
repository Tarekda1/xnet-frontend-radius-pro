import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { Nas } from '@/types/api';



interface NasApiResponse {
  success: boolean;
  message: string;
  data: {
    totalEntries: number;
    totalPages: number;
    currentPage: number;
    limit: number;
    nasEntries: Nas[];
  };
}

interface NasMutationData {
  nasname: string;
  shortname?: string;
  type?: string;
  ports?: number;
  secret: string;
  server?: string;
  community?: string;
  description?: string;
}

const fetchNasEntries = async (page: number = 1, limit: number = 10): Promise<NasApiResponse> => {
  const response = await apiClient.get<NasApiResponse>(`/nas?page=${page}&limit=${limit}`);
  return response.data;
};

const createNas = async (nasData: NasMutationData): Promise<Nas> => {
  const response = await apiClient.post<Nas>('/nas', nasData);
  return response.data;
};

const updateNas = async ({ id, ...nasData }: NasMutationData & { id: number }): Promise<Nas> => {
  const response = await apiClient.put<Nas>(`/nas/${id}`, nasData);
  return response.data;
};

const deleteNas = async (id: number): Promise<void> => {
  await apiClient.delete(`/nas/${id}`);
};

const useNas = (page: number = 1, limit: number = 10) => {
  const queryClient = useQueryClient();

  const nasQuery = useQuery<NasApiResponse, Error>({
    queryKey: ['nas', page, limit],
    queryFn: () => fetchNasEntries(page, limit),
  });

  const createNasMutation = useMutation<Nas, Error, NasMutationData>({
    mutationFn: createNas,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nas'] });
    },
  });

  const updateNasMutation = useMutation<Nas, Error, NasMutationData & { id: number }>({
    mutationFn: updateNas,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nas'] });
    },
  });

  const deleteNasMutation = useMutation<void, Error, number>({
    mutationFn: deleteNas,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nas'] });
    },
  });

  return {
    ...nasQuery,
    createNasMutation,
    updateNasMutation,
    deleteNasMutation,
  };
};

export default useNas;