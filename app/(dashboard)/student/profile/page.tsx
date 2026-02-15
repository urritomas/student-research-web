'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, Avatar, Modal } from '@/components/ui';
import Button from '@/components/Button';
import EditProfile from './editProfile';
import { MOCK_STUDENT } from '@/lib/mock-data';

export default function StudentProfilePage() {
  const router = useRouter();
  const [isEditOpen, setIsEditOpen] = useState(false);

  const user = {
    name: MOCK_STUDENT.full_name,
    email: MOCK_STUDENT.email,
    role: 'Student',
    avatarUrl: MOCK_STUDENT.avatar_url,
  };

  const handleLogout = () => {
    router.push('/login');
  };

  return (
    <DashboardLayout role="student" user={{ ...user, avatar: user.avatarUrl }} onLogout={handleLogout}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-primary-700">Profile</h1>
          <div className="flex items-center gap-4 mt-2">
            <p className="text-neutral-600">Manage your account information</p>
          </div>
        </div>

        <Card>
          <div className="flex items-start gap-6">
            <Avatar 
              src={user.avatarUrl} 
              name={user.name} 
              size="xl" 
            />
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-primary-700">{user.name}</h2>
              <p className="text-neutral-600">{user.email}</p>
              <p className="text-sm text-neutral-500 mt-1">{user.role}</p>
            </div>
          </div>
          <div className="mt-6">
            <Button size="sm" variant="error" onClick={() => setIsEditOpen(true)}>
              Edit Profile
            </Button>
          </div>
        </Card>
      </div>

      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Profile" size="md">
        <EditProfile
          user={user}
          onClose={() => setIsEditOpen(false)}
        />
      </Modal>
    </DashboardLayout>
  );
}
