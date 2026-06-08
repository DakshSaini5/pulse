# Pulse — Comprehensive Production-Readiness Code Review

## Executive Summary

**Pulse** is an ambitious AI-powered healthcare navigation SaaS platform built with a **React/Vite/Tailwind** frontend and an **Express/TypeScript/Prisma** backend. The codebase demonstrates solid foundational architecture: clean separation of concerns between frontend and backend, consistent use of Zod validation, thoughtful rate-limiting tiers, Gemini AI integration with a circuit breaker, graceful fallback/simulator modes, and an adapter pattern for hospital data providers. The team has clearly iterated and bug-fixed aggressively (many `BUG-XX FIX` annotations), and the overall code quality is meaningfully above average for a project at this stage.

However, the repository has **critical gaps** that block production deployment, particularly around **security** (hardcoded credentials in a committed test file, OTP leaked in API responses, mock auth bypass in production-reachable code), **testing** (zero automated tests), and **reliability** (duplicate graceful shutdown handlers, PrismaClient leak in socket handler, unbounded queries). These must be resolved before any production traffic is served — especially given this is a healthcare application handling sensitive medical data.

### Main Strengths
- Well-organized monorepo with clear `frontend/` and `backend/` separation
- Comprehensive Zod validation schemas on auth and user input endpoints
- Tiered rate limiting (auth, AI, upload, search, general) with IP key extraction
- Circuit breaker pattern on Gemini API with graceful simulator fallback
- Adapter pattern for hospital providers (`IHospitalProvider` → `GooglePlacesAdapter`)
- Prompt injection prevention with `sanitizeForPrompt()` and anti-injection preambles
- Proper CORS, Helmet, HSTS, and HTTP→HTTPS redirect in production
- Graceful shutdown handlers for SIGTERM/SIGINT with DB disconnect
- Healthcare-appropriate AI safety: no diagnostic labels, disclaimers, structured output
- Good use of Prisma `onDelete: Cascade` across all relation chains
- Lazy loading of heavy frontend pages (Search, HospitalDetail, ReportCenter)
- OTP-based email verification for registration and email change

### Main Risks
- **🔴 CRITICAL: Hardcoded API key + brute-force script committed** — [scratch_test_cloudinary.js](file:///Users/deepaksingh/Documents/GitHub/pulse-dev/backend/scratch_test_cloudinary.js) contains a real Cloudinary API key and a brute-force secret cracker
- **🔴 CRITICAL: OTP leaked in API responses** — `devOtp` returned in response body even when `NODE_ENV` isn't set or is misconfigured
- **🔴 CRITICAL: Zero automated test coverage** — No unit, integration, or e2e tests exist
- **🟠 HIGH: Mock Firebase auth accepts bypass tokens in production** if Firebase isn't configured
- **🟠 HIGH: Duplicate PrismaClient instances** — `chatSocket.ts` creates its own `new PrismaClient()` instead of using the shared singleton
- **🟠 HIGH: Unbounded notifications query** — No pagination or limit on notification fetch
- **🟠 HIGH: Missing `trust proxy` configuration** despite rate limiter relying on `x-forwarded-for`

### Production Readiness Verdict: **NOT READY**

The codebase needs ~1-2 focused sprints to address the critical security issues, add basic test coverage, and fix the reliability gaps documented below.

---

## 1. Repository Overview

| Dimension | Details |
|-----------|---------|
| **Stack** | React 18 + Vite 5 + TailwindCSS 3 (frontend) / Express 4 + TypeScript 5 + Prisma 5 (backend) |
| **Database** | PostgreSQL via Prisma ORM (with SQLite fallback mentioned in docs) |
| **AI** | Google Gemini 2.5 Flash (with multi-model fallback cascade) |
| **Auth** | JWT + bcrypt (email/password), Google OAuth2, Firebase Phone Auth |
| **File Storage** | Cloudinary (prescriptions, reports) |
| **Real-time** | Socket.IO (AI chat assistant) |
| **External APIs** | Twilio (emergency SMS), Resend (email OTPs), BigDataCloud (reverse geocoding), Google Places |
| **Deployment** | Vercel (frontend), Render-style (backend) — `vercel.json` present |
| **CI/CD** | ❌ None configured |
| **Docker** | ❌ None |
| **Tests** | ❌ None (`"test": "echo \"Error: no test specified\" && exit 1"`) |

### File Count & Size (approximate)

| Area | Files | Largest File |
|------|-------|-------------|
| Backend Routes | 11 | [auth.ts](file:///Users/deepaksingh/Documents/GitHub/pulse-dev/backend/src/routes/auth.ts) (515 lines) |
| Backend Services | 7 | [ai.ts](file:///Users/deepaksingh/Documents/GitHub/pulse-dev/backend/src/services/ai.ts) (525 lines) |
| Frontend Pages | 18 | [ReportCenter.tsx](file:///Users/deepaksingh/Documents/GitHub/pulse-dev/frontend/src/pages/ReportCenter.tsx) (37KB) |
| Frontend Components | 9 | [Landing.tsx](file:///Users/deepaksingh/Documents/GitHub/pulse-dev/frontend/src/pages/Landing.tsx) (28KB) |

---

## 2. Architecture Assessment

### Strengths
- **Clean layering**: Routes → Services → Prisma ORM → PostgreSQL. No business logic leaking into route handlers.
- **Provider abstraction**: [IHospitalProvider](file:///Users/deepaksingh/Documents/GitHub/pulse-dev/backend/src/services/providers/IHospitalProvider.ts) interface allows swapping Google Places for OpenStreetMap without touching routes.
- **Smart caching**: Hospital search falls through to Google Places API when local DB has < 3 results, then caches them for future queries.
- **Context-aware AI chat**: Socket.IO chat session pre-loads user's medical history for personalized responses.

### Concerns

**Duplicate Prisma singleton issue**: [chatSocket.ts:7](file:///Users/deepaksingh/Documents/GitHub/pulse-dev/backend/src/services/chatSocket.ts#L7) creates `new PrismaClient()` instead of importing the shared instance from `db.ts`. This means:
- Connection pool is doubled, risking PostgreSQL connection exhaustion
- Graceful shutdown doesn't close this instance

**Duplicate shutdown handlers**: [db.ts:14-21](file:///Users/deepaksingh/Documents/GitHub/pulse-dev/backend/src/db.ts#L14-L21) registers its own `SIGTERM`/`SIGINT` handlers that call `process.exit(0)`, while [index.ts:158-178](file:///Users/deepaksingh/Documents/GitHub/pulse-dev/backend/src/index.ts#L158-L178) also registers shutdown handlers. The `db.ts` handlers will fire first and exit before `index.ts` can close the HTTP server. This is a **race condition** that can leave in-flight requests orphaned.

**Monolithic page components**: Several frontend pages are very large (ReportCenter: 37KB, Settings: 36KB, Search: 33KB). These would benefit from component decomposition.

---

## 3. Code Quality Review

### Positives
- Consistent naming conventions (camelCase for variables, PascalCase for types/components)
- Good use of TypeScript strict mode in both frontend and backend
- Error messages are user-friendly and don't leak internals in production
- Consistent pagination pattern across all list endpoints
- Clean use of `Promise.all()` for parallel OCR + Cloudinary upload

### Issues

- **`any` type proliferation**: Route handlers widely use `(err: any)`, `(decoded: any)`, `const analysis = parseResult.result; ... analysis.values.map((v: any) => ...)`. The AI service's `safeParseJSON` returns `any`. This undermines TypeScript's value.
- **Dead code**: [test-keys.ts](file:///Users/deepaksingh/Documents/GitHub/pulse-dev/backend/test-keys.ts) and [test-ocr.ts](file:///Users/deepaksingh/Documents/GitHub/pulse-dev/backend/test-ocr.ts) are development scratch files checked in (though gitignored by pattern, they're still in the repo).
- **Timestamp artifact**: [vite.config.ts.timestamp-1780142317059-907fcf1575567.mjs](file:///Users/deepaksingh/Documents/GitHub/pulse-dev/frontend/vite.config.ts.timestamp-1780142317059-907fcf1575567.mjs) is a Vite temp file that should not be committed.
- **Inconsistent router creation**: Some routes use `Router()`, others use `express.Router()` — cosmetically inconsistent.
- **`noUnusedLocals: false`** in frontend [tsconfig.json:19](file:///Users/deepaksingh/Documents/GitHub/pulse-dev/frontend/tsconfig.json#L19) — this suppresses dead code detection.

---

## 4. Security Review

> [!CAUTION]
> **Multiple critical security issues identified. Do NOT deploy to production without resolving all Critical/High items.**

### 🔴 CRITICAL: Hardcoded Credentials in Committed File

[scratch_test_cloudinary.js](file:///Users/deepaksingh/Documents/GitHub/pulse-dev/backend/scratch_test_cloudinary.js) contains:
- A **real Cloudinary API key** (`354338881984514`) hardcoded on line 4
- A **brute-force script** that tries thousands of API secret variations

Even though `.gitignore` has `backend/scratch_*`, this file is **already tracked** in the repo. The API key is exposed in git history forever.

**Business Impact**: Attacker can upload arbitrary files to your Cloudinary account, exhaust storage, or use it as a CDN for malicious content.

**Fix**: Rotate the Cloudinary API key immediately. Remove the file from git history with `git filter-branch` or BFG Repo Cleaner.

---

### 🔴 CRITICAL: OTP Leaked in API Responses

[auth.ts:88-93](file:///Users/deepaksingh/Documents/GitHub/pulse-dev/backend/src/routes/auth.ts#L88-L93):
```typescript
const devMode = process.env.NODE_ENV !== 'production' || !sentViaResend;
return res.json({ 
  message: 'Verification OTP has been sent to your email.',
  ...(devMode ? { devOtp: code } : {})
});
```

If `NODE_ENV` is not explicitly set to `'production'` (common misconfiguration), or if Resend fails, the **actual OTP is returned in the HTTP response**. An attacker can register/take over any email account without access to the mailbox. This pattern repeats at [auth.ts:368-373](file:///Users/deepaksingh/Documents/GitHub/pulse-dev/backend/src/routes/auth.ts#L368-L373).

**Fix**: Never return OTPs in API responses. Use `devOtp` only when `NODE_ENV === 'development'` (strict equality), never as a fallback for email delivery failure.

---

### 🟠 HIGH: Mock Firebase Auth Bypass Reachable in Production

[firebase.ts:42-49](file:///Users/deepaksingh/Documents/GitHub/pulse-dev/backend/src/config/firebase.ts#L42-L49):
```typescript
if (!firebaseEnabled || token.startsWith('mock-token-')) {
  if (token.startsWith('mock-token-')) {
    const mockPhone = token.replace('mock-token-', '');
    ...
    return { phoneNumber: mockPhone };
  }
```

If `FIREBASE_SERVICE_ACCOUNT` is not set in production (a common deployment oversight), **any** request with a `mock-token-+91XXXXXXXXXX` header can authenticate as any phone number. This allows complete account takeover.

**Fix**: Guard mock mode behind `NODE_ENV === 'development'` check. Never allow mock tokens in production.

---

### 🟠 HIGH: Missing `trust proxy` Configuration

[rateLimiter.ts:12-14](file:///Users/deepaksingh/Documents/GitHub/pulse-dev/backend/src/middleware/rateLimiter.ts#L12-L14) uses `x-forwarded-for` for rate limiting, but [index.ts](file:///Users/deepaksingh/Documents/GitHub/pulse-dev/backend/src/index.ts) never calls `app.set('trust proxy', 1)`. Without this, Express doesn't trust proxy headers, and `req.ip` may return the proxy's IP. The rate limiter comment on line 9 even acknowledges this but the fix is missing.

**Fix**: Add `app.set('trust proxy', 1)` before middleware registration.

---

### 🟡 MEDIUM: No CSRF Protection

The application uses JWT in `Authorization` headers (good — inherently CSRF-safe), but also stores tokens in `localStorage`, which is vulnerable to XSS. If any XSS vector exists, tokens can be exfiltrated.

### 🟡 MEDIUM: Password Reset Bypass Weak Validation

[auth.ts:430-431](file:///Users/deepaksingh/Documents/GitHub/pulse-dev/backend/src/routes/auth.ts#L430-L431): The password reset endpoint only requires `newPassword.length < 6`, bypassing the strong password regex used during registration (`registerSchema`). An attacker who obtains a reset token can set a weak password.

### 🟡 MEDIUM: No Input Validation on Admin Hospital Creation

[hospitals.ts:470-501](file:///Users/deepaksingh/Documents/GitHub/pulse-dev/backend/src/routes/hospitals.ts#L470-L501): The `POST /api/hospitals` admin endpoint has no Zod validation. Admin-injected data goes directly to `prisma.hospital.create()`.

### 🟡 MEDIUM: Cloudinary Config Logs Partial Secrets

[cloudinary.ts:15-20](file:///Users/deepaksingh/Documents/GitHub/pulse-dev/backend/src/config/cloudinary.ts#L15-L20) logs the first 3 and last 3 characters of the API secret. In a logging aggregator, this leaks partial credentials.

---

## 5. Performance & Scalability Review

### Positives
- Bounding-box pre-filter on hospital geospatial queries prevents full table scans
- Pagination on all list endpoints with capped `limit` values (max 50)
- Parallel OCR + Cloudinary upload via `Promise.all()`
- Prisma query logging only in development mode
- Gemini model selection cached after first successful probe

### Concerns

| Issue | Location | Impact |
|-------|----------|--------|
| **Unbounded notification query** | [notifications.ts:10-13](file:///Users/deepaksingh/Documents/GitHub/pulse-dev/backend/src/routes/notifications.ts#L10-L13) | No `take` limit — user with 10K notifications loads them all |
| **Unbounded trends query** | [trends.ts:11-14](file:///Users/deepaksingh/Documents/GitHub/pulse-dev/backend/src/routes/trends.ts#L11-L14) | No pagination — grows linearly with report uploads |
| **Scoring happens in JS, not DB** | [hospitals.ts:195-213](file:///Users/deepaksingh/Documents/GitHub/pulse-dev/backend/src/routes/hospitals.ts#L195-L213) | All hospitals in bounding box loaded into memory, scored in JS, then paginated. With 10K+ hospitals in a metro, this is O(n) memory |
| **External geocoding on every search** | [hospitals.ts:71-73](file:///Users/deepaksingh/Documents/GitHub/pulse-dev/backend/src/routes/hospitals.ts#L71-L73) | `fetchCityName()` makes an external HTTP call to BigDataCloud on every hospital search if no city param is provided |
| **In-memory rate limiting** | [rateLimiter.ts:5-9](file:///Users/deepaksingh/Documents/GitHub/pulse-dev/backend/src/middleware/rateLimiter.ts#L5-L9) | Rate limit counters reset on every server restart (acknowledged in code comments) |
| **No database connection pooling config** | [db.ts](file:///Users/deepaksingh/Documents/GitHub/pulse-dev/backend/src/db.ts) | PrismaClient created without `connection_limit` parameter for pgbouncer |
| **Gemini probe on every cold start** | [gemini.ts:12-33](file:///Users/deepaksingh/Documents/GitHub/pulse-dev/backend/src/services/gemini.ts#L12-L33) | `getWorkingModelName()` sends a real API call ("Hello") to test each model — adds latency and cost to first request |

---

## 6. Testing Review

> [!WARNING]
> **Zero automated tests exist in this repository.**

- Backend `package.json` has `"test": "echo \"Error: no test specified\" && exit 1"`
- No test framework installed (no Jest, Vitest, Mocha, or Supertest in dependencies)
- No test directories exist anywhere in the project
- No CI/CD pipeline to run tests

### Critical Missing Test Coverage
1. **Auth flows**: Registration OTP flow, login, token refresh, password reset — all untested
2. **AI prompt safety**: No tests verifying that prompt injection payloads are sanitized
3. **Hospital scoring**: The recommendation engine's weighted scoring is pure math — trivially unit-testable but not tested
4. **File upload**: Multer file type validation, size limits — not tested
5. **Authorization**: No tests verifying that users can't access other users' prescriptions/reports

---

## 7. Reliability & Error Handling Review

### Positives
- Global error handler catches unhandled exceptions without leaking stack traces
- `unhandledRejection` and `uncaughtException` handlers registered
- Graceful shutdown with 10-second forced exit timeout
- Circuit breaker on Gemini API prevents cascading failures
- Fallback simulators ensure the app works without API keys
- Cloudinary upload errors handled in upload routes

### Concerns

| Issue | Location | Severity |
|-------|----------|----------|
| **Duplicate SIGTERM handlers** causing race condition | [db.ts:20-21](file:///Users/deepaksingh/Documents/GitHub/pulse-dev/backend/src/db.ts#L20-L21) vs [index.ts:177-178](file:///Users/deepaksingh/Documents/GitHub/pulse-dev/backend/src/index.ts#L177-L178) | High |
| **Temp file not cleaned on error** | [prescriptions.ts:146-164](file:///Users/deepaksingh/Documents/GitHub/pulse-dev/backend/src/routes/prescriptions.ts#L146-L164) — `fs.unlinkSync` only runs after successful Promise.all | Medium |
| **No timeout on external geocoding call** | [hospitals.ts:12-30](file:///Users/deepaksingh/Documents/GitHub/pulse-dev/backend/src/routes/hospitals.ts#L12-L30) — `https.get()` with no timeout can hang indefinitely | Medium |
| **Delete account without deleting Cloudinary files** | [user.ts:250-263](file:///Users/deepaksingh/Documents/GitHub/pulse-dev/backend/src/routes/user.ts#L250-L263) — user deleted but uploaded files remain in Cloudinary | Low |
| **No idempotency on OTP creation** | Multiple OTP endpoints lack idempotency — rapid clicks create duplicate OTPs | Low |
| **Socket.IO chat has no rate limiting** | [chatSocket.ts:127](file:///Users/deepaksingh/Documents/GitHub/pulse-dev/backend/src/services/chatSocket.ts#L127) — user can spam unlimited Gemini requests via WebSocket | High |

---

## 8. Documentation & Developer Experience Review

### Positives
- Comprehensive `.env.example` with descriptive comments and setup hints
- Detailed `implementation_plan.md` documenting all phases, schemas, and prompt strategies
- `DEPLOYMENT_PLAN.md` and `DEPLOYMENT_WALKTHROUGH.md` exist
- `prisma/seed.ts` for bootstrapping development data
- In-code comments explaining rate-limiter choices and bug fix rationale

### Missing
- **No README.md** in the root or either workspace
- **No API documentation** — No Swagger/OpenAPI spec, no Postman collection
- **No architecture diagram** outside the implementation plan
- **No contributing guidelines** or code style guide
- **No `CHANGELOG.md`**

---

## 9. Dependency & Tooling Review

### Backend Dependencies

| Package | Version | Concern |
|---------|---------|---------|
| `express` | ^4.18.2 | Good, stable LTS |
| `@prisma/client` | ^5.10.0 | Good |
| `zod` | ^4.4.3 | ⚠️ Zod v4 — frontend uses v3 (`^3.22.4`). Schema incompatibility risk if shared |
| `socket.io` | ^4.8.3 | Good |
| `twilio` | ^6.0.2 | Current |
| `@types/socket.io` | ^3.0.1 | ⚠️ Outdated — Socket.IO v4 has built-in types |

### Frontend Dependencies

| Package | Version | Concern |
|---------|---------|---------|
| `react` | ^18.2.0 | Good, stable |
| `firebase` | ^12.14.0 | Large bundle — should be code-split/lazy-loaded |
| `leaflet` | ^1.9.4 | Good |

### Missing Tooling
- ❌ **No ESLint config** despite the `lint` script referencing it
- ❌ **No Prettier config** — no formatting standardization
- ❌ **No Husky/lint-staged** for pre-commit hooks
- ❌ **No Docker/docker-compose** for reproducible development environment
- ❌ **No CI/CD pipeline** (GitHub Actions, etc.)

### `.gitignore` Review
Good coverage overall. The `backend/scratch_*` pattern is correct but the file was tracked before the pattern was added. The `*.timestamp-*` pattern should catch the Vite temp file.

---

## 10. Technology-Specific Best Practices

### Express/Node.js
- ✅ Config via environment variables
- ✅ Input validation via Zod on most endpoints
- ✅ Rate limiting on auth and AI endpoints
- ✅ Helmet + CORS configured
- ⚠️ Missing `app.set('trust proxy', 1)`
- ❌ No structured logging (uses `console.log/error`)
- ❌ No health check readiness probe (has `/health` but no DB/Redis check)

### React/Vite Frontend
- ✅ React Query for server state management
- ✅ Lazy loading for heavy pages
- ✅ Token interceptor on Axios
- ✅ 401 auto-redirect with loop prevention
- ⚠️ Very large monolithic page components (36KB Settings.tsx)
- ⚠️ `localStorage` for token storage (XSS vulnerable)
- ❌ No `ErrorBoundary` component visible

### Prisma/TypeScript
- ✅ Strict mode enabled
- ✅ Proper cascade deletes on all relations
- ✅ Database indexes on frequently queried columns
- ⚠️ Many `any` types throughout services and routes
- ⚠️ No migration files visible (using `db push` only)

---

## Prioritized Issue List

### 🔴 Critical

```
1. Severity: Critical
   File: backend/scratch_test_cloudinary.js:4
   Issue: Hardcoded Cloudinary API key and brute-force credential script committed to git
   Business Impact: Cloud storage account compromise, potential CDN abuse, data exposure
   Recommendation: Rotate Cloudinary credentials immediately. Purge from git history with BFG Repo Cleaner. Remove file.
```

```
2. Severity: Critical
   File: backend/src/routes/auth.ts:88-93, :368-373
   Issue: OTP verification codes returned in API response when email delivery fails or NODE_ENV is not "production"
   Business Impact: Complete authentication bypass — attacker can register/reset password for any email without mailbox access
   Recommendation: Only return devOtp when NODE_ENV === 'development' (strict). Never use email delivery failure as fallback logic.
```

```
3. Severity: Critical
   File: (entire project)
   Issue: Zero automated test coverage — no unit, integration, or e2e tests
   Business Impact: Regressions go undetected. Healthcare data processing has no safety net.
   Recommendation: Add Jest + Supertest for backend. Add Vitest for frontend. Minimum: test auth flows, AI sanitization, scoring engine.
```

### 🟠 High

```
4. Severity: High
   File: backend/src/config/firebase.ts:42-49
   Issue: Mock Firebase auth bypass (mock-token-*) accessible if FIREBASE_SERVICE_ACCOUNT not set, regardless of NODE_ENV
   Business Impact: Account takeover via any phone number in production if Firebase not configured
   Recommendation: Guard mock mode with NODE_ENV === 'development'. Throw hard errors in production if Firebase isn't configured.
```

```
5. Severity: High
   File: backend/src/services/chatSocket.ts:7
   Issue: Creates a separate PrismaClient instead of using the shared singleton from db.ts
   Business Impact: PostgreSQL connection pool exhaustion, missed graceful shutdown for this client
   Recommendation: Import { prisma } from '../db' instead of instantiating new PrismaClient().
```

```
6. Severity: High
   File: backend/src/services/chatSocket.ts:127
   Issue: WebSocket chat messages have no rate limiting — user can send unlimited messages
   Business Impact: Gemini API cost abuse, token exhaustion, potential DoS
   Recommendation: Implement per-socket message throttling (e.g., max 10 messages/minute).
```

```
7. Severity: High
   File: backend/src/index.ts (missing)
   Issue: app.set('trust proxy', 1) not configured despite rate limiter using x-forwarded-for
   Business Impact: Rate limiting may not work correctly behind reverse proxies (Render, Vercel)
   Recommendation: Add app.set('trust proxy', 1) after Express app initialization.
```

```
8. Severity: High
   File: backend/src/db.ts:14-21 vs backend/src/index.ts:158-178
   Issue: Duplicate SIGTERM/SIGINT handlers — db.ts calls process.exit(0) before index.ts can close HTTP server
   Business Impact: In-flight HTTP requests orphaned during graceful shutdown
   Recommendation: Remove shutdown handlers from db.ts. Let index.ts orchestrate full shutdown sequence.
```

### 🟡 Medium

```
9. Severity: Medium
   File: backend/src/routes/auth.ts:430-431
   Issue: Password reset endpoint only checks newPassword.length < 6, bypassing the strong password regex
   Business Impact: Users can set weak passwords after reset, negating registration security
   Recommendation: Apply the same Zod changePasswordSchema validation to the reset endpoint.
```

```
10. Severity: Medium
    File: backend/src/routes/notifications.ts:10-13
    Issue: GET /api/notifications returns all notifications without pagination or limit
    Business Impact: Memory spike and slow responses for users with many notifications
    Recommendation: Add take: 50 default limit and pagination support.
```

```
11. Severity: Medium
    File: backend/src/routes/trends.ts:11-14
    Issue: GET /api/trends returns all health trends without pagination
    Business Impact: Growing response size as users upload more reports
    Recommendation: Add pagination with configurable limit.
```

```
12. Severity: Medium
    File: backend/src/routes/hospitals.ts:12-30
    Issue: External HTTP call to BigDataCloud for reverse geocoding has no timeout
    Business Impact: Entire hospital search request hangs if BigDataCloud is down
    Recommendation: Add a 3-second timeout. Cache city results per lat/lng pair.
```

```
13. Severity: Medium
    File: backend/src/config/cloudinary.ts:15-20
    Issue: Partial API secret logged to stdout during startup
    Business Impact: Credential fragments exposed in logging aggregators
    Recommendation: Remove secret logging entirely. Log only cloud_name.
```

```
14. Severity: Medium
    File: backend/src/routes/hospitals.ts:239, :288, :397
    Issue: Hardcoded Delhi coordinates (28.6139, 77.2090) as fallback when lat/lng not provided
    Business Impact: Users without location get Delhi-centric results silently
    Recommendation: Return 400 error if coordinates missing (already done for the main search endpoint — apply consistently).
```

```
15. Severity: Medium
    File: backend/src/routes/prescriptions.ts:146-164
    Issue: Temp file not cleaned up if OCR or Cloudinary upload throws
    Business Impact: Disk space leak in /tmp on crash paths
    Recommendation: Use try/finally to ensure fs.unlinkSync(tempFilePath) always runs.
```

### 🔵 Low

```
16. Severity: Low
    File: backend/src/routes/hospitals.ts:470-501
    Issue: Admin hospital creation endpoint lacks Zod validation
    Recommendation: Add a hospitalCreateSchema with field validations.
```

```
17. Severity: Low
    File: frontend/vite.config.ts.timestamp-1780142317059-907fcf1575567.mjs
    Issue: Vite temp file committed to repo
    Recommendation: Delete and ensure .gitignore pattern catches it.
```

```
18. Severity: Low
    File: backend/package.json vs frontend/package.json
    Issue: Zod version mismatch — backend uses v4.4.3, frontend uses v3.22.4
    Recommendation: Align versions to prevent type/API incompatibilities if schemas are ever shared.
```

```
19. Severity: Low
    File: backend/src/routes/user.ts:250-263
    Issue: Account deletion doesn't clean up Cloudinary-hosted files
    Recommendation: Queue Cloudinary file deletions for the user's prescriptions and reports.
```

```
20. Severity: Low
    File: (entire project)
    Issue: No structured logging — all output is console.log/console.error
    Recommendation: Adopt winston or pino with JSON output for production observability.
```

---

## Scoring

| Category | Score | Notes |
|----------|-------|-------|
| **Code Quality** | 6.5/10 | Good structure but excessive `any` types and no linting enforcement |
| **Maintainability** | 6/10 | Clean layering but monolithic page components and no tests make refactoring risky |
| **Scalability** | 5.5/10 | In-memory scoring, unbounded queries, and in-memory rate limiting won't scale |
| **Security** | 3.5/10 | Critical credential exposure, OTP leaks, and mock auth bypass tank this score |
| **Production Readiness** | 3/10 | Zero tests, critical security gaps, and no CI/CD pipeline |

### Top 3 Fixes That Would Deliver the Most Value

1. **Fix the 3 critical security issues** (rotate Cloudinary key, remove OTP from responses, guard mock auth) — these are all < 1 hour each but eliminate the most dangerous attack vectors.

2. **Add automated test suite** — Even 30 tests covering auth flows, input validation, AI sanitization, and scoring logic would provide massive confidence for future deployments.

3. **Remove duplicate shutdown handlers from `db.ts` and fix the PrismaClient leak in `chatSocket.ts`** — Two small changes that eliminate the two biggest reliability risks.
