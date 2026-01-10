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

async function fetchRotoballerInjuries(): Promise<Record<string, InjuryData[]>> {
  try {
    const allTeams = getAllTeams();

    // Fetch both injury data and all team rosters in parallel
    const [injuryResponse, ...rosterResponses] = await Promise.all([
      fetch(
        'https://www.rotoballer.com/api/rbapps/nfl-injuries.php?partner=prosportsnetwork&key=x63sLHVNR4a37LvBetiiBXvmEs6XKpVQS1scgVoYf3kxXZ4Kl8bC2BahiSsP',
        {
          headers: {
            'Accept': 'application/json',
          },
          next: { revalidate: 10800 } // Cache for 3 hours
        }
      ),
      ...allTeams.map(team => {
        // Determine base URL for internal API calls (server-side only)
        // Priority: PRODUCTION_URL > VERCEL_URL > localhost
        const baseUrl = process.env.PRODUCTION_URL
          ? process.env.PRODUCTION_URL
          : process.env.VERCEL_URL
          ? `https://${process.env.VERCEL_URL}`
          : 'http://localhost:3000';

        // Server-side internal API calls do NOT use basePath
        // basePath is only for public-facing URLs, not internal Next.js API routes
        const apiPath = `/nfl/teams/api/roster/${team.id}/`;

        const url = `${baseUrl}${apiPath}`;
        console.log(`[INJURY API] Fetching roster for ${team.id} from: ${url}`);
        console.log(`[INJURY API] VERCEL_URL: ${process.env.VERCEL_URL}`);
        console.log(`[INJURY API] baseUrl: ${baseUrl}, apiPath: ${apiPath}`);

        return fetch(url, {
          next: { revalidate: 86400 } // Cache for 24 hours
        })
          .then(res => {
            if (!res.ok) {
              console.error(`[INJURY API] Failed to fetch roster for ${team.id}: ${res.status} ${res.statusText}`);
            } else {
              console.log(`[INJURY API] Successfully fetched roster for ${team.id}`);
            }
            return res;
          })
          .catch((err) => {
            console.error(`[INJURY API] Exception fetching roster for ${team.id}:`, err);
            return null;
          });
      })
    ]);

    if (!injuryResponse.ok) {
      throw new Error(`Failed to fetch injury data: ${injuryResponse.statusText}`)
    }

    const injuryData = await injuryResponse.json();

    // Build a map of player names to teams from all rosters
    const playerToTeamMap = new Map<string, string>();
    let totalRosterPlayers = 0;
    let successfulRosters = 0;
    let failedRosters = 0;

    console.log(`[INJURY API] Processing ${rosterResponses.length} roster responses`);

    for (let i = 0; i < rosterResponses.length; i++) {
      const response = rosterResponses[i];
      if (response && response.ok) {
        successfulRosters++;
        try {
          const rosterData: TeamRosterResponse = await response.json();
          const team = allTeams[i];

          const allPlayers = [
            ...(rosterData.roster.activeRoster || []),
            ...(rosterData.roster.practiceSquad || []),
            ...(rosterData.roster.injuredReserve || []),
            ...(rosterData.roster.physicallyUnableToPerform || []),
            ...(rosterData.roster.nonFootballInjuryReserve || []),
            ...(rosterData.roster.suspended || []),
            ...(rosterData.roster.exempt || []),
          ];

          totalRosterPlayers += allPlayers.length;

          allPlayers.forEach(player => {
            const normalizedName = normalizePlayerName(player.name);
            playerToTeamMap.set(normalizedName, team.abbreviation);
          });
        } catch (e) {
          console.error(`[INJURY API] Error processing roster for team ${allTeams[i].id}:`, e);
          failedRosters++;
        }
      } else {
        failedRosters++;
        console.error(`[INJURY API] Failed roster response for team ${allTeams[i]?.id}: ${response ? `${response.status} ${response.statusText}` : 'null response'}`);
      }
    }

    console.log(`[INJURY API] Roster fetching complete: ${successfulRosters} successful, ${failedRosters} failed out of ${allTeams.length} teams`);
    console.log(`[INJURY API] Built player-to-team map with ${playerToTeamMap.size} unique players from ${totalRosterPlayers} roster entries`);

    // Process and organize injury data by team
    const injuries: Record<string, InjuryData[]> = {}
    let unmatchedPlayers: string[] = [];

    // Process each player from the API response
    Object.entries(injuryData).forEach(([playerID, playerData]: [string, any]) => {
      // Match player to team using roster data
      const normalizedInjuryName = normalizePlayerName(playerData.Name || '');
      const teamAbbr = playerToTeamMap.get(normalizedInjuryName) || 'N/A';

      if (teamAbbr === 'N/A') {
        unmatchedPlayers.push(playerData.Name);
      }

      const injury: InjuryData = {
        player: playerData.Name || 'Unknown Player',
        position: playerData.Position || 'N/A',
        team: teamAbbr,
        status: playerData.Status || 'Unknown',
        injury: playerData.Part || 'Undisclosed',
        playerID: playerID
      }

      // Add to ALL injuries list
      if (!injuries['ALL']) {
        injuries['ALL'] = []
      }
      injuries['ALL'].push(injury)
    })

    console.log(`Matched ${Object.keys(injuryData).length - unmatchedPlayers.length} out of ${Object.keys(injuryData).length} injured players`);
    console.log(`Unmatched players (${unmatchedPlayers.length}):`, unmatchedPlayers.slice(0, 20));

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