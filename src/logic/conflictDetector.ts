/**
 * Conflict Detector for Candidate Facts
 * Flags discrepancies in dates, employers, degrees, and core qualifications
 * across resumes and the verified master profile.
 */

import type { CandidateFact, FactConflict } from '../types/index.ts';

export function detectFactConflicts(
  existingFacts: CandidateFact[],
  newFacts: CandidateFact[]
): FactConflict[] {
  const conflicts: FactConflict[] = [];

  for (const newFact of newFacts) {
    // Only verify factual items like experience, education, personal
    if (!['experience', 'education', 'personal'].includes(newFact.category)) {
      continue;
    }

    const matches = existingFacts.filter(
      ef => ef.category === newFact.category && ef.label.toLowerCase().trim() === newFact.label.toLowerCase().trim()
    );

    for (const match of matches) {
      const cleanA = match.value.trim().toLowerCase();
      const cleanB = newFact.value.trim().toLowerCase();

      if (cleanA !== cleanB) {
        // Discrepancy detected
        conflicts.push({
          id: `conflict_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          factAId: match.id,
          factBId: newFact.id,
          field: `${match.category}: ${match.label}`,
          valueA: match.value,
          valueB: newFact.value,
          sourceA: match.sourceResumeId ? `Resume ${match.sourceResumeId}` : 'Master Profile',
          sourceB: newFact.sourceResumeId ? `Resume ${newFact.sourceResumeId}` : 'New Resume Upload',
          resolved: false,
        });
      }
    }
  }

  return conflicts;
}

export function doesConflictBlockApplication(
  conflicts: FactConflict[],
  resumeId: string
): { isBlocked: boolean; blockingConflicts: FactConflict[] } {
  const unresolved = conflicts.filter(c => !c.resolved);
  const relevant = unresolved.filter(
    c => c.sourceA.includes(resumeId) || c.sourceB.includes(resumeId)
  );

  return {
    isBlocked: relevant.length > 0,
    blockingConflicts: relevant,
  };
}
