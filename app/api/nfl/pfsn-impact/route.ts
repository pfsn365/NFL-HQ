import { NextResponse } from 'next/server';

// PFSN Impact repo configuration
const PFSN_REPOS = [
  { position: 'QB', repo: 'PFSN-QB-Impact', scoreField: 'qbIndex' },
  { position: 'RB', repo: 'PFSN-RB-Impact', scoreField: 'rbIndex' },
  { position: 'WR', repo: 'PFSN-WR-Impact', scoreField: 'wrIndex' },
  { position: 'TE', repo: 'PFSN-TE-Impact', scoreField: 'teIndex' },
  { position: 'OL', repo: 'PFSN-PlayerOL-Impact', scoreField: 'olIndex' },
  { position: 'DT', repo: 'PFSN-DT-Impact', scoreField: 'dtIndex' },
  { position: 'EDGE', repo: 'PFSN-EDGE-Impact', scoreField: 'edgeIndex' },
  { position: 'LB', repo: 'NFL-LB-Impact', scoreField: 'lbIndex' },
  { position: 'CB', repo: 'NFL-CB-Impact', scoreField: 'cbIndex' },
  { position: 'SAF', repo: 'NFL-Saf-Impact', scoreField: 'safIndex' },
];

// Map roster positions to PFSN categories
const POSITION_MAP: Record<string, string> = {
  'QB': 'QB',
  'RB': 'RB',
  'FB': 'RB',
  'WR': 'WR',
  'TE': 'TE',
  'OT': 'OL',
  'OG': 'OL',
  'OC': 'OL',
  'C': 'OL',
  'G': 'OL',
  'T': 'OL',
  'OL': 'OL',
  'DT': 'DT',
  'NT': 'DT',
  'DE': 'EDGE',
  'EDGE': 'EDGE',
  'OLB': 'EDGE',
  'LB': 'LB',
  'ILB': 'LB',
  'MLB': 'LB',
  'CB': 'CB',
  'S': 'SAF',
  'FS': 'SAF',
  'SS': 'SAF',
  'SAF': 'SAF',
  'DB': 'CB',
};

interface PFSNPlayer {
  playerName: string;
  team: string;
  grade: string;
  seasonRank: number;
  overallRank: number;
  season: number;
  games?: number;
  // Index signature for dynamic score fields (qbIndex, rbIndex, etc.)
  [key: string]: string | number | undefined;
}

interface PFSNPlayerWithMeta extends PFSNPlayer {
  _position: string;
  _scoreField: string;
}

interface ProcessedPlayer {
  playerName: string;
  normalizedName: string;
  position: string;
  team: string;
  score: number;
  grade: string;
  seasonRank: number;
  overallRank: number;
  season: number;
  weeklyData: Array<{ week: number; score: number; grade: string; opponent: string }>;
  stats: Record<string, string | number>;
}

function normalizePlayerName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .replace(/(jr|sr|ii|iii|iv)$/g, '');
}

function extractWeeklyData(player: PFSNPlayer): Array<{ week: number; score: number; grade: string; opponent: string }> {
  const weeklyData: Array<{ week: number; score: number; grade: string; opponent: string }> = [];

  for (let week = 1; week <= 18; week++) {
    const scoreKey = `week${week}Score`;
    const gradeKey = `week${week}Grade`;
    const oppKey = `week${week}Opponent`;

    if (player[scoreKey] !== undefined && player[gradeKey] !== undefined) {
      weeklyData.push({
        week,
        score: Number(player[scoreKey]) || 0,
        grade: String(player[gradeKey] || ''),
        opponent: String(player[oppKey] || ''),
      });
    }
  }

  return weeklyData;
}

function extractStats(player: PFSNPlayer, position: string): Record<string, string | number> {
  const stats: Record<string, string | number> = {};

  // Common stats
  if (player.games) stats.games = player.games;

  // Position-specific stats
  const statFields: Record<string, string[]> = {
    QB: ['passYards', 'passTDs', 'interceptions', 'epaPerDb', 'netYPA', 'completionPct', 'rushYards', 'rushTDs'],
    RB: ['rushYards', 'rushTDs', 'yardsPerCarry', 'receptions', 'recYards', 'recTDs', 'fumbles'],
    WR: ['receptions', 'recYards', 'recTDs', 'targets', 'yardsPerRec', 'catchPct'],
    TE: ['receptions', 'recYards', 'recTDs', 'targets', 'yardsPerRec', 'catchPct'],
    OL: ['snaps', 'sacks', 'pressures', 'penalties', 'runBlockGrade', 'passBlockGrade'],
    DT: ['tackles', 'sacks', 'tfl', 'qbHits', 'pressures', 'stuffs'],
    EDGE: ['tackles', 'sacks', 'tfl', 'qbHits', 'pressures', 'forcedFumbles'],
    LB: ['tackles', 'sacks', 'tfl', 'passDefended', 'interceptions', 'forcedFumbles'],
    CB: ['tackles', 'interceptions', 'passDefended', 'targetsAllowed', 'completionsAllowed', 'yardsAllowed'],
    SAF: ['tackles', 'interceptions', 'passDefended', 'forcedFumbles', 'sacks', 'tfl'],
  };

  const relevantStats = statFields[position] || [];
  for (const field of relevantStats) {
    if (player[field] !== undefined) {
      stats[field] = player[field] as string | number;
    }
  }

  return stats;
}

async function fetchRepoData(repo: string): Promise<PFSNPlayer[]> {
  try {
    const url = `https://raw.githubusercontent.com/pfsn365/${repo}/main/data/players.json`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'NFL-HQ/1.0',
      },
      next: { revalidate: 86400 }, // Cache for 24 hours
    });

    if (!response.ok) {
      console.error(`Failed to fetch ${repo}: ${response.status}`);
      return [];
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error(`Error fetching ${repo}:`, error);
    return [];
  }
}

export async function GET() {
  try {
    // Fetch all repos in parallel
    const fetchPromises = PFSN_REPOS.map(async ({ position, repo, scoreField }) => {
      const players = await fetchRepoData(repo);
      return players.map((player): PFSNPlayerWithMeta => ({
        ...player,
        _position: position,
        _scoreField: scoreField,
      }));
    });

    const allResults = await Promise.all(fetchPromises);
    const allPlayers: PFSNPlayerWithMeta[] = allResults.flat();

    // Filter to only current season (2024) players and process
    const currentSeason = 2024;
    const playersMap: Record<string, ProcessedPlayer> = {};

    for (const player of allPlayers) {
      if (player.season !== currentSeason) continue;

      const normalizedName = normalizePlayerName(player.playerName);
      const position = player._position;
      const scoreField = player._scoreField;
      const score = Number(player[scoreField]) || 0;

      const processed: ProcessedPlayer = {
        playerName: player.playerName,
        normalizedName,
        position,
        team: player.team,
        score,
        grade: player.grade || '—',
        seasonRank: player.seasonRank || 0,
        overallRank: player.overallRank || 0,
        season: player.season,
        weeklyData: extractWeeklyData(player),
        stats: extractStats(player, position),
      };

      playersMap[normalizedName] = processed;
    }

    return NextResponse.json({
      players: playersMap,
      positionMap: POSITION_MAP,
      totalPlayers: Object.keys(playersMap).length,
      season: currentSeason,
      lastUpdated: new Date().toISOString(),
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600',
      },
    });
  } catch (error) {
    console.error('PFSN Impact API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch PFSN Impact data' },
      { status: 500 }
    );
  }
}
