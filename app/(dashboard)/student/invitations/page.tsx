'use client';

import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/Button';
import { FiMail, FiCheck, FiX } from 'react-icons/fi';
import EmptyState from '@/components/layout/EmptyState';
import { useDashboardUser } from '@/lib/hooks/useDashboardUser';
import { useInvitations } from '@/lib/hooks/useInvitations';

export default function StudentInvitationsPage() {
  const { user, isLoading: profileLoading, handleLogout } = useDashboardUser('Student');
  const {
    invitations,
    loading,
    error,
    respondingId,
    respond,
  } = useInvitations({ pollMs: 10000 });

  const isLoading = profileLoading || loading;

  return (
    <DashboardLayout role="student" user={user} onLogout={handleLogout}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-primary-700">Invitations</h1>
          <p className="text-neutral-600 mt-1">Manage your project invitations</p>
        </div>

        {error && (
          <Card>
            <p className="text-sm text-error-700">Failed to load invitations: {error}</p>
          </Card>
        )}

        {isLoading ? (
          <Card>
            <p className="text-neutral-500">Loading invitations...</p>
          </Card>
        ) : invitations.length > 0 ? (
          <div className="space-y-4">
            {invitations.map((invitation) => (
              <Card key={invitation.id}>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-accent-100 rounded-lg flex items-center justify-center">
                    <FiMail className="text-2xl text-accent-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-lg text-primary-700">
                          {invitation.project_title}
                        </h3>
                        <p className="text-sm text-neutral-600">
                          Invited by {invitation.invited_by_name || invitation.invited_by_email}
                        </p>
                      </div>
                      <Badge variant="pending">
                        {invitation.role === 'member' ? 'collaborator' : invitation.role}
                      </Badge>
                    </div>
                    <div className="flex gap-3 mt-4">
                      <Button
                        variant="success"
                        size="sm"
                        leftIcon={<FiCheck />}
                        disabled={respondingId === invitation.id}
                        onClick={() => respond(invitation.id, true)}
                      >
                        Accept
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<FiX />}
                        disabled={respondingId === invitation.id}
                        onClick={() => respond(invitation.id, false)}
                      >
                        Decline
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <EmptyState
              icon={<FiMail />}
              title="No invitations"
              description="You don't have any pending invitations at the moment."
            />
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
