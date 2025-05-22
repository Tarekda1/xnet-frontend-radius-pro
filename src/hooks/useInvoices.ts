import { useState } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { apiClient } from '@/api/client';

interface Invoice {
    id: number;
    billingMonth: string;
    amount: number;
    status: string;
    userProfile: {
        username: string;
        profile: {
            profileName: string;
        };
    };
    userDetails:{
        fullName: string;
        email: string;
        phoneNumber: string;
    }
}

interface PaginatedData<T> {
    data: T[];
    total: number;
    page: number;
    totalPages: number;
}

interface ApiResponse<T> {
    status: string;
    message: string;
    data: T;
}

type InvoicesResponse = ApiResponse<PaginatedData<Invoice>>;

const fetchInvoices = async (page: number, limit: number, searchQuery: string): Promise<InvoicesResponse> => {
    const { data } = await apiClient.get<InvoicesResponse>(`/invoices?page=${page}&limit=${limit}&${searchQuery}`);
    return data;
};

const generateMonthlyInvoices = async (): Promise<void> => {
    await apiClient.post('/invoices/generate-monthly');
  };

const setInvoiceAsPaid = async (invoiceId: number): Promise<void> => {
    await apiClient.post(`/invoices/pay/${invoiceId}`);
};

export const useInvoices = (initialPage: number, pageSize: number) => {
    const [currentPage, setCurrentPage] = useState(initialPage);
    const [searchQuery, setSearchQuery] = useState('');
    const queryClient = useQueryClient();

    const { data, error, isLoading, refetch } = useQuery<InvoicesResponse, Error>({
        queryKey: ['invoices', currentPage, pageSize, searchQuery],
        queryFn: () => fetchInvoices(currentPage, pageSize, searchQuery),
    });

    const setInvoiceAsPaidMutation = useMutation({
        mutationFn: setInvoiceAsPaid,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
        },
    });

    const generateInvoicesMutation  = useMutation({
        mutationFn: generateMonthlyInvoices,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
        },
    });

    return {
        data,
        error,
        isLoading,
        refetch,
        setCurrentPage,
        currentPage,
        searchQuery,
        setSearchQuery,
        setInvoiceAsPaidMutation,
        generateInvoicesMutation
    };
};