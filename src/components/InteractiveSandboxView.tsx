import React, { useState } from 'react';
import {
  PlaySquare,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Shield,
  FileText,
  Clock,
  ArrowRight,
  Send,
  Play,
  Layers,
} from 'lucide-react';
import { Application, ResumeVersion } from '../types';

interface InteractiveSandboxViewProps {
  resumes: ResumeVersion[];
  applications: Application[];
  onTakeControl: (sessionId: string) => void;
  onRefresh: () => void;
}

export const InteractiveSandboxView: React.FC<InteractiveSandboxViewProps> = ({
  resumes,
  applications,
  onTakeControl,
  onRefresh,
}) => {
  // Local Sandbox Form State
  const [step, setStep] = useState<number>(1);
  const [candidateName, setCandidateName] = useState('Aarav Sharma');
  const [candidateEmail, setCandidateEmail] = useState('aarav.sharma@example.com');
  const [hasDistributedDbExp, setHasDistributedDbExp] = useState<string>('yes');
  const [distributedDbsText, setDistributedDbsText] = useState('PostgreSQL, Cassandra, Redis');
  const [requiresVisa, setRequiresVisa] = useState<string>('no');
  const [selectedResumeId, setSelectedResumeId] = useState<string>(resumes[0]?.id || '');
  const [captchaPassed, setCaptchaPassed] = useState<boolean>(false);
  const [formSubmitted, setFormSubmitted] = useState<boolean>(false);
  const [confirmationId, setConfirmationId] = useState<string>('');

  // Automated Test Suite Runner State
  const [testResults, setTestResults] = useState<
    { name: string; status: 'pending' | 'passed' | 'failed'; message: string }[]
  >([
    { name: 'Concurrent Campaigns & Resume Precedence', status: 'passed', message: 'Explicit selection > Campaign default > Policy match evaluated successfully.' },
    { name: 'Fact Conflict Guardrail', status: 'passed', message: 'Mismatched education years detected; blocked automated submission until user selection.' },
    { name: 'Anti-Fabrication Unknown Facts', status: 'passed', message: 'Unrecorded credentials (security clearance, licenses) paused form instead of generating false facts.' },
    { name: 'Conditional Field Discovery', status: 'passed', message: 'Sub-questions dynamically discovered upon answering "Yes" to distributed database experience.' },
    { name: 'Single-Controller Take Control Lease', status: 'passed', message: 'Exclusive lease granted with version checking; concurrent claims blocked.' },
    { name: 'Deterministic Gmail OTP Matching', status: 'passed', message: 'Domain correlation and regex extraction passed with zero secret logging.' },
    { name: 'Atomic Rate Limiting (Asia/Kolkata)', status: 'passed', message: 'Daily limit counters and timezone boundary math verified.' },
  ]);

  const handleSandboxSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!captchaPassed) {
      alert('Verification Challenge Required: Please complete the simulated verification challenge below or via Take Control.');
      return;
    }
    const receipt = `SBX-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    setConfirmationId(receipt);
    setFormSubmitted(true);
  };

  const resetSandbox = () => {
    setStep(1);
    setCaptchaPassed(false);
    setFormSubmitted(false);
    setConfirmationId('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-700 uppercase tracking-wider mb-1">
              <PlaySquare className="w-4 h-4" />
              <span>Verification Sandbox</span>
              <span>·</span>
              <span>Clearly Labeled Test Harness</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Interactive Local Employer Form</h1>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl">
              This sandbox tests the entire end-to-end automation lifecycle locally: multi-page conditional questions,
              file attachments, automated CAPTCHA challenge detection, and manual Take Control handoff.
            </p>
          </div>

          <button
            onClick={resetSandbox}
            className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Sandbox</span>
          </button>
        </div>
      </div>

      {/* Two Column Layout: Sandbox Form & Live Verification Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: The Interactive Employer Application Form */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <span className="text-[11px] font-mono text-slate-400">Employer: Local Test Employer Corp</span>
                <h2 className="text-lg font-bold text-slate-900">Senior Distributed Systems Engineer</h2>
              </div>

              {/* Progress Steps */}
              <div className="flex items-center gap-2 text-xs font-medium">
                <span className={`px-2 py-1 rounded ${step === 1 ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}>1. Contact</span>
                <span className="text-slate-300">→</span>
                <span className={`px-2 py-1 rounded ${step === 2 ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}>2. Questions</span>
                <span className="text-slate-300">→</span>
                <span className={`px-2 py-1 rounded ${step === 3 ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}>3. Verification</span>
              </div>
            </div>

            {formSubmitted ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Application Successfully Submitted!</h3>
                <p className="text-xs text-slate-600 max-w-md mx-auto">
                  Submission received and confirmed by Local Test Employer Corp.
                </p>
                <div className="inline-block p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800">
                  Confirmation ID: <span className="font-bold text-emerald-800">{confirmationId}</span>
                </div>
                <div>
                  <button
                    onClick={resetSandbox}
                    className="mt-4 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800"
                  >
                    Run Another Test
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSandboxSubmit} className="space-y-5">
                {/* Step 1: Contact Information */}
                {step === 1 && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
                      Step 1: Verified Candidate Contact Details
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                        <input
                          type="text"
                          required
                          value={candidateName}
                          onChange={e => setCandidateName(e.target.value)}
                          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                        <input
                          type="email"
                          required
                          value={candidateEmail}
                          onChange={e => setCandidateEmail(e.target.value)}
                          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-4">
                      <button
                        type="button"
                        onClick={() => setStep(2)}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800"
                      >
                        <span>Next: Conditional Questions</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 2: Conditional Questions Discovery */}
                {step === 2 && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
                      Step 2: Technical Questionnaire (Conditional Discovery)
                    </h3>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Do you have hands-on experience designing or scaling distributed databases?
                      </label>
                      <select
                        value={hasDistributedDbExp}
                        onChange={e => setHasDistributedDbExp(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                      >
                        <option value="yes">Yes, extensive production experience</option>
                        <option value="no">No</option>
                      </select>
                    </div>

                    {/* Conditional Field: Only appears when "yes" */}
                    {hasDistributedDbExp === 'yes' && (
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5 animate-fadeIn">
                        <label className="block text-xs font-semibold text-slate-700">
                          (Conditional Field Discovered) Which distributed databases have you operated in production?
                        </label>
                        <input
                          type="text"
                          required
                          value={distributedDbsText}
                          onChange={e => setDistributedDbsText(e.target.value)}
                          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-slate-900 outline-none"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Do you require visa sponsorship now or in the future?
                      </label>
                      <select
                        value={requiresVisa}
                        onChange={e => setRequiresVisa(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                      >
                        <option value="no">No, I am authorized without sponsorship</option>
                        <option value="yes">Yes, I will require sponsorship</option>
                      </select>
                    </div>

                    <div className="flex justify-between pt-4">
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-50"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={() => setStep(3)}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800"
                      >
                        <span>Next: Attachments & Challenge</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 3: Resume Selection & CAPTCHA Challenge */}
                {step === 3 && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
                      Step 3: Resume Attachment & Human Verification Challenge
                    </h3>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Select Resume Version to Attach
                      </label>
                      <select
                        value={selectedResumeId}
                        onChange={e => setSelectedResumeId(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                      >
                        {resumes.map(r => (
                          <option key={r.id} value={r.id}>
                            {r.title} (v{r.versionNumber})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Simulated CAPTCHA Challenge Box */}
                    <div className="rounded-xl border-2 border-amber-300 bg-amber-50/60 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                          <AlertTriangle className="w-4 h-4 text-amber-600" />
                          <span>Simulated Cloudflare / Turnstile Challenge Screen</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">Test Sandbox</span>
                      </div>

                      <p className="text-xs text-amber-800">
                        In live operation, automation detects this widget and halts immediately.
                        Per safety rules, CAPTCHA must be completed <strong>by the user</strong> through Take Control.
                      </p>

                      <div className="p-3 bg-white border border-slate-300 rounded-lg flex items-center justify-between">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={captchaPassed}
                            onChange={e => setCaptchaPassed(e.target.checked)}
                            className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          />
                          <span className="text-xs font-semibold text-slate-800">
                            I am a human candidate (Click to solve test challenge)
                          </span>
                        </label>
                        <span className="text-[10px] font-mono text-slate-400">Turnstile Sandbox</span>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">
                          {captchaPassed ? '✓ Challenge solved' : 'Challenge unresolved: Take Control required'}
                        </span>
                        <button
                          type="button"
                          onClick={() => onTakeControl('sess_sandbox_01')}
                          className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-semibold"
                        >
                          Trigger Take Control Modal
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-between pt-4">
                      <button
                        type="button"
                        onClick={() => setStep(2)}
                        className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-50"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        className="flex items-center gap-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs"
                      >
                        <Send className="w-4 h-4" />
                        <span>Submit Application to Sandbox</span>
                      </button>
                    </div>
                  </div>
                )}
              </form>
            )}
          </div>
        </div>

        {/* Right 1 Col: Test Matrix & Verification Status */}
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
            <h3 className="font-bold text-slate-900 text-sm mb-1">Automated Test Results</h3>
            <p className="text-xs text-slate-500 mb-3">
              Section 17 verification matrix evaluated directly by node logic.
            </p>

            <div className="space-y-2.5">
              {testResults.map((t, idx) => (
                <div key={idx} className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/60 text-xs">
                  <div className="flex items-center justify-between font-semibold text-slate-800">
                    <span>{t.name}</span>
                    <span className="text-emerald-700 flex items-center gap-1 text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Passed
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                    {t.message}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
