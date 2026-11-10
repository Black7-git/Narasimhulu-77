import React, { useState } from 'react';
import {
  Link2,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Shield,
  Clock,
  Lock,
  RefreshCw,
  AlertCircle,
  Globe,
} from 'lucide-react';
import { PlatformConnection, PlatformConnector } from '../types';

interface PlatformItem {
  connector: PlatformConnector;
  connection: PlatformConnection;
}

interface PlatformsViewProps {
  platformItems: PlatformItem[];
  onConnectPlatform: (id: string) => void;
  onDisconnectPlatform: (id: string) => void;
}

export const PlatformsView: React.FC<PlatformsViewProps> = ({
  platformItems,
  onConnectPlatform,
  onDisconnectPlatform,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchFilter, setSearchFilter] = useState<string>('');

  const filteredItems = platformItems.filter(item => {
    if (selectedCategory !== 'all' && item.connector.category !== selectedCategory) return false;
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      return (
        item.connector.name.toLowerCase().includes(q) ||
        item.connector.documentationNotes.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const categories = [
    { id: 'all', label: 'All Platforms' },
    { id: 'general', label: 'General Job Boards' },
    { id: 'tech_startup', label: 'Tech & Startups' },
    { id: 'internship_early_career', label: 'Early Career' },
    { id: 'ats_employer', label: 'Employer Career Sites / ATS' },
    { id: 'remote', label: 'Remote Platforms' },
    { id: 'government_public', label: 'Public & Govt' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              <span>Platform Integrations & Authentication</span>
              <span>·</span>
              <span>Zero Password Storage</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Platform Directory & Logins</h1>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl">
              ApplyPilot explicitly distinguishes discovery vs. submission capabilities across platforms.
              Login is completed directly by you in isolated sessions—credentials are never passed to AI.
            </p>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-lg">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <input
          type="text"
          value={searchFilter}
          onChange={e => setSearchFilter(e.target.value)}
          placeholder="Filter platforms..."
          className="w-full sm:w-56 px-3 py-1.5 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-slate-900"
        />
      </div>

      {/* Platform Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map(({ connector, connection }) => {
          const isConnected = connection.status === 'connected';
          const isManual = connector.supportedAccessMethod === 'manual_only';

          return (
            <div
              key={connector.id}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors"
            >
              <div>
                {/* Platform Header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{connector.name}</h3>
                    <div className="text-[11px] text-slate-500 capitalize">
                      Category: {connector.category.replace('_', ' ')}
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      isConnected
                        ? 'bg-emerald-100 text-emerald-800'
                        : isManual
                        ? 'bg-slate-100 text-slate-600'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {isManual ? 'Manual Only' : connection.status.replace('_', ' ')}
                  </span>
                </div>

                {/* Capabilities Breakdown */}
                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Discovery:</span>
                    <span className="font-medium text-slate-800 capitalize">
                      {connector.discoveryCapability.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-500">Submission:</span>
                    <span className="font-medium text-slate-800 capitalize">
                      {connector.submissionCapability.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-500">Access Method:</span>
                    <span className="font-medium text-slate-800 capitalize">
                      {connector.supportedAccessMethod.replace('_', ' ')}
                    </span>
                  </div>

                  {isConnected && connection.maskedAccountIdentifier && (
                    <div className="flex justify-between pt-1 border-t border-slate-100">
                      <span className="text-slate-500">Connected User:</span>
                      <span className="font-mono text-emerald-800 font-medium">
                        {connection.maskedAccountIdentifier}
                      </span>
                    </div>
                  )}
                </div>

                {/* Notes */}
                <p className="mt-3 text-[11px] text-slate-600 line-clamp-2">
                  {connector.documentationNotes}
                </p>
              </div>

              {/* Bottom Actions */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <a
                  href={connector.officialUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1"
                >
                  <span>Portal</span>
                  <ExternalLink className="w-3 h-3" />
                </a>

                <div>
                  {isManual ? (
                    <span className="text-xs text-slate-400 font-medium">Prepared Handoff</span>
                  ) : isConnected ? (
                    <button
                      onClick={() => onDisconnectPlatform(connector.id)}
                      className="px-3 py-1.5 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg text-xs font-medium"
                    >
                      Disconnect
                    </button>
                  ) : (
                    <button
                      onClick={() => onConnectPlatform(connector.id)}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs"
                    >
                      Log in to Connect
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
