import React, { useState } from 'react';
import {
  Shield,
  Save,
  Pause,
  Play,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Server,
} from 'lucide-react';
import { AutomationPolicy } from '../types';

interface SettingsViewProps {
  policy: AutomationPolicy;
  onUpdatePolicy: (updated: Partial<AutomationPolicy>) => void;
  onTogglePauseAll: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  policy,
  onUpdatePolicy,
  onTogglePauseAll,
}) => {
  const [formData, setFormData] = useState({
    overallDailyLimit: policy.overallDailyLimit,
    timezone: policy.timezone,
    perCompanyCap: policy.perCompanyCap,
    browserWorkerUrl: policy.browserWorkerUrl || '',
    reviewBeforeSubmit: policy.reviewBeforeSubmit,
    stopOnUnknownFacts: policy.stopOnUnknownFacts,
    stopOnCaptcha: policy.stopOnCaptcha,
    stopOnNewConsent: policy.stopOnNewConsent,
    stopOnExpiredLogin: policy.stopOnExpiredLogin,
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdatePolicy({
      overallDailyLimit: Number(formData.overallDailyLimit),
      timezone: formData.timezone,
      perCompanyCap: Number(formData.perCompanyCap),
      browserWorkerUrl: formData.browserWorkerUrl.trim(),
      reviewBeforeSubmit: formData.reviewBeforeSubmit,
      stopOnUnknownFacts: formData.stopOnUnknownFacts,
      stopOnCaptcha: formData.stopOnCaptcha,
      stopOnNewConsent: formData.stopOnNewConsent,
      stopOnExpiredLogin: formData.stopOnExpiredLogin,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const isWorkerConfigured = formData.browserWorkerUrl.trim().length > 0;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1.5">
            <span>Governance & Infrastructure</span>
            <span aria-hidden="true">·</span>
            <span>Atomic Rate Enforcement</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Automation Policy & Worker Configuration
          </h1>
          <p className="text-sm text-slate-600 mt-1.5 max-w-2xl leading-relaxed">
            Configure daily submission limits, day-boundary timezones, remote browser-worker streaming endpoints, and mandatory human intervention triggers.
          </p>
        </div>

        <button
          onClick={onTogglePauseAll}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
            policy.pauseAll
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
              : 'bg-amber-100 hover:bg-amber-200 text-amber-900'
          }`}
        >
          {policy.pauseAll ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          <span>{policy.pauseAll ? 'Resume Automation' : 'Engage Global Pause'}</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Browser Worker Service (BROWSER_WORKER_URL) Section */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Server className="w-4 h-4 text-slate-600" />
              <span>Browser Worker Service (BROWSER_WORKER_URL)</span>
            </h2>
            <span className="text-xs font-mono text-slate-500">
              {isWorkerConfigured ? 'Endpoint Configured' : 'Browser service not configured'}
            </span>
          </div>

          <div>
            <label htmlFor="browser-worker-url" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Remote Browser Worker URL
            </label>
            <input
              id="browser-worker-url"
              type="url"
              value={formData.browserWorkerUrl}
              onChange={e => setFormData({ ...formData, browserWorkerUrl: e.target.value })}
              placeholder="https://worker.your-domain.com or http://localhost:8080"
              className="w-full border border-slate-300 rounded-lg px-3.5 py-2 text-sm font-mono focus:ring-2 focus:ring-slate-900 outline-none"
            />
          </div>

          {!isWorkerConfigured ? (
            <div className="p-4 rounded-lg border border-amber-200 bg-amber-50/70 text-xs text-amber-950 space-y-2">
              <div className="font-semibold flex items-center gap-2 text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Browser service not configured — Live Take Control requires browser service setup</span>
              </div>
              <p className="leading-relaxed text-amber-900/90">
                Interactive browser streaming and persistent external hiring-site sessions require the standalone Playwright worker daemon provided in <code className="font-mono bg-amber-100 px-1 py-0.5 rounded">/worker/browser-worker.ts</code>.
              </p>
              <ul className="list-disc list-inside space-y-1 text-amber-900/80">
                <li>
                  <strong>Where to deploy</strong>: Deploy <code className="font-mono">/worker</code> as a Docker container on Google Cloud Run, Fly.io, AWS ECS, or a dedicated VM using the <code className="font-mono">mcr.microsoft.com/playwright</code> image.
                </li>
                <li>
                  <strong>How to connect</strong>: Set <code className="font-mono">BROWSER_WORKER_SECRET</code> on both services and enter the worker&apos;s HTTPS endpoint above.
                </li>
                <li>
                  <strong>Take Control availability</strong>: Live remote <code className="font-mono">Take Control</code> streaming for external hiring sites remains disabled until the worker service is reachable (local Interactive Sandbox verification remains available for testing).
                </li>
              </ul>
            </div>
          ) : (
            <div className="p-3.5 rounded-lg border border-emerald-200 bg-emerald-50/60 text-xs text-emerald-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Remote browser worker endpoint configured at <code className="font-mono font-semibold">{formData.browserWorkerUrl}</code>.
              </span>
            </div>
          )}
        </div>

        {/* Limits & Timezones */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-600" />
            <span>Daily Quotas & Day-Boundary Timezone</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Overall Daily Application Limit
              </label>
              <input
                type="number"
                value={formData.overallDailyLimit}
                onChange={e => setFormData({ ...formData, overallDailyLimit: Number(e.target.value) })}
                className="w-full border border-slate-300 rounded-lg px-3.5 py-2 text-sm font-mono focus:ring-2 focus:ring-slate-900 outline-none"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Total submissions allowed across all campaigns per day.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Configured Timezone
              </label>
              <select
                value={formData.timezone}
                onChange={e => setFormData({ ...formData, timezone: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3.5 py-2 text-sm focus:ring-2 focus:ring-slate-900 outline-none"
              >
                <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                <option value="UTC">UTC (Coordinated Universal Time)</option>
                <option value="America/New_York">America/New_York (EST)</option>
                <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                <option value="Europe/London">Europe/London (GMT)</option>
              </select>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Daily counters reset at midnight in this timezone.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Per-Company Application Cap
              </label>
              <input
                type="number"
                value={formData.perCompanyCap}
                onChange={e => setFormData({ ...formData, perCompanyCap: Number(e.target.value) })}
                className="w-full border border-slate-300 rounded-lg px-3.5 py-2 text-sm font-mono focus:ring-2 focus:ring-slate-900 outline-none"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Maximum active submissions to a single employer across campaigns.
              </span>
            </div>
          </div>
        </div>

        {/* Mandatory Safety Halts */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-600" />
            <span>Mandatory Human Intervention Guardrails</span>
          </h2>

          <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg">
            <label className="flex items-start gap-3 p-4 hover:bg-slate-50/60 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.stopOnCaptcha}
                onChange={e => setFormData({ ...formData, stopOnCaptcha: e.target.checked })}
                className="mt-0.5 w-4 h-4 rounded text-slate-900 border-slate-300"
              />
              <div>
                <span className="text-xs font-bold text-slate-900 block">
                  Mandatory Pause on CAPTCHA / Bot Challenges (Non-negotiable)
                </span>
                <span className="text-xs text-slate-500 mt-0.5 block">
                  Automation halts immediately and notifies you for manual completion via Take Control.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-4 hover:bg-slate-50/60 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.stopOnUnknownFacts}
                onChange={e => setFormData({ ...formData, stopOnUnknownFacts: e.target.checked })}
                className="mt-0.5 w-4 h-4 rounded text-slate-900 border-slate-300"
              />
              <div>
                <span className="text-xs font-bold text-slate-900 block">
                  Halt on Unknown Factual Questions (Anti-AI Fabrication)
                </span>
                <span className="text-xs text-slate-500 mt-0.5 block">
                  If an employer form asks for credentials or facts not present in your verified profile, pause and request user input.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-4 hover:bg-slate-50/60 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.stopOnNewConsent}
                onChange={e => setFormData({ ...formData, stopOnNewConsent: e.target.checked })}
                className="mt-0.5 w-4 h-4 rounded text-slate-900 border-slate-300"
              />
              <div>
                <span className="text-xs font-bold text-slate-900 block">
                  Halt on New Legal Attestations or Consents
                </span>
                <span className="text-xs text-slate-500 mt-0.5 block">
                  Never accept marketing checkboxes or unreviewed legal terms without candidate approval.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-4 hover:bg-slate-50/60 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.stopOnExpiredLogin}
                onChange={e => setFormData({ ...formData, stopOnExpiredLogin: e.target.checked })}
                className="mt-0.5 w-4 h-4 rounded text-slate-900 border-slate-300"
              />
              <div>
                <span className="text-xs font-bold text-slate-900 block">
                  Halt on Expired Platform Sessions
                </span>
                <span className="text-xs text-slate-500 mt-0.5 block">
                  Pause queued actions and prompt reconnection rather than submitting in an unauthenticated state.
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-between">
          {savedSuccess ? (
            <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> Policies & Worker Configuration Saved
            </span>
          ) : (
            <span />
          )}

          <button
            type="submit"
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Automation Policies</span>
          </button>
        </div>
      </form>
    </div>
  );
};
