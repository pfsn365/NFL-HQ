'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

interface NFLTeamsSidebarProps {
  isMobile?: boolean;
}

interface NavItem {
  title: string;
  url: string;
  internal: boolean;
}

const NFLTeamsSidebar: React.FC<NFLTeamsSidebarProps> = ({ isMobile = false }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedHub, setExpandedHub] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  const normalizePath = (path: string) => path.replace(/\/$/, '');
  const normalizedPathname = normalizePath(pathname);
  const isActivePage = (url: string) => normalizedPathname === normalizePath(url);
  const isHomePage = normalizedPathname === '' || normalizedPathname === '/';

  const isOnHubPage = (hubUrl: string) => {
    const normalizedUrl = normalizePath(hubUrl);
    return normalizedPathname === normalizedUrl || normalizedPathname.startsWith(normalizedUrl);
  };

  // Navigate to hub page and expand dropdown (matches draft hub pattern)
  const navigateToHub = (hubTitle: string, hubUrl: string) => {
    if (isOnHubPage(hubUrl)) {
      setExpandedHub(expandedHub === hubTitle ? null : hubTitle);
    } else {
      router.push(hubUrl);
      setExpandedHub(hubTitle);
      if (isMobile) setIsExpanded(false);
    }
  };

  // Super Bowl HQ — expandable hub
  const superBowlHub = {
    title: 'Super Bowl HQ',
    url: '/super-bowl-lx',
    logo: 'https://staticd.profootballnetwork.com/skm/assets/pfn/sblx-logo.png',
    tabs: [
      { title: 'Overview', tab: 'overview' },
      { title: 'Path to Super Bowl', tab: 'path-to-super-bowl' },
      { title: 'Rosters & Depth Charts', tab: 'rosters' },
      { title: 'Injury Report', tab: 'injuries' },
      { title: 'Stats Comparison', tab: 'stats' },
      { title: 'Head-to-Head', tab: 'head-to-head' },
      { title: 'Super Bowl History', tab: 'history' },
    ],
  };

  // PFSN Impact Rankings — expandable hub
  const impactRankingsHub = {
    title: 'PFSN Impact Rankings',
    tabs: [
      { title: 'Team Offense', url: 'https://www.profootballnetwork.com/nfl-offense-rankings-impact/' },
      { title: 'Team Defense', url: 'https://www.profootballnetwork.com/nfl-defense-rankings-impact/' },
      { title: 'QB', url: 'https://www.profootballnetwork.com/nfl-qb-rankings-impact/' },
      { title: 'RB', url: 'https://www.profootballnetwork.com/nfl-rb-rankings-impact/' },
      { title: 'WR', url: 'https://www.profootballnetwork.com/nfl-wr-rankings-impact/' },
      { title: 'TE', url: 'https://www.profootballnetwork.com/nfl-te-rankings-impact/' },
      { title: 'OL', url: 'https://www.profootballnetwork.com/nfl-player-ol-rankings-impact/' },
      { title: 'DT', url: 'https://www.profootballnetwork.com/nfl-dt-rankings-impact/' },
      { title: 'EDGE', url: 'https://www.profootballnetwork.com/nfl-edge-rankings-impact/' },
      { title: 'LB', url: 'https://www.profootballnetwork.com/nfl-lb-rankings-impact/' },
      { title: 'CB', url: 'https://www.profootballnetwork.com/nfl-cb-rankings-impact/' },
      { title: 'SAF', url: 'https://www.profootballnetwork.com/nfl-saf-rankings-impact/' },
    ],
  };

  // Auto-expand hub dropdown when on a hub page
  useEffect(() => {
    if (isOnHubPage(superBowlHub.url)) {
      setExpandedHub(superBowlHub.title);
    }
  }, [pathname]);

  // ── Grouped navigation sections ─────────────────────────────────────

  const navSections = [
    {
      label: 'Offseason Hub',
      items: [
        { title: 'Team Needs', url: '/team-needs', internal: true },
        { title: 'Salary Cap Tracker', url: '/salary-cap-tracker', internal: true },
        { title: 'NFL Articles', url: '/articles', internal: true },
        { title: 'Offseason Manager', url: 'https://www.profootballnetwork.com/nfl-offseason-salary-cap-free-agency-manager', internal: false },
      ],
    },
    {
      label: 'Rankings',
      items: [
        { title: 'Player Rankings Builder', url: '/player-rankings-builder', internal: true },
        { title: 'Power Rankings Builder', url: '/power-rankings-builder', internal: true },
      ],
      // PFSN Impact Rankings expandable hub is rendered before these items
      hasImpactRankings: true,
    },
    {
      label: 'Season',
      items: [
        { title: 'Schedule', url: '/schedule', internal: true },
        { title: 'Standings', url: '/standings', internal: true },
        { title: 'Injury Report', url: '/injuries', internal: true },
        { title: 'Stat Leaders', url: '/stats', internal: true },
        { title: 'Transactions', url: '/transactions', internal: true },
        { title: 'Player Pages', url: '/players', internal: true },
      ],
    },
    {
      label: 'Simulators & Games',
      items: [
        { title: 'Mock Draft Simulator', url: 'https://www.profootballnetwork.com/mockdraft', internal: false },
        { title: 'Playoff Predictor', url: 'https://www.profootballnetwork.com/nfl-playoff-predictor', internal: false },
        { title: 'Player Guessing Game', url: 'https://www.profootballnetwork.com/nfl-player-guessing-game/', internal: false },
        { title: 'NFL Connections', url: 'https://www.profootballnetwork.com/games/nfl-connections/', internal: false },
      ],
    },
    {
      label: 'Other Hubs',
      items: [
        { title: 'NFL Draft HQ', url: 'https://www.profootballnetwork.com/nfl-draft-hq/', internal: false },
      ],
      // Super Bowl HQ expandable hub is rendered before these items
      hasSuperBowlHub: true,
    },
  ];

  // ── Shared helpers ──────────────────────────────────────────────────

  const ExternalIcon = () => (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-3 h-3 opacity-50 flex-shrink-0">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  );

  const renderNavItem = (item: NavItem, closeMobile = false) => {
    const isActive = item.internal && isActivePage(item.url);
    const linkContent = (
      <span className="text-[13px] font-medium truncate flex items-center gap-2">
        {item.title}
        {!item.internal && <ExternalIcon />}
      </span>
    );

    return (
      <li key={item.title}>
        {item.internal ? (
          <Link
            href={item.url}
            onClick={closeMobile ? () => setIsExpanded(false) : undefined}
            className={`relative flex items-center px-3 py-1.5 mx-1 rounded-md transition-all duration-200 ${
              isActive
                ? 'bg-[#0050A0] text-white'
                : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
            }`}
          >
            {linkContent}
          </Link>
        ) : (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="relative flex items-center px-3 py-1.5 mx-1 rounded-md transition-all duration-200 text-gray-400 hover:bg-gray-800/50 hover:text-white"
          >
            {linkContent}
          </a>
        )}
      </li>
    );
  };

  // Section header (matches draft hub exactly)
  const SectionHeader = ({ label }: { label: string }) => (
    <li className="pt-8 mb-1">
      <div className="px-3 mx-1 mb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-100 uppercase tracking-wider">{label}</span>
          </div>
          <div className="flex-1 ml-3 h-px bg-gradient-to-r from-gray-600 to-transparent"></div>
        </div>
      </div>
    </li>
  );

  // Impact Rankings expandable
  const renderImpactRankings = (closeMobile = false) => {
    const isHubExpanded = expandedHub === impactRankingsHub.title;
    return (
      <li>
        <button
          onClick={() => setExpandedHub(isHubExpanded ? null : impactRankingsHub.title)}
          className="w-full relative flex items-center justify-between px-3 py-1.5 mx-1 rounded-md transition-all duration-200 cursor-pointer text-gray-400 hover:bg-gray-800/50 hover:text-white"
        >
          <span className="text-[13px] font-medium truncate">{impactRankingsHub.title}</span>
          <svg
            className={`w-4 h-4 transition-transform flex-shrink-0 ${isHubExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {isHubExpanded && (
          <ul className="mt-1 ml-4 space-y-0.5">
            {impactRankingsHub.tabs.map((tab) => (
              <li key={tab.title}>
                <a
                  href={tab.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={closeMobile ? () => setIsExpanded(false) : undefined}
                  className="block px-3 py-1.5 mx-1 rounded-md text-[13px] font-medium text-gray-400 hover:bg-gray-800/50 hover:text-white transition-all duration-200"
                >
                  <span className="flex items-center gap-2">
                    {tab.title}
                    <ExternalIcon />
                  </span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </li>
    );
  };

  // Super Bowl HQ expandable
  const renderSuperBowlHub = (closeMobile = false) => {
    const isHubActive = isOnHubPage(superBowlHub.url);
    const isHubExpanded = expandedHub === superBowlHub.title;
    return (
      <li>
        <button
          onClick={() => navigateToHub(superBowlHub.title, superBowlHub.url)}
          className={`w-full relative flex items-center justify-between px-3 py-1.5 mx-1 rounded-md transition-all duration-200 cursor-pointer ${
            isHubActive
              ? 'bg-[#0050A0] text-white'
              : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
          }`}
        >
          <span className="text-[13px] font-medium truncate flex items-center gap-2">
            <img
              src={superBowlHub.logo}
              alt="Super Bowl LX"
              className="h-5 w-5 object-contain"
            />
            {superBowlHub.title}
          </span>
          <svg
            className={`w-4 h-4 transition-transform flex-shrink-0 ${isHubExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {isHubExpanded && (
          <ul className="mt-1 ml-4 space-y-0.5">
            {superBowlHub.tabs.map((tab) => (
              <li key={tab.tab}>
                <Link
                  href={`${superBowlHub.url}?tab=${tab.tab}`}
                  onClick={closeMobile ? () => setIsExpanded(false) : undefined}
                  className="block px-3 py-1.5 mx-1 rounded-md text-[13px] font-medium text-gray-400 hover:bg-gray-800/50 hover:text-white transition-all duration-200"
                >
                  {tab.title}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </li>
    );
  };

  // Render all nav sections
  const renderSections = (closeMobile = false) => (
    <>
      {navSections.map((section) => (
        <React.Fragment key={section.label}>
          <SectionHeader label={section.label} />
          {'hasImpactRankings' in section && section.hasImpactRankings && renderImpactRankings(closeMobile)}
          {'hasSuperBowlHub' in section && section.hasSuperBowlHub && renderSuperBowlHub(closeMobile)}
          {section.items.map((item) => renderNavItem(item, closeMobile))}
        </React.Fragment>
      ))}
    </>
  );

  // ══════════════════════════════════════════════════════════════════════
  //  MOBILE
  // ══════════════════════════════════════════════════════════════════════

  if (isMobile) {
    return (
      <div className="w-full bg-black">
        <div className="flex items-center justify-between px-3 h-12 bg-black">
          {/* Left — Hamburger / X */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-white p-2 cursor-pointer"
            aria-label="Toggle menu"
          >
            {isExpanded ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>

          {/* Center — PFSN Logo */}
          <a href="https://www.profootballnetwork.com" target="_blank" rel="noopener noreferrer" className="absolute left-1/2 transform -translate-x-1/2 h-8 flex items-center">
            <img
              src="https://statico.profootballnetwork.com/wp-content/uploads/2025/06/12093424/tools-navigation-06-12-25.jpg"
              alt="PFSN Logo"
              loading="lazy"
              width="96"
              height="24"
              className="max-h-6 w-auto object-contain transition-all duration-300 hover:opacity-80"
            />
          </a>

          {/* Right — spacer to balance layout */}
          <div className="w-9" />
        </div>

        {isExpanded && (
          <div className="bg-black border-t border-gray-800 max-h-[calc(100vh-48px)] flex flex-col">
            {/* Sticky top links */}
            <div className="bg-black border-b border-gray-800 pt-4 pb-2 flex-shrink-0">
              <ul className="space-y-0.5">
                <li>
                  <Link
                    href="/"
                    onClick={() => setIsExpanded(false)}
                    className={`relative flex items-center px-3 py-2 mx-1 rounded-md transition-all duration-200 ${
                      isHomePage
                        ? 'bg-[#0050A0] text-white'
                        : 'text-gray-100 hover:bg-gray-800/50 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 w-full">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                      <span className="text-[13px] font-medium">Home</span>
                    </div>
                  </Link>
                </li>
                <li>
                  <a
                    href="https://www.profootballnetwork.com/mockdraft"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setIsExpanded(false)}
                    className="relative flex items-center px-3 py-2 mx-1 rounded-md transition-all duration-200 text-gray-100 hover:bg-gray-800/50 hover:text-white"
                  >
                    <div className="flex items-center gap-2 w-full">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      <span className="text-[13px] font-medium">NFL Mock Draft Simulator</span>
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-3 h-3 opacity-50 flex-shrink-0">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </div>
                  </a>
                </li>
                <li>
                  <Link
                    href="/free-agency-tracker"
                    onClick={() => setIsExpanded(false)}
                    className={`relative flex items-center px-3 py-2 mx-1 rounded-md transition-all duration-200 ${
                      isActivePage('/free-agency-tracker')
                        ? 'bg-[#0050A0] text-white'
                        : 'text-gray-100 hover:bg-gray-800/50 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 w-full">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <span className="text-[13px] font-medium">NFL Free Agency Tracker</span>
                    </div>
                  </Link>
                </li>
                <li>
                  <a
                    href="https://www.profootballnetwork.com/cta-ultimate-gm-simulator-nfl/"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setIsExpanded(false)}
                    className="relative flex items-center px-3 py-2 mx-1 rounded-md transition-all duration-200 text-gray-100 hover:bg-gray-800/50 hover:text-white"
                  >
                    <div className="flex items-center gap-2 w-full">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span className="text-[13px] font-medium">Ultimate GM Simulator</span>
                    </div>
                  </a>
                </li>
                <li>
                  <Link
                    href="/teams"
                    onClick={() => setIsExpanded(false)}
                    className={`relative flex items-center px-3 py-2 mx-1 rounded-md transition-all duration-200 ${
                      isActivePage('/teams')
                        ? 'bg-[#0050A0] text-white'
                        : 'text-gray-100 hover:bg-gray-800/50 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 w-full">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                      </svg>
                      <span className="text-[13px] font-medium">Browse All Teams</span>
                    </div>
                  </Link>
                </li>
              </ul>
            </div>

            {/* Scrollable nav */}
            <div className="overflow-y-auto flex-1 py-4">
              <ul className="space-y-0.5">
                {renderSections(true)}
              </ul>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════
  //  DESKTOP
  // ══════════════════════════════════════════════════════════════════════

  return (
    <div className="w-full h-full bg-black border-r border-gray-800 flex flex-col">
      {/* Header with logo */}
      <div className="flex items-center justify-center px-4 py-4 border-b border-gray-800">
        <a href="https://www.profootballnetwork.com" target="_blank" rel="noopener noreferrer" className="block w-full">
          <img
            src="https://statico.profootballnetwork.com/wp-content/uploads/2025/06/12093424/tools-navigation-06-12-25.jpg"
            alt="PFSN Logo"
            loading="lazy"
            width="232"
            height="58"
            className="w-full h-auto transition-all duration-300 hover:opacity-80"
          />
        </a>
      </div>

      {/* Sticky top links */}
      <div className="bg-black border-b border-gray-800 pt-4 pb-2">
        <ul className="space-y-0.5">
          <li>
            <Link
              href="/"
              className={`relative flex items-center px-3 py-2 mx-1 rounded-md transition-all duration-200 ${
                isHomePage
                  ? 'bg-[#0050A0] text-white'
                  : 'text-gray-100 hover:bg-gray-800/50 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2 w-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span className="text-[13px] font-medium">Home</span>
              </div>
            </Link>
          </li>
          <li>
            <a
              href="https://www.profootballnetwork.com/mockdraft"
              target="_blank"
              rel="noopener noreferrer"
              className="relative flex items-center px-3 py-2 mx-1 rounded-md transition-all duration-200 text-gray-100 hover:bg-gray-800/50 hover:text-white"
            >
              <div className="flex items-center gap-2 w-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <span className="text-[13px] font-medium">NFL Mock Draft Simulator</span>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-3 h-3 opacity-50 flex-shrink-0">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </div>
            </a>
          </li>
          <li>
            <Link
              href="/free-agency-tracker"
              className={`relative flex items-center px-3 py-2 mx-1 rounded-md transition-all duration-200 ${
                isActivePage('/free-agency-tracker')
                  ? 'bg-[#0050A0] text-white'
                  : 'text-gray-100 hover:bg-gray-800/50 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2 w-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span className="text-[13px] font-medium">NFL Free Agency Tracker</span>
              </div>
            </Link>
          </li>
          <li>
            <a
              href="https://www.profootballnetwork.com/cta-ultimate-gm-simulator-nfl/"
              target="_blank"
              rel="noopener noreferrer"
              className="relative flex items-center px-3 py-2 mx-1 rounded-md transition-all duration-200 text-gray-100 hover:bg-gray-800/50 hover:text-white"
            >
              <div className="flex items-center gap-2 w-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="text-[13px] font-medium">Ultimate GM Simulator</span>
              </div>
            </a>
          </li>
          <li>
            <Link
              href="/teams"
              className={`relative flex items-center px-3 py-2 mx-1 rounded-md transition-all duration-200 ${
                isActivePage('/teams')
                  ? 'bg-[#0050A0] text-white'
                  : 'text-gray-100 hover:bg-gray-800/50 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2 w-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                <span className="text-[13px] font-medium">Browse All Teams</span>
              </div>
            </Link>
          </li>
        </ul>
      </div>

      {/* Navigation — scrollable section */}
      <nav className="flex-1 overflow-y-auto py-4 teams-sidebar-scroll">
        <ul className="space-y-0.5">
          {renderSections(false)}
        </ul>
      </nav>

      {/* Bottom padding for footer ad */}
      <div className="h-[92px] bg-black border-t border-gray-800" aria-hidden="true"></div>

      {/* Scrollbar styling */}
      <style jsx>{`
        .teams-sidebar-scroll {
          scrollbar-width: thin;
          scrollbar-color: #4b5563 transparent;
        }

        .teams-sidebar-scroll::-webkit-scrollbar {
          width: 6px;
        }

        .teams-sidebar-scroll::-webkit-scrollbar-track {
          background: transparent;
        }

        .teams-sidebar-scroll::-webkit-scrollbar-thumb {
          background-color: #4b5563;
          border-radius: 3px;
        }

        .teams-sidebar-scroll::-webkit-scrollbar-thumb:hover {
          background-color: #6b7280;
        }
      `}</style>
    </div>
  );
};

export default NFLTeamsSidebar;
