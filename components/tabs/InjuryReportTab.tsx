'use client';

import { useState, useEffect } from 'react';
import { TeamData } from '@/data/teams';
import { getApiPath } from '@/utils/api';

interface InjuryData {
  Name: string;
  Status: string;
  Part: string;
  Position: string;
  PlayerID: string;
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

interface TeamInjuryApiResponse {
  teamId: string;
  injuries: CategorizedInjuries;
  totalMatched: number;
  totalInjuries: number;
  lastUpdated: string;
}

// Helper function to generate PFSN URL
const getPFSNUrl = (playerName: string) => {
  return `https://www.profootballnetwork.com/players/${playerName.toLowerCase().replace(/[.\s]+/g, '-').replace(/[^\w-]/g, '').replace(/-+/g, '-')}/`;
};

// Helper function to simplify injury descriptions
const simplifyInjury = (injury: string) => {
  const injuryLower = injury.toLowerCase();
  
  // Common body parts mapping
  const bodyParts = {
    'knee': ['knee'],
    'ankle': ['ankle'],
    'shoulder': ['shoulder'],
    'hamstring': ['hamstring'],
    'quad': ['quad', 'quadriceps'],
    'calf': ['calf'],
    'groin': ['groin'],
    'hip': ['hip'],
    'back': ['back'],
    'neck': ['neck'],
    'wrist': ['wrist'],
    'hand': ['hand'],
    'finger': ['finger'],
    'thumb': ['thumb'],
    'elbow': ['elbow'],
    'foot': ['foot'],
    'toe': ['toe'],
    'chest': ['chest', 'pectoral'],
    'ribs': ['rib', 'ribs'],
    'concussion': ['concussion', 'head'],
    'illness': ['illness', 'sick'],
    'personal': ['personal']
  };
  
  // Find matching body part
  for (const [simplified, keywords] of Object.entries(bodyParts)) {
    if (keywords.some(keyword => injuryLower.includes(keyword))) {
      return simplified.charAt(0).toUpperCase() + simplified.slice(1);
    }
  }
  
  // If no match found, return the original injury
  return injury;
};



interface InjuryReportTabProps {
  team: TeamData;
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

    // Priority: Check player roster status first, then injury status
    // This ensures IR players show as "IR" not "Out"
    if (playerStatus.includes('injured reserve') || status.includes('ir') || status.includes('injured reserve')) {
      // Override the injury status to show "IR" instead of "Out"
      playerInjury.injury.Status = 'IR';
      categorized.injuredReserve.push(playerInjury);
    } else if (playerStatus.includes('physically unable') || status.includes('pup') || status.includes('physically unable')) {
      // Override the injury status to show "PUP"
      playerInjury.injury.Status = 'PUP';
      categorized.physicallyUnableToPerform.push(playerInjury);
    } else if (playerStatus.includes('non-football injury') || status.includes('nfi') || status.includes('non-football')) {
      // Override the injury status to show "NFI"
      playerInjury.injury.Status = 'NFI';
      categorized.nonFootballInjuryReserve.push(playerInjury);
    } else if (status.includes('questionable')) {
      categorized.questionable.push(playerInjury);
    } else if (status.includes('doubtful')) {
      categorized.doubtful.push(playerInjury);
    } else if (status.includes('out')) {
      categorized.out.push(playerInjury);
    } else {
      // Default to questionable for unknown statuses
      categorized.questionable.push(playerInjury);
    }
  });

  return categorized;
}

export default function InjuryReportTab({ team }: InjuryReportTabProps) {
  const [injuryData, setInjuryData] = useState<CategorizedInjuries | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [totalMatched, setTotalMatched] = useState<number>(0);
  const [totalInjuries, setTotalInjuries] = useState<number>(0);

  useEffect(() => {
    const fetchAndMatchInjuries = async () => {
      try {
        // Fetch both injury data and roster data in parallel
        const [injuryResponse, rosterResponse] = await Promise.all([
          fetch(getApiPath('nfl/teams/api/injuries')),
          fetch(getApiPath(`nfl/teams/api/roster/${team.id}`))
        ]);

        if (!injuryResponse.ok) {
          throw new Error('Failed to fetch injury data');
        }

        if (!rosterResponse.ok) {
          throw new Error('Failed to fetch roster data');
        }

        const injuryData = await injuryResponse.json();
        const rosterData = await rosterResponse.json();

        if (!injuryData.success) {
          throw new Error(injuryData.error || 'Failed to load injury data');
        }

        // Get all injuries from the global API
        const allInjuries = injuryData.injuries['ALL'] || [];

        // Get all roster players except suspended and exempt
        const allRosterPlayers = [
          ...rosterData.roster.activeRoster,
          ...rosterData.roster.practiceSquad,
          ...rosterData.roster.injuredReserve,
          ...rosterData.roster.physicallyUnableToPerform,
          ...rosterData.roster.nonFootballInjuryReserve,
          // Exclude suspended and exempt as requested
        ];

        // Match injuries to roster players
        const matchedInjuries: PlayerInjury[] = [];

        for (const injury of allInjuries) {
          // Skip suspended players as requested
          if (injury.status && injury.status.toLowerCase().includes('suspended')) {
            continue;
          }

          const matchedPlayer = findPlayerMatch(injury.player, allRosterPlayers);
          if (matchedPlayer) {
            matchedInjuries.push({
              player: matchedPlayer,
              injury: {
                Name: injury.player,
                Status: injury.status,
                Part: injury.injury,
                Position: injury.position,
                PlayerID: injury.playerID
              }
            });
          }
        }

        // Categorize the matched injuries
        const categorizedInjuries = categorizeInjuries(matchedInjuries);

        setInjuryData(categorizedInjuries);
        setTotalMatched(matchedInjuries.length);
        setTotalInjuries(allInjuries.length);
        setLastUpdated(injuryData.lastUpdated || new Date().toISOString());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchAndMatchInjuries();
  }, [team.id]);
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{team.fullName} Injury Report</h2>
          <div className="h-1 rounded-full" style={{ backgroundColor: team.primaryColor, width: 'fit-content', minWidth: '280px' }}></div>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-20 bg-gray-200 rounded-lg"></div>
          <div className="h-20 bg-gray-200 rounded-lg"></div>
          <div className="h-20 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{team.fullName} Injury Report</h2>
          <div className="h-1 rounded-full" style={{ backgroundColor: team.primaryColor, width: 'fit-content', minWidth: '280px' }}></div>
        </div>
        <div className="text-center py-8">
          <div className="text-red-600 mb-2">Error loading injury data</div>
          <div className="text-gray-600 text-sm">{error}</div>
        </div>
      </div>
    );
  }

  // Helper function to render injury category section
  const renderInjuryCategory = (title: string, injuries: PlayerInjury[], colorClass: string, bgClass: string) => {
    if (injuries.length === 0) return null;

    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border-l-4" style={{ borderLeftColor: team.primaryColor }}>
        <h3 className={`text-base sm:text-lg font-semibold mb-4 pb-2 border-b border-gray-300 ${colorClass}`}>
          {title} ({injuries.length})
        </h3>
        <div className="space-y-3">
          {injuries.map((playerInjury, index) => (
            <div key={index} className={`flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 p-3 sm:p-4 rounded-lg ${bgClass}`}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
                <div className="text-sm sm:text-base font-medium">
                  <a
                    href={getPFSNUrl(playerInjury.player.name)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline cursor-pointer"
                    style={{ color: team.primaryColor }}
                  >
                    {playerInjury.player.name}
                  </a>
                </div>
                <div className="text-xs sm:text-sm text-gray-600">
                  #{playerInjury.player.jerseyNumber} • {playerInjury.player.position}
                </div>
              </div>
              <div className="text-left sm:text-right">
                <div className="text-sm sm:text-base text-gray-700 font-medium">
                  {simplifyInjury(playerInjury.injury.Part)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{team.fullName} Injury Report</h2>
        <div className="h-1 rounded-full" style={{ backgroundColor: team.primaryColor, width: 'fit-content', minWidth: '280px' }}></div>
        {lastUpdated && (
          <div className="text-xs text-gray-600 mt-2">
            <span>Last updated: {new Date(lastUpdated).toLocaleString()}</span>
          </div>
        )}
      </div>

      {injuryData ? (
        <div className="space-y-6">
          {/* Show total count */}
          {totalMatched === 0 ? (
            <div className="text-center py-8 text-gray-600">
              <div className="text-lg mb-2">🏥 No injuries found</div>
              <div className="text-sm">
                Great news! No {team.fullName} players are currently on the injury report.
              </div>
            </div>
          ) : (
            <>
              {/* Questionable */}
              {renderInjuryCategory(
                'Questionable',
                injuryData.questionable,
                'text-yellow-700',
                'bg-yellow-50 border-l-4 border-yellow-400'
              )}

              {/* Doubtful */}
              {renderInjuryCategory(
                'Doubtful',
                injuryData.doubtful,
                'text-orange-700',
                'bg-orange-50 border-l-4 border-orange-400'
              )}

              {/* Out */}
              {renderInjuryCategory(
                'Out',
                injuryData.out,
                'text-red-700',
                'bg-red-50 border-l-4 border-red-400'
              )}

              {/* Injured Reserve */}
              {renderInjuryCategory(
                'Injured Reserve',
                injuryData.injuredReserve,
                'text-red-800',
                'bg-red-100 border-l-4 border-red-600'
              )}

              {/* Physically Unable to Perform */}
              {renderInjuryCategory(
                'Physically Unable to Perform',
                injuryData.physicallyUnableToPerform,
                'text-purple-700',
                'bg-purple-50 border-l-4 border-purple-400'
              )}

              {/* Non-Football Injury Reserve */}
              {renderInjuryCategory(
                'Non-Football Injury Reserve',
                injuryData.nonFootballInjuryReserve,
                'text-indigo-700',
                'bg-indigo-50 border-l-4 border-indigo-400'
              )}
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}