import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

// Helper function to create Supabase server client for auth/database
async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: any }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignore errors from Server Component context
          }
        },
      },
    }
  );
}

// Note: use the server Supabase client (created per-request) for storage
// operations so RLS/auth context (auth.uid()) is preserved.

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const title = formData.get('title')?.toString();
    const description = formData.get('description')?.toString();
    const documentUrl = formData.get('documentUrl')?.toString();
    const file = formData.get('file') as File | null;

    // Validate required fields
    if (!title || !description) {
      return NextResponse.json(
        { error: 'Title and description are required' },
        { status: 400 }
      );
    }

    // Validate that only one attachment method is provided
    if (file && documentUrl) {
      return NextResponse.json(
        { error: 'Only one attachment method allowed (file OR URL)' },
        { status: 400 }
      );
    }

    // Validate URL if provided
    if (documentUrl) {
      try {
        new URL(documentUrl);
      } catch {
        return NextResponse.json(
          { error: 'Invalid URL format' },
          { status: 400 }
        );
      }
    }

    // Validate file if provided
    if (file) {
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ];
      
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          { error: 'Only PDF, DOC, and DOCX files are allowed' },
          { status: 400 }
        );
      }

      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        return NextResponse.json(
          { error: 'File size must be less than 10MB' },
          { status: 400 }
        );
      }
    }

    // Generate project code (UUID for team inviting)
    const projectCode = uuidv4();

    // Prepare project data
    const projectData: any = {
      project_code: projectCode,
      title: title.trim(),
      description: description.trim(),
      project_type: 'research',
      status: 'proposal',
      created_by: user.id,
      keywords: [],
      paper_standard: null,
    };

    // Handle document attachment
    let documentPath: string | null = null;
    
    if (file) {
      // Upload file to Supabase Storage using the server client so
      // RLS/storage policies see the authenticated user
      const fileExtension = file.name.split('.').pop();
      const timestamp = Date.now();
      const fileName = `${timestamp}_${file.name}`;
      const filePath = `${user.id}/${fileName}`;

      // Convert file to ArrayBuffer then to Uint8Array for upload
      const arrayBuffer = await file.arrayBuffer();

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('project_documents')
        .upload(filePath, arrayBuffer, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        console.error('File upload error:', uploadError);
        return NextResponse.json(
          { error: `Failed to upload document: ${uploadError.message}` },
          { status: 500 }
        );
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('project_documents')
        .getPublicUrl(filePath);

      documentPath = urlData.publicUrl;
    } else if (documentUrl) {
      documentPath = documentUrl;
    }

    // Add document reference to project metadata
    if (documentPath) {
      projectData.document_reference = documentPath;
    }

    // Insert project into database
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert(projectData)
      .select('id, project_code')
      .single();

    if (projectError) {
      console.error('Project creation error:', projectError);
      return NextResponse.json(
        { error: 'Failed to create project' },
        { status: 500 }
      );
    }

    // Add creator to project_members table as leader
    const { error: memberError } = await supabase
      .from('project_members')
      .insert({
        project_id: project.id,
        user_id: user.id,
        role: 'leader',
      });

    if (memberError) {
      console.error('Error adding project member:', memberError);
      // Note: Project was created, but member assignment failed
      // Consider if you want to rollback or continue
    }

    return NextResponse.json({
      success: true,
      projectId: project.id,
      projectCode: project.project_code,
      message: 'Project created successfully',
    });

  } catch (error: any) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
