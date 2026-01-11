'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
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

function getGradeColor(grade: string): { bg: string; text: string; border: string } {
  const g = grade.toUpperCase().replace('+', '').replace('-', '');
  switch (g) {
    case 'A':
      return { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' };
    case 'B':
      return { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' };
    case 'C':
      return { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200' };
    case 'D':
      return { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' };
    case 'F':
      return { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' };
    default:
      return { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' };
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
    epaPerDb: 'EPA/Dropback',
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
  };
  return labels[key] || key;
}

export default function PlayerProfileClient({ playerSlug }: Props) {
  const [player, setPlayer] = useState<PlayerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

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

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  // Loading state
  if (loading) {
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
        <main className="flex-1 lg:ml-64 min-w-0 pt-[57px] lg:pt-0">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <SkeletonLoader className="h-8 w-48 mb-6" />
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex flex-col md:flex-row gap-6">
                <SkeletonLoader className="w-32 h-32 rounded-full mx-auto md:mx-0" />
                <div className="flex-1">
                  <SkeletonLoader className="h-8 w-64 mb-2" />
                  <SkeletonLoader className="h-5 w-48 mb-4" />
                  <div className="grid grid-cols-2 gap-4">
                    <SkeletonLoader className="h-4 w-32" />
                    <SkeletonLoader className="h-4 w-32" />
                    <SkeletonLoader className="h-4 w-32" />
                    <SkeletonLoader className="h-4 w-32" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Error state
  if (error || !player) {
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
        <main className="flex-1 lg:ml-64 min-w-0 pt-[57px] lg:pt-0">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Link href="/players" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
              &larr; Back to Players
            </Link>
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <h2 className="text-xl font-semibold text-red-700 mb-2">
                {error === 'Player not found' ? 'Player Not Found' : 'Error Loading Player'}
              </h2>
              <p className="text-red-600">
                {error === 'Player not found'
                  ? 'The player you are looking for does not exist or has been moved.'
                  : error}
              </p>
              <Link
                href="/players"
                className="mt-4 inline-block px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Browse All Players
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const gradeColors = player.pfsnImpact ? getGradeColor(player.pfsnImpact.grade) : null;

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

      <main className="flex-1 lg:ml-64 min-w-0 pt-[57px] lg:pt-0">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Back Link */}
          <Link href="/players" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
            &larr; Back to Players
          </Link>

          {/* Hero Section */}
          <div
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6"
            style={{ borderTopColor: player.team.primaryColor, borderTopWidth: '4px' }}
          >
            <div className="flex flex-col md:flex-row gap-6">
              {/* Headshot */}
              <div className="flex-shrink-0 flex justify-center md:justify-start">
                {!imageError ? (
                  <Image
                    src={player.headshotUrl}
                    alt={player.name}
                    width={128}
                    height={128}
                    className="w-32 h-32 rounded-full object-cover bg-gray-100 border-4 border-white shadow-lg"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div
                    className="w-32 h-32 rounded-full flex items-center justify-center text-white font-bold text-3xl border-4 border-white shadow-lg"
                    style={{ backgroundColor: player.team.primaryColor }}
                  >
                    {getInitials(player.name)}
                  </div>
                )}
              </div>

              {/* Player Info */}
              <div className="flex-1 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{player.name}</h1>
                  <span className="text-2xl text-gray-400">#{player.jerseyNumber}</span>
                </div>

                <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
                  <Link
                    href={`/teams/${player.team.id}`}
                    className="flex items-center gap-2 hover:opacity-80"
                  >
                    <Image
                      src={player.team.logo}
                      alt={player.team.name}
                      width={24}
                      height={24}
                      className="w-6 h-6"
                    />
                    <span className="font-medium text-gray-700">{player.team.name}</span>
                  </Link>
                  <span className="text-gray-300">|</span>
                  <span className="text-gray-600">{player.positionFull}</span>
                </div>

                {/* Status Badge */}
                {player.status !== 'Active' && (
                  <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800 mb-4">
                    {player.status}
                  </span>
                )}

                {/* Quick Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500 block">Age</span>
                    <span className="font-semibold text-gray-900">{player.age}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Height</span>
                    <span className="font-semibold text-gray-900">{player.height}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Weight</span>
                    <span className="font-semibold text-gray-900">{player.weight} lbs</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Experience</span>
                    <span className="font-semibold text-gray-900">{player.experienceLabel}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Bio Card */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Player Information</h2>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm text-gray-500">College</dt>
                    <dd className="font-medium text-gray-900">{player.college || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500">Birthplace</dt>
                    <dd className="font-medium text-gray-900">{player.birthPlace || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500">Birth Date</dt>
                    <dd className="font-medium text-gray-900">
                      {player.birthDate
                        ? new Date(player.birthDate).toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500">Draft</dt>
                    <dd className="font-medium text-gray-900">
                      {player.draft
                        ? `${player.draft.year} Round ${player.draft.round}, Pick ${player.draft.pick}`
                        : 'Undrafted'}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* PFSN Impact Card */}
            <div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">PFSN Impact Grade</h2>
                {player.pfsnImpact ? (
                  <div className="text-center">
                    {/* Grade Badge */}
                    <div
                      className={`inline-flex items-center justify-center w-20 h-20 rounded-full text-3xl font-bold ${gradeColors?.bg} ${gradeColors?.text} border-4 ${gradeColors?.border} mb-3`}
                    >
                      {player.pfsnImpact.grade}
                    </div>

                    {/* Score */}
                    <div className="mb-4">
                      <span className="text-gray-500 text-sm">Impact Score</span>
                      <div className={`text-3xl font-bold ${getScoreColor(player.pfsnImpact.score)}`}>
                        {player.pfsnImpact.score}
                      </div>
                    </div>

                    {/* Rankings */}
                    <div className="grid grid-cols-2 gap-4 text-sm border-t border-gray-100 pt-4">
                      <div>
                        <span className="text-gray-500 block">Season Rank</span>
                        <span className="font-semibold text-gray-900">#{player.pfsnImpact.seasonRank}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block">All-Time Rank</span>
                        <span className="font-semibold text-gray-900">#{player.pfsnImpact.overallRank}</span>
                      </div>
                    </div>

                    <div className="mt-3 text-xs text-gray-400">
                      {player.pfsnImpact.season} Season
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 text-gray-400 text-3xl font-bold mb-3">
                      —
                    </div>
                    <p className="text-gray-500 text-sm">
                      Impact grade not available for this player
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Weekly Performance */}
          {player.pfsnImpact && player.pfsnImpact.weeklyData.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Weekly Performance</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 px-3 font-medium text-gray-600">Week</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-600">Opponent</th>
                      <th className="text-center py-2 px-3 font-medium text-gray-600">Score</th>
                      <th className="text-center py-2 px-3 font-medium text-gray-600">Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {player.pfsnImpact.weeklyData.map((week) => {
                      const weekGradeColors = getGradeColor(week.grade);
                      return (
                        <tr key={week.week} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-2 px-3 font-medium">Week {week.week}</td>
                          <td className="py-2 px-3 text-gray-600">{week.opponent || '—'}</td>
                          <td className={`py-2 px-3 text-center font-semibold ${getScoreColor(week.score)}`}>
                            {week.score}
                          </td>
                          <td className="py-2 px-3 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${weekGradeColors.bg} ${weekGradeColors.text}`}>
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

          {/* Season Stats */}
          {player.pfsnImpact && Object.keys(player.pfsnImpact.stats).length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Season Stats</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {Object.entries(player.pfsnImpact.stats).map(([key, value]) => (
                  <div key={key} className="bg-gray-50 rounded-lg p-3 text-center">
                    <span className="text-gray-500 text-xs block mb-1">{formatStatLabel(key)}</span>
                    <span className="font-semibold text-gray-900">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
