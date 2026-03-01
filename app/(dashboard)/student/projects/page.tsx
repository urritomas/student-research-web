'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card, { CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import EmptyState from '@/components/layout/EmptyState';
import StatusIcon from '@/components/StatusIcon';
import Button from '@/components/Button';
import { FiFolder, FiPlus, FiClock } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import { useDashboardUser } from '@/lib/hooks/useDashboardUser';
import { getMyProjects, type Project } from '@/lib/api/projects';

export default function StudentProjectsPage() {
  const router = useRouter();
  const { user, isLoading: profileLoading, handleLogout } = useDashboardUser('Student');
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const res = await getMyProjects();
      if (!cancelled) {
        setProjects(
          (res.data || []).sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )
        );
        setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const isLoading = profileLoading || loading;

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
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-neutral-500">Loading projects...</p>
          </div>
        ) : projects.length > 0 ? (
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
                <CardDescription>
                  {project.description || 'No description'}
                </CardDescription>
                <div className="mt-4 space-y-2 text-sm text-neutral-600">
                  <div>Type: {project.project_type}</div>
                  <div>Standard: {project.paper_standard}</div>
                  <div className="flex items-center gap-1">
                    <FiClock className="text-neutral-500" />
                    {new Date(project.created_at).toLocaleDateString()}
                  </div>
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
