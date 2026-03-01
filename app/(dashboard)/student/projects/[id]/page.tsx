'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card, { CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/Button';
import Avatar from '@/components/ui/Avatar';
import { FiFolder, FiUsers, FiCalendar, FiFileText, FiCopy, FiCheck, FiMail } from 'react-icons/fi';
import { useDashboardUser } from '@/lib/hooks/useDashboardUser';
import {
  getProject,
  getProjectMembers,
  getProjectInvitations,
  inviteToProject,
  type Project,
  type ProjectMember,
} from '@/lib/api/projects';
import UserSearchModal from '@/components/UserSearchModal';
import type { SearchUserResult } from '@/lib/api/users';

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [codeCopied, setCodeCopied] = useState(false);
  const { user, handleLogout } = useDashboardUser('Student');

  const [project, setProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [pendingInvites, setPendingInvites] = useState<ProjectMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);

  const loadMembers = async () => {
    if (!params.id) return;
    const [membersRes, invitesRes] = await Promise.all([
      getProjectMembers(params.id as string),
      getProjectInvitations(params.id as string),
    ]);
    setMembers(membersRes.data || []);
    setPendingInvites(invitesRes.data || []);
  };

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!params.id) return;
      setLoading(true);
      const [projRes, membersRes, invitesRes] = await Promise.all([
        getProject(params.id as string),
        getProjectMembers(params.id as string),
        getProjectInvitations(params.id as string),
      ]);
      if (!cancelled) {
        setProject(projRes.data || null);
        setMembers(membersRes.data || []);
        setPendingInvites(invitesRes.data || []);
        setLoading(false);
      }
    }
    load();
    const interval = setInterval(loadMembers, 10000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [params.id]);

  const copyProjectCode = () => {
    if (project?.project_code) {
      navigator.clipboard.writeText(project.project_code);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    }
  };

  const existingUserIds = [
    ...members.map((m) => m.user_id),
    ...pendingInvites.map((m) => m.user_id),
  ];

  const handleInviteSelect = async (selectedUser: SearchUserResult) => {
    if (!params.id) return;
    setInviteError(null);
    setInviteSuccess(null);

    const role = selectedUser.role === 'adviser' ? 'adviser' : 'member';
    const res = await inviteToProject(params.id as string, {
      userId: selectedUser.id,
      role,
    });

    if (res.error) {
      setInviteError(res.error);
      setTimeout(() => setInviteError(null), 4000);
    } else {
      setInviteSuccess(`Invitation sent to ${selectedUser.full_name}`);
      setTimeout(() => setInviteSuccess(null), 4000);
      loadMembers();
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

  if (loading || !project) {
    return (
      <DashboardLayout role="student" user={user} onLogout={handleLogout}>
        <div className="flex items-center justify-center h-64">
          <p className="text-neutral-500">{loading ? 'Loading project...' : 'Project not found'}</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="student" user={user} onLogout={handleLogout}>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-primary-700">{project.title}</h1>
              <Badge variant={project.status === 'draft' ? 'warning' : 'primary'}>
                {project.status}
              </Badge>
            </div>
            <p className="text-neutral-600">{project.description || project.abstract}</p>
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
                <code className="flex-1 bg-neutral-100 px-3 py-2 rounded font-mono text-sm break-all">
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

          {/* Project Type & Standard */}
          <Card>
            <CardHeader>
              <FiFileText className="text-2xl text-accent-500 mb-2" />
              <CardTitle>Project Details</CardTitle>
            </CardHeader>
            <div className="mt-4 space-y-2 text-neutral-700">
              <p><span className="font-medium">Type:</span> <span className="capitalize">{project.project_type}</span></p>
              <p><span className="font-medium">Standard:</span> <span className="uppercase">{project.paper_standard}</span></p>
              {project.program && <p><span className="font-medium">Program:</span> {project.program}</p>}
              {project.course && <p><span className="font-medium">Course:</span> {project.course}</p>}
              {project.section && <p><span className="font-medium">Section:</span> {project.section}</p>}
            </div>
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

        {/* Keywords */}
        {project.keywords && project.keywords.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Keywords</CardTitle>
            </CardHeader>
            <div className="mt-4 flex flex-wrap gap-2">
              {project.keywords.map((keyword, idx) => (
                <Badge key={idx} variant="default">{keyword}</Badge>
              ))}
            </div>
          </Card>
        )}

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

        {/* Team Members Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Team Members</CardTitle>
                <CardDescription>
                  {members.length} {members.length === 1 ? 'member' : 'members'}
                  {pendingInvites.length > 0 && ` · ${pendingInvites.length} pending`}
                </CardDescription>
              </div>
              <Button variant="primary" size="sm" onClick={() => setInviteOpen(true)}>
                <FiUsers className="mr-2" />
                Invite Members
              </Button>
            </div>
          </CardHeader>

          {(inviteSuccess || inviteError) && (
            <div className={`mx-4 mb-2 px-3 py-2 rounded text-sm ${
              inviteSuccess ? 'bg-success-50 text-success-700' : 'bg-error-50 text-error-700'
            }`}>
              {inviteSuccess || inviteError}
            </div>
          )}

          <div className="mt-4">
            {members.length > 0 || pendingInvites.length > 0 ? (
              <div className="space-y-3">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className={`flex items-center gap-4 p-3 border rounded-lg transition-colors ${
                      member.role === 'leader'
                        ? 'border-primary-300 bg-primary-50/50'
                        : 'border-neutral-200 hover:bg-neutral-50'
                    }`}
                  >
                    <Avatar
                      src={member.users?.avatar_url}
                      name={member.users?.full_name || member.users?.email || 'Unknown'}
                      size="md"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-neutral-900">
                          {member.users?.full_name || 'Unknown User'}
                        </h4>
                        {member.role === 'leader' && (
                          <span className="text-xs text-primary-600 font-medium">
                            (Leader)
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-neutral-600">{member.users?.email}</p>
                    </div>
                    <Badge variant={
                      member.role === 'leader' ? 'primary' :
                      member.role === 'adviser' ? 'success' : 'default'
                    }>
                      {member.role === 'adviser' ? 'adviser' :
                       member.role === 'leader' ? 'leader' : 'collaborator'}
                    </Badge>
                  </div>
                ))}

                {pendingInvites.length > 0 && (
                  <>
                    <div className="pt-2 pb-1">
                      <p className="text-xs font-medium text-neutral-400 uppercase tracking-wide">
                        Pending Invitations
                      </p>
                    </div>
                    {pendingInvites.map((invite) => (
                      <div
                        key={invite.id}
                        className="flex items-center gap-4 p-3 border border-dashed border-neutral-300 rounded-lg bg-neutral-50/50"
                      >
                        <Avatar
                          src={invite.users?.avatar_url}
                          name={invite.users?.full_name || invite.users?.email || 'Unknown'}
                          size="md"
                        />
                        <div className="flex-1">
                          <h4 className="font-semibold text-neutral-700">
                            {invite.users?.full_name || 'Unknown User'}
                          </h4>
                          <p className="text-sm text-neutral-500">{invite.users?.email}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="warning">pending</Badge>
                          <Badge variant={invite.role === 'adviser' ? 'success' : 'default'}>
                            {invite.role === 'adviser' ? 'adviser' : 'collaborator'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            ) : (
              <p className="text-neutral-500 text-sm">
                No team members yet. Click &quot;Invite Members&quot; to search and invite collaborators.
              </p>
            )}
          </div>
        </Card>

        <UserSearchModal
          isOpen={inviteOpen}
          onClose={() => setInviteOpen(false)}
          onSelect={handleInviteSelect}
          title="Invite Members"
          excludeIds={existingUserIds}
        />
      </div>
    </DashboardLayout>
  );
}
