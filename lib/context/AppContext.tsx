'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { UserRole, Retailer } from '@/lib/types';
import { Cart, MOQEvaluation, EMPTY_CART } from '@/lib/types/cart';
import { MOCK_RETAILERS } from '@/lib/data/mockData';
import { RetailerService } from '@/lib/services';

interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
}

interface AppContextType {
  // Role & Authentication simulation
  role: UserRole;
  setRole: (role: UserRole) => void;
  currentRetailer: Retailer | null;
  setCurrentRetailer: (retailer: Retailer | null) => void;
  switchRetailerPreset: (presetId: 'approved' | 'pending' | 'info_required' | 'suspended') => void;

  // Cart — backed by /api/retailer/cart, not localStorage
  cart: Cart;
  isCartLoading: boolean;
  refreshCart: () => Promise<void>;
  addToCart: (productId: string, sets?: number, productName?: string, selectedSize?: string | null, colorQuantities?: { color: string; sets: number }[]) => Promise<void>;
  updateCartItemSets: (productId: string, sets: number, selectedSize?: string | null, selectedColor?: string | null) => Promise<void>;
  removeFromCart: (productId: string, selectedSize?: string | null, selectedColor?: string | null) => Promise<void>;
  clearCart: () => Promise<void>;
  moqEvaluation: MOQEvaluation | null;
  isEvaluatingMoq: boolean;

  // Seller / Below MOQ modal
  isSellerModalOpen: boolean;
  openSellerModal: (productId?: string) => void;
  sellerRequestProductId: string | null;
  closeSellerModal: () => void;

  // Toasts
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;

  // Global demo quick actions
  toggleAdminMoqOverride: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<UserRole>(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedRole = localStorage.getItem('iccha_current_role') as UserRole;
        if (savedRole) return savedRole;
      } catch {
        // ignore
      }
    }
    return 'public';
  });

  const [currentRetailer, setCurrentRetailerState] = useState<Retailer | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedRetailer = localStorage.getItem('iccha_active_retailer');
        if (savedRetailer) return JSON.parse(savedRetailer);
      } catch {
        // ignore
      }
    }
    return MOCK_RETAILERS[0];
  });

  const pathname = usePathname();
  const inRetailerArea =
    (pathname?.startsWith('/retailer') ?? false) || (pathname?.startsWith('/catalogue') ?? false);

  const [cart, setCart] = useState<Cart>(EMPTY_CART);
  // Bumped on every cart write so a slow, older response can never overwrite newer state.
  const cartRequestIdRef = useRef(0);
  const [isCartLoading, setIsCartLoading] = useState<boolean>(true);
  const [isSellerModalOpen, setIsSellerModalOpen] = useState(false);
  const [sellerRequestProductId, setSellerRequestProductId] =
    useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
    try {
      localStorage.setItem('iccha_current_role', newRole);
    } catch {
      // ignore
    }
  };

  const setCurrentRetailer = (retailer: Retailer | null) => {
    setCurrentRetailerState(retailer);
    try {
      if (retailer) {
        localStorage.setItem('iccha_active_retailer', JSON.stringify(retailer));
      } else {
        localStorage.removeItem('iccha_active_retailer');
      }
    } catch {
      // ignore
    }
  };

  const switchRetailerPreset = (presetId: 'approved' | 'pending' | 'info_required' | 'suspended') => {
    let target = MOCK_RETAILERS[0]; // approved
    if (presetId === 'pending') target = MOCK_RETAILERS[1];
    else if (presetId === 'info_required') target = MOCK_RETAILERS[2];
    else if (presetId === 'suspended') target = MOCK_RETAILERS[3];

    setCurrentRetailer(target);
    setRole('retailer');
    addToast({
      type: 'info',
      title: `Switched Demo Whole Seller`,
      message: `Active user: ${target.businessName} (${target.status.toUpperCase().replace('_', ' ')})`
    });
  };

  // Must be referentially stable: many pages list it in useEffect deps. A new
  // function every render made those effects re-run whenever a toast appeared,
  // so a failed request re-fired forever and spammed error toasts.
  const addToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString().slice(-4)}`;
    setToasts(prev => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // ---- Real, DB-backed cart ----

  const applyCart = (data: Cart) => {
    cartRequestIdRef.current++;
    setCart(data);
    setIsCartLoading(false);
  };

  const refreshCart = useCallback(async () => {
    const requestId = ++cartRequestIdRef.current;
    setIsCartLoading(true);
    try {
      const res = await fetch('/api/retailer/cart');
      const json = await res.json();
      if (requestId !== cartRequestIdRef.current) return; // superseded by a newer write
      setCart(json.success ? json.data : EMPTY_CART);
    } catch {
      if (requestId !== cartRequestIdRef.current) return;
      setCart(EMPTY_CART);
    } finally {
      if (requestId === cartRequestIdRef.current) setIsCartLoading(false);
    }
  }, []);

  // AppProvider lives in the root layout, so it mounts ONCE and survives client-side
  // navigation (login -> /catalogue). Fetching only on mount meant the cart was
  // requested while logged out (401 -> empty) and never re-fetched after login.
  // Instead: (re)load whenever we enter the retailer area, and clear when we leave it
  // (logout), so one user's cart can't linger for the next login.
  useEffect(() => {
    if (inRetailerArea) {
      refreshCart();
    } else {
      cartRequestIdRef.current++;
      setCart(EMPTY_CART);
      setIsCartLoading(false);
    }
  }, [inRetailerArea, refreshCart]);

  const addToCart = async (productId: string, sets = 1, productName?: string, selectedSize?: string | null, colorQuantities?: { color: string; sets: number }[]) => {
    if (colorQuantities && colorQuantities.length > 0) {
      sets = colorQuantities.reduce((sum, l) => sum + l.sets, 0);
    }
    try {
      const res = await fetch('/api/retailer/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          ...(colorQuantities && colorQuantities.length > 0 ? { colorQuantities } : { sets }),
          ...(selectedSize ? { selectedSize } : {}),
        }),
      });
      const json = await res.json();
      if (json.success) {
        applyCart(json.data);
        addToast({
          type: 'success',
          title: 'Added to Wholesale Cart',
          message: `${sets} Set${sets > 1 ? 's' : ''} of ${productName || 'the design'} added.`
        });
      } else {
        addToast({ type: 'error', title: 'Could Not Add to Cart', message: json.error || 'Please try again.' });
      }
    } catch {
      addToast({ type: 'error', title: 'Could Not Add to Cart', message: 'Network error. Please try again.' });
    }
  };

  const updateCartItemSets = async (productId: string, sets: number, selectedSize?: string | null, selectedColor?: string | null) => {
    if (sets <= 0) {
      await removeFromCart(productId, selectedSize, selectedColor);
      return;
    }
    try {
      const res = await fetch(`/api/retailer/cart/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sets, ...(selectedSize ? { selectedSize } : {}), ...(selectedColor ? { selectedColor } : {}) }),
      });
      const json = await res.json();
      if (json.success) {
        applyCart(json.data);
      } else {
        addToast({ type: 'error', title: 'Could Not Update Cart', message: json.error || 'Please try again.' });
      }
    } catch {
      addToast({ type: 'error', title: 'Could Not Update Cart', message: 'Network error. Please try again.' });
    }
  };

  const removeFromCart = async (productId: string, selectedSize?: string | null, selectedColor?: string | null) => {
    try {
      const qs = new URLSearchParams();
      if (selectedSize) qs.set('selectedSize', selectedSize);
      if (selectedColor) qs.set('selectedColor', selectedColor);
      const query = qs.toString() ? `?${qs.toString()}` : '';
      const res = await fetch(`/api/retailer/cart/${productId}${query}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        applyCart(json.data);
        addToast({ type: 'info', title: 'Removed Item', message: 'Product lot removed from wholesale cart.' });
      } else {
        addToast({ type: 'error', title: 'Could Not Remove Item', message: json.error || 'Please try again.' });
      }
    } catch {
      addToast({ type: 'error', title: 'Could Not Remove Item', message: 'Network error. Please try again.' });
    }
  };

  const clearCart = async () => {
    try {
      const res = await fetch('/api/retailer/cart', { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        applyCart(json.data);
      }
    } catch {
      // leave cart state as-is; next refresh will reconcile
    }
  };

  const openSellerModal = (productId?: string) => {
    setSellerRequestProductId(productId ?? null);
    setIsSellerModalOpen(true);
  };

  const closeSellerModal = () => {
    setIsSellerModalOpen(false);
    setSellerRequestProductId(null);
  };

  const toggleAdminMoqOverride = async () => {
    if (!currentRetailer) return;
    const newOverride = !currentRetailer.moqOverride;
    await RetailerService.setMoqOverride(currentRetailer.id, newOverride, 1);
    const updated = { ...currentRetailer, moqOverride: newOverride, customMoqSets: 1 };
    setCurrentRetailer(updated);
    await refreshCart();
    addToast({
      type: newOverride ? 'success' : 'warning',
      title: `MOQ Override ${newOverride ? 'Activated' : 'Removed'}`,
      message: newOverride
        ? `Whole Seller ${currentRetailer.businessName} now has below-MOQ checkout unlocked!`
        : `Default MOQ requirements restored.`
    });
  };

  return (
    <AppContext.Provider
      value={{
        role,
        setRole,
        currentRetailer,
        setCurrentRetailer,
        switchRetailerPreset,
        cart,
        isCartLoading,
        refreshCart,
        addToCart,
        updateCartItemSets,
        removeFromCart,
        clearCart,
        moqEvaluation: cart.moq,
        isEvaluatingMoq: isCartLoading,
        isSellerModalOpen,
        openSellerModal,
        sellerRequestProductId,
        closeSellerModal,
        toasts,
        addToast,
        removeToast,
        toggleAdminMoqOverride
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}