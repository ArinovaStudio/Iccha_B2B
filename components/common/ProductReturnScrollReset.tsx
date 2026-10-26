'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

const isCatalogueProductPath = (path: string) =>
  /^\/catalogue\/[^/]+\/?$/.test(path);

/**
 * The catalogue is paginated and remounts with only its first page after Back.
 * Mobile browsers clamp the old scroll offset to that shorter page (the footer).
 * Start the catalogue at its top when returning from a product route.
 */
export default function ProductReturnScrollReset() {
  const pathname = usePathname();
  const previousPathname = useRef(pathname);

  useEffect(() => {
    const cameBackFromProduct =
      isCatalogueProductPath(previousPathname.current) && pathname === '/catalogue';
    previousPathname.current = pathname;

    if (!cameBackFromProduct) return;

    const resetToTop = () => window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    let frame = window.requestAnimationFrame(resetToTop);
    let userInteracted = false;
    let timers: number[] = [];
    const stopResettingOnInteraction = () => {
      userInteracted = true;
      window.cancelAnimationFrame(frame);
      timers.forEach(window.clearTimeout);
    };
    timers = [0, 100, 300, 700, 1200].map((delay) =>
      window.setTimeout(() => {
        if (userInteracted) return;
        resetToTop();
        frame = window.requestAnimationFrame(resetToTop);
      }, delay),
    );
    window.addEventListener('touchstart', stopResettingOnInteraction, { passive: true, once: true });
    window.addEventListener('wheel', stopResettingOnInteraction, { passive: true, once: true });

    return () => {
      window.cancelAnimationFrame(frame);
      timers.forEach(window.clearTimeout);
      window.removeEventListener('touchstart', stopResettingOnInteraction);
      window.removeEventListener('wheel', stopResettingOnInteraction);
    };
  }, [pathname]);

  return null;
}
