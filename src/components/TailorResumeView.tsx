import React, { useState, useEffect } from 'react';
import {
  FileText,
  CheckCircle2,
  Plus,
  ArrowRight,
  RefreshCw,
  Eye,
  Briefcase,
  Check,
} from 'lucide-react';
import {
  Job,
  MasterProfile,
  ResumeVersion,
  TailoredResumeResult,
} from '../types';

interface TailorResumeViewProps {
  resumes: ResumeVersion[];
  jobs: Job[];
  masterProfile: MasterProfile | null;
  tailoredHistory: TailoredResumeResult[];
  onRefreshState: () => Promise<void>;
}

interface KeywordAnalysisState {
  extractedJDKeywords: string[];
  matchedKeywords: string[];
  missingKeywords: string[];
  scoreBefore: number;
  projectedScoreAfter: number;
}

export const TailorResumeView: React.FC<TailorResumeViewProps> = ({
  resumes,
  jobs,
  tailoredHistory,
  onRefreshState,
}) => {
  const defaultResume = resumes.find(r => r.isDefault) || resumes[0];
  const [selectedResumeId, setSelectedResumeId] = useState<string>(defaultResume?.id || '');
  const [selectedJobId, setSelectedJobId] = useState<string>(jobs[0]?.id || 'custom');

  // Job Description (JD) fields — accessible & editable anytime
  const [jobTitle, setJobTitle] = useState<string>(
    jobs[0]?.title || 'Senior Python / Distributed Systems Engineer'
  );
  const [employer, setEmployer] = useState<string>(
    jobs[0]?.employer || 'RazorStream Technologies'
  );
  const [jdText, setJdText] = useState<string>(
    jobs[0]?.fullDescription ||
      'We are seeking an experienced Backend Engineer to scale our real-time streaming infrastructure. Responsibilities include designing async Python microservices with FastAPI, Kubernetes orchestration, Redis & Kafka event pipelines, optimizing PostgreSQL performance, and collaborating on Distributed Systems architecture.'
  );
  const [requirementsText, setRequirementsText] = useState<string>(
    jobs[0]?.requirements?.join(', ') ||
      'Python 3.10+, FastAPI, PostgreSQL, Kubernetes, Redis, Kafka, Distributed Systems, System Design'
  );

  const [customKeywordInput, setCustomKeywordInput] = useState<string>('');
  const [extraKeywords, setExtraKeywords] = useState<string[]>([]);
  const [analysis, setAnalysis] = useState<KeywordAnalysisState | null>(null);
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [tailoring, setTailoring] = useState<boolean>(false);
  const [latestResult, setLatestResult] = useState<TailoredResumeResult | null>(
    tailoredHistory[0] || null
  );
  const [showFullJD, setShowFullJD] = useState<boolean>(true);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Sync JD fields when user picks a job from the dropdown
  const handleSelectJob = (jobId: string) => {
    setSelectedJobId(jobId);
    setStatusMessage(null);
    if (jobId === 'custom') {
      return;
    }
    const found = jobs.find(j => j.id === jobId);
    if (found) {
      setJobTitle(found.title);
      setEmployer(found.employer);
      setJdText(found.fullDescription);
      setRequirementsText((found.requirements || []).join(', '));
    }
  };

  // Analyze missing JD keywords whenever resume or JD changes
  const runKeywordGapAnalysis = async () => {
    if (!selectedResumeId) return;
    setAnalyzing(true);
    try {
      const reqList = requirementsText
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
      const res = await fetch('/api/resumes/analyze-jd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeId: selectedResumeId,
          jobTitle,
          jobDescriptionText: jdText,
          requirements: reqList,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setAnalysis(data.analysis);
      }
    } catch (err) {
      console.error('Failed to analyze JD:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  useEffect(() => {
    runKeywordGapAnalysis();
  }, [selectedResumeId, jobTitle, employer, jdText, requirementsText]);

  const handleAddCustomKeyword = () => {
    const clean = customKeywordInput.trim();
    if (!clean) return;
    if (!extraKeywords.includes(clean)) {
      setExtraKeywords(prev => [...prev, clean]);
    }
    setCustomKeywordInput('');
  };

  const handleTailorResumeNow = async () => {
    setTailoring(true);
    setStatusMessage(null);
    try {
      const reqList = requirementsText
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      const res = await fetch('/api/resumes/tailor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeId: selectedResumeId,
          jobId: selectedJobId !== 'custom' ? selectedJobId : undefined,
          jobTitle,
          employer,
          jobDescriptionText: jdText,
          requirements: reqList,
          customKeywordsToAdd: extraKeywords,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setLatestResult(data.tailoringResult);
        setStatusMessage(
          `Tailored resume created (${data.tailoredResume.title})! Added ${data.tailoringResult.missingKeywordsAdded.length} missing JD keywords and boosted shortlisting score from ${data.tailoringResult.scoreBefore}% to ${data.tailoringResult.scoreAfter}%.`
        );
        await onRefreshState();
      }
    } catch (err) {
      console.error('Failed to tailor resume:', err);
    } finally {
      setTailoring(false);
    }
  };

  const currentBaseResume =
    resumes.find(r => r.id === selectedResumeId) || defaultResume;

  return (
    <div className="space-y-6">
      {/* Top Hero Banner */}
      <div className="relative rounded-[28px] bg-[#1D58D8] text-white px-7 py-8 sm:px-10 sm:py-9 overflow-hidden shadow-sm">
        <div
          className="pointer-events-none absolute -right-12 -bottom-24 w-96 h-96 rounded-full bg-[#2563EB]/70"
          aria-hidden="true"
        />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="text-xs font-bold uppercase tracking-wider text-blue-100">
              Special Feature · ATS Shortlisting Optimizer
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Tailor Resume Based on Job Description (JD)
            </h1>
            <p className="text-sm sm:text-base text-blue-100 pt-0.5 leading-relaxed">
              Automatically detects missing JD keywords in your resume, injects grounded skills and human-written impact bullets, and maximizes your shortlisting probability before applying.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleTailorResumeNow}
              disabled={tailoring}
              className="px-6 py-4 rounded-2xl bg-white hover:bg-blue-50 text-[#1D58D8] font-bold text-sm sm:text-base shadow-sm transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap"
            >
              {tailoring ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4 stroke-[3]" />
              )}
              <span>
                {tailoring ? 'Tailoring Resume to JD...' : 'Tailor Resume to JD Now'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {statusMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm font-semibold flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Main 2-Column Workspace: Left = JD Access & Selector | Right = Missing Keywords & Tailored Output */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (6 cols): Base Resume + Full Job Description (JD) Access */}
        <div className="lg:col-span-6 rounded-3xl bg-white border border-slate-200/80 p-6 sm:p-7 shadow-2xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                1. Job Description (JD) & Base Resume
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Select any career portal job or paste/edit a custom JD when required.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowFullJD(prev => !prev)}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{showFullJD ? 'Compact JD View' : 'Full JD Access'}</span>
            </button>
          </div>

          {/* Select Base Resume */}
          <div>
            <label
              htmlFor="tailor-resume-select"
              className="block text-xs font-bold text-slate-700 mb-1.5"
            >
              Select Base Resume Version
            </label>
            <select
              id="tailor-resume-select"
              value={selectedResumeId}
              onChange={e => setSelectedResumeId(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-[#F4F6FB] border border-slate-200 text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#2563EB] outline-none"
            >
              {resumes.map(r => (
                <option key={r.id} value={r.id}>
                  {r.title} (v{r.versionNumber}) — {r.highlightedSkills.slice(0, 4).join(', ')}
                </option>
              ))}
            </select>
          </div>

          {/* Select Target Career Portal Job or Custom JD */}
          <div>
            <label
              htmlFor="tailor-job-select"
              className="block text-xs font-bold text-slate-700 mb-1.5"
            >
              Select Career Portal Job or Custom JD
            </label>
            <select
              id="tailor-job-select"
              value={selectedJobId}
              onChange={e => handleSelectJob(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-[#F4F6FB] border border-slate-200 text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#2563EB] outline-none"
            >
              {jobs.map(j => (
                <option key={j.id} value={j.id}>
                  {j.title} — {j.employer} ({j.requisitionId})
                </option>
              ))}
              <option value="custom">+ Paste / Edit Custom Job Description (JD)</option>
            </select>
          </div>

          {/* Editable JD Access Panel */}
          {showFullJD && (
            <div className="space-y-4 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="jd-role-title"
                    className="block text-xs font-bold text-slate-700 mb-1"
                  >
                    Target Role Title
                  </label>
                  <input
                    id="jd-role-title"
                    type="text"
                    value={jobTitle}
                    onChange={e => setJobTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F4F6FB] border border-slate-200 text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#2563EB] outline-none"
                  />
                </div>
                <div>
                  <label
                    htmlFor="jd-employer"
                    className="block text-xs font-bold text-slate-700 mb-1"
                  >
                    Company / Employer
                  </label>
                  <input
                    id="jd-employer"
                    type="text"
                    value={employer}
                    onChange={e => setEmployer(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F4F6FB] border border-slate-200 text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#2563EB] outline-none"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="jd-full-text"
                  className="block text-xs font-bold text-slate-700 mb-1"
                >
                  Full Job Description (JD) Text
                </label>
                <textarea
                  id="jd-full-text"
                  rows={5}
                  value={jdText}
                  onChange={e => setJdText(e.target.value)}
                  placeholder="Paste or inspect the full Job Description here..."
                  className="w-full p-3.5 rounded-2xl bg-[#F4F6FB] border border-slate-200 text-sm text-slate-800 leading-relaxed focus:bg-white focus:ring-2 focus:ring-[#2563EB] outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="jd-requirements"
                  className="block text-xs font-bold text-slate-700 mb-1"
                >
                  Key JD Requirements & Technical Keywords (Comma-separated)
                </label>
                <input
                  id="jd-requirements"
                  type="text"
                  value={requirementsText}
                  onChange={e => setRequirementsText(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F4F6FB] border border-slate-200 text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#2563EB] outline-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Right Column (6 cols): Missing Keywords Detector + Shortlisting Boost + Tailored Output */}
        <div className="lg:col-span-6 space-y-6">
          {/* Card A: Keyword Gap & Shortlisting Probability */}
          <div className="rounded-3xl bg-white border border-slate-200/80 p-6 sm:p-7 shadow-2xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  2. Missing JD Keywords & Shortlisting Boost
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Comparing <span className="font-semibold text-slate-700">{currentBaseResume?.title}</span> against <span className="font-semibold text-slate-700">{employer}</span> JD.
                </p>
              </div>
              {analyzing && (
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Scanning JD...
                </span>
              )}
            </div>

            {/* Before vs After Shortlisting Probability */}
            {analysis && (
              <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-[#F4F6FB] border border-slate-200/70">
                <div>
                  <div className="text-xs font-semibold text-slate-500">
                    Current Resume Shortlisting Score
                  </div>
                  <div className="text-2xl font-extrabold text-slate-800 mt-1 tabular-nums">
                    {analysis.scoreBefore}%
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {analysis.missingKeywords.length} JD keywords missing
                  </div>
                </div>

                <div className="border-l border-slate-200 pl-4">
                  <div className="text-xs font-semibold text-[#1D58D8]">
                    After JD Keyword Tailoring
                  </div>
                  <div className="text-2xl font-extrabold text-emerald-600 mt-1 tabular-nums flex items-center gap-1.5">
                    <span>{analysis.projectedScoreAfter}%</span>
                    <span className="text-xs font-bold text-emerald-700">
                      (+{analysis.projectedScoreAfter - analysis.scoreBefore}% Boost)
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600 mt-0.5">
                    100% JD keyword & ATS alignment
                  </div>
                </div>
              </div>
            )}

            {/* Missing Keywords to Inject */}
            <div>
              <div className="text-xs font-bold text-slate-800 mb-2">
                Missing Keywords Detected in JD (Will Be Added Automatically)
              </div>
              <div className="text-xs text-slate-700 leading-relaxed p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80">
                {analysis && analysis.missingKeywords.length > 0 ? (
                  <div className="font-semibold text-amber-950">
                    {Array.from(new Set([...analysis.missingKeywords, ...extraKeywords])).join(' · ')}
                  </div>
                ) : (
                  <span className="text-slate-600">
                    All primary JD keywords detected. Add custom keywords below to emphasize specific strengths.
                  </span>
                )}
              </div>
            </div>

            {/* Matched Keywords Already Present */}
            <div>
              <div className="text-xs font-bold text-slate-700 mb-1.5">
                Keywords Already Present in Your Resume
              </div>
              <div className="text-xs text-slate-600 leading-relaxed">
                {analysis && analysis.matchedKeywords.length > 0
                  ? analysis.matchedKeywords.join(' · ')
                  : currentBaseResume?.highlightedSkills.join(' · ')}
              </div>
            </div>

            {/* Add Custom Keyword Input */}
            <div className="pt-1">
              <label
                htmlFor="custom-kw-input"
                className="block text-xs font-bold text-slate-700 mb-1.5"
              >
                Add Additional JD Keyword or Domain Skill
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="custom-kw-input"
                  type="text"
                  value={customKeywordInput}
                  onChange={e => setCustomKeywordInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomKeyword();
                    }
                  }}
                  placeholder="e.g. GraphQL, vLLM, System Design, SOC2..."
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#F4F6FB] border border-slate-200 text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#2563EB] outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddCustomKeyword}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Keyword</span>
                </button>
              </div>
            </div>

            {/* Primary Action Button */}
            <button
              type="button"
              onClick={handleTailorResumeNow}
              disabled={tailoring}
              className="w-full py-4 px-6 rounded-2xl bg-[#1D58D8] hover:bg-[#1E40AF] text-white font-bold text-sm shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>
                {tailoring
                  ? 'Injecting JD Keywords & Tailoring Resume...'
                  : `Tailor Resume for ${employer} & Boost Shortlisting to ${
                      analysis?.projectedScoreAfter || 96
                    }%`}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Card B: Latest Tailored Resume Preview */}
          {latestResult && (
            <div className="rounded-3xl bg-white border border-slate-200/80 p-6 sm:p-7 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <FileText className="w-5 h-5 text-[#2563EB]" />
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Tailored Resume Output — {latestResult.employer} ({latestResult.jobTitle})
                    </h3>
                    <p className="text-xs text-slate-500">
                      Shortlisting Score: <span className="font-bold text-emerald-700 tabular-nums">{latestResult.scoreBefore}% → {latestResult.scoreAfter}%</span> · Ready for Auto-Apply
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 text-xs text-slate-700">
                <div>
                  <div className="font-bold text-slate-900 mb-1">
                    Keywords Added from JD:
                  </div>
                  <p className="text-emerald-800 font-semibold">
                    {latestResult.missingKeywordsAdded.join(' · ')}
                  </p>
                </div>

                <div>
                  <div className="font-bold text-slate-900 mb-1">
                    Tailored Executive Summary:
                  </div>
                  <p className="leading-relaxed bg-[#F4F6FB] p-3.5 rounded-2xl border border-slate-200/60 text-slate-800">
                    {latestResult.tailoredSummary}
                  </p>
                </div>

                <div>
                  <div className="font-bold text-slate-900 mb-1">
                    Tailored Impact Bullets (Human-Authored Style):
                  </div>
                  <ul className="space-y-1.5 list-disc list-inside text-slate-700 leading-relaxed">
                    {latestResult.tailoredBullets.map((b, i) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Section: All JD-Tailored Resumes History */}
      {tailoredHistory.length > 0 && (
        <div className="rounded-3xl bg-white border border-slate-200/80 p-6 sm:p-7 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Recent JD-Tailored Resumes ({tailoredHistory.length})
              </h3>
              <p className="text-xs text-slate-500">
                Automatically used when applying to matching career portal openings.
              </p>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {tailoredHistory.slice(0, 6).map(item => (
              <div
                key={item.id}
                onClick={() => setLatestResult(item)}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/80 rounded-xl px-2 -mx-2 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Briefcase className="w-4 h-4 text-[#2563EB] shrink-0" />
                  <div>
                    <div className="text-sm font-bold text-slate-900">
                      {item.jobTitle} · {item.employer}
                    </div>
                    <div className="text-xs text-slate-500">
                      Added Keywords: {item.missingKeywordsAdded.slice(0, 5).join(' · ')}
                    </div>
                  </div>
                </div>
                <div className="text-xs font-mono font-bold text-emerald-700 tabular-nums shrink-0">
                  {item.scoreBefore}% → {item.scoreAfter}% Shortlisting Fit
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
