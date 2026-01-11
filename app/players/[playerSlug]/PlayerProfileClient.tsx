'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Script from 'next/script';
import NFLTeamsSidebar from '@/components/NFLTeamsSidebar';
import { getApiPath } from '@/utils/api';
import SkeletonLoader from '@/components/SkeletonLoader';

interface PlayerProfile {
  name: string;
  slug: string;
  team: {
    id: string;
    name: string;
    abbreviation: string;
    logo: string;
    primaryColor: string;
    secondaryColor: string;
  };
  position: string;
  positionFull: string;
  jerseyNumber: number;
  age: number;
  height: string;
  weight: number;
  college: string;
  experience: number;
  experienceLabel: string;
  draft: string | null;
  birthDate: string;
  birthPlace: string;
  status: string;
  headshotUrl: string;
  pfsnImpact: {
    score: number;
    grade: string;
    seasonRank: number;
    overallRank: number;
    season: number;
    weeklyData: Array<{ week: number; score: number; grade: string; opponent: string }>;
    stats: Record<string, string | number>;
  } | null;
  seasonStats: {
    season: string;
    stats: Array<{
      name: string;
      label: string;
      shortLabel: string;
      abbreviation: string;
      value: number;
      displayValue: string;
    }>;
  } | null;
  gameLog: {
    season: string;
    availableSeasons: number[];
    statLabels: Array<{ name: string; label: string }>;
    games: Array<{
      week: number;
      date: string;
      opponent: string;
      opponentLogo: string;
      homeAway: string;
      result: string;
      stats: Record<string, string>;
    }>;
  } | null;
  careerStats: {
    categories: Array<{
      name: string;
      displayName: string;
      labels: string[];
      names: string[];
      displayNames: string[];
      seasons: Array<{
        year: number;
        displayName: string;
        teamId: string;
        teamSlug: string;
        stats: Record<string, string>;
      }>;
      totals: Record<string, string>;
    }>;
    availableSeasons: number[];
  } | null;
}

interface Props {
  playerSlug: string;
}

interface Article {
  title: string;
  link: string;
  pubDate: string;
  description: string;
  image?: string;
  featuredImage?: string;
}

function getGradeColor(grade: string): { bg: string; text: string; border: string } {
  const g = grade.toUpperCase().replace('+', '').replace('-', '');
  switch (g) {
    case 'A':
      return { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' };
    case 'B':
      return { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' };
    case 'C':
      return { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300' };
    case 'D':
      return { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300' };
    case 'F':
      return { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' };
    default:
      return { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300' };
  }
}

function getScoreColor(score: number): string {
  if (score >= 90) return 'text-green-600';
  if (score >= 80) return 'text-green-500';
  if (score >= 70) return 'text-blue-600';
  if (score >= 60) return 'text-yellow-600';
  if (score >= 50) return 'text-orange-500';
  return 'text-red-500';
}

function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatStatLabel(key: string): string {
  const labels: Record<string, string> = {
    passYards: 'Pass Yards',
    passTDs: 'Pass TDs',
    interceptions: 'INTs',
    epaPerDb: 'EPA/DB',
    netYPA: 'Net YPA',
    completionPct: 'Comp %',
    rushYards: 'Rush Yards',
    rushTDs: 'Rush TDs',
    yardsPerCarry: 'YPC',
    receptions: 'Receptions',
    recYards: 'Rec Yards',
    recTDs: 'Rec TDs',
    targets: 'Targets',
    yardsPerRec: 'YPR',
    catchPct: 'Catch %',
    tackles: 'Tackles',
    sacks: 'Sacks',
    tfl: 'TFL',
    qbHits: 'QB Hits',
    pressures: 'Pressures',
    passDefended: 'PD',
    forcedFumbles: 'FF',
    games: 'Games',
    fumbles: 'Fumbles',
    stuffs: 'Stuffs',
    snaps: 'Snaps',
    penalties: 'Penalties',
    runBlockGrade: 'Run Block',
    passBlockGrade: 'Pass Block',
    targetsAllowed: 'Tgt Allowed',
    completionsAllowed: 'Cmp Allowed',
    yardsAllowed: 'Yds Allowed',
  };
  return labels[key] || key;
}

export default function PlayerProfileClient({ playerSlug }: Props) {
  const [player, setPlayer] = useState<PlayerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const [articles, setArticles] = useState<Article[]>([]);
  const [visibleArticles, setVisibleArticles] = useState(3);
  const [selectedSeason, setSelectedSeason] = useState<number | 'career'>('career');
  const [selectedGameLogSeason, setSelectedGameLogSeason] = useState<number | null>(null);
  const [gameLogData, setGameLogData] = useState<PlayerProfile['gameLog'] | null>(null);
  const [gameLogLoading, setGameLogLoading] = useState(false);

  useEffect(() => {
    async function fetchPlayer() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(getApiPath(`api/nfl/player/${playerSlug}`));
        if (!response.ok) {
          if (response.status === 404) {
            setError('Player not found');
          } else {
            throw new Error('Failed to fetch player');
          }
          return;
        }

        const data = await response.json();
        setPlayer(data.player);
      } catch (err) {
        console.error('Error fetching player:', err);
        setError('Failed to load player data. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    fetchPlayer();
  }, [playerSlug]);

  // Initialize game log data from player and handle season changes
  useEffect(() => {
    if (player?.gameLog) {
      // Initialize with current season's game log from player data
      if (selectedGameLogSeason === null) {
        setGameLogData(player.gameLog);
        // Set the default selected season from the season string (e.g., "2024 Regular Season" -> 2024)
        const seasonMatch = player.gameLog.season.match(/^(\d{4})/);
        if (seasonMatch) {
          setSelectedGameLogSeason(parseInt(seasonMatch[1]));
        }
      }
    }
  }, [player, selectedGameLogSeason]);

  // Fetch game log for a different season
  useEffect(() => {
    async function fetchGameLog() {
      if (!player || selectedGameLogSeason === null) return;

      // Check if this is the current season (already loaded)
      const currentSeasonMatch = player.gameLog?.season.match(/^(\d{4})/);
      const currentSeason = currentSeasonMatch ? parseInt(currentSeasonMatch[1]) : null;

      if (selectedGameLogSeason === currentSeason) {
        setGameLogData(player.gameLog);
        return;
      }

      setGameLogLoading(true);
      try {
        const response = await fetch(getApiPath(`api/nfl/player/${playerSlug}?gameLogSeason=${selectedGameLogSeason}`));
        if (response.ok) {
          const data = await response.json();
          if (data.player?.gameLog) {
            setGameLogData(data.player.gameLog);
          }
        }
      } catch (err) {
        console.error('Error fetching game log:', err);
      } finally {
        setGameLogLoading(false);
      }
    }

    fetchGameLog();
  }, [selectedGameLogSeason, player, playerSlug]);

  // Fetch articles from RSS feed
  useEffect(() => {
    async function fetchArticles() {
      try {
        // Clean the slug for players like "a-j-brown" -> "aj-brown"
        const cleanedSlug = playerSlug.replace(/([a-z])-([a-z])-/g, '$1$2-');

        // Try cleaned slug first (e.g., "aj-brown")
        let rssUrl = `https://www.profootballnetwork.com/tag/${cleanedSlug}/feed/`;
        let response = await fetch(getApiPath(`api/proxy-rss?url=${encodeURIComponent(rssUrl)}`));
        let data = response.ok ? await response.json() : null;

        // If no articles found and slug was cleaned, try original slug
        if ((!data?.articles || data.articles.length === 0) && cleanedSlug !== playerSlug) {
          rssUrl = `https://www.profootballnetwork.com/tag/${playerSlug}/feed/`;
          response = await fetch(getApiPath(`api/proxy-rss?url=${encodeURIComponent(rssUrl)}`));
          data = response.ok ? await response.json() : null;
        }

        if (data?.articles && Array.isArray(data.articles)) {
          setArticles(data.articles);
        }
      } catch (err) {
        console.error('Error fetching articles:', err);
        // Silently fail - articles section just won't show
      }
    }

    if (playerSlug) {
      fetchArticles();
    }
  }, [playerSlug]);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  // Sidebar component for reuse
  const SidebarLayout = ({ children }: { children: React.ReactNode }) => (
    <div className="flex min-h-screen bg-gray-50">
      <div className="hidden lg:block">
        <div className="fixed top-0 left-0 w-64 h-screen z-10">
          <NFLTeamsSidebar />
        </div>
      </div>
      <div className="lg:hidden fixed top-0 left-0 right-0 z-20">
        <NFLTeamsSidebar isMobile={true} />
      </div>
      <main className="flex-1 lg:ml-64 min-w-0">
        {children}
      </main>
    </div>
  );

  // Loading state
  if (loading) {
    return (
      <SidebarLayout>
        <div className="bg-gray-400 text-white pt-[57px] lg:pt-0">
          <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col lg:flex-row items-center justify-between">
              <div className="flex items-center space-x-6 mb-6 lg:mb-0">
                <SkeletonLoader className="w-24 h-24 lg:w-32 lg:h-32 rounded-full" />
                <div>
                  <SkeletonLoader className="h-8 w-48 mb-2" />
                  <SkeletonLoader className="h-5 w-36 mb-2" />
                  <SkeletonLoader className="h-4 w-64" />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="container mx-auto px-4 py-6">
          <SkeletonLoader className="h-64 w-full rounded-lg" />
        </div>
      </SidebarLayout>
    );
  }

  // Error state
  if (error || !player) {
    return (
      <SidebarLayout>
        <div className="bg-gray-600 text-white pt-[57px] lg:pt-0">
          <div className="container mx-auto px-4 py-8">
            <Link href="/players" className="text-white/80 hover:text-white mb-4 inline-flex items-center gap-1">
              ← Back to Players
            </Link>
          </div>
        </div>
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center max-w-xl mx-auto">
            <h2 className="text-xl font-semibold text-red-700 mb-2">
              {error === 'Player not found' ? 'Player Not Found' : 'Error Loading Player'}
            </h2>
            <p className="text-red-600 mb-4">
              {error === 'Player not found'
                ? 'The player you are looking for does not exist or has been moved.'
                : error}
            </p>
            <Link
              href="/players"
              className="inline-block px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Browse All Players
            </Link>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  const gradeColors = player.pfsnImpact ? getGradeColor(player.pfsnImpact.grade) : null;

  // JSON-LD structured data for SEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: player.name,
    jobTitle: player.positionFull,
    affiliation: {
      '@type': 'SportsTeam',
      name: player.team.name,
      sport: 'American Football',
      memberOf: {
        '@type': 'SportsOrganization',
        name: 'National Football League',
      },
    },
    height: player.height,
    weight: `${player.weight} lbs`,
    birthDate: player.birthDate || undefined,
    birthPlace: player.birthPlace ? {
      '@type': 'Place',
      name: player.birthPlace,
    } : undefined,
    alumniOf: player.college ? {
      '@type': 'CollegeOrUniversity',
      name: player.college,
    } : undefined,
    image: player.headshotUrl,
    url: `https://www.profootballnetwork.com/nfl-hq/players/${player.slug}`,
  };

  return (
    <SidebarLayout>
      {/* JSON-LD Structured Data */}
      <Script
        id="player-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero Section with Blue Background */}
      <div style={{ backgroundColor: '#0050A0' }} className="text-white pt-[57px] lg:pt-5 lg:pb-4">
        <div className="container mx-auto px-4 py-4 lg:py-5">
          <div className="flex flex-col lg:flex-row items-center justify-between">
            {/* Player Info */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-8 mb-4 lg:mb-0">
              {/* Headshot */}
              <div className="w-28 h-28 lg:w-32 lg:h-32 rounded-full flex items-center justify-center shadow-lg overflow-hidden flex-shrink-0 bg-white mt-4">
                {!imageError ? (
                  <Image
                    src={player.headshotUrl}
                    alt={player.name}
                    width={160}
                    height={160}
                    className="w-full h-full object-cover object-[center_15%] scale-[1.4]"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div
                    className="w-full h-full rounded-full flex items-center justify-center text-3xl lg:text-4xl font-bold"
                    style={{ backgroundColor: player.team.secondaryColor || '#e5e7eb', color: player.team.primaryColor }}
                  >
                    {getInitials(player.name)}
                  </div>
                )}
              </div>

              {/* Name and Details */}
              <div className="text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-3 mb-2">
                  <h1 className="text-3xl lg:text-5xl font-bold">{player.name}</h1>
                  <span className="text-2xl lg:text-4xl opacity-70">#{player.jerseyNumber}</span>
                </div>

                <div className="flex items-center justify-center sm:justify-start gap-3 text-lg lg:text-xl">
                  <Link href={`/teams/${player.team.id}`} className="flex items-center gap-2 hover:opacity-80">
                    <Image
                      src={player.team.logo}
                      alt={player.team.name}
                      width={28}
                      height={28}
                      className="w-7 h-7"
                    />
                    <span className="font-medium">{player.team.name}</span>
                  </Link>
                  <span className="opacity-60">|</span>
                  <span className="opacity-90">{player.positionFull}</span>
                </div>

                {/* Status Badge */}
                {player.status !== 'Active' && (
                  <span className="inline-block mt-3 px-4 py-1.5 rounded-full text-sm font-medium bg-white/20 text-white">
                    {player.status}
                  </span>
                )}
              </div>
            </div>

            {/* PFSN Impact Card */}
            <div className="bg-white text-gray-800 rounded-lg p-4 lg:p-5 w-full sm:w-auto min-w-[200px] shadow-lg">
              <h3 className="text-sm font-semibold mb-3 text-center text-gray-600">PFSN IMPACT GRADE</h3>
              {player.pfsnImpact ? (
                <div className="text-center">
                  <div className="flex items-center justify-center gap-4">
                    <div
                      className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold ${gradeColors?.bg} ${gradeColors?.text} border-2 ${gradeColors?.border}`}
                    >
                      {player.pfsnImpact.grade}
                    </div>
                    <div className="text-left">
                      <div className={`text-3xl font-bold ${getScoreColor(player.pfsnImpact.score)}`}>
                        {player.pfsnImpact.score}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-center mt-3 pt-3 border-t border-gray-100 text-sm">
                    <div>
                      <span className="text-gray-500">Season Rank</span>
                      <span className="font-bold text-gray-900 ml-1">#{player.pfsnImpact.seasonRank}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-2">
                  <div className="w-14 h-14 mx-auto rounded-full bg-gray-100 flex items-center justify-center text-2xl font-bold text-gray-400 mb-2">
                    —
                  </div>
                  <p className="text-gray-500 text-xs">Not available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Raptive Header Ad */}
      <div className="container mx-auto px-4 min-h-[150px]">
        <div className="raptive-pfn-header"></div>
      </div>

      {/* Content Area */}
      <div className="container mx-auto px-4 py-6">
        {/* Bio Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Player Information
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <dt className="text-xs text-gray-500 uppercase tracking-wide">Age</dt>
              <dd className="font-medium text-gray-900">{player.age || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500 uppercase tracking-wide">Height</dt>
              <dd className="font-medium text-gray-900">{player.height || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500 uppercase tracking-wide">Weight</dt>
              <dd className="font-medium text-gray-900">{player.weight ? `${player.weight} lbs` : '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500 uppercase tracking-wide">Experience</dt>
              <dd className="font-medium text-gray-900">{player.experienceLabel || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500 uppercase tracking-wide">College</dt>
              <dd className="font-medium text-gray-900">{player.college || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500 uppercase tracking-wide">Birthplace</dt>
              <dd className="font-medium text-gray-900">{player.birthPlace || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500 uppercase tracking-wide">Birth Date</dt>
              <dd className="font-medium text-gray-900">
                {player.birthDate
                  ? new Date(player.birthDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : '—'}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500 uppercase tracking-wide">Draft</dt>
              <dd className="font-medium text-gray-900">
                {player.draft || 'Undrafted'}
              </dd>
            </div>
          </div>
        </div>

        {/* Season Stats Section - ESPN Stats */}
        {player.seasonStats && player.seasonStats.stats.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {player.seasonStats.season}
            </h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
              {player.seasonStats.stats.map((stat) => (
                <div key={stat.name} className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-gray-900">{stat.displayValue}</div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide">{stat.shortLabel || stat.abbreviation}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Game Log Section - ESPN Stats */}
        {player.gameLog && player.gameLog.availableSeasons.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Game Log
              </h2>
              <select
                value={selectedGameLogSeason || ''}
                onChange={(e) => setSelectedGameLogSeason(parseInt(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {player.gameLog.availableSeasons.map((year) => (
                  <option key={year} value={year}>{year} Season</option>
                ))}
              </select>
            </div>
            {gameLogLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : gameLogData && gameLogData.games.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="text-left py-3 px-2 font-semibold text-gray-600 bg-gray-50 whitespace-nowrap">WK</th>
                      <th className="text-left py-3 px-2 font-semibold text-gray-600 bg-gray-50 whitespace-nowrap">OPP</th>
                      <th className="text-center py-3 px-2 font-semibold text-gray-600 bg-gray-50 whitespace-nowrap">RESULT</th>
                      {gameLogData.statLabels.slice(0, 8).map((label) => (
                        <th key={label.name} className="text-center py-3 px-2 font-semibold text-gray-600 bg-gray-50 whitespace-nowrap">
                          {label.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {gameLogData.games.map((game, index) => (
                      <tr
                        key={game.week}
                        className={`border-b border-gray-100 hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                      >
                        <td className="py-3 px-2 font-medium text-gray-900 whitespace-nowrap">{game.week}</td>
                        <td className="py-3 px-2 text-gray-700 whitespace-nowrap">
                          <span className="text-gray-500">{game.homeAway}</span> {game.opponent}
                        </td>
                        <td className="py-3 px-2 text-center whitespace-nowrap">
                          <span className={`font-medium ${game.result.startsWith('W') ? 'text-green-600' : game.result.startsWith('L') ? 'text-red-600' : 'text-gray-600'}`}>
                            {game.result}
                          </span>
                        </td>
                        {gameLogData.statLabels.slice(0, 8).map((label) => (
                          <td key={label.name} className="py-3 px-2 text-center text-gray-700 whitespace-nowrap">
                            {game.stats[label.name] || '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No game log data available for this season.</p>
            )}
          </div>
        )}

        {/* Career Stats Section */}
        {player.careerStats && player.careerStats.categories.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {selectedSeason === 'career' ? 'Career Stats' : `${selectedSeason} Season Stats`}
              </h2>
              <select
                value={selectedSeason}
                onChange={(e) => setSelectedSeason(e.target.value === 'career' ? 'career' : parseInt(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="career">Career Totals</option>
                {player.careerStats.availableSeasons.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            {player.careerStats.categories.map((category) => {
              // Get the stats to display based on selection
              const statsToShow = selectedSeason === 'career'
                ? category.totals
                : category.seasons.find(s => s.year === selectedSeason)?.stats;

              if (!statsToShow) return null;

              // Filter out stats that are just "-" or empty
              const hasData = Object.values(statsToShow).some(v => v !== '-' && v !== '' && v !== '0');
              if (!hasData) return null;

              return (
                <div key={category.name} className="mb-6 last:mb-0">
                  <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">
                    {category.displayName}
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b-2 border-gray-200">
                          {category.labels.map((label, index) => (
                            <th key={index} className="text-center py-2 px-3 font-semibold text-gray-600 bg-gray-50 whitespace-nowrap">
                              {label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-gray-100">
                          {category.names.map((name, index) => (
                            <td key={index} className="py-3 px-3 text-center text-gray-900 font-medium whitespace-nowrap">
                              {statsToShow[name] || '-'}
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Latest Articles Section */}
        {articles.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900">Latest {player.name.split(' ').pop()} Articles</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.slice(0, visibleArticles).map((article, index) => (
                <a
                  key={index}
                  href={article.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                >
                  {(article.featuredImage || article.image) && (
                    <div className="w-full aspect-video overflow-hidden bg-gray-200">
                      <img
                        src={article.featuredImage || article.image}
                        alt={article.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="text-lg font-semibold mb-2 line-clamp-2 text-[#0050A0]">
                      {article.title}
                    </h3>
                    <p className="text-base text-gray-600 mb-4 line-clamp-3">
                      {article.description}
                    </p>
                    <div className="flex items-center justify-between text-base">
                      <span className="text-gray-600">
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
            {visibleArticles < articles.length && (
              <div className="mt-8 text-center">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setVisibleArticles(prev => Math.min(prev + 3, articles.length));
                  }}
                  className="text-white px-8 py-4 rounded-lg font-medium transition-colors hover:opacity-90 text-base min-h-[48px] bg-[#0050A0]"
                >
                  Show More Articles
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
