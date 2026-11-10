/**
 * Rate Limiter and Timezone Day-Boundary Manager
 * Ensures per-campaign limits, overall daily limits, and per-company caps
 * respect the user's configured timezone (default Asia/Kolkata).
 */

import type { AutomationPolicy, Campaign } from '../types/index.ts';

export function getTodayDateString(timezone: string, now: Date = new Date()): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(now);
  } catch {
    // Fallback if invalid timezone string
    return now.toISOString().slice(0, 10);
  }
}

export interface RateLimitCheckResult {
  allowed: boolean;
  reason?: string;
  todayAppliedCampaign: number;
  campaignLimit: number;
  todayAppliedOverall: number;
  overallLimit: number;
}

export function checkRateLimits(
  campaign: Campaign,
  policy: AutomationPolicy,
  existingEmployerApplicationCount: number,
  now: Date = new Date()
): RateLimitCheckResult {
  const today = getTodayDateString(policy.timezone, now);

  // Check overall pause
  if (policy.pauseAll) {
    return {
      allowed: false,
      reason: 'Automation is globally paused by user.',
      todayAppliedCampaign: campaign.todayAppliedCount,
      campaignLimit: campaign.dailyLimit,
      todayAppliedOverall: policy.todayAppliedTotal,
      overallLimit: policy.overallDailyLimit,
    };
  }

  // Check campaign status
  if (campaign.status !== 'active') {
    return {
      allowed: false,
      reason: `Campaign "${campaign.title}" is currently ${campaign.status}.`,
      todayAppliedCampaign: campaign.todayAppliedCount,
      campaignLimit: campaign.dailyLimit,
      todayAppliedOverall: policy.todayAppliedTotal,
      overallLimit: policy.overallDailyLimit,
    };
  }

  // Reconcile date rollover for campaign
  const campaignApplied = (campaign.lastResetDate === today) ? campaign.todayAppliedCount : 0;
  const overallApplied = policy.todayAppliedTotal;

  // Per-company cap
  if (existingEmployerApplicationCount >= policy.perCompanyCap) {
    return {
      allowed: false,
      reason: `Per-company application cap reached (${existingEmployerApplicationCount}/${policy.perCompanyCap}) for this employer.`,
      todayAppliedCampaign: campaignApplied,
      campaignLimit: campaign.dailyLimit,
      todayAppliedOverall: overallApplied,
      overallLimit: policy.overallDailyLimit,
    };
  }

  // Campaign limit
  if (campaignApplied >= campaign.dailyLimit) {
    return {
      allowed: false,
      reason: `Campaign daily application limit reached (${campaignApplied}/${campaign.dailyLimit}).`,
      todayAppliedCampaign: campaignApplied,
      campaignLimit: campaign.dailyLimit,
      todayAppliedOverall: overallApplied,
      overallLimit: policy.overallDailyLimit,
    };
  }

  // Overall limit
  if (overallApplied >= policy.overallDailyLimit) {
    return {
      allowed: false,
      reason: `Overall daily limit reached (${overallApplied}/${policy.overallDailyLimit}) for today (${today}).`,
      todayAppliedCampaign: campaignApplied,
      campaignLimit: campaign.dailyLimit,
      todayAppliedOverall: overallApplied,
      overallLimit: policy.overallDailyLimit,
    };
  }

  return {
    allowed: true,
    todayAppliedCampaign: campaignApplied,
    campaignLimit: campaign.dailyLimit,
    todayAppliedOverall: overallApplied,
    overallLimit: policy.overallDailyLimit,
  };
}
