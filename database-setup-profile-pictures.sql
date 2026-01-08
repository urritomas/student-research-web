-- Profile Picture Upload - Database Setup Script
-- Run this in your Supabase SQL Editor

-- ============================================
-- 1. Ensure avatar_url column exists in users table
-- ============================================

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- ============================================
-- 2. Storage Bucket Policies for Profile_pictures
-- ============================================

-- Note: First create the bucket named "Profile_pictures" in Supabase Dashboard > Storage
-- Then run these policies:

-- Policy 1: Allow authenticated users to upload their own profile pictures
CREATE POLICY "Users can upload their own profile picture"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'Profile_pictures' 
);

-- Policy 2: Allow public read access to profile pictures
CREATE POLICY "Public can view profile pictures"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'Profile_pictures');

-- Policy 3: Allow users to update their own profile pictures
CREATE POLICY "Users can update their own profile picture"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'Profile_pictures');

-- Policy 4: Allow users to delete their own profile pictures
CREATE POLICY "Users can delete their own profile picture"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'Profile_pictures');

-- ============================================
-- 3. Verify Setup
-- ============================================

-- Check if avatar_url column exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND column_name = 'avatar_url';

-- View all policies on storage.objects
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage';

-- ============================================
-- 4. Test Query (Optional)
-- ============================================

-- After a user uploads a profile picture, verify it's saved:
-- SELECT id, full_name, avatar_url 
-- FROM users 
-- WHERE id = '<your-user-id>';
