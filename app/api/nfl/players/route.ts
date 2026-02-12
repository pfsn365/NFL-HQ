import { NextRequest, NextResponse } from 'next/server';
import { teams, getAllTeams } from '@/data/teams';

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
}

interface PlayerWithTeam extends RosterPlayer {
  teamId: string;
  teamName: string;
  teamLogo: string;
  teamAbbr: string;
}

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
  age: number;
  positions: Array<{ name: string; abbreviation: string }>;
}

// Team slug mapping
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

// Position group mappings for filtering
const OL_POSITIONS = ['OT', 'OG', 'C', 'T', 'G', 'OL', 'OC'];
const DL_POSITIONS = ['DE', 'DT', 'NT', 'EDGE', 'DL'];
const S_POSITIONS = ['S', 'FS', 'SS', 'SAF'];
const LB_POSITIONS = ['LB', 'ILB', 'MLB', 'OLB'];

function matchesPosition(playerPosition: string, filterPosition: string): boolean {
  const pos = playerPosition.toUpperCase();
  if (filterPosition === 'all') return true;
  if (filterPosition === 'OL') return OL_POSITIONS.includes(pos);
  if (filterPosition === 'DL') return DL_POSITIONS.includes(pos);
  if (filterPosition === 'S') return S_POSITIONS.includes(pos);
  if (filterPosition === 'LB') return LB_POSITIONS.includes(pos);
  if (filterPosition === 'RB') return pos === 'RB' || pos === 'FB';
  return pos === filterPosition || pos.startsWith(filterPosition);
}

// Cache for aggregated players data
let cachedPlayers: PlayerWithTeam[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

async function fetchAllPlayers(): Promise<PlayerWithTeam[]> {
  // Return cached data if still valid
  if (cachedPlayers && Date.now() - cacheTimestamp < CACHE_DURATION) {
    return cachedPlayers;
  }

  const allTeams = getAllTeams();
  const players: PlayerWithTeam[] = [];

  // Fetch all rosters in parallel (server-side doesn't have browser limitations)
  const fetchPromises = allTeams.map(async (team) => {
    try {
      const sportsKeedaSlug = teamSlugMap[team.id];
      if (!sportsKeedaSlug) return [];

      const response = await fetch(
        `https://api.sportskeeda.com/v1/taxonomy/${sportsKeedaSlug}?include=squad`,
        {
          headers: { 'User-Agent': 'PFN-Internal-NON-Blocking' },
          next: { revalidate: 86400 }
        }
      );

      if (!response.ok) return [];

      const data = await response.json();
      if (!data.squad || !Array.isArray(data.squad)) return [];

      return data.squad.map((player: SportsKeedaPlayer): PlayerWithTeam => ({
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
        teamId: team.id,
        teamName: team.fullName,
        teamLogo: team.logoUrl,
        teamAbbr: team.abbreviation,
      }));
    } catch (error) {
      console.error(`Error fetching roster for ${team.id}:`, error);
      return [];
    }
  });

  const results = await Promise.all(fetchPromises);
  for (const teamPlayers of results) {
    players.push(...teamPlayers);
  }

  // Sort alphabetically by name
  players.sort((a, b) => a.name.localeCompare(b.name));

  // Update cache
  cachedPlayers = players;
  cacheTimestamp = Date.now();

  return players;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Pagination params
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '24')));

    // Filter params
    const search = searchParams.get('search')?.toLowerCase() || '';
    const teamFilter = searchParams.get('team') || 'all';
    const positionFilter = searchParams.get('position') || 'all';

    // Fetch all players (cached)
    const allPlayers = await fetchAllPlayers();

    // Apply filters
    let filteredPlayers = allPlayers;

    if (search) {
      filteredPlayers = filteredPlayers.filter(player =>
        player.name.toLowerCase().includes(search) ||
        player.teamName.toLowerCase().includes(search) ||
        player.teamAbbr.toLowerCase().includes(search) ||
        player.position.toLowerCase().includes(search)
      );
    }

    if (teamFilter !== 'all') {
      filteredPlayers = filteredPlayers.filter(player => player.teamId === teamFilter);
    }

    if (positionFilter !== 'all') {
      filteredPlayers = filteredPlayers.filter(player =>
        matchesPosition(player.position, positionFilter)
      );
    }

    // Calculate pagination
    const totalPlayers = filteredPlayers.length;
    const totalPages = Math.ceil(totalPlayers / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    // Get page of players
    const players = filteredPlayers.slice(startIndex, endIndex);

    return NextResponse.json({
      players,
      pagination: {
        page,
        limit,
        totalPlayers,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      }
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=1800',
      },
    });
  } catch (error) {
    console.error('Players API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch players' },
      { status: 500 }
    );
  }
}
