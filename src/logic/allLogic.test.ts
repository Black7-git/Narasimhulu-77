import test from 'node:test';
import assert from 'node:assert/strict';

import { resolveResumeSelection } from './resumePrecedence';
import { detectFactConflicts, doesConflictBlockApplication } from './conflictDetector';
import { checkRateLimits, getTodayDateString } from './rateLimiter';
import { generateCanonicalJobKey, checkJobDeduplication } from './deduplicator';
import { classifyAndAnswerField } from './answerClassifier';
import { ControlLeaseManager } from './controlLeaseManager.ts';
import { correlateAndExtractOtp } from './otpMatcher.ts';
import { evaluateJobFitForCampaign, ensureCareerPortalAccount } from './autoSearchEngine.ts';
import { analyzeResumeAgainstJD, tailorResumeToJobDescription } from './resumeTailor.ts';
import type { ResumeVersion, CandidateFact, Campaign, AutomationPolicy, Job, Application, MasterProfile, BrowserSession } from '../types/index.ts';

// Fixtures
const sampleResumes: ResumeVersion[] = [
  {
    id: 'res_python',
    versionNumber: 1,
    title: 'Python Backend Resume',
    filename: 'john_python_backend.pdf',
    filesizeBytes: 102400,
    uploadDate: '2026-10-01',
    intendedRoles: ['Python Developer', 'Backend Engineer'],
    highlightedSkills: ['Python', 'FastAPI', 'PostgreSQL', 'Docker'],
    extractedFactsSummary: ['5 yrs Python experience', 'B.Tech CS 2021'],
    isDefault: false,
    isArchived: false,
    isVerified: true,
    rawTextPreview: 'Senior Python Engineer with 5 years experience...',
  },
  {
    id: 'res_ai',
    versionNumber: 1,
    title: 'AI / ML Engineer Resume',
    filename: 'john_aiml_specialist.pdf',
    filesizeBytes: 110400,
    uploadDate: '2026-10-05',
    intendedRoles: ['AI/ML Engineer', 'Machine Learning Specialist'],
    highlightedSkills: ['PyTorch', 'Transformers', 'LLMs', 'Python'],
    extractedFactsSummary: ['AI Research projects', 'Model optimization'],
    isDefault: true,
    isArchived: false,
    isVerified: true,
    rawTextPreview: 'Machine Learning Engineer specializing in LLMs and fine-tuning...',
  },
  {
    id: 'res_data',
    versionNumber: 1,
    title: 'Data Analyst Resume',
    filename: 'john_data_analyst.pdf',
    filesizeBytes: 98000,
    uploadDate: '2026-10-10',
    intendedRoles: ['Data Analyst', 'BI Analyst'],
    highlightedSkills: ['SQL', 'Tableau', 'PowerBI', 'Pandas'],
    extractedFactsSummary: ['Data pipelines', 'Dashboards'],
    isDefault: false,
    isArchived: false,
    isVerified: true,
    rawTextPreview: 'Data Analyst with experience in large scale analytics...',
  },
];

const sampleProfile: MasterProfile = {
  name: 'Aarav Sharma',
  email: 'aarav.sharma@example.com',
  phone: '+91 98765 43210',
  location: 'Bengaluru, India',
  linkedinUrl: 'https://linkedin.com/in/aarav-sharma',
  githubUrl: 'https://github.com/aaravsharma',
  summary: 'Experienced Full Stack and AI Engineer',
  preferences: {
    targetRoles: ['Python Developer', 'AI/ML Engineer', 'Data Analyst'],
    workArrangement: ['remote', 'hybrid'],
    salaryMin: 2200000,
    salaryCurrency: 'INR',
    salaryPeriod: 'annual',
    noticePeriodDays: 30,
    availabilityDate: '2026-12-01',
    relocationOpen: true,
    workAuthorization: 'Indian Citizen (No Visa Sponsorship Required)',
  },
  facts: [
    {
      id: 'f1',
      category: 'education',
      label: 'Highest Degree',
      value: 'B.Tech Computer Science, IIT Madras, 2021',
      verified: true,
    },
    {
      id: 'f2',
      category: 'experience',
      label: 'Senior Software Engineer at NexusTech',
      value: 'July 2021 - Present',
      verified: true,
    },
    {
      id: 'f3',
      category: 'skill',
      label: 'Python',
      value: 'Advanced Python (FastAPI, AsyncIO, PyTorch)',
      verified: true,
    },
  ],
  conflicts: [],
};

// 1. Resume Precedence Tests
test('Resume Precedence: explicit selection overrides campaign default', () => {
  const result = resolveResumeSelection(
    'res_data',
    'res_ai',
    sampleResumes,
    'AI Engineer'
  );
  assert.equal(result.selectedResumeId, 'res_data');
  assert.equal(result.source, 'explicit');
});

test('Resume Precedence: campaign default applies when no explicit selection', () => {
  const result = resolveResumeSelection(
    undefined,
    'res_python',
    sampleResumes,
    'AI Engineer'
  );
  assert.equal(result.selectedResumeId, 'res_python');
  assert.equal(result.source, 'campaign_default');
});

test('Resume Precedence: policy match picks best role match if neither explicit nor default', () => {
  const result = resolveResumeSelection(
    undefined,
    undefined,
    sampleResumes,
    'Senior Data Analyst'
  );
  assert.equal(result.selectedResumeId, 'res_data');
  assert.equal(result.source, 'policy_match');
});

// 2. Fact Conflict Tests
test('Conflict Detector: flags mismatched education years', () => {
  const existingFacts: CandidateFact[] = [
    { id: 'f_edu', category: 'education', label: 'Highest Degree', value: 'B.Tech CS 2021', verified: true },
  ];
  const newFacts: CandidateFact[] = [
    { id: 'f_edu_new', category: 'education', label: 'Highest Degree', value: 'B.Tech CS 2018', verified: false, sourceResumeId: 'res_other' },
  ];

  const conflicts = detectFactConflicts(existingFacts, newFacts);
  assert.equal(conflicts.length, 1);
  assert.equal(conflicts[0].field, 'education: Highest Degree');
  assert.equal(conflicts[0].resolved, false);

  const blockCheck = doesConflictBlockApplication(conflicts, 'res_other');
  assert.equal(blockCheck.isBlocked, true);
});

// 3. Rate Limiter Tests
test('Rate Limiter: enforces campaign limit and timezone boundary', () => {
  const campaign: Campaign = {
    id: 'camp_1',
    title: 'Python Roles',
    targetTitles: ['Python Developer'],
    keywordsIncluded: ['python'],
    keywordsExcluded: [],
    experienceLevel: 'mid',
    locations: ['Bengaluru'],
    workArrangements: ['remote'],
    employmentTypes: ['full_time'],
    salaryMin: 2000000,
    currency: 'INR',
    selectedSources: ['naukri', 'linkedin'],
    defaultResumeId: 'res_python',
    relevanceThreshold: 75,
    dailyLimit: 5,
    todayAppliedCount: 5,
    lastResetDate: getTodayDateString('Asia/Kolkata'),
    priority: 1,
    mode: 'review',
    status: 'active',
  };

  const policy: AutomationPolicy = {
    overallDailyLimit: 25,
    todayAppliedTotal: 10,
    timezone: 'Asia/Kolkata',
    pauseAll: false,
    reviewBeforeSubmit: true,
    stopOnUnknownFacts: true,
    stopOnCaptcha: true,
    stopOnNewConsent: true,
    stopOnExpiredLogin: true,
    perCompanyCap: 2,
  };

  const check = checkRateLimits(campaign, policy, 0);
  assert.equal(check.allowed, false);
  assert.match(check.reason || '', /Campaign daily application limit reached/);
});

test('Rate Limiter: enforces per-company application cap', () => {
  const campaign: Campaign = {
    id: 'camp_1',
    title: 'Python Roles',
    targetTitles: ['Python Developer'],
    keywordsIncluded: ['python'],
    keywordsExcluded: [],
    experienceLevel: 'mid',
    locations: ['Bengaluru'],
    workArrangements: ['remote'],
    employmentTypes: ['full_time'],
    salaryMin: 2000000,
    currency: 'INR',
    selectedSources: ['naukri'],
    defaultResumeId: 'res_python',
    relevanceThreshold: 75,
    dailyLimit: 10,
    todayAppliedCount: 2,
    lastResetDate: getTodayDateString('Asia/Kolkata'),
    priority: 1,
    mode: 'review',
    status: 'active',
  };

  const policy: AutomationPolicy = {
    overallDailyLimit: 25,
    todayAppliedTotal: 2,
    timezone: 'Asia/Kolkata',
    pauseAll: false,
    reviewBeforeSubmit: true,
    stopOnUnknownFacts: true,
    stopOnCaptcha: true,
    stopOnNewConsent: true,
    stopOnExpiredLogin: true,
    perCompanyCap: 2,
  };

  const check = checkRateLimits(campaign, policy, 2); // already 2 applications for this company
  assert.equal(check.allowed, false);
  assert.match(check.reason || '', /Per-company application cap reached/);
});

// 4. Deduplication Tests
test('Deduplication: detects matching requisition ID across platforms', () => {
  const job1: Job = {
    id: 'job_1',
    title: 'Backend Engineer - Python',
    employer: 'Acme Corp',
    requisitionId: 'REQ-9901',
    sourcePlatformId: 'linkedin',
    canonicalUrl: 'https://www.linkedin.com/jobs/view/12345',
    applicationDestinationUrl: 'https://jobs.lever.co/acme/9901',
    fullDescription: 'We are hiring a Python Engineer...',
    requirements: ['Python', 'PostgreSQL'],
    location: 'Remote',
    workArrangement: 'remote',
    retrievalTime: '2026-11-08T10:00:00Z',
    capabilityStatus: 'permitted_browser_assistance',
  };

  const job2: Job = {
    id: 'job_2',
    title: 'Senior Python Developer',
    employer: 'Acme Corp',
    requisitionId: 'REQ-9901',
    sourcePlatformId: 'naukri',
    canonicalUrl: 'https://www.naukri.com/job-listings/acme-9901',
    applicationDestinationUrl: 'https://jobs.lever.co/acme/9901',
    fullDescription: 'Looking for a Senior Python Developer...',
    requirements: ['Python'],
    location: 'Remote',
    workArrangement: 'remote',
    retrievalTime: '2026-11-08T11:00:00Z',
    capabilityStatus: 'permitted_browser_assistance',
  };

  const key1 = generateCanonicalJobKey(job1);
  const key2 = generateCanonicalJobKey(job2);
  assert.equal(key1, key2);

  const existingApp: Application = {
    id: 'app_1',
    jobId: 'job_1',
    campaignId: 'camp_1',
    resumeVersionId: 'res_python',
    status: 'Submitted',
    mode: 'review',
    answers: [],
    discoveredFields: [],
    conditionalQuestionsDiscovered: true,
    requiredFieldsComplete: true,
    createdAt: '2026-11-08',
    updatedAt: '2026-11-08',
    timeline: [],
  };

  const dedup = checkJobDeduplication(job2, [existingApp], { job_1: job1 });
  assert.equal(dedup.isDuplicate, true);
});

// 5. Answer Classifier Tests
test('Answer Classifier: classifies factual and preference fields truthfully', () => {
  const emailRes = classifyAndAnswerField('Your Work Email', 'text', sampleProfile, { title: 'Python Dev', employer: 'Acme' });
  assert.equal(emailRes.classification, 'factual');
  assert.equal(emailRes.suggestedValue, 'aarav.sharma@example.com');
  assert.equal(emailRes.isUnknownFact, false);

  const salaryRes = classifyAndAnswerField('Expected Annual CTC / Salary', 'text', sampleProfile, { title: 'Python Dev', employer: 'Acme' });
  assert.equal(salaryRes.classification, 'preference');
  assert.match(salaryRes.suggestedValue, /2,200,000/);
});

test('Answer Classifier: rejects unknown factual attributes and flags them to prevent fabrication', () => {
  const clearanceRes = classifyAndAnswerField('Security Clearance Level', 'text', sampleProfile, { title: 'Python Dev', employer: 'Acme' });
  assert.equal(clearanceRes.classification, 'unknown_factual');
  assert.equal(clearanceRes.isUnknownFact, true);
  assert.equal(clearanceRes.suggestedValue, '');
  assert.ok(clearanceRes.missingFactPrompt);
});

// 6. Control Lease Manager Tests
test('Control Lease: exclusive human lease blocks overlapping claims', () => {
  const manager = new ControlLeaseManager();
  const session: BrowserSession = {
    id: 'sess_1',
    applicationId: 'app_1',
    platformId: 'test_employer',
    currentUrl: 'http://localhost:3000/test-employer',
    state: 'filling',
    isWorkerPaused: false,
    lastHeartbeat: Date.now(),
  };

  const acquire1 = manager.acquireLease(session, 'user_1');
  assert.equal(acquire1.success, true);
  assert.ok(acquire1.lease);
  assert.equal(session.isWorkerPaused, true);

  // Another user tries to take over
  const acquire2 = manager.acquireLease(session, 'user_2');
  assert.equal(acquire2.success, false);
  assert.match(acquire2.reason || '', /leased exclusively/);

  // Validate event access
  const valid = manager.validateEventAccess(session.id, 'user_1', acquire1.lease.leaseId, acquire1.lease.version);
  assert.equal(valid.valid, true);

  // Release lease
  const release = manager.releaseLease(session.id, 'user_1');
  assert.equal(release.released, true);
});

// 7. OTP Matcher Tests
test('OTP Matcher: successfully extracts code and correlates expected domain', () => {
  const now = Date.now();
  const emailMsg = {
    id: 'msg_1',
    sender: 'security@auth.greenhouse.io',
    recipient: 'aarav.sharma@example.com',
    subject: 'Your Greenhouse verification code',
    bodyText: 'Hello Aarav, your verification code is 849201. This code expires in 10 minutes.',
    receivedAt: now - 30000, // 30s ago
  };

  const res = correlateAndExtractOtp(
    emailMsg,
    {
      expectedServiceDomain: 'greenhouse.io',
      requestedAt: now - 60000,
      userEmail: 'aarav.sharma@example.com',
    },
    now
  );

  assert.equal(res.matched, true);
  assert.equal(res.code, '849201');
  // Strict check: zero secret logging in message
  assert.ok(!res.sanitizedLogMessage.includes('849201'));
});

test('OTP Matcher: strictly rejects password reset emails', () => {
  const now = Date.now();
  const emailMsg = {
    id: 'msg_2',
    sender: 'security@greenhouse.io',
    recipient: 'aarav.sharma@example.com',
    subject: 'Reset your password code',
    bodyText: 'Someone requested to reset your password. Use code: 112233.',
    receivedAt: now - 30000,
  };

  const res = correlateAndExtractOtp(
    emailMsg,
    {
      expectedServiceDomain: 'greenhouse.io',
      requestedAt: now - 60000,
      userEmail: 'aarav.sharma@example.com',
    },
    now
  );

  assert.equal(res.matched, false);
  assert.match(res.rejectionReason || '', /password reset/i);
});

// 8. Hourly Career Portal Auto-Search & Auto-Account Provisioning Tests
test('Auto-Search Engine: evaluates job fit accurately against active campaign criteria', () => {
  const campaign: Campaign = {
    id: 'camp_py',
    title: 'Python Backend Roles',
    targetTitles: ['Python Developer', 'Backend Engineer'],
    keywordsIncluded: ['python', 'fastapi', 'postgresql'],
    keywordsExcluded: ['wordpress'],
    experienceLevel: 'mid',
    locations: ['Bengaluru', 'Remote'],
    workArrangements: ['remote', 'hybrid'],
    employmentTypes: ['full_time'],
    salaryMin: 2200000,
    currency: 'INR',
    selectedSources: ['greenhouse', 'workday'],
    defaultResumeId: 'res_python',
    relevanceThreshold: 75,
    dailyLimit: 8,
    todayAppliedCount: 1,
    lastResetDate: '2026-11-09',
    priority: 1,
    mode: 'automatic',
    status: 'active',
  };

  const job: Job = {
    id: 'job_stripe_1',
    title: 'Senior Python Backend Engineer',
    employer: 'Stripe India',
    requisitionId: 'CP-9110',
    sourcePlatformId: 'greenhouse',
    canonicalUrl: 'https://boards.greenhouse.io/stripeindia/jobs/CP-9110',
    applicationDestinationUrl: 'https://boards.greenhouse.io/stripeindia/jobs/CP-9110/apply',
    fullDescription: 'Scale distributed Python and FastAPI microservices backed by PostgreSQL.',
    requirements: ['Python 3.11+', 'FastAPI', 'PostgreSQL'],
    location: 'Bengaluru, India',
    workArrangement: 'hybrid',
    retrievalTime: '2026-11-09T10:00:00Z',
    capabilityStatus: 'permitted_browser_assistance',
  };

  const fit = evaluateJobFitForCampaign(job, campaign, sampleProfile, 75);
  assert.equal(fit.isFit, true);
  assert.ok(fit.relevanceScore >= 85);
  assert.ok(fit.matchingSkills.length >= 2);
});

test('Auto-Search Engine: automatically provisions career portal account using same Gmail ID when no account exists', () => {
  const workdayConnector = {
    id: 'workday',
    name: 'Workday Career Portals',
    category: 'ats_employer' as const,
    icon: 'Building2',
    officialUrl: 'https://myworkdayjobs.com',
    discoveryCapability: 'permitted_browser_assistance' as const,
    submissionCapability: 'permitted_browser_assistance' as const,
    supportedAccessMethod: 'browser_assistance' as const,
    requiresAuthForDiscovery: false,
    requiresAuthForSubmission: true,
    documentationNotes: 'Employer-hosted Workday portals.',
  };

  const result = ensureCareerPortalAccount({
    platformConnector: workdayConnector,
    currentConnection: {
      platformId: 'workday',
      status: 'not_connected',
      authMethod: 'isolated_browser_session',
    },
    existingPortalAccounts: [],
    candidateGmailId: 'narasimhulu0707@gmail.com',
    autoCreateWithGmail: true,
    employerName: 'Krutrim Cloud AI',
    jobId: 'job_krutrim_1',
  });

  assert.equal(result.accountCreated, true);
  assert.equal(result.canProceedWithAutoApply, true);
  assert.ok(result.portalAccount);
  assert.equal(result.portalAccount?.emailUsed, 'narasimhulu0707@gmail.com');
  assert.equal(result.portalAccount?.authStatus, 'provisioned_verified');
  assert.equal(result.updatedConnection?.status, 'connected');
});

test('JD Resume Tailor: detects missing keywords from JD and tailors resume to increase shortlisting probability', () => {
  const baseResume = sampleResumes[0]; // Python, FastAPI, PostgreSQL, Docker
  const jdText =
    'We need a Staff Python Backend Engineer with hands-on Kubernetes, Redis, Kafka, and Distributed Systems experience to scale our microservices.';
  const requirements = ['Python', 'FastAPI', 'Kubernetes', 'Redis', 'Kafka', 'Distributed Systems'];

  const analysis = analyzeResumeAgainstJD(
    baseResume,
    'Staff Python Backend Engineer',
    jdText,
    requirements
  );

  assert.ok(analysis.matchedKeywords.includes('Python'));
  assert.ok(analysis.missingKeywords.includes('Kubernetes'));
  assert.ok(analysis.missingKeywords.includes('Redis'));
  assert.ok(analysis.projectedScoreAfter > analysis.scoreBefore);

  const tailored = tailorResumeToJobDescription({
    baseResume,
    masterProfile: sampleProfile,
    jobId: 'job_test_tailor',
    jobTitle: 'Staff Python Backend Engineer',
    employer: 'Stripe India',
    jobDescriptionText: jdText,
    requirements,
    nextVersionNumber: 4,
  });

  assert.ok(tailored.tailoredResume.highlightedSkills.includes('Kubernetes'));
  assert.ok(tailored.tailoredResume.highlightedSkills.includes('Redis'));
  assert.ok(tailored.tailoringResult.scoreAfter >= 93);
  assert.ok(tailored.tailoringResult.scoreAfter > tailored.tailoringResult.scoreBefore);
});
