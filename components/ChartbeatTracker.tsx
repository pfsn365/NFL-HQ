'use client';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

export default function ChartbeatTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (window._sf_async_config && window.pSUPERFLY?.virtualPage) {
      window._sf_async_config.title = document.title;
      window._sf_async_config.path = pathname;
      window._sf_async_config.sections = 'NFL HQ';
      window._sf_async_config.authors = 'HQ Hubs';
      window.pSUPERFLY.virtualPage(pathname, document.title);
    }
  }, [pathname]);

  return null;
}
