'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import { getAllTeams } from '@/data/teams';
import NFLTeamsSidebar from '@/components/NFLTeamsSidebar';
import { getApiPath } from '@/utils/api';
import SkeletonLoader from '@/components/SkeletonLoader';

// Map API team slugs to our team IDs (Sportskeeda uses various formats)
const teamSlugMapping: Record<string, string> = {
  // Arizona Cardinals
  'arizona-cardinals': 'arizona-cardinals',
  'ari': 'arizona-cardinals',

  // Atlanta Falcons
  'atlanta-falcons': 'atlanta-falcons',
  'atl': 'atlanta-falcons',

  // Baltimore Ravens
  'baltimore-ravens': 'baltimore-ravens',
  'bal': 'baltimore-ravens',

  // Buffalo Bills
  'buffalo-bills': 'buffalo-bills',
  'buf': 'buffalo-bills',

  // Carolina Panthers
  'carolina-panthers': 'carolina-panthers',
  'car': 'carolina-panthers',

  // Chicago Bears
  'chicago-bears': 'chicago-bears',
  'chi': 'chicago-bears',

  // Cincinnati Bengals
  'cincinnati-bengals': 'cincinnati-bengals',
  'cin': 'cincinnati-bengals',

  // Cleveland Browns
  'cleveland-browns': 'cleveland-browns',
  'cle': 'cleveland-browns',

  // Dallas Cowboys
  'dallas-cowboys': 'dallas-cowboys',
  'dal': 'dallas-cowboys',

  // Denver Broncos
  'denver-broncos': 'denver-broncos',
  'den': 'denver-broncos',

  // Detroit Lions
  'detroit-lions': 'detroit-lions',
  'det': 'detroit-lions',

  // Green Bay Packers
  'green-bay-packers': 'green-bay-packers',
  'gb': 'green-bay-packers',

  // Houston Texans
  'houston-texans': 'houston-texans',
  'hou': 'houston-texans',

  // Indianapolis Colts
  'indianapolis-colts': 'indianapolis-colts',
  'ind': 'indianapolis-colts',

  // Jacksonville Jaguars
  'jacksonville-jaguars': 'jacksonville-jaguars',
  'jax': 'jacksonville-jaguars',

  // Kansas City Chiefs
  'kansas-city-chiefs': 'kansas-city-chiefs',
  'kc': 'kansas-city-chiefs',

  // Las Vegas Raiders
  'las-vegas-raiders': 'las-vegas-raiders',
  'lv': 'las-vegas-raiders',
  'oakland-raiders': 'las-vegas-raiders',

  // Los Angeles Chargers
  'los-angeles-chargers': 'los-angeles-chargers',
  'lac': 'los-angeles-chargers',
  'la-chargers': 'los-angeles-chargers',
  'san-diego-chargers': 'los-angeles-chargers',

  // Los Angeles Rams
  'los-angeles-rams': 'los-angeles-rams',
  'lar': 'los-angeles-rams',
  'la-rams': 'los-angeles-rams',
  'st-louis-rams': 'los-angeles-rams',

  // Miami Dolphins
  'miami-dolphins': 'miami-dolphins',
  'mia': 'miami-dolphins',

  // Minnesota Vikings
  'minnesota-vikings': 'minnesota-vikings',
  'min': 'minnesota-vikings',

  // New England Patriots
  'new-england-patriots': 'new-england-patriots',
  'ne': 'new-england-patriots',

  // New Orleans Saints
  'new-orleans-saints': 'new-orleans-saints',
  'no': 'new-orleans-saints',

  // New York Giants
  'new-york-giants': 'new-york-giants',
  'nyg': 'new-york-giants',

  // New York Jets
  'new-york-jets': 'new-york-jets',
  'nyj': 'new-york-jets',

  // Philadelphia Eagles
  'philadelphia-eagles': 'philadelphia-eagles',
  'phi': 'philadelphia-eagles',

  // Pittsburgh Steelers
  'pittsburgh-steelers': 'pittsburgh-steelers',
  'pit': 'pittsburgh-steelers',

  // San Francisco 49ers
  'san-francisco-49ers': 'san-francisco-49ers',
  'sf': 'san-francisco-49ers',

  // Seattle Seahawks
  'seattle-seahawks': 'seattle-seahawks',
  'sea': 'seattle-seahawks',

  // Tampa Bay Buccaneers
  'tampa-bay-buccaneers': 'tampa-bay-buccaneers',
  'tb': 'tampa-bay-buccaneers',

  // Tennessee Titans
  'tennessee-titans': 'tennessee-titans',
  'ten': 'tennessee-titans',

  // Washington Commanders
  'washington-commanders': 'washington-commanders',
  'was': 'washington-commanders',
  'washington-football-team': 'washington-commanders',
};

interface Game {
  event_id: string;
  start_date: string;
  status: string;
  has_score: boolean;
  is_live?: boolean;
  away_team: {
    team_slug: string;
    abbr: string;
    team_name: string;
    wins: number;
    losses: number;
    score?: number;
    is_winner?: boolean;
    has_possession?: boolean;
  };
  home_team: {
    team_slug: string;
    abbr: string;
    team_name: string;
    wins: number;
    losses: number;
    score?: number;
    is_winner?: boolean;
    has_possession?: boolean;
  };
  situation?: {
    down_distance?: string;
    is_red_zone?: boolean;
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
  hi_pass?: {
    player_id: number;
    player_name: string;
    player_slug: string;
    value: number;
  };
  hi_rush?: {
    player_id: number;
    player_name: string;
    player_slug: string;
    value: number;
  };
  hi_rec?: {
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

function SchedulePageInner() {
  const allTeams = getAllTeams();
  const searchParams = useSearchParams();

  // Initialize state from URL parameters if available
  const urlView = searchParams.get('view') as ViewMode | null;
  const urlDate = searchParams.get('date');

  const [viewMode, setViewMode] = useState<ViewMode>(urlView && ['daily', 'weekly', 'monthly'].includes(urlView) ? urlView : 'weekly');
  const [selectedDate, setSelectedDate] = useState<string>(urlDate || getLocalDateString());
  const [games, setGames] = useState<Game[]>([]);
  const [weeklyGames, setWeeklyGames] = useState<Record<string, Game[]>>({});
  const [monthlyGames, setMonthlyGames] = useState<Record<string, Game[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedGame, setExpandedGame] = useState<string | null>(null);
  const [expandedWeeklyGame, setExpandedWeeklyGame] = useState<string | null>(null);
  const [teamRecords, setTeamRecords] = useState<Record<string, string>>({});

  // Fetch team records from standings API
  useEffect(() => {
    async function fetchTeamRecords() {
      try {
        const response = await fetch(getApiPath('nfl/teams/api/standings?season=2025'));
        if (!response.ok) return;

        const data = await response.json();
        const recordsMap: Record<string, string> = {};

        if (data.standings && Array.isArray(data.standings)) {
          for (const team of data.standings) {
            const wins = team.record?.wins || 0;
            const losses = team.record?.losses || 0;
            const ties = team.record?.ties || 0;
            recordsMap[team.teamId] = ties > 0 ? `${wins}-${losses}-${ties}` : `${wins}-${losses}`;
          }
        }

        setTeamRecords(recordsMap);
      } catch (err) {
        console.error('Error fetching team records:', err);
      }
    }

    fetchTeamRecords();
  }, []);

  // Consolidated fetch based on view mode - prevents multiple concurrent API calls
  useEffect(() => {
    async function fetchScheduleData() {
      setLoading(true);
      setError(null);

      // Clear expanded states when data changes
      setExpandedGame(null);
      setExpandedWeeklyGame(null);

      try {
        if (viewMode === 'daily') {
          // Fetch single day
          const response = await fetch(getApiPath(`api/nfl/schedule/by-date?season=2025&date=${selectedDate}`));

          if (!response.ok) {
            throw new Error('Failed to fetch schedule');
          }

          const data = await response.json();
          setGames(data.schedule || []);

        } else if (viewMode === 'weekly') {
          // Fetch week range
          const weekRange = getWeekRange(selectedDate);
          const gamesMap: Record<string, Game[]> = {};

          await Promise.all(
            weekRange.days.map(async (day) => {
              const response = await fetch(getApiPath(`api/nfl/schedule/by-date?season=2025&date=${day}`));
              if (response.ok) {
                const data = await response.json();
                gamesMap[day] = data.schedule || [];
              } else {
                gamesMap[day] = [];
              }
            })
          );

          setWeeklyGames(gamesMap);

        } else if (viewMode === 'monthly') {
          // Fetch entire month
          const monthDays = getMonthDays(selectedDate);
          const gamesMap: Record<string, Game[]> = {};

          await Promise.all(
            monthDays.map(async (day) => {
              const response = await fetch(getApiPath(`api/nfl/schedule/by-date?season=2025&date=${day}`));
              if (response.ok) {
                const data = await response.json();
                gamesMap[day] = data.schedule || [];
              } else {
                gamesMap[day] = [];
              }
            })
          );

          setMonthlyGames(gamesMap);
        }
      } catch (err) {
        console.error(`Error fetching ${viewMode} schedule:`, err);
        setError(`Failed to load ${viewMode} schedule. Please try again.`);
      } finally {
        setLoading(false);
      }
    }

    fetchScheduleData();

    // Poll for updates every 30 seconds during live games
    const pollInterval = setInterval(() => {
      // Only poll if we're looking at today's games (likely live)
      const today = new Date().toISOString().split('T')[0];
      if (selectedDate === today) {
        fetchScheduleData();
      }
    }, 30000);

    return () => clearInterval(pollInterval);
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

  const goToPreviousWeek = () => {
    const date = new Date(selectedDate + 'T12:00:00');
    date.setDate(date.getDate() - 7);
    setSelectedDate(getLocalDateString(date));
  };

  const goToNextWeek = () => {
    const date = new Date(selectedDate + 'T12:00:00');
    date.setDate(date.getDate() + 7);
    setSelectedDate(getLocalDateString(date));
  };

  const goToPreviousMonth = () => {
    const date = new Date(selectedDate + 'T12:00:00');
    date.setMonth(date.getMonth() - 1);
    setSelectedDate(getLocalDateString(date));
  };

  const goToNextMonth = () => {
    const date = new Date(selectedDate + 'T12:00:00');
    date.setMonth(date.getMonth() + 1);
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
      <main id="main-content" className="flex-1 lg:ml-64 min-w-0">
        {/* Header */}
        <div className="bg-[#0050A0] text-white pt-[57px] lg:pt-0 pb-4 lg:pb-6">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-4 lg:pt-10">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-3">
              NFL Schedule
            </h1>
            <p className="text-base sm:text-lg lg:text-xl xl:text-2xl opacity-90">
              View all NFL games, scores, and game details
            </p>
          </div>
        </div>

        {/* Raptive Header Ad */}
        <div className="container mx-auto px-4 h-[120px] flex items-center justify-center">
          <div className="raptive-pfn-header-90 w-full h-full"></div>
        </div>

        {/* View Mode and Filters */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
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
                    window.location.href = `/nfl-hq/teams/${e.target.value}/schedule`;
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

          {/* Date Navigation */}
          {viewMode === 'daily' && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3 sm:p-4 mb-6">
              <div className="flex flex-col gap-3">
              {/* Date Controls */}
              <div className="flex items-center gap-2 justify-center">
                <button
                  onClick={goToPreviousDay}
                  className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 active:bg-gray-300 transition-colors flex-shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center"
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
                  className={`px-3 sm:px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0050A0] text-gray-900 text-sm sm:text-base flex-1 max-w-[200px] min-h-[44px] ${
                    isToday ? 'border-[#0050A0] bg-blue-50 ring-2 ring-[#0050A0]' : 'border-gray-300'
                  }`}
                />

                <button
                  onClick={goToNextDay}
                  className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 active:bg-gray-300 transition-colors flex-shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center"
                  aria-label="Next day"
                >
                  <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* Display Date */}
              <div className="text-center">
                <div className="flex items-center justify-center gap-2">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                    {formatDisplayDate(selectedDate)}
                  </h2>
                  {isToday && (
                    <span className="inline-block px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded">
                      Today
                    </span>
                  )}
                </div>
                {!loading && !error && games.length > 0 && (
                  <div className="mt-1 text-xs sm:text-sm text-gray-600">
                    {games.length} game{games.length !== 1 ? 's' : ''} scheduled
                  </div>
                )}
              </div>
            </div>
          </div>
          )}

          {/* Weekly Navigation */}
          {viewMode === 'weekly' && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3 sm:p-4 mb-6">
              <div className="flex items-center justify-between gap-2 sm:gap-4">
                <button
                  onClick={goToPreviousWeek}
                  className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 active:bg-gray-300 transition-colors flex-shrink-0 min-h-[44px]"
                  aria-label="Previous week"
                >
                  <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span className="hidden md:inline text-sm font-medium text-gray-700">Previous</span>
                </button>

                <div className="text-center flex-1 min-w-0">
                  <h2 className="text-sm sm:text-lg font-bold text-gray-900">
                    {(() => {
                      const weekRange = getWeekRange(selectedDate);
                      const startDate = new Date(weekRange.start + 'T12:00:00');
                      const endDate = new Date(weekRange.end + 'T12:00:00');
                      return `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
                    })()}
                  </h2>
                </div>

                <button
                  onClick={goToNextWeek}
                  className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 active:bg-gray-300 transition-colors flex-shrink-0 min-h-[44px]"
                  aria-label="Next week"
                >
                  <span className="hidden md:inline text-sm font-medium text-gray-700">Next</span>
                  <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Monthly Navigation */}
          {viewMode === 'monthly' && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3 sm:p-4 mb-6">
              <div className="flex items-center justify-between gap-2 sm:gap-4">
                <button
                  onClick={goToPreviousMonth}
                  className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 active:bg-gray-300 transition-colors flex-shrink-0 min-h-[44px]"
                  aria-label="Previous month"
                >
                  <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span className="hidden md:inline text-sm font-medium text-gray-700">Previous</span>
                </button>

                <div className="text-center flex-1 min-w-0">
                  <h2 className="text-sm sm:text-lg font-bold text-gray-900">
                    {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </h2>
                </div>

                <button
                  onClick={goToNextMonth}
                  className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 active:bg-gray-300 transition-colors flex-shrink-0 min-h-[44px]"
                  aria-label="Next month"
                >
                  <span className="hidden md:inline text-sm font-medium text-gray-700">Next</span>
                  <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Content based on view mode */}
          {viewMode === 'daily' && (
            <>{/* Games Grid */}
          {loading ? (
            <SkeletonLoader type="cards" rows={6} />
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
              <p className="text-gray-600">There are no NFL games scheduled for this date.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {games.map((game) => {
                const awayTeam = allTeams.find(t => t.id === teamSlugMapping[game.away_team.team_slug] || t.id === game.away_team.team_slug);
                const homeTeam = allTeams.find(t => t.id === teamSlugMapping[game.home_team.team_slug] || t.id === game.home_team.team_slug);
                const gameDate = new Date(game.start_date);
                const gameTime = gameDate.toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  timeZoneName: 'short'
                });
                const gameDayOfWeek = gameDate.toLocaleDateString('en-US', { weekday: 'short' });

                const isLive = game.is_live || (game.status !== 'Pre-Game' && game.status !== 'Final' && game.has_score);
                const isFinal = game.status === 'Final';
                const isExpanded = expandedGame === game.event_id;
                const hasDetails = game.venue || game.tv_stations?.length || game.hi_pass || game.hi_rush || game.hi_rec;

                return (
                  <div
                    key={game.event_id}
                    className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-all ${
                      isLive ? 'border-green-400 ring-2 ring-green-100' : 'border-gray-200'
                    }`}
                  >
                    {/* Main Game Card - Clickable */}
                    <div
                      role={hasDetails ? 'button' : undefined}
                      tabIndex={hasDetails ? 0 : undefined}
                      aria-expanded={hasDetails ? expandedGame === game.event_id : undefined}
                      aria-label={hasDetails ? `${awayTeam?.name || game.away_team.abbr} at ${homeTeam?.name || game.home_team.abbr} - ${isFinal ? 'Final' : game.status}. Click for details` : undefined}
                      onClick={() => hasDetails && toggleGameExpand(game.event_id)}
                      onKeyDown={(e) => { if (hasDetails && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); toggleGameExpand(game.event_id); } }}
                      className={`p-5 ${hasDetails ? 'cursor-pointer hover:bg-gray-50 active:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500' : ''}`}
                    >
                      <div className="flex items-center gap-6">
                        {/* Both Teams - Left Side */}
                        <div className="flex-1 space-y-3">
                          {/* Away Team */}
                          <div className="flex items-center gap-3">
                            {isLive && game.away_team.has_possession && (
                              <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse flex-shrink-0" title="Has possession"></span>
                            )}
                            {awayTeam ? (
                              <>
                                <img
                                  src={awayTeam.logoUrl}
                                  alt={awayTeam.fullName}
                                  width={40}
                                  height={40}
                                  className="w-10 h-10 flex-shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="font-bold text-gray-900">
                                    <span className="sm:hidden">{awayTeam.name}</span>
                                    <span className="hidden sm:inline">{awayTeam.fullName}</span>
                                  </div>
                                  <div className="text-base text-gray-600">{teamRecords[awayTeam.id] || '0-0'}</div>
                                </div>
                              </>
                            ) : (
                              <div className="flex-1">
                                <div className="font-bold text-gray-900">{game.away_team.abbr}</div>
                                <div className="text-base text-gray-600">{game.away_team.wins}-{game.away_team.losses}</div>
                              </div>
                            )}
                          </div>

                          {/* Home Team */}
                          <div className="flex items-center gap-3">
                            {isLive && game.home_team.has_possession && (
                              <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse flex-shrink-0" title="Has possession"></span>
                            )}
                            {homeTeam ? (
                              <>
                                <img
                                  src={homeTeam.logoUrl}
                                  alt={homeTeam.fullName}
                                  width={40}
                                  height={40}
                                  className="w-10 h-10 flex-shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="font-bold text-gray-900">
                                    <span className="sm:hidden">{homeTeam.name}</span>
                                    <span className="hidden sm:inline">{homeTeam.fullName}</span>
                                  </div>
                                  <div className="text-base text-gray-600">{teamRecords[homeTeam.id] || '0-0'}</div>
                                </div>
                              </>
                            ) : (
                              <div className="flex-1">
                                <div className="font-bold text-gray-900">{game.home_team.abbr}</div>
                                <div className="text-base text-gray-600">{game.home_team.wins}-{game.home_team.losses}</div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Status - Center */}
                        <div className="flex items-center justify-center min-w-[100px]">
                          {game.status === 'Pre-Game' ? (
                            <div className="text-base text-gray-700 font-medium text-center">{gameTime}</div>
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

                      {/* Live Situation - Down & Distance, Red Zone */}
                      {isLive && game.situation && (game.situation.down_distance || game.situation.is_red_zone) && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <div className="flex items-center gap-2">
                            {game.situation.is_red_zone && (
                              <span className="px-2 py-1 bg-red-100 text-red-700 font-bold text-xs rounded-full">
                                RED ZONE
                              </span>
                            )}
                            {game.situation.down_distance && (
                              <span className="text-sm text-gray-600 font-medium">
                                {game.situation.down_distance}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

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
                          {/* Game Leaders */}
                          {isFinal && (game.hi_pass || game.hi_rush || game.hi_rec) && (
                            <div>
                              <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-3">Game Leaders</h4>
                              <div className="space-y-3">
                                {game.hi_pass && (
                                  <div className="flex items-center gap-2">
                                    <div className="flex-1">
                                      <div className="text-base font-semibold text-gray-900">{game.hi_pass.player_name}</div>
                                      <div className="text-xs text-gray-600">Passing</div>
                                    </div>
                                    <div className="text-base font-bold text-[#0050A0]">{game.hi_pass.value} YDS</div>
                                  </div>
                                )}
                                {game.hi_rush && (
                                  <div className="flex items-center gap-2">
                                    <div className="flex-1">
                                      <div className="text-base font-semibold text-gray-900">{game.hi_rush.player_name}</div>
                                      <div className="text-xs text-gray-600">Rushing</div>
                                    </div>
                                    <div className="text-base font-bold text-[#0050A0]">{game.hi_rush.value} YDS</div>
                                  </div>
                                )}
                                {game.hi_rec && (
                                  <div className="flex items-center gap-2">
                                    <div className="flex-1">
                                      <div className="text-base font-semibold text-gray-900">{game.hi_rec.player_name}</div>
                                      <div className="text-xs text-gray-600">Receiving</div>
                                    </div>
                                    <div className="text-base font-bold text-[#0050A0]">{game.hi_rec.value} YDS</div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Stadium */}
                          {game.venue && (
                            <div>
                              <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-3">Stadium</h4>
                              <div className="flex items-start gap-3">
                                <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <div>
                                  <div className="text-base font-semibold text-gray-900">{game.venue.name}</div>
                                  <div className="text-xs text-gray-600">
                                    {game.venue.city}{game.venue.state ? `, ${game.venue.state.abbreviation}` : ''}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* TV Broadcast */}
                          {game.tv_stations && game.tv_stations.length > 0 && (
                            <div>
                              <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-3">Broadcast</h4>
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
                                width={20}
                                height={20}
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
                                width={20}
                                height={20}
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
                <div className="grid grid-cols-1 md:grid-cols-7 gap-4" style={{ minHeight: '500px' }}>
                  {Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} className="bg-white rounded-xl border border-gray-200 shadow-sm animate-pulse">
                      <div className="p-3 bg-gray-200 h-16"></div>
                      <div className="p-2 space-y-2">
                        <div className="h-20 bg-gray-200 rounded"></div>
                        <div className="h-20 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                  <p className="text-red-600">{error}</p>
                </div>
              ) : (
                <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
                  <div className="grid grid-flow-col auto-cols-[minmax(240px,1fr)] sm:auto-cols-[minmax(260px,1fr)] md:grid-cols-7 md:auto-cols-auto gap-2 sm:gap-3 md:gap-4 min-w-min md:min-w-0">
                  {getWeekRange(selectedDate).days.map((day) => {
                    const dayDate = new Date(day + 'T12:00:00');
                    const dayGames = weeklyGames[day] || [];
                    const isToday = day === getLocalDateString();

                    return (
                      <div key={day} className={`bg-white rounded-xl border shadow-sm overflow-hidden ${isToday ? 'border-[#0050A0] ring-2 ring-[#0050A0]' : 'border-gray-200'}`}>
                        <div className={`p-3 text-center border-b ${isToday ? 'bg-blue-50 border-[#0050A0]' : 'bg-gray-50 border-gray-200'}`}>
                          <div className="text-xs font-semibold text-gray-600 uppercase">
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
                                const isLive = game.is_live || (game.status !== 'Pre-Game' && game.status !== 'Final' && (game.has_score || (game.away_team.score !== undefined && game.away_team.score !== null)));
                                const isExpanded = expandedWeeklyGame === game.event_id;
                                const hasDetails = game.venue || game.tv_stations?.length || game.hi_pass || game.hi_rush || game.hi_rec;

                                return (
                                  <div key={game.event_id} className={`border rounded-lg overflow-hidden ${isLive ? 'border-green-400 ring-1 ring-green-400' : 'border-gray-200'}`}>
                                    <button
                                      onClick={() => setExpandedWeeklyGame(isExpanded ? null : game.event_id)}
                                      className={`w-full text-xs p-2 hover:bg-gray-50 hover:border-[#0050A0] transition-colors relative ${isLive ? 'pt-5' : ''}`}
                                    >
                                      {isLive && (
                                        <div className="absolute top-0.5 right-1 flex items-center gap-0.5 bg-green-100 px-1 rounded">
                                          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                                          <span className="text-[8px] font-bold text-green-600 uppercase">Live</span>
                                        </div>
                                      )}
                                      <div className="flex items-center justify-between gap-1">
                                        {awayTeam && (
                                          <img src={awayTeam.logoUrl} alt={awayTeam.abbreviation} width={20} height={20} className="w-5 h-5" />
                                        )}
                                        <span className="font-semibold flex-1 text-left">{awayTeam?.abbreviation || game.away_team.abbr}</span>
                                        {(game.has_score || (game.status !== 'Pre-Game' && game.away_team.score !== undefined && game.away_team.score !== null)) ? (
                                          <span className={isFinal && game.away_team.is_winner ? 'font-bold' : ''}>{game.away_team.score}</span>
                                        ) : (
                                          <span className="text-gray-600 text-xs">
                                            {new Date(game.start_date).toLocaleTimeString('en-US', {
                                              hour: 'numeric',
                                              minute: '2-digit'
                                            })}
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-1 mt-1">
                                        <span className="text-gray-400 text-xs">@</span>
                                      </div>
                                      <div className="flex items-center justify-between gap-1">
                                        {homeTeam && (
                                          <img src={homeTeam.logoUrl} alt={homeTeam.abbreviation} width={20} height={20} className="w-5 h-5" />
                                        )}
                                        <span className="font-semibold flex-1 text-left">{homeTeam?.abbreviation || game.home_team.abbr}</span>
                                        {(game.has_score || (game.status !== 'Pre-Game' && game.home_team.score !== undefined && game.home_team.score !== null)) && <span className={isFinal && game.home_team.is_winner ? 'font-bold' : ''}>{game.home_team.score}</span>}
                                      </div>
                                    </button>

                                    {/* Expanded Details */}
                                    {isExpanded && hasDetails && (
                                      <div className="border-t border-gray-200 bg-gray-50 p-3 text-xs">
                                        {/* Stadium */}
                                        {game.venue && (
                                          <div className="mb-3">
                                            <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">Stadium</h4>
                                            <div className="text-xs">
                                              <div className="font-semibold text-gray-900">{game.venue.name}</div>
                                              <div className="text-gray-600">
                                                {game.venue.city}{game.venue.state ? `, ${game.venue.state.abbreviation}` : ''}
                                              </div>
                                            </div>
                                          </div>
                                        )}

                                        {/* TV Broadcast */}
                                        {game.tv_stations && game.tv_stations.length > 0 && (
                                          <div className="mb-3">
                                            <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">Broadcast</h4>
                                            <div className="flex flex-wrap gap-1">
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
                                        )}

                                        {/* Team Links */}
                                        <div className="flex flex-wrap gap-1">
                                          {awayTeam && (
                                            <Link
                                              href={`/teams/${awayTeam.id}`}
                                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white border border-gray-300 rounded text-xs font-medium text-gray-700 hover:bg-gray-50 active:bg-gray-100"
                                            >
                                              {awayTeam.abbreviation}
                                            </Link>
                                          )}
                                          {homeTeam && (
                                            <Link
                                              href={`/teams/${homeTeam.id}`}
                                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white border border-gray-300 rounded text-xs font-medium text-gray-700 hover:bg-gray-50 active:bg-gray-100"
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
                </div>
              )}
            </>
          )}

          {/* Monthly View */}
          {viewMode === 'monthly' && (
            <>
              {loading ? (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden animate-pulse" style={{ minHeight: '600px' }}>
                  <div className="grid grid-cols-7 bg-gray-200 border-b border-gray-300">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                      <div key={day} className="p-3 h-12"></div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7">
                    {Array.from({ length: 35 }).map((_, i) => (
                      <div key={i} className="aspect-square border-r border-b border-gray-200 p-3">
                        <div className="h-6 w-6 bg-gray-200 rounded mb-2"></div>
                      </div>
                    ))}
                  </div>
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
                      <div key={day} className="p-2 sm:p-3 text-center text-xs sm:text-sm font-semibold text-gray-600 border-r border-gray-200 last:border-r-0">
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
                            className={`aspect-square border-r border-b p-1 sm:p-2 md:p-3 hover:shadow-md transition-all group ${
                              gameCount > 0 ? 'bg-white hover:bg-gray-50' : 'bg-gray-50 hover:bg-gray-100'
                            } ${isToday ? 'ring-2 ring-[#0050A0] ring-inset' : 'border-gray-200'}`}
                          >
                            <div className="h-full flex flex-col">
                              {/* Date Number */}
                              <div className={`text-sm sm:text-base md:text-lg font-bold mb-1 sm:mb-2 ${
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
                                          <div key={game.event_id} className="flex items-center justify-center gap-0.5 sm:gap-1">
                                            {awayTeam && (
                                              <img
                                                src={awayTeam.logoUrl}
                                                alt={awayTeam.abbreviation}
                                                width={24}
                                                height={24}
                                                className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6"
                                              />
                                            )}
                                            <span className="text-xs text-gray-400 font-bold">@</span>
                                            {homeTeam && (
                                              <img
                                                src={homeTeam.logoUrl}
                                                alt={homeTeam.abbreviation}
                                                width={24}
                                                height={24}
                                                className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6"
                                              />
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  ) : (
                                    /* For 4+ games: Show compact badge */
                                    <div className={`inline-flex items-center justify-center px-2 py-1 ${gameStyle.bg} ${gameStyle.text} border ${gameStyle.border} text-xs font-bold rounded whitespace-nowrap`}>
                                      <span className="hidden sm:inline">{gameCount} games</span>
                                      <span className="sm:hidden">{gameCount}g</span>
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

// Wrapper component with Suspense boundary
export default function SchedulePageContent() {
  return (
    <Suspense fallback={
      <div className="flex h-screen bg-gray-50">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading schedule...</p>
          </div>
        </div>
      </div>
    }>
      <SchedulePageInner />
    </Suspense>
  );
}
