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
import useAuthUsers from '../hooks/useAuthUsers';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthUser } from '../types/api';
import { ArrowUpDown, Edit, MoreHorizontal, Plus, RefreshCw, Trash2, Users, Search, AlertCircle } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Badge } from '@/components/ui/badge';
import AddAuthUserModal from '@/components/AddAuthUserModal';
import { AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { AlertDialog } from '@radix-ui/react-alert-dialog';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";

const UserCard: React.FC<{ user: AuthUser; onEdit: () => void; onDelete: () => void }> = ({ user, onEdit, onDelete }) => {
    return (
        <Card className="mb-4 hover:shadow-md transition-shadow duration-200">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-lg font-semibold text-blue-600">{user.username}</CardTitle>
                        <CardDescription className="mt-1">{user.email}</CardDescription>
                    </div>
                    <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                        {user.role}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                        <span className="font-medium">Status:</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="font-medium">Created:</span>
                        <span className="text-muted-foreground">{new Date(user.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="font-medium">Last Login:</span>
                        <span className="text-muted-foreground">{user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}</span>
                    </div>
                </div>
            </CardContent>
            <CardFooter className="flex justify-end space-x-2 pt-4 border-t">
                <Button variant="outline" size="sm" onClick={onEdit}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                </Button>
                <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={onDelete} 
                    disabled={user.role.toLowerCase() === 'admin'}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                </Button>
            </CardFooter>
        </Card>
    );
};

const columns: ColumnDef<AuthUser>[] = [
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
        cell: ({ row }) => <span className="font-mono text-sm">{row.original.id}</span>,
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
                    Username
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        cell: ({ row }) => <span className="font-semibold text-blue-600 hover:text-blue-800 transition-colors duration-200">{row.original.username}</span>,
    },
    {
        accessorKey: "email",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="hover:bg-gray-100"
                >
                    Email
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        cell: ({ row }) => <span className="text-gray-600">{row.original.email}</span>,
    },
    {
        accessorKey: "role",
        header: "Role",
        cell: ({ row }) => (
            <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                {row.original.role}
            </Badge>
        ),
    },
    {
        accessorKey: "isActive",
        header: "Status",
        cell: ({ row }) => (
            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${row.original.isActive ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                {row.original.isActive ? 'Active' : 'Inactive'}
            </span>
        ),
    },
    {
        accessorKey: "createdAt",
        header: "Created At",
        cell: ({ row }) => <span>{new Date(row.original.createdAt).toLocaleString()}</span>,
    },
    {
        accessorKey: "lastLogin",
        header: "Last Login",
        cell: ({ row }) => <span>{row.original.lastLogin ? new Date(row.original.lastLogin).toLocaleString() : 'Never'}</span>,
    },
];

const AuthUsersComponent: React.FC = () => {
    const { data, error, isLoading, refetch, deleteAuthUserMutation } = useAuthUsers();
    const [sorting, setSorting] = useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = useState('');
    const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
    const [userToEdit, setUserToEdit] = useState<AuthUser | undefined>(undefined);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<AuthUser | null>(null);
    const { toast } = useToast();

    const confirmDelete = async () => {
        if (userToDelete) {
            try {
                await deleteAuthUserMutation.mutateAsync(userToDelete.username);
                toast({
                    title: "User Deleted",
                    description: `User "${userToDelete.username}" has been deleted successfully.`,
                });
                refetch();
            } catch (error) {
                toast({
                    title: "Error",
                    description: `Failed to delete user: ${error instanceof Error ? error.message : 'Unknown error'}`,
                    variant: "destructive",
                });
            }
        }
        setDeleteConfirmOpen(false);
        setUserToDelete(null);
    };

    const handleDeleteUser = (user: AuthUser) => {
        console.log('Deleting user:', user);
        setUserToDelete(user);
        setDeleteConfirmOpen(true);
    };

    const handleAddUser = () => {
        setUserToEdit(undefined);
        setIsAddUserModalOpen(true);
    };

    const handleEditUser = (user: AuthUser) => {
        setUserToEdit(user);
        setIsAddUserModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsAddUserModalOpen(false);
        setUserToEdit(undefined);
    };

    const table = useReactTable({
        data: data?.data?.users ?? [],
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

    if (isLoading) {
        return (
            <div className="w-full py-6 space-y-6">
                <header className="flex flex-col md:flex-row justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-lg" />
                        <div className="space-y-2">
                            <Skeleton className="h-8 w-48" />
                            <Skeleton className="h-4 w-64" />
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Skeleton className="h-10 w-[200px]" />
                        <Skeleton className="h-10 w-32" />
                    </div>
                </header>

                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-4 w-64" />
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <Card key={i} className="overflow-hidden">
                                    <div className="p-4 space-y-4">
                                        <Skeleton className="h-4 w-3/4" />
                                        <Skeleton className="h-4 w-1/2" />
                                        <Skeleton className="h-4 w-2/3" />
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full py-6 space-y-6">
                <div className="flex items-center justify-center h-[50vh]">
                    <Card className="w-full max-w-md">
                        <CardContent className="pt-6">
                            <div className="flex flex-col items-center gap-4 text-center">
                                <div className="p-3 rounded-full bg-red-100">
                                    <AlertCircle className="h-6 w-6 text-red-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold">Error Loading Users</h3>
                                    <p className="text-sm text-muted-foreground mt-1">{error.message}</p>
                                </div>
                                <Button variant="outline" onClick={() => window.location.reload()}>
                                    Try Again
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full py-6 space-y-6">
            <header className="flex flex-col md:flex-row justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                        <Users className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold">Auth Users</h1>
                        <p className="text-sm text-muted-foreground">
                            Manage and configure user access
                        </p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleRefresh}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                    </Button>
                    <Button onClick={handleAddUser}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add User
                    </Button>
                </div>
            </header>

            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div>
                            <CardTitle>User Management</CardTitle>
                            <CardDescription>
                                {data?.data?.total} total users
                            </CardDescription>
                        </div>
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                            <Input
                                placeholder="Search users..."
                                value={globalFilter ?? ''}
                                onChange={(event) => setGlobalFilter(String(event.target.value))}
                                className="pl-9"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="w-full overflow-x-auto rounded-md border shadow-sm">
                        <div className="min-w-[768px] hidden md:block">
                            <Table>
                                <TableHeader>
                                    {table.getHeaderGroups().map((headerGroup) => (
                                        <TableRow key={headerGroup.id} className="bg-muted/50">
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
                                        </TableRow>
                                    ))}
                                </TableHeader>
                                <TableBody>
                                    {table.getRowModel().rows?.length ? (
                                        table.getRowModel().rows.map((row) => (
                                            <TableRow
                                                key={row.id}
                                                data-state={row.getIsSelected() && "selected"}
                                                className="hover:bg-muted/50 transition-colors"
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
                                                            <DropdownMenuItem onClick={() => handleEditUser(row.original)}>
                                                                <Edit className="w-4 h-4 mr-2" />
                                                                Edit
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem>
                                                                <RefreshCw className="w-4 h-4 mr-2" />
                                                                Reset Password
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem 
                                                                disabled={row.original.role.toLowerCase() === 'admin'} 
                                                                onClick={() => handleDeleteUser(row.original)}
                                                                className="text-red-600"
                                                            >
                                                                <Trash2 className="w-4 h-4 mr-2" />
                                                                Delete
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={columns.length + 1} className="h-24 text-center">
                                                <div className="flex flex-col items-center gap-2">
                                                    <Search className="h-8 w-8 text-muted-foreground" />
                                                    <p className="text-lg font-medium">No users found</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {globalFilter ? 'Try adjusting your search' : 'Add your first user'}
                                                    </p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                        <div className="md:hidden space-y-4 p-4">
                            {table.getRowModel().rows.map((row) => (
                                <UserCard
                                    key={row.id}
                                    user={row.original}
                                    onEdit={() => handleEditUser(row.original)}
                                    onDelete={() => handleDeleteUser(row.original)}
                                />
                            ))}
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                        Page {table.getState().pagination.pageIndex + 1} of{" "}
                        {table.getPageCount()}
                    </div>
                    <div className="flex items-center space-x-2">
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
                </CardFooter>
            </Card>

            <AddAuthUserModal
                isOpen={isAddUserModalOpen}
                onClose={handleCloseModal}
                userToEdit={userToEdit}
            />
            <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure you want to delete this user?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the user
                            account and remove their data from our servers.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default AuthUsersComponent;
