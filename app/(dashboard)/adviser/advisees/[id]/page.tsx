'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card, { CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import Button from '@/components/Button';
import Badge from '@/components/ui/Badge';
import Avatar from '@/components/ui/Avatar';
import { FiArrowLeft, FiClock, FiUsers, FiFileText } from 'react-icons/fi';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import StatusIcon from '@/components/StatusIcon';

interface UserProfile {
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

interface ProjectMember {
  user_id: string;
  role: string;
  status: string;
  users: {
    full_name: string;
    email: string;
    avatar_url?: string;
  } | null;
}

interface Project {
  id: string;
  title: string;
  description: string;
  project_type: string;
  status: string;
  project_code: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export default function AdviserProjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
  
  const [user, setUser] = useState<UserProfile | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [projectOwner, setProjectOwner] = useState<UserProfile | null>(null);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  useEffect(() => {
    if (user && projectId) {
      fetchProjectDetails();
    }
  }, [user, projectId]);

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
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProjectDetails = async () => {
    try {
      // Fetch project details
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (projectError) {
        console.error('Error fetching project:', projectError);
        router.push('/adviser/advisees');
        return;
      }

      setProject(projectData);

      // Fetch project owner
      const { data: ownerData, error: ownerError } = await supabase
        .from('users')
        .select('full_name, email, avatar_url')
        .eq('id', projectData.created_by)
        .single();

      if (!ownerError && ownerData) {
        setProjectOwner({
          name: ownerData.full_name || ownerData.email,
          email: ownerData.email,
          role: 'Owner',
          avatar: ownerData.avatar_url || undefined,
        });
      }

      // Fetch project members
      const { data: membersData, error: membersError } = await supabase
        .from('project_members')
        .select(`
          user_id,
          role,
          status,
          users!inner (
            full_name,
            email,
            avatar_url
          )
        `)
        .eq('project_id', projectId)
        .eq('status', 'accepted');

      if (!membersError && membersData) {
        setMembers(membersData as any as ProjectMember[]);
      }
    } catch (error) {
      console.error('Error loading project details:', error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (isLoading) {
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

  if (!user || !project) {
    return null;
  }

  return (
    <DashboardLayout role="adviser" user={user} onLogout={handleLogout}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => router.push('/adviser/advisees')}
              className="flex items-center gap-2"
            >
              <FiArrowLeft /> Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-primary-700">{project.title}</h1>
              <p className="text-neutral-600 mt-1">Project Details</p>
            </div>
          </div>
          <StatusIcon status={project.status} />
        </div>

        {/* Project Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <p className="mt-4 text-neutral-700">
                {project.description || 'No description provided'}
              </p>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FiUsers /> Team Members
                </CardTitle>
              </CardHeader>
              <div className="mt-4 space-y-4">
                  {/* Project Owner */}
                  {projectOwner && (
                    <div className="flex items-center justify-between p-3 bg-primary-50 rounded-lg border-2 border-primary-200">
                      <div className="flex items-center gap-3">
                        <Avatar 
                          src={projectOwner.avatar} 
                          name={projectOwner.name} 
                          size="md"
                        />
                        <div>
                          <p className="font-semibold text-primary-900">{projectOwner.name}</p>
                          <p className="text-sm text-primary-700">{projectOwner.email}</p>
                        </div>
                      </div>
                      <Badge variant="default">Owner</Badge>
                    </div>
                  )}

                  {/* Other Members */}
                  {members.length > 0 ? (
                    members.map((member) => (
                      <div 
                        key={member.user_id} 
                        className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar 
                            src={member.users?.avatar_url || undefined} 
                            name={member.users?.full_name || member.users?.email || 'Unknown'} 
                            size="md"
                          />
                          <div>
                            <p className="font-medium text-neutral-900">
                              {member.users?.full_name || member.users?.email || 'Unknown'}
                            </p>
                            <p className="text-sm text-neutral-600">{member.users?.email}</p>
                          </div>
                        </div>
                        <Badge variant="default" className="capitalize">
                          {member.role}
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <p className="text-neutral-600 text-center py-4">
                      No other members yet
                    </p>
                  )}
                </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FiFileText /> Project Details
                </CardTitle>
              </CardHeader>
              <div className="mt-4 space-y-3">
                <div>
                  <p className="text-sm text-neutral-600">Project Code</p>
                  <p className="font-mono font-semibold text-primary-700">{project.project_code}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-600">Type</p>
                  <p className="font-medium capitalize">{project.project_type}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-600">Status</p>
                  <p className="font-medium capitalize">{project.status}</p>
                </div>
              </div>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FiClock /> Timeline
                </CardTitle>
              </CardHeader>
              <div className="mt-4 space-y-3">
                <div>
                  <p className="text-sm text-neutral-600">Created</p>
                  <p className="font-medium">
                    {new Date(project.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-neutral-600">Last Updated</p>
                  <p className="font-medium">
                    {new Date(project.updated_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
