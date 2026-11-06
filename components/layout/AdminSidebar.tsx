'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAdminRole } from './AdminRoleContext';
import {
  LayoutDashboard,
  Package,
  Store,
  Users,
  FileText,
  ShoppingBag,
  ExternalLink,
  LogOut,
  UserCog,
  UserCircle,
  Menu,
  X,
  ChevronDown,
} from 'lucide-react';

interface AdminSidebarProps {
  activeTab?: string;
}

type IconType = React.ComponentType<{ className?: string }>;

interface SubLink {
  label: string;
  href: string;
  staffOnly?: boolean;
}

interface SingleItem {
  type: 'link';
  label: string;
  href: string;
  icon: IconType;
  staffOnly?: boolean;
}

interface GroupItem {
  type: 'group';
  key: string;
  label: string;
  icon: IconType;
  staffOnly?: boolean;
  children: SubLink[];
}

type NavEntry = SingleItem | GroupItem;

interface SidebarCounts {
  pendingKyc: number;
  newOrders: number;
  pendingSampleCalls: number;
}

const EMPTY_COUNTS: SidebarCounts = { pendingKyc: 0, newOrders: 0, pendingSampleCalls: 0 };
const COUNTS_REFRESH_MS = 30000;

/**
 * Single source of truth for the menu.
 * - `staffOnly` on a group hides the whole group from vendors.
 * - `staffOnly` on a child hides only that child from vendors.
 */
const NAV: NavEntry[] = [
  { type: 'link', label: 'Dashboard', href: '/admin', icon: LayoutDashboard, staffOnly: true },
  { type: 'link', label: 'Orders', href: '/admin/orders', icon: ShoppingBag },
  {
    type: 'group',
    key: 'products',
    label: 'Product Management',
    icon: Package,
    children: [
      { label: 'Products', href: '/admin/products' },
      { label: 'Collections', href: '/admin/collections' },
      { label: 'Categories', href: '/admin/categories' },
      { label: 'Warehouses', href: '/admin/warehouses' },
      { label: 'MOQ Rules', href: '/admin/moq-rules', staffOnly: true },
      { label: 'Sample Call Requests', href: '/admin/sample-call-requests' },
    ],
  },
  {
    type: 'group',
    key: 'partners',
    label: 'Partner Management',
    icon: Users,
    staffOnly: true,
    children: [
      { label: 'Vendors', href: '/admin/vendors' },
      { label: 'Wholesalers', href: '/admin/retailers' },
      { label: 'Wholesaler Reactivations', href: '/admin/retailer-reactivation-requests' },
      { label: 'KYC Applications', href: '/admin/kyc' },
    ],
  },
  {
    type: 'group',
    key: 'cms',
    label: 'CMS Management',
    icon: FileText,
    staffOnly: true,
    children: [
      { label: 'Hero Banners', href: '/admin/hero' },
      { label: 'About Page', href: '/admin/content/about' },
      { label: 'Contact Page', href: '/admin/contact' },
      { label: 'Home Features', href: '/admin/content/homeFeatures' },
    ],
  },
  { type: 'link', label: 'User', href: '/admin/roles', icon: UserCog, staffOnly: true },
  { type: 'link', label: 'My Profile', href: '/admin/profile', icon: UserCircle },
];

const matchesPath = (pathname: string, href: string) =>
  href === '/admin' ? pathname === '/admin' : pathname === href || pathname.startsWith(`${href}/`);

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
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

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

  // Live pill counts. Refreshes on mount, on every navigation, every 30s while the
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

  // Unknown role -> show nothing (never default to the full staff menu).
  const entries: NavEntry[] = useMemo(() => {
    if (!role) return [];
    const allowed = (staffOnly?: boolean) => !(isVendor && staffOnly);

    return NAV.filter((e) => allowed(e.staffOnly)).map((e) =>
      e.type === 'group'
        ? { ...e, children: e.children.filter((c) => allowed(c.staffOnly)) }
        : e
    );
  }, [role, isVendor]);

  // Auto-open the group that contains the current page (without closing others).
  useEffect(() => {
    const active = entries.find(
      (e) => e.type === 'group' && e.children.some((c) => matchesPath(pathname, c.href))
    );
    if (active && active.type === 'group') {
      setOpenGroups((prev) => (prev[active.key] ? prev : { ...prev, [active.key]: true }));
    }
  }, [pathname, entries]);

  const toggleGroup = (key: string) =>
    setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));

  const formatCount = (n: number) => (n > 99 ? '99+' : String(n));

  // Numeric badge value for a link. Pills only appear when there is something to act on.
  const getCount = (href: string): number => {
    switch (href) {
      case '/admin/kyc':
        return counts.pendingKyc;
      case '/admin/orders':
        return counts.newOrders;
      case '/admin/sample-call-requests':
        return counts.pendingSampleCalls;
      default:
        return 0;
    }
  };

  const getBadgeLabel = (href: string) => {
    const n = getCount(href);
    if (n <= 0) return null;
    if (href === '/admin/orders') return `${formatCount(n)} New`;
    return `${formatCount(n)} Pending`;
  };

  const pillClass =
    'bg-amber-500/20 text-amber-300 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-amber-500/40 shrink-0 whitespace-nowrap';

  const renderSingle = (item: SingleItem) => {
    const isActive = matchesPath(pathname, item.href);
    const Icon = item.icon;
    const badge = getBadgeLabel(item.href);

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
          <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-rose-400' : 'text-stone-400'}`} />
          <span className="truncate">{item.label}</span>
        </div>
        {badge && <span className={pillClass}>{badge}</span>}
      </Link>
    );
  };

  const renderGroup = (group: GroupItem) => {
    if (group.children.length === 0) return null;

    const isOpen = !!openGroups[group.key];
    const hasActiveChild = group.children.some((c) => matchesPath(pathname, c.href));
    const Icon = group.icon;

    // When collapsed, roll child counts up into one dot-pill so nothing is hidden.
    const total = group.children.reduce((sum, c) => sum + getCount(c.href), 0);

    return (
      <div key={group.key}>
        <button
          type="button"
          onClick={() => toggleGroup(group.key)}
          aria-expanded={isOpen}
          aria-controls={`nav-group-${group.key}`}
          className={`
            w-full flex items-center justify-between gap-3
            px-3 py-2.5 rounded-lg text-xs font-medium transition
            ${
              hasActiveChild && !isOpen
                ? 'bg-rose-950/50 text-rose-300 border border-rose-800/40'
                : 'text-stone-300 hover:bg-stone-900 hover:text-white border border-transparent'
            }
          `}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <Icon
              className={`w-4 h-4 shrink-0 ${hasActiveChild ? 'text-rose-400' : 'text-stone-400'}`}
            />
            <span className="truncate">{group.label}</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {!isOpen && total > 0 && <span className={pillClass}>{formatCount(total)}</span>}
            <ChevronDown
              className={`w-3.5 h-3.5 text-stone-500 transition-transform duration-200 ${
                isOpen ? 'rotate-180' : ''
              }`}
            />
          </div>
        </button>

        <div
          id={`nav-group-${group.key}`}
          className={`grid transition-[grid-template-rows] duration-200 ease-out ${
            isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
          }`}
        >
          <div className="overflow-hidden">
            <div className="ml-5 mt-1 mb-1 pl-3 border-l border-stone-800 space-y-0.5">
              {group.children.map((child) => {
                const isActive = matchesPath(pathname, child.href);
                const badge = getBadgeLabel(child.href);

                return (
                  <Link
                    key={child.href}
                    href={child.href}
                    tabIndex={isOpen ? 0 : -1}
                    className={`
                      flex items-center justify-between gap-2
                      px-3 py-2 rounded-md text-xs transition
                      ${
                        isActive
                          ? 'bg-rose-950/80 text-rose-300 font-semibold'
                          : 'text-stone-400 hover:bg-stone-900 hover:text-white font-medium'
                      }
                    `}
                  >
                    <span className="truncate">{child.label}</span>
                    {badge && <span className={pillClass}>{badge}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
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
        data-admin-sidebar
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-64 h-dvh lg:h-auto lg:min-h-screen shrink-0
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

        <nav className="flex-1 min-h-0 py-4 px-3 space-y-1 overflow-y-auto">
          {entries.map((entry) =>
            entry.type === 'group' ? renderGroup(entry) : renderSingle(entry)
          )}
        </nav>

        <div className="p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] border-t border-stone-800 bg-stone-900/60 space-y-2 shrink-0">
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