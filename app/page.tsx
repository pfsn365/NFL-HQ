'use client';

import Link from 'next/link';
import { getAllTeams } from '@/data/teams';
import NFLTeamsSidebar from '@/components/NFLTeamsSidebar';
import { useState, useEffect } from 'react';

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

export default function HomePage() {
  const allTeams = getAllTeams();

  // Featured teams (popular/successful franchises)
  const featuredTeamIds = [
    'kansas-city-chiefs',
    'philadelphia-eagles',
    'san-francisco-49ers',
    'buffalo-bills',
    'dallas-cowboys',
    'green-bay-packers',
    'baltimore-ravens',
    'detroit-lions'
  ];

  const featuredTeams = featuredTeamIds
    .map(id => allTeams.find(team => team.id === id))
    .filter((team): team is NonNullable<typeof team> => team !== undefined);

  // Top 5 standings - fetch from API
  const [topStandings, setTopStandings] = useState([
    { teamId: 'kansas-city-chiefs', teamName: 'Kansas City Chiefs', wins: 15, losses: 1 },
    { teamId: 'detroit-lions', teamName: 'Detroit Lions', wins: 13, losses: 3 },
    { teamId: 'philadelphia-eagles', teamName: 'Philadelphia Eagles', wins: 12, losses: 4 },
    { teamId: 'buffalo-bills', teamName: 'Buffalo Bills', wins: 11, losses: 5 },
    { teamId: 'baltimore-ravens', teamName: 'Baltimore Ravens', wins: 11, losses: 5 }
  ]);

  // Fetch live standings
  useEffect(() => {
    async function fetchTopStandings() {
      try {
        const response = await fetch('/nba-hq/api/nba/standings?season=2025&level=conference');

        if (!response.ok) return;

        const data = await response.json();

        // Collect all teams from both conferences
        const allTeamsData: Array<{ teamId: string; teamName: string; wins: number; losses: number; winPct: number }> = [];

        if (data.standings?.conferences) {
          for (const conf of data.standings.conferences) {
            for (const team of conf.teams) {
              const teamId = teamSlugMapping[team.sk_slug] || team.sk_slug;
              const ourTeam = allTeams.find(t => t.id === teamId);

              if (ourTeam) {
                allTeamsData.push({
                  teamId,
                  teamName: ourTeam.fullName,
                  wins: team.wins || 0,
                  losses: team.losses || 0,
                  winPct: parseFloat(team.percentage || '0')
                });
              }
            }
          }
        }

        // Sort by win percentage and take top 5
        const top5 = allTeamsData
          .sort((a, b) => b.winPct - a.winPct)
          .slice(0, 5);

        if (top5.length > 0) {
          setTopStandings(top5);
        }
      } catch (err) {
        console.error('Error fetching homepage standings:', err);
      }
    }

    fetchTopStandings();
  }, [allTeams]);

  // Top 5 draft picks (worst records) - fetch from API
  const [topDraftPicks, setTopDraftPicks] = useState([
    { pick: 1, teamId: 'new-york-giants', teamName: 'New York Giants', record: '2-14' },
    { pick: 2, teamId: 'cleveland-browns', teamName: 'Cleveland Browns', record: '3-13' },
    { pick: 3, teamId: 'new-england-patriots', teamName: 'New England Patriots', record: '3-13' },
    { pick: 4, teamId: 'tennessee-titans', teamName: 'Tennessee Titans', record: '3-13' },
    { pick: 5, teamId: 'las-vegas-raiders', teamName: 'Las Vegas Raiders', record: '4-12' }
  ]);

  // Today's games - fetch from schedule API
  const [todaysGames, setTodaysGames] = useState<any[]>([]);
  const [gamesLoading, setGamesLoading] = useState(true);

  // Stat leaders
  interface StatLeader {
    playerId: number;
    playerSlug: string;
    name: string;
    value: string;
    teamId: string;
    gamesPlayed: number;
  }

  interface StatLeaders {
    points: StatLeader[];
    rebounds: StatLeader[];
    assists: StatLeader[];
    steals: StatLeader[];
    blocks: StatLeader[];
  }

  const [statLeaders, setStatLeaders] = useState<StatLeaders | null>(null);
  const [statLeadersLoading, setStatLeadersLoading] = useState(true);

  // Fetch today's games
  useEffect(() => {
    async function fetchTodaysGames() {
      try {
        const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
        const response = await fetch(`/nba-hq/api/nba/schedule/by-date?season=2025&date=${today}`);

        if (!response.ok) return;

        const data = await response.json();

        if (data.schedule && data.schedule.length > 0) {
          setTodaysGames(data.schedule);
        }
      } catch (err) {
        console.error('Error fetching today\'s games:', err);
      } finally {
        setGamesLoading(false);
      }
    }

    fetchTodaysGames();
  }, []);

  // Fetch draft order (worst records)
  useEffect(() => {
    async function fetchDraftOrder() {
      try {
        const response = await fetch('/nba-hq/api/nba/standings?season=2025&level=conference');

        if (!response.ok) return;

        const data = await response.json();

        // Collect all teams from both conferences
        const allTeamsData: Array<{ teamId: string; teamName: string; wins: number; losses: number; winPct: number }> = [];

        if (data.standings?.conferences) {
          for (const conf of data.standings.conferences) {
            for (const team of conf.teams) {
              const teamId = teamSlugMapping[team.sk_slug] || team.sk_slug;
              const ourTeam = allTeams.find(t => t.id === teamId);

              if (ourTeam) {
                allTeamsData.push({
                  teamId,
                  teamName: ourTeam.fullName,
                  wins: team.wins || 0,
                  losses: team.losses || 0,
                  winPct: parseFloat(team.percentage || '0')
                });
              }
            }
          }
        }

        // Sort by win percentage (ascending) and take bottom 5
        const bottom5 = allTeamsData
          .sort((a, b) => a.winPct - b.winPct)
          .slice(0, 5)
          .map((team, index) => ({
            pick: index + 1,
            teamId: team.teamId,
            teamName: team.teamName,
            record: `${team.wins}-${team.losses}`
          }));

        if (bottom5.length > 0) {
          setTopDraftPicks(bottom5);
        }
      } catch (err) {
        console.error('Error fetching draft order:', err);
      }
    }

    fetchDraftOrder();
  }, [allTeams]);

  // Fetch stat leaders
  useEffect(() => {
    async function fetchStatLeaders() {
      try {
        const response = await fetch('/nba-hq/api/nba/stat-leaders?season=2025&event=regular');

        if (!response.ok) return;

        const data = await response.json();

        if (data.data) {
          setStatLeaders(data.data);
        }
      } catch (err) {
        console.error('Error fetching stat leaders:', err);
      } finally {
        setStatLeadersLoading(false);
      }
    }

    fetchStatLeaders();
  }, []);

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
        {/* Hero Section */}
        <header style={{ backgroundColor: '#013369' }} className="text-white shadow-lg pt-[57px] lg:pt-0">
          <div className="container mx-auto px-4 py-6">
            <div className="text-center">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-3">NFL HQ</h1>
              <p className="text-base sm:text-lg lg:text-xl xl:text-2xl opacity-90">
                Your destination for NFL teams, stats, rankings, and interactive tools
              </p>
            </div>
          </div>
        </header>

        {/* Raptive Header Ad */}
        <div className="container mx-auto px-4 min-h-[150px]">
          <div className="raptive-pfn-header"></div>
        </div>

        {/* Upcoming Games Section */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Upcoming Games</h2>
              <Link
                href="/schedule"
                className="text-[#013369] hover:text-blue-700 font-semibold text-sm transition-colors"
              >
                View All Upcoming Games →
              </Link>
            </div>

            {gamesLoading ? (
              /* Loading Skeleton */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="border border-gray-200 rounded-lg p-4 animate-pulse">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 bg-gray-200 rounded"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-16 mb-1"></div>
                        <div className="h-3 bg-gray-200 rounded w-12"></div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 bg-gray-200 rounded"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-16 mb-1"></div>
                        <div className="h-3 bg-gray-200 rounded w-12"></div>
                      </div>
                    </div>
                    <div className="pt-3 border-t border-gray-200">
                      <div className="h-3 bg-gray-200 rounded w-24 mx-auto"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : todaysGames.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {todaysGames.slice(0, 6).map((game) => {
                  const awayTeam = allTeams.find(t => t.id === teamSlugMapping[game.away_team.team_slug] || t.id === game.away_team.team_slug);
                  const homeTeam = allTeams.find(t => t.id === teamSlugMapping[game.home_team.team_slug] || t.id === game.home_team.team_slug);
                  const gameTime = new Date(game.start_date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZoneName: 'short' });
                  const isFinal = game.status === 'Final';
                  const isLive = game.status !== 'Pre-Game' && game.status !== 'Final' && (game.has_score || (game.away_team.score !== undefined && game.away_team.score !== null));
                  const hasScore = game.has_score || (game.status !== 'Pre-Game' && game.away_team.score !== undefined && game.away_team.score !== null);

                  return (
                    <div key={game.event_id} className={`border rounded-lg p-4 hover:border-[#013369] transition-colors relative ${isLive ? 'border-green-400 ring-2 ring-green-100' : 'border-gray-200'}`}>
                      {isLive && (
                        <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 bg-green-500 text-white text-[10px] font-bold uppercase rounded">
                          <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                          Live
                        </div>
                      )}

                      {/* Away Team */}
                      <div className="flex items-center gap-3 mb-3">
                        {awayTeam && (
                          <>
                            <img
                              src={awayTeam.logoUrl}
                              alt={game.away_team.abbr}
                              className="w-8 h-8"
                            />
                            <div className="flex-1">
                              <div className="font-semibold text-gray-900 text-sm">{game.away_team.abbr}</div>
                              <div className="text-xs text-gray-600">{game.away_team.wins}-{game.away_team.losses}</div>
                            </div>
                          </>
                        )}
                        {hasScore && (
                          <div className={`text-xl font-bold ${
                            isFinal && game.away_team.is_winner ? 'text-green-600' :
                            isFinal ? 'text-gray-400' : 'text-gray-900'
                          }`}>
                            {game.away_team.score}
                          </div>
                        )}
                      </div>

                      {/* Home Team */}
                      <div className="flex items-center gap-3 mb-3">
                        {homeTeam && (
                          <>
                            <img
                              src={homeTeam.logoUrl}
                              alt={game.home_team.abbr}
                              className="w-8 h-8"
                            />
                            <div className="flex-1">
                              <div className="font-semibold text-gray-900 text-sm">{game.home_team.abbr}</div>
                              <div className="text-xs text-gray-600">{game.home_team.wins}-{game.home_team.losses}</div>
                            </div>
                          </>
                        )}
                        {hasScore && (
                          <div className={`text-xl font-bold ${
                            isFinal && game.home_team.is_winner ? 'text-green-600' :
                            isFinal ? 'text-gray-400' : 'text-gray-900'
                          }`}>
                            {game.home_team.score}
                          </div>
                        )}
                      </div>

                      {/* Game Status/Time */}
                      <div className="pt-3 border-t border-gray-200">
                        {game.status === 'Pre-Game' ? (
                          <div className="text-xs text-gray-600 text-center">{gameTime}</div>
                        ) : (
                          <div className={`text-xs font-semibold text-center ${
                            isFinal ? 'text-gray-600' : 'text-green-600'
                          }`}>
                            {game.status}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No games scheduled for today</p>
              </div>
            )}
          </div>
        </div>

        {/* Stat Leaders Section */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Stat Leaders</h2>
              <Link
                href="/stats"
                className="text-[#013369] hover:text-blue-700 font-semibold text-sm transition-colors"
              >
                View All Stats →
              </Link>
            </div>

            {statLeadersLoading ? (
              /* Loading Skeleton */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {['Points', 'Rebounds', 'Assists', 'Steals', 'Blocks'].map((stat) => (
                  <div key={stat} className="bg-gray-50 rounded-lg p-4 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-20 mb-3"></div>
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-1">
                            <div className="w-4 h-4 bg-gray-200 rounded"></div>
                            <div className="w-4 h-4 bg-gray-200 rounded"></div>
                            <div className="h-3 bg-gray-200 rounded flex-1"></div>
                          </div>
                          <div className="h-3 bg-gray-200 rounded w-8"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : statLeaders ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Points Leaders */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-bold text-gray-500 mb-3 uppercase tracking-wide">Points</h3>
                  <div className="space-y-2">
                    {statLeaders.points.map((player, idx) => {
                      const team = allTeams.find(t => t.id === player.teamId);
                      return (
                        <div key={player.playerId} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="text-gray-400 font-semibold w-4">{idx + 1}</span>
                            {team && (
                              <img
                                src={team.logoUrl}
                                alt={team.abbreviation}
                                className="w-4 h-4 flex-shrink-0"
                              />
                            )}
                            <span className="font-medium text-gray-900 truncate text-xs">{player.name}</span>
                          </div>
                          <span className="font-bold text-[#013369] ml-2">{player.value}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Rebounds Leaders */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-bold text-gray-500 mb-3 uppercase tracking-wide">Rebounds</h3>
                  <div className="space-y-2">
                    {statLeaders.rebounds.map((player, idx) => {
                      const team = allTeams.find(t => t.id === player.teamId);
                      return (
                        <div key={player.playerId} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="text-gray-400 font-semibold w-4">{idx + 1}</span>
                            {team && (
                              <img
                                src={team.logoUrl}
                                alt={team.abbreviation}
                                className="w-4 h-4 flex-shrink-0"
                              />
                            )}
                            <span className="font-medium text-gray-900 truncate text-xs">{player.name}</span>
                          </div>
                          <span className="font-bold text-[#013369] ml-2">{player.value}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Assists Leaders */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-bold text-gray-500 mb-3 uppercase tracking-wide">Assists</h3>
                  <div className="space-y-2">
                    {statLeaders.assists.map((player, idx) => {
                      const team = allTeams.find(t => t.id === player.teamId);
                      return (
                        <div key={player.playerId} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="text-gray-400 font-semibold w-4">{idx + 1}</span>
                            {team && (
                              <img
                                src={team.logoUrl}
                                alt={team.abbreviation}
                                className="w-4 h-4 flex-shrink-0"
                              />
                            )}
                            <span className="font-medium text-gray-900 truncate text-xs">{player.name}</span>
                          </div>
                          <span className="font-bold text-[#013369] ml-2">{player.value}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Steals Leaders */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-bold text-gray-500 mb-3 uppercase tracking-wide">Steals</h3>
                  <div className="space-y-2">
                    {statLeaders.steals.map((player, idx) => {
                      const team = allTeams.find(t => t.id === player.teamId);
                      return (
                        <div key={player.playerId} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="text-gray-400 font-semibold w-4">{idx + 1}</span>
                            {team && (
                              <img
                                src={team.logoUrl}
                                alt={team.abbreviation}
                                className="w-4 h-4 flex-shrink-0"
                              />
                            )}
                            <span className="font-medium text-gray-900 truncate text-xs">{player.name}</span>
                          </div>
                          <span className="font-bold text-[#013369] ml-2">{player.value}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Blocks Leaders */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-bold text-gray-500 mb-3 uppercase tracking-wide">Blocks</h3>
                  <div className="space-y-2">
                    {statLeaders.blocks.map((player, idx) => {
                      const team = allTeams.find(t => t.id === player.teamId);
                      return (
                        <div key={player.playerId} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="text-gray-400 font-semibold w-4">{idx + 1}</span>
                            {team && (
                              <img
                                src={team.logoUrl}
                                alt={team.abbreviation}
                                className="w-4 h-4 flex-shrink-0"
                              />
                            )}
                            <span className="font-medium text-gray-900 truncate text-xs">{player.name}</span>
                          </div>
                          <span className="font-bold text-[#013369] ml-2">{player.value}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>Stat leaders data unavailable</p>
              </div>
            )}
          </div>
        </div>

        {/* Features Grid */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Interactive Tools & Features
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Discover comprehensive NFL data, build custom rankings, and explore team information
              </p>
            </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* NFL Standings Card with Preview */}
            <Link
              href="/standings"
              className="group relative bg-gray-50 rounded-xl p-6 border border-gray-200 hover:border-[#013369] hover:bg-white transition-all duration-300 hover:shadow-lg"
            >
              <div className="flex items-center gap-3 mb-4">
                <h3 className="text-xl font-bold text-gray-900 group-hover:text-[#013369] transition-colors">
                  NFL Standings
                </h3>
              </div>
              <p className="text-gray-600 text-sm mb-4">
                Current season standings and conference rankings
              </p>

              {/* Top 5 Teams Preview */}
              <div className="space-y-2 bg-gray-50 rounded-lg p-3">
                <div className="text-xs font-semibold text-gray-500 mb-2">TOP 5 TEAMS</div>
                {topStandings.map((team, idx) => {
                  const teamInfo = allTeams.find(t => t.id === team.teamId);
                  return (
                    <div key={team.teamId} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-gray-400 font-semibold w-4">{idx + 1}</span>
                        {teamInfo && (
                          <>
                            <img
                              src={teamInfo.logoUrl}
                              alt={teamInfo.abbreviation}
                              className="w-5 h-5 flex-shrink-0"
                            />
                            <span className="font-medium text-gray-900 truncate">{teamInfo.abbreviation}</span>
                          </>
                        )}
                      </div>
                      <span className="font-bold text-gray-900 ml-2">{team.wins}-{team.losses}</span>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 flex items-center text-[#013369] opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-sm font-medium">View Full Standings</span>
                <svg className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>

            {/* Draft Order Card with Preview */}
            <Link
              href="/draft-order"
              className="group relative bg-gray-50 rounded-xl p-6 border border-gray-200 hover:border-[#013369] hover:bg-white transition-all duration-300 hover:shadow-lg"
            >
              <div className="flex items-center gap-3 mb-4">
                <h3 className="text-xl font-bold text-gray-900 group-hover:text-[#013369] transition-colors">
                  Draft Order
                </h3>
              </div>
              <p className="text-gray-600 text-sm mb-4">
                Latest NFL draft order and lottery results
              </p>

              {/* Top 5 Draft Picks Preview */}
              <div className="space-y-2 bg-gray-50 rounded-lg p-3">
                <div className="text-xs font-semibold text-gray-500 mb-2">TOP 5 PICKS</div>
                {topDraftPicks.map((pick) => {
                  const teamInfo = allTeams.find(t => t.id === pick.teamId);
                  return (
                    <div key={pick.teamId} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-white bg-[#013369] font-bold w-6 h-6 rounded flex items-center justify-center text-xs flex-shrink-0">
                          {pick.pick}
                        </span>
                        {teamInfo && (
                          <>
                            <img
                              src={teamInfo.logoUrl}
                              alt={teamInfo.abbreviation}
                              className="w-5 h-5 flex-shrink-0"
                            />
                            <span className="font-medium text-gray-900 truncate">{teamInfo.abbreviation}</span>
                          </>
                        )}
                      </div>
                      <span className="text-gray-600 text-xs ml-2">{pick.record}</span>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 flex items-center text-[#013369] opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-sm font-medium">View Full Draft Order</span>
                <svg className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>

            {/* Power Rankings Builder Card */}
            <Link
              href="/power-rankings-builder"
              className="group relative bg-gray-50 rounded-xl p-6 border border-gray-200 hover:border-[#013369] hover:bg-white transition-all duration-300 hover:shadow-lg"
            >
              <div className="flex items-center gap-3 mb-4">
                <h3 className="text-xl font-bold text-gray-900 group-hover:text-[#013369] transition-colors">
                  Power Rankings Builder
                </h3>
              </div>
              <p className="text-gray-600 text-sm mb-4">
                Create and customize your own NFL team power rankings
              </p>

              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-4 text-center">
                <p className="text-sm font-semibold text-gray-700">Drag & Drop Rankings</p>
                <p className="text-xs text-gray-600 mt-1">Build your custom list</p>
              </div>

              <div className="mt-4 flex items-center text-[#013369] opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-sm font-medium">Start Building</span>
                <svg className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>

            {/* Player Rankings Builder Card */}
            <Link
              href="/player-rankings-builder"
              className="group relative bg-gray-50 rounded-xl p-6 border border-gray-200 hover:border-[#013369] hover:bg-white transition-all duration-300 hover:shadow-lg"
            >
              <div className="flex items-center gap-3 mb-4">
                <h3 className="text-xl font-bold text-gray-900 group-hover:text-[#013369] transition-colors">
                  Player Rankings Builder
                </h3>
              </div>
              <p className="text-gray-600 text-sm mb-4">
                Build custom player rankings from NFL legends and stars
              </p>

              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 text-center">
                <p className="text-sm font-semibold text-gray-700">Rank the Greats</p>
                <p className="text-xs text-gray-600 mt-1">Your all-time list</p>
              </div>

              <div className="mt-4 flex items-center text-[#013369] opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-sm font-medium">Start Ranking</span>
                <svg className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>

            {/* Salary Cap Tracker Card */}
            <Link
              href="/salary-cap-tracker"
              className="group relative bg-gray-50 rounded-xl p-6 border border-gray-200 hover:border-[#013369] hover:bg-white transition-all duration-300 hover:shadow-lg"
            >
              <div className="flex items-center gap-3 mb-4">
                <h3 className="text-xl font-bold text-gray-900 group-hover:text-[#013369] transition-colors">
                  Salary Cap Tracker
                </h3>
              </div>
              <p className="text-gray-600 text-sm mb-4">
                Track NFL team salary cap situations and contracts
              </p>

              <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg p-4 text-center">
                <p className="text-sm font-semibold text-gray-700">Cap Space Tracker</p>
                <p className="text-xs text-gray-600 mt-1">Team financials</p>
              </div>

              <div className="mt-4 flex items-center text-[#013369] opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-sm font-medium">View Salaries</span>
                <svg className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>

            {/* NFL Teams Card */}
            <Link
              href="/teams"
              className="group relative bg-gray-50 rounded-xl p-6 border border-gray-200 hover:border-[#013369] hover:bg-white transition-all duration-300 hover:shadow-lg"
            >
              <div className="flex items-center gap-3 mb-4">
                <h3 className="text-xl font-bold text-gray-900 group-hover:text-[#013369] transition-colors">
                  NFL Teams
                </h3>
              </div>
              <p className="text-gray-600 text-sm mb-4">
                Comprehensive pages for all 30 NFL teams
              </p>

              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 text-center">
                <p className="text-sm font-semibold text-gray-700">All 32 Teams</p>
                <p className="text-xs text-gray-600 mt-1">Rosters, stats & history</p>
              </div>

              <div className="mt-4 flex items-center text-[#013369] opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-sm font-medium">Browse Teams</span>
                <svg className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          </div>
          </div>

          {/* Featured Teams Section */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Featured Teams
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Quick access to popular NFL franchises
                </p>
              </div>
              <Link
                href="/teams"
                className="hidden md:flex items-center gap-2 text-[#013369] hover:text-[#ff5722] font-semibold text-sm transition-colors"
              >
              View All Teams →
            </Link>
          </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-4">
              {featuredTeams.map((team) => (
                <Link
                  key={team.id}
                  href={`/teams/${team.id}`}
                  className="group relative bg-gray-50 rounded-xl p-4 border border-gray-200 hover:border-[#013369] hover:bg-white transition-all duration-300 hover:shadow-lg hover:-translate-y-1 flex flex-col items-center justify-center aspect-square"
                >
                  <div className="relative w-20 h-20 mb-2">
                    <img
                      src={team.logoUrl}
                      alt={team.fullName}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="text-center">
                    <div className="text-xs font-bold text-gray-900 group-hover:text-[#013369] transition-colors">
                      {team.abbreviation}
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* View all teams button for mobile */}
            <div className="mt-6 md:hidden text-center">
              <Link
                href="/teams"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#013369] hover:bg-[#003d7a] text-white font-medium rounded-lg transition-colors"
              >
                View All 32 Teams
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
