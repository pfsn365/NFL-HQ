import { NextRequest, NextResponse } from 'next/server';

interface SportsKeedaPlayer {
  id: number;
  name: string;
  first_name: string;
  last_name: string;
  slug: string;
}

interface SportsKeedaDepthEntry {
  depth: number;
  player: SportsKeedaPlayer;
}

interface SportsKeedaPosition {
  name: string;
  abbreviation: string;
  depth_chart: SportsKeedaDepthEntry[];
}

interface SportsKeedaDepthChartResponse {
  team_id: number;
  team_nickname: string;
  team_location: string;
  team_abbreviation: string;
  team_slug: string;
  season: number;
  positions: SportsKeedaPosition[];
  updated_at: number;
}

interface DepthChartPlayer {
  name: string;
  slug: string;
  depth: number;
  impactScore: number;
}

// Google Sheets configuration for PFSN Impact Grades (same as roster API)
const GOOGLE_SHEETS_CONFIG: Record<string, { spreadsheetId: string; gid: string }> = {
  QB: { spreadsheetId: '17d7EIFBHLChlSoi6vRFArwviQRTJn0P0TOvQUNx8hU8', gid: '1456950409' },
  SAF: { spreadsheetId: '1SKr25H4brSE4dRf7JGpkytwLAKvt4jH-_wlCoqbFPXE', gid: '1216441503' },
  CB: { spreadsheetId: '1fUwD_rShGMrn7ypJyQsy4mCofqP7Q6J0Un8rsGW7h7U', gid: '1146203009' },
  LB: { spreadsheetId: '1mNCbJ8RxNZOSp_DuocR_5C7e_wqfiIPy4Rb9fS7GTBE', gid: '519296058' },
  EDGE: { spreadsheetId: '1RLSAJusOAcjnA1VDROtWFdfKUF4VYUV9JQ6tPinuGAQ', gid: '0' },
  DT: { spreadsheetId: '1N_V-cyIhROKXNatG1F_uPXTyP6BhuoNu_TebgjMQ6YM', gid: '0' },
  OL: { spreadsheetId: '1bKmYM1QyPSsJ9FyPtVZuxV0_HiUBw1o2loyU_55pXKA', gid: '1321084176' },
  TE: { spreadsheetId: '16LsyT1QLP-2ZdG_WNdHjn6ZMrFFu7q13qxDkKyTuseM', gid: '53851653' },
  WR: { spreadsheetId: '1h-HIZVjq1TM8FZ_5FYfxEZ3lPwtw_9ZWeqLzAi0EUIM', gid: '1964031106' },
  RB: { spreadsheetId: '1lXXHd9OzHA6Zp4yW1HZKsIJybLthW7tS93l4y4yCBzE', gid: '0' },
};

const POSITION_COLUMN_MAPPINGS: Record<string, { playerCol: number; scoreCol: number; rankCol: number; headerRows: number }> = {
  QB: { playerCol: 2, scoreCol: 4, rankCol: 1, headerRows: 1 },
  SAF: { playerCol: 1, scoreCol: -3, rankCol: -4, headerRows: 10 },
  CB: { playerCol: 1, scoreCol: -3, rankCol: -4, headerRows: 10 },
  LB: { playerCol: 2, scoreCol: -3, rankCol: -4, headerRows: 10 },
  EDGE: { playerCol: 1, scoreCol: -3, rankCol: -4, headerRows: 10 },
  DT: { playerCol: 1, scoreCol: -3, rankCol: -4, headerRows: 10 },
  OL: { playerCol: 3, scoreCol: -9, rankCol: -11, headerRows: 10 },
  TE: { playerCol: 1, scoreCol: -3, rankCol: -4, headerRows: 10 },
  WR: { playerCol: 1, scoreCol: -7, rankCol: -2, headerRows: 9 },
  RB: { playerCol: 2, scoreCol: 0, rankCol: -4, headerRows: 10 },
};

interface ImpactGrade {
  player: string;
  score: number;
}

let impactGradesCache: Map<string, number> | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 2 * 60 * 60 * 1000; // 2 hours

function normalizePlayerName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '').replace(/(jr|sr|ii|iii|iv)$/g, '');
}

function generateNameVariations(name: string): string[] {
  const normalized = normalizePlayerName(name);
  const variations = [normalized];
  variations.push(normalizePlayerName(name.replace(/\./g, '')));
  variations.push(normalizePlayerName(name.replace(/-/g, ' ')));
  variations.push(normalizePlayerName(name.replace(/\s+(jr\.?|sr\.?|ii|iii|iv|v)$/i, '')));
  return [...new Set(variations)];
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') inQuotes = !inQuotes;
    else if (char === ',' && !inQuotes) { result.push(current); current = ''; }
    else current += char;
  }
  result.push(current);
  return result;
}

async function fetchPositionGrades(position: string): Promise<ImpactGrade[]> {
  try {
    const config = GOOGLE_SHEETS_CONFIG[position];
    const mapping = POSITION_COLUMN_MAPPINGS[position];
    if (!config || !mapping) return [];

    const csvUrl = `https://docs.google.com/spreadsheets/d/${config.spreadsheetId}/export?format=csv&gid=${config.gid}`;
    const response = await fetch(csvUrl, { headers: { 'User-Agent': 'NFL-HQ/1.0' }, next: { revalidate: 86400 } });
    if (!response.ok) return [];

    const csvText = await response.text();
    const lines = csvText.split('\n').filter(line => line.trim());
    const grades: ImpactGrade[] = [];

    for (let i = mapping.headerRows; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (values.length < 3) continue;
      const getCol = (col: number) => col < 0 ? values[values.length + col] : values[col];
      const player = getCol(mapping.playerCol)?.trim() || '';
      const scoreStr = getCol(mapping.scoreCol)?.trim() || '0';
      const rankStr = getCol(mapping.rankCol)?.trim() || '0';
      const score = parseFloat(scoreStr.replace('%', '')) || 0;
      const rank = parseInt(rankStr) || 0;
      if (!player || player.toLowerCase() === 'player' || player.toLowerCase().includes('season')) continue;
      if (score <= 0 && rank <= 0) continue;
      grades.push({ player, score: score > 0 ? score : 50 });
    }
    return grades;
  } catch { return []; }
}

async function getAllImpactGrades(): Promise<Map<string, number>> {
  if (impactGradesCache && Date.now() - cacheTimestamp < CACHE_DURATION) return impactGradesCache;
  const gradesMap = new Map<string, number>();
  const positions = Object.keys(GOOGLE_SHEETS_CONFIG);
  const allGradesResults = await Promise.all(positions.map(pos => fetchPositionGrades(pos)));
  for (const grades of allGradesResults) {
    for (const grade of grades) {
      for (const variant of generateNameVariations(grade.player)) {
        gradesMap.set(variant, grade.score);
      }
    }
  }
  impactGradesCache = gradesMap;
  cacheTimestamp = Date.now();
  return gradesMap;
}

interface DepthChartPosition {
  name: string;
  abbreviation: string;
  players: DepthChartPlayer[];
}

// Team ID to Sportskeeda team ID mapping - Same as schedule API
const teamIdMap: Record<string, number> = {
  'arizona-cardinals': 355,
  'atlanta-falcons': 323,
  'baltimore-ravens': 366,
  'buffalo-bills': 324,
  'carolina-panthers': 364,
  'chicago-bears': 326,
  'cincinnati-bengals': 327,
  'cleveland-browns': 329,
  'dallas-cowboys': 331,
  'denver-broncos': 332,
  'detroit-lions': 334,
  'green-bay-packers': 335,
  'houston-texans': 325,
  'indianapolis-colts': 338,
  'jacksonville-jaguars': 365,
  'kansas-city-chiefs': 339,
  'las-vegas-raiders': 341,
  'los-angeles-chargers': 357,
  'los-angeles-rams': 343,
  'miami-dolphins': 345,
  'minnesota-vikings': 347,
  'new-england-patriots': 348,
  'new-orleans-saints': 350,
  'new-york-giants': 351,
  'new-york-jets': 352,
  'philadelphia-eagles': 354,
  'pittsburgh-steelers': 356,
  'san-francisco-49ers': 359,
  'seattle-seahawks': 361,
  'tampa-bay-buccaneers': 362,
  'tennessee-titans': 336,
  'washington-commanders': 363,
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const { teamId } = await params;

    // Get Sportskeeda team ID
    const sportsKeedaTeamId = teamIdMap[teamId];

    if (!sportsKeedaTeamId) {
      return NextResponse.json(
        { error: 'Team not found or not yet mapped' },
        { status: 404 }
      );
    }

    // Fetch data from Sportskeeda API
    const response = await fetch(
      `https://cf-gotham.sportskeeda.com/taxonomy/sport/nfl/depth-chart/2025?team=${sportsKeedaTeamId}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; NFL-Team-Pages/1.0)',
        },
        next: { revalidate: 86400 } // Cache for 24 hours
      }
    );

    if (!response.ok) {
      throw new Error(`Sportskeeda API error: ${response.status}`);
    }

    const responseData: SportsKeedaDepthChartResponse[] = await response.json();

    if (!responseData || !Array.isArray(responseData) || responseData.length === 0) {
      return NextResponse.json(
        { error: 'No depth chart data found' },
        { status: 404 }
      );
    }

    const data = responseData[0]; // Get the first (and only) team data

    if (!data.positions || !Array.isArray(data.positions)) {
      return NextResponse.json(
        { error: 'No depth chart data found' },
        { status: 404 }
      );
    }

    // Fetch impact grades
    const impactGrades = await getAllImpactGrades();

    // Helper to get player's impact score
    const getPlayerImpactScore = (playerName: string): number => {
      const normalizedName = normalizePlayerName(playerName);
      let score = impactGrades.get(normalizedName) || 0;
      if (!score) {
        for (const variant of generateNameVariations(playerName)) {
          const variantScore = impactGrades.get(variant);
          if (variantScore && variantScore > 0) {
            score = variantScore;
            break;
          }
        }
      }
      return score;
    };

    // Transform the data to our format
    const transformedPositions: DepthChartPosition[] = data.positions.map(position => {
      const players: DepthChartPlayer[] = [];

      // Extract all players with their depth from the depth chart entries
      position.depth_chart.forEach(depthEntry => {
        players.push({
          name: depthEntry.player.name,
          slug: depthEntry.player.slug,
          depth: depthEntry.depth,
          impactScore: getPlayerImpactScore(depthEntry.player.name)
        });
      });

      // Sort players by depth (1 = starter, 2 = backup, etc.)
      players.sort((a, b) => a.depth - b.depth);

      // Normalize position abbreviations for display
      let displayAbbreviation = position.abbreviation;
      switch (position.abbreviation) {
        case 'LOG':
          displayAbbreviation = 'LG';
          break;
        case 'ROG':
          displayAbbreviation = 'RG';
          break;
        case 'LOT':
          displayAbbreviation = 'LT';
          break;
        case 'ROT':
          displayAbbreviation = 'RT';
          break;
      }

      return {
        name: position.name,
        abbreviation: displayAbbreviation,
        players
      };
    });

    // Group positions by category for easier frontend consumption
    const groupedPositions = {
      offense: transformedPositions.filter(pos => {
        const name = pos.name.toLowerCase();
        const abbr = pos.abbreviation.toLowerCase();
        return name.includes('quarterback') ||
               name.includes('running back') ||
               name.startsWith('wr') || name.includes('wide receiver') ||
               name.includes('tight end') ||
               name.includes('fullback') ||
               (name.includes('tackle') && name.includes('offensive')) ||
               (name.includes('guard') && name.includes('offensive')) ||
               name.includes('center') ||
               abbr === 'qb' || abbr === 'rb' || abbr === 'rb2' || abbr === 'te' || abbr === 'te2' || abbr === 'fb' ||
               abbr.startsWith('wr') ||
               abbr === 'c' || abbr === 'log' || abbr === 'rog' ||
               abbr === 'lot' || abbr === 'rot';
      }),
      defense: transformedPositions.filter(pos => {
        const name = pos.name.toLowerCase();
        const abbr = pos.abbreviation.toLowerCase();
        return name.includes('nose tackle') ||
               name.includes('defensive end') ||
               name.includes('linebacker') ||
               name.includes('cornerback') ||
               name.includes('safety') ||
               name.includes('defensive tackle') ||
               abbr === 'nt' || abbr === 'lde' || abbr === 'rde' ||
               abbr.includes('olb') || abbr.includes('ilb') ||
               abbr.includes('cb') || abbr === 'fs' || abbr === 'ss';
      }),
      specialTeams: transformedPositions.filter(pos => {
        const name = pos.name.toLowerCase();
        const abbr = pos.abbreviation.toLowerCase();
        return name.includes('punter') ||
               name.includes('kicker') ||
               name.includes('k-') ||
               name.includes('long snapper') ||
               name.includes('holder') ||
               name === 'h' ||
               name.includes('punt returner') ||
               name.includes('kick returner') ||
               abbr === 'p' || abbr === 'k-fg' || abbr === 'k-ko' ||
               abbr === 'ls' || abbr === 'h' ||
               abbr === 'pr' || abbr === 'kr';
      })
    };

    // Define position ordering
    const offenseOrder = ['QB', 'RB', 'WR1', 'WR2', 'WR3', 'FB', 'TE2', 'TE', 'LT', 'LG', 'C', 'RG', 'RT'];
    const defenseOrder = ['NT', 'LDT', 'RDT', 'DT', 'LDE', 'RDE', 'DE', 'LOLB', 'ROLB', 'LLB', 'RLB', 'SLB', 'WLB', 'LILB', 'RILB', 'MLB', 'LCB', 'RCB', 'FS', 'SS'];
    const specialTeamsOrder = ['LS', 'H', 'K-FG', 'K-KO', 'P', 'KR', 'PR'];

    // Helper function to sort positions by defined order
    const sortByOrder = (positions: DepthChartPosition[], order: string[]) => {
      return positions.sort((a, b) => {
        const aIndex = order.indexOf(a.abbreviation);
        const bIndex = order.indexOf(b.abbreviation);

        // If position not in order, put it at the end
        if (aIndex === -1 && bIndex === -1) return 0;
        if (aIndex === -1) return 1;
        if (bIndex === -1) return -1;

        return aIndex - bIndex;
      });
    };

    // Sort and take the positions each team actually has
    const orderedPositions = {
      offense: sortByOrder(groupedPositions.offense, offenseOrder).slice(0, 11),
      defense: sortByOrder(groupedPositions.defense, defenseOrder).slice(0, 11),
      specialTeams: sortByOrder(groupedPositions.specialTeams, specialTeamsOrder)
    };

    return NextResponse.json({
      teamId,
      positions: orderedPositions,
      allPositions: transformedPositions,
      totalPositions: transformedPositions.length,
      lastUpdated: new Date().toISOString(),
      season: data.season
    });

  } catch (error) {
    console.error('Depth Chart API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch depth chart data' },
      { status: 500 }
    );
  }
}