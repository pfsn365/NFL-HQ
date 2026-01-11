// ESPN Scoreboard API types and utilities

// ============================================
// ESPN API Response Types
// ============================================

export interface ESPNTeam {
  id: string;
  name: string;
  abbreviation: string;
  displayName: string;
  shortDisplayName: string;
  logo: string;
  color?: string;
  alternateColor?: string;
  records?: Array<{ summary: string }>;
}

export interface ESPNAthlete {
  id: string;
  displayName: string;
  shortName: string;
  headshot?: { href: string };
  jersey?: string;
  position?: { abbreviation: string };
}

export interface ESPNLeader {
  displayValue: string;
  value: number;
  athlete: ESPNAthlete;
}

export interface ESPNLeaderCategory {
  name: string; // 'passingYards', 'rushingYards', 'receivingYards'
  displayName: string;
  leaders: ESPNLeader[];
}

export interface ESPNCompetitor {
  id: string;
  homeAway: 'home' | 'away';
  team: ESPNTeam;
  score?: string;
  winner?: boolean;
  curatedRank?: { current: number };
  leaders?: ESPNLeaderCategory[];
  records?: Array<{ summary: string }>;
}

export interface ESPNSituation {
  possession?: string; // Team ID that has possession
  downDistanceText?: string;
  shortDownDistanceText?: string;
  isRedZone?: boolean;
}

export interface ESPNVenue {
  id: string;
  fullName: string;
  address: {
    city: string;
    state: string;
  };
}

export interface ESPNBroadcast {
  names: string[];
}

export interface ESPNStatus {
  type: {
    id: string;
    name: string; // 'STATUS_SCHEDULED', 'STATUS_IN_PROGRESS', 'STATUS_FINAL'
    state: string; // 'pre', 'in', 'post'
    description: string;
    shortDetail: string; // "Final", "Q3 8:42", "1:00 PM ET"
  };
  displayClock?: string;
  period?: number;
}

export interface ESPNCompetition {
  id: string;
  date: string;
  venue: ESPNVenue;
  competitors: ESPNCompetitor[];
  status: ESPNStatus;
  broadcasts?: ESPNBroadcast[];
  situation?: ESPNSituation;
  notes?: Array<{ headline: string }>; // e.g., "AFC Wild Card"
  leaders?: ESPNLeaderCategory[]; // Game-level stat leaders
}

export interface ESPNEvent {
  id: string;
  uid: string;
  date: string;
  name: string;
  shortName: string;
  season: { year: number; type: number }; // type: 2 = regular, 3 = postseason
  week?: { number: number };
  competitions: ESPNCompetition[];
}

export interface ESPNScoreboardResponse {
  events: ESPNEvent[];
  season: { year: number; type: number };
  week?: { number: number };
}

// ============================================
// Team Mapping
// ============================================

// ESPN team abbreviation to our team slug mapping
export const espnToTeamSlug: Record<string, string> = {
  'ARI': 'arizona-cardinals',
  'ATL': 'atlanta-falcons',
  'BAL': 'baltimore-ravens',
  'BUF': 'buffalo-bills',
  'CAR': 'carolina-panthers',
  'CHI': 'chicago-bears',
  'CIN': 'cincinnati-bengals',
  'CLE': 'cleveland-browns',
  'DAL': 'dallas-cowboys',
  'DEN': 'denver-broncos',
  'DET': 'detroit-lions',
  'GB': 'green-bay-packers',
  'HOU': 'houston-texans',
  'IND': 'indianapolis-colts',
  'JAX': 'jacksonville-jaguars',
  'KC': 'kansas-city-chiefs',
  'LV': 'las-vegas-raiders',
  'LAC': 'los-angeles-chargers',
  'LAR': 'los-angeles-rams',
  'MIA': 'miami-dolphins',
  'MIN': 'minnesota-vikings',
  'NE': 'new-england-patriots',
  'NO': 'new-orleans-saints',
  'NYG': 'new-york-giants',
  'NYJ': 'new-york-jets',
  'PHI': 'philadelphia-eagles',
  'PIT': 'pittsburgh-steelers',
  'SF': 'san-francisco-49ers',
  'SEA': 'seattle-seahawks',
  'TB': 'tampa-bay-buccaneers',
  'TEN': 'tennessee-titans',
  'WSH': 'washington-commanders',
};

// Reverse mapping: team slug to ESPN abbreviation
export const teamSlugToEspn: Record<string, string> = Object.fromEntries(
  Object.entries(espnToTeamSlug).map(([abbr, slug]) => [slug, abbr])
);

// AFC teams for conference detection
export const AFC_TEAMS = [
  'buffalo-bills', 'miami-dolphins', 'new-england-patriots', 'new-york-jets',
  'baltimore-ravens', 'cincinnati-bengals', 'cleveland-browns', 'pittsburgh-steelers',
  'houston-texans', 'indianapolis-colts', 'jacksonville-jaguars', 'tennessee-titans',
  'denver-broncos', 'kansas-city-chiefs', 'las-vegas-raiders', 'los-angeles-chargers',
];

// ============================================
// Playoff Date Helpers
// ============================================

// 2025-26 playoff date ranges
export const PLAYOFF_DATES_2026 = {
  wildCard: { start: '2026-01-10', end: '2026-01-13' },
  divisional: { start: '2026-01-17', end: '2026-01-18' },
  conference: { start: '2026-01-25', end: '2026-01-25' },
  superBowl: { start: '2026-02-08', end: '2026-02-08' },
};

export function isPlayoffDate(dateStr: string): boolean {
  const date = dateStr.split('T')[0];
  return Object.values(PLAYOFF_DATES_2026).some(
    range => date >= range.start && date <= range.end
  );
}

export function getPlayoffRound(dateStr: string): string | null {
  const date = dateStr.split('T')[0];
  if (date >= PLAYOFF_DATES_2026.wildCard.start && date <= PLAYOFF_DATES_2026.wildCard.end) {
    return 'Wild Card';
  }
  if (date >= PLAYOFF_DATES_2026.divisional.start && date <= PLAYOFF_DATES_2026.divisional.end) {
    return 'Divisional';
  }
  if (date >= PLAYOFF_DATES_2026.conference.start && date <= PLAYOFF_DATES_2026.conference.end) {
    return 'Conference Championship';
  }
  if (date >= PLAYOFF_DATES_2026.superBowl.start && date <= PLAYOFF_DATES_2026.superBowl.end) {
    return 'Super Bowl';
  }
  return null;
}

// ============================================
// Transformed Game Interface (our standard format)
// ============================================

export interface TransformedGame {
  event_id: string;
  start_date: string;
  status: string;
  status_detail: string; // e.g., "Q3 8:42", "Final", "1:00 PM ET"
  has_score: boolean;
  is_live: boolean;
  away_team: {
    team_slug: string;
    abbr: string;
    team_name: string;
    logo: string;
    wins: number;
    losses: number;
    score?: number;
    is_winner?: boolean;
    seed?: number;
    has_possession?: boolean;
  };
  home_team: {
    team_slug: string;
    abbr: string;
    team_name: string;
    logo: string;
    wins: number;
    losses: number;
    score?: number;
    is_winner?: boolean;
    seed?: number;
    has_possession?: boolean;
  };
  venue?: {
    name: string;
    city: string;
    state?: { name: string; abbreviation: string };
  };
  tv_stations?: Array<{ name: string; call_letters: string }>;
  hi_pass?: { player_name: string; display_value: string; value: number };
  hi_rush?: { player_name: string; display_value: string; value: number };
  hi_rec?: { player_name: string; display_value: string; value: number };
  playoff_round?: string;
  situation?: {
    down_distance?: string;
    is_red_zone?: boolean;
  };
}

// ============================================
// Helper Functions
// ============================================

function parseRecord(recordStr: string): { wins: number; losses: number } {
  const match = recordStr?.match(/(\d+)-(\d+)/);
  return match ? { wins: parseInt(match[1]), losses: parseInt(match[2]) } : { wins: 0, losses: 0 };
}

function getTeamName(displayName: string): string {
  // Get just the team name (last word) - e.g., "Los Angeles Rams" -> "Rams"
  const parts = displayName.split(' ');
  return parts[parts.length - 1];
}

// ============================================
// Transform ESPN Game to Our Format
// ============================================

export function transformESPNGame(event: ESPNEvent): TransformedGame | null {
  const competition = event.competitions[0];
  if (!competition) return null;

  const awayCompetitor = competition.competitors.find(c => c.homeAway === 'away');
  const homeCompetitor = competition.competitors.find(c => c.homeAway === 'home');

  if (!awayCompetitor || !homeCompetitor) return null;

  // Parse records
  const awayRecord = parseRecord(
    awayCompetitor.records?.[0]?.summary ||
    awayCompetitor.team.records?.[0]?.summary ||
    '0-0'
  );
  const homeRecord = parseRecord(
    homeCompetitor.records?.[0]?.summary ||
    homeCompetitor.team.records?.[0]?.summary ||
    '0-0'
  );

  // Determine game state
  const isLive = competition.status.type.state === 'in';
  const isComplete = competition.status.type.state === 'post';
  const hasScore = isLive || isComplete;

  // Map status
  let status = 'Pre-Game';
  if (isLive) {
    status = 'In Progress';
  } else if (isComplete) {
    status = 'Final';
  }

  const awayScore = hasScore ? parseInt(awayCompetitor.score || '0') : undefined;
  const homeScore = hasScore ? parseInt(homeCompetitor.score || '0') : undefined;

  // Possession detection
  const possessionTeamId = competition.situation?.possession;
  const awayHasPossession = isLive && possessionTeamId === awayCompetitor.id;
  const homeHasPossession = isLive && possessionTeamId === homeCompetitor.id;

  // Extract game leaders - check competition.leaders first (game-level), then competitor.leaders (team-level)
  let hiPass: TransformedGame['hi_pass'];
  let hiRush: TransformedGame['hi_rush'];
  let hiRec: TransformedGame['hi_rec'];

  // Helper to extract leader from category
  const extractLeader = (category: ESPNLeaderCategory) => {
    const topLeader = category.leaders?.[0];
    if (!topLeader) return null;
    return {
      player_name: topLeader.athlete.displayName,
      display_value: topLeader.displayValue,
      value: topLeader.value
    };
  };

  // First check competition-level leaders (used for completed games)
  if (competition.leaders) {
    for (const category of competition.leaders) {
      if (category.name === 'passingYards' || category.name === 'passingLeader') {
        const leader = extractLeader(category);
        if (leader && (!hiPass || leader.value > hiPass.value)) hiPass = leader;
      }
      if (category.name === 'rushingYards' || category.name === 'rushingLeader') {
        const leader = extractLeader(category);
        if (leader && (!hiRush || leader.value > hiRush.value)) hiRush = leader;
      }
      if (category.name === 'receivingYards' || category.name === 'receivingLeader') {
        const leader = extractLeader(category);
        if (leader && (!hiRec || leader.value > hiRec.value)) hiRec = leader;
      }
    }
  }

  // Fall back to competitor-level leaders if no game-level leaders found
  if (!hiPass && !hiRush && !hiRec) {
    for (const competitor of competition.competitors) {
      if (competitor.leaders) {
        for (const category of competitor.leaders) {
          if (category.name === 'passingYards' || category.name === 'passingLeader') {
            const leader = extractLeader(category);
            if (leader && (!hiPass || leader.value > hiPass.value)) hiPass = leader;
          }
          if (category.name === 'rushingYards' || category.name === 'rushingLeader') {
            const leader = extractLeader(category);
            if (leader && (!hiRush || leader.value > hiRush.value)) hiRush = leader;
          }
          if (category.name === 'receivingYards' || category.name === 'receivingLeader') {
            const leader = extractLeader(category);
            if (leader && (!hiRec || leader.value > hiRec.value)) hiRec = leader;
          }
        }
      }
    }
  }

  // Determine playoff round from notes or date
  let playoffRound: string | null = null;
  if (event.season.type === 3) {
    // Check notes first
    const noteHeadline = competition.notes?.[0]?.headline;
    if (noteHeadline) {
      playoffRound = noteHeadline;
    } else {
      playoffRound = getPlayoffRound(event.date);
    }
  }

  return {
    event_id: event.id,
    start_date: event.date,
    status,
    status_detail: competition.status.type.shortDetail,
    has_score: hasScore,
    is_live: isLive,
    away_team: {
      team_slug: espnToTeamSlug[awayCompetitor.team.abbreviation] || awayCompetitor.team.abbreviation.toLowerCase(),
      abbr: awayCompetitor.team.abbreviation,
      team_name: awayCompetitor.team.displayName,
      logo: awayCompetitor.team.logo,
      wins: awayRecord.wins,
      losses: awayRecord.losses,
      score: awayScore,
      is_winner: isComplete && awayCompetitor.winner,
      seed: awayCompetitor.curatedRank?.current,
      has_possession: awayHasPossession,
    },
    home_team: {
      team_slug: espnToTeamSlug[homeCompetitor.team.abbreviation] || homeCompetitor.team.abbreviation.toLowerCase(),
      abbr: homeCompetitor.team.abbreviation,
      team_name: homeCompetitor.team.displayName,
      logo: homeCompetitor.team.logo,
      wins: homeRecord.wins,
      losses: homeRecord.losses,
      score: homeScore,
      is_winner: isComplete && homeCompetitor.winner,
      seed: homeCompetitor.curatedRank?.current,
      has_possession: homeHasPossession,
    },
    venue: competition.venue ? {
      name: competition.venue.fullName,
      city: competition.venue.address.city,
      state: {
        name: competition.venue.address.state,
        abbreviation: competition.venue.address.state
      },
    } : undefined,
    tv_stations: competition.broadcasts?.flatMap(b =>
      b.names.map(name => ({ name, call_letters: name }))
    ),
    hi_pass: hiPass,
    hi_rush: hiRush,
    hi_rec: hiRec,
    playoff_round: playoffRound || undefined,
    situation: competition.situation ? {
      down_distance: competition.situation.shortDownDistanceText || competition.situation.downDistanceText,
      is_red_zone: competition.situation.isRedZone,
    } : undefined,
  };
}

// ============================================
// API Fetch Functions
// ============================================

export async function fetchESPNScoreboard(options?: {
  dates?: string;  // YYYYMMDD format
  seasontype?: number;  // 2 = regular, 3 = postseason
  week?: number;
  revalidate?: number;  // Custom revalidation time in seconds
}): Promise<ESPNScoreboardResponse | null> {
  try {
    const url = new URL('https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard');

    if (options?.dates) {
      url.searchParams.set('dates', options.dates);
    }
    if (options?.seasontype) {
      url.searchParams.set('seasontype', String(options.seasontype));
    }
    if (options?.week) {
      url.searchParams.set('week', String(options.week));
    }

    // Use short cache (15s) during typical game windows, or custom value if provided
    // Game windows: Sat/Sun all day, Mon/Thu evenings
    const now = new Date();
    const day = now.getUTCDay(); // 0=Sun, 1=Mon, 4=Thu, 6=Sat
    const hour = now.getUTCHours();
    const isDuringGames = day === 0 || day === 6 || // Weekend
                          (day === 1 && hour >= 23) || (day === 2 && hour < 6) || // Monday night
                          (day === 4 && hour >= 23) || (day === 5 && hour < 6);   // Thursday night

    const cacheTime = options?.revalidate ?? (isDuringGames ? 15 : 60);

    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NFL-HQ/1.0)',
      },
      next: { revalidate: cacheTime },
    });

    if (!response.ok) {
      console.error(`ESPN API error: ${response.status}`);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('ESPN API fetch error:', error);
    return null;
  }
}

export async function fetchPlayoffGames(): Promise<TransformedGame[]> {
  // Fetch all playoff games (seasontype=3)
  const data = await fetchESPNScoreboard({ seasontype: 3 });

  if (!data?.events) return [];

  return data.events
    .map(transformESPNGame)
    .filter((game): game is TransformedGame => game !== null);
}

export async function fetchGamesByDate(dateStr: string): Promise<TransformedGame[]> {
  // Convert YYYY-MM-DD to YYYYMMDD
  const espnDate = dateStr.replace(/-/g, '');

  const data = await fetchESPNScoreboard({ dates: espnDate });

  if (!data?.events) return [];

  return data.events
    .map(transformESPNGame)
    .filter((game): game is TransformedGame => game !== null);
}

export async function fetchCurrentGames(): Promise<TransformedGame[]> {
  // Fetch today's games (no date param = current)
  const data = await fetchESPNScoreboard();

  if (!data?.events) return [];

  return data.events
    .map(transformESPNGame)
    .filter((game): game is TransformedGame => game !== null);
}

// ============================================
// Ticker-specific types
// ============================================

export interface TickerGame {
  id: string;
  awayTeam: {
    abbr: string;
    logo: string;
    score?: number;
    hasPossession?: boolean;
  };
  homeTeam: {
    abbr: string;
    logo: string;
    score?: number;
    hasPossession?: boolean;
  };
  statusDetail: string; // "Q3 8:42", "Final", "1:00 PM ET"
  isLive: boolean;
  isFinal: boolean;
}

export function transformToTickerGame(event: ESPNEvent): TickerGame | null {
  const competition = event.competitions[0];
  if (!competition) return null;

  const awayCompetitor = competition.competitors.find(c => c.homeAway === 'away');
  const homeCompetitor = competition.competitors.find(c => c.homeAway === 'home');

  if (!awayCompetitor || !homeCompetitor) return null;

  const isLive = competition.status.type.state === 'in';
  const isFinal = competition.status.type.state === 'post';
  const hasScore = isLive || isFinal;

  const possessionTeamId = competition.situation?.possession;

  return {
    id: event.id,
    awayTeam: {
      abbr: awayCompetitor.team.abbreviation,
      logo: awayCompetitor.team.logo,
      score: hasScore ? parseInt(awayCompetitor.score || '0') : undefined,
      hasPossession: isLive && possessionTeamId === awayCompetitor.id,
    },
    homeTeam: {
      abbr: homeCompetitor.team.abbreviation,
      logo: homeCompetitor.team.logo,
      score: hasScore ? parseInt(homeCompetitor.score || '0') : undefined,
      hasPossession: isLive && possessionTeamId === homeCompetitor.id,
    },
    statusDetail: competition.status.type.shortDetail,
    isLive,
    isFinal,
  };
}

export async function fetchTickerGames(): Promise<TickerGame[]> {
  const data = await fetchESPNScoreboard();

  if (!data?.events) return [];

  return data.events
    .map(transformToTickerGame)
    .filter((game): game is TickerGame => game !== null);
}
