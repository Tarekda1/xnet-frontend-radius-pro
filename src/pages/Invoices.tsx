import React, { useEffect, useState } from 'react';
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
import { ArrowUpDown, CalendarIcon, Check, CheckCircle, DollarSign, Download, Eye, FileText, PlusCircle, RefreshCw, SearchIcon, UserCircle, X, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Loader from '@/components/ui/loader';
import { DateRangePicker } from '@/components/ui/DateRangePicker';
import { DateRange } from 'react-day-picker';
import { toast } from 'react-toastify';
import Alert from '@/components/ui/Alert';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { utils, writeFile } from 'xlsx';
import { Checkbox } from '@/components/ui/checkbox';

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
    const pageSize = 50;
    const { data, error, isLoading, refetch, setCurrentPage, currentPage, setSearchQuery, searchQuery, setInvoiceAsPaidMutation, generateInvoicesMutation }
        = useInvoices(1, pageSize);
    const [dateRange, setDateRange] = React.useState<DateRange | undefined>();
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [rowSelection, setRowSelection] = React.useState({});

    const handleViewInvoice = (invoice: Invoice) => {
        setSelectedInvoice(invoice);
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
                    <span className="font-medium text-blue-600">{row.original.userDetails.fullName}</span>
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
            id: 'invoice-details',
            cell: ({ row }) => (
                <Button
                    variant="outline"
                    onClick={() => handleViewInvoice(row.original)}
                    className="h-8 w-8 p-0 cursor-pointer"
                >
                    <span className="sr-only">View details</span>
                    <Eye className="h-4 w-4" />
                </Button>
            ),
        },
    ];



    const handleBulkSetPaid = () => {
        const selectedRows = table.getSelectedRowModel().rows;
        selectedRows.forEach(row => {
            setInvoiceAsPaidMutation.mutate(row.original.id, {
                onSuccess: () => {
                    toast.success("Selected invoices marked as paid.", {
                        position: "bottom-left",
                        autoClose: 5000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                        progress: undefined,
                    });
                    refetch();
                },
                onError: () => {
                    toast.error("Failed to mark invoices as paid.", {
                        position: "bottom-left",
                        autoClose: 5000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                        progress: undefined,
                    });
                }
            });
        });
        table.resetRowSelection();
    };

    const handleNextPage = () => {
        if (data?.data?.page! < (data?.data.totalPages ?? 0)) {
            setCurrentPage(prev => prev + 1);
        }
    };

    const handlePreviousPage = () => {
        if (currentPage > 1) {
            setCurrentPage(prev => prev - 1);
        }
    };

    const handleSetPaid = (invoiceId: number) => {
        setInvoiceAsPaidMutation.mutate(invoiceId, {
            onSuccess: () => {
                toast.success("Invoice marked as paid.", {
                    position: "top-right",
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                });
                refetch();
            }
        });
    };

    const handleRefresh = () => {
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
            toast.success("New invoices have been successfully generated.", {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            });
            refetch();
        } catch (error) {
            toast.error("Failed to generate invoices. Please try again.", {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            });
        }
    };


    const handleExportInvoices = () => {
        if (data?.data.data) {
            const ws = utils.json_to_sheet(data.data.data);
            const wb = utils.book_new();
            utils.book_append_sheet(wb, ws, "Invoices");
            writeFile(wb, "invoices.xlsx");
        }
    };

    useEffect(() => {
        if (generateInvoicesMutation.isSuccess) {
            refetch();
        }
    }, [generateInvoicesMutation.isSuccess]);

    useEffect(() => {
        if (error) {
            toast.error(`Error loading invoices: ${error instanceof Error ? error.message : 'An unknown error occurred.'}`, {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            });
        }
    }, [error]);

    if (isLoading) return <div className="flex justify-center items-center h-screen"><Loader />Loading...</div>;
    if (error) return <div className="text-red-500 text-center">Error: {error.message}</div>;

    const totalSum = data?.data?.data.reduce((sum, invoice) => sum + invoice.amount, 0) ?? 0;

    return (
        <div className="w-full py-6 pt-2">
            <h1 className="text-3xl font-bold">Invoices</h1>
            {error && (
                <Alert
                    type="error"
                    message={error}
                    onClose={() => {/* You can add a function to clear the error if needed */ }}
                />

            )}
            {data?.data && data.data.data.length > 0 && (
                <InvoiceSummaryCard invoices={data.data.data} totalSum={totalSum} />
            )}
            <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 sm:space-x-4 py-4">
                <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
                    <div className="relative w-full sm:w-64">
                        <Input
                            placeholder="Search invoices..."
                            value={globalFilter ?? ''}
                            onChange={(event) => setGlobalFilter(String(event.target.value))}
                            className="pr-10 w-full"
                        />
                        {globalFilter && (
                            <button
                                type="button"
                                onClick={handleClearSearch}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                    <Button type="submit" variant="outline" className="w-full sm:w-auto">
                        <SearchIcon className="h-4 w-4 mr-2" /> Search
                    </Button>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 w-full">
                        <DateRangePicker
                            dateRange={dateRange}
                            onDateRangeChange={handleDateRangeChange}
                            className="w-full sm:w-auto"
                        />
                        <Button
                            variant="outline"
                            onClick={() => {
                                setDateRange(undefined);
                                // Reset date filter logic here
                                let searchParams = new URLSearchParams(searchQuery);
                                searchParams.delete('dateFrom');
                                searchParams.delete('dateTo');
                                setSearchQuery(searchParams.toString());
                                setCurrentPage(1);
                            }}
                            className="w-full sm:w-auto"
                        >
                            <CalendarIcon className="h-4 w-4 mr-2" />
                            Clear Dates
                        </Button>
                    </div>
                </form>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                    <Button
                        onClick={handleBulkSetPaid}
                        variant="outline"
                        disabled={Object.keys(rowSelection).length === 0}
                        className="w-full sm:w-auto"
                    >
                        <Check className="h-4 w-4 mr-2" />
                        Set Selected as Paid
                    </Button>
                    <Button variant="outline" onClick={handleRefresh} className="w-full sm:w-auto">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        {isLoading ? "Loading" : "Refresh"}
                    </Button>
                    <Button variant="outline" onClick={handleGenerateInvoices} disabled={isLoading} className="w-full sm:w-auto">
                        <PlusCircle className="h-4 w-4 mr-2" />
                        {isLoading ? "Generating..." : "Generate Invoices"}
                    </Button>
                    <Button variant="outline" onClick={handleExportInvoices} disabled={!data?.data.data.length} className="w-full sm:w-auto">
                        <Download className="h-4 w-4 mr-2" />
                        Export Invoices
                    </Button>
                </div>
            </div>
            {selectedInvoice && (
                <InvoiceDetailView
                    invoice={selectedInvoice}
                    onClose={() => setSelectedInvoice(null)}
                />
            )}
            <div className="rounded-md border shadow-sm overflow-hidden">
                {data?.data && data.data.data.length > 0 ? (
                    <>
                        <div className="min-w-[768px] hidden md:block">
                            <Table className='dark:bg-gray-600'>
                                <TableHeader>
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
                                            <TableHead className="font-bold text-gray-700 py-3">Actions</TableHead>
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
                                                <TableCell className="py-3">
                                                    {row.original.status !== 'paid' ? (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleSetPaid(row.original.id)}
                                                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                                        >
                                                            <Check className="h-4 w-4 mr-2" /> Set as Paid
                                                        </Button>
                                                    ) : <Button variant="outline" disabled size="sm" onClick={() => handleSetPaid(row.original.id)}>
                                                        <Check className="h-4 w-4 mr-2" /> Set as Paid
                                                    </Button>}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={columns.length + 1} className="h-24 text-center">
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
                    </>
                ) : (
                    <NoInvoicesMessage
                        onGenerateInvoice={handleGenerateInvoice}
                        isGenerating={isLoading}
                    />
                )}
            </div>
            <div className="flex items-center justify-between py-4">
                <div>
                    <p>Total Invoices: {data?.data.total}</p>
                    <p>Page {data?.data.page} of {data?.data.totalPages}</p>
                </div>
                <div className="flex items-center space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePreviousPage}
                        disabled={currentPage === 1}
                    >
                        Previous
                    </Button>
                    <Button
                        variant="outline"
                        size="sm" onClick={handleNextPage}
                        disabled={currentPage === (data?.data.totalPages ?? 0)}
                    >
                        Next
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default InvoicesComponent;