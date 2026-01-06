import { NextRequest, NextResponse } from 'next/server';

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
    const response = await fetch(
      `https://cf-gotham.sportskeeda.com/taxonomy/sport/nfl/schedule/${season}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; NFL-Team-Pages/1.0)',
        },
        next: { revalidate: 3600 } // Cache for 1 hour
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

    // Filter games by the requested date
    const filteredGames = data.schedule.filter((game) => {
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
