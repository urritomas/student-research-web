'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card, { CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import Button from '@/components/Button';
import Badge from '@/components/ui/Badge';
import Avatar from '@/components/ui/Avatar';
import { FiArrowLeft, FiClock, FiUsers, FiFileText, FiCalendar } from 'react-icons/fi';
import { useRouter, useParams } from 'next/navigation';
import StatusIcon from '@/components/StatusIcon';
import { useDashboardUser } from '@/lib/hooks/useDashboardUser';
import {
  getProject,
  getProjectMembers,
  updateProjectStatus,
  type Project,
  type ProjectMember,
} from '@/lib/api/projects';

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'archived', label: 'Archived' },
];

export default function AdviserProjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
  const { user, handleLogout } = useDashboardUser('Adviser');
  const [project, setProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [projRes, membersRes] = await Promise.all([
        getProject(projectId),
        getProjectMembers(projectId),
      ]);
      if (!cancelled) {
        if (projRes.data) setProject(projRes.data);
        if (membersRes.data) setMembers(membersRes.data);
        setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [projectId]);

  async function handleStatusChange(newStatus: string) {
    if (!project || newStatus === project.status) return;
    setUpdatingStatus(true);
    const res = await updateProjectStatus(projectId, newStatus);
    if (res.data) {
      setProject({ ...project, status: res.data.status });
    }
    setUpdatingStatus(false);
  }

  function goToScheduleDefense() {
    if (!project) return;
    // Store members for the defense scheduling page
    localStorage.setItem('projectMembers', JSON.stringify(members));
    router.push(
      `/defenses?project_id=${project.id}&project_code=${project.project_code}&title=${encodeURIComponent(project.title)}`
    );
  }

  if (loading) {
    return (
      <DashboardLayout role="adviser" user={user} onLogout={handleLogout}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500" />
        </div>
      </DashboardLayout>
    );
  }

  if (!project) {
    return (
      <DashboardLayout role="adviser" user={user} onLogout={handleLogout}>
        <div className="text-center py-16 text-neutral-500">Project not found</div>
      </DashboardLayout>
    );
  }

  const leader = members.find((m) => m.role === 'leader');
  const otherMembers = members.filter((m) => m.role !== 'leader' && m.role !== 'adviser');

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
          <div className="flex items-center gap-3">
            <StatusIcon status={project.status} />
            <Button variant="primary" onClick={goToScheduleDefense}>
              <FiCalendar className="mr-2" /> Schedule Defense
            </Button>
          </div>
        </div>

        {/* Project Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Abstract</CardTitle>
              </CardHeader>
              <p className="mt-4 text-neutral-700">
                {project.abstract || project.description || 'No description provided'}
              </p>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FiUsers /> Team Members
                </CardTitle>
              </CardHeader>
              <div className="mt-4 space-y-4">
                {leader && (
                  <div className="flex items-center justify-between p-3 bg-primary-50 rounded-lg border-2 border-primary-200">
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={leader.users?.avatar_url || undefined}
                        name={leader.users?.full_name || 'Unknown'}
                        size="md"
                      />
                      <div>
                        <p className="font-semibold text-primary-900">{leader.users?.full_name || 'Unknown'}</p>
                        <p className="text-sm text-primary-700">{leader.users?.email}</p>
                      </div>
                    </div>
                    <Badge variant="primary">Leader</Badge>
                  </div>
                )}

                {otherMembers.length > 0 ? (
                  otherMembers.map((member) => (
                    <div
                      key={member.id}
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
                  <p className="text-sm font-medium text-neutral-700 mb-1">Project Status</p>
                  <select
                    value={project.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    disabled={updatingStatus}
                    className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  {updatingStatus && (
                    <p className="text-xs text-neutral-500 mt-1">Updating...</p>
                  )}
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
