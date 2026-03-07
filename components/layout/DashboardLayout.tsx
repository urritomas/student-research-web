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
      <div className="h-screen bg-neutral-50 flex overflow-hidden">
        <Sidebar role={role} />

        <div className="flex-1 flex flex-col min-w-0 pl-[72px]">
          <Header user={user} onLogout={onLogout} />

          <main className="flex-1 overflow-y-auto flex flex-col">
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
