import React, { useState } from 'react';
import {
  Send,
  CheckCircle2,
  FileText,
  Clock,
  Edit3,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { Application, Campaign, Job, JobMatch, ResumeVersion } from '../types';
import { QuickReviewCard } from './QuickReviewCard';

interface ApplicationsViewProps {
  applications: Application[];
  jobs: Job[];
  matches?: JobMatch[];
  campaigns: Campaign[];
  resumes: ResumeVersion[];
  onApproveApplication: (id: string) => void;
  onSubmitApplication: (id: string) => void;
  onUpdateAnswer: (id: string, fieldKey: string, answerValue: string) => void;
  onOverrideResume: (id: string, resumeId: string) => void;
  onNavigateToInterventions: () => void;
}

export const ApplicationsView: React.FC<ApplicationsViewProps> = ({
  applications,
  jobs,
  matches = [],
  campaigns,
  resumes,
  onApproveApplication,
  onSubmitApplication,
  onUpdateAnswer,
  onOverrideResume,
  onNavigateToInterventions,
}) => {
  const [selectedAppId, setSelectedAppId] = useState<string>(applications[0]?.id || '');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editingFieldKey, setEditingFieldKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  const filteredApps = applications.filter(a => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'ready') return a.status === 'Ready for Review' || a.status === 'Approved';
    if (statusFilter === 'action') return ['Waiting for CAPTCHA', 'Waiting for Login', 'Needs Information'].includes(a.status);
    if (statusFilter === 'submitted') return ['Submitted', 'Applied', 'Interview', 'Offer'].includes(a.status);
    return true;
  });

  const selectedApp = filteredApps.find(a => a.id === selectedAppId) || filteredApps[0] || applications[0];
  const selectedIndex = Math.max(0, filteredApps.findIndex(a => a.id === selectedApp?.id));
  const linkedJob = selectedApp ? jobs.find(j => j.id === selectedApp.jobId) : null;
  const linkedMatch = selectedApp ? matches.find(m => m.jobId === selectedApp.jobId) : undefined;
  const linkedCampaign = selectedApp ? campaigns.find(c => c.id === selectedApp.campaignId) : null;
  const attachedResume = selectedApp ? resumes.find(r => r.id === selectedApp.resumeVersionId) : null;

  const handleStartEdit = (key: string, currentVal: string) => {
    setEditingFieldKey(key);
    setEditValue(currentVal);
  };

  const handleSaveEdit = (key: string) => {
    if (!selectedApp) return;
    onUpdateAnswer(selectedApp.id, key, editValue);
    setEditingFieldKey(null);
  };

  const handleQuickSkip = () => {
    if (filteredApps.length === 0) return;
    const nextIdx = (selectedIndex + 1) % filteredApps.length;
    setSelectedAppId(filteredApps[nextIdx].id);
  };

  const handleQuickApproveAndSend = (appId: string, _updatedNote?: string, resumeId?: string) => {
    if (resumeId && resumeId !== selectedApp?.resumeVersionId) {
      onOverrideResume(appId, resumeId);
    }
    onApproveApplication(appId);
    onSubmitApplication(appId);
  };

  return (
    <div className="space-y-6">
      {/* Page Header & Segmented Filter */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Applications & Quick Review
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            Review tailored cover notes, match scores, and grounded form answers before approving and sending.
          </p>
        </div>

        {/* Interactive Filter Tabs */}
        <div className="flex items-center gap-1 p-1 bg-white border border-slate-200/80 rounded-2xl self-start md:self-auto shadow-2xs">
          {[
            { id: 'all', label: `All (${applications.length})` },
            { id: 'ready', label: 'Needs review' },
            { id: 'action', label: 'Action Required' },
            { id: 'submitted', label: 'Applied' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-colors cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-[#2563EB] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 12-Column Layout: Left Queue + Center Page-2 Quick Review Card + Right Grounded Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 3 Columns: Selectable Queue List */}
        <div className="lg:col-span-3 rounded-3xl border border-slate-200/80 bg-white overflow-hidden divide-y divide-slate-100 shadow-2xs">
          <div className="px-5 py-4 bg-slate-50/60 text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Review Queue</span>
            <span className="font-mono text-slate-700 tabular-nums">{filteredApps.length}</span>
          </div>

          {filteredApps.map(app => {
            const job = jobs.find(j => j.id === app.jobId);
            const isSelected = selectedApp?.id === app.id;
            const initial = (job?.employer || 'A').charAt(0).toUpperCase();

            return (
              <button
                key={app.id}
                type="button"
                onClick={() => setSelectedAppId(app.id)}
                className={`w-full p-4 text-left transition-colors cursor-pointer flex items-start gap-3 ${
                  isSelected
                    ? 'bg-blue-50/80 border-l-4 border-l-[#2563EB]'
                    : 'bg-white hover:bg-slate-50'
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-[#2563EB] text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  {initial}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-sm text-slate-900 truncate">
                    {job?.title || 'Role'}
                  </div>
                  <div className="text-xs text-slate-500 truncate mt-0.5">
                    {job?.employer || 'Employer'}
                  </div>
                  <div className="mt-2">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        app.status === 'Submitted'
                          ? 'bg-blue-50 text-[#2563EB]'
                          : ['Waiting for CAPTCHA', 'Waiting for Login', 'Needs Information'].includes(app.status)
                          ? 'bg-rose-50 text-rose-700'
                          : 'bg-amber-50 text-amber-800'
                      }`}
                    >
                      {app.status === 'Submitted'
                        ? 'Applied'
                        : app.status === 'Ready for Review'
                        ? 'Needs review'
                        : app.status}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Center 5 Columns: Page 2 Quick Review Card */}
        <div className="lg:col-span-5">
          {selectedApp && linkedJob && (
            <QuickReviewCard
              application={selectedApp}
              job={linkedJob}
              match={linkedMatch}
              resumes={resumes}
              currentIndex={selectedIndex}
              totalToReview={filteredApps.length}
              onSkip={handleQuickSkip}
              onApproveAndSend={handleQuickApproveAndSend}
            />
          )}
        </div>

        {/* Right 4 Columns: Grounded Answers, Resume Override & Receipt Inspector */}
        <div className="lg:col-span-4 space-y-5">
          {selectedApp && linkedJob && (
            <div className="rounded-3xl border border-slate-200/80 bg-white divide-y divide-slate-100 shadow-2xs overflow-hidden">
              {/* Top Action & Status Bar */}
              <div className="p-5 flex items-center justify-between gap-2">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Application Status
                  </div>
                  <div className="text-sm font-bold text-slate-900 mt-0.5">
                    {selectedApp.status} · {linkedCampaign?.title || 'Campaign'}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {selectedApp.status === 'Ready for Review' && (
                    <button
                      onClick={() => onApproveApplication(selectedApp.id)}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-[#1D58D8] hover:bg-[#1E40AF] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Approve</span>
                    </button>
                  )}

                  {selectedApp.status === 'Approved' && (
                    <button
                      onClick={() => onSubmitApplication(selectedApp.id)}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Submit Now</span>
                    </button>
                  )}

                  {['Waiting for CAPTCHA', 'Waiting for Login'].includes(selectedApp.status) && (
                    <button
                      onClick={onNavigateToInterventions}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Take Control</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Submission Receipt & Post-Apply Details */}
              {selectedApp.submissionReceipt && (
                <div className="p-5 bg-emerald-50/70 text-xs text-emerald-950 space-y-2">
                  <div className="font-bold flex items-center justify-between gap-2 text-emerald-900">
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Official Post-Apply Receipt</span>
                    </span>
                    {selectedApp.shortlistingScoreAfter && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                        Shortlist Score: {selectedApp.shortlistingScoreAfter}%
                      </span>
                    )}
                  </div>
                  <div className="font-mono text-emerald-800">
                    Receipt ID: <strong>{selectedApp.submissionReceipt.confirmationId}</strong>
                  </div>
                  <div className="text-emerald-900">
                    Portal: <strong>{selectedApp.portalName || linkedJob.sourcePlatformId}</strong> · Account:{' '}
                    <span className="font-mono">{selectedApp.portalAccountEmail || 'narasimhulu0707@gmail.com'}</span>
                  </div>
                  <div className="text-emerald-800/90">{selectedApp.submissionReceipt.message}</div>
                  {selectedApp.jdKeywordsAdded && selectedApp.jdKeywordsAdded.length > 0 && (
                    <div className="pt-1">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 mb-1">
                        JD Keywords Tailored Before Apply:
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {selectedApp.jdKeywordsAdded.map(kw => (
                          <span
                            key={kw}
                            className="px-2 py-0.5 rounded-md bg-white border border-emerald-200 text-emerald-800 font-semibold text-[10px]"
                          >
                            + {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Attached Resume Bar */}
              <div className="p-5 bg-slate-50/50 space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#2563EB]" />
                  <span className="font-bold text-slate-800">
                    {attachedResume?.title || 'Selected Resume'} (v{attachedResume?.versionNumber})
                  </span>
                </div>

                {selectedApp.status !== 'Submitted' && (
                  <select
                    aria-label="Override resume version"
                    value={selectedApp.resumeVersionId}
                    onChange={e => onOverrideResume(selectedApp.id, e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white text-slate-800 outline-none"
                  >
                    {resumes.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.title} (v{r.versionNumber})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Grounded Form Answers */}
              <div className="p-5 space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Grounded Form Fields ({selectedApp.answers.length})
                </div>

                <div className="space-y-3">
                  {selectedApp.answers.map(ans => {
                    const isEditing = editingFieldKey === ans.fieldKey;
                    return (
                      <div key={ans.fieldId} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-bold text-slate-900">{ans.questionText}</span>
                          {selectedApp.status !== 'Submitted' && !isEditing && (
                            <button
                              onClick={() => handleStartEdit(ans.fieldKey, ans.answerValue)}
                              className="p-1 text-slate-400 hover:text-slate-800 rounded cursor-pointer"
                              aria-label="Edit answer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {isEditing ? (
                          <div className="space-y-2 pt-1">
                            <textarea
                              rows={2}
                              value={editValue}
                              onChange={e => setEditValue(e.target.value)}
                              className="w-full border border-slate-300 rounded-xl p-2 text-xs bg-white outline-none"
                            />
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => setEditingFieldKey(null)}
                                className="px-2.5 py-1 border border-slate-300 rounded-lg text-slate-600 text-xs"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleSaveEdit(ans.fieldKey)}
                                className="px-2.5 py-1 bg-[#1D58D8] text-white rounded-lg text-xs font-bold"
                              >
                                Save
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-slate-700 leading-relaxed">{ans.answerValue}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Compact Timeline */}
              <div className="p-5 space-y-2.5">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Audit Timeline</span>
                </div>
                <div className="space-y-2 text-xs">
                  {selectedApp.timeline.slice(0, 4).map((evt, idx) => (
                    <div key={idx} className="text-slate-600">
                      <span className="font-bold text-slate-800">{evt.status}: </span>
                      <span>{evt.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
