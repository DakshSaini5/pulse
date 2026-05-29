# Deployment Configuration Walkthrough

I have completed the codebase configurations required to host your application with the backend on Render and the frontend on Vercel.

## Changes Made

### 1. Backend Build Workflow
* **File**: [package.json](file:///C:/Users/DAKSH%20PC/OneDrive/Desktop/pulse/backend/package.json)
* **Change**: Changed the `"build"` script from `"tsc"` to `"prisma generate && tsc"`.
* **Rationale**: On Render, the TypeScript compiler needs the generated `@prisma/client` types to build successfully. This script ensures Prisma client files are generated before compiler evaluation.

### 2. Frontend SPA Routing Rules
* **File**: [vercel.json](file:///C:/Users/DAKSH%20PC/OneDrive/Desktop/pulse/frontend/vercel.json) [NEW]
* **Change**: Configured redirect rewrite rules that route all frontend path requests to `/index.html`.
* **Rationale**: This prevents 404 errors when users refresh or directly load pages matching client routes (e.g. `/search` or `/login`).

### 3. Dynamic Production API Mapping
* **File**: [api.ts](file:///C:/Users/DAKSH%20PC/OneDrive/Desktop/pulse/frontend/src/services/api.ts)
* **Change**: Configured Axios to construct its base API connection URL dynamically using `import.meta.env.VITE_API_URL || ''`.
* **Rationale**: Allows the Vercel hosted client to send queries to your hosted Render domain in production, while falling back to relative paths for local development (which routes queries through Vite's config proxy).

### 4. Vite Environment Declarations
* **File**: [vite-env.d.ts](file:///C:/Users/DAKSH%20PC/OneDrive/Desktop/pulse/frontend/src/vite-env.d.ts) [NEW]
* **Change**: Added triple-slash Vite client reference directives `/// <reference types="vite/client" />`.
* **Rationale**: Fixes compiler errors related to unknown metadata types on `import.meta.env`.

---

## Verification & Testing Results

* **Backend Compilation**: Compiled successfully locally.
  ```powershell
  Environment variables loaded from .env
  Prisma schema loaded from prisma\schema.prisma
  ✔ Generated Prisma Client to .\node_modules\@prisma\client in 203ms
  ```
* **Frontend Compilation**: Built successfully with zero errors.
  ```powershell
  vite v5.4.21 building for production...
  ✓ built in 10.30s
  dist/index.html                   1.40 kB
  dist/assets/index-XZVZAWPw.css   32.97 kB
  dist/assets/index-ukjt_bSq.js   892.22 kB
  ```

---

## How to Proceed with Deployments

### A. Deploy Backend to Render
1. Create a new **Web Service** on Render and link it to your GitHub repository.
2. In the Render configuration, set:
   * **Root Directory**: `backend`
   * **Build Command**: `npm install && npm run build`
   * **Start Command**: `npm run start`
3. Add the following **Environment Variables** in Render's dashboard:
   * `DATABASE_URL` (your Supabase database connection string)
   * `JWT_SECRET` (your JWT encryption signature string)
   * `GEMINI_API_KEY` (your Google Gemini API access token)
   * `PORT` (usually set automatically by Render, but default is `5000`)

### B. Deploy Frontend to Vercel
1. Create a new **Project** on Vercel and link it to your GitHub repository.
2. In the Vercel configuration, select:
   * **Framework Preset**: `Vite`
   * **Root Directory**: `frontend`
3. Under the **Environment Variables** tab in Vercel, add:
   * `VITE_API_URL` = `https://<YOUR-RENDER-SUBDOMAIN>.onrender.com`
4. Click **Deploy**. Vercel will automatically build the static bundle and serve the app with valid routing.
