import React, { useState } from 'react';
import {
  Radio,
  Plus,
  Play,
  Pause,
  Sliders,
  DollarSign,
  MapPin,
  Calendar,
  Layers,
  CheckCircle,
} from 'lucide-react';
import { Campaign, ResumeVersion } from '../types';

interface CampaignsViewProps {
  campaigns: Campaign[];
  resumes: ResumeVersion[];
  onToggleCampaign: (id: string) => void;
  onUpdateCampaign: (id: string, updates: Partial<Campaign>) => void;
  onCreateCampaign: (newCamp: Partial<Campaign>) => void;
}

export const CampaignsView: React.FC<CampaignsViewProps> = ({
  campaigns,
  resumes,
  onToggleCampaign,
  onUpdateCampaign,
  onCreateCampaign,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTargetTitle, setNewTargetTitle] = useState('');
  const [newSalary, setNewSalary] = useState('2000000');
  const [newLimit, setNewLimit] = useState('5');
  const [newResumeId, setNewResumeId] = useState(resumes[0]?.id || '');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newTargetTitle.trim()) return;

    onCreateCampaign({
      title: newTitle.trim(),
      targetTitles: [newTargetTitle.trim()],
      keywordsIncluded: newTargetTitle.toLowerCase().split(' '),
      keywordsExcluded: [],
      experienceLevel: 'mid',
      locations: ['Bengaluru', 'Remote'],
      workArrangements: ['remote', 'hybrid'],
      employmentTypes: ['full_time'],
      salaryMin: parseInt(newSalary, 10) || 2000000,
      currency: 'INR',
      selectedSources: ['linkedin', 'greenhouse', 'naukri'],
      defaultResumeId: newResumeId,
      relevanceThreshold: 75,
      dailyLimit: parseInt(newLimit, 10) || 5,
      mode: 'review',
    });

    setNewTitle('');
    setNewTargetTitle('');
    setShowCreateModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              <span>Target Role Strategy</span>
              <span>·</span>
              <span>Concurrent Pipelines</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Role Campaigns</h1>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl">
              Configure concurrent, independent campaigns across role specializations (e.g., Python Developer, AI/ML Engineer, Data Analyst).
              Each campaign enforces its own keywords, salary threshold, resume bindings, and daily submission limit.
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>New Campaign</span>
          </button>
        </div>
      </div>

      {/* Campaign Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {campaigns.map(camp => {
          const assignedResume = resumes.find(r => r.id === camp.defaultResumeId);
          return (
            <div
              key={camp.id}
              className={`rounded-xl border p-5 bg-white shadow-xs transition-colors ${
                camp.status === 'active' ? 'border-slate-200' : 'border-slate-200 bg-slate-50/60 opacity-80'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-base">{camp.title}</h3>
                    <span className="text-xs text-slate-400">· Priority #{camp.priority}</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Target Titles: {camp.targetTitles.join(', ')}
                  </div>
                </div>

                <button
                  onClick={() => onToggleCampaign(camp.id)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                    camp.status === 'active'
                      ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                      : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                  }`}
                >
                  {camp.status === 'active' ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                  <span>{camp.status === 'active' ? 'Active' : 'Paused'}</span>
                </button>
              </div>

              {/* Details Grid */}
              <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-3 text-xs text-slate-600">
                <div>
                  <span className="text-slate-400 block text-[11px]">Default Resume</span>
                  <span className="font-medium text-slate-800 truncate block">
                    {assignedResume?.title || 'Auto Policy'}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">Daily Limit (Asia/Kolkata)</span>
                  <span className="font-medium text-slate-800">
                    {camp.todayAppliedCount} / {camp.dailyLimit} today
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">Minimum Salary</span>
                  <span className="font-medium text-slate-800">
                    {camp.currency} {camp.salaryMin.toLocaleString()}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">Relevance Score Gate</span>
                  <span className="font-medium text-slate-800">
                    &ge; {camp.relevanceThreshold}%
                  </span>
                </div>
              </div>

              {/* Keywords & Mode */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1 text-slate-500">
                  <span className="font-medium text-slate-700">Keywords:</span>
                  <span>{camp.keywordsIncluded.join(', ') || 'Any'}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Mode:</span>
                  <select
                    value={camp.mode}
                    onChange={e => onUpdateCampaign(camp.id, { mode: e.target.value as any })}
                    className="border border-slate-200 rounded px-2 py-0.5 text-xs bg-slate-50 text-slate-800"
                  >
                    <option value="review">Review before submit</option>
                    <option value="automatic">Authorized automatic</option>
                  </select>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* New Campaign Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Create New Role Campaign</h2>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Campaign Name
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. Cloud DevOps Engineer"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Primary Target Role Title
                </label>
                <input
                  type="text"
                  required
                  value={newTargetTitle}
                  onChange={e => setNewTargetTitle(e.target.value)}
                  placeholder="e.g. DevOps Engineer"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Min Salary (INR)
                  </label>
                  <input
                    type="number"
                    value={newSalary}
                    onChange={e => setNewSalary(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Daily Submissions Limit
                  </label>
                  <input
                    type="number"
                    value={newLimit}
                    onChange={e => setNewLimit(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assigned Default Resume
                </label>
                <select
                  value={newResumeId}
                  onChange={e => setNewResumeId(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                >
                  {resumes.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.title} (v{r.versionNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 text-sm hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-800"
                >
                  Create Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
