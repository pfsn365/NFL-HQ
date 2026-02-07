'use client';

import { useState, useEffect } from 'react';
import NFLTeamsSidebar from '@/components/NFLTeamsSidebar';

interface SidebarLayoutProps {
  children: React.ReactNode;
}

export default function SidebarLayout({ children }: SidebarLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Sync collapsed state to body class for external CSS (footer)
  useEffect(() => {
    if (sidebarCollapsed) {
      document.body.classList.add('sidebar-collapsed');
    } else {
      document.body.classList.remove('sidebar-collapsed');
    }

    return () => {
      document.body.classList.remove('sidebar-collapsed');
    };
  }, [sidebarCollapsed]);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:block fixed top-0 left-0 h-screen z-10 transition-all duration-300 ${
          sidebarCollapsed ? 'w-0 overflow-hidden' : 'w-64'
        }`}
      >
        <NFLTeamsSidebar />
      </aside>

      {/* Toggle button - desktop only, positioned below the ticker */}
      <button
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        className={`hidden lg:flex fixed top-10 z-20 w-8 h-8 bg-black items-center justify-center rounded-r-md transition-all duration-300 hover:bg-gray-800 cursor-pointer ${
          sidebarCollapsed ? 'left-0' : 'left-64'
        }`}
        aria-label={sidebarCollapsed ? 'Open sidebar' : 'Close sidebar'}
      >
        {sidebarCollapsed ? (
          // PanelLeftOpen icon
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect width="18" height="18" x="3" y="3" rx="2" />
            <path d="M9 3v18" />
            <path d="m14 9 3 3-3 3" />
          </svg>
        ) : (
          // PanelLeftClose icon
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect width="18" height="18" x="3" y="3" rx="2" />
            <path d="M9 3v18" />
            <path d="m16 15-3-3 3-3" />
          </svg>
        )}
      </button>

      {/* Mobile sidebar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-20">
        <NFLTeamsSidebar isMobile={true} />
      </div>

      {/* Main content */}
      <div
        className={`flex-1 min-w-0 transition-all duration-300 ${
          sidebarCollapsed ? 'lg:ml-0' : 'lg:ml-64'
        }`}
      >
        {children}
      </div>
    </div>
  );
}
