'use client';

import React from 'react';
import Link from 'next/link';
import Dropdown from '../ui/Dropdown';
import Avatar from '../ui/Avatar';
import { useRouter, usePathname } from 'next/navigation';
import { FiBell, FiSettings, FiLogOut, FiUser, FiMenu } from 'react-icons/fi';
import { useSidebar } from './SidebarContext';

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
  const router = useRouter();
  const pathname = usePathname();
  const { toggle } = useSidebar();

  const userMenuItems = [
    {
      label: 'Profile',
      value: 'profile',
      icon: <FiUser />,
      onClick: () => {
        if (user) {
          const url = `/${user.role.toLowerCase()}/profile`;
          if (pathname === url) {
            return;
          }
          router.replace(url)
        }
      },
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
    <header className="bg-white border-b border-neutral-200 sticky top-0 z-40 flex-shrink-0">
      <div className="flex items-center justify-between px-6 py-3">
        <button
          onClick={toggle}
          className="p-2 rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-darkSlateBlue transition-colors lg:hidden"
          aria-label="Toggle sidebar"
        >
          <FiMenu className="text-xl" />
        </button>

        <div className="flex-1" />

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
