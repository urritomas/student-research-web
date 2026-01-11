-- ============================================================================
-- FIX: Storage Bucket Policy for Project Documents
-- ============================================================================
-- This script fixes the storage bucket policies to match the actual upload path
-- structure used by the application (projects/{projectId}/filename).
--
-- Run this script in your Supabase SQL Editor to apply the fix.
-- ============================================================================

-- Policy: Allow authenticated users to upload documents to projects folder
DROP POLICY IF EXISTS "Users can upload to their folder" ON storage.objects;
CREATE POLICY "Users can upload to their folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'project_documents' 
  AND (storage.foldername(name))[1] = 'projects'
  AND EXISTS (
    SELECT 1 FROM public.projects 
    WHERE id::text = (storage.foldername(name))[2]
    AND created_by = auth.uid()
  )
);

-- Policy: Allow public read access to project documents
DROP POLICY IF EXISTS "Public can read project documents" ON storage.objects;
CREATE POLICY "Public can read project documents"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'project_documents');

-- Policy: Allow users to delete their own project documents
DROP POLICY IF EXISTS "Users can delete their documents" ON storage.objects;
CREATE POLICY "Users can delete their documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'project_documents' 
  AND (storage.foldername(name))[1] = 'projects'
  AND EXISTS (
    SELECT 1 FROM public.projects 
    WHERE id::text = (storage.foldername(name))[2]
    AND created_by = auth.uid()
  )
);

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================
-- Run this to verify the policies are correctly set:
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
ORDER BY policyname;
