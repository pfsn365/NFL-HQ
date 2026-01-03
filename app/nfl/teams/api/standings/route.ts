import { NextResponse } from 'next/server';
import { teams } from '@/data/teams';

interface ScheduleGame {
  week: string | number;
  date: string;
  opponent: string;
  opponentAbbr?: string;
  isHome: boolean | null;
  time: string;
  tv: string;
  venue: string;
  result?: 'W' | 'L' | 'T' | null;
  score?: { home: number; away: number };
  eventType: string;
}

interface TeamRecord {
  wins: number;
  losses: number;
  ties: number;
}

interface TeamStanding {
  teamId: string;
  fullName: string;
  abbreviation: string;
  conference: string;
  division: string;
  record: TeamRecord;
  recordString: string;
  divisionRank: string;
  winPercentage: number;
}

interface StandingsResponse {
  standings: TeamStanding[];
  divisions: {
    [division: string]: TeamStanding[];
  };
  lastUpdated: string;
}

// Function to calculate team record from schedule with retry logic
async function calculateTeamRecord(teamId: string, retries = 2): Promise<TeamRecord> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/nfl/teams/api/schedule/${teamId}`, {
        next: { revalidate: 3600 }, // Cache for 1 hour
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      if (!response.ok) {
        throw new Error(`Schedule API error: ${response.status}`);
      }

      const data = await response.json();
      const schedule: ScheduleGame[] = data.schedule || [];

      // Only count regular season games with results
      const completedRegularSeasonGames = schedule.filter(
        game => game.eventType === 'Regular Season' && game.result
      );

      const record: TeamRecord = {
        wins: completedRegularSeasonGames.filter(game => game.result === 'W').length,
        losses: completedRegularSeasonGames.filter(game => game.result === 'L').length,
        ties: completedRegularSeasonGames.filter(game => game.result === 'T').length
      };

      return record;
    } catch (error) {
      console.error(`Error calculating record for ${teamId} (attempt ${attempt + 1}):`, error);

      // If this is the last attempt, return 0-0-0
      if (attempt === retries) {
        return { wins: 0, losses: 0, ties: 0 };
      }

      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }

  // This shouldn't be reached, but return 0-0-0 as fallback
  return { wins: 0, losses: 0, ties: 0 };
}

// Function to format record as string
function formatRecord(record: TeamRecord): string {
  return `${record.wins}-${record.losses}-${record.ties}`;
}

// Function to calculate win percentage
function calculateWinPercentage(record: TeamRecord): number {
  const totalGames = record.wins + record.losses + record.ties;
  if (totalGames === 0) return 0;

  // Ties count as 0.5 wins for percentage calculation
  const adjustedWins = record.wins + (record.ties * 0.5);
  return adjustedWins / totalGames;
}

// Function to determine division rank
function getDivisionRank(rank: number): string {
  switch (rank) {
    case 1: return '1st';
    case 2: return '2nd';
    case 3: return '3rd';
    case 4: return '4th';
    default: return `${rank}th`;
  }
}

// Process teams in batches to reduce server load
async function processTeamsInBatches(teamsList: any[], batchSize = 8) {
  const results = [];

  for (let i = 0; i < teamsList.length; i += batchSize) {
    const batch = teamsList.slice(i, i + batchSize);

    const batchPromises = batch.map(async (team) => {
      const record = await calculateTeamRecord(team.id);
      const winPercentage = calculateWinPercentage(record);

      return {
        teamId: team.id,
        fullName: team.fullName,
        abbreviation: team.abbreviation,
        conference: team.conference,
        division: team.division,
        record,
        recordString: formatRecord(record),
        divisionRank: '', // Will be calculated after sorting
        winPercentage
      };
    });

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);

    // Small delay between batches to prevent overwhelming the server
    if (i + batchSize < teamsList.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return results;
}

export async function GET() {
  try {
    const teamsList = Object.values(teams);

    // Calculate records for all teams in batches
    const standings = await processTeamsInBatches(teamsList);

    // Group by division and sort by win percentage
    const divisions: { [division: string]: TeamStanding[] } = {};

    standings.forEach(team => {
      if (!divisions[team.division]) {
        divisions[team.division] = [];
      }
      divisions[team.division].push(team);
    });

    // Sort each division and assign ranks
    Object.keys(divisions).forEach(division => {
      divisions[division].sort((a, b) => {
        // Primary sort: win percentage (descending)
        if (b.winPercentage !== a.winPercentage) {
          return b.winPercentage - a.winPercentage;
        }

        // Secondary sort: wins (descending)
        if (b.record.wins !== a.record.wins) {
          return b.record.wins - a.record.wins;
        }

        // Tertiary sort: losses (ascending)
        return a.record.losses - b.record.losses;
      });

      // Assign division ranks
      divisions[division].forEach((team, index) => {
        team.divisionRank = getDivisionRank(index + 1);
      });
    });

    // Flatten standings with updated ranks
    const finalStandings: TeamStanding[] = [];
    Object.values(divisions).forEach(divisionTeams => {
      finalStandings.push(...divisionTeams);
    });

    const response: StandingsResponse = {
      standings: finalStandings,
      divisions,
      lastUpdated: new Date().toISOString()
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Standings API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch standings data' },
      { status: 500 }
    );
  }
}