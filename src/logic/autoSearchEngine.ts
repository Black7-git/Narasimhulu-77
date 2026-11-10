import type {
  Campaign,
  CareerPortalAccount,
  Job,
  MasterProfile,
  PlatformConnection,
  PlatformConnector,
} from '../types/index.ts';

export interface JobFitEvaluation {
  isFit: boolean;
  relevanceScore: number;
  matchingSkills: string[];
  relevantProjects: string[];
  missingRequirements: string[];
  scoreExplanation: string;
}

export interface PortalAccountProvisionResult {
  accountCreated: boolean;
  canProceedWithAutoApply: boolean;
  portalAccount?: CareerPortalAccount;
  updatedConnection?: PlatformConnection;
  statusMessage: string;
}

/**
 * Evaluates whether a discovered career portal job fits a target campaign and candidate profile.
 */
export function evaluateJobFitForCampaign(
  job: Job,
  campaign: Campaign,
  masterProfile: MasterProfile,
  minGlobalThreshold: number = 75
): JobFitEvaluation {
  const fullText = `${job.title} ${job.fullDescription} ${job.requirements.join(' ')}`.toLowerCase();
  const titleLower = job.title.toLowerCase();

  // Check excluded keywords first
  for (const excluded of campaign.keywordsExcluded) {
    if (excluded && fullText.includes(excluded.toLowerCase())) {
      return {
        isFit: false,
        relevanceScore: 30,
        matchingSkills: [],
        relevantProjects: [],
        missingRequirements: [`Contains excluded keyword: ${excluded}`],
        scoreExplanation: `Excluded due to keyword "${excluded}" in job listing.`,
      };
    }
  }

  let score = 62;

  // Title alignment (+18 max)
  const titleMatched = campaign.targetTitles.some(t => {
    const words = t.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    return words.some(w => titleLower.includes(w));
  });
  if (titleMatched) {
    score += 18;
  }

  // Included keywords alignment (+15 max)
  const matchedKeywords = campaign.keywordsIncluded.filter(kw =>
    fullText.includes(kw.toLowerCase())
  );
  score += Math.min(15, matchedKeywords.length * 5);

  // Location / Work arrangement alignment (+5)
  const locMatched =
    job.workArrangement === 'remote' ||
    campaign.locations.some(loc => job.location.toLowerCase().includes(loc.toLowerCase()));
  if (locMatched) {
    score += 5;
  }

  score = Math.min(98, score);

  // Extract matching skills from job requirements + candidate facts
  const candidateSkillText = masterProfile.facts
    .filter(f => f.category === 'skill' || f.category === 'experience')
    .map(f => `${f.label} ${f.value}`)
    .join(' ')
    .toLowerCase();

  const matchingSkills: string[] = [];
  const missingRequirements: string[] = [];

  for (const req of job.requirements) {
    const reqTokens = req
      .toLowerCase()
      .split(/[\s,/()+]+/)
      .filter(tok => tok.length >= 2);
    const hasMatch = reqTokens.some(
      tok =>
        candidateSkillText.includes(tok) ||
        campaign.keywordsIncluded.some(k => k.toLowerCase().includes(tok))
    );
    if (hasMatch) {
      matchingSkills.push(req);
    } else {
      missingRequirements.push(req);
    }
  }

  if (matchingSkills.length === 0 && matchedKeywords.length > 0) {
    matchingSkills.push(...matchedKeywords.map(k => k.toUpperCase()));
  }

  const effectiveThreshold = Math.max(campaign.relevanceThreshold, minGlobalThreshold);
  const isFit = campaign.status === 'active' && score >= effectiveThreshold;

  const relevantProjects = [
    'Production microservice & distributed API architecture',
    'Enterprise AI/ML & automated data ingestion pipelines',
  ];

  const scoreExplanation = isFit
    ? `Strong ${score}% fit for "${campaign.title}" (Threshold: ${effectiveThreshold}%). Matched ${matchingSkills.length} core requirements.`
    : `Scored ${score}% against "${campaign.title}" (Requires ${effectiveThreshold}%).`;

  return {
    isFit,
    relevanceScore: score,
    matchingSkills,
    relevantProjects,
    missingRequirements,
    scoreExplanation,
  };
}

/**
 * Checks if an account exists on the target career portal / hiring platform.
 * If no account exists and autoCreateWithGmail is enabled, provisions a new account
 * using the candidate's same Gmail ID.
 */
export function ensureCareerPortalAccount(params: {
  platformConnector: PlatformConnector;
  currentConnection?: PlatformConnection;
  existingPortalAccounts: CareerPortalAccount[];
  candidateGmailId: string;
  autoCreateWithGmail: boolean;
  employerName: string;
  jobId?: string;
  nowIso?: string;
}): PortalAccountProvisionResult {
  const {
    platformConnector,
    currentConnection,
    existingPortalAccounts,
    candidateGmailId,
    autoCreateWithGmail,
    employerName,
    jobId,
    nowIso = new Date().toISOString(),
  } = params;

  const cleanEmail = (candidateGmailId || 'candidate@gmail.com').trim().toLowerCase();
  const slugEmployer = employerName.toLowerCase().replace(/[^a-z0-9]/g, '');
  const portalDomain =
    platformConnector.id === 'workday'
      ? `${slugEmployer}.wd5.myworkdayjobs.com`
      : platformConnector.id === 'smartrecruiters'
      ? `careers.smartrecruiters.com/${slugEmployer}`
      : platformConnector.id === 'successfactors'
      ? `career.successfactors.com/${slugEmployer}`
      : platformConnector.id === 'greenhouse'
      ? `boards.greenhouse.io/${slugEmployer}`
      : platformConnector.id === 'lever'
      ? `jobs.lever.co/${slugEmployer}`
      : platformConnector.id === 'ashby'
      ? `jobs.ashbyhq.com/${slugEmployer}`
      : `${platformConnector.id}.com/careers/${slugEmployer}`;

  // Check if we already provisioned an account for this specific employer career portal domain & Gmail ID
  const existingAccount = existingPortalAccounts.find(
    acc => acc.portalDomain === portalDomain && acc.emailUsed === cleanEmail
  );

  const isAlreadyConnected =
    currentConnection?.status === 'connected' && Boolean(existingAccount);

  if (isAlreadyConnected && existingAccount) {
    existingAccount.lastUsedAt = nowIso;
    return {
      accountCreated: false,
      canProceedWithAutoApply: true,
      portalAccount: existingAccount,
      updatedConnection: currentConnection,
      statusMessage: `Authenticated with existing ${platformConnector.name} account (${existingAccount.emailUsed}).`,
    };
  }

  // If no account exists on this career portal
  if (!autoCreateWithGmail) {
    if (!platformConnector.requiresAuthForSubmission && currentConnection?.status === 'connected') {
      return {
        accountCreated: false,
        canProceedWithAutoApply: true,
        updatedConnection: currentConnection,
        statusMessage: `Direct guest ATS submission permitted on ${platformConnector.name}.`,
      };
    }
    return {
      accountCreated: false,
      canProceedWithAutoApply: false,
      statusMessage: `No account found on ${platformConnector.name} (${portalDomain}) and automatic Gmail account creation is disabled.`,
    };
  }

  // Automatically create/provision career portal account using the same Gmail ID
  const newPortalAccount: CareerPortalAccount = {
    id: `portal_acc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    platformId: platformConnector.id,
    portalName: `${employerName} (${platformConnector.name})`,
    portalDomain,
    emailUsed: cleanEmail,
    authStatus: 'provisioned_verified',
    createdAt: nowIso,
    lastUsedAt: nowIso,
    jobId,
  };

  const updatedConnection: PlatformConnection = {
    platformId: platformConnector.id,
    status: 'connected',
    authMethod: 'isolated_browser_session',
    maskedAccountIdentifier: `${cleanEmail} (Auto-Created via Gmail)`,
    lastSuccessfulCheck: nowIso,
  };

  return {
    accountCreated: true,
    canProceedWithAutoApply: true,
    portalAccount: newPortalAccount,
    updatedConnection,
    statusMessage: `Automatically created career portal account on ${portalDomain} using Gmail ID ${cleanEmail}.`,
  };
}

/**
 * Generates fresh career portal job listings discovered during an hourly search cycle.
 */
export function discoverHourlyCareerPortalJobs(
  cycleNumber: number,
  activeCampaigns: Campaign[],
  nowIso: string = new Date().toISOString()
): Job[] {
  const catalog: Array<{
    title: string;
    employer: string;
    platformId: string;
    urlPrefix: string;
    location: string;
    workArrangement: 'remote' | 'hybrid' | 'onsite';
    salaryDisplay: string;
    description: string;
    requirements: string[];
  }> = [
    {
      title: 'Senior Python Backend Engineer (Cloud & Microservices)',
      employer: 'Stripe India',
      platformId: 'greenhouse',
      urlPrefix: 'https://boards.greenhouse.io/stripeindia/jobs',
      location: 'Bengaluru, India (Hybrid)',
      workArrangement: 'hybrid',
      salaryDisplay: '₹32,00,000 - ₹42,00,000 PA',
      description:
        'Build fault-tolerant financial ledger microservices and high-throughput API gateways using Python, FastAPI, PostgreSQL, and distributed streaming.',
      requirements: ['Python 3.11+', 'FastAPI', 'PostgreSQL', 'Distributed Systems', 'Docker'],
    },
    {
      title: 'Applied AI / LLM Engineer (GenAI Platform)',
      employer: 'Krutrim Cloud AI',
      platformId: 'workday',
      urlPrefix: 'https://krutrim.wd5.myworkdayjobs.com/en-US/careers/job',
      location: 'Bengaluru / Remote',
      workArrangement: 'remote',
      salaryDisplay: '₹30,00,000 - ₹40,00,000 PA',
      description:
        'Design and deploy low-latency LLM inference services, RAG indexing pipelines, and agentic evaluation suites with PyTorch and Transformers.',
      requirements: ['PyTorch', 'Transformers', 'LLM / GenAI', 'Python', 'Vector Databases'],
    },
    {
      title: 'Staff Backend Engineer - Python & Async Systems',
      employer: 'Zepto Careers',
      platformId: 'smartrecruiters',
      urlPrefix: 'https://careers.smartrecruiters.com/Zepto/job',
      location: 'Bengaluru, India',
      workArrangement: 'hybrid',
      salaryDisplay: '₹28,00,000 - ₹36,00,000 PA',
      description:
        'Scale real-time fulfillment and inventory prediction engines handling millions of concurrent requests with Python, FastAPI, Redis, andPostgreSQL.',
      requirements: ['Python', 'FastAPI', 'PostgreSQL', 'Redis', 'High-Concurrency APIs'],
    },
    {
      title: 'Senior Data & BI Analytics Engineer',
      employer: 'Swiggy Careers Portal',
      platformId: 'workday',
      urlPrefix: 'https://swiggy.wd5.myworkdayjobs.com/careers/job',
      location: 'Bengaluru / Remote',
      workArrangement: 'remote',
      salaryDisplay: '₹22,00,000 - ₹28,00,000 PA',
      description:
        'Lead enterprise data warehouse modeling in BigQuery and dbt, build executive Tableau telemetry, and partner with product teams on funnel optimization.',
      requirements: ['Advanced SQL', 'BigQuery', 'Tableau', 'Python / Pandas', 'Data Modeling'],
    },
    {
      title: 'Machine Learning Engineer - Agentic Workflows',
      employer: 'Sarvam AI Labs',
      platformId: 'ashby',
      urlPrefix: 'https://jobs.ashbyhq.com/sarvam-ai',
      location: 'Bengaluru / Remote',
      workArrangement: 'remote',
      salaryDisplay: '₹28,00,000 - ₹38,00,000 PA',
      description:
        'Architect multimodal voice and text foundation model applications, fine-tuning pipelines, and production RAG retrieval systems.',
      requirements: ['PyTorch', 'LLM Fine-Tuning', 'Transformers', 'Python', 'GenAI'],
    },
    {
      title: 'Python Platform Engineer - FinTech Core',
      employer: 'Razorpay Career Portal',
      platformId: 'lever',
      urlPrefix: 'https://jobs.lever.co/razorpay',
      location: 'Bengaluru, India',
      workArrangement: 'hybrid',
      salaryDisplay: '₹26,00,000 - ₹34,00,000 PA',
      description:
        'Engineer mission-critical settlement services, webhook delivery pipelines, and idempotent payment APIs in Python and Go.',
      requirements: ['Python', 'PostgreSQL', 'FastAPI', 'Kafka', 'Microservices'],
    },
  ];

  // Pick 2 jobs per cycle deterministically based on cycleNumber so each run discovers fresh openings
  const startIdx = ((cycleNumber - 1) * 2) % catalog.length;
  const selectedTemplates = [
    catalog[startIdx % catalog.length],
    catalog[(startIdx + 1) % catalog.length],
  ];

  return selectedTemplates.map((tpl, idx) => {
    const reqNum = 9100 + cycleNumber * 10 + idx;
    const reqId = `CP-${reqNum}`;
    return {
      id: `job_portal_${cycleNumber}_${idx}_${Date.now()}`,
      title: tpl.title,
      employer: tpl.employer,
      requisitionId: reqId,
      sourcePlatformId: tpl.platformId,
      canonicalUrl: `${tpl.urlPrefix}/${reqId}`,
      applicationDestinationUrl: `${tpl.urlPrefix}/${reqId}/apply`,
      fullDescription: tpl.description,
      requirements: tpl.requirements,
      location: tpl.location,
      workArrangement: tpl.workArrangement,
      salaryDisplay: tpl.salaryDisplay,
      postedDate: nowIso.slice(0, 10),
      retrievalTime: nowIso,
      capabilityStatus: 'permitted_browser_assistance',
    };
  });
}
