import React, { useState } from 'react';
import Link from 'next/link';
import { getAllTeams, TeamData } from '@/data/teams';


interface GamesPageSidebarProps {
  currentGame?: string;
  isMobile?: boolean;
  currentTeam?: TeamData;
  currentTab?: string;
}

const GamesPageSidebar: React.FC<GamesPageSidebarProps> = ({ currentGame, isMobile = false, currentTeam, currentTab = 'overview' }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isTeamsExpanded, setIsTeamsExpanded] = useState(false);
  const allTeams = getAllTeams();

  // Function to generate team URL based on current tab
  const getTeamUrl = (teamId: string) => {
    if (currentTab === 'overview') {
      return `/nfl/teams/${teamId}`;
    }
    return `/nfl/teams/${teamId}/${currentTab}`;
  };
  const nflTools = [
    { title: 'Mock Draft Simulator', url: 'https://www.profootballnetwork.com/mockdraft' },
    { title: '2026 NFL Draft HQ', url: 'https://www.profootballnetwork.com/nfl-draft-hq/' },
    { title: 'Playoff Predictor', url: 'https://www.profootballnetwork.com/nfl-playoff-predictor' },
    { title: 'Power Rankings Builder', url: 'https://www.profootballnetwork.com/nfl-power-rankings-builder/' },
    { title: 'Player Rankings Tool', url: 'https://www.profootballnetwork.com/nfl-player-rankings-tool' },
    { title: 'Offseason Manager', url: 'https://www.profootballnetwork.com/nfl-offseason-salary-cap-free-agency-manager' },
    { title: 'Salary Cap Space', url: 'https://www.profootballnetwork.com/nfl-salary-cap-space-by-team' },
  ];

  const fantasyTools = [
    { title: 'Fantasy Football Hub', url: 'https://www.profootballnetwork.com/fantasy/football' },
    { title: 'Trade Analyzer', url: 'https://www.profootballnetwork.com/fantasy-football-trade-analyzer' },
    { title: 'Start/Sit Optimizer', url: 'https://www.profootballnetwork.com/who-should-i-start-fantasy-optimizer' },
    { title: 'Waiver Wire Assistant', url: 'https://www.profootballnetwork.com/fantasy-football-waiver-wire' },
    { title: 'DFS Lineup Optimizer', url: 'https://www.profootballnetwork.com/nfl-dfs-optimizer-lineup-generator' },
  ];

  const otherTools = [
    { title: 'CFB Playoff Predictor', url: 'https://www.profootballnetwork.com/college-football-playoff-predictor' },
    { title: 'MLB Playoff Predictor', url: 'https://www.profootballnetwork.com/mlb-playoff-predictor/' },
    { title: 'NBA Mock Draft Simulator', url: 'https://www.profootballnetwork.com/nba-mock-draft-simulator' },
  ];

  const nflGames = [
    { title: 'NFL Duo', url: 'https://www.profootballnetwork.com/games/nfl-duo/' },
    { title: 'NFL Player Guessing Game', url: 'https://www.profootballnetwork.com/nfl-player-guessing-game/' },
    { title: 'NFL Draft Guessing Game', url: 'https://www.profootballnetwork.com/nfl-draft-prospect-guessing-game/' },
    { title: 'NFL Word Search', url: 'https://www.profootballnetwork.com/nfl-wordsearch/' },
    { title: 'NFL Word Fumble', url: 'https://www.profootballnetwork.com/nfl-word-fumble-player-name-game/' },
  ];

  const nbaGames = [
    { title: 'NBA Duo', url: 'https://www.profootballnetwork.com/games/nba-duo/' },
    { title: 'NBA Player Guessing Game', url: 'https://www.profootballnetwork.com/nba-player-guessing-game/' },
  ];

  const nhlGames = [
    { title: 'NHL Duo', url: 'https://www.profootballnetwork.com/games/nhl-duo/' },
    { title: 'NHL Cards', url: 'https://www.profootballnetwork.com/nhlcards/' },
  ];

  const otherGames = [
    { title: 'MLB Duo', url: 'https://www.profootballnetwork.com/games/mlb-duo/' },
    { title: 'Tennis Duo', url: 'https://www.profootballnetwork.com/games/tennis-duo/' },
    { title: 'WWE Guessing Game', url: 'https://www.profootballnetwork.com/wwe-player-guessing-game/' },
  ];


  // Mobile version - NFL Octobox style with team links
  if (isMobile) {
    return (
      <div className="w-full bg-black border-b border-gray-800">
        <div className="flex items-center justify-between px-4 py-3 bg-black">
          <div className="flex items-center gap-3">
            {/* Hamburger menu icon */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-white p-1"
              aria-label="Toggle teams menu"
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
                className="h-6 w-auto transition-all duration-300 hover:opacity-80"
              />
            </a>

            <span className="text-white font-semibold text-sm">NFL Teams</span>
          </div>

          {/* Dropdown arrow - clickable */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-white p-1"
            aria-label="Toggle teams dropdown"
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
            {/* NFL TEAMS Section */}
            <div className="px-4 py-2 border-b border-gray-800">
              <div className="text-red-500 text-xs font-bold uppercase tracking-wider mb-2">NFL</div>
              <div className="grid grid-cols-2 gap-1">
                {allTeams.map((team) => {
                  const isCurrentTeam = currentTeam?.id === team.id;
                  return (
                    <a
                      key={team.id}
                      href={getTeamUrl(team.id)}
                      className={`
                        flex items-center gap-2 p-2 rounded text-sm transition-colors
                        ${isCurrentTeam
                          ? 'bg-red-900/30 text-red-400'
                          : 'text-white hover:bg-gray-800'
                        }
                      `}
                    >
                      <img
                        src={team.logoUrl}
                        alt={team.abbreviation}
                        className="w-4 h-4 flex-shrink-0"
                      />
                      <span className="truncate text-xs">{team.abbreviation}</span>
                    </a>
                  );
                })}
              </div>
            </div>

            {/* NFL GAMES Section */}
            <div className="px-4 py-2">
              <div className="text-red-500 text-xs font-bold uppercase tracking-wider mb-2">NFL Games</div>
              <div className="grid grid-cols-1 gap-1">
                {nflGames.slice(0, 5).map((game) => {
                  const isCurrentGame = currentGame === game.title;
                  return (
                    <a
                      key={game.title}
                      href={game.url}
                      className={`
                        block p-2 rounded text-sm transition-colors
                        ${isCurrentGame
                          ? 'bg-red-900/30 text-red-400'
                          : 'text-white hover:bg-gray-800'
                        }
                      `}
                    >
                      <div className="text-xs">{game.title}</div>
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Desktop version - PFN Power Rankings style
  return (
    <div className="w-full h-full bg-black border-r border-gray-800 flex flex-col">
      {/* Header with logo */}
      <div className="flex items-center justify-center px-4 py-4 border-b border-gray-800">
        <a href="https://www.profootballnetwork.com" target="_blank" rel="noopener noreferrer" className="block">
          <img
            src="https://statico.profootballnetwork.com/wp-content/uploads/2025/06/12093424/tools-navigation-06-12-25.jpg"
            alt="PFSN Logo"
            className="w-full h-auto transition-all duration-300 hover:opacity-80"
          />
        </a>
      </div>

      {/* Navigation - scrollable section between logo and footer ad space */}
      <nav className="flex-1 overflow-y-auto py-4 games-sidebar-scroll">
        <ul className="space-y-0.5">
          {/* Home Button */}
          <li className="mb-4">
            <a
              href="https://www.profootballnetwork.com/nfl/teams/"
              className="relative flex items-center px-3 py-2 mx-1 rounded-md transition-all duration-200 text-gray-300 hover:bg-gray-800/50 hover:text-white"
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
                <span className="text-sm font-medium">
                  Home
                </span>
              </div>
            </a>
          </li>

          {/* NFL Teams Section */}
          <li className="mb-2">
            <div className="px-3 mb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-0.5 w-3 bg-gray-600 rounded"></div>
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">NFL Teams - {currentTab?.replace('-', ' ').toUpperCase()}</span>
                </div>
                <div className="flex-1 ml-3 h-px bg-gradient-to-r from-gray-800 to-transparent"></div>
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
                      ? 'bg-blue-600/20 text-blue-400 border-l-2 border-blue-500'
                      : 'text-gray-300 hover:bg-gray-800/50 hover:text-white'
                    }
                  `}
                >
                  <div className="flex items-center gap-2 w-full">
                    <img
                      src={team.logoUrl}
                      alt={team.abbreviation}
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
                <span className="text-xs font-medium">Show More Teams</span>
              </button>
            </li>
          )}

          {isTeamsExpanded && (
            <li className="mb-4">
              <button
                onClick={() => setIsTeamsExpanded(false)}
                className="w-full text-left px-3 py-2 mx-1 rounded-md transition-all duration-200 text-gray-400 hover:bg-gray-800/50 hover:text-white"
              >
                <span className="text-xs font-medium">- Show fewer teams</span>
              </button>
            </li>
          )}

          {/* NFL Tools Section */}
          <li className="mb-2 pt-2">
            <div className="px-3 mb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-0.5 w-3 bg-gray-600 rounded"></div>
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">NFL Tools</span>
                </div>
                <div className="flex-1 ml-3 h-px bg-gradient-to-r from-gray-800 to-transparent"></div>
              </div>
            </div>
          </li>
          {nflTools.map((tool) => (
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

          {/* Fantasy Football Tools Section */}
          <li className="pt-6">
            <div className="px-3 mb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-0.5 w-3 bg-gray-600 rounded"></div>
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Fantasy Football Tools</span>
                </div>
                <div className="flex-1 ml-3 h-px bg-gradient-to-r from-gray-800 to-transparent"></div>
              </div>
            </div>
          </li>
          {fantasyTools.map((tool) => (
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

          {/* Other Tools Section */}
          <li className="pt-6">
            <div className="px-3 mb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-0.5 w-3 bg-gray-600 rounded"></div>
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Other Tools</span>
                </div>
                <div className="flex-1 ml-3 h-px bg-gradient-to-r from-gray-800 to-transparent"></div>
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
        .games-sidebar-scroll {
          scrollbar-width: thin;
          scrollbar-color: #4b5563 transparent;
        }

        .games-sidebar-scroll::-webkit-scrollbar {
          width: 6px;
        }

        .games-sidebar-scroll::-webkit-scrollbar-track {
          background: transparent;
        }

        .games-sidebar-scroll::-webkit-scrollbar-thumb {
          background-color: #4b5563;
          border-radius: 3px;
        }

        .games-sidebar-scroll::-webkit-scrollbar-thumb:hover {
          background-color: #6b7280;
        }
      `}</style>
    </div>
  );
};

export default GamesPageSidebar;