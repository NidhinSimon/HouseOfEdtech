import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';


// Define database path
const DB_PATH = path.join(process.cwd(), 'data', 'applications.json');

// Supabase configuration from environment variables
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// CORS headers configurations to resolve extension preflight blocks
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Heuristics verification for active Supabase configurations
function isSupabaseConfigured() {
  return !!(SUPABASE_URL && SUPABASE_ANON_KEY);
}

// Map Frontend CamelCase structure to Supabase DB SnakeCase columns
function toSupabaseShape(app: any) {
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
  };
}

// Map Supabase DB SnakeCase columns back to Frontend CamelCase structure
function fromSupabaseShape(row: any) {
  return {
    id: row.id,
    company: row.company,
    jobTitle: row.job_title || row.jobTitle,
    jobUrl: row.job_url || row.jobUrl,
    status: row.status,
    matchScore: typeof row.match_score === 'number' ? row.match_score : row.matchScore || 0,
    missingSkills: row.missing_skills || row.missingSkills || [],
    keywords: row.keywords || [],
    optimizedSummary: row.optimized_summary || row.optimizedSummary || '',
    jobDescription: row.job_description || row.jobDescription || '',
    notes: row.notes || '',
    createdAt: row.created_at || row.createdAt || new Date().toISOString(),
    updatedAt: row.updated_at || row.updatedAt || new Date().toISOString(),
    workMode: row.work_mode || row.workMode,
    experience: row.experience,
    deadline: row.deadline,
  };
}

// Fetch applications from Supabase REST API
async function fetchSupabaseApplications() {
  if (!isSupabaseConfigured()) return null;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/applications?select=*&order=created_at.desc`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY!,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
    });
    if (!res.ok) {
      console.warn('Supabase fetch returned error status:', res.status, res.statusText);
      return null;
    }
    const data = await res.json();
    return data.map(fromSupabaseShape);
  } catch (err) {
    console.error('Error fetching applications from Supabase:', err);
    return null;
  }
}

// Write a single application row to Supabase Table
async function createSupabaseApplication(app: any) {
  if (!isSupabaseConfigured()) return false;
  try {
    const body = toSupabaseShape(app);
    const res = await fetch(`${SUPABASE_URL}/rest/v1/applications`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY!,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error('Supabase application creation failed:', res.status, errText);
    }
    return res.ok;
  } catch (err) {
    console.error('Error creating application in Supabase:', err);
    return false;
  }
}

// Delete application from Supabase by Primary Key ID
async function deleteSupabaseApplication(id: string) {
  if (!isSupabaseConfigured()) return false;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/applications?id=eq.${id}`, {
      method: 'DELETE',
      headers: {
        'apikey': SUPABASE_ANON_KEY!,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
    });
    return res.ok;
  } catch (err) {
    console.error('Error deleting application from Supabase:', err);
    return false;
  }
}

// Helper to read database from local applications.json fallback cache
function readDb() {
  try {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Seed default data if file does not exist
    if (!fs.existsSync(DB_PATH)) {
      const demoApps = [
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
        }
      ];
      fs.writeFileSync(DB_PATH, JSON.stringify(demoApps, null, 2), 'utf-8');
      return demoApps;
    }

    const data = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading application JSON DB:', err);
    return [];
  }
}

// Helper to write database to local fallback cache
function writeDb(data: any[]) {
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

// Handle OPTIONS preflight check requests
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

// Handle GET - retrieve list of applications with Supabase sync
export async function GET() {
  console.log('GET /api/applications called');
  try {
    const localApps = readDb();
    let finalApps = localApps;

    if (isSupabaseConfigured()) {
      const supabaseApps = await fetchSupabaseApplications();
      if (supabaseApps !== null) {
        // Sync new local items to Supabase cloud
        const supabaseIds = new Set(supabaseApps.map((a: any) => a.id));
        const unsyncedApps = localApps.filter((a: any) => !supabaseIds.has(a.id));

        for (const app of unsyncedApps) {
          await createSupabaseApplication(app);
        }

        // Refetch to get the unified status list
        if (unsyncedApps.length > 0) {
          const freshSupabase = await fetchSupabaseApplications();
          if (freshSupabase !== null) {
            finalApps = freshSupabase;
          } else {
            finalApps = [...unsyncedApps, ...supabaseApps];
          }
        } else {
          finalApps = supabaseApps;
        }

        // Sync local cache
        writeDb(finalApps);
      }
    }

    // Add derived followUpNeeded state
    const processedApps = finalApps.map((app: any) => {
      let followUpNeeded = false;
      if (app.status === 'applied') {
        const updatedAtTime = new Date(app.updatedAt).getTime();
        const diffDays = (Date.now() - updatedAtTime) / (1000 * 60 * 60 * 24);
        if (diffDays >= 7) {
          followUpNeeded = true;
        }
      }
      return { ...app, followUpNeeded };
    });

    return NextResponse.json(processedApps, { headers: corsHeaders });
  } catch (error: any) {
    console.error('Failed in GET applications handler:', error);
    return NextResponse.json({ error: 'Failed to load applications' }, { status: 500, headers: corsHeaders });
  }
}

// Handle POST - create application with Supabase sync
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { company, jobTitle, jobUrl, status, notes, workMode, experience, matchScore, jobDescription } = body;

    // Validate inputs
    if (!company || !jobTitle) {
      return NextResponse.json({ error: 'Company and Job Title are required fields' }, { status: 400, headers: corsHeaders });
    }

    let apps = readDb();
    if (isSupabaseConfigured()) {
      const supabaseApps = await fetchSupabaseApplications();
      if (supabaseApps !== null) {
        apps = supabaseApps;
      }
    }

    // Check duplicate: title + company
    const duplicate = apps.find(
      (app: any) =>
        (app.company || '').toLowerCase() === company.toLowerCase() &&
        (app.jobTitle || '').toLowerCase() === jobTitle.toLowerCase()
    );

    if (duplicate) {
      return NextResponse.json({ error: 'Application for this role at this company already exists.' }, { status: 409, headers: corsHeaders });
    }

    // Initial status checks
    const initialStatus = status || (body.origin === 'extension' ? 'saved' : 'applied');

    // Create normalized application model
    const newApp = {
      id: 'app_' + Math.random().toString(36).substr(2, 9),
      company: company.trim(),
      jobTitle: jobTitle.trim(),
      jobUrl: jobUrl || '',
      status: initialStatus,
      matchScore: typeof matchScore === 'number' ? matchScore : Math.floor(Math.random() * (95 - 60) + 60),
      missingSkills: body.missingSkills || [],
      keywords: body.keywords || [],
      optimizedSummary: body.optimizedSummary || '',
      jobDescription: jobDescription || '',
      notes: notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      aiProcessed: !!body.aiProcessed,
      workMode: workMode || 'Remote',
      postedAt: body.postedAt || 'Just now',
      experience: experience || 'Mid-Level',
      deadline: body.deadline || null,
    };

    // Save to Supabase if configured
    if (isSupabaseConfigured()) {
      const success = await createSupabaseApplication(newApp);
      if (!success) {
        console.warn('Fallback sync failed. Saving locally.');
      }
    }

    // Save locally
    const localApps = readDb();
    localApps.unshift(newApp);
    writeDb(localApps);

    return NextResponse.json(newApp, { status: 201, headers: corsHeaders });
  } catch (error: any) {
    console.error('Failed in POST application handler:', error);
    return NextResponse.json({ error: 'Failed to add application' }, { status: 500, headers: corsHeaders });
  }
}

// Handle DELETE - remove application with Supabase sync
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ID parameter is required' }, { status: 400, headers: corsHeaders });
    }

    // Delete from Supabase if configured
    if (isSupabaseConfigured()) {
      await deleteSupabaseApplication(id);
    }

    // Always delete from local DB fallback cache
    const apps = readDb();
    const filteredApps = apps.filter((app: any) => app.id !== id);
    
    if (apps.length === filteredApps.length) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404, headers: corsHeaders });
    }

    writeDb(filteredApps);
    return NextResponse.json({ message: 'Application deleted successfully' }, { headers: corsHeaders });
  } catch (error: any) {
    console.error('Failed in DELETE application handler:', error);
    return NextResponse.json({ error: 'Failed to delete application' }, { status: 500, headers: corsHeaders });
  }
}
