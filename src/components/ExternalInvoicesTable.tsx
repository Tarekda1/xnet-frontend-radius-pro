// ExternalInvoicesTable.tsx
import React from "react";
import {
    OnChangeFn,
    SortingState,
    RowSelectionState,
} from "@tanstack/react-table";
import { utils, writeFile } from "xlsx";
import { Check, Download, RefreshCw } from "lucide-react";

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

type Props = { search: string };

const ExternalInvoicesTable: React.FC<Props> = ({ search }) => {
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
    const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
    const [selectedInvoice, setSelected] = React.useState<ExternalInvoice | null>(null);
    const [invoiceToDelete, setInvoiceToDelete] = React.useState<number | null>(null);
    // const [dateRange, setDateRange] = React.useState<DateRange | undefined>();

    /* when dateRange changes, build query string & reset page */
    // React.useEffect(() => {
    //   if (!dateRange?.from || !dateRange?.to) return;

    //   const params = new URLSearchParams();
    //   params.set("dateFrom", dateRange.from.toISOString().split("T")[0]);
    //   params.set("dateTo",   dateRange.to.toISOString().split("T")[0]);
    //   setCurrentPage(1);
    //   setSearchQuery(params.toString());      // if your hook exposes it
    // }, [dateRange]);


    /* ── table callbacks in hook‑friendly types ────────────── */
    const onSortingChange: OnChangeFn<SortingState> = (u) => setSorting(u);
    const onRowSelectionChange: OnChangeFn<RowSelectionState> = (u) => setRowSelection(u);

    /* ── mutations ─────────────────────────────────────────── */
    const markPaid = (id: number) =>
        setInvoiceAsPaidMutation.mutate(id, { onSuccess: () => refetch() });

    const bulkPaid = () => {
        Object.values(rowSelection).forEach((row: any) => markPaid(row.original.id));
        setRowSelection({});
    };

    const exportXlsx = () => {
        if (!data?.data.data?.length) return;
        const ws = utils.json_to_sheet(data.data.data);
        const wb = utils.book_new();
        utils.book_append_sheet(wb, ws, "External Invoices");
        writeFile(wb, "external_invoices.xlsx");
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

    /* ── guards ────────────────────────────────────────────── */
    if (isLoading) return <Loader />;
    if (error) return <Alert type="error" message={String(error)} />;

    const metrics = data?.data.metrics as InvoiceMetrics;
    const rows = data?.data.data ?? [];
    const pages = data?.data.totalPages ?? 1;

    return (
        <>
            {rows.length > 0 && <ExternalInvoiceSummaryCard metrics={metrics} />}

            {/* bulk + export actions */}
            <div className="flex flex-col sm:flex-row gap-2 pb-4">
                <Button
                    variant="outline"
                    onClick={bulkPaid}
                    disabled={Object.keys(rowSelection).length === 0}
                >
                    <Check className="h-4 w-4 mr-1" />
                    Set Selected as Paid
                </Button>

                <Button variant="outline" onClick={() => refetch()}>
                    <RefreshCw className="h-4 w-4 mr-1" /> Refresh
                </Button>

                <Button
                    variant="outline"
                    onClick={exportXlsx}
                    disabled={!rows.length}
                >
                    <Download className="h-4 w-4 mr-1" /> Export
                </Button>
            </div>

            {/* desktop table */}
            <div className="hidden md:block rounded-md border">
                <DesktopTable
                    invoices={rows}
                    currentPage={currentPage}
                    totalPages={pages}
                    pageSize={pageSize}
                    onNextPage={() => currentPage < pages && setCurrentPage((p) => p + 1)}
                    onPrevPage={() => currentPage > 1 && setCurrentPage((p) => p - 1)}
                    sorting={sorting}
                    onSortingChange={onSortingChange}
                    rowSelection={rowSelection}
                    onRowSelectionChange={onRowSelectionChange}
                    onSetPaid={markPaid}
                    onViewInvoice={setSelected}
                    onDeleteInvoice={handleDelete}
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
