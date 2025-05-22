import React, { useState, useEffect } from 'react';
import { Profile, useProfiles } from '../hooks/useProfiles';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Download, Upload, Clock, Users, Pencil } from 'lucide-react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'react-toastify';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

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

  if (isLoading) return <div className="flex justify-center items-center h-screen">Loading...</div>;
  if (error) return <div className="text-red-500 text-center">Error: {error.message}</div>;

  const filteredProfiles = data?.data.filter(profile =>
    profile.profileName.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleSaveProfile = async (profile: Profile) => {
    try {
      if (profile.id) {
        await updateProfile(profile);
        toast.success(`Profile "${profile.profileName}" updated successfully`);
      } else {
        await createProfile(profile);
        toast.success(`Profile "${profile.profileName}" created successfully`);
      }
    } catch (error) {
      toast.error(`Failed to save profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };


  const openEditModal = (profile: Profile) => {
    setEditingProfile({
      ...profile,
      // Ensure all number fields are actually numbers
      speedDown: Number(profile.speedDown),
      speedUp: Number(profile.speedUp),
      sessionTimeout: Number(profile.sessionTimeout),
      idleTimeout: Number(profile.idleTimeout),
      maxSessions: Number(profile.maxSessions),
    });
    setIsModalOpen(true);
  };


  return (
    <div className="w-full py-5">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Network Profiles</h1>
      <div className="flex flex-col sm:flex-row items-center justify-between py-4 mb-6 space-y-4 sm:space-y-0">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search profiles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <Button
          className="bg-blue-500 hover:bg-blue-600 text-white w-full sm:w-auto"
          onClick={() => setIsModalOpen(true)}
        >
          <Plus className="w-4 h-4 mr-2" /> Add Profile
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProfiles.map(profile => (
          <div key={profile.id} className="relative">
            <ProfileCard
              key={profile.id}
              profile={profile}
              onEdit={() => openEditModal(profile)}
            />
          </div>
        ))}
      </div>
      {filteredProfiles.length === 0 && (
        <div className="text-center text-gray-500 mt-10">
          No profiles found matching your search.
        </div>
      )}
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

