import React, { useState, useEffect } from 'react';
import { Profile, useProfiles } from '../hooks/useProfiles';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Download, Upload, Clock, Users, Pencil, Network, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from "@/components/ui/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Skeleton } from "@/components/ui/skeleton";

const ProfileCard: React.FC<{ profile: Profile; onEdit: () => void }> = ({ profile, onEdit }) => {
  const formatQuota = (quota: string) => {
    const quotaGB = (parseInt(quota) / (1024 * 1024 * 1024)).toFixed(2);
    return `${quotaGB} GB`;
  };

  const formatSpeed = (speedKbps: number) => {
    if (speedKbps >= 1000000) {
      return `${(speedKbps / 1000000).toFixed(2)} Gbps`;
    } else if (speedKbps >= 1000) {
      return `${(speedKbps / 1000).toFixed(2)} Mbps`;
    } else {
      return `${speedKbps} Kbps`;
    }
  };

  const formatSessionTimeout = (seconds: number) => {
    if (seconds >= 86400) {
      return `${Math.floor(seconds / 86400)} day(s)`;
    } else if (seconds >= 3600) {
      return `${Math.floor(seconds / 3600)} hour(s)`;
    } else if (seconds >= 60) {
      return `${Math.floor(seconds / 60)} minute(s)`;
    } else {
      return `${seconds} second(s)`;
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 relative">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">{profile.profileName}</h3>
            <Badge variant="secondary" className="text-xs">ID: {profile.id}</Badge>
          </div>
          <Button
            className="bg-white/10 hover:bg-white/20 text-white rounded-full p-1"
            onClick={onEdit}
            title="Edit Profile"
          >
            <Pencil className="w-4 h-4" />
          </Button>
        </div>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center">
            <Download className="w-4 h-4 mr-2 text-blue-500" />
            <span className="text-sm">{formatSpeed(profile.speedDown!)}</span>
          </div>
          <div className="flex items-center">
            <Upload className="w-4 h-4 mr-2 text-green-500" />
            <span className="text-sm">{formatSpeed(profile.speedUp!)}</span>
          </div>
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-2 text-orange-500" />
            <span className="text-sm">{formatSessionTimeout(profile.sessionTimeout!)} sec</span>
          </div>
          <div className="flex items-center">
            <Users className="w-4 h-4 mr-2 text-purple-500" />
            <span className="text-sm">{profile.maxSessions}</span>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t">
          <p className="text-sm text-gray-600">Daily: {formatQuota(profile.dailyQuota)}</p>
          <p className="text-sm text-gray-600">Monthly: {formatQuota(profile.monthlyQuota)}</p>
        </div>
        <div className="mt-4 text-xs text-gray-500">
          Night hours: {profile.nightStart} - {profile.nightEnd}
        </div>
      </div>
    </Card>
  );
};

const profileSchema = z.object({
  id: z.optional(z.number()),
  profileName: z.string().min(1, "Profile name is required"),
  dailyQuota: z.string().min(1, "Daily quota is required"),
  monthlyQuota: z.string().min(1, "Monthly quota is required"),
  speedDown: z.number().min(1, "Download speed is required"),
  speedUp: z.number().min(1, "Upload speed is required"),
  nightStart: z.string().optional(),
  nightEnd: z.string().optional(),
  sessionTimeout: z.number().optional(),
  idleTimeout: z.number().optional(),
  maxSessions: z.number().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface ProfileFormModalProps {
  profile?: Profile;
  onSave: (profile: ProfileFormData) => void;
  onClose: () => void;
}

const ProfileFormModal: React.FC<ProfileFormModalProps> = ({ profile, onSave, onClose }) => {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: profile || {
      profileName: '',
      dailyQuota: '',
      monthlyQuota: '',
      nightStart: '',
      nightEnd: '',
      speedDown: 0,
      speedUp: 0,
      sessionTimeout: 0,
      idleTimeout: 0,
      maxSessions: 0
    }
  });

  // Use useEffect to reset form values when the profile changes
  useEffect(() => {
    if (profile) {
      reset({
        ...profile,
        // Convert quota values from bytes to GB
        dailyQuota: (parseInt(profile.dailyQuota) / (1024 * 1024 * 1024)).toString(),
        monthlyQuota: (parseInt(profile.monthlyQuota) / (1024 * 1024 * 1024)).toString(),
      });
    }
  }, [profile, reset]);
  const onSubmit = (data: ProfileFormData) => {
    // Convert quota values back to bytes before saving
    const updatedData = {
      ...data,
      dailyQuota: (parseFloat(data.dailyQuota) * 1024 * 1024 * 1024).toString(),
      monthlyQuota: (parseFloat(data.monthlyQuota) * 1024 * 1024 * 1024).toString(),
    };
    onSave(updatedData);
    onClose();
  };


  return (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>{profile ? 'Edit Profile' : 'Create New Profile'}</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="profileName" className="text-right">
              Profile Name
            </Label>
            <div className="col-span-3">
              <Input id="profileName" {...register("profileName")} className="w-full" />
              {errors.profileName && <p className="text-red-500 text-sm mt-1">{errors.profileName.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="dailyQuota" className="text-right">
              Daily Quota (GB)
            </Label>
            <div className="col-span-3">
              <Input id="dailyQuota" type="text" {...register("dailyQuota")} className="w-full" />
              {errors.dailyQuota && <p className="text-red-500 text-sm mt-1">{errors.dailyQuota.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="monthlyQuota" className="text-right">
              Monthly Quota (GB)
            </Label>
            <div className="col-span-3">
              <Input id="monthlyQuota" type="text" {...register("monthlyQuota")} className="w-full" />
              {errors.monthlyQuota && <p className="text-red-500 text-sm mt-1">{errors.monthlyQuota.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="nightStart" className="text-right">
              Night Start
            </Label>
            <Input id="nightStart" type="time" {...register("nightStart")} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="nightEnd" className="text-right">
              Night End
            </Label>
            <Input id="nightEnd" type="time" {...register("nightEnd")} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="speedDown" className="text-right">
              Download Speed (Kbps)
            </Label>
            <div className="col-span-3">
              <Input id="speedDown" type="number" {...register("speedDown", { valueAsNumber: true })} className="w-full" />
              {errors.speedDown && <p className="text-red-500 text-sm mt-1">{errors.speedDown.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="speedUp" className="text-right">
              Upload Speed (Kbps)
            </Label>
            <div className="col-span-3">
              <Input id="speedUp" type="number" {...register("speedUp", { valueAsNumber: true })} className="w-full" />
              {errors.speedUp && <p className="text-red-500 text-sm mt-1">{errors.speedUp.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="sessionTimeout" className="text-right">
              Session Timeout (sec)
            </Label>
            <Input id="sessionTimeout" type="number" {...register("sessionTimeout", { valueAsNumber: true })} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="idleTimeout" className="text-right">
              Idle Timeout (sec)
            </Label>
            <Input id="idleTimeout" type="number" {...register("idleTimeout", { valueAsNumber: true })} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="maxSessions" className="text-right">
              Max Sessions
            </Label>
            <Input id="maxSessions" type="number" {...register("maxSessions", { valueAsNumber: true })} className="col-span-3" />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit">Save changes</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
};

const ProfilesComponent: React.FC = () => {
  const { data, error, isLoading, updateProfile, createProfile } = useProfiles();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | undefined>(undefined);
  const { toast } = useToast();

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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="h-32 w-full" />
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
                  <h3 className="text-lg font-semibold">Error Loading Profiles</h3>
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

  const filteredProfiles = data?.data.filter(profile =>
    profile.profileName.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleSaveProfile = async (profile: Profile) => {
    try {
      if (profile.id) {
        await updateProfile(profile);
        toast({
          title: "Profile Updated",
          description: `Profile "${profile.profileName}" has been updated successfully.`,
        });
      } else {
        await createProfile(profile);
        toast({
          title: "Profile Created",
          description: `Profile "${profile.profileName}" has been created successfully.`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to save profile: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  const openEditModal = (profile: Profile) => {
    setEditingProfile({
      ...profile,
      speedDown: Number(profile.speedDown),
      speedUp: Number(profile.speedUp),
      sessionTimeout: Number(profile.sessionTimeout),
      idleTimeout: Number(profile.idleTimeout),
      maxSessions: Number(profile.maxSessions),
    });
    setIsModalOpen(true);
  };

  return (
    <div className="w-full py-6 space-y-6">
      <header className="flex flex-col md:flex-row justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Network className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Network Profiles</h1>
            <p className="text-sm text-muted-foreground">
              Manage and configure network access profiles
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => setIsModalOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" /> Add Profile
          </Button>
        </div>
      </header>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <CardTitle>Available Profiles</CardTitle>
              <CardDescription>
                {filteredProfiles.length} profile{filteredProfiles.length !== 1 ? 's' : ''} found
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search profiles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProfiles.map(profile => (
              <ProfileCard
                key={profile.id}
                profile={profile}
                onEdit={() => openEditModal(profile)}
              />
            ))}
          </div>
          {filteredProfiles.length === 0 && (
            <div className="text-center py-12">
              <div className="p-3 rounded-full bg-muted inline-block mb-4">
                <Search className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">No profiles found</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {searchTerm ? 'Try adjusting your search' : 'Create your first profile'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <ProfileFormModal
          profile={editingProfile}
          onSave={handleSaveProfile}
          onClose={() => {
            setIsModalOpen(false);
            setEditingProfile(undefined);
          }}
        />
      </Dialog>
    </div>
  );
};

export default ProfilesComponent;

