import { NextResponse } from 'next/server';

// Super Bowl LX teams
const SUPER_BOWL_TEAMS = ['new-england-patriots', 'seattle-seahawks'] as const;

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

// Team slug to conference/division mapping
const teamMetadata: Record<string, { conference: string; division: string; fullName: string; abbreviation: string }> = {
  'arizona-cardinals': { conference: 'NFC', division: 'NFC West', fullName: 'Arizona Cardinals', abbreviation: 'ARI' },
  'atlanta-falcons': { conference: 'NFC', division: 'NFC South', fullName: 'Atlanta Falcons', abbreviation: 'ATL' },
  'baltimore-ravens': { conference: 'AFC', division: 'AFC North', fullName: 'Baltimore Ravens', abbreviation: 'BAL' },
  'buffalo-bills': { conference: 'AFC', division: 'AFC East', fullName: 'Buffalo Bills', abbreviation: 'BUF' },
  'carolina-panthers': { conference: 'NFC', division: 'NFC South', fullName: 'Carolina Panthers', abbreviation: 'CAR' },
  'chicago-bears': { conference: 'NFC', division: 'NFC North', fullName: 'Chicago Bears', abbreviation: 'CHI' },
  'cincinnati-bengals': { conference: 'AFC', division: 'AFC North', fullName: 'Cincinnati Bengals', abbreviation: 'CIN' },
  'cleveland-browns': { conference: 'AFC', division: 'AFC North', fullName: 'Cleveland Browns', abbreviation: 'CLE' },
  'dallas-cowboys': { conference: 'NFC', division: 'NFC East', fullName: 'Dallas Cowboys', abbreviation: 'DAL' },
  'denver-broncos': { conference: 'AFC', division: 'AFC West', fullName: 'Denver Broncos', abbreviation: 'DEN' },
  'detroit-lions': { conference: 'NFC', division: 'NFC North', fullName: 'Detroit Lions', abbreviation: 'DET' },
  'green-bay-packers': { conference: 'NFC', division: 'NFC North', fullName: 'Green Bay Packers', abbreviation: 'GB' },
  'houston-texans': { conference: 'AFC', division: 'AFC South', fullName: 'Houston Texans', abbreviation: 'HOU' },
  'indianapolis-colts': { conference: 'AFC', division: 'AFC South', fullName: 'Indianapolis Colts', abbreviation: 'IND' },
  'jacksonville-jaguars': { conference: 'AFC', division: 'AFC South', fullName: 'Jacksonville Jaguars', abbreviation: 'JAX' },
  'kansas-city-chiefs': { conference: 'AFC', division: 'AFC West', fullName: 'Kansas City Chiefs', abbreviation: 'KC' },
  'las-vegas-raiders': { conference: 'AFC', division: 'AFC West', fullName: 'Las Vegas Raiders', abbreviation: 'LV' },
  'los-angeles-chargers': { conference: 'AFC', division: 'AFC West', fullName: 'Los Angeles Chargers', abbreviation: 'LAC' },
  'los-angeles-rams': { conference: 'NFC', division: 'NFC West', fullName: 'Los Angeles Rams', abbreviation: 'LAR' },
  'miami-dolphins': { conference: 'AFC', division: 'AFC East', fullName: 'Miami Dolphins', abbreviation: 'MIA' },
  'minnesota-vikings': { conference: 'NFC', division: 'NFC North', fullName: 'Minnesota Vikings', abbreviation: 'MIN' },
  'new-england-patriots': { conference: 'AFC', division: 'AFC East', fullName: 'New England Patriots', abbreviation: 'NE' },
  'new-orleans-saints': { conference: 'NFC', division: 'NFC South', fullName: 'New Orleans Saints', abbreviation: 'NO' },
  'new-york-giants': { conference: 'NFC', division: 'NFC East', fullName: 'New York Giants', abbreviation: 'NYG' },
  'new-york-jets': { conference: 'AFC', division: 'AFC East', fullName: 'New York Jets', abbreviation: 'NYJ' },
  'philadelphia-eagles': { conference: 'NFC', division: 'NFC East', fullName: 'Philadelphia Eagles', abbreviation: 'PHI' },
  'pittsburgh-steelers': { conference: 'AFC', division: 'AFC North', fullName: 'Pittsburgh Steelers', abbreviation: 'PIT' },
  'san-francisco-49ers': { conference: 'NFC', division: 'NFC West', fullName: 'San Francisco 49ers', abbreviation: 'SF' },
  'seattle-seahawks': { conference: 'NFC', division: 'NFC West', fullName: 'Seattle Seahawks', abbreviation: 'SEA' },
  'tampa-bay-buccaneers': { conference: 'NFC', division: 'NFC South', fullName: 'Tampa Bay Buccaneers', abbreviation: 'TB' },
  'tennessee-titans': { conference: 'AFC', division: 'AFC South', fullName: 'Tennessee Titans', abbreviation: 'TEN' },
  'washington-commanders': { conference: 'NFC', division: 'NFC East', fullName: 'Washington Commanders', abbreviation: 'WSH' },
};

// Playoff teams will be fetched dynamically from standings API

// Hardcoded playoff journey for Super Bowl LX teams
const playoffJourney: Record<string, PlayoffGame[]> = {
  'new-england-patriots': [
    {
      round: 'Wild Card',
      opponent: 'los-angeles-chargers',
      opponentName: 'Los Angeles Chargers',
      opponentSeed: 7,
      isHome: true,
      teamScore: 16,
      opponentScore: 3,
      result: 'W',
      date: 'Sun, Jan 11',
      venue: 'Gillette Stadium',
    },
    {
      round: 'Divisional',
      opponent: 'houston-texans',
      opponentName: 'Houston Texans',
      opponentSeed: 5,
      isHome: true,
      teamScore: 28,
      opponentScore: 16,
      result: 'W',
      date: 'Sun, Jan 18',
      venue: 'Gillette Stadium',
    },
    {
      round: 'AFC Championship',
      opponent: 'denver-broncos',
      opponentName: 'Denver Broncos',
      opponentSeed: 1,
      isHome: false,
      teamScore: 10,
      opponentScore: 7,
      result: 'W',
      date: 'Sun, Jan 25',
      venue: 'Empower Field at Mile High',
    },
  ],
  'seattle-seahawks': [
    {
      round: 'Divisional',
      opponent: 'san-francisco-49ers',
      opponentName: 'San Francisco 49ers',
      opponentSeed: 6,
      isHome: true,
      teamScore: 41,
      opponentScore: 6,
      result: 'W',
      date: 'Sat, Jan 17',
      venue: 'Lumen Field',
      note: 'First round bye as #1 seed',
    },
    {
      round: 'NFC Championship',
      opponent: 'los-angeles-rams',
      opponentName: 'Los Angeles Rams',
      opponentSeed: 5,
      isHome: true,
      teamScore: 31,
      opponentScore: 27,
      result: 'W',
      date: 'Sun, Jan 25',
      venue: 'Lumen Field',
    },
  ],
};

interface PlayoffGame {
  round: string;
  opponent: string;
  opponentName: string;
  opponentSeed: number;
  isHome: boolean;
  teamScore: number;
  opponentScore: number;
  result: 'W' | 'L';
  date: string;
  venue: string;
  note?: string;
}

interface GameResult {
  opponent: string;
  opponentSlug: string;
  isHome: boolean;
  result: 'W' | 'L' | 'T';
  teamScore: number;
  opponentScore: number;
  opponentRecord?: { wins: number; losses: number };
}

interface SportsKeedaGame {
  event_id: number;
  event_type: number;
  status: string;
  teams: Array<{
    team_id: number;
    location_type: 'home' | 'away';
    score?: number;
    is_winner?: boolean;
    team_slug: string;
    location: string;
    nickname: string;
  }>;
}

// Fetch team schedule and calculate advanced stats
async function fetchTeamSeasonData(teamId: string) {
  const sportsKeedaTeamId = teamIdToSportsKeedaId[teamId];
  const meta = teamMetadata[teamId];

  if (!sportsKeedaTeamId || !meta) {
    throw new Error(`Unknown team: ${teamId}`);
  }

  // Fetch schedule data
  const scheduleResponse = await fetch(
    `https://cf-gotham.sportskeeda.com/taxonomy/sport/nfl/schedule/2025?team=${sportsKeedaTeamId}`,
    {
      headers: { 'User-Agent': 'PFN-Internal-NON-Blocking' },
      next: { revalidate: 7200 }, // Cache for 2 hours
    }
  );

  if (!scheduleResponse.ok) {
    throw new Error(`Failed to fetch schedule for ${teamId}`);
  }

  const scheduleData = await scheduleResponse.json();

  // PPG will be calculated from actual game data below

  // Process regular season games only
  const regularSeasonGames: SportsKeedaGame[] = (scheduleData.schedule || []).filter(
    (game: SportsKeedaGame) => game.event_type === 1 && game.status === 'Final'
  );

  // Calculate detailed stats
  let wins = 0, losses = 0, ties = 0;
  let homeWins = 0, homeLosses = 0;
  let awayWins = 0, awayLosses = 0;
  let confWins = 0, confLosses = 0;
  let divWins = 0, divLosses = 0;
  let totalPointsFor = 0, totalPointsAgainst = 0;

  const gameResults: GameResult[] = [];
  const last10Results: ('W' | 'L' | 'T')[] = [];

  for (const game of regularSeasonGames) {
    const team = game.teams.find(t => t.team_id === sportsKeedaTeamId);
    const opponent = game.teams.find(t => t.team_id !== sportsKeedaTeamId);

    if (!team || !opponent || typeof team.score !== 'number' || typeof opponent.score !== 'number') {
      continue;
    }

    const isHome = team.location_type === 'home';
    const isTie = team.score === opponent.score;
    const isWin = !isTie && team.is_winner;
    const result: 'W' | 'L' | 'T' = isTie ? 'T' : isWin ? 'W' : 'L';

    // Opponent metadata
    const opponentMeta = teamMetadata[opponent.team_slug];
    const isConfGame = opponentMeta && opponentMeta.conference === meta.conference;
    const isDivGame = opponentMeta && opponentMeta.division === meta.division;

    // Track overall record
    if (isWin) wins++;
    else if (isTie) ties++;
    else losses++;

    // Track home/away
    if (isHome) {
      if (isWin) homeWins++;
      else if (!isTie) homeLosses++;
    } else {
      if (isWin) awayWins++;
      else if (!isTie) awayLosses++;
    }

    // Track conference/division
    if (isConfGame) {
      if (isWin) confWins++;
      else if (!isTie) confLosses++;
    }
    if (isDivGame) {
      if (isWin) divWins++;
      else if (!isTie) divLosses++;
    }

    // Track points
    totalPointsFor += team.score;
    totalPointsAgainst += opponent.score;

    // Track game results for quality wins analysis
    gameResults.push({
      opponent: `${opponent.location} ${opponent.nickname}`,
      opponentSlug: opponent.team_slug,
      isHome,
      result,
      teamScore: team.score,
      opponentScore: opponent.score,
    });

    last10Results.push(result);
  }

  // Calculate streak
  let streak = '-';
  if (last10Results.length > 0) {
    const lastResult = last10Results[last10Results.length - 1];
    let streakCount = 1;
    for (let i = last10Results.length - 2; i >= 0; i--) {
      if (last10Results[i] === lastResult) streakCount++;
      else break;
    }
    streak = `${lastResult}${streakCount}`;
  }

  // Calculate last 10
  const last10Games = last10Results.slice(-10);
  const last10Wins = last10Games.filter(r => r === 'W').length;
  const last10Losses = last10Games.filter(r => r === 'L').length;

  // Quality wins and playoff team record will be calculated in GET handler
  // after we have the standings data (to avoid duplicate API calls)

  // Point differential
  const pointDifferential = totalPointsFor - totalPointsAgainst;
  const gamesPlayed = regularSeasonGames.length;
  const avgPointDifferential = gamesPlayed > 0
    ? (pointDifferential / gamesPlayed).toFixed(1)
    : '0.0';

  // Calculate PPG from actual game data
  const ppg = gamesPlayed > 0 ? (totalPointsFor / gamesPlayed).toFixed(1) : '0.0';
  const oppPpg = gamesPlayed > 0 ? (totalPointsAgainst / gamesPlayed).toFixed(1) : '0.0';

  return {
    teamId,
    fullName: meta.fullName,
    abbreviation: meta.abbreviation,
    conference: meta.conference,
    division: meta.division,
    regularSeason: {
      record: `${wins}-${losses}${ties > 0 ? `-${ties}` : ''}`,
      wins,
      losses,
      ties,
      winPercentage: ((wins + ties * 0.5) / (wins + losses + ties) * 100).toFixed(1),
      homeRecord: `${homeWins}-${homeLosses}`,
      awayRecord: `${awayWins}-${awayLosses}`,
      conferenceRecord: `${confWins}-${confLosses}`,
      divisionRecord: `${divWins}-${divLosses}`,
      streak,
      last10: `${last10Wins}-${last10Losses}`,
      pointsFor: totalPointsFor,
      pointsAgainst: totalPointsAgainst,
      pointDifferential,
      avgPointDifferential,
      ppg,
      oppPpg,
    },
    gameResults, // Include for calculations in GET handler
    playoffJourney: playoffJourney[teamId] || [],
  };
}

// Cached standings data (single source of truth)
let cachedStandingsData: {
  records: Record<string, { wins: number; losses: number }>;
  playoffTeams: string[];
  sosData: Record<string, { sos: number; sosRank: number }>;
} | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 3600000; // 1 hour

// Fetch all standings data from SportsKeeda draft order JSON (single API call)
// This JSON contains: Record, Win %, SOS, and team slugs for all 32 teams
async function fetchStandingsData(): Promise<{
  records: Record<string, { wins: number; losses: number }>;
  playoffTeams: string[];
  sosData: Record<string, { sos: number; sosRank: number }>;
}> {
  const now = Date.now();

  // Return cached data if still valid
  if (cachedStandingsData && (now - cacheTimestamp) < CACHE_DURATION) {
    return cachedStandingsData;
  }

  try {
    const response = await fetch('https://statics.sportskeeda.com/assets/sheets/tools/draft-order/draft_order.json', {
      headers: { 'User-Agent': 'PFN-Internal-NON-Blocking' },
      next: { revalidate: 7200 }, // Cache for 2 hours
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      console.error('Failed to fetch data from SportsKeeda');
      return cachedStandingsData || { records: {}, playoffTeams: [], sosData: {} };
    }

    const data = await response.json();
    const records: Record<string, { wins: number; losses: number }> = {};
    const sosValues: { teamId: string; sos: number; winPct: number }[] = [];

    // Skip header row (index 0) and process team data
    // Columns: [0]=Pick, [6]=Record, [7]=Win%, [8]=SOS, [11]=OT Slug (original team)
    data.slice(1).forEach((row: string[]) => {
      const teamSlug = row[11]; // originalTeamSlug at index 11
      const recordStr = row[6]; // Record like "3-14" or "7-9-1"
      const winPct = parseFloat(row[7]); // Win percentage
      const sos = parseFloat(row[8]); // Strength of schedule

      if (teamSlug && recordStr) {
        // Parse record (handles ties like "7-9-1")
        const parts = recordStr.split('-').map(p => parseInt(p, 10));
        const wins = parts[0] || 0;
        const losses = parts[1] || 0;

        // Only add if we haven't seen this team yet (avoid duplicates from trades)
        if (!records[teamSlug]) {
          records[teamSlug] = { wins, losses };
          if (!isNaN(sos)) {
            sosValues.push({ teamId: teamSlug, sos, winPct: winPct || 0 });
          }
        }
      }
    });

    // Calculate SOS ranks (higher = harder schedule)
    sosValues.sort((a, b) => b.sos - a.sos);
    const sosData: Record<string, { sos: number; sosRank: number }> = {};
    sosValues.forEach((item, index) => {
      sosData[item.teamId] = { sos: item.sos, sosRank: index + 1 };
    });

    // Calculate playoff teams (top 7 from each conference by win %)
    const afcTeams: { teamId: string; winPct: number }[] = [];
    const nfcTeams: { teamId: string; winPct: number }[] = [];

    for (const item of sosValues) {
      const meta = teamMetadata[item.teamId];
      if (!meta) continue;

      if (meta.conference === 'AFC') {
        afcTeams.push({ teamId: item.teamId, winPct: item.winPct });
      } else {
        nfcTeams.push({ teamId: item.teamId, winPct: item.winPct });
      }
    }

    afcTeams.sort((a, b) => b.winPct - a.winPct);
    nfcTeams.sort((a, b) => b.winPct - a.winPct);

    const playoffTeams = [
      ...afcTeams.slice(0, 7).map(t => t.teamId),
      ...nfcTeams.slice(0, 7).map(t => t.teamId),
    ];

    // Update cache
    cachedStandingsData = { records, playoffTeams, sosData };
    cacheTimestamp = now;

    return cachedStandingsData;
  } catch (error) {
    console.error('Error fetching standings data:', error);
    return cachedStandingsData || { records: {}, playoffTeams: [], sosData: {} };
  }
}

// Calculate quality wins/losses (games against teams with .500+ record)
function calculateQualityWins(gameResults: GameResult[], allRecords: Record<string, { wins: number; losses: number }>) {

  let qualityWins = 0;
  let qualityLosses = 0;
  const qualityGamesList: { opponent: string; opponentSlug: string; opponentRecord: string; score: string; result: 'W' | 'L' }[] = [];

  for (const game of gameResults) {
    const oppRecord = allRecords[game.opponentSlug];
    if (!oppRecord) continue;

    const oppWinPct = oppRecord.wins / (oppRecord.wins + oppRecord.losses);

    if (oppWinPct >= 0.5) {
      if (game.result === 'W') {
        qualityWins++;
        qualityGamesList.push({
          opponent: game.opponent,
          opponentSlug: game.opponentSlug,
          opponentRecord: `${oppRecord.wins}-${oppRecord.losses}`,
          score: `${game.teamScore}-${game.opponentScore}`,
          result: 'W',
        });
      } else if (game.result === 'L') {
        qualityLosses++;
        qualityGamesList.push({
          opponent: game.opponent,
          opponentSlug: game.opponentSlug,
          opponentRecord: `${oppRecord.wins}-${oppRecord.losses}`,
          score: `${game.teamScore}-${game.opponentScore}`,
          result: 'L',
        });
      }
    }
  }

  return {
    record: `${qualityWins}-${qualityLosses}`,
    wins: qualityWins,
    losses: qualityLosses,
    games: qualityGamesList,
  };
}

// Calculate record vs playoff teams
function calculateRecordVsPlayoffTeams(gameResults: GameResult[], playoffTeams: string[]) {
  let wins = 0;
  let losses = 0;
  const games: { opponent: string; result: string; score: string }[] = [];

  for (const game of gameResults) {
    if (playoffTeams.includes(game.opponentSlug)) {
      if (game.result === 'W') wins++;
      else if (game.result === 'L') losses++;

      games.push({
        opponent: game.opponent,
        result: game.result,
        score: `${game.teamScore}-${game.opponentScore}`,
      });
    }
  }

  return {
    record: `${wins}-${losses}`,
    wins,
    losses,
    games,
  };
}

// Calculate combined opponent record from game results (no extra API call needed)
function calculateOpponentRecord(
  gameResults: GameResult[],
  allRecords: Record<string, { wins: number; losses: number }>
): { combined: string; winPct: string } {
  let totalWins = 0;
  let totalLosses = 0;

  for (const game of gameResults) {
    const oppRecord = allRecords[game.opponentSlug];
    if (oppRecord) {
      totalWins += oppRecord.wins;
      totalLosses += oppRecord.losses;
    }
  }

  const winPct = totalWins + totalLosses > 0
    ? ((totalWins / (totalWins + totalLosses)) * 100).toFixed(1)
    : '0.0';

  return {
    combined: `${totalWins}-${totalLosses}`,
    winPct: `${winPct}%`,
  };
}

export async function GET() {
  try {
    // Fetch standings data ONCE (includes records, playoff teams, and SOS)
    // and team schedule data in parallel
    const [standingsData, patriotsData, seahawksData] = await Promise.all([
      fetchStandingsData(),
      fetchTeamSeasonData('new-england-patriots'),
      fetchTeamSeasonData('seattle-seahawks'),
    ]);

    const { records: allTeamRecords, playoffTeams, sosData } = standingsData;

    // Get game results
    const patriotsGames = patriotsData.gameResults || [];
    const seahawksGames = seahawksData.gameResults || [];

    // Calculate quality wins and playoff team records (using pre-fetched standings data)
    const patriotsQualityWins = calculateQualityWins(patriotsGames, allTeamRecords);
    const seahawksQualityWins = calculateQualityWins(seahawksGames, allTeamRecords);
    const patriotsPlayoffRecord = calculateRecordVsPlayoffTeams(patriotsGames, playoffTeams);
    const seahawksPlayoffRecord = calculateRecordVsPlayoffTeams(seahawksGames, playoffTeams);

    // Calculate opponent records (using pre-fetched data, no extra API call)
    const patriotsOppRecord = calculateOpponentRecord(patriotsGames, allTeamRecords);
    const seahawksOppRecord = calculateOpponentRecord(seahawksGames, allTeamRecords);

    // Get SOS data
    const patriotsSOS = sosData['new-england-patriots'] || { sos: 0, sosRank: 0 };
    const seahawksSOS = sosData['seattle-seahawks'] || { sos: 0, sosRank: 0 };

    // Find common opponents
    const patriotsOpponents = new Set(patriotsGames.map((g: GameResult) => g.opponentSlug));
    const seahawksOpponents = new Set(seahawksGames.map((g: GameResult) => g.opponentSlug));
    const commonOpponentSlugs = [...patriotsOpponents].filter(opp => seahawksOpponents.has(opp));

    const commonOpponents = commonOpponentSlugs.map(oppSlug => {
      const patriotsVsOpp = patriotsGames.filter((g: GameResult) => g.opponentSlug === oppSlug);
      const seahawksVsOpp = seahawksGames.filter((g: GameResult) => g.opponentSlug === oppSlug);
      const oppMeta = teamMetadata[oppSlug];
      const oppRecord = allTeamRecords[oppSlug];

      return {
        opponent: oppMeta?.fullName || oppSlug,
        opponentSlug: oppSlug,
        opponentRecord: oppRecord ? `${oppRecord.wins}-${oppRecord.losses}` : 'N/A',
        patriots: patriotsVsOpp.map((g: GameResult) => ({
          result: g.result,
          score: `${g.teamScore}-${g.opponentScore}`,
          location: g.isHome ? 'Home' : 'Away',
        })),
        seahawks: seahawksVsOpp.map((g: GameResult) => ({
          result: g.result,
          score: `${g.teamScore}-${g.opponentScore}`,
          location: g.isHome ? 'Home' : 'Away',
        })),
      };
    });

    // Remove gameResults from the final output
    const { gameResults: _pGames, ...patriotsClean } = patriotsData;
    const { gameResults: _sGames, ...seahawksClean } = seahawksData;

    const response = {
      patriots: {
        ...patriotsClean,
        seed: 2,
        seedType: 'division-winner' as const,
        qualityWins: patriotsQualityWins,
        playoffTeamRecord: patriotsPlayoffRecord,
        strengthOfSchedule: {
          sos: patriotsSOS.sos,
          sosRank: patriotsSOS.sosRank,
          opponentRecord: patriotsOppRecord,
        },
      },
      seahawks: {
        ...seahawksClean,
        seed: 1,
        seedType: 'division-winner' as const,
        qualityWins: seahawksQualityWins,
        playoffTeamRecord: seahawksPlayoffRecord,
        strengthOfSchedule: {
          sos: seahawksSOS.sos,
          sosRank: seahawksSOS.sosRank,
          opponentRecord: seahawksOppRecord,
        },
      },
      commonOpponents,
      lastUpdated: new Date().toISOString(),
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=7200, stale-while-revalidate=3600',
      },
    });
  } catch (error) {
    console.error('Path to Super Bowl API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch path to Super Bowl data' },
      { status: 500 }
    );
  }
}
