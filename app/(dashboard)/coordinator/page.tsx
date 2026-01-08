'use client';

import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card, { CardTitle, CardDescription } from '@/components/ui/Card';
import { FiUsers, FiFolder, FiCalendar, FiSettings } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function CoordinatorDashboardPage() {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const user = {
    name: 'Prof. Michael Anderson',
    email: 'michael.anderson@example.com',
    role: 'Coordinator',
  };

  const stats = [
    { icon: <FiFolder />, label: 'Total Projects', value: '156', color: 'bg-primary-100 text-primary-600' },
    { icon: <FiUsers />, label: 'Active Students', value: '420', color: 'bg-accent-100 text-accent-600' },
    { icon: <FiUsers />, label: 'Faculty Advisers', value: '32', color: 'bg-success-100 text-success-600' },
    { icon: <FiCalendar />, label: 'Defenses This Month', value: '18', color: 'bg-warning-100 text-warning-600' },
  ];

  return (
    <DashboardLayout role="coordinator" user={user} onLogout={handleLogout}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-primary-700">Coordinator Dashboard</h1>
          <p className="text-neutral-600 mt-1">System-wide overview and management</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, idx) => (
            <Card key={idx} padding="md">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${stat.color}`}>
                  <div className="text-2xl">{stat.icon}</div>
                </div>
                <div>
                  <p className="text-sm text-neutral-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-primary-700">{stat.value}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <Card>
          <CardTitle>System Overview</CardTitle>
          <CardDescription>Quick access to coordinator functions</CardDescription>
        </Card>
      </div>
    </DashboardLayout>
  );
}
