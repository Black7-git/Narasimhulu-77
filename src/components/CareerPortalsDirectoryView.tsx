import React, { useState } from 'react';
import {
  Globe,
  Search,
  ExternalLink,
  CheckCircle2,
  Play,
  RefreshCw,
  Mail,
  Link2,
} from 'lucide-react';
import {
  AutoSearchConfig,
  AutoSearchRunLog,
  PlatformConnection,
  PlatformConnector,
} from '../types';

interface CareerPortalsDirectoryViewProps {
  platformItems: { connector: PlatformConnector; connection: PlatformConnection }[];
  autoSearchConfig?: AutoSearchConfig;
  onConnectPlatform: (id: string) => void;
  onDisconnectPlatform: (id: string) => void;
  onRunAutoSearchNow: () => Promise<AutoSearchRunLog | null>;
}

const CATEGORY_LABELS: Record<string, string> = {
  all: 'All Portals',
  ats_employer: 'Enterprise ATS & Company Career Portals',
  general: 'Global & India Job Portals',
  tech_startup: 'Tech, AI & Startup Portals',
  internship_early_career: 'Campus, College & Internships',
  remote: 'Remote Talent Networks',
  government_public: 'Public & National Portals',
};

export const CareerPortalsDirectoryView: React.FC<CareerPortalsDirectoryViewProps> = ({
  platformItems,
  autoSearchConfig,
  onConnectPlatform,
  onDisconnectPlatform,
  onRunAutoSearchNow,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanResult, setScanResult] = useState<AutoSearchRunLog | null>(null);

  const filteredPortals = platformItems.filter(item => {
    if (selectedCategory !== 'all' && item.connector.category !== selectedCategory) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.connector.name.toLowerCase().includes(q) ||
        item.connector.officialUrl.toLowerCase().includes(q) ||
        item.connector.documentationNotes.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const connectedCount = platformItems.filter(
    p => p.connection.status === 'connected'
  ).length;

  const handleScanAllNow = async () => {
    setIsScanning(true);
    try {
      const log = await onRunAutoSearchNow();
      if (log) setScanResult(log);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Royal Blue Career Portals Hero Banner */}
      <div className="relative rounded-[28px] bg-[#1D58D8] text-white px-7 py-8 sm:px-10 overflow-hidden shadow-sm">
        <div
          className="pointer-events-none absolute -right-12 -bottom-24 w-96 h-96 rounded-full bg-[#2563EB]/70"
          aria-hidden="true"
        />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-blue-100 text-xs font-bold uppercase tracking-wider">
              <Globe className="w-3.5 h-3.5" />
              <span>Recommended Internet Hiring & Career Portals Directory</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              {platformItems.length} Global & Enterprise Career Portals
            </h1>
            <p className="text-sm sm:text-base text-blue-100 max-w-2xl">
              Connected across {connectedCount} portals using Gmail ID ({autoSearchConfig?.candidateGmailId || 'narasimhulu0707@gmail.com'}). Every 10 minutes, AutoApply audits Gmail &amp; all {platformItems.length} career portals—auto-reading Gmail OTPs, connecting portals with your same Gmail ID, tailoring missing resume keywords to each JD, and applying automatically.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleScanAllNow}
              disabled={isScanning}
              className="flex items-center gap-2 px-6 py-4 rounded-2xl bg-white hover:bg-blue-50 disabled:opacity-60 text-[#1D58D8] font-bold text-sm shadow-sm transition-colors cursor-pointer"
            >
              {isScanning ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              <span>{isScanning ? 'Scanning All Portals...' : 'Scan All Portals & Auto-Apply Now'}</span>
            </button>
          </div>
        </div>
      </div>

      {scanResult && (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 px-6 py-4 flex items-center justify-between gap-4 text-xs text-emerald-950">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>
              <strong>Career Portal Scan Completed:</strong> {scanResult.summary}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setScanResult(null)}
            className="font-bold text-emerald-800 hover:underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Search & Category Filter Bar */}
      <div className="rounded-3xl bg-white border border-slate-200/70 p-5 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search Workday, Greenhouse, LinkedIn, Naukri, Superset, Y Combinator..."
              className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-[#F4F6FB] border border-slate-200 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#2563EB] outline-none"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold">
            <Mail className="w-4 h-4 text-[#2563EB]" />
            <span>Auto-Account Gmail ID:</span>
            <span className="font-mono font-bold text-slate-900">
              {autoSearchConfig?.candidateGmailId || 'narasimhulu0707@gmail.com'}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {Object.entries(CATEGORY_LABELS).map(([catKey, label]) => (
            <button
              key={catKey}
              type="button"
              onClick={() => setSelectedCategory(catKey)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                selectedCategory === catKey
                  ? 'bg-[#2563EB] text-white'
                  : 'bg-[#F4F6FB] text-slate-600 hover:text-slate-900'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Portals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPortals.map(({ connector, connection }) => {
          const isConnected = connection.status === 'connected';
          const initial = connector.name.charAt(0).toUpperCase();

          return (
            <div
              key={connector.id}
              className="rounded-3xl bg-white border border-slate-200/80 p-6 shadow-2xs flex flex-col justify-between gap-4 hover:border-blue-300 transition-colors"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-11 h-11 rounded-2xl font-extrabold text-base flex items-center justify-center shrink-0 ${
                        isConnected
                          ? 'bg-[#2563EB] text-white'
                          : 'bg-[#F4F6FB] text-slate-700 border border-slate-200'
                      }`}
                    >
                      {initial}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-extrabold text-sm text-slate-900 truncate">
                        {connector.name}
                      </h3>
                      <a
                        href={connector.officialUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-[#1D58D8] hover:underline flex items-center gap-1 truncate mt-0.5"
                      >
                        <span className="truncate">{connector.officialUrl.replace('https://', '')}</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    </div>
                  </div>

                  <span
                    className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                      isConnected
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {isConnected ? 'Connected' : 'Ready'}
                  </span>
                </div>

                <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                  {connector.documentationNotes}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold text-slate-500">
                  {connector.requiresAuthForSubmission
                    ? 'Auto-Creates Gmail Account'
                    : 'Direct ATS Submission'}
                </span>

                {isConnected ? (
                  <button
                    type="button"
                    onClick={() => onDisconnectPlatform(connector.id)}
                    className="px-3.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-600 cursor-pointer"
                  >
                    Disconnect
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onConnectPlatform(connector.id)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#1D58D8] hover:bg-[#1E40AF] text-white text-xs font-bold cursor-pointer"
                  >
                    <Link2 className="w-3.5 h-3.5" />
                    <span>Connect with Gmail</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
