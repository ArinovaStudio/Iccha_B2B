'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Menu,
  X,
  Sparkles,
  Lock,
  ChevronRight,
  LayoutDashboard
} from 'lucide-react';

type SessionInfo = { role: string; email: string; retailerStatus?: string } | null;

// Where each role lands after login (mirrors app/login/page.tsx)
function getDashboardHref(session: NonNullable<SessionInfo>) {
  if (session.role === 'RETAILER') {
    return session.retailerStatus === 'APPROVED' || !session.retailerStatus
      ? '/retailer'
      : `/application-status?email=${encodeURIComponent(session.email)}`;
  }
  if (session.role === 'VENDOR') return '/admin/products';
  return '/admin';
}

export default function PublicHeader() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [session, setSession] = useState<SessionInfo>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/auth/me', { cache: 'no-store' })
      .then((res) => res.json())
      .then((json) => {
        if (!cancelled && json.success) {
          setSession({
            role: json.data.role,
            email: json.data.email,
            retailerStatus: json.data.retailerStatus,
          });
        }
      })
      .catch(() => { })
      .finally(() => {
        if (!cancelled) setAuthChecked(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const dashboardHref = session ? getDashboardHref(session) : null;

  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'Categories', href: '/categories' },
    { label: 'About IcchaStore', href: '/about' },
    { label: 'Contact', href: '/contact' }
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#f9f7f2]/95 backdrop-blur-md border-b border-black/10 transition-all">
      {/* Main Header Bar — logo, nav, and the two primary CTAs, all on one line */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">

          {/* Brand Logo */}
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 shrink-0" aria-label="Iccha - The Women's Label">
            <img
              src="/brand/iccha-symbol-dark.png"
              alt=""
              className="h-12 w-auto"
            />
            <div className="leading-none">
              <span className="font-serif text-[26px] tracking-[0.12em] text-[#1a1a1a] block">
                ICCHA
              </span>
              <span className="text-[9px] tracking-[0.3em] uppercase text-[var(--text-subtle)] font-semibold whitespace-nowrap block mt-1.5">
                The Women&apos;s Label
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6 text-[11px] font-bold uppercase tracking-[0.12em] text-[#1a1a1a]">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`whitespace-nowrap transition-all hover:opacity-100 py-1 border-b-2 ${isActive ? 'border-black opacity-100' : 'border-transparent opacity-50 hover:border-black/30'
                    }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Desktop CTAs — Login + Apply Access, now living in the main bar */}
          <div className={`hidden lg:flex items-center gap-3 shrink-0 transition-opacity ${authChecked ? 'opacity-100' : 'opacity-0'}`}>
            {dashboardHref ? (
              <Link
                href={dashboardHref}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[#f9f7f2] bg-[#1a1a1a] hover:bg-black shadow-sm transition-colors whitespace-nowrap"
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-[var(--brand-accent)]" />
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[#1a1a1a] border border-black/15 hover:border-black/40 hover:bg-black/[0.03] transition-colors whitespace-nowrap"
                >
                  <Lock className="w-3.5 h-3.5" />
                  Login
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[#f9f7f2] bg-[#1a1a1a] hover:bg-black shadow-sm transition-colors whitespace-nowrap"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[var(--brand-accent)]" />
                  Apply Access
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 lg:hidden text-stone-800 hover:bg-black/5 focus:outline-none shrink-0"
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-black/10 bg-[#f9f7f2] px-6 pt-5 pb-8 space-y-4 shadow-xl">
          <div className="flex flex-col space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between py-2 text-xs font-bold uppercase tracking-[0.2em] border-b border-black/5 ${pathname === link.href ? 'text-[#1a1a1a] font-bold' : 'text-stone-600'
                  }`}
              >
                <span>{link.label}</span>
                <ChevronRight className="w-4 h-4 text-stone-400" />
              </Link>
            ))}
          </div>

          <div className="pt-4 flex flex-col gap-3">
            {dashboardHref ? (
              <Link
                href={dashboardHref}
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-3 px-4 bg-[#1a1a1a] text-[#f9f7f2] font-bold uppercase text-[10px] tracking-[0.25em] shadow flex items-center justify-center gap-2"
              >
                <LayoutDashboard className="w-4 h-4 text-[var(--brand-accent)]" />
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-3 px-4 bg-[#1a1a1a] text-[#f9f7f2] font-bold uppercase text-[10px] tracking-[0.25em] shadow flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-[var(--brand-accent)]" />
                  Apply for Wholesale Access
                </Link>
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-3 px-4 border border-black/20 text-[#1a1a1a] font-bold uppercase text-[10px] tracking-[0.2em] hover:bg-black/5"
                >
                  Retailer Login
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}