import { NextRequest, NextResponse } from 'next/server';
import { teams } from '@/data/teams';

const ALL_TEAM_IDS = Object.keys(teams);

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
  draft: {
    year: number;
    round: number;
    pick: number;
  } | null;
  birthDate: string;
  birthPlace: string;
}

interface RosterResponse {
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

interface PFSNPlayer {
  playerName: string;
  normalizedName: string;
  position: string;
  team: string;
  score: number;
  grade: string;
  seasonRank: number;
  overallRank: number;
  season: number;
  weeklyData: Array<{ week: number; score: number; grade: string; opponent: string }>;
  stats: Record<string, string | number>;
}

interface PFSNResponse {
  players: Record<string, PFSNPlayer>;
  positionMap: Record<string, string>;
}

function normalizePlayerName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .replace(/(jr|sr|ii|iii|iv)$/g, '');
}

async function fetchTeamRoster(teamId: string): Promise<RosterResponse | null> {
  try {
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NODE_ENV === 'production'
        ? 'https://profootballnetwork.com/nfl-hq'
        : 'http://localhost:3000';

    const response = await fetch(`${baseUrl}/nfl/teams/api/roster/${teamId}`, {
      next: { revalidate: 86400 },
    });

    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error(`Error fetching roster for ${teamId}:`, error);
    return null;
  }
}

async function fetchPFSNImpact(): Promise<PFSNResponse | null> {
  try {
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NODE_ENV === 'production'
        ? 'https://profootballnetwork.com/nfl-hq'
        : 'http://localhost:3000';

    const response = await fetch(`${baseUrl}/api/nfl/pfsn-impact`, {
      next: { revalidate: 86400 },
    });

    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('Error fetching PFSN Impact:', error);
    return null;
  }
}

function findPlayerInRoster(roster: RosterResponse['roster']): RosterPlayer | null {
  const allPlayers = [
    ...roster.activeRoster,
    ...roster.practiceSquad,
    ...roster.injuredReserve,
    ...roster.physicallyUnableToPerform,
    ...roster.nonFootballInjuryReserve,
    ...roster.suspended,
    ...roster.exempt,
  ];
  return allPlayers[0] || null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ playerSlug: string }> }
) {
  try {
    const { playerSlug } = await params;

    if (!playerSlug) {
      return NextResponse.json(
        { error: 'Player slug is required' },
        { status: 400 }
      );
    }

    // Search all team rosters for the player
    let foundPlayer: RosterPlayer | null = null;
    let foundTeamId: string | null = null;

    // Fetch all rosters in parallel
    const rosterPromises = ALL_TEAM_IDS.map(async (teamId) => {
      const roster = await fetchTeamRoster(teamId);
      if (!roster) return null;

      const allPlayers = [
        ...roster.roster.activeRoster,
        ...roster.roster.practiceSquad,
        ...roster.roster.injuredReserve,
        ...roster.roster.physicallyUnableToPerform,
        ...roster.roster.nonFootballInjuryReserve,
        ...roster.roster.suspended,
        ...roster.roster.exempt,
      ];

      const player = allPlayers.find(p => p.slug === playerSlug);
      if (player) {
        return { player, teamId };
      }
      return null;
    });

    const results = await Promise.all(rosterPromises);
    const found = results.find(r => r !== null);

    if (found) {
      foundPlayer = found.player;
      foundTeamId = found.teamId;
    }

    if (!foundPlayer || !foundTeamId) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }

    // Get team info
    const team = teams[foundTeamId];

    // Fetch PFSN Impact data
    const pfsnData = await fetchPFSNImpact();

    // Try to match player to PFSN data
    const normalizedName = normalizePlayerName(foundPlayer.name);
    const pfsnPlayer = pfsnData?.players?.[normalizedName] || null;

    // Build headshot URL
    const headshotUrl = `https://staticd.profootballnetwork.com/skm/assets/player-images/nfl/${foundPlayer.slug}.png`;

    // Construct response
    const playerProfile = {
      // Bio
      name: foundPlayer.name,
      slug: foundPlayer.slug,
      team: {
        id: foundTeamId,
        name: team.fullName,
        abbreviation: team.abbreviation,
        logo: team.logoUrl,
        primaryColor: team.primaryColor,
        secondaryColor: team.secondaryColor,
      },
      position: foundPlayer.position,
      positionFull: foundPlayer.positionFull,
      jerseyNumber: foundPlayer.jerseyNumber,
      age: foundPlayer.age,
      height: foundPlayer.height,
      weight: foundPlayer.weight,
      college: foundPlayer.college,
      experience: foundPlayer.experience,
      experienceLabel: foundPlayer.experience === 0 ? 'Rookie' : `${foundPlayer.experience} ${foundPlayer.experience === 1 ? 'Year' : 'Years'}`,
      draft: foundPlayer.draft,
      birthDate: foundPlayer.birthDate,
      birthPlace: foundPlayer.birthPlace,
      status: foundPlayer.status,
      headshotUrl,

      // PFSN Impact
      pfsnImpact: pfsnPlayer ? {
        score: pfsnPlayer.score,
        grade: pfsnPlayer.grade,
        seasonRank: pfsnPlayer.seasonRank,
        overallRank: pfsnPlayer.overallRank,
        season: pfsnPlayer.season,
        weeklyData: pfsnPlayer.weeklyData,
        stats: pfsnPlayer.stats,
      } : null,
    };

    return NextResponse.json({
      player: playerProfile,
      lastUpdated: new Date().toISOString(),
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600',
      },
    });
  } catch (error) {
    console.error('Player API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch player data' },
      { status: 500 }
    );
  }
}
