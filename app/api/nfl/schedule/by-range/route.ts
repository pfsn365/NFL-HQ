import { NextRequest, NextResponse } from 'next/server';
import { wildCardGames2026, StaticPlayoffGame } from '@/data/playoffGames2026';
import { getAllTeams } from '@/data/teams';
import { isPlayoffDate, fetchGamesByDate as fetchESPNGamesByDate, TransformedGame as ESPNTransformedGame } from '@/lib/espn';

interface TransformedGame {
  event_id: string;
  start_date: string;
  status: string;
  has_score: boolean;
  is_live?: boolean;
  away_team: {
    team_slug: string;
    abbr: string;
    team_name: string;
    wins: number;
    losses: number;
    score?: number;
    is_winner?: boolean;
    has_possession?: boolean;
  };
  home_team: {
    team_slug: string;
    abbr: string;
    team_name: string;
    wins: number;
    losses: number;
    score?: number;
    is_winner?: boolean;
    has_possession?: boolean;
  };
  situation?: {
    down_distance?: string;
    is_red_zone?: boolean;
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
  hi_pass?: { player_id: number; player_name: string; player_slug: string; value: number };
  hi_rush?: { player_id: number; player_name: string; player_slug: string; value: number };
  hi_rec?: { player_id: number; player_name: string; player_slug: string; value: number };
}

function convertESPNGameToLocalFormat(game: ESPNTransformedGame): TransformedGame {
  return {
    event_id: game.event_id,
    start_date: game.start_date,
    status: game.status,
    has_score: game.has_score,
    is_live: game.is_live,
    away_team: {
      team_slug: game.away_team.team_slug,
      abbr: game.away_team.abbr,
      team_name: game.away_team.team_name,
      wins: game.away_team.wins,
      losses: game.away_team.losses,
      score: game.away_team.score,
      is_winner: game.away_team.is_winner,
      has_possession: game.away_team.has_possession,
    },
    home_team: {
      team_slug: game.home_team.team_slug,
      abbr: game.home_team.abbr,
      team_name: game.home_team.team_name,
      wins: game.home_team.wins,
      losses: game.home_team.losses,
      score: game.home_team.score,
      is_winner: game.home_team.is_winner,
      has_possession: game.home_team.has_possession,
    },
    situation: game.situation,
    venue: game.venue,
    tv_stations: game.tv_stations,
    hi_pass: game.hi_pass ? {
      player_id: 0,
      player_name: game.hi_pass.player_name,
      player_slug: game.hi_pass.player_name.toLowerCase().replace(/\s+/g, '-'),
      value: game.hi_pass.value,
    } : undefined,
    hi_rush: game.hi_rush ? {
      player_id: 0,
      player_name: game.hi_rush.player_name,
      player_slug: game.hi_rush.player_name.toLowerCase().replace(/\s+/g, '-'),
      value: game.hi_rush.value,
    } : undefined,
    hi_rec: game.hi_rec ? {
      player_id: 0,
      player_name: game.hi_rec.player_name,
      player_slug: game.hi_rec.player_name.toLowerCase().replace(/\s+/g, '-'),
      value: game.hi_rec.value,
    } : undefined,
  };
}

function convertStaticGameToAPIFormat(game: StaticPlayoffGame): TransformedGame {
  const allTeams = getAllTeams();
  const awayTeam = allTeams.find(t => t.id === game.awayTeam);
  const homeTeam = allTeams.find(t => t.id === game.homeTeam);

  const timeMatch = game.time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  let isoTime = '12:00:00';
  if (timeMatch) {
    let hours = parseInt(timeMatch[1]);
    const minutes = timeMatch[2];
    const period = timeMatch[3].toUpperCase();
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    isoTime = `${String(hours).padStart(2, '0')}:${minutes}:00`;
  }

  return {
    event_id: `playoff-${game.date}-${game.awayTeam}-${game.homeTeam}`,
    start_date: `${game.date}T${isoTime}`,
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
      state: { name: game.state, abbreviation: game.state },
    },
    tv_stations: game.tv.split('/').map(station => ({
      name: station.trim(),
      call_letters: station.trim(),
    })),
  };
}

function getDatesInRange(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const current = new Date(startDate + 'T12:00:00');
  const end = new Date(endDate + 'T12:00:00');

  while (current <= end) {
    dates.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

async function fetchGamesForDate(date: string): Promise<TransformedGame[]> {
  try {
    const espnGames = await fetchESPNGamesByDate(date);
    if (espnGames.length > 0) {
      return espnGames.map(convertESPNGameToLocalFormat);
    }
  } catch (error) {
    // Fall through to static games
  }

  if (isPlayoffDate(date)) {
    const staticPlayoffGames = wildCardGames2026.filter(game => game.date === date);
    if (staticPlayoffGames.length > 0) {
      return staticPlayoffGames.map(convertStaticGameToAPIFormat);
    }
  }

  return [];
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('start');
    const endDate = searchParams.get('end');

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'start and end date parameters are required' },
        { status: 400 }
      );
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD.' },
        { status: 400 }
      );
    }

    const dates = getDatesInRange(startDate, endDate);

    if (dates.length > 42) {
      return NextResponse.json(
        { error: 'Date range too large. Maximum 42 days.' },
        { status: 400 }
      );
    }

    // Fetch all dates in parallel on the server side
    const results = await Promise.all(
      dates.map(async (date) => {
        const games = await fetchGamesForDate(date);
        return { date, games };
      })
    );

    const schedule: Record<string, TransformedGame[]> = {};
    for (const { date, games } of results) {
      schedule[date] = games;
    }

    // Cache based on whether the range includes today
    const today = new Date().toISOString().split('T')[0];
    const includesLiveDates = dates.includes(today);
    const cacheTime = includesLiveDates ? 30 : 3600;

    return NextResponse.json({
      schedule,
      startDate,
      endDate,
      totalDays: dates.length,
    }, {
      headers: {
        'Cache-Control': `s-maxage=${cacheTime}, stale-while-revalidate=${cacheTime}`,
      },
    });
  } catch (error) {
    console.error('Schedule by-range API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch schedule data' },
      { status: 500 }
    );
  }
}
