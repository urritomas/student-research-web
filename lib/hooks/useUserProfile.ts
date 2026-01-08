import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export interface UserProfile {
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

/**
 * Custom hook to fetch and manage user profile data
 * 
 * @returns Object containing user profile, loading state, and error
 * 
 * @example
 * ```tsx
 * const { user, isLoading, error } = useUserProfile();
 * 
 * if (isLoading) return <LoadingSpinner />;
 * if (error) return <ErrorMessage />;
 * 
 * return <div>Welcome, {user?.name}!</div>;
 * ```
 */
export function useUserProfile() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get current authenticated user
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !authUser) {
        router.push('/login');
        return;
      }

      // Fetch user profile from database
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('full_name, email, avatar_url')
        .eq('id', authUser.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        // Fallback to auth user data if profile fetch fails
        setUser({
          name: authUser.email || 'User',
          email: authUser.email || '',
          role: 'Student',
        });
        setError('Could not load full profile');
      } else {
        setUser({
          name: profile.full_name || authUser.email || 'User',
          email: profile.email || authUser.email || '',
          role: 'Student',
          avatar: profile.avatar_url || undefined,
        });
      }
    } catch (err) {
      console.error('Error loading profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to load profile');
      // Set fallback user data
      setUser({
        name: 'User',
        email: '',
        role: 'Student',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return { user, isLoading, error, refetch: fetchUserProfile };
}
