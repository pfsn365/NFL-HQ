import { PlayerData } from './types';
import { getAllTeams } from '../teams';

// Export types
export type { PlayerData };

// Team ID to file mapping
const TEAM_IDS = [
  'atlanta-hawks',
  'boston-celtics',
  'brooklyn-nets',
  'charlotte-hornets',
  'chicago-bulls',
  'cleveland-cavaliers',
  'dallas-mavericks',
  'denver-nuggets',
  'detroit-pistons',
  'golden-state-warriors',
  'houston-rockets',
  'indiana-pacers',
  'los-angeles-clippers',
  'los-angeles-lakers',
  'memphis-grizzlies',
  'miami-heat',
  'milwaukee-bucks',
  'minnesota-timberwolves',
  'new-orleans-pelicans',
  'new-york-knicks',
  'oklahoma-city-thunder',
  'orlando-magic',
  'philadelphia-76ers',
  'phoenix-suns',
  'portland-trail-blazers',
  'sacramento-kings',
  'san-antonio-spurs',
  'toronto-raptors',
  'utah-jazz',
  'washington-wizards',
] as const;

type TeamId = typeof TEAM_IDS[number];

// Cache for loaded teams
const playerCache = new Map<TeamId, PlayerData[]>();
let allPlayersCache: PlayerData[] | null = null;
let currentPlayersCache: PlayerData[] | null = null;
let alltimePlayersCache: PlayerData[] | null = null;

// API Player interface (from roster API)
interface APIPlayer {
  name: string;
  slug: string;
  jersey_no: string;
  is_active: boolean;
  height_in_inch?: number;
  height_in_cm?: number;
  weight_in_lbs?: number;
  weight_in_kg?: number;
  positions: Array<{
    name: string;
    abbreviation: string;
  }>;
}

/**
 * Format height from inches to feet-inches format
 */
function formatHeight(inches: number | undefined): string | undefined {
  if (!inches) return undefined;
  const feet = Math.floor(inches / 12);
  const remainingInches = inches % 12;
  return `${feet}-${remainingInches}`;
}

/**
 * Lazy load players for a specific team from API
 */
export async function getPlayersByTeam(teamId: string): Promise<PlayerData[]> {
  const normalizedTeamId = teamId.toLowerCase() as TeamId;

  // Check cache first
  if (playerCache.has(normalizedTeamId)) {
    return playerCache.get(normalizedTeamId)!;
  }

  try {
    const response = await fetch(
      `/api/nba/roster/${normalizedTeamId}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch roster for ${normalizedTeamId}`);
    }

    const data = await response.json();

    if (!data.squad || !Array.isArray(data.squad)) {
      console.warn(`No squad data for team: ${normalizedTeamId}`);
      return [];
    }

    // Find team data to get team full name
    const allTeams = getAllTeams();
    const team = allTeams.find(t => t.id === normalizedTeamId);
    const teamName = team?.fullName || normalizedTeamId;

    // Transform API players to PlayerData format
    const players: PlayerData[] = data.squad
      .filter((player: APIPlayer) => player.is_active)
      .map((player: APIPlayer) => ({
        id: player.slug || `${player.name.toLowerCase().replace(/\s+/g, '-')}-${player.jersey_no}`,
        name: player.name,
        team: teamName,
        position: player.positions?.[0]?.abbreviation || 'N/A',
        number: player.jersey_no,
        ppg: '0.0', // API doesn't provide stats, default to 0
        apg: '0.0',
        rpg: '0.0',
        imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/placeholder.png',
        era: 'current',
        height: formatHeight(player.height_in_inch),
        weight: player.weight_in_lbs ? String(player.weight_in_lbs) : undefined,
      }));

    playerCache.set(normalizedTeamId, players);
    return players;
  } catch (error) {
    console.error(`Failed to load players for team: ${teamId}`, error);

    // Fallback to static data if available
    try {
      const module = await import(`./${normalizedTeamId}`);
      const players = module.default;
      playerCache.set(normalizedTeamId, players);
      return players;
    } catch (fallbackError) {
      console.error(`Fallback also failed for team: ${teamId}`);
      return [];
    }
  }
}

/**
 * Load alltime players from static files
 */
async function getAlltimePlayers(): Promise<PlayerData[]> {
  // Check cache first
  if (alltimePlayersCache) {
    return alltimePlayersCache;
  }

  const alltimePlayers: PlayerData[] = [];

  for (const teamId of TEAM_IDS) {
    try {
      const module = await import(`./${teamId}`);
      const staticPlayers = module.default as PlayerData[];
      // Only add alltime players from static files
      const alltime = staticPlayers.filter(p => p.era === 'alltime');
      alltimePlayers.push(...alltime);
    } catch {
      // No static file for this team, skip
    }
  }

  alltimePlayersCache = alltimePlayers;
  return alltimePlayers;
}

/**
 * Get only current players (faster initial load)
 */
export async function getCurrentPlayers(): Promise<PlayerData[]> {
  // Check cache first
  if (currentPlayersCache) {
    return currentPlayersCache;
  }

  try {
    const currentPlayersArrays = await Promise.all(
      TEAM_IDS.map(teamId => getPlayersByTeam(teamId))
    );

    const currentPlayers = currentPlayersArrays.flat();
    currentPlayersCache = currentPlayers;

    console.log(`Loaded ${currentPlayers.length} current players`);
    return currentPlayers;
  } catch (error) {
    console.error('Failed to load current players:', error);
    return [];
  }
}

/**
 * Get only all-time players (lazy loaded)
 */
export async function getAlltimePlayersPublic(): Promise<PlayerData[]> {
  return getAlltimePlayers();
}

/**
 * Get all players across all teams
 * Loads current players from API and alltime players from static files
 */
export async function getAllPlayers(): Promise<PlayerData[]> {
  // Check cache first
  if (allPlayersCache) {
    return allPlayersCache;
  }

  try {
    // Load current players from API and alltime players from static files in parallel
    const [currentPlayersArrays, alltimePlayers] = await Promise.all([
      Promise.all(TEAM_IDS.map(teamId => getPlayersByTeam(teamId))),
      getAlltimePlayers()
    ]);

    // Flatten current players
    const currentPlayers = currentPlayersArrays.flat();

    // Combine current and alltime players
    const allPlayers = [...currentPlayers, ...alltimePlayers];

    // Cache the result
    allPlayersCache = allPlayers;

    console.log(`Loaded ${currentPlayers.length} current players and ${alltimePlayers.length} alltime players`);
    return allPlayers;
  } catch (error) {
    console.error('Failed to load all players:', error);
    return [];
  }
}

/**
 * Get player by ID
 * More efficient - only loads necessary teams
 */
export async function getPlayerById(id: string): Promise<PlayerData | undefined> {
  // If all players are cached, search there
  if (allPlayersCache) {
    return allPlayersCache.find(player => player.id === id);
  }

  // Otherwise, search team by team
  for (const teamId of TEAM_IDS) {
    const players = await getPlayersByTeam(teamId);
    const player = players.find(p => p.id === id);
    if (player) {
      return player;
    }
  }

  return undefined;
}

/**
 * Preload teams for better UX
 * Can be called on app initialization
 */
export function preloadTeams(teamIds: string[]): void {
  teamIds.forEach(teamId => {
    // Fire and forget - loads in background
    getPlayersByTeam(teamId).catch(console.error);
  });
}

/**
 * Clear the cache (useful for testing or refreshing data)
 */
export function clearPlayerCache(): void {
  playerCache.clear();
  allPlayersCache = null;
}
