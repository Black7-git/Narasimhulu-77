/**
 * Resume Selection Precedence Logic:
 * 1. Explicit application-level selection
 * 2. Campaign-assigned default resume
 * 3. Best eligible approved resume matching target role keywords
 */

import type { ResumeVersion } from '../types/index.ts';

export interface PrecedenceResolution {
  selectedResumeId: string;
  source: 'explicit' | 'campaign_default' | 'policy_match' | 'fallback_first_available';
  explanation: string;
  isAmbiguous: boolean;
  competingCandidates?: string[];
}

export function resolveResumeSelection(
  explicitResumeId: string | undefined,
  campaignDefaultResumeId: string | undefined,
  allResumes: ResumeVersion[],
  jobTitle: string,
  targetRoleKeywords: string[] = []
): PrecedenceResolution {
  const activeResumes = allResumes.filter(r => !r.isArchived);

  if (activeResumes.length === 0) {
    throw new Error('No active resumes available in Resume Library');
  }

  // 1. Explicit application-level selection
  if (explicitResumeId) {
    const explicit = activeResumes.find(r => r.id === explicitResumeId);
    if (explicit) {
      return {
        selectedResumeId: explicit.id,
        source: 'explicit',
        explanation: `Explicitly chosen for this application: "${explicit.title}" (v${explicit.versionNumber})`,
        isAmbiguous: false,
      };
    }
  }

  // 2. Campaign-assigned default resume
  if (campaignDefaultResumeId) {
    const campaignDefault = activeResumes.find(r => r.id === campaignDefaultResumeId);
    if (campaignDefault) {
      return {
        selectedResumeId: campaignDefault.id,
        source: 'campaign_default',
        explanation: `Assigned as campaign default resume: "${campaignDefault.title}" (v${campaignDefault.versionNumber})`,
        isAmbiguous: false,
      };
    }
  }

  // 3. Best eligible approved resume matching job title or role keywords
  const lowerJobTitle = jobTitle.toLowerCase();
  const scoredResumes = activeResumes.map(resume => {
    let score = 0;
    // Direct title keyword overlap
    for (const role of resume.intendedRoles) {
      if (lowerJobTitle.includes(role.toLowerCase()) || role.toLowerCase().includes(lowerJobTitle)) {
        score += 10;
      }
    }
    for (const kw of targetRoleKeywords) {
      if (resume.highlightedSkills.some(s => s.toLowerCase().includes(kw.toLowerCase()))) {
        score += 2;
      }
    }
    if (resume.isDefault) score += 1;
    return { resume, score };
  });

  scoredResumes.sort((a, b) => b.score - a.score);

  const topMatch = scoredResumes[0];
  const secondMatch = scoredResumes[1];

  // Ambiguity check: if two resumes have the exact same non-zero score
  if (secondMatch && secondMatch.score > 0 && secondMatch.score === topMatch.score) {
    return {
      selectedResumeId: topMatch.resume.id,
      source: 'policy_match',
      explanation: `Policy recommendation: "${topMatch.resume.title}" matched target role. Multiple eligible resumes tie; user confirmation recommended.`,
      isAmbiguous: true,
      competingCandidates: [topMatch.resume.id, secondMatch.resume.id],
    };
  }

  if (topMatch.score > 0) {
    return {
      selectedResumeId: topMatch.resume.id,
      source: 'policy_match',
      explanation: `Policy match based on targeted role alignment: "${topMatch.resume.title}" (score: ${topMatch.score})`,
      isAmbiguous: false,
    };
  }

  // Fallback to first available active resume
  return {
    selectedResumeId: activeResumes[0].id,
    source: 'fallback_first_available',
    explanation: `Defaulted to first verified library resume: "${activeResumes[0].title}"`,
    isAmbiguous: activeResumes.length > 1,
  };
}
