'use client';

import React, { useState } from 'react';
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const statusOptions = [
    { value: 'online', label: '🟢 Online' },
    { value: 'idle', label: '🟡 Idle' },
    { value: 'busy', label: '🔴 Busy' },
  ];

  // Handle updating the username
const handleUpdate = async () => {
  setLoading(true);
  setError(null);

  try {
    // Get the logged-in user's UUID
    const { data: { user }, error } = await supabase.auth.getUser();
    if (!user) throw new Error('No user logged in');

    const result = await updateUserProfile(user.id, { full_name: name });
    console.log('Profile updated:', result);
    onClose();
  } catch (err: any) {
    console.error('Profile update error (catch):', err);
    setError(err.message || 'Failed to update profile');
  } finally {
    setLoading(false);
  }
};


  // Optional: allow pressing Enter to submit
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleUpdate();
    }
  };

  return (
    <div className="space-y-5">
      {/* Avatar Section */}
      <div className="flex flex-col items-center gap-3 pb-4 border-b border-neutral-200">
        <Avatar src={user.avatarUrl} name={user.name} size="lg" />
        <Button variant="secondary" size="sm" disabled>
          Change Avatar
        </Button>
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
