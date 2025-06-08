import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { toast } from 'react-toastify';
import { ExternalInvoice } from '@/types/api';
import { RowSelectionState, SortingState } from '@tanstack/react-table';

// interface ExternalInvoice {
//     id: number;
//     username: string;
//     fullName: string;
//     email: string;
//     phoneNumber: string;
//     address: string;
//     billingMonth: string;
//     amount: number;
//     status: string;
//     createdAt: string;
//     paidAt: string | null;
// }

interface PaginatedResponse<T> {
    data: T[];
    page: number;
    totalPages: number;
    total: number;
    metrics: InvoiceMetrics;
}

export interface InvoiceMetrics {
    totalInvoices: number;
    totalPaid: number;
    totalUnpaid: number;
    totalAmount: number;
    totalPending: number;
}


interface ApiResponse<T> {
    status: string;
    message: string;
    data: T;
}

const fetchExternalInvoices = async (page: number, limit: number, searchQuery: string): Promise<ApiResponse<PaginatedResponse<ExternalInvoice>>> => {
    const response = await apiClient.get(`/invoices/external?page=${page}&limit=${limit}&search=${searchQuery}`);
    return response.data;
};

const setInvoiceAsPaid = async (invoiceId: number): Promise<ApiResponse<ExternalInvoice>> => {
    const response = await apiClient.post(`/invoices/external/pay/${invoiceId}`);
    return response.data;
};

const updateInvoice = async (invoiceId: number, invoiceData: Partial<ExternalInvoice>): Promise<ApiResponse<ExternalInvoice>> => {
    const response = await apiClient.put(`/invoices/external/${invoiceId}`, invoiceData);
    return response.data;
};


const deleteInvoice = async (invoiceId: number): Promise<ApiResponse<ExternalInvoice>> => {
    const response = await apiClient.delete(`/invoices/external/${invoiceId}`);
    return response.data;
};

type UpdateInvoiceVariables = {
    invoiceId: number;
    invoiceData: Partial<ExternalInvoice>;
};

type Props = { search: string; initialPage: number; pageSize: number; };

export const useExternalInvoices = ({ initialPage, pageSize, search }: Props) => {
    const [currentPage, setCurrentPage] = useState(initialPage);
    const [sorting, setSorting] = useState<SortingState>([]);
    const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
    const queryClient = useQueryClient();

    const { data, error, isLoading, refetch } = useQuery<ApiResponse<PaginatedResponse<ExternalInvoice>>, Error>({
        queryKey: ['externalInvoices', currentPage, pageSize, search],
        queryFn: () => fetchExternalInvoices(currentPage, pageSize, search),
    });

    const updateInvoiceMutation = useMutation<ApiResponse<ExternalInvoice>, Error, UpdateInvoiceVariables>({
        mutationFn: ({ invoiceId, invoiceData }) => updateInvoice(invoiceId, invoiceData),
        onSuccess: () => {
            toast.success("Invoice updated successfully");
            refetch();
        },
        onError: (error) => {
            toast.error(`Failed to update invoice: ${error instanceof Error ? error.message : 'An unknown error occurred.'}`);
        }

    });


    const deleteInvoiceMutation = useMutation({
        mutationFn: (invoiceId: number) => deleteInvoice(invoiceId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['externalInvoices'] });
        }
    });

    const setInvoiceAsPaidMutation = useMutation({
        mutationFn: setInvoiceAsPaid,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['externalInvoices'] });
            toast.success('Invoice marked as paid successfully');
        },
        onError: (error: Error) => {
            toast.error(`Failed to mark invoice as paid: ${error.message}`);
        },
    });

    return {
        data,
        error,
        isLoading,
        refetch,
        setCurrentPage,
        currentPage,
        setInvoiceAsPaidMutation,
        updateInvoiceMutation,
        deleteInvoiceMutation
    };
};