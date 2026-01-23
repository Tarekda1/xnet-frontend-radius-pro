import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { RefreshCw, Edit, Trash2, ArrowUpDown, ChevronDown, ChevronUp, Mail, Phone, MapPin } from 'lucide-react';
import { User } from '../types/api';
import { UseMutationResult } from '@tanstack/react-query';
import UserCard from './UserCard';
import { ColumnDef, flexRender, getCoreRowModel, getPaginationRowModel, getSortedRowModel, SortingState, useReactTable } from '@tanstack/react-table';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import EmptyState from "@/components/EmptyState";
import StatusPill from "@/components/StatusPill";
import TableToolbar from "@/components/TableToolbar";
import TablePager from "@/components/TablePager";
import TableRowActions from "@/components/TableRowActions";
import { useNavigate } from "react-router-dom";
import { Checkbox } from "@/components/ui/checkbox";

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
    selectedUserIds?: Set<number>;
    onToggleSelected?: (userId: number, selected: boolean) => void;
    onToggleSelectAll?: (selected: boolean) => void;
    pageSize?: number;
    onPageSizeChange?: (size: number) => void;
    canManageUsers?: boolean;
    manageUsersReason?: string;
}

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
    isSelected?: boolean;
    onToggleSelected?: (userId: number, selected: boolean) => void;
    canManageUsers?: boolean;
    manageUsersReason?: string;
}> = ({ user, onAction, index, isSelected, onToggleSelected, canManageUsers = true, manageUsersReason = "You don't have permission to manage users." }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const navigate = useNavigate();

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
                <TableCell className="w-[44px]">
                    <Checkbox
                        checked={Boolean(isSelected)}
                        onCheckedChange={(v) => onToggleSelected?.(user.id, Boolean(v))}
                        aria-label="Select user"
                    />
                </TableCell>
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
                        <button
                            type="button"
                            className="text-left font-semibold text-primary hover:text-primary/80"
                            onClick={() => navigate(`/users/${encodeURIComponent(user.username)}`)}
                            title="View user"
                        >
                            {user.username}
                        </button>
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
                                <div>
                                    <StatusPill
                                        label={user.isOnline ? "Online" : "Offline"}
                                        tone={user.isOnline ? "info" : "default"}
                                        dot
                                        pulseDot={Boolean(user.isOnline)}
                                    />
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{user.isOnline ? 'User is currently connected' : 'User is not connected'}</p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Last active: {user.lastTimeActive ? new Date(user.lastTimeActive).toLocaleString() : "—"}
                                </p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </TableCell>

                <TableCell>
                    <span className="text-sm text-muted-foreground">
                        {user.lastTimeActive ? new Date(user.lastTimeActive).toLocaleString() : "—"}
                    </span>
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
                    <TableRowActions
                        actions={[
                            { label: "Reset MAC", icon: RefreshCw, onClick: () => onAction("reset-mac", user), disabled: !canManageUsers, disabledReason: manageUsersReason },
                            { label: "Reset Quota", icon: RefreshCw, onClick: () => onAction("reset-quota", user), disabled: !canManageUsers, disabledReason: manageUsersReason },
                            { label: "Edit", icon: Edit, onClick: () => onAction("edit", user), disabled: !canManageUsers, disabledReason: manageUsersReason },
                            { label: "Delete", icon: Trash2, onClick: () => onAction("delete", user), tone: "destructive", disabled: !canManageUsers, disabledReason: manageUsersReason },
                        ]}
                    />
                </TableCell>
            </TableRow>

            {isExpanded && (
                <TableRow className="bg-slate-50/80 border-y border-y-slate-200">
                    <TableCell colSpan={9}>
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
                                        <p className="text-sm text-muted-foreground">
                                            Last Active: {user.lastTimeActive ? new Date(user.lastTimeActive).toLocaleString() : "—"}
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
    resetMacAddressMutation,
    selectedUserIds,
    onToggleSelected,
    onToggleSelectAll,
    pageSize = 100,
    onPageSizeChange,
    canManageUsers = true,
    manageUsersReason = "You don't have permission to manage users.",
}) => {
    const [sorting, setSorting] = useState<SortingState>([]);
    const pageSizes = [10, 20, 50, 100,200,500];

    const allSelected = Boolean(users.length) && Boolean(selectedUserIds) && selectedUserIds!.size === users.length;
    const someSelected = Boolean(selectedUserIds) && selectedUserIds!.size > 0 && !allSelected;

    const columns: ColumnDef<User>[] = [
        {
            id: "select",
            header: () => (
                <Checkbox
                    checked={allSelected ? true : someSelected ? "indeterminate" : false}
                    onCheckedChange={(v) => onToggleSelectAll?.(Boolean(v))}
                    aria-label="Select all users"
                />
            ),
            cell: () => null,
            enableSorting: false,
        },
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
            accessorKey: "lastTimeActive",
            header: "Last Active",
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

    // IMPORTANT:
    // The headers were toggling TanStack sorting state, but the table body was rendering `users` directly.
    // Use the sorted row model as the source of truth for the displayed rows.
    const displayUsers = table.getSortedRowModel().rows.map((r) => r.original);

    return (
        <div>
            <div className="rounded-md border shadow-sm overflow-hidden">
                <TableToolbar label={displayUsers.length ? `${displayUsers.length} users` : "No users"} />

                <div className="min-w-[768px] hidden md:block">
                    <div className="overflow-x-auto max-h-[70vh]">
                        {displayUsers.length === 0 ? (
                            <div className="p-4">
                                <EmptyState
                                    title="No users found"
                                    description="Try changing filters or search terms."
                                />
                            </div>
                        ) : (
                        <Table>
                            <TableHeader className="sticky top-0 z-10">
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
                                {displayUsers.map((user, index) => (
                                    <UserRow 
                                        key={user.id} 
                                        user={user} 
                                        onAction={onAction}
                                        index={index}
                                        isSelected={selectedUserIds?.has(user.id)}
                                        onToggleSelected={onToggleSelected}
                                        canManageUsers={canManageUsers}
                                        manageUsersReason={manageUsersReason}
                                    />
                                ))}
                            </TableBody>
                        </Table>
                        )}
                    </div>
                </div>
            </div>

            <div className="mt-4 space-y-4 md:hidden">
                {displayUsers.length === 0 ? (
                    <EmptyState
                        title="No users found"
                        description="Try changing filters or search terms."
                    />
                ) : null}
                {displayUsers.map((user) => (
                    <UserCard
                        key={user.id}
                        user={user}
                        onEdit={() => onAction('edit', user)}
                        onDelete={() => onAction('delete', user)}
                        onResetMAC={() => onAction('reset-mac', user)}
                        onResetQuota={() => onAction('reset-quota', user)}
                        isResettingMAC={resetMacAddressMutation.variables === user.username}
                        isSelected={selectedUserIds?.has(user.id)}
                        onToggleSelected={(checked) => onToggleSelected?.(user.id, checked)}
                        canManageUsers={canManageUsers}
                        manageUsersReason={manageUsersReason}
                    />
                ))}
            </div>

            <TablePager
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalUsers}
                pageSize={pageSize}
                pageSizeOptions={pageSizes}
                onPageChange={onPageChange}
                onPageSizeChange={onPageSizeChange}
                isDisabled={isLoading}
                noun="results"
            />
        </div>
    );
};

export default UsersTable;