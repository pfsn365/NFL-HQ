import { NextRequest, NextResponse } from 'next/server';

interface SalaryCapTeamData {
  cap_space: string;
  salary_cap_current_year: string;
  active_cap_spend: string;
  dead_money: string;
}

interface SalaryCapPlayer {
  player_name: string;
  player_slug: string;
  cut_pre: {
    dead_money: string;
    cap_saving: string;
  };
  cut_post: {
    dead_money: string;
    cap_saving: string;
  };
  trade_pre: {
    dead_money: string;
    cap_saving: string;
  };
  trade_post: {
    dead_money: string;
    cap_saving: string;
  };
  restructure_cap_saving: string;
  extension_cap_saving: string;
  cap_number: string;
  base_salary: string;
  signing_bonus: string;
  option_bonus: string;
  roster_bonus: string;
  pre_game_bonus: string;
  workout_bonus: string;
  other_bonus: string;
  guaranteed: string;
}

interface SportsKeedaStructuredResponse {
  salary_cap_for_team: SalaryCapTeamData;
  salary_cap_for_players: SalaryCapPlayer[];
}

interface TransformedPlayer {
  name: string;
  slug: string;
  capHit: number;
  baseSalary: number;
  signingBonus: number;
  guaranteed: number;
  restructureCapSaving: number;
  extensionCapSaving: number;
  cutDeadMoney: number;
  cutSaving: number;
  tradeDeadMoney: number;
  tradeSaving: number;
}

interface TeamSummary {
  capSpace: number;
  salaryCap: number;
  activeCapSpend: number;
  deadMoney: number;
}

// Team ID to Sportskeeda abbreviation mapping
const teamIdMap: Record<string, string> = {
  'arizona-cardinals': 'ari',
  'atlanta-falcons': 'atl',
  'baltimore-ravens': 'bal',
  'buffalo-bills': 'buf',
  'carolina-panthers': 'car',
  'chicago-bears': 'chi',
  'cincinnati-bengals': 'cin',
  'cleveland-browns': 'cle',
  'dallas-cowboys': 'dal',
  'denver-broncos': 'den',
  'detroit-lions': 'det',
  'green-bay-packers': 'gb',
  'houston-texans': 'hou',
  'indianapolis-colts': 'ind',
  'jacksonville-jaguars': 'jax',
  'kansas-city-chiefs': 'kc',
  'las-vegas-raiders': 'lv',
  'los-angeles-chargers': 'lac',
  'los-angeles-rams': 'lar',
  'miami-dolphins': 'mia',
  'minnesota-vikings': 'min',
  'new-england-patriots': 'ne',
  'new-orleans-saints': 'no',
  'new-york-giants': 'nyg',
  'new-york-jets': 'nyj',
  'philadelphia-eagles': 'phi',
  'pittsburgh-steelers': 'pit',
  'san-francisco-49ers': 'sf',
  'seattle-seahawks': 'sea',
  'tampa-bay-buccaneers': 'tb',
  'tennessee-titans': 'ten',
  'washington-commanders': 'was',
};

// Helper function to parse currency strings
function parseCurrency(value: string): number {
  if (!value) return 0;
  // Handle negative values in parentheses like (1,234)
  const cleaned = value.replace(/[$,\s]/g, '').replace(/\((.+)\)/, '-$1');
  return parseFloat(cleaned) || 0;
}

// Fetch team summary from the bulk all-teams endpoint
async function fetchTeamSummaryFromBulk(teamId: string): Promise<TeamSummary | null> {
  try {
    const response = await fetch(
      'https://statics.sportskeeda.com/assets/sheets/tools/salary-caps/salaryCaps.json?v=2',
      {
        headers: { 'User-Agent': 'PFN-Internal-NON-Blocking' },
        next: { revalidate: 3600 },
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    const sheet = data.collections?.find((c: { sheetName: string }) => c.sheetName === 'salary_caps');
    if (!sheet?.data) return null;

    // Find the team row by slug (column 2)
    const teamRow = sheet.data.slice(1).find((row: string[]) => row[2] === teamId);
    if (!teamRow) return null;

    return {
      capSpace: parseCurrency(teamRow[3]),
      salaryCap: parseCurrency(teamRow[4]),
      activeCapSpend: parseCurrency(teamRow[5]),
      deadMoney: parseCurrency(teamRow[6]),
    };
  } catch (error) {
    console.error('Error fetching bulk salary cap data:', error);
    return null;
  }
}

// Parse array format response into players
// Array columns: [0]=Player, [1]=Slug, [2]=Cap Number, [3]=Base Salary, [4]=Signing Bonus,
// [5]=Option Bonus, [6]=Roster Bonus, [7]=Per-Game Bonus, [8]=Workout Bonus, [9]=Other Bonus,
// [10]=Guaranteed, [11]=Cut Pre Dead Money, [12]=Cut Pre Cap Saving,
// [13]=Cut Post Dead Money, [14]=Cut Post Cap Saving,
// [15]=Trade Pre Dead Money, [16]=Trade Pre Cap Saving,
// [17]=Trade Post Dead Money, [18]=Trade Post Cap Saving,
// [19]=Restructure Cap Saving, [20]=Extension Cap Saving
function parseArrayFormat(data: string[][]): TransformedPlayer[] {
  // Skip header rows (row 0 is display headers, row 1 is column headers)
  // Player data starts at row 2
  return data.slice(2)
    .filter(row => row[0] && row[0].trim() !== '' && row[2] && row[2].trim() !== '')
    .map(row => ({
      name: row[0],
      slug: row[1] || '',
      capHit: parseCurrency(row[2]),
      baseSalary: parseCurrency(row[3]),
      signingBonus: parseCurrency(row[4]),
      guaranteed: parseCurrency(row[10]),
      restructureCapSaving: parseCurrency(row[19]),
      extensionCapSaving: parseCurrency(row[20]),
      cutDeadMoney: parseCurrency(row[13]),
      cutSaving: parseCurrency(row[14]),
      tradeDeadMoney: parseCurrency(row[17]),
      tradeSaving: parseCurrency(row[18]),
    }));
}

// Parse structured format response into players
function parseStructuredFormat(data: SportsKeedaStructuredResponse): {
  teamSummary: TeamSummary;
  players: TransformedPlayer[];
} {
  const teamSummary = {
    capSpace: parseCurrency(data.salary_cap_for_team.cap_space),
    salaryCap: parseCurrency(data.salary_cap_for_team.salary_cap_current_year),
    activeCapSpend: parseCurrency(data.salary_cap_for_team.active_cap_spend),
    deadMoney: parseCurrency(data.salary_cap_for_team.dead_money),
  };

  const players: TransformedPlayer[] = data.salary_cap_for_players.map(player => ({
    name: player.player_name,
    slug: player.player_slug,
    capHit: parseCurrency(player.cap_number),
    baseSalary: parseCurrency(player.base_salary),
    signingBonus: parseCurrency(player.signing_bonus),
    guaranteed: parseCurrency(player.guaranteed),
    restructureCapSaving: parseCurrency(player.restructure_cap_saving),
    extensionCapSaving: parseCurrency(player.extension_cap_saving),
    cutDeadMoney: parseCurrency(player.cut_post.dead_money),
    cutSaving: parseCurrency(player.cut_post.cap_saving),
    tradeDeadMoney: parseCurrency(player.trade_post.dead_money),
    tradeSaving: parseCurrency(player.trade_post.cap_saving),
  }));

  return { teamSummary, players };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const { teamId } = await params;

    // Get Sportskeeda team abbreviation
    const teamAbbr = teamIdMap[teamId];

    if (!teamAbbr) {
      return NextResponse.json(
        { error: 'Team not found or not yet mapped' },
        { status: 404 }
      );
    }

    // Fetch from Sportskeeda individual team endpoint
    const response = await fetch(
      `https://statics.sportskeeda.com/assets/sheets/static/nfl/team/subpage/salary-cap/${teamAbbr}.json?v=2`,
      {
        headers: { 'User-Agent': 'PFN-Internal-NON-Blocking' },
        next: { revalidate: 3600 },
      }
    );

    if (!response.ok) {
      throw new Error(`Sportskeeda API error: ${response.status}`);
    }

    const rawData = await response.json();

    let teamSummary: TeamSummary;
    let players: TransformedPlayer[];

    if (Array.isArray(rawData)) {
      // Array format - parse players from array, get summary from bulk endpoint
      players = parseArrayFormat(rawData);

      const bulkSummary = await fetchTeamSummaryFromBulk(teamId);
      if (!bulkSummary) {
        throw new Error('Failed to fetch team summary from bulk endpoint');
      }
      teamSummary = bulkSummary;
    } else if (rawData.salary_cap_for_team && rawData.salary_cap_for_players) {
      // Structured format - parse both from the same response
      const parsed = parseStructuredFormat(rawData);
      teamSummary = parsed.teamSummary;
      players = parsed.players;
    } else {
      throw new Error('Unrecognized salary cap data format');
    }

    // Sort players by cap hit (descending)
    players.sort((a, b) => b.capHit - a.capHit);

    return NextResponse.json({
      teamId,
      salaryCapData: { teamSummary, players },
      totalPlayers: players.length,
      lastUpdated: new Date().toISOString(),
      season: 2025,
    });

  } catch (error) {
    console.error('Salary Cap API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch salary cap data' },
      { status: 500 }
    );
  }
}
