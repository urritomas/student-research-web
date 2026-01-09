-- HOTFIX: RLS Policy for project_members INSERT
-- This fixes the "new row violates row-level security policy" error
-- when trying to create a new project with file upload

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Project leaders can add members" ON public.project_members;

-- Create new policy that allows:
-- 1. Users to add themselves to project_members
-- 2. Project creators to add any members
CREATE POLICY "Users can add themselves or leaders can add"
ON public.project_members
FOR INSERT
TO authenticated
WITH CHECK (
  -- User can add themselves to any project
  user_id = auth.uid()
  OR
  -- OR project creator can add members
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE id = project_id 
    AND created_by = auth.uid()
  )
);

-- Verify the policy was created
SELECT * FROM pg_policies 
WHERE tablename = 'project_members' 
AND policyname = 'Users can add themselves or leaders can add';
