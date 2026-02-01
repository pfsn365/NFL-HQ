import { NextRequest, NextResponse } from 'next/server';

interface FutureDraftPick {
  year: number;
  round: number;
  roundPick: number;
  overallPick: number;
  name: string;
  position: string;
  college: string;
  isTraded?: boolean;
  originalTeamAbbr?: string;
  tradeNotes?: string;
}

// Team slug to abbreviation mapping
const TEAM_SLUG_TO_ABBR: Record<string, string> = {
  'new-york-jets': 'NYJ',
  'cleveland-browns': 'CLE',
  'baltimore-ravens': 'BAL',
  'miami-dolphins': 'MIA',
  'new-orleans-saints': 'NO',
  'las-vegas-raiders': 'LV',
  'tennessee-titans': 'TEN',
  'new-york-giants': 'NYG',
  'cincinnati-bengals': 'CIN',
  'carolina-panthers': 'CAR',
  'houston-texans': 'HOU',
  'arizona-cardinals': 'ARI',
  'dallas-cowboys': 'DAL',
  'atlanta-falcons': 'ATL',
  'kansas-city-chiefs': 'KC',
  'chicago-bears': 'CHI',
  'washington-commanders': 'WAS',
  'los-angeles-rams': 'LAR',
  'new-england-patriots': 'NE',
  'denver-broncos': 'DEN',
  'los-angeles-chargers': 'LAC',
  'minnesota-vikings': 'MIN',
  'seattle-seahawks': 'SEA',
  'green-bay-packers': 'GB',
  'pittsburgh-steelers': 'PIT',
  'philadelphia-eagles': 'PHI',
  'tampa-bay-buccaneers': 'TB',
  'san-francisco-49ers': 'SF',
  'jacksonville-jaguars': 'JAX',
  'buffalo-bills': 'BUF',
  'detroit-lions': 'DET',
  'indianapolis-colts': 'IND',
};

// Team full names from abbreviations
const TEAM_ABBR_TO_NAME: Record<string, string> = {
  'NYJ': 'New York Jets',
  'CLE': 'Cleveland Browns',
  'BAL': 'Baltimore Ravens',
  'MIA': 'Miami Dolphins',
  'NO': 'New Orleans Saints',
  'LV': 'Las Vegas Raiders',
  'TEN': 'Tennessee Titans',
  'NYG': 'New York Giants',
  'CIN': 'Cincinnati Bengals',
  'CAR': 'Carolina Panthers',
  'HOU': 'Houston Texans',
  'ARI': 'Arizona Cardinals',
  'DAL': 'Dallas Cowboys',
  'ATL': 'Atlanta Falcons',
  'KC': 'Kansas City Chiefs',
  'CHI': 'Chicago Bears',
  'WAS': 'Washington Commanders',
  'LAR': 'Los Angeles Rams',
  'NE': 'New England Patriots',
  'DEN': 'Denver Broncos',
  'LAC': 'Los Angeles Chargers',
  'MIN': 'Minnesota Vikings',
  'SEA': 'Seattle Seahawks',
  'GB': 'Green Bay Packers',
  'PIT': 'Pittsburgh Steelers',
  'PHI': 'Philadelphia Eagles',
  'TB': 'Tampa Bay Buccaneers',
  'SF': 'San Francisco 49ers',
  'JAX': 'Jacksonville Jaguars',
  'BUF': 'Buffalo Bills',
  'DET': 'Detroit Lions',
  'IND': 'Indianapolis Colts',
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const { teamId } = await params;

    // Get team abbreviation from slug
    const teamAbbr = TEAM_SLUG_TO_ABBR[teamId];

    if (!teamAbbr) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    // Fetch draft order from Sportskeeda
    const response = await fetch(
      'https://statics.sportskeeda.com/assets/sheets/tools/draft-order/draft_order.json',
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; NFL-HQ/1.0)',
        },
        next: { revalidate: 3600 } // Cache for 1 hour
      }
    );

    if (!response.ok) {
      throw new Error(`Sportskeeda API error: ${response.status}`);
    }

    const rawData: string[][] = await response.json();

    if (!rawData || !Array.isArray(rawData) || rawData.length < 2) {
      return NextResponse.json(
        { error: 'No draft order data found' },
        { status: 404 }
      );
    }

    // Skip header row and transform data
    // Row format: [pick, round, originalTeam, currentTeam, player, position, record, winPct, sos, blurb, school, originalTeamSlug, currentTeamSlug]
    const allPicks = rawData.slice(1).map((row) => {
      const [pick, round, originalTeam, currentTeam, , , , , , , , originalTeamSlug, currentTeamSlug] = row;

      const originalTeamAbbr = TEAM_SLUG_TO_ABBR[originalTeamSlug] || originalTeam;
      const currentTeamAbbr = currentTeamSlug ? TEAM_SLUG_TO_ABBR[currentTeamSlug] : null;

      // The team that currently holds the pick
      const holdingTeamAbbr = currentTeamAbbr || originalTeamAbbr;

      return {
        overallPick: parseInt(pick),
        round: parseInt(round),
        originalTeamAbbr,
        currentTeamAbbr,
        holdingTeamAbbr,
        isTraded: !!currentTeamAbbr && currentTeamAbbr !== originalTeamAbbr,
      };
    });

    // Filter picks for this team (picks they currently hold)
    const teamPicks = allPicks.filter(pick => pick.holdingTeamAbbr === teamAbbr);

    // Calculate round pick numbers
    const roundPickCounts: Record<number, number> = {};
    allPicks.forEach(pick => {
      if (!roundPickCounts[pick.round]) {
        roundPickCounts[pick.round] = 0;
      }
      roundPickCounts[pick.round]++;
    });

    // Transform to FutureDraftPick format
    const futurePicks: FutureDraftPick[] = teamPicks.map(pick => {
      // Calculate round pick number
      const picksInRoundBefore = allPicks.filter(
        p => p.round === pick.round && p.overallPick < pick.overallPick
      ).length;

      const draftPick: FutureDraftPick = {
        year: 2026,
        round: pick.round,
        roundPick: picksInRoundBefore + 1,
        overallPick: pick.overallPick,
        name: 'TBD',
        position: 'TBD',
        college: 'TBD',
      };

      if (pick.isTraded && pick.originalTeamAbbr) {
        draftPick.isTraded = true;
        draftPick.originalTeamAbbr = pick.originalTeamAbbr;
        draftPick.tradeNotes = `Acquired from ${TEAM_ABBR_TO_NAME[pick.originalTeamAbbr] || pick.originalTeamAbbr}`;
      }

      return draftPick;
    });

    // Sort by overall pick
    futurePicks.sort((a, b) => a.overallPick - b.overallPick);

    return NextResponse.json({
      teamId,
      teamAbbr,
      picks: futurePicks,
      totalPicks: futurePicks.length,
      lastUpdated: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Future Draft Picks API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch future draft picks data' },
      { status: 500 }
    );
  }
}
