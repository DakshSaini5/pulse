# Configure Codebase for Deployment (Render + Vercel)

Prepare the application codebase for deployment, setting up the backend to build and run seamlessly on Render, and configuring the React frontend to target the deployed Render backend API URL when hosted on Vercel.

## User Review Required

> [!IMPORTANT]
> - **Render Environment Variables**: When deploying the backend on Render, you must configure the environment variables `DATABASE_URL` (Supabase Postgres), `JWT_SECRET`, and `GEMINI_API_KEY`.
> - **Vercel Environment Variables**: During the Vercel build configuration, you must set `VITE_API_URL` to point to your backend url on Render (e.g., `https://pulse-backend.onrender.com`).
> - **Database Seed**: The Supabase database has already been seeded or configured, but you can run `npm run prisma:db-push` from your local machine to ensure the Supabase schema matches the Prisma schema if you make any changes.

## Proposed Changes

---

### Backend Config

Update the backend build scripts to ensure Prisma client generation completes before TypeScript compilation.

#### [MODIFY] [package.json](file:///C:/Users/DAKSH%20PC/OneDrive/Desktop/pulse/backend/package.json)
* Update the `"build"` script from `"tsc"` to `"prisma generate && tsc"` so that the TypeScript compiler has access to the generated `@prisma/client` types on the build server.

---

### Frontend Deployment Settings

Add Vercel single-page application routing configurations and make the base API URL dynamic so it points to the Render instance in production.

#### [NEW] [vercel.json](file:///C:/Users/DAKSH%20PC/OneDrive/Desktop/pulse/frontend/vercel.json)
* Add a `vercel.json` file in the frontend folder to redirect all traffic back to `index.html` (SPA rewrites), avoiding 404 errors when visiting pages directly.

#### [MODIFY] [api.ts](file:///C:/Users/DAKSH%20PC/OneDrive/Desktop/pulse/frontend/src/services/api.ts)
* Change the Axios instantiation to use `import.meta.env.VITE_API_URL` when available, falling back to relative paths in development to allow Vite's proxy mapping.

---

## Verification Plan

### Automated Tests
* Validate frontend build succeeds locally by executing:
  ```powershell
  cd frontend
  npm run build
  ```
* Validate backend build succeeds locally by executing:
  ```powershell
  cd backend
  npm run build
  ```

### Manual Verification
* Inspect built frontend assets to verify `import.meta.env.VITE_API_URL` is parsed correctly.
* Verify the frontend routing rewrite configurations in `vercel.json` are syntactically valid JSON.
