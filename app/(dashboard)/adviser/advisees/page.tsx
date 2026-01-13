'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card, { CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import EmptyState from '@/components/layout/EmptyState';
import StatusIcon from '@/components/StatusIcon';
import Button from '@/components/Button';
import { FiFolder, FiPlus } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

interface UserProfile {
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

export default function AdviserAdviseesPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [projects, setProjects] = useState<any[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);

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
          avatar: profile.avatar_url || undefined,
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setUser({
        name: 'User',
        email: '',
        role: 'Adviser',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user]);

  const fetchProjects = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      // Fetch projects where adviser is a member
      const { data: memberProjects, error: memberError } = await supabase
        .from('project_members')
        .select(`
          project_id,
          role,
          status,
          projects (*)
        `)
        .eq('user_id', authUser.id)
        .eq('status', 'accepted')
        .eq('role', 'adviser');

      if (memberError) {
        console.error('Error fetching projects:', memberError);
      }

      // Extract and sort projects
      const allProjects = memberProjects?.map((m: any) => m.projects).filter(Boolean) || [];
      
      allProjects.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setProjects(allProjects);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setProjectsLoading(false);
    }
  };

  if (isLoading || projectsLoading) {
    return (
      <DashboardLayout role="adviser" user={{ name: 'Loading...', email: '', role: 'Adviser' }} onLogout={handleLogout}>
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
    <DashboardLayout role="adviser" user={user} onLogout={handleLogout}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary-700">My Advisees</h1>
            <p className="text-neutral-600 mt-1">Projects you are advising</p>
          </div>
        </div>

        {projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Card 
                key={project.id} 
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push(`/adviser/advisees/${project.id}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                      <FiFolder className="text-2xl text-primary-600" />
                    </div>
                    <StatusIcon status={project.status} />
                  </div>
                  <CardTitle className="line-clamp-1">{project.title}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {project.description || 'No description available'}
                  </CardDescription>
                </CardHeader>
                <div className="mt-4 flex items-center justify-between text-sm text-neutral-600">
                  <span className="capitalize">{project.project_type}</span>
                  <span>{new Date(project.created_at).toLocaleDateString()}</span>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<FiFolder className="text-6xl" />}
            title="No Projects Yet"
            description="You haven't joined any projects as an adviser yet. Use a project code to join a project."
          />
        )}
      </div>
    </DashboardLayout>
  );
}
