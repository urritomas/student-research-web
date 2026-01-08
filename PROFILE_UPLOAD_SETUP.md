# Profile Picture Upload - Implementation Guide

## Overview

This implementation provides profile picture upload functionality during user onboarding with the following features:

- **File Validation**: Max 10MB, JPG/JPEG/PNG only
- **Storage**: Supabase bucket named `Profile_pictures`
- **Display**: Uploaded images appear in user dashboard and profile
- **Security**: Authentication and authorization checks

## What Was Implemented

### 1. Frontend Changes

#### Updated Files:
- [`components/NewAccountConfigModal.tsx`](components/NewAccountConfigModal.tsx)
- [`lib/completeProfile.ts`](lib/completeProfile.ts)
- [`app/(dashboard)/student/profile/page.tsx`](app/(dashboard)/student/profile/page.tsx)

#### Key Features:
- ✅ File type validation (JPG, JPEG, PNG only)
- ✅ File size validation (max 10MB)
- ✅ Real-time preview before upload
- ✅ Upload during onboarding process
- ✅ Display profile picture in dashboard header
- ✅ Display profile picture in profile page

### 2. Backend - Supabase Edge Function

#### New Files:
- [`supabase-edge-functions/upload-profile-picture/index.ts`](supabase-edge-functions/upload-profile-picture/index.ts)
- [`supabase-edge-functions/upload-profile-picture/README.md`](supabase-edge-functions/upload-profile-picture/README.md)

#### Edge Function Features:
- ✅ Authentication verification
- ✅ Authorization (users can only upload their own pictures)
- ✅ File type validation
- ✅ File size validation (10MB max)
- ✅ Automatic profile update in database
- ✅ CORS support
- ✅ Comprehensive error handling

## Setup Instructions

### Step 1: Create Supabase Storage Bucket

1. Go to your Supabase Dashboard
2. Navigate to **Storage**
3. Click **New bucket**
4. Configure:
   - **Name**: `Profile_pictures`
   - **Public**: Yes (or configure RLS policies)
   - **File size limit**: 10MB

### Step 2: Configure Storage Policies (Optional - for enhanced security)

In your Supabase SQL Editor, run:

```sql
-- Allow authenticated users to upload their own profile pictures
CREATE POLICY "Users can upload their own profile picture"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'Profile_pictures' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read access
CREATE POLICY "Public can view profile pictures"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'Profile_pictures');

-- Allow users to update their own profile pictures
CREATE POLICY "Users can update their own profile picture"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'Profile_pictures'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own profile pictures
CREATE POLICY "Users can delete their own profile picture"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'Profile_pictures'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

### Step 3: Deploy Supabase Edge Function

1. **Install Supabase CLI** (if not already installed):
   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase**:
   ```bash
   supabase login
   ```

3. **Link your project**:
   ```bash
   supabase link --project-ref <your-project-ref>
   ```
   
   You can find your project ref in the Supabase Dashboard URL:
   `https://app.supabase.com/project/<your-project-ref>`

4. **Deploy the function**:
   ```bash
   cd supabase-edge-functions
   supabase functions deploy upload-profile-picture
   ```

### Step 4: Verify Database Schema

Ensure your `users` table has the `avatar_url` column:

```sql
-- Check if column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'avatar_url';

-- If it doesn't exist, add it:
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
```

### Step 5: Test the Implementation

1. **Register a new account** or **login**
2. During onboarding, you'll see the profile picture upload option
3. Click "Upload Photo" and select an image (JPG, JPEG, or PNG, max 10MB)
4. Preview the image before submitting
5. Complete the profile setup
6. Check your dashboard - the profile picture should appear in:
   - Header (top-right corner)
   - Profile page

## How It Works

### Upload Flow

1. **User selects image** during onboarding
   - Frontend validates file type and size
   - Preview is generated using FileReader API

2. **User submits form**
   - Image file is uploaded to Supabase Storage
   - File is stored in `Profile_pictures` bucket
   - Filename format: `{userId}-{timestamp}.{extension}`

3. **Profile creation**
   - User profile is created in `users` table
   - `avatar_url` field is set to the public URL of uploaded image
   - User role is assigned

4. **Display**
   - Dashboard fetches user data including `avatar_url`
   - Avatar component displays the image
   - Falls back to initials if no image exists

### File Validation Rules

**Frontend Validation** (in `NewAccountConfigModal.tsx`):
- File types: `image/jpeg`, `image/jpg`, `image/png`
- Max size: 10MB (10,485,760 bytes)
- Shows error message if validation fails

**Backend Validation** (in Edge Function):
- Verifies user authentication
- Checks authorization (user can only upload their own picture)
- Validates file type
- Validates file size
- Returns detailed error messages

## API Reference

### Edge Function Endpoint

```
POST https://<your-project-ref>.supabase.co/functions/v1/upload-profile-picture
```

**Headers:**
```
Authorization: Bearer <user-jwt-token>
Content-Type: multipart/form-data
```

**Body (FormData):**
- `file`: Image file (File object)
- `userId`: User's UUID (string)

**Success Response (200):**
```json
{
  "success": true,
  "publicUrl": "https://.../Profile_pictures/filename.jpg",
  "message": "Profile picture uploaded successfully"
}
```

**Error Response (400/401/403/500):**
```json
{
  "success": false,
  "error": "Error message"
}
```

## Troubleshooting

### Issue: "Failed to upload avatar"

**Possible causes:**
1. Storage bucket doesn't exist
2. Bucket name is incorrect
3. User doesn't have upload permissions

**Solution:**
- Verify bucket name is exactly `Profile_pictures`
- Check bucket policies in Supabase Dashboard
- Ensure bucket is public or RLS policies are configured

### Issue: "Image size must be less than 10MB"

**Cause:** File exceeds 10MB limit

**Solution:**
- Compress the image before uploading
- Use a smaller/lower resolution image

### Issue: "Invalid file type"

**Cause:** File is not JPG, JPEG, or PNG

**Solution:**
- Convert image to JPG or PNG format
- Use a supported file type

### Issue: Profile picture not displaying

**Possible causes:**
1. `avatar_url` not saved in database
2. Image URL is broken
3. Bucket is not public

**Solution:**
- Check database: `SELECT avatar_url FROM users WHERE id = '<user-id>'`
- Test the URL directly in browser
- Verify bucket is public or has correct RLS policies

### Issue: Edge function deployment fails

**Solution:**
```bash
# Ensure you're logged in
supabase login

# Verify you're linked to correct project
supabase projects list

# Link again if needed
supabase link --project-ref <your-project-ref>

# Deploy with verbose logging
supabase functions deploy upload-profile-picture --debug
```

## Files Modified/Created

### Modified:
1. ✏️ `components/NewAccountConfigModal.tsx`
   - Updated file validation to 10MB max
   - Restricted to JPG/JPEG/PNG only
   - Updated helper text

2. ✏️ `lib/completeProfile.ts`
   - Changed bucket from `avatars` to `Profile_pictures`
   - Removed folder structure (files stored at root)

3. ✏️ `app/(dashboard)/student/profile/page.tsx`
   - Added profile fetching from database
   - Display uploaded avatar
   - Loading state while fetching data

### Created:
1. ✨ `supabase-edge-functions/upload-profile-picture/index.ts`
   - Edge function for secure upload handling

2. ✨ `supabase-edge-functions/upload-profile-picture/README.md`
   - Detailed edge function documentation

3. ✨ `PROFILE_UPLOAD_SETUP.md`
   - This setup guide

## Testing Checklist

- [ ] Supabase Storage bucket `Profile_pictures` exists
- [ ] Edge function is deployed successfully
- [ ] Database `users` table has `avatar_url` column
- [ ] Can upload JPG file (< 10MB)
- [ ] Can upload PNG file (< 10MB)
- [ ] Cannot upload GIF file (shows error)
- [ ] Cannot upload file > 10MB (shows error)
- [ ] Preview shows before submitting
- [ ] Profile picture appears in header after onboarding
- [ ] Profile picture appears in profile page
- [ ] Profile picture URL is saved in database

## Next Steps (Optional Enhancements)

Consider implementing these features in the future:

1. **Image Cropping**: Allow users to crop images before upload
2. **Compression**: Automatically compress large images
3. **Multiple Sizes**: Generate thumbnail versions
4. **Change Picture**: Allow users to update their profile picture later
5. **Delete Picture**: Allow users to remove their profile picture
6. **Default Avatars**: Provide default avatar options

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review Supabase logs in Dashboard > Edge Functions > Logs
3. Check browser console for frontend errors
4. Verify network requests in browser DevTools

---

**Implementation Date**: January 9, 2026  
**Status**: ✅ Complete and ready for testing
