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
    // Just fetch injury data from Rotoballer - team matching will be done client-side
    const injuryResponse = await fetch(
      'https://www.rotoballer.com/api/rbapps/nfl-injuries.php?partner=prosportsnetwork&key=x63sLHVNR4a37LvBetiiBXvmEs6XKpVQS1scgVoYf3kxXZ4Kl8bC2BahiSsP',
      {
        headers: {
          'Accept': 'application/json',
        },
        next: { revalidate: 10800 } // Cache for 3 hours
      }
    );

    if (!injuryResponse.ok) {
      throw new Error(`Failed to fetch injury data: ${injuryResponse.statusText}`)
    }

    const injuryData = await injuryResponse.json();

    // Process and organize injury data - client will add team info
    const injuries: Record<string, InjuryData[]> = {}

    // Process each player from the API response
    Object.entries(injuryData).forEach(([playerID, playerData]: [string, any]) => {
      const injury: InjuryData = {
        player: playerData.Name || 'Unknown Player',
        position: playerData.Position || 'N/A',
        team: playerData.Team || 'N/A', // Use team from Rotoballer if available
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