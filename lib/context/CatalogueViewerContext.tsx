'use client';

import { createContext, useContext } from 'react';

export type CatalogueViewerRole = 'RETAILER' | 'ADMIN' | 'VENDOR';

interface CatalogueViewer {
  role: CatalogueViewerRole;
  /** Only approved retailers may add to cart, order or request sample calls. */
  canOrder: boolean;
}

// Default = retailer, so components used under /retailer/* behave exactly as before.
const CatalogueViewerContext = createContext<CatalogueViewer>({
  role: 'RETAILER',
  canOrder: true,
});

export function CatalogueViewerProvider({
  role,
  children,
}: {
  role: CatalogueViewerRole;
  children: React.ReactNode;
}) {
  return (
    <CatalogueViewerContext.Provider value={{ role, canOrder: role === 'RETAILER' }}>
      {children}
    </CatalogueViewerContext.Provider>
  );
}

export function useCatalogueViewer() {
  return useContext(CatalogueViewerContext);
}
