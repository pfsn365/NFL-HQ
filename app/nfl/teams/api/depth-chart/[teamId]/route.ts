import { NextRequest, NextResponse } from 'next/server';

// --- ESPN API Types ---

interface ESPNAthlete {
  id: string;
  uid: string;
  guid: string;
  displayName: string;
  shortName: string;
  links: { href: string; rel: string[] }[];
  injuries: { status: string; date: string; type: { abbreviation: string } }[];
}

interface ESPNPositionEntry {
  position: {
    id: string;
    name: string;
    displayName: string;
    abbreviation: string;
    leaf: boolean;
    parent?: { abbreviation: string };
  };
  athletes: ESPNAthlete[];
}

interface ESPNFormation {
  id: string;
  name: string;
  positions: Record<string, ESPNPositionEntry>;
}

interface ESPNDepthChartResponse {
  timestamp: string;
  status: string;
  season: { year: number; type: number; name: string };
  team: { id: string; abbreviation: string; location: string; name: string };
  depthchart: ESPNFormation[];
}

// --- Output Types ---

interface DepthChartPlayer {
  name: string;
  slug: string;
  depth: number;
  impactScore: number;
}

interface DepthChartPosition {
  name: string;
  abbreviation: string;
  players: DepthChartPlayer[];
}

// --- ESPN Team ID Mapping (team slug → ESPN numeric ID) ---

const espnTeamIdMap: Record<string, number> = {
  'arizona-cardinals': 22,
  'atlanta-falcons': 1,
  'baltimore-ravens': 33,
  'buffalo-bills': 2,
  'carolina-panthers': 29,
  'chicago-bears': 3,
  'cincinnati-bengals': 4,
  'cleveland-browns': 5,
  'dallas-cowboys': 6,
  'denver-broncos': 7,
  'detroit-lions': 8,
  'green-bay-packers': 9,
  'houston-texans': 34,
  'indianapolis-colts': 11,
  'jacksonville-jaguars': 30,
  'kansas-city-chiefs': 12,
  'las-vegas-raiders': 13,
  'los-angeles-chargers': 24,
  'los-angeles-rams': 14,
  'miami-dolphins': 15,
  'minnesota-vikings': 16,
  'new-england-patriots': 17,
  'new-orleans-saints': 18,
  'new-york-giants': 19,
  'new-york-jets': 20,
  'philadelphia-eagles': 21,
  'pittsburgh-steelers': 23,
  'san-francisco-49ers': 25,
  'seattle-seahawks': 26,
  'tampa-bay-buccaneers': 27,
  'tennessee-titans': 10,
  'washington-commanders': 28,
};

// --- PFSN Impact Grades (Google Sheets) ---

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

// --- Helpers ---

/** Extract player slug from ESPN link URL (e.g. "kirk-cousins" from ".../id/14880/kirk-cousins") */
function extractSlugFromESPN(athlete: ESPNAthlete): string {
  if (athlete.links && athlete.links.length > 0) {
    const href = athlete.links[0].href;
    const match = href.match(/\/id\/\d+\/(.+)$/);
    if (match) return match[1];
  }
  // Fallback: generate slug from display name
  return athlete.displayName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function getPlayerImpactScore(playerName: string, impactGrades: Map<string, number>): number {
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
}

/** Map ESPN formation name to our category */
function classifyFormation(name: string): 'offense' | 'defense' | 'specialTeams' {
  const lower = name.toLowerCase();
  if (lower.includes('special')) return 'specialTeams';
  if (lower.includes('wr') || lower.includes('te') || lower.includes('rb') || lower.includes('offense') || lower.includes('shotgun') || lower.includes('pistol') || lower.includes('i-form') || lower.includes('singleback')) return 'offense';
  return 'defense';
}

// --- Position display normalization ---

/** Normalize ESPN position key to display abbreviation */
function normalizeAbbreviation(key: string, posEntry: ESPNPositionEntry): string {
  const abbr = posEntry.position.abbreviation;
  const keyUpper = key.toUpperCase();

  // ESPN uses lowercase keys like 'wr1', 'wr2' etc. — preserve the number suffix
  if (/^wr\d$/i.test(key)) return keyUpper;

  // Map common ESPN keys
  switch (keyUpper) {
    case 'PK': return 'K';
    default: return abbr || keyUpper;
  }
}

// Position ordering
const offenseOrder = ['QB', 'RB', 'FB', 'WR1', 'WR2', 'WR3', 'TE', 'LT', 'LG', 'C', 'RG', 'RT'];
const defenseOrder = ['LDE', 'NT', 'RDE', 'LDT', 'RDT', 'DT', 'DE', 'WLB', 'LILB', 'RILB', 'SLB', 'LOLB', 'ROLB', 'MLB', 'LLB', 'RLB', 'LCB', 'RCB', 'NB', 'FS', 'SS'];
const specialTeamsOrder = ['K', 'P', 'LS', 'H', 'KR', 'PR'];

function sortByOrder(positions: DepthChartPosition[], order: string[]) {
  return positions.sort((a, b) => {
    const aIndex = order.indexOf(a.abbreviation);
    const bIndex = order.indexOf(b.abbreviation);
    if (aIndex === -1 && bIndex === -1) return 0;
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });
}

// --- Main handler ---

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const { teamId } = await params;

    const espnId = espnTeamIdMap[teamId];
    if (!espnId) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Fetch ESPN depth chart and PFSN impact grades in parallel
    const [espnResponse, impactGrades] = await Promise.all([
      fetch(
        `https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/${espnId}/depthcharts`,
        { next: { revalidate: 86400 } } // Cache for 24 hours
      ),
      getAllImpactGrades()
    ]);

    if (!espnResponse.ok) {
      throw new Error(`ESPN API error: ${espnResponse.status}`);
    }

    const espnData: ESPNDepthChartResponse = await espnResponse.json();
    const formations = espnData.depthchart;

    if (!formations || !Array.isArray(formations) || formations.length === 0) {
      return NextResponse.json({ error: 'No depth chart data found' }, { status: 404 });
    }

    // Pick the best formation for each category
    // ESPN returns separate formations for offense, defense, special teams
    const grouped: { offense: DepthChartPosition[]; defense: DepthChartPosition[]; specialTeams: DepthChartPosition[] } = {
      offense: [],
      defense: [],
      specialTeams: [],
    };

    const allPositions: DepthChartPosition[] = [];

    for (const formation of formations) {
      const category = classifyFormation(formation.name);
      const positions = formation.positions;

      for (const [key, posEntry] of Object.entries(positions)) {
        const abbreviation = normalizeAbbreviation(key, posEntry);
        const players: DepthChartPlayer[] = posEntry.athletes.map((athlete, index) => ({
          name: athlete.displayName,
          slug: extractSlugFromESPN(athlete),
          depth: index + 1, // ESPN array order = depth
          impactScore: getPlayerImpactScore(athlete.displayName, impactGrades),
        }));

        const position: DepthChartPosition = {
          name: posEntry.position.displayName,
          abbreviation,
          players,
        };

        grouped[category].push(position);
        allPositions.push(position);
      }
    }

    // Sort and limit
    const orderedPositions = {
      offense: sortByOrder(grouped.offense, offenseOrder).slice(0, 12),
      defense: sortByOrder(grouped.defense, defenseOrder).slice(0, 12),
      specialTeams: sortByOrder(grouped.specialTeams, specialTeamsOrder),
    };

    return NextResponse.json({
      teamId,
      positions: orderedPositions,
      allPositions,
      totalPositions: allPositions.length,
      lastUpdated: new Date().toISOString(),
      season: espnData.season?.year ?? 2026,
    });

  } catch (error) {
    console.error('Depth Chart API error:', error);
    return NextResponse.json({ error: 'Failed to fetch depth chart data' }, { status: 500 });
  }
}
