import React, { useState } from 'react';
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
    getPaginationRowModel,
    getSortedRowModel,
    SortingState,
    getFilteredRowModel,
} from "@tanstack/react-table";
import useNas from '../hooks/useNas';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Nas } from '../types/api'; // Make sure to define this type
import { ArrowUpDown, Edit, MoreHorizontal, Plus, RefreshCw } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

const columns: ColumnDef<Nas>[] = [
    {
        accessorKey: "id",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    ID
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
    },
    {
        accessorKey: "nasname",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    NAS Name
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
    },
    {
        accessorKey: "shortname",
        header: "Short Name",
    },
    {
        accessorKey: "type",
        header: "Type",
    },
    {
        accessorKey: "ports",
        header: "Ports",
    },
    {
        accessorKey: "secret",
        header: "Secret",
        cell: () => <span>********</span>, // Hide the actual secret
    },
    {
        accessorKey: "status",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Status
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        cell: ({ row }) => (
            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${row.original.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {row.original.status}
            </span>
        ),
    },
    {
        accessorKey: "server",
        header: "Server",
    },
    {
        accessorKey: "community",
        header: "Community",
    },
    {
        accessorKey: "description",
        header: "Description",
    },
];

const NasCard: React.FC<{ nas: Nas }> = ({ nas }) => {
    return (
        <Card className="mb-4">
            <CardHeader>
                <CardTitle className="flex justify-between items-center">
                    <span>{nas.nasname}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${nas.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {nas.status}
                    </span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="font-semibold">ID:</span> {nas.id}</div>
                    <div><span className="font-semibold">Short Name:</span> {nas.shortname}</div>
                    <div><span className="font-semibold">Type:</span> {nas.type}</div>
                    <div><span className="font-semibold">Ports:</span> {nas.ports}</div>
                    <div><span className="font-semibold">Server:</span> {nas.server}</div>
                    <div><span className="font-semibold">Community:</span> {nas.community}</div>
                    <div className="col-span-2"><span className="font-semibold">Description:</span> {nas.description}</div>
                </div>
            </CardContent>
            <CardFooter className="flex justify-end">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                            Actions <MoreHorizontal className="ml-2 h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => console.log("Edit NAS", nas)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                        </DropdownMenuItem>
                        {/* Add more actions as needed */}
                    </DropdownMenuContent>
                </DropdownMenu>
            </CardFooter>
        </Card>
    );
};

const NasComponent: React.FC = () => {
    const { data, error, isLoading, refetch } = useNas();
    const [sorting, setSorting] = useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = useState('');

    const table = useReactTable({
        data: data?.data?.nasEntries ?? [],
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
        state: {
            sorting,
            globalFilter,
        },
    });

    const handleRefresh = () => {
        refetch();
    };

    const handleAddNas = () => {
        // Implement add NAS functionality
        console.log("Add NAS clicked");
    };

    if (isLoading) return <div className="flex justify-center items-center h-screen">Loading...</div>;
    if (error) return <div className="text-red-500 text-center">Error: {error.message}</div>;

    return (
        <div className="w-full py-5">
            <h1 className="text-3xl font-bold mb-6">Network Access Servers (NAS)</h1>
            <div className="flex items-center justify-between py-4">
                <Input
                    placeholder="Search NAS..."
                    value={globalFilter ?? ''}
                    onChange={(event) => setGlobalFilter(String(event.target.value))}
                    className="max-w-sm"
                />
                <div className="flex space-x-2">
                    <Button onClick={handleRefresh}>
                        <RefreshCw className="h-4 w-2 mr-1" />
                        Refresh
                    </Button>
                    <Button onClick={handleAddNas}>
                        <Plus className="h-4 w-2 mr-1" />
                        Add NAS
                    </Button>
                </div>
            </div>
            <div className="rounded-md border shadow-sm overflow-hidden hidden md:block">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id} className="bg-gray-100">
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id} className="font-bold text-gray-700">
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
                                    className={`
                                        ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                                        hover:bg-blue-50 transition-colors duration-200 h-2
                                    `}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => console.log("Edit NAS", row.original)}>
                                                    <Edit className="mr-2 h-4 w-4" />
                                                    Edit
                                                </DropdownMenuItem>
                                                {/* Add more actions as needed */}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
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
            <div className='md:hidden'>
                {table.getRowModel().rows.map((row) => (
                    <NasCard key={row.id} nas={row.original} />
                ))}
            </div>
            <div className="flex items-center justify-end space-x-2 py-4">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                >
                    Previous
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                >
                    Next
                </Button>
            </div>
        </div>
    );
};

export default NasComponent;
