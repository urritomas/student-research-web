-- =====================================================
-- FIX: Supabase Storage RLS Policy Violation
-- =====================================================
-- This script fixes the "new row violates row-level security policy" 
-- error when uploading files to the project_documents bucket.
--
-- Run this entire script in the Supabase SQL Editor.
-- =====================================================

-- Step 1: Create project_documents bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('project_documents', 'project_documents', false)
ON CONFLICT (id) DO NOTHING;

-- Step 2: Ensure RLS is enabled on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Step 3: Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can upload project documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view project documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update project documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete project documents" ON storage.objects;

-- Step 4: Create INSERT policy - Allow authenticated users to upload
CREATE POLICY "Users can upload project documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'project_documents' 
  AND auth.uid()::text IS NOT NULL
);

-- Step 5: Create SELECT policy - Allow authenticated users to view
CREATE POLICY "Users can view project documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'project_documents'
  AND auth.uid()::text IS NOT NULL
);

-- Step 6: Create UPDATE policy - Allow authenticated users to update
CREATE POLICY "Users can update project documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'project_documents'
  AND auth.uid()::text IS NOT NULL
)
WITH CHECK (
  bucket_id = 'project_documents'
  AND auth.uid()::text IS NOT NULL
);

-- Step 7: Create DELETE policy - Allow authenticated users to delete
CREATE POLICY "Users can delete project documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'project_documents'
  AND auth.uid()::text IS NOT NULL
);

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify bucket exists
SELECT id, name, public, created_at
FROM storage.buckets 
WHERE id = 'project_documents';

-- Verify policies are created
SELECT 
  policyname,
  cmd AS operation,
  roles,
  CASE 
    WHEN qual IS NOT NULL THEN 'Has USING clause'
    ELSE 'No USING clause'
  END AS using_clause,
  CASE 
    WHEN with_check IS NOT NULL THEN 'Has WITH CHECK clause'
    ELSE 'No WITH CHECK clause'
  END AS with_check_clause
FROM pg_policies 
WHERE tablename = 'objects' 
  AND policyname LIKE '%project_documents%'
ORDER BY cmd;

-- =====================================================
-- SUCCESS! 
-- Your file uploads should now work without RLS errors.
-- =====================================================
