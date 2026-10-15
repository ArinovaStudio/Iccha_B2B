'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  ShieldCheck, 
  Clock, 
  Sliders, 
  ShoppingBag, 
  Layers, 
  ChevronUp, 
  ChevronDown, 
  Sparkles,
  ExternalLink,
  Lock,
  PhoneCall,
  LayoutDashboard,
  Boxes,
  FolderTree,
  FileCheck,
  Package,
  ReceiptText
} from 'lucide-react';
import { useApp } from '@/lib/context/AppContext';

export default function RoleSwitcherBar() {
  const router = useRouter();
  const { 
    role, 
    setRole, 
    currentRetailer, 
    switchRetailerPreset, 
    cart, 
    moqEvaluation,
    toggleAdminMoqOverride 
  } = useApp();

  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'roles' | 'backend'>('roles');

  const navigateSafely = (href: string) => {
    try {
      router.push(href);
    } catch {
      window.location.assign(href);
    }
  };

  const backendShortcuts = [
    { label: 'Admin Dashboard', href: '/admin', icon: LayoutDashboard, desc: 'Overview & Metrics' },
    { label: 'Hero Banners CMS', href: '/admin/hero', icon: Sparkles, desc: 'WebGL 3D Slides', badge: 'Live' },
    { label: 'KYC Verification', href: '/admin/kyc', icon: FileCheck, desc: 'Retailer Approvals', badge: '2 Pending' },
    { label: 'Order Enquiries', href: '/admin/orders', icon: ShoppingBag, desc: 'B2B Estimates' },
    { label: 'Products Catalog', href: '/admin/products', icon: Package, desc: 'Wholesale Styles' },
    { label: 'Inventory & Sets', href: '/admin/inventory', icon: Boxes, desc: 'Ratio Bundling' },
  ];

  return (
    <div className="fixed bottom-3 right-3 z-50 max-w-sm sm:max-w-md w-full bg-stone-900/95 backdrop-blur-md text-white border border-stone-700 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300">
      {/* Header bar */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2.5 bg-gradient-to-r from-stone-950 via-rose-950 to-stone-950 border-b border-stone-800 flex items-center justify-between cursor-pointer select-none"
      >
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-xs font-bold tracking-wide uppercase text-amber-400">
            Interactive Test Hub
          </span>
          <span className="text-[11px] bg-stone-800 px-2 py-0.5 rounded text-stone-300 font-medium">
            Active: <strong className="text-white capitalize">{role}</strong>
          </span>
        </div>
        <button 
          className="text-stone-400 hover:text-white p-1"
          aria-label={isOpen ? 'Collapse panel' : 'Expand panel'}
        >
          {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>
      </div>

      {/* Expandable test controls */}
      {isOpen && (
        <div className="p-3.5 space-y-3 text-xs">
          
          {/* Main Mode Nav Tabs: Roles vs Backend Dashboard */}
          <div className="flex items-center gap-1 bg-stone-950/80 p-1 rounded-xl border border-stone-800">
            <button
              onClick={() => setActiveTab('roles')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-center font-medium transition ${
                activeTab === 'roles'
                  ? 'bg-stone-800 text-white font-semibold shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Frontend Roles & Demos
            </button>
            <button
              onClick={() => {
                setActiveTab('backend');
                setRole('admin');
              }}
              className={`flex-1 py-1.5 px-2 rounded-lg text-center font-medium transition flex items-center justify-center gap-1.5 ${
                activeTab === 'backend' || role === 'admin'
                  ? 'bg-[#831843] text-white font-semibold shadow-sm'
                  : 'text-amber-400 hover:text-amber-300'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Backend Dashboard</span>
            </button>
          </div>

          {activeTab === 'roles' ? (
            <>
              <p className="text-[11px] text-stone-400 leading-snug">
                Switch between the 3 distinct experiences & test all acceptance scenarios:
              </p>

              {/* Quick Experience Switching Buttons */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => {
                    setRole('public');
                    navigateSafely('/');
                  }}
                  className={`p-2 rounded-xl text-center border font-medium transition ${
                    role === 'public'
                      ? 'bg-rose-900/60 border-rose-500 text-rose-200'
                      : 'bg-stone-800/80 border-stone-700 hover:bg-stone-700 text-stone-300'
                  }`}
                >
                  <div className="font-semibold">1. Public</div>
                  <div className="text-[10px] text-stone-400">Prices Hidden</div>
                </button>

                <button
                  onClick={() => {
                    switchRetailerPreset('approved');
                    navigateSafely('/catalogue');
                  }}
                  className={`p-2 rounded-xl text-center border font-medium transition ${
                    role === 'retailer' && currentRetailer?.status === 'approved'
                      ? 'bg-emerald-950 border-emerald-500 text-emerald-200'
                      : 'bg-stone-800/80 border-stone-700 hover:bg-stone-700 text-stone-300'
                  }`}
                >
                  <div className="font-semibold text-emerald-400">2. Retailer</div>
                  <div className="text-[10px] text-stone-400">Live Wholesale</div>
                </button>

                <button
                  onClick={() => {
                    setRole('admin');
                    setActiveTab('backend');
                    navigateSafely('/admin');
                  }}
                  className={`p-2 rounded-xl text-center border font-medium transition ${
                    role === 'admin'
                      ? 'bg-amber-950 border-amber-500 text-amber-200'
                      : 'bg-stone-800/80 border-stone-700 hover:bg-stone-700 text-stone-300'
                  }`}
                >
                  <div className="font-semibold text-amber-400">3. Admin</div>
                  <div className="text-[10px] text-stone-400">KYC & Orders</div>
                </button>
              </div>

              {/* Scenario Shortcuts */}
              <div className="bg-stone-950/80 rounded-xl p-2.5 border border-stone-800 space-y-2">
                <div className="text-[10px] uppercase font-bold text-stone-400">
                  Scenario Demos:
                </div>
                <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                  <button
                    onClick={() => {
                      switchRetailerPreset('pending');
                      navigateSafely('/application-status');
                    }}
                    className="text-left px-2 py-1.5 bg-stone-900 hover:bg-stone-800 rounded border border-stone-800 text-stone-300 flex items-center gap-1.5"
                  >
                    <Clock className="w-3 h-3 text-amber-400" />
                    <span>Pending KYC View</span>
                  </button>

                  <button
                    onClick={() => {
                      switchRetailerPreset('approved');
                      navigateSafely('/retailer/cart');
                    }}
                    className="text-left px-2 py-1.5 bg-stone-900 hover:bg-stone-800 rounded border border-stone-800 text-stone-300 flex items-center gap-1.5"
                  >
                    <ShoppingBag className="w-3 h-3 text-rose-400" />
                    <span>Dual GST Cart</span>
                  </button>
                </div>

                {/* MOQ Override Switch */}
                <div className="pt-2 border-t border-stone-800/80 flex items-center justify-between">
                  <span className="text-[11px] text-stone-300">
                    Admin MOQ Override:{' '}
                    <strong className={currentRetailer?.moqOverride ? 'text-emerald-400' : 'text-stone-400'}>
                      {currentRetailer?.moqOverride ? 'Active (Unlocked)' : 'Default (4 Sets)'}
                    </strong>
                  </span>
                  <button
                    onClick={toggleAdminMoqOverride}
                    className="px-2 py-1 rounded bg-stone-800 hover:bg-stone-700 text-amber-300 text-[10px] font-semibold border border-stone-700 transition"
                  >
                    Toggle Override
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* Backend Dashboard Quick View Panel */
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1.5">
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  Backend Dashboard & Operations
                </span>
                <button
                  onClick={() => {
                    setRole('admin');
                    navigateSafely('/admin');
                  }}
                  className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-[10px] font-bold flex items-center gap-1 transition"
                >
                  <span>Open Main Dashboard</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                {backendShortcuts.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.href}
                      onClick={() => {
                        setRole('admin');
                        navigateSafely(item.href);
                      }}
                      className="text-left p-2 bg-stone-950/90 hover:bg-stone-800/90 border border-stone-800 hover:border-amber-500/40 rounded-xl transition group"
                    >
                      <div className="flex items-center justify-between">
                        <Icon className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
                        {item.badge && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-[#831843] text-rose-200">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <div className="font-semibold text-[11px] text-stone-200 mt-1 truncate">
                        {item.label}
                      </div>
                      <div className="text-[9px] text-stone-400 truncate">
                        {item.desc}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-stone-800 flex items-center justify-between text-[11px] text-stone-400">
                <span>Direct Admin Access</span>
                <button
                  onClick={() => {
                    setRole('admin');
                    navigateSafely('/admin/hero');
                  }}
                  className="text-rose-400 hover:text-rose-300 hover:underline flex items-center gap-1 text-[10px] font-semibold"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Hero Campaign CMS &rarr;</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
