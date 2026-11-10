import React, { useState } from 'react';
import {
  Home,
  Briefcase,
  Send,
  User,
  SlidersHorizontal,
  Check,
  AlertTriangle,
  Link2,
  Mail,
  ShieldCheck,
  PlaySquare,
  FileText,
  ChevronDown,
  ChevronRight,
  Building2,
  GraduationCap,
  Globe,
} from 'lucide-react';

export type NavTabId =
  | 'overview'
  | 'tailor_resume'
  | 'org_panel'
  | 'admin_panel'
  | 'career_portals'
  | 'interventions'
  | 'campaigns'
  | 'resumes'
  | 'profile'
  | 'matches'
  | 'applications'
  | 'platforms'
  | 'sandbox'
  | 'settings'
  | 'gmail'
  | 'privacy';

interface SidebarProps {
  activeTab: NavTabId;
  onSelectTab: (tab: NavTabId) => void;
  actionRequiredCount: number;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  profileStrength?: number;
  portalsCount?: number;
  userEmail?: string;
}

interface NavItem {
  id: NavTabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  count?: number;
  urgent?: boolean;
  badge?: string;
}

const ADMIN_OWNER_EMAIL = 'narasimhulu0707@gmail.com';

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  actionRequiredCount,
  mobileOpen,
  onCloseMobile,
  profileStrength = 82,
  portalsCount = 41,
  userEmail,
}) => {
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const isOwnerAdmin =
    !userEmail || userEmail.trim().toLowerCase() === ADMIN_OWNER_EMAIL;

  const primaryItems: NavItem[] = [
    { id: 'overview', label: 'Dashboard', icon: Home },
    { id: 'matches', label: 'Job matches', icon: Briefcase },
    { id: 'applications', label: 'Applications', icon: Send },
    { id: 'resumes', label: 'Resume & profile', icon: User },
    { id: 'campaigns', label: 'Auto-apply rules', icon: SlidersHorizontal },
  ];

  const specialFeatureItems: NavItem[] = [
    {
      id: 'tailor_resume',
      label: 'Tailor Resume (JD)',
      icon: FileText,
      badge: 'JD+',
    },
  ];

  const panelItems: NavItem[] = [
    { id: 'overview', label: 'Student / User Panel', icon: GraduationCap },
    { id: 'org_panel', label: 'Organization & College', icon: Building2 },
    ...(isOwnerAdmin
      ? [{ id: 'admin_panel' as NavTabId, label: 'Admin Control Panel', icon: ShieldCheck }]
      : []),
  ];

  const careerPortalItems: NavItem[] = [
    {
      id: 'career_portals',
      label: 'All Career Portals',
      icon: Globe,
      badge: `${portalsCount}+`,
    },
    { id: 'platforms', label: 'Portal Logins & Sessions', icon: Link2 },
  ];

  const secondaryItems: NavItem[] = [
    { id: 'profile', label: 'Candidate Facts', icon: FileText },
    {
      id: 'interventions',
      label: 'Task Control',
      icon: AlertTriangle,
      count: actionRequiredCount > 0 ? actionRequiredCount : undefined,
      urgent: actionRequiredCount > 0,
    },
    { id: 'settings', label: 'Worker & Policy', icon: SlidersHorizontal },
    { id: 'gmail', label: 'Gmail OTP & Portal Emails', icon: Mail },
    { id: 'privacy', label: 'Privacy & Audit', icon: ShieldCheck },
  ];

  const isSecondaryActive = secondaryItems.some(item => item.id === activeTab);

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-xs md:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0F172A] text-slate-200 transition-transform duration-200 ease-out md:sticky md:top-0 md:h-screen md:translate-x-0 flex flex-col justify-between shrink-0 select-none ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Section: Brand + Navigation */}
        <div className="p-4 space-y-4 overflow-y-auto">
          {/* Brand Logo */}
          <div className="flex items-center justify-between px-2 pt-1">
            <button
              type="button"
              onClick={() => {
                onSelectTab('overview');
                onCloseMobile();
              }}
              className="flex items-center gap-3 text-left cursor-pointer"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#2563EB] text-white shadow-sm">
                <Check className="w-4 h-4 stroke-[3]" />
              </div>
              <span className="font-bold text-xl text-white tracking-tight">
                AutoApply
              </span>
            </button>

            <button
              onClick={onCloseMobile}
              className="md:hidden p-1 text-slate-400 hover:text-white"
              aria-label="Close navigation menu"
            >
              ✕
            </button>
          </div>

          {/* Primary Navigation (Matches Reference UI) */}
          <nav className="space-y-1">
            {primaryItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id);
                    onCloseMobile();
                  }}
                  className={`flex w-full items-center justify-between px-3.5 py-2.5 text-[14px] font-medium rounded-2xl transition-all text-left cursor-pointer ${
                    isActive
                      ? 'bg-[#2563EB] text-white font-semibold shadow-sm'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-[18px] h-[18px] shrink-0 ${
                        isActive ? 'text-white' : 'text-slate-400'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>
                </button>
              );
            })}
          </nav>

          {/* Dedicated Section: Special Feature — Tailor Resume Based on JD */}
          <div className="pt-2 border-t border-white/10">
            <div className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-300">
              Special Feature (JD Tailor)
            </div>
            <div className="space-y-1">
              {specialFeatureItems.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelectTab(item.id);
                      onCloseMobile();
                    }}
                    className={`flex w-full items-center justify-between px-3.5 py-2 text-[13px] font-semibold rounded-xl transition-all text-left cursor-pointer ${
                      isActive
                        ? 'bg-[#2563EB] text-white shadow-sm'
                        : 'bg-white/5 text-white hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          isActive ? 'text-white' : 'text-amber-400'
                        }`}
                      />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[10px] font-mono font-bold text-amber-300">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dedicated Section: 3 Role Panels */}
          <div className="pt-2 border-t border-white/10">
            <div className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Workspace Panels (3)
            </div>
            <div className="space-y-1">
              {panelItems.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id && item.id !== 'overview';
                return (
                  <button
                    key={item.label}
                    onClick={() => {
                      onSelectTab(item.id);
                      onCloseMobile();
                    }}
                    className={`flex w-full items-center justify-between px-3.5 py-2 text-[13px] font-medium rounded-xl transition-all text-left cursor-pointer ${
                      isActive
                        ? 'bg-[#2563EB] text-white font-semibold shadow-sm'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          isActive ? 'text-white' : 'text-blue-400'
                        }`}
                      />
                      <span>{item.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dedicated Section: Hiring & Career Portals */}
          <div className="pt-2 border-t border-white/10">
            <div className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Hiring & Career Portals
            </div>
            <div className="space-y-1">
              {careerPortalItems.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelectTab(item.id);
                      onCloseMobile();
                    }}
                    className={`flex w-full items-center justify-between px-3.5 py-2 text-[13px] font-medium rounded-xl transition-all text-left cursor-pointer ${
                      isActive
                        ? 'bg-[#2563EB] text-white font-semibold shadow-sm'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          isActive ? 'text-white' : 'text-emerald-400'
                        }`}
                      />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-full bg-emerald-500/20 text-emerald-300">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Expandable Advanced & Safety Tools */}
          <div className="pt-1 border-t border-white/10">
            <button
              type="button"
              onClick={() => setShowAdvanced(prev => !prev)}
              className="flex w-full items-center justify-between px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <span>Advanced & Safety</span>
                {actionRequiredCount > 0 && (
                  <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-rose-500/20 text-rose-300 font-mono">
                    {actionRequiredCount}
                  </span>
                )}
              </span>
              {showAdvanced || isSecondaryActive ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </button>

            {(showAdvanced || isSecondaryActive) && (
              <div className="mt-1 space-y-0.5">
                {secondaryItems.map(item => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onSelectTab(item.id);
                        onCloseMobile();
                      }}
                      className={`flex w-full items-center justify-between px-3.5 py-1.5 text-xs font-medium rounded-xl transition-colors text-left cursor-pointer ${
                        isActive
                          ? 'bg-[#2563EB] text-white font-semibold'
                          : 'text-slate-400 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon
                          className={`w-3.5 h-3.5 shrink-0 ${
                            isActive
                              ? 'text-white'
                              : item.urgent
                              ? 'text-rose-400'
                              : 'text-slate-400'
                          }`}
                        />
                        <span>{item.label}</span>
                      </div>
                      {item.count !== undefined && (
                        <span className="px-1.5 py-0.5 text-[10px] font-mono font-semibold rounded-md bg-rose-500/20 text-rose-300">
                          {item.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Section: Profile Strength Card */}
        <div className="p-3.5">
          <button
            type="button"
            onClick={() => {
              onSelectTab('profile');
              onCloseMobile();
            }}
            className="w-full text-left rounded-2xl bg-[#1E293B]/90 hover:bg-[#1E293B] p-3.5 transition-colors cursor-pointer border border-white/5"
          >
            <div className="text-xs font-bold text-white">Profile strength</div>
            <div className="mt-2 h-1.5 w-full rounded-full bg-slate-700/80 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#2563EB] to-[#14B8A6]"
                style={{ width: `${profileStrength}%` }}
              />
            </div>
            <p className="mt-2 text-[11px] text-slate-300 leading-snug">
              {profileStrength}% complete. Add your portfolio link to reach 100%.
            </p>
          </button>
        </div>
      </aside>
    </>
  );
};
