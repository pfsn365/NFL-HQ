import { NextRequest, NextResponse } from 'next/server';


interface DraftPick {
  year: number;
  round: number;
  roundPick: number;
  overallPick: number;
  name: string;
  position: string;
  college: string;
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

    // Fetch data from Sportskeeda API
    const response = await fetch(
      `https://statics.sportskeeda.com/assets/sheets/static/nfl/team/subpage/draft-order/${teamAbbr}.json`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; NFL-Team-Pages/1.0)',
        },
        next: { revalidate: 21600 } // Cache for 6 hours
      }
    );

    if (!response.ok) {
      throw new Error(`Sportskeeda API error: ${response.status}`);
    }

    const rawData: string[][] = await response.json();

    if (!rawData || !Array.isArray(rawData) || rawData.length === 0) {
      return NextResponse.json(
        { error: 'No draft data found' },
        { status: 404 }
      );
    }

    // Transform the data to our format
    const transformedPicks: DraftPick[] = rawData.map(row => {
      const [year, round, roundPick, overallPick, name, , position, college] = row;

      return {
        year: parseInt(year),
        round: parseInt(round),
        roundPick: parseInt(roundPick),
        overallPick: parseInt(overallPick),
        name: name || 'Unknown Player',
        position: position || 'N/A',
        college: college || 'Unknown'
      };
    }).filter(pick =>
      // Filter out invalid data
      pick.year && pick.round && pick.name !== 'Unknown Player'
    );

    // Sort by year (descending) then by overall pick (ascending)
    transformedPicks.sort((a, b) => {
      if (a.year !== b.year) {
        return b.year - a.year; // Most recent year first
      }
      return a.overallPick - b.overallPick; // Lower pick number first
    });

    return NextResponse.json({
      teamId,
      picks: transformedPicks,
      totalPicks: transformedPicks.length,
      lastUpdated: new Date().toISOString(),
      yearsRange: {
        earliest: Math.min(...transformedPicks.map(p => p.year)),
        latest: Math.max(...transformedPicks.map(p => p.year))
      }
    });

  } catch (error) {
    console.error('Draft Picks API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch draft picks data' },
      { status: 500 }
    );
  }
}