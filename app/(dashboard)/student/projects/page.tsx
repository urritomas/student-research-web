'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card, { CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import EmptyState from '@/components/layout/EmptyState';
import StatusIcon from '@/components/StatusIcon';
import Button from '@/components/Button';
import { FiFolder, FiPlus, FiClock } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

interface UserProfile {
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

export default function StudentProjectsPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
        // Fallback to auth user data if profile fetch fails
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
      // Fallback user data
      setUser({
        name: 'User',
        email: '',
        role: 'Student',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  // Mock projects data - replace with actual data from database
  const projects = [
    {
      id: 1,
      title: 'AI-Powered Academic Writing Assistant',
      status: 'In Progress',
      adviser: 'Dr. Jane Smith',
      lastUpdated: '2 hours ago',
      members: 3,
    },
    {
      id: 2,
      title: 'Blockchain-based Student Records System',
      status: 'Approved',
      adviser: 'Prof. Robert Johnson',
      lastUpdated: '1 day ago',
      members: 4,
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
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary-700">My Projects</h1>
            <p className="text-neutral-600 mt-1">Manage your research projects</p>
          </div>
          <Button
            variant="primary"
            leftIcon={<FiPlus />}
            onClick={() => router.push('/student/projects/create')}
          >
            New Project
          </Button>
        </div>

        {/* Projects Grid */}
        {projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Card 
                key={project.id} 
                hover 
                onClick={() => router.push(`/student/projects/${project.id}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <FiFolder className="text-2xl text-primary-500" />
                    <StatusIcon status={project.status} />
                  </div>
                </CardHeader>
                <CardTitle>{project.title}</CardTitle>
                <CardDescription>Adviser: {project.adviser}</CardDescription>
                <div className="mt-4 flex items-center justify-between text-sm text-neutral-600">
                  <div className="flex items-center gap-1">
                    <FiClock className="text-neutral-500" />
                    {project.lastUpdated}
                  </div>
                  <div>{project.members} members</div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <EmptyState
              icon={<FiFolder />}
              title="No projects yet"
              description="Get started by creating your first research project or wait for an adviser invitation."
              action={{
                label: 'Create Project',
                onClick: () => router.push('/student/projects/create'),
              }}
            />
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
