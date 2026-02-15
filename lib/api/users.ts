/**
 * Users API service – replaces all direct Supabase user/profile queries.
 */

import { get, post, patch } from './client';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  role?: string;
}

export interface CompleteProfilePayload {
  displayName: string;
  role: 'student' | 'teacher';
  email: string;
  avatarFile?: File | null;
  googlePhotoUrl?: string | null;
}

export interface CompleteProfileResult {
  success: boolean;
  redirectPath?: string;
  error?: string;
}

export interface UpdateProfilePayload {
  full_name?: string;
  avatar_url?: string;
}

// ─── API calls ──────────────────────────────────────────────────────────────

/** Fetch the current user's profile. */
export function getMyProfile() {
  return get<UserProfile>('/users/me');
}

/** Fetch a user profile by ID. */
export function getUserById(userId: string) {
  return get<UserProfile>(`/users/${userId}`);
}

/** Check whether the current user has completed onboarding. */
export function checkProfileExists() {
  return get<{ exists: boolean; role?: string }>('/users/me/exists');
}

/** Complete first-time profile setup (onboarding). */
export async function completeProfile(payload: CompleteProfilePayload): Promise<CompleteProfileResult> {
  const formData = new FormData();
  formData.append('displayName', payload.displayName);
  formData.append('role', payload.role);
  formData.append('email', payload.email);
  if (payload.googlePhotoUrl) {
    formData.append('googlePhotoUrl', payload.googlePhotoUrl);
  }
  if (payload.avatarFile) {
    formData.append('avatar', payload.avatarFile);
  }

  const { data, error } = await post<CompleteProfileResult>('/users/complete-profile', formData);
  if (error) return { success: false, error };
  return data ?? { success: false, error: 'No response from server' };
}

/** Update an existing user profile. */
export function updateProfile(payload: UpdateProfilePayload) {
  return patch<UserProfile>('/users/me', payload);
}

/** Get user role. */
export function getUserRole() {
  return get<{ role: string }>('/users/me/role');
}
