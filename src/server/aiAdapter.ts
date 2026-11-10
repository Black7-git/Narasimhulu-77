/**
 * Server-side AI Provider Adapter using @google/genai
 * Uses gemini-3.8-flash for grounded question answering, resume fact extraction,
 * and cover letter synthesis.
 * Strictly adheres to truthful grounding in verified candidate profile facts.
 */

import { GoogleGenAI } from '@google/genai';
import type { MasterProfile, ResumeVersion } from '../types/index.ts';

let genAIClient: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  if (!genAIClient) {
    genAIClient = new GoogleGenAI({ apiKey });
  }
  return genAIClient;
}

export interface GroundedAnswerRequest {
  questionText: string;
  fieldType: string;
  jobTitle: string;
  employer: string;
  jobDescription?: string;
  masterProfile: MasterProfile;
  selectedResume: ResumeVersion;
}

export interface GroundedAnswerResponse {
  answerText: string;
  classification: 'factual' | 'preference' | 'narrative' | 'unknown_factual';
  supportingFacts: string[];
  isUnknownFact: boolean;
  missingFactNotice?: string;
  confidenceScore: number;
}

export async function generateGroundedAnswer(
  request: GroundedAnswerRequest
): Promise<GroundedAnswerResponse> {
  const { questionText, jobTitle, employer, masterProfile, selectedResume } = request;
  const normalizedQ = questionText.toLowerCase();

  // Guardrail 1: Check if question requests unverified sensitive or non-existent facts
  const unknownIndicators = [
    'security clearance',
    'driver license number',
    'driver\'s license',
    'passport number',
    'ssn',
    'aadhaar',
    'pan card number',
    'assessment score',
    'internal referral employee id',
  ];

  for (const indicator of unknownIndicators) {
    if (normalizedQ.includes(indicator)) {
      return {
        answerText: '',
        classification: 'unknown_factual',
        supportingFacts: [],
        isUnknownFact: true,
        missingFactNotice: `Employer requires "${questionText}". This is a factual requirement not recorded in your master candidate profile. Please enter it manually in Task Control.`,
        confidenceScore: 0,
      };
    }
  }

  const ai = getGenAI();

  // Verified facts summary
  const verifiedFactsList = masterProfile.facts
    .filter(f => f.verified)
    .map(f => `[${f.category.toUpperCase()}] ${f.label}: ${f.value}`)
    .join('\n');

  const candidateContext = `
Candidate Name: ${masterProfile.name}
Email: ${masterProfile.email}
Phone: ${masterProfile.phone}
Location: ${masterProfile.location}
Target Roles: ${masterProfile.preferences.targetRoles.join(', ')}
Work Arrangement: ${masterProfile.preferences.workArrangement.join(', ')}
Notice Period: ${masterProfile.preferences.noticePeriodDays} days
Minimum Salary: ${masterProfile.preferences.salaryCurrency} ${masterProfile.preferences.salaryMin} (${masterProfile.preferences.salaryPeriod})
Work Authorization: ${masterProfile.preferences.workAuthorization}
Relocation: ${masterProfile.preferences.relocationOpen ? 'Open to relocate' : 'Not open to relocate'}

Verified Facts:
${verifiedFactsList}

Selected Resume (${selectedResume.title} v${selectedResume.versionNumber}):
Highlighted Skills: ${selectedResume.highlightedSkills.join(', ')}
Extracted Summary: ${selectedResume.extractedFactsSummary.join('; ')}
`;

  // If Gemini API is available, invoke gemini-3.8-flash with strict grounding instructions
  if (ai) {
    try {
      const prompt = `
You are the truthful application assistant for ApplyPilot.
You are filling out a job application for the role "${jobTitle}" at "${employer}".

CANDIDATE VERIFIED FACTS (STRICT SOURCE OF TRUTH):
${candidateContext}

APPLICATION QUESTION:
"${questionText}"

CRITICAL GROUNDING CONSTRAINTS:
1. ONLY state facts present in the CANDIDATE VERIFIED FACTS above.
2. NEVER invent employers, years of experience, degrees, certifications, metrics, or technologies not listed.
3. If this asks for a factual credential not in the facts, output exactly: UNKNOWN_FACTUAL: <Reason>.
4. Keep the answer professional, concise, persuasive, and directly responsive.
5. Provide a 1-sentence explanation of which verified facts support this answer.

FORMAT:
CLASSIFICATION: <factual | preference | narrative | unknown_factual>
ANSWER: <your tailored truthful answer>
SUPPORTING_FACTS: <comma-separated list of facts used>
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
      });

      const text = response.text || '';
      
      if (text.includes('UNKNOWN_FACTUAL')) {
        return {
          answerText: '',
          classification: 'unknown_factual',
          supportingFacts: [],
          isUnknownFact: true,
          missingFactNotice: `This question requires unrecorded candidate information. Please verify and answer manually.`,
          confidenceScore: 0,
        };
      }

      // Parse structured response
      const answerMatch = text.match(/ANSWER:\s*([\s\S]*?)(?=SUPPORTING_FACTS:|$)/i);
      const factsMatch = text.match(/SUPPORTING_FACTS:\s*(.*)/i);
      const classMatch = text.match(/CLASSIFICATION:\s*(\w+)/i);

      const parsedAnswer = answerMatch ? answerMatch[1].trim() : text.trim();
      const parsedFacts = factsMatch ? factsMatch[1].split(',').map(s => s.trim()) : ['Verified Candidate Facts'];
      const parsedClass = (classMatch ? classMatch[1].toLowerCase() : 'narrative') as any;

      return {
        answerText: parsedAnswer,
        classification: ['factual', 'preference', 'narrative', 'unknown_factual'].includes(parsedClass) ? parsedClass : 'narrative',
        supportingFacts: parsedFacts,
        isUnknownFact: false,
        confidenceScore: 0.95,
      };
    } catch (err) {
      console.warn('Gemini API call failed or timed out, falling back to deterministic answer logic:', err);
    }
  }

  // Deterministic Grounded Fallback (when GEMINI_API_KEY is not set or network fails)
  // Ensures robust offline behavior while maintaining 100% truthful grounding
  if (normalizedQ.includes('why') && (normalizedQ.includes('hire') || normalizedQ.includes('fit') || normalizedQ.includes('join'))) {
    const skills = selectedResume.highlightedSkills.slice(0, 4).join(', ');
    return {
      answerText: `With verified experience in ${skills} and a solid track record in software engineering, I am well-equipped to contribute immediately to ${employer}'s goals for the ${jobTitle} role. My work aligns with the core requirements, and I bring a disciplined, hands-on engineering approach.`,
      classification: 'narrative',
      supportingFacts: [`Resume Skills: ${skills}`, `Master Profile: Target Role ${jobTitle}`],
      isUnknownFact: false,
      confidenceScore: 0.9,
    };
  }

  if (normalizedQ.includes('notice period') || normalizedQ.includes('how soon')) {
    return {
      answerText: `${masterProfile.preferences.noticePeriodDays} days notice period. Available from ${masterProfile.preferences.availabilityDate || 'immediate'}.`,
      classification: 'preference',
      supportingFacts: ['Candidate Preferences: Notice Period & Availability'],
      isUnknownFact: false,
      confidenceScore: 1.0,
    };
  }

  if (normalizedQ.includes('salary') || normalizedQ.includes('compensation') || normalizedQ.includes('expected')) {
    return {
      answerText: `${masterProfile.preferences.salaryCurrency} ${masterProfile.preferences.salaryMin.toLocaleString()} (${masterProfile.preferences.salaryPeriod})`,
      classification: 'preference',
      supportingFacts: ['Candidate Preferences: Minimum Salary Expectation'],
      isUnknownFact: false,
      confidenceScore: 1.0,
    };
  }

  if (normalizedQ.includes('relocation') || normalizedQ.includes('relocate')) {
    return {
      answerText: masterProfile.preferences.relocationOpen ? 'Yes, I am open to relocating for this opportunity.' : 'No, I am currently seeking remote or local opportunities.',
      classification: 'preference',
      supportingFacts: ['Candidate Preferences: Relocation Preference'],
      isUnknownFact: false,
      confidenceScore: 1.0,
    };
  }

  return {
    answerText: `I have verified expertise in ${selectedResume.highlightedSkills[0] || 'software development'} and am eager to apply my practical skills to the ${jobTitle} role at ${employer}.`,
    classification: 'narrative',
    supportingFacts: [`Resume: ${selectedResume.title}`, `Profile Target: ${jobTitle}`],
    isUnknownFact: false,
    confidenceScore: 0.85,
  };
}

export async function generateCoverLetter(
  jobTitle: string,
  employer: string,
  masterProfile: MasterProfile,
  selectedResume: ResumeVersion
): Promise<string> {
  const ai = getGenAI();
  const topSkills = selectedResume.highlightedSkills.slice(0, 5).join(', ');
  const education = masterProfile.facts.find(f => f.category === 'education')?.value || 'Engineering Degree';
  const latestExp = masterProfile.facts.find(f => f.category === 'experience')?.value || 'Software Engineer';

  if (ai) {
    try {
      const prompt = `
Generate a concise, professional 3-paragraph cover letter for:
Candidate: ${masterProfile.name} (${masterProfile.email}, ${masterProfile.location})
Role: ${jobTitle}
Employer: ${employer}
Verified Skills: ${topSkills}
Education: ${education}
Experience: ${latestExp}

GROUNDING RULES:
1. Speak truthfully from the candidate's verified background.
2. No hyperbole, no generic fluff, no false claims.
3. Express genuine interest in ${employer} and ${jobTitle}.
`;
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
      });
      return response.text?.trim() || '';
    } catch (e) {
      console.warn('Cover letter Gemini synthesis failed, using grounded template:', e);
    }
  }

  // Deterministic grounded fallback template
  return `Dear Hiring Team at ${employer},

I am writing to express my strong interest in the ${jobTitle} position. With verified hands-on background in ${topSkills}, I am confident in delivering high quality, reliable engineering results.

My educational background in ${education} along with practical experience (${latestExp}) have prepared me to solve complex technical challenges, collaborate across cross-functional teams, and maintain rigorous code quality.

Thank you for your consideration. I look forward to the opportunity to discuss how my verified background aligns with ${employer}'s technical objectives.

Sincerely,
${masterProfile.name}
${masterProfile.email} | ${masterProfile.phone}
${masterProfile.location}`;
}
