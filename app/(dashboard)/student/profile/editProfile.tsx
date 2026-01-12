'use client';

import React from 'react';
import Button from '@/components/Button';
import Input from '@/components/ui/Input';
import { ModalFooter } from '@/components/ui/Modal';
import Avatar from '@/components/ui/Avatar';

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

  return (
    <div className="space-y-6">
      {/* Avatar Section */}
      <div className="flex flex-col items-center gap-4">
        <Avatar src={user.avatarUrl} name={user.name} size="xl" />
        <Button variant="error" size="sm">
          Change Profile
        </Button>
      </div>

      {/* Form Fields */}
      <div className="space-y-4">
        {/* Username */}
        <div>
          <label className="block text-sm font-semibold text-neutral-900 mb-2">
            Username
          </label>
          <Input
            type="text"
            placeholder={user.name}
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-semibold text-neutral-900 mb-2">
            Email
          </label>
          <Input
            type="email"
            placeholder=""
            value={user.email}
            readOnly
          />
        </div>

        {/* Role and Status */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-neutral-900 mb-2">
              Role
            </label>
            <Input
              type="text"
              placeholder=""
              value={user.role}
              readOnly
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-neutral-900 mb-2">
              Status
            </label>
            <Input
              type="text"
              placeholder="Enter status"
            />
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <ModalFooter className="flex justify-between">
        <Button variant="outline">
          Delete Account
        </Button>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="error">
            Update
          </Button>
        </div>
      </ModalFooter>
    </div>
  );
}
