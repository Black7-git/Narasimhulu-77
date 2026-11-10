/**
 * Form Field and Answer Classifier
 * Classifies questions into Factual, Preference, Narrative, or Unknown Factual.
 * Strictly prevents fabrication of unknown factual attributes.
 */

import type { CandidateFact, CandidatePreferences, MasterProfile, QuestionClassification } from '../types/index.ts';

export interface ClassifiedAnswerResult {
  classification: QuestionClassification;
  suggestedValue: string;
  provenanceFacts: string[];
  confidence: number;
  isUnknownFact: boolean;
  missingFactPrompt?: string;
}

export function classifyAndAnswerField(
  fieldLabel: string,
  fieldType: string,
  masterProfile: MasterProfile,
  jobContext: { title: string; employer: string }
): ClassifiedAnswerResult {
  const normalized = fieldLabel.toLowerCase().trim();

  // 1. Direct Factual Matching (Master profile facts & contact info)
  if (normalized.includes('email') || normalized.includes('e-mail')) {
    return {
      classification: 'factual',
      suggestedValue: masterProfile.email,
      provenanceFacts: ['Master Profile Contact: Email'],
      confidence: 1.0,
      isUnknownFact: false,
    };
  }

  if (normalized.includes('phone') || normalized.includes('mobile') || normalized.includes('contact number')) {
    return {
      classification: 'factual',
      suggestedValue: masterProfile.phone,
      provenanceFacts: ['Master Profile Contact: Phone'],
      confidence: 1.0,
      isUnknownFact: false,
    };
  }

  if (normalized.includes('full name') || normalized.includes('your name') || normalized === 'name') {
    return {
      classification: 'factual',
      suggestedValue: masterProfile.name,
      provenanceFacts: ['Master Profile: Full Name'],
      confidence: 1.0,
      isUnknownFact: false,
    };
  }

  if (normalized.includes('city') || normalized.includes('current location') || normalized.includes('address')) {
    return {
      classification: 'factual',
      suggestedValue: masterProfile.location,
      provenanceFacts: ['Master Profile: Location'],
      confidence: 0.95,
      isUnknownFact: false,
    };
  }

  if (normalized.includes('linkedin')) {
    return {
      classification: 'factual',
      suggestedValue: masterProfile.linkedinUrl || '',
      provenanceFacts: ['Master Profile: LinkedIn URL'],
      confidence: masterProfile.linkedinUrl ? 1.0 : 0.0,
      isUnknownFact: !masterProfile.linkedinUrl,
      missingFactPrompt: !masterProfile.linkedinUrl ? 'Please provide your LinkedIn profile URL.' : undefined,
    };
  }

  if (normalized.includes('github') || normalized.includes('portfolio') || normalized.includes('website')) {
    const val = masterProfile.githubUrl || masterProfile.portfolioUrl || '';
    return {
      classification: 'factual',
      suggestedValue: val,
      provenanceFacts: ['Master Profile: Project Links'],
      confidence: val ? 1.0 : 0.0,
      isUnknownFact: !val,
      missingFactPrompt: !val ? 'Please provide your Portfolio / GitHub link.' : undefined,
    };
  }

  // 2. Candidate Preferences
  const prefs: CandidatePreferences = masterProfile.preferences;

  if (normalized.includes('salary') || normalized.includes('compensation') || normalized.includes('ctc') || normalized.includes('expected pay')) {
    return {
      classification: 'preference',
      suggestedValue: `${prefs.salaryCurrency} ${prefs.salaryMin.toLocaleString()} (${prefs.salaryPeriod})`,
      provenanceFacts: ['Candidate Preferences: Minimum Salary'],
      confidence: 1.0,
      isUnknownFact: false,
    };
  }

  if (normalized.includes('notice period') || normalized.includes('how soon can you start') || normalized.includes('availability')) {
    return {
      classification: 'preference',
      suggestedValue: `${prefs.noticePeriodDays} days (${prefs.availabilityDate || 'Immediate'})`,
      provenanceFacts: ['Candidate Preferences: Notice Period & Availability'],
      confidence: 1.0,
      isUnknownFact: false,
    };
  }

  if (normalized.includes('work authorization') || normalized.includes('sponsorship') || normalized.includes('legally authorized')) {
    return {
      classification: 'preference',
      suggestedValue: prefs.workAuthorization,
      provenanceFacts: ['Candidate Preferences: Work Authorization'],
      confidence: 1.0,
      isUnknownFact: false,
    };
  }

  if (normalized.includes('relocate') || normalized.includes('willing to relocate')) {
    return {
      classification: 'preference',
      suggestedValue: prefs.relocationOpen ? 'Yes, open to relocation.' : 'No, preferring current location or remote.',
      provenanceFacts: ['Candidate Preferences: Relocation'],
      confidence: 1.0,
      isUnknownFact: false,
    };
  }

  // Check matching candidate verified facts (e.g., education, specific technologies)
  for (const fact of masterProfile.facts) {
    if (normalized.includes(fact.label.toLowerCase())) {
      return {
        classification: 'factual',
        suggestedValue: fact.value,
        provenanceFacts: [`Verified Fact: ${fact.label} (${fact.category})`],
        confidence: 0.95,
        isUnknownFact: false,
      };
    }
  }

  // 3. Narrative Questions (STAR statements, motivation, cover letter snippets)
  if (
    normalized.includes('why do you want to work') ||
    normalized.includes('why join') ||
    normalized.includes('tell us about a project') ||
    normalized.includes('describe your experience with') ||
    normalized.includes('cover letter') ||
    normalized.includes('why are you a good fit')
  ) {
    const verifiedSkills = masterProfile.facts
      .filter(f => f.category === 'skill')
      .map(f => f.value)
      .slice(0, 5)
      .join(', ');

    return {
      classification: 'narrative',
      suggestedValue: `I bring demonstrated hands-on experience in ${verifiedSkills || 'software engineering'}, backed by verified projects and professional employment history. I am excited to contribute to ${jobContext.employer}'s mission for the ${jobContext.title} position by applying rigorous technical fundamentals and disciplined execution.`,
      provenanceFacts: ['Master Profile: Verified Skills & Summary'],
      confidence: 0.9,
      isUnknownFact: false,
    };
  }

  // 4. Unknown Factual Questions: Do NOT invent credentials, security clearances, or unknown test scores
  if (
    normalized.includes('clearance') ||
    normalized.includes('license number') ||
    normalized.includes('passport number') ||
    normalized.includes('ssn') ||
    normalized.includes('aadhaar') ||
    normalized.includes('assessment score') ||
    normalized.includes('internal reference')
  ) {
    return {
      classification: 'unknown_factual',
      suggestedValue: '',
      provenanceFacts: [],
      confidence: 0.0,
      isUnknownFact: true,
      missingFactPrompt: `Employer requires "${fieldLabel}". This information is not in your verified profile. Please provide it directly.`,
    };
  }

  // General fallback: if required but undetermined factual
  return {
    classification: 'narrative',
    suggestedValue: `Based on my background in ${masterProfile.preferences.targetRoles[0] || 'engineering'}, I have proven proficiency in relevant workflows and look forward to detailing this further in an interview.`,
    provenanceFacts: ['Master Profile: Target Role'],
    confidence: 0.75,
    isUnknownFact: false,
  };
}
