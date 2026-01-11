'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import NFLTeamsSidebar from '@/components/NFLTeamsSidebar';
import { getApiPath } from '@/utils/api';

interface GameTeam {
  team_slug: string;
  abbr: string;
  team_name: string;
  logo: string;
  wins: number;
  losses: number;
  score?: number;
  is_winner?: boolean;
  seed?: number;
  has_possession?: boolean;
}

interface Game {
  event_id: string;
  start_date: string;
  status: string;
  status_detail: string;
  has_score: boolean;
  is_live: boolean;
  away_team: GameTeam;
  home_team: GameTeam;
  venue?: {
    name: string;
    city: string;
    state?: { name: string; abbreviation: string };
  };
  tv_stations?: Array<{ name: string; call_letters: string }>;
  hi_pass?: { player_name: string; display_value: string; value: number };
  hi_rush?: { player_name: string; display_value: string; value: number };
  hi_rec?: { player_name: string; display_value: string; value: number };
  playoff_round?: string;
  situation?: {
    down_distance?: string;
    is_red_zone?: boolean;
  };
}

// Format time to user's local timezone
function formatLocalGameTime(isoDateStr: string): string {
  const date = new Date(isoDateStr);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  const timeStr = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short'
  });

  if (isToday) {
    return timeStr;
  }

  const dateStr = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });

  return `${dateStr} - ${timeStr}`;
}

// Format date for display
function formatDisplayDate(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
}

// Get today's date in YYYY-MM-DD format
function getTodayDate(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

// Add days to a date string
function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr + 'T12:00:00');
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

export default function GamedayClient() {
  const [selectedDate, setSelectedDate] = useState(getTodayDate());
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasLiveGames, setHasLiveGames] = useState(false);
  const [expandedGames, setExpandedGames] = useState<Set<string>>(new Set());
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const gamesContainerRef = useRef<HTMLDivElement>(null);

  const isToday = selectedDate === getTodayDate();

  // Fetch games for the selected date
  const fetchGames = useCallback(async () => {
    try {
      const response = await fetch(getApiPath(`api/nfl/espn-scoreboard?date=${selectedDate}`));
      if (!response.ok) throw new Error('Failed to fetch games');

      const data = await response.json();
      setGames(data.games || []);
      setHasLiveGames(data.hasLiveGames || false);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (error) {
      console.error('Error fetching games:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  // Initial fetch and polling
  useEffect(() => {
    setLoading(true);
    fetchGames();

    // Poll every 30 seconds if viewing today
    if (isToday) {
      const interval = setInterval(fetchGames, 30000);
      return () => clearInterval(interval);
    }
  }, [fetchGames, isToday]);

  // Scroll to anchored game on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const gameId = window.location.hash.replace('#', '');
      setTimeout(() => {
        const element = document.getElementById(gameId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Add highlight effect
          element.classList.add('ring-4', 'ring-blue-400');
          setTimeout(() => {
            element.classList.remove('ring-4', 'ring-blue-400');
          }, 2000);
        }
      }, 500);
    }
  }, [games]);

  // Toggle expanded state for a game
  const toggleExpanded = (eventId: string) => {
    setExpandedGames(prev => {
      const next = new Set(prev);
      if (next.has(eventId)) {
        next.delete(eventId);
      } else {
        next.add(eventId);
      }
      return next;
    });
  };

  // Navigate to previous/next day
  const goToPrevDay = () => setSelectedDate(addDays(selectedDate, -1));
  const goToNextDay = () => setSelectedDate(addDays(selectedDate, 1));
  const goToToday = () => setSelectedDate(getTodayDate());

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <div className="fixed top-0 left-0 w-64 h-screen z-10">
          <NFLTeamsSidebar />
        </div>
      </div>

      {/* Mobile sidebar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-20">
        <NFLTeamsSidebar isMobile={true} />
      </div>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 min-w-0">
        {/* Header */}
        <div className="bg-[#0050A0] text-white pt-[57px] lg:pt-0 pb-4 lg:pb-6">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-4 lg:pt-10">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-3">
              NFL Gameday Center
            </h1>
            <p className="text-base sm:text-lg lg:text-xl xl:text-2xl opacity-90">
              Live scores, stats, and game updates
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl">
          {/* Date Navigation */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={goToPrevDay}
                  className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                  aria-label="Previous day"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <div className="text-center">
                  <div className="font-bold text-gray-900">{formatDisplayDate(selectedDate)}</div>
                  {isToday && (
                    <div className="text-sm text-green-600 font-medium">Today</div>
                  )}
                </div>

                <button
                  onClick={goToNextDay}
                  className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                  aria-label="Next day"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              <div className="flex items-center gap-4">
                {!isToday && (
                  <button
                    onClick={goToToday}
                    className="px-4 py-2 text-sm font-medium text-[#0050A0] bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                  >
                    Go to Today
                  </button>
                )}

                {lastUpdated && (
                  <div className="text-sm text-gray-500">
                    Last updated: {lastUpdated}
                    {hasLiveGames && (
                      <span className="ml-2 inline-flex items-center gap-1 text-green-600">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        Live
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Games Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                      <div>
                        <div className="h-5 w-24 bg-gray-200 rounded mb-1"></div>
                        <div className="h-4 w-16 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                    <div className="h-8 w-12 bg-gray-200 rounded"></div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                      <div>
                        <div className="h-5 w-24 bg-gray-200 rounded mb-1"></div>
                        <div className="h-4 w-16 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                    <div className="h-8 w-12 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : games.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Games Scheduled</h3>
              <p className="text-gray-500">There are no NFL games scheduled for this date.</p>
            </div>
          ) : (
            <div ref={gamesContainerRef} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {games.map(game => {
                const isLive = game.is_live;
                const isFinal = game.status === 'Final';
                const isExpanded = expandedGames.has(game.event_id);

                return (
                  <div
                    key={game.event_id}
                    id={`game-${game.event_id}`}
                    className={`
                      bg-white rounded-lg shadow-sm overflow-hidden transition-all duration-300
                      ${isLive ? 'border-l-4 border-green-500 ring-1 ring-green-100' : 'border-l-4 border-gray-200'}
                    `}
                  >
                    {/* Game Header - Status */}
                    <div className={`px-4 py-2 flex items-center justify-between ${isLive ? 'bg-green-50' : isFinal ? 'bg-gray-50' : 'bg-blue-50'}`}>
                      <div className="flex items-center gap-2">
                        {isLive && (
                          <span className="flex items-center gap-1.5 text-green-700 font-semibold text-sm">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            LIVE
                          </span>
                        )}
                        <span className={`text-sm font-medium ${isLive ? 'text-green-700' : isFinal ? 'text-gray-600' : 'text-blue-700'}`}>
                          {isLive || isFinal ? game.status_detail : formatLocalGameTime(game.start_date)}
                        </span>
                      </div>

                      {game.playoff_round && (
                        <span className="text-xs font-medium text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                          {game.playoff_round}
                        </span>
                      )}
                    </div>

                    {/* Teams and Scores */}
                    <div className="p-4">
                      {/* Away Team */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          {isLive && game.away_team.has_possession && (
                            <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" title="Has possession"></span>
                          )}
                          <Image
                            src={game.away_team.logo}
                            alt={game.away_team.team_name}
                            width={40}
                            height={40}
                            className="object-contain"
                            unoptimized
                          />
                          <div>
                            <div className="font-semibold text-gray-900">{game.away_team.team_name}</div>
                            <div className="text-sm text-gray-500">{game.away_team.wins}-{game.away_team.losses}</div>
                          </div>
                        </div>
                        <div className={`text-2xl font-bold ${
                          isFinal && game.away_team.is_winner ? 'text-green-600' :
                          isFinal && !game.away_team.is_winner ? 'text-gray-400' :
                          'text-gray-900'
                        }`}>
                          {game.has_score ? game.away_team.score : '-'}
                        </div>
                      </div>

                      {/* Home Team */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {isLive && game.home_team.has_possession && (
                            <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" title="Has possession"></span>
                          )}
                          <Image
                            src={game.home_team.logo}
                            alt={game.home_team.team_name}
                            width={40}
                            height={40}
                            className="object-contain"
                            unoptimized
                          />
                          <div>
                            <div className="font-semibold text-gray-900">{game.home_team.team_name}</div>
                            <div className="text-sm text-gray-500">{game.home_team.wins}-{game.home_team.losses}</div>
                          </div>
                        </div>
                        <div className={`text-2xl font-bold ${
                          isFinal && game.home_team.is_winner ? 'text-green-600' :
                          isFinal && !game.home_team.is_winner ? 'text-gray-400' :
                          'text-gray-900'
                        }`}>
                          {game.has_score ? game.home_team.score : '-'}
                        </div>
                      </div>

                      {/* Live Situation */}
                      {isLive && game.situation && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <div className="flex items-center gap-2 text-sm">
                            {game.situation.is_red_zone && (
                              <span className="px-2 py-0.5 bg-red-100 text-red-700 font-semibold rounded-full text-xs">
                                RED ZONE
                              </span>
                            )}
                            {game.situation.down_distance && (
                              <span className="text-gray-600">
                                {game.situation.down_distance}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Expand/Collapse Button */}
                    <button
                      onClick={() => toggleExpanded(game.event_id)}
                      className="w-full px-4 py-2 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 text-sm text-gray-600"
                    >
                      {isExpanded ? 'Hide Details' : 'Show Details'}
                      <svg
                        className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
                        {/* Stat Leaders */}
                        {(game.hi_pass || game.hi_rush || game.hi_rec) && (
                          <div className="mb-4">
                            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Game Leaders</h4>
                            <div className="grid grid-cols-3 gap-2 text-xs">
                              {game.hi_pass && (
                                <div className="bg-white rounded p-2">
                                  <div className="text-gray-500">Passing</div>
                                  <div className="font-semibold truncate">{game.hi_pass.player_name}</div>
                                  <div className="text-gray-700">{game.hi_pass.display_value}</div>
                                </div>
                              )}
                              {game.hi_rush && (
                                <div className="bg-white rounded p-2">
                                  <div className="text-gray-500">Rushing</div>
                                  <div className="font-semibold truncate">{game.hi_rush.player_name}</div>
                                  <div className="text-gray-700">{game.hi_rush.display_value}</div>
                                </div>
                              )}
                              {game.hi_rec && (
                                <div className="bg-white rounded p-2">
                                  <div className="text-gray-500">Receiving</div>
                                  <div className="font-semibold truncate">{game.hi_rec.player_name}</div>
                                  <div className="text-gray-700">{game.hi_rec.display_value}</div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Venue & Broadcast */}
                        <div className="flex flex-wrap gap-4 text-xs text-gray-600">
                          {game.venue && (
                            <div className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <span>{game.venue.name}, {game.venue.city}</span>
                            </div>
                          )}
                          {game.tv_stations && game.tv_stations.length > 0 && (
                            <div className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              <span>{game.tv_stations.map(s => s.name).join(', ')}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
