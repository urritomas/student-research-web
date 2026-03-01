'use client';

import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card, { CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import Button from '@/components/Button';
import Badge from '@/components/ui/Badge';
import Avatar from '@/components/ui/Avatar';
import { FiArrowLeft, FiClock, FiUsers, FiFileText } from 'react-icons/fi';
import { useRouter, useParams } from 'next/navigation';
import StatusIcon from '@/components/StatusIcon';
import { useDashboardUser } from '@/lib/hooks/useDashboardUser';
import { MOCK_ADVISED_PROJECTS, MOCK_PROJECT_MEMBERS } from '@/lib/mock-data';

export default function AdviserProjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
  const { user, handleLogout } = useDashboardUser('Adviser');

  const project = MOCK_ADVISED_PROJECTS.find(p => p.id === projectId) || MOCK_ADVISED_PROJECTS[0];

  const projectOwner = {
    name: 'Maria Santos',
    email: 'maria.santos@university.edu',
    role: 'Owner',
    avatar: undefined as string | undefined,
  };

  const members = MOCK_PROJECT_MEMBERS;

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
