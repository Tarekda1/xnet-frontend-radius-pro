import React, { useMemo, useState, useEffect } from 'react';
import PageHeader from "@/components/PageHeader";
import { Profile, useProfiles } from '../hooks/useProfiles';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Download, Upload, Clock, Users, Pencil, Network, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Skeleton } from "@/components/ui/skeleton";
import SearchBar from "@/components/SearchBar";
import QueryState from "@/components/QueryState";

const ProfileCard: React.FC<{ profile: Profile; onEdit: () => void; onDelete: () => void }> = ({ profile, onEdit, onDelete }) => {
  const formatQuota = (quota: string) => {
    const quotaGB = (parseInt(quota) / (1024 * 1024 * 1024)).toFixed(2);
    return `${quotaGB} GB`;
  };

  const formatSpeed = (speedKbps?: number) => {
    const v = Number(speedKbps ?? 0);
    if (!Number.isFinite(v) || v <= 0) return "—";
    if (v >= 1000000) {
      return `${(v / 1000000).toFixed(2)} Gbps`;
    } else if (v >= 1000) {
      return `${(v / 1000).toFixed(2)} Mbps`;
    } else {
      return `${v} Kbps`;
    }
  };

  const formatSessionTimeout = (seconds?: number) => {
    const s = Number(seconds ?? 0);
    if (!Number.isFinite(s) || s <= 0) return "—";
    if (s >= 86400) {
      return `${Math.floor(s / 86400)} day(s)`;
    } else if (s >= 3600) {
      return `${Math.floor(s / 3600)} hour(s)`;
    } else if (s >= 60) {
      return `${Math.floor(s / 60)} minute(s)`;
    } else {
      return `${s} second(s)`;
    }
  };

  return (
    <Card className="relative overflow-hidden border-0 shadow-xl bg-white/80 backdrop-blur-sm transition-all duration-300 hover:shadow-2xl">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-purple-50/20 to-pink-50/30" />

      <CardHeader className="relative z-10 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="text-lg truncate text-gray-900">{profile.profileName}</CardTitle>
            <CardDescription className="flex items-center gap-2">
              <Badge variant="outline" className="bg-white/70">
                ID: {profile.id}
              </Badge>
              <span className="text-xs text-muted-foreground truncate">
                Night: {profile.nightStart || "—"} – {profile.nightEnd || "—"}
              </span>
            </CardDescription>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="icon" className="bg-white/70" onClick={onEdit} title="Edit profile">
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="bg-white/70 text-red-600 hover:text-red-700"
              onClick={onDelete}
              title="Delete profile"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="relative z-10 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border bg-white/70 p-3">
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <Download className="h-4 w-4 text-blue-600" />
              Download
            </div>
            <div className="mt-1 font-mono text-sm text-gray-900">{formatSpeed(profile.speedDown)}</div>
          </div>
          <div className="rounded-lg border bg-white/70 p-3">
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <Upload className="h-4 w-4 text-emerald-600" />
              Upload
            </div>
            <div className="mt-1 font-mono text-sm text-gray-900">{formatSpeed(profile.speedUp)}</div>
          </div>
          <div className="rounded-lg border bg-white/70 p-3">
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-600" />
              Session timeout
            </div>
            <div className="mt-1 font-mono text-sm text-gray-900">{formatSessionTimeout(profile.sessionTimeout)}</div>
          </div>
          <div className="rounded-lg border bg-white/70 p-3">
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-600" />
              Max sessions
            </div>
            <div className="mt-1 font-mono text-sm text-gray-900">{profile.maxSessions ?? "—"}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border bg-white/70 p-3">
            <div className="text-xs text-muted-foreground">Daily quota</div>
            <div className="mt-1 font-mono text-sm text-gray-900">{formatQuota(profile.dailyQuota)}</div>
          </div>
          <div className="rounded-lg border bg-white/70 p-3">
            <div className="text-xs text-muted-foreground">Monthly quota</div>
            <div className="mt-1 font-mono text-sm text-gray-900">{formatQuota(profile.monthlyQuota)}</div>
          </div>
          {profile.price != null && profile.price > 0 && (
            <div className="col-span-2 rounded-lg border bg-white/70 p-3">
              <div className="text-xs text-muted-foreground">Price</div>
              <div className="mt-1 font-mono text-sm font-semibold text-gray-900">{Number(profile.price).toLocaleString()} / month</div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const profileSchema = z.object({
  id: z.optional(z.number()),
  profileName: z.string().min(1, "Profile name is required"),
  dailyQuota: z.string().min(1, "Daily quota is required"),
  monthlyQuota: z.string().min(1, "Monthly quota is required"),
  price: z.number().min(0, "Price must be 0 or greater").optional(),
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
  onSave: (profile: Profile) => void;
  onClose: () => void;
}

const emptyFormValues: ProfileFormData = {
  profileName: '',
  dailyQuota: '',
  monthlyQuota: '',
  price: 0,
  nightStart: '',
  nightEnd: '',
  speedDown: 0,
  speedUp: 0,
  sessionTimeout: 0,
  idleTimeout: 0,
  maxSessions: 0
};

const ProfileFormModal: React.FC<ProfileFormModalProps> = ({ profile, onSave, onClose }) => {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: emptyFormValues
  });

  // Use useEffect to reset form values when the profile changes
  useEffect(() => {
    if (profile) {
      reset({
        profileName: profile.profileName,
        dailyQuota: (parseInt(profile.dailyQuota) / (1024 * 1024 * 1024)).toString(),
        monthlyQuota: (parseInt(profile.monthlyQuota) / (1024 * 1024 * 1024)).toString(),
        price: profile.price ?? 0,
        nightStart: profile.nightStart ?? '',
        nightEnd: profile.nightEnd ?? '',
        speedDown: profile.speedDown ?? 0,
        speedUp: profile.speedUp ?? 0,
        sessionTimeout: profile.sessionTimeout ?? 0,
        idleTimeout: profile.idleTimeout ?? 0,
        maxSessions: profile.maxSessions ?? 0,
      });
    } else {
      reset(emptyFormValues);
    }
  }, [profile, reset]);

  const onSubmit = (data: ProfileFormData) => {
    // Convert quota values back to bytes before saving
    const updatedData: Profile = {
      ...(profile ?? {}),
      profileName: data.profileName,
      dailyQuota: (parseFloat(data.dailyQuota) * 1024 * 1024 * 1024).toString(),
      monthlyQuota: (parseFloat(data.monthlyQuota) * 1024 * 1024 * 1024).toString(),
      price: data.price ?? 0,
      nightStart: data.nightStart || undefined,
      nightEnd: data.nightEnd || undefined,
      speedDown: data.speedDown ?? 0,
      speedUp: data.speedUp ?? 0,
      sessionTimeout: data.sessionTimeout ?? undefined,
      idleTimeout: data.idleTimeout ?? undefined,
      maxSessions: data.maxSessions ?? undefined,
    };
    onSave(updatedData);
    onClose();
  };


  return (
    <DialogContent className="sm:max-w-[560px] max-h-[85vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{profile ? 'Edit Profile' : 'Create New Profile'}</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit(onSubmit as (data: ProfileFormData) => void)}>
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
            <Label htmlFor="price" className="text-right">
              Price (per month)
            </Label>
            <div className="col-span-3">
              <Input id="price" type="number" min={0} {...register("price", { valueAsNumber: true })} className="w-full" placeholder="0" />
              {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price.message}</p>}
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
  const { data, error, isLoading, updateProfile, createProfile, deleteProfile } = useProfiles();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | undefined>(undefined);

  const allProfiles = data?.data ?? [];
  const filteredProfiles = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return allProfiles;
    return allProfiles.filter((p) => p.profileName.toLowerCase().includes(q));
  }, [allProfiles, searchTerm]);

  const handleSaveProfile = async (profile: Profile) => {
    // Toasts are handled by the hook.
    if (profile.id) updateProfile(profile);
    else createProfile(profile);
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

  const handleDeleteProfile = (profile: Profile) => {
    if (!profile.id) return;
    const ok = window.confirm(`Delete profile "${profile.profileName}"? This cannot be undone.`);
    if (!ok) return;
    deleteProfile(profile.id);
  };

  return (
    <div className="w-full py-6 space-y-6 bg-gradient-to-br from-gray-50/50 via-blue-50/30 to-purple-50/30 min-h-screen">
      <PageHeader
        title="Network Profiles"
        subtitle="Manage and configure network access profiles"
        icon={Network}
        className="border-0 shadow-xl bg-white/80 backdrop-blur-sm"
        actions={(
          <div className="flex gap-2">
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" /> Add Profile
            </Button>
          </div>
        )}
      />

      <QueryState
        isLoading={isLoading}
        error={error}
        // only show empty state when there are truly no profiles in the system
        isEmpty={!isLoading && !error && allProfiles.length === 0}
        onRetry={() => window.location.reload()}
        loading={
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="overflow-hidden border-0 shadow-lg bg-white/70">
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
        }
        errorTitle="Error loading profiles"
        emptyTitle="No profiles yet"
        emptyDescription="Create your first profile plan."
      >
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <CardTitle>Available Profiles</CardTitle>
                <CardDescription>
                  {filteredProfiles.length} profile{filteredProfiles.length !== 1 ? 's' : ''} found
                </CardDescription>
              </div>
              <div className="w-full sm:w-64">
                <SearchBar
                  currentSearchTerm={searchTerm}
                  onSearch={(term) => setSearchTerm(term)}
                  placeholder="Search profiles..."
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
                  onDelete={() => handleDeleteProfile(profile)}
                />
              ))}
            </div>
            {filteredProfiles.length === 0 ? (
              <div className="text-center py-12">
                <div className="p-3 rounded-full bg-muted inline-block mb-4">
                  <Search className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold">No profiles found</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {searchTerm ? 'Try adjusting your search' : 'Create your first profile'}
                </p>
                {!searchTerm ? (
                  <div className="mt-4">
                    <Button onClick={() => setIsModalOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Profile
                    </Button>
                  </div>
                ) : null}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </QueryState>

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

