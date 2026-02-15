'use client';

import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { FiCalendar, FiClock, FiMapPin } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import EmptyState from '@/components/layout/EmptyState';
import { MOCK_STUDENT, MOCK_DEFENSES } from '@/lib/mock-data';

export default function StudentDefensesPage() {
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

  const defenses = MOCK_DEFENSES;

  return (
    <DashboardLayout role="student" user={user} onLogout={handleLogout}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-primary-700">Defense Schedule</h1>
          <p className="text-neutral-600 mt-1">Your upcoming defense schedules</p>
        </div>

        {defenses.length > 0 ? (
          <div className="space-y-4">
            {defenses.map((defense) => (
              <Card key={defense.id}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-xl text-primary-700">
                      {defense.projectTitle}
                    </h3>
                    <Badge variant="warning" className="mt-2">{defense.type}</Badge>
                  </div>
                </div>
                
                <div className="space-y-3 text-neutral-700">
                  <div className="flex items-center gap-3">
                    <FiCalendar className="text-accent-500 flex-shrink-0" />
                    <span>{defense.date}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <FiClock className="text-accent-500 flex-shrink-0" />
                    <span>{defense.time}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <FiMapPin className="text-accent-500 flex-shrink-0" />
                    <span>{defense.location}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-neutral-200">
                  <p className="text-sm font-medium text-neutral-700 mb-2">Panel Members:</p>
                  <div className="flex flex-wrap gap-2">
                    {defense.panel.map((member, idx) => (
                      <Badge key={idx} variant="default">{member}</Badge>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <EmptyState
              icon={<FiCalendar />}
              title="No upcoming defenses"
              description="You don't have any scheduled defenses at the moment."
            />
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
