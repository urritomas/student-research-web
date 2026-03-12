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
  FiClipboard,
  FiX,
} from 'react-icons/fi';
import { useSidebar } from './SidebarContext';

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
    // {/* label: 'Projects Overview', href: '/adviser/projects', icon: <FiFolder /> */}
    { label: 'Defense Schedule', href: '/defenses', icon: <FiCalendar /> },
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
  const { isOpen, setOpen } = useSidebar();

  const closeSidebar = () => setOpen(false);

  return (
    <>
      {/* Backdrop - only show on mobile when sidebar is open */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/20 backdrop-blur-[1px] lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-30 w-64
          bg-white border-r border-neutral-200 h-screen flex flex-col
          transition-transform duration-300 ease-in-out
          lg:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:static lg:-translate-x-0
        `}
      >
        {/* Header */}
        <div className="p-6 border-b border-neutral-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-crimsonRed rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-darkSlateBlue whitespace-nowrap">Student Research</h2>
              <p className="text-xs text-neutral-500 capitalize whitespace-nowrap">{role}</p>
            </div>
          </div>

          {/* Close button - only on mobile */}
          <button
            onClick={closeSidebar}
            className="p-2 rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-darkSlateBlue transition-colors lg:hidden"
            aria-label="Close sidebar"
          >
            <FiX className="text-lg" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 overflow-y-auto overflow-x-hidden">
          <ul className="space-y-1">
            {items.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={closeSidebar}
                    className={`
                      flex items-center gap-3 rounded-lg
                      transition-all duration-200 group text-sm px-4 py-2.5 relative
                      ${isActive
                        ? 'bg-neutral-100 text-darkSlateBlue font-medium'
                        : 'text-neutral-600 hover:bg-neutral-50 hover:text-darkSlateBlue'
                      }
                    `}
                  >
                    <span className={`text-lg flex-shrink-0 ${isActive ? 'text-darkSlateBlue' : 'text-neutral-400 group-hover:text-darkSlateBlue'}`}>
                      {item.icon}
                    </span>
                    <span className="flex-1 overflow-hidden">
                      {item.label}
                    </span>
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
      </aside>
    </>
  );
}
