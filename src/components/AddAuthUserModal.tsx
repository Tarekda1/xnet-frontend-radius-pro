import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import useAuthUsers from '../hooks/useAuthUsers';
import { AuthUser } from '../types/api';

interface AddAuthUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  userToEdit?: AuthUser;
}

const AddAuthUserModal: React.FC<AddAuthUserModalProps> = ({ isOpen, onClose, userToEdit }) => {
  const { isLoading, createAuthUserMutation, updateAuthUserMutation } = useAuthUsers();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'support',
    isActive: true,
  });

  useEffect(() => {
    if (userToEdit) {
      setFormData({
        username: userToEdit.username,
        email: userToEdit.email,
        password: userToEdit.password||"", // Don't populate password for editing
        role: userToEdit.role,
        isActive: userToEdit.isActive === 1,
      });
      console.log('User to edit:', userToEdit);
    } else {
      // Reset form when opening for a new user
      setFormData({
        username: '',
        email: '',
        password: '',
        role: 'support',
        isActive: true,
      });
    }
  }, [userToEdit]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value: string) => {
    setFormData(prev => ({ ...prev, role: value }));
  };

  const handleSwitchChange = (checked: boolean) => {
    setFormData(prev => ({ ...prev, isActive: checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (userToEdit) {
        await updateAuthUserMutation.mutateAsync({ ...formData, id: userToEdit.id });
      } else {
        await createAuthUserMutation.mutateAsync(formData);
      }
      onClose();
    } catch (error) {
      console.error('Error creating/updating user:', error);
      // Handle error (e.g., show error message to user)
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{userToEdit ? 'Edit User' : 'Add New User'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="username" className="text-right">
                Username
              </Label>
              <Input
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className={`col-span-3 ${userToEdit ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
                disabled={!!userToEdit}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-right">
                Password
              </Label>
              <Input
                id="password"
                name="password"
                type="text"
                value={formData.password}
                onChange={handleInputChange}
                className="col-span-3"
                placeholder={userToEdit ? "Leave blank to keep current password" : ""}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">
                Role
              </Label>
              <Select onValueChange={handleSelectChange} value={formData.role}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="support">Support</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="isActive" className="text-right">
                Active
              </Label>
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={handleSwitchChange}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {userToEdit ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddAuthUserModal;