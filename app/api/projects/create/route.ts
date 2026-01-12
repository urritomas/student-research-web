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
    const description = formData.get('abstract')?.toString();
    const researchType = formData.get('researchType')?.toString();
    const program = formData.get('program')?.toString();
    const course = formData.get('course')?.toString();
    const section = formData.get('section')?.toString();
    const keywordsJson = formData.get('keywords')?.toString();
    const file = formData.get('file') as File | null;
    
    // Parse keywords array
    let keywords: string[] = [];
    if (keywordsJson) {
      try {
        keywords = JSON.parse(keywordsJson);
      } catch {
        keywords = [];
      }
    }

    // Validate required fields
    if (!title || !description) {
      return NextResponse.json(
        { error: 'Title and description are required' },
        { status: 400 }
      );
    }

    // Validate paper standard
    if (!researchType || !['IMRAD', 'IAAA', 'custom'].includes(researchType)) {
      return NextResponse.json(
        { error: 'Valid paper standard is required (IMRAD, IAAA, or custom)' },
        { status: 400 }
      );
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
      abstract: description.trim(),
      program: program?.trim() || null,
      course: course?.trim() || null,
      section: section?.trim() || null,
      project_type: 'independent',
      status: 'draft',
      paper_standard: researchType,
      created_by: user.id,
      keywords: keywords,
    };

    // Insert project into database first to get project ID
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

    // Handle document upload if file is provided
    if (file) {
      try {
        // Upload file to Supabase Storage using recommended path structure
        // Path: projects/{projectId}/{filename}
        const fileExtension = file.name.split('.').pop();
        const timestamp = Date.now();
        const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const fileName = `${timestamp}_${sanitizedFileName}`;
        const filePath = `projects/${project.id}/${fileName}`;

        // Convert file to ArrayBuffer for upload
        const arrayBuffer = await file.arrayBuffer();

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('project_documents')
          .upload(filePath, arrayBuffer, {
            contentType: file.type,
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          console.error('File upload error:', uploadError);
          // Document upload failed, but project was created
          // Update project with error note or delete project?
          // For now, we'll continue and return a warning
          return NextResponse.json(
            { 
              success: true,
              projectId: project.id,
              projectCode: project.project_code,
              warning: `Project created but document upload failed: ${uploadError.message}`
            },
            { status: 201 }
          );
        }

        // Get public URL for the uploaded document
        const { data: urlData } = supabase.storage
          .from('project_documents')
          .getPublicUrl(filePath);

        // Update project with document reference
        const { error: updateError } = await supabase
          .from('projects')
          .update({ document_reference: urlData.publicUrl })
          .eq('id', project.id);

        if (updateError) {
          console.error('Error updating project with document reference:', updateError);
          // Document uploaded but reference not saved - continue anyway
        }
      } catch (uploadErr: any) {
        console.error('Unexpected error during file upload:', uploadErr);
        // Project created, file upload failed
        return NextResponse.json(
          { 
            success: true,
            projectId: project.id,
            projectCode: project.project_code,
            warning: 'Project created but document upload encountered an error'
          },
          { status: 201 }
        );
      }
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
