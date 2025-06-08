// ExternalInvoicesTable.tsx
import React from "react";
import {
    OnChangeFn,
    SortingState,
    RowSelectionState,
} from "@tanstack/react-table";
import { RefreshCw } from "lucide-react";

import { useExternalInvoices, InvoiceMetrics } from "@/hooks/useExternalInvoices";

import Loader from "@/components/ui/loader";
import Alert from "@/components/ui/Alert";
import { Button } from "@/components/ui/button";
import ExternalInvoiceSummaryCard from "@/components/ExternalInvoiceSummaryCard";
import ExternalInvoiceCard from "@/components/ExternalInvoiceCard";
import ExternalInvoiceDetailView from "@/components/ExternalInvoiceDetailView";
import DesktopTable from "@/components/DesktopTable"; // <— the TanStack table you wrote earlier
import type { ExternalInvoice } from "@/types/api";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "./ui/alert-dialog";

const pageSize = 100;
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
    /* ── fetch everything through the hook ─────────────────── */
    const {
        data,
        error,
        isLoading,
        refetch,
        currentPage,
        setCurrentPage,
        setInvoiceAsPaidMutation,
        updateInvoiceMutation,
        deleteInvoiceMutation
    } = useExternalInvoices({ initialPage, pageSize, search }); /* ← add `search` param to your hook */

    /* ── UI state local to this component ──────────────────── */
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [internalRowSelection, setInternalRowSelection] = React.useState<RowSelectionState>({});
    const [selectedInvoice, setSelected] = React.useState<ExternalInvoice | null>(null);
    const [invoiceToDelete, setInvoiceToDelete] = React.useState<number | null>(null);

    // Use external row selection if provided, otherwise use internal
    const rowSelection = externalRowSelection ?? internalRowSelection;
    const setRowSelection = externalOnRowSelectionChange ?? setInternalRowSelection;

    /* ── table callbacks in hook‑friendly types ────────────── */
    const onSortingChange: OnChangeFn<SortingState> = (u) => setSorting(u);
    const onRowSelectionChange: OnChangeFn<RowSelectionState> = setRowSelection;

    /* ── mutations ─────────────────────────────────────────── */
    const markPaid = (id: number) =>
        setInvoiceAsPaidMutation.mutate(id, { onSuccess: () => refetch() });

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

    /* ── guards ────────────────────────────────────────────── */
    if (isLoading) return <Loader />;
    if (error) return <Alert type="error" message={String(error)} />;

    const rows = data?.data.data ?? [];
    const pages = data?.data.totalPages ?? 1;

    return (
        <>
            {/* desktop table */}
            <div className="hidden md:block rounded-md border">
                <DesktopTable
                    invoices={rows}
                    currentPage={currentPage}
                    totalPages={pages}
                    pageSize={pageSize}
                    onNextPage={() => currentPage < pages && setCurrentPage((p) => p + 1)}
                    onPrevPage={() => currentPage > 1 && setCurrentPage((p) => p - 1)}
                    onPageSizeChange={onPageSizeChange || (() => {})}
                    onFirstPage={onFirstPage || (() => setCurrentPage(1))}
                    onLastPage={onLastPage || (() => setCurrentPage(pages))}
                    totalItems={totalItems || data?.data.total || 0}
                    sorting={sorting}
                    onSortingChange={onSortingChange}
                    rowSelection={rowSelection}
                    onRowSelectionChange={onRowSelectionChange}
                    onSetPaid={markPaid}
                    onViewInvoice={setSelected}
                    onDeleteInvoice={handleDelete}
                    search={search}
                    hideBulkActions={hideBulkActions}
                />
            </div>

            {/* mobile list */}
            <div className="md:hidden">
                {rows.map((inv) => (
                    <ExternalInvoiceCard
                        key={inv.id}
                        invoice={inv}
                        onSetPaid={() => markPaid(inv.id)}
                    />
                ))}
            </div>

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
        </>
    );
};

export default React.memo(ExternalInvoicesTable);
