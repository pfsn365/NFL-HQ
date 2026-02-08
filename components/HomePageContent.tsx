'use client';

import Link from 'next/link';
import { getAllTeams } from '@/data/teams';
import NFLPlayoffBracket from '@/components/NFLPlayoffBracket';
import { useState, useEffect } from 'react';
import { getApiPath } from '@/utils/api';


export default function HomePageContent() {
  const allTeams = getAllTeams();

  // Top 5 standings - fetch from API
  const [topStandings, setTopStandings] = useState<Array<{ teamId: string; teamName: string; wins: number; losses: number; ties?: number; winPct: number }>>([
    { teamId: 'kansas-city-chiefs', teamName: 'Kansas City Chiefs', wins: 15, losses: 1, winPct: 0.938 },
    { teamId: 'detroit-lions', teamName: 'Detroit Lions', wins: 13, losses: 3, winPct: 0.813 },
    { teamId: 'philadelphia-eagles', teamName: 'Philadelphia Eagles', wins: 12, losses: 4, winPct: 0.750 }
  ]);

  // Team records map for upcoming games
  const [teamRecords, setTeamRecords] = useState<Record<string, string>>({});

  // Super Bowl countdown
  const SUPER_BOWL_DATE = new Date('2026-02-08T23:30:00Z'); // 6:30 PM ET
  const [countdown, setCountdown] = useState<{ days: number; hours: number; minutes: number } | null>(null);

  useEffect(() => {
    const getCountdown = () => {
      const now = new Date();
      const diff = SUPER_BOWL_DATE.getTime() - now.getTime();
      if (diff <= 0) return null;
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      return { days, hours, minutes };
    };
    setCountdown(getCountdown());
    const timer = setInterval(() => setCountdown(getCountdown()), 60000);
    return () => clearInterval(timer);
  }, []);

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

  // Latest articles state
  interface Article {
    title: string;
    link: string;
    pubDate: string;
    description: string;
    featuredImage?: string;
    author?: string;
    category?: string;
  }
  const [latestArticles, setLatestArticles] = useState<Article[]>([]);
  const [articlesLoading, setArticlesLoading] = useState(true);

  // Format relative time for articles
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
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    }
  };

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

  // Fetch latest articles
  useEffect(() => {
    async function fetchLatestArticles() {
      try {
        // Fetch from the Insights feed (most general news)
        const response = await fetch(getApiPath('api/proxy-rss?url=' + encodeURIComponent('https://www.profootballnetwork.com/insights/feed/')));

        if (response.ok) {
          const data = await response.json();
          if (data.articles && Array.isArray(data.articles)) {
            setLatestArticles(data.articles.slice(0, 3));
          }
        }
      } catch (err) {
        console.error('Error fetching latest articles:', err);
      } finally {
        setArticlesLoading(false);
      }
    }

    fetchLatestArticles();
  }, []);

  return (
    <main id="main-content" className="pt-[57px] lg:pt-0">
        {/* Header */}
        <header
          className="text-white shadow-lg"
          style={{
            background: 'linear-gradient(180deg, #0050A0 0%, #003A75 100%)',
            boxShadow: 'inset 0 -30px 40px -30px rgba(0,0,0,0.15), 0 4px 6px -1px rgba(0,0,0,0.1)'
          }}
        >
          <div className="container mx-auto px-4 pt-6 sm:pt-7 md:pt-8 lg:pt-10 pb-5 sm:pb-6 md:pb-7 lg:pb-8">
            <h1 className="text-4xl lg:text-5xl font-extrabold mb-2">
              NFL HQ
            </h1>
            <p className="text-lg opacity-90 font-medium">
              Your destination for NFL teams, stats, rankings, and interactive tools
            </p>
          </div>
        </header>

        {/* Raptive Header Ad */}
        <div className="container mx-auto px-4 h-[120px] flex items-center justify-center">
          <div className="raptive-pfn-header-90 w-full h-full"></div>
        </div>

        {/* Super Bowl LX Banner */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 mb-6">
          <Link
            href="/super-bowl-lx"
            className="group block bg-gradient-to-r from-[#002244] via-[#0050A0] to-[#002244] rounded-xl border-2 border-[#D4AF37] shadow-lg p-4 sm:p-6 hover:shadow-2xl hover:shadow-[#D4AF37]/20 hover:scale-[1.02] hover:border-[#FFD700] transition-all duration-300 cursor-pointer relative overflow-hidden"
          >
            {/* Shimmer effect on hover */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>

            <div className="relative flex items-center justify-between w-full px-2 sm:px-6 lg:px-12">
              {/* Patriots logo - left */}
              <img
                src="/nfl-hq/new-england-patriots.png"
                alt="New England Patriots"
                className="w-20 h-20 sm:w-28 sm:h-28 lg:w-36 lg:h-36 object-contain group-hover:scale-110 transition-transform duration-300"
              />

              {/* Center content - SB logo, countdown, CTA */}
              <div className="flex flex-col items-center">
                <img
                  src="https://staticd.profootballnetwork.com/skm/assets/pfn/sblx-logo.png"
                  alt="Super Bowl LX"
                  className={`object-contain ${countdown ? 'w-16 h-16 sm:w-20 sm:h-20 lg:w-28 lg:h-28' : 'w-24 h-24 sm:w-32 sm:h-32 lg:w-40 lg:h-40'}`}
                />
                {countdown && (
                  <div className="mt-2 flex items-center gap-1 sm:gap-2 text-white">
                    <div className="text-center">
                      <div className="text-lg sm:text-xl lg:text-2xl font-bold">{countdown.days}</div>
                      <div className="text-[10px] sm:text-xs uppercase tracking-wider opacity-75">Days</div>
                    </div>
                    <span className="text-lg sm:text-xl font-bold opacity-50">:</span>
                    <div className="text-center">
                      <div className="text-lg sm:text-xl lg:text-2xl font-bold">{countdown.hours}</div>
                      <div className="text-[10px] sm:text-xs uppercase tracking-wider opacity-75">Hrs</div>
                    </div>
                    <span className="text-lg sm:text-xl font-bold opacity-50">:</span>
                    <div className="text-center">
                      <div className="text-lg sm:text-xl lg:text-2xl font-bold">{countdown.minutes}</div>
                      <div className="text-[10px] sm:text-xs uppercase tracking-wider opacity-75">Min</div>
                    </div>
                  </div>
                )}
                {/* CTA text */}
                <div className="mt-2 flex items-center gap-2 text-[#D4AF37] group-hover:text-[#FFD700] transition-colors">
                  <span className="text-sm sm:text-base font-semibold">View Super Bowl LX Coverage</span>
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>

              {/* Seahawks logo - right */}
              <img
                src="/nfl-hq/seattle-seahawks-sb.png"
                alt="Seattle Seahawks"
                className="w-20 h-20 sm:w-28 sm:h-28 lg:w-36 lg:h-36 object-contain group-hover:scale-110 transition-transform duration-300"
              />
            </div>
          </Link>
        </div>

        {/* NFL Playoff Bracket */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 mb-8">
          <NFLPlayoffBracket />
        </div>

        {/* Stat Leaders Section */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Stat Leaders</h2>
              <Link
                href="/stats"
                className="text-[#0050A0] hover:text-[#003A75] font-semibold text-sm transition-colors"
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
              className="group relative bg-gray-50 rounded-xl p-6 border border-gray-200 hover:border-[#0050A0] hover:bg-white hover:shadow-lg transition-all cursor-pointer flex flex-col h-full"
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
              className="group relative bg-gray-50 rounded-xl p-6 border border-gray-200 hover:border-[#0050A0] hover:bg-white hover:shadow-lg transition-all cursor-pointer flex flex-col h-full"
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
                <p className="text-base font-semibold text-gray-700">Free Agent Hub</p>
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
              className="group relative bg-gray-50 rounded-xl p-6 border border-gray-200 hover:border-[#0050A0] hover:bg-white hover:shadow-lg transition-all cursor-pointer flex flex-col h-full"
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
                <p className="text-base font-semibold text-gray-700">Drag & Drop Rankings</p>
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
              className="group relative bg-gray-50 rounded-xl p-6 border border-gray-200 hover:border-[#0050A0] hover:bg-white hover:shadow-lg transition-all cursor-pointer flex flex-col h-full"
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
                <p className="text-base font-semibold text-gray-700">Cap Space Tracker</p>
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
              className="group relative bg-gray-50 rounded-xl p-6 border border-gray-200 hover:border-[#0050A0] hover:bg-white hover:shadow-lg transition-all cursor-pointer flex flex-col h-full"
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
                <p className="text-base font-semibold text-gray-700">Live Injury Updates</p>
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
              className="group relative bg-gray-50 rounded-xl p-6 border border-gray-200 hover:border-[#0050A0] hover:bg-white hover:shadow-lg transition-all cursor-pointer flex flex-col h-full"
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
                <p className="text-base font-semibold text-gray-700">Recent Moves</p>
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

          {/* Latest NFL Articles Section */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Latest NFL Articles</h2>
            </div>

            {articlesLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-gray-50 rounded-lg overflow-hidden animate-pulse">
                    <div className="w-full aspect-video bg-gray-200"></div>
                    <div className="p-4">
                      <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-full mb-1"></div>
                      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : latestArticles.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {latestArticles.map((article, index) => (
                  <a
                    key={`${article.link}-${index}`}
                    href={article.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group bg-white rounded-lg overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                  >
                    {article.featuredImage ? (
                      <div className="w-full aspect-video overflow-hidden bg-gray-200">
                        <img
                          src={article.featuredImage}
                          alt={article.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ) : (
                      <div className="w-full aspect-video bg-gradient-to-br from-[#0050A0] to-[#003A75] flex items-center justify-center">
                        <span className="text-white text-3xl font-bold opacity-30">PFN</span>
                      </div>
                    )}
                    <div className="p-4">
                      <h3 className="text-base font-semibold text-gray-900 group-hover:text-[#0050A0] line-clamp-2 mb-2 transition-colors">
                        {article.title}
                      </h3>
                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                        {article.description}
                      </p>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">
                          {getRelativeTime(article.pubDate)}
                        </span>
                        <span className="font-medium text-[#0050A0]">
                          Read More →
                        </span>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>Unable to load articles</p>
              </div>
            )}

            {/* See All NFL Articles button */}
            <div className="mt-6 text-center">
              <Link
                href="/articles"
                className="inline-flex items-center gap-2 px-6 py-3 min-h-[44px] bg-[#0050A0] hover:bg-[#003A75] active:scale-[0.98] text-white font-medium rounded-lg transition-all cursor-pointer"
              >
                See All NFL Articles
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>

        </div>
    </main>
  );
}
