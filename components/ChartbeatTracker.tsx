'use client';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

export default function ChartbeatTracker() {
  const pathname = usePathname();
  const fullPath = `/nfl-hq${pathname}`;

  useEffect(() => {
    if (window._sf_async_config && window.pSUPERFLY?.virtualPage) {
      window._sf_async_config.title = document.title;
      window._sf_async_config.path = fullPath;
      window._sf_async_config.sections = 'NFL HQ';
      window._sf_async_config.authors = 'HQ Hubs';
      window.pSUPERFLY.virtualPage(fullPath, document.title);
    }
  }, [fullPath]);

  return null;
}
