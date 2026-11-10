import React from 'react';
import { Search, Bell, LogOut } from 'lucide-react';
import { AutomationPolicy, User } from '../types';
import { NavTabId } from './Sidebar';

interface NavbarProps {
  user: User | null;
  policy: AutomationPolicy;
  onTogglePauseAll: () => void;
  actionRequiredCount: number;
  onNavigateToInterventions: () => void;
  activeTab: NavTabId;
  onMobileMenuToggle: () => void;
  onSignOut: () => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  onSearchSubmit?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  actionRequiredCount,
  onNavigateToInterventions,
  onMobileMenuToggle,
  onSignOut,
  searchQuery = '',
  onSearchChange,
  onSearchSubmit,
}) => {
  const initials = (user?.name || 'Amara Malik')
    .split(' ')
    .map(part => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onSearchSubmit) {
      onSearchSubmit();
    }
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-[#F4F6FB]/95 backdrop-blur-xs pt-5 pb-2 px-5 sm:px-8">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
        {/* Left: Mobile Menu Button + Search Bar */}
        <div className="flex items-center gap-3 flex-1">
          <button
            onClick={onMobileMenuToggle}
            className="md:hidden p-2.5 bg-white text-slate-700 hover:text-slate-900 rounded-2xl shadow-xs focus:outline-none shrink-0"
            aria-label="Toggle mobile menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="relative flex-1 max-w-3xl">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => onSearchChange?.(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search roles, companies"
              className="w-full h-12 pl-11 pr-4 rounded-2xl bg-white border border-slate-200/70 shadow-xs text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
            />
          </div>
        </div>

        {/* Right: Notification Bell + Initials Avatar + Sign Out */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onNavigateToInterventions}
            className="relative h-12 w-12 rounded-2xl bg-white border border-slate-200/70 shadow-xs flex items-center justify-center text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            title={
              actionRequiredCount > 0
                ? `${actionRequiredCount} verification challenge(s) waiting`
                : 'Notifications & Task Control'
            }
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {actionRequiredCount > 0 && (
              <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 rounded-full bg-rose-600 ring-2 ring-white" />
            )}
          </button>

          <div
            className="h-12 w-12 rounded-full bg-[#0F172A] text-white font-bold text-sm flex items-center justify-center tracking-wide shadow-xs shrink-0"
            title={`${user?.name || 'Amara'} (${user?.email || ''})`}
          >
            {initials}
          </div>

          <button
            type="button"
            onClick={onSignOut}
            className="h-12 px-3.5 rounded-2xl bg-white border border-slate-200/70 shadow-xs flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer"
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  );
};
