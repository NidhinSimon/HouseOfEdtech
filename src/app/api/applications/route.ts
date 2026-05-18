import { NextResponse } from 'next/server';
import {
  createSupabaseApplication,
  deleteSupabaseApplication,
  fetchSupabaseApplications,
  getApplicationsData,
  getApplicationById,
  isSupabaseConfigured,
  readDb,
  updateSupabaseApplication,
  writeDb,
  type ApplicationRecord,
} from '@/lib/applications';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// CORS headers configurations to resolve extension preflight blocks
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handle OPTIONS preflight check requests
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

// Handle GET - retrieve list of applications or a single application with Supabase sync
export async function GET(request: Request) {
  console.log('GET /api/applications called');
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;

    if (id) {
      const application = await getApplicationById(id, userId);
      if (!application) {
        return NextResponse.json({ error: 'Application not found' }, { status: 404, headers: corsHeaders });
      }
      return NextResponse.json(application, { headers: corsHeaders });
    }

    const applications = await getApplicationsData(userId);
    return NextResponse.json(applications, { headers: corsHeaders });
  } catch (error: unknown) {
    console.error('Failed in GET applications handler:', error);
    return NextResponse.json({ error: 'Failed to load applications' }, { status: 500, headers: corsHeaders });
  }
}

// Handle POST - create application with Supabase sync
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { company, jobTitle, jobUrl, status, notes, workMode, experience, matchScore } = body;
    const normalizedJobDescription = [
      body.jobDescription,
      body.job_description,
      body.description,
    ].find((value: unknown) => typeof value === 'string' && value.trim().length > 0) || '';
    const normalizedNotes = typeof notes === 'string' ? notes.trim() : '';
    const normalizedJobUrl = typeof jobUrl === 'string' ? jobUrl.trim() : '';
    const normalizedWorkMode = typeof workMode === 'string' ? workMode : '';
    const normalizedExperience = typeof experience === 'string' ? experience : '';

    // Validate inputs
    if (!company || !jobTitle) {
      return NextResponse.json({ error: 'Company and Job Title are required fields' }, { status: 400, headers: corsHeaders });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;

    let apps = readDb();
    if (isSupabaseConfigured()) {
      const supabaseApps = await fetchSupabaseApplications(userId);
      if (supabaseApps !== null) {
        apps = supabaseApps;
      }
    }
    
    // Isolate apps by user session to prevent cross-user duplicate matches
    if (userId) {
      apps = apps.filter((app) => app.userId === userId);
    } else {
      apps = apps.filter((app) => !app.userId);
    }

    // Check duplicate: title + company
    const duplicate = apps.find(
      (app) =>
        (app.company || '').toLowerCase() === company.toLowerCase() &&
        (app.jobTitle || '').toLowerCase() === jobTitle.toLowerCase() &&
        (!userId || app.userId === userId)
    );

    if (duplicate) {
      const duplicateUpdates: Partial<ApplicationRecord> = {};

      if (!duplicate.jobDescription && normalizedJobDescription) {
        duplicateUpdates.jobDescription = normalizedJobDescription;
      }

      if (!duplicate.notes && normalizedNotes) {
        duplicateUpdates.notes = normalizedNotes;
      }

      if (!duplicate.jobUrl && normalizedJobUrl) {
        duplicateUpdates.jobUrl = normalizedJobUrl;
      }

      if ((!duplicate.workMode || duplicate.workMode === 'Hybrid') && normalizedWorkMode) {
        duplicateUpdates.workMode = normalizedWorkMode;
      }

      if ((!duplicate.experience || duplicate.experience === 'Mid-Level') && normalizedExperience) {
        duplicateUpdates.experience = normalizedExperience;
      }

      if (Object.keys(duplicateUpdates).length === 0) {
        return NextResponse.json({ error: 'Application for this role at this company already exists.' }, { status: 409, headers: corsHeaders });
      }

      const updatedDuplicate: ApplicationRecord = {
        ...duplicate,
        ...duplicateUpdates,
        updatedAt: new Date().toISOString(),
      };

      const localApps = readDb();
      const nextApps = localApps.map((app) => app.id === duplicate.id ? updatedDuplicate : app);
      writeDb(nextApps);

      if (isSupabaseConfigured()) {
        await updateSupabaseApplication(duplicate.id, {
          ...duplicateUpdates,
          updatedAt: updatedDuplicate.updatedAt,
        }, userId);
      }

      return NextResponse.json(updatedDuplicate, { status: 200, headers: corsHeaders });
    }

    // Initial status checks
    const initialStatus = status || (body.origin === 'extension' ? 'saved' : 'applied');

    // Create normalized application model
    const newApp: ApplicationRecord = {
      id: 'app_' + Math.random().toString(36).slice(2, 11),
      company: company.trim(),
      jobTitle: jobTitle.trim(),
      jobUrl: normalizedJobUrl,
      status: initialStatus,
      matchScore: typeof matchScore === 'number' ? matchScore : Math.floor(Math.random() * (95 - 60) + 60),
      missingSkills: body.missingSkills || [],
      keywords: body.keywords || [],
      optimizedSummary: body.optimizedSummary || '',
      jobDescription: normalizedJobDescription,
      notes: normalizedNotes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      aiProcessed: !!body.aiProcessed,
      workMode: normalizedWorkMode || 'Remote',
      postedAt: body.postedAt || 'Just now',
      experience: normalizedExperience || 'Mid-Level',
      deadline: body.deadline || null,
      userId,
    };

    // Save to Supabase if configured
    if (isSupabaseConfigured()) {
      const success = await createSupabaseApplication(newApp, userId);
      if (!success) {
        console.warn('Fallback sync failed. Saving locally.');
      }
    }

    // Save locally
    const localApps = readDb();
    localApps.unshift(newApp);
    writeDb(localApps);

    return NextResponse.json(newApp, { status: 201, headers: corsHeaders });
  } catch (error: unknown) {
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

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;

    // Delete from Supabase if configured
    if (isSupabaseConfigured()) {
      await deleteSupabaseApplication(id, userId);
    }

    // Always delete from local DB fallback cache
    const apps = readDb();
    const targetApp = apps.find((app) => app.id === id);
    if (!targetApp) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404, headers: corsHeaders });
    }

    // Ownership authorization check
    if (userId && targetApp.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized to delete this application' }, { status: 403, headers: corsHeaders });
    }
    if (!userId && targetApp.userId) {
      return NextResponse.json({ error: 'Unauthorized to delete this application' }, { status: 403, headers: corsHeaders });
    }

    const filteredApps = apps.filter((app) => app.id !== id);
    writeDb(filteredApps);
    return NextResponse.json({ message: 'Application deleted successfully' }, { headers: corsHeaders });
  } catch (error: unknown) {
    console.error('Failed in DELETE application handler:', error);
    return NextResponse.json({ error: 'Failed to delete application' }, { status: 500, headers: corsHeaders });
  }
}

// Handle PATCH - update application with Supabase sync
export async function PATCH(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ID parameter is required' }, { status: 400, headers: corsHeaders });
    }

    const body = await request.json();
    const { status, notes, company, jobTitle, jobUrl, matchScore, missingSkills, keywords, optimizedSummary, jobDescription, workMode, experience, deadline } = body;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;

    const updates: Partial<ApplicationRecord> = {};
    if (status !== undefined) updates.status = status;
    if (notes !== undefined) updates.notes = notes;
    if (company !== undefined) updates.company = company;
    if (jobTitle !== undefined) updates.jobTitle = jobTitle;
    if (jobUrl !== undefined) updates.jobUrl = jobUrl;
    if (matchScore !== undefined) updates.matchScore = matchScore;
    if (missingSkills !== undefined) updates.missingSkills = missingSkills;
    if (keywords !== undefined) updates.keywords = keywords;
    if (optimizedSummary !== undefined) updates.optimizedSummary = optimizedSummary;
    if (jobDescription !== undefined) updates.jobDescription = jobDescription;
    if (workMode !== undefined) updates.workMode = workMode;
    if (experience !== undefined) updates.experience = experience;
    if (deadline !== undefined) updates.deadline = deadline;

    updates.updatedAt = new Date().toISOString();

    // Update locally
    const localApps = readDb();
    const appIndex = localApps.findIndex((app) => app.id === id);
    if (appIndex === -1) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404, headers: corsHeaders });
    }

    const targetApp = localApps[appIndex];
    // Ownership authorization check
    if (userId && targetApp.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized to update this application' }, { status: 403, headers: corsHeaders });
    }
    if (!userId && targetApp.userId) {
      return NextResponse.json({ error: 'Unauthorized to update this application' }, { status: 403, headers: corsHeaders });
    }

    const updatedApp = {
      ...targetApp,
      ...updates,
    };
    localApps[appIndex] = updatedApp;
    writeDb(localApps);

    // Update in Supabase if configured
    if (isSupabaseConfigured()) {
      await updateSupabaseApplication(id, updates, userId);
    }

    return NextResponse.json(updatedApp, { headers: corsHeaders });
  } catch (error: unknown) {
    console.error('Failed in PATCH application handler:', error);
    return NextResponse.json({ error: 'Failed to update application' }, { status: 500, headers: corsHeaders });
  }
}
