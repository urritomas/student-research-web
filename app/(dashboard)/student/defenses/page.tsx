'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { FiCalendar, FiClock, FiMapPin } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import EmptyState from '@/components/layout/EmptyState';

interface UserProfile {
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

export default function StudentDefensesPage() {
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

  // Mock defense schedules
  const defenses = [
    {
      id: 1,
      projectTitle: 'AI-Powered Academic Writing Assistant',
      type: 'Proposal Defense',
      date: 'January 15, 2026',
      time: '2:00 PM - 4:00 PM',
      location: 'Room 305, Engineering Building',
      panel: ['Dr. Jane Smith', 'Prof. Robert Johnson', 'Dr. Maria Garcia'],
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
          <h1 className="text-3xl font-bold text-primary-700">Defense Schedule</h1>
          <p className="text-neutral-600 mt-1">Your upcoming defense schedules</p>
        </div>

        {defenses.length > 0 ? (
          <div className="space-y-4">
            {defenses.map((defense) => (
              <Card key={defense.id}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-xl text-primary-700">
                      {defense.projectTitle}
                    </h3>
                    <Badge variant="warning" className="mt-2">{defense.type}</Badge>
                  </div>
                </div>
                
                <div className="space-y-3 text-neutral-700">
                  <div className="flex items-center gap-3">
                    <FiCalendar className="text-accent-500 flex-shrink-0" />
                    <span>{defense.date}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <FiClock className="text-accent-500 flex-shrink-0" />
                    <span>{defense.time}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <FiMapPin className="text-accent-500 flex-shrink-0" />
                    <span>{defense.location}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-neutral-200">
                  <p className="text-sm font-medium text-neutral-700 mb-2">Panel Members:</p>
                  <div className="flex flex-wrap gap-2">
                    {defense.panel.map((member, idx) => (
                      <Badge key={idx} variant="default">{member}</Badge>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <EmptyState
              icon={<FiCalendar />}
              title="No upcoming defenses"
              description="You don't have any scheduled defenses at the moment."
            />
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
