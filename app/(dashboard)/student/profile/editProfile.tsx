'use client';

import React from 'react';
import Button from '@/components/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { ModalFooter } from '@/components/ui/Modal';
import Avatar from '@/components/ui/Avatar';
import { FiCircle } from 'react-icons/fi';
import { MdSchedule } from 'react-icons/md';
import { AiOutlinePause } from 'react-icons/ai';

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
  const statusOptions = [
    { value: 'online', label: '🟢 Online' },
    { value: 'idle', label: '🟡 Idle' },
    { value: 'busy', label: '🔴 Busy' },
  ];

  return (
    <div className="space-y-5">
      {/* Avatar Section */}
      <div className="flex flex-col items-center gap-3 pb-4 border-b border-neutral-200">
        <Avatar src={user.avatarUrl} name={user.name} size="lg" />
        <Button variant="secondary" size="sm">
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
            placeholder={user.name}
            defaultValue={user.name}
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
            />
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex justify-end gap-2 pt-4 border-t border-neutral-200">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="error">
          Update Profile
        </Button>
      </div>
    </div>
  );
}
