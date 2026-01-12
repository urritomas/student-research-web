'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, Avatar, Modal } from '@/components/ui';
import Button from '@/components/Button';
import EditProfile from './editProfile';
import { supabase } from '@/lib/supabaseClient';

interface UserProfile {
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
}

export default function StudentProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      // Get current authenticated user
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !authUser) {
        router.push('/login');
        return;
      }

      // Fetch user profile from database
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('full_name, email, avatar_url')
        .eq('id', authUser.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        setUser({
          name: authUser.email || 'User',
          email: authUser.email || '',
          role: 'Student',
        });
      } else {
        setUser({
          name: profile.full_name || authUser.email || 'User',
          email: profile.email || authUser.email || '',
          role: 'Student',
          avatarUrl: profile.avatar_url || undefined,
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (isLoading) {
    return (
      <DashboardLayout role="student" user={{ name: 'Loading...', email: '', role: 'Student' }} onLogout={handleLogout}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-4">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary-500 border-r-transparent"></div>
            <p className="text-neutral-600">Loading profile...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!user) {
    return null;
  }

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
        {user && (
          <EditProfile
            user={user}
            onClose={() => setIsEditOpen(false)}
          />
        )}
      </Modal>
    </DashboardLayout>
  );
}
