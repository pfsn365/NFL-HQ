'use client';

import Link from 'next/link';
import { getAllTeams } from '@/data/teams';
import NFLTeamsSidebar from '@/components/NFLTeamsSidebar';
import NFLPlayoffBracket from '@/components/NFLPlayoffBracket';
import { useState, useEffect } from 'react';
import { getApiPath } from '@/utils/api';


export default function HomePageContent() {
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
  const [topStandings, setTopStandings] = useState<Array<{ teamId: string; teamName: string; wins: number; losses: number; ties?: number; winPct: number }>>([
    { teamId: 'kansas-city-chiefs', teamName: 'Kansas City Chiefs', wins: 15, losses: 1, winPct: 0.938 },
    { teamId: 'detroit-lions', teamName: 'Detroit Lions', wins: 13, losses: 3, winPct: 0.813 },
    { teamId: 'philadelphia-eagles', teamName: 'Philadelphia Eagles', wins: 12, losses: 4, winPct: 0.750 }
  ]);

  // Team records map for upcoming games
  const [teamRecords, setTeamRecords] = useState<Record<string, string>>({});

  // Fetch live standings
  useEffect(() => {
    async function fetchTopStandings() {
      try {
        const response = await fetch(getApiPath('nfl/teams/api/standings?season=2025'));

        if (!response.ok) return;

        const data = await response.json();

        // Collect all teams from the standings API response
        const allTeamsData: Array<{ teamId: string; teamName: string; wins: number; losses: number; ties?: number; winPct: number }> = [];
        const recordsMap: Record<string, string> = {};

        if (data.standings && Array.isArray(data.standings)) {
          for (const team of data.standings) {
            const wins = team.record?.wins || 0;
            const losses = team.record?.losses || 0;
            const ties = team.record?.ties || 0;

            allTeamsData.push({
              teamId: team.teamId,
              teamName: team.fullName,
              wins,
              losses,
              ties,
              winPct: team.winPercentage || 0
            });

            // Build records map for all teams
            recordsMap[team.teamId] = ties > 0 ? `${wins}-${losses}-${ties}` : `${wins}-${losses}`;
          }
        }

        // Sort by win percentage and take top 3
        const top3 = allTeamsData
          .sort((a, b) => b.winPct - a.winPct)
          .slice(0, 3);

        if (top3.length > 0) {
          setTopStandings(top3);
        }

        // Set team records map
        setTeamRecords(recordsMap);
      } catch (err) {
        console.error('Error fetching homepage standings:', err);
      }
    }

    fetchTopStandings();
  }, []);


  // Upcoming games - fetch from schedule API
  const [upcomingGames, setUpcomingGames] = useState<any[]>([]);
  const [gamesLoading, setGamesLoading] = useState(true);

  // Stat leaders - NFL stats
  interface StatLeader {
    playerId: number;
    playerSlug?: string;
    name: string;
    value: string | number;
    teamId: string;
    position?: string;
    gamesPlayed?: number;
  }

  interface StatLeaders {
    passingYards: StatLeader[];
    rushingYards: StatLeader[];
    receivingYards: StatLeader[];
    tackles: StatLeader[];
  }

  const [statLeaders, setStatLeaders] = useState<StatLeaders | null>(null);
  const [statLeadersLoading, setStatLeadersLoading] = useState(true);

  // Fetch upcoming games
  useEffect(() => {
    async function fetchUpcomingGames() {
      try {
        // Fetch schedule from our internal API for the next 7 days
        const now = new Date();
        const allGames: any[] = [];

        // Fetch games for next 7 days to find upcoming games
        for (let i = 0; i < 7; i++) {
          const date = new Date(now);
          date.setDate(date.getDate() + i);
          const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD

          const response = await fetch(getApiPath(`api/nfl/schedule/by-date?season=2025&date=${dateStr}`));

          if (response.ok) {
            const data = await response.json();
            if (data.schedule && Array.isArray(data.schedule)) {
              allGames.push(...data.schedule);
            }
          }
        }

        if (allGames.length > 0) {
          // Filter for upcoming games (not Final or in progress)
          const upcoming = allGames
            .filter((game: any) => game.status === 'Pre-Game')
            .sort((a: any, b: any) => {
              const dateA = new Date(a.start_date);
              const dateB = new Date(b.start_date);
              return dateA.getTime() - dateB.getTime();
            })
            .slice(0, 3); // Get next 3 games

          setUpcomingGames(upcoming);
        }
      } catch (err) {
        console.error('Error fetching upcoming games:', err);
      } finally {
        setGamesLoading(false);
      }
    }

    fetchUpcomingGames();
  }, []);


  // Fetch stat leaders
  useEffect(() => {
    async function fetchStatLeaders() {
      try {
        const response = await fetch(getApiPath('api/nfl/stat-leaders?season=2025&limit=5'));

        if (response.ok) {
          const data = await response.json();
          // Only set data if there's no error
          if (data.data && !data.error) {
            // Extract only the 4 categories we want
            setStatLeaders({
              passingYards: data.data.passingYards || [],
              rushingYards: data.data.rushingYards || [],
              receivingYards: data.data.receivingYards || [],
              tackles: data.data.tackles || [],
            });
          } else if (data.error) {
            // Keep statLeaders as null to show unavailable message
          }
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
      <main id="main-content" className="flex-1 lg:ml-64 min-w-0">
        {/* Header */}
        <div className="bg-[#0050A0] text-white pt-[57px] lg:pt-0 pb-4 lg:pb-6">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-4 lg:pt-10">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-3">
              NFL HQ
            </h1>
            <p className="text-base sm:text-lg lg:text-xl xl:text-2xl opacity-90">
              Your destination for NFL teams, stats, rankings, and interactive tools
            </p>
          </div>
        </div>

        {/* Raptive Header Ad */}
        <div className="container mx-auto px-4 h-[120px] flex items-center justify-center">
          <div className="raptive-pfn-header-90 w-full h-full"></div>
        </div>

        {/* NFL Playoff Bracket */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 mb-8">
          <NFLPlayoffBracket />
        </div>

        {/* Upcoming Games Section */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Upcoming Games</h2>
              <Link
                href="/nfl-hq/schedule"
                className="text-[#0050A0] hover:text-blue-700 font-semibold text-sm transition-colors"
              >
                View All Upcoming Games →
              </Link>
            </div>

            {gamesLoading ? (
              /* Loading Skeleton */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
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
            ) : upcomingGames.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcomingGames.map((game) => {
                  const awayTeam = allTeams.find(t => t.id === game.away_team.team_slug);
                  const homeTeam = allTeams.find(t => t.id === game.home_team.team_slug);
                  const gameDate = new Date(game.start_date);
                  const gameDateTime = gameDate.toLocaleString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    timeZoneName: 'short'
                  });
                  const isFinal = game.status === 'Final';
                  const isLive = game.status !== 'Pre-Game' && game.status !== 'Final' && (game.has_score || (game.away_team.score !== undefined && game.away_team.score !== null));
                  const hasScore = game.has_score || (game.status !== 'Pre-Game' && game.away_team.score !== undefined && game.away_team.score !== null);
                  const gameDateString = gameDate.toISOString().split('T')[0]; // Get YYYY-MM-DD format

                  return (
                    <Link
                      key={game.event_id}
                      href={`/nfl-hq/schedule?view=daily&date=${gameDateString}`}
                      className={`block border rounded-lg p-4 hover:border-[#0050A0] transition-colors relative ${isLive ? 'border-green-400 ring-2 ring-green-100' : 'border-gray-200'}`}
                    >
                      {isLive && (
                        <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 bg-green-500 text-white text-xs font-bold uppercase rounded">
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
                              <div className="text-xs text-gray-600">{teamRecords[awayTeam.id] || '0-0'}</div>
                            </div>
                          </>
                        )}
                        {hasScore && (
                          <div className={`text-xl font-bold ${
                            isFinal && game.away_team.is_winner ? 'text-green-600' :
                            isFinal ? 'text-gray-600' : 'text-gray-900'
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
                              <div className="text-xs text-gray-600">{teamRecords[homeTeam.id] || '0-0'}</div>
                            </div>
                          </>
                        )}
                        {hasScore && (
                          <div className={`text-xl font-bold ${
                            isFinal && game.home_team.is_winner ? 'text-green-600' :
                            isFinal ? 'text-gray-600' : 'text-gray-900'
                          }`}>
                            {game.home_team.score}
                          </div>
                        )}
                      </div>

                      {/* Game Status/Time */}
                      <div className="pt-3 border-t border-gray-200">
                        {game.status === 'Pre-Game' ? (
                          <div className="text-xs text-gray-600 text-center">{gameDateTime}</div>
                        ) : (
                          <div className={`text-xs font-semibold text-center ${
                            isFinal ? 'text-gray-600' : 'text-green-600'
                          }`}>
                            {game.status}
                          </div>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No upcoming games scheduled</p>
              </div>
            )}
          </div>
        </div>

        {/* Stat Leaders Section */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Stat Leaders</h2>
              <Link
                href="/stats"
                className="text-[#0050A0] hover:text-blue-700 font-semibold text-sm transition-colors"
              >
                View All Stats →
              </Link>
            </div>

            {statLeadersLoading ? (
              /* Loading Skeleton */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {['Passing Yards', 'Rushing Yards', 'Receiving Yards', 'Tackles'].map((stat) => (
                  <div key={stat} className="bg-gray-50 rounded-lg p-4 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-24 mb-3"></div>
                    <div className="space-y-2">
                      {[1, 2, 3, 4, 5].map((i) => (
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {/* Passing Yards */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-xs font-bold text-gray-600 uppercase mb-3">Passing Yards</h3>
                  <div className="space-y-2">
                    {statLeaders.passingYards.slice(0, 3).map((leader, idx) => {
                      const team = allTeams.find(t => t.id === leader.teamId);
                      return (
                        <div key={leader.playerId} className="flex items-center justify-between text-base">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="text-gray-600 font-semibold w-4">{idx + 1}</span>
                            {team && (
                              <img
                                src={team.logoUrl}
                                alt={team.abbreviation}
                                className="w-4 h-4 flex-shrink-0"
                              />
                            )}
                            <span className="font-medium text-gray-900 truncate text-sm">{leader.name}</span>
                          </div>
                          <span className="font-bold text-[#0050A0] ml-2">{leader.value}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Rushing Yards */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-xs font-bold text-gray-600 uppercase mb-3">Rushing Yards</h3>
                  <div className="space-y-2">
                    {statLeaders.rushingYards.slice(0, 3).map((leader, idx) => {
                      const team = allTeams.find(t => t.id === leader.teamId);
                      return (
                        <div key={leader.playerId} className="flex items-center justify-between text-base">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="text-gray-600 font-semibold w-4">{idx + 1}</span>
                            {team && (
                              <img
                                src={team.logoUrl}
                                alt={team.abbreviation}
                                className="w-4 h-4 flex-shrink-0"
                              />
                            )}
                            <span className="font-medium text-gray-900 truncate text-sm">{leader.name}</span>
                          </div>
                          <span className="font-bold text-[#0050A0] ml-2">{leader.value}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Receiving Yards */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-xs font-bold text-gray-600 uppercase mb-3">Receiving Yards</h3>
                  <div className="space-y-2">
                    {statLeaders.receivingYards.slice(0, 3).map((leader, idx) => {
                      const team = allTeams.find(t => t.id === leader.teamId);
                      return (
                        <div key={leader.playerId} className="flex items-center justify-between text-base">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="text-gray-600 font-semibold w-4">{idx + 1}</span>
                            {team && (
                              <img
                                src={team.logoUrl}
                                alt={team.abbreviation}
                                className="w-4 h-4 flex-shrink-0"
                              />
                            )}
                            <span className="font-medium text-gray-900 truncate text-sm">{leader.name}</span>
                          </div>
                          <span className="font-bold text-[#0050A0] ml-2">{leader.value}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Tackles */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-xs font-bold text-gray-600 uppercase mb-3">Tackles</h3>
                  <div className="space-y-2">
                    {statLeaders.tackles.slice(0, 3).map((leader, idx) => {
                      const team = allTeams.find(t => t.id === leader.teamId);
                      return (
                        <div key={leader.playerId} className="flex items-center justify-between text-base">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="text-gray-600 font-semibold w-4">{idx + 1}</span>
                            {team && (
                              <img
                                src={team.logoUrl}
                                alt={team.abbreviation}
                                className="w-4 h-4 flex-shrink-0"
                              />
                            )}
                            <span className="font-medium text-gray-900 truncate text-sm">{leader.name}</span>
                          </div>
                          <span className="font-bold text-[#0050A0] ml-2">{leader.value}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>Stat leaders data unavailable</p>
                <p className="text-xs mt-2">Check the <Link href="/stats" className="text-[#0050A0] hover:underline">Stat Leaders page</Link> for current NFL stats</p>
              </div>
            )}
          </div>
        </div>

        {/* Features Grid */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Interactive Tools & Features
              </h2>
            </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* NFL Standings Card with Preview */}
            <Link
              href="/standings"
              className="group relative bg-gray-50 rounded-xl p-6 border border-gray-200 hover:border-[#0050A0] hover:bg-white transition-all duration-300 hover:shadow-lg flex flex-col h-full"
            >
              <div className="flex items-center gap-3 mb-4">
                <h3 className="text-xl font-bold text-gray-900 group-hover:text-[#0050A0] transition-colors">
                  NFL Standings
                </h3>
              </div>
              <p className="text-gray-600 text-base mb-4">
                Current season standings and conference rankings
              </p>

              {/* Top 3 Teams Preview */}
              <div className="space-y-2 bg-gray-50 rounded-lg p-3 flex-grow">
                {topStandings.map((team, idx) => {
                  const teamInfo = allTeams.find(t => t.id === team.teamId);
                  return (
                    <div key={team.teamId} className="flex items-center justify-between text-base">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-gray-600 font-semibold w-4">{idx + 1}</span>
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
                      <span className="font-bold text-gray-900 ml-2">
                        {team.ties && team.ties > 0 ? `${team.wins}-${team.losses}-${team.ties}` : `${team.wins}-${team.losses}`}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 flex items-center text-[#0050A0] opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-sm font-medium">View Full Standings</span>
                <svg className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>

            {/* Free Agency Tracker Card */}
            <Link
              href="/free-agency-tracker"
              className="group relative bg-gray-50 rounded-xl p-6 border border-gray-200 hover:border-[#0050A0] hover:bg-white transition-all duration-300 hover:shadow-lg flex flex-col h-full"
            >
              <div className="flex items-center gap-3 mb-4">
                <h3 className="text-xl font-bold text-gray-900 group-hover:text-[#0050A0] transition-colors">
                  Free Agency Tracker
                </h3>
              </div>
              <p className="text-gray-600 text-sm mb-4">
                Track NFL free agents, signings, and available players
              </p>

              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 text-center flex-grow flex flex-col justify-center">
                <p className="text-sm font-semibold text-gray-700">Free Agent Marketplace</p>
                <p className="text-xs text-gray-600 mt-1">Player signings & availability</p>
              </div>

              <div className="mt-4 flex items-center text-[#0050A0] opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-sm font-medium">View Free Agents</span>
                <svg className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>

            {/* Power Rankings Builder Card */}
            <Link
              href="/power-rankings-builder"
              className="group relative bg-gray-50 rounded-xl p-6 border border-gray-200 hover:border-[#0050A0] hover:bg-white transition-all duration-300 hover:shadow-lg flex flex-col h-full"
            >
              <div className="flex items-center gap-3 mb-4">
                <h3 className="text-xl font-bold text-gray-900 group-hover:text-[#0050A0] transition-colors">
                  Power Rankings Builder
                </h3>
              </div>
              <p className="text-gray-600 text-sm mb-4">
                Create and customize your own NFL team power rankings
              </p>

              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-4 text-center flex-grow flex flex-col justify-center">
                <p className="text-sm font-semibold text-gray-700">Drag & Drop Rankings</p>
                <p className="text-xs text-gray-600 mt-1">Build your custom list</p>
              </div>

              <div className="mt-4 flex items-center text-[#0050A0] opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-sm font-medium">Start Building</span>
                <svg className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>

            {/* Salary Cap Tracker Card */}
            <Link
              href="/salary-cap-tracker"
              className="group relative bg-gray-50 rounded-xl p-6 border border-gray-200 hover:border-[#0050A0] hover:bg-white transition-all duration-300 hover:shadow-lg flex flex-col h-full"
            >
              <div className="flex items-center gap-3 mb-4">
                <h3 className="text-xl font-bold text-gray-900 group-hover:text-[#0050A0] transition-colors">
                  Salary Cap Tracker
                </h3>
              </div>
              <p className="text-gray-600 text-sm mb-4">
                Track NFL team salary cap situations and contracts
              </p>

              <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg p-4 text-center flex-grow flex flex-col justify-center">
                <p className="text-sm font-semibold text-gray-700">Cap Space Tracker</p>
                <p className="text-xs text-gray-600 mt-1">Team financials</p>
              </div>

              <div className="mt-4 flex items-center text-[#0050A0] opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-sm font-medium">View Salaries</span>
                <svg className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>

            {/* Injury Report Card */}
            <Link
              href="/injuries"
              className="group relative bg-gray-50 rounded-xl p-6 border border-gray-200 hover:border-[#0050A0] hover:bg-white transition-all duration-300 hover:shadow-lg flex flex-col h-full"
            >
              <div className="flex items-center gap-3 mb-4">
                <h3 className="text-xl font-bold text-gray-900 group-hover:text-[#0050A0] transition-colors">
                  NFL Injury Report
                </h3>
              </div>
              <p className="text-gray-600 text-sm mb-4">
                Real-time injury updates and player status across all teams
              </p>

              <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-lg p-4 text-center flex-grow flex flex-col justify-center">
                <p className="text-sm font-semibold text-gray-700">Live Injury Updates</p>
                <p className="text-xs text-gray-600 mt-1">Player availability</p>
              </div>

              <div className="mt-4 flex items-center text-[#0050A0] opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-sm font-medium">View Injury Report</span>
                <svg className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>

            {/* Transactions Card */}
            <Link
              href="/transactions"
              className="group relative bg-gray-50 rounded-xl p-6 border border-gray-200 hover:border-[#0050A0] hover:bg-white transition-all duration-300 hover:shadow-lg flex flex-col h-full"
            >
              <div className="flex items-center gap-3 mb-4">
                <h3 className="text-xl font-bold text-gray-900 group-hover:text-[#0050A0] transition-colors">
                  NFL Transactions
                </h3>
              </div>
              <p className="text-gray-600 text-sm mb-4">
                Latest trades, signings, and roster moves across the league
              </p>

              <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-lg p-4 text-center flex-grow flex flex-col justify-center">
                <p className="text-sm font-semibold text-gray-700">Recent Moves</p>
                <p className="text-xs text-gray-600 mt-1">Trades & signings</p>
              </div>

              <div className="mt-4 flex items-center text-[#0050A0] opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-sm font-medium">View Transactions</span>
                <svg className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          </div>
          </div>

          {/* Featured Teams Section */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Featured Teams
                </h2>
              </div>
              <Link
                href="/teams"
                className="hidden md:flex items-center gap-2 text-[#0050A0] hover:text-[#ff5722] font-semibold text-sm transition-colors"
              >
              View All Teams →
            </Link>
          </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 sm:gap-4">
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
                    <div className="text-xs font-bold text-gray-900 group-hover:text-[#0050A0] transition-colors">
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
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#0050A0] hover:bg-[#003d7a] text-white font-medium rounded-lg transition-colors"
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
