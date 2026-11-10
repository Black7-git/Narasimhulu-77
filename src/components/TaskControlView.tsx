import React, { useState, useEffect, useRef } from 'react';
import {
  AlertTriangle,
  Play,
  Pause,
  Shield,
  Clock,
  CheckCircle2,
  Lock,
  MousePointer,
  RotateCcw,
  Smartphone,
  ExternalLink,
} from 'lucide-react';
import { Application, BrowserSession, ControlLease, Job } from '../types';

interface TaskControlViewProps {
  applications: Application[];
  sessions: Record<string, BrowserSession>;
  jobs: Job[];
  onRefresh: () => void;
  onNavigateToSandbox: () => void;
}

export const TaskControlView: React.FC<TaskControlViewProps> = ({
  applications,
  sessions,
  jobs,
  onRefresh,
  onNavigateToSandbox,
}) => {
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [activeLease, setActiveLease] = useState<ControlLease | null>(null);
  const [leaseSecondsRemaining, setLeaseSecondsRemaining] = useState<number>(300);
  const [isSolvingCaptcha, setIsSolvingCaptcha] = useState<boolean>(false);
  const [captchaSolvedLocally, setCaptchaSolvedLocally] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [pointerCoords, setPointerCoords] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const viewportRef = useRef<HTMLDivElement>(null);

  // Filter applications requiring user intervention
  const pendingApps = applications.filter(a =>
    ['Waiting for CAPTCHA', 'Waiting for Login', 'Waiting for OTP', 'Needs Information', 'User in Control', 'Paused'].includes(a.status)
  );

  // Timer countdown for active lease
  useEffect(() => {
    if (!activeLease) return;
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((activeLease.expiresAt - Date.now()) / 1000));
      setLeaseSecondsRemaining(remaining);
      if (remaining === 0) {
        setStatusMessage('Control lease expired. Returning session to safe pause.');
        handleKeepPaused();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [activeLease]);

  const handleTakeControl = async (sessionId: string) => {
    try {
      setStatusMessage('Acquiring exclusive control lease and validating pause state...');
      const res = await fetch('/api/take-control/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatusMessage(`Failed: ${data.error}`);
        return;
      }

      setActiveSessionId(sessionId);
      setActiveLease(data.lease);
      setLeaseSecondsRemaining(Math.max(0, Math.floor((data.lease.expiresAt - Date.now()) / 1000)));
      setCaptchaSolvedLocally(false);
      setStatusMessage('You are in control — automation paused. Complete the required human step below.');
      onRefresh();
    } catch (e: any) {
      setStatusMessage(`Error: ${e.message}`);
    }
  };

  const handleReturnControl = async (solved: boolean) => {
    if (!activeSessionId) return;
    try {
      setStatusMessage('Revoking human lease and verifying website state...');
      const res = await fetch('/api/take-control/return', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: activeSessionId,
          solvedVerification: solved,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setActiveSessionId(null);
        setActiveLease(null);
        setStatusMessage(
          solved
            ? 'Intervention verified! Control safely returned to AI agent.'
            : 'Unresolved verification: Session kept safely paused to prevent failed submissions.'
        );
        onRefresh();
      } else {
        setStatusMessage(`Error: ${data.error}`);
      }
    } catch (e: any) {
      setStatusMessage(`Error: ${e.message}`);
    }
  };

  const handleKeepPaused = async () => {
    if (!activeSessionId) return;
    try {
      await fetch('/api/take-control/keep-paused', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: activeSessionId }),
      });
      setActiveSessionId(null);
      setActiveLease(null);
      setStatusMessage('Session kept paused by candidate.');
      onRefresh();
    } catch (e: any) {
      setStatusMessage(`Error: ${e.message}`);
    }
  };

  // Dispatches pointer event with normalized coordinate scaling
  const handlePointerEvent = async (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>, type: string) => {
    if (!activeSessionId || !activeLease || !viewportRef.current) return;

    const rect = viewportRef.current.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    // Scale viewport coordinates to standard 1280x800 headless viewport
    const scaleX = 1280 / rect.width;
    const scaleY = 800 / rect.height;
    const normX = Math.round((clientX - rect.left) * scaleX);
    const normY = Math.round((clientY - rect.top) * scaleY);

    setPointerCoords({ x: normX, y: normY });

    // Send input to server during lease
    try {
      await fetch('/api/take-control/input', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: activeSessionId,
          leaseId: activeLease.leaseId,
          version: activeLease.version,
          event: { type, x: normX, y: normY },
        }),
      });
    } catch {
      // transient network log
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-rose-700 uppercase tracking-wider mb-1">
              <Shield className="w-4 h-4" />
              <span>Human-in-the-Loop Interventions</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Task Control Hub</h1>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl">
              ApplyPilot automates detection and pauses application input safely on CAPTCHA, MFA, and Login challenges.
              Per safety rules, CAPTCHA is solved <strong>exclusively by you</strong> through Take Control.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onNavigateToSandbox}
              className="px-3.5 py-2 text-xs font-medium rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors"
            >
              Open Interactive Test Sandbox
            </button>
          </div>
        </div>

        {statusMessage && (
          <div className="mt-4 p-3 rounded-lg bg-slate-100 border border-slate-200 text-xs text-slate-700 font-medium flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-500" />
            <span>{statusMessage}</span>
          </div>
        )}
      </div>

      {/* Active Interventions List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">
            Pending Actions ({pendingApps.length})
          </h2>
          <span className="text-xs text-slate-500">
            Worker automation halts completely while intervention is active
          </span>
        </div>

        {pendingApps.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <p className="font-medium text-slate-900">All clear — no actions required</p>
            <p className="text-xs text-slate-500 mt-1">
              Active campaigns will pause and notify you here immediately when a human action is required.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {pendingApps.map(app => {
              const job = jobs.find(j => j.id === app.jobId);
              const session = app.browserSessionId ? sessions[app.browserSessionId] : undefined;
              const isCaptcha = app.status === 'Waiting for CAPTCHA';
              const isLogin = app.status === 'Waiting for Login';

              return (
                <div
                  key={app.id}
                  className="rounded-xl border border-rose-200 bg-white p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800">
                        {app.status}
                      </span>
                      <span className="text-xs text-slate-400">·</span>
                      <span className="text-xs font-semibold text-slate-700">{job?.employer || 'Employer'}</span>
                      <span className="text-xs text-slate-400">·</span>
                      <span className="text-xs text-slate-500">{job?.title || 'Application'}</span>
                    </div>

                    <p className="text-sm font-medium text-slate-900">
                      {isCaptcha && 'Cloudflare / Turnstile CAPTCHA detected. User verification required to proceed.'}
                      {isLogin && 'Login session expired or 2FA required on employer platform.'}
                      {app.status === 'Needs Information' && 'Employer form has required factual questions not found in your profile.'}
                      {app.status === 'User in Control' && 'Session is currently in Take Control mode.'}
                      {app.status === 'Paused' && 'Application is paused. Ready to resume when confirmed.'}
                    </p>

                    <div className="text-xs text-slate-500 flex items-center gap-3">
                      <span>Application ID: {app.id}</span>
                      <span>·</span>
                      <span>Target URL: {job?.applicationDestinationUrl || 'ATS Form'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {session ? (
                      <button
                        onClick={() => handleTakeControl(session.id)}
                        className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm transition-colors shadow-xs flex items-center gap-2"
                      >
                        <MousePointer className="w-4 h-4" />
                        <span>Take Control</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleTakeControl('sess_sandbox_01')}
                        className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition-colors flex items-center gap-2"
                      >
                        <MousePointer className="w-4 h-4" />
                        <span>Take Control (Sandbox)</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ACTIVE TAKE CONTROL MODAL / VIEWPORT */}
      {activeSessionId && activeLease && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-rose-300">
                    <span>YOU ARE IN CONTROL</span>
                    <span>·</span>
                    <span>AUTOMATION PAUSED</span>
                  </div>
                  <div className="text-sm font-semibold text-white">
                    Live Session: {activeSessionId} · Lease #{activeLease.version}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono">
                <div className="bg-slate-800 px-3 py-1.5 rounded-md flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>
                    Lease: {Math.floor(leaseSecondsRemaining / 60)}:
                    {(leaseSecondsRemaining % 60).toString().padStart(2, '0')}
                  </span>
                </div>
                <div className="text-slate-400 hidden sm:block">
                  X: {pointerCoords.x} Y: {pointerCoords.y}
                </div>
              </div>
            </div>

            {/* Sub-header instruction banner */}
            <div className="px-6 py-3 bg-amber-50 border-b border-amber-200 text-xs text-amber-900 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  Worker automation has safely halted. Solve the CAPTCHA or complete the login challenge in the viewport below, then click Return Control.
                </span>
              </div>
              <span className="font-semibold text-amber-800 hidden md:inline">
                Zero credentials or CAPTCHAs logged
              </span>
            </div>

            {/* Viewport Area (Simulated Interactive Stream & Sandbox) */}
            <div className="p-6 bg-slate-100 flex-1 overflow-y-auto">
              <div
                ref={viewportRef}
                onMouseMove={e => handlePointerEvent(e, 'mousemove')}
                onClick={e => handlePointerEvent(e, 'click')}
                onTouchMove={e => handlePointerEvent(e, 'touch')}
                className="relative mx-auto max-w-2xl bg-white rounded-xl border-2 border-slate-300 shadow-md p-6 min-h-[340px] flex flex-col justify-center items-center select-none"
              >
                {/* Official domain bar */}
                <div className="absolute top-0 inset-x-0 bg-slate-100 border-b border-slate-200 px-4 py-2 rounded-t-xl flex items-center justify-between text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="font-mono font-medium">https://auth.greenhouse.io/turnstile/challenge</span>
                  </div>
                  <span className="text-[11px] text-slate-400">Isolated Browser Context #1</span>
                </div>

                {/* Challenge content */}
                <div className="mt-8 text-center max-w-md space-y-4">
                  <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto">
                    <Shield className="w-6 h-6" />
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">Verification Challenge</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Employer requires human verification before accepting application packet.
                    </p>
                  </div>

                  {/* Cloudflare/Turnstile Style Box */}
                  <div className="p-4 border border-slate-300 rounded-lg bg-slate-50 flex items-center justify-between gap-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={captchaSolvedLocally}
                        onChange={e => {
                          setCaptchaSolvedLocally(e.target.checked);
                          setIsSolvingCaptcha(false);
                        }}
                        className="w-6 h-6 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                      <span className="text-sm font-semibold text-slate-800">
                        Verify you are human
                      </span>
                    </label>

                    <div className="text-[10px] text-slate-400 font-mono text-right">
                      <div>Cloudflare Turnstile</div>
                      <div>Protected Challenge</div>
                    </div>
                  </div>

                  {captchaSolvedLocally && (
                    <div className="p-2.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Verification challenge solved! You can now return control.</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Note on Remote Service */}
              <div className="mt-4 text-center text-xs text-slate-500">
                <span>Deployable remote worker daemon available in <code>/worker/browser-worker.ts</code>.</span>
              </div>
            </div>

            {/* Modal Controls */}
            <div className="p-4 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleKeepPaused}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-medium transition-colors"
                >
                  Keep Paused & Exit
                </button>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleReturnControl(false)}
                  className="px-3.5 py-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 text-xs font-medium transition-colors"
                >
                  Return Control (Unresolved)
                </button>

                <button
                  onClick={() => handleReturnControl(captchaSolvedLocally)}
                  className={`px-5 py-2 rounded-lg font-semibold text-xs transition-colors shadow-xs flex items-center gap-2 ${
                    captchaSolvedLocally
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-slate-900 hover:bg-slate-800 text-white'
                  }`}
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Return Control to AI & Resume</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
