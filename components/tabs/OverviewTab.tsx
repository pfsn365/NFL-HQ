'use client';

import { useState, useEffect, useCallback } from 'react';
import OptimizedImage from '../OptimizedImage';
import { TeamData, getAllTeams } from '@/data/teams';
import { trackNewsClick, trackStandingsView, trackScheduleView } from '@/utils/ga-events';

// Helper function to clean player names for display and URLs
const getCleanPlayerName = (playerName: string) => {
  // Handle specific player name mappings
  if (playerName === 'James Cook III') {
    return 'James Cook';
  }

  return playerName;
};

// Helper function to generate PFSN URL
const getPFNUrl = (playerName: string) => {
  const cleanName = getCleanPlayerName(playerName);
  return `https://www.profootballnetwork.com/players/${cleanName.toLowerCase().replace(/[.\s]+/g, '-').replace(/[^\w-]/g, '').replace(/-+/g, '-')}/`;
};

// Helper function to get teams in the same division
const getDivisionTeams = (currentTeam: TeamData): TeamData[] => {
  const allTeams = getAllTeams();
  return allTeams
    .filter(team => team.division === currentTeam.division)
    .sort((a, b) => {
      // Sort by record (this would need real win-loss data in production)
      // For now, just sort alphabetically by city name
      return a.city.localeCompare(b.city);
    });
};

// Helper function to get team data by abbreviation
const getTeamByAbbreviation = (abbr: string): TeamData | null => {
  const allTeams = getAllTeams();
  return allTeams.find(team =>
    team.abbreviation.toLowerCase() === abbr.toLowerCase() ||
    team.espnAbbr.toLowerCase() === abbr.toLowerCase()
  ) || null;
};

// Helper function to get team nickname from full name
const getTeamNickname = (opponent: string, opponentAbbr?: string): string => {
  let targetTeam: TeamData | null = null;

  if (opponentAbbr) {
    targetTeam = getTeamByAbbreviation(opponentAbbr);
  }

  if (!targetTeam) {
    // Try to find by opponent name
    const allTeams = getAllTeams();
    targetTeam = allTeams.find(team =>
      team.fullName.toLowerCase() === opponent.toLowerCase() ||
      team.name.toLowerCase() === opponent.toLowerCase()
    ) || null;
  }

  // Return the nickname if we found the team, otherwise extract from full name
  if (targetTeam) {
    return targetTeam.name; // This is the nickname (e.g., "Chargers")
  }

  // Fallback: extract nickname from full name
  // "Los Angeles Chargers" -> "Chargers"
  const parts = opponent.split(' ');
  return parts[parts.length - 1];
};

// Helper function to get team URL by name or abbreviation
const getTeamUrl = (opponent: string, opponentAbbr?: string): string => {
  let targetTeam: TeamData | null = null;

  if (opponentAbbr) {
    targetTeam = getTeamByAbbreviation(opponentAbbr);
  }

  if (!targetTeam) {
    // Try to find by opponent name
    const allTeams = getAllTeams();
    targetTeam = allTeams.find(team =>
      team.fullName.toLowerCase() === opponent.toLowerCase() ||
      team.name.toLowerCase() === opponent.toLowerCase()
    ) || null;
  }

  if (targetTeam) {
    return `/nfl-hq/teams/${targetTeam.id}`;
  }

  return '#';
};

interface DivisionStanding {
  id: string;
  city: string;
  name: string;
  abbreviation: string;
  logoUrl: string;
  wins: number;
  losses: number;
  ties: number;
  winPercentage: number;
}

interface OverviewTabProps {
  team: TeamData;
  onTabChange?: (tab: string) => void;
  schedule?: ScheduleGame[];
  divisionStandings?: DivisionStanding[];
}

interface Article {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  author: string;
  category: string;
  readTime: string;
  featuredImage?: string;
}

interface ScheduleGame {
  week: number | string;
  date: string;
  opponent: string;
  opponentLogo: string;
  opponentAbbr?: string;
  isHome: boolean | null;
  time: string;
  tv: string;
  venue: string;
  result?: 'W' | 'L' | 'T' | null;
  score?: { home: number; away: number };
  eventType: string;
}


export default function OverviewTab({ team, onTabChange, schedule: passedSchedule, divisionStandings: passedStandings }: OverviewTabProps) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visibleArticles, setVisibleArticles] = useState(3);

  // Schedule state - use passed data if available
  const [schedule, setSchedule] = useState<ScheduleGame[]>(passedSchedule || []);
  const [scheduleLoading, setScheduleLoading] = useState(!passedSchedule);
  const [scheduleError, setScheduleError] = useState<string | null>(null);

  // Stats state
  const [stats, setStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  // Division standings state - use passed data if available
  const [divisionStandings, setDivisionStandings] = useState<DivisionStanding[]>(passedStandings || []);
  const [standingsLoading, setStandingsLoading] = useState(!passedStandings);
  const [standingsError, setStandingsError] = useState<string | null>(null);


  const fetchOverviewArticles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Use the team-specific API endpoint that works for all teams
      const response = await fetch(`/nfl-hq/nfl/teams/api/overview-articles/${team.id}`);

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch articles');
      }

      // Set all articles for pagination
      setArticles(data.articles);
    } catch (err) {
      setError(`Failed to load ${team.name} articles`);
      console.error('Error fetching overview articles:', err);
    } finally {
      setLoading(false);
    }
  }, [team.id, team.name]);

  const fetchTeamSchedule = useCallback(async () => {
    try {
      setScheduleLoading(true);
      setScheduleError(null);

      const response = await fetch(`/nfl-hq/nfl/teams/api/schedule/${team.id}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Schedule data not available for this team yet');
        }
        throw new Error(`Failed to fetch schedule: ${response.status}`);
      }

      const data = await response.json();

      if (!data.schedule || !Array.isArray(data.schedule)) {
        throw new Error('Invalid schedule data received');
      }

      // Filter to regular season games only
      const regularSeasonGames = data.schedule.filter(
        (game: ScheduleGame) => game.eventType === 'Regular Season'
      );

      // Find the current week or most recent week with results
      const now = new Date();
      const currentWeekIndex = regularSeasonGames.findIndex((game: ScheduleGame) => {
        if (game.opponentAbbr === 'BYE') return false;
        const gameDate = new Date(game.date);
        return gameDate >= now && !game.result;
      });

      let relevantGames: ScheduleGame[];

      if (currentWeekIndex === -1) {
        // No upcoming games - show last 5 games of the season
        relevantGames = regularSeasonGames.slice(-5);
      } else {
        // Show 2 games before current week and 2 games after (total 5 games)
        const startIndex = Math.max(0, currentWeekIndex - 2);
        const endIndex = Math.min(regularSeasonGames.length, startIndex + 5);

        // If we're near the end and can't get 5 games, shift the window back
        const actualStartIndex = endIndex - startIndex < 5
          ? Math.max(0, regularSeasonGames.length - 5)
          : startIndex;

        relevantGames = regularSeasonGames.slice(actualStartIndex, actualStartIndex + 5);
      }

      setSchedule(relevantGames);
    } catch (err) {
      console.error('Error fetching schedule:', err);
      setScheduleError(err instanceof Error ? err.message : 'Failed to load schedule');
    } finally {
      setScheduleLoading(false);
    }
  }, [team.id]);

  const fetchTeamStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      setStatsError(null);

      const response = await fetch(`/nfl-hq/nfl/teams/api/stats/${team.id}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Stats data not available for this team yet');
        }
        throw new Error(`Failed to fetch stats: ${response.status}`);
      }

      const data = await response.json();

      if (!data.stats) {
        throw new Error('Invalid stats data received');
      }

      setStats(data.stats);
    } catch (err) {
      console.error('Error fetching stats:', err);
      setStatsError(err instanceof Error ? err.message : 'Failed to load stats');
    } finally {
      setStatsLoading(false);
    }
  }, [team.id]);

  const fetchDivisionStandings = useCallback(async () => {
    try {
      setStandingsLoading(true);
      setStandingsError(null);

      // Fetch schedule data for all teams in the division
      const divisionTeams = getDivisionTeams(team);
      const standingsPromises = divisionTeams.map(async (divisionTeam) => {
        try {
          const response = await fetch(`/nfl-hq/nfl/teams/api/schedule/${divisionTeam.id}`);
          if (!response.ok) {
            throw new Error(`Failed to fetch schedule for ${divisionTeam.name}`);
          }
          const data = await response.json();

          // Calculate record from regular season games only
          const regularSeasonGames = data.schedule.filter((game: ScheduleGame) =>
            game.eventType === 'Regular Season' && game.result !== null
          );

          const wins = regularSeasonGames.filter((game: ScheduleGame) => game.result === 'W').length;
          const losses = regularSeasonGames.filter((game: ScheduleGame) => game.result === 'L').length;
          const ties = regularSeasonGames.filter((game: ScheduleGame) => game.result === 'T').length;

          return {
            ...divisionTeam,
            wins,
            losses,
            ties,
            winPercentage: wins + losses + ties > 0 ? wins / (wins + losses + ties) : 0
          };
        } catch (err) {
          console.error(`Error fetching data for ${divisionTeam.name}:`, err);
          return {
            ...divisionTeam,
            wins: 0,
            losses: 0,
            ties: 0,
            winPercentage: 0
          };
        }
      });

      const standings = await Promise.all(standingsPromises);

      // Sort by win percentage (highest first), then by wins as tiebreaker
      standings.sort((a, b) => {
        if (b.winPercentage !== a.winPercentage) {
          return b.winPercentage - a.winPercentage;
        }
        return b.wins - a.wins;
      });

      setDivisionStandings(standings);
    } catch (err) {
      console.error('Error fetching division standings:', err);
      setStandingsError(err instanceof Error ? err.message : 'Failed to load standings');
    } finally {
      setStandingsLoading(false);
    }
  }, [team]);

  // Update state when props change
  useEffect(() => {
    if (passedSchedule && passedSchedule.length > 0) {
      // Filter to regular season games and get relevant 5 games
      const regularSeasonGames = passedSchedule.filter(
        (game: ScheduleGame) => game.eventType === 'Regular Season'
      );

      const now = new Date();
      const currentWeekIndex = regularSeasonGames.findIndex((game: ScheduleGame) => {
        if (game.opponentAbbr === 'BYE') return false;
        const gameDate = new Date(game.date);
        return gameDate >= now && !game.result;
      });

      let relevantGames: ScheduleGame[];

      if (currentWeekIndex === -1) {
        relevantGames = regularSeasonGames.slice(-5);
      } else {
        const startIndex = Math.max(0, currentWeekIndex - 2);
        const endIndex = Math.min(regularSeasonGames.length, startIndex + 5);
        const actualStartIndex = endIndex - startIndex < 5
          ? Math.max(0, regularSeasonGames.length - 5)
          : startIndex;
        relevantGames = regularSeasonGames.slice(actualStartIndex, actualStartIndex + 5);
      }

      setSchedule(relevantGames);
      setScheduleLoading(false);
    }
  }, [passedSchedule]);

  useEffect(() => {
    if (passedStandings && passedStandings.length > 0) {
      setDivisionStandings(passedStandings);
      setStandingsLoading(false);
    }
  }, [passedStandings]);

  useEffect(() => {
    // Track overview tab view
    trackScheduleView(team.id, '2025');
    trackStandingsView(team.division);

    fetchOverviewArticles();
    fetchTeamStats();

    // Only fetch if data wasn't passed via props
    if (!passedSchedule) {
      fetchTeamSchedule();
    }
    if (!passedStandings) {
      fetchDivisionStandings();
    }
  }, [fetchOverviewArticles, fetchTeamSchedule, fetchTeamStats, fetchDivisionStandings, team.id, team.division, passedSchedule, passedStandings]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getRelativeTime = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return formatDate(dateString);
    }
  };

  return (
    <div className="space-y-6">
      {/* Row 1 - Three columns with key widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Column 1 - Schedule Widget */}
        <div>
          <div className="bg-white rounded-lg shadow p-6 h-[430px] flex flex-col">
            <h2 className="text-xl font-bold text-gray-900 mb-4">2025 Schedule</h2>

            <div className="space-y-3 flex-grow">
              {scheduleLoading ? (
                <div className="text-center py-8">
                  <div className="text-gray-600 text-sm">Loading schedule...</div>
                </div>
              ) : scheduleError ? (
                <div className="text-center py-8">
                  <p className="text-sm text-red-600">{scheduleError}</p>
                </div>
              ) : schedule.length > 0 ? (
                schedule.map((game, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    {game.opponentAbbr === 'BYE' ? (
                      <>
                        <div className="flex items-center space-x-3">
                          <div className="text-xs text-gray-600 w-12">Week {game.week}</div>
                          <span className="text-sm font-medium text-gray-600">BYE WEEK</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center space-x-3">
                          <div className="text-xs text-gray-600 w-12">
                            {new Date(game.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </div>
                          <div className="flex items-center space-x-2">
                            {!game.isHome && <span className="text-xs text-gray-600">@</span>}
                            <OptimizedImage
                              src={game.opponentLogo}
                              alt={game.opponentAbbr || ''}
                              width={20}
                              height={20}
                              className="w-5 h-5"
                              sizes="20px"
                            />
                            <a
                              href={getTeamUrl(game.opponent, game.opponentAbbr)}
                              className="text-base font-medium hover:underline transition-colors cursor-pointer"
                              style={{ color: team.primaryColor }}
                            >
                              {getTeamNickname(game.opponent, game.opponentAbbr)}
                            </a>
                          </div>
                        </div>
                        <div className="text-right">
                          {game.result && game.score ? (
                            <span className={`font-bold text-xs ${game.result === 'W' ? 'text-green-600' : 'text-red-600'}`}>
                              {game.result} {Math.max(game.score.home, game.score.away)}-{Math.min(game.score.home, game.score.away)}
                            </span>
                          ) : (
                            <div className="text-xs text-gray-600">{game.time || 'TBD'}</div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-600 text-sm">No upcoming games</div>
                </div>
              )}
            </div>

            {onTabChange && (
              <button
                onClick={() => onTabChange('schedule')}
                className="w-full mt-4 px-4 py-3 text-sm sm:text-base font-medium text-white rounded-lg hover:opacity-90 transition-opacity min-h-[48px] cursor-pointer"
                style={{ backgroundColor: team.primaryColor }}
              >
                View Full Schedule
              </button>
            )}
          </div>
        </div>

        {/* Column 2 - Division Standings */}
        <div>
          <div className="bg-white rounded-lg shadow p-6 h-[430px] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900">{team.division} Standings</h2>
            </div>
            <div className="overflow-x-auto flex-grow">
              <table className="w-full text-base">
                <thead>
                  <tr className="text-left border-b">
                    <th className="pb-2 text-xs font-medium text-gray-600 uppercase tracking-wider">Team</th>
                    <th className="pb-2 text-xs font-medium text-gray-600 uppercase tracking-wider text-center">W</th>
                    <th className="pb-2 text-xs font-medium text-gray-600 uppercase tracking-wider text-center">L</th>
                    <th className="pb-2 text-xs font-medium text-gray-600 uppercase tracking-wider text-center">PCT</th>
                  </tr>
                </thead>
                <tbody>
                  {standingsLoading ? (
                    <>
                      {[...Array(4)].map((_, i) => (
                        <tr key={i} className="border-b">
                          <td className="py-2">
                            <div className="flex items-center space-x-2">
                              <div className="h-4 w-4 bg-gray-200 rounded-full animate-pulse"></div>
                              <div className="h-4 bg-gray-200 rounded animate-pulse w-12"></div>
                            </div>
                          </td>
                          <td className="py-2 text-center">
                            <div className="h-4 bg-gray-200 rounded animate-pulse w-6 mx-auto"></div>
                          </td>
                          <td className="py-2 text-center">
                            <div className="h-4 bg-gray-200 rounded animate-pulse w-6 mx-auto"></div>
                          </td>
                          <td className="py-2 text-center">
                            <div className="h-4 bg-gray-200 rounded animate-pulse w-12 mx-auto"></div>
                          </td>
                        </tr>
                      ))}
                    </>
                  ) : standingsError ? (
                    <tr>
                      <td colSpan={4} className="text-center p-4 text-red-600 text-xs">
                        {standingsError}
                      </td>
                    </tr>
                  ) : (
                    divisionStandings.map((divisionTeam, index) => (
                      <tr
                        key={divisionTeam.id}
                        className={`${divisionTeam.id === team.id ? 'font-bold' : ''} ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                        style={divisionTeam.id === team.id ? { backgroundColor: team.primaryColor + '10' } : {}}
                      >
                        <td className="py-2 pr-4">
                          <div className="flex items-center space-x-2">
                            <OptimizedImage
                              src={divisionTeam.logoUrl}
                              alt={divisionTeam.abbreviation}
                              width={16}
                              height={16}
                              className="w-4 h-4"
                              sizes="16px"
                            />
                            <span className="text-sm">{divisionTeam.abbreviation}</span>
                          </div>
                        </td>
                        <td className="py-2 text-center">{divisionTeam.wins}</td>
                        <td className="py-2 text-center">{divisionTeam.losses}</td>
                        <td className="py-2 text-center">{divisionTeam.winPercentage.toFixed(3)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <a
              href="/nfl-hq/standings"
              className="block w-full mt-4 px-4 py-3 text-sm sm:text-base font-medium text-white rounded-lg hover:opacity-90 transition-opacity text-center min-h-[48px] flex items-center justify-center cursor-pointer"
              style={{ backgroundColor: team.primaryColor }}
            >
              View NFL Standings
            </a>
          </div>
        </div>

        {/* Column 3 - Team Stat Leaders */}
        <div>
          <div className="bg-white rounded-lg shadow p-6 h-[430px] flex flex-col">
            <div className="mb-4">
              <h2 className="text-lg font-bold text-gray-900">{team.name} Leaders</h2>
            </div>
            {statsLoading ? (
              <div className="flex items-center justify-center py-8 flex-grow">
                <div className="text-gray-600 text-sm">Loading stats...</div>
              </div>
            ) : statsError ? (
              <div className="flex items-center justify-center py-8 flex-grow">
                <div className="text-red-600 text-sm">{statsError}</div>
              </div>
            ) : (
              <div className="space-y-3 flex-grow">
                {/* Passing & Rushing */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-center">
                    <div className="text-center py-2 text-xs font-medium rounded mb-2 bg-gray-100 text-gray-700">
                      PASSING YDS
                    </div>
                    {stats?.passingYards ? (
                      <>
                        <div className="font-medium text-xs truncate px-1" style={{ color: team.primaryColor }}>
                          {getCleanPlayerName(stats.passingYards.name)}
                        </div>
                        <div className="text-base font-bold">{stats.passingYards.stat.toLocaleString()}</div>
                      </>
                    ) : (
                      <div className="text-xs text-gray-600">No data</div>
                    )}
                  </div>
                  <div className="text-center">
                    <div className="text-center py-2 text-xs font-medium rounded mb-2 bg-gray-100 text-gray-700">
                      RUSHING YDS
                    </div>
                    {stats?.rushingYards ? (
                      <>
                        <div className="font-medium text-xs truncate px-1" style={{ color: team.primaryColor }}>
                          {getCleanPlayerName(stats.rushingYards.name)}
                        </div>
                        <div className="text-base font-bold">{stats.rushingYards.stat.toLocaleString()}</div>
                      </>
                    ) : (
                      <div className="text-xs text-gray-600">No data</div>
                    )}
                  </div>
                </div>

                {/* Receiving & Tackles */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-center">
                    <div className="text-center py-2 text-xs font-medium rounded mb-2 bg-gray-100 text-gray-700">
                      RECEIVING YDS
                    </div>
                    {stats?.receivingYards ? (
                      <>
                        <div className="font-medium text-xs truncate px-1" style={{ color: team.primaryColor }}>
                          {getCleanPlayerName(stats.receivingYards.name)}
                        </div>
                        <div className="text-base font-bold">{stats.receivingYards.stat.toLocaleString()}</div>
                      </>
                    ) : (
                      <div className="text-xs text-gray-600">No data</div>
                    )}
                  </div>
                  <div className="text-center">
                    <div className="text-center py-2 text-xs font-medium rounded mb-2 bg-gray-100 text-gray-700">
                      TACKLES
                    </div>
                    {stats?.tackles ? (
                      <>
                        <div className="font-medium text-xs truncate px-1" style={{ color: team.primaryColor }}>
                          {getCleanPlayerName(stats.tackles.name)}
                        </div>
                        <div className="text-base font-bold">{stats.tackles.stat.toLocaleString()}</div>
                      </>
                    ) : (
                      <div className="text-xs text-gray-600">No data</div>
                    )}
                  </div>
                </div>

                {/* Sacks & Interceptions */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-center">
                    <div className="text-center py-2 text-xs font-medium rounded mb-2 bg-gray-100 text-gray-700">
                      SACKS
                    </div>
                    {stats?.sacks ? (
                      <>
                        <div className="font-medium text-xs truncate px-1" style={{ color: team.primaryColor }}>
                          {getCleanPlayerName(stats.sacks.name)}
                        </div>
                        <div className="text-base font-bold">{stats.sacks.stat.toLocaleString()}</div>
                      </>
                    ) : (
                      <div className="text-xs text-gray-600">No data</div>
                    )}
                  </div>
                  <div className="text-center">
                    <div className="text-center py-2 text-xs font-medium rounded mb-2 bg-gray-100 text-gray-700">
                      INTERCEPTIONS
                    </div>
                    {stats?.interceptions ? (
                      <>
                        <div className="font-medium text-xs truncate px-1" style={{ color: team.primaryColor }}>
                          {getCleanPlayerName(stats.interceptions.name)}
                        </div>
                        <div className="text-base font-bold">{stats.interceptions.stat.toLocaleString()}</div>
                      </>
                    ) : (
                      <div className="text-xs text-gray-600">No data</div>
                    )}
                  </div>
                </div>
              </div>
            )}
            {onTabChange && (
              <button
                onClick={() => onTabChange('stats')}
                className="w-full mt-4 px-4 py-3 text-sm sm:text-base font-medium text-white rounded-lg hover:opacity-90 transition-opacity min-h-[48px] cursor-pointer"
                style={{ backgroundColor: team.primaryColor }}
              >
                View Full Team Stats
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Row 2 - Full width articles section */}
      <div className="w-full">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900">Latest {team.name} Articles</h2>
          </div>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-lg overflow-hidden shadow-md animate-pulse">
                  <div className="w-full aspect-video bg-gray-200"></div>
                  <div className="p-4 space-y-3">
                    <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                    <div className="flex justify-between items-center">
                      <div className="h-3 bg-gray-200 rounded w-20"></div>
                      <div className="h-3 bg-gray-200 rounded w-16"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="text-red-600 text-sm">{error}</div>
            </div>
          ) : articles.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {articles.slice(0, visibleArticles).map((article, index) => (
                  <a
                    key={index}
                    href={article.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackNewsClick(article.title, team.id)}
                    className="block bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                  >
                    {/* Featured Image */}
                    {article.featuredImage && (
                      <div className="w-full aspect-video overflow-hidden bg-gray-200">
                        <img
                          src={article.featuredImage}
                          alt={article.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    )}

                    {/* Article Content */}
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2" style={{ color: team.primaryColor }}>
                        {article.title}
                      </h3>
                      <p className="text-base text-gray-600 mb-4 line-clamp-3">
                        {article.description}
                      </p>
                      <div className="flex items-center justify-between text-base">
                        <span className="text-gray-600">
                          {getRelativeTime(article.pubDate)}
                        </span>
                        <span className="font-medium" style={{ color: team.primaryColor }}>
                          Read More →
                        </span>
                      </div>
                    </div>
                  </a>
                ))}
              </div>

              {/* Show More Button */}
              {visibleArticles < articles.length && (
                <div className="mt-8 text-center">
                  <button
                    onClick={() => setVisibleArticles(prev => Math.min(prev + 3, articles.length))}
                    className="text-white px-8 py-4 rounded-lg font-medium transition-colors hover:opacity-90 text-base min-h-[48px]"
                    style={{ backgroundColor: team.primaryColor }}
                  >
                    Show More Articles
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-600 text-sm">No articles available</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
