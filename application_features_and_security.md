# Applywise - Application Features, Architecture, & Security

Applywise is a comprehensive job tracking and resume analysis platform built with Next.js 16, Supabase, and AI (Gemini).

## Core Features & Flow

### 1. Unified Authentication System
- **Flow**: User accesses the platform -> Prompted to log in via Google OAuth or Magic Link -> Supabase Auth issues an active session -> Middleware (Proxy) ensures protected routes redirect to `/auth` if the session is invalid.
- **Components**: `src/app/auth/page.tsx`, `src/proxy.ts`, `src/lib/supabase/client.ts`.

### 2. Intelligent Job Tracking Dashboard (The Core)
- **Flow**: User views dashboard -> The server pre-fetches applications scoped strictly to the user via RLS and server-side Supabase API -> Client component renders KPI cards (Interviews, Offers, Tracked) and dynamically displays the user's name and greeting.
- **Components**: `src/app/dashboard/page.tsx`, `src/app/dashboard/DashboardClient.tsx`.

### 3. Application Management (CRM)
- **Flow**: User adds an application (Company, Role, Link, Status, Notes) -> System triggers a POST request to `/api/applications` -> Server verifies session `user.id` -> Application is inserted into Supabase `applications` table and local IndexedDB/Cache -> UI updates optimistically.
- **Components**: `src/app/jobs/page.tsx`, `src/app/application/page.tsx`, `src/app/api/applications/route.ts`.

### 4. AI Resume Analyzer & Match Scoring
- **Flow**: User uploads a Resume PDF and pastes a Job Description -> PDF.js parses the text locally in the browser -> App sends the text and JD to the AI Service -> Gemini evaluates the resume, identifying Missing Skills, Keywords, and generating an ATS Match Score -> The insights are displayed on the UI.
- **Feature Addition**: Users can bypass manual upload if they have a Default Resume configured in their profile.
- **Components**: `src/app/analyzer/page.tsx`, `src/services/aiService.ts`, `src/hooks/useFileUpload.ts`.

### 5. Profile & Settings (Zero-Friction Default Resume)
- **Flow**: User goes to Settings -> Uploads their standard Resume PDF -> App parses text and upserts into the Supabase `profiles` table matching their `user.id` -> Now, the Analyzer page defaults to this saved resume immediately upon opening.
- **Components**: `src/app/settings/page.tsx`, `src/components/Topbar.tsx`.

### 6. Chrome Extension Sync
- **Flow**: The user browses LinkedIn or Indeed via Chrome extension -> Clicks "Save Job" -> Extension hits `/api/applications` (CORS enabled) -> Job is saved directly to their dashboard.

---

## Security & Vulnerability Analysis

The application has been audited for common attack vectors.

### 1. Data Isolation & Access Control (Strong)
- **Row Level Security (RLS)**: Data is protected at the database level. Queries on `applications` and `profiles` require a valid authenticated token.
- **Server-Side Enforcement**: API routes (e.g., `/api/applications/route.ts`) aggressively fetch the `userId` directly from the authenticated server token (`supabase.auth.getUser()`) instead of trusting client payloads.
- **Result**: Cross-tenant data leakage is theoretically impossible assuming Supabase RLS is configured correctly.

### 2. Dependency Vulnerabilities (Moderate - Acknowledged)
- **PostCSS XSS**: The `npm audit` report flagged a moderate severity issue in `postcss < 8.5.10` (used internally by Next.js).
    - **Risk**: XSS via Unescaped `</style>` in CSS stringify output.
    - **Mitigation**: As Next.js patches their internal dependency tree, running an `npm install next@latest` in the future will clear this. It poses low practical risk as the app does not allow user-generated CSS to be injected or stringified.

### 3. XSS (Cross-Site Scripting) (Low Risk)
- **Mitigation**: React naturally escapes all variable injections (e.g., job notes, descriptions) preventing standard XSS. AI-generated markdown is handled via specific, safe rendering pipelines. 

### 4. Injection & AI Prompt Injection (Low Risk)
- **Database**: Supabase (PostgreSQL) uses parameterized queries inherently via its SDK, preventing SQL injection.
- **AI Service**: While a user could theoretically paste a malicious job description attempting to "jailbreak" the ATS scoring prompt (Prompt Injection), the consequence is limited to generating a funny output on their own screen. They cannot access other users' data or execute code on the server through the Gemini prompt.

### 5. CSRF (Cross-Site Request Forgery) (Low Risk)
- Supabase authentication tokens and Next.js internal API mechanics largely mitigate traditional CSRF attacks, especially since state-mutating requests rely on the `Authorization` header containing the user's JWT.

### Recommendation Checklist for Production:
1. Ensure Supabase RLS is strictly enabled via the Supabase dashboard SQL editor for `profiles` and `applications`.
2. Monitor Next.js updates to resolve the `postcss` dependency warning.
3. Keep the `PDF.js` worker CDN URL updated or host the worker file locally (`pdf.worker.min.js` in `/public`) if running in air-gapped or high-security corporate environments.
