import { getAllTeams, TeamData } from '@/data/teams';
import { ProtectionRule, parseProtectionString, evaluateProtection } from './protectionParser';
import { COMPLEX_PROTECTIONS } from './complexProtections';

export interface DraftPickData {
  year: number;
  round: number;
  pick: string;
  from: string;
  protections: string;
  protectionRule?: ProtectionRule; // Optional manual override for complex cases
  complexProtectionKey?: string; // Reference to complex protection function
}

export interface TeamDraftPicks {
  teamId: string;
  incomingPicks: DraftPickData[];
  outgoingPicks: DraftPickData[];
  historicalPicks: any[];
}

export interface DraftBoardPick {
  pickNumber: number; // Projected pick number based on current standings (1-60)
  round: number;
  owningTeam: TeamData;
  originalTeam: string; // "Own" or team abbreviation
  from: string; // Full description from JSON
  protections: string;
  isTraded: boolean;
  isSwapRights: boolean;
}

/**
 * Load draft picks data for a specific team
 */
export async function loadTeamDraftPicks(teamId: string): Promise<TeamDraftPicks | null> {
  try {
    const response = await fetch(`/data/draft-picks/${teamId}.json`);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error(`Error loading draft picks for ${teamId}:`, error);
    return null;
  }
}

/**
 * Load all teams' draft picks data
 */
export async function loadAllTeamsDraftPicks(): Promise<Map<string, TeamDraftPicks>> {
  const allTeams = getAllTeams();
  const draftPicksMap = new Map<string, TeamDraftPicks>();

  const results = await Promise.all(
    allTeams.map(async (team) => {
      const picks = await loadTeamDraftPicks(team.id);
      return { teamId: team.id, picks };
    })
  );

  results.forEach(({ teamId, picks }) => {
    if (picks) {
      draftPicksMap.set(teamId, picks);
    }
  });

  return draftPicksMap;
}

/**
 * Build the draft board for a specific year based on actual pick ownership
 * Uses current standings to project pick positions
 * Shows ALL 30 picks per round, with current ownership
 */
export function buildDraftBoard(
  year: number,
  allTeamsPicks: Map<string, TeamDraftPicks>,
  teamRecords: Map<string, string>
): DraftBoardPick[] {
  const allTeams = getAllTeams();
  const draftBoard: DraftBoardPick[] = [];

  // Sort teams by record (worst to best) for projected pick positions
  const sortedTeams = [...allTeams].sort((a, b) => {
    const aRecord = teamRecords.get(a.id) || a.record || '0-0';
    const bRecord = teamRecords.get(b.id) || b.record || '0-0';
    const [aWins, aLosses] = aRecord.split('-').map(Number);
    const [bWins, bLosses] = bRecord.split('-').map(Number);

    // Calculate win percentage (wins / total games)
    const aTotalGames = aWins + aLosses;
    const bTotalGames = bWins + bLosses;
    const aWinPct = aTotalGames > 0 ? aWins / aTotalGames : 0;
    const bWinPct = bTotalGames > 0 ? bWins / bTotalGames : 0;

    // Sort by win percentage (ascending - worst teams first)
    // If teams have identical records, use alphabetical order as placeholder
    // (NBA uses random drawing for actual tiebreakers, but we need consistency for projections)
    if (Math.abs(aWinPct - bWinPct) < 0.0001) {
      // Check if they have literally the same record
      if (aWins === bWins && aLosses === bLosses) {
        // Same record - use alphabetical order as placeholder for random drawing
        return a.fullName.localeCompare(b.fullName);
      }
      // Different records but same win% - shouldn't happen often, use wins
      return aWins - bWins;
    }
    return aWinPct - bWinPct;
  });

  // Build projected positions map for protection evaluation
  const projectedPositions = new Map<string, number>();
  sortedTeams.forEach((team, index) => {
    projectedPositions.set(team.id, index + 1);
  });

  // Helper function to find who owns a specific team's pick for a round
  const findPickOwner = (originalTeamId: string, round: number): {
    owningTeamId: string;
    pickData: DraftPickData | null;
  } => {
    const originalTeam = allTeams.find(t => t.id === originalTeamId);
    if (!originalTeam) return { owningTeamId: originalTeamId, pickData: null };

    // Check if the original team still has their own pick (including conditional swaps)
    const originalTeamPicks = allTeamsPicks.get(originalTeamId);
    if (originalTeamPicks) {
      const ownPick = originalTeamPicks.incomingPicks.find(
        p => p.year === year && p.round === round && (
          p.from === 'Own' || p.from.toLowerCase().includes('own')
        )
      );
      if (ownPick) {
        // DYNAMIC PROTECTION EVALUATION (only for 2026 for now)
        if (year === 2026) {
          // Check for complex protection function first
          if (ownPick.complexProtectionKey && COMPLEX_PROTECTIONS[ownPick.complexProtectionKey]) {
            const actualOwnerId = COMPLEX_PROTECTIONS[ownPick.complexProtectionKey](
              originalTeamId,
              projectedPositions
            );

            if (actualOwnerId !== originalTeamId) {
              return { owningTeamId: actualOwnerId, pickData: ownPick };
            }
          }
          // Try to get manual rule, otherwise parse the protection string
          else {
            let protectionRule = ownPick.protectionRule;
            if (!protectionRule) {
              const parsed = parseProtectionString(ownPick.protections, ownPick.from);
              protectionRule = parsed || undefined;
            }

            // If we have a valid rule, evaluate it dynamically
            if (protectionRule) {
              const actualOwnerId = evaluateProtection(
                protectionRule,
                originalTeamId,
                projectedPositions
              );

              // If the protection causes the pick to convey to another team
              if (actualOwnerId !== originalTeamId) {
                // Find that team's pick data or create a reference
                return { owningTeamId: actualOwnerId, pickData: ownPick };
              }
            }
          }
        }

        // No protection or protection allows original team to keep it
        return { owningTeamId: originalTeamId, pickData: ownPick };
      }
    }

    // Original team doesn't have their own pick, find who has it
    // Look through all teams' incoming picks for one from the original team
    // If multiple teams reference this pick, prefer the most specific match
    let bestMatch: { teamId: string; pick: DraftPickData; specificity: number } | null = null;

    for (const [teamId, teamPicks] of allTeamsPicks) {
      for (const p of teamPicks.incomingPicks) {
        if (p.year !== year || p.round !== round) continue;

        const fromLower = p.from.toLowerCase();
        const teamAbbr = originalTeam.abbreviation.toLowerCase();
        const teamName = originalTeam.name.toLowerCase();

        let isMatch = false;
        let specificity = 0; // Higher = more specific

        // Check for simple "via TEAM" format (most specific)
        const viaPattern = new RegExp(`^via\\s+(${teamAbbr}|${teamName})$`, 'i');
        if (viaPattern.test(p.from)) {
          isMatch = true;
          specificity = 100; // Exact match is most specific
        }
        // Check for multi-team conditional arrangements
        else if (fromLower.includes(' or ') || fromLower.includes(',')) {
          // Extract all team names from the "from" field
          const mentionedTeams = fromLower
            .split(/[,]/)
            .map(part => part.replace(/\s+or\s+/, ' ').trim())
            .flatMap(part => part.split(/\s+/))
            .filter(word => word.length > 1 && word !== 'via' && word !== 'or' && word !== 'and');

          // Check if original team is mentioned in this arrangement
          const teamIndex = mentionedTeams.findIndex(mention =>
            mention === teamAbbr ||
            mention === teamName ||
            teamAbbr.includes(mention) ||
            mention.includes(teamAbbr)
          );

          if (teamIndex !== -1) {
            isMatch = true;
            // Specificity is inversely proportional to number of teams mentioned
            // Fewer teams = more specific
            // Bonus points if team appears first in the list (likely their own conditional pick)
            const baseSpecificity = Math.max(1, 50 - mentionedTeams.length * 10);
            const positionBonus = teamIndex === 0 ? 15 : 0; // First team gets priority
            specificity = baseSpecificity + positionBonus;
          }
        }
        // Check if it's just the team abbreviation or name
        else if (fromLower === teamAbbr || fromLower === teamName) {
          isMatch = true;
          specificity = 90;
        }

        // If this is a match and it's more specific than our current best, use it
        if (isMatch && (!bestMatch || specificity > bestMatch.specificity)) {
          bestMatch = { teamId, pick: p, specificity };
        }
      }
    }

    if (bestMatch) {
      // Check for inverse conditional protections (e.g., "Only if TEAM picks 1-4")
      // These picks only convey if the original team IS within the specified range
      if (year === 2026 && bestMatch.pick.protections) {
        const parsed = parseProtectionString(bestMatch.pick.protections, bestMatch.pick.from);
        if (parsed && parsed.type === 'inverse_conditional' && parsed.range) {
          const originalPosition = projectedPositions.get(originalTeamId) || 30;
          const inRange = originalPosition >= parsed.range.min && originalPosition <= parsed.range.max;

          // If original team is NOT in range, pick doesn't convey - original team keeps it
          if (!inRange) {
            return { owningTeamId: originalTeamId, pickData: null };
          }
        }
      }

      return { owningTeamId: bestMatch.teamId, pickData: bestMatch.pick };
    }

    // Couldn't find owner, assume original team still has it (data might be incomplete)
    return { owningTeamId: originalTeamId, pickData: null };
  };

  // Build Round 1 - all 30 picks
  sortedTeams.forEach((originalTeam, index) => {
    const pickNumber = index + 1;
    const { owningTeamId, pickData} = findPickOwner(originalTeam.id, 1);

    // Debug picks 15 and 27
    if (pickNumber === 15 || pickNumber === 27) {
      console.log(`[DEBUG] Pick ${pickNumber}: originalTeam=${originalTeam.id}, owningTeamId=${owningTeamId}, pickData=`, pickData);
    }

    const owningTeam = allTeams.find(t => t.id === owningTeamId);

    if (!owningTeam) {
      console.warn(`[Draft Board] Pick ${pickNumber}: No owning team found - originalTeam=${originalTeam.id}, owningTeamId=${owningTeamId}`);
      console.warn(`[Draft Board] Available teams:`, allTeams.map(t => t.id).slice(0, 5));
      return;
    }

    // Every position gets exactly ONE pick - no skipping
    // The originalTeam at this position determines whose pick this is
    // (even if multiple teams are mentioned in the "from" field for swaps/conditionals)

    // Check if this pick was conveyed due to protection/swap
    const wasConveyed = owningTeamId !== originalTeam.id;

    const isSwapRights = pickData?.from.toLowerCase().includes('swap') || false;
    const isTraded = wasConveyed || (pickData ? (pickData.from !== 'Own' && !isSwapRights) : false);

    // If the pick was conveyed via protection, update the "from" field
    let fromField = pickData?.from || 'Own';
    if (wasConveyed && pickData?.from === 'Own') {
      // Pick conveyed from originalTeam to owningTeam via protection
      fromField = `via ${originalTeam.abbreviation}`;
    }

    draftBoard.push({
      pickNumber,
      round: 1,
      owningTeam,
      originalTeam: isTraded || isSwapRights ? fromField : 'Own',
      from: fromField,
      protections: pickData?.protections || '',
      isTraded,
      isSwapRights
    });
  });

  // Build Round 2 - all 30 picks (same approach as Round 1)
  sortedTeams.forEach((originalTeam, index) => {
    const pickNumber = 31 + index; // Round 2 starts at pick 31
    const { owningTeamId, pickData } = findPickOwner(originalTeam.id, 2);
    const owningTeam = allTeams.find(t => t.id === owningTeamId);

    if (!owningTeam) return;

    // Every position gets exactly ONE pick - no skipping
    // (same logic as Round 1)

    // Check if this pick was conveyed due to protection/swap
    const wasConveyed = owningTeamId !== originalTeam.id;

    const isSwapRights = pickData?.from.toLowerCase().includes('swap') || false;
    const isTraded = wasConveyed || (pickData ? (pickData.from !== 'Own' && !isSwapRights) : false);

    // If the pick was conveyed via protection, update the "from" field
    let fromField = pickData?.from || 'Own';
    if (wasConveyed && pickData?.from === 'Own') {
      // Pick conveyed from originalTeam to owningTeam via protection
      fromField = `via ${originalTeam.abbreviation}`;
    }

    draftBoard.push({
      pickNumber,
      round: 2,
      owningTeam,
      originalTeam: isTraded || isSwapRights ? fromField : 'Own',
      from: fromField,
      protections: pickData?.protections || '',
      isTraded,
      isSwapRights
    });
  });

  // Sort by round then pick number
  draftBoard.sort((a, b) => {
    if (a.round !== b.round) return a.round - b.round;
    return a.pickNumber - b.pickNumber;
  });

  return draftBoard;
}

/**
 * Get a summary of a team's draft assets for a specific year
 */
export function getTeamDraftAssets(
  teamId: string,
  year: number,
  teamPicks: TeamDraftPicks | undefined
): {
  incoming: DraftPickData[];
  outgoing: DraftPickData[];
} {
  if (!teamPicks) {
    return { incoming: [], outgoing: [] };
  }

  return {
    incoming: teamPicks.incomingPicks.filter(p => p.year === year),
    outgoing: teamPicks.outgoingPicks.filter(p => p.year === year)
  };
}

/**
 * Get ALL draft board picks for a specific team (including all their picks in same round)
 */
export function getAllTeamPicksForYear(
  teamId: string,
  year: number,
  allTeamsPicks: Map<string, TeamDraftPicks>,
  teamRecords: Map<string, string>
): DraftBoardPick[] {
  // Build the full draft board with dynamic protection evaluation
  const draftBoard = buildDraftBoard(year, allTeamsPicks, teamRecords);

  // Filter to only show picks owned by this team
  return draftBoard.filter(pick => pick.owningTeam.id === teamId);
}
