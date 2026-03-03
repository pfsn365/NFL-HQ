import { NextResponse } from 'next/server';

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

const ABBR_TO_SLUG = Object.fromEntries(
  Object.entries(TEAM_SLUG_TO_ABBR).map(([slug, abbr]) => [abbr, slug])
);

export async function GET() {
  try {
    const response = await fetch(
      'https://statics.sportskeeda.com/assets/sheets/tools/draft-order/draft_order.json',
      {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NFL-HQ/1.0)' },
        next: { revalidate: 3600 },
      }
    );

    if (!response.ok) {
      throw new Error(`Sportskeeda API error: ${response.status}`);
    }

    const rawData: string[][] = await response.json();

    if (!rawData || !Array.isArray(rawData) || rawData.length < 2) {
      throw new Error('No draft order data found');
    }

    // Row: [pick, round, originalTeam, currentTeam, player, position, record, winPct, sos, blurb, school, originalTeamSlug, currentTeamSlug]
    const allPicks = rawData.slice(1).map((row) => {
      const [pick, round, , , , , , , , , , originalTeamSlug, currentTeamSlug] = row;
      const originalTeamAbbr = TEAM_SLUG_TO_ABBR[originalTeamSlug] || '';
      const currentTeamAbbr = currentTeamSlug ? TEAM_SLUG_TO_ABBR[currentTeamSlug] : null;
      const holdingTeamAbbr = currentTeamAbbr || originalTeamAbbr;

      return {
        overallPick: parseInt(pick),
        round: parseInt(round),
        holdingTeamAbbr,
      };
    });

    // Group picks by holding team (keyed by team slug)
    const teamPicksMap: Record<string, { totalPicks: number; rounds: number[] }> = {};

    for (const pick of allPicks) {
      const slug = ABBR_TO_SLUG[pick.holdingTeamAbbr];
      if (!slug) continue;

      if (!teamPicksMap[slug]) {
        teamPicksMap[slug] = { totalPicks: 0, rounds: [] };
      }
      teamPicksMap[slug].totalPicks++;
      teamPicksMap[slug].rounds.push(pick.round);
    }

    // Sort rounds for each team
    for (const team of Object.values(teamPicksMap)) {
      team.rounds.sort((a, b) => a - b);
    }

    return NextResponse.json({
      teams: teamPicksMap,
      lastUpdated: new Date().toISOString(),
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=1800',
      },
    });
  } catch (error) {
    console.error('Bulk Future Draft Picks API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch future draft picks data' },
      { status: 500 }
    );
  }
}
