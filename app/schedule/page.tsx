'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

import { getAllTeams } from '@/data/teams';
import NFLTeamsSidebar from '@/components/NFLTeamsSidebar';

// Map API team slugs to our team IDs
const teamSlugMapping: Record<string, string> = {
  'atlanta-hawks': 'atlanta-hawks',
  'boston-celtics': 'boston-celtics',
  'brooklyn-nets': 'brooklyn-nets',
  'charlotte-hornets': 'charlotte-hornets',
  'chicago-bulls': 'chicago-bulls',
  'cleveland-cavaliers': 'cleveland-cavaliers',
  'dallas-mavericks': 'dallas-mavericks',
  'denver-nuggets': 'denver-nuggets',
  'detroit-pistons': 'detroit-pistons',
  'golden-state-warriors': 'golden-state-warriors',
  'houston-rockets': 'houston-rockets',
  'indiana-pacers': 'indiana-pacers',
  'la-clippers': 'los-angeles-clippers',
  'los-angeles-clippers': 'los-angeles-clippers',
  'lakers': 'los-angeles-lakers',
  'los-angeles-lakers': 'los-angeles-lakers',
  'memphis-grizzlies': 'memphis-grizzlies',
  'miami-heat': 'miami-heat',
  'milwaukee-bucks': 'milwaukee-bucks',
  'minnesota-timberwolves': 'minnesota-timberwolves',
  'new-orleans-pelicans': 'new-orleans-pelicans',
  'new-york-knicks': 'new-york-knicks',
  'oklahoma-city-thunder': 'oklahoma-city-thunder',
  'orlando-magic': 'orlando-magic',
  'philadelphia-76ers': 'philadelphia-76ers',
  'phoenix-suns': 'phoenix-suns',
  'portland-trail-blazers': 'portland-trail-blazers',
  'portland-trailblazers': 'portland-trail-blazers',
  'sacramento-kings': 'sacramento-kings',
  'san-antonio-spurs': 'san-antonio-spurs',
  'toronto-raptors': 'toronto-raptors',
  'utah-jazz': 'utah-jazz',
  'washington-wizards': 'washington-wizards',
};

interface Game {
  event_id: string;
  start_date: string;
  status: string;
  has_score: boolean;
  away_team: {
    team_slug: string;
    abbr: string;
    team_name: string;
    wins: number;
    losses: number;
    score?: number;
    is_winner?: boolean;
  };
  home_team: {
    team_slug: string;
    abbr: string;
    team_name: string;
    wins: number;
    losses: number;
    score?: number;
    is_winner?: boolean;
  };
  venue?: {
    name: string;
    city: string;
    state?: {
      name: string;
      abbreviation: string;
    };
  };
  tv_stations?: Array<{
    name: string;
    call_letters: string;
  }>;
  winner_high?: {
    player_id: number;
    player_name: string;
    player_slug: string;
    value: number;
  };
  loser_high?: {
    player_id: number;
    player_name: string;
    player_slug: string;
    value: number;
  };
}

// Get local date string in YYYY-MM-DD format
const getLocalDateString = (date: Date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Get start and end of week for a given date (Sunday to Saturday)
const getWeekRange = (dateStr: string) => {
  const date = new Date(dateStr + 'T12:00:00');
  const dayOfWeek = date.getDay(); // 0 = Sunday
  const startDate = new Date(date);
  startDate.setDate(date.getDate() - dayOfWeek);
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);
  return {
    start: getLocalDateString(startDate),
    end: getLocalDateString(endDate),
    days: Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      return getLocalDateString(d);
    })
  };
};

// Get all days in a month
const getMonthDays = (dateStr: string) => {
  const date = new Date(dateStr + 'T12:00:00');
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const days: string[] = [];
  for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
    days.push(getLocalDateString(new Date(d)));
  }
  return days;
};

type ViewMode = 'daily' | 'weekly' | 'monthly';

export default function SchedulePage() {
  const allTeams = getAllTeams();
  const [viewMode, setViewMode] = useState<ViewMode>('daily');
  const [selectedDate, setSelectedDate] = useState<string>(getLocalDateString());
  const [games, setGames] = useState<Game[]>([]);
  const [weeklyGames, setWeeklyGames] = useState<Record<string, Game[]>>({});
  const [monthlyGames, setMonthlyGames] = useState<Record<string, Game[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedGame, setExpandedGame] = useState<string | null>(null);
  const [expandedWeeklyGame, setExpandedWeeklyGame] = useState<string | null>(null);

  // Fetch games for selected date
  useEffect(() => {
    async function fetchGames() {
      setLoading(true);
      setError(null);
      setExpandedGame(null);

      try {
        const response = await fetch(`/nba-hq/api/nba/schedule/by-date?season=2025&date=${selectedDate}`);

        if (!response.ok) {
          throw new Error('Failed to fetch schedule');
        }

        const data = await response.json();
        // The API sometimes returns games from adjacent dates, so we filter strictly by date
        const allGames = data.schedule || [];
        const filteredGames = allGames.filter((game: Game) => {
          const gameDate = new Date(game.start_date);
          return getLocalDateString(gameDate) === selectedDate;
        });
        setGames(filteredGames);
      } catch (err) {
        console.error('Error fetching schedule:', err);
        setError('Failed to load schedule. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    fetchGames();
  }, [selectedDate]);

  // Fetch weekly data
  useEffect(() => {
    if (viewMode !== 'weekly') return;

    async function fetchWeeklyGames() {
      setLoading(true);
      setError(null);

      try {
        const weekRange = getWeekRange(selectedDate);
        const gamesMap: Record<string, Game[]> = {};

        // Fetch games for each day of the week
        await Promise.all(
          weekRange.days.map(async (day) => {
            const response = await fetch(`/nba-hq/api/nba/schedule/by-date?season=2025&date=${day}`);
            if (response.ok) {
              const data = await response.json();
              const dayGames = (data.schedule || []).filter((game: Game) => {
                const gameDate = new Date(game.start_date);
                return getLocalDateString(gameDate) === day;
              });
              gamesMap[day] = dayGames;
            } else {
              gamesMap[day] = [];
            }
          })
        );

        setWeeklyGames(gamesMap);
      } catch (err) {
        console.error('Error fetching weekly schedule:', err);
        setError('Failed to load weekly schedule. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    fetchWeeklyGames();
  }, [viewMode, selectedDate]);

  // Fetch monthly data
  useEffect(() => {
    if (viewMode !== 'monthly') return;

    async function fetchMonthlyGames() {
      setLoading(true);
      setError(null);

      try {
        const monthDays = getMonthDays(selectedDate);
        const gamesMap: Record<string, Game[]> = {};

        // Fetch games for each day of the month
        await Promise.all(
          monthDays.map(async (day) => {
            const response = await fetch(`/nba-hq/api/nba/schedule/by-date?season=2025&date=${day}`);
            if (response.ok) {
              const data = await response.json();
              const dayGames = (data.schedule || []).filter((game: Game) => {
                const gameDate = new Date(game.start_date);
                return getLocalDateString(gameDate) === day;
              });
              gamesMap[day] = dayGames;
            } else {
              gamesMap[day] = [];
            }
          })
        );

        setMonthlyGames(gamesMap);
      } catch (err) {
        console.error('Error fetching monthly schedule:', err);
        setError('Failed to load monthly schedule. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    fetchMonthlyGames();
  }, [viewMode, selectedDate]);

  // Navigate dates
  const goToPreviousDay = () => {
    const date = new Date(selectedDate + 'T12:00:00');
    date.setDate(date.getDate() - 1);
    setSelectedDate(getLocalDateString(date));
  };

  const goToNextDay = () => {
    const date = new Date(selectedDate + 'T12:00:00');
    date.setDate(date.getDate() + 1);
    setSelectedDate(getLocalDateString(date));
  };

  // Format date for display - just show the day of week
  const formatDisplayDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T12:00:00');
    return date.toLocaleDateString('en-US', {
      weekday: 'long'
    });
  };

  const isToday = selectedDate === getLocalDateString();

  const toggleGameExpand = (gameId: string) => {
    setExpandedGame(expandedGame === gameId ? null : gameId);
  };

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

      {/* Main content */}
      <main className="flex-1 lg:ml-64 min-w-0">
        {/* Header */}
        <div className="bg-[#0050A0] text-white pt-[57px] lg:pt-0 pb-8 lg:pb-10">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-8 lg:pt-10">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-3 tracking-tight">
              NBA Schedule
            </h1>
            <p className="text-base md:text-lg text-white/95 max-w-2xl">
              View all NBA games, scores, and game details
            </p>
          </div>
        </div>

        {/* Raptive Header Ad */}
        <div className="container mx-auto px-4 min-h-[150px]">
          <div className="raptive-pfn-header"></div>
        </div>

        {/* View Mode and Filters */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* View Mode Toggle */}
              <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('daily')}
                  className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${
                    viewMode === 'daily'
                      ? 'bg-white text-[#0050A0] shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Daily
                </button>
                <button
                  onClick={() => setViewMode('weekly')}
                  className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${
                    viewMode === 'weekly'
                      ? 'bg-white text-[#0050A0] shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Weekly
                </button>
                <button
                  onClick={() => setViewMode('monthly')}
                  className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${
                    viewMode === 'monthly'
                      ? 'bg-white text-[#0050A0] shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Monthly
                </button>
              </div>

              {/* Team Filter Dropdown */}
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    window.location.href = `/teams/${e.target.value}/schedule`;
                  }
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0050A0] text-gray-900 bg-white"
                defaultValue=""
              >
                <option value="" disabled>View Team Schedule</option>
                {allTeams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.fullName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date Navigation - Only show in daily view */}
          {viewMode === 'daily' && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Date Controls */}
              <div className="flex items-center gap-3">
                <button
                  onClick={goToPreviousDay}
                  className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                  aria-label="Previous day"
                >
                  <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className={`px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0050A0] text-gray-900 ${
                    isToday ? 'border-[#0050A0] bg-blue-50 ring-2 ring-[#0050A0]' : 'border-gray-300'
                  }`}
                />

                <button
                  onClick={goToNextDay}
                  className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                  aria-label="Next day"
                >
                  <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* Display Date */}
              <div className="text-center sm:text-right">
                <div className="flex items-center justify-center sm:justify-end gap-2">
                  <h2 className="text-xl font-bold text-gray-900">
                    {formatDisplayDate(selectedDate)}
                  </h2>
                  {isToday && (
                    <span className="inline-block px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded">
                      Today
                    </span>
                  )}
                </div>
                {!loading && !error && games.length > 0 && (
                  <div className="mt-1 text-sm text-gray-500">
                    {games.length} game{games.length !== 1 ? 's' : ''} scheduled
                  </div>
                )}
              </div>
            </div>
          </div>
          )}

          {/* Content based on view mode */}
          {viewMode === 'daily' && (
            <>{/* Games Grid */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-12 h-12 border-4 border-gray-200 border-t-[#0050A0] rounded-full animate-spin"></div>
              <p className="mt-4 text-gray-600">Loading games...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
              <p className="text-red-600">{error}</p>
              <button
                onClick={() => setSelectedDate(selectedDate)}
                className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
              >
                Retry
              </button>
            </div>
          ) : games.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Games Scheduled</h3>
              <p className="text-gray-600">There are no NBA games scheduled for this date.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {games.map((game) => {
                const awayTeam = allTeams.find(t => t.id === teamSlugMapping[game.away_team.team_slug] || t.id === game.away_team.team_slug);
                const homeTeam = allTeams.find(t => t.id === teamSlugMapping[game.home_team.team_slug] || t.id === game.home_team.team_slug);
                const gameTime = new Date(game.start_date).toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  timeZoneName: 'short'
                });

                const isLive = game.status !== 'Pre-Game' && game.status !== 'Final' && game.has_score;
                const isFinal = game.status === 'Final';
                const isExpanded = expandedGame === game.event_id;
                const hasDetails = game.venue || game.tv_stations?.length || game.winner_high || game.loser_high;

                // Determine which team's high scorer is which
                const awayIsWinner = game.away_team.is_winner;
                const awayHighScorer = awayIsWinner ? game.winner_high : game.loser_high;
                const homeHighScorer = awayIsWinner ? game.loser_high : game.winner_high;

                return (
                  <div
                    key={game.event_id}
                    className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-all ${
                      isLive ? 'border-green-400 ring-2 ring-green-100' : 'border-gray-200'
                    }`}
                  >
                    {/* Main Game Card - Clickable */}
                    <div
                      onClick={() => hasDetails && toggleGameExpand(game.event_id)}
                      className={`p-5 ${hasDetails ? 'cursor-pointer hover:bg-gray-50' : ''}`}
                    >
                      <div className="flex items-center gap-6">
                        {/* Both Teams - Left Side */}
                        <div className="flex-1 space-y-3">
                          {/* Away Team */}
                          <div className="flex items-center gap-3">
                            {awayTeam ? (
                              <>
                                <img
                                  src={awayTeam.logoUrl}
                                  alt={awayTeam.fullName}
                                  
                                  
                                  className="w-10 h-10 flex-shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="font-bold text-gray-900">
                                    <span className="sm:hidden">{awayTeam.name}</span>
                                    <span className="hidden sm:inline">{awayTeam.fullName}</span>
                                  </div>
                                  <div className="text-sm text-gray-500">{game.away_team.wins}-{game.away_team.losses}</div>
                                </div>
                              </>
                            ) : (
                              <div className="flex-1">
                                <div className="font-bold text-gray-900">{game.away_team.abbr}</div>
                                <div className="text-sm text-gray-500">{game.away_team.wins}-{game.away_team.losses}</div>
                              </div>
                            )}
                          </div>

                          {/* Home Team */}
                          <div className="flex items-center gap-3">
                            {homeTeam ? (
                              <>
                                <img
                                  src={homeTeam.logoUrl}
                                  alt={homeTeam.fullName}
                                  
                                  
                                  className="w-10 h-10 flex-shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="font-bold text-gray-900">
                                    <span className="sm:hidden">{homeTeam.name}</span>
                                    <span className="hidden sm:inline">{homeTeam.fullName}</span>
                                  </div>
                                  <div className="text-sm text-gray-500">{game.home_team.wins}-{game.home_team.losses}</div>
                                </div>
                              </>
                            ) : (
                              <div className="flex-1">
                                <div className="font-bold text-gray-900">{game.home_team.abbr}</div>
                                <div className="text-sm text-gray-500">{game.home_team.wins}-{game.home_team.losses}</div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Status - Center */}
                        <div className="flex items-center justify-center min-w-[100px]">
                          {game.status === 'Pre-Game' ? (
                            <div className="text-sm text-gray-700 font-medium text-center">{gameTime}</div>
                          ) : (
                            <span className={`inline-block px-3 py-1 text-xs font-bold rounded-full ${
                              isLive ? 'bg-green-500 text-white animate-pulse' : 'bg-gray-200 text-gray-700'
                            }`}>
                              {game.status}
                            </span>
                          )}
                        </div>

                        {/* Both Scores - Right Side */}
                        <div className="flex flex-col gap-3 min-w-[60px] items-end">
                          {/* Away Score */}
                          {(game.has_score || (game.status !== 'Pre-Game' && game.away_team.score !== undefined && game.away_team.score !== null)) ? (
                            <div className={`text-3xl font-bold ${
                              isFinal && game.away_team.is_winner ? 'text-green-600' :
                              isFinal ? 'text-gray-400' : 'text-gray-900'
                            }`}>
                              {game.away_team.score}
                            </div>
                          ) : (
                            <div className="h-9"></div>
                          )}

                          {/* Home Score */}
                          {(game.has_score || (game.status !== 'Pre-Game' && game.home_team.score !== undefined && game.home_team.score !== null)) ? (
                            <div className={`text-3xl font-bold ${
                              isFinal && game.home_team.is_winner ? 'text-green-600' :
                              isFinal ? 'text-gray-400' : 'text-gray-900'
                            }`}>
                              {game.home_team.score}
                            </div>
                          ) : (
                            <div className="h-9"></div>
                          )}
                        </div>

                        {/* Expand Arrow */}
                        {hasDetails && (
                          <div className="hidden md:flex items-center pl-4">
                            <svg
                              className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        )}
                      </div>

                      {/* Click hint on mobile */}
                      {hasDetails && !isExpanded && (
                        <div className="md:hidden mt-3 text-center">
                          <span className="text-xs text-gray-400">Tap for more details</span>
                        </div>
                      )}
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && hasDetails && (
                      <div className="border-t border-gray-200 bg-gray-50 p-5">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {/* High Scorers */}
                          {isFinal && (awayHighScorer || homeHighScorer) && (
                            <div>
                              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Top Scorers</h4>
                              <div className="space-y-3">
                                {awayHighScorer && (
                                  <div className="flex items-center gap-3">
                                    {awayTeam && (
                                      <img
                                        src={awayTeam.logoUrl}
                                        alt={awayTeam.abbreviation}
                                        
                                        
                                        className="w-6 h-6"
                                      />
                                    )}
                                    <div className="flex-1">
                                      <div className="text-sm font-semibold text-gray-900">{awayHighScorer.player_name}</div>
                                      <div className="text-xs text-gray-500">{awayTeam?.abbreviation || game.away_team.abbr}</div>
                                    </div>
                                    <div className="text-lg font-bold text-[#0050A0]">{awayHighScorer.value} PTS</div>
                                  </div>
                                )}
                                {homeHighScorer && (
                                  <div className="flex items-center gap-3">
                                    {homeTeam && (
                                      <img
                                        src={homeTeam.logoUrl}
                                        alt={homeTeam.abbreviation}
                                        
                                        
                                        className="w-6 h-6"
                                      />
                                    )}
                                    <div className="flex-1">
                                      <div className="text-sm font-semibold text-gray-900">{homeHighScorer.player_name}</div>
                                      <div className="text-xs text-gray-500">{homeTeam?.abbreviation || game.home_team.abbr}</div>
                                    </div>
                                    <div className="text-lg font-bold text-[#0050A0]">{homeHighScorer.value} PTS</div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Venue */}
                          {game.venue && (
                            <div>
                              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Venue</h4>
                              <div className="flex items-start gap-3">
                                <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <div>
                                  <div className="text-sm font-semibold text-gray-900">{game.venue.name}</div>
                                  <div className="text-xs text-gray-500">
                                    {game.venue.city}{game.venue.state ? `, ${game.venue.state.abbreviation}` : ''}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* TV Broadcast */}
                          {game.tv_stations && game.tv_stations.length > 0 && (
                            <div>
                              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Broadcast</h4>
                              <div className="flex items-start gap-3">
                                <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                <div className="flex flex-wrap gap-2">
                                  {game.tv_stations.map((station, idx) => (
                                    <span
                                      key={idx}
                                      className="inline-block px-2 py-1 bg-gray-200 text-gray-700 text-xs font-medium rounded"
                                      title={station.name}
                                    >
                                      {station.call_letters}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Team Links */}
                        <div className="mt-6 pt-4 border-t border-gray-200 flex flex-wrap gap-3">
                          {awayTeam && (
                            <Link
                              href={`/teams/${awayTeam.id}`}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              <img
                                src={awayTeam.logoUrl}
                                alt={awayTeam.abbreviation}
                                
                                
                                className="w-5 h-5"
                              />
                              View {awayTeam.abbreviation}
                            </Link>
                          )}
                          {homeTeam && (
                            <Link
                              href={`/teams/${homeTeam.id}`}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              <img
                                src={homeTeam.logoUrl}
                                alt={homeTeam.abbreviation}
                                
                                
                                className="w-5 h-5"
                              />
                              View {homeTeam.abbreviation}
                            </Link>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          </>
          )}

          {/* Weekly View */}
          {viewMode === 'weekly' && (
            <>
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="w-12 h-12 border-4 border-gray-200 border-t-[#0050A0] rounded-full animate-spin"></div>
                  <p className="mt-4 text-gray-600">Loading week...</p>
                </div>
              ) : error ? (
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                  <p className="text-red-600">{error}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                  {getWeekRange(selectedDate).days.map((day) => {
                    const dayDate = new Date(day + 'T12:00:00');
                    const dayGames = weeklyGames[day] || [];
                    const isToday = day === getLocalDateString();

                    return (
                      <div key={day} className={`bg-white rounded-xl border shadow-sm overflow-hidden ${isToday ? 'border-[#0050A0] ring-2 ring-[#0050A0]' : 'border-gray-200'}`}>
                        <div className={`p-3 text-center border-b ${isToday ? 'bg-blue-50 border-[#0050A0]' : 'bg-gray-50 border-gray-200'}`}>
                          <div className="text-xs font-semibold text-gray-500 uppercase">
                            {dayDate.toLocaleDateString('en-US', { weekday: 'short' })}
                          </div>
                          <div className="text-lg font-bold text-gray-900">
                            {dayDate.getDate()}
                          </div>
                        </div>
                        <div className="p-2 space-y-2">
                          {dayGames.length === 0 ? (
                            <div className="text-center py-4 text-xs text-gray-400">No games</div>
                          ) : (
                            <>
                              {dayGames.map((game) => {
                                const awayTeam = allTeams.find(t => t.id === teamSlugMapping[game.away_team.team_slug] || t.id === game.away_team.team_slug);
                                const homeTeam = allTeams.find(t => t.id === teamSlugMapping[game.home_team.team_slug] || t.id === game.home_team.team_slug);
                                const isFinal = game.status === 'Final';
                                const isLive = game.status !== 'Pre-Game' && game.status !== 'Final' && (game.has_score || (game.away_team.score !== undefined && game.away_team.score !== null));
                                const isExpanded = expandedWeeklyGame === game.event_id;
                                const hasDetails = game.venue || game.tv_stations?.length || game.winner_high || game.loser_high;

                                return (
                                  <div key={game.event_id} className={`border rounded-lg overflow-hidden ${isLive ? 'border-green-400 ring-1 ring-green-400' : 'border-gray-200'}`}>
                                    <button
                                      onClick={() => setExpandedWeeklyGame(isExpanded ? null : game.event_id)}
                                      className="w-full text-xs p-2 hover:bg-gray-50 hover:border-[#0050A0] transition-colors relative"
                                    >
                                      {isLive && (
                                        <div className="absolute top-1 right-1 flex items-center gap-0.5">
                                          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                                          <span className="text-[8px] font-bold text-green-600 uppercase">Live</span>
                                        </div>
                                      )}
                                      <div className="flex items-center justify-between gap-1">
                                        {awayTeam && (
                                          <img src={awayTeam.logoUrl} alt={awayTeam.abbreviation}   className="w-5 h-5" />
                                        )}
                                        <span className="font-semibold flex-1 text-left">{awayTeam?.abbreviation || game.away_team.abbr}</span>
                                        {(game.has_score || (game.status !== 'Pre-Game' && game.away_team.score !== undefined && game.away_team.score !== null)) ? (
                                          <span className={isFinal && game.away_team.is_winner ? 'font-bold' : ''}>{game.away_team.score}</span>
                                        ) : (
                                          <span className="text-gray-500 text-[10px]">
                                            {new Date(game.start_date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-1 mt-1">
                                        <span className="text-gray-400 text-[10px]">@</span>
                                      </div>
                                      <div className="flex items-center justify-between gap-1">
                                        {homeTeam && (
                                          <img src={homeTeam.logoUrl} alt={homeTeam.abbreviation}   className="w-5 h-5" />
                                        )}
                                        <span className="font-semibold flex-1 text-left">{homeTeam?.abbreviation || game.home_team.abbr}</span>
                                        {(game.has_score || (game.status !== 'Pre-Game' && game.home_team.score !== undefined && game.home_team.score !== null)) && <span className={isFinal && game.home_team.is_winner ? 'font-bold' : ''}>{game.home_team.score}</span>}
                                      </div>
                                    </button>

                                    {/* Expanded Details */}
                                    {isExpanded && hasDetails && (
                                      <div className="border-t border-gray-200 bg-gray-50 p-3 text-xs">
                                        {/* Venue */}
                                        {game.venue && (
                                          <div className="mb-3">
                                            <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Venue</h4>
                                            <div className="text-xs">
                                              <div className="font-semibold text-gray-900">{game.venue.name}</div>
                                              <div className="text-gray-500">
                                                {game.venue.city}{game.venue.state ? `, ${game.venue.state.abbreviation}` : ''}
                                              </div>
                                            </div>
                                          </div>
                                        )}

                                        {/* TV Broadcast */}
                                        {game.tv_stations && game.tv_stations.length > 0 && (
                                          <div className="mb-3">
                                            <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Broadcast</h4>
                                            <div className="flex flex-wrap gap-1">
                                              {game.tv_stations.map((station, idx) => (
                                                <span
                                                  key={idx}
                                                  className="inline-block px-1.5 py-0.5 bg-gray-200 text-gray-700 text-[10px] font-medium rounded"
                                                  title={station.name}
                                                >
                                                  {station.call_letters}
                                                </span>
                                              ))}
                                            </div>
                                          </div>
                                        )}

                                        {/* Team Links */}
                                        <div className="flex flex-wrap gap-1">
                                          {awayTeam && (
                                            <Link
                                              href={`/teams/${awayTeam.id}`}
                                              className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-gray-300 rounded text-[10px] font-medium text-gray-700 hover:bg-gray-50"
                                            >
                                              {awayTeam.abbreviation}
                                            </Link>
                                          )}
                                          {homeTeam && (
                                            <Link
                                              href={`/teams/${homeTeam.id}`}
                                              className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-gray-300 rounded text-[10px] font-medium text-gray-700 hover:bg-gray-50"
                                            >
                                              {homeTeam.abbreviation}
                                            </Link>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* Monthly View */}
          {viewMode === 'monthly' && (
            <>
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="w-12 h-12 border-4 border-gray-200 border-t-[#0050A0] rounded-full animate-spin"></div>
                  <p className="mt-4 text-gray-600">Loading month...</p>
                </div>
              ) : error ? (
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                  <p className="text-red-600">{error}</p>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  {/* Calendar Header */}
                  <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                      <div key={day} className="p-3 text-center text-sm font-semibold text-gray-600 border-r border-gray-200 last:border-r-0">
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7">
                    {(() => {
                      const monthDays = getMonthDays(selectedDate);
                      const firstDay = new Date(monthDays[0] + 'T12:00:00');
                      const startPadding = firstDay.getDay(); // Empty cells before month starts

                      // Add empty cells for padding
                      const allCells = [
                        ...Array(startPadding).fill(null),
                        ...monthDays
                      ];

                      return allCells.map((day, index) => {
                        if (!day) {
                          return <div key={`empty-${index}`} className="aspect-square border-r border-b border-gray-200 bg-gray-50" />;
                        }

                        const date = new Date(day + 'T12:00:00');
                        const dayGames = monthlyGames[day] || [];
                        const gameCount = dayGames.length;
                        const isToday = day === getLocalDateString();
                        const isSelected = day === selectedDate;

                        // Determine styling based on game count
                        const getGameCountStyle = (count: number) => {
                          if (count === 0) return null;
                          if (count <= 3) return { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' };
                          if (count <= 7) return { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' };
                          return { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' };
                        };

                        const gameStyle = getGameCountStyle(gameCount);

                        return (
                          <button
                            key={day}
                            onClick={() => {
                              setSelectedDate(day);
                              setViewMode('daily');
                            }}
                            className={`aspect-square border-r border-b p-3 hover:shadow-md transition-all group ${
                              gameCount > 0 ? 'bg-white hover:bg-gray-50' : 'bg-gray-50 hover:bg-gray-100'
                            } ${isToday ? 'ring-2 ring-[#0050A0] ring-inset' : 'border-gray-200'}`}
                          >
                            <div className="h-full flex flex-col">
                              {/* Date Number */}
                              <div className={`text-lg font-bold mb-2 ${
                                isToday ? 'text-[#0050A0]' :
                                gameCount > 0 ? 'text-gray-900' : 'text-gray-400'
                              }`}>
                                {date.getDate()}
                              </div>

                              {/* Game Count Indicator */}
                              {gameCount > 0 && gameStyle && (
                                <div className="mt-auto space-y-1">
                                  {/* For 1-3 games: Show team matchups */}
                                  {gameCount <= 3 ? (
                                    <div className="space-y-1">
                                      {dayGames.map((game) => {
                                        const awayTeam = allTeams.find(t => t.id === teamSlugMapping[game.away_team.team_slug] || t.id === game.away_team.team_slug);
                                        const homeTeam = allTeams.find(t => t.id === teamSlugMapping[game.home_team.team_slug] || t.id === game.home_team.team_slug);

                                        return (
                                          <div key={game.event_id} className="flex items-center justify-center gap-1.5">
                                            {awayTeam && (
                                              <img
                                                src={awayTeam.logoUrl}
                                                alt={awayTeam.abbreviation}
                                                
                                                
                                                className="w-6 h-6"
                                              />
                                            )}
                                            <span className="text-xs text-gray-400 font-bold">@</span>
                                            {homeTeam && (
                                              <img
                                                src={homeTeam.logoUrl}
                                                alt={homeTeam.abbreviation}
                                                
                                                
                                                className="w-6 h-6"
                                              />
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  ) : (
                                    /* For 4+ games: Show compact badge */
                                    <div className={`inline-flex items-center justify-center w-full px-2 py-1 ${gameStyle.bg} ${gameStyle.text} border ${gameStyle.border} text-xs font-bold rounded-md`}>
                                      {gameCount} games
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </button>
                        );
                      });
                    })()}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
