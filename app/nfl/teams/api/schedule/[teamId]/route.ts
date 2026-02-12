import { NextRequest, NextResponse } from 'next/server';
import { fetchPlayoffGames, TransformedGame as ESPNGame } from '@/lib/espn';

interface SportsKeedaTeam {
  team_id: number;
  location: string;
  nickname: string;
  team_slug: string;
  abbr: string;
  location_type: 'home' | 'away';
  wins: number;
  losses: number;
  score?: number;
  is_winner?: boolean;
}

interface SportsKeedaGame {
  event_id: number;
  event_type: number; // 0 = preseason, 1 = regular season, 2 = postseason
  week: number; // Week number (1-18 for regular season, 1-4 for preseason)
  week_name: string; // e.g., "Week 1"
  week_short_name: string;
  week_slug: string;
  start_date: {
    full: string;
    formatted: string;
  };
  end_date: {
    full: string;
    formatted: string;
  };
  status: string;
  teams: SportsKeedaTeam[];
  venue: {
    venue_name: string;
    venue_location: string;
  };
  tv_stations: string[];
  game_scores?: {
    home_score: number;
    away_score: number;
  };
}

interface SportsKeedaScheduleResponse {
  season: number;
  season_name: string;
  schedule: SportsKeedaGame[];
  weeks: any[];
}

// Team ID to Sportskeeda team ID mapping - All 32 NFL teams
const teamIdMap: Record<string, number> = {
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const { teamId } = await params;
    const { searchParams } = new URL(request.url);
    const season = parseInt(searchParams.get('season') || '2025', 10);
    const currentSeason = 2025;

    // Get Sportskeeda team ID
    const sportsKeedaTeamId = teamIdMap[teamId];

    if (!sportsKeedaTeamId) {
      return NextResponse.json(
        { error: 'Team not found or not yet mapped' },
        { status: 404 }
      );
    }

    // Fetch data from Sportskeeda API
    const response = await fetch(
      `https://cf-gotham.sportskeeda.com/taxonomy/sport/nfl/schedule/${season}?team=${sportsKeedaTeamId}`,
      {
        headers: {
          'User-Agent': 'PFN-Internal-NON-Blocking',
        },
        next: { revalidate: 86400 } // Cache for 24 hours
      }
    );

    if (!response.ok) {
      throw new Error(`Sportskeeda API error: ${response.status}`);
    }

    const data: SportsKeedaScheduleResponse = await response.json();

    if (!data.schedule || !Array.isArray(data.schedule)) {
      return NextResponse.json(
        { error: 'No schedule data found' },
        { status: 404 }
      );
    }

    // Transform the data to our format
    // For current season, exclude postseason games since we get those from ESPN
    // For past seasons, include postseason games from Sportskeeda
    const transformedSchedule = data.schedule
      .filter(game => season !== currentSeason || game.event_type !== 2)
      .map(game => {
      // Find the target team and opponent
      const targetTeam = game.teams.find(team => team.team_id === sportsKeedaTeamId);
      const opponent = game.teams.find(team => team.team_id !== sportsKeedaTeamId);

      if (!targetTeam || !opponent) {
        console.warn('Could not find team data for game:', game.event_id);
        return null;
      }

      const isHome = targetTeam.location_type === 'home';

      // Determine result if game is completed
      let result: 'W' | 'L' | 'T' | null = null;
      let score: { home: number; away: number } | undefined;

      if (game.status === 'Final' && typeof targetTeam.score === 'number' && typeof opponent.score === 'number') {
        if (isHome) {
          score = { home: targetTeam.score, away: opponent.score };
        } else {
          score = { home: opponent.score, away: targetTeam.score };
        }

        if (targetTeam.score === opponent.score) {
          result = 'T';
        } else {
          result = targetTeam.is_winner ? 'W' : 'L';
        }
      }

      // Manual overrides for ALL preseason week 4 games that API missed (2025 season only)
      if (season === currentSeason && game.event_type === 0 && game.week === 4) {
        const gameResults = getPreseasonWeek4Results(sportsKeedaTeamId, opponent.team_id);
        if (gameResults) {
          result = gameResults.result;
          score = gameResults.score;
        }
      }

      return {
        week: getWeekDisplay(game.event_type, game.week),
        date: formatGameDate(game.start_date?.full),
        opponent: `${opponent.location} ${opponent.nickname}`,
        opponentLogo: getTeamLogo(opponent.abbr),
        opponentAbbr: opponent.abbr,
        isHome,
        time: formatGameTime(game.start_date?.full),
        tv: game.tv_stations?.join(', ') || 'TBD',
        venue: game.venue?.venue_name || 'TBD',
        result,
        score,
        eventType: getEventType(game.event_type)
      };
    }).filter(Boolean);

    // Add bye weeks for regular season
    const scheduleWithByeWeeks = addByeWeeks(transformedSchedule);

    // Fetch playoff games from ESPN for this team (current season only)
    let playoffGames: any[] = [];
    if (season === currentSeason) {
    try {
      const espnPlayoffGames = await fetchPlayoffGames();

      // Filter for games involving this team
      const teamPlayoffGames = espnPlayoffGames.filter(game =>
        game.away_team.team_slug === teamId || game.home_team.team_slug === teamId
      );

      if (teamPlayoffGames.length > 0) {
        // Transform ESPN playoff games to our schedule format
        playoffGames = teamPlayoffGames.map(game => {
          const isHome = game.home_team.team_slug === teamId;
          const opponent = isHome ? game.away_team : game.home_team;

          // Determine result if game is completed
          let result: 'W' | 'L' | null = null;
          let score: { home: number; away: number } | undefined;

          if (game.status === 'Final' && game.has_score) {
            const teamScore = isHome ? game.home_team.score : game.away_team.score;
            const oppScore = isHome ? game.away_team.score : game.home_team.score;

            if (teamScore !== undefined && oppScore !== undefined) {
              result = teamScore > oppScore ? 'W' : 'L';
              score = {
                home: game.home_team.score!,
                away: game.away_team.score!
              };
            }
          }

          return {
            week: game.playoff_round || 'Playoff',
            date: formatGameDate(game.start_date),
            opponent: opponent.team_name,
            opponentLogo: opponent.logo || getTeamLogo(opponent.abbr),
            opponentAbbr: opponent.abbr,
            isHome,
            time: formatGameTime(game.start_date),
            tv: game.tv_stations?.map(s => s.name).join(', ') || 'TBD',
            venue: game.venue?.name || 'TBD',
            result,
            score,
            eventType: 'Postseason'
          };
        });
      }
    } catch (error) {
      console.error('Error fetching ESPN playoff games for team:', error);
      // Continue without playoff games if ESPN fails
    }
    }

    // Combine schedule with playoff games
    const fullSchedule = [...scheduleWithByeWeeks, ...playoffGames];

    return NextResponse.json({
      teamId,
      schedule: fullSchedule,
      totalGames: fullSchedule.length,
      lastUpdated: new Date().toISOString(),
      season: data.season
    });

  } catch (error) {
    console.error('Schedule API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch schedule data' },
      { status: 500 }
    );
  }
}

function formatGameDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return 'TBD';
  }
}

function formatGameTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'America/Los_Angeles'
    });
  } catch {
    return 'TBD';
  }
}

function getTeamLogo(teamAbbr: string | undefined): string {
  const teamSlugMap: Record<string, string> = {
    'ari': 'arizona-cardinals',
    'atl': 'atlanta-falcons',
    'bal': 'baltimore-ravens',
    'buf': 'buffalo-bills',
    'car': 'carolina-panthers',
    'chi': 'chicago-bears',
    'cin': 'cincinnati-bengals',
    'cle': 'cleveland-browns',
    'dal': 'dallas-cowboys',
    'den': 'denver-broncos',
    'det': 'detroit-lions',
    'gb': 'green-bay-packers',
    'hou': 'houston-texans',
    'ind': 'indianapolis-colts',
    'jax': 'jacksonville-jaguars',
    'jac': 'jacksonville-jaguars',
    'kc': 'kansas-city-chiefs',
    'lv': 'las-vegas-raiders',
    'lac': 'los-angeles-chargers',
    'lar': 'los-angeles-rams',
    'mia': 'miami-dolphins',
    'min': 'minnesota-vikings',
    'ne': 'new-england-patriots',
    'no': 'new-orleans-saints',
    'nyg': 'new-york-giants',
    'nyj': 'new-york-jets',
    'phi': 'philadelphia-eagles',
    'pit': 'pittsburgh-steelers',
    'sf': 'san-francisco-49ers',
    'sea': 'seattle-seahawks',
    'tb': 'tampa-bay-buccaneers',
    'ten': 'tennessee-titans',
    'wsh': 'washington-commanders',
    'was': 'washington-commanders'
  };

  if (!teamAbbr) {
    return 'https://www.profootballnetwork.com/apps/nfl-logos/nfl.png'; // Generic NFL logo
  }

  const abbr = teamAbbr.toLowerCase();
  const teamSlug = teamSlugMap[abbr];

  if (!teamSlug) {
    return 'https://www.profootballnetwork.com/apps/nfl-logos/nfl.png'; // Fallback to generic NFL logo
  }

  return `https://www.profootballnetwork.com/apps/nfl-logos/${teamSlug}.png`;
}

function getWeekDisplay(eventType: number, week: number): string | number {
  switch (eventType) {
    case 0: return `Pre-${week}`; // Preseason: Pre-1, Pre-2, etc.
    case 1: return week; // Regular Season: 1, 2, 3, etc.
    case 2: return `Playoff-${week}`; // Postseason: Playoff-1, Playoff-2, etc.
    default: return week;
  }
}

function addByeWeeks(schedule: any[]): any[] {
  // Separate regular season games from other games
  const regularSeasonGames = schedule.filter(game => game.eventType === 'Regular Season');
  const otherGames = schedule.filter(game => game.eventType !== 'Regular Season');

  // Get all week numbers that have games
  const existingWeeks = new Set(regularSeasonGames.map(game => game.week));

  // Create bye week entries for missing weeks (1-18)
  const allRegularSeasonEntries = [];
  for (let week = 1; week <= 18; week++) {
    if (existingWeeks.has(week)) {
      // Add the actual game(s) for this week
      allRegularSeasonEntries.push(...regularSeasonGames.filter(game => game.week === week));
    } else {
      // Add a bye week entry
      allRegularSeasonEntries.push({
        week,
        date: 'BYE WEEK',
        opponent: '',
        opponentLogo: '',
        opponentAbbr: 'BYE',
        isHome: null,
        time: '',
        tv: '',
        venue: '',
        result: null,
        score: undefined,
        eventType: 'Regular Season'
      });
    }
  }

  // Combine with other games (preseason, postseason)
  return [...otherGames, ...allRegularSeasonEntries];
}

function getEventType(eventType: number): string {
  switch (eventType) {
    case 0: return 'Preseason';
    case 1: return 'Regular Season';
    case 2: return 'Postseason';
    default: return 'Regular Season';
  }
}

function getPreseasonWeek4Results(teamId: number, opponentId: number): { result: 'W' | 'L', score: { home: number, away: number } } | null {
  // All preseason week 4 game results from ESPN
  const games = [
    // Thursday, August 21, 2025
    { home: 364, away: 356, homeScore: 10, awayScore: 19 }, // Panthers 10, Steelers 19
    { home: 351, away: 348, homeScore: 42, awayScore: 10 }, // Giants 42, Patriots 10

    // Friday, August 22, 2025
    { home: 352, away: 354, homeScore: 17, awayScore: 19 }, // Jets 17, Eagles 19
    { home: 331, away: 323, homeScore: 31, awayScore: 13 }, // Cowboys 31, Falcons 13
    { home: 336, away: 347, homeScore: 23, awayScore: 13 }, // Titans 23, Vikings 13
    { home: 339, away: 326, homeScore: 27, awayScore: 29 }, // Chiefs 27, Bears 29

    // Saturday, August 23, 2025
    { home: 363, away: 366, homeScore: 3, awayScore: 30 },  // Commanders 3, Ravens 30
    { home: 327, away: 338, homeScore: 14, awayScore: 41 }, // Bengals 14, Colts 41
    { home: 329, away: 343, homeScore: 19, awayScore: 17 }, // Browns 19, Rams 17
    { home: 334, away: 325, homeScore: 7, awayScore: 26 },  // Lions 7, Texans 26
    { home: 350, away: 332, homeScore: 19, awayScore: 28 }, // Saints 19, Broncos 28
    { home: 335, away: 361, homeScore: 20, awayScore: 7 },  // Packers 20, Seahawks 7
    { home: 345, away: 365, homeScore: 14, awayScore: 6 },  // Dolphins 14, Jaguars 6
    { home: 362, away: 324, homeScore: 19, awayScore: 23 }, // Buccaneers 19, Bills 23
    { home: 359, away: 357, homeScore: 30, awayScore: 23 }, // 49ers 30, Chargers 23
    { home: 355, away: 341, homeScore: 20, awayScore: 10 }, // Cardinals 20, Raiders 10
  ];

  // Find the game for this team
  for (const game of games) {
    if ((teamId === game.home && opponentId === game.away) ||
        (teamId === game.away && opponentId === game.home)) {

      const isTeamHome = teamId === game.home;
      const teamScore = isTeamHome ? game.homeScore : game.awayScore;
      const opponentScore = isTeamHome ? game.awayScore : game.homeScore;

      return {
        result: teamScore > opponentScore ? 'W' : 'L',
        score: {
          home: game.homeScore,
          away: game.awayScore
        }
      };
    }
  }

  return null;
}