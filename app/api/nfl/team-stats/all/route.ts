import { NextResponse } from 'next/server';

interface TeamPPG {
  teamId: string;
  ppg: string;
  oppPpg: string;
}

// Team ID to slug mapping
const teamIdMap: Record<string, string> = {
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
  'washington-commanders': 'washington-commanders',
};

// Fetch PPG stats for a single team
async function fetchTeamPPG(teamId: string, teamSlug: string): Promise<TeamPPG> {
  try {
    const response = await fetch(
      `https://cf-gotham.sportskeeda.com/taxonomy/sport/nfl/team/${teamSlug}/stats?season=2025&event=regular`,
      {
        headers: {
          'User-Agent': 'PFN-Internal-NON-Blocking',
        },
        next: { revalidate: 86400 } // Cache for 24 hours
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`);
    }

    const data = await response.json();

    // Extract points per game from team_stats
    const ppgOwn = data?.data?.team_stats?.points_per_game?.own || '0.0';
    const ppgOpp = data?.data?.team_stats?.points_per_game?.opponent || '0.0';

    return {
      teamId,
      ppg: String(ppgOwn),
      oppPpg: String(ppgOpp),
    };
  } catch (error) {
    console.error(`Error fetching PPG for ${teamId}:`, error);
    return {
      teamId,
      ppg: '0.0',
      oppPpg: '0.0',
    };
  }
}

export async function GET() {
  try {
    // Fetch all teams in parallel
    const teamPromises = Object.entries(teamIdMap).map(([teamId, teamSlug]) =>
      fetchTeamPPG(teamId, teamSlug)
    );

    const teams = await Promise.all(teamPromises);

    // Convert to a map for easier lookup on client
    const statsMap: Record<string, { ppg: string; oppPpg: string }> = {};
    teams.forEach(team => {
      statsMap[team.teamId] = {
        ppg: team.ppg,
        oppPpg: team.oppPpg,
      };
    });

    return NextResponse.json({
      stats: statsMap,
      lastUpdated: new Date().toISOString(),
      season: 2025,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600',
      },
    });
  } catch (error) {
    console.error('Bulk Team Stats API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team stats' },
      { status: 500 }
    );
  }
}
