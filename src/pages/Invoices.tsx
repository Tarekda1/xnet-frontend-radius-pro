import React, { useEffect, useState } from 'react';
import PageHeader from "@/components/PageHeader";
import IconActionButton from "@/components/IconActionButton";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    flexRender,
    getCoreRowModel,
    useReactTable,
    ColumnDef,
    SortingState,
    getSortedRowModel,
} from "@tanstack/react-table";
import { useInvoices } from '../hooks/useInvoices';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowUpDown, CalendarIcon, Check, CheckCircle, DollarSign, Download, Eye, FileText, PlusCircle, RefreshCw, UserCircle, X, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Loader from '@/components/ui/loader';
import { DateRangePicker } from '@/components/ui/DateRangePicker';
import { DateRange } from 'react-day-picker';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { notify } from '@/lib/notify';
import { MESSAGES } from '@/constants/messages';
import TablePager from '@/components/TablePager';
import TableToolbar from "@/components/TableToolbar";
import TableRowActions from "@/components/TableRowActions";
import SearchBar from "@/components/SearchBar";
import FiltersBar from "@/components/FiltersBar";
import QueryState from "@/components/QueryState";
import SavedViews from "@/components/SavedViews";

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
    userDetails?: {
        fullName: string;
        email?: string;
        phoneNumber?: string;
    };
}



const InvoiceSummaryCard: React.FC<{ invoices: Invoice[]; totalSum: number }> = ({ invoices, totalSum }) => {
    const paidInvoices = invoices.filter(inv => inv.status === 'paid');
    const unpaidInvoices = invoices.filter(inv => inv.status !== 'paid');
    const totalPaidCount = paidInvoices.length;
    const totalUnpaidCount = unpaidInvoices.length;
    const totalInvoices = invoices.length;

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Paid Invoices</CardTitle>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalPaidCount}</div>
                    <p className="text-xs text-muted-foreground">
                        {((totalPaidCount / totalInvoices) * 100).toFixed(1)}% of total
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Unpaid Invoices</CardTitle>
                    <XCircle className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalUnpaidCount}</div>
                    <p className="text-xs text-muted-foreground">
                        {((totalUnpaidCount / totalInvoices) * 100).toFixed(1)}% of total
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
                    <FileText className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalInvoices}</div>
                    <p className="text-xs text-muted-foreground">
                        All invoices
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Sum</CardTitle>
                    <DollarSign className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">${totalSum.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">
                        Total amount of all invoices
                    </p>
                </CardContent>
            </Card>
        </div>
    );
};

const InvoiceCard: React.FC<{ invoice: Invoice; onSetPaid: () => void }> = ({ invoice, onSetPaid }) => {
    return (
        <Card className="mb-4">
            <CardHeader>
                <CardTitle className="flex justify-between items-center">
                    <span className="font-semibold text-blue-600">Invoice #{invoice.id}</span>
                    <div className={`flex items-center ${invoice.status === 'paid' ? 'text-green-600' : 'text-red-600'}`}>
                        {invoice.status === 'paid' ? (
                            <CheckCircle className="h-4 w-4 mr-2" />
                        ) : (
                            <XCircle className="h-4 w-4 mr-2" />
                        )}
                        {invoice.status}
                    </div>
                </CardTitle>
                <CardDescription>{invoice.userProfile.username}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 gap-2 text-sm mb-2">
                    <div>
                        <span className="font-semibold">Profile:</span> {invoice.userProfile.profile.profileName}
                    </div>
                    <div>
                        <span className="font-semibold">Billing Month:</span> {new Date(invoice.billingMonth).toLocaleDateString()}
                    </div>
                </div>
                <div className="text-lg font-bold">
                    Amount: ${invoice.amount.toFixed(2)}
                </div>
            </CardContent>
            <CardFooter className="flex justify-end">
                {invoice.status !== 'paid' ? (
                    <Button variant="outline" size="sm" onClick={onSetPaid}>
                        <Check className="h-4 w-4 mr-2" /> Set as Paid
                    </Button>
                ) : <Button variant="outline" disabled size="sm" onClick={onSetPaid}>
                    <Check className="h-4 w-4 mr-2" /> Set as Paid
                </Button>}
            </CardFooter>
        </Card>
    );
};

const NoInvoicesMessage: React.FC<{ onGenerateInvoice: () => void; isGenerating: boolean }> = ({
    onGenerateInvoice,
    isGenerating
}) => (
    <div className="text-center py-10">
        <h3 className="text-lg font-semibold mb-2">No Invoices Available</h3>
        <p className="text-gray-600 mb-4">There are currently no invoices to display.</p>
        <Button onClick={onGenerateInvoice} disabled={isGenerating}>
            {isGenerating ? "Generating..." : "Generate Invoices"}
        </Button>
    </div>
);

const InvoiceDetailView: React.FC<{ invoice: Invoice; onClose: () => void }> = ({ invoice, onClose }) => {
    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Invoice Details</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="id" className="text-right">ID</Label>
                        <Input id="id" value={invoice.id} readOnly className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="username" className="text-right">Username</Label>
                        <Input id="username" value={invoice.userProfile.username} readOnly className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="profile" className="text-right">Profile</Label>
                        <Input id="profile" value={invoice.userProfile.profile.profileName} readOnly className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="billingMonth" className="text-right">Billing Month</Label>
                        <Input id="billingMonth" value={new Date(invoice.billingMonth).toLocaleDateString()} readOnly className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="amount" className="text-right">Amount</Label>
                        <Input id="amount" value={`$${invoice.amount.toFixed(2)}`} readOnly className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="status" className="text-right">Status</Label>
                        <Input id="status" value={invoice.status} readOnly className="col-span-3" />
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={onClose}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

const InvoicesComponent: React.FC = () => {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = useState('');
    const [pageSize, setPageSize] = useState(50);
    const { data, error, isLoading, refetch, setCurrentPage, currentPage, setSearchQuery, searchQuery, setInvoiceAsPaidMutation, generateInvoicesMutation } =
        useInvoices(1, pageSize);
    const [dateRange, setDateRange] = React.useState<DateRange | undefined>();
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [rowSelection, setRowSelection] = React.useState({});

    const handleViewInvoice = (invoice: Invoice) => {
        setSelectedInvoice(invoice);
    };

    const handleSetPaid = (invoiceId: number) => {
        setInvoiceAsPaidMutation.mutate({ invoiceId });
        refetch();
    };

    useEffect(() => {
        const selectedRows = table.getSelectedRowModel().rows;
        console.log("Selected rows:", selectedRows.map(row => row.original));
    }, [rowSelection]);

    const columns: ColumnDef<Invoice>[] = [
        {
            accessorKey: "id",
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="hover:bg-gray-100"
                >
                    ID
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => <span className="font-mono text-sm font-semibold">#{row.original.id}</span>,
        },
        {
            id: 'select',
            header: ({ table }) => (
                <Checkbox
                    checked={table.getIsAllPageRowsSelected()}
                    onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                    aria-label="Select all"
                />
            ),
            cell: ({ row }) => (
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) => {
                        row.toggleSelected(!!value);
                        row.getToggleSelectedHandler();
                        console.log("Selected rows:", row.getIsSelected())
                    }}
                    aria-label="Select row"
                />
            ),
            enableSorting: false,
            enableHiding: false,
        },
        {
            accessorKey: "userProfile.username",
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="hover:bg-gray-100"
                >
                    Username
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => (
                <div className="flex items-center">
                    <span className="font-medium text-blue-600">{row.original.userProfile.username}</span>
                </div>
            ),
        },
        {
            accessorKey: "userDetails.fullName",
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="hover:bg-gray-100"
                >
                    FullName
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => (
                <div className="flex items-center">
                    <UserCircle className="h-5 w-5 text-blue-500 mr-2" />
                    <span className="font-medium text-blue-600">{row.original.userDetails?.fullName ?? "-"}</span>
                </div>
            ),
        },
        {
            accessorKey: "userProfile.profile.profileName",
            header: "Profile",
            cell: ({ row }) => (
                <Badge variant="outline" className="font-semibold text-xs px-2 py-1">
                    {row.original.userProfile.profile.profileName}
                </Badge>
            ),
        },
        {
            accessorKey: "billingMonth",
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="hover:bg-gray-100"
                >
                    Billing Month
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => (
                <div className="flex items-center">
                    <CalendarIcon className="h-4 w-4 text-gray-500 mr-2" />
                    <span>{new Date(row.original.billingMonth).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                </div>
            ),
        },
        {
            accessorKey: "amount",
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="hover:bg-gray-100"
                >
                    Amount
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => (
                <div className="flex items-center font-semibold">
                    <DollarSign className="h-4 w-4 text-green-500 mr-1" />
                    {row.original.amount.toFixed(2)}
                </div>
            ),
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => (
                <div className="flex items-center">
                    {row.original.status === 'paid' ? (
                        <Badge variant="success" className="font-semibold">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Paid
                        </Badge>
                    ) : (
                        <Badge variant="destructive" className="font-semibold text-white">
                            <XCircle className="h-3 w-3 mr-1" />
                            Unpaid
                        </Badge>
                    )}
                </div>
            ),
        },
        {
            id: 'actions',
            header: () => <div className="text-right pr-2">Actions</div>,
            cell: ({ row }) => (
                <div className="flex justify-end pr-2">
                    <TableRowActions
                        actions={[
                            { label: "View details", icon: Eye, onClick: () => handleViewInvoice(row.original) },
                            {
                                label: "Set as Paid",
                                icon: Check,
                                onClick: () => handleSetPaid(row.original.id),
                                disabled: row.original.status === "paid",
                            },
                        ]}
                    />
                </div>
            ),
        },
    ];



    const handleBulkSetPaid = () => {
        const selectedRows = table.getSelectedRowModel().rows;
        selectedRows.forEach((row) => setInvoiceAsPaidMutation.mutate({ invoiceId: row.original.id, silent: true }));
        table.resetRowSelection();
        notify.success("Success", `Marked ${selectedRows.length} invoice(s) as paid.`);
        refetch();
    };

    const handleRefresh = () => {
        refetch();
    };

    const savedViewsKeys = ["q", "from", "to", "ps", "sort"];
    const buildViewState = () => {
        const state: Record<string, string> = {
            q: globalFilter || "",
            ps: String(pageSize),
            from: dateRange?.from ? dateRange.from.toISOString().split("T")[0] : "",
            to: dateRange?.to ? dateRange.to.toISOString().split("T")[0] : "",
        };
        if (sorting?.[0]?.id) {
            state.sort = `${sorting[0].id}:${sorting[0].desc ? "desc" : "asc"}`;
        } else {
            state.sort = "";
        }
        return state;
    };

    const applyViewState = (state: Record<string, string>) => {
        const q = state.q ?? "";
        setGlobalFilter(q);

        const psNum = parseInt(state.ps ?? "", 10);
        if (!Number.isNaN(psNum) && psNum > 0) setPageSize(psNum);

        const from = state.from || "";
        const to = state.to || "";
        if (from && to) {
            setDateRange({ from: new Date(from), to: new Date(to) });
        } else {
            setDateRange(undefined);
        }

        const sort = state.sort || "";
        if (sort.includes(":")) {
            const [id, dir] = sort.split(":");
            if (id) setSorting([{ id, desc: dir === "desc" }]);
        } else {
            setSorting([]);
        }

        // Sync query used by the hook
        const sp = new URLSearchParams();
        if (q) sp.set("search", q);
        if (from && to) {
            sp.set("dateFrom", from);
            sp.set("dateTo", to);
        }
        setSearchQuery(sp.toString());
        setCurrentPage(1);
        refetch();
    };

    const handleClearSearch = () => {
        setGlobalFilter('');
        setSearchQuery('');
        setDateRange(undefined);
        setCurrentPage(1);
    };

    const handleDateRangeChange = (range: DateRange | undefined) => {
        setDateRange(range);
        if (range?.from && range?.to) {
            let searchParams = new URLSearchParams(searchQuery);
            searchParams.set('dateFrom', range.from.toISOString().split('T')[0]);
            searchParams.set('dateTo', range.to.toISOString().split('T')[0]);
            setSearchQuery(searchParams.toString());
            setCurrentPage(1);
        }
    };

    const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        let searchParams = new URLSearchParams();

        // Add text search if it exists
        if (globalFilter) {
            searchParams.append('search', globalFilter);
        }

        // Add date range if it exists
        if (dateRange?.from && dateRange?.to) {
            searchParams.append('dateFrom', dateRange.from.toISOString().split('T')[0]);
            searchParams.append('dateTo', dateRange.to.toISOString().split('T')[0]);
        }

        setSearchQuery(searchParams.toString());
        setCurrentPage(1);
    };
    // const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    //     event.preventDefault();
    //     let searchParams = new URLSearchParams();

    //     // Add text search if it exists
    //     if (globalFilter) {
    //         searchParams.append('search', globalFilter);
    //     }

    //     // Add date range if it exists
    //     if (dateRange?.from && dateRange?.to) {
    //         searchParams.append('dateFrom', dateRange.from.toISOString());
    //         searchParams.append('dateTo', dateRange.to.toISOString());
    //     }

    //     setSearchQuery(searchParams.toString());
    //     setCurrentPage(1);
    // };

    const handleGenerateInvoice = async () => {
        // Implement the logic to generate a new invoice
        console.log("Generating new invoice...");
        // After generating, you might want to refetch the invoices
        // refetch();
        generateInvoicesMutation.mutate();
        await refetch();
    };

    const table = useReactTable({
        data: data?.data.data ?? [],
        columns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        pageCount: data?.data.totalPages ?? -1,
        state: {
            rowSelection,
            sorting,
            globalFilter,
            pagination: {
                pageIndex: currentPage - 1,
                pageSize: pageSize,
            },
        },
        onSortingChange: setSorting,
        manualPagination: true,
        enableRowSelection: true, // Add this line
        onRowSelectionChange: (updatedRowSelection) => {
            setRowSelection(updatedRowSelection);
            console.log("Updated row selection:", updatedRowSelection);
        },
    });


    const handleGenerateInvoices = async () => {
        try {
            await generateInvoicesMutation.mutateAsync();
            refetch();
        } catch (error: unknown) {
            notify.error("Action failed", error instanceof Error ? error.message : MESSAGES.common.actionFailed);
        }
    };


    const handleExportInvoices = async () => {
        if (data?.data.data) {
            const xlsx = await import("xlsx");
            const ws = xlsx.utils.json_to_sheet(data.data.data);
            const wb = xlsx.utils.book_new();
            xlsx.utils.book_append_sheet(wb, ws, "Invoices");
            xlsx.writeFile(wb, "invoices.xlsx");
        }
    };

    useEffect(() => {
        if (generateInvoicesMutation.isSuccess) {
            refetch();
        }
    }, [generateInvoicesMutation.isSuccess]);

    const totalSum = data?.data?.data.reduce((sum, invoice) => sum + invoice.amount, 0) ?? 0;

    return (
        <div className="w-full py-6 pt-2 space-y-4">
            <PageHeader
                title="Invoices"
                subtitle="View and manage generated invoices"
                icon={FileText}
            />
            <QueryState
                isLoading={isLoading}
                error={error}
                isEmpty={!data?.data?.data?.length}
                onRetry={() => refetch()}
                loading={
                    <div className="flex justify-center items-center py-20">
                        <Loader />
                    </div>
                }
                empty={
                    <NoInvoicesMessage
                        onGenerateInvoice={handleGenerateInvoice}
                        isGenerating={isLoading}
                    />
                }
                errorTitle="Failed to load invoices"
            >
                {data?.data && data.data.data.length > 0 ? (
                    <InvoiceSummaryCard invoices={data.data.data} totalSum={totalSum} />
                ) : null}

                <div className="py-4">
                    <FiltersBar
                        left={
                            <form
                                onSubmit={handleSearch}
                                className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-center"
                            >
                                <div className="w-full md:w-72">
                                    <SearchBar
                                        currentSearchTerm={globalFilter ?? ""}
                                        onSearch={(term) => setGlobalFilter(term)}
                                        placeholder="Search invoices..."
                                        showButton
                                        autoSearch={false}
                                    />
                                </div>
                                <DateRangePicker
                                    dateRange={dateRange}
                                    onDateRangeChange={handleDateRangeChange}
                                    className="w-full md:w-auto"
                                />
                                <IconActionButton
                                    label="Clear dates"
                                    onClick={() => {
                                        setDateRange(undefined);
                                        let searchParams = new URLSearchParams(searchQuery);
                                        searchParams.delete('dateFrom');
                                        searchParams.delete('dateTo');
                                        setSearchQuery(searchParams.toString());
                                        setCurrentPage(1);
                                    }}
                                    icon={<CalendarIcon className="h-4 w-4" />}
                                />
                                <IconActionButton
                                    label="Clear"
                                    onClick={handleClearSearch}
                                    icon={<X className="h-4 w-4" />}
                                />
                            </form>
                        }
                        right={
                            <>
                                <IconActionButton
                                    label="Set selected as paid"
                                    onClick={handleBulkSetPaid}
                                    disabled={Object.keys(rowSelection).length === 0}
                                    icon={<Check className="h-4 w-4" />}
                                />
                                <IconActionButton
                                    label="Refresh"
                                    onClick={handleRefresh}
                                    icon={<RefreshCw className="h-4 w-4" />}
                                />
                                <IconActionButton
                                    label="Generate invoices"
                                    onClick={handleGenerateInvoices}
                                    disabled={isLoading}
                                    icon={<PlusCircle className="h-4 w-4" />}
                                />
                                <IconActionButton
                                    label="Export invoices"
                                    onClick={handleExportInvoices}
                                    disabled={!data?.data.data.length}
                                    icon={<Download className="h-4 w-4" />}
                                />
                            </>
                        }
                    />
                </div>

                {selectedInvoice ? (
                    <InvoiceDetailView
                        invoice={selectedInvoice}
                        onClose={() => setSelectedInvoice(null)}
                    />
                ) : null}

                <div className="rounded-md border shadow-sm overflow-hidden">
                    <TableToolbar
                        label={`Invoices: ${(data?.data?.total ?? 0).toLocaleString()} • Page ${currentPage} / ${(data?.data?.totalPages ?? 1)}`}
                        right={
                            <div className="hidden md:flex items-center gap-2">
                                <SavedViews
                                    storageKey="invoices.views"
                                    keys={savedViewsKeys}
                                    getState={buildViewState}
                                    applyState={applyViewState}
                                    onSaved={(name) => notify.success("View saved", `Saved “${name}”.`)}
                                    onDeleted={(name) => notify.success("View deleted", `Deleted “${name}”.`)}
                                />
                            </div>
                        }
                    />
                    <div className="min-w-[768px] hidden md:block">
                        <Table className='dark:bg-gray-600'>
                            <TableHeader className="sticky top-0 z-10">
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <TableRow key={headerGroup.id} className="bg-gray-100">
                                        {headerGroup.headers.map((header) => (
                                            <TableHead key={header.id} className="font-bold text-gray-700 py-3">
                                                {header.isPlaceholder
                                                    ? null
                                                    : flexRender(
                                                        header.column.columnDef.header,
                                                        header.getContext()
                                                    )}
                                            </TableHead>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableHeader>
                            <TableBody>
                                {table.getRowModel().rows?.length ? (
                                    table.getRowModel().rows.map((row, index) => (
                                        <TableRow
                                            key={row.id}
                                            data-state={row.getIsSelected() && "selected"}
                                            className={cn(
                                                "transition-colors",
                                                index % 2 === 0 ? "bg-white" : "bg-gray-50",
                                                "hover:bg-gray-100",
                                                row.getIsSelected() && "bg-primary/50"
                                            )}
                                        >
                                            {row.getVisibleCells().map((cell) => (
                                                <TableCell key={cell.id} className="py-3">
                                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={columns.length} className="h-24 text-center">
                                            No results.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                    <div className="md:hidden">
                        {data?.data.data.map((invoice) => (
                            <InvoiceCard
                                key={invoice.id}
                                invoice={invoice}
                                onSetPaid={() => handleSetPaid(invoice.id)}
                            />
                        ))}
                    </div>
                </div>

                <TablePager
                    currentPage={currentPage}
                    totalPages={data?.data?.totalPages ?? 1}
                    totalItems={data?.data?.total ?? 0}
                    pageSize={pageSize}
                    pageSizeOptions={[10, 20, 50, 100, 200, 500]}
                    onPageChange={(p) => setCurrentPage(p)}
                    onPageSizeChange={(n) => {
                        setPageSize(n);
                        setCurrentPage(1);
                    }}
                    isDisabled={isLoading}
                    noun="invoices"
                />
            </QueryState>
        </div>
    );
};

export default InvoicesComponent;