import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const { projectCode, userId } = await request.json();

    if (!projectCode || !userId) {
      return NextResponse.json(
        { error: 'Project code and user ID are required' },
        { status: 400 }
      );
    }

    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Create Supabase client with the user's access token
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    // Verify the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user || user.id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Find project by project_code
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, title')
      .eq('project_code', projectCode)
      .single();

    if (projectError) {
      console.error('Project lookup error:', projectError);
      return NextResponse.json(
        { error: `Invalid project code. Project not found. Details: ${projectError.message}` },
        { status: 404 }
      );
    }

    if (!project) {
      return NextResponse.json(
        { error: 'Invalid project code. Project not found.' },
        { status: 404 }
      );
    }

    // Get user's role from user_roles table
    const { data: userRole, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();

    if (roleError) {
      console.error('User role lookup error:', roleError);
      return NextResponse.json(
        { error: `Unable to determine user role. Details: ${roleError.message}` },
        { status: 400 }
      );
    }

    if (!userRole) {
      return NextResponse.json(
        { error: 'Unable to determine user role' },
        { status: 400 }
      );
    }

    // Determine member role based on user's role
    let memberRole: string;
    if (userRole.role === 'student') {
      memberRole = 'student'; // Students join as students
    } else if (userRole.role === 'adviser') {
      memberRole = 'adviser'; // Advisers join as advisers
    } else {
      memberRole = 'student'; // Default fallback
    }

    // Check if user is already a member
    const { data: existingMember, error: checkError } = await supabase
      .from('project_members')
      .select('id, status')
      .eq('project_id', project.id)
      .eq('user_id', userId)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing membership:', checkError);
      return NextResponse.json(
        { error: 'Failed to check membership status' },
        { status: 500 }
      );
    }

    if (existingMember) {
      if (existingMember.status === 'accepted') {
        return NextResponse.json(
          { error: 'You are already a member of this project' },
          { status: 400 }
        );
      } else {
        // Update existing invitation to accepted
        const { error: updateError } = await supabase
          .from('project_members')
          .update({
            status: 'accepted',
            responded_at: new Date().toISOString(),
          })
          .eq('id', existingMember.id);

        if (updateError) {
          console.error('Error updating membership:', updateError);
          return NextResponse.json(
            { error: 'Failed to join project' },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          message: 'Successfully joined the project',
          project: {
            id: project.id,
            title: project.title,
          },
        });
      }
    }

    // Add user to project_members table
    const { data: newMember, error: insertError } = await supabase
      .from('project_members')
      .insert({
        project_id: project.id,
        user_id: userId,
        role: memberRole,
        status: 'accepted', // Auto-accept when joining via code
        responded_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error adding member:', insertError);
      return NextResponse.json(
        { error: `Failed to join project. Details: ${insertError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully joined the project',
      project: {
        id: project.id,
        title: project.title,
      },
      member: newMember,
    });
  } catch (error) {
    console.error('Error in join project API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
