'use client';

import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/Button';
import { FiMail, FiCheck, FiX } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import EmptyState from '@/components/layout/EmptyState';
import { MOCK_STUDENT, MOCK_INVITATIONS_PAGE } from '@/lib/mock-data';

export default function StudentInvitationsPage() {
  const router = useRouter();

  const user = {
    name: MOCK_STUDENT.full_name,
    email: MOCK_STUDENT.email,
    role: 'Student',
    avatar: MOCK_STUDENT.avatar_url,
  };

  const handleLogout = () => {
    router.push('/login');
  };

  const invitations = MOCK_INVITATIONS_PAGE;

  return (
    <DashboardLayout role="student" user={user} onLogout={handleLogout}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-primary-700">Invitations</h1>
          <p className="text-neutral-600 mt-1">Manage your project invitations</p>
        </div>

        {invitations.length > 0 ? (
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
                          {invitation.projectTitle}
                        </h3>
                        <p className="text-sm text-neutral-600">
                          Invited by {invitation.from} • {invitation.date}
                        </p>
                      </div>
                      <Badge variant="pending">{invitation.type}</Badge>
                    </div>
                    <div className="flex gap-3 mt-4">
                      <Button variant="success" size="sm" leftIcon={<FiCheck />}>
                        Accept
                      </Button>
                      <Button variant="outline" size="sm" leftIcon={<FiX />}>
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
