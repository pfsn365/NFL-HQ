import { NextResponse } from 'next/server';
import { getAllTeams } from '@/data/teams';

interface SportsKeedaPlayer {
  name: string;
  slug: string;
  jersey_no: string;
  is_active: boolean;
  is_injured: boolean;
  is_suspended: boolean;
  is_practice_squad: boolean;
  is_physically_unable: boolean;
  is_non_football_injury_reserve: boolean;
  is_exempt: boolean;
  height_in_inch: number;
  weight_in_lbs: number;
  college: string;
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
  positions: Array<{ name: string; abbreviation: string }>;
}

interface RosterPlayer {
  name: string;
  slug: string;
  jerseyNumber: number;
  position: string;
  positionFull: string;
  age: number;
  height: string;
  weight: number;
  college: string;
  experience: number;
  status: string;
  isActive: boolean;
  isPracticeSquad: boolean;
  draft: {
    year: number;
    round: number;
    pick: number;
  } | null;
  birthDate: string;
  birthPlace: string;
}

interface TeamRoster {
  teamId: string;
  teamName: string;
  players: RosterPlayer[];
}

// In-memory cache for rosters
let rostersCache: Map<string, TeamRoster> | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 2 * 60 * 60 * 1000; // 2 hours (reduced from 24hr to free memory faster)

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

function formatHeight(heightInInches: number): string {
  if (!heightInInches) return 'N/A';
  const feet = Math.floor(heightInInches / 12);
  const inches = heightInInches % 12;
  return `${feet}'${inches}"`;
}

function getPlayerStatus(player: SportsKeedaPlayer): string {
  if (player.is_suspended) return 'Suspended';
  if (player.is_exempt) return 'Exempt';
  if (player.is_injured) return 'Injured Reserve';
  if (player.is_physically_unable) return 'Physically Unable to Perform';
  if (player.is_non_football_injury_reserve) return 'Non-Football Injury Reserve';
  if (player.is_practice_squad) return 'Practice Squad';
  if (player.is_active) return 'Active';
  return 'Active';
}

async function fetchTeamRoster(teamId: string, teamName: string): Promise<TeamRoster | null> {
  try {
    const sportsKeedaSlug = teamSlugMap[teamId];
    if (!sportsKeedaSlug) return null;

    const response = await fetch(
      `https://api.sportskeeda.com/v1/taxonomy/${sportsKeedaSlug}?include=squad`,
      {
        headers: {
          'User-Agent': 'PFN-Internal-NON-Blocking',
        },
        next: { revalidate: 86400 }
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    if (!data.squad || !Array.isArray(data.squad)) return null;

    const players: RosterPlayer[] = data.squad.map((player: SportsKeedaPlayer) => ({
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
      status: getPlayerStatus(player),
      isActive: player.is_active && !player.is_practice_squad,
      isPracticeSquad: player.is_practice_squad,
      draft: player.draft.year > 0 ? {
        year: player.draft.year,
        round: player.draft.round,
        pick: player.draft.overallPickNumber
      } : null,
      birthDate: player.birth_date,
      birthPlace: player.birth_place
    }));

    return { teamId, teamName, players };
  } catch (error) {
    console.error(`Error fetching roster for ${teamId}:`, error);
    return null;
  }
}

async function getAllRosters(): Promise<Map<string, TeamRoster>> {
  // Check cache
  if (rostersCache && Date.now() - cacheTimestamp < CACHE_DURATION) {
    return rostersCache;
  }

  const allTeams = getAllTeams();
  const rostersMap = new Map<string, TeamRoster>();

  // Fetch all 32 team rosters in parallel
  const rosterPromises = allTeams.map(team =>
    fetchTeamRoster(team.id, team.fullName)
  );

  const results = await Promise.all(rosterPromises);

  for (const roster of results) {
    if (roster) {
      rostersMap.set(roster.teamId, roster);
    }
  }

  // Update cache
  rostersCache = rostersMap;
  cacheTimestamp = Date.now();

  return rostersMap;
}

// Export for use by other API routes
export { getAllRosters, type RosterPlayer, type TeamRoster };

export async function GET() {
  try {
    const rosters = await getAllRosters();

    // Convert Map to object for JSON response
    const rostersObj: Record<string, TeamRoster> = {};
    rosters.forEach((roster, teamId) => {
      rostersObj[teamId] = roster;
    });

    // Calculate total players
    let totalPlayers = 0;
    rosters.forEach(roster => {
      totalPlayers += roster.players.length;
    });

    return NextResponse.json({
      rosters: rostersObj,
      totalTeams: rosters.size,
      totalPlayers,
      lastUpdated: new Date().toISOString()
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600',
      },
    });
  } catch (error) {
    console.error('Rosters API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rosters data' },
      { status: 500 }
    );
  }
}
