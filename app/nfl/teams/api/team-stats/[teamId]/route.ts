import { NextResponse } from 'next/server';

interface StatsResponse {
  collections: {
    sheetName: string;
    data: any[][];
  }[];
}

interface CachedStats {
  teamId: string;
  teamAcronym: string;
  stats: {
    offi: {
      value: number;
      grade: string;
      rank: string;
    } | null;
    defi: {
      value: number;
      grade: string;
      rank: string;
    } | null;
  };
  season: string;
  lastUpdated: string;
}

// In-memory cache for last successful stats
const statsCache = new Map<string, CachedStats>();

// Team ID to acronym mapping
const teamAcronymMap: Record<string, string> = {
  'arizona-cardinals': 'ARI',
  'atlanta-falcons': 'ATL',
  'baltimore-ravens': 'BAL',
  'buffalo-bills': 'BUF',
  'carolina-panthers': 'CAR',
  'chicago-bears': 'CHI',
  'cincinnati-bengals': 'CIN',
  'cleveland-browns': 'CLE',
  'dallas-cowboys': 'DAL',
  'denver-broncos': 'DEN',
  'detroit-lions': 'DET',
  'green-bay-packers': 'GB',
  'houston-texans': 'HOU',
  'indianapolis-colts': 'IND',
  'jacksonville-jaguars': 'JAX',
  'kansas-city-chiefs': 'KC',
  'las-vegas-raiders': 'LV',
  'los-angeles-chargers': 'LAC',
  'los-angeles-rams': 'LAR',
  'miami-dolphins': 'MIA',
  'minnesota-vikings': 'MIN',
  'new-england-patriots': 'NE',
  'new-orleans-saints': 'NO',
  'new-york-giants': 'NYG',
  'new-york-jets': 'NYJ',
  'philadelphia-eagles': 'PHI',
  'pittsburgh-steelers': 'PIT',
  'san-francisco-49ers': 'SF',
  'seattle-seahawks': 'SEA',
  'tampa-bay-buccaneers': 'TB',
  'tennessee-titans': 'TEN',
  'washington-commanders': 'WAS'
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const { teamId } = await params;

  // Get team acronym
  const teamAcronym = teamAcronymMap[teamId];
  if (!teamAcronym) {
    return NextResponse.json(
      { error: 'Team not found' },
      { status: 404 }
    );
  }

  try {
    // Fetch data from Sportskeeda API
    const response = await fetch(
      'https://statics.sportskeeda.com/assets/sheets/tools/nfl-team-stats/nflTeamStats.json',
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; NFL-Team-Pages/1.0)',
        },
        next: { revalidate: 86400 } // Cache for 24 hours
      }
    );

    if (!response.ok) {
      throw new Error(`Stats API error: ${response.status}`);
    }

    const data: StatsResponse = await response.json();

    if (!data.collections || !Array.isArray(data.collections) || data.collections.length === 0) {
      throw new Error('No stats data found in response');
    }

    // Process each collection to find offense and defense data
    // The API structure can vary - need to check each collection's headers
    let offiData = null;
    let defiData = null;
    let latestSeason = null;

    for (const collection of data.collections) {
      if (!collection.data || !Array.isArray(collection.data) || collection.data.length === 0) {
        continue;
      }

      const headers = collection.data[0];
      const rows = collection.data.slice(1);

      const teamAcronymIndex = headers.indexOf('teamAcronym');
      const seasonIndex = headers.indexOf('season');

      if (teamAcronymIndex === -1) {
        continue;
      }

      // Filter and sort team data
      const teamData = rows
        .filter(row => row[teamAcronymIndex] === teamAcronym)
        .sort((a, b) => parseInt(b[seasonIndex]) - parseInt(a[seasonIndex]));

      if (teamData.length === 0) {
        continue;
      }

      const latestData = teamData[0];
      const season = latestData[seasonIndex];

      // Check if this collection has offense stats
      const offiIndex = headers.indexOf('offi');
      if (offiIndex !== -1 && !offiData) {
        const offiGradeIndex = headers.indexOf('offiGrade');
        const offiSeasonRankIndex = headers.indexOf('offiSeasonRank');

        offiData = {
          value: latestData[offiIndex],
          grade: latestData[offiGradeIndex],
          rank: latestData[offiSeasonRankIndex]
        };
        latestSeason = season;
      }

      // Check if this collection has defense stats
      const defiIndex = headers.indexOf('defi');
      if (defiIndex !== -1 && !defiData) {
        const defiGradeIndex = headers.indexOf('defiGrade');
        const defiSeasonRankIndex = headers.indexOf('defiSeasonRank');

        defiData = {
          value: latestData[defiIndex],
          grade: latestData[defiGradeIndex],
          rank: latestData[defiSeasonRankIndex]
        };
        if (!latestSeason) {
          latestSeason = season;
        }
      }
    }

    // Check if we found at least one stat
    if (!offiData && !defiData) {
      throw new Error('No offensive or defensive stats found for this team');
    }

    // Create the stats response
    const statsResponse: CachedStats = {
      teamId,
      teamAcronym,
      stats: {
        offi: offiData,
        defi: defiData
      },
      season: latestSeason || '',
      lastUpdated: new Date().toISOString()
    };

    // Cache the successful response
    statsCache.set(teamId, statsResponse);

    return NextResponse.json(statsResponse);

  } catch (error) {
    console.error('Team stats API error:', error);

    // Try to return cached data if available
    const cachedData = statsCache.get(teamId);
    if (cachedData) {
      return NextResponse.json({
        ...cachedData,
        fromCache: true,
        cacheNote: 'Live data unavailable, showing last known stats'
      });
    }

    // No cached data available
    return NextResponse.json(
      {
        error: 'Failed to fetch team stats and no cached data available',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}