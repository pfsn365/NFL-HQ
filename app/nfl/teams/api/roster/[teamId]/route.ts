import { NextRequest, NextResponse } from 'next/server';

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

// Column mappings for each position sheet (must match player API)
const POSITION_COLUMN_MAPPINGS: Record<string, {
  playerCol: number;
  scoreCol: number;
  rankCol: number; // Used to validate rows
  headerRows: number;
}> = {
  // QB: Season, Rank, Player, Grade, Score, OVR. Rank
  QB: { playerCol: 2, scoreCol: 4, rankCol: 1, headerRows: 1 },
  // SAF: columns from end: -4=Ovr.Rank, -3=SeasonRank, -2=SAF+, -1=Grade
  SAF: { playerCol: 1, scoreCol: -2, rankCol: -3, headerRows: 10 },
  // CB: columns from end: -4=Ovr.Rank, -3=SeasonRank, -2=CB+, -1=Grade
  CB: { playerCol: 1, scoreCol: -2, rankCol: -3, headerRows: 10 },
  // LB: columns from end: -4=Ovr.Rank, -3=SeasonRank, -2=LB+, -1=Grade
  LB: { playerCol: 2, scoreCol: -2, rankCol: -3, headerRows: 10 },
  // EDGE: columns from end: -4=Ovr.Rank, -3=SeasonRank, -2=EDGE+, -1=Grade
  EDGE: { playerCol: 1, scoreCol: -2, rankCol: -3, headerRows: 10 },
  // DT: columns from end: -4=Ovr.Rank, -3=SeasonRank, -2=DT+, -1=Grade
  DT: { playerCol: 1, scoreCol: -2, rankCol: -3, headerRows: 10 },
  // OL: columns from end: -5=Ovr.Rank, -4=SeasonRank, -3=SeasonPosRank, -2=OL+, -1=Grade
  OL: { playerCol: 3, scoreCol: -2, rankCol: -4, headerRows: 10 },
  // TE: columns from end: -4=Ovr.Rank, -3=SeasonRank, -2=TE+, -1=Grade
  TE: { playerCol: 1, scoreCol: -2, rankCol: -3, headerRows: 10 },
  // WR: columns from end: -8=Ovr.Rank, -6=WR+, -5=Grade, -1=SeasonRank
  WR: { playerCol: 1, scoreCol: -6, rankCol: -1, headerRows: 10 },
  // RB: col 0=RB+, col 1=Grade, col 2=Player, from end: -3=OverallRank, -1=SeasonRank
  RB: { playerCol: 2, scoreCol: 0, rankCol: -1, headerRows: 10 },
};

// Position to sheet mapping
const POSITION_TO_SHEET: Record<string, string> = {
  'QB': 'QB', 'RB': 'RB', 'FB': 'RB', 'WR': 'WR', 'TE': 'TE',
  'OT': 'OL', 'OG': 'OL', 'OC': 'OL', 'C': 'OL', 'G': 'OL', 'T': 'OL', 'OL': 'OL',
  'DT': 'DT', 'NT': 'DT', 'DE': 'EDGE', 'EDGE': 'EDGE', 'OLB': 'EDGE',
  'LB': 'LB', 'ILB': 'LB', 'MLB': 'LB', 'CB': 'CB',
  'S': 'SAF', 'FS': 'SAF', 'SS': 'SAF', 'SAF': 'SAF', 'DB': 'CB',
};

interface ImpactGrade {
  player: string;
  score: number;
}

// Cache for impact grades
let impactGradesCache: Map<string, number> | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

function normalizePlayerName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .replace(/(jr|sr|ii|iii|iv)$/g, '');
}

// Generate multiple name variations for better matching
function generateNameVariations(name: string): string[] {
  const normalized = normalizePlayerName(name);
  const variations = [normalized];

  // Handle names with initials like "A.J. Brown" -> "ajbrown" or "aj-brown"
  const withoutPeriods = name.replace(/\./g, '');
  variations.push(normalizePlayerName(withoutPeriods));

  // Handle hyphenated names
  const withoutHyphens = name.replace(/-/g, ' ');
  variations.push(normalizePlayerName(withoutHyphens));

  // Handle "Jr." and other suffixes more aggressively
  const withoutSuffix = name.replace(/\s+(jr\.?|sr\.?|ii|iii|iv|v)$/i, '');
  variations.push(normalizePlayerName(withoutSuffix));

  return [...new Set(variations)];
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

async function fetchPositionGrades(position: string): Promise<ImpactGrade[]> {
  try {
    const config = GOOGLE_SHEETS_CONFIG[position];
    if (!config) return [];

    const mapping = POSITION_COLUMN_MAPPINGS[position];
    if (!mapping) return [];

    const csvUrl = `https://docs.google.com/spreadsheets/d/${config.spreadsheetId}/export?format=csv&gid=${config.gid}`;

    const response = await fetch(csvUrl, {
      headers: { 'User-Agent': 'NFL-HQ/1.0' },
      next: { revalidate: 86400 },
    });

    if (!response.ok) {
      console.error(`Failed to fetch ${position} grades: ${response.status}`);
      return [];
    }

    const csvText = await response.text();
    const lines = csvText.split('\n').filter(line => line.trim());
    const grades: ImpactGrade[] = [];

    for (let i = mapping.headerRows; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (values.length < 3) continue; // Relaxed from 5 to 3

      const getCol = (col: number) => col < 0 ? values[values.length + col] : values[col];

      const player = getCol(mapping.playerCol)?.trim() || '';
      const scoreStr = getCol(mapping.scoreCol)?.trim() || '0';
      const rankStr = getCol(mapping.rankCol)?.trim() || '0';

      // Parse score (remove % if present)
      const score = parseFloat(scoreStr.replace('%', '')) || 0;
      const rank = parseInt(rankStr) || 0;

      // Skip header rows and invalid data
      if (!player || player.toLowerCase() === 'player' || player.toLowerCase().includes('season')) continue;

      // Accept row if score > 0 OR rank > 0 (more lenient)
      if (score <= 0 && rank <= 0) continue;

      grades.push({ player, score: score > 0 ? score : 50 }); // Default to 50 if only rank exists
    }

    return grades;
  } catch (error) {
    console.error(`Error fetching ${position} grades:`, error);
    return [];
  }
}

async function getAllImpactGrades(): Promise<Map<string, number>> {
  // Return cached data if still valid
  if (impactGradesCache && Date.now() - cacheTimestamp < CACHE_DURATION) {
    return impactGradesCache;
  }

  const gradesMap = new Map<string, number>();

  // Fetch all position grades in parallel
  const positions = Object.keys(GOOGLE_SHEETS_CONFIG);
  const allGradesResults = await Promise.all(
    positions.map(pos => fetchPositionGrades(pos))
  );

  // Combine all grades into map with multiple name variations
  for (const grades of allGradesResults) {
    for (const grade of grades) {
      // Store under all name variations for better matching
      const variations = generateNameVariations(grade.player);
      for (const variant of variations) {
        gradesMap.set(variant, grade.score);
      }
    }
  }

  // Update cache
  impactGradesCache = gradesMap;
  cacheTimestamp = Date.now();

  return gradesMap;
}

interface SportsKeedaPlayer {
  name: string;
  slug: string;
  jersey_no: string;
  is_active: boolean;
  is_suspended: boolean;
  is_injured: boolean;
  is_physically_unable: boolean;
  is_practice_squad: boolean;
  is_non_football_injury_reserve: boolean;
  is_exempt: boolean;
  provider_id: number;
  height_in_inch: number;
  height_in_cm: number;
  weight_in_lbs: number;
  weight_in_kg: number;
  college: string;
  college_id: number;
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
  height: string;
  weight: string;
  positions: Array<{
    name: string;
    abbreviation: string;
  }>;
  league: string;
  league_abbr: string;
  sk_name: string;
}

interface SportsKeedaResponse {
  squad: SportsKeedaPlayer[];
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const { teamId } = await params;

    // Get Sportskeeda slug for the team
    const sportsKeedaSlug = teamSlugMap[teamId];

    if (!sportsKeedaSlug) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    // Fetch data from Sportskeeda API (include=squad is required to get roster data)
    const response = await fetch(
      `https://api.sportskeeda.com/v1/taxonomy/${sportsKeedaSlug}?include=squad`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; NFL-HQ/1.0)',
        },
        next: { revalidate: 86400 } // Cache for 24 hours
      }
    );

    if (!response.ok) {
      throw new Error(`Sportskeeda API error: ${response.status}`);
    }

    const data: SportsKeedaResponse = await response.json();

    if (!data.squad || !Array.isArray(data.squad)) {
      return NextResponse.json(
        { error: 'No roster data found' },
        { status: 404 }
      );
    }

    // Fetch all impact grades from Google Sheets
    const impactGrades = await getAllImpactGrades();

    // Transform the data to our format
    const transformedRoster = data.squad
      .map(player => {
        // Try multiple name variations to find a match
        const nameVariations = generateNameVariations(player.name);
        let impactScore = 0;
        for (const variant of nameVariations) {
          const score = impactGrades.get(variant);
          if (score && score > 0) {
            impactScore = score;
            break;
          }
        }

        return {
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
          impactPlus: impactScore, // Real PFSN Impact grade from Google Sheets
          isActive: player.is_active,
          isInjured: player.is_injured,
          isSuspended: player.is_suspended,
          isPracticeSquad: player.is_practice_squad,
          isPhysicallyUnable: player.is_physically_unable,
          isNonFootballInjuryReserve: player.is_non_football_injury_reserve,
          isExempt: player.is_exempt,
          status: getPlayerStatus(player),
          draft: player.draft.year > 0 ? {
            year: player.draft.year,
            round: player.draft.round,
            pick: player.draft.overallPickNumber
          } : null,
          birthDate: player.birth_date,
          birthPlace: player.birth_place
        };
      })
      .sort((a, b) => a.jerseyNumber - b.jerseyNumber); // Sort by jersey number

    // Organize players by status
    const activeRoster = transformedRoster.filter(player => player.status === 'Active');
    const practiceSquad = transformedRoster.filter(player => player.status === 'Practice Squad');
    const injuredReserve = transformedRoster.filter(player => player.status === 'Injured Reserve');
    const physicallyUnableToPerform = transformedRoster.filter(player => player.status === 'Physically Unable to Perform');
    const nonFootballInjuryReserve = transformedRoster.filter(player => player.status === 'Non-Football Injury Reserve');
    const suspended = transformedRoster.filter(player => player.status === 'Suspended');
    const exempt = transformedRoster.filter(player => player.status === 'Exempt');

    return NextResponse.json({
      teamId,
      roster: {
        activeRoster,
        practiceSquad,
        injuredReserve,
        physicallyUnableToPerform,
        nonFootballInjuryReserve,
        suspended,
        exempt
      },
      totalPlayers: transformedRoster.length,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Roster API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch roster data' },
      { status: 500 }
    );
  }
}

function formatHeight(heightInInches: number): string {
  if (!heightInInches) return 'N/A';
  const feet = Math.floor(heightInInches / 12);
  const inches = heightInInches % 12;
  return `${feet}'${inches}"`;
}

function getPlayerStatus(player: SportsKeedaPlayer): string {
  // Priority order for status determination
  if (player.is_suspended) return 'Suspended';
  if (player.is_exempt) return 'Exempt';
  if (player.is_injured) return 'Injured Reserve';
  if (player.is_physically_unable) return 'Physically Unable to Perform';
  if (player.is_non_football_injury_reserve) return 'Non-Football Injury Reserve';
  if (player.is_practice_squad) return 'Practice Squad';
  if (player.is_active) return 'Active';

  // Default fallback
  return 'Active';
}

// Suppress unused warning - kept for reference
void POSITION_TO_SHEET;