import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, RefreshCw, Edit, Trash2, ArrowUpDown, ChevronDown, ChevronUp, Mail, Phone, MapPin, ChevronsLeft, ChevronsRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { User } from '../types/api';
import { UseMutationResult } from '@tanstack/react-query';
import UserCard from './UserCard';
import { ColumnDef, ColumnMeta, flexRender, getCoreRowModel, getPaginationRowModel, getSortedRowModel, SortingState, useReactTable } from '@tanstack/react-table';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

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
    onPageSizeChange?: (size: number) => void;
}

type CustomColumnMeta = ColumnMeta<User, unknown> & {
    className?: string;
    width?: string;
};

const getProfileBadge = (profileName: string) => {
    const colorMap: { [key: string]: string } = {
        'Basic': 'bg-gray-100 text-gray-800 hover:bg-gray-200',
        'Premium': 'bg-purple-100 text-purple-800 hover:bg-purple-200',
        'Business': 'bg-blue-100 text-blue-800 hover:bg-blue-200',
        'VIP': 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
        'default': 'bg-gray-100 text-gray-800 hover:bg-gray-200'
    };

    const color = colorMap[profileName] || colorMap.default;
    return <Badge className={`${color} transition-colors duration-200`}>{profileName}</Badge>;
};

const UserRow: React.FC<{
    user: User;
    onAction: (action: string, user: User) => void;
    index: number;
}> = ({ user, onAction, index }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <>
            <TableRow 
                className={cn(
                    "transition-colors duration-200",
                    // Base color alternating rows
                    index % 2 === 0 ? "bg-white" : "bg-slate-50",
                    // Hover state
                    "hover:bg-slate-100",
                    // Expanded state
                    isExpanded && "bg-slate-100 border-l-2 border-l-primary",
                    // Status-based highlighting
                    user.accountStatus.toLowerCase() === 'suspended' && "bg-red-50 hover:bg-red-100",
                    user.accountStatus.toLowerCase() === 'inactive' && "bg-yellow-50 hover:bg-yellow-100",
                    // Online status subtle highlight
                    user.isOnline && "border-l-2 border-l-blue-500",
                    !user.isOnline && "border-l-2 border-l-red-600"
                )}
            >
                <TableCell>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                                "h-8 w-8 p-0",
                                isExpanded && "bg-primary/10 hover:bg-primary/20",
                                !isExpanded && "hover:bg-slate-200"
                            )}
                            onClick={() => setIsExpanded(!isExpanded)}
                        >
                            {isExpanded ? (
                                <ChevronUp className="h-4 w-4" />
                            ) : (
                                <ChevronDown className="h-4 w-4" />
                            )}
                        </Button>
                        <span className="font-mono text-sm">{user.id}</span>
                    </div>
                </TableCell>
                
                <TableCell>
                    <div className="flex flex-col">
                        <span className="font-semibold text-primary hover:text-primary/80">
                            {user.username}
                        </span>
                        {user.userDetails?.fullName && (
                            <span className="text-sm text-muted-foreground">
                                {user.userDetails.fullName}
                            </span>
                        )}
                    </div>
                </TableCell>

                <TableCell>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="flex items-center gap-2">
                                    <div className={cn(
                                        "w-2 h-2 rounded-full transition-all duration-200",
                                        user.isOnline 
                                            ? "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" 
                                            : "bg-gray-300"
                                    )} />
                                    <span className={cn(
                                        "font-medium",
                                        user.isOnline ? "text-blue-600" : "text-gray-600"
                                    )}>
                                        {user.isOnline ? 'Online' : 'Offline'}
                                    </span>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{user.isOnline ? 'User is currently connected' : 'User is not connected'}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </TableCell>

                <TableCell>
                    <div className="flex items-center gap-2">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger>
                                    {getProfileBadge(user.profile.profileName)}
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Daily Quota: {user.profile.dailyQuota}</p>
                                    <p>Monthly Quota: {user.profile.monthlyQuota}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                        <Badge variant="outline" className={cn(
                            "transition-colors duration-200",
                            user.isMonthlyExceeded 
                                ? "border-red-500 text-red-500 hover:bg-red-50" 
                                : "border-green-500 text-green-500 hover:bg-green-50"
                        )}>
                            {user.isMonthlyExceeded ? 'Exceeded' : 'Within Limit'}
                        </Badge>
                    </div>
                </TableCell>

                <TableCell>
                    <Badge variant="outline" className={cn(
                        "transition-colors duration-200",
                        user.accountStatus.toLowerCase() === 'active' && "border-green-500 text-green-500 hover:bg-green-50",
                        user.accountStatus.toLowerCase() === 'suspended' && "border-red-500 text-red-500 hover:bg-red-50",
                        user.accountStatus.toLowerCase() === 'inactive' && "border-yellow-500 text-yellow-500 hover:bg-yellow-50"
                    )}>
                        {user.accountStatus}
                    </Badge>
                </TableCell>

                <TableCell>
                    <span className="font-mono text-sm">
                        {user.macAddress?.macAddress || 'N/A'}
                    </span>
                </TableCell>

                <TableCell align="right" className="text-right">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-accent/50">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[160px]">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem 
                                onClick={() => onAction('reset-mac', user)}
                                className="hover:bg-accent/50 cursor-pointer"
                            >
                                <RefreshCw className="mr-2 h-4 w-4" /> Reset MAC
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                                onClick={() => onAction('reset-quota', user)}
                                className="hover:bg-accent/50 cursor-pointer"
                            >
                                <RefreshCw className="mr-2 h-4 w-4" /> Reset Quota
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                                onClick={() => onAction('edit', user)}
                                className="hover:bg-accent/50 cursor-pointer"
                            >
                                <Edit className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                                onClick={() => onAction('delete', user)} 
                                className="text-red-600 hover:bg-red-50 hover:text-red-700 cursor-pointer"
                            >
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </TableCell>
            </TableRow>

            {isExpanded && (
                <TableRow className="bg-slate-50/80 border-y border-y-slate-200">
                    <TableCell colSpan={7}>
                        <div className="p-4 space-y-4">
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <div className="space-y-2 bg-white rounded-lg p-3 shadow-sm">
                                    <h4 className="font-semibold text-primary">Profile Details</h4>
                                    <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground">
                                            Daily Quota: {user.profile.dailyQuota}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            Monthly Quota: {user.profile.monthlyQuota}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            Quota Reset Day: {user.quotaResetDay}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-2 bg-white rounded-lg p-3 shadow-sm">
                                    <h4 className="font-semibold text-primary">Contact Information</h4>
                                    <div className="space-y-1">
                                        {user.userDetails?.email && (
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Mail className="h-4 w-4" />
                                                <span>{user.userDetails.email}</span>
                                            </div>
                                        )}
                                        {user.userDetails?.phoneNumber && (
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Phone className="h-4 w-4" />
                                                <span>{user.userDetails.phoneNumber}</span>
                                            </div>
                                        )}
                                        {user.userDetails?.address && (
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <MapPin className="h-4 w-4" />
                                                <span>{user.userDetails.address}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2 bg-white rounded-lg p-3 shadow-sm">
                                    <h4 className="font-semibold text-primary">System Details</h4>
                                    <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground">
                                            Profile ID: {user.profileId}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            Fallback: {user.isFallback ? 'Yes' : 'No'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TableCell>
                </TableRow>
            )}
        </>
    );
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
    onPageSizeChange,
}) => {
    const [sorting, setSorting] = useState<SortingState>([]);
    const pageSizes = [10, 20, 50, 100];

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
        },
        {
            accessorKey: "username",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className="hover:bg-gray-100"
                    >
                        User
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                )
            },
        },
        {
            accessorKey: "isOnline",
            header: "Status",
        },
        {
            accessorKey: "profile.profileName",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className="hover:bg-gray-100"
                    >
                        Profile
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                )
            },
        },
        {
            accessorKey: "accountStatus",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className="hover:bg-gray-100"
                    >
                        Account
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                )
            },
        },
        {
            accessorKey: "macAddress.macAddress",
            header: "MAC Address",
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
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-100 hover:bg-slate-100">
                                    {table.getHeaderGroups().map((headerGroup) => (
                                        headerGroup.headers.map((header) => (
                                            <TableHead key={header.id} className="font-semibold text-slate-700 p-l-0">
                                                {header.isPlaceholder
                                                    ? null
                                                    : flexRender(
                                                        header.column.columnDef.header,
                                                        header.getContext()
                                                    )}
                                            </TableHead>
                                        ))
                                    ))}
                                    <TableHead className="text-right font-semibold text-slate-700">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.map((user, index) => (
                                    <UserRow 
                                        key={user.id} 
                                        user={user} 
                                        onAction={onAction}
                                        index={index}
                                    />
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
                        isResettingMAC={resetMacAddressMutation.variables === user.username}
                    />
                ))}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                        <Label htmlFor="pageSize" className="text-sm">Show:</Label>
                        <Select
                            value={pageSize.toString()}
                            onValueChange={(value) => onPageSizeChange?.(Number(value))}
                        >
                            <SelectTrigger className="h-8 w-[80px]">
                                <SelectValue defaultValue={pageSize} />
                            </SelectTrigger>
                            <SelectContent side="top">
                                {pageSizes.map((size) => (
                                    <SelectItem key={size} value={size.toString()}>
                                        {size}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <span className="text-sm text-muted-foreground">
                        Showing {(currentPage - 1) * pageSize + 1} to{' '}
                        {Math.min(currentPage * pageSize, totalUsers)} of{' '}
                        {totalUsers} results
                    </span>
                </div>

                <div className="flex items-center space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPageChange(1)}
                        disabled={currentPage === 1 || isLoading}
                        className="hidden sm:flex"
                    >
                        <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPageChange(currentPage - 1)}
                        disabled={currentPage === 1 || isLoading}
                    >
                        <ChevronLeft className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Previous</span>
                    </Button>
                    <div className="flex items-center gap-1 text-sm font-medium">
                        Page {currentPage} of {totalPages}
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPageChange(currentPage + 1)}
                        disabled={currentPage === totalPages || isLoading}
                    >
                        <span className="hidden sm:inline">Next</span>
                        <ChevronRight className="h-4 w-4 sm:ml-2" />
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPageChange(totalPages)}
                        disabled={currentPage === totalPages || isLoading}
                        className="hidden sm:flex"
                    >
                        <ChevronsRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default UsersTable;