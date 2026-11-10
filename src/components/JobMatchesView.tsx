import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  ExternalLink,
  ArrowRight,
  Play,
  Clock,
  CheckCircle2,
  Mail,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import {
  Application,
  AutoSearchConfig,
  AutoSearchRunLog,
  Campaign,
  Job,
  JobMatch,
} from '../types';

interface JobMatchesViewProps {
  jobs: Job[];
  matches: JobMatch[];
  campaigns: Campaign[];
  applications: Application[];
  autoSearchConfig?: AutoSearchConfig;
  onUpdateAutoSearchConfig: (updates: Partial<AutoSearchConfig>) => Promise<void>;
  onRunAutoSearchNow: () => Promise<AutoSearchRunLog | null>;
  onImportJob: (jobData: {
    title: string;
    employer: string;
    canonicalUrl: string;
    description: string;
    requirements: string[];
    location: string;
    salaryDisplay: string;
    campaignId: string;
  }) => void;
  onCreateApplication: (matchId: string) => void;
}

export const JobMatchesView: React.FC<JobMatchesViewProps> = ({
  jobs,
  matches,
  campaigns,
  applications,
  autoSearchConfig,
  onUpdateAutoSearchConfig,
  onRunAutoSearchNow,
  onImportJob,
  onCreateApplication,
}) => {
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showImportModal, setShowImportModal] = useState<boolean>(false);

  // Auto-Search state
  const [gmailInput, setGmailInput] = useState<string>(
    autoSearchConfig?.candidateGmailId || 'narasimhulu0707@gmail.com'
  );
  useEffect(() => {
    if (autoSearchConfig?.candidateGmailId) {
      setGmailInput(autoSearchConfig.candidateGmailId);
    }
  }, [autoSearchConfig?.candidateGmailId]);
  const [isRunningCycle, setIsRunningCycle] = useState<boolean>(false);
  const [latestRunBanner, setLatestRunBanner] = useState<AutoSearchRunLog | null>(null);
  const [gmailSavedToast, setGmailSavedToast] = useState<boolean>(false);

  // Form fields for manual URL import
  const [importTitle, setImportTitle] = useState('');
  const [importEmployer, setImportEmployer] = useState('');
  const [importUrl, setImportUrl] = useState('');
  const [importDesc, setImportDesc] = useState('');
  const [importLocation, setImportLocation] = useState('Remote (India)');
  const [importSalary, setImportSalary] = useState('₹24,00,000 PA');
  const [importCampaign, setImportCampaign] = useState(campaigns[0]?.id || '');
  const [importError, setImportError] = useState<string | null>(null);

  const filteredMatches = matches.filter(m => {
    if (selectedCampaignId !== 'all' && m.campaignId !== selectedCampaignId) return false;
    const job = jobs.find(j => j.id === m.jobId);
    if (!job) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        job.title.toLowerCase().includes(q) ||
        job.employer.toLowerCase().includes(q) ||
        job.requirements.some(r => r.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleRunCycleNow = async () => {
    setIsRunningCycle(true);
    try {
      const log = await onRunAutoSearchNow();
      if (log) {
        setLatestRunBanner(log);
      }
    } finally {
      setIsRunningCycle(false);
    }
  };

  const handleSaveGmailId = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gmailInput.trim() || !gmailInput.includes('@')) return;
    await onUpdateAutoSearchConfig({ candidateGmailId: gmailInput.trim().toLowerCase() });
    setGmailSavedToast(true);
    setTimeout(() => setGmailSavedToast(false), 2500);
  };

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setImportError(null);
    try {
      await onImportJob({
        title: importTitle,
        employer: importEmployer,
        canonicalUrl: importUrl,
        description: importDesc,
        requirements: ['Python', 'Cloud Services', 'System Design'],
        location: importLocation,
        salaryDisplay: importSalary,
        campaignId: importCampaign,
      });
      setShowImportModal(false);
      setImportTitle('');
      setImportEmployer('');
      setImportUrl('');
      setImportDesc('');
    } catch (err: any) {
      setImportError(err.message || 'Failed to import job');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              <span>Career Portal & Hiring Platform Engine</span>
              <span>·</span>
              <span>Every 1 Hour Schedule</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Automated Job Search & Career Portal Auto-Apply
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl">
              Scans hiring platforms and employer career portals every 1 hour for matching roles. When a role fits your active campaign threshold, ApplyPilot automatically provisions a career portal account using your Gmail ID (if no account exists) and submits the grounded application.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={handleRunCycleNow}
              disabled={isRunningCycle}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white font-semibold text-xs transition-colors cursor-pointer"
            >
              {isRunningCycle ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5" />
              )}
              <span>{isRunningCycle ? 'Scanning Portals...' : 'Run Search & Auto-Apply Now'}</span>
            </button>

            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Import Job URL</span>
            </button>
          </div>
        </div>
      </div>

      {/* Hourly Automation Control & Gmail Portal Account Provisioning Panel */}
      {autoSearchConfig && (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-slate-700" />
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  1-Hour Automated Career Portal Search & Gmail Account Provisioning
                </h2>
                <p className="text-xs text-slate-500">
                  Cycle Interval: Every {autoSearchConfig.intervalMinutes} minutes (1 Hour) · Minimum Fit Score: {autoSearchConfig.minRelevanceThreshold}%
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono text-slate-600 tabular-nums">
              <span>
                Last Scan:{' '}
                <strong className="text-slate-900">
                  {autoSearchConfig.lastRunAt
                    ? new Date(autoSearchConfig.lastRunAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'Pending'}
                </strong>
              </span>
              <span>·</span>
              <span>
                Next Scan:{' '}
                <strong className="text-slate-900">
                  {autoSearchConfig.nextRunAt
                    ? new Date(autoSearchConfig.nextRunAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'In 60m'}
                </strong>
              </span>
            </div>
          </div>

          {latestRunBanner && (
            <div className="px-6 py-3.5 bg-emerald-50/90 border-b border-emerald-200 flex items-start justify-between gap-4">
              <div className="flex items-start gap-2.5 text-xs text-emerald-950">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Hourly Search & Auto-Apply Cycle Complete: </span>
                  <span>{latestRunBanner.summary}</span>
                </div>
              </div>
              <button
                onClick={() => setLatestRunBanner(null)}
                className="text-xs font-semibold text-emerald-800 hover:underline shrink-0 cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* 4-Column Telemetry & Controls */}
          <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left 7 columns: Toggle switches + Gmail ID Configuration */}
            <div className="lg:col-span-7 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Toggle 1: Hourly Schedule */}
                <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/40 flex flex-col justify-between gap-2">
                  <div>
                    <div className="text-xs font-semibold text-slate-900">Hourly Job Search</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Scan portals every 1 hour
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      onUpdateAutoSearchConfig({ enabled: !autoSearchConfig.enabled })
                    }
                    className={`mt-2 w-full py-1.5 px-3 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                      autoSearchConfig.enabled
                        ? 'bg-emerald-700 text-white hover:bg-emerald-800'
                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    }`}
                  >
                    {autoSearchConfig.enabled ? 'Active (Every 1h)' : 'Paused'}
                  </button>
                </div>

                {/* Toggle 2: Auto-Apply on Fit */}
                <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/40 flex flex-col justify-between gap-2">
                  <div>
                    <div className="text-xs font-semibold text-slate-900">Auto-Apply on Fit</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Submit if score ≥ {autoSearchConfig.minRelevanceThreshold}%
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      onUpdateAutoSearchConfig({
                        autoApplyWhenMatched: !autoSearchConfig.autoApplyWhenMatched,
                      })
                    }
                    className={`mt-2 w-full py-1.5 px-3 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                      autoSearchConfig.autoApplyWhenMatched
                        ? 'bg-slate-900 text-white hover:bg-slate-800'
                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    }`}
                  >
                    {autoSearchConfig.autoApplyWhenMatched ? 'Auto-Apply Enabled' : 'Review Mode Only'}
                  </button>
                </div>

                {/* Toggle 3: Auto-Create Career Portal Account */}
                <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/40 flex flex-col justify-between gap-2">
                  <div>
                    <div className="text-xs font-semibold text-slate-900">
                      Portal Account Creation
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Create account using Gmail ID
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      onUpdateAutoSearchConfig({
                        autoCreatePortalAccountWithGmail:
                          !autoSearchConfig.autoCreatePortalAccountWithGmail,
                      })
                    }
                    className={`mt-2 w-full py-1.5 px-3 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                      autoSearchConfig.autoCreatePortalAccountWithGmail
                        ? 'bg-slate-900 text-white hover:bg-slate-800'
                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    }`}
                  >
                    {autoSearchConfig.autoCreatePortalAccountWithGmail
                      ? 'Auto-Create with Gmail'
                      : 'Manual Login Only'}
                  </button>
                </div>
              </div>

              {/* Candidate Gmail ID Form */}
              <form
                onSubmit={handleSaveGmailId}
                className="p-4 rounded-lg border border-slate-200 bg-slate-50/50 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-600" />
                    <span>Unified Gmail ID for Career Portal Account Registration & Auto-Apply</span>
                  </label>
                  {gmailSavedToast && (
                    <span className="text-[11px] font-semibold text-emerald-700">
                      ✓ Gmail ID Saved
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500">
                  When a matching role is found on an employer career portal (Workday, SmartRecruiters, Greenhouse, Lever, Ashby) where you do not yet have an account, ApplyPilot registers and verifies your portal account using this same Gmail address.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="email"
                    required
                    value={gmailInput}
                    onChange={e => setGmailInput(e.target.value)}
                    placeholder="your.name@gmail.com"
                    className="flex-1 border border-slate-300 bg-white rounded-lg px-3 py-1.5 text-xs font-mono text-slate-900 focus:ring-2 focus:ring-slate-900 outline-none"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Update Gmail ID
                  </button>
                </div>
              </form>
            </div>

            {/* Right 5 columns: Provisioned Career Portal Accounts & Run History */}
            <div className="lg:col-span-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <span>
                    Auto-Provisioned Career Portal Accounts ({autoSearchConfig.portalAccounts.length})
                  </span>
                </div>
                <span className="text-[11px] font-mono text-slate-500 tabular-nums">
                  Auto-Applied: {autoSearchConfig.totalAutoAppliedCount}
                </span>
              </div>

              <div className="border border-slate-200 rounded-lg divide-y divide-slate-200 max-h-52 overflow-y-auto bg-white">
                {autoSearchConfig.portalAccounts.slice(0, 6).map(acc => (
                  <div key={acc.id} className="px-3.5 py-2.5 flex items-center justify-between gap-2 text-xs">
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-900 truncate">{acc.portalName}</div>
                      <div className="text-[11px] text-slate-500 font-mono truncate">
                        {acc.portalDomain} · {acc.emailUsed}
                      </div>
                    </div>
                    <span className="shrink-0 px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-semibold">
                      Verified
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by role, employer, skill..."
              className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-slate-900 outline-none"
            />
          </div>

          <select
            value={selectedCampaignId}
            onChange={e => setSelectedCampaignId(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-700 bg-white outline-none"
          >
            <option value="all">All Campaigns ({matches.length})</option>
            {campaigns.map(c => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs text-slate-500 font-mono tabular-nums">
          Showing {filteredMatches.length} matching openings
        </div>
      </div>

      {/* Matches Grid */}
      <div className="space-y-4">
        {filteredMatches.map(match => {
          const job = jobs.find(j => j.id === match.jobId);
          const existingApp = applications.find(a => a.jobId === match.jobId);
          if (!job) return null;

          return (
            <div
              key={match.id}
              className="rounded-xl border border-slate-200 bg-white p-5 hover:border-slate-300 transition-colors"
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-slate-900 text-base">{job.title}</span>
                    <span className="text-xs text-slate-400">·</span>
                    <span className="text-sm font-semibold text-slate-700">{job.employer}</span>
                    {existingApp && (
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                          existingApp.status === 'Submitted'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {existingApp.status === 'Submitted'
                          ? `Auto-Applied (${existingApp.submissionReceipt?.confirmationId || 'Confirmed'})`
                          : existingApp.status}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span>{job.location}</span>
                    <span>·</span>
                    <span className="capitalize">{job.workArrangement}</span>
                    {job.salaryDisplay && (
                      <>
                        <span>·</span>
                        <span className="font-medium text-slate-800">{job.salaryDisplay}</span>
                      </>
                    )}
                    <span>·</span>
                    <span>Portal: {job.sourcePlatformId}</span>
                    <span>·</span>
                    <span className="font-mono text-[11px]">Req: {job.requisitionId}</span>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 mt-2">
                    {job.fullDescription}
                  </p>
                </div>

                {/* Score & Action Button */}
                <div className="flex md:flex-col items-center md:items-end justify-between md:justify-start gap-3 shrink-0">
                  <div className="text-right">
                    <div className="text-2xl font-bold font-mono text-slate-900 leading-none tabular-nums">
                      {match.relevanceScore}%
                    </div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mt-0.5">
                      Relevance Fit
                    </div>
                  </div>

                  {existingApp?.status === 'Submitted' ? (
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Application Submitted</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => onCreateApplication(match.id)}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <span>Prepare Application</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Match Criteria Breakdown */}
              <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                    Matching Verified Skills:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {match.matchingSkills.map(s => (
                      <span
                        key={s}
                        className="bg-emerald-50 text-emerald-800 font-medium px-2 py-0.5 rounded text-[11px]"
                      >
                        ✓ {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                    Relevant Projects:
                  </span>
                  <ul className="list-disc list-inside text-slate-600 text-[11px] space-y-0.5">
                    {match.relevantProjects.map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                    Missing / Additional Criteria:
                  </span>
                  {match.missingRequirements.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {match.missingRequirements.map(m => (
                        <span
                          key={m}
                          className="bg-amber-50 text-amber-800 font-medium px-2 py-0.5 rounded text-[11px]"
                        >
                          ! {m}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-emerald-700 text-[11px]">No missing core requirements</span>
                  )}
                </div>
              </div>

              {/* Score Explanation */}
              <div className="mt-3 pt-2 text-[11px] text-slate-500 flex items-center justify-between">
                <span>Explanation: {match.scoreExplanation}</span>
                <a
                  href={job.canonicalUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-slate-600 hover:text-slate-900 flex items-center gap-1 font-medium"
                >
                  <span>Official Career Portal</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Import Job from Career Portal URL</h2>

            {importError && (
              <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
                {importError}
              </div>
            )}

            <form onSubmit={handleImportSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Role Title</label>
                <input
                  type="text"
                  required
                  value={importTitle}
                  onChange={e => setImportTitle(e.target.value)}
                  placeholder="e.g. Senior Backend Engineer"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Employer / Company Name
                </label>
                <input
                  type="text"
                  required
                  value={importEmployer}
                  onChange={e => setImportEmployer(e.target.value)}
                  placeholder="e.g. Stripe, Razorpay, Zepto"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Official Application URL
                </label>
                <input
                  type="url"
                  required
                  value={importUrl}
                  onChange={e => setImportUrl(e.target.value)}
                  placeholder="https://jobs.lever.co/... or https://boards.greenhouse.io/..."
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Job Description / Requirements
                </label>
                <textarea
                  rows={3}
                  required
                  value={importDesc}
                  onChange={e => setImportDesc(e.target.value)}
                  placeholder="Paste job details or requirements..."
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assign to Campaign
                </label>
                <select
                  value={importCampaign}
                  onChange={e => setImportCampaign(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                >
                  {campaigns.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 text-sm hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-800"
                >
                  Import & Deduplicate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
