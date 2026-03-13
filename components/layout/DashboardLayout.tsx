'use client';

import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import Footer from './Footer';
import { SidebarProvider } from './SidebarContext';

export interface DashboardLayoutProps {
  children: React.ReactNode;
  role: 'student' | 'adviser' | 'coordinator';
  user?: {
    name: string;
    email: string;
    avatar?: string;
    role: string;
  };
  onLogout?: () => void;
}

export default function DashboardLayout({ children, role, user, onLogout }: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen bg-neutral-50 flex flex-col lg:h-screen overflow-x-hidden lg:overflow-hidden">
        <Header user={user} onLogout={onLogout} />

        <div className="flex flex-col lg:flex-row flex-1 min-w-0 lg:min-h-0">
          <Sidebar role={role} />

          <main className="flex flex-col flex-1 min-w-0 lg:min-h-0 lg:overflow-y-auto">
            <div className="flex-1 p-6">
              <div className="max-w-7xl mx-auto">
                {children}
              </div>
            </div>
            <Footer />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
