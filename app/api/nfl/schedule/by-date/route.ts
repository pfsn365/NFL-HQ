import { NextRequest, NextResponse } from 'next/server';
import { wildCardGames2026, StaticPlayoffGame } from '@/data/playoffGames2026';
import { getAllTeams } from '@/data/teams';
import { isPlayoffDate, fetchGamesByDate as fetchESPNGamesByDate, TransformedGame as ESPNTransformedGame } from '@/lib/espn';

// Function to convert ESPN games to local TransformedGame format
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

// Function to convert static playoff games to API format
function convertStaticGameToAPIFormat(game: StaticPlayoffGame): TransformedGame {
  const allTeams = getAllTeams();
  const awayTeam = allTeams.find(t => t.id === game.awayTeam);
  const homeTeam = allTeams.find(t => t.id === game.homeTeam);

  // Convert date and time to ISO format
  // Parse time like "1:30 PM ET" and convert to 24-hour format for ISO
  const timeMatch = game.time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  let isoTime = '12:00:00';
  if (timeMatch) {
    let hours = parseInt(timeMatch[1]);
    const minutes = timeMatch[2];
    const period = timeMatch[3].toUpperCase();

    // Convert to 24-hour format
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

// Transform to format expected by schedule page
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
    const seasonParam = searchParams.get('season') || '2025';
    const requestedDate = searchParams.get('date');

    // Validate season parameter (must be a 4-digit year between 2020-2030)
    const seasonYear = parseInt(seasonParam, 10);
    if (isNaN(seasonYear) || seasonYear < 2020 || seasonYear > 2030) {
      return NextResponse.json(
        { error: 'Invalid season parameter. Must be a year between 2020-2030.' },
        { status: 400 }
      );
    }
    const season = seasonParam;

    if (!requestedDate) {
      return NextResponse.json(
        { error: 'Date parameter is required' },
        { status: 400 }
      );
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(requestedDate)) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD.' },
        { status: 400 }
      );
    }

    // Validate it's a real date
    const parsedDate = new Date(requestedDate);
    if (isNaN(parsedDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date value.' },
        { status: 400 }
      );
    }

    // Use ESPN API for all dates
    try {
      const espnGames = await fetchESPNGamesByDate(requestedDate);

      if (espnGames.length > 0) {
        // Convert ESPN games to local format
        const transformedGames = espnGames.map(convertESPNGameToLocalFormat);

        // Determine cache time based on date and time
        const now = new Date();
        const gameDate = new Date(requestedDate + 'T23:59:59-05:00'); // End of game day in ET
        const hoursSinceGameDay = (now.getTime() - gameDate.getTime()) / (1000 * 60 * 60);

        let revalidateTime: number;
        if (hoursSinceGameDay > 6) {
          // Game day was more than 6 hours ago - games should be final, cache longer
          revalidateTime = 3600; // 1 hour
        } else if (hoursSinceGameDay > 0) {
          // Within 6 hours after game day ends - games might have just finished
          revalidateTime = 60; // 1 minute - refresh frequently to catch final scores
        } else {
          // Game day is today or in future - could be live
          revalidateTime = 30; // 30 seconds for live game updates
        }

        return NextResponse.json({
          schedule: transformedGames,
          date: requestedDate,
          season: parseInt(season),
          totalGames: transformedGames.length,
          source: 'espn',
        }, {
          headers: {
            'Cache-Control': `s-maxage=${revalidateTime}, stale-while-revalidate=${revalidateTime}`,
          },
        });
      }
    } catch (error) {
      console.error('ESPN API error:', error);
    }

    // Fall back to static playoff games if ESPN fails or returns no games for playoff dates
    if (isPlayoffDate(requestedDate)) {
      const staticPlayoffGames = wildCardGames2026.filter(game => game.date === requestedDate);
      if (staticPlayoffGames.length > 0) {
        const staticGames = staticPlayoffGames.map(convertStaticGameToAPIFormat);
        return NextResponse.json({
          schedule: staticGames,
          date: requestedDate,
          season: parseInt(season),
          totalGames: staticGames.length,
          source: 'static',
        });
      }
    }

    // No games found for this date
    return NextResponse.json({
      schedule: [],
      date: requestedDate,
      season: parseInt(season),
      totalGames: 0,
      source: 'espn',
    });

  } catch (error) {
    console.error('Schedule by-date API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch schedule data' },
      { status: 500 }
    );
  }
}
