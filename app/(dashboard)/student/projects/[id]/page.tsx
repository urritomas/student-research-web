'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card, { CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/Button';
import { FiFolder, FiUsers, FiCalendar, FiFileText, FiCopy, FiCheck } from 'react-icons/fi';
import { supabase } from '@/lib/supabaseClient';

interface UserProfile {
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

interface Project {
  id: string;
  project_code: string;
  title: string;
  description: string;
  project_type: string;
  status: string;
  document_reference?: string;
  created_at: string;
  created_by: string;
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [codeCopied, setCodeCopied] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Get authenticated user
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !authUser) {
        router.push('/login');
        return;
      }

      // Fetch user profile
      const { data: profile } = await supabase
        .from('users')
        .select('full_name, email, avatar_url')
        .eq('id', authUser.id)
        .single();

      setUser({
        name: profile?.full_name || authUser.email || 'User',
        email: profile?.email || authUser.email || '',
        role: 'Student',
        avatar: profile?.avatar_url || undefined,
      });

      // Fetch project details
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', params.id)
        .single();

      if (projectError) {
        console.error('Error fetching project:', projectError);
        router.push('/student/projects');
        return;
      }

      setProject(projectData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const copyProjectCode = () => {
    if (project?.project_code) {
      navigator.clipboard.writeText(project.project_code);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  if (isLoading) {
    return (
      <DashboardLayout role="student" user={{ name: 'Loading...', email: '', role: 'Student' }} onLogout={handleLogout}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-4">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary-500 border-r-transparent"></div>
            <p className="text-neutral-600">Loading project...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!user || !project) {
    return null;
  }

  return (
    <DashboardLayout role="student" user={user} onLogout={handleLogout}>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-primary-700">{project.title}</h1>
              <Badge variant={project.status === 'proposal' ? 'warning' : 'primary'}>
                {project.status}
              </Badge>
            </div>
            <p className="text-neutral-600">{project.description}</p>
          </div>
          <Button
            variant="outline"
            onClick={() => router.push('/student/projects')}
          >
            Back to Projects
          </Button>
        </div>

        {/* Project Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Project Code */}
          <Card>
            <CardHeader>
              <FiFolder className="text-2xl text-primary-500 mb-2" />
              <CardTitle>Project Code</CardTitle>
              <CardDescription>Use this code to invite team members</CardDescription>
            </CardHeader>
            <div className="mt-4">
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-neutral-100 px-3 py-2 rounded font-mono text-sm">
                  {project.project_code}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyProjectCode}
                >
                  {codeCopied ? <FiCheck className="text-success-600" /> : <FiCopy />}
                </Button>
              </div>
            </div>
          </Card>

          {/* Project Type */}
          <Card>
            <CardHeader>
              <FiFileText className="text-2xl text-accent-500 mb-2" />
              <CardTitle>Project Type</CardTitle>
            </CardHeader>
            <p className="mt-4 text-neutral-700 capitalize">{project.project_type}</p>
          </Card>

          {/* Created Date */}
          <Card>
            <CardHeader>
              <FiCalendar className="text-2xl text-success-500 mb-2" />
              <CardTitle>Created</CardTitle>
            </CardHeader>
            <p className="mt-4 text-neutral-700">{formatDate(project.created_at)}</p>
          </Card>
        </div>

        {/* Document Reference */}
        {project.document_reference && (
          <Card>
            <CardHeader>
              <CardTitle>Attached Document</CardTitle>
            </CardHeader>
            <div className="mt-4">
              <a
                href={project.document_reference}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 hover:text-primary-700 underline flex items-center gap-2"
              >
                <FiFileText />
                View Document
              </a>
            </div>
          </Card>
        )}

        {/* Team Members Section (Placeholder) */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Team Members</CardTitle>
                <CardDescription>Collaborate with your team</CardDescription>
              </div>
              <Button variant="primary" size="sm">
                <FiUsers className="mr-2" />
                Invite Members
              </Button>
            </div>
          </CardHeader>
          <div className="mt-4">
            <p className="text-neutral-500 text-sm">
              Share your project code with team members to invite them to collaborate.
            </p>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
