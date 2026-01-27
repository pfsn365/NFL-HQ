'use client';

import { useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { getApiPath } from '@/utils/api';

// SWR fetcher function
const fetcher = (url: string) => fetch(url).then(res => res.json());

interface RosterPlayer {
  name: string;
  slug: string;
  jerseyNumber: number;
  position: string;
  isInjured: boolean;
  status: string;
}

interface InjuryData {
  player: string;
  position: string;
  status: string;
  injury: string;
  playerID?: string;
}

interface PlayerInjury {
  player: RosterPlayer;
  injury: InjuryData;
}

interface CategorizedInjuries {
  questionable: PlayerInjury[];
  doubtful: PlayerInjury[];
  out: PlayerInjury[];
  injuredReserve: PlayerInjury[];
  physicallyUnableToPerform: PlayerInjury[];
  nonFootballInjuryReserve: PlayerInjury[];
}

// Helper function to normalize name for matching
function normalizePlayerName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Function to generate name variations for matching
function generateNameVariations(name: string): string[] {
  const variations = [name];
  const normalized = normalizePlayerName(name);
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

    const nameMap: Record<string, string[]> = {
      'anthony': ['tony'],
      'benjamin': ['ben'],
      'cameron': ['cam'],
      'christopher': ['chris'],
      'daniel': ['dan', 'danny'],
      'david': ['dave'],
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

    if (nameMap[firstName]) {
      nameMap[firstName].forEach(shortName => {
        variations.push(`${shortName} ${lastName}`);
      });
    }

    Object.entries(nameMap).forEach(([fullName, shortNames]) => {
      if (shortNames.includes(firstName)) {
        variations.push(`${fullName} ${lastName}`);
      }
    });
  }

  return [...new Set(variations)];
}

// Function to match injury to roster player
function findPlayerMatch(injuryName: string, rosterPlayers: RosterPlayer[]): RosterPlayer | null {
  const injuryVariations = generateNameVariations(injuryName);

  for (const player of rosterPlayers) {
    const rosterVariations = generateNameVariations(player.name);
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
    doubtful: [],
    out: [],
    injuredReserve: [],
    physicallyUnableToPerform: [],
    nonFootballInjuryReserve: []
  };

  playerInjuries.forEach(playerInjury => {
    const status = playerInjury.injury.status.toLowerCase();
    const playerStatus = playerInjury.player.status.toLowerCase();

    if (playerStatus.includes('injured reserve') || status.includes('ir') || status.includes('injured reserve')) {
      playerInjury.injury.status = 'IR';
      categorized.injuredReserve.push(playerInjury);
    } else if (playerStatus.includes('physically unable') || status.includes('pup')) {
      playerInjury.injury.status = 'PUP';
      categorized.physicallyUnableToPerform.push(playerInjury);
    } else if (playerStatus.includes('non-football injury') || status.includes('nfi')) {
      playerInjury.injury.status = 'NFI';
      categorized.nonFootballInjuryReserve.push(playerInjury);
    } else if (status.includes('questionable')) {
      categorized.questionable.push(playerInjury);
    } else if (status.includes('doubtful')) {
      categorized.doubtful.push(playerInjury);
    } else if (status.includes('out')) {
      categorized.out.push(playerInjury);
    } else {
      categorized.questionable.push(playerInjury);
    }
  });

  return categorized;
}

// Helper function to simplify injury descriptions
const simplifyInjury = (injury: string) => {
  const injuryLower = injury.toLowerCase();
  const bodyParts: Record<string, string[]> = {
    'Knee': ['knee'],
    'Ankle': ['ankle'],
    'Shoulder': ['shoulder'],
    'Hamstring': ['hamstring'],
    'Quad': ['quad', 'quadriceps'],
    'Calf': ['calf'],
    'Groin': ['groin'],
    'Hip': ['hip'],
    'Back': ['back'],
    'Neck': ['neck'],
    'Wrist': ['wrist'],
    'Hand': ['hand'],
    'Finger': ['finger'],
    'Elbow': ['elbow'],
    'Foot': ['foot'],
    'Toe': ['toe'],
    'Chest': ['chest', 'pectoral'],
    'Ribs': ['rib', 'ribs'],
    'Concussion': ['concussion', 'head'],
    'Illness': ['illness', 'sick'],
    'Personal': ['personal']
  };

  for (const [simplified, keywords] of Object.entries(bodyParts)) {
    if (keywords.some(keyword => injuryLower.includes(keyword))) {
      return simplified;
    }
  }
  return injury;
};

interface TeamInjuryData {
  injuries: CategorizedInjuries;
  totalMatched: number;
}

type SelectedTeam = 'patriots' | 'seahawks';

export default function InjuryReportTab() {
  const [selectedTeam, setSelectedTeam] = useState<SelectedTeam>('patriots');

  // Use SWR for efficient caching - data is shared across components
  const { data: injuryData, error: injuryError } = useSWR(
    getApiPath('nfl/teams/api/injuries'),
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 300000 } // 5 minute deduping
  );

  const { data: patriotsRoster } = useSWR(
    getApiPath('nfl/teams/api/roster/new-england-patriots'),
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 300000 }
  );

  const { data: seahawksRoster } = useSWR(
    getApiPath('nfl/teams/api/roster/seattle-seahawks'),
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 300000 }
  );

  // Process injuries only when data is available
  const processTeamInjuries = (roster: any): TeamInjuryData | null => {
    if (!injuryData || !roster) return null;

    const allInjuries = injuryData.injuries?.['ALL'] || [];
    const allPlayers: RosterPlayer[] = [
      ...(roster.roster?.activeRoster || []),
      ...(roster.roster?.practiceSquad || []),
      ...(roster.roster?.injuredReserve || []),
      ...(roster.roster?.physicallyUnableToPerform || []),
      ...(roster.roster?.nonFootballInjuryReserve || []),
    ];

    const matched: PlayerInjury[] = [];
    for (const injury of allInjuries) {
      if (injury.status?.toLowerCase().includes('suspended')) continue;
      const matchedPlayer = findPlayerMatch(injury.player, allPlayers);
      if (matchedPlayer) {
        matched.push({
          player: matchedPlayer,
          injury: {
            player: injury.player,
            position: injury.position,
            status: injury.status,
            injury: injury.injury,
            playerID: injury.playerID,
          }
        });
      }
    }

    return {
      injuries: categorizeInjuries(matched),
      totalMatched: matched.length,
    };
  };

  const patriotsInjuries = processTeamInjuries(patriotsRoster);
  const seahawksInjuries = processTeamInjuries(seahawksRoster);

  const loading = !injuryData || !patriotsRoster || !seahawksRoster;
  const error = injuryError ? 'Failed to load injury reports' : null;

  const renderInjuryCategory = (
    title: string,
    injuries: PlayerInjury[],
    colorClass: string,
    bgClass: string,
    teamColor: string
  ) => {
    if (injuries.length === 0) return null;

    return (
      <div className="bg-white rounded-xl p-4 shadow-sm border-l-4" style={{ borderLeftColor: teamColor }}>
        <h4 className={`text-sm font-semibold mb-3 pb-2 border-b border-gray-200 ${colorClass}`}>
          {title} ({injuries.length})
        </h4>
        <div className="space-y-2">
          {injuries.map((playerInjury, idx) => (
            <div key={idx} className={`flex items-center gap-3 p-2 rounded-lg ${bgClass}`}>
              <img
                src={`https://staticd.profootballnetwork.com/skm/assets/player-images/nfl/${playerInjury.player.slug}.png?w=48`}
                alt={playerInjury.player.name}
                className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const fallback = target.nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  backgroundColor: `${teamColor}20`,
                  display: 'none'
                }}
              >
                <span className="font-semibold text-[10px]" style={{ color: teamColor }}>
                  {playerInjury.player.name.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <Link
                  href={`/players/${playerInjury.player.slug}`}
                  className="font-medium text-sm hover:underline cursor-pointer"
                  style={{ color: teamColor }}
                >
                  {playerInjury.player.name}
                </Link>
                <div className="text-xs text-gray-500">
                  #{playerInjury.player.jerseyNumber} • {playerInjury.player.position}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-700">
                  {simplifyInjury(playerInjury.injury.injury)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderTeamInjuries = (
    teamData: TeamInjuryData | null,
    teamName: string,
    teamLogo: string,
    teamColor: string
  ) => {
    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b" style={{ backgroundColor: teamColor }}>
          <div className="flex items-center gap-3">
            <img src={teamLogo} alt={teamName} className="w-10 h-10 object-contain" />
            <h3 className="text-lg font-bold text-white">{teamName} Injury Report</h3>
          </div>
        </div>

        <div className="p-4">
          {!teamData || teamData.totalMatched === 0 ? (
            <div className="text-center py-8 text-gray-600">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="font-medium text-green-600">No injuries reported</p>
              <p className="text-sm text-gray-500">All players are healthy and available</p>
            </div>
          ) : (
            <div className="space-y-4">
              {renderInjuryCategory('Questionable', teamData.injuries.questionable, 'text-yellow-700', 'bg-yellow-50', teamColor)}
              {renderInjuryCategory('Doubtful', teamData.injuries.doubtful, 'text-orange-700', 'bg-orange-50', teamColor)}
              {renderInjuryCategory('Out', teamData.injuries.out, 'text-red-700', 'bg-red-50', teamColor)}
              {renderInjuryCategory('Injured Reserve', teamData.injuries.injuredReserve, 'text-red-800', 'bg-red-100', teamColor)}
              {renderInjuryCategory('PUP', teamData.injuries.physicallyUnableToPerform, 'text-purple-700', 'bg-purple-50', teamColor)}
              {renderInjuryCategory('NFI Reserve', teamData.injuries.nonFootballInjuryReserve, 'text-indigo-700', 'bg-indigo-50', teamColor)}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="h-16 bg-gray-200 animate-pulse" />
            <div className="p-6 space-y-3">
              {[1, 2, 3].map((j) => (
                <div key={j} className="h-12 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-700 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-[#0050A0] text-white rounded-lg hover:bg-[#003d7a] transition-colors cursor-pointer"
        >
          Try Again
        </button>
      </div>
    );
  }

  const currentTeamData = selectedTeam === 'patriots' ? patriotsInjuries : seahawksInjuries;
  const currentTeamName = selectedTeam === 'patriots' ? 'New England Patriots' : 'Seattle Seahawks';
  const currentTeamLogo = selectedTeam === 'patriots' ? '/nfl-hq/new-england-patriots.png' : '/nfl-hq/seattle-seahawks-sb.png';
  const currentTeamColor = '#002244';

  return (
    <div className="space-y-6">
      {/* Team Selector & Legend */}
      <div className="flex flex-col sm:flex-row justify-center gap-4">
        {/* Team Selector */}
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setSelectedTeam('patriots')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer ${
              selectedTeam === 'patriots'
                ? 'bg-[#002244] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <img src="/nfl-hq/new-england-patriots.png" alt="Patriots" className="w-6 h-6" />
            Patriots
          </button>
          <button
            onClick={() => setSelectedTeam('seahawks')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer ${
              selectedTeam === 'seahawks'
                ? 'bg-[#002244] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <img src="/nfl-hq/seattle-seahawks-sb.png" alt="Seahawks" className="w-6 h-6" />
            Seahawks
          </button>
        </div>
      </div>

      {/* Team Injuries */}
      {renderTeamInjuries(currentTeamData, currentTeamName, currentTeamLogo, currentTeamColor)}
    </div>
  );
}
