'use client';

import React from 'react';
import Link from 'next/link';
import Dropdown from '../ui/Dropdown';
import Avatar from '../ui/Avatar';
import { FiBell, FiSettings, FiLogOut, FiUser } from 'react-icons/fi';

export interface HeaderProps {
  user?: {
    name: string;
    email: string;
    avatar?: string;
    role: string;
  };
  onLogout?: () => void;
}

export default function Header({ user, onLogout }: HeaderProps) {
  const userMenuItems = [
    {
      label: 'Profile',
      value: 'profile',
      icon: <FiUser />,
      onClick: () => console.log('Navigate to profile'),
    },
    {
      label: 'Settings',
      value: 'settings',
      icon: <FiSettings />,
      onClick: () => console.log('Navigate to settings'),
    },
    {
      label: '',
      value: 'divider',
      divider: true,
    },
    {
      label: 'Logout',
      value: 'logout',
      icon: <FiLogOut />,
      onClick: onLogout || (() => console.log('Logout')),
      danger: true,
    },
  ];

  return (
    <header className="bg-white border-b border-neutral-200 sticky top-0 z-40">
      <div className="flex items-center justify-between px-8 py-4">
        {/* Logo and Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-crimsonRed rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-darkSlateBlue">
            Student Research
          </h1>
        </div>

        {/* Right side - User Info */}
        <div className="flex items-center gap-4">
          {user ? (
            <Dropdown
              align="right"
              trigger={
                <div className="flex items-center gap-3 cursor-pointer hover:bg-neutral-50 px-3 py-2 rounded-lg transition-colors">
                  <div className="text-right">
                    <div className="text-sm font-medium text-darkSlateBlue">{user.name}</div>
                    <div className="text-xs text-neutral-500">({user.role})</div>
                  </div>
                  <Avatar src={user.avatar} name={user.name} size="md" />
                </div>
              }
              items={userMenuItems}
            />
          ) : (
            <Link href="/login">
              <button className="px-4 py-2 bg-crimsonRed text-white rounded-lg hover:bg-error-600 transition-colors">
                Sign In
              </button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
