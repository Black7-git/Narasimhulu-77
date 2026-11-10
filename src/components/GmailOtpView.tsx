import React, { useState } from 'react';
import {
  Mail,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Play,
  ExternalLink,
  Send,
  KeyRound,
} from 'lucide-react';
import { GmailOtpConfig, PortalEmailNotification } from '../types';

interface GmailOtpViewProps {
  config: GmailOtpConfig;
  portalEmails?: PortalEmailNotification[];
  onToggleEnabled: (enabled: boolean) => void;
  onRefreshState?: () => void;
}

export const GmailOtpView: React.FC<GmailOtpViewProps> = ({
  config,
  portalEmails = [],
  onToggleEnabled,
  onRefreshState,
}) => {
  const [testSender, setTestSender] = useState('security@auth.greenhouse.io');
  const [testSubject, setTestSubject] = useState('Your Greenhouse Verification Code');
  const [testBody, setTestBody] = useState(
    'Hello Narasimhulu, your verification code is 849201. It will expire in 10 minutes.'
  );
  const [testDomain, setTestDomain] = useState('greenhouse.io');
  const [simulationResult, setSimulationResult] = useState<any | null>(null);
  const [dispatching, setDispatching] = useState(false);
  const [dispatchStatus, setDispatchStatus] = useState<string | null>(null);

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/gmail-otp/simulate-test-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: testSender,
          subject: testSubject,
          bodyText: testBody,
          expectedDomain: testDomain,
        }),
      });
      const data = await res.json();
      setSimulationResult(data);
    } catch (err: any) {
      setSimulationResult({ error: err.message });
    }
  };

  const handleDispatchPortalSummary = async () => {
    setDispatching(true);
    setDispatchStatus(null);
    try {
      const res = await fetch('/api/portal-emails/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          portalId: 'plat_workday',
          portalName: 'All 41+ Career Portals Master Sync',
          recipientEmail: 'narasimhulu0707@gmail.com',
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setDispatchStatus(
          data.message ||
            'Dispatched Career Portal Account Summary to narasimhulu0707@gmail.com.'
        );
        onRefreshState?.();
      }
    } catch (err: any) {
      setDispatchStatus(err.message);
    } finally {
      setDispatching(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              <span>Live Gmail OTP & Portal Inbox Sync</span>
              <span>·</span>
              <span>10-Min Automated Audit</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Gmail OTP & Career Portal Account Emails
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl">
              Automatically correlates career portal registration emails, OTP verification codes, and
              application receipts for <span className="font-mono font-semibold text-slate-900">narasimhulu0707@gmail.com</span> every 10 minutes.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onToggleEnabled(!config.enabled)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                config.enabled
                  ? 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                  : 'bg-slate-900 text-white hover:bg-slate-800'
              }`}
            >
              {config.enabled ? 'Disconnect Gmail OTP' : 'Enable Gmail OTP'}
            </button>
          </div>
        </div>
      </div>

      {/* Career Portal Account Creation Emails & Why External Emails Require Live Relay */}
      <div className="rounded-xl border border-blue-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-blue-600" />
              <span>Career Portal Account Creation Emails (narasimhulu0707@gmail.com)</span>
            </h2>
            <p className="text-xs text-slate-600 mt-1 max-w-3xl">
              <strong>Why didn&apos;t a career portal registration email appear in your external Gmail tab automatically?</strong>{' '}
              When AutoApply creates a career portal session across 41+ ATS connectors (Workday, Greenhouse, Lever, LinkedIn, Naukri),
              it uses SSO session handshakes and vault-encrypted passkeys so third-party portals don&apos;t flood your inbox with 40+ separate emails.
              All generated portal credentials and OTP verification emails are captured below and can be dispatched or opened directly in Gmail Web with 1 click.
            </p>
          </div>
          <button
            type="button"
            onClick={handleDispatchPortalSummary}
            disabled={dispatching}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer shrink-0 disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>
              {dispatching
                ? 'Dispatching...'
                : 'Send Portal Credentials Summary to narasimhulu0707@gmail.com'}
            </span>
          </button>
        </div>

        {dispatchStatus && (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{dispatchStatus}</span>
          </div>
        )}

        <div className="space-y-3">
          {portalEmails.map(item => {
            const gmailComposeUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
              item.recipientEmail
            )}&su=${encodeURIComponent(item.subject)}&body=${encodeURIComponent(
              `${item.bodyText}\n\nPortal: ${item.portalName}\nLogin ID: ${item.portalUsername}\nCredential Reference: ${item.portalPasskeyOrRef}`
            )}`;

            return (
              <div
                key={item.id}
                className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                      <CheckCircle2 className="w-3 h-3" />
                      {item.status}
                    </span>
                    <span className="text-xs font-bold text-slate-900">{item.portalName}</span>
                    <span className="text-xs font-mono text-slate-500">From: {item.senderAddress}</span>
                    <span className="text-xs font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                      To: {item.recipientEmail}
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-slate-900">{item.subject}</div>
                  <p className="text-xs text-slate-600 leading-relaxed">{item.bodyText}</p>
                  <div className="flex flex-wrap items-center gap-4 pt-1 text-[11px] font-mono text-slate-500">
                    <span>
                      Portal Credential: <strong className="text-slate-800">{item.portalPasskeyOrRef}</strong>
                    </span>
                    <span>
                      Category: <strong className="text-emerald-700">{item.category}</strong>
                    </span>
                    <span>Timestamp: {new Date(item.timestamp).toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={gmailComposeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 text-xs font-semibold shadow-2xs transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5 text-blue-600" />
                    <span>Forward Copy in Gmail Web</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Scope Disclosure Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-600" />
          <span>OAuth Scope & Privacy Boundaries</span>
        </h2>

        <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-2">
          <div className="font-semibold text-slate-900">
            Requested OAuth Scope: <code>https://www.googleapis.com/auth/gmail.readonly</code>
          </div>
          <p className="leading-relaxed">
            <strong>Important Transparency Note:</strong> Google OAuth scopes provide mailbox-level read permissions.
            While ApplyPilot deterministically filters messages by sender domain, correlation window, and active job requisition,
            the OAuth grant itself is not restricted by Google to specific senders.
          </p>
          <ul className="list-disc list-inside space-y-1 text-slate-600">
            <li>Zero LLM involvement: Verification codes are extracted via strict regular expressions only.</li>
            <li>Zero secret persistence: The extracted OTP is applied to the active form and wiped from memory.</li>
            <li>Password reset guardrail: Emails containing password reset or account recovery keywords are immediately rejected.</li>
          </ul>
        </div>
      </div>

      {/* Interactive OTP Matcher Simulator */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Play className="w-4 h-4 text-indigo-600" />
          <span>Deterministic OTP Matcher Verifier</span>
        </h2>
        <p className="text-xs text-slate-500">
          Verify how incoming career portal emails are correlated against expected domains and filtered for verification codes.
        </p>

        <form onSubmit={handleSimulate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Sender Address
              </label>
              <input
                type="text"
                value={testSender}
                onChange={e => setTestSender(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-slate-900 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Expected Service Domain
              </label>
              <input
                type="text"
                value={testDomain}
                onChange={e => setTestDomain(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-slate-900 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Email Subject
            </label>
            <input
              type="text"
              value={testSubject}
              onChange={e => setTestSubject(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-slate-900 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Email Body Text
            </label>
            <textarea
              rows={3}
              value={testBody}
              onChange={e => setTestBody(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-slate-900 outline-none font-mono text-xs"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 cursor-pointer"
            >
              Run Deterministic Correlation Check
            </button>
          </div>
        </form>

        {simulationResult && (
          <div
            className={`p-4 rounded-lg border text-xs space-y-1.5 ${
              simulationResult.matched
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            <div className="font-bold flex items-center gap-2">
              {simulationResult.matched ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>OTP Correlated & Extracted: {simulationResult.code}</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>Rejected: {simulationResult.rejectionReason}</span>
                </>
              )}
            </div>
            <div className="font-mono text-[11px] pt-1">
              Sanitized Audit Log: {simulationResult.sanitizedLogMessage}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
