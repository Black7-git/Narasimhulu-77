import React, { useState } from 'react';
import {
  ArrowRight,
  Lock,
  Mail,
  User as UserIcon,
  CheckCircle2,
  AlertCircle,
  Check,
  Building2,
  ShieldCheck,
  GraduationCap,
  KeyRound,
  RefreshCw,
} from 'lucide-react';
import { User, UserRole } from '../types';

export const ADMIN_OWNER_EMAIL = 'narasimhulu0707@gmail.com';

interface AuthViewProps {
  onAuthenticated: (user: User, token: string) => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onAuthenticated }) => {
  const [mode, setMode] = useState<'login' | 'register' | 'recover'>('login');
  const [selectedRole, setSelectedRole] = useState<UserRole>('student');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [dispatchedOtp, setDispatchedOtp] = useState<string | null>(null);
  const [otpSending, setOtpSending] = useState(false);
  const [organizationName, setOrganizationName] = useState('');
  const [timezone] = useState('Asia/Kolkata');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Google Sign-In + Gmail OTP Verification + Sign-Up State
  const [googleModalOpen, setGoogleModalOpen] = useState(false);
  const [googleEmail, setGoogleEmail] = useState(ADMIN_OWNER_EMAIL);
  const [googleName, setGoogleName] = useState('Narasimhulu');
  const [googlePassword, setGooglePassword] = useState('Narasimhulu@2026');
  const [googleOtpCode, setGoogleOtpCode] = useState('');
  const [googleDispatchedOtp, setGoogleDispatchedOtp] = useState<string | null>(null);
  const [googleOtpSending, setGoogleOtpSending] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);

  const handleSelectRole = (role: UserRole) => {
    setSelectedRole(role);
    setError(null);
    if (role === 'admin') {
      setEmail(ADMIN_OWNER_EMAIL);
      setGoogleEmail(ADMIN_OWNER_EMAIL);
    }
  };

  const handleSendGmailOtp = async () => {
    setError(null);
    if (!email || !email.includes('@')) {
      setError('Please enter your Gmail address first to receive the 6-digit verification OTP.');
      return;
    }
    if (selectedRole === 'admin' && email.trim().toLowerCase() !== ADMIN_OWNER_EMAIL) {
      setError(`Access Restricted: Administrator Panel access is exclusively granted to ${ADMIN_OWNER_EMAIL}.`);
      return;
    }
    setOtpSending(true);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, purpose: mode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send Gmail OTP.');
      setDispatchedOtp(data.otpCode);
      setOtpCode(data.otpCode);
      setSuccessBanner(
        `Gmail OTP sent to ${data.email} and auto-read from inbox: ${data.otpCode}`
      );
    } catch (err: any) {
      setError(err.message || 'Could not dispatch Gmail OTP.');
    } finally {
      setOtpSending(false);
    }
  };

  const handleSendGoogleGmailOtp = async () => {
    setGoogleError(null);
    if (!googleEmail || !googleEmail.includes('@')) {
      setGoogleError('Please enter your Google / Gmail address first.');
      return;
    }
    if (selectedRole === 'admin' && googleEmail.trim().toLowerCase() !== ADMIN_OWNER_EMAIL) {
      setGoogleError(`Access Restricted: Administrator Panel access is exclusively granted to ${ADMIN_OWNER_EMAIL}.`);
      return;
    }
    setGoogleOtpSending(true);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: googleEmail, purpose: 'google_signup_verify' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send Google Gmail OTP.');
      setGoogleDispatchedOtp(data.otpCode);
      setGoogleOtpCode(data.otpCode);
    } catch (err: any) {
      setGoogleError(err.message || 'Failed to send Gmail OTP.');
    } finally {
      setGoogleOtpSending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessBanner(null);

    if (selectedRole === 'admin' && email.trim().toLowerCase() !== ADMIN_OWNER_EMAIL) {
      setError(`Access Restricted: Administrator Panel access is exclusively granted to ${ADMIN_OWNER_EMAIL}.`);
      return;
    }

    setLoading(true);

    try {
      if (mode === 'recover') {
        const res = await fetch('/api/auth/recover', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Could not process recovery request.');
        setSuccessBanner(data.message);
        setLoading(false);
        return;
      }

      if (mode === 'register') {
        if (password !== confirmPassword) {
          throw new Error('Password and Confirm Password do not match.');
        }
        if (!otpCode || otpCode.trim().length < 4) {
          throw new Error(
            'Please click "Send Gmail OTP" to verify your Gmail address before creating your account.'
          );
        }

        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            email,
            password,
            confirmPassword,
            otpCode,
            timezone,
            role: selectedRole,
            organizationName,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Account registration failed.');
        }

        // After creating account with Gmail OTP + Password, switch to Login mode with Gmail & Password ready
        setMode('login');
        setDispatchedOtp(null);
        setOtpCode('');
        setSuccessBanner(
          `Account created & verified via Gmail OTP for ${email.trim().toLowerCase()}! Sign in below using your Gmail and password.`
        );
        setLoading(false);
        return;
      }

      // Login mode: Authenticate using Gmail + Password (+ optional OTP)
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          otpCode: otpCode || undefined,
          role: selectedRole,
          organizationName,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed.');
      }

      onAuthenticated(data.user, data.token);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGoogleError(null);

    if (selectedRole === 'admin' && googleEmail.trim().toLowerCase() !== ADMIN_OWNER_EMAIL) {
      setGoogleError(`Access Restricted: Administrator Panel access is exclusively granted to ${ADMIN_OWNER_EMAIL}.`);
      return;
    }

    if (!googleOtpCode || googleOtpCode.trim().length < 4) {
      setGoogleError(
        'Please click "Send Gmail OTP" first to verify your Gmail address and complete Google Sign-Up.'
      );
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: googleEmail,
          name: googleName,
          password: googlePassword,
          otpCode: googleOtpCode,
          role: selectedRole,
          organizationName:
            organizationName ||
            (selectedRole === 'organization' ? 'IIT Madras Career Placement Cell' : undefined),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Google Sign-In & Gmail verification failed.');
      setGoogleModalOpen(false);
      onAuthenticated(data.user, data.token);
    } catch (err: any) {
      setGoogleError(err.message || 'Google Sign-In error.');
    } finally {
      setLoading(false);
    }
  };

  const roleCards: Array<{
    id: UserRole;
    title: string;
    subtitle: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    {
      id: 'student',
      title: 'Student / Candidate',
      subtitle: 'Auto-apply & JD Tailor',
      icon: GraduationCap,
    },
    {
      id: 'organization',
      title: 'Organization / College',
      subtitle: 'Track students & minutes',
      icon: Building2,
    },
    {
      id: 'admin',
      title: 'Administrator',
      subtitle: 'narasimhulu0707@gmail.com only',
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="min-h-screen bg-[#F4F6FB] text-slate-900 flex flex-col lg:flex-row">
      {/* Left Column: AutoApply Navy & Royal Blue Brand Showcase */}
      <div className="lg:w-[46%] bg-[#0F172A] text-white p-8 sm:p-12 lg:p-14 flex flex-col justify-between relative overflow-hidden">
        <div
          className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[#1D58D8]/30 blur-2xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-28 -left-20 w-80 h-80 rounded-full bg-[#2563EB]/20 blur-xl"
          aria-hidden="true"
        />

        <div className="relative z-10">
          {/* AutoApply Brand Logo */}
          <div className="flex items-center gap-3.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#2563EB] text-white shadow-md">
              <Check className="w-5 h-5 stroke-[3]" />
            </div>
            <span className="font-extrabold text-2xl text-white tracking-tight">
              AutoApply
            </span>
          </div>

          {/* Hero Card Preview */}
          <div className="mt-10 rounded-3xl bg-[#1D58D8] p-7 text-white shadow-lg relative overflow-hidden">
            <div
              className="pointer-events-none absolute -right-10 -bottom-16 w-56 h-56 rounded-full bg-[#2563EB]/70"
              aria-hidden="true"
            />
            <div className="relative z-10">
              <div className="text-xs font-semibold uppercase tracking-wider text-blue-100">
                10-Minute Autonomous Career Portal &amp; Gmail Engine
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1.5 leading-tight">
                Audit 41+ career portals &amp; Gmail every 10 mins with JD Resume Tailoring
              </h1>
              <p className="text-sm text-blue-100 mt-3 leading-relaxed">
                Verify with Gmail OTP, auto-connect all 41+ hiring portals with the same Gmail ID, automatically tailor missing resume keywords to every Job Description, and inspect full post-apply application receipts.
              </p>
            </div>
          </div>

          {/* 3 Panel Highlights */}
          <div className="mt-7 space-y-3.5">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-[#2563EB]/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">1. Student &amp; Candidate Panel + Post-Apply Details</h3>
                <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                  Single-switch &ldquo;Auto-apply is on&rdquo; mode: 10-min Gmail &amp; 41+ portal audit, JD keyword tailoring, and complete post-apply receipts &amp; portal email credentials.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">2. Organization &amp; College Placement Panel</h3>
                <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                  Monitor student application statuses, record placement review minutes, verify student resumes, and approve batch drives.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">3. Administrator Control Panel (Exclusive Access)</h3>
                <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                  Restricted exclusively to <span className="font-mono text-white">{ADMIN_OWNER_EMAIL}</span>. Store, monitor, update, and verify all registered User and Organization details.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 mt-8 pt-5 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
          <span>Production Stage · Gmail OTP Verified · 10-Min Audit</span>
          <span className="font-mono text-slate-300">41+ Career Portals</span>
        </div>
      </div>

      {/* Right Column: Real Login with Gmail + Password + OTP & Create Account */}
      <div className="lg:w-[54%] flex items-center justify-center p-6 sm:p-10 lg:p-14">
        <div className="w-full max-w-lg bg-white rounded-[32px] border border-slate-200/80 p-7 sm:p-9 shadow-sm space-y-5">
          {/* Top Mode Tabs: Sign In / Create Account / Recover */}
          <div className="flex items-center justify-between gap-2">
            <div className="inline-flex p-1 bg-[#F4F6FB] rounded-2xl border border-slate-200/60">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError(null);
                }}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                  mode === 'login'
                    ? 'bg-[#2563EB] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setError(null);
                  setSuccessBanner(null);
                }}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                  mode === 'register'
                    ? 'bg-[#2563EB] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Create Account
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('recover');
                  setError(null);
                  setSuccessBanner(null);
                }}
                className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                  mode === 'recover'
                    ? 'bg-[#2563EB] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Reset Password
              </button>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {mode === 'login' && 'Sign in with Gmail & Password'}
              {mode === 'register' && 'Create Account with Gmail OTP'}
              {mode === 'recover' && 'Reset your account password'}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {mode === 'login' &&
                'Sign in using your verified Gmail address and password to auto-connect all 41+ career portals.'}
              {mode === 'register' &&
                'Create your password and verify your Gmail with a 6-digit OTP code.'}
              {mode === 'recover' &&
                'Enter your registered Gmail address to receive password reset instructions.'}
            </p>
          </div>

          {/* 3-Panel Role Selector */}
          {mode !== 'recover' && (
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2">
                Select Workspace Panel
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {roleCards.map(rc => {
                  const Icon = rc.icon;
                  const active = selectedRole === rc.id;
                  return (
                    <button
                      key={rc.id}
                      type="button"
                      onClick={() => handleSelectRole(rc.id)}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        active
                          ? 'border-[#2563EB] bg-blue-50/70 ring-2 ring-[#2563EB]/15'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <Icon
                          className={`w-4 h-4 ${
                            active ? 'text-[#2563EB]' : 'text-slate-400'
                          }`}
                        />
                        {active && (
                          <Check className="w-3.5 h-3.5 text-[#2563EB]" />
                        )}
                      </div>
                      <div className="font-bold text-xs text-slate-900 mt-1.5">
                        {rc.title}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5 leading-tight truncate">
                        {rc.subtitle}
                      </div>
                    </button>
                  );
                })}
              </div>
              {selectedRole === 'admin' && (
                <div className="mt-2 px-3 py-2 rounded-xl bg-purple-50 border border-purple-200 text-[11px] font-semibold text-purple-900 flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-700 shrink-0" />
                  <span>
                    Admin Panel access is strictly restricted to{' '}
                    <strong className="font-mono">{ADMIN_OWNER_EMAIL}</strong>.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Google Sign-In & Sign-Up Button */}
          {mode !== 'recover' && (
            <div className="space-y-3.5">
              <button
                type="button"
                onClick={() => {
                  setGoogleError(null);
                  setGoogleModalOpen(true);
                }}
                className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-bold text-sm shadow-2xs transition-all flex items-center justify-center gap-3 cursor-pointer"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96z"
                  />
                </svg>
                <span>
                  Sign in with Google (Verify Gmail &amp; Sign Up)
                </span>
              </button>

              <div className="relative flex items-center justify-center">
                <div className="border-t border-slate-200 w-full" />
                <span className="bg-white px-3 text-[11px] font-semibold text-slate-400 shrink-0">
                  or use Gmail &amp; Password
                </span>
                <div className="border-t border-slate-200 w-full" />
              </div>
            </div>
          )}

          {error && (
            <div className="p-3.5 rounded-2xl border border-rose-200 bg-rose-50 text-xs text-rose-800 font-semibold flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successBanner && (
            <div className="p-3.5 rounded-2xl border border-emerald-200 bg-emerald-50 text-xs text-emerald-900 font-semibold flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successBanner}</span>
            </div>
          )}

          {/* Gmail, Password & OTP Verification Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'register' && (
              <div>
                <label htmlFor="auth-name" className="block text-xs font-bold text-slate-700 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
                  <input
                    id="auth-name"
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full pl-11 pr-4 py-2.5 bg-[#F4F6FB] border border-slate-200 rounded-2xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#2563EB] outline-none"
                  />
                </div>
              </div>
            )}

            {selectedRole === 'organization' && mode !== 'recover' && (
              <div>
                <label htmlFor="auth-org" className="block text-xs font-bold text-slate-700 mb-1">
                  College / University / Organization Name
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
                  <input
                    id="auth-org"
                    type="text"
                    value={organizationName}
                    onChange={e => setOrganizationName(e.target.value)}
                    placeholder="e.g. IIT Madras Career Placement Cell"
                    className="w-full pl-11 pr-4 py-2.5 bg-[#F4F6FB] border border-slate-200 rounded-2xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#2563EB] outline-none"
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="auth-email" className="block text-xs font-bold text-slate-700 mb-1">
                Gmail Address (Used for Login &amp; Career Portal Auto-Connect)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
                <input
                  id="auth-email"
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="narasimhulu0707@gmail.com"
                  className="w-full pl-11 pr-4 py-2.5 bg-[#F4F6FB] border border-slate-200 rounded-2xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#2563EB] outline-none"
                />
              </div>
            </div>

            {mode !== 'recover' && (
              <div className={mode === 'register' ? 'grid grid-cols-1 sm:grid-cols-2 gap-3' : ''}>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="auth-password" className="block text-xs font-bold text-slate-700">
                      {mode === 'register' ? 'Create Password' : 'Password'}
                    </label>
                    {mode === 'login' && (
                      <button
                        type="button"
                        onClick={() => setMode('recover')}
                        className="text-xs font-semibold text-[#1D58D8] hover:underline"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
                    <input
                      id="auth-password"
                      type="password"
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder={mode === 'register' ? 'Min 6 characters' : 'Enter your password'}
                      className="w-full pl-11 pr-4 py-2.5 bg-[#F4F6FB] border border-slate-200 rounded-2xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#2563EB] outline-none"
                    />
                  </div>
                </div>

                {mode === 'register' && (
                  <div>
                    <label htmlFor="auth-confirm-password" className="block text-xs font-bold text-slate-700 mb-1">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
                      <input
                        id="auth-confirm-password"
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter password"
                        className="w-full pl-11 pr-4 py-2.5 bg-[#F4F6FB] border border-slate-200 rounded-2xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#2563EB] outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Gmail OTP Verification Row */}
            {mode !== 'recover' && (
              <div className="p-3.5 rounded-2xl bg-[#F4F6FB] border border-slate-200/80 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <label htmlFor="auth-otp" className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-[#2563EB]" />
                    <span>
                      {mode === 'register'
                        ? 'Gmail OTP Verification (Required)'
                        : 'Gmail Verification OTP (Auto-Read Enabled)'}
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={handleSendGmailOtp}
                    disabled={otpSending}
                    className="px-3 py-1.5 rounded-xl bg-[#2563EB] hover:bg-[#1D58D8] text-white font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                  >
                    {otpSending && <RefreshCw className="w-3 h-3 animate-spin" />}
                    <span>{dispatchedOtp ? 'Resend Gmail OTP' : 'Send Gmail OTP'}</span>
                  </button>
                </div>

                <div className="flex items-center gap-2.5">
                  <input
                    id="auth-otp"
                    type="text"
                    required={mode === 'register'}
                    value={otpCode}
                    onChange={e => setOtpCode(e.target.value)}
                    placeholder="Enter 6-digit Gmail OTP code"
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm font-mono tracking-widest text-slate-900 focus:ring-2 focus:ring-[#2563EB] outline-none"
                  />
                  {dispatchedOtp && (
                    <span className="text-xs font-mono font-semibold text-emerald-700 shrink-0">
                      Verified: {dispatchedOtp}
                    </span>
                  )}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-6 bg-[#1D58D8] hover:bg-[#1E40AF] disabled:opacity-60 text-white font-bold text-sm rounded-2xl shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>
                {loading
                  ? 'Verifying...'
                  : mode === 'login'
                  ? `Sign In to ${
                      selectedRole === 'admin'
                        ? 'Admin Panel'
                        : selectedRole === 'organization'
                        ? 'Organization & College Panel'
                        : 'Student / Candidate Panel'
                    }`
                  : mode === 'register'
                  ? 'Verify Gmail OTP & Create Account'
                  : 'Send Password Reset Link'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Bottom Toggle Link */}
          <div className="pt-1 text-center text-xs text-slate-500">
            {mode === 'login' ? (
              <span>
                Don&apos;t have an account yet?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setError(null);
                    setSuccessBanner(null);
                  }}
                  className="font-bold text-[#1D58D8] hover:underline cursor-pointer"
                >
                  Create an account with Gmail OTP
                </button>
              </span>
            ) : (
              <span>
                Already created your account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError(null);
                  }}
                  className="font-bold text-[#1D58D8] hover:underline cursor-pointer"
                >
                  Sign in with Gmail &amp; Password
                </button>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Interactive Google Sign-In + Gmail OTP Verification + Sign-Up Dialog */}
      {googleModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-7 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-2.5">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96z"
                  />
                </svg>
                <span className="font-bold text-sm text-slate-800">
                  Google Sign-In · Verify Gmail &amp; Sign Up
                </span>
              </div>
              <button
                type="button"
                onClick={() => setGoogleModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div>
              <h3 className="text-lg font-extrabold text-slate-900">
                Verify Gmail &amp; Complete Sign-Up
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Verify your Google Gmail with a 6-digit OTP to register your account in <strong>AutoApply ({selectedRole.toUpperCase()} PANEL)</strong> and auto-connect all 41+ career portals.
              </p>
            </div>

            {googleError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{googleError}</span>
              </div>
            )}

            <form onSubmit={handleGoogleSignInSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Account Holder Full Name
                </label>
                <input
                  type="text"
                  required
                  value={googleName}
                  onChange={e => setGoogleName(e.target.value)}
                  placeholder="Your Name"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm text-slate-900 focus:ring-2 focus:ring-[#2563EB] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Google / Gmail Address
                </label>
                <input
                  type="email"
                  required
                  value={googleEmail}
                  onChange={e => setGoogleEmail(e.target.value)}
                  placeholder="narasimhulu0707@gmail.com"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-mono text-slate-900 focus:ring-2 focus:ring-[#2563EB] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Account Password (for Direct Login &amp; Career Portal Sync)
                </label>
                <input
                  type="password"
                  required
                  value={googlePassword}
                  onChange={e => setGooglePassword(e.target.value)}
                  placeholder="Create or enter account password"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm text-slate-900 focus:ring-2 focus:ring-[#2563EB] outline-none"
                />
              </div>

              <div className="p-3 rounded-2xl bg-[#F4F6FB] border border-slate-200 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-[#2563EB]" />
                    <span>Verify Google Gmail OTP</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleSendGoogleGmailOtp}
                    disabled={googleOtpSending}
                    className="px-3 py-1.5 rounded-xl bg-[#2563EB] hover:bg-[#1D58D8] text-white font-bold text-xs cursor-pointer flex items-center gap-1.5"
                  >
                    {googleOtpSending && <RefreshCw className="w-3 h-3 animate-spin" />}
                    <span>{googleDispatchedOtp ? 'Resend Gmail OTP' : 'Send Gmail OTP'}</span>
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    required
                    value={googleOtpCode}
                    onChange={e => setGoogleOtpCode(e.target.value)}
                    placeholder="Enter 6-digit Gmail OTP"
                    className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-sm font-mono tracking-widest text-slate-900 outline-none"
                  />
                  {googleDispatchedOtp && (
                    <span className="text-xs font-mono font-bold text-emerald-700 shrink-0">
                      OTP: {googleDispatchedOtp}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setGoogleModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl bg-[#1D58D8] hover:bg-[#1E40AF] text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  {loading
                    ? 'Verifying & Signing Up...'
                    : `Verify Gmail & Sign Up as ${googleName || 'User'}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
