import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, Edit, Trash2 } from 'lucide-react';
import { User } from '../types/api';
import  Loader  from '@/components/ui/loader';

interface UserCardProps {
    user: User;
    onEdit: () => void;
    onDelete: () => void;
    onResetMAC: () => void;
    onResetQuota: () => void;
    isResettingMAC: boolean;
}

const UserCard: React.FC<UserCardProps> = ({ user, onEdit, onDelete, onResetMAC, onResetQuota, isResettingMAC }) => {
    // const dailyUsagePercentage = user.profile.dailyQuota ? (user.profile.dailyUsage / user.profile.dailyQuota) * 100 : 0;
    // const monthlyUsagePercentage = user.profile.monthlyQuota ? (user.monthlyUsage / user.profile.monthlyQuota) * 100 : 0;

    return (
        <Card className="mb-4">
            <CardHeader>
                <CardTitle className="flex justify-between items-center">
                    <span>{user.username}</span>
                    <Badge variant={user.isOnline ? "success" : "secondary"}>
                        {user.isOnline ? "Online" : "Offline"}
                    </Badge>
                </CardTitle>
                <CardDescription>{user.userDetails?.fullName || 'N/A'}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    <div>
                        <span className="font-semibold">Profile:</span> {user.profile.profileName}
                    </div>
                    <div>
                        <span className="font-semibold">MAC Address:</span> {user.macAddress?.macAddress || 'Not set'}
                    </div>
                </div>
            </CardContent>
            <CardFooter className="flex justify-between">
                <Button variant="outline" size="sm" onClick={onEdit}>
                    <Edit className="w-4 h-4 mr-2" /> Edit
                </Button>
                <Button variant="outline" size="sm" onClick={onResetMAC} disabled={isResettingMAC}>
                    {isResettingMAC ? <Loader  /> : <RefreshCw className="w-4 h-4 mr-2" />}
                    Reset MAC
                </Button>
                <Button variant="outline" size="sm" onClick={onResetQuota}>
                    <RefreshCw className="w-4 h-4 mr-2" /> Reset Quota
                </Button>
                <Button variant="outline" size="sm" onClick={onDelete} className="text-red-600">
                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                </Button>
            </CardFooter>
        </Card>
    );
};

export default UserCard;