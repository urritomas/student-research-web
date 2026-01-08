# Profile Picture Upload - Architecture Diagram

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER ONBOARDING FLOW                         │
└─────────────────────────────────────────────────────────────────────┘

                              ┌──────────────┐
                              │     User     │
                              │  Registers   │
                              └──────┬───────┘
                                     │
                                     ▼
                        ┌────────────────────────┐
                        │  Onboarding Page       │
                        │  /app/onboarding       │
                        └────────┬───────────────┘
                                 │
                                 ▼
                    ┌────────────────────────────┐
                    │ NewAccountConfigModal      │
                    │ - Upload Profile Picture   │
                    │ - Enter Display Name       │
                    │ - Select Role              │
                    └────────┬───────────────────┘
                             │
                             ▼
           ┌─────────────────────────────────────┐
           │     Frontend Validation             │
           │  ✓ File Type: JPG/JPEG/PNG          │
           │  ✓ File Size: Max 10MB              │
           │  ✓ Preview Generation               │
           └─────────┬───────────────────────────┘
                     │
                     ▼
        ┌────────────────────────────────────────┐
        │     Upload Options                     │
        ├────────────────────────────────────────┤
        │                                        │
        │  Option A: Direct Upload (Current)    │
        │  ┌──────────────────────────────┐    │
        │  │  lib/completeProfile.ts      │    │
        │  │  - Upload to Storage         │    │
        │  │  - Get public URL            │    │
        │  └──────────┬───────────────────┘    │
        │             │                         │
        │             ▼                         │
        │  ┌──────────────────────────────┐    │
        │  │  Supabase Storage            │    │
        │  │  Bucket: Profile_pictures    │    │
        │  └──────────┬───────────────────┘    │
        │             │                         │
        │             └──────────┐              │
        │                        │              │
        │  Option B: Edge Function (Optional)  │
        │  ┌──────────────────────────────┐    │
        │  │  Edge Function API           │    │
        │  │  /functions/v1/upload-...    │    │
        │  └──────────┬───────────────────┘    │
        │             │                         │
        │             ├─ Validate JWT           │
        │             ├─ Check Authorization    │
        │             ├─ Validate File          │
        │             │                         │
        │             ▼                         │
        │  ┌──────────────────────────────┐    │
        │  │  Supabase Storage            │    │
        │  │  Bucket: Profile_pictures    │    │
        │  └──────────┬───────────────────┘    │
        │             │                         │
        └─────────────┼─────────────────────────┘
                      │
                      ▼
          ┌───────────────────────────┐
          │  Database Update          │
          │  Table: users             │
          │  - full_name              │
          │  - email                  │
          │  - avatar_url ← URL       │
          └───────────┬───────────────┘
                      │
                      ▼
          ┌───────────────────────────┐
          │  Role Assignment          │
          │  Table: user_roles        │
          │  - user_id                │
          │  - role (student/adviser) │
          └───────────┬───────────────┘
                      │
                      ▼
          ┌───────────────────────────┐
          │  Redirect to Dashboard    │
          │  /student or /adviser     │
          └───────────┬───────────────┘
                      │
                      ▼
        ┌─────────────────────────────────┐
        │  Dashboard Display              │
        ├─────────────────────────────────┤
        │                                 │
        │  Header Component               │
        │  ┌────────────────────┐         │
        │  │ Avatar (avatar_url)│         │
        │  │ Name               │         │
        │  │ Role               │         │
        │  └────────────────────┘         │
        │                                 │
        │  Profile Page                   │
        │  ┌────────────────────┐         │
        │  │ Large Avatar       │         │
        │  │ User Details       │         │
        │  └────────────────────┘         │
        │                                 │
        └─────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────┐
│                         DATA FLOW DIAGRAM                            │
└─────────────────────────────────────────────────────────────────────┘

Client Side                      Supabase Cloud
━━━━━━━━━━━━━                   ━━━━━━━━━━━━━━━

┌─────────────┐
│  User       │
│  Selects    │──┐
│  Image      │  │
└─────────────┘  │
                 │ 1. File Selection
                 │    (JPG/PNG, <10MB)
                 ▼
┌─────────────────────────┐
│  Frontend Validation    │
│  - Type Check           │
│  - Size Check           │
│  - Preview Generation   │
└───────────┬─────────────┘
            │
            │ 2. Upload Request
            ▼
         (Option A)                    (Option B)
    ┌──────────────┐              ┌────────────────┐
    │ Storage SDK  │              │ Edge Function  │
    └──────┬───────┘              └────────┬───────┘
           │                               │
           │ 3a. Direct Upload    3b. API Call
           │                               │
           ▼                               ▼
    ┌──────────────────────────────────────────────┐
    │         Supabase Storage                     │
    │         Bucket: Profile_pictures             │
    │                                              │
    │  File: {userId}-{timestamp}.jpg              │
    └──────────────────┬───────────────────────────┘
                       │
                       │ 4. Get Public URL
                       │
                       ▼
    ┌──────────────────────────────────────────────┐
    │         Public URL                           │
    │  https://.../Profile_pictures/abc123.jpg     │
    └──────────────────┬───────────────────────────┘
                       │
                       │ 5. Save to Database
                       ▼
    ┌──────────────────────────────────────────────┐
    │         Supabase Database                    │
    │                                              │
    │  Table: users                                │
    │  ┌────────┬──────────┬────────────┐          │
    │  │ id     │ name     │ avatar_url │          │
    │  ├────────┼──────────┼────────────┤          │
    │  │ uuid-1 │ John Doe │ https://..│          │
    │  └────────┴──────────┴────────────┘          │
    └──────────────────┬───────────────────────────┘
                       │
                       │ 6. Fetch User Data
                       ▼
    ┌──────────────────────────────────────────────┐
    │         Dashboard                            │
    │                                              │
    │  useEffect(() => {                           │
    │    fetchUserProfile()                        │
    │  })                                          │
    │                                              │
    │  <Avatar src={user.avatar_url} />            │
    └──────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────┐
│                      COMPONENT INTERACTION                           │
└─────────────────────────────────────────────────────────────────────┘

Onboarding Flow:
─────────────────

/app/onboarding/page.tsx
    │
    │ Renders
    ▼
NewAccountConfigModal
    │
    │ Contains
    ├─► Avatar Component (preview)
    ├─► File Input (hidden)
    ├─► Upload Button
    ├─► Form Fields
    │
    │ On Submit
    ▼
lib/completeProfile.ts
    │
    ├─► uploadAvatar()
    │   └─► Supabase Storage Upload
    │
    ├─► upsertUserProfile()
    │   └─► Save to users table
    │
    └─► insertUserRole()
        └─► Save to user_roles table


Dashboard Flow:
───────────────

/app/(dashboard)/student/profile/page.tsx
    │
    │ useEffect
    ▼
fetchUserProfile()
    │
    │ Query
    ▼
Supabase Database
    │
    │ Returns: { full_name, email, avatar_url }
    ▼
setState(user)
    │
    │ Pass to
    ▼
DashboardLayout
    │
    │ Receives user prop
    ▼
Header Component
    │
    │ Displays
    ▼
Avatar Component
    │
    └─► <img src={user.avatar} />


┌─────────────────────────────────────────────────────────────────────┐
│                      STORAGE STRUCTURE                               │
└─────────────────────────────────────────────────────────────────────┘

Supabase Storage
└── Profile_pictures/ (bucket)
    ├── user-uuid-1-1704835200000.jpg
    ├── user-uuid-2-1704835300000.png
    ├── user-uuid-3-1704835400000.jpeg
    └── ...

Database Schema
└── public
    ├── users
    │   ├── id (uuid, PK)
    │   ├── full_name (text)
    │   ├── email (text)
    │   └── avatar_url (text) ← Points to storage URL
    └── user_roles
        ├── user_id (uuid, FK)
        └── role (text)


┌─────────────────────────────────────────────────────────────────────┐
│                      SECURITY MODEL                                  │
└─────────────────────────────────────────────────────────────────────┘

Authentication Layer:
┌────────────────────────────────────────┐
│  Supabase Auth                         │
│  - Google OAuth                        │
│  - Email/Password                      │
│  - JWT Token Generation                │
└────────────┬───────────────────────────┘
             │
             ▼
Authorization Layer:
┌────────────────────────────────────────┐
│  Storage Policies (RLS)                │
│  - Authenticated users can upload      │
│  - Public can read                     │
│  - Users can update their own          │
└────────────┬───────────────────────────┘
             │
             ▼
Validation Layer:
┌────────────────────────────────────────┐
│  Frontend:                             │
│  - File type check                     │
│  - File size check                     │
│                                        │
│  Backend (Edge Function):              │
│  - Server-side validation              │
│  - Authorization check                 │
│  - File type verification              │
│  - Size verification                   │
└────────────────────────────────────────┘
