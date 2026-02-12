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

interface SportsKeedaSalaryCapResponse {
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

interface TransformedSalaryCapData {
  teamSummary: {
    capSpace: number;
    salaryCap: number;
    activeCapSpend: number;
    deadMoney: number;
  };
  players: TransformedPlayer[];
}

// Map team IDs to PFSN display names
const teamIdToPFSNName: Record<string, string> = {
  'san-francisco-49ers': 'San Francisco 49ers',
  'seattle-seahawks': 'Seattle Seahawks',
};

// Function to scrape salary cap data from PFSN as fallback
async function scrapePFSNSalaryCapData(teamId: string): Promise<{
  capSpace: number;
  salaryCap: number;
  activeCapSpend: number;
  deadMoney: number;
} | null> {
  try {
    const pfsnTeamName = teamIdToPFSNName[teamId];
    if (!pfsnTeamName) {
      return null;
    }

    const response = await fetch(
      'https://www.profootballnetwork.com/nfl-salary-cap-space-by-team',
      {
        headers: {
          'User-Agent': 'PFN-Internal-NON-Blocking',
        },
        next: { revalidate: 86400 } // Cache for 24 hours
      }
    );

    if (!response.ok) {
      throw new Error(`PFSN fetch error: ${response.status}`);
    }

    const html = await response.text();

    // Parse the HTML to find the team's row
    // Format: <tr data-team=San Francisco 49ers data-cap-space=$37,135,702 data-salary-cap=$315,417,966 data-active-cap=$256,418,523 data-dead-money=$21,863,741>
    const teamRowMatch = html.match(
      new RegExp(`<tr data-team=${pfsnTeamName}[^>]*data-cap-space=\\$([0-9,]+)[^>]*data-salary-cap=\\$([0-9,]+)[^>]*data-active-cap=\\$([0-9,]+)[^>]*data-dead-money=\\$([0-9,]+)`, 'i')
    );

    if (!teamRowMatch) {
      console.error(`Could not find salary cap data for ${pfsnTeamName} in PFSN HTML`);
      return null;
    }

    // Parse the captured values
    const capSpace = parseFloat(teamRowMatch[1].replace(/,/g, ''));
    const salaryCap = parseFloat(teamRowMatch[2].replace(/,/g, ''));
    const activeCapSpend = parseFloat(teamRowMatch[3].replace(/,/g, ''));
    const deadMoney = parseFloat(teamRowMatch[4].replace(/,/g, ''));

    return {
      capSpace,
      salaryCap,
      activeCapSpend,
      deadMoney,
    };
  } catch (error) {
    console.error(`Error scraping PFSN data for ${teamId}:`, error);
    return null;
  }
}

// Team ID to Sportskeeda abbreviation mapping - same as draft picks
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
  return parseFloat(value.replace(/[,$]/g, '')); // Keep as full dollar amounts
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

    // Try Sportskeeda API first
    let useFallback = false;
    let response: Response | null = null;

    try {
      response = await fetch(
        `https://statics.sportskeeda.com/assets/sheets/static/nfl/team/subpage/salary-cap/${teamAbbr}.json`,
        {
          headers: {
            'User-Agent': 'PFN-Internal-NON-Blocking',
          },
          next: { revalidate: 86400 } // Cache for 24 hours
        }
      );

      if (!response.ok) {
        useFallback = true;
      }
    } catch (error) {
      console.error(`Sportskeeda API error for ${teamId}:`, error);
      useFallback = true;
    }

    // If Sportskeeda fails, try PFSN scraper for specific teams
    if (useFallback && teamIdToPFSNName[teamId]) {
      const pfsnData = await scrapePFSNSalaryCapData(teamId);

      if (pfsnData) {
        return NextResponse.json({
          teamId,
          salaryCapData: {
            teamSummary: pfsnData,
            players: [], // No player-level data from PFSN
          },
          totalPlayers: 0,
          lastUpdated: new Date().toISOString(),
          season: 2025,
          source: 'pfsn', // Indicate this is from PFSN
        });
      }
    }

    // If we got here and useFallback is true or response is null, we couldn't get data
    if (useFallback || !response) {
      throw new Error(`Failed to fetch salary cap data from all sources`);
    }

    const data: SportsKeedaSalaryCapResponse = await response.json();

    if (!data.salary_cap_for_team || !data.salary_cap_for_players) {
      return NextResponse.json(
        { error: 'No salary cap data found' },
        { status: 404 }
      );
    }

    // Transform team summary data
    const teamSummary = {
      capSpace: parseCurrency(data.salary_cap_for_team.cap_space),
      salaryCap: parseCurrency(data.salary_cap_for_team.salary_cap_current_year),
      activeCapSpend: parseCurrency(data.salary_cap_for_team.active_cap_spend),
      deadMoney: parseCurrency(data.salary_cap_for_team.dead_money)
    };

    // Transform player data
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
      tradeSaving: parseCurrency(player.trade_post.cap_saving)
    }));

    // Sort players by cap hit (descending)
    players.sort((a, b) => b.capHit - a.capHit);

    const transformedData: TransformedSalaryCapData = {
      teamSummary,
      players
    };

    return NextResponse.json({
      teamId,
      salaryCapData: transformedData,
      totalPlayers: players.length,
      lastUpdated: new Date().toISOString(),
      season: 2025
    });

  } catch (error) {
    console.error('Salary Cap API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch salary cap data' },
      { status: 500 }
    );
  }
}