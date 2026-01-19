// ExternalInvoicesTable.tsx
import React from "react";
import { useSearchParams } from "react-router-dom";
import {
    OnChangeFn,
    SortingState,
    RowSelectionState,
} from "@tanstack/react-table";

import { useExternalInvoices } from "@/hooks/useExternalInvoices";

// import { Button } from "@/components/ui/button"; // not used here
import ExternalInvoiceCard from "@/components/ExternalInvoiceCard";
import ExternalInvoiceDetailView from "@/components/ExternalInvoiceDetailView";
import DesktopTable from "@/components/DesktopTable"; // <— the TanStack table you wrote earlier
import type { ExternalInvoice } from "@/types/api";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "./ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { useAuth } from "@/context/AuthContext";
import { can } from "@/lib/permissions";
import EmptyState from "@/components/EmptyState";
import { FileText } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import TablePager from "@/components/TablePager";
import QueryState from "@/components/QueryState";

const initialPage = 1;

type Props = { 
    search: string;
    key?: number;
    rowSelection?: RowSelectionState;
    onRowSelectionChange?: OnChangeFn<RowSelectionState>;
    hideBulkActions?: boolean;
    pageSize?: number;
    onPageSizeChange?: (size: number) => void;
    onFirstPage?: () => void;
    onLastPage?: () => void;
    totalItems?: number;
};

const ExternalInvoicesTable: React.FC<Props> = ({ 
    search, 
    rowSelection: externalRowSelection,
    onRowSelectionChange: externalOnRowSelectionChange,
    hideBulkActions = false,
    pageSize = 20,
    onPageSizeChange,
    onFirstPage,
    onLastPage,
    totalItems,
}) => {
    const { user } = useAuth();
    const canPay = can(user, 'billing.externalInvoices.pay');
    const canUnpay = can(user, 'billing.externalInvoices.unpay');

    /* ── URL state ─────────────────────────────────────────── */
    const [searchParams, setSearchParams] = useSearchParams();

    /* ── fetch everything through the hook ─────────────────── */
    const {
        data,
        error,
        isLoading,
        refetch,
        currentPage,
        setCurrentPage,
        setInvoiceAsPaidMutation,
        unpayInvoiceMutation,
        updateInvoiceMutation,
        deleteInvoiceMutation,
    } = useExternalInvoices({
        initialPage,
        pageSize,
        search,
        from: searchParams.get('from') || undefined,
        to: searchParams.get('to') || undefined,
        status: searchParams.get('status') || undefined,
        sortBy: (searchParams.get('sort') || '').split(':')[0] || undefined,
        sortDir: ((searchParams.get('sort') || '').split(':')[1] as 'asc' | 'desc') || undefined,
    });

    /* ── UI state local to this component ──────────────────── */
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [internalRowSelection, setInternalRowSelection] = React.useState<RowSelectionState>({});
    const [selectedInvoice, setSelected] = React.useState<ExternalInvoice | null>(null);
    const [invoiceToDelete, setInvoiceToDelete] = React.useState<number | null>(null);
    const { toast } = useToast();
    

    // Use external row selection if provided, otherwise use internal
    const rowSelection = externalRowSelection ?? internalRowSelection;
    const setRowSelection = externalOnRowSelectionChange ?? setInternalRowSelection;

    /* ── table callbacks in hook‑friendly types ────────────── */
    const onSortingChange: OnChangeFn<SortingState> = (u) => setSorting(u);
    const onRowSelectionChange: OnChangeFn<RowSelectionState> = setRowSelection;

    /* ── mutations ─────────────────────────────────────────── */
    const markPaid = (id: number) => {
        if (!canPay) return;
        const prev = (data?.data.data ?? []).find((x) => x.id === id)?.status || 'pending';
        setInvoiceAsPaidMutation.mutate({ invoiceId: id, silent: true }, {
            onSuccess: () => {
                refetch();
                toast({
                    title: `Invoice #${id} marked as paid`,
                    action: (
                        <ToastAction
                          altText="Undo"
                          onClick={() => {
                            if (canUnpay) {
                              unpayInvoiceMutation.mutate({ invoiceId: id, silent: true }, { onSuccess: () => refetch() });
                            } else {
                              updateInvoiceMutation.mutate({ invoiceId: id, invoiceData: { status: prev } }, { onSuccess: () => refetch() });
                            }
                          }}
                        >
                            Undo
                        </ToastAction>
                    ),
                });
            }
        });
    };

    const unpay = (id: number) => {
        unpayInvoiceMutation.mutate({ invoiceId: id }, { onSuccess: () => refetch() });
    };

    const handleDelete = (id: number) => {
        setInvoiceToDelete(id);
    };

    const confirmDelete = () => {
        if (invoiceToDelete) {
            deleteInvoiceMutation.mutate(invoiceToDelete, {
                onSuccess: () => {
                    refetch();
                    setInvoiceToDelete(null);
                },
            });
        }
    };

    const saveInvoice = (inv: ExternalInvoice) => {
        updateInvoiceMutation.mutate({ invoiceId: inv.id, invoiceData: inv });
        setSelected(null);
    };

    // Restore currentPage and sorting from URL on mount
    React.useEffect(() => {
        const p = Number(searchParams.get('p') || '');
        if (!Number.isNaN(p) && p > 0) {
            setCurrentPage(p);
        }
        const sortParam = searchParams.get('sort');
        if (sortParam) {
            const [col, dir] = sortParam.split(":");
            if (col) {
                setSorting([{ id: col, desc: dir === 'desc' }]);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Persist currentPage and sorting to URL
    React.useEffect(() => {
        const next = new URLSearchParams(searchParams);
        if (currentPage) next.set('p', String(currentPage)); else next.delete('p');
        if (sorting && sorting[0]) {
            const s = `${sorting[0].id}:${sorting[0].desc ? 'desc' : 'asc'}`;
            next.set('sort', s);
        } else {
            next.delete('sort');
        }
        setSearchParams(next, { replace: true } as any);
    }, [currentPage, sorting]);

    const rows = data?.data.data ?? [];
    const activeStatus = searchParams.get('status');
    const filteredRows = activeStatus && activeStatus !== 'all'
        ? rows.filter((r) => r.status === activeStatus)
        : rows;
    const pages = data?.data.totalPages ?? 1;
    const computedTotalItems = totalItems ?? data?.data.total ?? 0;

    return (
        <QueryState
            isLoading={isLoading}
            error={error}
            isEmpty={filteredRows.length === 0}
            onRetry={() => refetch()}
            loading={
                <div className="space-y-3">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                </div>
            }
            empty={
                <div className="p-4">
                    <EmptyState
                        title="No invoices found"
                        description="Try changing filters or search terms."
                        icon={FileText}
                    />
                </div>
            }
            errorTitle="Failed to load invoices"
        >
            {/* desktop table */}
            <div className="hidden md:block rounded-md border">
                <DesktopTable
                    invoices={filteredRows}
                    currentPage={currentPage}
                    totalPages={pages}
                    pageSize={pageSize}
                    hidePager={true}
                    onNextPage={() => currentPage < pages && setCurrentPage((p) => p + 1)}
                    onPrevPage={() => currentPage > 1 && setCurrentPage((p) => p - 1)}
                    onPageSizeChange={onPageSizeChange || (() => {})}
                    onFirstPage={onFirstPage || (() => setCurrentPage(1))}
                    onLastPage={onLastPage || (() => setCurrentPage(pages))}
                    totalItems={computedTotalItems}
                    sorting={sorting}
                    onSortingChange={onSortingChange}
                    rowSelection={rowSelection}
                    onRowSelectionChange={onRowSelectionChange}
                    onSetPaid={canPay ? markPaid : undefined}
                    onUnpay={canUnpay ? unpay : undefined}
                    onViewInvoice={setSelected}
                    onDeleteInvoice={handleDelete}
                    search={search}
                    hideBulkActions={hideBulkActions}
                />
            </div>

            {/* mobile list */}
            <div className="md:hidden">
                {filteredRows.map((inv) => (
                    <ExternalInvoiceCard
                        key={inv.id}
                        invoice={inv}
                        onSetPaid={canPay ? () => markPaid(inv.id) : undefined}
                    />
                ))}
            </div>

            <TablePager
                currentPage={currentPage}
                totalPages={pages}
                totalItems={computedTotalItems}
                pageSize={pageSize}
                pageSizeOptions={[10, 20, 50, 100, 200, 500]}
                onPageChange={(p) => setCurrentPage(p)}
                onPageSizeChange={(n) => {
                    onPageSizeChange?.(n);
                    setCurrentPage(1);
                }}
                isDisabled={isLoading}
                noun="invoices"
            />

            {selectedInvoice && (
                <ExternalInvoiceDetailView
                    invoice={selectedInvoice}
                    onClose={() => setSelected(null)}
                    onSave={saveInvoice}
                />
            )}

            <AlertDialog open={invoiceToDelete !== null} onOpenChange={() => setInvoiceToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the invoice.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </QueryState>
    );
};

export default React.memo(ExternalInvoicesTable);
