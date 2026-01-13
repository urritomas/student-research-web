'use client';

import React, { useState, useRef } from 'react';
import Button from '@/components/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Avatar from '@/components/ui/Avatar';
import { updateUserProfile } from '@/lib/completeProfile';
import { supabase } from '@/lib/supabaseClient';

interface UserProfile {
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
}

interface EditProfileProps {
  user: UserProfile;
  onClose: () => void;
}

export default function EditProfile({ user, onClose }: EditProfileProps) {
  const [name, setName] = useState(user.name);
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const statusOptions = [
    { value: 'online', label: '🟢 Online' },
    { value: 'idle', label: '🟡 Idle' },
    { value: 'busy', label: '🔴 Busy' },
  ];

  // Handle username update
  const handleUpdate = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (!user) throw new Error('No user logged in');

      // Update both username and avatar URL
      const result = await updateUserProfile(user.id, { 
        full_name: name,
        ...(avatarUrl ? { avatar_url: avatarUrl } : {})
      });

      console.log('Profile updated:', result);
      onClose();
    } catch (err: any) {
      console.error('Profile update error:', err);
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  // Handle Enter key for username input
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleUpdate();
  };

  // Handle avatar file selection and upload
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (!user) throw new Error('No user logged in');
      if (userError) throw userError;

      
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      
      const { error: uploadError } = await supabase.storage
        .from('Profile_pictures')
        .upload(filePath, file, { upsert: true, cacheControl: '3600' });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('Profile_pictures').getPublicUrl(filePath);
      if (!data?.publicUrl) throw new Error('Failed to get public URL');

      setAvatarUrl(data.publicUrl);
    } catch (err: any) {
      console.error('Avatar upload error:', err);
      setError(err.message || 'Failed to upload avatar');
    } finally {
      setLoading(false);
    }
  };

  
  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-5">
      {/* Avatar Section */}
      <div className="flex flex-col items-center gap-3 pb-4 border-b border-neutral-200">
        <Avatar src={avatarUrl} name={name} size="lg" />
        <Button variant="secondary" size="sm" onClick={openFilePicker}>
          Change Avatar
        </Button>
        <input
          type="file"
          accept="image/*"
          className="hidden"
          ref={fileInputRef}
          onChange={handleAvatarChange}
        />
      </div>

      {/* Form Fields */}
      <div className="space-y-3">
        {/* Username */}
        <div>
          <label className="block text-sm font-semibold text-neutral-900 mb-1.5">
            Username
          </label>
          <Input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter your name"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-semibold text-neutral-900 mb-1.5">
            Email
          </label>
          <div className="px-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-sm text-neutral-700">
            {user.email}
          </div>
        </div>

        {/* Role and Status */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-neutral-900 mb-1.5">
              Role
            </label>
            <div className="px-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-sm text-neutral-700">
              {user.role}
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-neutral-900 mb-1.5">
              Status
            </label>
            <Select
              options={statusOptions}
              placeholder="Select status"
              defaultValue="online"
              disabled
            />
          </div>
        </div>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      {/* Footer Actions */}
      <div className="flex justify-end gap-2 pt-4 border-t border-neutral-200">
        <Button variant="outline" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button variant="error" onClick={handleUpdate} disabled={loading}>
          {loading ? 'Updating...' : 'Update Profile'}
        </Button>
      </div>
    </div>
  );
}
