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

    // Transform the data to our format
    const transformedPositions: DepthChartPosition[] = data.positions.map(position => {
      const players: DepthChartPlayer[] = [];

      // Extract all players with their depth from the depth chart entries
      position.depth_chart.forEach(depthEntry => {
        players.push({
          name: depthEntry.player.name,
          slug: depthEntry.player.slug,
          depth: depthEntry.depth
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