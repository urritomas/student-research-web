'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import NewAccountConfigModal from '@/components/NewAccountConfigModal';
import { supabase } from '@/lib/supabaseClient';

export default function OnboardingPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const [googleDisplayName, setGoogleDisplayName] = useState<string | null>(null);
  const [googlePhotoUrl, setGooglePhotoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkUserAndProfile = async () => {
      try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          // Not authenticated, redirect to login
          router.push('/login');
          return;
        }

        // Check if user already has a profile
        const { data: profile } = await supabase
          .from('users')
          .select('id')
          .eq('id', user.id)
          .single();

        if (profile) {
          // Profile exists, check role and redirect
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id)
            .single();

          if (roleData?.role === 'student') {
            router.push('/student');
          } else if (roleData?.role === 'adviser') {
            router.push('/adviser');
          } else if (roleData?.role === 'coordinator') {
            router.push('/coordinator');
          } else {
            router.push('/');
          }
          return;
        }

        // No profile exists, show onboarding modal
        setUserId(user.id);
        setUserEmail(user.email || '');
        
        // Extract Google profile data if available
        const displayName = user.user_metadata?.full_name || user.user_metadata?.name || null;
        const photoUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture || null;
        
        setGoogleDisplayName(displayName);
        setGooglePhotoUrl(photoUrl);
        setIsLoading(false);
      } catch (error) {
        console.error('Error checking user profile:', error);
        router.push('/login');
      }
    };

    checkUserAndProfile();
  }, [router]);

  const handleClose = () => {
    // Don't allow closing without completing setup
    // User must complete the profile
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center space-y-4">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary-500 border-r-transparent"></div>
          <p className="text-neutral-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50">
      <NewAccountConfigModal
        isOpen={true}
        onClose={handleClose}
        userId={userId}
        userEmail={userEmail}
        googleDisplayName={googleDisplayName}
        googlePhotoUrl={googlePhotoUrl}
      />
    </div>
  );
}
