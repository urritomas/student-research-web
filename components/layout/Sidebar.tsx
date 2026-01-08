'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  FiHome, 
  FiFolder, 
  FiPlus, 
  FiMail, 
  FiCalendar, 
  FiUser,
  FiUsers,
  FiBarChart2,
  FiSettings,
  FiClipboard
} from 'react-icons/fi';

export interface MenuItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
  roles?: string[];
}

export interface SidebarProps {
  role: 'student' | 'adviser' | 'coordinator';
}

const menuItems: Record<string, MenuItem[]> = {
  student: [
    { label: 'Dashboard', href: '/student', icon: <FiHome /> },
    { label: 'My Projects', href: '/student/projects', icon: <FiFolder /> },
    { label: 'Create Project', href: '/student/projects/create', icon: <FiPlus /> },
    { label: 'Invitations', href: '/student/invitations', icon: <FiMail />, badge: 3 },
    { label: 'Upcoming Defenses', href: '/student/defenses', icon: <FiCalendar /> },
    { label: 'Profile', href: '/student/profile', icon: <FiUser /> },
  ],
  adviser: [
    { label: 'Dashboard', href: '/adviser', icon: <FiHome /> },
    { label: 'My Advisees', href: '/adviser/advisees', icon: <FiUsers /> },
    { label: 'Projects Overview', href: '/adviser/projects', icon: <FiFolder /> },
    { label: 'Defense Schedule', href: '/adviser/defenses', icon: <FiCalendar /> },
    { label: 'Profile', href: '/adviser/profile', icon: <FiUser /> },
  ],
  coordinator: [
    { label: 'Dashboard', href: '/coordinator', icon: <FiHome /> },
    { label: 'All Projects', href: '/coordinator/projects', icon: <FiFolder /> },
    { label: 'Defense Management', href: '/coordinator/defenses', icon: <FiCalendar /> },
    { label: 'Rubrics', href: '/coordinator/rubrics', icon: <FiClipboard /> },
    { label: 'Users', href: '/coordinator/users', icon: <FiUsers /> },
    { label: 'Settings', href: '/coordinator/settings', icon: <FiSettings /> },
  ],
};

export default function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const items = menuItems[role] || [];

  return (
    <aside className="w-64 bg-white border-r border-neutral-200 min-h-screen flex flex-col">
      {/* Logo/Brand */}
      <div className="p-6 border-b border-neutral-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-crimsonRed rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-darkSlateBlue">Student Research</h2>
            <p className="text-xs text-neutral-500 capitalize">{role}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {items.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-4 py-2.5 rounded-lg
                    transition-all group text-sm
                    ${isActive 
                      ? 'bg-neutral-100 text-darkSlateBlue font-medium' 
                      : 'text-neutral-600 hover:bg-neutral-50 hover:text-darkSlateBlue'
                    }
                  `}
                >
                  <span className={`text-lg ${isActive ? 'text-darkSlateBlue' : 'text-neutral-400 group-hover:text-darkSlateBlue'}`}>
                    {item.icon}
                  </span>
                  <span className="flex-1">{item.label}</span>
                  {item.badge !== undefined && (
                    <span className="px-2 py-0.5 text-xs bg-crimsonRed text-white rounded-full font-medium">
                      {item.badge}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom section - could show version, help, etc. */}
      <div className="p-4 border-t border-neutral-200">
        <div className="text-xs text-neutral-400 text-center">
          Version 1.0.0
        </div>
      </div>
    </aside>
  );
}
