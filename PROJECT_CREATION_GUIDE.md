# Project Creation Feature - Implementation Guide

## Overview

This guide covers the simple project creation feature that allows students to create research projects with minimal required information and optional document attachments.

## Features Implemented

### Frontend Components

1. **Create Project Page** (`app/(dashboard)/student/projects/create/page.tsx`)
   - Minimal form with title and description (both required)
   - Document attachment options:
     - File upload (.pdf, .doc, .docx) with 10MB limit
     - External URL input
     - Only one attachment method allowed at a time
   - Real-time validation
   - User-friendly error messages

2. **Project Detail Page** (`app/(dashboard)/student/projects/[id]/page.tsx`)
   - Displays project information
   - Shows project code for team invitations
   - Copy-to-clipboard functionality for project code
   - Document reference link (if attached)
   - Placeholder for team members section

### Backend Components

1. **API Route** (`app/api/projects/create/route.ts`)
   - Handles POST requests for project creation
   - Server-side authentication and authorization
   - File upload to Supabase Storage
   - Database operations (projects and project_members tables)
   - Comprehensive validation

### Database Schema

1. **projects table**
   - `id` - UUID primary key
   - `project_code` - UUID for team invitations
   - `title` - Project title (required)
   - `description` - Project description (required)
   - `project_type` - Default: "research"
   - `status` - Default: "proposal"
   - `paper_standard` - NULL by default
   - `keywords` - Empty array by default
   - `document_reference` - Stores file URL or external link
   - `created_by` - References auth.users
   - `created_at`, `updated_at` - Timestamps

2. **project_members table**
   - `id` - UUID primary key
   - `project_id` - References projects table
   - `user_id` - References auth.users
   - `role` - Member role (leader, member, adviser, panelist)
   - `joined_at` - Timestamp

3. **Storage Bucket**
   - `project_documents` - Public bucket for project files
   - Files organized by user ID folders

## Setup Instructions

### 1. Install Required Dependencies

```bash
pnpm install uuid
pnpm install -D @types/uuid
```

### 2. Database Setup

Run the SQL script in your Supabase project:

```bash
# In Supabase SQL Editor, run:
database-setup-projects.sql
```

This will create:
- `projects` and `project_members` tables
- `project_documents` storage bucket
- Row Level Security (RLS) policies
- Indexes for performance
- Triggers for auto-updating timestamps

### 3. Environment Variables

Ensure these are set in your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Test the Feature

1. Start the development server:
   ```bash
   pnpm dev
   ```

2. Navigate to `/student/projects`

3. Click "New Project" button

4. Fill out the form:
   - Enter a project title
   - Add a description
   - Optionally attach a document (file or URL)
   - Click "Create Project"

5. Verify redirection to project detail page

## Validation Rules

### Client-Side Validation

- **Title**: Required, cannot be empty or whitespace-only
- **Description**: Required, cannot be empty or whitespace-only
- **File Upload**:
  - Allowed types: PDF, DOC, DOCX
  - Maximum size: 10MB
  - Only one file at a time
- **URL**:
  - Must be valid URL format
  - Optional domain whitelist (can be added)
- **Attachment**: Only file OR URL allowed, not both

### Server-Side Validation

- **Authentication**: User must be authenticated
- **Authorization**: Only authenticated users can create projects
- **Title & Description**: Required fields
- **File Type**: Validated on server
- **File Size**: Enforced on server
- **URL Format**: Validated with URL constructor
- **Mutual Exclusivity**: File and URL cannot both be provided

## API Endpoint

### POST `/api/projects/create`

**Request Format**: `multipart/form-data`

**Form Fields**:
- `title` (string, required)
- `description` (string, required)
- `file` (File, optional)
- `documentUrl` (string, optional)

**Success Response** (200):
```json
{
  "success": true,
  "projectId": "uuid",
  "projectCode": "uuid",
  "message": "Project created successfully"
}
```

**Error Responses**:
- 401: Unauthorized (not authenticated)
- 400: Validation error (missing fields, invalid file, etc.)
- 500: Server error

## Security Features

### Row Level Security (RLS)

1. **Projects Table**:
   - Users can only insert projects they create
   - Users can read projects they created or are members of
   - Only creators can update/delete projects

2. **Project Members Table**:
   - Only project creators can add/remove members
   - Users can read members of projects they're part of

3. **Storage**:
   - Users can upload to their own folder
   - Public read access for all project documents
   - Users can only delete their own files

### File Upload Security

- File type validation (MIME type checking)
- File size limits enforced
- Unique filenames using UUID
- Files organized in user-specific folders
- Server-side validation prevents tampering

## File Structure

```
app/
├── (dashboard)/
│   └── student/
│       └── projects/
│           ├── page.tsx              # Projects list
│           ├── create/
│           │   └── page.tsx          # Create project form
│           └── [id]/
│               └── page.tsx          # Project detail view
├── api/
│   └── projects/
│       └── create/
│           └── route.ts              # API handler
database-setup-projects.sql           # Database schema
PROJECT_CREATION_GUIDE.md            # This file
```

## User Flow

1. **Navigate to Projects**
   - User goes to `/student/projects`
   - Sees "New Project" button

2. **Create Project**
   - Click "New Project"
   - Redirected to `/student/projects/create`
   - Fill in title and description
   - Optionally add document (file OR URL)
   - Click "Create Project"

3. **View Created Project**
   - Redirected to `/student/projects/[id]`
   - See project details, code, and document
   - Project appears in "My Projects" list with "proposal" status

4. **Share Project Code**
   - Copy project code from detail page
   - Share with team members for collaboration

## Future Enhancements

### Immediate Next Steps
- [ ] Implement team invitation using project_code
- [ ] Add project editing functionality
- [ ] Implement project deletion with confirmation
- [ ] Add project status workflow (proposal → in-progress → completed)

### Advanced Features
- [ ] Multiple document attachments
- [ ] Document versioning
- [ ] Activity timeline
- [ ] Comments and collaboration
- [ ] Real-time updates
- [ ] Email notifications
- [ ] Advanced search and filtering

## Troubleshooting

### Common Issues

1. **"Unauthorized" Error**
   - Ensure user is logged in
   - Check Supabase auth session
   - Verify middleware is working

2. **File Upload Fails**
   - Check storage bucket exists
   - Verify RLS policies are correct
   - Ensure file meets size/type requirements

3. **Project Not Appearing**
   - Check RLS policies on projects table
   - Verify user authentication
   - Check browser console for errors

4. **Database Errors**
   - Ensure all tables are created
   - Run database-setup-projects.sql
   - Check foreign key constraints

### Debug Tips

- Check browser console for client errors
- Check server logs for API errors
- Use Supabase dashboard to verify data
- Test RLS policies in SQL Editor

## Testing Checklist

- [ ] Can create project with title and description only
- [ ] Can create project with file attachment
- [ ] Can create project with URL attachment
- [ ] Cannot create project with both file and URL
- [ ] File type validation works
- [ ] File size validation works
- [ ] URL validation works
- [ ] Project code is generated correctly
- [ ] Project appears in "My Projects" list
- [ ] Project detail page loads correctly
- [ ] Document link works (if attached)
- [ ] Copy project code works
- [ ] RLS policies prevent unauthorized access
- [ ] Error messages are clear and helpful

## Support

For issues or questions:
1. Check this documentation
2. Review the code comments
3. Check Supabase logs
4. Consult the README.md for general setup

---

**Last Updated**: January 9, 2026
**Version**: 1.0.0
