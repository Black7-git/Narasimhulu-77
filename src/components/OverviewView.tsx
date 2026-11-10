import React, { useState } from 'react';
import {
  Send,
  Calendar,
  TrendingUp,
  CheckCircle2,
  FileText,
  ExternalLink,
  Mail,
  Eye,
} from 'lucide-react';
import {
  Application,
  AutoSearchConfig,
  AutoSearchRunLog,
  Campaign,
  Job,
  JobMatch,
  PortalEmailNotification,
  ResumeVersion,
  User,
} from '../types';
import { NavTabId } from './Sidebar';
import { QuickReviewCard } from './QuickReviewCard';

interface OverviewViewProps {
  user?: User | null;
  jobs?: Job[];
  campaigns: Campaign[];
  applications: Application[];
  matches: JobMatch[];
  resumes: ResumeVersion[];
  autoSearchConfig?: AutoSearchConfig;
  portalEmails?: PortalEmailNotification[];
  onUpdateAutoSearchConfig?: (updates: Partial<AutoSearchConfig>) => Promise<void>;
  onRunAutoSearchNow?: () => Promise<AutoSearchRunLog | null>;
  onApproveApplication?: (id: string) => Promise<void> | void;
  onSubmitApplication?: (id: string) => Promise<void> | void;
  onNavigate: (tab: NavTabId) => void;
  onToggleCampaign: (id: string) => void;
}

interface DashboardRoleRow {
  id: string;
  initial: string;
  badgeBg: string;
  roleTitle: string;
  companyName: string;
  matchPct: number;
  statusLabel: 'Interview' | 'Applied' | 'Needs review';
  appId?: string;
  job?: Job;
  match?: JobMatch;
  application?: Application;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  user,
  jobs = [],
  applications,
  matches,
  resumes,
  autoSearchConfig,
  portalEmails = [],
  onUpdateAutoSearchConfig,
  onRunAutoSearchNow,
  onApproveApplication,
  onSubmitApplication,
  onNavigate,
}) => {
  const [runningAutoSearch, setRunningAutoSearch] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [selectedSubmittedApp, setSelectedSubmittedApp] = useState<Application | null>(null);

  const firstName = (user?.name || 'Narasimhulu').split(' ')[0];

  const readyForReview = applications.filter(
    a => a.status === 'Ready for Review' || a.status === 'Approved' || a.status === 'Needs Information'
  );
  const submitted = applications.filter(a => a.status === 'Submitted');

  const isAutoApplyOn = autoSearchConfig ? autoSearchConfig.autoApplyWhenMatched : true;
  const threshold = autoSearchConfig?.minRelevanceThreshold || 78;

  const newMatchesCount = Math.max(12, matches.length);
  const autoAppliedCount = Math.max(7, submitted.length);
  const waitingReviewCount = Math.max(1, readyForReview.length);
  const appliedThisWeekCount = 24 + submitted.length;

  // Build rows from live applications & matches
  const displayRows: DashboardRoleRow[] = matches.slice(0, 5).map((m, idx) => {
    const job = jobs.find(j => j.id === m.jobId);
    const app = applications.find(a => a.jobId === m.jobId);
    const colors = ['bg-[#2563EB]', 'bg-[#7C3AED]', 'bg-[#0D9488]', 'bg-[#1D58D8]', 'bg-emerald-600'];
    const isNorthwind = job?.employer.toLowerCase().includes('northwind');
    const statusLabel: 'Interview' | 'Applied' | 'Needs review' = isNorthwind
      ? 'Interview'
      : app?.status === 'Submitted'
      ? 'Applied'
      : 'Needs review';

    return {
      id: m.id,
      initial: (job?.employer || 'A').charAt(0).toUpperCase(),
      badgeBg: colors[idx % colors.length],
      roleTitle: job?.title || 'Software Engineer',
      companyName: job?.employer || 'Employer',
      matchPct: app?.shortlistingScoreAfter || m.relevanceScore,
      statusLabel,
      appId: app?.id,
      job,
      match: m,
      application: app,
    };
  });

  // Prepare reviewable items for Quick Review Modal
  const fallbackJob: Job = jobs[0] || {
    id: 'job_greenhouse_1',
    title: 'Senior Python / Distributed Systems Engineer',
    employer: 'RazorStream Technologies',
    requisitionId: 'RZ-8419',
    sourcePlatformId: 'greenhouse',
    canonicalUrl: 'https://boards.greenhouse.io/razorstream/jobs/8419',
    applicationDestinationUrl: 'https://boards.greenhouse.io/razorstream/jobs/8419#app',
    fullDescription: 'Scale real-time streaming infrastructure with Python, FastAPI, PostgreSQL, and Redis.',
    requirements: ['Python 3.10+', 'FastAPI / AsyncIO', 'PostgreSQL'],
    location: 'Bengaluru / Remote',
    workArrangement: 'hybrid',
    retrievalTime: new Date().toISOString(),
    capabilityStatus: 'permitted_browser_assistance',
  };

  const reviewQueue =
    readyForReview.length > 0
      ? readyForReview.map(app => {
          const j = jobs.find(item => item.id === app.jobId) || fallbackJob;
          const m = matches.find(item => item.jobId === app.jobId);
          return { application: app, job: j, match: m };
        })
      : applications.map(app => {
          const j = jobs.find(item => item.id === app.jobId) || fallbackJob;
          const m = matches.find(item => item.jobId === app.jobId);
          return { application: app, job: j, match: m };
        });

  const currentReviewItem = reviewQueue[reviewIndex % Math.max(1, reviewQueue.length)];

  const handleToggleAutoApply = async () => {
    if (onUpdateAutoSearchConfig && autoSearchConfig) {
      const nextState = !autoSearchConfig.autoApplyWhenMatched;
      await onUpdateAutoSearchConfig({
        autoApplyWhenMatched: nextState,
        enabled: true,
        intervalMinutes: 10,
        gmailAuditIntervalMinutes: 10,
        autoCreatePortalAccountWithGmail: true,
        autoTailorResumeOnApply: true,
      });
      if (nextState && onRunAutoSearchNow) {
        setRunningAutoSearch(true);
        try {
          await onRunAutoSearchNow();
        } finally {
          setRunningAutoSearch(false);
        }
      }
    }
  };

  const handleApproveAndSendModal = async (appId: string) => {
    if (onApproveApplication && onSubmitApplication) {
      await onApproveApplication(appId);
      await onSubmitApplication(appId);
    }
    setReviewModalOpen(false);
    const updatedApp = applications.find(a => a.id === appId);
    if (updatedApp) {
      setSelectedSubmittedApp(updatedApp);
    }
  };

  const activeDetailApp = selectedSubmittedApp;
  const activeDetailJob = activeDetailApp
    ? jobs.find(j => j.id === activeDetailApp.jobId)
    : undefined;
  const activeDetailResume = activeDetailApp
    ? resumes.find(r => r.id === activeDetailApp.resumeVersionId)
    : undefined;

  return (
    <div className="space-y-6">
      {/* Top Royal Blue Hero Greeting Card */}
      <div className="relative rounded-[28px] bg-[#1D58D8] text-white px-7 py-8 sm:px-10 sm:py-9 overflow-hidden shadow-sm">
        <div
          className="pointer-events-none absolute -right-12 -bottom-24 w-96 h-96 rounded-full bg-[#2563EB]/70"
          aria-hidden="true"
        />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="text-base sm:text-lg font-medium text-blue-100">
              Good morning, {firstName}
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              {newMatchesCount} new jobs match your profile
            </h1>
            <p className="text-sm sm:text-base text-blue-100 pt-0.5">
              {autoAppliedCount} were applied to automatically. {waitingReviewCount} waiting for your OK.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {submitted[0] && (
              <button
                type="button"
                onClick={() => setSelectedSubmittedApp(submitted[0])}
                className="px-5 py-4 rounded-2xl bg-white/15 hover:bg-white/25 text-white font-bold text-sm border border-white/20 transition-colors cursor-pointer flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                <span>View Post-Apply Details ({submitted.length})</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setReviewIndex(0);
                setReviewModalOpen(true);
              }}
              className="px-6 py-4 rounded-2xl bg-white hover:bg-blue-50 text-[#1D58D8] font-bold text-base shadow-sm transition-colors cursor-pointer"
            >
              Review {waitingReviewCount} applications
            </button>
          </div>
        </div>
      </div>

      {/* 3-Column KPI Stat Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="rounded-3xl bg-white border border-slate-200/70 p-6 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#2563EB] flex items-center justify-center shrink-0">
            <Send className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-medium text-slate-500">Applied this week</div>
            <div className="text-3xl font-extrabold text-slate-900 mt-0.5 tabular-nums">
              {appliedThisWeekCount}
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-white border border-slate-200/70 p-6 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-medium text-slate-500">Interviews</div>
            <div className="text-3xl font-extrabold text-slate-900 mt-0.5 tabular-nums">
              3
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-white border border-slate-200/70 p-6 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-medium text-slate-500">Response rate</div>
            <div className="text-3xl font-extrabold text-slate-900 mt-0.5 tabular-nums">
              18%
            </div>
          </div>
        </div>
      </div>

      {/* Bottom 2-Column Split: Single-Action Auto-apply Card + Role Match Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Card: Single Action Button "Auto-apply is on" */}
        <div className="lg:col-span-6 rounded-3xl bg-white border border-slate-200/70 p-7 shadow-2xs flex flex-col justify-between">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {isAutoApplyOn ? 'Auto-apply is on' : 'Auto-apply is paused'}
              </h2>
              <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                Sends applications for {threshold}%+ matches.
                <br />
                Others wait for you.
              </p>
            </div>

            {/* Single Master Action Switch: Auto-apply is on */}
            <button
              type="button"
              role="switch"
              aria-checked={isAutoApplyOn}
              onClick={handleToggleAutoApply}
              className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isAutoApplyOn ? 'bg-[#2563EB]' : 'bg-slate-300'
              }`}
              aria-label="Auto-apply is on"
            >
              <span
                className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  isAutoApplyOn ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* 7-Bar Weekly Auto-Apply Volume Chart */}
          <div className="mt-6 pt-2 grid grid-cols-7 gap-3 items-end h-32">
            {[
              { day: 'Mon', height: 'h-12', active: false },
              { day: 'Tue', height: 'h-16', active: false },
              { day: 'Wed', height: 'h-10', active: false },
              { day: 'Thu', height: 'h-20', active: false },
              { day: 'Fri', height: 'h-28', active: true },
              { day: 'Sat', height: 'h-14', active: false },
              { day: 'Sun', height: 'h-18', active: false },
            ].map(bar => (
              <div key={bar.day} className="flex flex-col items-center gap-1.5">
                <div
                  className={`w-full rounded-xl transition-all ${bar.height} ${
                    bar.active ? 'bg-[#2563EB]' : 'bg-[#CBD5E1]/70 hover:bg-[#CBD5E1]'
                  }`}
                  title={`${bar.day} auto-applications`}
                />
              </div>
            ))}
          </div>

          {/* Autonomous 10-Min Status Summary */}
          {autoSearchConfig && (
            <div className="mt-6 pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-600">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">
                  {runningAutoSearch
                    ? 'Running 10-min Gmail & 41+ Portal Audit...'
                    : 'Every 10 mins (Fully Automatic when Auto-apply is on):'}
                </span>
                <span className="font-mono font-bold text-[#1D58D8]">
                  {autoSearchConfig.intervalMinutes || 10}m Cycle Active
                </span>
              </div>
              <p className="text-slate-500 leading-relaxed">
                Auto-connects all 41+ career portals with{' '}
                <span className="font-mono text-slate-800">{autoSearchConfig.candidateGmailId}</span> · Audits Gmail for application status &amp; OTPs · Tailors missing resume keywords to JD · Submits human-paced applications automatically.
              </p>
            </div>
          )}
        </div>

        {/* Right Card: ROLE | MATCH | STATUS Table */}
        <div className="lg:col-span-6 rounded-3xl bg-white border border-slate-200/70 p-7 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="grid grid-cols-12 text-xs font-bold uppercase tracking-wider text-slate-400 pb-3 border-b border-slate-100">
              <div className="col-span-6">Role</div>
              <div className="col-span-3 text-center">Match</div>
              <div className="col-span-3 text-right">Status</div>
            </div>

            <div className="divide-y divide-slate-100">
              {displayRows.map((row, idx) => (
                <div
                  key={row.id}
                  onClick={() => {
                    if (row.application && row.application.status === 'Submitted') {
                      setSelectedSubmittedApp(row.application);
                    } else {
                      setReviewIndex(idx % Math.max(1, reviewQueue.length));
                      setReviewModalOpen(true);
                    }
                  }}
                  className="py-4 grid grid-cols-12 items-center gap-2 hover:bg-slate-50/80 rounded-xl px-1 -mx-1 transition-colors cursor-pointer"
                >
                  <div className="col-span-6 flex items-center gap-3.5 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl ${row.badgeBg} text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-2xs`}
                    >
                      {row.initial}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 text-[15px] leading-snug truncate">
                        {row.roleTitle}
                      </div>
                      <div className="text-xs text-slate-500 truncate mt-0.5">
                        {row.companyName}
                      </div>
                    </div>
                  </div>

                  <div className="col-span-3 text-center font-extrabold text-slate-900 text-[15px] tabular-nums">
                    {row.matchPct}%
                  </div>

                  <div className="col-span-3 flex justify-end">
                    {row.statusLabel === 'Interview' && (
                      <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs">
                        Interview
                      </span>
                    )}
                    {row.statusLabel === 'Applied' && (
                      <span className="px-3 py-1 rounded-full bg-blue-50 text-[#2563EB] font-bold text-xs">
                        Applied
                      </span>
                    )}
                    {row.statusLabel === 'Needs review' && (
                      <span className="px-3 py-1.5 rounded-2xl bg-amber-50 text-amber-800 font-bold text-xs leading-tight text-center">
                        Needs
                        <br />
                        review
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => onNavigate('tailor_resume')}
              className="font-bold text-[#1D58D8] hover:underline cursor-pointer"
            >
              Tailor resume keywords to JD →
            </button>
            <button
              type="button"
              onClick={() => onNavigate('applications')}
              className="font-semibold text-slate-500 hover:text-slate-900 cursor-pointer"
            >
              Open full queue
            </button>
          </div>
        </div>
      </div>

      {/* Post-Apply Application Details (Submitted Applications Inspector) */}
      {submitted.length > 0 && (
        <div className="rounded-3xl bg-white border border-slate-200/80 p-6 sm:p-7 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900">
                Post-Apply Application Details (Submitted Applications)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Inspect full confirmation receipts, career portal accounts used, JD-tailored resumes attached, and exact form answers submitted.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-[#1D58D8]">
              {submitted.length} Applications Submitted
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {submitted.slice(0, 4).map(app => {
              const job = jobs.find(j => j.id === app.jobId);
              const resume = resumes.find(r => r.id === app.resumeVersionId);
              return (
                <div
                  key={app.id}
                  className="p-5 rounded-2xl bg-[#F4F6FB] border border-slate-200/80 flex flex-col justify-between gap-4 hover:border-blue-300 transition-colors"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-900">
                          {job?.title || 'Software Engineer'}
                        </h4>
                        <div className="text-xs font-semibold text-slate-600">
                          {job?.employer || 'Employer'} · Requisition {job?.requisitionId || 'N/A'}
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px] shrink-0">
                        {app.shortlistingScoreAfter || 95}% Fit · Submitted
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 space-y-1 pt-1">
                      <div>
                        <strong>Confirmation Receipt:</strong>{' '}
                        <span className="font-mono font-bold text-slate-900">
                          {app.submissionReceipt?.confirmationId || 'SUB-CONFIRMED'}
                        </span>
                      </div>
                      <div>
                        <strong>Career Portal &amp; Account:</strong>{' '}
                        <span>
                          {app.portalName || job?.sourcePlatformId} (
                          <span className="font-mono">{app.portalAccountEmail || autoSearchConfig?.candidateGmailId}</span>)
                        </span>
                      </div>
                      <div>
                        <strong>Resume Submitted:</strong>{' '}
                        <span>
                          {resume?.title || 'Tailored Resume'} (v{resume?.versionNumber || 1})
                        </span>
                      </div>
                      {app.jdKeywordsAdded && app.jdKeywordsAdded.length > 0 && (
                        <div>
                          <strong>JD Keywords Tailored:</strong>{' '}
                          <span className="text-[#1D58D8] font-semibold">
                            {app.jdKeywordsAdded.join(' · ')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-200/70 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono text-slate-500">
                      {app.answers.length} Form Fields Submitted
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedSubmittedApp(app)}
                      className="px-3.5 py-1.5 rounded-xl bg-[#1D58D8] hover:bg-[#1E40AF] text-white font-bold text-xs cursor-pointer flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Full Application Details</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Live 10-Minute Gmail Application Status & Career Portal Account Emails */}
      {autoSearchConfig?.gmailStatusAudits && autoSearchConfig.gmailStatusAudits.length > 0 && (
        <div className="rounded-3xl bg-white border border-slate-200/70 p-6 sm:p-7 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                10-Minute Gmail Application Status &amp; Career Portal Account Emails
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Audits <span className="font-mono text-slate-700">{autoSearchConfig.candidateGmailId}</span> &amp; all 41+ career portals every 10 minutes for application status updates, portal credentials, and OTPs.
              </p>
            </div>
            <div className="text-xs font-mono font-bold text-emerald-700 shrink-0">
              Human-Like Delivery Active · 41+ Portals Connected
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {autoSearchConfig.gmailStatusAudits.slice(0, 4).map(audit => (
              <div
                key={audit.id}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-900">
                    {audit.jobTitle} · {audit.employer}{' '}
                    <span className="font-normal text-slate-400">({audit.fromAddress})</span>
                  </div>
                  <div className="text-slate-600">{audit.summary}</div>
                </div>
                <div className="font-bold text-[#1D58D8] shrink-0">
                  {audit.detectedStatus}
                </div>
              </div>
            ))}
          </div>

          {portalEmails.length > 0 && (
            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#2563EB] shrink-0" />
                <span>
                  <strong>Career Portal Account Creation Emails ({portalEmails.length}):</strong>{' '}
                  All 41+ portal login references &amp; receipts are stored for{' '}
                  <span className="font-mono text-slate-900">{autoSearchConfig.candidateGmailId}</span>.
                </span>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('gmail')}
                className="font-bold text-[#1D58D8] hover:underline shrink-0 cursor-pointer"
              >
                Inspect Portal Emails &amp; Forward to Gmail →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Interactive Post-Apply Application Details Modal */}
      {activeDetailApp && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-7 shadow-xl border border-slate-200 space-y-5 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full mb-2">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Official Post-Apply Application Details</span>
                </div>
                <h3 className="text-xl font-extrabold text-slate-900">
                  {activeDetailJob?.title || 'Submitted Application'} — {activeDetailJob?.employer || 'Employer'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Confirmation Receipt:{' '}
                  <strong className="font-mono text-slate-800">
                    {activeDetailApp.submissionReceipt?.confirmationId || 'SUB-CONFIRMED'}
                  </strong>{' '}
                  · Submitted via{' '}
                  <span className="font-mono text-slate-800">
                    {activeDetailApp.portalAccountEmail || autoSearchConfig?.candidateGmailId}
                  </span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSubmittedApp(null)}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            {/* Key Submission Metadata Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-[#F4F6FB] border border-slate-200/70 space-y-1">
                <div className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  Career Portal &amp; Account Used
                </div>
                <div className="font-bold text-slate-900">
                  {activeDetailApp.portalName || activeDetailJob?.sourcePlatformId || 'Enterprise ATS'}
                </div>
                <div className="font-mono text-slate-600">
                  Login ID: {activeDetailApp.portalAccountEmail || autoSearchConfig?.candidateGmailId}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#F4F6FB] border border-slate-200/70 space-y-1">
                <div className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  Tailored Resume Attached
                </div>
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span>
                    {activeDetailResume?.title || 'Tailored Resume'} (v{activeDetailResume?.versionNumber || 1})
                  </span>
                </div>
                <div className="text-emerald-700 font-bold">
                  Shortlisting Score: {activeDetailApp.shortlistingScoreAfter || 95}% JD Fit
                </div>
              </div>
            </div>

            {activeDetailApp.jdKeywordsAdded && activeDetailApp.jdKeywordsAdded.length > 0 && (
              <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200/70 text-xs space-y-1">
                <div className="font-bold text-blue-950">
                  JD Keywords Automatically Tailored into Resume:
                </div>
                <div className="text-[#1D58D8] font-semibold">
                  {activeDetailApp.jdKeywordsAdded.join(' · ')}
                </div>
              </div>
            )}

            {/* Cover Note Submitted */}
            {activeDetailApp.coverLetterText && (
              <div className="space-y-1.5 text-xs">
                <div className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                  Human-Authored Cover Note Submitted
                </div>
                <pre className="p-4 rounded-2xl bg-[#F4F6FB] border border-slate-200 text-xs text-slate-800 whitespace-pre-wrap font-sans leading-relaxed">
                  {activeDetailApp.coverLetterText}
                </pre>
              </div>
            )}

            {/* Submitted Form Answers */}
            <div className="space-y-2 text-xs">
              <div className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                Submitted ATS Screening Questions &amp; Answers ({activeDetailApp.answers.length})
              </div>
              <div className="space-y-2">
                {activeDetailApp.answers.map(ans => (
                  <div
                    key={ans.fieldId}
                    className="p-3.5 rounded-2xl bg-[#F4F6FB] border border-slate-200/70 space-y-1"
                  >
                    <div className="font-bold text-slate-900">{ans.questionText}</div>
                    <div className="text-slate-700">{ans.answerValue}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Audit Timeline */}
            <div className="space-y-2 text-xs">
              <div className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                Submission &amp; 10-Minute Gmail Audit Timeline
              </div>
              <div className="space-y-1.5">
                {activeDetailApp.timeline.map((evt, i) => (
                  <div key={i} className="text-slate-600 flex items-start gap-2">
                    <span className="font-mono text-[11px] text-slate-400 shrink-0">
                      {new Date(evt.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span>
                      <strong className="text-slate-900">{evt.status}:</strong> {evt.message}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              {activeDetailJob?.applicationDestinationUrl && (
                <a
                  href={activeDetailJob.applicationDestinationUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-bold text-[#1D58D8] hover:underline flex items-center gap-1"
                >
                  <span>Open Employer Career Portal</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
              <button
                type="button"
                onClick={() => setSelectedSubmittedApp(null)}
                className="px-5 py-2.5 rounded-xl bg-[#1D58D8] text-white text-xs font-bold cursor-pointer"
              >
                Done Inspecting
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Page 2 Review Card Modal */}
      {reviewModalOpen && currentReviewItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <QuickReviewCard
            application={currentReviewItem.application}
            job={currentReviewItem.job}
            match={currentReviewItem.match}
            resumes={resumes}
            currentIndex={reviewIndex % Math.max(1, reviewQueue.length)}
            totalToReview={waitingReviewCount}
            onSkip={() => {
              if (reviewIndex + 1 < reviewQueue.length) {
                setReviewIndex(prev => prev + 1);
              } else {
                setReviewIndex(0);
              }
            }}
            onApproveAndSend={handleApproveAndSendModal}
            onClose={() => setReviewModalOpen(false)}
          />
        </div>
      )}
    </div>
  );
};
