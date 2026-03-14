'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

const BASE_URL = 'https://www.profootballnetwork.com/nfl-hq';

export default function CanonicalURL() {
  const pathname = usePathname();

  useEffect(() => {
    // Remove any existing canonical link
    const existingCanonical = document.querySelector('link[rel="canonical"]');
    if (existingCanonical) {
      existingCanonical.remove();
    }

    // Build canonical: use pathname only (strip query params), remove trailing slash
    const cleanPath = pathname.replace(/\/+$/, '');
    const canonicalHref = `${BASE_URL}${cleanPath}`;

    // Create and append new canonical link
    const link = document.createElement('link');
    link.rel = 'canonical';
    link.href = canonicalHref;
    document.head.appendChild(link);

    return () => {
      // Cleanup on unmount
      const canonicalLink = document.querySelector('link[rel="canonical"]');
      if (canonicalLink) {
        canonicalLink.remove();
      }
    };
  }, [pathname]);

  return null;
}
