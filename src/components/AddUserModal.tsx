import React, { useEffect, useReducer } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProfiles } from '@/hooks/useProfiles';
import { User } from '@/types/api';
import { Eye, EyeOff } from 'lucide-react';
import { Switch } from './ui/switch';
import useUsers, { AccountStatus } from '@/hooks/useUsers';

interface AddUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUserAdded: () => void;
    editingUser: User | null;
}

type State = {
    username: string;
    password: {
        value: string;
    };
    selectedProfile: string;
    accountStatus: string;
    freenight: boolean;
    quotaResetDay: string;
    showPassword: boolean;
    fullName: string;
    address: string;
    phoneNumber: string;
    email: string;
};

type Action =
    | { type: 'SET_FIELD'; field: keyof State; value: string | boolean | undefined }
    | { type: 'RESET_FORM' }
    | { type: 'SET_EDITING_USER'; user: User };

const initialState: State = {
    username: '',
    password: {
        value: ''
    },
    selectedProfile: '',
    accountStatus: 'active',
    freenight: false,
    quotaResetDay: '1',
    showPassword: false,
    fullName: '',
    address: '',
    phoneNumber: '',
    email: '',
};

function reducer(state: State, action: Action): State {
    switch (action.type) {
        case 'SET_FIELD':
            console.log(action.field, action.value);
            if (action.field === 'password') {
                return { ...state, password: { value: action.value as string } };
            }
            return { ...state, [action.field]: action.value };
        case 'RESET_FORM':
            return initialState;
        case 'SET_EDITING_USER':
            return {
                ...state,
                username: action.user.username,
                password: { value: action.user.password.value },
                selectedProfile: action.user.profile.id.toString(),
                accountStatus: action.user.accountStatus,
                quotaResetDay: action.user.quotaResetDay?.toString() || '1',
                fullName: action.user.userDetails?.fullName || '',
                address: action.user.userDetails?.address || '',
                phoneNumber: action.user.userDetails?.phoneNumber || '',
                email: action.user.userDetails?.email || '',
            };
        default:
            return state;
    }
}
const AddUserModal: React.FC<AddUserModalProps> = ({ isOpen, onClose, onUserAdded, editingUser }) => {
    const [state, dispatch] = useReducer(reducer, initialState);
    const { data, error, isLoading } = useProfiles();
    const { updateUserMutation, createUserMutation } = useUsers();

    useEffect(() => {
        if (editingUser) {
            dispatch({ type: 'SET_EDITING_USER', user: editingUser });
        } else {
            dispatch({ type: 'RESET_FORM' });
        }
    }, [editingUser]);

    // Add this new useEffect
    useEffect(() => {
        if (data?.data && data.data.length > 0) {
            if (editingUser) {
                const userProfileId = editingUser.profile?.id?.toString();
                const profileExists = data.data.some(profile => profile.id?.toString() === userProfileId);
                dispatch({
                    type: 'SET_FIELD',
                    field: 'selectedProfile',
                    value: profileExists ? userProfileId : data.data[0].id?.toString()
                });
            }
            //  else if (!state.selectedProfile) {
            //     dispatch({
            //         type: 'SET_FIELD',
            //         field: 'selectedProfile',
            //         value: data.data[0].id?.toString()
            //     });
            // }
        }
    }, [data, editingUser]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const profileId = state.selectedProfile ? parseInt(state.selectedProfile, 10) : -1;
        const userData = {
            username: state.username,
            password: state.password.value,
            profileId,
            accountStatus: state.accountStatus as AccountStatus,
            quotaResetDay: parseInt(state.quotaResetDay, 10),
            fullName: state.fullName,
            address: state.address,
            phoneNumber: state.phoneNumber,
            email: state.email,
        };
        console.log(userData);
        if (editingUser) {
            updateUserMutation.mutate(userData, {
                onSuccess: () => {
                    alert("User updated successfully!");
                    onUserAdded();
                    onClose();
                },
                onError: (error) => {
                    alert(`Error updating user: ${error.message}`);
                }
            });
        } else {
            createUserMutation.mutate(userData, {
                onSuccess: () => {
                    alert("User created successfully!");
                    onClose();
                },
                onError: (error) => {
                    alert(`Error creating user: ${error.message}`);
                }
            });
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]  max-w-[95vw] h-[90vh] flex flex-col p-0">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle>{editingUser ? 'Edit User' : 'Add New User'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="flex flex-col flex-grow overflow-hidden">
                    <div className="flex-grow overflow-y-auto p-6 pt-2">
                        <div className="grid gap-4">
                            {/* Username field */}
                            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                                <Label htmlFor="username" className="sm:text-right">Username</Label>
                                <Input
                                    id="username"
                                    value={state.username}
                                    onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'username', value: e.target.value })}
                                    className="col-span-1 sm:col-span-3"
                                    disabled={!!editingUser}
                                    required
                                />
                            </div>

                            {/* Password field */}
                            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                                <Label htmlFor="password" className="sm:text-right">Password</Label>
                                <div className="col-span-1 sm:col-span-3 flex">
                                    <Input
                                        id="password"
                                        type={state.showPassword ? "text" : "password"}
                                        value={state.password.value}
                                        onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'password', value: e.target.value })}
                                        className="flex-grow"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        onClick={() => dispatch({ type: 'SET_FIELD', field: 'showPassword', value: !state.showPassword })}
                                        className="ml-2"
                                    >
                                        {state.showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </div>

                            {/* Profile field */}
                            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                                <Label htmlFor="profile" className="sm:text-right">Profile</Label>
                                <Select
                                    value={state.selectedProfile || undefined}
                                    onValueChange={(value) => dispatch({ type: 'SET_FIELD', field: 'selectedProfile', value })}
                                >
                                    <SelectTrigger className="col-span-1 sm:col-span-3">
                                        <SelectValue placeholder="Select a profile" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {isLoading ? (
                                            <SelectItem value="-1">Loading profiles...</SelectItem>
                                        ) : error ? (
                                            <SelectItem value="-1">Error loading profiles</SelectItem>
                                        ) : (
                                            data?.data?.map((profile) => (
                                                <SelectItem key={profile.id} value={profile.id?.toString() || ''}>
                                                    {profile.profileName}
                                                </SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Account Status field */}
                            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                                <Label htmlFor="accountStatus" className="sm:text-right">Account Status</Label>
                                <Select
                                    value={state.accountStatus}
                                    onValueChange={(value) => dispatch({ type: 'SET_FIELD', field: 'accountStatus', value })}
                                >
                                    <SelectTrigger className="col-span-1 sm:col-span-3">
                                        <SelectValue placeholder="Select account status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="suspended">Suspended</SelectItem>
                                        <SelectItem value="blocked">Blocked</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Freenight field */}
                            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                                <Label htmlFor="freenight" className="sm:text-right">Freenight</Label>
                                <div className="col-span-1 sm:col-span-3 flex items-center">
                                    <Switch
                                        id="freenight"
                                        checked={state.freenight}
                                        onCheckedChange={(checked) => dispatch({ type: 'SET_FIELD', field: 'freenight', value: checked })}
                                    />
                                    <span className="ml-2">{state.freenight ? 'Enabled' : 'Disabled'}</span>
                                </div>
                            </div>

                            {/* Quota Reset Day field */}
                            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                                <Label htmlFor="quotaResetDay" className="sm:text-right">Quota Reset Day</Label>
                                <Input
                                    id="quotaResetDay"
                                    type="number"
                                    min="1"
                                    max="31"
                                    value={state.quotaResetDay}
                                    onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'quotaResetDay', value: e.target.value })}
                                    className="col-span-1 sm:col-span-3"
                                />
                            </div>

                            {/* Full Name field */}
                            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                                <Label htmlFor="fullName" className="sm:text-right">Full Name</Label>
                                <Input
                                    id="fullName"
                                    value={state.fullName}
                                    onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'fullName', value: e.target.value })}
                                    className="col-span-1 sm:col-span-3"
                                />
                            </div>

                            {/* Address field */}
                            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                                <Label htmlFor="address" className="sm:text-right">Address</Label>
                                <Input
                                    id="address"
                                    value={state.address}
                                    onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'address', value: e.target.value })}
                                    className="col-span-1 sm:col-span-3"
                                />
                            </div>

                            {/* Phone Number field */}
                            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                                <Label htmlFor="phoneNumber" className="sm:text-right">Phone Number</Label>
                                <Input
                                    id="phoneNumber"
                                    value={state.phoneNumber}
                                    onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'phoneNumber', value: e.target.value })}
                                    className="col-span-1 sm:col-span-3"
                                />
                            </div>

                            {/* Email field */}
                            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                                <Label htmlFor="email" className="sm:text-right">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={state.email}
                                    onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'email', value: e.target.value })}
                                    className="col-span-1 sm:col-span-3"
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="p-6 pt-2">
                        <Button type="submit">{editingUser ? 'Update User' : 'Add User'}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default AddUserModal;

