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
  draft: {
    year: number;
    round: number;
    pick: number;
  } | null;
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
  const [showAllArticles, setShowAllArticles] = useState(false);

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

  // Fetch articles from RSS feed
  useEffect(() => {
    async function fetchArticles() {
      try {
        // Use the player slug for the RSS feed URL
        const rssUrl = `https://www.profootballnetwork.com/tag/${playerSlug}/feed/`;
        const response = await fetch(`/api/proxy-rss?url=${encodeURIComponent(rssUrl)}`);

        if (!response.ok) return;

        const data = await response.json();
        if (data.articles && Array.isArray(data.articles)) {
          setArticles(data.articles.slice(0, 6)); // Max 6 articles
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

      {/* Hero Section with Team Color */}
      <div style={{ backgroundColor: player.team.primaryColor }} className="text-white pt-[57px] lg:pt-0">
        <div className="container mx-auto px-4 py-8 lg:py-10">
          <div className="flex flex-col lg:flex-row items-center justify-between">
            {/* Player Info */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-8 mb-6 lg:mb-0">
              {/* Headshot */}
              <div className="w-32 h-32 lg:w-40 lg:h-40 bg-white rounded-full flex items-center justify-center shadow-lg p-1.5 flex-shrink-0">
                {!imageError ? (
                  <Image
                    src={player.headshotUrl}
                    alt={player.name}
                    width={160}
                    height={160}
                    className="w-full h-full rounded-full object-cover"
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
            <div className="bg-white text-gray-800 rounded-lg p-4 lg:p-6 w-full sm:w-auto min-w-[200px] shadow-lg">
              <h3 className="text-sm font-semibold mb-3 text-center text-gray-600">PFSN IMPACT GRADE</h3>
              {player.pfsnImpact ? (
                <div className="text-center">
                  <div className="flex items-center justify-center gap-4">
                    <div
                      className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold ${gradeColors?.bg} ${gradeColors?.text} border-2 ${gradeColors?.border}`}
                    >
                      {player.pfsnImpact.grade}
                    </div>
                    <div className="text-left">
                      <div className={`text-3xl font-bold ${getScoreColor(player.pfsnImpact.score)}`}>
                        {player.pfsnImpact.score}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-center mt-3 pt-3 border-t border-gray-100 text-xs">
                    <div>
                      <span className="text-gray-500">Season Rank</span>
                      <span className="font-semibold text-gray-900 ml-1">#{player.pfsnImpact.seasonRank}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-2">
                  <div className="w-16 h-16 mx-auto rounded-full bg-gray-100 flex items-center justify-center text-2xl font-bold text-gray-400 mb-2">
                    —
                  </div>
                  <p className="text-gray-500 text-xs">Not available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="container mx-auto px-4 py-6">
        {/* Bio Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
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
                {player.draft
                  ? `${player.draft.year} Rd ${player.draft.round}, Pick ${player.draft.pick}`
                  : 'Undrafted'}
              </dd>
            </div>
          </div>
        </div>

        {/* Season Stats Section */}
        {player.pfsnImpact && Object.keys(player.pfsnImpact.stats).length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              {player.pfsnImpact.season} Season Stats
            </h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
              {Object.entries(player.pfsnImpact.stats).map(([key, value]) => (
                <div key={key} className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-gray-900">{value}</div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide">{formatStatLabel(key)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Game Log Section */}
        {player.pfsnImpact && player.pfsnImpact.weeklyData.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {player.pfsnImpact.season} Game Log
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-3 px-3 font-semibold text-gray-600 bg-gray-50">Week</th>
                    <th className="text-left py-3 px-3 font-semibold text-gray-600 bg-gray-50">Opponent</th>
                    <th className="text-center py-3 px-3 font-semibold text-gray-600 bg-gray-50">Score</th>
                    <th className="text-center py-3 px-3 font-semibold text-gray-600 bg-gray-50">Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {player.pfsnImpact.weeklyData.map((week, index) => {
                    const weekGradeColors = getGradeColor(week.grade);
                    return (
                      <tr
                        key={week.week}
                        className={`border-b border-gray-100 hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                      >
                        <td className="py-3 px-3 font-medium text-gray-900">Week {week.week}</td>
                        <td className="py-3 px-3 text-gray-700">{week.opponent || '—'}</td>
                        <td className={`py-3 px-3 text-center font-bold ${getScoreColor(week.score)}`}>
                          {week.score}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${weekGradeColors.bg} ${weekGradeColors.text}`}>
                            {week.grade}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* No Data Message */}
        {!player.pfsnImpact && (
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-8 text-center mb-6">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-700 mb-1">No Stats Available</h3>
            <p className="text-gray-500 text-sm">
              PFSN Impact data and game logs are not available for this player.
            </p>
          </div>
        )}

        {/* Latest Articles Section */}
        {articles.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 mt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
              Latest Articles
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {articles.slice(0, showAllArticles ? 6 : 3).map((article, index) => (
                <a
                  key={index}
                  href={article.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block bg-gray-50 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                >
                  {article.image && (
                    <div className="aspect-video bg-gray-200 overflow-hidden">
                      <img
                        src={article.image}
                        alt={article.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                  )}
                  <div className="p-3">
                    <h3 className="font-medium text-gray-900 text-sm line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {article.title}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(article.pubDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </a>
              ))}
            </div>
            {articles.length > 3 && !showAllArticles && (
              <div className="mt-4 text-center">
                <button
                  onClick={() => setShowAllArticles(true)}
                  className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  More Articles →
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
