/**
 * Job Deduplication and Canonical Key Generator
 * Prevents identical or overlapping jobs from being applied to across campaigns and sources.
 */

import type { Application, Job } from '../types/index.ts';

export function generateCanonicalJobKey(job: Partial<Job>): string {
  const employerClean = (job.employer || 'unknown')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

  const titleClean = (job.title || 'role')
    .toLowerCase()
    .replace(/\b(sr|senior|jr|junior|lead|staff|engineer|developer)\b/g, '')
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 24);

  // If requisition ID is present, use it
  if (job.requisitionId && job.requisitionId.trim().length > 2) {
    return `${employerClean}_${job.requisitionId.trim().toLowerCase()}`;
  }

  // Canonical URL normalized path
  if (job.canonicalUrl) {
    try {
      const url = new URL(job.canonicalUrl);
      const pathname = url.pathname.replace(/\/+$/, '');
      return `${employerClean}_${url.hostname}_${pathname}`;
    } catch {
      // Fallback
    }
  }

  return `${employerClean}_${titleClean}`;
}

export interface DeduplicationCheckResult {
  isDuplicate: boolean;
  existingApplicationId?: string;
  reason?: string;
}

export function checkJobDeduplication(
  job: Job,
  existingApplications: Application[],
  jobsMap: Record<string, Job>
): DeduplicationCheckResult {
  const currentKey = generateCanonicalJobKey(job);

  for (const app of existingApplications) {
    // Only check active or submitted applications (ignore Expired or Skipped or Failed)
    if (['Skipped', 'Expired'].includes(app.status)) {
      continue;
    }

    const linkedJob = jobsMap[app.jobId];
    if (!linkedJob) continue;

    const existingKey = generateCanonicalJobKey(linkedJob);
    if (currentKey === existingKey || job.id === linkedJob.id) {
      return {
        isDuplicate: true,
        existingApplicationId: app.id,
        reason: `Job already has an active or completed application (Status: ${app.status}, Employer: "${linkedJob.employer}")`,
      };
    }
  }

  return {
    isDuplicate: false,
  };
}
