import React, { useState, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw } from 'lucide-react';
import SearchBar from '@/components/SearchBar';
import UsersTable from '@/components/UsersTable';
import AddUserModal from '../components/AddUserModal';
import useUsers from '../hooks/useUsers';
import { User } from '../types/api';
import Loader from '@/components/ui/loader';

const UsersPage: React.FC = () => {
    const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const pageSize = 100;

    const {
        data,
        error,
        isLoading,
        refetch,
        setCurrentPage,
        currentPage,
        searchQuery,
        setSearchQuery,
        deleteUserMutation,
        resetMacAddressMutation
    } = useUsers(1, pageSize);

    const handleSearch = useCallback((term: string) => {
        setSearchQuery(term);
        setCurrentPage(1);
    }, [setSearchQuery, setCurrentPage]);

    const handleRefresh = useCallback(() => {
        refetch();
    }, [refetch]);

    const handleAddUser = useCallback(() => {
        setEditingUser(null);
        setIsAddUserModalOpen(true);
    }, []);

    const handleUserAdded = useCallback(() => {
        refetch();
        setIsAddUserModalOpen(false);
        setEditingUser(null);
    }, [refetch]);

    const handleCloseModal = useCallback(() => {
        setIsAddUserModalOpen(false);
        setEditingUser(null);
    }, []);

    const confirmAndExecute = useCallback((message: string, action: () => void, successMessage: string) => {
        if (window.confirm(message)) {
            action();
            alert(successMessage);
            refetch();
        }
    }, [refetch]);

    const handleAction = useCallback((action: string, user: User) => {
        const actions = {
            edit: () => {
                setEditingUser(user);
                setIsAddUserModalOpen(true);
            },
            delete: () => confirmAndExecute(
                `Are you sure you want to delete user ${user.username}?`,
                () => deleteUserMutation.mutate(user.username),
                'User deleted successfully'
            ),
            'reset-mac': () => confirmAndExecute(
                `Are you sure you want to reset MAC address for user ${user.username}?`,
                () => resetMacAddressMutation.mutate(user.username),
                'MAC address reset successfully'
            ),
            'reset-quota': () => {
                // Implement reset quota logic here
                console.log('Reset quota for user:', user.username);
                alert('Quota reset functionality not implemented yet');
            }
        };

        const actionFunction = actions[action as keyof typeof actions];
        if (actionFunction) {
            actionFunction();
        } else {
            console.warn('Unknown action:', action);
        }
    }, [deleteUserMutation, resetMacAddressMutation, confirmAndExecute]);

    if (isLoading) return <div className="flex justify-center items-center h-screen"><Loader />Loading...</div>;
    if (error) return <div className="text-red-500 text-center">Error: {error.message}</div>;

    return (
        <div className="w-full py-6 pt-2">
            <h1 className="text-3xl font-bold mb-4">Users</h1>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-4 space-y-4 sm:space-y-0 sm:space-x-4">
                <SearchBar currentSearchTerm={searchQuery} onSearch={handleSearch} />
                <div className="flex space-x-2 w-full sm:w-auto">
                    <Button variant="outline" onClick={handleRefresh} className="flex-1 sm:flex-none">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        {isLoading ? "Loading" : "Refresh"}
                    </Button>
                    <Button variant="outline" onClick={handleAddUser} className="flex-1 sm:flex-none">
                        <Plus className="h-4 w-4 mr-2" />
                        Add User
                    </Button>
                </div>
            </div>

            <UsersTable
                users={data?.data?.users ?? []}
                currentPage={currentPage}
                totalPages={data?.data?.totalPages ?? 0}
                totalUsers={data?.data?.totalUsers ?? 0}
                onPageChange={setCurrentPage}
                onAction={handleAction}
                isLoading={isLoading}
                pageSize={pageSize}
                deleteUserMutation={deleteUserMutation}
                resetMacAddressMutation={resetMacAddressMutation}
            />

            {(isAddUserModalOpen || editingUser) && (
                <AddUserModal
                    isOpen={isAddUserModalOpen || !!editingUser}
                    onClose={handleCloseModal}
                    onUserAdded={handleUserAdded}
                    editingUser={editingUser}
                />
            )}
        </div>
    );
};

export default UsersPage;