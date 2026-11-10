import React, { useState } from 'react';
import {
  UserCheck,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Save,
  Briefcase,
  GraduationCap,
  Wrench,
  Globe,
  DollarSign,
  Calendar,
} from 'lucide-react';
import { FactConflict, MasterProfile } from '../types';

interface ProfileViewProps {
  profile: MasterProfile;
  conflicts: FactConflict[];
  onUpdateProfile: (updated: Partial<MasterProfile>) => void;
  onResolveConflict: (conflictId: string, chosenValue: string) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  profile,
  conflicts,
  onUpdateProfile,
  onResolveConflict,
}) => {
  const [formData, setFormData] = useState({
    name: profile.name,
    email: profile.email,
    phone: profile.phone,
    location: profile.location,
    linkedinUrl: profile.linkedinUrl || '',
    githubUrl: profile.githubUrl || '',
    summary: profile.summary,
    salaryMin: profile.preferences.salaryMin,
    salaryCurrency: profile.preferences.salaryCurrency,
    salaryPeriod: profile.preferences.salaryPeriod,
    noticePeriodDays: profile.preferences.noticePeriodDays,
    availabilityDate: profile.preferences.availabilityDate,
    relocationOpen: profile.preferences.relocationOpen,
    workAuthorization: profile.preferences.workAuthorization,
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      location: formData.location,
      linkedinUrl: formData.linkedinUrl,
      githubUrl: formData.githubUrl,
      summary: formData.summary,
      preferences: {
        ...profile.preferences,
        salaryMin: Number(formData.salaryMin),
        salaryCurrency: formData.salaryCurrency,
        salaryPeriod: formData.salaryPeriod as any,
        noticePeriodDays: Number(formData.noticePeriodDays),
        availabilityDate: formData.availabilityDate,
        relocationOpen: formData.relocationOpen,
        workAuthorization: formData.workAuthorization,
      },
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const unresolvedConflicts = conflicts.filter(c => !c.resolved);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              <span>Ground Truth Source</span>
              <span>·</span>
              <span>Single Verified Master Profile</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Candidate Profile & Grounding</h1>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl">
              ApplyPilot strictly grounds AI answers in these verified candidate facts.
              Role-specific resumes may emphasize different strengths, but must never introduce silent factual contradictions.
            </p>
          </div>

          {savedSuccess && (
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
              <CheckCircle2 className="w-4 h-4" />
              <span>Profile Saved & Synchronized</span>
            </div>
          )}
        </div>
      </div>

      {/* Fact Discrepancy Warnings (If any) */}
      {unresolvedConflicts.length > 0 && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <h2 className="text-sm font-bold text-amber-900">
              Factual Discrepancies Detected Across Resumes ({unresolvedConflicts.length})
            </h2>
          </div>
          <p className="text-xs text-amber-800 mb-4">
            Conflicting dates, degrees, or employers block automated submissions until you select the verified truth.
          </p>

          <div className="space-y-3">
            {unresolvedConflicts.map(c => (
              <div key={c.id} className="p-3 bg-white rounded-lg border border-amber-200 text-xs space-y-2">
                <div className="font-semibold text-slate-900">Field: {c.field}</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    onClick={() => onResolveConflict(c.id, c.valueA)}
                    className="p-2 border border-slate-200 rounded text-left hover:bg-slate-50 transition-colors"
                  >
                    <span className="text-[10px] text-slate-400 block">{c.sourceA}</span>
                    <span className="font-medium text-slate-800">{c.valueA}</span>
                    <span className="text-[10px] text-emerald-700 block mt-1">Accept as Truth</span>
                  </button>

                  <button
                    onClick={() => onResolveConflict(c.id, c.valueB)}
                    className="p-2 border border-slate-200 rounded text-left hover:bg-slate-50 transition-colors"
                  >
                    <span className="text-[10px] text-slate-400 block">{c.sourceB}</span>
                    <span className="font-medium text-slate-800">{c.valueB}</span>
                    <span className="text-[10px] text-emerald-700 block mt-1">Accept as Truth</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Profile Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Core Personal & Contact Info */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-slate-600" />
            <span>Contact & Identity Credentials</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Legal Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-slate-900 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-slate-900 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
              <input
                type="text"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-slate-900 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Current Location (City, Country)</label>
              <input
                type="text"
                value={formData.location}
                onChange={e => setFormData({ ...formData, location: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-slate-900 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">LinkedIn Profile URL</label>
              <input
                type="url"
                value={formData.linkedinUrl}
                onChange={e => setFormData({ ...formData, linkedinUrl: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-slate-900 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">GitHub / Portfolio URL</label>
              <input
                type="url"
                value={formData.githubUrl}
                onChange={e => setFormData({ ...formData, githubUrl: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-slate-900 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Executive Technical Summary</label>
            <textarea
              rows={3}
              value={formData.summary}
              onChange={e => setFormData({ ...formData, summary: e.target.value })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-slate-900 outline-none"
            />
          </div>
        </div>

        {/* Candidate Preferences & Work Authorization */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-slate-600" />
            <span>Employment Preferences & Work Authorization</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Min Expected Salary</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={formData.salaryMin}
                  onChange={e => setFormData({ ...formData, salaryMin: Number(e.target.value) })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                />
                <select
                  value={formData.salaryCurrency}
                  onChange={e => setFormData({ ...formData, salaryCurrency: e.target.value })}
                  className="border border-slate-300 rounded-lg px-2 text-xs"
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Notice Period (Days)</label>
              <input
                type="number"
                value={formData.noticePeriodDays}
                onChange={e => setFormData({ ...formData, noticePeriodDays: Number(e.target.value) })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-slate-900 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Earliest Availability Date</label>
              <input
                type="date"
                value={formData.availabilityDate}
                onChange={e => setFormData({ ...formData, availabilityDate: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-slate-900 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Work Authorization Status</label>
              <input
                type="text"
                value={formData.workAuthorization}
                onChange={e => setFormData({ ...formData, workAuthorization: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-slate-900 outline-none"
              />
            </div>

            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.relocationOpen}
                  onChange={e => setFormData({ ...formData, relocationOpen: e.target.checked })}
                  className="w-4 h-4 rounded text-slate-900 border-slate-300"
                />
                <span className="text-xs font-medium text-slate-800">
                  Open to relocation for the right opportunity
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Verified Facts List */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-600" />
            <span>Master Profile Verified Facts ({profile.facts.length})</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {profile.facts.map(fact => (
              <div key={fact.id} className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 flex items-start justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">
                    {fact.category} · {fact.label}
                  </span>
                  <span className="text-xs font-medium text-slate-900 mt-0.5 block">
                    {fact.value}
                  </span>
                </div>
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              </div>
            ))}
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm rounded-lg shadow-xs transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Save Profile & Invalidate Stale Approvals</span>
          </button>
        </div>
      </form>
    </div>
  );
};
