import { NextResponse } from 'next/server';
import { getAllTeams } from '@/data/teams';

// Cache the data for 5 minutes
const CACHE_DURATION = 5 * 60 * 1000
let cache: { data: any, timestamp: number } | null = null

export interface InjuryData {
  player: string;
  position: string;
  team: string;
  status: string;
  injury: string;
  playerID: string;
}

export interface InjuryApiResponse {
  success: boolean;
  injuries: Record<string, InjuryData[]>;
  cached?: boolean;
  totalInjuries?: number;
  lastUpdated?: string;
  error?: string;
  warning?: string;
}

interface RosterPlayer {
  name: string;
  position: string;
  status: string;
}

interface TeamRosterResponse {
  teamId: string;
  roster: {
    activeRoster: RosterPlayer[];
    practiceSquad: RosterPlayer[];
    injuredReserve: RosterPlayer[];
    physicallyUnableToPerform: RosterPlayer[];
    nonFootballInjuryReserve: RosterPlayer[];
    suspended: RosterPlayer[];
    exempt: RosterPlayer[];
  };
}

// Function to normalize name for matching
function normalizePlayerName(name: string): string {
  return name
    .toLowerCase()
    // Remove common suffixes
    .replace(/\s+(jr|sr|ii|iii|iv|v)\.?$/i, '')
    // Remove periods, hyphens, apostrophes but keep letters with accents
    .replace(/[.\-']/g, '')
    // Normalize spaces
    .replace(/\s+/g, ' ')
    .trim();
}

// Team slug mapping for SportsKeeda
const teamSlugMap: Record<string, string> = {
  'arizona-cardinals': 'ARI', 'atlanta-falcons': 'ATL', 'baltimore-ravens': 'BAL',
  'buffalo-bills': 'BUF', 'carolina-panthers': 'CAR', 'chicago-bears': 'CHI',
  'cincinnati-bengals': 'CIN', 'cleveland-browns': 'CLE', 'dallas-cowboys': 'DAL',
  'denver-broncos': 'DEN', 'detroit-lions': 'DET', 'green-bay-packers': 'GB',
  'houston-texans': 'HOU', 'indianapolis-colts': 'IND', 'jacksonville-jaguars': 'JAX',
  'kansas-city-chiefs': 'KC', 'las-vegas-raiders': 'LV', 'los-angeles-chargers': 'LAC',
  'los-angeles-rams': 'LAR', 'miami-dolphins': 'MIA', 'minnesota-vikings': 'MIN',
  'new-england-patriots': 'NE', 'new-orleans-saints': 'NO', 'new-york-giants': 'NYG',
  'new-york-jets': 'NYJ', 'philadelphia-eagles': 'PHI', 'pittsburgh-steelers': 'PIT',
  'san-francisco-49ers': 'SF', 'seattle-seahawks': 'SEA', 'tampa-bay-buccaneers': 'TB',
  'tennessee-titans': 'TEN', 'washington-commanders': 'WSH'
};

// Cache for player-team map
let playerTeamMapCache: { map: Map<string, string>, timestamp: number } | null = null;
const PLAYER_MAP_CACHE_DURATION = 6 * 60 * 60 * 1000; // 6 hours

// Build player-to-team map from SportsKeeda rosters
async function buildPlayerTeamMap(): Promise<Map<string, string>> {
  // Return cached map if valid
  if (playerTeamMapCache && Date.now() - playerTeamMapCache.timestamp < PLAYER_MAP_CACHE_DURATION) {
    return playerTeamMapCache.map;
  }

  const playerTeamMap = new Map<string, string>();
  const teamSlugs = Object.keys(teamSlugMap);

  // Fetch all team rosters in parallel
  const rosterPromises = teamSlugs.map(async (teamSlug) => {
    try {
      const response = await fetch(
        `https://api.sportskeeda.com/v1/taxonomy/${teamSlug}?include=squad`,
        {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NFL-HQ/1.0)' },
          next: { revalidate: 86400 }
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.squad && Array.isArray(data.squad)) {
          const teamAbbr = teamSlugMap[teamSlug];
          for (const player of data.squad) {
            if (player.name) {
              playerTeamMap.set(normalizePlayerName(player.name), teamAbbr);
            }
          }
        }
      }
    } catch {
      // Skip errors for individual teams
    }
  });

  await Promise.all(rosterPromises);

  // Cache the result
  playerTeamMapCache = { map: playerTeamMap, timestamp: Date.now() };

  return playerTeamMap;
}

async function fetchRotoballerInjuries(): Promise<Record<string, InjuryData[]>> {
  try {
    // Fetch injury data and player-team map in parallel
    const [injuryResponse, playerTeamMap] = await Promise.all([
      fetch(
        'https://www.rotoballer.com/api/rbapps/nfl-injuries.php?partner=prosportsnetwork&key=x63sLHVNR4a37LvBetiiBXvmEs6XKpVQS1scgVoYf3kxXZ4Kl8bC2BahiSsP',
        {
          headers: { 'Accept': 'application/json' },
          next: { revalidate: 10800 } // Cache for 3 hours
        }
      ),
      buildPlayerTeamMap() // Get team info from SportsKeeda rosters
    ]);

    if (!injuryResponse.ok) {
      throw new Error(`Failed to fetch injury data: ${injuryResponse.statusText}`)
    }

    const injuryData = await injuryResponse.json();
    const injuries: Record<string, InjuryData[]> = {}

    // Process each player - use ESPN team data if available
    Object.entries(injuryData).forEach(([playerID, playerData]: [string, any]) => {
      const playerName = playerData.Name || 'Unknown Player';
      const normalizedName = normalizePlayerName(playerName);
      const team = playerTeamMap.get(normalizedName) || 'N/A';

      const injury: InjuryData = {
        player: playerName,
        position: playerData.Position || 'N/A',
        team: team,
        status: playerData.Status || 'Unknown',
        injury: playerData.Part || 'Undisclosed',
        playerID: playerID
      }

      if (!injuries['ALL']) {
        injuries['ALL'] = []
      }
      injuries['ALL'].push(injury)
    })

    return injuries

  } catch (error) {
    console.error('Error fetching Rotoballer injury data:', error)
    throw error
  }
}

export async function GET() {
  try {
    // Check cache first
    if (cache && Date.now() - cache.timestamp < CACHE_DURATION) {
      return NextResponse.json({
        success: true,
        injuries: cache.data,
        cached: true
      })
    }

    // Fetch injuries from Rotoballer with team info from ESPN
    const injuries = await fetchRotoballerInjuries();

    // Update cache
    cache = { data: injuries, timestamp: Date.now() }

    const totalInjuries = Object.values(injuries).reduce((sum, teamInjuries) => sum + teamInjuries.length, 0)

    return NextResponse.json({
      success: true,
      injuries,
      cached: false,
      totalInjuries,
      lastUpdated: new Date().toISOString()
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600', // 5 min cache
      },
    });

  } catch (error: any) {
    console.error('API Error:', error);

    // Return cached data if available on error
    if (cache) {
      return NextResponse.json({
        success: true,
        injuries: cache.data,
        cached: true,
        warning: 'Request failed, returning cached data'
      })
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to fetch injury data',
      injuries: {}
    }, { status: 500 });
  }
}