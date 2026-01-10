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
  const [isOtherToolsExpanded, setIsOtherToolsExpanded] = useState(true);
  const allTeams = getAllTeams();
  const pathname = usePathname();

  // Helper to normalize pathname by removing trailing slashes for comparison
  const normalizePath = (path: string) => path.replace(/\/$/, '');

  // Function to generate team URL based on current tab
  const getTeamUrl = (teamId: string) => {
    if (currentTab === 'overview') {
      return `/nfl-hq/teams/${teamId}`;
    }
    return `/nfl-hq/teams/${teamId}/${currentTab}`;
  };

  const nflTools = [
    { title: 'NFL Schedule', url: '/nfl-hq/schedule', external: false },
    { title: 'NFL Standings', url: '/nfl-hq/standings', external: false },
    { title: 'NFL Injury Report', url: '/nfl-hq/injuries', external: false },
    { title: 'NFL Stat Leaders', url: '/nfl-hq/stats', external: false },
    { title: 'NFL Free Agency Tracker', url: '/nfl-hq/free-agency-tracker', external: false },
    { title: 'NFL Draft Hub', url: 'https://www.profootballnetwork.com/nfl-draft-hq/', external: true },
    { title: 'NFL Playoff Predictor', url: 'https://www.profootballnetwork.com/nfl-playoff-predictor', external: true },
    { title: 'NFL Power Rankings Builder', url: '/nfl-hq/power-rankings-builder', external: false },
    { title: 'NFL Transactions', url: '/nfl-hq/transactions', external: false },
    { title: 'NFL Mock Draft Simulator', url: 'https://www.profootballnetwork.com/mockdraft', external: true },
    { title: 'NFL Salary Cap Tracker', url: '/nfl-hq/salary-cap-tracker', external: false },
    { title: 'NFL Ultimate GM Simulator', url: 'https://www.profootballnetwork.com/cta-ultimate-gm-simulator-nfl/', external: true },
  ];


  const otherTools = [
    { title: 'Fantasy Football Hub', url: 'https://www.profootballnetwork.com/fantasy/football/' },
    { title: 'CFB Playoff Predictor', url: 'https://www.profootballnetwork.com/cfb/playoff-predictor-cfb-cta/' },
    { title: 'NBA Mock Draft Simulator', url: 'https://www.profootballnetwork.com/nba-mock-draft-simulator' },
    { title: 'World Cup Simulator', url: 'https://www.profootballnetwork.com/fifa-world-cup-simulator/' },
    { title: 'MLB Playoff Predictor', url: 'https://www.profootballnetwork.com/mlb-playoff-predictor/' },
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
              className="text-white p-1"
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
              className={`w-4 h-4 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
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
            {/* Home and Browse All Teams */}
            <div className="px-4 py-2 border-b border-gray-800">
              <div className="grid grid-cols-1 gap-1">
                <a
                  href="/nfl-hq/"
                  className={`block p-2 rounded text-sm transition-colors ${
                    normalizePath(pathname) === '' || normalizePath(pathname) === '/'
                      ? 'bg-[#0050A0] text-white'
                      : 'text-white hover:bg-gray-800'
                  }`}
                >
                  <div className="text-xs">Home</div>
                </a>
                <a
                  href="/nfl-hq/teams"
                  className={`block p-2 rounded text-sm transition-colors ${
                    normalizePath(pathname) === '/teams'
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
                className="flex items-center justify-between mb-2 cursor-pointer"
                onClick={() => setIsNFLToolsExpanded(!isNFLToolsExpanded)}
              >
                <div className="text-[#0050A0] text-xs font-bold uppercase tracking-wider">NFL Tools</div>
                <svg
                  className={`w-4 h-4 text-[#0050A0] transform transition-transform ${isNFLToolsExpanded ? 'rotate-180' : ''}`}
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
                  {nflTools.map((tool) => {
                    const normalizedPathname = normalizePath(pathname);
                    const normalizedUrl = normalizePath(tool.url);
                    const isActive = !tool.external && normalizedPathname === normalizedUrl;

                    return (
                      <a
                        key={tool.title}
                        href={tool.url}
                        {...(tool.external && { target: "_blank", rel: "noopener noreferrer" })}
                        className={`block p-2 rounded text-sm transition-colors ${
                          isActive ? 'bg-[#0050A0] text-white' : 'text-white hover:bg-gray-800'
                        }`}
                      >
                        <div className="text-xs">{tool.title}</div>
                      </a>
                    );
                  })}
                </div>
              )}
            </div>

            {/* NFL TEAMS Section */}
            <div className="px-4 py-2 border-b border-gray-800">
              <div
                className="flex items-center justify-between mb-2 cursor-pointer"
                onClick={() => setIsTeamsExpanded(!isTeamsExpanded)}
              >
                <div className="text-[#0050A0] text-xs font-bold uppercase tracking-wider">NFL Teams</div>
                <svg
                  className={`w-4 h-4 text-[#0050A0] transform transition-transform ${isTeamsExpanded ? 'rotate-180' : ''}`}
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
                className="flex items-center justify-between mb-2 cursor-pointer"
                onClick={() => setIsOtherToolsExpanded(!isOtherToolsExpanded)}
              >
                <div className="text-[#0050A0] text-xs font-bold uppercase tracking-wider">Other Tools</div>
                <svg
                  className={`w-4 h-4 text-[#0050A0] transform transition-transform ${isOtherToolsExpanded ? 'rotate-180' : ''}`}
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
                normalizePath(pathname) === '' || normalizePath(pathname) === '/'
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

          {/* Browse All Teams Button */}
          <li className="mb-4">
            <a
              href="/nfl-hq/teams"
              className={`relative flex items-center px-3 py-2 mx-1 rounded-md transition-all duration-200 ${
                normalizePath(pathname) === '/teams'
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
                  <span className="text-[11px] font-bold text-gray-300 uppercase tracking-wider truncate">NFL Tools</span>
                </div>
                <div className="flex-1 ml-3 h-px bg-gradient-to-r from-gray-800 to-transparent flex-shrink-0"></div>
              </div>
            </div>
          </li>
          {nflTools.map((tool) => {
            const normalizedPathname = normalizePath(pathname);
            const normalizedUrl = normalizePath(tool.url);
            const isActive = !tool.external && normalizedPathname === normalizedUrl;

            return (
              <li key={tool.title}>
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
                    {tool.external && (
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-3 h-3 opacity-50">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    )}
                  </span>
                </a>
              </li>
            );
          })}

          {/* NFL Teams Section */}
          <li className="mb-2 pt-6">
            <div className="px-3 mb-2">
              <div className="flex items-center justify-between min-w-0">
                <div className="flex items-center gap-2 min-w-0 flex-shrink">
                  <div className="h-0.5 w-3 bg-gray-600 rounded flex-shrink-0"></div>
                  <span className="text-[11px] font-bold text-gray-300 uppercase tracking-wider truncate">
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
                className="w-full text-left px-3 py-2 mx-1 rounded-md transition-all duration-200 text-gray-400 hover:bg-gray-800/50 hover:text-white"
              >
                <span className="text-xs font-medium">+ Show More Teams</span>
              </button>
            </li>
          )}

          {isTeamsExpanded && (
            <li className="mb-4">
              <button
                onClick={() => setIsTeamsExpanded(false)}
                className="w-full text-left px-3 py-2 mx-1 rounded-md transition-all duration-200 text-gray-400 hover:bg-gray-800/50 hover:text-white"
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
                  <span className="text-[11px] font-bold text-gray-300 uppercase tracking-wider truncate">Other Tools</span>
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
                className="relative flex items-center px-3 py-2 mx-1 rounded-md transition-all duration-200 text-gray-300 hover:bg-gray-800/50 hover:text-white"
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
