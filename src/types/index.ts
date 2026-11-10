/**
 * ApplyPilot Core Type Definitions
 */

export type UserRole = 'student' | 'organization' | 'admin' | 'candidate';

export interface User {
  id: string;
  email: string;
  name: string;
  role?: UserRole;
  organizationName?: string;
  authProvider?: 'email' | 'google';
  timezone: string; // e.g. "Asia/Kolkata"
  createdAt: string;
}

export type FactCategory = 
  | 'personal'
  | 'experience'
  | 'education'
  | 'skill'
  | 'project'
  | 'certification'
  | 'link'
  | 'preference';

export interface CandidateFact {
  id: string;
  category: FactCategory;
  label: string;
  value: string;
  sourceResumeId?: string;
  verified: boolean;
  conflictWithId?: string;
  notes?: string;
}

export interface FactConflict {
  id: string;
  factAId: string;
  factBId: string;
  field: string;
  valueA: string;
  valueB: string;
  sourceA: string;
  sourceB: string;
  resolved: boolean;
}

export interface CandidatePreferences {
  targetRoles: string[];
  workArrangement: ('remote' | 'hybrid' | 'onsite')[];
  salaryMin: number;
  salaryCurrency: string;
  salaryPeriod: 'annual' | 'monthly';
  noticePeriodDays: number;
  availabilityDate: string;
  relocationOpen: boolean;
  workAuthorization: string; // e.g. "Citizen / Authorized without sponsorship"
}

export interface MasterProfile {
  name: string;
  email: string;
  phone: string;
  location: string;
  portfolioUrl?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  summary: string;
  preferences: CandidatePreferences;
  facts: CandidateFact[];
  conflicts: FactConflict[];
}

export interface ResumeVersion {
  id: string;
  versionNumber: number;
  title: string;
  filename: string;
  filesizeBytes: number;
  uploadDate: string;
  intendedRoles: string[];
  highlightedSkills: string[];
  extractedFactsSummary: string[];
  isDefault: boolean;
  isArchived: boolean;
  isVerified: boolean;
  rawTextPreview: string;
}

export type CampaignStatus = 'active' | 'paused' | 'archived';
export type CampaignMode = 'review' | 'automatic';

export interface Campaign {
  id: string;
  title: string;
  targetTitles: string[];
  keywordsIncluded: string[];
  keywordsExcluded: string[];
  experienceLevel: 'entry' | 'mid' | 'senior' | 'lead';
  locations: string[];
  workArrangements: string[];
  employmentTypes: string[];
  salaryMin: number;
  currency: string;
  selectedSources: string[];
  defaultResumeId: string;
  relevanceThreshold: number; // 0 - 100
  dailyLimit: number;
  todayAppliedCount: number;
  lastResetDate: string; // YYYY-MM-DD in user timezone
  priority: number;
  mode: CampaignMode;
  status: CampaignStatus;
}

export type ConnectorAccessMethod = 
  | 'authorized_api'
  | 'browser_assistance'
  | 'manual_only'
  | 'not_configured'
  | 'unsupported';

export type CapabilityType = 
  | 'public_discovery'
  | 'authorized_api'
  | 'permitted_browser_assistance'
  | 'manual_only'
  | 'not_configured'
  | 'unsupported';

export interface PlatformConnector {
  id: string;
  name: string;
  category: 'general' | 'tech_startup' | 'internship_early_career' | 'government_public' | 'remote' | 'ats_employer';
  icon: string;
  officialUrl: string;
  discoveryCapability: CapabilityType;
  submissionCapability: CapabilityType;
  supportedAccessMethod: ConnectorAccessMethod;
  requiresAuthForDiscovery: boolean;
  requiresAuthForSubmission: boolean;
  documentationNotes: string;
}

export type ConnectionStatus = 
  | 'not_connected'
  | 'connecting'
  | 'connected'
  | 'expired'
  | 'manual_only'
  | 'not_configured'
  | 'error';

export interface PlatformConnection {
  platformId: string;
  status: ConnectionStatus;
  authMethod: 'oauth' | 'isolated_browser_session' | 'manual';
  maskedAccountIdentifier?: string;
  lastSuccessfulCheck?: string;
  errorMessage?: string;
  activeSessionId?: string;
}

export interface Job {
  id: string;
  title: string;
  employer: string;
  requisitionId: string;
  sourcePlatformId: string;
  canonicalUrl: string;
  applicationDestinationUrl: string;
  fullDescription: string;
  requirements: string[];
  location: string;
  workArrangement: string;
  salaryDisplay?: string;
  postedDate?: string;
  deadlineDate?: string;
  retrievalTime: string;
  capabilityStatus: CapabilityType;
}

export interface JobMatch {
  id: string;
  jobId: string;
  campaignId: string;
  relevanceScore: number; // 0 - 100
  matchingSkills: string[];
  relevantProjects: string[];
  missingRequirements: string[];
  unknownEligibility: string[];
  scoreExplanation: string;
  deduplicationKey: string;
}

export type ApplicationStatus = 
  | 'Matched'
  | 'Drafting'
  | 'Needs Information'
  | 'Ready for Review'
  | 'Approved'
  | 'Queued'
  | 'Filling'
  | 'Waiting for Login'
  | 'Waiting for OTP'
  | 'Waiting for CAPTCHA'
  | 'User in Control'
  | 'Checking Verification'
  | 'Ready to Submit'
  | 'Submitting'
  | 'Submitted'
  | 'Submission Uncertain'
  | 'Paused'
  | 'Failed'
  | 'Skipped'
  | 'Expired';

export type QuestionClassification = 
  | 'factual'
  | 'preference'
  | 'narrative'
  | 'unknown_factual';

export interface FormAnswer {
  fieldId: string;
  fieldKey: string;
  questionText: string;
  answerValue: string;
  classification: QuestionClassification;
  provenanceFacts: string[];
  confidence: number;
  userVerified: boolean;
  validationError?: string;
}

export interface FormField {
  id: string;
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'dropdown' | 'radio' | 'checkbox' | 'date' | 'file';
  required: boolean;
  options?: string[];
  conditionalOn?: {
    fieldKey: string;
    expectedValue: string;
  };
  discovered: boolean;
}

export interface ApplicationTimelineEvent {
  time: string;
  status: ApplicationStatus;
  message: string;
  actor: 'ai' | 'user' | 'worker' | 'system';
}

export interface Application {
  id: string;
  jobId: string;
  campaignId: string;
  resumeVersionId: string;
  coverLetterText?: string;
  status: ApplicationStatus;
  mode: CampaignMode;
  answers: FormAnswer[];
  discoveredFields: FormField[];
  conditionalQuestionsDiscovered: boolean;
  requiredFieldsComplete: boolean;
  failureReason?: string;
  portalName?: string;
  portalAccountEmail?: string;
  jdKeywordsAdded?: string[];
  shortlistingScoreAfter?: number;
  submissionReceipt?: {
    timestamp: string;
    confirmationId?: string;
    isUncertain?: boolean;
    message: string;
  };
  browserSessionId?: string;
  createdAt: string;
  updatedAt: string;
  timeline: ApplicationTimelineEvent[];
}

export interface ControlLease {
  leaseId: string;
  applicationId: string;
  grantedToUserId: string;
  grantedAt: number;
  expiresAt: number;
  version: number;
}

export interface BrowserSession {
  id: string;
  applicationId: string;
  platformId: string;
  currentUrl: string;
  state: 'idle' | 'filling' | 'paused' | 'closed';
  isWorkerPaused: boolean;
  interventionReason?: 'captcha' | 'login' | 'mfa' | 'unknown_input' | 'manual_review';
  controlLease?: ControlLease;
  lastHeartbeat: number;
}

export interface GmailOtpConfig {
  enabled: boolean;
  connectedEmail?: string;
  scopesGranted: string[];
  lastCheckedAt?: string;
  allowedDomains: string[];
  smtpRelayConfigured?: boolean;
}

export interface AutomationPolicy {
  overallDailyLimit: number;
  todayAppliedTotal: number;
  timezone: string;
  pauseAll: boolean;
  reviewBeforeSubmit: boolean;
  stopOnUnknownFacts: boolean;
  stopOnCaptcha: boolean;
  stopOnNewConsent: boolean;
  stopOnExpiredLogin: boolean;
  perCompanyCap: number;
  browserWorkerUrl?: string;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  details: string;
  applicationReference?: string;
}

export interface CareerPortalAccount {
  id: string;
  platformId: string;
  portalName: string;
  portalDomain: string;
  emailUsed: string;
  authStatus: 'provisioned_verified' | 'awaiting_otp' | 'awaiting_captcha';
  createdAt: string;
  lastUsedAt: string;
  jobId?: string;
}

export interface AutoSearchRunLog {
  id: string;
  timestamp: string;
  trigger: 'hourly_schedule' | 'ten_min_audit' | 'manual_trigger';
  platformsScanned: number;
  jobsDiscovered: number;
  matchedJobs: number;
  accountsCreated: number;
  autoAppliedCount: number;
  gmailStatusesUpdated?: number;
  resumesTailoredCount?: number;
  summary: string;
}

export interface GmailApplicationStatusAudit {
  id: string;
  timestamp: string;
  employer: string;
  jobTitle: string;
  fromAddress: string;
  subject: string;
  detectedStatus: 'Application Received' | 'Shortlisted' | 'Interview Invitation' | 'OTP Verified';
  summary: string;
  applicationId?: string;
}

export interface TailoredResumeResult {
  id: string;
  baseResumeId: string;
  tailoredResumeId: string;
  jobId?: string;
  jobTitle: string;
  employer: string;
  jobDescriptionText: string;
  matchedKeywords: string[];
  missingKeywordsAdded: string[];
  tailoredSummary: string;
  tailoredBullets: string[];
  scoreBefore: number;
  scoreAfter: number;
  createdAt: string;
}

export interface HumanCentricDeliveryConfig {
  naturalTypingCadence: boolean;
  keystrokeDelayMinMs: number;
  keystrokeDelayMaxMs: number;
  deBoilerplateToneGrounding: boolean;
  atsSemanticFormatting: boolean;
  randomizedCooldownSeconds: number;
}

export interface StudentApplicationRecord {
  id: string;
  studentName: string;
  studentEmail: string;
  rollNumber: string;
  department: string;
  collegeOrOrgName: string;
  graduationYear: string;
  cgpa: string;
  targetRole: string;
  employer: string;
  portalName: string;
  matchScore: number;
  status:
    | 'Submitted'
    | 'Under Review'
    | 'Interview Scheduled'
    | 'Offer Received'
    | 'Needs Changes'
    | 'Approved by Placement';
  placementMinutes: string;
  resumeVerified: boolean;
  updatedAt: string;
  updatedBy: string;
}

export interface RegisteredUserRecord {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organizationName?: string;
  authProvider: 'email' | 'google';
  gmailOtpVerified: boolean;
  verifiedByAdmin: boolean;
  accountStatus: 'Active' | 'Pending Verification' | 'Suspended';
  portalsConnectedCount: number;
  applicationsSubmittedCount: number;
  adminNotes?: string;
  createdAt: string;
  lastActiveAt: string;
}

export interface OrganizationRecord {
  id: string;
  name: string;
  domain: string;
  coordinatorName: string;
  coordinatorEmail: string;
  contactPhone: string;
  verified: boolean;
  status: 'Verified' | 'Pending Review' | 'Needs Update';
  studentCount: number;
  activeDrivesCount: number;
  notes: string;
  updatedAt: string;
}

export interface PortalEmailNotification {
  id: string;
  timestamp: string;
  recipientEmail: string;
  senderAddress: string;
  portalId: string;
  portalName: string;
  portalUrl: string;
  subject: string;
  bodyText: string;
  category: 'Portal Account Created' | 'OTP Verification' | 'Application Receipt' | 'Interview Update';
  portalUsername: string;
  portalPasskeyOrRef: string;
  deliveryChannel: 'Gmail API / SMTP Relay' | 'Direct Portal Sync';
  status: 'Delivered & Verified' | 'Queued for SMTP';
}

export interface AutoSearchConfig {
  enabled: boolean;
  intervalMinutes: number;
  autoApplyWhenMatched: boolean;
  minRelevanceThreshold: number;
  autoCreatePortalAccountWithGmail: boolean;
  autoTailorResumeOnApply?: boolean;
  gmailAuditIntervalMinutes?: number;
  candidateGmailId: string;
  targetPortalIds: string[];
  lastRunAt?: string;
  nextRunAt?: string;
  lastGmailAuditAt?: string;
  totalDiscoveredCount: number;
  totalAutoAppliedCount: number;
  totalAccountsCreatedCount: number;
  totalGmailAuditsCount?: number;
  portalAccounts: CareerPortalAccount[];
  recentRuns: AutoSearchRunLog[];
  gmailStatusAudits?: GmailApplicationStatusAudit[];
  humanCentricDelivery?: HumanCentricDeliveryConfig;
}



