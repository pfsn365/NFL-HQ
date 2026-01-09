import { NextRequest, NextResponse } from 'next/server';

interface StatLeader {
  playerId: number;
  playerSlug: string;
  name: string;
  value: string;
  teamId: string;
  gamesPlayed: number;
  position: string;
}

interface PlayerFullStats {
  playerId: number;
  name: string;
  teamId: string;
  gamesPlayed: number;
  position: string;
  // Passing
  passingYards: string;
  passingTDs: string;
  interceptions: string;
  completionPct: string;
  passerRating: string;
  // Rushing
  rushingYards: string;
  rushingTDs: string;
  yardsPerCarry: string;
  rushingAttempts: string;
  // Receiving
  receivingYards: string;
  receptions: string;
  receivingTDs: string;
  yardsPerReception: string;
  // Defense
  tackles: string;
  sacks: string;
  defensiveInterceptions: string;
  forcedFumbles: string;
}

interface StatLeaders {
  passingYards: StatLeader[];
  passingTDs: StatLeader[];
  rushingYards: StatLeader[];
  rushingTDs: StatLeader[];
  receivingYards: StatLeader[];
  receivingTDs: StatLeader[];
  receptions: StatLeader[];
  tackles: StatLeader[];
  sacks: StatLeader[];
  interceptions: StatLeader[];
}

// Sportskeeda API interfaces
interface SportsKeedaPlayerStat {
  player_id: number;
  player_name: string;
  player_slug: string;
  team_id: number;
  team_slug: string;
  position: string;
  games_played: number;
  // Passing stats
  passing_yards?: number;
  passing_touchdowns?: number;
  passing_interceptions?: number;
  pass_completions?: number;
  pass_attempts?: number;
  passer_rating?: number;
  // Rushing stats
  rushing_yards?: number;
  rushing_touchdowns?: number;
  rushing_attempts?: number;
  // Receiving stats
  receiving_yards?: number;
  receptions?: number;
  receiving_touchdowns?: number;
  receiving_targets?: number;
  // Defensive stats
  total_tackles?: number;
  sacks?: number;
  interceptions?: number;
  forced_fumbles?: number;
}

// Team ID to team slug mapping
const teamIdMap: Record<number, string> = {
  355: 'arizona-cardinals',
  323: 'atlanta-falcons',
  366: 'baltimore-ravens',
  324: 'buffalo-bills',
  364: 'carolina-panthers',
  326: 'chicago-bears',
  327: 'cincinnati-bengals',
  329: 'cleveland-browns',
  331: 'dallas-cowboys',
  332: 'denver-broncos',
  334: 'detroit-lions',
  335: 'green-bay-packers',
  325: 'houston-texans',
  338: 'indianapolis-colts',
  365: 'jacksonville-jaguars',
  339: 'kansas-city-chiefs',
  341: 'las-vegas-raiders',
  357: 'los-angeles-chargers',
  343: 'los-angeles-rams',
  345: 'miami-dolphins',
  347: 'minnesota-vikings',
  348: 'new-england-patriots',
  350: 'new-orleans-saints',
  351: 'new-york-giants',
  352: 'new-york-jets',
  354: 'philadelphia-eagles',
  356: 'pittsburgh-steelers',
  359: 'san-francisco-49ers',
  361: 'seattle-seahawks',
  362: 'tampa-bay-buccaneers',
  336: 'tennessee-titans',
  363: 'washington-commanders',
};

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const season = searchParams.get('season') || '2025';
    const limit = parseInt(searchParams.get('limit') || '100');
    const includeAllStats = searchParams.get('includeAllStats') === 'true';

    console.log('Fetching stat leaders for season:', season);

    // Fetch stats and rosters from all 32 teams in parallel
    const allTeamSlugs = Object.values(teamIdMap);

    // Determine base URL for internal API calls
    const baseUrl = typeof window !== 'undefined'
      ? window.location.origin
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : 'http://localhost:3000';

    // Fetch both stats and rosters
    const teamDataPromises = allTeamSlugs.map(async (teamSlug) => {
      try {
        const [statsResponse, rosterResponse] = await Promise.all([
          fetch(
            `https://cf-gotham.sportskeeda.com/taxonomy/sport/nfl/team/${teamSlug}/stats?season=${season}&event=regular`,
            {
              headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; NFL-Team-Pages/1.0)',
              },
              next: { revalidate: 86400 } // Cache for 24 hours
            }
          ),
          fetch(
            `${baseUrl}/nfl-hq/nfl/teams/api/roster/${teamSlug}`,
            {
              next: { revalidate: 86400 } // Cache rosters for 24 hours
            }
          ).catch(() => null)
        ]);

        if (!statsResponse.ok) {
          console.warn(`Failed to fetch stats for ${teamSlug}:`, statsResponse.status);
          return null;
        }

        const statsData = await statsResponse.json();
        let rosterPlayers: any[] = [];

        if (rosterResponse && rosterResponse.ok) {
          const rosterData = await rosterResponse.json();
          // Combine all roster categories
          const roster = rosterData.roster || {};
          rosterPlayers = [
            ...(roster.activeRoster || []),
            ...(roster.injuredReserve || []),
            ...(roster.practiceSquad || [])
          ];
        }

        return {
          teamSlug,
          playerStats: statsData.data?.player_stats || {},
          roster: rosterPlayers
        };
      } catch (error) {
        console.warn(`Error fetching data for ${teamSlug}:`, error);
        return null;
      }
    });

    const allTeamStats = (await Promise.all(teamDataPromises)).filter(Boolean);

    // Build roster lookup map for positions
    const rosterPositions: Map<string, string> = new Map();

    for (const teamData of allTeamStats) {
      if (!teamData || !teamData.roster) continue;

      for (const rosterPlayer of teamData.roster) {
        if (rosterPlayer.name && rosterPlayer.position) {
          // Use team+name as key for unique identification
          const key = `${teamData.teamSlug}:${rosterPlayer.name.toLowerCase().trim()}`;
          rosterPositions.set(key, rosterPlayer.position);
        }
      }
    }

    console.log(`Built roster lookup with ${rosterPositions.size} players`);

    // Combine all player stats from all teams
    const allPlayers: SportsKeedaPlayerStat[] = [];

    for (const teamData of allTeamStats) {
      if (!teamData) continue;

      const { teamSlug, playerStats } = teamData;

      // Process passing stats
      if (playerStats.passing) {
        for (const player of playerStats.passing) {
          // Generate a unique player ID from the slug
          const playerId = player.slug ? player.slug.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0) : Math.random() * 1000000;

          allPlayers.push({
            player_id: playerId,
            player_name: player.name,
            player_slug: player.slug || '',
            team_id: 0,
            team_slug: teamSlug,
            position: 'QB',
            games_played: player.games_played || 0,
            passing_yards: player.yards || 0,
            passing_touchdowns: player.touchdowns || 0,
            passing_interceptions: player.interceptions || 0,
            pass_completions: player.completions || 0,
            pass_attempts: player.attempts || 0,
            passer_rating: parseFloat(player.qb_rating) || 0,
          });
        }
      }

      // Process rushing stats
      if (playerStats.rushing) {
        for (const player of playerStats.rushing) {
          const playerId = player.slug ? player.slug.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0) : Math.random() * 1000000;
          const existingPlayer = allPlayers.find(p => p.player_slug === player.slug);
          if (existingPlayer) {
            existingPlayer.rushing_yards = player.yards || 0;
            existingPlayer.rushing_touchdowns = player.touchdowns || 0;
            existingPlayer.rushing_attempts = player.attempts || 0;
          } else {
            allPlayers.push({
              player_id: playerId,
              player_name: player.name,
              player_slug: player.slug || '',
              team_id: 0,
              team_slug: teamSlug,
              position: 'N/A',
              games_played: player.games_played || 0,
              rushing_yards: player.yards || 0,
              rushing_touchdowns: player.touchdowns || 0,
              rushing_attempts: player.attempts || 0,
            });
          }
        }
      }

      // Process receiving stats
      if (playerStats.receiving) {
        for (const player of playerStats.receiving) {
          const playerId = player.slug ? player.slug.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0) : Math.random() * 1000000;
          const existingPlayer = allPlayers.find(p => p.player_slug === player.slug);
          if (existingPlayer) {
            existingPlayer.receiving_yards = player.yards || 0;
            existingPlayer.receptions = player.receptions || 0;
            existingPlayer.receiving_touchdowns = player.touchdowns || 0;
            existingPlayer.receiving_targets = player.targets || 0;
          } else {
            allPlayers.push({
              player_id: playerId,
              player_name: player.name,
              player_slug: player.slug || '',
              team_id: 0,
              team_slug: teamSlug,
              position: 'N/A',
              games_played: player.games_played || 0,
              receiving_yards: player.yards || 0,
              receptions: player.receptions || 0,
              receiving_touchdowns: player.touchdowns || 0,
              receiving_targets: player.targets || 0,
            });
          }
        }
      }

      // Process defensive stats
      if (playerStats.defense) {
        for (const player of playerStats.defense) {
          const playerId = player.slug ? player.slug.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0) : Math.random() * 1000000;
          const existingPlayer = allPlayers.find(p => p.player_slug === player.slug);
          if (existingPlayer) {
            existingPlayer.total_tackles = player.tackles?.total_tackles || 0;
            existingPlayer.sacks = player.sacks?.sacks || 0;
            existingPlayer.interceptions = player.interceptions?.interceptions || 0;
            existingPlayer.forced_fumbles = player.fumbles?.forced_fumbles || 0;
          } else {
            allPlayers.push({
              player_id: playerId,
              player_name: player.name,
              player_slug: player.slug || '',
              team_id: 0,
              team_slug: teamSlug,
              position: 'DEF',
              games_played: player.games_played || 0,
              total_tackles: player.tackles?.total_tackles || 0,
              sacks: player.sacks?.sacks || 0,
              interceptions: player.interceptions?.interceptions || 0,
              forced_fumbles: player.fumbles?.forced_fumbles || 0,
            });
          }
        }
      }
    }

    console.log(`Collected stats for ${allPlayers.length} players`);

    if (allPlayers.length === 0) {
      console.warn('No players found in API responses');
    }

    // Determine positions from roster data or fall back to stat-based inference
    for (const player of allPlayers) {
      // Try to get position from roster first
      const rosterKey = `${player.team_slug}:${player.player_name.toLowerCase().trim()}`;
      const rosterPosition = rosterPositions.get(rosterKey);

      if (rosterPosition) {
        player.position = rosterPosition;
      } else {
        // Fall back to stat-based inference
        const passingYards = player.passing_yards || 0;
        const rushingYards = player.rushing_yards || 0;
        const receivingYards = player.receiving_yards || 0;

        // QB if they have significant passing yards
        if (passingYards > 0) {
          player.position = 'QB';
        }
        // WR/TE if receiving yards are their primary stat
        else if (receivingYards > rushingYards && receivingYards > 0) {
          player.position = 'WR';
        }
        // RB if rushing yards are their primary stat
        else if (rushingYards > 0) {
          player.position = 'RB';
        }
        // DEF stays as is
        // If no offensive stats and position is not DEF, set to N/A
        else if (player.position !== 'DEF') {
          player.position = 'N/A';
        }
      }
    }

    // Transform and sort players by each category
    const allPlayerStats: PlayerFullStats[] = allPlayers.map(player => ({
      playerId: player.player_id,
      name: player.player_name,
      teamId: player.team_slug,
      gamesPlayed: player.games_played || 0,
      position: player.position || 'N/A',
      // Passing
      passingYards: String(player.passing_yards || 0),
      passingTDs: String(player.passing_touchdowns || 0),
      interceptions: String(player.passing_interceptions || 0),
      completionPct: player.pass_attempts ? String(((player.pass_completions || 0) / player.pass_attempts * 100).toFixed(1)) : '0',
      passerRating: String(player.passer_rating?.toFixed(1) || '0'),
      // Rushing
      rushingYards: String(player.rushing_yards || 0),
      rushingTDs: String(player.rushing_touchdowns || 0),
      yardsPerCarry: player.rushing_attempts ? ((player.rushing_yards || 0) / player.rushing_attempts).toFixed(1) : '0',
      rushingAttempts: String(player.rushing_attempts || 0),
      // Receiving
      receivingYards: String(player.receiving_yards || 0),
      receptions: String(player.receptions || 0),
      receivingTDs: String(player.receiving_touchdowns || 0),
      yardsPerReception: player.receptions ? ((player.receiving_yards || 0) / player.receptions).toFixed(1) : '0',
      // Defense
      tackles: String(player.total_tackles || 0),
      sacks: String(player.sacks || 0),
      defensiveInterceptions: String(player.interceptions || 0),
      forcedFumbles: String(player.forced_fumbles || 0),
    }));

    // Helper function to create stat leaders array
    const createStatLeaders = (
      statKey: keyof SportsKeedaPlayerStat,
      outputKey: keyof PlayerFullStats
    ): StatLeader[] => {
      return allPlayers
        .filter(p => (p[statKey] as number || 0) > 0)
        .sort((a, b) => ((b[statKey] as number) || 0) - ((a[statKey] as number) || 0))
        .slice(0, limit)
        .map(player => {
          // Use slug for lookup to avoid ID collisions
          const fullStats = allPlayerStats.find(p =>
            p.playerId === player.player_id &&
            p.name === player.player_name &&
            p.teamId === player.team_slug
          )!;
          return {
            playerId: player.player_id,
            playerSlug: player.player_slug,
            name: player.player_name,
            value: fullStats[outputKey] as string,
            teamId: player.team_slug,
            gamesPlayed: player.games_played || 0,
            position: player.position || 'N/A',
          };
        });
    };

    const statLeaders: StatLeaders = {
      passingYards: createStatLeaders('passing_yards', 'passingYards'),
      passingTDs: createStatLeaders('passing_touchdowns', 'passingTDs'),
      rushingYards: createStatLeaders('rushing_yards', 'rushingYards'),
      rushingTDs: createStatLeaders('rushing_touchdowns', 'rushingTDs'),
      receivingYards: createStatLeaders('receiving_yards', 'receivingYards'),
      receivingTDs: createStatLeaders('receiving_touchdowns', 'receivingTDs'),
      receptions: createStatLeaders('receptions', 'receptions'),
      tackles: createStatLeaders('total_tackles', 'tackles'),
      sacks: createStatLeaders('sacks', 'sacks'),
      interceptions: createStatLeaders('interceptions', 'defensiveInterceptions'),
    };

    return NextResponse.json({
      data: statLeaders,
      allPlayerStats: includeAllStats ? allPlayerStats : undefined,
      season: parseInt(season),
      lastUpdated: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Stat Leaders API error:', error);

    // Return empty stat leaders instead of error to prevent page from breaking
    const emptyStatLeaders: StatLeaders = {
      passingYards: [],
      passingTDs: [],
      rushingYards: [],
      rushingTDs: [],
      receivingYards: [],
      receivingTDs: [],
      receptions: [],
      tackles: [],
      sacks: [],
      interceptions: [],
    };

    return NextResponse.json({
      data: emptyStatLeaders,
      allPlayerStats: [],
      season: 2025,
      lastUpdated: new Date().toISOString(),
      error: 'Failed to fetch data from external API',
    });
  }
}
