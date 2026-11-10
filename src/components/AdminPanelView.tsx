import React, { useState } from 'react';
import {
  ShieldCheck,
  Sliders,
  Globe,
  Users,
  Sparkles,
  CheckCircle2,
  Pause,
  Play,
  Building2,
  Mail,
  Edit3,
  Plus,
  Check,
  Lock,
  ExternalLink,
  Send,
} from 'lucide-react';
import {
  AuditEvent,
  AutomationPolicy,
  AutoSearchConfig,
  OrganizationRecord,
  PlatformConnection,
  PlatformConnector,
  PortalEmailNotification,
  RegisteredUserRecord,
  StudentApplicationRecord,
  User,
  UserRole,
} from '../types';
import { NavTabId } from './Sidebar';

export const ADMIN_OWNER_EMAIL = 'narasimhulu0707@gmail.com';

interface AdminPanelViewProps {
  user?: User | null;
  policy: AutomationPolicy;
  autoSearchConfig?: AutoSearchConfig;
  platforms: { connector: PlatformConnector; connection: PlatformConnection }[];
  studentRecords: StudentApplicationRecord[];
  registeredUsers?: RegisteredUserRecord[];
  organizations?: OrganizationRecord[];
  portalEmails?: PortalEmailNotification[];
  auditEvents: AuditEvent[];
  onUpdatePolicy: (updates: Partial<AutomationPolicy>) => Promise<void>;
  onUpdateAutoSearchConfig: (updates: Partial<AutoSearchConfig>) => Promise<void>;
  onTogglePauseAll: () => void;
  onNavigate: (tab: NavTabId) => void;
  onRefreshState?: () => Promise<void> | void;
}

export const AdminPanelView: React.FC<AdminPanelViewProps> = ({
  user,
  policy,
  autoSearchConfig,
  platforms,
  studentRecords,
  registeredUsers = [],
  organizations = [],
  portalEmails = [],
  auditEvents,
  onUpdatePolicy,
  onUpdateAutoSearchConfig,
  onTogglePauseAll,
  onNavigate,
  onRefreshState,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'users' | 'organizations' | 'emails_engine'>('users');
  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  // User Edit / Create Modal State
  const [editingUser, setEditingUser] = useState<RegisteredUserRecord | null>(null);
  const [creatingUser, setCreatingUser] = useState<boolean>(false);
  const [uName, setUName] = useState('');
  const [uEmail, setUEmail] = useState('');
  const [uRole, setURole] = useState<UserRole>('student');
  const [uOrgName, setUOrgName] = useState('');
  const [uStatus, setUStatus] = useState<'Active' | 'Pending Verification' | 'Suspended'>('Active');
  const [uVerified, setUVerified] = useState(true);
  const [uNotes, setUNotes] = useState('');

  // Organization Edit / Create Modal State
  const [editingOrg, setEditingOrg] = useState<OrganizationRecord | null>(null);
  const [creatingOrg, setCreatingOrg] = useState<boolean>(false);
  const [oName, setOName] = useState('');
  const [oDomain, setODomain] = useState('');
  const [oCoordName, setOCoordName] = useState('');
  const [oCoordEmail, setOCoordEmail] = useState('');
  const [oPhone, setOPhone] = useState('');
  const [oStatus, setOStatus] = useState<'Verified' | 'Pending Review' | 'Needs Update'>('Verified');
  const [oVerified, setOVerified] = useState(true);
  const [oStudents, setOStudents] = useState('250');
  const [oDrives, setODrives] = useState('15');
  const [oNotes, setONotes] = useState('');

  const isAuthorizedAdmin =
    !user?.email || user.email.trim().toLowerCase() === ADMIN_OWNER_EMAIL;

  if (!isAuthorizedAdmin) {
    return (
      <div className="rounded-3xl bg-white border border-rose-200 p-10 text-center max-w-xl mx-auto my-12 shadow-xs space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-extrabold text-slate-900">
          Administrator Access Restricted
        </h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          The System Administrator Control Panel is exclusively authorized for{' '}
          <strong className="font-mono text-slate-900">{ADMIN_OWNER_EMAIL}</strong>.
          You are currently signed in as <span className="font-mono">{user?.email}</span>.
        </p>
        <button
          type="button"
          onClick={() => onNavigate('overview')}
          className="px-5 py-2.5 rounded-xl bg-[#1D58D8] text-white text-xs font-bold cursor-pointer"
        >
          Return to Candidate Dashboard
        </button>
      </div>
    );
  }

  const connectedCount = platforms.filter(p => p.connection.status === 'connected').length;
  const delivery = autoSearchConfig?.humanCentricDelivery || {
    naturalTypingCadence: true,
    keystrokeDelayMinMs: 48,
    keystrokeDelayMaxMs: 112,
    deBoilerplateToneGrounding: true,
    atsSemanticFormatting: true,
    randomizedCooldownSeconds: 28,
  };

  const handleToggleDeliveryOption = async (key: keyof typeof delivery) => {
    if (!autoSearchConfig) return;
    await onUpdateAutoSearchConfig({
      humanCentricDelivery: {
        ...delivery,
        [key]: !delivery[key],
      },
    });
  };

  // --- USER ACTIONS ---
  const openEditUser = (u: RegisteredUserRecord) => {
    setEditingUser(u);
    setCreatingUser(false);
    setUName(u.name);
    setUEmail(u.email);
    setURole(u.role);
    setUOrgName(u.organizationName || '');
    setUStatus(u.accountStatus);
    setUVerified(u.verifiedByAdmin);
    setUNotes(u.adminNotes || '');
  };

  const openCreateUser = () => {
    setEditingUser(null);
    setCreatingUser(true);
    setUName('');
    setUEmail('');
    setURole('student');
    setUOrgName('IIT Madras Career Placement Cell');
    setUStatus('Active');
    setUVerified(true);
    setUNotes('Verified by Administrator (narasimhulu0707@gmail.com).');
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (creatingUser) {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: uName,
          email: uEmail,
          role: uRole,
          organizationName: uOrgName,
          accountStatus: uStatus,
          verifiedByAdmin: uVerified,
          adminNotes: uNotes,
        }),
      });
      if (res.ok) {
        setStatusBanner(`Created and verified user account for ${uName} (${uEmail}).`);
        setCreatingUser(false);
        if (onRefreshState) await onRefreshState();
      }
    } else if (editingUser) {
      const res = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: uName,
          email: uEmail,
          role: uRole,
          organizationName: uOrgName,
          accountStatus: uStatus,
          verifiedByAdmin: uVerified,
          adminNotes: uNotes,
        }),
      });
      if (res.ok) {
        setStatusBanner(`Updated & verified user details for ${uName} (${uEmail}).`);
        setEditingUser(null);
        if (onRefreshState) await onRefreshState();
      }
    }
  };

  const handleQuickVerifyUser = async (u: RegisteredUserRecord) => {
    const nextVerified = !u.verifiedByAdmin;
    const res = await fetch(`/api/admin/users/${u.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        verifiedByAdmin: nextVerified,
        accountStatus: nextVerified ? 'Active' : 'Pending Verification',
      }),
    });
    if (res.ok) {
      setStatusBanner(
        `${nextVerified ? 'Verified' : 'Marked pending'} user ${u.name} (${u.email}).`
      );
      if (onRefreshState) await onRefreshState();
    }
  };

  // --- ORGANIZATION ACTIONS ---
  const openEditOrg = (o: OrganizationRecord) => {
    setEditingOrg(o);
    setCreatingOrg(false);
    setOName(o.name);
    setODomain(o.domain);
    setOCoordName(o.coordinatorName);
    setOCoordEmail(o.coordinatorEmail);
    setOPhone(o.contactPhone);
    setOStatus(o.status);
    setOVerified(o.verified);
    setOStudents(String(o.studentCount));
    setODrives(String(o.activeDrivesCount));
    setONotes(o.notes);
  };

  const openCreateOrg = () => {
    setEditingOrg(null);
    setCreatingOrg(true);
    setOName('');
    setODomain('');
    setOCoordName('');
    setOCoordEmail('');
    setOPhone('+91 98765 43210');
    setOStatus('Verified');
    setOVerified(true);
    setOStudents('300');
    setODrives('18');
    setONotes('Verified partner university / organization for 10-minute career portal drives.');
  };

  const handleSaveOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (creatingOrg) {
      const res = await fetch('/api/admin/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: oName,
          domain: oDomain,
          coordinatorName: oCoordName,
          coordinatorEmail: oCoordEmail,
          contactPhone: oPhone,
          status: oStatus,
          verified: oVerified,
          studentCount: Number(oStudents) || 200,
          activeDrivesCount: Number(oDrives) || 12,
          notes: oNotes,
        }),
      });
      if (res.ok) {
        setStatusBanner(`Registered & verified organization "${oName}".`);
        setCreatingOrg(false);
        if (onRefreshState) await onRefreshState();
      }
    } else if (editingOrg) {
      const res = await fetch(`/api/admin/organizations/${editingOrg.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: oName,
          domain: oDomain,
          coordinatorName: oCoordName,
          coordinatorEmail: oCoordEmail,
          contactPhone: oPhone,
          status: oStatus,
          verified: oVerified,
          studentCount: Number(oStudents) || editingOrg.studentCount,
          activeDrivesCount: Number(oDrives) || editingOrg.activeDrivesCount,
          notes: oNotes,
        }),
      });
      if (res.ok) {
        setStatusBanner(`Updated & verified organization details for "${oName}".`);
        setEditingOrg(null);
        if (onRefreshState) await onRefreshState();
      }
    }
  };

  const handleQuickVerifyOrg = async (o: OrganizationRecord) => {
    const nextVerified = !o.verified;
    const res = await fetch(`/api/admin/organizations/${o.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        verified: nextVerified,
        status: nextVerified ? 'Verified' : 'Pending Review',
      }),
    });
    if (res.ok) {
      setStatusBanner(
        `${nextVerified ? 'Verified' : 'Marked pending'} organization "${o.name}".`
      );
      if (onRefreshState) await onRefreshState();
    }
  };

  const handleDispatchPortalEmails = async () => {
    const res = await fetch('/api/portal-emails/dispatch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipientEmail: ADMIN_OWNER_EMAIL }),
    });
    if (res.ok) {
      setStatusBanner(
        `Dispatched all ${platforms.length} Career Portal Account Credentials & Verification Summary to ${ADMIN_OWNER_EMAIL}.`
      );
      if (onRefreshState) await onRefreshState();
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Royal Blue Administrator Hero Card */}
      <div className="relative rounded-[28px] bg-[#0F172A] text-white px-7 py-8 sm:px-10 overflow-hidden shadow-sm border border-slate-800">
        <div
          className="pointer-events-none absolute -right-12 -bottom-24 w-96 h-96 rounded-full bg-[#1D58D8]/40 blur-xl"
          aria-hidden="true"
        />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#2563EB]/30 text-blue-300 text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Exclusive System Administrator · {ADMIN_OWNER_EMAIL}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Admin Governance: Users, Organizations &amp; 41+ Portals
            </h1>
            <p className="text-sm sm:text-base text-slate-300 max-w-2xl">
              Store, monitor, update, and verify all registered User and Organization details, inspect career portal account creation emails, and govern 10-minute human-paced delivery.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onTogglePauseAll}
              className={`flex items-center gap-2 px-5 py-3.5 rounded-2xl font-bold text-sm transition-colors cursor-pointer ${
                policy.pauseAll
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-rose-600 hover:bg-rose-700 text-white'
              }`}
            >
              {policy.pauseAll ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              <span>{policy.pauseAll ? 'Resume Global Automation' : 'Emergency Global Pause'}</span>
            </button>
          </div>
        </div>
      </div>

      {statusBanner && (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 px-5 py-3.5 flex items-center justify-between gap-4 text-xs text-emerald-950 font-semibold">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{statusBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusBanner(null)}
            className="text-emerald-800 font-bold hover:underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 4 System-Wide Admin KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-3xl bg-white border border-slate-200/70 p-6 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#2563EB] flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">Registered Users</div>
            <div className="text-2xl font-extrabold text-slate-900 mt-0.5 tabular-nums">
              {registeredUsers.length}
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-white border border-slate-200/70 p-6 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">Verified Organizations</div>
            <div className="text-2xl font-extrabold text-slate-900 mt-0.5 tabular-nums">
              {organizations.length}
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-white border border-slate-200/70 p-6 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">Connected Portals</div>
            <div className="text-2xl font-extrabold text-slate-900 mt-0.5 tabular-nums">
              {connectedCount} / {platforms.length}
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-white border border-slate-200/70 p-6 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">Portal Account Emails</div>
            <div className="text-2xl font-extrabold text-slate-900 mt-0.5 tabular-nums">
              {portalEmails.length}
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs for Users, Organizations & Portal Emails */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white rounded-2xl p-2 border border-slate-200/80 shadow-2xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveSubTab('users')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'users'
                ? 'bg-[#2563EB] text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>1. Registered Users Monitor &amp; Verify ({registeredUsers.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('organizations')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'organizations'
                ? 'bg-[#2563EB] text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>2. Organizations &amp; Colleges Monitor &amp; Verify ({organizations.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('emails_engine')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'emails_engine'
                ? 'bg-[#2563EB] text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>3. Portal Account Creation Emails &amp; Delivery Engine ({portalEmails.length})</span>
          </button>
        </div>

        {activeSubTab === 'users' && (
          <button
            type="button"
            onClick={openCreateUser}
            className="px-4 py-2 rounded-xl bg-[#1D58D8] hover:bg-[#1E40AF] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add &amp; Verify User</span>
          </button>
        )}

        {activeSubTab === 'organizations' && (
          <button
            type="button"
            onClick={openCreateOrg}
            className="px-4 py-2 rounded-xl bg-[#1D58D8] hover:bg-[#1E40AF] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add &amp; Verify Organization</span>
          </button>
        )}
      </div>

      {/* TAB 1: REGISTERED USERS DIRECTORY (MONITOR, UPDATE & VERIFY) */}
      {activeSubTab === 'users' && (
        <div className="rounded-3xl bg-white border border-slate-200/80 p-6 sm:p-7 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">
                Registered Users Directory (Monitor, Update &amp; Verify Details)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                All test accounts have been removed. Administrator role is strictly locked to{' '}
                <strong className="font-mono text-slate-800">{ADMIN_OWNER_EMAIL}</strong>.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-700">
              {registeredUsers.filter(u => u.verifiedByAdmin).length} / {registeredUsers.length} Verified
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {registeredUsers.map(u => (
              <div
                key={u.id}
                className="py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 text-xs"
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-extrabold text-sm text-slate-900">{u.name}</span>
                    <span className="font-mono text-slate-600">{u.email}</span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                        u.role === 'admin'
                          ? 'bg-purple-100 text-purple-900'
                          : u.role === 'organization'
                          ? 'bg-emerald-50 text-emerald-800'
                          : 'bg-blue-50 text-[#1D58D8]'
                      }`}
                    >
                      {u.role}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        u.verifiedByAdmin
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-amber-50 text-amber-800'
                      }`}
                    >
                      {u.verifiedByAdmin ? '✓ Admin Verified' : 'Pending Verification'}
                    </span>
                  </div>

                  <div className="text-slate-600">
                    <strong>Organization:</strong> {u.organizationName || 'Independent Candidate'} ·{' '}
                    <strong>Auth:</strong> {u.authProvider === 'google' ? 'Google OAuth + Gmail OTP' : 'Gmail OTP + Password'} ·{' '}
                    <strong>Portals Synced:</strong> {u.portalsConnectedCount} ·{' '}
                    <strong>Applications:</strong> {u.applicationsSubmittedCount}
                  </div>

                  {u.adminNotes && (
                    <div className="text-slate-500 italic">{u.adminNotes}</div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleQuickVerifyUser(u)}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs cursor-pointer transition-colors ${
                      u.verifiedByAdmin
                        ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        : 'bg-emerald-600 text-white hover:bg-emerald-700'
                    }`}
                  >
                    {u.verifiedByAdmin ? 'Verified ✓' : 'Verify User'}
                  </button>

                  <button
                    type="button"
                    onClick={() => openEditUser(u)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#F4F6FB] hover:bg-blue-50 text-[#1D58D8] font-bold text-xs cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Update Details</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: ORGANIZATIONS & COLLEGES DIRECTORY (MONITOR, UPDATE & VERIFY) */}
      {activeSubTab === 'organizations' && (
        <div className="rounded-3xl bg-white border border-slate-200/80 p-6 sm:p-7 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">
                Organizations &amp; College Placement Cells (Monitor, Update &amp; Verify)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Monitor institutional placement cells, update coordinator contact details, and verify batch placement drives.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-700">
              {organizations.filter(o => o.verified).length} / {organizations.length} Verified Organizations
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {organizations.map(org => (
              <div
                key={org.id}
                className="py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 text-xs"
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-extrabold text-sm text-slate-900">{org.name}</span>
                    <span className="font-mono text-slate-500">({org.domain})</span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        org.verified
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-amber-50 text-amber-800'
                      }`}
                    >
                      {org.status}
                    </span>
                  </div>

                  <div className="text-slate-600">
                    <strong>Coordinator:</strong> {org.coordinatorName} ({org.coordinatorEmail}) ·{' '}
                    <strong>Phone:</strong> {org.contactPhone} ·{' '}
                    <strong>Students:</strong> {org.studentCount} ·{' '}
                    <strong>Active Drives:</strong> {org.activeDrivesCount}
                  </div>

                  <div className="text-slate-500">{org.notes}</div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleQuickVerifyOrg(org)}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs cursor-pointer transition-colors ${
                      org.verified
                        ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        : 'bg-emerald-600 text-white hover:bg-emerald-700'
                    }`}
                  >
                    {org.verified ? 'Verified ✓' : 'Verify Org'}
                  </button>

                  <button
                    type="button"
                    onClick={() => openEditOrg(org)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#F4F6FB] hover:bg-blue-50 text-[#1D58D8] font-bold text-xs cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Update Org</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: CAREER PORTAL ACCOUNT CREATION EMAILS & HUMAN DELIVERY ENGINE */}
      {activeSubTab === 'emails_engine' && (
        <div className="space-y-6">
          <div className="rounded-3xl bg-white border border-slate-200/80 p-6 sm:p-7 shadow-2xs space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">
                  Career Portal Account Creation Emails &amp; Gmail Sync Center
                </h2>
                <p className="text-xs text-slate-600 mt-1 max-w-3xl leading-relaxed">
                  <strong>Why external career portals didn&apos;t send a separate email to your external inbox earlier:</strong>{' '}
                  Third-party ATS platforms (Workday, Greenhouse, Lever, LinkedIn, Naukri) only dispatch external emails when triggered via live SMTP relay or direct Gmail compose. Every account created by the AutoApply connector is recorded here with its exact portal passkey/reference and can be dispatched or opened directly in your Gmail (<span className="font-mono">{ADMIN_OWNER_EMAIL}</span>).
                </p>
              </div>

              <button
                type="button"
                onClick={handleDispatchPortalEmails}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#1D58D8] hover:bg-[#1E40AF] text-white text-xs font-bold shrink-0 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send 41+ Portal Credentials Summary to {ADMIN_OWNER_EMAIL}</span>
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {portalEmails.map(item => {
                const gmailComposeUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
                  item.recipientEmail
                )}&su=${encodeURIComponent(item.subject)}&body=${encodeURIComponent(item.bodyText)}`;

                return (
                  <div key={item.id} className="py-4 space-y-2 text-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-[#1D58D8] font-bold text-[11px]">
                          {item.category}
                        </span>
                        <span className="font-extrabold text-sm text-slate-900">
                          {item.subject}
                        </span>
                      </div>
                      <span className="font-mono text-[11px] font-bold text-emerald-700 shrink-0">
                        {item.status} · Ref: {item.portalPasskeyOrRef}
                      </span>
                    </div>

                    <div className="text-slate-500">
                      <strong>Portal:</strong> {item.portalName} · <strong>To:</strong>{' '}
                      <span className="font-mono text-slate-800">{item.recipientEmail}</span> ·{' '}
                      <strong>From:</strong> <span className="font-mono">{item.senderAddress}</span>
                    </div>

                    <pre className="p-3.5 rounded-2xl bg-[#F4F6FB] border border-slate-200/70 text-xs text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">
                      {item.bodyText}
                    </pre>

                    <div className="flex items-center justify-end gap-3 pt-1">
                      <a
                        href={item.portalUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1"
                      >
                        <span>Open Portal ({item.portalName})</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>

                      <a
                        href={gmailComposeUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#1D58D8] font-bold text-xs flex items-center gap-1.5"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span>Forward Copy in Gmail Web</span>
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Human-Centric Application Quality & Natural Form Pacing Engine */}
          <div className="rounded-3xl bg-white border border-slate-200/80 p-7 shadow-2xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#2563EB] flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900">
                    Human-Centric Application Delivery &amp; Anti-Boilerplate Engine
                  </h2>
                  <p className="text-xs text-slate-500">
                    Ensures every application uses natural human typing cadence, authentic metric-backed prose, and clean ATS semantic structure.
                  </p>
                </div>
              </div>

              <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs shrink-0">
                Natural Pacing Active
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-[#F4F6FB] border border-slate-200/70 flex flex-col justify-between gap-4">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-900">
                      1. Natural Typing Cadence
                    </span>
                    <span className="font-mono text-xs font-bold text-[#2563EB]">
                      {delivery.keystrokeDelayMinMs}–{delivery.keystrokeDelayMaxMs}ms
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    Types form fields sequentially with realistic human keystroke timing instead of instant bulk DOM injection.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleDeliveryOption('naturalTypingCadence')}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    delivery.naturalTypingCadence
                      ? 'bg-[#2563EB] text-white'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {delivery.naturalTypingCadence ? '✓ Human Keystroke Pacing Enabled' : 'Enable Pacing'}
                </button>
              </div>

              <div className="p-5 rounded-2xl bg-[#F4F6FB] border border-slate-200/70 flex flex-col justify-between gap-4">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-900">
                      2. Authentic Human Prose Filter
                    </span>
                    <span className="font-mono text-xs font-bold text-emerald-700">
                      Zero Clichés
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    Strips generic AI filler phrases and grounds every cover note and screening answer in concrete project metrics.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleDeliveryOption('deBoilerplateToneGrounding')}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    delivery.deBoilerplateToneGrounding
                      ? 'bg-[#2563EB] text-white'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {delivery.deBoilerplateToneGrounding
                    ? '✓ Authentic Tone Grounding Enabled'
                    : 'Enable Filter'}
                </button>
              </div>

              <div className="p-5 rounded-2xl bg-[#F4F6FB] border border-slate-200/70 flex flex-col justify-between gap-4">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-900">
                      3. ATS Parser &amp; Cooldown Jitter
                    </span>
                    <span className="font-mono text-xs font-bold text-purple-700">
                      ~{delivery.randomizedCooldownSeconds}s Cooldown
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    Formats answers for Workday, Greenhouse, Lever, and iCIMS parsers with natural spacing between submissions.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleDeliveryOption('atsSemanticFormatting')}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    delivery.atsSemanticFormatting
                      ? 'bg-[#2563EB] text-white'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {delivery.atsSemanticFormatting
                    ? '✓ ATS Semantic Optimization Active'
                    : 'Enable Optimization'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Split: Global Rate Limit Controls & Live System Audit Log */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 rounded-3xl bg-white border border-slate-200/80 p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#2563EB]" />
              <span>Global Governance &amp; Quotas</span>
            </h3>
            <button
              type="button"
              onClick={() => onNavigate('career_portals' as NavTabId)}
              className="text-xs font-bold text-[#1D58D8] hover:underline cursor-pointer"
            >
              Manage {platforms.length} Portals →
            </button>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-[#F4F6FB] flex items-center justify-between">
              <span className="font-semibold text-slate-700">Global Daily Application Cap</span>
              <input
                type="number"
                min={1}
                max={100}
                value={policy.overallDailyLimit}
                onChange={e => onUpdatePolicy({ overallDailyLimit: Number(e.target.value) || 25 })}
                className="w-20 px-2.5 py-1.5 rounded-xl bg-white border border-slate-300 font-mono font-bold text-slate-900 text-right"
              />
            </div>

            <div className="p-3.5 rounded-2xl bg-[#F4F6FB] flex items-center justify-between">
              <span className="font-semibold text-slate-700">Per-Company Application Cap</span>
              <input
                type="number"
                min={1}
                max={10}
                value={policy.perCompanyCap}
                onChange={e => onUpdatePolicy({ perCompanyCap: Number(e.target.value) || 2 })}
                className="w-20 px-2.5 py-1.5 rounded-xl bg-white border border-slate-300 font-mono font-bold text-slate-900 text-right"
              />
            </div>

            <div className="p-3.5 rounded-2xl bg-[#F4F6FB] flex items-center justify-between">
              <span className="font-semibold text-slate-700">Placement Cohort Records</span>
              <span className="font-mono font-bold text-slate-900">{studentRecords.length} Active</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 rounded-3xl bg-white border border-slate-200/80 p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-slate-900">
              Recent Platform &amp; Panel Audit Trail
            </h3>
            <span className="text-xs font-mono text-slate-400">
              {auditEvents.length} events recorded
            </span>
          </div>

          <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
            {auditEvents.slice(0, 8).map(evt => (
              <div key={evt.id} className="py-2.5 flex items-start justify-between gap-4 text-xs">
                <div>
                  <span className="font-mono font-bold text-[#1D58D8]">{evt.action}</span>
                  <p className="text-slate-600 mt-0.5">{evt.details}</p>
                </div>
                <span className="font-mono text-[11px] text-slate-400 shrink-0 tabular-nums">
                  {new Date(evt.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal: Edit / Create User */}
      {(editingUser || creatingUser) && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-7 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-extrabold text-slate-900">
                {creatingUser ? 'Add & Verify User Account' : `Update & Verify User: ${editingUser?.name}`}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setEditingUser(null);
                  setCreatingUser(false);
                }}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={uName}
                    onChange={e => setUName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Gmail / Email Address</label>
                  <input
                    type="email"
                    required
                    value={uEmail}
                    onChange={e => setUEmail(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-mono text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Role Panel</label>
                  <select
                    value={uRole}
                    onChange={e => setURole(e.target.value as UserRole)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-slate-900 bg-white"
                  >
                    <option value="student">Student / Candidate</option>
                    <option value="organization">Organization / College</option>
                    {uEmail.trim().toLowerCase() === ADMIN_OWNER_EMAIL && (
                      <option value="admin">Administrator ({ADMIN_OWNER_EMAIL})</option>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Account Status</label>
                  <select
                    value={uStatus}
                    onChange={e => setUStatus(e.target.value as any)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-slate-900 bg-white"
                  >
                    <option value="Active">Active</option>
                    <option value="Pending Verification">Pending Verification</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Organization / College Name</label>
                <input
                  type="text"
                  value={uOrgName}
                  onChange={e => setUOrgName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Admin Verification Notes</label>
                <textarea
                  rows={2}
                  value={uNotes}
                  onChange={e => setUNotes(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-slate-900"
                />
              </div>

              <label className="flex items-center gap-2 font-bold text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={uVerified}
                  onChange={e => setUVerified(e.target.checked)}
                />
                <span>Verified by Administrator ({ADMIN_OWNER_EMAIL})</span>
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingUser(null);
                    setCreatingUser(false);
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-300 font-bold text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#1D58D8] text-white font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save &amp; Verify User</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit / Create Organization */}
      {(editingOrg || creatingOrg) && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-7 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-extrabold text-slate-900">
                {creatingOrg ? 'Add & Verify Organization' : `Update Organization: ${editingOrg?.name}`}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setEditingOrg(null);
                  setCreatingOrg(false);
                }}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveOrg} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Organization / College Name</label>
                  <input
                    type="text"
                    required
                    value={oName}
                    onChange={e => setOName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Institutional Domain</label>
                  <input
                    type="text"
                    required
                    value={oDomain}
                    onChange={e => setODomain(e.target.value)}
                    placeholder="iitm.ac.in"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-mono text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Coordinator Name</label>
                  <input
                    type="text"
                    required
                    value={oCoordName}
                    onChange={e => setOCoordName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Coordinator Email</label>
                  <input
                    type="email"
                    required
                    value={oCoordEmail}
                    onChange={e => setOCoordEmail(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-mono text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={oPhone}
                    onChange={e => setOPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Students Count</label>
                  <input
                    type="number"
                    value={oStudents}
                    onChange={e => setOStudents(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Verification Status</label>
                  <select
                    value={oStatus}
                    onChange={e => setOStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 bg-white"
                  >
                    <option value="Verified">Verified</option>
                    <option value="Pending Review">Pending Review</option>
                    <option value="Needs Update">Needs Update</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Verification &amp; Placement Notes</label>
                <textarea
                  rows={2}
                  value={oNotes}
                  onChange={e => setONotes(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-slate-900"
                />
              </div>

              <label className="flex items-center gap-2 font-bold text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={oVerified}
                  onChange={e => setOVerified(e.target.checked)}
                />
                <span>Organization Verified by Administrator</span>
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingOrg(null);
                    setCreatingOrg(false);
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-300 font-bold text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#1D58D8] text-white font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save &amp; Verify Organization</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
