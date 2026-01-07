import { NextRequest, NextResponse } from 'next/server';
import { wildCardGames2026, StaticPlayoffGame } from '@/data/playoffGames2026';
import { getAllTeams } from '@/data/teams';

// Function to determine cache revalidation time based on NFL game schedule
function getRevalidationTime(): number {
  // Get current time in Pacific Time
  const now = new Date();
  const pacificTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
  const dayOfWeek = pacificTime.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const hour = pacificTime.getHours();

  // Saturday (6) or Sunday (0): Update every hour all day
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return 3600; // 1 hour
  }

  // Monday (1) or Thursday (4): Update every hour from 6 PM to midnight PT (game window)
  if ((dayOfWeek === 1 || dayOfWeek === 4) && hour >= 18 && hour <= 23) {
    return 3600; // 1 hour
  }

  // All other times: Update every 6 hours (less frequent)
  return 21600; // 6 hours
}

// Function to convert static playoff games to API format
function convertStaticGameToAPIFormat(game: StaticPlayoffGame): TransformedGame {
  const allTeams = getAllTeams();
  const awayTeam = allTeams.find(t => t.id === game.awayTeam);
  const homeTeam = allTeams.find(t => t.id === game.homeTeam);

  // Convert date and time to ISO format
  const [month, day, year] = game.date.split('-').map(Number);
  const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  return {
    event_id: `playoff-${game.date}-${game.awayTeam}-${game.homeTeam}`,
    start_date: `${dateStr}T${game.time}`,
    status: 'Pre-Game',
    has_score: false,
    away_team: {
      team_slug: game.awayTeam,
      abbr: awayTeam?.abbreviation || '',
      team_name: awayTeam?.fullName || '',
      wins: 0,
      losses: 0,
    },
    home_team: {
      team_slug: game.homeTeam,
      abbr: homeTeam?.abbreviation || '',
      team_name: homeTeam?.fullName || '',
      wins: 0,
      losses: 0,
    },
    venue: {
      name: game.venue,
      city: game.city,
      state: {
        name: game.state,
        abbreviation: game.state,
      },
    },
    tv_stations: game.tv.split('/').map(station => ({
      name: station.trim(),
      call_letters: station.trim(),
    })),
  };
}

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
  week: number;
  week_name: string;
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
  has_score: boolean;
  teams: SportsKeedaTeam[];
  venue_name: string;
  venue_city: string;
  venue_state_abbr?: string;
  tv_stations: string[];
  hi_pass?: {
    player_id: number;
    player_name: string;
    player_slug: string;
    value: number;
  };
  hi_rec?: {
    player_id: number;
    player_name: string;
    player_slug: string;
    value: number;
  };
  hi_rush?: {
    player_id: number;
    player_name: string;
    player_slug: string;
    value: number;
  };
}

interface SportsKeedaScheduleResponse {
  season: number;
  season_name: string;
  schedule: SportsKeedaGame[];
}

// Transform to format expected by schedule page
interface TransformedGame {
  event_id: string;
  start_date: string;
  status: string;
  has_score: boolean;
  away_team: {
    team_slug: string;
    abbr: string;
    team_name: string;
    wins: number;
    losses: number;
    score?: number;
    is_winner?: boolean;
  };
  home_team: {
    team_slug: string;
    abbr: string;
    team_name: string;
    wins: number;
    losses: number;
    score?: number;
    is_winner?: boolean;
  };
  venue?: {
    name: string;
    city: string;
    state?: {
      name: string;
      abbreviation: string;
    };
  };
  tv_stations?: Array<{
    name: string;
    call_letters: string;
  }>;
  hi_pass?: {
    player_id: number;
    player_name: string;
    player_slug: string;
    value: number;
  };
  hi_rush?: {
    player_id: number;
    player_name: string;
    player_slug: string;
    value: number;
  };
  hi_rec?: {
    player_id: number;
    player_name: string;
    player_slug: string;
    value: number;
  };
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const season = searchParams.get('season') || '2025';
    const requestedDate = searchParams.get('date');

    if (!requestedDate) {
      return NextResponse.json(
        { error: 'Date parameter is required' },
        { status: 400 }
      );
    }

    // Determine if requested date is in the past
    const requestedDateObj = new Date(requestedDate + 'T12:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isHistoricalDate = requestedDateObj < today;

    // For historical dates: Use longer cache and fetch from team APIs (comprehensive data)
    // For current/future dates: Use dynamic cache and general API (faster, current data)
    let revalidateTime: number;
    let allGames = new Map<number, SportsKeedaGame>();

    if (isHistoricalDate) {
      // Historical games - cache for 1 week since data won't change
      revalidateTime = 604800; // 1 week

      // Fetch from ALL 32 teams to ensure complete historical coverage
      // This runs once per week per historical date, so it's worth being comprehensive
      const allTeamIds = [
        355, 323, 366, 324, 364, 326, 327, 329, 331, 332, // ARI, ATL, BAL, BUF, CAR, CHI, CIN, CLE, DAL, DEN
        334, 335, 325, 338, 365, 339, 341, 357, 343, 345, // DET, GB, HOU, IND, JAX, KC, LV, LAC, LAR, MIA
        347, 348, 350, 351, 352, 354, 356, 359, 361, 362, // MIN, NE, NO, NYG, NYJ, PHI, PIT, SF, SEA, TB
        336, 363 // TEN, WAS
      ];

      for (const teamId of allTeamIds) {
        try {
          const response = await fetch(
            `https://cf-gotham.sportskeeda.com/taxonomy/sport/nfl/schedule/${season}?team=${teamId}`,
            {
              headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; NFL-Team-Pages/1.0)',
              },
              next: { revalidate: revalidateTime }
            }
          );

          if (response.ok) {
            const data: SportsKeedaScheduleResponse = await response.json();
            if (data.schedule && Array.isArray(data.schedule)) {
              data.schedule.forEach(game => {
                allGames.set(game.event_id, game);
              });
            }
          }
        } catch (error) {
          console.error(`Error fetching schedule for team ${teamId}:`, error);
          // Continue with other teams
        }
      }
    } else {
      // Current/upcoming games - use dynamic cache based on game schedule
      revalidateTime = getRevalidationTime();

      // General API is fine for current/upcoming games
      try {
        const response = await fetch(
          `https://cf-gotham.sportskeeda.com/taxonomy/sport/nfl/schedule/${season}`,
          {
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; NFL-Team-Pages/1.0)',
            },
            next: { revalidate: revalidateTime }
          }
        );

        if (response.ok) {
          const data: SportsKeedaScheduleResponse = await response.json();
          if (data.schedule && Array.isArray(data.schedule)) {
            data.schedule.forEach(game => {
              allGames.set(game.event_id, game);
            });
          }
        }
      } catch (error) {
        console.error('Error fetching current schedule:', error);
      }
    }

    if (allGames.size === 0) {
      return NextResponse.json(
        { error: 'No schedule data found' },
        { status: 404 }
      );
    }

    // Filter games by the requested date
    const filteredGames = Array.from(allGames.values()).filter((game) => {
      const gameDate = new Date(game.start_date.full);
      const gameDateStr = gameDate.toISOString().split('T')[0];
      return gameDateStr === requestedDate;
    });

    // Transform to expected format
    const transformedGames: TransformedGame[] = filteredGames.map((game) => {
      const awayTeam = game.teams.find(t => t.location_type === 'away');
      const homeTeam = game.teams.find(t => t.location_type === 'home');

      if (!awayTeam || !homeTeam) {
        console.warn('Missing team data for game:', game.event_id);
        return null;
      }

      return {
        event_id: String(game.event_id),
        start_date: game.start_date.full,
        status: game.status,
        has_score: game.has_score,
        away_team: {
          team_slug: awayTeam.team_slug,
          abbr: awayTeam.abbr,
          team_name: `${awayTeam.location} ${awayTeam.nickname}`,
          wins: awayTeam.wins,
          losses: awayTeam.losses,
          score: awayTeam.score,
          is_winner: awayTeam.is_winner,
        },
        home_team: {
          team_slug: homeTeam.team_slug,
          abbr: homeTeam.abbr,
          team_name: `${homeTeam.location} ${homeTeam.nickname}`,
          wins: homeTeam.wins,
          losses: homeTeam.losses,
          score: homeTeam.score,
          is_winner: homeTeam.is_winner,
        },
        venue: game.venue_name ? {
          name: game.venue_name,
          city: game.venue_city,
          state: game.venue_state_abbr ? {
            name: '', // Not provided by API
            abbreviation: game.venue_state_abbr,
          } : undefined,
        } : undefined,
        tv_stations: game.tv_stations?.map(station => ({
          name: station,
          call_letters: station,
        })),
        hi_pass: game.hi_pass,
        hi_rush: game.hi_rush,
        hi_rec: game.hi_rec,
      };
    }).filter(Boolean) as TransformedGame[];

    // Check if we should add static playoff games for this date
    const staticPlayoffGames = wildCardGames2026.filter(game => game.date === requestedDate);

    // If we have static playoff games for this date, always add them
    // They will be used until the API has actual playoff game results
    if (staticPlayoffGames.length > 0) {
      // Only add static playoff games if there are no games with scores yet
      // Once games have started/finished, the API data should take precedence
      const hasLiveOrFinishedGames = transformedGames.some(game => game.has_score || game.status !== 'Pre-Game');

      if (!hasLiveOrFinishedGames) {
        // Clear any non-playoff API games and use our static playoff games instead
        transformedGames = [];
        const staticGames = staticPlayoffGames.map(convertStaticGameToAPIFormat);
        transformedGames.push(...staticGames);
      }
    }

    return NextResponse.json({
      schedule: transformedGames,
      date: requestedDate,
      season: parseInt(season),
      totalGames: transformedGames.length,
    });

  } catch (error) {
    console.error('Schedule by-date API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch schedule data' },
      { status: 500 }
    );
  }
}
