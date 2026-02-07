'use client';

import { useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { getApiPath } from '@/utils/api';

// SWR fetcher function
const fetcher = (url: string) => fetch(url).then(res => res.json());

type ViewMode = 'team' | 'player';
type PlayerStatCategory = 'passing' | 'rushing' | 'receiving' | 'defense';

interface TeamStat {
  name: string;
  own: number | string;
  opponent: number | string;
  net: number | string;
}

interface PlayerStat {
  name: string;
  slug: string;
  games_played?: number;
  // Passing
  yards?: number;
  touchdowns?: number;
  interceptions?: number | { interceptions?: number };
  completions?: number;
  attempts?: number;
  qb_rating?: string;
  // Rushing
  yards_per_rush_attempt?: number;
  // Receiving
  receptions?: number;
  targets?: number;
  // Defense
  tackles?: {
    total_tackles?: number;
    solo_tackles?: number;
    tackle_assists?: number;
  };
  sacks?: {
    sacks?: number;
  };
  fumbles?: {
    forced_fumbles?: number;
  };
}

interface TeamStats {
  offense: TeamStat[];
  passing: TeamStat[];
  rushing: TeamStat[];
  defense: TeamStat[];
  scoring: TeamStat[];
  fieldGoals: TeamStat[];
  miscellaneous: TeamStat[];
  fumbles: TeamStat[];
  kicking: TeamStat[];
  interceptions: TeamStat[];
  firstDowns: TeamStat[];
  touchdowns: TeamStat[];
}

interface PlayerStats {
  passing: PlayerStat[];
  rushing: PlayerStat[];
  receiving: PlayerStat[];
  defense: PlayerStat[];
}

interface TeamStatsData {
  teamStats: TeamStats;
  playerStats: PlayerStats;
}

export default function StatsComparisonTab() {
  const [viewMode, setViewMode] = useState<ViewMode>('team');
  const [playerCategory, setPlayerCategory] = useState<PlayerStatCategory>('passing');

  // Use SWR for efficient caching - data is shared across components
  const { data: patriotsRaw, error: patriotsError } = useSWR(
    getApiPath('nfl/teams/api/stats/new-england-patriots'),
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 300000 } // 5 minute deduping
  );

  const { data: seahawksRaw, error: seahawksError } = useSWR(
    getApiPath('nfl/teams/api/stats/seattle-seahawks'),
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 300000 }
  );

  // Transform data to expected format (check for API error responses)
  const patriotsData: TeamStatsData | null = (patriotsRaw && !patriotsRaw.error) ? {
    teamStats: patriotsRaw.teamStats,
    playerStats: patriotsRaw.playerStats,
  } : null;

  const seahawksData: TeamStatsData | null = (seahawksRaw && !seahawksRaw.error) ? {
    teamStats: seahawksRaw.teamStats,
    playerStats: seahawksRaw.playerStats,
  } : null;

  const loading = !patriotsRaw || !seahawksRaw;
  const apiError = patriotsRaw?.error || seahawksRaw?.error;
  const error = (patriotsError || seahawksError) ? 'Failed to load stats' : apiError ? `API Error: ${apiError}` : null;

  // Helper to get stat value from team stats array
  const getTeamStat = (stats: TeamStat[], statName: string, key: 'own' | 'opponent' | 'net' = 'own'): number => {
    const stat = stats.find(s => s.name.toLowerCase().includes(statName.toLowerCase()));
    if (!stat) return 0;
    const value = stat[key];
    return typeof value === 'number' ? value : parseFloat(value) || 0;
  };

  const renderStatBar = (label: string, patriotsValue: number, seahawksValue: number, higherIsBetter: boolean = true, format: 'number' | 'percent' | 'decimal' = 'number') => {
    const total = Math.abs(patriotsValue) + Math.abs(seahawksValue);
    const patriotsPct = total > 0 ? (Math.abs(patriotsValue) / total) * 100 : 50;
    const seahawksPct = total > 0 ? (Math.abs(seahawksValue) / total) * 100 : 50;

    const patriotsWins = higherIsBetter ? patriotsValue > seahawksValue : patriotsValue < seahawksValue;
    const seahawksWins = higherIsBetter ? seahawksValue > patriotsValue : seahawksValue < patriotsValue;

    const formatValue = (val: number) => {
      if (format === 'percent') return `${val.toFixed(1)}%`;
      if (format === 'decimal') return val.toFixed(1);
      return val.toLocaleString();
    };

    return (
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <span className={`text-sm font-semibold ${patriotsWins ? 'text-[#002244]' : 'text-gray-600'}`}>
            {formatValue(patriotsValue)}
          </span>
          <span className="text-sm font-medium text-gray-700">{label}</span>
          <span className={`text-sm font-semibold ${seahawksWins ? 'text-[#69BE28]' : 'text-gray-600'}`}>
            {formatValue(seahawksValue)}
          </span>
        </div>
        <div className="flex h-3 rounded-full overflow-hidden bg-gray-200">
          <div
            className={`transition-all duration-500 ${patriotsWins ? 'bg-[#002244]' : 'bg-[#002244]/50'}`}
            style={{ width: `${patriotsPct}%` }}
          />
          <div
            className={`transition-all duration-500 ${seahawksWins ? 'bg-[#69BE28]' : 'bg-[#69BE28]/50'}`}
            style={{ width: `${seahawksPct}%` }}
          />
        </div>
      </div>
    );
  };

  // Calculate points scored: TDs*6 + Extra Points + FGs*3 + 2PTs*2 + Safeties*2
  const calculatePointsScored = (stats: TeamStats): number => {
    const touchdowns = getTeamStat(stats.touchdowns || [], 'total');
    const extraPoints = getTeamStat(stats.kicking || [], 'extra points made');
    const fieldGoals = getTeamStat(stats.fieldGoals || [], 'field goals made');
    const twoPointConversions = getTeamStat(stats.scoring || [], '2pt conversions made');
    const safeties = getTeamStat(stats.scoring || [], 'safeties');
    return (touchdowns * 6) + extraPoints + (fieldGoals * 3) + (twoPointConversions * 2) + (safeties * 2);
  };

  const calculatePointsAllowed = (stats: TeamStats): number => {
    const touchdowns = getTeamStat(stats.touchdowns || [], 'total', 'opponent');
    const extraPoints = getTeamStat(stats.kicking || [], 'extra points made', 'opponent');
    const fieldGoals = getTeamStat(stats.fieldGoals || [], 'field goals made', 'opponent');
    const twoPointConversions = getTeamStat(stats.scoring || [], '2pt conversions made', 'opponent');
    const safeties = getTeamStat(stats.scoring || [], 'safeties', 'opponent');
    return (touchdowns * 6) + extraPoints + (fieldGoals * 3) + (twoPointConversions * 2) + (safeties * 2);
  };

  const renderTeamStats = () => {
    // Check if we have valid team stats data (not just empty objects)
    const hasPatriotsStats = patriotsData?.teamStats &&
      (patriotsData.teamStats.offense?.length > 0 || patriotsData.teamStats.passing?.length > 0);
    const hasSeahawksStats = seahawksData?.teamStats &&
      (seahawksData.teamStats.offense?.length > 0 || seahawksData.teamStats.passing?.length > 0);

    if (!hasPatriotsStats || !hasSeahawksStats) {
      return (
        <div className="text-center py-8 text-gray-600">
          <p>No team stats available</p>
          <p className="text-xs mt-2 text-gray-500">
            {!hasPatriotsStats && 'Patriots stats missing. '}
            {!hasSeahawksStats && 'Seahawks stats missing.'}
          </p>
        </div>
      );
    }

    const patStats = patriotsData.teamStats;
    const seaStats = seahawksData.teamStats;

    // Calculate points
    const patPointsScored = calculatePointsScored(patStats);
    const seaPointsScored = calculatePointsScored(seaStats);
    const patPointsAllowed = calculatePointsAllowed(patStats);
    const seaPointsAllowed = calculatePointsAllowed(seaStats);

    // Get specific stats
    const patTotalYards = getTeamStat(patStats.offense, 'net yards');
    const seaTotalYards = getTeamStat(seaStats.offense, 'net yards');
    const patYardsAllowed = getTeamStat(patStats.offense, 'net yards', 'opponent');
    const seaYardsAllowed = getTeamStat(seaStats.offense, 'net yards', 'opponent');
    const patFirstDowns = getTeamStat(patStats.firstDowns || patStats.scoring, 'total');
    const seaFirstDowns = getTeamStat(seaStats.firstDowns || seaStats.scoring, 'total');

    // Turnovers - turnovers forced: own = giveaways (turnovers team committed), opponent = takeaways (turnovers team forced)
    const patTakeaways = getTeamStat(patStats.miscellaneous, 'turnovers forced', 'opponent');
    const seaTakeaways = getTeamStat(seaStats.miscellaneous, 'turnovers forced', 'opponent');
    const patGiveaways = getTeamStat(patStats.miscellaneous, 'turnovers forced');
    const seaGiveaways = getTeamStat(seaStats.miscellaneous, 'turnovers forced');

    // Defensive interceptions (from returning stats)
    const patInterceptions = getTeamStat(patStats.interceptions || [], 'interceptions');
    const seaInterceptions = getTeamStat(seaStats.interceptions || [], 'interceptions');

    // Fumbles recovered from opponent (takeaways - not own fumbles recovered)
    const patFumblesRecovered = getTeamStat(patStats.fumbles || [], 'opp: recovered');
    const seaFumblesRecovered = getTeamStat(seaStats.fumbles || [], 'opp: recovered');

    return (
      <div className="space-y-6">
        {/* Scoring */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="font-bold text-gray-800 mb-4">Scoring</h3>
          {renderStatBar('Points Scored', patPointsScored, seaPointsScored)}
          {renderStatBar('Points Allowed', patPointsAllowed, seaPointsAllowed, false)}
          {renderStatBar('Point Differential', patPointsScored - patPointsAllowed, seaPointsScored - seaPointsAllowed)}
        </div>

        {/* Offense */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="font-bold text-gray-800 mb-4">Offense</h3>
          {renderStatBar('Total Yards', patTotalYards, seaTotalYards)}
          {renderStatBar('Passing Yards', getTeamStat(patStats.passing, 'yards'), getTeamStat(seaStats.passing, 'yards'))}
          {renderStatBar('Rushing Yards', getTeamStat(patStats.rushing, 'yards'), getTeamStat(seaStats.rushing, 'yards'))}
          {renderStatBar('First Downs', patFirstDowns, seaFirstDowns)}
          {renderStatBar('Yards Per Play', getTeamStat(patStats.offense, 'net yards per play'), getTeamStat(seaStats.offense, 'net yards per play'), true, 'decimal')}
        </div>

        {/* Defense */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="font-bold text-gray-800 mb-4">Defense</h3>
          {renderStatBar('Yards Allowed', patYardsAllowed, seaYardsAllowed, false)}
          {renderStatBar('Passing Yards Allowed', getTeamStat(patStats.passing, 'yards', 'opponent'), getTeamStat(seaStats.passing, 'yards', 'opponent'), false)}
          {renderStatBar('Rushing Yards Allowed', getTeamStat(patStats.rushing, 'yards', 'opponent'), getTeamStat(seaStats.rushing, 'yards', 'opponent'), false)}
          {renderStatBar('Sacks', getTeamStat(patStats.passing, 'sacked', 'opponent'), getTeamStat(seaStats.passing, 'sacked', 'opponent'))}
        </div>

        {/* Turnovers */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="font-bold text-gray-800 mb-4">Turnovers</h3>
          {renderStatBar('Takeaways', patTakeaways, seaTakeaways)}
          {renderStatBar('Interceptions', patInterceptions, seaInterceptions)}
          {renderStatBar('Fumbles Recovered', patFumblesRecovered, seaFumblesRecovered)}
          {renderStatBar('Giveaways', patGiveaways, seaGiveaways, false)}
          {renderStatBar('Turnover Differential', patTakeaways - patGiveaways, seaTakeaways - seaGiveaways)}
        </div>
      </div>
    );
  };

  const categoryLabels: Record<PlayerStatCategory, string> = {
    passing: 'Passing',
    rushing: 'Rushing',
    receiving: 'Receiving',
    defense: 'Defense',
  };

  const renderPlayerStats = () => {
    const patriotsPlayers = patriotsData?.playerStats?.[playerCategory] || [];
    const seahawksPlayers = seahawksData?.playerStats?.[playerCategory] || [];

    const getStatValue = (player: PlayerStat, category: PlayerStatCategory): string => {
      switch (category) {
        case 'passing':
          return `${player.completions || 0}/${player.attempts || 0}, ${player.touchdowns || 0} TD, ${player.interceptions || 0} INT, ${player.qb_rating || 0} RTG`;
        case 'rushing':
          return `${player.attempts || 0} ATT, ${player.touchdowns || 0} TD, ${player.yards_per_rush_attempt || 0} YPC`;
        case 'receiving':
          return `${player.receptions || 0} REC, ${player.targets || 0} TGT, ${player.touchdowns || 0} TD`;
        case 'defense':
          const defInt = typeof player.interceptions === 'object' ? player.interceptions?.interceptions : 0;
          return `${player.tackles?.solo_tackles || 0} SOLO, ${player.tackles?.tackle_assists || 0} AST, ${player.sacks?.sacks || 0} SCK, ${defInt || 0} INT`;
        default:
          return '-';
      }
    };

    const getMainStat = (player: PlayerStat, category: PlayerStatCategory): number => {
      switch (category) {
        case 'passing':
        case 'rushing':
        case 'receiving':
          return player.yards || 0;
        case 'defense':
          return player.tackles?.total_tackles || 0;
        default:
          return 0;
      }
    };

    const renderPlayerCard = (player: PlayerStat, teamColor: string, idx: number) => (
      <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
        <img
          src={`https://staticd.profootballnetwork.com/skm/assets/player-images/nfl/${player.slug}.png?w=64`}
          alt={player.name}
          className="w-10 h-10 rounded-full object-cover flex-shrink-0"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const fallback = target.nextElementSibling as HTMLElement;
            if (fallback) fallback.style.display = 'flex';
          }}
        />
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
          style={{
            backgroundColor: `${teamColor}20`,
            display: 'none'
          }}
        >
          <span className="font-semibold text-xs" style={{ color: teamColor }}>
            {player.name.split(' ').map(n => n[0]).join('')}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <Link
            href={`/players/${player.slug}`}
            className="font-semibold hover:underline cursor-pointer block truncate"
            style={{ color: teamColor }}
          >
            {player.name}
          </Link>
          <div className="text-sm text-gray-600">{getStatValue(player, playerCategory)}</div>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold" style={{ color: teamColor }}>
            {getMainStat(player, playerCategory).toLocaleString()}
          </div>
          <div className="text-xs text-gray-600">
            {playerCategory === 'defense' ? 'TCK' : 'YDS'}
          </div>
        </div>
      </div>
    );

    return (
      <div className="space-y-6">
        {/* Player Comparison */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Patriots Players */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="bg-[#002244] text-white px-4 py-3">
              <div className="flex items-center gap-2">
                <img src="/nfl-hq/new-england-patriots.png" alt="Patriots" className="w-8 h-8" />
                <span className="font-bold">Patriots {categoryLabels[playerCategory]}</span>
              </div>
            </div>
            <div className="p-4">
              {patriotsPlayers.length > 0 ? (
                <div className="space-y-3">
                  {patriotsPlayers.slice(0, 5).map((player, idx) =>
                    renderPlayerCard(player, '#002244', idx)
                  )}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-600">No stats available</div>
              )}
            </div>
          </div>

          {/* Seahawks Players */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="bg-[#002244] text-white px-4 py-3">
              <div className="flex items-center gap-2">
                <img src="/nfl-hq/seattle-seahawks-sb.png" alt="Seahawks" className="w-8 h-8" />
                <span className="font-bold">Seahawks {categoryLabels[playerCategory]}</span>
              </div>
            </div>
            <div className="p-4">
              {seahawksPlayers.length > 0 ? (
                <div className="space-y-3">
                  {seahawksPlayers.slice(0, 5).map((player, idx) =>
                    renderPlayerCard(player, '#69BE28', idx)
                  )}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-600">No stats available</div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow-md p-6">
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-4 animate-pulse" />
            {[1, 2, 3].map((j) => (
              <div key={j} className="mb-4">
                <div className="h-4 bg-gray-100 rounded mb-2 animate-pulse" />
                <div className="h-3 bg-gray-200 rounded animate-pulse" />
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-700 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 min-h-[44px] bg-[#0050A0] hover:bg-[#003A75] active:scale-[0.98] text-white rounded-lg font-medium transition-all cursor-pointer"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* View Mode Toggle */}
      <div className="flex justify-center gap-2">
        <button
          onClick={() => setViewMode('team')}
          className={`px-4 sm:px-6 py-2 rounded-lg font-medium text-sm sm:text-base transition-colors cursor-pointer min-h-[44px] ${
            viewMode === 'team'
              ? 'bg-[#0050A0] text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Team Stats
        </button>
        <button
          onClick={() => setViewMode('player')}
          className={`px-4 sm:px-6 py-2 rounded-lg font-medium text-sm sm:text-base transition-colors cursor-pointer min-h-[44px] ${
            viewMode === 'player'
              ? 'bg-[#0050A0] text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Player Stats
        </button>
      </div>

      {/* Player Category Tabs - Above header when in player mode */}
      {viewMode === 'player' && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          {(Object.keys(categoryLabels) as PlayerStatCategory[]).map((cat) => (
            <button
              key={cat}
              onClick={() => setPlayerCategory(cat)}
              className={`px-3 sm:px-4 py-2 rounded-lg font-medium text-xs sm:text-sm transition-colors cursor-pointer min-h-[44px] ${
                playerCategory === cat
                  ? 'bg-[#0050A0] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {categoryLabels[cat]}
            </button>
          ))}
          <span className="text-xs sm:text-sm text-gray-600 ml-2">Regular Season</span>
        </div>
      )}

      {/* Team Logos Header */}
      <div className="bg-white rounded-lg shadow-md p-3 sm:p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <img src="/nfl-hq/new-england-patriots.png" alt="Patriots" className="w-8 h-8 sm:w-12 sm:h-12" />
            <span className="font-bold text-gray-800 text-sm sm:text-base">Patriots</span>
          </div>
          <span className="text-base sm:text-xl font-bold text-gray-500">vs</span>
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="font-bold text-gray-800 text-sm sm:text-base">Seahawks</span>
            <img src="/nfl-hq/seattle-seahawks-sb.png" alt="Seahawks" className="w-8 h-8 sm:w-12 sm:h-12" />
          </div>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'team' ? renderTeamStats() : renderPlayerStats()}
    </div>
  );
}
