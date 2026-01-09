import { NextResponse } from 'next/server';
import { teams } from '@/data/teams';

// Team ID to Sportskeeda team ID mapping
const teamIdToSportsKeedaId: Record<string, number> = {
  'arizona-cardinals': 355,
  'atlanta-falcons': 323,
  'baltimore-ravens': 366,
  'buffalo-bills': 324,
  'carolina-panthers': 364,
  'chicago-bears': 326,
  'cincinnati-bengals': 327,
  'cleveland-browns': 329,
  'dallas-cowboys': 331,
  'denver-broncos': 332,
  'detroit-lions': 334,
  'green-bay-packers': 335,
  'houston-texans': 325,
  'indianapolis-colts': 338,
  'jacksonville-jaguars': 365,
  'kansas-city-chiefs': 339,
  'las-vegas-raiders': 341,
  'los-angeles-chargers': 357,
  'los-angeles-rams': 343,
  'miami-dolphins': 345,
  'minnesota-vikings': 347,
  'new-england-patriots': 348,
  'new-orleans-saints': 350,
  'new-york-giants': 351,
  'new-york-jets': 352,
  'philadelphia-eagles': 354,
  'pittsburgh-steelers': 356,
  'san-francisco-49ers': 359,
  'seattle-seahawks': 361,
  'tampa-bay-buccaneers': 362,
  'tennessee-titans': 336,
  'washington-commanders': 363,
};

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

interface DetailedStats {
  homeRecord: string;
  awayRecord: string;
  confRecord: string;
  divRecord: string;
  streak: string;
  last10: string;
  headToHead: Record<string, { wins: number; losses: number; ties: number }>; // vs each opponent
  opponentsBeaten: string[]; // List of team IDs beaten (for strength of victory)
  allOpponents: string[]; // All opponents played (for common games)
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
  homeRecord: string;
  awayRecord: string;
  confRecord: string;
  divRecord: string;
  streak: string;
  last10: string;
  strengthOfSchedule?: number;
  headToHead?: Record<string, { wins: number; losses: number; ties: number }>;
  opponentsBeaten?: string[];
  allOpponents?: string[]; // All opponents played (for common games)
  strengthOfVictory?: number; // Win percentage of teams beaten
}

interface PlayoffSeed {
  seed: number;
  team: TeamStanding;
  seedType: 'division-winner' | 'wild-card';
}

interface ConferencePlayoffs {
  seeds: PlayoffSeed[];
}

interface StandingsResponse {
  standings: TeamStanding[];
  divisions: {
    [division: string]: TeamStanding[];
  };
  playoffPicture?: {
    afc: ConferencePlayoffs;
    nfc: ConferencePlayoffs;
  };
  lastUpdated: string;
}

// Sportskeeda schedule interfaces
interface SportsKeedaGame {
  event_id: number;
  event_type: number; // 1 = regular season
  status: string;
  teams: Array<{
    team_id: number;
    location_type: 'home' | 'away';
    score?: number;
    is_winner?: boolean;
    team_slug: string;
  }>;
}

interface SportsKeedaScheduleResponse {
  schedule: SportsKeedaGame[];
}

// Fetch strength of schedule data from draft order API
async function fetchStrengthOfSchedule(): Promise<Record<string, number>> {
  try {
    const response = await fetch('https://statics.sportskeeda.com/assets/sheets/tools/draft-order/draft_order.json', {
      next: { revalidate: 3600 }
    });

    if (!response.ok) {
      console.error('Failed to fetch SOS data');
      return {};
    }

    const data = await response.json();
    const sosMap: Record<string, number> = {};

    // Skip header row (index 0) and process team data
    data.slice(1).forEach((row: any[]) => {
      const teamSlug = row[11]; // originalTeamSlug is at index 11
      const sos = parseFloat(row[8]); // sos is at index 8

      if (teamSlug && !isNaN(sos)) {
        sosMap[teamSlug] = sos;
      }
    });

    return sosMap;
  } catch (error) {
    console.error('Error fetching SOS data:', error);
    return {};
  }
}

// Team slug to conference/division mapping
const teamMetadata: Record<string, { conference: string; division: string }> = {
  'arizona-cardinals': { conference: 'NFC', division: 'NFC West' },
  'atlanta-falcons': { conference: 'NFC', division: 'NFC South' },
  'baltimore-ravens': { conference: 'AFC', division: 'AFC North' },
  'buffalo-bills': { conference: 'AFC', division: 'AFC East' },
  'carolina-panthers': { conference: 'NFC', division: 'NFC South' },
  'chicago-bears': { conference: 'NFC', division: 'NFC North' },
  'cincinnati-bengals': { conference: 'AFC', division: 'AFC North' },
  'cleveland-browns': { conference: 'AFC', division: 'AFC North' },
  'dallas-cowboys': { conference: 'NFC', division: 'NFC East' },
  'denver-broncos': { conference: 'AFC', division: 'AFC West' },
  'detroit-lions': { conference: 'NFC', division: 'NFC North' },
  'green-bay-packers': { conference: 'NFC', division: 'NFC North' },
  'houston-texans': { conference: 'AFC', division: 'AFC South' },
  'indianapolis-colts': { conference: 'AFC', division: 'AFC South' },
  'jacksonville-jaguars': { conference: 'AFC', division: 'AFC South' },
  'kansas-city-chiefs': { conference: 'AFC', division: 'AFC West' },
  'las-vegas-raiders': { conference: 'AFC', division: 'AFC West' },
  'los-angeles-chargers': { conference: 'AFC', division: 'AFC West' },
  'los-angeles-rams': { conference: 'NFC', division: 'NFC West' },
  'miami-dolphins': { conference: 'AFC', division: 'AFC East' },
  'minnesota-vikings': { conference: 'NFC', division: 'NFC North' },
  'new-england-patriots': { conference: 'AFC', division: 'AFC East' },
  'new-orleans-saints': { conference: 'NFC', division: 'NFC South' },
  'new-york-giants': { conference: 'NFC', division: 'NFC East' },
  'new-york-jets': { conference: 'AFC', division: 'AFC East' },
  'philadelphia-eagles': { conference: 'NFC', division: 'NFC East' },
  'pittsburgh-steelers': { conference: 'AFC', division: 'AFC North' },
  'san-francisco-49ers': { conference: 'NFC', division: 'NFC West' },
  'seattle-seahawks': { conference: 'NFC', division: 'NFC West' },
  'tampa-bay-buccaneers': { conference: 'NFC', division: 'NFC South' },
  'tennessee-titans': { conference: 'AFC', division: 'AFC South' },
  'washington-commanders': { conference: 'NFC', division: 'NFC East' },
};

// Function to calculate team record and detailed stats from Sportskeeda API directly
async function calculateTeamStats(teamId: string, teamConf: string, teamDiv: string, retries = 2): Promise<{ record: TeamRecord; detailedStats: DetailedStats }> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const sportsKeedaTeamId = teamIdToSportsKeedaId[teamId];

      if (!sportsKeedaTeamId) {
        console.error(`No Sportskeeda ID for team: ${teamId}`);
        return {
          record: { wins: 0, losses: 0, ties: 0 },
          detailedStats: {
            homeRecord: '0-0',
            awayRecord: '0-0',
            confRecord: '0-0',
            divRecord: '0-0',
            streak: '-',
            last10: '0-0',
            headToHead: {},
            opponentsBeaten: [],
            allOpponents: []
          }
        };
      }

      // Fetch directly from Sportskeeda
      const response = await fetch(
        `https://cf-gotham.sportskeeda.com/taxonomy/sport/nfl/schedule/2025?team=${sportsKeedaTeamId}`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; NFL-Team-Pages/1.0)',
          },
          next: { revalidate: 3600 }, // Cache for 1 hour
          signal: AbortSignal.timeout(10000) // 10 second timeout
        }
      );

      if (!response.ok) {
        throw new Error(`Sportskeeda API error: ${response.status}`);
      }

      const data: SportsKeedaScheduleResponse = await response.json();

      // Only count regular season games (event_type === 1) that are Final
      const completedRegularSeasonGames = data.schedule.filter(
        game => game.event_type === 1 && game.status === 'Final'
      );

      let wins = 0, losses = 0, ties = 0;
      let homeWins = 0, homeLosses = 0, homeTies = 0;
      let awayWins = 0, awayLosses = 0, awayTies = 0;
      let confWins = 0, confLosses = 0, confTies = 0;
      let divWins = 0, divLosses = 0, divTies = 0;

      const gameResults: ('W' | 'L' | 'T')[] = [];
      const headToHead: Record<string, { wins: number; losses: number; ties: number }> = {};
      const opponentsBeaten: string[] = [];
      const allOpponents: Set<string> = new Set();

      for (const game of completedRegularSeasonGames) {
        const team = game.teams.find(t => t.team_id === sportsKeedaTeamId);
        const opponent = game.teams.find(t => t.team_id !== sportsKeedaTeamId);

        if (team && opponent && typeof team.score === 'number') {
          const isHome = team.location_type === 'home';
          const isTie = team.score === opponent.score;
          const isWin = !isTie && team.is_winner;
          const isLoss = !isTie && !team.is_winner;

          // Opponent metadata
          const opponentSlug = opponent.team_slug;
          const opponentMeta = teamMetadata[opponentSlug];
          const isConfGame = opponentMeta && opponentMeta.conference === teamConf;
          const isDivGame = opponentMeta && opponentMeta.division === teamDiv;

          // Track all opponents for common games calculation
          allOpponents.add(opponentSlug);

          // Initialize head-to-head tracking for this opponent
          if (!headToHead[opponentSlug]) {
            headToHead[opponentSlug] = { wins: 0, losses: 0, ties: 0 };
          }

          // Track overall record
          if (isWin) {
            wins++;
            gameResults.push('W');
            headToHead[opponentSlug].wins++;
            opponentsBeaten.push(opponentSlug);
          } else if (isTie) {
            ties++;
            gameResults.push('T');
            headToHead[opponentSlug].ties++;
          } else {
            losses++;
            gameResults.push('L');
            headToHead[opponentSlug].losses++;
          }

          // Track home/away
          if (isHome) {
            if (isWin) homeWins++;
            else if (isTie) homeTies++;
            else homeLosses++;
          } else {
            if (isWin) awayWins++;
            else if (isTie) awayTies++;
            else awayLosses++;
          }

          // Track conference/division
          if (isConfGame) {
            if (isWin) confWins++;
            else if (isTie) confTies++;
            else confLosses++;
          }

          if (isDivGame) {
            if (isWin) divWins++;
            else if (isTie) divTies++;
            else divLosses++;
          }
        }
      }

      // Calculate streak
      let streak = '-';
      if (gameResults.length > 0) {
        const lastResult = gameResults[gameResults.length - 1];
        let streakCount = 1;

        for (let i = gameResults.length - 2; i >= 0; i--) {
          if (gameResults[i] === lastResult) {
            streakCount++;
          } else {
            break;
          }
        }
        streak = `${lastResult}${streakCount}`;
      }

      // Calculate last 10 games
      const last10Games = gameResults.slice(-10);
      const last10Wins = last10Games.filter(r => r === 'W').length;
      const last10Losses = last10Games.filter(r => r === 'L').length;
      const last10 = `${last10Wins}-${last10Losses}`;

      return {
        record: { wins, losses, ties },
        detailedStats: {
          homeRecord: `${homeWins}-${homeLosses}${homeTies > 0 ? `-${homeTies}` : ''}`,
          awayRecord: `${awayWins}-${awayLosses}${awayTies > 0 ? `-${awayTies}` : ''}`,
          confRecord: `${confWins}-${confLosses}${confTies > 0 ? `-${confTies}` : ''}`,
          divRecord: `${divWins}-${divLosses}${divTies > 0 ? `-${divTies}` : ''}`,
          streak,
          last10,
          headToHead,
          opponentsBeaten,
          allOpponents: Array.from(allOpponents)
        }
      };
    } catch (error) {
      console.error(`Error calculating stats for ${teamId} (attempt ${attempt + 1}):`, error);

      // If this is the last attempt, return defaults
      if (attempt === retries) {
        return {
          record: { wins: 0, losses: 0, ties: 0 },
          detailedStats: {
            homeRecord: '0-0',
            awayRecord: '0-0',
            confRecord: '0-0',
            divRecord: '0-0',
            streak: '-',
            last10: '0-0',
            headToHead: {},
            opponentsBeaten: [],
            allOpponents: []
          }
        };
      }

      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }

  // This shouldn't be reached, but return defaults as fallback
  return {
    record: { wins: 0, losses: 0, ties: 0 },
    detailedStats: {
      homeRecord: '0-0',
      awayRecord: '0-0',
      confRecord: '0-0',
      divRecord: '0-0',
      streak: '-',
      last10: '0-0',
      headToHead: {},
      opponentsBeaten: [],
      allOpponents: []
    }
  };
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
      const { record, detailedStats } = await calculateTeamStats(team.id, team.conference, team.division);
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
        winPercentage,
        homeRecord: detailedStats.homeRecord,
        awayRecord: detailedStats.awayRecord,
        confRecord: detailedStats.confRecord,
        divRecord: detailedStats.divRecord,
        streak: detailedStats.streak,
        last10: detailedStats.last10,
        strengthOfSchedule: 0, // Will be populated later
        strengthOfVictory: 0, // Will be populated later
        headToHead: detailedStats.headToHead,
        opponentsBeaten: detailedStats.opponentsBeaten,
        allOpponents: detailedStats.allOpponents
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

    // Fetch strength of schedule data
    const sosData = await fetchStrengthOfSchedule();

    // Calculate records for all teams in batches
    const standings = await processTeamsInBatches(teamsList);

    // Add SOS to each team's standing and calculate strength of victory
    const standingsMap = new Map(standings.map(s => [s.teamId, s]));

    standings.forEach(team => {
      team.strengthOfSchedule = sosData[team.teamId] || 0;

      // Calculate strength of victory (win percentage of teams beaten)
      if (team.opponentsBeaten && team.opponentsBeaten.length > 0) {
        let totalWins = 0;
        let totalGames = 0;

        team.opponentsBeaten.forEach(opponentId => {
          const opponent = standingsMap.get(opponentId);
          if (opponent) {
            totalWins += opponent.record.wins + (opponent.record.ties * 0.5);
            totalGames += opponent.record.wins + opponent.record.losses + opponent.record.ties;
          }
        });

        team.strengthOfVictory = totalGames > 0 ? totalWins / totalGames : 0;
      } else {
        team.strengthOfVictory = 0;
      }
    });

    // Group by division and sort by win percentage
    const divisions: { [division: string]: TeamStanding[] } = {};

    standings.forEach(team => {
      if (!divisions[team.division]) {
        divisions[team.division] = [];
      }
      divisions[team.division].push(team);
    });

    // Helper function to parse record string to win percentage
    const parseRecordWinPct = (recordStr: string): number => {
      const parts = recordStr.split('-');
      const wins = parseInt(parts[0]) || 0;
      const losses = parseInt(parts[1]) || 0;
      const ties = parseInt(parts[2]) || 0;
      const totalGames = wins + losses + ties;
      if (totalGames === 0) return 0;
      return (wins + ties * 0.5) / totalGames;
    };

    // Helper function to find common opponents between teams
    const findCommonOpponents = (teamA: TeamStanding, teamB: TeamStanding): string[] => {
      if (!teamA.allOpponents || !teamB.allOpponents) return [];
      const setA = new Set(teamA.allOpponents);
      const setB = new Set(teamB.allOpponents);
      return teamA.allOpponents.filter(opponent => setB.has(opponent));
    };

    // Helper function to calculate record against common opponents
    const getCommonGamesRecord = (team: TeamStanding, commonOpponents: string[]): { wins: number; losses: number; ties: number } => {
      let wins = 0, losses = 0, ties = 0;

      if (!team.headToHead) return { wins, losses, ties };

      commonOpponents.forEach(opponentId => {
        const h2h = team.headToHead?.[opponentId];
        if (h2h) {
          wins += h2h.wins;
          losses += h2h.losses;
          ties += h2h.ties;
        }
      });

      return { wins, losses, ties };
    };

    // Calculate playoff seeding for a conference
    const calculateConferencePlayoffs = (conferenceTeams: TeamStanding[]): ConferencePlayoffs => {
      // Step 1: Identify division winners (highest ranked team from each division)
      const divisionWinners: TeamStanding[] = [];
      const divisionNames = ['East', 'North', 'South', 'West'];
      const conference = conferenceTeams[0]?.conference || 'AFC';

      divisionNames.forEach(div => {
        const divName = `${conference} ${div}`;
        const divTeams = conferenceTeams.filter(t => t.division === divName);
        if (divTeams.length > 0) {
          divisionWinners.push(divTeams[0]); // Already sorted within division
        }
      });

      // Step 2: Identify wild card candidates (all non-division winners)
      const wildCardCandidates = conferenceTeams.filter(
        team => !divisionWinners.find(dw => dw.teamId === team.teamId)
      );

      // Step 3: Apply wild card tiebreakers to sort candidates
      const sortedWildCards = wildCardCandidates.sort((a, b) => {
        // Win percentage
        if (b.winPercentage !== a.winPercentage) {
          return b.winPercentage - a.winPercentage;
        }

        // Head-to-head (if applicable - only if they played)
        if (a.headToHead?.[b.teamId]) {
          const h2h = a.headToHead[b.teamId];
          const totalH2H = h2h.wins + h2h.losses + h2h.ties;
          if (totalH2H > 0) {
            const aH2HPct = (h2h.wins + h2h.ties * 0.5) / totalH2H;
            const bH2HPct = 1 - aH2HPct;
            if (aH2HPct !== bH2HPct) {
              return bH2HPct - aH2HPct;
            }
          }
        }

        // Conference record
        const aConfPct = parseRecordWinPct(a.confRecord);
        const bConfPct = parseRecordWinPct(b.confRecord);
        if (bConfPct !== aConfPct) {
          return bConfPct - aConfPct;
        }

        // Common games (minimum 4)
        const commonOpponents = findCommonOpponents(a, b);
        if (commonOpponents.length >= 4) {
          const aCommonRecord = getCommonGamesRecord(a, commonOpponents);
          const bCommonRecord = getCommonGamesRecord(b, commonOpponents);
          const aTotalCommon = aCommonRecord.wins + aCommonRecord.losses + aCommonRecord.ties;
          const bTotalCommon = bCommonRecord.wins + bCommonRecord.losses + bCommonRecord.ties;

          if (aTotalCommon > 0 && bTotalCommon > 0) {
            const aCommonPct = (aCommonRecord.wins + aCommonRecord.ties * 0.5) / aTotalCommon;
            const bCommonPct = (bCommonRecord.wins + bCommonRecord.ties * 0.5) / bTotalCommon;
            if (bCommonPct !== aCommonPct) {
              return bCommonPct - aCommonPct;
            }
          }
        }

        // Strength of victory
        const aSOV = a.strengthOfVictory || 0;
        const bSOV = b.strengthOfVictory || 0;
        if (bSOV !== aSOV) {
          return bSOV - aSOV;
        }

        // Strength of schedule
        const aSOS = a.strengthOfSchedule || 0;
        const bSOS = b.strengthOfSchedule || 0;
        if (aSOS !== bSOS && aSOS !== 0 && bSOS !== 0) {
          return aSOS - bSOS;
        }

        // Fallback
        if (b.record.wins !== a.record.wins) {
          return b.record.wins - a.record.wins;
        }
        return a.record.losses - b.record.losses;
      });

      // Take top 3 wild cards
      const wildCardTeams = sortedWildCards.slice(0, 3);

      // Step 4: Seed division winners #1-4 using same wild card tiebreaker rules
      const seededDivisionWinners = [...divisionWinners].sort((a, b) => {
        // Use same logic as wild card sorting
        if (b.winPercentage !== a.winPercentage) {
          return b.winPercentage - a.winPercentage;
        }

        if (a.headToHead?.[b.teamId]) {
          const h2h = a.headToHead[b.teamId];
          const totalH2H = h2h.wins + h2h.losses + h2h.ties;
          if (totalH2H > 0) {
            const aH2HPct = (h2h.wins + h2h.ties * 0.5) / totalH2H;
            const bH2HPct = 1 - aH2HPct;
            if (aH2HPct !== bH2HPct) {
              return bH2HPct - aH2HPct;
            }
          }
        }

        const aConfPct = parseRecordWinPct(a.confRecord);
        const bConfPct = parseRecordWinPct(b.confRecord);
        if (bConfPct !== aConfPct) {
          return bConfPct - aConfPct;
        }

        const aSOV = a.strengthOfVictory || 0;
        const bSOV = b.strengthOfVictory || 0;
        if (bSOV !== aSOV) {
          return bSOV - aSOV;
        }

        const aSOS = a.strengthOfSchedule || 0;
        const bSOS = b.strengthOfSchedule || 0;
        if (aSOS !== bSOS && aSOS !== 0 && bSOS !== 0) {
          return aSOS - bSOS;
        }

        if (b.record.wins !== a.record.wins) {
          return b.record.wins - a.record.wins;
        }
        return a.record.losses - b.record.losses;
      });

      // Build final seeds
      const seeds: PlayoffSeed[] = [];

      // Seeds 1-4: Division winners
      seededDivisionWinners.forEach((team, index) => {
        seeds.push({
          seed: index + 1,
          team,
          seedType: 'division-winner'
        });
      });

      // Seeds 5-7: Wild cards
      wildCardTeams.forEach((team, index) => {
        seeds.push({
          seed: index + 5,
          team,
          seedType: 'wild-card'
        });
      });

      return { seeds };
    };

    // Sort each division and assign ranks (NFL Division Tiebreaker Procedure)
    Object.keys(divisions).forEach(division => {
      divisions[division].sort((a, b) => {
        // Step 1: Win percentage (descending)
        if (b.winPercentage !== a.winPercentage) {
          return b.winPercentage - a.winPercentage;
        }

        // Step 2: Head-to-head (best won-lost-tied percentage in games between the clubs)
        if (a.headToHead && b.headToHead && a.headToHead[b.teamId]) {
          const h2h = a.headToHead[b.teamId];
          const totalH2H = h2h.wins + h2h.losses + h2h.ties;
          if (totalH2H > 0) {
            const aH2HPct = (h2h.wins + h2h.ties * 0.5) / totalH2H;
            const bH2HPct = 1 - aH2HPct; // If A has 0.667 vs B, then B has 0.333 vs A
            if (aH2HPct !== bH2HPct) {
              return bH2HPct - aH2HPct; // Higher is better for B, so descending
            }
          }
        }

        // Step 3: Division record (best won-lost-tied percentage in games played within the division)
        const aDivPct = parseRecordWinPct(a.divRecord);
        const bDivPct = parseRecordWinPct(b.divRecord);
        if (bDivPct !== aDivPct) {
          return bDivPct - aDivPct;
        }

        // Step 4: Common games (best won-lost-tied percentage in common games, minimum of four)
        const commonOpponents = findCommonOpponents(a, b);
        if (commonOpponents.length >= 4) {
          const aCommonRecord = getCommonGamesRecord(a, commonOpponents);
          const bCommonRecord = getCommonGamesRecord(b, commonOpponents);

          const aTotalCommon = aCommonRecord.wins + aCommonRecord.losses + aCommonRecord.ties;
          const bTotalCommon = bCommonRecord.wins + bCommonRecord.losses + bCommonRecord.ties;

          if (aTotalCommon > 0 && bTotalCommon > 0) {
            const aCommonPct = (aCommonRecord.wins + aCommonRecord.ties * 0.5) / aTotalCommon;
            const bCommonPct = (bCommonRecord.wins + bCommonRecord.ties * 0.5) / bTotalCommon;

            if (bCommonPct !== aCommonPct) {
              return bCommonPct - aCommonPct;
            }
          }
        }

        // Step 5: Conference record (best won-lost-tied percentage in games played within the conference)
        const aConfPct = parseRecordWinPct(a.confRecord);
        const bConfPct = parseRecordWinPct(b.confRecord);
        if (bConfPct !== aConfPct) {
          return bConfPct - aConfPct;
        }

        // Step 6: Strength of victory (higher is better)
        const aSOV = a.strengthOfVictory || 0;
        const bSOV = b.strengthOfVictory || 0;
        if (bSOV !== aSOV) {
          return bSOV - aSOV;
        }

        // Step 7: Strength of schedule (lower is harder/better)
        const aSOS = a.strengthOfSchedule || 0;
        const bSOS = b.strengthOfSchedule || 0;
        if (aSOS !== bSOS && aSOS !== 0 && bSOS !== 0) {
          return aSOS - bSOS;
        }

        // Fallback: total wins then losses
        if (b.record.wins !== a.record.wins) {
          return b.record.wins - a.record.wins;
        }
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

    // Calculate playoff picture for both conferences
    const afcTeams = finalStandings.filter(t => t.conference === 'AFC');
    const nfcTeams = finalStandings.filter(t => t.conference === 'NFC');

    const playoffPicture = {
      afc: calculateConferencePlayoffs(afcTeams),
      nfc: calculateConferencePlayoffs(nfcTeams)
    };

    const response: StandingsResponse = {
      standings: finalStandings,
      divisions,
      playoffPicture,
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