# JobStash Repo Overview

## What this repo is

This repository is a job-application tracking product with 3 connected parts:

1. A React + Vite dashboard in `src/`
2. A Chrome extension in `extension/`
3. An optional n8n automation workflow in `n8n-workflow/`

The product goal is:

- save jobs from job boards and career pages
- track each application through its lifecycle
- analyze resume/job fit with AI or a local fallback
- surface trends from saved job descriptions
- help autofill future application forms with a stored profile

## Main user-facing features

### 1. Dashboard

Route: `/`

What it shows:

- total applications
- interview rate
- offer rate
- average AI match score
- upcoming deadlines
- follow-up alerts for stale applications
- recent applications

Logic notes:

- dashboard data comes from `useApplications()` and `useAnalytics()`
- follow-up alerts are not manually stored; they are computed dynamically
- deadlines are sorted by nearest date using `date-fns`

### 2. Application tracking

Routes:

- `/applications`
- `/applications/new`
- `/applications/:id`

What exists:

- add a new application manually
- view applications in card list mode
- switch to Kanban board mode
- drag applications between statuses
- search by company or role
- filter by status
- filter by experience level
- paginate results
- update status
- set or clear deadlines
- write notes
- delete applications
- open original job link

Status flow currently used:

- `saved`
- `applied`
- `interview`
- `rejected`
- `offer`

Important behavior:

- manually created applications default to `applied`
- extension-saved applications default to `saved`
- follow-up state is shown as a virtual state on top of `applied`
- follow-up is triggered when an `applied` application has not changed for more than 7 days

### 3. AI resume analysis on a single job

Routes:

- `/applications/new`
- `/applications/:id`
- `/analyzer`

What it does:

- calculates a match score
- extracts keywords
- finds missing skills
- generates an optimized summary
- rewrites experience bullets
- generates a cover letter
- generates an outreach/follow-up email draft

Current provider logic:

1. Try Gemini if `VITE_GEMINI_API_KEY` exists
2. Otherwise fall back to a local heuristic engine
3. OpenAI code exists in `aiService.js` but is currently commented out in the main decision flow

Important behavior:

- if AI fails, the app falls back to local analysis instead of hard-failing
- AI calls are rate-limited in the browser to 5 per hour by default
- the standalone analyzer has a demo mode with mock results

### 4. Resume gap analyzer across all saved jobs

Route: `/gap-analyzer`

What it does:

- aggregates every saved job description in the app
- compares one pasted/uploaded resume against the full JD set
- returns missing skills, matched keywords, and an AI-written summary

This is useful for:

- identifying recurring market gaps
- optimizing a resume for a whole target market, not just one role

### 5. Analytics

Route: `/analytics`

What it shows:

- total applications
- interview rate
- offer rate
- average resume score
- 30-day application trend
- status breakdown pie chart
- score distribution chart
- top missing-skill radar chart

All analytics are derived in-memory from the applications array. There is no separate analytics backend.

### 6. Market insights

Route: `/insights`

What it shows:

- top in-demand skills from saved job descriptions
- categorized skill demand
- work-mode demand
- biggest skill gaps
- quick-win recommendations

How skills are found:

- first preference: use `keywords` already stored on applications
- fallback: scan job descriptions for a hardcoded tech-skill list
- group those matches into categories like `Frontend`, `Backend`, `Cloud/DevOps`, `AI/ML`, etc.

### 7. Chrome extension: job extraction

What it does:

- detects job pages
- extracts title, company, description, job URL
- tries to extract work mode, posted date, and experience level
- supports LinkedIn, Indeed, Naukri, Hirist, Glassdoor, and generic sites

LinkedIn-specific logic:

- tries to detect company-site apply links
- avoids treating "Easy Apply" as an external company URL
- if a company-site URL exists, it becomes the preferred `job_url`

Extension save flow:

- opens current page data in the popup
- lets the user review/edit extracted fields
- saves directly to Supabase REST
- performs duplicate checking by `job_title + company`

### 8. Chrome extension: quick-save on search result cards

What it does:

- injects a save button into LinkedIn, Indeed, and Naukri result cards
- watches dynamic pages with a `MutationObserver`
- saves jobs directly from list/search pages without opening each detail page

### 9. Chrome extension: profile storage + application autofill

What it does:

- stores a candidate profile in `chrome.storage.sync`
- stores contact info, links, and screening answers
- injects a floating autofill button on likely application forms
- fills text inputs, select elements, and radio groups using heuristics

Supported patterns:

- general name/email/phone/location/link fields
- work authorization
- relocation
- notice period
- expected/current CTC or salary
- education
- sponsorship
- gender

The autofill system is heuristic-based, so it is meant to help, not guarantee perfect form completion.

## Core architecture

### Frontend stack

- React 19
- React Router
- Vite
- Tailwind CSS
- Recharts
- `@dnd-kit` for Kanban drag-and-drop
- `pdfjs-dist` for PDF text extraction

### State model

There is no global state library like Redux or Zustand.

Instead:

- `useApplications()` fetches and mutates application data
- `useAnalytics()` computes derived metrics from that application list
- page components compose those hooks directly

### Main data flow

#### Flow A: manual application entry

1. User fills form in `AddApplication`
2. `validateApplicationForm()` validates required fields
3. `findDuplicate()` checks local duplicates
4. `createApplication()` writes to local storage
5. If Supabase is configured, the same record is inserted there too
6. If a resume is attached, `runAI()` runs analysis
7. AI results are persisted back into the application record

#### Flow B: extension-saved job

1. Extension extracts fields from the current site
2. Popup or quick-save script checks Supabase for duplicates
3. Record is posted directly to Supabase REST with status `saved`
4. Dashboard app later fetches Supabase records through `applicationService`
5. `fromSupabase()` normalizes DB fields into frontend shape

#### Flow C: analytics

1. `useApplications()` returns the normalized applications array
2. `useAnalytics()` passes it into `computeAnalytics()`
3. analytics pages render charts and KPI cards from derived arrays

#### Flow D: autofill

1. User saves profile data in extension popup
2. `autofill.js` detects likely application forms
3. A floating button appears
4. Clicking it maps stored profile fields to matching inputs/selects/radios
5. Synthetic events are fired to trigger React/Vue/Angular form updates

## Data model used by the frontend

The frontend application object shape is roughly:

```js
{
  id,
  company,
  jobTitle,
  jobUrl,
  status,
  matchScore,
  missingSkills,
  keywords,
  optimizedSummary,
  optimizedExperience,
  coverLetter,
  emailDraft,
  jobDescription,
  notes,
  createdAt,
  updatedAt,
  aiProcessed,
  resumeFileName,
  workMode,
  postedAt,
  experience,
  deadline,
  followUpNeeded
}
```

Notes:

- `followUpNeeded` is derived, not permanently stored
- some extension-created records embed job description content inside `notes`
- `fromSupabase()` splits that notes field using `--- Job Description ---`

## Storage and sync logic

How storage works:

- local-first: applications are always stored in `localStorage`
- if Supabase is configured, the app also reads/writes cloud records
- Supabase is treated as the preferred source when records exist
- local-only records are merged in if their IDs are not already in Supabase data

Important implementation detail:

- `storage.getApplications()` seeds the app with `DEMO_APPLICATION` when local storage is empty
- that means a fresh install does not start blank

## AI logic details

Current behavior:

- Gemini is the active cloud AI path
- OpenAI request code exists but is not currently used by `analyzeResumeDirect()`
- local fallback uses keyword overlap and simple heuristics

Local analysis does:

- token overlap scoring between resume and JD
- simple keyword extraction from a small fixed list
- simple missing-skill detection
- generic rewrite/cover-letter/email outputs

This means the app works without API keys, but results are shallower.

## Resume upload logic

Supported behavior:

- PDF text extraction via PDF.js
- TXT file reading via `FileReader`
- DOC/DOCX accepted, but not fully parsed

Important limitation:

- DOCX is not actually text-extracted yet
- for DOCX the code stores a placeholder string like `[Resume file: name]`
- so AI quality is best with PDF or TXT uploads

## Analytics logic details

Derived metrics include:

- `interviewRate = interview or offer / total`
- `offerRate = offer / total`
- `avgScore = average of applications with a match score`
- `trend = per-day counts over the last 30 days`
- `scoreBuckets = low / medium / high`
- `skillGaps = most common missing skills`
- `marketSkills = most common detected keywords`
- `categorizedSkills = grouped market skills`
- `workModeDist = Remote / Hybrid / On-site counts`

## Optional n8n workflow

The workflow contains nodes for:

- webhook trigger
- input validation
- OpenAI score and optimization
- OpenAI cover letter generation
- OpenAI email generation
- merge results
- Google Sheets logging
- webhook response

Important repo reality:

- the workflow is present and documented
- `src/services/api.js` also exists for webhook-based API calls
- but the current main AI path in `applicationService.js` calls `analyzeResumeDirect()` instead of `api.js`

So n8n is prepared as an optional architecture path, not the currently active default path.

## Routing map

- `/` -> Dashboard
- `/applications` -> Application list
- `/applications/new` -> Add application
- `/applications/:id` -> Application detail
- `/analytics` -> Analytics
- `/insights` -> Market insights
- `/analyzer` -> Resume analyzer
- `/gap-analyzer` -> Resume gap analyzer

## Main reusable components

What they contribute:

- consistent application card UI
- drag-and-drop status management
- shared filtering controls
- reusable score visualization
- follow-up reminder surface
- reusable resume upload zone
- top-level crash protection

## Environment/config used by the repo

Relevant values seen in the project:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_GEMINI_API_KEY`
- `VITE_OPENAI_API_KEY`
- `VITE_RATE_LIMIT_MAX`
- `VITE_RATE_LIMIT_WINDOW_MS`
- `VITE_N8N_WEBHOOK_URL`

Notes:

- cloud sync depends on Supabase env vars
- Gemini enables stronger AI analysis
- OpenAI code is present but not currently the active branch
- Vite dev server proxies `/webhook` to `VITE_N8N_WEBHOOK_URL`

## Real implementation caveats

1. The app is local-first and seeds demo data on first load.
2. n8n exists in the repo, but the main frontend AI flow currently bypasses it.
3. DOCX uploads are accepted but not truly parsed.
4. Extension records may store job description text inside `notes`, not always in a dedicated DB column.
5. The extension writes directly to Supabase REST instead of reusing the frontend service layer.
6. Follow-up state is computed from timestamps, not explicitly stored.
7. Market insights depend heavily on either AI keywords or simple text matching, not a dedicated NLP pipeline.

## Short summary

JobStash is an AI-assisted job search tracker built around a local-first React dashboard, an extraction/autofill Chrome extension, and an optional n8n automation path. The strongest implemented parts today are application tracking, analytics, market-signal aggregation from job descriptions, extension-based job saving, and resume-vs-JD analysis with Gemini or a local fallback engine.
