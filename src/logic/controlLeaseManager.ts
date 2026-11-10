/**
 * Control Lease Manager
 * Enforces exclusive human intervention lease ("Take Control")
 * Ensures worker and human input never overlap, rejects stale events,
 * and maintains atomic session leases.
 */

import type { BrowserSession, ControlLease } from '../types/index.ts';

export const LEASE_DURATION_MS = 5 * 60 * 1000; // 5 minutes default lease

export class ControlLeaseManager {
  private activeLeases: Map<string, ControlLease> = new Map();

  /**
   * Acquire exclusive control lease for an authenticated user on a browser session.
   * Fails if already held by another user and not expired.
   */
  acquireLease(
    session: BrowserSession,
    userId: string,
    now: number = Date.now()
  ): { success: boolean; lease?: ControlLease; reason?: string } {
    const existing = this.activeLeases.get(session.id);

    if (existing && existing.expiresAt > now && existing.grantedToUserId !== userId) {
      return {
        success: false,
        reason: 'Session control is currently leased exclusively to another active session.',
      };
    }

    const newVersion = existing ? existing.version + 1 : 1;
    const lease: ControlLease = {
      leaseId: `lease_${session.id}_${Date.now()}_v${newVersion}`,
      applicationId: session.applicationId,
      grantedToUserId: userId,
      grantedAt: now,
      expiresAt: now + LEASE_DURATION_MS,
      version: newVersion,
    };

    this.activeLeases.set(session.id, lease);
    session.controlLease = lease;
    session.isWorkerPaused = true;
    session.state = 'paused';

    return {
      success: true,
      lease,
    };
  }

  /**
   * Validate that an incoming interaction event holds the valid current lease.
   */
  validateEventAccess(
    sessionId: string,
    userId: string,
    leaseId: string,
    version: number,
    now: number = Date.now()
  ): { valid: boolean; reason?: string } {
    const active = this.activeLeases.get(sessionId);
    if (!active) {
      return { valid: false, reason: 'No active control lease found for this session.' };
    }

    if (active.grantedToUserId !== userId) {
      return { valid: false, reason: 'User unauthorized for this control lease.' };
    }

    if (active.leaseId !== leaseId || active.version !== version) {
      return { valid: false, reason: 'Stale lease token or conflicting version.' };
    }

    if (active.expiresAt <= now) {
      return { valid: false, reason: 'Control lease has expired.' };
    }

    return { valid: true };
  }

  /**
   * Release lease and return control from human to AI
   */
  releaseLease(sessionId: string, userId: string): { released: boolean; reason?: string } {
    const active = this.activeLeases.get(sessionId);
    if (!active) {
      return { released: true };
    }

    if (active.grantedToUserId !== userId) {
      return { released: false, reason: 'Cannot release lease owned by another user.' };
    }

    this.activeLeases.delete(sessionId);
    return { released: true };
  }

  /**
   * Get active lease info
   */
  getLease(sessionId: string): ControlLease | undefined {
    return this.activeLeases.get(sessionId);
  }
}

export const globalLeaseManager = new ControlLeaseManager();
