import { NextRequest, NextResponse } from 'next/server';
import { teams } from '@/data/teams';

const ALL_TEAM_IDS = Object.keys(teams);

interface RosterPlayer {
  name: string;
  slug: string;
  jerseyNumber: number;
  position: string;
  positionFull: string;
  age: number;
  height: string;
  weight: number;
  college: string;
  experience: number;
  status: string;
  draft: {
    year: number;
    round: number;
    pick: number;
  } | null;
  birthDate: string;
  birthPlace: string;
}


interface PFSNPlayer {
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

interface PFSNResponse {
  players: Record<string, PFSNPlayer>;
  positionMap: Record<string, string>;
}

interface ESPNStat {
  name: string;
  displayName: string;
  shortDisplayName: string;
  abbreviation: string;
  value: number;
  displayValue: string;
}

interface ESPNStats {
  displayName: string;
  statistics: ESPNStat[];
}

interface ESPNGameLogEntry {
  week: number;
  date: string;
  opponent: string;
  opponentLogo: string;
  homeAway: string;
  result: string;
  stats: Record<string, string>;
}

interface ESPNGameLog {
  season: string;
  games: ESPNGameLogEntry[];
  statLabels: Array<{ name: string; label: string }>;
}

// ESPN Team ID mapping
const espnTeamIdMap: Record<string, string> = {
  'arizona-cardinals': '22',
  'atlanta-falcons': '1',
  'baltimore-ravens': '33',
  'buffalo-bills': '2',
  'carolina-panthers': '29',
  'chicago-bears': '3',
  'cincinnati-bengals': '4',
  'cleveland-browns': '5',
  'dallas-cowboys': '6',
  'denver-broncos': '7',
  'detroit-lions': '8',
  'green-bay-packers': '9',
  'houston-texans': '34',
  'indianapolis-colts': '11',
  'jacksonville-jaguars': '30',
  'kansas-city-chiefs': '12',
  'las-vegas-raiders': '13',
  'los-angeles-chargers': '24',
  'los-angeles-rams': '14',
  'miami-dolphins': '15',
  'minnesota-vikings': '16',
  'new-england-patriots': '17',
  'new-orleans-saints': '18',
  'new-york-giants': '19',
  'new-york-jets': '20',
  'philadelphia-eagles': '21',
  'pittsburgh-steelers': '23',
  'san-francisco-49ers': '25',
  'seattle-seahawks': '26',
  'tampa-bay-buccaneers': '27',
  'tennessee-titans': '10',
  'washington-commanders': '28',
};

function normalizePlayerName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .replace(/(jr|sr|ii|iii|iv)$/g, '');
}

// Team ID to Sportskeeda slug mapping
const teamSlugMap: Record<string, string> = {
  'arizona-cardinals': 'arizona-cardinals',
  'atlanta-falcons': 'atlanta-falcons',
  'baltimore-ravens': 'baltimore-ravens',
  'buffalo-bills': 'buffalo-bills',
  'carolina-panthers': 'carolina-panthers',
  'chicago-bears': 'chicago-bears',
  'cincinnati-bengals': 'cincinnati-bengals',
  'cleveland-browns': 'cleveland-browns',
  'dallas-cowboys': 'dallas-cowboys',
  'denver-broncos': 'denver-broncos',
  'detroit-lions': 'detroit-lions',
  'green-bay-packers': 'green-bay-packers',
  'houston-texans': 'houston-texans',
  'indianapolis-colts': 'indianapolis-colts',
  'jacksonville-jaguars': 'jacksonville-jaguars',
  'kansas-city-chiefs': 'kansas-city-chiefs',
  'las-vegas-raiders': 'las-vegas-raiders',
  'los-angeles-chargers': 'los-angeles-chargers',
  'los-angeles-rams': 'los-angeles-rams',
  'miami-dolphins': 'miami-dolphins',
  'minnesota-vikings': 'minnesota-vikings',
  'new-england-patriots': 'new-england-patriots',
  'new-orleans-saints': 'new-orleans-saints',
  'new-york-giants': 'new-york-giants',
  'new-york-jets': 'new-york-jets',
  'philadelphia-eagles': 'philadelphia-eagles',
  'pittsburgh-steelers': 'pittsburgh-steelers',
  'san-francisco-49ers': 'san-francisco-49ers',
  'seattle-seahawks': 'seattle-seahawks',
  'tampa-bay-buccaneers': 'tampa-bay-buccaneers',
  'tennessee-titans': 'tennessee-titans',
  'washington-commanders': 'washington-commanders'
};

interface SportsKeedaPlayer {
  name: string;
  slug: string;
  jersey_no: string;
  is_active: boolean;
  is_injured: boolean;
  is_suspended: boolean;
  is_practice_squad: boolean;
  is_physically_unable: boolean;
  is_non_football_injury_reserve: boolean;
  is_exempt: boolean;
  height_in_inch: number;
  weight_in_lbs: number;
  college: string;
  experience: number;
  draft: {
    year: number;
    round: number;
    roundPickNumber: number;
    overallPickNumber: number;
  };
  age: number;
  birth_date: string;
  birth_place: string;
  positions: Array<{ name: string; abbreviation: string }>;
}

function formatHeight(heightInInches: number): string {
  if (!heightInInches) return 'N/A';
  const feet = Math.floor(heightInInches / 12);
  const inches = heightInInches % 12;
  return `${feet}'${inches}"`;
}

function getPlayerStatus(player: SportsKeedaPlayer): string {
  if (player.is_suspended) return 'Suspended';
  if (player.is_exempt) return 'Exempt';
  if (player.is_injured) return 'Injured Reserve';
  if (player.is_physically_unable) return 'Physically Unable to Perform';
  if (player.is_non_football_injury_reserve) return 'Non-Football Injury Reserve';
  if (player.is_practice_squad) return 'Practice Squad';
  if (player.is_active) return 'Active';
  return 'Active';
}

async function fetchTeamRosterDirect(teamId: string): Promise<{ players: RosterPlayer[]; teamId: string } | null> {
  try {
    const sportsKeedaSlug = teamSlugMap[teamId];
    if (!sportsKeedaSlug) return null;

    const response = await fetch(
      `https://api.sportskeeda.com/v1/taxonomy/${sportsKeedaSlug}?include=squad`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; NFL-HQ/1.0)',
        },
        next: { revalidate: 86400 }
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    if (!data.squad || !Array.isArray(data.squad)) return null;

    const players: RosterPlayer[] = data.squad.map((player: SportsKeedaPlayer) => ({
      name: player.name,
      slug: player.slug,
      jerseyNumber: parseInt(player.jersey_no) || 0,
      position: player.positions?.[0]?.abbreviation || 'N/A',
      positionFull: player.positions?.[0]?.name || 'Not Available',
      age: player.age,
      height: formatHeight(player.height_in_inch),
      weight: player.weight_in_lbs,
      college: player.college?.replace('University of ', '').replace(' University', '') || 'N/A',
      experience: player.experience,
      status: getPlayerStatus(player),
      draft: player.draft.year > 0 ? {
        year: player.draft.year,
        round: player.draft.round,
        pick: player.draft.overallPickNumber
      } : null,
      birthDate: player.birth_date,
      birthPlace: player.birth_place
    }));

    return { players, teamId };
  } catch (error) {
    console.error(`Error fetching roster for ${teamId}:`, error);
    return null;
  }
}

async function fetchESPNAthleteId(teamId: string, playerName: string): Promise<string | null> {
  try {
    const espnTeamId = espnTeamIdMap[teamId];
    if (!espnTeamId) return null;

    const response = await fetch(
      `https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/${espnTeamId}/roster`,
      {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NFL-HQ/1.0)' },
        next: { revalidate: 86400 },
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    const normalizedSearchName = normalizePlayerName(playerName);

    // Search through all position groups
    for (const group of data.athletes || []) {
      for (const athlete of group.items || []) {
        const athleteName = athlete.fullName || athlete.displayName || '';
        if (normalizePlayerName(athleteName) === normalizedSearchName) {
          return athlete.id;
        }
      }
    }

    return null;
  } catch (error) {
    console.error('Error fetching ESPN athlete ID:', error);
    return null;
  }
}

async function fetchESPNAthleteStats(athleteId: string): Promise<ESPNStats | null> {
  try {
    const response = await fetch(
      `https://site.api.espn.com/apis/common/v3/sports/football/nfl/athletes/${athleteId}`,
      {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NFL-HQ/1.0)' },
        next: { revalidate: 3600 }, // Cache for 1 hour
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    const statsSummary = data.athlete?.statsSummary;

    if (!statsSummary || !statsSummary.statistics) return null;

    return {
      displayName: statsSummary.displayName || '',
      statistics: statsSummary.statistics.map((stat: Record<string, unknown>) => ({
        name: stat.name || '',
        displayName: stat.displayName || '',
        shortDisplayName: stat.shortDisplayName || '',
        abbreviation: stat.abbreviation || '',
        value: Number(stat.value) || 0,
        displayValue: String(stat.displayValue || '0'),
      })),
    };
  } catch (error) {
    console.error('Error fetching ESPN athlete stats:', error);
    return null;
  }
}

async function fetchESPNGameLog(athleteId: string): Promise<ESPNGameLog | null> {
  try {
    const response = await fetch(
      `https://site.web.api.espn.com/apis/common/v3/sports/football/nfl/athletes/${athleteId}/gamelog`,
      {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NFL-HQ/1.0)' },
        next: { revalidate: 3600 },
      }
    );

    if (!response.ok) return null;

    const data = await response.json();

    // Get the season display name
    const seasonType = data.seasonTypes?.[0];
    if (!seasonType) return null;

    const categories = seasonType.categories || [];
    const events = seasonType.events || {};

    // Find the main stats category (usually the first one with stats)
    const mainCategory = categories.find((cat: Record<string, unknown>) =>
      Array.isArray(cat.events) && cat.events.length > 0
    );

    if (!mainCategory) return null;

    // Get stat labels from the category
    const statLabels: Array<{ name: string; label: string }> = (mainCategory.labels || []).map(
      (label: string, index: number) => ({
        name: mainCategory.names?.[index] || label,
        label: label,
      })
    );

    // Parse game entries
    const games: ESPNGameLogEntry[] = [];

    for (const eventId of mainCategory.events || []) {
      const event = events[eventId];
      if (!event) continue;

      const gameStats = mainCategory.totals?.[mainCategory.events.indexOf(eventId)] || [];
      const statsMap: Record<string, string> = {};

      statLabels.forEach((label, index) => {
        statsMap[label.name] = gameStats[index] || '-';
      });

      games.push({
        week: event.week || 0,
        date: event.gameDate || '',
        opponent: event.opponent?.displayName || event.opponent?.abbreviation || 'TBD',
        opponentLogo: event.opponent?.logo || '',
        homeAway: event.homeAway === 'home' ? 'vs' : '@',
        result: event.gameResult || '-',
        stats: statsMap,
      });
    }

    // Sort by week
    games.sort((a, b) => a.week - b.week);

    return {
      season: seasonType.displayName || '2025 Regular Season',
      games,
      statLabels,
    };
  } catch (error) {
    console.error('Error fetching ESPN game log:', error);
    return null;
  }
}

// Google Sheets configuration for PFSN Impact Grades
const GOOGLE_SHEETS_CONFIG: Record<string, { spreadsheetId: string; gid: string }> = {
  QB: {
    spreadsheetId: '17d7EIFBHLChlSoi6vRFArwviQRTJn0P0TOvQUNx8hU8',
    gid: '1456950409',
  },
  SAF: {
    spreadsheetId: '1SKr25H4brSE4dRf7JGpkytwLAKvt4jH-_wlCoqbFPXE',
    gid: '1216441503',
  },
  CB: {
    spreadsheetId: '1fUwD_rShGMrn7ypJyQsy4mCofqP7Q6J0Un8rsGW7h7U',
    gid: '1146203009',
  },
  LB: {
    spreadsheetId: '1mNCbJ8RxNZOSp_DuocR_5C7e_wqfiIPy4Rb9fS7GTBE',
    gid: '519296058',
  },
  EDGE: {
    spreadsheetId: '1RLSAJusOAcjnA1VDROtWFdfKUF4VYUV9JQ6tPinuGAQ',
    gid: '0',
  },
  DT: {
    spreadsheetId: '1N_V-cyIhROKXNatG1F_uPXTyP6BhuoNu_TebgjMQ6YM',
    gid: '0',
  },
  OL: {
    spreadsheetId: '1bKmYM1QyPSsJ9FyPtVZuxV0_HiUBw1o2loyU_55pXKA',
    gid: '1321084176',
  },
  TE: {
    spreadsheetId: '16LsyT1QLP-2ZdG_WNdHjn6ZMrFFu7q13qxDkKyTuseM',
    gid: '53851653',
  },
  WR: {
    spreadsheetId: '1h-HIZVjq1TM8FZ_5FYfxEZ3lPwtw_9ZWeqLzAi0EUIM',
    gid: '1964031106',
  },
  RB: {
    spreadsheetId: '1lXXHd9OzHA6Zp4yW1HZKsIJybLthW7tS93l4y4yCBzE',
    gid: '0',
  },
};

interface SheetPlayerRow {
  seasonRank: number;
  overallRank: number;
  player: string;
  grade: string;
  score: number;
  position: string;
}

// Column mappings for each position sheet
// Each position has different column structures
const POSITION_COLUMN_MAPPINGS: Record<string, {
  playerCol: number;
  scoreCol: number;
  gradeCol: number;
  seasonRankCol: number;
  overallRankCol: number;
  headerRows: number;
}> = {
  // QB: Season, Rank, Player, Grade, Score, OVR. Rank
  QB: { playerCol: 2, scoreCol: 4, gradeCol: 3, seasonRankCol: 1, overallRankCol: 5, headerRows: 1 },
  // SAF: Season, Player, Team, ..., Ovr. Rank, Season Rank, SAF+, SAF+ Grade (columns from end: -4, -3, -2, -1)
  SAF: { playerCol: 1, scoreCol: -2, gradeCol: -1, seasonRankCol: -3, overallRankCol: -4, headerRows: 10 },
  // CB: Season, Player, ID, Pos, Team, ..., Ovr. Rank, Season Rank, CB+, CB+ Grade
  CB: { playerCol: 1, scoreCol: -2, gradeCol: -1, seasonRankCol: -3, overallRankCol: -4, headerRows: 10 },
  // LB: Season, Player Season ID, Player, Team, ..., Ovr. Rank, Season Rank, LB+, LB+ Grade
  LB: { playerCol: 2, scoreCol: -2, gradeCol: -1, seasonRankCol: -3, overallRankCol: -4, headerRows: 10 },
  // EDGE: Season, Player, Team, ..., Ovr. Rank, Season Rank, EDGE+, EDGE+ Grade
  EDGE: { playerCol: 1, scoreCol: -2, gradeCol: -1, seasonRankCol: -3, overallRankCol: -4, headerRows: 10 },
  // DT: Season, Player, Team, ..., Ovr. Rank, Season Rank, DT+, DT+ Grade
  DT: { playerCol: 1, scoreCol: -2, gradeCol: -1, seasonRankCol: -3, overallRankCol: -4, headerRows: 10 },
  // OL: Season, Player Season ID, pffPosGeneral, Player, Team, ..., Ovr. Rank, Season Rank, Season Pos. Rank, OL+, OL+ Grade
  OL: { playerCol: 3, scoreCol: -2, gradeCol: -1, seasonRankCol: -4, overallRankCol: -5, headerRows: 10 },
  // TE: Season, Player, Team, ..., Ovr. Rank, Season Rank, TE+, TE+ Grade
  TE: { playerCol: 1, scoreCol: -2, gradeCol: -1, seasonRankCol: -3, overallRankCol: -4, headerRows: 10 },
  // WR: Season, Player, Team, ..., Ovr. Rank, Name, WR+, WR+ Grade, Team, Games, Season, Season Rank
  WR: { playerCol: 1, scoreCol: -6, gradeCol: -5, seasonRankCol: -1, overallRankCol: -8, headerRows: 10 },
  // RB: RB+, Grade, player, Team Name, ..., Overall Rank, Season Rank (score is col 0, grade is col 1)
  RB: { playerCol: 2, scoreCol: 0, gradeCol: 1, seasonRankCol: -1, overallRankCol: -3, headerRows: 10 },
};

async function fetchPositionGradesFromSheet(position: string): Promise<SheetPlayerRow[]> {
  try {
    const config = GOOGLE_SHEETS_CONFIG[position];
    if (!config) return [];

    const mapping = POSITION_COLUMN_MAPPINGS[position];
    if (!mapping) return [];

    const csvUrl = `https://docs.google.com/spreadsheets/d/${config.spreadsheetId}/export?format=csv&gid=${config.gid}`;

    const response = await fetch(csvUrl, {
      headers: { 'User-Agent': 'NFL-HQ/1.0' },
      next: { revalidate: 86400 }, // Cache for 24 hours
    });

    if (!response.ok) {
      console.error(`Failed to fetch ${position} grades sheet:`, response.status);
      return [];
    }

    const csvText = await response.text();
    const lines = csvText.split('\n').filter(line => line.trim());

    const players: SheetPlayerRow[] = [];

    // Skip header rows
    for (let i = mapping.headerRows; i < lines.length; i++) {
      const line = lines[i];
      const values = parseCSVLine(line);

      if (values.length < 5) continue;

      // Get column values (handle negative indices for columns from end)
      const getCol = (col: number) => col < 0 ? values[values.length + col] : values[col];

      const player = getCol(mapping.playerCol)?.trim() || '';
      const scoreStr = getCol(mapping.scoreCol)?.trim() || '0';
      const extractedGrade = getCol(mapping.gradeCol)?.trim() || '';
      const seasonRankStr = getCol(mapping.seasonRankCol)?.trim() || '0';
      const overallRankStr = getCol(mapping.overallRankCol)?.trim() || '0';

      // Parse score (remove % if present)
      const score = parseFloat(scoreStr.replace('%', '')) || 0;
      const seasonRank = parseInt(seasonRankStr) || 0;
      const overallRank = parseInt(overallRankStr) || seasonRank;

      // Validate grade - if invalid, derive from score
      const grade = isValidGrade(extractedGrade) ? extractedGrade.toUpperCase() : deriveGradeFromScore(score);

      // Skip invalid rows (header rows that slipped through, or empty player names)
      if (!player || player.toLowerCase() === 'player' || player.toLowerCase().includes('season')) continue;
      if (seasonRank <= 0 && overallRank <= 0 && score <= 0) continue;

      players.push({
        player,
        score,
        grade,
        seasonRank: seasonRank || overallRank,
        overallRank: overallRank || seasonRank,
        position,
      });
    }

    return players;
  } catch (error) {
    console.error(`Error fetching ${position} grades from sheet:`, error);
    return [];
  }
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);

  return result;
}

// Validate if a string is a valid grade (A, A+, A-, B, B+, B-, C, C+, C-, D, D+, D-, F)
function isValidGrade(grade: string): boolean {
  const validGrades = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F'];
  return validGrades.includes(grade.trim().toUpperCase());
}

// Derive grade from score
function deriveGradeFromScore(score: number): string {
  if (score >= 90) return 'A';
  if (score >= 85) return 'A-';
  if (score >= 80) return 'B+';
  if (score >= 75) return 'B';
  if (score >= 70) return 'B-';
  if (score >= 65) return 'C+';
  if (score >= 60) return 'C';
  if (score >= 55) return 'C-';
  if (score >= 50) return 'D+';
  if (score >= 45) return 'D';
  if (score >= 40) return 'D-';
  return 'F';
}

async function fetchPFSNImpact(): Promise<PFSNResponse | null> {
  try {
    const POSITION_MAP: Record<string, string> = {
      'QB': 'QB', 'RB': 'RB', 'FB': 'RB', 'WR': 'WR', 'TE': 'TE',
      'OT': 'OL', 'OG': 'OL', 'OC': 'OL', 'C': 'OL', 'G': 'OL', 'T': 'OL', 'OL': 'OL',
      'DT': 'DT', 'NT': 'DT', 'DE': 'EDGE', 'EDGE': 'EDGE', 'OLB': 'EDGE',
      'LB': 'LB', 'ILB': 'LB', 'MLB': 'LB', 'CB': 'CB',
      'S': 'SAF', 'FS': 'SAF', 'SS': 'SAF', 'SAF': 'SAF', 'DB': 'CB',
    };

    const currentSeason = 2025;
    const playersMap: Record<string, PFSNPlayer> = {};

    // Fetch all position grades in parallel
    const positions = Object.keys(GOOGLE_SHEETS_CONFIG);
    const allGradesPromises = positions.map(pos => fetchPositionGradesFromSheet(pos));
    const allGradesResults = await Promise.all(allGradesPromises);

    // Combine all position grades into playersMap
    for (let i = 0; i < positions.length; i++) {
      const position = positions[i];
      const grades = allGradesResults[i];

      for (const playerGrade of grades) {
        const normalizedName = normalizePlayerName(playerGrade.player);

        playersMap[normalizedName] = {
          playerName: playerGrade.player,
          normalizedName,
          position: position,
          team: '', // Not available in current sheets
          score: playerGrade.score,
          grade: playerGrade.grade,
          seasonRank: playerGrade.seasonRank,
          overallRank: playerGrade.overallRank,
          season: currentSeason,
          weeklyData: [], // Weekly data not included in current sheets
          stats: {}, // Stats not included in current sheets
        };
      }
    }

    return { players: playersMap, positionMap: POSITION_MAP };
  } catch (error) {
    console.error('Error fetching PFSN Impact:', error);
    return null;
  }
}

// Helper functions for extracting data from raw player objects (preserved for future use with other positions)
function _extractWeeklyData(player: Record<string, unknown>): Array<{ week: number; score: number; grade: string; opponent: string }> {
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

function _extractStats(player: Record<string, unknown>, position: string): Record<string, string | number> {
  const stats: Record<string, string | number> = {};
  if (player.games) stats.games = Number(player.games);

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

// Suppress unused warnings - these will be used when more position sheets are added
void _extractWeeklyData;
void _extractStats;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ playerSlug: string }> }
) {
  try {
    const { playerSlug } = await params;

    if (!playerSlug) {
      return NextResponse.json(
        { error: 'Player slug is required' },
        { status: 400 }
      );
    }

    // Search all team rosters for the player
    let foundPlayer: RosterPlayer | null = null;
    let foundTeamId: string | null = null;

    // Fetch all rosters in parallel using direct SportsKeeda API
    const rosterPromises = ALL_TEAM_IDS.map(async (teamId) => {
      const result = await fetchTeamRosterDirect(teamId);
      if (!result) return null;

      const player = result.players.find(p => p.slug === playerSlug);
      if (player) {
        return { player, teamId: result.teamId };
      }
      return null;
    });

    const results = await Promise.all(rosterPromises);
    const found = results.find(r => r !== null);

    if (found) {
      foundPlayer = found.player;
      foundTeamId = found.teamId;
    }

    if (!foundPlayer || !foundTeamId) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }

    // Get team info
    const team = teams[foundTeamId];

    // Fetch ESPN stats and game log
    let espnStats: ESPNStats | null = null;
    let espnGameLog: ESPNGameLog | null = null;
    const espnAthleteId = await fetchESPNAthleteId(foundTeamId, foundPlayer.name);
    if (espnAthleteId) {
      // Fetch stats and game log in parallel
      const [statsResult, gameLogResult] = await Promise.all([
        fetchESPNAthleteStats(espnAthleteId),
        fetchESPNGameLog(espnAthleteId),
      ]);
      espnStats = statsResult;
      espnGameLog = gameLogResult;
    }

    // Fetch PFSN Impact data (may fail if repos don't exist)
    const pfsnData = await fetchPFSNImpact();

    // Try to match player to PFSN data
    const normalizedName = normalizePlayerName(foundPlayer.name);
    const pfsnPlayer = pfsnData?.players?.[normalizedName] || null;

    // Build headshot URL
    const headshotUrl = `https://staticd.profootballnetwork.com/skm/assets/player-images/nfl/${foundPlayer.slug}.png`;

    // Construct response
    const playerProfile = {
      // Bio
      name: foundPlayer.name,
      slug: foundPlayer.slug,
      team: {
        id: foundTeamId,
        name: team.fullName,
        abbreviation: team.abbreviation,
        logo: team.logoUrl,
        primaryColor: team.primaryColor,
        secondaryColor: team.secondaryColor,
      },
      position: foundPlayer.position,
      positionFull: foundPlayer.positionFull,
      jerseyNumber: foundPlayer.jerseyNumber,
      age: foundPlayer.age,
      height: foundPlayer.height,
      weight: foundPlayer.weight,
      college: foundPlayer.college,
      experience: foundPlayer.experience,
      experienceLabel: foundPlayer.experience === 0 ? 'Rookie' : `${foundPlayer.experience} ${foundPlayer.experience === 1 ? 'Year' : 'Years'}`,
      draft: foundPlayer.draft,
      birthDate: foundPlayer.birthDate,
      birthPlace: foundPlayer.birthPlace,
      status: foundPlayer.status,
      headshotUrl,

      // PFSN Impact
      pfsnImpact: pfsnPlayer ? {
        score: pfsnPlayer.score,
        grade: pfsnPlayer.grade,
        seasonRank: pfsnPlayer.seasonRank,
        overallRank: pfsnPlayer.overallRank,
        season: pfsnPlayer.season,
        weeklyData: pfsnPlayer.weeklyData,
        stats: pfsnPlayer.stats,
      } : null,

      // ESPN Stats
      seasonStats: espnStats ? {
        season: (() => {
          const match = espnStats.displayName?.match(/^(\d{4}) Regular Season$/);
          if (match) {
            const year = parseInt(match[1]);
            return `${year}-${(year + 1).toString().slice(-2)} Regular Season Stats`;
          }
          return '2025-26 Regular Season Stats';
        })(),
        stats: espnStats.statistics.map(stat => ({
          name: stat.name,
          label: stat.displayName,
          shortLabel: stat.shortDisplayName,
          abbreviation: stat.abbreviation,
          value: stat.value,
          displayValue: stat.displayValue,
        })),
      } : null,

      // Game Log
      gameLog: espnGameLog ? {
        season: espnGameLog.season,
        statLabels: espnGameLog.statLabels,
        games: espnGameLog.games.map(game => ({
          week: game.week,
          date: game.date,
          opponent: game.opponent,
          opponentLogo: game.opponentLogo,
          homeAway: game.homeAway,
          result: game.result,
          stats: game.stats,
        })),
      } : null,
    };

    return NextResponse.json({
      player: playerProfile,
      lastUpdated: new Date().toISOString(),
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600',
      },
    });
  } catch (error) {
    console.error('Player API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch player data' },
      { status: 500 }
    );
  }
}
