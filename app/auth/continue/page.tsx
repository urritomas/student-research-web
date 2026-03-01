"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useAuth from '@/lib/hooks/useAuth';

export default function AuthContinue() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      // No valid session/profile -> go to login
      router.replace('/login');
      return;
    }

    // Determine if onboarding is needed. We consider profile incomplete when
    // `full_name` or `role` is missing.
    const needsOnboarding = !user.full_name || !user.role;
    if (needsOnboarding) {
      router.replace('/onboarding');
      return;
    }

    // Otherwise redirect to role-based dashboard
    const role = (user.role || '').toLowerCase();
    if (role === 'student') {
      router.replace('/student');
    } else if (role === 'adviser' || role === 'teacher') {
      router.replace('/adviser');
    } else if (role === 'coordinator') {
      router.replace('/coordinator');
    } else {
      router.replace('/student');
    }
  }, [loading, user, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-crimsonRed" />
    </div>
  );
}
