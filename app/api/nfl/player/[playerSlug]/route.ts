import { NextRequest, NextResponse } from 'next/server';
import { teams } from '@/data/teams';
import { getAllRosters, type RosterPlayer } from '@/app/api/nfl/rosters/route';

// State abbreviation to full name mapping
const STATE_ABBREVIATIONS: Record<string, string> = {
  'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas', 'CA': 'California',
  'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware', 'FL': 'Florida', 'GA': 'Georgia',
  'HI': 'Hawaii', 'ID': 'Idaho', 'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa',
  'KS': 'Kansas', 'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
  'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi', 'MO': 'Missouri',
  'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada', 'NH': 'New Hampshire', 'NJ': 'New Jersey',
  'NM': 'New Mexico', 'NY': 'New York', 'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio',
  'OK': 'Oklahoma', 'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
  'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah', 'VT': 'Vermont',
  'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia', 'WI': 'Wisconsin', 'WY': 'Wyoming',
  'DC': 'District of Columbia',
};

function expandStateAbbreviation(location: string): string {
  // Match pattern like "City, ST" and expand ST to full state name
  const match = location.match(/^(.+),\s*([A-Z]{2})$/);
  if (match) {
    const city = match[1];
    const stateAbbr = match[2];
    const fullState = STATE_ABBREVIATIONS[stateAbbr];
    if (fullState) {
      return `${city}, ${fullState}`;
    }
  }
  return location;
}

// RosterPlayer interface imported from rosters route


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
  displayDraft: string | null;
  displayBirthPlace: string | null;
  college: string | null;
}

interface ESPNGameLogEntry {
  week: number | string;
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
  seasonTotals: Record<string, string>;
}

interface ESPNCareerStatsSeason {
  year: number;
  displayName: string;
  teamId: string;
  teamSlug: string;
  stats: Record<string, string>;
}

interface ESPNCareerStatsCategory {
  name: string;
  displayName: string;
  labels: string[];
  names: string[];
  displayNames: string[];
  seasons: ESPNCareerStatsSeason[];
  totals: Record<string, string>;
}

interface ESPNCareerStats {
  categories: ESPNCareerStatsCategory[];
  availableSeasons: number[];
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

// In-memory cache for ESPN rosters to avoid redundant fetches
// Cache stores normalized name -> athlete ID mapping per team
interface ESPNRosterCache {
  data: Map<string, string>; // normalizedName -> athleteId
  timestamp: number;
}
const espnRosterCache = new Map<string, ESPNRosterCache>();
const ESPN_ROSTER_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

async function fetchESPNAthleteId(teamId: string, playerName: string): Promise<string | null> {
  try {
    const espnTeamId = espnTeamIdMap[teamId];
    if (!espnTeamId) return null;

    const normalizedSearchName = normalizePlayerName(playerName);

    // Check in-memory cache first
    const cached = espnRosterCache.get(teamId);
    if (cached && Date.now() - cached.timestamp < ESPN_ROSTER_CACHE_TTL) {
      const cachedId = cached.data.get(normalizedSearchName);
      if (cachedId) return cachedId;
      // Player not in cached roster - don't refetch, roster is complete
      return null;
    }

    // Fetch and cache entire roster for this team
    const response = await fetch(
      `https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/${espnTeamId}/roster`,
      {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NFL-HQ/1.0)' },
        next: { revalidate: 86400 },
      }
    );

    if (!response.ok) {
      console.warn(`[ESPN Athlete ID] Failed to fetch roster for team ${teamId}: ${response.status}`);
      return null;
    }

    const data = await response.json();

    // Build cache map for this team's roster
    const rosterMap = new Map<string, string>();
    for (const group of data.athletes || []) {
      for (const athlete of group.items || []) {
        const athleteName = athlete.fullName || athlete.displayName || '';
        const normalizedName = normalizePlayerName(athleteName);
        rosterMap.set(normalizedName, athlete.id);
      }
    }

    // Store in cache
    espnRosterCache.set(teamId, {
      data: rosterMap,
      timestamp: Date.now(),
    });

    // Return the requested player's ID
    return rosterMap.get(normalizedSearchName) || null;
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
        next: { revalidate: 604800 }, // Cache for 1 week (season is over)
      }
    );

    if (!response.ok) {
      console.warn(`[ESPN Athlete Stats] Failed for athlete ${athleteId}: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const statsSummary = data.athlete?.statsSummary;

    if (!statsSummary || !statsSummary.statistics) return null;

    // Format displayDraft: "2017: Rd 1, Pk 10 (KC)" -> "2017: Round 1, Pick 10 (KC)"
    let displayDraft: string | null = null;
    if (data.athlete?.displayDraft) {
      displayDraft = data.athlete.displayDraft
        .replace(/Rd (\d+)/, 'Round $1')
        .replace(/Pk (\d+)/, 'Pick $1');
    }

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
      displayDraft,
      displayBirthPlace: data.athlete?.displayBirthPlace || null,
      college: data.athlete?.college?.name || null,
    };
  } catch (error) {
    console.error('Error fetching ESPN athlete stats:', error);
    return null;
  }
}

async function fetchESPNGameLog(athleteId: string, season?: number): Promise<ESPNGameLog | null> {
  try {
    const url = season
      ? `https://site.web.api.espn.com/apis/common/v3/sports/football/nfl/athletes/${athleteId}/gamelog?season=${season}`
      : `https://site.web.api.espn.com/apis/common/v3/sports/football/nfl/athletes/${athleteId}/gamelog`;

    const response = await fetch(
      url,
      {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NFL-HQ/1.0)' },
        next: { revalidate: 604800 }, // Cache for 1 week (season is over)
      }
    );

    if (!response.ok) {
      console.warn(`[ESPN Game Log] Failed for athlete ${athleteId}, season ${season || 'current'}: ${response.status}`);
      return null;
    }

    const data = await response.json();

    // Events are at the top level of data
    const events = data.events || {};

    // Get stat labels from top-level (consistent across all season types)
    const labels = data.labels || [];
    const names = data.names || [];
    const statLabels: Array<{ name: string; label: string }> = labels.map(
      (label: string, index: number) => ({
        name: names[index] || label,
        label: label,
      })
    );

    // Combine games from ALL season types (regular season + postseason)
    const allGames: ESPNGameLogEntry[] = [];
    const allTotals: number[] = [];
    let seasonDisplayName = '';

    // Process all season types (regular season type=2, postseason type=3)
    for (const seasonType of data.seasonTypes || []) {
      // Detect if this is postseason by checking type OR displayName
      const displayName = (seasonType.displayName || '').toLowerCase();
      const isPostseason = seasonType.type === 3 ||
                          displayName.includes('postseason') ||
                          displayName.includes('playoff');

      // Track the display name (prefer regular season name)
      if (!seasonDisplayName || !isPostseason) {
        seasonDisplayName = seasonType.displayName || seasonDisplayName;
      }

      const categories = seasonType.categories || [];

      // Find the main stats category (usually the first one with stats)
      const mainCategory = categories.find((cat: Record<string, unknown>) =>
        Array.isArray(cat.events) && cat.events.length > 0
      );

      if (!mainCategory) continue;

      // If we don't have stat labels yet, get them from the category
      if (statLabels.length === 0) {
        const catLabels = mainCategory.labels || [];
        const catNames = mainCategory.names || [];
        catLabels.forEach((label: string, index: number) => {
          statLabels.push({
            name: catNames[index] || label,
            label: label,
          });
        });
      }

      // Parse game entries
      for (const eventData of mainCategory.events || []) {
        const eventId = eventData.eventId || eventData;
        const event = events[eventId];
        if (!event) continue;

        const gameStats = eventData.stats || [];
        const statsMap: Record<string, string> = {};

        statLabels.forEach((label, index) => {
          statsMap[label.name] = gameStats[index] || '-';
        });

        // For postseason games, add 100 to week number so they sort after regular season
        // Regular season weeks are 1-18, postseason will be 101-104
        const weekNum = event.week || 0;
        const sortableWeek = isPostseason ? weekNum + 100 : weekNum;

        allGames.push({
          week: sortableWeek,
          date: event.gameDate || '',
          opponent: event.opponent?.displayName || event.opponent?.abbreviation || 'TBD',
          opponentLogo: event.opponent?.logo || '',
          homeAway: event.atVs === 'vs' ? 'vs' : '@',
          result: event.gameResult || '-',
          stats: statsMap,
        });
      }

      // Accumulate totals from each season type
      const categoryTotals = mainCategory.totals || [];
      if (categoryTotals.length > 0) {
        if (allTotals.length === 0) {
          // Initialize with first season type totals
          // Remove commas from numbers before parsing (ESPN returns "4,394" format)
          categoryTotals.forEach((val: string) => {
            allTotals.push(parseFloat(String(val).replace(/,/g, '')) || 0);
          });
        } else {
          // Add subsequent season type totals
          categoryTotals.forEach((val: string, index: number) => {
            const numVal = parseFloat(String(val).replace(/,/g, '')) || 0;
            if (index < allTotals.length) {
              allTotals[index] += numVal;
            }
          });
        }
      }
    }

    if (allGames.length === 0) return null;

    // Sort games by week (regular season weeks 1-18, then postseason 101+)
    allGames.sort((a, b) => {
      const weekA = typeof a.week === 'number' ? a.week : 0;
      const weekB = typeof b.week === 'number' ? b.week : 0;
      return weekA - weekB;
    });

    // Convert week numbers back to display format
    for (const game of allGames) {
      if (typeof game.week === 'number' && game.week > 100) {
        // Postseason game - show as WC (Wild Card), DR (Divisional Round), CC (Conference Championship), SB (Super Bowl)
        const postWeek = game.week - 100;
        const postWeekNames: Record<number, string> = { 1: 'WC', 2: 'DR', 3: 'CC', 4: 'SB' };
        game.week = postWeekNames[postWeek] || `P${postWeek}`;
      }
    }

    // Format combined totals
    const seasonTotals: Record<string, string> = {};
    statLabels.forEach((label, index) => {
      const total = allTotals[index];
      // Format averages to 1 decimal place, integers as whole numbers
      if (label.name.toLowerCase().includes('avg') || label.name.toLowerCase().includes('pct')) {
        seasonTotals[label.name] = total !== undefined ? total.toFixed(1) : '-';
      } else {
        seasonTotals[label.name] = total !== undefined ? Math.round(total).toString() : '-';
      }
    });

    return {
      season: seasonDisplayName || `${season || 2025} Season`,
      games: allGames,
      statLabels,
      seasonTotals,
    };
  } catch (error) {
    console.error('Error fetching ESPN game log:', error);
    return null;
  }
}

async function fetchESPNCareerStats(athleteId: string): Promise<ESPNCareerStats | null> {
  try {
    const response = await fetch(
      `https://site.web.api.espn.com/apis/common/v3/sports/football/nfl/athletes/${athleteId}/stats`,
      {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NFL-HQ/1.0)' },
        next: { revalidate: 604800 }, // Cache for 1 week (season is over)
      }
    );

    if (!response.ok) {
      console.warn(`[ESPN Career Stats] Failed for athlete ${athleteId}: ${response.status}`);
      return null;
    }

    const data = await response.json();

    if (!data.categories || !Array.isArray(data.categories)) return null;

    const categories: ESPNCareerStatsCategory[] = [];
    const allSeasons = new Set<number>();

    for (const category of data.categories) {
      if (!category.statistics || category.statistics.length === 0) continue;

      const seasons: ESPNCareerStatsSeason[] = [];
      const totalsMap: Record<string, string> = {};

      // Parse season-by-season stats
      for (const seasonData of category.statistics) {
        const year = seasonData.season?.year;
        if (!year) continue;

        allSeasons.add(year);

        const statsMap: Record<string, string> = {};
        const names = category.names || [];
        const stats = seasonData.stats || [];

        names.forEach((name: string, index: number) => {
          statsMap[name] = stats[index] || '-';
        });

        seasons.push({
          year,
          displayName: seasonData.season?.displayName || String(year),
          teamId: seasonData.teamId || '',
          teamSlug: seasonData.teamSlug || '',
          stats: statsMap,
        });
      }

      // Parse career totals
      const totals = category.totals || [];
      const names = category.names || [];
      names.forEach((name: string, index: number) => {
        totalsMap[name] = totals[index] || '-';
      });

      categories.push({
        name: category.name || '',
        displayName: category.displayName || '',
        labels: category.labels || [],
        names: category.names || [],
        displayNames: category.displayNames || [],
        seasons: seasons.sort((a, b) => b.year - a.year), // Most recent first
        totals: totalsMap,
      });
    }

    return {
      categories,
      availableSeasons: Array.from(allSeasons).sort((a, b) => b - a), // Most recent first
    };
  } catch (error) {
    console.error('Error fetching ESPN career stats:', error);
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

// Column mappings for each position sheet - verified from actual sheet structure
const POSITION_COLUMN_MAPPINGS: Record<string, {
  playerCol: number;
  scoreCol: number;
  gradeCol: number;
  seasonRankCol: number;
  overallRankCol: number;
  headerRows: number;
}> = {
  // QB: Season, Rank, Player, Grade, Score (col 4), OVR. Rank
  QB: { playerCol: 2, scoreCol: 4, gradeCol: 3, seasonRankCol: 1, overallRankCol: 5, headerRows: 1 },
  // SAF: ...Ovr.Rank (-5), Season Rank (-4), SAF+ (-3), SAF+ Grade (-2), [extra name+year (-1)]
  SAF: { playerCol: 1, scoreCol: -3, gradeCol: -2, seasonRankCol: -4, overallRankCol: -5, headerRows: 10 },
  // CB: ...Ovr.Rank (-5), Season Rank (-4), CB+ (-3), CB+ Grade (-2), [extra (-1)]
  CB: { playerCol: 1, scoreCol: -3, gradeCol: -2, seasonRankCol: -4, overallRankCol: -5, headerRows: 10 },
  // LB: ...Ovr.Rank (-5), Season Rank (-4), LB+ (-3), LB+ Grade (-2), [extra (-1)]
  LB: { playerCol: 2, scoreCol: -3, gradeCol: -2, seasonRankCol: -4, overallRankCol: -5, headerRows: 10 },
  // EDGE: ...Ovr.Rank (-5), Season Rank (-4), EDGE+ (-3), EDGE+ Grade (-2), [extra (-1)]
  EDGE: { playerCol: 1, scoreCol: -3, gradeCol: -2, seasonRankCol: -4, overallRankCol: -5, headerRows: 10 },
  // DT: ...Ovr.Rank (-5), Season Rank (-4), DT+ (-3), DT+ Grade (-2), [extra (-1)]
  DT: { playerCol: 1, scoreCol: -3, gradeCol: -2, seasonRankCol: -4, overallRankCol: -5, headerRows: 10 },
  // OL: ...Ovr.Rank (-12), Season Rank (-11), Season Pos. Rank (-10), OL+ (-9), OL+ Grade (-8), Overall Pos Rank (-7), [empty (-6)], PassBlockCalc (-5), PassBlock (-4), RunBlockCalc (-3), RunBlock (-2), [extra (-1)]
  OL: { playerCol: 3, scoreCol: -9, gradeCol: -8, seasonRankCol: -11, overallRankCol: -12, headerRows: 10 },
  // TE: ...Ovr.Rank (-5), Season Rank (-4), TE+ (-3), TE+ Grade (-2), [extra (-1)]
  TE: { playerCol: 1, scoreCol: -3, gradeCol: -2, seasonRankCol: -4, overallRankCol: -5, headerRows: 10 },
  // WR: ...Ovr.Rank (-9), Name (-8), WR+ (-7), WR+ Grade (-6), Team (-5), Games (-4), Season (-3), Season Rank (-2), [extra (-1)]
  WR: { playerCol: 1, scoreCol: -7, gradeCol: -6, seasonRankCol: -2, overallRankCol: -9, headerRows: 9 },
  // RB: RB+ (col 0), Grade (col 1), player (col 2), ..., Overall Rank (-5), Season Rank (-4), [extra cols]
  RB: { playerCol: 2, scoreCol: 0, gradeCol: 1, seasonRankCol: -4, overallRankCol: -5, headerRows: 10 },
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
  request: NextRequest,
  { params }: { params: Promise<{ playerSlug: string }> }
) {
  try {
    const { playerSlug } = await params;
    const searchParams = request.nextUrl.searchParams;
    const gameLogSeason = searchParams.get('gameLogSeason');

    if (!playerSlug) {
      return NextResponse.json(
        { error: 'Player slug is required' },
        { status: 400 }
      );
    }

    // Use unified roster cache instead of fetching each team individually
    const allRosters = await getAllRosters();

    // Search all team rosters for the player
    let foundPlayer: RosterPlayer | null = null;
    let foundTeamId: string | null = null;

    for (const [teamId, roster] of allRosters) {
      const player = roster.players.find(p => p.slug === playerSlug);
      if (player) {
        foundPlayer = player;
        foundTeamId = teamId;
        break;
      }
    }

    if (!foundPlayer || !foundTeamId) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }

    // Get team info
    const team = teams[foundTeamId];

    // Fetch ESPN athlete ID and PFSN Impact data in parallel (both are independent)
    const seasonParam = gameLogSeason ? parseInt(gameLogSeason) : undefined;
    const [espnAthleteId, pfsnData] = await Promise.all([
      fetchESPNAthleteId(foundTeamId, foundPlayer.name),
      fetchPFSNImpact(),
    ]);

    // Fetch ESPN stats, game log, and career stats in parallel (depend on athlete ID)
    let espnStats: ESPNStats | null = null;
    let espnGameLog: ESPNGameLog | null = null;
    let espnCareerStats: ESPNCareerStats | null = null;
    if (espnAthleteId) {
      const [statsResult, gameLogResult, careerStatsResult] = await Promise.all([
        fetchESPNAthleteStats(espnAthleteId),
        fetchESPNGameLog(espnAthleteId, seasonParam),
        fetchESPNCareerStats(espnAthleteId),
      ]);
      espnStats = statsResult;
      espnGameLog = gameLogResult;
      espnCareerStats = careerStatsResult;
    }

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
      college: espnStats?.college || foundPlayer.college,
      experience: foundPlayer.experience,
      experienceLabel: foundPlayer.experience === 0 ? 'Rookie' : `${foundPlayer.experience} ${foundPlayer.experience === 1 ? 'Year' : 'Years'}`,
      draft: espnStats?.displayDraft || (foundPlayer.draft ? `${foundPlayer.draft.year}: Round ${foundPlayer.draft.round}, Pick ${foundPlayer.draft.pick}` : null),
      birthDate: foundPlayer.birthDate,
      birthPlace: espnStats?.displayBirthPlace ? expandStateAbbreviation(espnStats.displayBirthPlace) : foundPlayer.birthPlace,
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
        availableSeasons: espnCareerStats?.availableSeasons || [],
        statLabels: espnGameLog.statLabels,
        seasonTotals: espnGameLog.seasonTotals,
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

      // Career Stats (season-by-season + totals)
      careerStats: espnCareerStats ? {
        categories: espnCareerStats.categories.map(cat => ({
          name: cat.name,
          displayName: cat.displayName,
          labels: cat.labels,
          names: cat.names,
          displayNames: cat.displayNames,
          seasons: cat.seasons,
          totals: cat.totals,
        })),
        availableSeasons: espnCareerStats.availableSeasons,
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
