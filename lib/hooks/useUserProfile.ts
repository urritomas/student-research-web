/**
 * Mock hook that returns static user profile data.
 * No backend calls — pure frontend demo.
 */

import { useState } from 'react';
import { MOCK_STUDENT } from '@/lib/mock-data';

export interface UserProfile {
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

export function useUserProfile() {
  const [user] = useState<UserProfile>({
    name: MOCK_STUDENT.full_name,
    email: MOCK_STUDENT.email,
    role: 'Student',
    avatar: MOCK_STUDENT.avatar_url || undefined,
  });

  return { user, isLoading: false, error: null, refetch: () => {} };
}
