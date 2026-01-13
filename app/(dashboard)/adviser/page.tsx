'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card, { CardTitle, CardDescription } from '@/components/ui/Card';
import JoinGroupCard from '@/components/ui/JoinGroupCard';
import { FiUsers, FiFolder, FiCalendar, FiTrendingUp } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

interface UserProfile {
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
}

export default function AdviserDashboardPage() {
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
          role: 'Adviser',
        });
      } else {
        setUser({
          name: profile.full_name || authUser.email || 'User',
          email: profile.email || authUser.email || '',
          role: 'Adviser',
          avatarUrl: profile.avatar_url || undefined,
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setUser({ name: 'User', email: '', role: 'Adviser' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (isLoading || !user) {
    return (
      <DashboardLayout role="adviser" user={{ name: 'Loading...', email: '', role: 'Adviser' }} onLogout={handleLogout}>
        <div className="flex items-center justify-center h-64">
          <p>Loading...</p>
        </div>
      </DashboardLayout>
    );
  }

  const stats = [
    { icon: <FiUsers />, label: 'Total Advisees', value: '24', color: 'bg-accent-100 text-accent-600' },
    { icon: <FiFolder />, label: 'Active Projects', value: '12', color: 'bg-success-100 text-success-600' },
    { icon: <FiCalendar />, label: 'Upcoming Defenses', value: '3', color: 'bg-warning-100 text-warning-600' },
    { icon: <FiTrendingUp />, label: 'Completed Projects', value: '18', color: 'bg-primary-100 text-primary-600' },
  ];

  return (
    <DashboardLayout role="adviser" user={{ ...user, avatar: user.avatarUrl }} onLogout={handleLogout}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-primary-700">Welcome back, {user.name}!</h1>
          <p className="text-neutral-600 mt-1">Here's an overview of your advisees and projects</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, idx) => (
            <Card key={idx} padding="md">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${stat.color}`}>
                  <div className="text-2xl">{stat.icon}</div>
                </div>
                <div>
                  <p className="text-sm text-neutral-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-primary-700">{stat.value}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Join a Group Section */}
          <JoinGroupCard />

          <Card>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates from your advisees</CardDescription>
            <div className="mt-4 space-y-3">
              <p className="text-sm text-neutral-600">No recent activity</p>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardTitle>Pending Reviews</CardTitle>
            <CardDescription>Documents awaiting your feedback</CardDescription>
            <div className="mt-4 space-y-3">
              <p className="text-sm text-neutral-600">No pending reviews</p>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}