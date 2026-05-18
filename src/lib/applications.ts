import 'server-only';

import fs from 'fs';
import path from 'path';

export interface ApplicationRecord {
  id: string;
  company: string;
  jobTitle: string;
  jobUrl?: string;
  status: string;
  matchScore: number;
  createdAt: string;
  updatedAt: string;
  workMode?: string;
  experience?: string;
  notes?: string;
  missingSkills?: string[];
  keywords?: string[];
  optimizedSummary?: string;
  jobDescription?: string;
  postedAt?: string;
  deadline?: string | null;
  aiProcessed?: boolean;
  followUpNeeded?: boolean;
  userId?: string;
}

const DB_PATH = path.join(process.cwd(), 'data', 'applications.json');
const LEGACY_JOB_DESCRIPTION_DELIMITER = '--- Job Description ---';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function isSupabaseConfigured() {
  return !!(SUPABASE_URL && SUPABASE_ANON_KEY);
}

function extractLegacyJobDescription(notes?: string, jobDescription?: string) {
  const safeNotes = typeof notes === 'string' ? notes : '';
  const safeJobDescription = typeof jobDescription === 'string' ? jobDescription : '';

  if (safeJobDescription || !safeNotes.includes(LEGACY_JOB_DESCRIPTION_DELIMITER)) {
    return {
      notes: safeNotes,
      jobDescription: safeJobDescription,
    };
  }

  const [notePart, ...descriptionParts] = safeNotes.split(LEGACY_JOB_DESCRIPTION_DELIMITER);

  return {
    notes: notePart.trim(),
    jobDescription: descriptionParts.join(LEGACY_JOB_DESCRIPTION_DELIMITER).trim(),
  };
}

function normalizeApplicationRecord(app: ApplicationRecord): ApplicationRecord {
  const extracted = extractLegacyJobDescription(app.notes, app.jobDescription);

  return {
    ...app,
    jobDescription: extracted.jobDescription,
    notes: extracted.notes,
  };
}

function toSupabaseShape(app: ApplicationRecord) {
  return {
    id: app.id,
    company: app.company,
    job_title: app.jobTitle,
    job_url: app.jobUrl || '',
    status: app.status,
    match_score: typeof app.matchScore === 'number' ? app.matchScore : 0,
    missing_skills: app.missingSkills || [],
    keywords: app.keywords || [],
    optimized_summary: app.optimizedSummary || '',
    job_description: app.jobDescription || '',
    notes: app.notes || '',
    created_at: app.createdAt || new Date().toISOString(),
    updated_at: app.updatedAt || new Date().toISOString(),
    work_mode: app.workMode || 'Remote',
    experience: app.experience || 'Mid-Level',
    deadline: app.deadline || null,
    user_id: app.userId || null,
  };
}

function fromSupabaseShape(row: Record<string, unknown>): ApplicationRecord {
  const application = {
    id: String(row.id || ''),
    company: String(row.company || ''),
    jobTitle: String(row.job_title || row.jobTitle || ''),
    jobUrl: String(row.job_url || row.jobUrl || ''),
    status: String(row.status || ''),
    matchScore: typeof row.match_score === 'number'
      ? row.match_score
      : typeof row.matchScore === 'number'
        ? row.matchScore
        : 0,
    missingSkills: Array.isArray(row.missing_skills)
      ? row.missing_skills.map(String)
      : Array.isArray(row.missingSkills)
        ? row.missingSkills.map(String)
        : [],
    keywords: Array.isArray(row.keywords) ? row.keywords.map(String) : [],
    optimizedSummary: String(row.optimized_summary || row.optimizedSummary || ''),
    jobDescription: String(row.job_description || row.jobDescription || ''),
    notes: String(row.notes || ''),
    createdAt: String(row.created_at || row.createdAt || new Date().toISOString()),
    updatedAt: String(row.updated_at || row.updatedAt || new Date().toISOString()),
    workMode: row.work_mode ? String(row.work_mode) : row.workMode ? String(row.workMode) : undefined,
    experience: row.experience ? String(row.experience) : undefined,
    postedAt: row.postedAt ? String(row.postedAt) : undefined,
    deadline: row.deadline ? String(row.deadline) : null,
    aiProcessed: Boolean(row.aiProcessed),
    userId: row.user_id ? String(row.user_id) : row.userId ? String(row.userId) : undefined,
  };

  return normalizeApplicationRecord(application);
}

export async function fetchSupabaseApplications(userId?: string): Promise<ApplicationRecord[] | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    let url = `${SUPABASE_URL}/rest/v1/applications?select=*&order=created_at.desc`;
    if (userId) {
      url += `&user_id=eq.${userId}`;
    }
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        apikey: SUPABASE_ANON_KEY!,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      console.warn('Supabase fetch returned error status:', res.status, res.statusText);
      return null;
    }

    const data: unknown = await res.json();
    if (!Array.isArray(data)) {
      console.warn('Supabase fetch returned non-array payload');
      return null;
    }

    return data.map((row) => fromSupabaseShape(row as Record<string, unknown>));
  } catch (err) {
    console.error('Error fetching applications from Supabase:', err);
    return null;
  }
}

export async function createSupabaseApplication(app: ApplicationRecord, userId?: string) {
  if (!isSupabaseConfigured()) return false;

  try {
    const body = {
      ...toSupabaseShape(app),
      ...(userId ? { user_id: userId } : {}),
    };
    // Use PostgREST upsert to allow seamless ownership updates for extension-scraped jobs
    const res = await fetch(`${SUPABASE_URL}/rest/v1/applications?on_conflict=id`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_ANON_KEY!,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=representation',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('Supabase application creation/upsert failed:', res.status, errText);
    }

    return res.ok;
  } catch (err) {
    console.error('Error creating/upserting application in Supabase:', err);
    return false;
  }
}

function toSupabasePartialShape(updates: Partial<ApplicationRecord>) {
  const payload: Record<string, unknown> = {};

  if (updates.company !== undefined) payload.company = updates.company;
  if (updates.jobTitle !== undefined) payload.job_title = updates.jobTitle;
  if (updates.jobUrl !== undefined) payload.job_url = updates.jobUrl;
  if (updates.status !== undefined) payload.status = updates.status;
  if (updates.matchScore !== undefined) payload.match_score = updates.matchScore;
  if (updates.missingSkills !== undefined) payload.missing_skills = updates.missingSkills;
  if (updates.keywords !== undefined) payload.keywords = updates.keywords;
  if (updates.optimizedSummary !== undefined) payload.optimized_summary = updates.optimizedSummary;
  if (updates.jobDescription !== undefined) payload.job_description = updates.jobDescription;
  if (updates.notes !== undefined) payload.notes = updates.notes;
  if (updates.createdAt !== undefined) payload.created_at = updates.createdAt;
  if (updates.updatedAt !== undefined) payload.updated_at = updates.updatedAt;
  if (updates.workMode !== undefined) payload.work_mode = updates.workMode;
  if (updates.experience !== undefined) payload.experience = updates.experience;
  if (updates.deadline !== undefined) payload.deadline = updates.deadline;

  return payload;
}

export async function updateSupabaseApplication(id: string, updates: Partial<ApplicationRecord>, userId?: string) {
  if (!isSupabaseConfigured()) return false;

  try {
    const body = toSupabasePartialShape(updates);
    if (Object.keys(body).length === 0) {
      return true;
    }

    let url = `${SUPABASE_URL}/rest/v1/applications?id=eq.${id}`;
    if (userId) {
      url += `&user_id=eq.${userId}`;
    }

    const res = await fetch(url, {
      method: 'PATCH',
      headers: {
        apikey: SUPABASE_ANON_KEY!,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('Supabase application update failed:', res.status, errText);
    }

    return res.ok;
  } catch (err) {
    console.error('Error updating application in Supabase:', err);
    return false;
  }
}

export async function deleteSupabaseApplication(id: string, userId?: string) {
  if (!isSupabaseConfigured()) return false;

  try {
    let url = `${SUPABASE_URL}/rest/v1/applications?id=eq.${id}`;
    if (userId) {
      url += `&user_id=eq.${userId}`;
    }

    const res = await fetch(url, {
      method: 'DELETE',
      headers: {
        apikey: SUPABASE_ANON_KEY!,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    return res.ok;
  } catch (err) {
    console.error('Error deleting application from Supabase:', err);
    return false;
  }
}

export function readDb(): ApplicationRecord[] {
  try {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (!fs.existsSync(DB_PATH)) {
      const demoApps: ApplicationRecord[] = [
        {
          id: 'demo-1',
          company: 'Google',
          jobTitle: 'Software Engineer Intern',
          jobUrl: 'https://careers.google.com/jobs/results/1',
          status: 'interview',
          matchScore: 87,
          missingSkills: ['System Design', 'Kubernetes'],
          keywords: ['React', 'Python', 'APIs', 'Data Structures'],
          optimizedSummary: 'Detail-oriented software engineer intern applicant with strong React and Python expertise.',
          notes: 'Prepare for frontend and coding interviews. Interview scheduled on Monday.',
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          aiProcessed: true,
          workMode: 'Hybrid',
          postedAt: '2d ago',
          experience: 'Internship',
          deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 'demo-2',
          company: 'Atlassian',
          jobTitle: 'Frontend Developer',
          jobUrl: 'https://www.atlassian.com/careers/2',
          status: 'applied',
          matchScore: 74,
          missingSkills: ['GraphQL', 'Web Performance'],
          keywords: ['React', 'TypeScript', 'Jest', 'Webpack'],
          optimizedSummary: 'Experienced frontend developer focused on high-performance web applications.',
          notes: 'Sent online assessment on May 10.',
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          aiProcessed: true,
          workMode: 'Remote',
          postedAt: '1w ago',
          experience: 'Mid-Level',
          deadline: null,
        },
        {
          id: 'demo-3',
          company: 'Razorpay',
          jobTitle: 'Full Stack Engineer',
          jobUrl: 'https://careers.razorpay.com/3',
          status: 'offer',
          matchScore: 91,
          missingSkills: [],
          keywords: ['Node.js', 'React', 'MongoDB', 'Redis', 'Docker'],
          optimizedSummary: 'Highly skilled Full Stack developer with expert proficiency in transactional banking flows.',
          notes: 'Received written offer! Base salary details discussed.',
          createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          aiProcessed: true,
          workMode: 'On-site',
          postedAt: '10d ago',
          experience: 'Senior',
          deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ];

      fs.writeFileSync(DB_PATH, JSON.stringify(demoApps, null, 2), 'utf-8');
      return demoApps;
    }

    const data = fs.readFileSync(DB_PATH, 'utf-8');
    const parsed: unknown = JSON.parse(data);
    return Array.isArray(parsed)
      ? (parsed as ApplicationRecord[]).map((app) => normalizeApplicationRecord(app))
      : [];
  } catch (err) {
    console.error('Error reading application JSON DB:', err);
    return [];
  }
}

export function writeDb(data: ApplicationRecord[]) {
  try {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing to application JSON DB:', err);
    return false;
  }
}

export async function getApplicationsData(userId?: string): Promise<ApplicationRecord[]> {
  const localApps = readDb();
  
  // 1. Identify and auto-assign any anonymous / extension-created applications to the currently logged-in user
  const newlyAssignedIds = new Set<string>();
  if (userId) {
    localApps.forEach((app) => {
      if (!app.userId) {
        app.userId = userId;
        newlyAssignedIds.add(app.id);
      }
    });
    if (newlyAssignedIds.size > 0) {
      writeDb(localApps);
    }
  }

  let finalApps = localApps;

  if (isSupabaseConfigured()) {
    const supabaseApps = await fetchSupabaseApplications(userId);

    if (supabaseApps !== null) {
      const supabaseIds = new Set(supabaseApps.map((app) => app.id));
      
      // ONLY sync/upload local apps that were newly assigned from anonymous
      const unsyncedApps = localApps.filter((app) => 
        app.userId === userId && 
        newlyAssignedIds.has(app.id) &&
        !supabaseIds.has(app.id)
      );

      for (const app of unsyncedApps) {
        await createSupabaseApplication(app, userId);
      }

      // Re-read local db after sync insertions to get up-to-date states
      const refreshedLocal = readDb();

      // Make Supabase the source of truth for the current user's applications.
      // Discard any local user applications that do not exist in Supabase and were not newly assigned.
      // Keep other users' applications and anonymous applications untouched.
      const syncedLocalApps = refreshedLocal.filter((app) => {
        if (app.userId === userId) {
          return supabaseIds.has(app.id) || newlyAssignedIds.has(app.id);
        }
        return true;
      });

      // Pull down any missing applications from Supabase into our local cache
      const localIds = new Set(syncedLocalApps.map((app) => app.id));
      supabaseApps.forEach((remoteApp) => {
        if (!localIds.has(remoteApp.id)) {
          syncedLocalApps.push(remoteApp);
        }
      });

      writeDb(syncedLocalApps);
      finalApps = syncedLocalApps;
    }
  }

  if (userId) {
    return finalApps
      .filter((app) => app.userId === userId)
      .map((app) => {
        const isApplied = (app.status || '').toLowerCase() === 'applied';
        const updatedAtTime = new Date(app.updatedAt).getTime();
        const hasValidUpdate = Number.isFinite(updatedAtTime);
        const diffDays = hasValidUpdate
          ? (Date.now() - updatedAtTime) / (1000 * 60 * 60 * 24)
          : 0;

        return {
          ...app,
          followUpNeeded: isApplied && diffDays >= 7,
          userId,
        };
      });
  }

  // For unauthenticated/anonymous users, return the standard demo apps (apps with no userId)
  return finalApps
    .filter((app) => !app.userId)
    .map((app) => {
      const isApplied = (app.status || '').toLowerCase() === 'applied';
      const updatedAtTime = new Date(app.updatedAt).getTime();
      const hasValidUpdate = Number.isFinite(updatedAtTime);
      const diffDays = hasValidUpdate
        ? (Date.now() - updatedAtTime) / (1000 * 60 * 60 * 24)
        : 0;

      return {
        ...app,
        followUpNeeded: isApplied && diffDays >= 7,
      };
    });
}

export async function getApplicationById(id?: string | null, userId?: string): Promise<ApplicationRecord | null> {
  const applications = await getApplicationsData(userId);

  if (!applications.length) {
    return null;
  }

  if (!id) {
    return applications[0];
  }

  return applications.find((application) => application.id === id) ?? null;
}
