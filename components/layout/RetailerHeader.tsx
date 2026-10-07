'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ShoppingBag,
  FileCheck2,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  Package,
  ChevronDown,
  Layers,
  PhoneCall,
  LayoutDashboard,
  UserCircle,
  CreditCard,
  type LucideIcon,
} from 'lucide-react';
import { useApp } from '@/lib/context/AppContext';

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

interface Account {
  businessName: string | null;
  name: string | null;
  email: string | null;
  gstin: string | null;
}

const navItems: NavItem[] = [
  { label: 'Catalogue', href: '/retailer/catalogue', icon: Layers },
  { label: 'Categories', href: '/categories', icon: Package },
  { label: 'Orders', href: '/retailer/orders', icon: FileCheck2 },
  { label: 'Sample Calls', href: '/retailer/sample-call-requests', icon: PhoneCall },
  // { label: 'Estimates', href: '/retailer/estimates', icon: FileText },
];

const accountLinks: NavItem[] = [
  { label: 'Dashboard', href: '/retailer', icon: LayoutDashboard },
  { label: 'Business Profile', href: '/retailer/profile', icon: UserCircle },
  { label: 'KYC Details', href: '/retailer/kyc', icon: CreditCard },
];

const focusRing =
  'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-300/60';

function Avatar({ label, size = 'md' }: { label: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: 'h-7 w-7 text-[10px]',
    md: 'h-9 w-9 text-xs',
    lg: 'h-11 w-11 text-sm',
  } as const;

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-stone-600 to-stone-800 font-semibold text-stone-100 ring-1 ring-white/15 ${sizes[size]}`}
    >
      {label}
    </div>
  );
}

export default function RetailerHeader() {
  const pathname = usePathname() ?? '';
  const router = useRouter();

  const { cart, setRole, setCurrentRetailer, addToast } = useApp();

  // Real logged-in retailer, from the session (not the demo/mock context)
  const [account, setAccount] = useState<Account | null>(null);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/auth/me', { cache: 'no-store' })
      .then((res) => res.json())
      .then((json) => {
        if (cancelled || !json.success) return;
        setAccount({
          businessName: json.data.retailerBusinessName ?? null,
          name: json.data.name ?? null,
          email: json.data.email ?? null,
          gstin: json.data.retailerGstin ?? null,
        });
      })
      .catch(() => {
        // Header falls back to generic "Retailer Account" text.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Shadow / blur once the page is scrolled
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setUserDropdownOpen(false);
    setMobileNavOpen(false);
  }, [pathname]);

  // Close profile dropdown on outside click / Escape
  useEffect(() => {
    if (!userDropdownOpen) return;

    const onMouseDown = (e: MouseEvent) => {
      if (!dropdownRef.current?.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setUserDropdownOpen(false);
    };

    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [userDropdownOpen]);

  // Lock body scroll while the mobile menu is open
  useEffect(() => {
    if (!mobileNavOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileNavOpen]);

  const displayName = account?.businessName || account?.name || 'Retailer Account';
  const initial = (account?.businessName || account?.name || 'R').charAt(0).toUpperCase();
  const cartCount = cart?.items?.length || 0;
  const cartActive = pathname.startsWith('/retailer/cart');

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  const handleLogout = async () => {
    setUserDropdownOpen(false);
    setMobileNavOpen(false);

    try {
      // Actually end the server session (clears the httpOnly cookie)
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Continue clearing local state even if the request fails.
    }

    setRole('public');
    setCurrentRetailer(null);

    addToast?.({ type: 'success', title: 'Logged out successfully', message: '' });

    router.push('/');
    router.refresh();
  };

  return (
    // -top-9 lets the 36px utility bar scroll away while the main bar stays stuck
    <header
      className={`sticky -top-9 z-50 w-full text-[#f8f5ef] transition-shadow duration-300 ${
        scrolled ? 'shadow-[0_10px_40px_rgba(0,0,0,0.35)]' : 'shadow-[0_8px_30px_rgba(0,0,0,0.15)]'
      }`}
    >
      {/* =========================================================
          UTILITY BAR
      ========================================================= */}
      <div className="h-9 border-b border-white/[0.06] bg-[#0f0f0f]">
        <div className="mx-auto flex h-full max-w-[1400px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <span className="hidden text-[9px] uppercase tracking-[0.2em] text-stone-600 sm:block">
            B2B Wholesale Portal
          </span>

          <div className="ml-auto flex items-center gap-4 text-[9px] uppercase tracking-[0.14em]">
            {account?.gstin && (
              <>
                <div className="flex items-center gap-2 text-stone-500">
                  <span>GSTIN</span>
                  <span className="font-mono text-stone-300">{account.gstin}</span>
                </div>
                <span className="h-3 w-px bg-white/10" />
              </>
            )}

            <div className="flex items-center gap-1.5 text-emerald-400">
              <ShieldCheck size={12} strokeWidth={1.8} />
              <span>Verified Account</span>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================
          MAIN BAR  (logo | centred nav | actions)
      ========================================================= */}
      <div
        className={`border-b border-white/[0.08] transition-colors duration-300 ${
          scrolled ? 'bg-[#171717]/90 backdrop-blur-xl' : 'bg-[#171717]'
        }`}
      >
        <div className="mx-auto grid h-[68px] max-w-[1400px] grid-cols-[auto_1fr_auto] items-center gap-4 px-4 sm:px-6 lg:grid-cols-[1fr_auto_1fr] lg:px-8">
          {/* LOGO */}
          <Link
            href="/retailer/catalogue"
            aria-label="Iccha - The Women's Label"
            className={`flex shrink-0 items-center justify-self-start rounded-sm ${focusRing}`}
          >
            <img
              src="/brand/iccha-symbol-light.png"
              alt="Iccha - The Women's Label"
              className="h-11 w-auto"
            />
          </Link>

          {/* DESKTOP NAV, centred */}
          <nav
            aria-label="Main"
            className="hidden items-center gap-1 justify-self-center rounded-full border border-white/[0.07] bg-white/[0.02] p-1 lg:flex"
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={`group flex items-center gap-2 rounded-full px-4 py-2 text-[10.5px] font-medium uppercase tracking-[0.14em] transition-all duration-200 ${focusRing} ${
                    active
                      ? 'bg-amber-300/10 text-amber-300 shadow-[inset_0_0_0_1px_rgba(252,211,77,0.25)]'
                      : 'text-stone-400 hover:bg-white/[0.05] hover:text-stone-100'
                  }`}
                >
                  <Icon
                    size={14}
                    strokeWidth={1.6}
                    className={`transition-colors ${
                      active ? 'text-amber-300' : 'text-stone-500 group-hover:text-stone-300'
                    }`}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* RIGHT ACTIONS */}
          <div className="col-start-3 flex items-center gap-2 justify-self-end">
            {/* CART */}
            <Link
              href="/retailer/cart"
              aria-label={`Cart${cartCount > 0 ? `, ${cartCount} items` : ''}`}
              className={`group relative flex h-10 items-center gap-2.5 rounded-full border px-3.5 transition-all duration-200 ${focusRing} ${
                cartActive
                  ? 'border-amber-300/40 bg-amber-300/[0.08] text-amber-300'
                  : 'border-white/10 text-stone-400 hover:border-white/25 hover:bg-white/[0.05] hover:text-white'
              }`}
            >
              <div className="relative">
                <ShoppingBag size={17} strokeWidth={1.7} />
                {cartCount > 0 && (
                  <span className="absolute -right-2.5 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-300 px-1 text-[8px] font-bold text-[#171717] shadow">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </div>
              <span className="hidden text-[9px] font-medium uppercase tracking-[0.14em] xl:block">
                Cart
              </span>
            </Link>

            <div className="mx-1 hidden h-7 w-px bg-white/[0.08] sm:block" />

            {/* PROFILE */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={userDropdownOpen}
                onClick={() => setUserDropdownOpen((prev) => !prev)}
                className={`flex h-10 items-center gap-2.5 rounded-full border py-1 pl-1 pr-2.5 transition-all duration-200 ${focusRing} ${
                  userDropdownOpen
                    ? 'border-white/20 bg-white/[0.07]'
                    : 'border-transparent hover:border-white/10 hover:bg-white/[0.04]'
                }`}
              >
                <Avatar label={initial} size="sm" />

                <div className="hidden text-left xl:block">
                  <p className="max-w-[130px] truncate text-[10px] font-medium text-stone-200">
                    {displayName}
                  </p>
                  <p className="mt-0.5 text-[8px] uppercase tracking-[0.12em] text-emerald-400">
                    Approved Retailer
                  </p>
                </div>

                <ChevronDown
                  size={14}
                  className={`hidden text-stone-500 transition-transform duration-200 sm:block ${
                    userDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {userDropdownOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-[calc(100%+10px)] z-50 w-72 overflow-hidden rounded-lg border border-white/10 bg-[#1e1e1e] shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
                >
                  {/* header */}
                  <div className="border-b border-white/[0.07] bg-gradient-to-b from-[#232323] to-[#191919] p-4">
                    <div className="flex items-center gap-3">
                      <Avatar label={initial} size="lg" />

                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-white">{displayName}</p>

                        {account?.email && (
                          <p className="mt-0.5 truncate text-[10px] text-stone-500">
                            {account.email}
                          </p>
                        )}

                        <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/[0.07] px-2 py-0.5 text-[8px] uppercase tracking-[0.13em] text-emerald-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                          Approved Retailer
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* links */}
                  <div className="p-2">
                    {accountLinks.map(({ href, label, icon: Icon }) => (
                      <Link
                        key={href}
                        href={href}
                        role="menuitem"
                        onClick={() => setUserDropdownOpen(false)}
                        className={`group flex items-center gap-3 rounded-md px-3 py-2.5 text-stone-400 transition-colors hover:bg-white/[0.06] hover:text-white ${focusRing}`}
                      >
                        <Icon size={15} className="text-stone-500 transition-colors group-hover:text-amber-300" />
                        <span className="text-[10px] uppercase tracking-[0.1em]">{label}</span>
                      </Link>
                    ))}
                  </div>

                  {/* logout */}
                  <div className="border-t border-white/[0.07] p-2">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleLogout}
                      className="group flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-stone-500 transition-colors hover:bg-red-500/[0.08] hover:text-red-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-300/50"
                    >
                      <LogOut size={15} />
                      <span className="text-[10px] uppercase tracking-[0.1em]">Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* MOBILE MENU BUTTON */}
            <button
              type="button"
              onClick={() => setMobileNavOpen((prev) => !prev)}
              aria-expanded={mobileNavOpen}
              aria-label={mobileNavOpen ? 'Close navigation' : 'Open navigation'}
              className={`ml-1 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-stone-300 transition-colors hover:bg-white/[0.06] hover:text-white lg:hidden ${focusRing}`}
            >
              {mobileNavOpen ? <X size={19} strokeWidth={1.7} /> : <Menu size={19} strokeWidth={1.7} />}
            </button>
          </div>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-amber-300/25 to-transparent" />
      </div>

      {/* =========================================================
          MOBILE NAVIGATION
      ========================================================= */}
      {mobileNavOpen && (
        <div className="max-h-[calc(100dvh-68px)] overflow-y-auto border-b border-white/[0.07] bg-[#191919] lg:hidden">
          <div className="mx-auto max-w-[1400px] px-4 py-4 sm:px-6">
            {/* account summary */}
            <div className="mb-4 flex items-center gap-3 rounded-lg border border-white/[0.07] bg-white/[0.02] p-3">
              <Avatar label={initial} size="md" />
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-stone-200">{displayName}</p>
                <div className="mt-1 flex items-center gap-1.5 text-[8px] uppercase tracking-[0.12em] text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Verified Account
                </div>
              </div>
            </div>

            {/* nav items */}
            <div className="grid grid-cols-2 gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={`flex items-center gap-3 rounded-lg border px-3.5 py-3 transition-colors ${focusRing} ${
                      active
                        ? 'border-amber-300/30 bg-amber-300/[0.08] text-amber-300'
                        : 'border-white/[0.06] text-stone-400 hover:bg-white/[0.04] hover:text-white'
                    }`}
                  >
                    <Icon size={16} strokeWidth={1.6} />
                    <span className="text-[10px] font-medium uppercase tracking-[0.12em]">
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>

            {/* cart */}
            <Link
              href="/retailer/cart"
              className={`mt-2 flex items-center gap-3 rounded-lg border px-3.5 py-3 transition-colors ${focusRing} ${
                cartActive
                  ? 'border-amber-300/30 bg-amber-300/[0.08] text-amber-300'
                  : 'border-white/[0.06] text-stone-400 hover:bg-white/[0.04] hover:text-white'
              }`}
            >
              <ShoppingBag size={16} strokeWidth={1.6} />
              <span className="text-[10px] font-medium uppercase tracking-[0.12em]">
                Wholesale Cart
              </span>
              {cartCount > 0 && (
                <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-300 px-1.5 text-[8px] font-bold text-[#171717]">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>

            {/* account links */}
            <div className="mt-4 border-t border-white/[0.07] pt-4">
              <p className="mb-2 px-1 text-[8px] uppercase tracking-[0.2em] text-stone-600">
                Account
              </p>

              <div className="space-y-1">
                {accountLinks.map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-stone-500 transition-colors hover:bg-white/[0.04] hover:text-stone-200 ${focusRing}`}
                  >
                    <Icon size={15} />
                    <span className="text-[9px] uppercase tracking-[0.12em]">{label}</span>
                  </Link>
                ))}

                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-stone-500 transition-colors hover:bg-red-500/[0.08] hover:text-red-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-300/50"
                >
                  <LogOut size={15} />
                  <span className="text-[9px] uppercase tracking-[0.12em]">Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}