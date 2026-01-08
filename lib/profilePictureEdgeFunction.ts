/**
 * Optional: Helper functions for profile picture upload via Edge Function
 * 
 * This file provides utilities to upload profile pictures using the Supabase Edge Function
 * instead of direct client-side upload to storage.
 * 
 * Usage:
 * - If you want more control and server-side validation, use the Edge Function
 * - If you want simpler client-side upload, use the current completeProfile.ts approach
 * 
 * To use this:
 * 1. Import this file in NewAccountConfigModal.tsx
 * 2. Replace the completeProfile call with uploadProfilePictureViaEdgeFunction
 */

import { supabase } from './supabaseClient';

export interface EdgeFunctionUploadResult {
  success: boolean;
  publicUrl?: string;
  error?: string;
}

/**
 * Uploads a profile picture using the Supabase Edge Function
 * 
 * @param userId - The user's UUID
 * @param file - The image file to upload
 * @returns Result object with success status and public URL
 * 
 * @example
 * ```ts
 * const result = await uploadProfilePictureViaEdgeFunction(userId, file);
 * if (result.success) {
 *   console.log('Uploaded to:', result.publicUrl);
 * }
 * ```
 */
export async function uploadProfilePictureViaEdgeFunction(
  userId: string,
  file: File
): Promise<EdgeFunctionUploadResult> {
  try {
    // Validate inputs
    if (!userId || !file) {
      return {
        success: false,
        error: 'Missing required parameters: userId and file'
      };
    }

    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return {
        success: false,
        error: 'Not authenticated. Please log in.'
      };
    }

    // Create FormData
    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', userId);

    // Get Supabase URL from environment
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    
    if (!supabaseUrl) {
      return {
        success: false,
        error: 'Supabase URL not configured'
      };
    }

    // Upload via Edge Function
    const response = await fetch(
      `${supabaseUrl}/functions/v1/upload-profile-picture`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: formData,
      }
    );

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || `Upload failed with status ${response.status}`
      };
    }

    return {
      success: true,
      publicUrl: result.publicUrl
    };

  } catch (error) {
    console.error('Error uploading profile picture:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    };
  }
}

/**
 * Validates a profile picture file before upload
 * 
 * @param file - The file to validate
 * @returns Object with isValid flag and optional error message
 */
export function validateProfilePicture(file: File): { isValid: boolean; error?: string } {
  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  if (!allowedTypes.includes(file.type.toLowerCase())) {
    return {
      isValid: false,
      error: 'Invalid file type. Only JPG, JPEG, and PNG are allowed.'
    };
  }

  // Validate file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB in bytes
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: 'File too large. Maximum size is 10MB.'
    };
  }

  return { isValid: true };
}

/**
 * Formats file size for display
 * 
 * @param bytes - Size in bytes
 * @returns Formatted string (e.g., "2.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Alternative complete profile function using Edge Function for upload
 * 
 * Use this instead of the completeProfile from completeProfile.ts if you want
 * to use the Edge Function for enhanced security and validation
 */
export async function completeProfileWithEdgeFunction(data: {
  userId: string;
  displayName: string;
  role: 'student' | 'teacher';
  avatarFile?: File | null;
  googlePhotoUrl?: string | null;
  email: string;
}): Promise<{ success: boolean; redirectPath?: string; error?: string }> {
  const { userId, displayName, role, avatarFile, googlePhotoUrl, email } = data;

  try {
    // Validate required fields
    if (!userId || !displayName || !role || !email) {
      return {
        success: false,
        error: 'Missing required fields'
      };
    }

    let avatarUrl: string | null = null;

    // Upload avatar if provided
    if (avatarFile) {
      // Validate file first
      const validation = validateProfilePicture(avatarFile);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error
        };
      }

      // Upload via Edge Function
      const uploadResult = await uploadProfilePictureViaEdgeFunction(userId, avatarFile);
      
      if (!uploadResult.success) {
        return {
          success: false,
          error: uploadResult.error || 'Failed to upload profile picture'
        };
      }

      avatarUrl = uploadResult.publicUrl || null;
    } else if (googlePhotoUrl) {
      // No file uploaded, but has Google photo - use Google photo
      avatarUrl = googlePhotoUrl;
    }

    // Upsert user profile
    const { error: profileError } = await supabase
      .from('users')
      .upsert({
        id: userId,
        full_name: displayName,
        email: email,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      });

    if (profileError) {
      return {
        success: false,
        error: `Failed to save profile: ${profileError.message}`
      };
    }

    // Insert user role
    const appRole = role === 'student' ? 'student' : 'adviser';
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: userId,
        role: appRole,
        created_at: new Date().toISOString()
      });

    if (roleError) {
      return {
        success: false,
        error: `Failed to assign role: ${roleError.message}`
      };
    }

    // Return success with redirect path
    const redirectPath = role === 'student' ? '/student' : '/adviser';
    return {
      success: true,
      redirectPath
    };

  } catch (error) {
    console.error('Error completing profile:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    };
  }
}
