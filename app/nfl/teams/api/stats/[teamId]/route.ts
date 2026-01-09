import { NextRequest, NextResponse } from 'next/server';

interface StatLeader {
  player_id: number;
  name: string;
  slug: string;
  stat: number;
  rank: number;
}

interface StatCategory {
  name: string;
  leaders: StatLeader[];
}

interface PlayerStat {
  player_id: number;
  name: string;
  slug: string;
  [key: string]: any;
}


interface SportsKeedaStatsResponse {
  data: {
    leaders: StatCategory[];
    team_stats: {
      passing: TeamStat[];
      rushing: TeamStat[];
      scoring: {
        touchdowns: TeamStat[];
        two_point_conversions: TeamStat[];
        penalties: TeamStat[];
        first_downs: TeamStat[];
        [key: string]: any;
      };
      offense: TeamStat[];
      defense: TeamStat[];
      returning: {
        punt_returning: TeamStat[];
        kickoff_returning: TeamStat[];
        interception: TeamStat[];
        [key: string]: any;
      };
      punting: TeamStat[];
      kickoffs: TeamStat[];
      field_goals: TeamStat[];
      miscellaneous: TeamStat[];
    };
    player_stats: {
      passing: PlayerStat[];
      rushing: PlayerStat[];
      receiving: PlayerStat[];
      defense: PlayerStat[];
      returning: PlayerStat[];
      kicking: PlayerStat[];
      punting: PlayerStat[];
    };
  };
}

interface TransformedStatLeader {
  name: string;
  stat: number;
  category: string;
}

interface TransformedStatsData {
  passingYards: TransformedStatLeader | null;
  rushingYards: TransformedStatLeader | null;
  receivingYards: TransformedStatLeader | null;
  tackles: TransformedStatLeader | null;
  sacks: TransformedStatLeader | null;
  interceptions: TransformedStatLeader | null;
}

interface TeamStat {
  name: string;
  own: number | string;
  opponent: number | string;
  net: number | string;
}

interface TransformedTeamStats {
  offense: TeamStat[];
  passing: TeamStat[];
  rushing: TeamStat[];
  defense: TeamStat[];
  scoring: TeamStat[];
  fieldGoals: TeamStat[];
  returning: TeamStat[];
  punting: TeamStat[];
  kickoffs: TeamStat[];
  miscellaneous: TeamStat[];
}

interface TransformedPlayerStats {
  passing: PlayerStat[];
  rushing: PlayerStat[];
  receiving: PlayerStat[];
  defense: PlayerStat[];
  returning: PlayerStat[];
  kicking: PlayerStat[];
  punting: PlayerStat[];
}

// Team ID to team name mapping (for Sportskeeda URL)
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

// Helper function to find stat leader by category name
function findStatLeader(leaders: StatCategory[], searchTerms: string[]): TransformedStatLeader | null {
  for (const category of leaders) {
    const categoryName = category.name.toLowerCase();

    // Check if any of the search terms match the category name
    if (searchTerms.some(term => categoryName.includes(term.toLowerCase()))) {
      if (category.leaders && category.leaders.length > 0) {
        const leader = category.leaders[0]; // Get the top leader
        return {
          name: leader.name,
          stat: leader.stat,
          category: category.name
        };
      }
    }
  }
  return null;
}


export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const { teamId } = await params;

    // Get team slug for Sportskeeda URL
    const teamSlug = teamIdMap[teamId];

    if (!teamSlug) {
      return NextResponse.json(
        { error: 'Team not found or not yet mapped' },
        { status: 404 }
      );
    }

    // Fetch data from Sportskeeda API
    const response = await fetch(
      `https://cf-gotham.sportskeeda.com/taxonomy/sport/nfl/team/${teamSlug}/stats?season=2025&event=regular`,
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

    const data: SportsKeedaStatsResponse = await response.json();

    if (!data.data || !data.data.leaders || !Array.isArray(data.data.leaders)) {
      return NextResponse.json(
        { error: 'No stats data found' },
        { status: 404 }
      );
    }

    // Extract key stat leaders
    const statsData: TransformedStatsData = {
      passingYards: findStatLeader(data.data.leaders, ['passing yards', 'pass yards', 'yards passing']),
      rushingYards: findStatLeader(data.data.leaders, ['rushing yards', 'rush yards', 'yards rushing']),
      receivingYards: findStatLeader(data.data.leaders, ['receiving yards', 'rec yards', 'yards receiving']),
      tackles: findStatLeader(data.data.leaders, ['tackles', 'total tackles', 'combined tackles']),
      sacks: findStatLeader(data.data.leaders, ['sacks', 'sack', 'quarterback sacks']),
      interceptions: findStatLeader(data.data.leaders, ['interceptions', 'int', 'interception'])
    };

    // Extract team stats
    const teamStats: TransformedTeamStats = {
      offense: data.data.team_stats?.offense || [],
      passing: data.data.team_stats?.passing || [],
      rushing: data.data.team_stats?.rushing || [],
      defense: data.data.team_stats?.defense || [],
      scoring: [
        // Convert scoring object to array format
        ...(data.data.team_stats?.scoring?.touchdowns || []),
        ...(data.data.team_stats?.scoring?.two_point_conversions || []),
        ...(data.data.team_stats?.scoring?.penalties || []),
        ...(data.data.team_stats?.scoring?.first_downs || [])
      ].filter(item => item && typeof item === 'object'),
      fieldGoals: data.data.team_stats?.field_goals || [],
      returning: [
        // Convert returning object to array format
        ...(data.data.team_stats?.returning?.punt_returning || []),
        ...(data.data.team_stats?.returning?.kickoff_returning || []),
        ...(data.data.team_stats?.returning?.interception || [])
      ].filter(item => item && typeof item === 'object'),
      punting: data.data.team_stats?.punting || [],
      kickoffs: data.data.team_stats?.kickoffs || [],
      miscellaneous: data.data.team_stats?.miscellaneous || []
    };

    // Extract player stats directly
    const playerStats: TransformedPlayerStats = {
      passing: data.data.player_stats?.passing || [],
      rushing: data.data.player_stats?.rushing || [],
      receiving: data.data.player_stats?.receiving || [],
      defense: data.data.player_stats?.defense || [],
      returning: data.data.player_stats?.returning || [],
      kicking: data.data.player_stats?.kicking || [],
      punting: data.data.player_stats?.punting || []
    };

    return NextResponse.json({
      teamId,
      stats: statsData,
      teamStats,
      playerStats,
      lastUpdated: new Date().toISOString(),
      season: 2025
    });

  } catch (error) {
    console.error('Stats API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats data' },
      { status: 500 }
    );
  }
}