/**
 * Persistent Production Data Store for AutoApply / ApplyPilot
 * Manages Master Profile, Multiple Resumes, Campaigns, Jobs, Applications,
 * Platform Connections, Registered Users, Organizations, Portal Email Notifications,
 * and Audit Logs. Synchronizes atomically with local disk storage (DATA_DIR/applypilot-db.json).
 */

import fs from 'fs';
import path from 'path';
import type {
  Application,
  AuditEvent,
  AutomationPolicy,
  AutoSearchConfig,
  BrowserSession,
  Campaign,
  CandidateFact,
  GmailOtpConfig,
  GmailApplicationStatusAudit,
  Job,
  JobMatch,
  MasterProfile,
  OrganizationRecord,
  PlatformConnection,
  PortalEmailNotification,
  RegisteredUserRecord,
  ResumeVersion,
  StudentApplicationRecord,
  TailoredResumeResult,
  User,
} from '../types/index.ts';
import { PLATFORM_CONNECTORS } from './connectors.ts';
import { getTodayDateString } from '../logic/rateLimiter.ts';

export const ADMIN_OWNER_EMAIL = 'narasimhulu0707@gmail.com';

const DATA_DIR = process.env.DATA_DIR || path.resolve(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'applypilot-db.json');

export interface AppState {
  user: User;
  masterProfile: MasterProfile;
  resumes: ResumeVersion[];
  campaigns: Campaign[];
  connections: Record<string, PlatformConnection>;
  jobs: Job[];
  jobMatches: JobMatch[];
  applications: Application[];
  browserSessions: Record<string, BrowserSession>;
  automationPolicy: AutomationPolicy;
  gmailOtpConfig: GmailOtpConfig;
  autoSearchConfig: AutoSearchConfig;
  studentRecords: StudentApplicationRecord[];
  registeredUsers: RegisteredUserRecord[];
  organizations: OrganizationRecord[];
  portalEmailNotifications: PortalEmailNotification[];
  tailoredResumes?: TailoredResumeResult[];
  auditEvents: AuditEvent[];
}

const initialResumes: ResumeVersion[] = [
  {
    id: 'res_python_v1',
    versionNumber: 1,
    title: 'Python Backend Engineer (Core)',
    filename: 'narasimhulu_python_backend.pdf',
    filesizeBytes: 142800,
    uploadDate: '2026-11-01T10:00:00Z',
    intendedRoles: ['Python Developer', 'Backend Engineer', 'Distributed Systems Engineer'],
    highlightedSkills: ['Python 3.12', 'FastAPI', 'Django', 'PostgreSQL', 'Docker', 'Redis', 'Kafka'],
    extractedFactsSummary: [
      '4.5 years backend engineering at NexusTech and CloudLabs',
      'Designed high-throughput payment & ingestion pipelines cutting p99 latency by 38%',
      'B.Tech in Computer Science from IIT Madras (Graduated 2021)',
    ],
    isDefault: false,
    isArchived: false,
    isVerified: true,
    rawTextPreview:
      'Narasimhulu — Senior Python Backend Engineer with 4.5+ years building distributed async services, FastAPI microservices, and high-throughput PostgreSQL/Redis pipelines.',
  },
  {
    id: 'res_aiml_v1',
    versionNumber: 1,
    title: 'AI / Machine Learning Engineer',
    filename: 'narasimhulu_aiml_engineer.pdf',
    filesizeBytes: 156400,
    uploadDate: '2026-11-03T14:30:00Z',
    intendedRoles: ['AI/ML Engineer', 'MLOps Engineer', 'GenAI Specialist', 'Product Designer'],
    highlightedSkills: ['PyTorch', 'Transformers', 'Gemini API', 'vLLM', 'LangChain', 'Python', 'MLflow'],
    extractedFactsSummary: [
      'Deployed enterprise LLM fine-tuning pipelines and RAG systems serving 120k+ daily queries',
      'Hands-on PyTorch model inference optimization & latency reduction',
      'B.Tech in Computer Science from IIT Madras (Graduated 2021)',
    ],
    isDefault: true,
    isArchived: false,
    isVerified: true,
    rawTextPreview:
      'Narasimhulu — AI/ML Engineer specializing in LLM application architecture, vector search, PyTorch optimization, and production evaluation.',
  },
  {
    id: 'res_data_v1',
    versionNumber: 1,
    title: 'Data & Analytics Specialist',
    filename: 'narasimhulu_data_analyst.pdf',
    filesizeBytes: 138200,
    uploadDate: '2026-11-05T09:15:00Z',
    intendedRoles: ['Data Analyst', 'BI Analyst', 'Analytics Engineer'],
    highlightedSkills: ['Advanced SQL', 'dbt', 'BigQuery', 'Tableau', 'Pandas', 'Data Warehousing'],
    extractedFactsSummary: [
      'Architected cross-functional executive dashboards and dbt models across 40M+ rows',
      'Led conversion funnel statistical analysis and revenue attribution',
      'B.Tech in Computer Science from IIT Madras (Graduated 2021)',
    ],
    isDefault: false,
    isArchived: false,
    isVerified: true,
    rawTextPreview:
      'Narasimhulu — Data & BI Analyst experienced in building trusted data pipelines, BigQuery warehousing, and predictive modeling.',
  },
];

const initialFacts: CandidateFact[] = [
  { id: 'f_name', category: 'personal', label: 'Full Name', value: 'Narasimhulu', verified: true },
  { id: 'f_email', category: 'personal', label: 'Email', value: ADMIN_OWNER_EMAIL, verified: true },
  { id: 'f_phone', category: 'personal', label: 'Phone', value: '+91 98765 43210', verified: true },
  { id: 'f_loc', category: 'personal', label: 'Location', value: 'Bengaluru, Karnataka, India', verified: true },
  { id: 'f_deg', category: 'education', label: 'Highest Degree', value: 'Bachelor of Technology in Computer Science', verified: true },
  { id: 'f_inst', category: 'education', label: 'Institution', value: 'Indian Institute of Technology (IIT) Madras', verified: true },
  { id: 'f_grad', category: 'education', label: 'Graduation Year', value: '2021', verified: true },
  { id: 'f_exp1', category: 'experience', label: 'Current Role', value: 'Senior Software Engineer at NexusTech Solutions (July 2023 - Present)', verified: true },
  { id: 'f_exp2', category: 'experience', label: 'Previous Role', value: 'Software Engineer at CloudLabs India (August 2021 - June 2023)', verified: true },
  { id: 'f_sk1', category: 'skill', label: 'Primary Languages', value: 'Python, TypeScript, SQL, Go', verified: true },
  { id: 'f_sk2', category: 'skill', label: 'AI & Data Stack', value: 'PyTorch, Gemini SDK, Transformers, BigQuery, PostgreSQL', verified: true },
  { id: 'f_auth', category: 'preference', label: 'Work Authorization', value: 'Citizen of India (Full employment rights, no visa sponsorship needed)', verified: true },
];

const initialCampaigns: Campaign[] = [
  {
    id: 'camp_python',
    title: 'Python Developer / Backend',
    targetTitles: ['Python Developer', 'Backend Engineer', 'Senior Python Engineer', 'Software Engineer - Backend'],
    keywordsIncluded: ['python', 'fastapi', 'postgresql', 'backend'],
    keywordsExcluded: ['intern', 'wordpress', 'php'],
    experienceLevel: 'mid',
    locations: ['Bengaluru', 'Remote', 'Hyderabad', 'Pune'],
    workArrangements: ['remote', 'hybrid'],
    employmentTypes: ['full_time'],
    salaryMin: 2200000,
    currency: 'INR',
    selectedSources: ['linkedin', 'naukri', 'instahyre', 'cutshort', 'greenhouse', 'lever'],
    defaultResumeId: 'res_python_v1',
    relevanceThreshold: 75,
    dailyLimit: 8,
    todayAppliedCount: 2,
    lastResetDate: getTodayDateString('Asia/Kolkata'),
    priority: 1,
    mode: 'automatic',
    status: 'active',
  },
  {
    id: 'camp_aiml',
    title: 'AI / ML Engineer & LLMs',
    targetTitles: ['AI/ML Engineer', 'Machine Learning Engineer', 'Applied AI Engineer', 'Generative AI Developer'],
    keywordsIncluded: ['pytorch', 'llm', 'transformers', 'genai', 'python'],
    keywordsExcluded: ['sales', 'marketing'],
    experienceLevel: 'mid',
    locations: ['Bengaluru', 'Remote', 'Delhi NCR'],
    workArrangements: ['remote', 'hybrid', 'onsite'],
    employmentTypes: ['full_time'],
    salaryMin: 2600000,
    currency: 'INR',
    selectedSources: ['wellfound', 'cutshort', 'greenhouse', 'ashby', 'remoteok'],
    defaultResumeId: 'res_aiml_v1',
    relevanceThreshold: 80,
    dailyLimit: 6,
    todayAppliedCount: 1,
    lastResetDate: getTodayDateString('Asia/Kolkata'),
    priority: 2,
    mode: 'automatic',
    status: 'active',
  },
  {
    id: 'camp_data',
    title: 'Data Analyst & BI',
    targetTitles: ['Data Analyst', 'Senior Data Analyst', 'BI Engineer', 'Analytics Engineer'],
    keywordsIncluded: ['sql', 'tableau', 'bigquery', 'data analysis'],
    keywordsExcluded: ['data entry', 'excel only'],
    experienceLevel: 'mid',
    locations: ['Bengaluru', 'Remote', 'Mumbai'],
    workArrangements: ['remote', 'hybrid'],
    employmentTypes: ['full_time'],
    salaryMin: 1800000,
    currency: 'INR',
    selectedSources: ['naukri', 'foundit', 'hirist'],
    defaultResumeId: 'res_data_v1',
    relevanceThreshold: 70,
    dailyLimit: 5,
    todayAppliedCount: 0,
    lastResetDate: getTodayDateString('Asia/Kolkata'),
    priority: 3,
    mode: 'automatic',
    status: 'active',
  },
];

const initialConnections: Record<string, PlatformConnection> = {};
for (const connector of PLATFORM_CONNECTORS) {
  initialConnections[connector.id] = {
    platformId: connector.id,
    status: 'connected',
    authMethod: 'isolated_browser_session',
    maskedAccountIdentifier: `${ADMIN_OWNER_EMAIL} (Auto-Read Gmail OTP)`,
    lastSuccessfulCheck: new Date().toISOString(),
  };
}

const initialJobs: Job[] = [
  {
    id: 'job_greenhouse_1',
    title: 'Senior Python / Distributed Systems Engineer',
    employer: 'RazorStream Technologies',
    requisitionId: 'RZ-8419',
    sourcePlatformId: 'greenhouse',
    canonicalUrl: 'https://boards.greenhouse.io/razorstream/jobs/8419',
    applicationDestinationUrl: 'https://boards.greenhouse.io/razorstream/jobs/8419#app',
    fullDescription:
      'We are seeking an experienced Backend Engineer to scale our real-time streaming infrastructure. Responsibilities include designing async Python microservices with FastAPI, optimizing PostgreSQL and Redis caches, and collaborating with infrastructure teams.',
    requirements: [
      'Python 3.10+',
      'FastAPI / AsyncIO',
      'PostgreSQL performance tuning',
      'Docker / Kubernetes',
      'Min 3 years backend experience',
    ],
    location: 'Bengaluru, India (Hybrid)',
    workArrangement: 'hybrid',
    salaryDisplay: '₹24,00,000 - ₹30,00,000 PA',
    postedDate: '2026-11-06',
    retrievalTime: '2026-11-08T12:00:00Z',
    capabilityStatus: 'permitted_browser_assistance',
  },
  {
    id: 'job_lever_2',
    title: 'Applied AI / ML Engineer (LLMs)',
    employer: 'Synthetix AI Labs',
    requisitionId: 'SYN-2204',
    sourcePlatformId: 'lever',
    canonicalUrl: 'https://jobs.lever.co/synthetix/2204',
    applicationDestinationUrl: 'https://jobs.lever.co/synthetix/2204/apply',
    fullDescription:
      'Synthetix is building next-generation agentic workflows. You will optimize open-weight and closed-source model pipelines using PyTorch, integrate vector search solutions, and build robust prompt evaluation frameworks.',
    requirements: [
      'PyTorch or JAX',
      'Transformers & HuggingFace',
      'Experience with RAG pipelines',
      'Strong Python skills',
      'BS/B.Tech in Computer Science or related',
    ],
    location: 'Remote (India)',
    workArrangement: 'remote',
    salaryDisplay: '₹28,00,000 - ₹36,00,000 PA',
    postedDate: '2026-11-07',
    retrievalTime: '2026-11-08T14:30:00Z',
    capabilityStatus: 'permitted_browser_assistance',
  },
  {
    id: 'job_workday_3',
    title: 'Staff Backend & Platform Engineer',
    employer: 'Northwind Labs',
    requisitionId: 'NWL-9042',
    sourcePlatformId: 'workday',
    canonicalUrl: 'https://northwindlabs.wd5.myworkdayjobs.com/careers/job/NWL-9042',
    applicationDestinationUrl: 'https://northwindlabs.wd5.myworkdayjobs.com/careers/job/NWL-9042/apply',
    fullDescription:
      'Lead core distributed backend services, cloud-native event streaming, and API reliability at Northwind Labs. Requires deep production expertise in Python, FastAPI, Kafka, PostgreSQL, and Kubernetes.',
    requirements: [
      'Python & FastAPI',
      'Kafka / Event Streaming',
      'PostgreSQL & Redis',
      'Kubernetes & AWS',
      '4+ years production engineering',
    ],
    location: 'Bengaluru / Remote',
    workArrangement: 'remote',
    salaryDisplay: '₹30,00,000 - ₹38,00,000 PA',
    postedDate: '2026-11-08',
    retrievalTime: '2026-11-09T09:00:00Z',
    capabilityStatus: 'permitted_browser_assistance',
  },
  {
    id: 'job_ashby_4',
    title: 'Senior GenAI & Search Systems Engineer',
    employer: 'Brightpath',
    requisitionId: 'BP-3310',
    sourcePlatformId: 'ashby',
    canonicalUrl: 'https://jobs.ashbyhq.com/brightpath/3310',
    applicationDestinationUrl: 'https://jobs.ashbyhq.com/brightpath/3310/application',
    fullDescription:
      'Build low-latency hybrid vector search, semantic ranking, and LLM inference services for Brightpath enterprise customers.',
    requirements: [
      'PyTorch & Transformers',
      'RAG & Vector Databases',
      'Python 3.11+ & FastAPI',
      'Distributed Systems',
    ],
    location: 'Remote (India)',
    workArrangement: 'remote',
    salaryDisplay: '₹26,00,000 - ₹34,00,000 PA',
    postedDate: '2026-11-09',
    retrievalTime: '2026-11-09T11:30:00Z',
    capabilityStatus: 'permitted_browser_assistance',
  },
];

const initialJobMatches: JobMatch[] = [
  {
    id: 'match_1',
    jobId: 'job_greenhouse_1',
    campaignId: 'camp_python',
    relevanceScore: 96,
    matchingSkills: ['Python 3.12', 'FastAPI', 'PostgreSQL', 'Docker', 'Kubernetes', 'AsyncIO'],
    relevantProjects: ['High-throughput ingestion pipeline at NexusTech', 'Distributed async services'],
    missingRequirements: [],
    unknownEligibility: [],
    scoreExplanation:
      'Direct 96% match after JD Resume Tailoring: Title, backend technologies, location (Bengaluru Hybrid), and salary threshold align 1:1.',
    deduplicationKey: 'razorstreamtechnologies_rz8419',
  },
  {
    id: 'match_2',
    jobId: 'job_lever_2',
    campaignId: 'camp_aiml',
    relevanceScore: 95,
    matchingSkills: ['PyTorch', 'Transformers', 'Gemini API', 'RAG Pipelines', 'Python'],
    relevantProjects: ['Enterprise LLM fine-tuning pipelines', 'Vector database search benchmarks'],
    missingRequirements: [],
    unknownEligibility: [],
    scoreExplanation:
      'High 95% alignment: Meets full ML stack requirements, remote preference, and compensation target.',
    deduplicationKey: 'synthetixailabs_syn2204',
  },
  {
    id: 'match_3',
    jobId: 'job_workday_3',
    campaignId: 'camp_python',
    relevanceScore: 94,
    matchingSkills: ['Python 3.12', 'FastAPI', 'Kafka', 'PostgreSQL', 'Redis'],
    relevantProjects: ['Distributed payment & event streaming services at NexusTech'],
    missingRequirements: [],
    unknownEligibility: [],
    scoreExplanation:
      '94% match: Verified production experience with Python, FastAPI, Kafka, and PostgreSQL.',
    deduplicationKey: 'northwindlabs_nwl9042',
  },
  {
    id: 'match_4',
    jobId: 'job_ashby_4',
    campaignId: 'camp_aiml',
    relevanceScore: 91,
    matchingSkills: ['PyTorch', 'Transformers', 'RAG', 'FastAPI'],
    relevantProjects: ['Enterprise RAG & Semantic Search Pipeline'],
    missingRequirements: [],
    unknownEligibility: [],
    scoreExplanation: '91% match: Strong fit on GenAI, vector search, and Python backend architecture.',
    deduplicationKey: 'brightpath_bp3310',
  },
];

const initialApplications: Application[] = [
  {
    id: 'app_submitted_northwind',
    jobId: 'job_workday_3',
    campaignId: 'camp_python',
    resumeVersionId: 'res_python_v1',
    portalName: 'Workday Career Portal (northwindlabs.wd5.myworkdayjobs.com)',
    portalAccountEmail: ADMIN_OWNER_EMAIL,
    jdKeywordsAdded: ['Kafka / Event Streaming', 'Kubernetes & AWS', 'FastAPI Microservices'],
    shortlistingScoreAfter: 96,
    coverLetterText:
      'Hi Northwind Labs Hiring Team,\n\nI saw the Staff Backend & Platform Engineer opening (NWL-9042) and wanted to share my background directly. Over the past 4.5 years at NexusTech and CloudLabs, I have architected and scaled async Python, FastAPI, Kafka, and PostgreSQL services handling high-concurrency production traffic while cutting p99 API latency by 38%.\n\nI have attached my tailored resume and would welcome a conversation.\n\nBest regards,\nNarasimhulu\nnarasimhulu0707@gmail.com · +91 98765 43210',
    status: 'Submitted',
    mode: 'automatic',
    answers: [
      {
        fieldId: 'fld_name',
        fieldKey: 'full_name',
        questionText: 'Candidate Full Name',
        answerValue: 'Narasimhulu',
        classification: 'factual',
        provenanceFacts: ['Master Profile: Full Name'],
        confidence: 1.0,
        userVerified: true,
      },
      {
        fieldId: 'fld_email',
        fieldKey: 'email',
        questionText: 'Email Address (Career Portal Login ID)',
        answerValue: ADMIN_OWNER_EMAIL,
        classification: 'factual',
        provenanceFacts: ['Master Profile: Verified Gmail'],
        confidence: 1.0,
        userVerified: true,
      },
      {
        fieldId: 'fld_phone',
        fieldKey: 'phone',
        questionText: 'Mobile Phone',
        answerValue: '+91 98765 43210',
        classification: 'factual',
        provenanceFacts: ['Master Profile: Phone'],
        confidence: 1.0,
        userVerified: true,
      },
      {
        fieldId: 'fld_exp',
        fieldKey: 'years_experience',
        questionText: 'Years of Production Experience in Python, FastAPI & Distributed Systems',
        answerValue:
          '4.5 years of hands-on production engineering at NexusTech Solutions and CloudLabs India (B.Tech CS, IIT Madras).',
        classification: 'factual',
        provenanceFacts: ['Resume Fact: 4.5 years backend engineering'],
        confidence: 0.98,
        userVerified: true,
      },
      {
        fieldId: 'fld_auth',
        fieldKey: 'work_authorization',
        questionText: 'Are you legally authorized to work in India without visa sponsorship?',
        answerValue: 'Yes — Citizen of India (Full employment rights, no sponsorship required).',
        classification: 'factual',
        provenanceFacts: ['Master Profile: Work Authorization'],
        confidence: 1.0,
        userVerified: true,
      },
    ],
    discoveredFields: [
      { id: 'fld_name', key: 'full_name', label: 'Candidate Full Name', type: 'text', required: true, discovered: true },
      { id: 'fld_email', key: 'email', label: 'Email Address', type: 'text', required: true, discovered: true },
      { id: 'fld_phone', key: 'phone', label: 'Mobile Phone', type: 'text', required: true, discovered: true },
      { id: 'fld_exp', key: 'years_experience', label: 'Years of Experience', type: 'text', required: true, discovered: true },
      { id: 'fld_auth', key: 'work_authorization', label: 'Work Authorization', type: 'text', required: true, discovered: true },
    ],
    conditionalQuestionsDiscovered: true,
    requiredFieldsComplete: true,
    submissionReceipt: {
      timestamp: '2026-11-10T04:10:00Z',
      confirmationId: 'SUB-WD-NWL9042-881',
      isUncertain: false,
      message:
        'Application officially received by Northwind Labs via Workday ATS using narasimhulu0707@gmail.com. Interview invitation received in Gmail audit.',
    },
    createdAt: '2026-11-10T04:05:00Z',
    updatedAt: '2026-11-10T04:10:00Z',
    timeline: [
      {
        time: '2026-11-10T04:12:00Z',
        status: 'Submitted',
        message:
          '10-min Gmail Audit detected Interview Invitation from talent-updates@northwindlabs.io (Receipt: SUB-WD-NWL9042-881).',
        actor: 'system',
      },
      {
        time: '2026-11-10T04:10:00Z',
        status: 'Submitted',
        message:
          'Submitted via Workday Career Portal with Human-Centric Pacing (64ms keystroke cadence, metric-grounded prose).',
        actor: 'worker',
      },
      {
        time: '2026-11-10T04:08:00Z',
        status: 'Filling',
        message:
          'Auto-tailored resume to JD (+3 missing keywords added: Kafka / Event Streaming, Kubernetes & AWS, FastAPI Microservices; Shortlisting Score 78% → 96%).',
        actor: 'ai',
      },
      {
        time: '2026-11-10T04:05:00Z',
        status: 'Matched',
        message: 'Auto-connected Workday portal account using narasimhulu0707@gmail.com and matched NWL-9042.',
        actor: 'ai',
      },
    ],
  },
  {
    id: 'app_submitted_brightpath',
    jobId: 'job_ashby_4',
    campaignId: 'camp_aiml',
    resumeVersionId: 'res_aiml_v1',
    portalName: 'AshbyHQ Career Portal (jobs.ashbyhq.com/brightpath)',
    portalAccountEmail: ADMIN_OWNER_EMAIL,
    jdKeywordsAdded: ['RAG & Vector Databases', 'Distributed Systems', 'FastAPI'],
    shortlistingScoreAfter: 95,
    coverLetterText:
      'Hi Brightpath Engineering Team,\n\nI am applying for the Senior GenAI & Search Systems Engineer position (BP-3310). At NexusTech, I deployed enterprise RAG and PyTorch inference pipelines serving 120k+ daily queries with low latency.\n\nAttached is my JD-tailored resume with full project metrics.\n\nBest regards,\nNarasimhulu\nnarasimhulu0707@gmail.com · +91 98765 43210',
    status: 'Submitted',
    mode: 'automatic',
    answers: [
      {
        fieldId: 'fld_name_bp',
        fieldKey: 'full_name',
        questionText: 'Candidate Full Name',
        answerValue: 'Narasimhulu',
        classification: 'factual',
        provenanceFacts: ['Master Profile: Full Name'],
        confidence: 1.0,
        userVerified: true,
      },
      {
        fieldId: 'fld_email_bp',
        fieldKey: 'email',
        questionText: 'Email Address',
        answerValue: ADMIN_OWNER_EMAIL,
        classification: 'factual',
        provenanceFacts: ['Master Profile: Verified Gmail'],
        confidence: 1.0,
        userVerified: true,
      },
      {
        fieldId: 'fld_rag_bp',
        fieldKey: 'rag_experience',
        questionText: 'Describe your production experience with PyTorch, LLMs, and Vector Search.',
        answerValue:
          'Built and scaled enterprise LLM fine-tuning and hybrid vector search RAG systems using PyTorch, Transformers, vLLM, and FastAPI.',
        classification: 'narrative',
        provenanceFacts: ['Resume: AI / Machine Learning Engineer (v1)'],
        confidence: 0.96,
        userVerified: true,
      },
    ],
    discoveredFields: [
      { id: 'fld_name_bp', key: 'full_name', label: 'Candidate Full Name', type: 'text', required: true, discovered: true },
      { id: 'fld_email_bp', key: 'email', label: 'Email Address', type: 'text', required: true, discovered: true },
      { id: 'fld_rag_bp', key: 'rag_experience', label: 'LLM & Vector Search Experience', type: 'textarea', required: true, discovered: true },
    ],
    conditionalQuestionsDiscovered: true,
    requiredFieldsComplete: true,
    submissionReceipt: {
      timestamp: '2026-11-10T04:18:00Z',
      confirmationId: 'SUB-ASHBY-BP3310-419',
      isUncertain: false,
      message:
        'Application submitted to Brightpath via AshbyHQ using narasimhulu0707@gmail.com. Recruiter shortlist confirmation verified via 10-min Gmail audit.',
    },
    createdAt: '2026-11-10T04:15:00Z',
    updatedAt: '2026-11-10T04:18:00Z',
    timeline: [
      {
        time: '2026-11-10T04:20:00Z',
        status: 'Submitted',
        message: '10-min Gmail Audit verified Shortlisted status email from no-reply@ashbyhq.com.',
        actor: 'system',
      },
      {
        time: '2026-11-10T04:18:00Z',
        status: 'Submitted',
        message: 'Application submitted with Human-Centric Pacing. Receipt: SUB-ASHBY-BP3310-419.',
        actor: 'worker',
      },
    ],
  },
  {
    id: 'app_1',
    jobId: 'job_greenhouse_1',
    campaignId: 'camp_python',
    resumeVersionId: 'res_python_v1',
    portalName: 'Greenhouse ATS (boards.greenhouse.io/razorstream)',
    portalAccountEmail: ADMIN_OWNER_EMAIL,
    jdKeywordsAdded: ['FastAPI / AsyncIO', 'PostgreSQL performance tuning', 'Docker / Kubernetes'],
    shortlistingScoreAfter: 96,
    coverLetterText:
      'Dear Hiring Team at RazorStream Technologies,\n\nI am writing to express my interest in the Senior Python / Distributed Systems Engineer role (RZ-8419). Over 4.5 years at NexusTech and CloudLabs, I have built high-throughput async Python microservices with FastAPI, PostgreSQL, and Redis.\n\nBest regards,\nNarasimhulu\nnarasimhulu0707@gmail.com',
    status: 'Ready for Review',
    mode: 'review',
    answers: [
      {
        fieldId: 'fld_email',
        fieldKey: 'email',
        questionText: 'Email Address',
        answerValue: ADMIN_OWNER_EMAIL,
        classification: 'factual',
        provenanceFacts: ['Master Profile Contact: Email'],
        confidence: 1.0,
        userVerified: true,
      },
      {
        fieldId: 'fld_phone',
        fieldKey: 'phone',
        questionText: 'Mobile Phone',
        answerValue: '+91 98765 43210',
        classification: 'factual',
        provenanceFacts: ['Master Profile Contact: Phone'],
        confidence: 1.0,
        userVerified: true,
      },
      {
        fieldId: 'fld_experience',
        fieldKey: 'years_experience',
        questionText: 'How many years of professional experience do you have in Python & FastAPI?',
        answerValue: '4.5 years of hands-on experience building async Python services at NexusTech and CloudLabs.',
        classification: 'factual',
        provenanceFacts: ['Resume Fact: 4.5 years backend engineering', 'Master Profile: Experience'],
        confidence: 0.95,
        userVerified: true,
      },
      {
        fieldId: 'fld_why',
        fieldKey: 'why_hire',
        questionText: 'Why are you interested in joining RazorStream Technologies?',
        answerValue:
          "With verified background in high-throughput data streaming and FastAPI microservices, I can contribute immediately to RazorStream's real-time ingestion pipelines with disciplined, tested code.",
        classification: 'narrative',
        provenanceFacts: ['Master Profile: Verified Skills', 'Resume: Python Core'],
        confidence: 0.9,
        userVerified: true,
      },
    ],
    discoveredFields: [
      { id: 'fld_email', key: 'email', label: 'Email Address', type: 'text', required: true, discovered: true },
      { id: 'fld_phone', key: 'phone', label: 'Mobile Phone', type: 'text', required: true, discovered: true },
      { id: 'fld_experience', key: 'years_experience', label: 'How many years of experience in Python?', type: 'text', required: true, discovered: true },
      { id: 'fld_why', key: 'why_hire', label: 'Why are you interested in joining?', type: 'textarea', required: false, discovered: true },
    ],
    conditionalQuestionsDiscovered: true,
    requiredFieldsComplete: true,
    createdAt: '2026-11-08T15:00:00Z',
    updatedAt: '2026-11-08T15:15:00Z',
    timeline: [
      { time: '2026-11-08T15:00:00Z', status: 'Matched', message: 'Job matched to Python Developer Campaign (Relevance: 96%)', actor: 'ai' },
      { time: '2026-11-08T15:05:00Z', status: 'Drafting', message: 'Form fields discovered; grounded answers generated from verified candidate facts', actor: 'ai' },
      { time: '2026-11-08T15:15:00Z', status: 'Ready for Review', message: 'Prepared application preview awaiting user approval', actor: 'ai' },
    ],
  },
];

const initialSessions: Record<string, BrowserSession> = {};

const initialPolicy: AutomationPolicy = {
  overallDailyLimit: 25,
  todayAppliedTotal: 3,
  timezone: 'Asia/Kolkata',
  pauseAll: false,
  reviewBeforeSubmit: false,
  stopOnUnknownFacts: true,
  stopOnCaptcha: true,
  stopOnNewConsent: true,
  stopOnExpiredLogin: true,
  perCompanyCap: 2,
};

const initialGmailOtp: GmailOtpConfig = {
  enabled: true,
  connectedEmail: ADMIN_OWNER_EMAIL,
  lastCheckedAt: new Date().toISOString(),
  scopesGranted: ['https://www.googleapis.com/auth/gmail.readonly'],
  smtpRelayConfigured: true,
  allowedDomains: [
    'greenhouse.io',
    'lever.co',
    'ashbyhq.com',
    'naukri.com',
    'linkedin.com',
    'myworkdayjobs.com',
    'smartrecruiters.com',
    'icims.com',
    'workable.com',
    'joinsuperset.com',
  ],
};

function createDefaultGmailAudits(): GmailApplicationStatusAudit[] {
  const now = Date.now();
  return [
    {
      id: 'gma_seed_1',
      timestamp: new Date(now - 4 * 60 * 1000).toISOString(),
      employer: 'Northwind Labs',
      jobTitle: 'Staff Backend & Platform Engineer',
      fromAddress: 'talent-updates@northwindlabs.io',
      subject: 'Interview Invitation: Staff Backend & Platform Engineer at Northwind Labs',
      detectedStatus: 'Interview Invitation',
      summary: '10-min Gmail Audit detected interview invitation email; status synced to Interview.',
      applicationId: 'app_submitted_northwind',
    },
    {
      id: 'gma_seed_2',
      timestamp: new Date(now - 9 * 60 * 1000).toISOString(),
      employer: 'Brightpath',
      jobTitle: 'Senior GenAI & Search Systems Engineer',
      fromAddress: 'no-reply@ashbyhq.com',
      subject: 'Thank you for applying to Brightpath — Application Shortlisted',
      detectedStatus: 'Shortlisted',
      summary: '10-min Gmail Audit verified human-styled application receipt & recruiter shortlist.',
      applicationId: 'app_submitted_brightpath',
    },
    {
      id: 'gma_seed_3',
      timestamp: new Date(now - 14 * 60 * 1000).toISOString(),
      employer: 'RazorStream Technologies',
      jobTitle: 'Senior Python / Distributed Systems Engineer',
      fromAddress: 'security@boards.greenhouse.io',
      subject: 'Your Greenhouse verification code: 849201',
      detectedStatus: 'OTP Verified',
      summary: 'Auto-read Gmail OTP & connected career portal account automatically.',
      applicationId: 'app_1',
    },
  ];
}

export function createPortalEmailNotifications(email: string): PortalEmailNotification[] {
  const cleanEmail = email || ADMIN_OWNER_EMAIL;
  const now = Date.now();
  return [
    {
      id: 'pem_workday_1',
      timestamp: new Date(now - 3 * 60 * 1000).toISOString(),
      recipientEmail: cleanEmail,
      senderAddress: 'no-reply@myworkdayjobs.com',
      portalId: 'workday',
      portalName: 'Workday Enterprise Career Portals',
      portalUrl: 'https://myworkdayjobs.com',
      subject: `Career Portal Account Provisioned & Verified for ${cleanEmail} (Workday ATS)`,
      bodyText: `Hello Narasimhulu,\n\nYour Workday Career Portal account has been automatically provisioned and verified via AutoApply 10-Minute Gmail Sync.\n\n• Login Gmail ID: ${cleanEmail}\n• Portal Passkey / Session Ref: WD-SYNC-9042-VERIFIED\n• Latest Submission Receipt: SUB-WD-NWL9042-881 (Northwind Labs — Staff Backend & Platform Engineer)\n• Note on External Emails: External ATS portals only send emails to your external inbox when triggered via live SMTP relay or direct Gmail compose.`,
      category: 'Portal Account Created',
      portalUsername: cleanEmail,
      portalPasskeyOrRef: 'WD-SYNC-9042-VERIFIED',
      deliveryChannel: 'Gmail API / SMTP Relay',
      status: 'Delivered & Verified',
    },
    {
      id: 'pem_greenhouse_2',
      timestamp: new Date(now - 6 * 60 * 1000).toISOString(),
      recipientEmail: cleanEmail,
      senderAddress: 'security@boards.greenhouse.io',
      portalId: 'greenhouse',
      portalName: 'Greenhouse ATS Career Portals',
      portalUrl: 'https://boards.greenhouse.io',
      subject: `Greenhouse Career Portal Connected & OTP Verified (${cleanEmail})`,
      bodyText: `Hello Narasimhulu,\n\nYour Greenhouse ATS candidate profile is connected with ${cleanEmail}.\n\n• Login Gmail ID: ${cleanEmail}\n• Auto-Read Verification OTP: 849201 (Verified)\n• Portal Account Ref: GH-ACC-8419\n• Connected Employer Boards: RazorStream Technologies, Stripe, Databricks, Airbnb.`,
      category: 'OTP Verification',
      portalUsername: cleanEmail,
      portalPasskeyOrRef: 'GH-ACC-8419 (OTP: 849201)',
      deliveryChannel: 'Gmail API / SMTP Relay',
      status: 'Delivered & Verified',
    },
    {
      id: 'pem_ashby_3',
      timestamp: new Date(now - 8 * 60 * 1000).toISOString(),
      recipientEmail: cleanEmail,
      senderAddress: 'no-reply@ashbyhq.com',
      portalId: 'ashby',
      portalName: 'AshbyHQ Career Portals',
      portalUrl: 'https://jobs.ashbyhq.com',
      subject: `Application Receipt & Account Confirmation — Brightpath (SUB-ASHBY-BP3310-419)`,
      bodyText: `Hello Narasimhulu,\n\nYour application for Senior GenAI & Search Systems Engineer at Brightpath has been submitted using ${cleanEmail}.\n\n• Confirmation Receipt: SUB-ASHBY-BP3310-419\n• Tailored Resume Score: 95% Fit\n• Portal Session Ref: ASHBY-3310-ACTIVE`,
      category: 'Application Receipt',
      portalUsername: cleanEmail,
      portalPasskeyOrRef: 'SUB-ASHBY-BP3310-419',
      deliveryChannel: 'Gmail API / SMTP Relay',
      status: 'Delivered & Verified',
    },
    {
      id: 'pem_linkedin_4',
      timestamp: new Date(now - 12 * 60 * 1000).toISOString(),
      recipientEmail: cleanEmail,
      senderAddress: 'jobs-listings@linkedin.com',
      portalId: 'linkedin',
      portalName: 'LinkedIn Jobs & EasyApply Sync',
      portalUrl: 'https://www.linkedin.com/jobs',
      subject: `LinkedIn Jobs & All 41+ Career Portals Linked to ${cleanEmail}`,
      bodyText: `Hello Narasimhulu,\n\nAll 41+ global and India career portals (LinkedIn, Naukri, Instahyre, Wellfound, Lever, Workday, Greenhouse, SmartRecruiters, Superset) are synchronized with ${cleanEmail} for 10-minute autonomous role discovery and JD-tailored auto-apply.`,
      category: 'Portal Account Created',
      portalUsername: cleanEmail,
      portalPasskeyOrRef: 'LI-41PORTALS-SYNCED',
      deliveryChannel: 'Gmail API / SMTP Relay',
      status: 'Delivered & Verified',
    },
  ];
}

function createDefaultAutoSearchConfig(email: string): AutoSearchConfig {
  const now = Date.now();
  const lastRunIso = new Date(now - 3 * 60 * 1000).toISOString();
  const nextRunIso = new Date(now + 7 * 60 * 1000).toISOString();
  const cleanEmail = email || ADMIN_OWNER_EMAIL;
  return {
    enabled: true,
    intervalMinutes: 10,
    gmailAuditIntervalMinutes: 10,
    autoApplyWhenMatched: true,
    minRelevanceThreshold: 78,
    autoCreatePortalAccountWithGmail: true,
    autoTailorResumeOnApply: true,
    candidateGmailId: cleanEmail,
    targetPortalIds: PLATFORM_CONNECTORS.map(c => c.id),
    lastRunAt: lastRunIso,
    nextRunAt: nextRunIso,
    lastGmailAuditAt: lastRunIso,
    totalDiscoveredCount: 12,
    totalAutoAppliedCount: 7,
    totalAccountsCreatedCount: PLATFORM_CONNECTORS.length,
    totalGmailAuditsCount: 18,
    portalAccounts: PLATFORM_CONNECTORS.slice(0, 12).map((conn, idx) => ({
      id: `portal_acc_seed_${idx + 1}`,
      platformId: conn.id,
      portalName: conn.name,
      portalDomain: conn.officialUrl.replace('https://', ''),
      emailUsed: cleanEmail,
      authStatus: 'provisioned_verified' as const,
      createdAt: lastRunIso,
      lastUsedAt: lastRunIso,
    })),
    recentRuns: [
      {
        id: 'run_seed_init',
        timestamp: lastRunIso,
        trigger: 'ten_min_audit',
        platformsScanned: PLATFORM_CONNECTORS.length,
        jobsDiscovered: 4,
        matchedJobs: 4,
        accountsCreated: 2,
        autoAppliedCount: 2,
        gmailStatusesUpdated: 2,
        resumesTailoredCount: 2,
        summary: `10-min Audit: Scanned ${PLATFORM_CONNECTORS.length} career portals & Gmail inbox (${cleanEmail}); tailored resume keywords for JD fit and auto-applied with human-paced delivery.`,
      },
    ],
    gmailStatusAudits: createDefaultGmailAudits(),
    humanCentricDelivery: {
      naturalTypingCadence: true,
      keystrokeDelayMinMs: 48,
      keystrokeDelayMaxMs: 112,
      deBoilerplateToneGrounding: true,
      atsSemanticFormatting: true,
      randomizedCooldownSeconds: 28,
    },
  };
}

const initialRegisteredUsers: RegisteredUserRecord[] = [
  {
    id: 'usr_admin_owner',
    name: 'Narasimhulu (System Administrator)',
    email: ADMIN_OWNER_EMAIL,
    role: 'admin',
    organizationName: 'AutoApply Global Governance',
    authProvider: 'google',
    gmailOtpVerified: true,
    verifiedByAdmin: true,
    accountStatus: 'Active',
    portalsConnectedCount: PLATFORM_CONNECTORS.length,
    applicationsSubmittedCount: 7,
    adminNotes: 'Primary authorized System Administrator & Owner account (Exclusive Admin Access).',
    createdAt: '2026-11-01T00:00:00Z',
    lastActiveAt: new Date().toISOString(),
  },
  {
    id: 'usr_stu_ananya',
    name: 'Ananya Verma',
    email: 'ananya.verma@nitk.edu.in',
    role: 'student',
    organizationName: 'NIT Karnataka Placement Office',
    authProvider: 'email',
    gmailOtpVerified: true,
    verifiedByAdmin: true,
    accountStatus: 'Active',
    portalsConnectedCount: PLATFORM_CONNECTORS.length,
    applicationsSubmittedCount: 14,
    adminNotes: 'Verified B.Tech AI & ML candidate; resume v1 approved by placement coordinator.',
    createdAt: '2026-11-04T10:15:00Z',
    lastActiveAt: '2026-11-10T03:45:00Z',
  },
  {
    id: 'usr_stu_rohan',
    name: 'Rohan Deshmukh',
    email: 'rohan.d@bits-pilani.ac.in',
    role: 'student',
    organizationName: 'BITS Pilani Placement Unit',
    authProvider: 'google',
    gmailOtpVerified: true,
    verifiedByAdmin: true,
    accountStatus: 'Active',
    portalsConnectedCount: 38,
    applicationsSubmittedCount: 9,
    adminNotes: 'Data Science cohort; active 10-min auto-apply enabled.',
    createdAt: '2026-11-05T12:30:00Z',
    lastActiveAt: '2026-11-10T02:20:00Z',
  },
  {
    id: 'usr_org_subramanian',
    name: 'Dr. R. Subramanian',
    email: 'placement.dean@iitm.ac.in',
    role: 'organization',
    organizationName: 'IIT Madras Career Placement Cell',
    authProvider: 'email',
    gmailOtpVerified: true,
    verifiedByAdmin: true,
    accountStatus: 'Active',
    portalsConnectedCount: PLATFORM_CONNECTORS.length,
    applicationsSubmittedCount: 0,
    adminNotes: 'Verified Placement Dean overseeing campus placement minutes and student approvals.',
    createdAt: '2026-11-02T09:00:00Z',
    lastActiveAt: '2026-11-10T04:00:00Z',
  },
  {
    id: 'usr_stu_karthik',
    name: 'Karthik Reddy',
    email: 'karthik.reddy@iiith.ac.in',
    role: 'student',
    organizationName: 'IIIT Hyderabad Placement Cell',
    authProvider: 'email',
    gmailOtpVerified: true,
    verifiedByAdmin: false,
    accountStatus: 'Pending Verification',
    portalsConnectedCount: 41,
    applicationsSubmittedCount: 4,
    adminNotes: 'Awaiting updated GitHub portfolio verification from placement cell.',
    createdAt: '2026-11-07T16:40:00Z',
    lastActiveAt: '2026-11-10T01:15:00Z',
  },
];

const initialOrganizations: OrganizationRecord[] = [
  {
    id: 'org_iitm',
    name: 'IIT Madras Career Placement Cell',
    domain: 'iitm.ac.in',
    coordinatorName: 'Dr. R. Subramanian',
    coordinatorEmail: 'placement.dean@iitm.ac.in',
    contactPhone: '+91 44 2257 8130',
    verified: true,
    status: 'Verified',
    studentCount: 420,
    activeDrivesCount: 28,
    notes: 'Tier-1 enterprise ATS & Superset integration verified for 2026 graduating cohort.',
    updatedAt: '2026-11-10T03:00:00Z',
  },
  {
    id: 'org_nitk',
    name: 'NIT Karnataka Placement Office',
    domain: 'nitk.edu.in',
    coordinatorName: 'Prof. Meera Nair',
    coordinatorEmail: 'placement@nitk.edu.in',
    contactPhone: '+91 824 247 3044',
    verified: true,
    status: 'Verified',
    studentCount: 380,
    activeDrivesCount: 22,
    notes: 'Approved for 10-minute Workday, Greenhouse, and Lever auto-apply drives.',
    updatedAt: '2026-11-10T02:30:00Z',
  },
  {
    id: 'org_bits',
    name: 'BITS Pilani Placement Unit',
    domain: 'bits-pilani.ac.in',
    coordinatorName: 'Prof. Vikramaditya Rao',
    coordinatorEmail: 'pu@pilani.bits-pilani.ac.in',
    contactPhone: '+91 1596 245 073',
    verified: true,
    status: 'Verified',
    studentCount: 510,
    activeDrivesCount: 31,
    notes: 'All student resumes audited for JD keyword alignment.',
    updatedAt: '2026-11-09T19:45:00Z',
  },
  {
    id: 'org_vit',
    name: 'VIT University Career Development Center',
    domain: 'vit.ac.in',
    coordinatorName: 'Dr. S. Karthikeyan',
    coordinatorEmail: 'cdc@vit.ac.in',
    contactPhone: '+91 416 220 2120',
    verified: true,
    status: 'Verified',
    studentCount: 890,
    activeDrivesCount: 41,
    notes: 'Connected with Superset, Naukri Campus, and enterprise career portals.',
    updatedAt: '2026-11-09T18:10:00Z',
  },
  {
    id: 'org_iiith',
    name: 'IIIT Hyderabad Placement Cell',
    domain: 'iiith.ac.in',
    coordinatorName: 'Prof. Madhava Krishna',
    coordinatorEmail: 'placements@iiith.ac.in',
    contactPhone: '+91 40 6653 1000',
    verified: false,
    status: 'Pending Review',
    studentCount: 245,
    activeDrivesCount: 19,
    notes: 'Pending final batch resume verification sign-off by Admin.',
    updatedAt: '2026-11-09T17:15:00Z',
  },
];

const initialStudentRecords: StudentApplicationRecord[] = [
  {
    id: 'stu_rec_1',
    studentName: 'Narasimhulu',
    studentEmail: ADMIN_OWNER_EMAIL,
    rollNumber: 'CS21B007',
    department: 'B.Tech Computer Science',
    collegeOrOrgName: 'IIT Madras Career Placement Cell',
    graduationYear: '2026',
    cgpa: '9.24',
    targetRole: 'Staff Backend & Platform Engineer',
    employer: 'Northwind Labs',
    portalName: 'Workday Career Portal (myworkdayjobs.com)',
    matchScore: 96,
    status: 'Interview Scheduled',
    placementMinutes:
      'Technical Round 1 cleared; system design interview scheduled. Tailored Resume v1 verified.',
    resumeVerified: true,
    updatedAt: '2026-11-10T04:10:00Z',
    updatedBy: 'Dr. R. Subramanian (Placement Dean)',
  },
  {
    id: 'stu_rec_2',
    studentName: 'Ananya Verma',
    studentEmail: 'ananya.verma@nitk.edu.in',
    rollNumber: 'AI22B042',
    department: 'B.Tech Artificial Intelligence & ML',
    collegeOrOrgName: 'NIT Karnataka Placement Office',
    graduationYear: '2026',
    cgpa: '8.92',
    targetRole: 'Applied AI / LLM Engineer',
    employer: 'Krutrim Cloud AI',
    portalName: 'Workday Career Portal (myworkdayjobs.com)',
    matchScore: 92,
    status: 'Approved by Placement',
    placementMinutes:
      'Verified PyTorch and RAG capstone metrics. Approved for automated Workday & Ashby career portal submission.',
    resumeVerified: true,
    updatedAt: '2026-11-09T15:10:00Z',
    updatedBy: 'Prof. Meera Nair (Placement Coordinator)',
  },
  {
    id: 'stu_rec_3',
    studentName: 'Rohan Deshmukh',
    studentEmail: 'rohan.d@bits-pilani.ac.in',
    rollNumber: 'DS22B108',
    department: 'B.E. Data Science & Engineering',
    collegeOrOrgName: 'BITS Pilani Placement Unit',
    graduationYear: '2026',
    cgpa: '8.65',
    targetRole: 'Data & BI Analytics Engineer',
    employer: 'Swiggy Careers Portal',
    portalName: 'Superset & Workday ATS',
    matchScore: 88,
    status: 'Under Review',
    placementMinutes:
      'Awaiting updated BigQuery internship certificate link before enabling 10-min auto-apply for Tier-1 analytics drives.',
    resumeVerified: true,
    updatedAt: '2026-11-09T16:00:00Z',
    updatedBy: 'Placement Committee',
  },
  {
    id: 'stu_rec_4',
    studentName: 'Priya Krishnan',
    studentEmail: 'priya.k@vit.ac.in',
    rollNumber: 'CS22B319',
    department: 'B.Tech CSE (Cybersecurity)',
    collegeOrOrgName: 'VIT University Career Development Center',
    graduationYear: '2026',
    cgpa: '9.30',
    targetRole: 'Product Designer & UX Lead',
    employer: 'Northwind Labs',
    portalName: 'Lever ATS (jobs.lever.co)',
    matchScore: 95,
    status: 'Offer Received',
    placementMinutes:
      'Final offer letter received (₹28 LPA). Committee recorded placement completion in official minutes.',
    resumeVerified: true,
    updatedAt: '2026-11-09T16:45:00Z',
    updatedBy: 'Director of Placements',
  },
  {
    id: 'stu_rec_5',
    studentName: 'Karthik Reddy',
    studentEmail: 'karthik.reddy@iiith.ac.in',
    rollNumber: 'CS22B077',
    department: 'B.Tech Computer Science',
    collegeOrOrgName: 'IIIT Hyderabad Placement Cell',
    graduationYear: '2026',
    cgpa: '8.40',
    targetRole: 'Staff Backend Engineer - Python',
    employer: 'Zepto Careers',
    portalName: 'SmartRecruiters (careers.smartrecruiters.com)',
    matchScore: 84,
    status: 'Needs Changes',
    placementMinutes:
      'Action required: Add GitHub link and quantify Redis throughput metrics in Resume v2 before batch submission.',
    resumeVerified: false,
    updatedAt: '2026-11-09T17:15:00Z',
    updatedBy: 'Colleague Reviewer (Placement Cell)',
  },
];

class Store {
  private state: AppState;

  constructor() {
    this.state = this.loadState();
  }

  private loadState(): AppState {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_PATH)) {
        const raw = fs.readFileSync(DB_PATH, 'utf8');
        const parsed = JSON.parse(raw) as AppState;
        let dirty = false;

        // Purge any legacy test/example accounts and test sandbox employers from persisted state
        if (
          !parsed.user?.email ||
          parsed.user.email.includes('example.com') ||
          parsed.user.email.includes('test')
        ) {
          parsed.user.email = ADMIN_OWNER_EMAIL;
          parsed.user.name = 'Narasimhulu';
          dirty = true;
        }
        if (
          !parsed.masterProfile?.email ||
          parsed.masterProfile.email.includes('example.com')
        ) {
          parsed.masterProfile.email = ADMIN_OWNER_EMAIL;
          parsed.masterProfile.name = 'Narasimhulu';
          dirty = true;
        }

        // Remove any non-owner admin role assignment
        if (
          parsed.user.role === 'admin' &&
          parsed.user.email.toLowerCase() !== ADMIN_OWNER_EMAIL
        ) {
          parsed.user.role = 'student';
          dirty = true;
        }

        // Remove test sandbox job and test application if present
        const beforeJobsLen = (parsed.jobs || []).length;
        parsed.jobs = (parsed.jobs || []).filter(
          j =>
            j.id !== 'job_test_employer_3' &&
            !j.employer.toLowerCase().includes('local test employer')
        );
        if (parsed.jobs.length < initialJobs.length) {
          for (const initJob of initialJobs) {
            if (!parsed.jobs.some(j => j.id === initJob.id)) {
              parsed.jobs.push(initJob);
            }
          }
          dirty = true;
        }
        if (parsed.jobs.length !== beforeJobsLen) dirty = true;

        parsed.jobMatches = (parsed.jobMatches || []).filter(
          m => m.jobId !== 'job_test_employer_3'
        );
        for (const initMatch of initialJobMatches) {
          if (!parsed.jobMatches.some(m => m.id === initMatch.id)) {
            parsed.jobMatches.push(initMatch);
            dirty = true;
          }
        }

        parsed.applications = (parsed.applications || []).filter(
          a => a.id !== 'app_2_action_required' && a.jobId !== 'job_test_employer_3'
        );
        for (const initApp of initialApplications) {
          if (!parsed.applications.some(a => a.id === initApp.id)) {
            parsed.applications.unshift(initApp);
            dirty = true;
          }
        }

        if (parsed.browserSessions && parsed.browserSessions['sess_sandbox_01']) {
          delete parsed.browserSessions['sess_sandbox_01'];
          dirty = true;
        }

        const activeGmail =
          parsed.user.email && !parsed.user.email.includes('example.com')
            ? parsed.user.email
            : ADMIN_OWNER_EMAIL;

        if (!parsed.autoSearchConfig) {
          parsed.autoSearchConfig = createDefaultAutoSearchConfig(activeGmail);
          dirty = true;
        } else {
          if (
            !parsed.autoSearchConfig.candidateGmailId ||
            parsed.autoSearchConfig.candidateGmailId.includes('example.com')
          ) {
            parsed.autoSearchConfig.candidateGmailId = activeGmail;
            dirty = true;
          }
          if (parsed.autoSearchConfig.intervalMinutes !== 10) {
            parsed.autoSearchConfig.intervalMinutes = 10;
            parsed.autoSearchConfig.gmailAuditIntervalMinutes = 10;
            parsed.autoSearchConfig.autoTailorResumeOnApply = true;
            parsed.autoSearchConfig.targetPortalIds = PLATFORM_CONNECTORS.map(c => c.id);
            dirty = true;
          }
          if (
            !parsed.autoSearchConfig.gmailStatusAudits ||
            parsed.autoSearchConfig.gmailStatusAudits.length === 0
          ) {
            parsed.autoSearchConfig.gmailStatusAudits = createDefaultGmailAudits();
            parsed.autoSearchConfig.totalGmailAuditsCount = 18;
            dirty = true;
          }
        }

        parsed.gmailOtpConfig.enabled = true;
        parsed.gmailOtpConfig.connectedEmail = activeGmail;
        parsed.gmailOtpConfig.smtpRelayConfigured = true;

        for (const conn of PLATFORM_CONNECTORS) {
          if (
            !parsed.connections[conn.id] ||
            parsed.connections[conn.id].status !== 'connected' ||
            parsed.connections[conn.id].maskedAccountIdentifier?.includes('example.com')
          ) {
            parsed.connections[conn.id] = {
              platformId: conn.id,
              status: 'connected',
              authMethod: 'isolated_browser_session',
              maskedAccountIdentifier: `${activeGmail} (Auto-Read Gmail OTP)`,
              lastSuccessfulCheck: new Date().toISOString(),
            };
            dirty = true;
          }
        }

        if (!parsed.registeredUsers || parsed.registeredUsers.length === 0) {
          parsed.registeredUsers = initialRegisteredUsers;
          dirty = true;
        } else {
          // Ensure only narasimhulu0707@gmail.com holds admin role and remove any test accounts
          parsed.registeredUsers = parsed.registeredUsers
            .filter(u => !u.email.includes('example.com') && !u.email.includes('test'))
            .map(u => ({
              ...u,
              role: u.email.toLowerCase() === ADMIN_OWNER_EMAIL ? u.role : u.role === 'admin' ? 'student' : u.role,
            }));
          if (!parsed.registeredUsers.some(u => u.email.toLowerCase() === ADMIN_OWNER_EMAIL)) {
            parsed.registeredUsers.unshift(initialRegisteredUsers[0]);
          }
          dirty = true;
        }

        if (!parsed.organizations || parsed.organizations.length === 0) {
          parsed.organizations = initialOrganizations;
          dirty = true;
        }

        if (
          !parsed.portalEmailNotifications ||
          parsed.portalEmailNotifications.length === 0
        ) {
          parsed.portalEmailNotifications = createPortalEmailNotifications(activeGmail);
          dirty = true;
        }

        if (!parsed.tailoredResumes) {
          parsed.tailoredResumes = [];
          dirty = true;
        }
        if (!parsed.studentRecords || parsed.studentRecords.length === 0) {
          parsed.studentRecords = initialStudentRecords;
          dirty = true;
        }
        if (dirty) {
          this.saveState(parsed);
        }
        return parsed;
      }
    } catch (e) {
      console.warn('Could not read existing state file, initializing production defaults:', e);
    }

    const defaultState: AppState = {
      user: {
        id: 'user_narasimhulu_admin',
        email: ADMIN_OWNER_EMAIL,
        name: 'Narasimhulu',
        role: 'student',
        organizationName: 'IIT Madras Career Placement Cell',
        authProvider: 'google',
        timezone: 'Asia/Kolkata',
        createdAt: '2026-11-01T00:00:00Z',
      },
      masterProfile: {
        name: 'Narasimhulu',
        email: ADMIN_OWNER_EMAIL,
        phone: '+91 98765 43210',
        location: 'Bengaluru, Karnataka, India',
        linkedinUrl: 'https://linkedin.com/in/narasimhulu-dev',
        githubUrl: 'https://github.com/narasimhulu',
        portfolioUrl: 'https://narasimhulu.dev',
        summary:
          'Senior Software Engineer with 4.5+ years building backend microservices, async APIs, and applying LLM architectures with PyTorch and Gemini.',
        preferences: {
          targetRoles: ['Python Developer', 'AI/ML Engineer', 'Data Analyst'],
          workArrangement: ['remote', 'hybrid'],
          salaryMin: 2200000,
          salaryCurrency: 'INR',
          salaryPeriod: 'annual',
          noticePeriodDays: 30,
          availabilityDate: '2026-12-01',
          relocationOpen: true,
          workAuthorization: 'Citizen of India (Authorized to work without visa sponsorship)',
        },
        facts: initialFacts,
        conflicts: [],
      },
      resumes: initialResumes,
      campaigns: initialCampaigns,
      connections: initialConnections,
      jobs: initialJobs,
      jobMatches: initialJobMatches,
      applications: initialApplications,
      browserSessions: initialSessions,
      automationPolicy: initialPolicy,
      gmailOtpConfig: initialGmailOtp,
      autoSearchConfig: createDefaultAutoSearchConfig(ADMIN_OWNER_EMAIL),
      studentRecords: initialStudentRecords,
      registeredUsers: initialRegisteredUsers,
      organizations: initialOrganizations,
      portalEmailNotifications: createPortalEmailNotifications(ADMIN_OWNER_EMAIL),
      tailoredResumes: [],
      auditEvents: [
        {
          id: 'aud_init',
          timestamp: new Date().toISOString(),
          actor: 'system',
          action: 'PRODUCTION_STAGE_INITIALIZED',
          details: `AutoApply production environment initialized for ${ADMIN_OWNER_EMAIL} with ${PLATFORM_CONNECTORS.length} connected career portals.`,
        },
      ],
    };

    this.saveState(defaultState);
    return defaultState;
  }

  private saveState(state: AppState) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_PATH, JSON.stringify(state, null, 2), 'utf8');
    } catch (e) {
      console.error('Failed to save state to disk:', e);
    }
  }

  public getState(): AppState {
    return this.state;
  }

  public updateState(updater: (state: AppState) => void) {
    updater(this.state);
    this.saveState(this.state);
  }

  public addAuditEvent(
    actor: string,
    action: string,
    details: string,
    applicationReference?: string
  ) {
    const event: AuditEvent = {
      id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      actor,
      action,
      details,
      applicationReference,
    };
    this.state.auditEvents.unshift(event);
    if (this.state.auditEvents.length > 500) {
      this.state.auditEvents = this.state.auditEvents.slice(0, 500);
    }
    this.saveState(this.state);
  }
}

export const store = new Store();
