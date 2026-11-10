import React, { useState, useEffect } from 'react';
import {
  Application,
  Job,
  JobMatch,
  ResumeVersion,
} from '../types';

interface QuickReviewCardProps {
  application: Application;
  job: Job;
  match?: JobMatch;
  resumes: ResumeVersion[];
  currentIndex: number;
  totalToReview: number;
  onSkip: () => void;
  onApproveAndSend: (appId: string, updatedNote?: string, resumeId?: string) => void;
  onClose?: () => void;
}

const BADGE_COLORS = [
  'text-[#0D9488]', // Teal (K)
  'text-[#2563EB]', // Blue (N)
  'text-[#7C3AED]', // Purple (B)
  'text-[#EA580C]', // Orange
];

export const QuickReviewCard: React.FC<QuickReviewCardProps> = ({
  application,
  job,
  match,
  resumes,
  currentIndex,
  totalToReview,
  onSkip,
  onApproveAndSend,
  onClose,
}) => {
  const score = match?.relevanceScore || 81;
  const companyInitial = (job.employer || 'K').charAt(0).toUpperCase();
  const badgeColorClass =
    companyInitial === 'K'
      ? 'text-[#0D9488]'
      : companyInitial === 'N'
      ? 'text-[#2563EB]'
      : companyInitial === 'B'
      ? 'text-[#7C3AED]'
      : BADGE_COLORS[currentIndex % BADGE_COLORS.length];

  const defaultNote =
    application.coverLetterText ||
    `Hi ${job.employer.split(' ')[0]} team, I have led scalable systems across multi-product engineering teams and would bring that hands-on experience to your ${job.title} platform work.`;

  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteText, setNoteText] = useState(defaultNote);
  const [selectedResumeId, setSelectedResumeId] = useState(
    application.resumeVersionId || resumes[0]?.id || ''
  );

  useEffect(() => {
    setNoteText(
      application.coverLetterText ||
        `Hi ${job.employer.split(' ')[0]} team, I have led scalable systems across multi-product engineering teams and would bring that hands-on experience to your ${job.title} platform work.`
    );
    setSelectedResumeId(application.resumeVersionId || resumes[0]?.id || '');
    setIsEditingNote(false);
  }, [application.id, application.coverLetterText, application.resumeVersionId, job.employer, job.title, resumes]);

  // SVG Ring calculation
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const matchHeading = score >= 88 ? 'Strong match' : 'Good match';
  const matchSkillsText =
    match && match.matchingSkills.length > 0
      ? `Strong on ${match.matchingSkills.slice(0, 2).join(' and ')}.`
      : 'Strong on core architecture and technical leadership.';
  const missingText =
    match && match.missingRequirements.length > 0
      ? `Missing ${match.missingRequirements[0].toLowerCase()}.`
      : 'Verified against all core role requirements.';

  const workArrangementLabel =
    job.workArrangement === 'remote'
      ? 'Remote'
      : job.workArrangement === 'hybrid'
      ? 'Hybrid'
      : job.location.split(',')[0];

  return (
    <div className="w-full max-w-[440px] mx-auto rounded-[32px] bg-[#F4F6FB] shadow-xl overflow-hidden border border-slate-200/80 flex flex-col">
      {/* Top Royal Blue Header Banner with Circular Geometry */}
      <div className="relative bg-[#1D58D8] text-white px-7 pt-7 pb-16 overflow-hidden">
        {/* Decorative Subtle Concentric Circle Arcs matching Page 2 */}
        <div
          className="pointer-events-none absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/10 border border-white/20"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/5"
          aria-hidden="true"
        />

        <div className="relative z-10 flex items-center justify-between">
          <span className="text-sm font-medium text-blue-100">
            {currentIndex + 1} of {Math.max(1, totalToReview)} to review
          </span>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="text-blue-100 hover:text-white text-xs font-semibold px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
            >
              Close ✕
            </button>
          )}
        </div>

        <div className="relative z-10 mt-5 flex items-center gap-4">
          <div
            className={`w-14 h-14 rounded-2xl bg-white flex items-center justify-center font-extrabold text-2xl shadow-sm shrink-0 ${badgeColorClass}`}
          >
            {companyInitial}
          </div>
          <div className="min-w-0">
            <h2 className="text-2xl font-bold text-white tracking-tight leading-tight truncate">
              {job.title}
            </h2>
            <p className="text-base text-blue-100 mt-0.5 truncate">
              {job.employer} · {workArrangementLabel}
            </p>
          </div>
        </div>
      </div>

      {/* Overlapping Match Score Card */}
      <div className="px-5 -mt-10 relative z-20 space-y-4 pb-6">
        <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-100 flex items-center gap-5">
          {/* Circular Progress Ring */}
          <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
            <svg className="w-24 h-24 -rotate-90" viewBox="0 0 92 92">
              <circle
                cx="46"
                cy="46"
                r={radius}
                fill="none"
                stroke="#E2E8F0"
                strokeWidth="8"
              />
              <circle
                cx="46"
                cy="46"
                r={radius}
                fill="none"
                stroke="#2563EB"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
              />
            </svg>
            <span className="absolute text-xl font-extrabold text-slate-900 tabular-nums">
              {score}%
            </span>
          </div>

          <div className="min-w-0">
            <h3 className="text-xl font-bold text-slate-900">{matchHeading}</h3>
            <p className="text-sm text-slate-600 mt-1 leading-relaxed">
              {matchSkillsText} {missingText}
            </p>
          </div>
        </div>

        {/* Tailored Cover Note Card */}
        <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-100 flex flex-col justify-between min-h-[250px]">
          <div>
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-xl font-bold text-slate-900">Tailored cover note</h3>
              <span className="px-3.5 py-1 rounded-full bg-[#EDE9FE] text-[#5B21B6] text-xs font-bold">
                AI written
              </span>
            </div>

            {isEditingNote ? (
              <div className="mt-4 space-y-3">
                <textarea
                  rows={4}
                  value={noteText}
                  onChange={e => setNoteText(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-3 text-sm text-slate-800 leading-relaxed focus:ring-2 focus:ring-[#2563EB] outline-none"
                />
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Attached Résumé Version
                  </label>
                  <select
                    value={selectedResumeId}
                    onChange={e => setSelectedResumeId(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-800 bg-white outline-none"
                  >
                    {resumes.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.title} (v{r.versionNumber})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-base text-slate-700 leading-relaxed whitespace-pre-line">
                {noteText}
              </p>
            )}
          </div>

          <div className="mt-6 pt-2">
            <button
              type="button"
              onClick={() => setIsEditingNote(prev => !prev)}
              className="text-sm font-bold text-[#1D58D8] underline underline-offset-4 hover:text-blue-800 cursor-pointer"
            >
              {isEditingNote ? 'Done editing résumé & note' : 'Edit résumé & note'}
            </button>
          </div>
        </div>

        {/* Bottom Action Buttons: Skip & Approve & send */}
        <div className="pt-1 flex items-center gap-3.5">
          <button
            type="button"
            onClick={onSkip}
            className="px-7 py-4 rounded-2xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-900 font-bold text-base transition-colors cursor-pointer shadow-2xs"
          >
            Skip
          </button>

          <button
            type="button"
            onClick={() => onApproveAndSend(application.id, noteText, selectedResumeId)}
            className="flex-1 py-4 px-6 rounded-2xl bg-[#1D58D8] hover:bg-[#1E40AF] text-white font-bold text-base transition-colors cursor-pointer shadow-sm"
          >
            Approve & send
          </button>
        </div>
      </div>
    </div>
  );
};
