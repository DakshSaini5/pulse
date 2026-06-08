# Pulse — AI-Powered Healthcare Navigation Platform

> Connect patients with the right hospitals, specialists, and care — intelligently.

---

## Overview

**Pulse** is a full-stack SaaS healthcare platform that helps patients navigate the Indian healthcare system using AI. It enables users to:

- 🏥 **Search & compare hospitals** by specialty, distance, and rating
- 📋 **Upload prescriptions** for AI-powered OCR and medication analysis
- 📊 **Upload medical reports** for AI health summaries and specialist recommendations
- 💬 **Chat with PulseAI** — a context-aware medical assistant using your own health history
- 🚨 **Emergency panic button** — sends your location to emergency contacts via SMS
- 🔔 **Notifications** for report processing and health alerts

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, Vite 5, TailwindCSS 3, React Query |
| **Backend** | Express 4, TypeScript 5, Prisma 5 |
| **Database** | PostgreSQL (via Supabase) |
| **AI** | Google Gemini 2.5 Flash |
| **Auth** | JWT + bcrypt, Google OAuth2, Firebase Phone Auth |
| **File Storage** | Cloudinary |
| **Real-time** | Socket.IO (AI chat) |
| **Email** | Resend |
| **SMS** | Twilio |

---

## Prerequisites

- Node.js >= 18
- npm >= 9
- A PostgreSQL database (Supabase recommended)
- API keys for: Gemini, Cloudinary, Resend, Twilio, Google OAuth, Firebase

---

## Local Development Setup

### 1. Clone the repo

```bash
git clone https://github.com/your-org/pulse.git
cd pulse
```

### 2. Backend Setup

```bash
cd backend
cp .env.example .env
# Fill in all environment variables in .env
npm install
npx prisma generate
npx prisma db push
npx ts-node prisma/seed.ts   # optional: seed sample data
npm run dev                  # starts on http://localhost:5000
```

### 3. Frontend Setup

```bash
cd frontend
cp .env.example .env.local
# Set VITE_API_URL=http://localhost:5000
npm install
npm run dev                  # starts on http://localhost:5173
```

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description |
|----------|-------------|
| `NODE_ENV` | `development` or `production` |
| `PORT` | Server port (default: 5000) |
| `DATABASE_URL` | PostgreSQL connection string (pooled) |
| `DIRECT_URL` | PostgreSQL direct connection string |
| `JWT_SECRET` | Secret for signing JWT tokens |
| `GEMINI_API_KEY` | Google Gemini AI API key |
| `GOOGLE_CLIENT_ID` | Google OAuth2 client ID |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `RESEND_API_KEY` | Resend email API key |
| `SENDER_EMAIL` | From address for emails |
| `TWILIO_ACCOUNT_SID` | Twilio Account SID |
| `TWILIO_AUTH_TOKEN` | Twilio Auth Token |
| `TWILIO_PHONE_NUMBER` | Twilio phone number |
| `FIREBASE_SERVICE_ACCOUNT` | Path to Firebase service account JSON or JSON string |
| `FRONTEND_URL` | Allowed frontend origin (e.g. https://pulse.vercel.app) |
| `REDIS_URL` | Optional: Redis URL for persistent rate limiting |

### Frontend (`frontend/.env.local`)

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API base URL |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth2 client ID |
| `VITE_FIREBASE_*` | Firebase project config values |

---

## Scripts

### Backend
```bash
npm run dev          # Development server with hot reload
npm run build        # Compile TypeScript
npm run start        # Start compiled production server
npm run seed         # Seed database with sample data
```

### Frontend
```bash
npm run dev          # Development server
npm run build        # Production build
npm run preview      # Preview production build locally
npm run lint         # Run ESLint
```

---

## Project Structure

```
pulse/
├── backend/
│   ├── src/
│   │   ├── config/          # Firebase, Cloudinary config
│   │   ├── middleware/       # Auth, rate limiting, validation
│   │   ├── routes/          # Express route handlers
│   │   ├── services/        # AI, chat socket, hospital provider
│   │   └── index.ts         # App entry point
│   └── prisma/
│       └── schema.prisma    # Database schema
└── frontend/
    └── src/
        ├── components/      # Reusable UI components
        ├── context/         # React context (Auth, Theme)
        ├── pages/           # Route-level page components
        └── services/        # API client (axios)
```

---

## Deployment

See [DEPLOYMENT_PLAN.md](./DEPLOYMENT_PLAN.md) and [DEPLOYMENT_WALKTHROUGH.md](./DEPLOYMENT_WALKTHROUGH.md) for full deployment instructions.

**Frontend**: Deploy to Vercel — `vercel.json` is already configured.

**Backend**: Deploy to Render — set all environment variables in the Render dashboard.

---

## Security Notes

- JWT tokens are stored in `localStorage` (XSS-vulnerable) — consider moving to `httpOnly` cookies in future
- OTP codes are **never** returned in API responses — they are only delivered via email
- Mock Firebase auth (`mock-token-*`) is **only** available in `NODE_ENV=development`
- Rate limiting is applied on all auth, AI, upload, and search endpoints

---

## License

Private and proprietary. All rights reserved.
