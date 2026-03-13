---
applyTo: "**"
description: >
  Step-by-step guide for deploying student-research-web (Next.js) to Vercel,
  including API connectivity to the Railway backend, environment variable
  management, and required codebase changes. Apply when preparing or updating
  the Vercel deployment.
---

# Vercel Deployment Guide — student-research-web

## 1. Environment Variable Configuration

### Variables required
The only env var this frontend needs is `NEXT_PUBLIC_API_URL`.
`.env.example` already documents it:
```
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

### Local development
Create `.env.local` (gitignored automatically — `.gitignore` already has `.env*`):
```
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```
Never commit this file.

### Production (Vercel)
Set the variable in the **Vercel dashboard → Project → Settings → Environment Variables**:
```
NEXT_PUBLIC_API_URL=https://<your-railway-app>.up.railway.app/api
```
Do **not** create a `.env.production` file in the repo — set it in the
Vercel dashboard only so the secret Railway URL is never committed.

### Accessing the variable in code
The `NEXT_PUBLIC_` prefix makes the value available in both server and
client-side code:
```ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
```
`lib/api/client.ts` already does this correctly. No change needed there.

---

## 2. API Client — Already Correct

`lib/api/client.ts` already reads from the env var with a localhost fallback:

```ts
// CORRECT — already in lib/api/client.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
```

Do **not** hardcode the backend URL anywhere:
```ts
// WRONG — never do this
const res = await fetch('http://localhost:4000/api/projects');

// CORRECT — always use the api helpers from lib/api/
import { getProjects } from '@/lib/api';
const { data, error } = await getProjects();
```

All API calls must go through `lib/api/<domain>.ts` wrappers, which call
`get<T>`, `post<T>`, etc. from `lib/api/client.ts`. Never place raw `fetch`
calls with a hardcoded URL in components or pages.

---

## 3. `next.config.ts` — Production Image Domains

`next.config.ts` already proxies `/uploads/:path*` to the Railway backend
at runtime (using the `NEXT_PUBLIC_API_URL` value), so file URLs in the DB
continue to work in production without any path changes.

However, the `remotePatterns` list only allows `localhost:4000` for Next.js
`<Image>` optimization. Add the Railway hostname so production avatar/file
images are not blocked:

**Before (`next.config.ts`):**
```ts
{
  protocol: 'http',
  hostname: 'localhost',
  port: '4000',
  pathname: '/uploads/**',
},
```

**After:**
```ts
{
  protocol: 'http',
  hostname: 'localhost',
  port: '4000',
  pathname: '/uploads/**',
},
{
  protocol: 'https',
  hostname: '<your-railway-app>.up.railway.app',
  pathname: '/uploads/**',
},
```

Replace `<your-railway-app>` with the actual Railway subdomain once known.
Commit this change — it is not a secret.

---

## 4. Pre-Deployment Checklist

### Build command
`package.json` already has:
```json
"scripts": {
  "build": "next build",
  "start": "next start"
}
```
Vercel auto-detects Next.js and runs `next build` with no configuration needed.
Output directory is `.next/` — this is the Next.js default; do not change it.

### Dependencies
All runtime dependencies are in `dependencies`. Type packages and build tools
are in `devDependencies`. No change needed.

### SSR / client-side API calls
- `lib/api/client.ts` uses `document.cookie` to read the session token and
  guards against SSR with `if (typeof document === 'undefined') return null`.
- All API calls in this project are client-side (in `useEffect` hooks). No
  `getServerSideProps` or server components make API calls, so there is no
  risk of server-side fetch missing the `NEXT_PUBLIC_` variable.
- `middleware.ts` only reads cookies — it does not call the backend — so it
  is safe in Vercel's Edge Runtime.

### `.gitignore`
Already contains `.env*` — all local env files are excluded from commits. ✓

---

## 5. Vercel Deployment Steps

### Push code
Ensure the `main` branch is up to date and pushed to GitHub.

### Import project in Vercel
1. Go to [vercel.com/new](https://vercel.com/new) → **Import Git Repository**.
2. Select the `student-research-web` repository.
3. Vercel auto-detects **Next.js** — no framework override needed.
4. Leave **Build Command**, **Output Directory**, and **Install Command** as
   auto-detected defaults.

### Set environment variables
In the Vercel project wizard (or **Settings → Environment Variables** after
import), add:

| Variable                | Value                                              | Environments        |
|-------------------------|----------------------------------------------------|---------------------|
| `NEXT_PUBLIC_API_URL`   | `https://<your-railway-app>.up.railway.app/api`    | Production, Preview |
| `NEXT_PUBLIC_API_URL`   | `http://localhost:4000/api`                        | Development         |

> Vercel lets you set the same variable with different values per environment.

### Deploy
Click **Deploy**. Vercel builds with `next build` and deploys globally.

### Verify backend connectivity
After deploy, open the Vercel URL and:
1. Try logging in — confirms `/api/auth/login` is reachable.
2. Open a project page — confirms `/api/projects` is reachable.
3. Upload an avatar — confirms the `/uploads` proxy rewrite is working.

---

## 6. CORS — Railway Backend Must Allow the Vercel Domain

After the Vercel URL is known (e.g. `https://student-research.vercel.app`),
set `CLIENT_URL` in Railway and ensure it is included in the backend's
CORS `origin` array in `src/app.js`:

```js
// student-research-api/src/app.js
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    process.env.CLIENT_URL, // set to your Vercel URL in Railway Variables
  ],
  credentials: true,
  ...
}));
```

Without this, the browser will block all API responses with a CORS error.
The backend must be redeployed after adding `CLIENT_URL`.

---

## 7. Quick Checklist Before Every Deploy

- [ ] `NEXT_PUBLIC_API_URL` set in Vercel dashboard (Production + Preview)
- [ ] Railway `CLIENT_URL` set to the Vercel domain and backend redeployed
- [ ] Railway hostname added to `remotePatterns` in `next.config.ts`
- [ ] No hardcoded `localhost` URLs in components or pages
- [ ] `.env.local` is gitignored (`.env*` rule covers it)
