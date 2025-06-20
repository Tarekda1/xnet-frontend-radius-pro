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
import { ArrowUpDown, Edit, MoreHorizontal, Plus, RefreshCw, Trash2 } from 'lucide-react';
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


const UserCard: React.FC<{ user: AuthUser; onEdit: () => void; onDelete: () => void }> = ({ user, onEdit, onDelete }) => {
    return (
        <Card className="mb-4">
            <CardHeader>
                <CardTitle className="flex justify-between items-center">
                    <span className="font-semibold text-blue-600">{user.username}</span>
                    <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                        {user.role}
                    </Badge>
                </CardTitle>
                <CardDescription>{user.email}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                        <span className="font-semibold">Status:</span>
                        <span className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold ${user.isActive ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                            {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                    </div>
                    <div>
                        <span className="font-semibold">Created:</span> {new Date(user.createdAt).toLocaleDateString()}
                    </div>
                    <div>
                        <span className="font-semibold">Last Login:</span> {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                    </div>
                </div>
            </CardContent>
            <CardFooter className="flex justify-end space-x-2">
                <Button variant="outline" size="sm" onClick={onEdit}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                </Button>
                <Button variant="outline" size="sm" onClick={onDelete} disabled={user.role.toLowerCase() === 'admin'} className="text-red-600">
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


    const confirmDelete = async () => {
        if (userToDelete) {
            try {
                console.log('Deleting user:', userToDelete.username);
                // Assuming you have a deleteAuthUserMutation in your useAuthUsers hook
                await deleteAuthUserMutation.mutateAsync(userToDelete.username);
                refetch(); // Refresh the user list
            } catch (error) {
                console.error('Error deleting user:', error);
                // Handle error (e.g., show error message to user)
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

    if (isLoading) return <div className="flex justify-center items-center h-screen">Loading...</div>;
    if (error) return <div className="text-red-500 text-center">Error: {error.message}</div>;

    return (
        <div className="w-full min-h-screen py-5 overflow-x-hidden">
            <h1 className="text-2xl font-bold mb-2">Auth Users</h1>
            <div className="flex items-center justify-between py-2">
                <Input
                    placeholder="Search users..."
                    value={globalFilter ?? ''}
                    onChange={(event) => setGlobalFilter(String(event.target.value))}
                    className="max-w-sm"
                />
                <div className="flex space-x-2">
                    <Button onClick={handleRefresh}>
                        <RefreshCw className="h-4 w-2 mr-1" />
                        Refresh
                    </Button>
                    <Button onClick={handleAddUser}>
                        <Plus className="h-4 w-2 mr-1" />
                        Add User
                    </Button>
                </div>
            </div>
            <div className="w-full overflow-x-auto rounded-md border shadow-sm">
                <div className="min-w-[768px] hidden md:block">
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
                                                    <Button variant="ghost" className="h-4 w-8 p-0">
                                                        <span className="sr-only">Open menu</span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuItem onClick={() => handleEditUser(row.original)}>
                                                        <Edit className='w-2 h-2 mr-2'></Edit>Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem>
                                                        <RefreshCw className='w-2 h-2 mr-2'></RefreshCw>Reset Password
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem disabled={row.original.role.toLowerCase() === 'admin'} onClick={() => handleDeleteUser(row.original)} className="text-red-600">
                                                        <Trash2 className='w-4 h-4 mr-2' />Delete
                                                    </DropdownMenuItem>
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
                        <UserCard
                            key={row.id}
                            user={row.original}
                            onEdit={() => handleEditUser(row.original)}
                            onDelete={() => handleDeleteUser(row.original)}
                        />
                    ))}
                </div>
            </div>
            <div className="flex items-center justify-between py-4">
                <div>
                    <p>Total Users: {data?.data?.total}</p>
                    <p>Page {data?.data?.page} of {data?.data?.totalPages}</p>
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
            </div>
            {/* ... (existing table code) */}
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
                        <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default AuthUsersComponent;
