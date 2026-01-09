import { NextResponse } from 'next/server';

interface InjuryData {
  Name: string;
  Status: string;
  Part: string;
  Position: string;
  PlayerID: string;
}

interface InjuryApiResponse {
  [playerID: string]: InjuryData;
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
  impactPlus: number;
  isActive: boolean;
  isInjured: boolean;
  isSuspended: boolean;
  isPracticeSquad: boolean;
  isPhysicallyUnable: boolean;
  isNonFootballInjuryReserve: boolean;
  isExempt: boolean;
  status: string;
  draft: {
    year: number;
    round: number;
    pick: number;
  } | null;
  birthDate: string;
  birthPlace: string;
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
  totalPlayers: number;
  lastUpdated: string;
}

interface PlayerInjury {
  player: RosterPlayer;
  injury: InjuryData;
}

interface CategorizedInjuries {
  questionable: PlayerInjury[];
  out: PlayerInjury[];
  doubtful: PlayerInjury[];
  injuredReserve: PlayerInjury[];
  physicallyUnableToPerform: PlayerInjury[];
  nonFootballInjuryReserve: PlayerInjury[];
}

// Function to normalize name for matching
function normalizePlayerName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

// Function to generate name variations for matching
function generateNameVariations(name: string): string[] {
  const variations = [name];
  const normalized = normalizePlayerName(name);

  // Add normalized version
  variations.push(normalized);

  // Remove suffixes (Jr., Sr., II, III, IV, V)
  const suffixPattern = /\s+(jr\.?|sr\.?|ii|iii|iv|v)$/i;
  const withoutSuffix = normalized.replace(suffixPattern, '');
  if (withoutSuffix !== normalized) {
    variations.push(withoutSuffix);
  }

  // Handle common name shortenings
  const parts = normalized.split(' ');
  if (parts.length >= 2) {
    const firstName = parts[0];
    const lastName = parts.slice(1).join(' ');

    // Common first name shortenings
    const nameMap: Record<string, string[]> = {
      'anthony': ['tony'],
      'benjamin': ['ben'],
      'cameron': ['cam'],
      'christopher': ['chris'],
      'daniel': ['dan', 'danny'],
      'david': ['dave'],
      'edward': ['ed', 'eddie'],
      'gregory': ['greg'],
      'james': ['jim', 'jimmy'],
      'jonathan': ['jon'],
      'joseph': ['joe'],
      'kenneth': ['ken', 'kenny'],
      'michael': ['mike'],
      'nicholas': ['nick'],
      'robert': ['rob', 'bob', 'bobby'],
      'samuel': ['sam'],
      'steven': ['steve'],
      'thomas': ['tom', 'tommy'],
      'william': ['will', 'bill', 'billy'],
      'zachary': ['zach']
    };

    // Add shortened versions
    if (nameMap[firstName]) {
      nameMap[firstName].forEach(shortName => {
        variations.push(`${shortName} ${lastName}`);
      });
    }

    // Add reverse mappings (e.g., if injury report has "Cam Newton", match to "Cameron Newton")
    Object.entries(nameMap).forEach(([fullName, shortNames]) => {
      if (shortNames.includes(firstName)) {
        variations.push(`${fullName} ${lastName}`);
      }
    });
  }

  return [...new Set(variations)]; // Remove duplicates
}

// Function to match injury to roster player
function findPlayerMatch(injuryName: string, rosterPlayers: RosterPlayer[]): RosterPlayer | null {
  const injuryVariations = generateNameVariations(injuryName);

  for (const player of rosterPlayers) {
    const rosterVariations = generateNameVariations(player.name);

    // Check if any injury variation matches any roster variation
    for (const injuryVar of injuryVariations) {
      for (const rosterVar of rosterVariations) {
        if (injuryVar === rosterVar) {
          return player;
        }
      }
    }
  }

  return null;
}

// Function to categorize injuries by status
function categorizeInjuries(playerInjuries: PlayerInjury[]): CategorizedInjuries {
  const categorized: CategorizedInjuries = {
    questionable: [],
    out: [],
    doubtful: [],
    injuredReserve: [],
    physicallyUnableToPerform: [],
    nonFootballInjuryReserve: []
  };

  playerInjuries.forEach(playerInjury => {
    const status = playerInjury.injury.Status.toLowerCase();
    const playerStatus = playerInjury.player.status.toLowerCase();

    // Check player status first (from roster)
    if (playerStatus.includes('injured reserve')) {
      categorized.injuredReserve.push(playerInjury);
    } else if (playerStatus.includes('physically unable')) {
      categorized.physicallyUnableToPerform.push(playerInjury);
    } else if (playerStatus.includes('non-football injury')) {
      categorized.nonFootballInjuryReserve.push(playerInjury);
    } else if (status.includes('questionable')) {
      categorized.questionable.push(playerInjury);
    } else if (status.includes('out')) {
      categorized.out.push(playerInjury);
    } else if (status.includes('doubtful')) {
      categorized.doubtful.push(playerInjury);
    } else if (status.includes('ir') || status.includes('injured reserve')) {
      categorized.injuredReserve.push(playerInjury);
    } else if (status.includes('pup') || status.includes('physically unable')) {
      categorized.physicallyUnableToPerform.push(playerInjury);
    } else if (status.includes('nfi') || status.includes('non-football')) {
      categorized.nonFootballInjuryReserve.push(playerInjury);
    } else {
      // Default to questionable for unknown statuses
      categorized.questionable.push(playerInjury);
    }
  });

  return categorized;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const { teamId } = await params;

    // Fetch both injury data and team roster in parallel
    // Determine base URL and API path for internal API calls
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3003';

    // Include basePath in production (nfl-hq is our basePath)
    const apiPath = process.env.VERCEL_URL
      ? `/nfl-hq/api/nfl/teams/api/roster/${teamId}`
      : `/api/nfl/teams/api/roster/${teamId}`;

    const rosterUrl = `${baseUrl}${apiPath}`;

    const [injuryResponse, rosterResponse] = await Promise.all([
      fetch(
        'https://www.rotoballer.com/api/rbapps/nfl-injuries.php?partner=prosportsnetwork&key=x63sLHVNR4a37LvBetiiBXvmEs6XKpVQS1scgVoYf3kxXZ4Kl8bC2BahiSsP',
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; NFL-Team-Pages/1.0)',
          },
          next: { revalidate: 10800 } // Cache for 3 hours
        }
      ),
      fetch(rosterUrl, {
        next: { revalidate: 86400 } // Cache for 24 hours
      })
    ]);

    if (!injuryResponse.ok) {
      throw new Error(`Rotoballer API error: ${injuryResponse.status}`);
    }

    if (!rosterResponse.ok) {
      throw new Error(`Roster API error: ${rosterResponse.status}`);
    }

    const injuryData: InjuryApiResponse = await injuryResponse.json();
    const rosterData: TeamRosterResponse = await rosterResponse.json();

    // Convert the injury object to an array
    const injuries = Object.values(injuryData);

    // Get all roster players except suspended and exempt (as requested)
    const allRosterPlayers = [
      ...rosterData.roster.activeRoster,
      ...rosterData.roster.practiceSquad,
      ...rosterData.roster.injuredReserve,
      ...rosterData.roster.physicallyUnableToPerform,
      ...rosterData.roster.nonFootballInjuryReserve,
      // Exclude suspended and exempt players as requested
    ];

    // Match injuries to roster players
    const matchedInjuries: PlayerInjury[] = [];

    for (const injury of injuries) {
      // Skip suspended players as requested
      if (injury.Status.toLowerCase().includes('suspended')) {
        continue;
      }

      const matchedPlayer = findPlayerMatch(injury.Name, allRosterPlayers);
      if (matchedPlayer) {
        matchedInjuries.push({
          player: matchedPlayer,
          injury
        });
      }
    }

    // Categorize injuries by status
    const categorizedInjuries = categorizeInjuries(matchedInjuries);

    return NextResponse.json({
      teamId,
      injuries: categorizedInjuries,
      totalMatched: matchedInjuries.length,
      totalInjuries: injuries.length,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Injuries API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch injury data' },
      { status: 500 }
    );
  }
}