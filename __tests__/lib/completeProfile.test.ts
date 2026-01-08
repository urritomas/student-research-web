/**
 * @jest-environment jsdom
 */

import { completeProfile, CompleteProfileData, CompleteProfileResult } from '@/lib/completeProfile';
import { supabase } from '@/lib/supabaseClient';

// Mock Supabase client
jest.mock('@/lib/supabaseClient', () => ({
  supabase: {
    storage: {
      from: jest.fn()
    },
    from: jest.fn()
  }
}));

describe('completeProfile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Validation', () => {
    it('should return error when userId is missing', async () => {
      const data: CompleteProfileData = {
        userId: '',
        displayName: 'John Doe',
        role: 'student',
        email: 'john@example.com'
      };

      const result = await completeProfile(data);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Missing required fields');
    });

    it('should return error when displayName is missing', async () => {
      const data: CompleteProfileData = {
        userId: 'user-123',
        displayName: '',
        role: 'student',
        email: 'john@example.com'
      };

      const result = await completeProfile(data);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Missing required fields');
    });

    it('should return error when role is missing', async () => {
      const data: CompleteProfileData = {
        userId: 'user-123',
        displayName: 'John Doe',
        role: '' as any,
        email: 'john@example.com'
      };

      const result = await completeProfile(data);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Missing required fields');
    });

    it('should return error when email is missing', async () => {
      const data: CompleteProfileData = {
        userId: 'user-123',
        displayName: 'John Doe',
        role: 'student',
        email: ''
      };

      const result = await completeProfile(data);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Missing required fields');
    });
  });

  describe('Avatar Upload', () => {
    it('should upload avatar when file is provided', async () => {
      const mockFile = new File(['avatar'], 'avatar.jpg', { type: 'image/jpeg' });
      const mockUpload = jest.fn().mockResolvedValue({ error: null });
      const mockGetPublicUrl = jest.fn().mockReturnValue({
        data: { publicUrl: 'https://storage.supabase.co/avatars/user-123.jpg' }
      });

      (supabase.storage.from as jest.Mock).mockReturnValue({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl
      });

      (supabase.from as jest.Mock).mockReturnValue({
        upsert: jest.fn().mockResolvedValue({ error: null }),
        insert: jest.fn().mockResolvedValue({ error: null })
      });

      const data: CompleteProfileData = {
        userId: 'user-123',
        displayName: 'John Doe',
        role: 'student',
        email: 'john@example.com',
        avatarFile: mockFile
      };

      const result = await completeProfile(data);

      expect(mockUpload).toHaveBeenCalled();
      expect(mockGetPublicUrl).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    it('should handle avatar upload error gracefully', async () => {
      const mockFile = new File(['avatar'], 'avatar.jpg', { type: 'image/jpeg' });
      const mockUpload = jest.fn().mockResolvedValue({
        error: { message: 'Upload failed' }
      });

      (supabase.storage.from as jest.Mock).mockReturnValue({
        upload: mockUpload
      });

      const data: CompleteProfileData = {
        userId: 'user-123',
        displayName: 'John Doe',
        role: 'student',
        email: 'john@example.com',
        avatarFile: mockFile
      };

      const result = await completeProfile(data);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to upload avatar');
    });

    it('should proceed without avatar when no file is provided', async () => {
      const mockUpsert = jest.fn().mockResolvedValue({ error: null });
      const mockInsert = jest.fn().mockResolvedValue({ error: null });

      (supabase.from as jest.Mock).mockReturnValue({
        upsert: mockUpsert,
        insert: mockInsert
      });

      const data: CompleteProfileData = {
        userId: 'user-123',
        displayName: 'John Doe',
        role: 'student',
        email: 'john@example.com'
      };

      const result = await completeProfile(data);

      expect(result.success).toBe(true);
      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          avatar_url: null
        }),
        expect.any(Object)
      );
    });
  });

  describe('Profile Upsert', () => {
    it('should upsert user profile with correct data', async () => {
      const mockUpsert = jest.fn().mockResolvedValue({ error: null });
      const mockInsert = jest.fn().mockResolvedValue({ error: null });

      (supabase.from as jest.Mock).mockReturnValue({
        upsert: mockUpsert,
        insert: mockInsert
      });

      const data: CompleteProfileData = {
        userId: 'user-123',
        displayName: 'John Doe',
        role: 'student',
        email: 'john@example.com'
      };

      await completeProfile(data);

      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'user-123',
          full_name: 'John Doe',
          email: 'john@example.com',
          avatar_url: null
        }),
        { onConflict: 'id' }
      );
    });

    it('should handle profile upsert error', async () => {
      const mockUpsert = jest.fn().mockResolvedValue({
        error: { message: 'Database error' }
      });

      (supabase.from as jest.Mock).mockReturnValue({
        upsert: mockUpsert
      });

      const data: CompleteProfileData = {
        userId: 'user-123',
        displayName: 'John Doe',
        role: 'student',
        email: 'john@example.com'
      };

      const result = await completeProfile(data);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to save profile');
    });
  });

  describe('User Role Assignment', () => {
    it('should map student role to student app role', async () => {
      const mockUpsert = jest.fn().mockResolvedValue({ error: null });
      const mockInsert = jest.fn().mockResolvedValue({ error: null });

      (supabase.from as jest.Mock).mockReturnValue({
        upsert: mockUpsert,
        insert: mockInsert
      });

      const data: CompleteProfileData = {
        userId: 'user-123',
        displayName: 'John Doe',
        role: 'student',
        email: 'john@example.com'
      };

      await completeProfile(data);

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-123',
          role: 'student'
        })
      );
    });

    it('should map teacher role to adviser app role', async () => {
      const mockUpsert = jest.fn().mockResolvedValue({ error: null });
      const mockInsert = jest.fn().mockResolvedValue({ error: null });

      (supabase.from as jest.Mock).mockReturnValue({
        upsert: mockUpsert,
        insert: mockInsert
      });

      const data: CompleteProfileData = {
        userId: 'user-123',
        displayName: 'Jane Smith',
        role: 'teacher',
        email: 'jane@example.com'
      };

      await completeProfile(data);

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-123',
          role: 'adviser'
        })
      );
    });

    it('should handle role insert error', async () => {
      const mockUpsert = jest.fn().mockResolvedValue({ error: null });
      const mockInsert = jest.fn().mockResolvedValue({
        error: { message: 'Role assignment failed' }
      });

      (supabase.from as jest.Mock).mockReturnValue({
        upsert: mockUpsert,
        insert: mockInsert
      });

      const data: CompleteProfileData = {
        userId: 'user-123',
        displayName: 'John Doe',
        role: 'student',
        email: 'john@example.com'
      };

      const result = await completeProfile(data);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to assign role');
    });
  });

  describe('Redirect Path', () => {
    it('should return /student redirect path for student role', async () => {
      const mockUpsert = jest.fn().mockResolvedValue({ error: null });
      const mockInsert = jest.fn().mockResolvedValue({ error: null });

      (supabase.from as jest.Mock).mockReturnValue({
        upsert: mockUpsert,
        insert: mockInsert
      });

      const data: CompleteProfileData = {
        userId: 'user-123',
        displayName: 'John Doe',
        role: 'student',
        email: 'john@example.com'
      };

      const result = await completeProfile(data);

      expect(result.success).toBe(true);
      expect(result.redirectPath).toBe('/student');
    });

    it('should return /adviser redirect path for teacher role', async () => {
      const mockUpsert = jest.fn().mockResolvedValue({ error: null });
      const mockInsert = jest.fn().mockResolvedValue({ error: null });

      (supabase.from as jest.Mock).mockReturnValue({
        upsert: mockUpsert,
        insert: mockInsert
      });

      const data: CompleteProfileData = {
        userId: 'user-123',
        displayName: 'Jane Smith',
        role: 'teacher',
        email: 'jane@example.com'
      };

      const result = await completeProfile(data);

      expect(result.success).toBe(true);
      expect(result.redirectPath).toBe('/adviser');
    });
  });

  describe('Integration', () => {
    it('should complete full profile setup successfully', async () => {
      const mockFile = new File(['avatar'], 'avatar.jpg', { type: 'image/jpeg' });
      const mockUpload = jest.fn().mockResolvedValue({ error: null });
      const mockGetPublicUrl = jest.fn().mockReturnValue({
        data: { publicUrl: 'https://storage.supabase.co/avatars/user-123.jpg' }
      });
      const mockUpsert = jest.fn().mockResolvedValue({ error: null });
      const mockInsert = jest.fn().mockResolvedValue({ error: null });

      (supabase.storage.from as jest.Mock).mockReturnValue({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl
      });

      (supabase.from as jest.Mock).mockReturnValue({
        upsert: mockUpsert,
        insert: mockInsert
      });

      const data: CompleteProfileData = {
        userId: 'user-123',
        displayName: 'John Doe',
        role: 'student',
        email: 'john@example.com',
        avatarFile: mockFile
      };

      const result = await completeProfile(data);

      expect(result.success).toBe(true);
      expect(result.redirectPath).toBe('/student');
      expect(mockUpload).toHaveBeenCalled();
      expect(mockUpsert).toHaveBeenCalled();
      expect(mockInsert).toHaveBeenCalled();
    });

    it('should handle unexpected errors gracefully', async () => {
      (supabase.from as jest.Mock).mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const data: CompleteProfileData = {
        userId: 'user-123',
        displayName: 'John Doe',
        role: 'student',
        email: 'john@example.com'
      };

      const result = await completeProfile(data);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unexpected error');
    });
  });
});
