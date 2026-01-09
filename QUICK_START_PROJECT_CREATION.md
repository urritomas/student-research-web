# Quick Start: Project Creation Feature

## Prerequisites

- Supabase project set up with authentication
- Environment variables configured
- User authentication working

## Step 1: Install Dependencies

```bash
pnpm install uuid
pnpm install -D @types/uuid
```

## Step 2: Set Up Database

1. Open your Supabase project dashboard
2. Go to SQL Editor
3. Copy and paste the entire contents of `database-setup-projects.sql`
4. Click "Run" to execute the script

This creates:
- ✅ `projects` table
- ✅ `project_members` table  
- ✅ `project_documents` storage bucket
- ✅ RLS policies
- ✅ Indexes and triggers

## Step 3: Verify Setup

Check in Supabase Dashboard:

1. **Table Editor** → Should see `projects` and `project_members` tables
2. **Storage** → Should see `project_documents` bucket
3. **Authentication → Policies** → Verify RLS policies are created

## Step 4: Test the Feature

1. Start dev server:
   ```bash
   pnpm dev
   ```

2. Login as a student user

3. Navigate to "My Projects" page

4. Click "New Project" button

5. Fill in the form:
   - **Title**: "My Test Project"
   - **Description**: "This is a test project to verify the feature works"
   - **Document**: Upload a PDF or enter a URL (optional)

6. Click "Create Project"

7. ✅ You should be redirected to the project detail page
8. ✅ Project code should be visible and copyable
9. ✅ Document link should work (if attached)

## Step 5: Verify in Database

1. Go to Supabase **Table Editor**
2. Open `projects` table
3. You should see your newly created project with:
   - Generated `id` and `project_code`
   - Title and description
   - `status`: "proposal"
   - `project_type`: "research"
   - `created_by`: Your user ID
   - `document_reference`: File URL or external link (if provided)

4. Open `project_members` table
5. You should see an entry with:
   - Your `user_id`
   - `role`: "leader"
   - Linked to your project

## Common Issues & Solutions

### Issue: "Unauthorized" error
**Solution**: Make sure you're logged in and authentication is working

### Issue: File upload fails
**Solution**: 
- Check storage bucket exists in Supabase
- Verify RLS policies on storage
- Ensure file is under 10MB and is PDF/DOC/DOCX

### Issue: Project not appearing in list
**Solution**:
- Check RLS policies on `projects` table
- Verify the query in `/student/projects/page.tsx` is correct
- Check browser console for errors

### Issue: "Table projects does not exist"
**Solution**: Run the `database-setup-projects.sql` script in Supabase SQL Editor

## File Locations

```
📁 Feature Files
├── app/(dashboard)/student/projects/create/page.tsx    # Create form
├── app/(dashboard)/student/projects/[id]/page.tsx      # Detail view
├── app/api/projects/create/route.ts                    # API handler
├── database-setup-projects.sql                         # Database schema
├── PROJECT_CREATION_GUIDE.md                          # Full documentation
└── QUICK_START_PROJECT_CREATION.md                    # This file
```

## What's Next?

After successful setup, you can:

1. **Add More Projects**: Test creating multiple projects
2. **Test Document Upload**: Try both file upload and URL options
3. **Review Project Code**: Use it for team invitations (feature to be built)
4. **Explore Project Details**: Click on projects in the list to view details

## Need Help?

- 📖 Read the full [PROJECT_CREATION_GUIDE.md](./PROJECT_CREATION_GUIDE.md)
- 🔍 Check browser console for client-side errors
- 📊 Check Supabase logs for server-side errors
- 🗄️ Verify data in Supabase Table Editor

---

**Estimated Setup Time**: 5-10 minutes

**Status**: Ready for testing and development
