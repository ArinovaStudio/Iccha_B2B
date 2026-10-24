'use client';

import { useEffect } from 'react';

const PRODUCT_RETURN_KEY = 'iccha:return-from-product';

/** Reset home only when it is revisited after viewing a catalogue product. */
export default function HomeScrollReset() {
  useEffect(() => {
    if (window.sessionStorage.getItem(PRODUCT_RETURN_KEY) !== '1') return;

    window.sessionStorage.removeItem(PRODUCT_RETURN_KEY);
    // Wait until Next/browser history restoration has run, then place home at top.
    requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0, behavior: 'instant' }));
  }, []);

  return null;
}
