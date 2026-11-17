'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  X,
} from 'lucide-react';
import PublicHeader from '@/components/layout/PublicHeader';
import Footer from '@/components/layout/Footer';
import { useApp } from '@/lib/context/AppContext';

type LoginErrorKind =
  | 'invalid'
  | 'pending'
  | 'rejected'
  | 'suspended'
  | 'deactivated'
  | 'generic'
  | null;

const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@icchastore.com';
const RESET_OTP_TTL_MS = 5 * 60 * 1000;
const RESET_EXPIRY_STORAGE_KEY = 'iccha-password-reset-expiry';
const RESET_EMAIL_STORAGE_KEY = 'iccha-password-reset-email';
const RESET_OTP_STORAGE_KEY = 'iccha-password-reset-otp';

export default function LoginPage() {
  const router = useRouter();
  const { addToast } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [errorKind, setErrorKind] = useState<LoginErrorKind>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [identifier, setIdentifier] = useState('');
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [resetStep, setResetStep] = useState<'request' | 'reset'>('request');
  const [resetEmail, setResetEmail] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [resetBusy, setResetBusy] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [resetExpiresAt, setResetExpiresAt] = useState<number | null>(null);
  const [resetSecondsLeft, setResetSecondsLeft] = useState(0);

  useEffect(() => {
    const storedExpiry = Number(window.localStorage.getItem(RESET_EXPIRY_STORAGE_KEY));
    if (storedExpiry && storedExpiry <= Date.now()) {
      window.localStorage.removeItem(RESET_EXPIRY_STORAGE_KEY);
      window.localStorage.removeItem(RESET_EMAIL_STORAGE_KEY);
      window.localStorage.removeItem(RESET_OTP_STORAGE_KEY);
    } else if (storedExpiry) {
      const storedEmail = window.localStorage.getItem(RESET_EMAIL_STORAGE_KEY) || '';
      if (storedEmail) {
        setResetEmail(storedEmail);
        setResetOtp(window.localStorage.getItem(RESET_OTP_STORAGE_KEY) || '');
        setResetExpiresAt(storedExpiry);
        setResetStep('reset');
      }
    }
  }, []);

  useEffect(() => {
    if (!resetExpiresAt) return;

    const updateCountdown = () => {
      const remaining = Math.max(0, Math.ceil((resetExpiresAt - Date.now()) / 1000));
      setResetSecondsLeft(remaining);
      if (remaining === 0) {
        window.localStorage.removeItem(RESET_EXPIRY_STORAGE_KEY);
        window.localStorage.removeItem(RESET_EMAIL_STORAGE_KEY);
        window.localStorage.removeItem(RESET_OTP_STORAGE_KEY);
        setResetExpiresAt(null);
        setResetOtp('');
        setResetStep('request');
        setResetMessage('Your code expired. Request a new one to continue.');
      }
    };

    updateCountdown();
    const timer = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(timer);
  }, [resetExpiresAt]);

  const openForgotPassword = () => {
    if (!resetEmail) setResetEmail(identifier.includes('@') ? identifier.trim() : '');
    setResetError('');
    setResetMessage('');
    setIsForgotOpen(true);
  };

  const closeForgotPassword = () => {
    window.localStorage.removeItem(RESET_EXPIRY_STORAGE_KEY);
    window.localStorage.removeItem(RESET_EMAIL_STORAGE_KEY);
    window.localStorage.removeItem(RESET_OTP_STORAGE_KEY);
    setResetStep('request');
    setResetEmail('');
    setResetOtp('');
    setNewPassword('');
    setConfirmNewPassword('');
    setResetExpiresAt(null);
    setResetSecondsLeft(0);
    setResetError('');
    setResetMessage('');
    setIsForgotOpen(false);
    void fetch('/api/auth/password-reset/request', { method: 'DELETE' }).catch(() => {
      // The browser state is cleared immediately; an unreachable server challenge expires after five minutes.
    });
  };

  const requestResetOtp = async (event: React.FormEvent) => {
    event.preventDefault();
    setResetBusy(true);
    setResetError('');
    setResetMessage('');

    try {
      const normalizedEmail = resetEmail.trim().toLowerCase();
      if (resetExpiresAt && resetExpiresAt > Date.now() && normalizedEmail === resetEmail.toLowerCase()) {
        setResetError('A code was already requested for this email. Check your inbox or use another email.');
        return;
      }
      const response = await fetch('/api/auth/password-reset/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Could not send the reset code.');
      }

      const expiresAt = Date.now() + RESET_OTP_TTL_MS;
      window.localStorage.setItem(RESET_EXPIRY_STORAGE_KEY, String(expiresAt));
      window.localStorage.setItem(RESET_EMAIL_STORAGE_KEY, normalizedEmail);
      window.localStorage.removeItem(RESET_OTP_STORAGE_KEY);
      setResetEmail(normalizedEmail);
      setResetExpiresAt(expiresAt);
      setResetStep('reset');
      setResetMessage(result.message || 'If your account exists, a reset code has been sent.');
    } catch (error) {
      setResetError(error instanceof Error ? error.message : 'Could not send the reset code.');
    } finally {
      setResetBusy(false);
    }
  };

  const submitPasswordReset = async (event: React.FormEvent) => {
    event.preventDefault();
    setResetError('');

    if (newPassword !== confirmNewPassword) {
      setResetError('The passwords do not match.');
      return;
    }
    if (resetExpiresAt && resetExpiresAt <= Date.now()) {
      setResetError('Your code expired. Request a new one to continue.');
      setResetStep('request');
      setResetOtp('');
      window.localStorage.removeItem(RESET_EXPIRY_STORAGE_KEY);
      window.localStorage.removeItem(RESET_EMAIL_STORAGE_KEY);
      window.localStorage.removeItem(RESET_OTP_STORAGE_KEY);
      return;
    }

    setResetBusy(true);
    try {
      const otpFromStorage = window.localStorage.getItem(RESET_OTP_STORAGE_KEY) || resetOtp;
      const response = await fetch('/api/auth/password-reset/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: resetEmail.trim().toLowerCase(),
          otp: otpFromStorage,
          password: newPassword,
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Could not reset your password.');
      }

      window.localStorage.removeItem(RESET_EXPIRY_STORAGE_KEY);
      window.localStorage.removeItem(RESET_EMAIL_STORAGE_KEY);
      window.localStorage.removeItem(RESET_OTP_STORAGE_KEY);
      setIsForgotOpen(false);
      setResetStep('request');
      setResetExpiresAt(null);
      setResetSecondsLeft(0);
      setResetEmail('');
      setPassword('');
      setResetOtp('');
      setNewPassword('');
      setConfirmNewPassword('');
      addToast({ type: 'success', title: 'Password updated', message: result.message });
    } catch (error) {
      setResetError(error instanceof Error ? error.message : 'Could not reset your password.');
    } finally {
      setResetBusy(false);
    }
  };

  const errorBanner: Record<Exclude<LoginErrorKind, null>, { title: string; tone: string }> = {
    invalid: { title: 'Invalid email or password', tone: 'bg-rose-50 border-rose-200 text-rose-800' },
    pending: { title: 'Application awaiting admin approval', tone: 'bg-amber-50 border-amber-200 text-amber-800' },
    rejected: { title: 'Your account has been rejected', tone: 'bg-rose-50 border-rose-200 text-rose-800' },
    suspended: { title: 'Account suspended', tone: 'bg-stone-100 border-stone-300 text-stone-800' },
    deactivated: {
      title: 'Account deactivated',
      tone: 'bg-amber-50 border-amber-200 text-amber-900',
    },
    generic: { title: 'Something went wrong', tone: 'bg-rose-50 border-rose-200 text-rose-800' },
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setErrorKind(null);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        if (result.error === 'PENDING_APPROVAL') {
          setErrorKind('pending');
          setErrorMessage(result.message || null);
        } else if (result.error === 'REJECTED') {
          setErrorKind('rejected');
          setErrorMessage(null); // banner renders its own fixed message + support link below
        } else if (result.error === 'SUSPENDED') {
          setErrorKind('suspended');
          setErrorMessage(result.message || null);
        } else if (result.error === 'DEACTIVATED') {
          setErrorKind('deactivated');
          setErrorMessage(result.message || null);
        } else {
          setErrorKind('invalid');
          setErrorMessage(result.message || null);
        }
        setIsLoggingIn(false);
        return;
      }

      addToast({
        type: 'success',
        title: 'Logged in',
        message: `Welcome back, ${result.data.name}.`
      });

      // Check if redirect URL exists in query params
      const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      const nextUrl = searchParams?.get('next') || searchParams?.get('redirectTo');

      if (nextUrl && nextUrl.startsWith('/')) {
        router.push(nextUrl);
      } else if (['ADMIN', 'SUPER_ADMIN', 'OPERATIONS_MANAGER'].includes(result.data.role)) {
        router.push('/admin');
      } else if (result.data.role === 'VENDOR') {
        router.push('/admin/products'); // vendor's own product management page, not yet built
      } else {
        router.push('/catalogue');
      }
    } catch (err) {
      console.error(err);
      setErrorKind('generic');
      setErrorMessage('Something went wrong. Please try again.');
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <PublicHeader />

      <main className="flex-1 py-12 bg-[#faf8f5] flex items-center justify-center">
        <div className="max-w-md w-full mx-auto px-4">

          {/* Header */}
          <div className="text-center mb-8 space-y-2">
            <img
              src="/brand/iccha-logo-dark.png"
              alt="Iccha - The Women's Label"
              className="h-40 w-auto mx-auto"
            />
            <h1 className="font-serif text-2xl font-bold text-stone-900">
              Wholesaler Secure Login
            </h1>
            <p className="text-xs text-stone-500">
              Sign in with your registered email to access wholesale pricing.
            </p>
          </div>

          {/* Login Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-6">

            {errorKind && (
              <div className={`p-3.5 rounded-2xl border flex items-start gap-2.5 text-xs ${errorBanner[errorKind].tone}`}>
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div>
                  <strong className="block">{errorBanner[errorKind].title}</strong>

                  {errorKind === 'rejected' && (
                    <span className="block mt-0.5">
                      For further query contact us at{' '}
                      <a href={`mailto:${SUPPORT_EMAIL}`} className="underline font-semibold">
                        {SUPPORT_EMAIL}
                      </a>
                      .
                    </span>
                  )}

                  {errorKind === 'suspended' && (
                    <span className="block mt-0.5">
                      For further query contact us at{' '}
                      <a href={`mailto:${SUPPORT_EMAIL}`} className="underline font-semibold">
                        {SUPPORT_EMAIL}
                      </a>
                      .
                    </span>
                  )}

                  {errorKind === 'deactivated' && (
                    <div className="mt-2 space-y-2">
                      <span className="block">
                        {errorMessage ||
                          'Your retailer account has been deactivated due to inactivity.'}
                      </span>

                      <Link
                        href="/retailer/deactivated"
                        className="inline-block font-semibold underline"
                      >
                        Request Reactivation &rarr;
                      </Link>
                    </div>
                  )}

                  {errorMessage && errorKind !== 'rejected' && errorKind !== 'suspended' && errorKind !== 'deactivated' && (
                    <span className="block mt-0.5">{errorMessage}</span>
                  )}

                  {errorKind === 'pending' && (
                    <Link href={`/application-status?email=${encodeURIComponent(email)}`} className="underline font-semibold block mt-1">
                      Check application status &rarr;
                    </Link>
                  )}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Registered Email Address Or Phone Number *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="Email or phone number"
                    value={identifier}
                    onChange={e => setIdentifier(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:border-rose-900 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    className="w-full pl-9 pr-10 py-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:border-rose-900 font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(prev => !prev)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showPassword}
                    className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-700 focus:outline-none focus-visible:text-rose-900 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end -mt-1">
                <button
                  type="button"
                  onClick={openForgotPassword}
                  className="font-semibold text-[#831843] hover:underline"
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full py-3 bg-gradient-to-r from-[#831843] to-[#9a3412] hover:from-rose-900 hover:to-amber-900 text-white font-bold rounded-xl shadow transition flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <span>{isLoggingIn ? 'Verifying...' : 'Sign In to Wholesale Portal'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="pt-2 border-t border-stone-100 text-center text-xs text-stone-500 space-y-1">
              <div>
                Not a registered retailer yet?{' '}
                <Link href="/register" className="font-bold text-[#831843] hover:underline">
                  Apply for Wholesaler Access
                </Link>
              </div>
              <div>
                Already applied?{' '}
                <Link href="/application-status" className="font-bold text-[#831843] hover:underline">
                  Check Application Status
                </Link>
              </div>
            </div>

            <div className="flex items-center justify-center gap-1.5 text-[10px] text-stone-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Encrypted 256-bit session authentication</span>
            </div>

          </div>

        </div>
      </main>

      {isForgotOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-950/55 backdrop-blur-sm p-3 sm:p-5"
          onClick={closeForgotPassword}
          role="dialog"
          aria-modal="true"
          aria-labelledby="forgot-password-title"
        >
          <section
            className="w-full max-w-md rounded-3xl border border-white/70 bg-white p-5 sm:p-7 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#831843]">
                  Account recovery
                </p>
                <h2 id="forgot-password-title" className="mt-1 font-serif text-2xl font-bold text-stone-900">
                  {resetStep === 'request' ? 'Forgot password?' : 'Set a new password'}
                </h2>
                <p className="mt-1 text-xs leading-relaxed text-stone-500">
                  {resetStep === 'request'
                    ? 'We will send a one-time code to your registered email address.'
                    : `Enter the 6-digit code sent to ${resetEmail}.`}
                </p>
              </div>
              <button
                type="button"
                onClick={closeForgotPassword}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-stone-100 text-stone-500 hover:bg-stone-200 hover:text-stone-900"
                aria-label="Close password recovery"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {resetError && (
              <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs text-rose-800">
                {resetError}
              </div>
            )}
            {resetMessage && (
              <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs text-emerald-800">
                {resetMessage}
              </div>
            )}

            {resetStep === 'request' ? (
              <form onSubmit={requestResetOtp} className="space-y-4">
                <div>
                  <label htmlFor="reset-email" className="mb-1 block text-xs font-semibold text-stone-700">
                    Registered email address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-stone-400" />
                    <input
                      id="reset-email"
                      type="email"
                      autoComplete="email"
                      required
                      maxLength={254}
                      value={resetEmail}
                      onChange={(event) => setResetEmail(event.target.value)}
                      placeholder="you@example.com"
                      className="w-full rounded-xl border border-stone-300 bg-stone-50 py-2.5 pl-9 pr-3 text-sm font-medium outline-none focus:border-rose-900"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={resetBusy}
                  className="w-full rounded-xl bg-gradient-to-r from-[#831843] to-[#9a3412] py-3 text-sm font-bold text-white shadow transition disabled:opacity-60"
                >
                  {resetBusy ? 'Sending code…' : 'Send verification code'}
                </button>
              </form>
            ) : (
              <form onSubmit={submitPasswordReset} className="space-y-4">
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
                  Code expires in {Math.floor(resetSecondsLeft / 60)}:{String(resetSecondsLeft % 60).padStart(2, '0')}.
                </div>
                <div>
                  <label htmlFor="reset-otp" className="mb-1 block text-xs font-semibold text-stone-700">
                    Verification code
                  </label>
                  <input
                    id="reset-otp"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    required
                    value={resetOtp}
                    onChange={(event) => {
                      const value = event.target.value.replace(/\D/g, '').slice(0, 6);
                      setResetOtp(value);
                      if (value) window.localStorage.setItem(RESET_OTP_STORAGE_KEY, value);
                      else window.localStorage.removeItem(RESET_OTP_STORAGE_KEY);
                    }}
                    placeholder="6-digit code"
                    className="w-full rounded-xl border border-stone-300 bg-stone-50 px-3 py-2.5 text-center text-lg font-bold tracking-[0.4em] outline-none focus:border-rose-900"
                  />
                </div>
                <div>
                  <label htmlFor="new-password" className="mb-1 block text-xs font-semibold text-stone-700">
                    New password
                  </label>
                  <input
                    id="new-password"
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    maxLength={128}
                    required
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full rounded-xl border border-stone-300 bg-stone-50 px-3 py-2.5 text-sm outline-none focus:border-rose-900"
                  />
                </div>
                <div>
                  <label htmlFor="confirm-new-password" className="mb-1 block text-xs font-semibold text-stone-700">
                    Confirm new password
                  </label>
                  <input
                    id="confirm-new-password"
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    maxLength={128}
                    required
                    value={confirmNewPassword}
                    onChange={(event) => setConfirmNewPassword(event.target.value)}
                    placeholder="Enter the password again"
                    className="w-full rounded-xl border border-stone-300 bg-stone-50 px-3 py-2.5 text-sm outline-none focus:border-rose-900"
                  />
                </div>
                <button
                  type="submit"
                  disabled={resetBusy || resetSecondsLeft <= 0}
                  className="w-full rounded-xl bg-gradient-to-r from-[#831843] to-[#9a3412] py-3 text-sm font-bold text-white shadow transition disabled:opacity-60"
                >
                  {resetBusy ? 'Updating password…' : 'Verify code and update password'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setResetStep('request');
                    setResetError('');
                    setResetMessage('Enter an email address to request a code.');
                  }}
                  className="w-full py-1 text-xs font-semibold text-[#831843] hover:underline"
                >
                  Use a different email
                </button>
              </form>
            )}
          </section>
        </div>
      )}

      <Footer />
    </div>
  );
}
