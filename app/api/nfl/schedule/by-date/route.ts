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
  winner_high?: {
    player_id: number;
    player_name: string;
    player_slug: string;
    value: number;
  };
  loser_high?: {
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

    // Fetch all NFL games for the season from Sportskeeda
    // Use dynamic cache time based on game schedule
    // NOTE: General API without team param only returns current/upcoming games
    // We need to aggregate from multiple teams to get full season history
    // Query 4 teams from different divisions to get comprehensive coverage
    const revalidateTime = getRevalidationTime();

    const teamIds = [366, 331, 359, 339]; // Ravens, Cowboys, 49ers, Chiefs - good coverage
    const allGames = new Map<number, SportsKeedaGame>(); // Use Map to deduplicate by event_id

    for (const teamId of teamIds) {
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
            // Add games to map, deduplicating by event_id
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

      // Determine high scorers
      let winner_high;
      let loser_high;

      if (game.status === 'Final') {
        // Use rushing, passing, or receiving stats - prioritize total yards
        const topStat = game.hi_rush || game.hi_pass || game.hi_rec;

        if (topStat && awayTeam.is_winner !== undefined) {
          if (awayTeam.is_winner) {
            winner_high = topStat;
          } else {
            loser_high = topStat;
          }
        }
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
        winner_high,
        loser_high,
      };
    }).filter(Boolean) as TransformedGame[];

    // Check if we should add static playoff games for this date
    const staticPlayoffGames = wildCardGames2026.filter(game => game.date === requestedDate);

    // If we have static playoff games for this date and no API games (or very few), add them
    // API games will replace static games once results are available
    if (staticPlayoffGames.length > 0 && transformedGames.length === 0) {
      const staticGames = staticPlayoffGames.map(convertStaticGameToAPIFormat);
      transformedGames.push(...staticGames);
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
