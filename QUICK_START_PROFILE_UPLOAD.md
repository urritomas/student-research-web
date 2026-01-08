# Profile Picture Upload - Quick Start Checklist

## 🚀 Before You Test

Complete these steps in order to test the profile picture upload functionality:

---

## ☑️ Setup Checklist

### 1. Database Setup (Required)

- [ ] **Open Supabase Dashboard**
  - Go to https://app.supabase.com
  - Select your project

- [ ] **Run SQL Setup Script**
  - Navigate to SQL Editor
  - Open [`database-setup-profile-pictures.sql`](database-setup-profile-pictures.sql)
  - Copy and paste the SQL commands
  - Execute the script
  - Verify the `avatar_url` column exists in `users` table

### 2. Storage Setup (Required)

- [ ] **Create Storage Bucket**
  - Go to Storage section in Supabase Dashboard
  - Click "New bucket"
  - **Name**: `Profile_pictures` (exact name, case-sensitive!)
  - **Public**: Yes (check the public bucket option)
  - Click "Create bucket"

- [ ] **Verify Bucket**
  - Bucket should appear in the list
  - Click on it to view (should be empty initially)

### 3. Environment Variables (Should Already Exist)

- [ ] **Check `.env.local` file**
  ```env
  NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
  NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
  ```
  These should already be configured for your project.

### 4. Edge Function Deployment (Optional - Not Required for Basic Functionality)

The current implementation uses **direct client-side upload** and works without the edge function.

Only deploy the edge function if you want enhanced server-side security:

- [ ] **Install Supabase CLI** (skip if already installed)
  ```bash
  npm install -g supabase
  ```

- [ ] **Login to Supabase**
  ```bash
  supabase login
  ```

- [ ] **Link Your Project**
  ```bash
  supabase link --project-ref <your-project-ref>
  ```
  Find your project ref in the Supabase Dashboard URL

- [ ] **Deploy Edge Function**
  ```bash
  cd supabase-edge-functions
  supabase functions deploy upload-profile-picture
  ```

---

## ✅ Testing Checklist

### Test the Upload Feature

- [ ] **Start Development Server**
  ```bash
  pnpm run dev
  ```

- [ ] **Create Test Account**
  - Go to http://localhost:3000/register
  - Register with a new email
  - Or use an existing account that doesn't have a profile

- [ ] **Test Onboarding Modal**
  - Should see the NewAccountConfigModal
  - Should see Avatar placeholder
  - Should see "Upload Photo" button

- [ ] **Test Valid Upload**
  - Click "Upload Photo"
  - Select a JPG or PNG file under 10MB
  - Preview should appear
  - Complete the form (name, role)
  - Click "Complete Setup"
  - Should redirect to dashboard

- [ ] **Verify Display**
  - Dashboard should load
  - Check top-right header - avatar should display
  - Go to Profile page - avatar should display

- [ ] **Test Invalid Uploads**
  
  Test 1: Wrong file type
  - [ ] Try uploading a GIF file
  - [ ] Should show error: "Please select a valid image file (JPG, JPEG, or PNG only)"
  
  Test 2: File too large
  - [ ] Try uploading a file over 10MB
  - [ ] Should show error: "Image size must be less than 10MB"

- [ ] **Verify Database**
  - Go to Supabase Dashboard → Table Editor
  - Open `users` table
  - Find your user record
  - `avatar_url` field should contain a URL like:
    `https://[project].supabase.co/storage/v1/object/public/Profile_pictures/[filename]`

- [ ] **Verify Storage**
  - Go to Supabase Dashboard → Storage
  - Open `Profile_pictures` bucket
  - Should see your uploaded file
  - Filename format: `{userId}-{timestamp}.jpg`

---

## 🐛 Troubleshooting Quick Fixes

### Issue: "Failed to upload avatar"

**Quick Fix:**
1. Check Supabase Dashboard → Storage
2. Verify bucket named `Profile_pictures` exists
3. Verify bucket is public

### Issue: Profile picture not showing

**Quick Fix:**
1. Open browser DevTools → Network tab
2. Check if image URL returns 404
3. If yes: bucket doesn't exist or is private
4. If no: check `avatar_url` in database

### Issue: "Missing authorization header"

**Quick Fix:**
1. You're trying to use the edge function but it's not deployed
2. Either deploy the edge function OR
3. The current code already works without it (uses direct upload)

### Issue: TypeScript errors in edge function file

**This is normal!**
- Edge function files use Deno imports
- VS Code shows errors but the function works when deployed
- You can ignore these errors

---

## 📋 Minimal Setup (Just to Test)

If you just want to quickly test the feature:

**Required Steps Only:**

1. ✅ Create `Profile_pictures` bucket in Supabase (Step 2)
2. ✅ Run the SQL to add `avatar_url` column (Step 1)
3. ✅ Start dev server and test upload

**Skip:**
- Edge function deployment (current code works without it)
- Storage policies (bucket is public by default)

---

## 📝 After Testing

Once everything works:

- [ ] Review [PROFILE_UPLOAD_SUMMARY.md](PROFILE_UPLOAD_SUMMARY.md) for complete overview
- [ ] Check [PROFILE_UPLOAD_SETUP.md](PROFILE_UPLOAD_SETUP.md) for detailed documentation
- [ ] See [PROFILE_UPLOAD_ARCHITECTURE.md](PROFILE_UPLOAD_ARCHITECTURE.md) for system architecture

---

## 🎯 Success Criteria

Your implementation is working correctly if:

- ✅ Can upload JPG/PNG images under 10MB during onboarding
- ✅ Cannot upload GIF or files over 10MB (shows error)
- ✅ Image preview shows before submitting
- ✅ Profile picture appears in dashboard header
- ✅ Profile picture appears in profile page
- ✅ `avatar_url` is saved in database
- ✅ File is stored in `Profile_pictures` bucket

---

**Estimated Setup Time**: 5-10 minutes  
**Estimated Testing Time**: 5 minutes  

**Total Time**: ~15 minutes to complete setup and testing

---

**Need Help?**
- Check [PROFILE_UPLOAD_SETUP.md](PROFILE_UPLOAD_SETUP.md) for troubleshooting
- Review [PROFILE_UPLOAD_ARCHITECTURE.md](PROFILE_UPLOAD_ARCHITECTURE.md) for flow diagrams
- Check Supabase logs in Dashboard
