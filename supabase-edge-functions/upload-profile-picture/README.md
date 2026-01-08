# Supabase Edge Function: upload-profile-picture

This edge function handles profile picture uploads to the `Profile_pictures` bucket in Supabase Storage.

## Setup Instructions

### 1. Create the Storage Bucket

First, create the `Profile_pictures` bucket in your Supabase project:

1. Go to your Supabase Dashboard
2. Navigate to **Storage**
3. Click **New bucket**
4. Name it: `Profile_pictures`
5. Set it as **Public** bucket (or configure RLS policies as needed)

### 2. Configure Bucket Policies

Set up storage policies to allow authenticated users to upload:

```sql
-- Policy: Allow authenticated users to upload their own profile pictures
CREATE POLICY "Users can upload their own profile picture"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'Profile_pictures' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow public read access to profile pictures
CREATE POLICY "Public can view profile pictures"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'Profile_pictures');

-- Policy: Allow users to update their own profile pictures
CREATE POLICY "Users can update their own profile picture"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'Profile_pictures'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow users to delete their own profile pictures
CREATE POLICY "Users can delete their own profile picture"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'Profile_pictures'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

### 3. Deploy the Edge Function

Install Supabase CLI if you haven't already:

```bash
npm install -g supabase
```

Login to Supabase:

```bash
supabase login
```

Link your project:

```bash
supabase link --project-ref <your-project-ref>
```

Deploy the function:

```bash
supabase functions deploy upload-profile-picture
```

### 4. Set Environment Variables

The function automatically uses these environment variables from Supabase:
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (for server-side operations)

These are automatically available in Supabase Edge Functions.

## API Usage

### Endpoint

```
POST https://<your-project-ref>.supabase.co/functions/v1/upload-profile-picture
```

### Headers

```
Authorization: Bearer <user-jwt-token>
Content-Type: multipart/form-data
```

### Request Body (FormData)

- `file` - The image file (JPG, JPEG, or PNG)
- `userId` - The user's UUID

### Example Usage (Frontend)

```typescript
import { supabase } from '@/lib/supabaseClient';

async function uploadProfilePicture(userId: string, file: File) {
  // Get user session token
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('Not authenticated');
  }

  // Create form data
  const formData = new FormData();
  formData.append('file', file);
  formData.append('userId', userId);

  // Upload to edge function
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/upload-profile-picture`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: formData,
    }
  );

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error);
  }

  return result.publicUrl;
}
```

### Response

#### Success (200)

```json
{
  "success": true,
  "publicUrl": "https://<project-ref>.supabase.co/storage/v1/object/public/Profile_pictures/<filename>",
  "message": "Profile picture uploaded successfully"
}
```

#### Error (400/401/403/500)

```json
{
  "success": false,
  "error": "Error message"
}
```

## Validation Rules

- **File Types**: JPG, JPEG, PNG only
- **Max File Size**: 10MB
- **Authentication**: Required (user must be logged in)
- **Authorization**: Users can only upload their own profile pictures

## Features

- ✅ File type validation (JPG, JPEG, PNG)
- ✅ File size validation (max 10MB)
- ✅ User authentication check
- ✅ Authorization check (users can only upload their own pictures)
- ✅ Automatic filename generation with timestamp
- ✅ Profile update in database
- ✅ CORS support
- ✅ Error handling

## Testing

You can test the function using curl:

```bash
curl -X POST \
  'https://<your-project-ref>.supabase.co/functions/v1/upload-profile-picture' \
  -H 'Authorization: Bearer <your-jwt-token>' \
  -F 'file=@/path/to/image.jpg' \
  -F 'userId=<user-uuid>'
```

## Troubleshooting

### 403 Forbidden Error
- Check that the `Profile_pictures` bucket exists
- Verify storage policies are correctly configured
- Ensure the user is authenticated

### 400 Bad Request
- Verify file type is JPG, JPEG, or PNG
- Check file size is under 10MB
- Ensure `userId` is provided

### 500 Internal Server Error
- Check Supabase logs in the Dashboard under **Edge Functions** → **Logs**
- Verify environment variables are set correctly
