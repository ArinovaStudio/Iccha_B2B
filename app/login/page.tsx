'use client';

import React, { useState } from 'react';
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

      // Route by role — staff go to the admin console, retailers to their catalogue
      if (['ADMIN', 'SUPER_ADMIN', 'OPERATIONS_MANAGER'].includes(result.data.role)) {
        router.push('/admin');
      } else if (result.data.role === 'VENDOR') {
        router.push('/admin/products'); // vendor's own product management page, not yet built
      } else {
        router.push('/retailer/catalogue');
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
              Retailer Secure Login
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
                  Apply for Retailer Access
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

      <Footer />
    </div>
  );
}