/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { AuthView } from './components/AuthView';
import { Navbar } from './components/Navbar';
import { Sidebar, NavTabId } from './components/Sidebar';
import { OverviewView } from './components/OverviewView';
import { TaskControlView } from './components/TaskControlView';
import { CampaignsView } from './components/CampaignsView';
import { ResumesView } from './components/ResumesView';
import { ProfileView } from './components/ProfileView';
import { JobMatchesView } from './components/JobMatchesView';
import { ApplicationsView } from './components/ApplicationsView';
import { PlatformsView } from './components/PlatformsView';
import { InteractiveSandboxView } from './components/InteractiveSandboxView';
import { SettingsView } from './components/SettingsView';
import { GmailOtpView } from './components/GmailOtpView';
import { PrivacyView } from './components/PrivacyView';
import { OrganizationPanelView } from './components/OrganizationPanelView';
import { AdminPanelView } from './components/AdminPanelView';
import { CareerPortalsDirectoryView } from './components/CareerPortalsDirectoryView';
import { TailorResumeView } from './components/TailorResumeView';
import {
  Application,
  AuditEvent,
  AutomationPolicy,
  AutoSearchConfig,
  AutoSearchRunLog,
  BrowserSession,
  Campaign,
  GmailOtpConfig,
  Job,
  JobMatch,
  MasterProfile,
  OrganizationRecord,
  PlatformConnection,
  PlatformConnector,
  PortalEmailNotification,
  RegisteredUserRecord,
  ResumeVersion,
  StudentApplicationRecord,
  TailoredResumeResult,
  User,
} from './types';

const AUTH_STORAGE_KEY = 'applypilot_auth_session';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('autostart') === '1') return true;
      return Boolean(window.localStorage.getItem(AUTH_STORAGE_KEY));
    }
    return false;
  });

  const [activeTab, setActiveTab] = useState<NavTabId>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Core application state
  const [user, setUser] = useState<User | null>(null);
  const [masterProfile, setMasterProfile] = useState<MasterProfile | null>(null);
  const [resumes, setResumes] = useState<ResumeVersion[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [platforms, setPlatforms] = useState<{ connector: PlatformConnector; connection: PlatformConnection }[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [matches, setMatches] = useState<JobMatch[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [studentRecords, setStudentRecords] = useState<StudentApplicationRecord[]>([]);
  const [tailoredHistory, setTailoredHistory] = useState<TailoredResumeResult[]>([]);
  const [registeredUsers, setRegisteredUsers] = useState<RegisteredUserRecord[]>([]);
  const [organizations, setOrganizations] = useState<OrganizationRecord[]>([]);
  const [portalEmails, setPortalEmails] = useState<PortalEmailNotification[]>([]);
  const [policy, setPolicy] = useState<AutomationPolicy>({
    overallDailyLimit: 25,
    todayAppliedTotal: 0,
    timezone: 'Asia/Kolkata',
    pauseAll: false,
    reviewBeforeSubmit: true,
    stopOnUnknownFacts: true,
    stopOnCaptcha: true,
    stopOnNewConsent: true,
    stopOnExpiredLogin: true,
    perCompanyCap: 2,
    browserWorkerUrl: '',
  });
  const [gmailConfig, setGmailConfig] = useState<GmailOtpConfig>({
    enabled: false,
    scopesGranted: [],
    allowedDomains: [],
  });
  const [autoSearchConfig, setAutoSearchConfig] = useState<AutoSearchConfig | undefined>(undefined);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [sessions] = useState<Record<string, BrowserSession>>({});

  // Fetch full state from server
  const fetchAllState = useCallback(async () => {
    try {
      const [
        profileRes,
        resumesRes,
        campaignsRes,
        platformsRes,
        jobsRes,
        appsRes,
        policyRes,
        gmailRes,
        autoSearchRes,
        auditRes,
        studentsRes,
        tailoredRes,
        adminUsersRes,
        adminOrgsRes,
        portalEmailsRes,
      ] = await Promise.all([
        fetch('/api/profile'),
        fetch('/api/resumes'),
        fetch('/api/campaigns'),
        fetch('/api/platforms'),
        fetch('/api/jobs'),
        fetch('/api/applications'),
        fetch('/api/policy'),
        fetch('/api/gmail-otp'),
        fetch('/api/auto-search'),
        fetch('/api/audit-logs'),
        fetch('/api/organization/students'),
        fetch('/api/resumes/tailored-history'),
        fetch('/api/admin/users'),
        fetch('/api/admin/organizations'),
        fetch('/api/portal-emails'),
      ]);

      if (profileRes.ok) {
        const pData = await profileRes.json();
        setUser(pData.user);
        setMasterProfile(pData.masterProfile);
      }
      if (resumesRes.ok) setResumes(await resumesRes.json());
      if (campaignsRes.ok) setCampaigns(await campaignsRes.json());
      if (platformsRes.ok) setPlatforms(await platformsRes.json());
      if (jobsRes.ok) {
        const jData = await jobsRes.json();
        setJobs(jData.jobs || []);
        setMatches(jData.matches || []);
      }
      if (appsRes.ok) {
        const aData = await appsRes.json();
        setApplications(aData.applications || []);
      }
      if (policyRes.ok) setPolicy(await policyRes.json());
      if (gmailRes.ok) setGmailConfig(await gmailRes.json());
      if (autoSearchRes.ok) setAutoSearchConfig(await autoSearchRes.json());
      if (auditRes.ok) setAuditEvents(await auditRes.json());
      if (studentsRes.ok) setStudentRecords(await studentsRes.json());
      if (tailoredRes.ok) setTailoredHistory(await tailoredRes.json());
      if (adminUsersRes.ok) setRegisteredUsers(await adminUsersRes.json());
      if (adminOrgsRes.ok) setOrganizations(await adminOrgsRes.json());
      if (portalEmailsRes.ok) setPortalEmails(await portalEmailsRes.json());
    } catch (err) {
      console.error('Failed to load ApplyPilot state:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllState();
  }, [fetchAllState]);

  const handleAuthenticated = (authenticatedUser: User, token: string) => {
    setUser(authenticatedUser);
    setIsAuthenticated(true);
    if (authenticatedUser.role === 'admin') {
      setActiveTab('admin_panel');
    } else if (authenticatedUser.role === 'organization') {
      setActiveTab('org_panel');
    } else {
      setActiveTab('overview');
    }
    try {
      window.localStorage.setItem(AUTH_STORAGE_KEY, token);
    } catch {
      // ignore storage errors
    }
    fetchAllState();
  };

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore network error
    }
    try {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch {
      // ignore storage error
    }
    setIsAuthenticated(false);
  };

  // Actions
  const handleTogglePauseAll = async () => {
    try {
      const res = await fetch('/api/policy/pause-all', { method: 'POST' });
      const data = await res.json();
      setPolicy(prev => ({ ...prev, pauseAll: data.pauseAll }));
      fetchAllState();
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdatePolicy = async (updates: Partial<AutomationPolicy>) => {
    try {
      const res = await fetch('/api/policy', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const data = await res.json();
        setPolicy(data.policy);
        fetchAllState();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateProfile = async (updated: Partial<MasterProfile>) => {
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ masterProfile: updated }),
      });
      if (res.ok) {
        const data = await res.json();
        setMasterProfile(data.masterProfile);
        fetchAllState();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleResolveConflict = async (conflictId: string, chosenValue: string) => {
    try {
      await fetch('/api/profile/resolve-conflict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conflictId, chosenValue }),
      });
      fetchAllState();
    } catch (e) {
      console.error(e);
    }
  };

  const handleUploadResume = async (resumeData: any) => {
    try {
      const res = await fetch('/api/resumes/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resumeData),
      });
      if (res.ok) fetchAllState();
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateResume = async (id: string, updates: Partial<ResumeVersion>) => {
    try {
      await fetch(`/api/resumes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      fetchAllState();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteResume = async (id: string) => {
    try {
      await fetch(`/api/resumes/${id}`, { method: 'DELETE' });
      fetchAllState();
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleCampaign = async (id: string) => {
    try {
      await fetch(`/api/campaigns/${id}/toggle-status`, { method: 'POST' });
      fetchAllState();
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateCampaign = async (id: string, updates: Partial<Campaign>) => {
    try {
      await fetch(`/api/campaigns/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      fetchAllState();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateCampaign = async (newCamp: Partial<Campaign>) => {
    try {
      await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCamp),
      });
      fetchAllState();
    } catch (e) {
      console.error(e);
    }
  };

  const handleConnectPlatform = async (id: string) => {
    try {
      await fetch(`/api/platforms/${id}/connect`, { method: 'POST' });
      fetchAllState();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDisconnectPlatform = async (id: string) => {
    try {
      await fetch(`/api/platforms/${id}/disconnect`, { method: 'POST' });
      fetchAllState();
    } catch (e) {
      console.error(e);
    }
  };

  const handleImportJob = async (jobData: any) => {
    const res = await fetch('/api/jobs/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(jobData),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.details || err.error || 'Failed to import job');
    }
    fetchAllState();
  };

  const handleCreateApplicationFromMatch = async (matchId: string) => {
    try {
      const res = await fetch('/api/applications/create-from-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId }),
      });
      if (res.ok) {
        fetchAllState();
        setActiveTab('applications');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleApproveApplication = async (id: string) => {
    try {
      await fetch(`/api/applications/${id}/approve`, { method: 'POST' });
      fetchAllState();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmitApplication = async (id: string) => {
    try {
      await fetch(`/api/applications/${id}/submit`, { method: 'POST' });
      fetchAllState();
    } catch (e) {
      console.error(e);
    }
  };

  const handleOverrideResume = async (appId: string, resumeId: string) => {
    try {
      await fetch(`/api/applications/${appId}/override-resume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeId }),
      });
      fetchAllState();
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateAnswer = async (appId: string, fieldKey: string, answerValue: string) => {
    try {
      await fetch(`/api/applications/${appId}/update-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fieldKey, answerValue }),
      });
      fetchAllState();
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleGmail = async (enabled: boolean) => {
    try {
      await fetch('/api/gmail-otp/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      });
      fetchAllState();
    } catch (e) {
      console.error(e);
    }
  };

  const handlePurgeAccount = async () => {
    try {
      await fetch('/api/privacy/delete-account', { method: 'POST' });
      fetchAllState();
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateAutoSearchConfig = async (updates: Partial<AutoSearchConfig>) => {
    try {
      const res = await fetch('/api/auto-search/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const data = await res.json();
        setAutoSearchConfig(data.autoSearchConfig);
        fetchAllState();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRunAutoSearchNow = async (): Promise<AutoSearchRunLog | null> => {
    try {
      const res = await fetch('/api/auto-search/run-now', {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        setAutoSearchConfig(data.autoSearchConfig);
        await fetchAllState();
        return data.runLog as AutoSearchRunLog;
      }
    } catch (e) {
      console.error(e);
    }
    return null;
  };

  const handleUpdateStudentRecord = async (id: string, updates: Partial<StudentApplicationRecord>) => {
    try {
      const res = await fetch(`/api/organization/students/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const data = await res.json();
        setStudentRecords(data.studentRecords || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateStudentRecord = async (newRecord: Partial<StudentApplicationRecord>) => {
    try {
      const res = await fetch('/api/organization/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRecord),
      });
      if (res.ok) {
        const data = await res.json();
        setStudentRecords(data.studentRecords || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Show Authentication Screen if not signed in
  if (!isAuthenticated) {
    return <AuthView onAuthenticated={handleAuthenticated} />;
  }

  // Interventions count
  const actionRequiredCount = applications.filter(a =>
    ['Waiting for CAPTCHA', 'Waiting for Login', 'Waiting for OTP', 'Needs Information'].includes(a.status)
  ).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500 text-sm">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
          <span>Loading candidate workspace...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F6FB] text-slate-900 flex">
      {/* Left Navigation Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        actionRequiredCount={actionRequiredCount}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        profileStrength={masterProfile?.portfolioUrl ? 92 : 82}
        portalsCount={platforms.length || 41}
        userEmail={user?.email}
      />

      {/* Right Workspace Column */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar
          user={user}
          policy={policy}
          onTogglePauseAll={handleTogglePauseAll}
          actionRequiredCount={actionRequiredCount}
          onNavigateToInterventions={() => setActiveTab('interventions')}
          activeTab={activeTab}
          onMobileMenuToggle={() => setMobileMenuOpen(prev => !prev)}
          onSignOut={handleSignOut}
          onSearchSubmit={() => setActiveTab('matches')}
        />

        <main className="flex-1 overflow-y-auto px-5 pb-8 pt-3 sm:px-8 max-w-6xl w-full mx-auto">
          {activeTab === 'overview' && (
            <OverviewView
              user={user}
              jobs={jobs}
              campaigns={campaigns}
              applications={applications}
              matches={matches}
              resumes={resumes}
              autoSearchConfig={autoSearchConfig}
              portalEmails={portalEmails}
              onUpdateAutoSearchConfig={handleUpdateAutoSearchConfig}
              onRunAutoSearchNow={handleRunAutoSearchNow}
              onApproveApplication={handleApproveApplication}
              onSubmitApplication={handleSubmitApplication}
              onNavigate={setActiveTab}
              onToggleCampaign={handleToggleCampaign}
            />
          )}

          {activeTab === 'org_panel' && (
            <OrganizationPanelView
              user={user}
              studentRecords={studentRecords}
              onUpdateStudentRecord={handleUpdateStudentRecord}
              onCreateStudentRecord={handleCreateStudentRecord}
            />
          )}

          {activeTab === 'admin_panel' && (
            <AdminPanelView
              user={user}
              policy={policy}
              autoSearchConfig={autoSearchConfig}
              platforms={platforms}
              studentRecords={studentRecords}
              auditEvents={auditEvents}
              registeredUsers={registeredUsers}
              organizations={organizations}
              portalEmails={portalEmails}
              onUpdatePolicy={handleUpdatePolicy}
              onUpdateAutoSearchConfig={handleUpdateAutoSearchConfig}
              onTogglePauseAll={handleTogglePauseAll}
              onNavigate={setActiveTab}
              onRefreshState={fetchAllState}
            />
          )}

          {activeTab === 'career_portals' && (
            <CareerPortalsDirectoryView
              platformItems={platforms}
              autoSearchConfig={autoSearchConfig}
              onConnectPlatform={handleConnectPlatform}
              onDisconnectPlatform={handleDisconnectPlatform}
              onRunAutoSearchNow={handleRunAutoSearchNow}
            />
          )}

          {activeTab === 'tailor_resume' && (
            <TailorResumeView
              resumes={resumes}
              jobs={jobs}
              masterProfile={masterProfile}
              tailoredHistory={tailoredHistory}
              onRefreshState={fetchAllState}
            />
          )}

          {activeTab === 'interventions' && (
            <TaskControlView
              applications={applications}
              sessions={sessions}
              jobs={jobs}
              onRefresh={fetchAllState}
              onNavigateToSandbox={() => setActiveTab('applications')}
            />
          )}

          {activeTab === 'campaigns' && (
            <CampaignsView
              campaigns={campaigns}
              resumes={resumes}
              onToggleCampaign={handleToggleCampaign}
              onUpdateCampaign={handleUpdateCampaign}
              onCreateCampaign={handleCreateCampaign}
            />
          )}

          {activeTab === 'resumes' && (
            <ResumesView
              resumes={resumes}
              conflicts={masterProfile?.conflicts || []}
              onUploadResume={handleUploadResume}
              onUpdateResume={handleUpdateResume}
              onDeleteResume={handleDeleteResume}
            />
          )}

          {activeTab === 'profile' && masterProfile && (
            <ProfileView
              profile={masterProfile}
              conflicts={masterProfile.conflicts || []}
              onUpdateProfile={handleUpdateProfile}
              onResolveConflict={handleResolveConflict}
            />
          )}

          {activeTab === 'matches' && (
            <JobMatchesView
              jobs={jobs}
              matches={matches}
              campaigns={campaigns}
              applications={applications}
              autoSearchConfig={autoSearchConfig}
              onUpdateAutoSearchConfig={handleUpdateAutoSearchConfig}
              onRunAutoSearchNow={handleRunAutoSearchNow}
              onImportJob={handleImportJob}
              onCreateApplication={handleCreateApplicationFromMatch}
            />
          )}

          {activeTab === 'applications' && (
            <ApplicationsView
              applications={applications}
              jobs={jobs}
              matches={matches}
              campaigns={campaigns}
              resumes={resumes}
              onApproveApplication={handleApproveApplication}
              onSubmitApplication={handleSubmitApplication}
              onUpdateAnswer={handleUpdateAnswer}
              onOverrideResume={handleOverrideResume}
              onNavigateToInterventions={() => setActiveTab('interventions')}
            />
          )}

          {activeTab === 'platforms' && (
            <PlatformsView
              platformItems={platforms}
              onConnectPlatform={handleConnectPlatform}
              onDisconnectPlatform={handleDisconnectPlatform}
            />
          )}

          {activeTab === 'sandbox' && (
            <InteractiveSandboxView
              resumes={resumes}
              applications={applications}
              onTakeControl={() => setActiveTab('interventions')}
              onRefresh={fetchAllState}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              policy={policy}
              onUpdatePolicy={handleUpdatePolicy}
              onTogglePauseAll={handleTogglePauseAll}
            />
          )}

          {activeTab === 'gmail' && (
            <GmailOtpView
              config={gmailConfig}
              portalEmails={portalEmails}
              onToggleEnabled={handleToggleGmail}
              onRefreshState={fetchAllState}
            />
          )}

          {activeTab === 'privacy' && (
            <PrivacyView
              auditEvents={auditEvents}
              onPurgeAccount={handlePurgeAccount}
            />
          )}
        </main>
      </div>
    </div>
  );
}
