import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, RefreshCw, Edit, Trash2, ArrowUpDown } from 'lucide-react';
import { User } from '../types/api';
import { UseMutationResult } from '@tanstack/react-query';
import UserCard from './UserCard';
import { ColumnDef, ColumnMeta, flexRender, getCoreRowModel, getPaginationRowModel, getSortedRowModel, SortingState, useReactTable } from '@tanstack/react-table';
import { Badge } from './ui/badge';

interface UsersTableProps {
    users: User[];
    currentPage: number;
    totalPages: number;
    totalUsers: number;
    onPageChange: (page: number) => void;
    onAction: (action: string, user: User) => void;
    isLoading: boolean;
    deleteUserMutation: UseMutationResult<any, unknown, string, unknown>;
    resetMacAddressMutation: UseMutationResult<any, unknown, string, unknown>;
    pageSize?: number;
}


type CustomColumnMeta = ColumnMeta<User, unknown> & {
    className?: string;
    width?: string;
};

const getProfileBadge = (profileName: string) => {
    const lowerProfileName = profileName.toLowerCase();
    if (lowerProfileName.toLocaleLowerCase() === 'premium') {
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">Premium</Badge>;
    } else if (lowerProfileName.toLocaleLowerCase() === 'basic') {
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">Basic</Badge>;
    }
    else if (lowerProfileName.toLocaleLowerCase() === 'basicfn') {
        return <Badge variant="outline" className="bg-blue-100 text-purple-800 border-purple-300">BasicFN</Badge>;
    } else {
        return <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-300">{profileName}</Badge>;
    }
};



const UsersTable: React.FC<UsersTableProps> = ({
    users,
    currentPage,
    totalPages,
    totalUsers,
    onPageChange,
    onAction,
    isLoading,
    deleteUserMutation,
    resetMacAddressMutation,
    pageSize = 50,
}) => {
    const [sorting, setSorting] = useState<SortingState>([]);

    const columns: ColumnDef<User>[] = [
        {
            accessorKey: "id",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className="hover:bg-gray-100"
                    >
                        ID
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                )
            },
            cell: ({ row }) => <span className="font-mono text-sm p-2">{row.original.id}</span>,
        },
        {
            accessorKey: "username",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className="hover:bg-gray-100 px-0!"
                    >
                        Username
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                )
            },
            cell: ({ row }) => <span className="font-semibold text-blue-600 hover:text-blue-800 transition-colors duration-200">{row.original.username}</span>,
        },
        {
            accessorKey: "userDetails.fullName",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className="hover:bg-gray-100 px-0!"
                    >
                        Full Name
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                )
            },
            cell: ({ row }) => (
                <span className="font-medium text-gray-900 hover:text-gray-700 min-w-[250px] transition-colors duration-200">
                    {row.original.userDetails?.fullName || 'N/A'}
                </span>
            ),
            meta: {
                width: "250px",  // Adjust this value as needed
                className: "min-w-[250px]"  // Adjust this value as needed
            } as CustomColumnMeta
        },
        {
            accessorKey: "isOnline",
            header: "Status",
            cell: ({ row }) => (
                <span className={`px-2 py-1 rounded-full text-xs font-semibold 
                ${row.original.isOnline ? 'bg-blue-500 text-white' : 'bg-red-400 text-white'}`}>
                    {row.original.isOnline ? 'Online' : 'Offline'}
                </span>
            ),
        },
        {
            accessorKey: "userDetails.address",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className="hover:bg-gray-100 px-0! "
                    >
                        Address
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                )
            },
            cell: ({ row }) => (
                <span className="text-gray-600 hover:text-gray-800 transition-colors duration-200">
                    {row.original.userDetails?.address || 'N/A'}
                </span>
            ),
        },
        {
            accessorKey: "profile.profileName",
            header: "Profile",
            cell: ({ row }) => (
                <span>{getProfileBadge(row.original.profile.profileName)}</span>
            )
        },
        {
            accessorKey: "isMonthlyExceeded",
            header: "M. FUP",
            cell: ({ row }) => (
                <span className={`font-medium ${row.original.isMonthlyExceeded ? "text-red-600" : "text-green-600"}`}>
                    {row.original.isMonthlyExceeded ? 'Yes' : 'No'}
                </span>
            ),
            meta: {
                width: "60px",
                className: "min-w-[50px] w-[50px]"  // Adjust this value as needed
            } as CustomColumnMeta
        },
        {
            accessorKey: "macAddress",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className="hover:bg-gray-100 px-0!"
                    >
                        MAC Address
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                )
            },
            cell: ({ row }) => (
                <span className="font-mono text-sm text-gray-600 hover:text-gray-800 transition-colors duration-200">
                    {row.original.macAddress?.macAddress || 'N/A'}
                </span>
            ),
        },
        {
            accessorKey: "quotaResetDay",
            header: "Quota Reset Day",
            cell: ({ row }) => (
                <div className='w-full text-center'>
                    <span className="text-gray-700 align-center hover:text-gray-900 transition-colors duration-200">
                        {row.original.quotaResetDay}
                    </span>
                </div>
            ),
        },
        {
            accessorKey: "accountStatus",
            header: "Account Status",
            cell: ({ row }) => (
                <span className={`px-2 py-1 rounded-full text-xs font-semibold
                    ${row.original.accountStatus.toLowerCase() === 'active' ? 'bg-green-200 text-green-800' :
                        row.original.accountStatus.toLowerCase() === 'suspended' ? 'bg-red-200 text-red-800' :
                            'bg-yellow-200 text-yellow-800'}`}>
                    {row.original.accountStatus}
                </span>
            ),
            meta: {
                width: "70px",
            } as CustomColumnMeta
        },
    ];

    const table = useReactTable({
        data: users,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onSortingChange: setSorting,
        state: {
            sorting,
        },
        initialState: {
            pagination: {
                pageSize: pageSize,
            },
        },
    });


    return (
        <div>
            <div className="rounded-md border shadow-sm overflow-hidden">
                <div className="min-w-[768px] hidden md:block">
                    <div className="overflow-x-auto">
                        <Table className='dark:bg-gray-600 table-fixed'>
                            <TableHeader>
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <TableRow key={headerGroup.id}>
                                        {headerGroup.headers.map((header) => (
                                            <TableHead key={header.id}>
                                                {header.isPlaceholder
                                                    ? null
                                                    : flexRender(
                                                        header.column.columnDef.header,
                                                        header.getContext()
                                                    )}
                                            </TableHead>
                                        ))}
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                ))}
                            </TableHeader>
                            <TableBody>
                                {table.getRowModel().rows.map((row, index) => (
                                    <TableRow className={`
                                        ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                                        hover:bg-blue-50 transition-colors duration-200 h-2 border-b-0
                                    
                                    `}
                                        key={row.id}>
                                        {row.getVisibleCells().map((cell) => (
                                            <TableCell key={cell.id}>
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </TableCell>
                                        ))}
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <span className="sr-only">Open menu</span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuItem onClick={() => onAction('reset-mac', row.original)}>
                                                        <RefreshCw className="mr-2 h-4 w-4" /> Reset MAC
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => onAction('reset-quota', row.original)}>
                                                        <RefreshCw className="mr-2 h-4 w-4" /> Reset Quota
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => onAction('edit', row.original)}>
                                                        <Edit className="mr-2 h-4 w-4" /> Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => onAction('delete', row.original)} className="text-red-600">
                                                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>

            <div className="mt-4 space-y-4 md:hidden">
                {users.map((user) => (
                    <UserCard
                        key={user.id}
                        user={user}
                        onEdit={() => onAction('edit', user)}
                        onDelete={() => onAction('delete', user)}
                        onResetMAC={() => onAction('reset-mac', user)}
                        onResetQuota={() => onAction('reset-quota', user)}
                        isResettingMAC={isLoading && resetMacAddressMutation.variables === user.username}
                    />
                ))}
            </div>

            <div className="flex items-center justify-between py-4">
                <div className="text-sm text-gray-700">
                    Showing <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> to{' '}
                    <span className="font-medium">{Math.min(currentPage * pageSize, totalUsers)}</span> of{' '}
                    <span className="font-medium">{totalUsers}</span> results
                </div>
                <div className="flex items-center space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPageChange(currentPage - 1)}
                        disabled={currentPage === 1 || isLoading}
                    >
                        Previous
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPageChange(currentPage + 1)}
                        disabled={currentPage === totalPages || isLoading}
                    >
                        Next
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default UsersTable;