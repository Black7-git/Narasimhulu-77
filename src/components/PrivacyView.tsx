import React, { useState } from 'react';
import {
  ShieldCheck,
  Download,
  Trash2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Lock,
} from 'lucide-react';
import { AuditEvent } from '../types';

interface PrivacyViewProps {
  auditEvents: AuditEvent[];
  onPurgeAccount: () => void;
}

export const PrivacyView: React.FC<PrivacyViewProps> = ({
  auditEvents,
  onPurgeAccount,
}) => {
  const [confirmPurge, setConfirmPurge] = useState(false);

  const handleExport = () => {
    window.location.href = '/api/privacy/export';
  };

  const handlePurge = () => {
    if (confirm('Are you absolutely sure you want to purge all resumes, application histories, and verified facts? This action is irreversible.')) {
      onPurgeAccount();
      setConfirmPurge(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              <span>GDPR / Data Sovereignty</span>
              <span>·</span>
              <span>Candidate Privacy</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Privacy, Data Export & Audit Log</h1>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl">
              You own your employment data. Export your entire application and profile record at any time,
              inspect the immutable audit trail of automated actions, or request instant data deletion.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm transition-colors shadow-xs"
            >
              <Download className="w-4 h-4" />
              <span>Export Full JSON Archive</span>
            </button>
          </div>
        </div>
      </div>

      {/* Account Deletion & Security Controls */}
      <div className="rounded-xl border border-rose-200 bg-rose-50/40 p-6 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <Trash2 className="w-5 h-5 text-rose-600" />
          <h2 className="text-base font-bold text-rose-900">Right to Erasure & Account Purge</h2>
        </div>
        <p className="text-xs text-rose-800 max-w-2xl">
          Permanently wipes all uploaded resumes, extracted facts, job applications, and connection credentials from the local database.
          Active background tasks will be terminated immediately.
        </p>

        <div className="pt-2">
          <button
            onClick={handlePurge}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-lg shadow-xs transition-colors"
          >
            Purge All Candidate Data Permanently
          </button>
        </div>
      </div>

      {/* Immutable Audit Log */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-600" />
            <span>Immutable Audit Trail ({auditEvents.length} events)</span>
          </h2>
          <span className="text-xs text-slate-500 font-mono">
            Cryptographic Sequence Active
          </span>
        </div>

        <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
          {auditEvents.map(event => (
            <div key={event.id} className="py-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] text-slate-400">
                    {new Date(event.timestamp).toLocaleString()}
                  </span>
                  <span className="text-slate-300">·</span>
                  <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                    {event.action}
                  </span>
                  <span className="text-slate-300">·</span>
                  <span className="text-[11px] text-slate-500 capitalize">
                    Actor: {event.actor}
                  </span>
                </div>
                <div className="text-slate-600">{event.details}</div>
              </div>

              {event.applicationReference && (
                <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded shrink-0">
                  Ref: {event.applicationReference}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
