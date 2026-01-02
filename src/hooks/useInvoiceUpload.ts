import { useState } from 'react';
import { apiClient } from '@/api/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface UploadResponse {
  success: boolean;
  message: string;
  // Add any other fields that your API returns
}

export const useInvoiceUpload = () => {
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const uploadInvoiceMutation = useMutation<UploadResponse, Error, { file: File; billingMonth?: string }>({
    mutationFn: async ({ file, billingMonth }) => {
      const formData = new FormData();
      formData.append('file', file);
      if (billingMonth) {
        // Expect YYYY-MM format from UI; backend accepts YYYY-MM or full date
        formData.append('billingMonth', billingMonth);
      }

      const response = await apiClient.post<UploadResponse>('/invoices/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch any relevant queries
      queryClient.invalidateQueries({ queryKey: ['externalInvoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
    onError: (err) => {
      setError('An error occurred while uploading the file.');
      console.error(err);
    },
  });

  const uploadInvoice = (file: File, billingMonth?: string) => {
    setError(null);
    return uploadInvoiceMutation.mutateAsync({ file, billingMonth });
  };

  return { 
    uploadInvoice, 
    isLoading: uploadInvoiceMutation.isPending, 
    error 
  };
};