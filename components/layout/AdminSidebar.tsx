'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAdminRole } from './AdminRoleContext';
import {
  LayoutDashboard,
  Sparkles,
  Users,
  FileCheck,
  ClipboardCheck,
  Package,
  FolderTree,
  Boxes,
  Sliders,
  ShoppingBag,
  Store,
  ReceiptText,
  ExternalLink,
  LogOut,
  UserCog,
  UserCircle,
  Menu,
  X,
  PhoneCall,
} from 'lucide-react';

interface AdminSidebarProps {
  activeTab?: string;
}

interface NavLink {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface SidebarCounts {
  pendingKyc: number;
  newOrders: number;
  pendingSampleCalls: number;
}

const EMPTY_COUNTS: SidebarCounts = { pendingKyc: 0, newOrders: 0, pendingSampleCalls: 0 };
const COUNTS_REFRESH_MS = 30000;

const STAFF_ONLY_LINKS: NavLink[] = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Hero Banners', href: '/admin/hero', icon: Sparkles },
  { label: 'Retailers', href: '/admin/retailers', icon: Users },
  {
    label: 'Reactivation Requests',
    href: '/admin/retailer-reactivation-requests',
    icon: ClipboardCheck,
  },
  { label: 'Vendors', href: '/admin/vendors', icon: Store },
  { label: 'KYC Applications', href: '/admin/kyc', icon: FileCheck },
  { label: 'User', href: '/admin/roles', icon: UserCog },
];

const SHARED_LINKS: NavLink[] = [
  { label: 'Products', href: '/admin/products', icon: Package },
  { label: 'Warehouses', href: '/admin/warehouses', icon: Boxes },
  { label: 'Order Enquiries', href: '/admin/orders', icon: ShoppingBag },
  { label: 'Sample Call Requests', href: '/admin/sample-call-requests', icon: PhoneCall },
  { label: 'My Profile', href: '/admin/profile', icon: UserCircle },
];

const STAFF_ONLY_TRAILING_LINKS: NavLink[] = [
  { label: 'MOQ Rules', href: '/admin/moq-rules', icon: Sliders },
];

const CATEGORY_LINK: NavLink = {
  label: 'Categories',
  href: '/admin/categories',
  icon: FolderTree,
};

export default function AdminSidebar({ activeTab }: AdminSidebarProps = {}) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const contextRole = useAdminRole();
  const [fetchedRole, setRole] = useState<string | null>(null);
  // Server-provided role is available on first render; the fetch is only a fallback.
  const role = contextRole ?? fetchedRole;
  const [counts, setCounts] = useState<SidebarCounts>(EMPTY_COUNTS);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (contextRole) return;
    let cancelled = false;

    fetch('/api/auth/me', { cache: 'no-store' })
      .then((res) => res.json())
      .then((json) => {
        if (!cancelled && json.success) {
          setRole(json.data.role);
        }
      })
      .catch(() => {
        if (!cancelled) setRole(null);
      });

    return () => {
      cancelled = true;
    };
  }, [contextRole]);

  // Live pill counts. Refreshes on mount, on every navigation (so approving a KYC
  // application or opening an order updates the pill right away), every 30s while the
  // tab is visible, and when the tab regains focus.
  useEffect(() => {
    if (!role) return;
    let cancelled = false;

    async function loadCounts() {
      try {
        const res = await fetch('/api/admin/sidebar-counts', { cache: 'no-store' });
        const json = await res.json();

        if (!cancelled && res.ok && json.success) {
          setCounts({
            pendingKyc: Number(json.data?.pendingKyc ?? 0),
            newOrders: Number(json.data?.newOrders ?? 0),
            pendingSampleCalls: Number(json.data?.pendingSampleCalls ?? 0),
          });
        }
      } catch {
        // Keep the last known numbers rather than flashing the pills to 0 on a network blip.
      }
    }

    loadCounts();

    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') loadCounts();
    }, COUNTS_REFRESH_MS);

    const onVisible = () => {
      if (document.visibilityState === 'visible') loadCounts();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [role, pathname]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      // Clears the httpOnly session cookie on the server
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Still leave the admin area even if the request fails.
    }
    router.replace('/login');
    router.refresh();
  };

  const isVendor = role === 'VENDOR';

  // Unknown role -> show no links (never default to the full staff menu).
  const navLinks: NavLink[] = !role
  ? []
  : isVendor
    ? [...SHARED_LINKS, CATEGORY_LINK]
    : [
        ...STAFF_ONLY_LINKS,
        ...SHARED_LINKS,
        CATEGORY_LINK,
        ...STAFF_ONLY_TRAILING_LINKS,
      ];
  const formatCount = (n: number) => (n > 99 ? '99+' : String(n));

  // Pills only appear when there is something to act on.
  const getBadge = (item: NavLink) => {
    switch (item.href) {
      case '/admin/kyc':
        return counts.pendingKyc > 0 ? `${formatCount(counts.pendingKyc)} Pending` : null;
      case '/admin/orders':
        return counts.newOrders > 0 ? `${formatCount(counts.newOrders)} New` : null;
      case '/admin/sample-call-requests':
        return counts.pendingSampleCalls > 0
          ? `${formatCount(counts.pendingSampleCalls)} Pending`
          : null;
      default:
        return null;
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        aria-label="Open navigation"
        className="lg:hidden fixed top-4 left-4 z-40 w-10 h-10 rounded-xl bg-stone-950 text-white border border-stone-800 shadow-lg flex items-center justify-center"
      >
        <Menu className="w-5 h-5" />
      </button>

      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
          className="lg:hidden fixed inset-0 z-40 bg-black/60"
        />
      )}

      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-64 min-h-screen shrink-0
          bg-stone-950 text-stone-300
          flex flex-col border-r border-stone-800
          transition-transform duration-300
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="p-5 border-b border-stone-800 shrink-0">
          <div className="flex items-center justify-between gap-3">
            <Link
              href={isVendor ? '/admin/products' : '/admin'}
              className="flex items-center gap-3 min-w-0"
            >
              <img
                src="/brand/iccha-symbol-light.png"
                alt="Iccha"
                className="h-10 w-auto shrink-0"
              />

              <div className="min-w-0">
                <span className="font-serif text-lg tracking-tight text-white font-bold block leading-none truncate">
                  ICCHA<span className="text-rose-500 font-normal">ADMIN</span>
                </span>
                <span className="text-[10px] tracking-wider uppercase text-amber-400 font-semibold block mt-1">
                  {isVendor ? 'Vendor Portal' : 'Wholesale Operations'}
                </span>
              </div>
            </Link>

            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Close navigation"
              className="lg:hidden w-8 h-8 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-300 flex items-center justify-center shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          <div className="text-[10px] uppercase font-bold tracking-wider text-stone-400 px-3 mb-2">
            {isVendor ? 'My Catalogue' : 'Management & Verification'}
          </div>

          {navLinks.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/admin' && pathname.startsWith(item.href));

            const Icon = item.icon;
            const badge = getBadge(item);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center justify-between gap-3
                  px-3 py-2.5 rounded-lg text-xs font-medium transition
                  ${
                    isActive
                      ? 'bg-rose-950/80 text-rose-300 font-semibold border border-rose-800/60 shadow-sm'
                      : 'text-stone-300 hover:bg-stone-900 hover:text-white'
                  }
                `}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-rose-400' : 'text-stone-400'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>

                {badge && (
                  <span className="bg-amber-500/20 text-amber-300 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-amber-500/40 shrink-0 whitespace-nowrap">
                    {badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-stone-800 bg-stone-900/60 space-y-2 shrink-0">
          <Link
            href="/"
            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium bg-stone-800 hover:bg-stone-700 text-stone-200 transition"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Public View
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium bg-rose-950/60 hover:bg-rose-900/70 text-rose-200 border border-rose-900/60 transition disabled:opacity-60"
          >
            <LogOut className="w-3.5 h-3.5" />
            {loggingOut ? 'Signing out...' : 'Sign Out'}
          </button>
        </div>
      </aside>
    </>
  );
}