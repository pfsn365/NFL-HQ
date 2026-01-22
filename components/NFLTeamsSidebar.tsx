'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { getAllTeams, TeamData } from '@/data/teams';

interface NFLTeamsSidebarProps {
  currentTeam?: TeamData;
  currentTab?: string;
  isMobile?: boolean;
}

const NFLTeamsSidebar: React.FC<NFLTeamsSidebarProps> = ({ currentTeam, currentTab = 'overview', isMobile = false }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isTeamsExpanded, setIsTeamsExpanded] = useState(false);
  const [isNFLToolsExpanded, setIsNFLToolsExpanded] = useState(true);
  const [isImpactRankingsExpanded, setIsImpactRankingsExpanded] = useState(false);
  const [isOtherToolsExpanded, setIsOtherToolsExpanded] = useState(true);
  const allTeams = getAllTeams();
  const pathname = usePathname();

  // Helper to normalize pathname by removing trailing slashes for comparison
  const normalizePath = (path: string) => path.replace(/\/$/, '');

  // Get the normalized current pathname (usePathname returns path without basePath)
  const normalizedPathname = normalizePath(pathname);

  // Check if current page matches a given URL
  // URLs in nflTools include /nfl-hq prefix, but usePathname() returns without basePath
  const isActivePage = (url: string) => {
    const normalizedUrl = normalizePath(url);
    // Strip /nfl-hq prefix from URL for comparison since pathname doesn't include it
    const urlWithoutBase = normalizedUrl.replace(/^\/nfl-hq/, '');
    return normalizedPathname === urlWithoutBase || normalizedPathname === normalizedUrl;
  };

  // Check if we're on the home page (pathname will be '' or '/' when at /nfl-hq/)
  const isHomePage = normalizedPathname === '' || normalizedPathname === '/';

  // Check if we're on the Super Bowl LX page
  const isSuperBowlLXPage = normalizedPathname === '/super-bowl-lx';

  // Function to generate team URL based on current tab
  const getTeamUrl = (teamId: string) => {
    if (currentTab === 'overview') {
      return `/nfl-hq/teams/${teamId}`;
    }
    return `/nfl-hq/teams/${teamId}/${currentTab}`;
  };

  const nflTools = [
    // UNCOMMENT AFTER CONFERENCE CHAMPIONSHIPS TO LAUNCH SUPER BOWL HUB
    // { title: 'Super Bowl Hub', url: '/nfl-hq/super-bowl-hub', external: false, icon: '/nfl-hq/super-bowl-lx-logo.png' },
    { title: 'NFL Free Agency Tracker', url: '/nfl-hq/free-agency-tracker', external: false },
    { title: 'NFL Schedule', url: '/nfl-hq/schedule', external: false },
    { title: 'NFL Standings', url: '/nfl-hq/standings', external: false },
    { title: 'NFL Injury Report', url: '/nfl-hq/injuries', external: false },
    { title: 'NFL Stat Leaders', url: '/nfl-hq/stats', external: false },
    { title: 'NFL Ultimate GM Simulator', url: 'https://www.profootballnetwork.com/cta-ultimate-gm-simulator-nfl/', external: true },
    { title: 'NFL Draft Hub', url: 'https://www.profootballnetwork.com/nfl-draft-hq/', external: true },
    { title: 'NFL Playoff Predictor', url: 'https://www.profootballnetwork.com/nfl-playoff-predictor', external: true },
    { title: 'NFL Power Rankings Builder', url: '/nfl-hq/power-rankings-builder', external: false },
    { title: 'NFL Player Rankings Builder', url: '/nfl-hq/player-rankings-builder', external: false },
    { title: 'NFL Transactions', url: '/nfl-hq/transactions', external: false },
    { title: 'NFL Mock Draft Simulator', url: 'https://www.profootballnetwork.com/mockdraft', external: true },
    { title: 'NFL Salary Cap Tracker', url: '/nfl-hq/salary-cap-tracker', external: false },
    { title: 'NFL Player Pages', url: '/nfl-hq/players', external: false },
  ];


  const otherTools = [
    { title: 'Fantasy Football Hub', url: 'https://www.profootballnetwork.com/fantasy/football/' },
    { title: 'CFB Transfer Portal Tracker', url: 'https://www.profootballnetwork.com/cfb-hq/transfer-portal-tracker' },
    { title: 'CFB Playoff Predictor', url: 'https://www.profootballnetwork.com/cfb/playoff-predictor-cfb-cta/' },
    { title: 'NBA HQ', url: 'https://www.profootballnetwork.com/nba-hq/' },
    { title: 'NBA Mock Draft Simulator', url: 'https://www.profootballnetwork.com/nba-mock-draft-simulator' },
    { title: 'World Cup Simulator', url: 'https://www.profootballnetwork.com/fifa-world-cup-simulator/' },
    { title: 'MLB Playoff Predictor', url: 'https://www.profootballnetwork.com/mlb-playoff-predictor/' },
  ];

  const impactRankings = [
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
  ];

  // Mobile version
  if (isMobile) {
    return (
      <div className="w-full bg-black">
        <div className="flex items-center justify-between px-4 py-3 bg-black">
          <div className="flex items-center gap-3">
            {/* Hamburger menu icon */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-white p-2.5 -m-1.5 rounded-lg hover:bg-white/10 active:bg-white/20 transition-colors"
              aria-label="Toggle menu"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>

            {/* PFSN Logo */}
            <a href="https://www.profootballnetwork.com" target="_blank" rel="noopener noreferrer" className="block">
              <img
                src="https://statico.profootballnetwork.com/wp-content/uploads/2025/06/12093424/tools-navigation-06-12-25.jpg"
                alt="PFSN Logo"
                style={{ height: '24px' }}
                className="h-6 w-auto transition-all duration-300 hover:opacity-80"
              />
            </a>

            <span className="text-white font-semibold text-sm">NFL HQ</span>
          </div>

          {/* Dropdown arrow - clickable */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-white p-1"
            aria-label="Toggle dropdown"
          >
            <svg
              className={`w-4 h-4 transform transition-transform duration-300 ease-out ${isExpanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </div>

        {isExpanded && (
          <div className="bg-black border-t border-gray-800">
            {/* Home, Super Bowl LX, and Browse All Teams */}
            <div className="px-4 py-2 border-b border-gray-800">
              <div className="grid grid-cols-1 gap-1">
                <a
                  href="/nfl-hq/"
                  className={`block p-2 rounded text-sm transition-colors ${
                    isHomePage
                      ? 'bg-[#0050A0] text-white'
                      : 'text-white hover:bg-gray-800'
                  }`}
                >
                  <div className="text-xs">Home</div>
                </a>
                <a
                  href="/nfl-hq/super-bowl-lx"
                  className={`block p-2 rounded text-sm transition-colors ${
                    isSuperBowlLXPage
                      ? 'bg-[#0050A0] text-white'
                      : 'text-white hover:bg-gray-800'
                  }`}
                >
                  <div className="text-xs flex items-center gap-1">
                    <img
                      src="https://staticd.profootballnetwork.com/skm/assets/pfn/sblx-logo.png"
                      alt="Super Bowl LX"
                      className="h-3 w-3 object-contain"
                    />
                    Super Bowl LX
                  </div>
                </a>
                <a
                  href="/nfl-hq/teams"
                  className={`block p-2 rounded text-sm transition-colors ${
                    isActivePage('/nfl-hq/teams')
                      ? 'bg-[#0050A0] text-white'
                      : 'text-white hover:bg-gray-800'
                  }`}
                >
                  <div className="text-xs">Browse All Teams</div>
                </a>
              </div>
            </div>

            {/* NFL TOOLS Section */}
            <div className="px-4 py-2 border-b border-gray-800">
              <div
                role="button"
                tabIndex={0}
                aria-expanded={isNFLToolsExpanded}
                aria-controls="nfl-tools-menu"
                className="flex items-center justify-between mb-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                onClick={() => setIsNFLToolsExpanded(!isNFLToolsExpanded)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setIsNFLToolsExpanded(!isNFLToolsExpanded); } }}
              >
                <div className="text-[#0050A0] text-xs font-bold uppercase tracking-wider">NFL Tools</div>
                <svg
                  className={`w-4 h-4 text-[#0050A0] transform transition-transform duration-300 ease-out ${isNFLToolsExpanded ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
              {isNFLToolsExpanded && (
                <div className="grid grid-cols-1 gap-1">
                  {nflTools.map((tool, index) => {
                    const isActive = !tool.external && isActivePage(tool.url);
                    const toolWithIcon = tool as typeof tool & { icon?: string };

                    return (
                      <React.Fragment key={tool.title}>
                        <a
                          href={tool.url}
                          {...(tool.external && { target: "_blank", rel: "noopener noreferrer" })}
                          className={`block p-2 rounded text-sm transition-colors ${
                            isActive ? 'bg-[#0050A0] text-white' : 'text-white hover:bg-gray-800'
                          }`}
                        >
                          <div className="text-xs flex items-center gap-2">
                            <span>{tool.title}</span>
                            {toolWithIcon.icon && (
                              <img src={toolWithIcon.icon} alt="" className="w-6 h-6 object-contain flex-shrink-0" />
                            )}
                          </div>
                        </a>
                        {/* PFSN Impact Rankings - expandable submenu after Free Agency Tracker */}
                        {tool.title === 'NFL Free Agency Tracker' && (
                          <div>
                            <button
                              onClick={() => setIsImpactRankingsExpanded(!isImpactRankingsExpanded)}
                              className="w-full flex items-center justify-between p-2 rounded text-sm transition-colors text-white hover:bg-gray-800 cursor-pointer"
                            >
                              <div className="text-xs">PFSN Impact Rankings</div>
                              <svg
                                className={`w-3 h-3 transform transition-transform duration-300 ease-out ${isImpactRankingsExpanded ? 'rotate-180' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                            {isImpactRankingsExpanded && (
                              <div className="pl-3 grid grid-cols-1 gap-1">
                                {impactRankings.map((item) => (
                                  <a
                                    key={item.title}
                                    href={item.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block p-2 rounded text-sm transition-colors text-white hover:bg-gray-800"
                                  >
                                    <div className="text-xs">{item.title}</div>
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              )}
            </div>

            {/* NFL TEAMS Section */}
            <div className="px-4 py-2 border-b border-gray-800">
              <div
                role="button"
                tabIndex={0}
                aria-expanded={isTeamsExpanded}
                aria-controls="nfl-teams-menu"
                className="flex items-center justify-between mb-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                onClick={() => setIsTeamsExpanded(!isTeamsExpanded)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setIsTeamsExpanded(!isTeamsExpanded); } }}
              >
                <div className="text-[#0050A0] text-xs font-bold uppercase tracking-wider">NFL Teams</div>
                <svg
                  className={`w-4 h-4 text-[#0050A0] transform transition-transform duration-300 ease-out ${isTeamsExpanded ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
              {isTeamsExpanded && (
                <div className="grid grid-cols-2 gap-1">
                  {allTeams.map((team) => {
                    const isCurrentTeam = currentTeam?.id === team.id;
                    return (
                      <a
                        key={team.id}
                        href={getTeamUrl(team.id)}
                        className={`flex items-center gap-2 p-2 rounded text-sm transition-colors ${
                          isCurrentTeam ? 'bg-[#0050A0] text-white' : 'text-white hover:bg-gray-800'
                        }`}
                      >
                        <img
                          src={team.logoUrl}
                          alt={team.abbreviation}
                          className="w-5 h-5 flex-shrink-0"
                        />
                        <div className="text-xs">{team.abbreviation}</div>
                      </a>
                    );
                  })}
                </div>
              )}
            </div>

            {/* OTHER TOOLS Section */}
            <div className="px-4 py-2">
              <div
                role="button"
                tabIndex={0}
                aria-expanded={isOtherToolsExpanded}
                aria-controls="other-tools-menu"
                className="flex items-center justify-between mb-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                onClick={() => setIsOtherToolsExpanded(!isOtherToolsExpanded)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setIsOtherToolsExpanded(!isOtherToolsExpanded); } }}
              >
                <div className="text-[#0050A0] text-xs font-bold uppercase tracking-wider">Other Sports</div>
                <svg
                  className={`w-4 h-4 text-[#0050A0] transform transition-transform duration-300 ease-out ${isOtherToolsExpanded ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
              {isOtherToolsExpanded && (
                <div className="grid grid-cols-1 gap-1">
                  {otherTools.map((tool) => (
                    <a
                      key={tool.title}
                      href={tool.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-2 rounded text-sm transition-colors text-white hover:bg-gray-800"
                    >
                      <div className="text-xs">{tool.title}</div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Desktop version
  return (
    <div className="w-full h-full bg-black border-r border-gray-800 flex flex-col">
      {/* Header with logo */}
      <div className="flex items-center justify-center px-4 py-4 border-b border-gray-800">
        <a href="https://www.profootballnetwork.com" target="_blank" rel="noopener noreferrer" className="block">
          <img
            src="https://statico.profootballnetwork.com/wp-content/uploads/2025/06/12093424/tools-navigation-06-12-25.jpg"
            alt="PFSN Logo"
            width={240}
            height={48}
            className="w-full h-auto transition-all duration-300 hover:opacity-80"
          />
        </a>
      </div>

      {/* Navigation - scrollable section */}
      <nav className="flex-1 overflow-y-auto py-4 teams-sidebar-scroll">
        <ul className="space-y-0.5">
          {/* Home Button */}
          <li>
            <a
              href="/nfl-hq/"
              className={`relative flex items-center px-3 py-2 mx-1 rounded-md transition-all duration-200 ${
                isHomePage
                  ? 'bg-[#0050A0] text-white'
                  : 'text-gray-100 hover:bg-gray-800/50 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2 w-full">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
                <span className="text-sm font-medium">Home</span>
              </div>
            </a>
          </li>

          {/* Super Bowl LX Button */}
          <li>
            <a
              href="/nfl-hq/super-bowl-lx"
              className={`relative flex items-center px-3 py-2 mx-1 rounded-md transition-all duration-200 ${
                isSuperBowlLXPage
                  ? 'bg-[#0050A0] text-white'
                  : 'text-gray-100 hover:bg-gray-800/50 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2 w-full">
                <img
                  src="https://staticd.profootballnetwork.com/skm/assets/pfn/sblx-logo.png"
                  alt="Super Bowl LX"
                  className="h-4 w-4 object-contain"
                />
                <span className="text-sm font-medium">Super Bowl LX</span>
              </div>
            </a>
          </li>

          {/* Browse All Teams Button */}
          <li className="mb-4">
            <a
              href="/nfl-hq/teams"
              className={`relative flex items-center px-3 py-2 mx-1 rounded-md transition-all duration-200 ${
                isActivePage('/nfl-hq/teams')
                  ? 'bg-[#0050A0] text-white'
                  : 'text-gray-100 hover:bg-gray-800/50 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2 w-full">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                  />
                </svg>
                <span className="text-sm font-medium">Browse All Teams</span>
              </div>
            </a>
          </li>

          {/* NFL Tools Section */}
          <li className="mb-2 pt-2">
            <div className="px-3 mb-2">
              <div className="flex items-center justify-between min-w-0">
                <div className="flex items-center gap-2 min-w-0 flex-shrink">
                  <div className="h-0.5 w-3 bg-gray-600 rounded flex-shrink-0"></div>
                  <span className="text-xs font-bold text-gray-100 uppercase tracking-wider truncate">NFL Tools</span>
                </div>
                <div className="flex-1 ml-3 h-px bg-gradient-to-r from-gray-800 to-transparent flex-shrink-0"></div>
              </div>
            </div>
          </li>
          {nflTools.map((tool) => {
            const isActive = !tool.external && isActivePage(tool.url);
            const toolWithIcon = tool as typeof tool & { icon?: string };

            return (
              <React.Fragment key={tool.title}>
                <li>
                  <a
                    href={tool.url}
                    {...(tool.external && { target: "_blank", rel: "noopener noreferrer" })}
                    className={`relative flex items-center px-3 py-2 mx-1 rounded-md transition-all duration-200 ${
                      isActive
                        ? 'bg-[#0050A0] text-white'
                        : 'text-gray-100 hover:bg-gray-800/50 hover:text-white'
                    }`}
                  >
                    <span className="text-sm font-medium truncate flex items-center gap-2">
                      {tool.title}
                      {toolWithIcon.icon && (
                        <img src={toolWithIcon.icon} alt="" className="w-7 h-7 object-contain flex-shrink-0" />
                      )}
                      {tool.external && (
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-3 h-3 opacity-50">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      )}
                    </span>
                  </a>
                </li>
                {/* PFSN Impact Rankings - expandable submenu after Free Agency Tracker */}
                {tool.title === 'NFL Free Agency Tracker' && (
                  <>
                    <li>
                      <button
                        onClick={() => setIsImpactRankingsExpanded(!isImpactRankingsExpanded)}
                        className="w-full relative flex items-center justify-between px-3 py-2 mx-1 rounded-md transition-all duration-200 text-gray-100 hover:bg-gray-800/50 hover:text-white cursor-pointer"
                      >
                        <span className="text-sm font-medium truncate">
                          PFSN Impact Rankings
                        </span>
                        <svg
                          className={`w-4 h-4 transform transition-transform duration-300 ease-out ${isImpactRankingsExpanded ? 'rotate-180' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </li>
                    {isImpactRankingsExpanded && impactRankings.map((item) => (
                      <li key={item.title}>
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="relative flex items-center px-3 py-2 mx-1 ml-4 rounded-md transition-all duration-200 text-gray-100 hover:bg-gray-800/50 hover:text-white"
                        >
                          <span className="text-sm font-medium truncate flex items-center gap-2">
                            {item.title}
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-3 h-3 opacity-50">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </span>
                        </a>
                      </li>
                    ))}
                  </>
                )}
              </React.Fragment>
            );
          })}

          {/* NFL Teams Section */}
          <li className="mb-2 pt-6">
            <div className="px-3 mb-2">
              <div className="flex items-center justify-between min-w-0">
                <div className="flex items-center gap-2 min-w-0 flex-shrink">
                  <div className="h-0.5 w-3 bg-gray-600 rounded flex-shrink-0"></div>
                  <span className="text-xs font-bold text-gray-100 uppercase tracking-wider truncate">
                    NFL Teams {currentTab && `- ${currentTab.replace('-', ' ').toUpperCase()}`}
                  </span>
                </div>
                <div className="flex-1 ml-3 h-px bg-gradient-to-r from-gray-800 to-transparent flex-shrink-0"></div>
              </div>
            </div>
          </li>
          {(isTeamsExpanded ? allTeams : allTeams.slice(0, 8)).map((team) => {
            const isCurrentTeam = currentTeam?.id === team.id;
            return (
              <li key={team.id}>
                <a
                  href={getTeamUrl(team.id)}
                  className={`
                    relative flex items-center px-3 py-2 mx-1 rounded-md transition-all duration-200
                    ${isCurrentTeam
                      ? 'bg-[#0050A0] text-white'
                      : 'text-gray-100 hover:bg-gray-800/50 hover:text-white'
                    }
                  `}
                >
                  <div className="flex items-center gap-2 w-full">
                    <img
                      src={team.logoUrl}
                      alt={team.abbreviation}
                      width={16}
                      height={16}
                      className="w-4 h-4 flex-shrink-0"
                    />
                    <span className="text-sm font-medium truncate">
                      {team.fullName}
                    </span>
                  </div>
                </a>
              </li>
            );
          })}

          {allTeams.length > 8 && !isTeamsExpanded && (
            <li className="mb-4">
              <button
                onClick={() => setIsTeamsExpanded(true)}
                className="w-full text-left px-3 py-2 mx-1 rounded-md transition-all duration-200 text-gray-200 hover:bg-gray-800/50 hover:text-white"
              >
                <span className="text-xs font-medium">+ Show More Teams</span>
              </button>
            </li>
          )}

          {isTeamsExpanded && (
            <li className="mb-4">
              <button
                onClick={() => setIsTeamsExpanded(false)}
                className="w-full text-left px-3 py-2 mx-1 rounded-md transition-all duration-200 text-gray-200 hover:bg-gray-800/50 hover:text-white"
              >
                <span className="text-xs font-medium">- Show Fewer Teams</span>
              </button>
            </li>
          )}

          {/* Other Tools Section */}
          <li className="pt-6">
            <div className="px-3 mb-2">
              <div className="flex items-center justify-between min-w-0">
                <div className="flex items-center gap-2 min-w-0 flex-shrink">
                  <div className="h-0.5 w-3 bg-gray-600 rounded flex-shrink-0"></div>
                  <span className="text-xs font-bold text-gray-100 uppercase tracking-wider truncate">Other Sports</span>
                </div>
                <div className="flex-1 ml-3 h-px bg-gradient-to-r from-gray-800 to-transparent flex-shrink-0"></div>
              </div>
            </div>
          </li>
          {otherTools.map((tool) => (
            <li key={tool.title}>
              <a
                href={tool.url}
                target="_blank"
                rel="noopener noreferrer"
                className="relative flex items-center px-3 py-2 mx-1 rounded-md transition-all duration-200 text-gray-100 hover:bg-gray-800/50 hover:text-white"
              >
                <span className="text-sm font-medium truncate flex items-center gap-2">
                  {tool.title}
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-3 h-3 opacity-50">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* Bottom padding for footer ad - 92px blank space */}
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
