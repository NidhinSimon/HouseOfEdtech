import { Topbar } from '@/components/Topbar';
import { getApplicationById } from '@/lib/applications';
import { StatusUpdater } from '@/components/StatusUpdater';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import {
  AlertCircle,
  ArrowLeft,
  ArrowUpRight,
  Briefcase,
  CalendarCheck,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileText,
  Target,
} from 'lucide-react';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type SearchParamsShape = {
  id?: string | string[] | undefined;
};

type AppDetailPageProps = {
  searchParams?: Promise<SearchParamsShape> | SearchParamsShape;
};

function getCompanyLogoText(name: string) {
  return name ? name.trim().charAt(0).toUpperCase() : 'J';
}

function getCompanyLogoColor(name: string) {
  const colors = ['#60A5FA', '#A78BFA', '#34D399', '#FBBF24', '#F87171', '#EC4899', '#3B82F6', '#8B5CF6'];
  const index = name ? name.charCodeAt(0) % colors.length : 0;
  return colors[index];
}

function formatStatus(status: string) {
  const normalized = (status || '').toLowerCase();

  if (!normalized) return 'Unknown';

  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function getStatusTone(status: string) {
  const normalized = (status || '').toLowerCase();

  if (normalized === 'offer') {
    return { color: '#34D399', background: 'rgba(52,211,153,0.10)', border: 'rgba(52,211,153,0.2)' };
  }

  if (normalized === 'interview') {
    return { color: '#60A5FA', background: 'rgba(96,165,250,0.10)', border: 'rgba(96,165,250,0.2)' };
  }

  if (normalized === 'rejected') {
    return { color: '#F87171', background: 'rgba(248,113,113,0.10)', border: 'rgba(248,113,113,0.2)' };
  }

  if (normalized === 'saved') {
    return { color: '#FBBF24', background: 'rgba(251,191,36,0.10)', border: 'rgba(251,191,36,0.2)' };
  }

  return { color: '#A3A3A3', background: 'rgba(163,163,163,0.10)', border: 'rgba(163,163,163,0.2)' };
}

function formatDate(isoString?: string | null, options?: Intl.DateTimeFormatOptions) {
  if (!isoString) {
    return 'Not available';
  }

  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return 'Not available';
  }

  return new Intl.DateTimeFormat('en-IN', options ?? {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function getFollowUpCopy(updatedAt?: string, followUpNeeded?: boolean) {
  if (followUpNeeded) {
    return 'Recommended now';
  }

  if (!updatedAt) {
    return 'No update recorded';
  }

  return `Last activity on ${formatDate(updatedAt)}`;
}

export default async function AppDetailPage({ searchParams }: AppDetailPageProps) {
  const resolvedSearchParams = await Promise.resolve(searchParams ?? {});
  const requestedId = Array.isArray(resolvedSearchParams.id)
    ? resolvedSearchParams.id[0]
    : resolvedSearchParams.id;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id;

  const application = await getApplicationById(requestedId, userId);

  return (
    <>
      <Topbar />
      <main className="main-content">
        <Link
          href="/dashboard"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            color: 'var(--text-secondary)',
            marginBottom: '24px',
            padding: '6px 12px',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            background: 'var(--bg-card)',
          }}
        >
          <ArrowLeft size={12} /> Back to Dashboard
        </Link>

        {!application ? (
          <div className="card" style={{ padding: '32px', maxWidth: '720px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: 'rgba(249,115,22,0.12)',
              border: '1px solid rgba(249,115,22,0.22)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#F97316',
              marginBottom: '16px',
            }}>
              <AlertCircle size={22} />
            </div>
            <h1 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '8px' }}>Application not found</h1>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '18px' }}>
              The job you tried to open does not exist anymore or has already been removed from your tracker.
            </p>
            <Link
              href="/dashboard"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '10px 14px',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #F97316, #EA580C)',
                color: '#fff',
              }}
            >
              Return to Dashboard <ArrowUpRight size={13} />
            </Link>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '18px', marginBottom: '32px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '16px',
                  flexShrink: 0,
                  background: `${getCompanyLogoColor(application.company)}1A`,
                  border: `1px solid ${getCompanyLogoColor(application.company)}33`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '20px',
                  color: getCompanyLogoColor(application.company),
                }}>
                  {getCompanyLogoText(application.company)}
                </div>
                <div>
                  <h1 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '6px' }}>
                    {application.jobTitle}
                  </h1>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 600, color: '#fff' }}>{application.company}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Briefcase size={11} /> {application.workMode || 'Work mode unavailable'}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock3 size={11} /> Added {formatDate(application.createdAt)}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: getStatusTone(application.status).color,
                  background: getStatusTone(application.status).background,
                  borderRadius: '8px',
                  border: `1px solid ${getStatusTone(application.status).border}`,
                }}>
                  {formatStatus(application.status)}
                </span>
                {application.jobUrl && (
                  <Link
                    href={application.jobUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '9px 14px',
                      fontSize: '13px',
                      fontWeight: 600,
                      border: '1px solid var(--border-color)',
                      borderRadius: '10px',
                      color: 'var(--text-secondary)',
                      background: 'var(--bg-card)',
                    }}
                  >
                    View Job Post <ExternalLink size={13} />
                  </Link>
                )}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: '20px', alignItems: 'start' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <StatusUpdater applicationId={application.id} initialStatus={application.status} />

                <div className="card" style={{ padding: '24px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '18px' }}>
                    Application Notes
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                    {application.notes ? (
                      <p>{application.notes}</p>
                    ) : (
                      <p>No notes added yet for this application.</p>
                    )}
                  </div>
                </div>

                <div className="card" style={{ padding: '24px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '18px' }}>
                    Job Description
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                    {application.jobDescription
                      ? application.jobDescription
                      : 'No job description was stored for this role yet. If this was imported from the extension, you can still use the job link to revisit the original listing.'}
                  </div>
                </div>

                <div className="card" style={{ padding: '24px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '18px' }}>
                    Skill Snapshot
                  </div>

                  <div style={{ marginBottom: '18px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#fff', marginBottom: '10px' }}>Matched Keywords</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {(application.keywords && application.keywords.length > 0)
                        ? application.keywords.map((keyword) => (
                          <span
                            key={keyword}
                            style={{
                              padding: '4px 10px',
                              borderRadius: '999px',
                              fontSize: '11px',
                              fontWeight: 600,
                              background: 'rgba(52,211,153,0.08)',
                              color: '#34D399',
                              border: '1px solid rgba(52,211,153,0.18)',
                            }}
                          >
                            {keyword}
                          </span>
                        ))
                        : <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>No keywords recorded.</span>}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#fff', marginBottom: '10px' }}>Missing Skills</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {(application.missingSkills && application.missingSkills.length > 0)
                        ? application.missingSkills.map((skill) => (
                          <span
                            key={skill}
                            style={{
                              padding: '4px 10px',
                              borderRadius: '999px',
                              fontSize: '11px',
                              fontWeight: 600,
                              background: 'rgba(251,191,36,0.08)',
                              color: '#FBBF24',
                              border: '1px solid rgba(251,191,36,0.18)',
                            }}
                          >
                            {skill}
                          </span>
                        ))
                        : <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>No missing skills flagged.</span>}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="card" style={{ padding: '22px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '18px' }}>
                    Match Score
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '18px' }}>
                    <div style={{ position: 'relative', width: '112px', height: '112px' }}>
                      <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
                        <circle cx="50" cy="50" r="42" fill="none" stroke="var(--bg-card-elevated)" strokeWidth="8" />
                        <circle
                          cx="50"
                          cy="50"
                          r="42"
                          fill="none"
                          stroke={application.matchScore >= 80 ? '#34D399' : application.matchScore >= 60 ? '#FBBF24' : '#F87171'}
                          strokeWidth="8"
                          strokeDasharray={`${2 * Math.PI * 42 * (application.matchScore / 100)} ${2 * Math.PI * 42 * (1 - (application.matchScore / 100))}`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: '28px', fontWeight: 700, lineHeight: 1 }}>{application.matchScore}%</span>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>resume fit</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                    {application.optimizedSummary
                      ? application.optimizedSummary
                      : 'No AI summary has been saved for this application yet.'}
                  </div>
                </div>

                <div className="card" style={{ padding: '22px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '16px' }}>
                    Application Facts
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {[
                      { label: 'Experience level', value: application.experience || 'Not set', icon: <Briefcase size={13} color="#60A5FA" /> },
                      { label: 'Applied on', value: formatDate(application.createdAt), icon: <CalendarCheck size={13} color="#A78BFA" /> },
                      { label: 'Last updated', value: formatDate(application.updatedAt), icon: <Clock3 size={13} color="#FBBF24" /> },
                      { label: 'Follow-up', value: getFollowUpCopy(application.updatedAt, application.followUpNeeded), icon: <CheckCircle2 size={13} color="#34D399" /> },
                      { label: 'Deadline', value: formatDate(application.deadline), icon: <Target size={13} color="#F87171" /> },
                    ].map((item) => (
                      <div
                        key={item.label}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '12px',
                          paddingBottom: '12px',
                          borderBottom: '1px solid var(--bg-card-elevated)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                          {item.icon}
                          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{item.label}</span>
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#fff', textAlign: 'right' }}>{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card" style={{ padding: '22px', background: 'rgba(249,115,22,0.04)', border: '1px solid rgba(249,115,22,0.15)' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#F97316', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '14px' }}>
                    Quick Actions
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {application.jobUrl ? (
                      <Link
                        href={application.jobUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '10px',
                          fontSize: '12px',
                          fontWeight: 700,
                          color: '#fff',
                          background: 'linear-gradient(135deg, #F97316, #EA580C)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                        }}
                      >
                        <ExternalLink size={13} /> Open Original Job
                      </Link>
                    ) : (
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                        No external job URL was stored for this application.
                      </div>
                    )}
                    <Link
                      href={`/analyzer?id=${application.id}`}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '10px',
                        fontSize: '12px',
                        fontWeight: 700,
                        color: 'var(--text-secondary)',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-color)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                      }}
                    >
                      <FileText size={13} /> Optimize for This Role
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </>
  );
}
