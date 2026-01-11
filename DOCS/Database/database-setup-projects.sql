-- Project Management Schema
-- This script creates the necessary tables and policies for project management

-- ============================================================================
-- 1. CREATE STORAGE BUCKET FOR PROJECT DOCUMENTS
-- ============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('project_documents', 'project_documents', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 2. CREATE PROJECTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_code UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  project_type TEXT DEFAULT 'research',
  status TEXT DEFAULT 'proposal' CHECK (status IN ('proposal', 'in-progress', 'completed', 'archived')),
  paper_standard TEXT,
  keywords TEXT[] DEFAULT '{}',
  document_reference TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 3. CREATE PROJECT MEMBERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('leader', 'member', 'adviser', 'panelist')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- ============================================================================
-- 4. CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_projects_created_by ON public.projects(created_by);
CREATE INDEX IF NOT EXISTS idx_projects_project_code ON public.projects(project_code);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON public.project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON public.project_members(user_id);

-- ============================================================================
-- 5. ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 6. CREATE RLS POLICIES FOR PROJECTS TABLE
-- ============================================================================

-- Policy: Allow users to insert their own projects
DROP POLICY IF EXISTS "Users can insert their own projects" ON public.projects;
CREATE POLICY "Users can insert their own projects"
ON public.projects
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

-- Policy: Allow users to read projects they created or are members of
DROP POLICY IF EXISTS "Users can read their projects" ON public.projects;
CREATE POLICY "Users can read their projects"
ON public.projects
FOR SELECT
TO authenticated
USING (
  auth.uid() = created_by 
  OR 
  EXISTS (
    SELECT 1 FROM public.project_members 
    WHERE project_id = projects.id 
    AND user_id = auth.uid()
  )
);

-- Policy: Allow project creators to update their projects
DROP POLICY IF EXISTS "Project creators can update" ON public.projects;
CREATE POLICY "Project creators can update"
ON public.projects
FOR UPDATE
TO authenticated
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);

-- Policy: Allow project creators to delete their projects
DROP POLICY IF EXISTS "Project creators can delete" ON public.projects;
CREATE POLICY "Project creators can delete"
ON public.projects
FOR DELETE
TO authenticated
USING (auth.uid() = created_by);

-- ============================================================================
-- 7. CREATE RLS POLICIES FOR PROJECT_MEMBERS TABLE
-- ============================================================================

-- Policy: Allow users to add themselves as project members
-- OR allow project creators to add any members
DROP POLICY IF EXISTS "Users can add themselves or leaders can add" ON public.project_members;
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

-- Policy: Allow users to read project members for projects they're part of
DROP POLICY IF EXISTS "Users can read project members" ON public.project_members;
CREATE POLICY "Users can read project members"
ON public.project_members
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE id = project_id 
    AND (
      created_by = auth.uid() 
      OR 
      EXISTS (
        SELECT 1 FROM public.project_members pm
        WHERE pm.project_id = project_id 
        AND pm.user_id = auth.uid()
      )
    )
  )
);

-- Policy: Allow project leaders to remove members
DROP POLICY IF EXISTS "Project leaders can remove members" ON public.project_members;
CREATE POLICY "Project leaders can remove members"
ON public.project_members
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE id = project_id 
    AND created_by = auth.uid()
  )
);

-- ============================================================================
-- 8. CREATE STORAGE POLICIES FOR PROJECT DOCUMENTS
-- ============================================================================

-- Policy: Allow authenticated users to upload documents to their folder
DROP POLICY IF EXISTS "Users can upload to their folder" ON storage.objects;
CREATE POLICY "Users can upload to their folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'project_documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow public read access to project documents
DROP POLICY IF EXISTS "Public can read project documents" ON storage.objects;
CREATE POLICY "Public can read project documents"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'project_documents');

-- Policy: Allow users to delete their own documents
DROP POLICY IF EXISTS "Users can delete their documents" ON storage.objects;
CREATE POLICY "Users can delete their documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'project_documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================================================
-- 9. CREATE UPDATE TRIGGER FOR UPDATED_AT
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for projects table
DROP TRIGGER IF EXISTS update_projects_updated_at ON public.projects;
CREATE TRIGGER update_projects_updated_at
BEFORE UPDATE ON public.projects
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SETUP COMPLETE
-- ============================================================================
