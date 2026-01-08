'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/Button';
import { FiMail, FiCheck, FiX } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import EmptyState from '@/components/layout/EmptyState';

interface UserProfile {
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

export default function StudentInvitationsPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !authUser) {
        router.push('/login');
        return;
      }

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
          avatar: profile.avatar_url || undefined,
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setUser({ name: 'User', email: '', role: 'Student' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  // Mock invitations - replace with actual data
  const invitations = [
    {
      id: 1,
      type: 'collaborator',
      projectTitle: 'Machine Learning for Climate Prediction',
      from: 'Dr. Sarah Martinez',
      date: '2 days ago',
      status: 'pending',
    },
    {
      id: 2,
      type: 'adviser',
      projectTitle: 'Blockchain in Healthcare',
      from: 'Prof. Michael Chen',
      date: '1 week ago',
      status: 'pending',
    },
  ];

  if (isLoading) {
    return (
      <DashboardLayout role="student" user={{ name: 'Loading...', email: '', role: 'Student' }} onLogout={handleLogout}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-4">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary-500 border-r-transparent"></div>
            <p className="text-neutral-600">Loading...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <DashboardLayout role="student" user={user} onLogout={handleLogout}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-primary-700">Invitations</h1>
          <p className="text-neutral-600 mt-1">Manage your project invitations</p>
        </div>

        {invitations.length > 0 ? (
          <div className="space-y-4">
            {invitations.map((invitation) => (
              <Card key={invitation.id}>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-accent-100 rounded-lg flex items-center justify-center">
                    <FiMail className="text-2xl text-accent-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-lg text-primary-700">
                          {invitation.projectTitle}
                        </h3>
                        <p className="text-sm text-neutral-600">
                          Invited by {invitation.from} • {invitation.date}
                        </p>
                      </div>
                      <Badge variant="pending">{invitation.type}</Badge>
                    </div>
                    <div className="flex gap-3 mt-4">
                      <Button variant="success" size="sm" leftIcon={<FiCheck />}>
                        Accept
                      </Button>
                      <Button variant="outline" size="sm" leftIcon={<FiX />}>
                        Decline
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <EmptyState
              icon={<FiMail />}
              title="No invitations"
              description="You don't have any pending invitations at the moment."
            />
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
