# JobStash vs. Applywise (HouseOfEdtech) Feature & Architecture Comparison

This document provides a comprehensive summary of the **JobStash** repository features, analyzes the current state of **Applywise** (HouseOfEdtech), compares their architectures, and details a feature-by-feature gap analysis.

---

## 1. Executive Summary

| Category | JobStash | Applywise (Current Repo) |
| :--- | :--- | :--- |
| **Tech Stack** | React 19 + Vite SPA, Tailwind CSS, `@dnd-kit`, Recharts | Next.js 16 + React 19, Vanilla CSS, Lucide React, Three.js, GSAP, Lenis |
| **System Architecture** | Local-first (`localStorage`) + cloud sync (Supabase REST), optional n8n automation, Chrome Extension | Next.js App Router, purely frontend mockup and client-side page rendering |
| **Data Flow** | Fully stateful via custom hooks (`useApplications`, `useAnalytics`), local storage utilities, and direct Supabase APIs | Purely static mock data arrays mapped directly inside components |
| **AI Capabilities** | Active Gemini API integration with browser rate-limiting and a robust local fallback heuristic engine | Purely visual mockups of ATS scores, actionable tips, and match breakdowns |
| **Visual Design** | Standard, generic Tailwind CSS layout | High-fidelity, custom dark-mode aesthetic with custom SVG styling, smooth scroll, glassmorphic headers |

While **JobStash** represents a fully-functional, stateful, browser-extension-integrated utility, **Applywise** is a premium, visually-stunning frontend shell built to wow reviewers but currently lacking database state, interactive CRUD, or functional integrations.

---

## 2. JobStash: Deep Feature Breakdown

### A. Core Tracking & Workflow
* **State & Local-First Storage**: Applications reside in `localStorage`, seeded with demo items on first run so the UI is never blank.
* **Supabase REST Sync**: Cloud storage sync triggered when Supabase credentials (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) are present, resolving conflict merges between local and cloud states.
* **Kanban & List Board**: Interactively moves applications between five defined statuses (`saved`, `applied`, `interview`, `rejected`, `offer`) with drag-and-drop capabilities (`@dnd-kit`).
* **Virtual Follow-up Logic**: Automatically computes a "follow-up needed" state if an application remains in `applied` status for more than 7 days without updates.

### B. AI & Extraction Engine
* **Hybrid Resume Analysis**: Calls Gemini (`VITE_GEMINI_API_KEY`) for text analysis. If it fails or keys are missing, it falls back to a custom local heuristic engine (token/keyword overlap matching) to prevent app crashes.
* **Standalone Resume Gap Analyzer**: Aggregates the job descriptions of *all* saved jobs to compare against one pasted/uploaded resume. Helps users optimize for a target market rather than a single job post.
* **PDF.js Parser**: Extracts texts cleanly from uploaded PDF resumes.

### C. Chrome Extension Utilities
* **Job Scraper**: Custom scripts parse dynamic job cards on LinkedIn, Indeed, Naukri, Hirist, and Glassdoor, extracting details and checking for duplicates before directly inserting them into the Supabase database.
* **Autofill Heuristic Engine**: Stores a candidate profile inside `chrome.storage.sync` and maps keys to common screening questions (e.g., relocation, notice period, expected CTC, sponsorship, gender) using browser form heuristics.

---

## 3. Applywise: Existing State & Architecture

The current Next.js 16 **Applywise** repository contains the following frontend-only modules:

* **Dashboard (`/dashboard`)**: Displays KPI stats (Applied, Interviews, Offers, Avg Match) and tables of applications. Data is fed entirely from local static arrays (`apps`, `topMatches`, `weekActivity`).
* **Jobs Page (`/jobs`)**: An AI-curated "Discover Roles" page featuring high-density job cards with tags, match scores, and a mock "Sync LinkedIn" button. Backed by a static `jobs` array.
* **Resume Analyzer (`/analyzer`)**: A premium drag-and-drop zone mockup for uploading files. Displays an interactive-looking circular 85% ATS score and breakdown metrics (Formatting, Keywords, Skills), but no active text parser or AI endpoint integration is configured.
* **Analytics Page (`/analytics`)**: Custom SVG-driven visualizations showing a 30-day application trend line chart and a circular status distribution. Charts are precalculated SVG nodes with no dynamic data recalculation.
* **Detail Page (`/application`)**: A vertical progress timeline tracking application checkpoints alongside mock outreach draft previews.
* **Authentication (`/auth`)**: Custom toggle forms for signing in/up with password toggles and Google SVG styling, with no real token handling.

---

## 4. Feature Comparison & Gap Matrix

| Feature | JobStash Capability | Applywise Current State | Gap / Action Plan |
| :--- | :--- | :--- | :--- |
| **Next.js 16 Framework** | None (Vite SPA) | Full (Modern App Router) | Applywise wins on modern framework structure. |
| **Stateful CRUD** | Stateful hooks (`useApplications`) | Mock values | Needs integration of hooks and local storage services. |
| **Database Sync** | Direct Supabase REST client | Purely client-side | Implement `supabase-js` services in `/src/services`. |
| **Kanban Board** | Dynamic `@dnd-kit` drag-and-drop | Mock List / Cards | Integrate Kanban UI component using standard Tailwind / CSS grid. |
| **Resume Extraction** | PDF.js extraction | Pure markup drop zone | Implement PDF parser service using a package like `pdf-parse` or frontend helper. |
| **Gemini AI Integration** | Fully functional in `aiService` | Mock display only | Integrate the OpenAI / Gemini AI-SDK into serverless API routes (`/api/ai`). |
| **Resume Gap Analyzer** | Aggregated JD market scanner | Mock Gap Analyzer UI | Implement cross-job parsing logic on the Next.js backend. |
| **Chrome Extension** | Scraper + Autofill included | None | Create a folder `extension/` and port JobStash assets. |
| **n8n Automation** | Webhook configuration ready | None | Port the `workflow.json` mapping to a backend service. |

---

## 5. Architectural Recommendations

To satisfy the **House of Edtech** fullstack developer guidelines (which demand a robust Next.js backend, a real database, security rules, and actual AI integrations):

1. **State & Database**: Replace static mock arrays with stateful hooks reading from a PostgreSQL/Supabase backend. Ensure full server-side validation is implemented to prevent security vulnerabilities.
2. **Next.js API Routes**: Port JobStash's node-level AI service functions (`aiService.js`) into native Next.js API endpoints (e.g., `/api/analyze` and `/api/gap-analyze`), securing API keys inside env files.
3. **PDF Uploads**: Leverage the React 19 setup to cleanly handle files on the server side using Next.js route handlers.
4. **Extension integration**: Package the Chrome extension components and map their Supabase queries directly to the server database schema, allowing the topbar-nav UI to seamlessly display jobs collected via browser browsing.

This approach combines **Applywise's industry-grade frontend visuals** with **JobStash's utility-rich backend logic** to create an assignment-winning, professional SaaS submission.
