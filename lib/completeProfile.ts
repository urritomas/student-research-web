import { supabase } from './supabaseClient';

export type UserRole = 'student' | 'teacher';
export type AppRole = 'student' | 'adviser';

export interface CompleteProfileData {
  userId: string;
  displayName: string;
  role: UserRole;
  avatarFile?: File | null;
  googlePhotoUrl?: string | null;
  email: string;
}

export interface CompleteProfileResult {
  success: boolean;
  redirectPath?: string;
  error?: string;
}

/**
 * Maps user-selected role to the application role stored in the database
 */
function mapRoleToAppRole(role: UserRole): AppRole {
  return role === 'student' ? 'student' : 'adviser';
}

/**
 * Gets the redirect path based on the user's role
 */
function getRedirectPath(role: UserRole): string {
  return role === 'student' ? '/student' : '/adviser';
}

/**
 * Uploads an avatar image to Supabase Storage
 * @returns The public URL of the uploaded avatar or null
 */
async function uploadAvatar(userId: string, avatarFile: File): Promise<string | null> {
  try {
    const fileExt = avatarFile.name.split('.').pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('Profile_pictures')
      .upload(filePath, avatarFile, {
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      console.error('Avatar upload error:', uploadError);
      throw new Error(`Failed to upload avatar: ${uploadError.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('Profile_pictures')
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (error) {
    console.error('Error uploading avatar:', error);
    throw error;
  }
}

/**
 * Upserts a user profile in the public.users table
 */
async function upsertUserProfile(
  userId: string,
  displayName: string,
  email: string,
  avatarUrl: string | null
): Promise<void> {
  try {
    const { error } = await supabase
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

    if (error) {
      console.error('Profile upsert error:', error);
      throw new Error(`Failed to save profile: ${error.message}`);
    }
  } catch (error) {
    console.error('Error upserting user profile:', error);
    throw error;
  }
}

/**
 * Inserts a user role mapping in the user_roles table
 */
async function insertUserRole(userId: string, role: AppRole): Promise<void> {
  try {
    const { error } = await supabase
      .from('user_roles')
      .insert({
        user_id: userId,
        role: role,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('User role insert error:', error);
      throw new Error(`Failed to assign role: ${error.message}`);
    }
  } catch (error) {
    console.error('Error inserting user role:', error);
    throw error;
  }
}

/**
 * Completes the user profile setup for first-time users
 * 
 * This function:
 * 1. Uploads avatar to Supabase Storage (if provided)
 * 2. Upserts user profile in public.users table
 * 3. Inserts user role in user_roles table
 * 
 * @param data - Profile completion data
 * @returns Result object with success status and redirect path
 * 
 * @example
 * ```ts
 * const result = await completeProfile({
 *   userId: 'user-uuid',
 *   displayName: 'John Doe',
 *   role: 'student',
 *   email: 'john@example.com',
 *   avatarFile: file,
 *   institutionName: 'MIT'
 * });
 * 
 * if (result.success) {
 *   router.push(result.redirectPath);
 * }
 * ```
 */
export async function completeProfile(
  data: CompleteProfileData
): Promise<CompleteProfileResult> {
  const { userId, displayName, role, avatarFile, googlePhotoUrl, email } = data;

  try {
    // Validate required fields
    if (!userId || !displayName || !role || !email) {
      return {
        success: false,
        error: 'Missing required fields: userId, displayName, role, and email are required'
      };
    }

    // Step 1: Determine avatar URL
    let avatarUrl: string | null = null;
    
    if (avatarFile) {
      // User uploaded a new file - use that
      avatarUrl = await uploadAvatar(userId, avatarFile);
    } else if (googlePhotoUrl) {
      // No file uploaded, but has Google photo - use Google photo
      avatarUrl = googlePhotoUrl;
    }
    // Otherwise avatarUrl remains null

    // Step 2: Upsert user profile
    await upsertUserProfile(userId, displayName, email, avatarUrl);

    // Step 3: Insert user role
    const appRole = mapRoleToAppRole(role);
    await insertUserRole(userId, appRole);

    // Step 4: Return success with redirect path
    const redirectPath = getRedirectPath(role);
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
