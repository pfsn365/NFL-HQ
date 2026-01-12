import { promises as fs } from 'fs';
import path from 'path';

export interface ScheduleGame {
  week: number | string;
  date: string;
  opponent: string;
  opponentLogo: string;
  isHome: boolean;
  time: string;
  tv: string;
  venue: string;
  result?: 'W' | 'L' | 'T' | null;
  score?: { home: number; away: number };
  overallRecord?: string;
}

interface CSVGame {
  lastUpdated: string;
  eventType: string;
  week: string;
  eventTitle: string;
  gameDate: string;
  gameTime: string;
  endTime: string;
  awayTeam: string;
  awayAbbr: string;
  awayRecord: string;
  homeTeam: string;
  homeAbbr: string;
  homeRecord: string;
  status: string;
  period: string;
  awayScore: string;
  homeScore: string;
  winner: string;
  venueName: string;
  city: string;
  state: string;
  tvStations: string;
  gameId: string;
}


function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    day: '2-digit',
    month: 'short'
  }).replace(',', ',');
}

function formatTime(timeStr: string): string {
  if (!timeStr) return 'TBD';

  // Handle "8:20 PM" format
  const [time, period] = timeStr.split(' ');
  if (!period) return timeStr;

  const [hours, minutes] = time.split(':');
  let hour = parseInt(hours);

  if (period.toUpperCase() === 'PM' && hour !== 12) {
    hour += 12;
  } else if (period.toUpperCase() === 'AM' && hour === 12) {
    hour = 0;
  }

  const date = new Date();
  date.setHours(hour, parseInt(minutes) || 0);

  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

function getOpponentLogo(abbr: string): string {
  const teamSlugMap: Record<string, string> = {
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
    'JAC': 'jacksonville-jaguars', // Alternative abbreviation
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
    'WAS': 'washington-commanders' // Alternative abbreviation
  };

  const normalizedAbbr = abbr.toUpperCase();
  const teamSlug = teamSlugMap[normalizedAbbr];

  if (!teamSlug) {
    // Fallback to generic NFL logo if team not found
    return 'https://www.profootballnetwork.com/apps/nfl-logos/nfl.png';
  }

  return `https://www.profootballnetwork.com/apps/nfl-logos/${teamSlug}.png`;
}

export async function parseScheduleCSV(): Promise<CSVGame[]> {
  try {
    const csvPath = path.join(process.cwd(), 'public', 'nfl-schedule.csv');
    const csvContent = await fs.readFile(csvPath, 'utf-8');
    const lines = csvContent.split('\n').filter(line => line.trim());

    // Skip header and summary rows
    const dataLines = lines.slice(2).filter(line => !line.startsWith('✓') && line.includes(','));

    const games: CSVGame[] = dataLines.map(line => {
      const fields = parseCSVLine(line);

      return {
        lastUpdated: fields[0] || '',
        eventType: fields[1] || '',
        week: fields[2] || '',
        eventTitle: fields[3] || '',
        gameDate: fields[4] || '',
        gameTime: fields[5] || '',
        endTime: fields[6] || '',
        awayTeam: fields[7] || '',
        awayAbbr: fields[8] || '',
        awayRecord: fields[9] || '',
        homeTeam: fields[10] || '',
        homeAbbr: fields[11] || '',
        homeRecord: fields[12] || '',
        status: fields[13] || '',
        period: fields[14] || '',
        awayScore: fields[15] || '',
        homeScore: fields[16] || '',
        winner: fields[17] || '',
        venueName: fields[18] || '',
        city: fields[19] || '',
        state: fields[20] || '',
        tvStations: fields[21] || '',
        gameId: fields[22] || ''
      };
    });

    return games;
  } catch (error) {
    console.error('Error parsing schedule CSV:', error);
    return [];
  }
}

export async function getTeamSchedule(
  teamAbbr: string,
  seasonType: 'Preseason' | 'Regular Season' | 'Postseason' = 'Regular Season'
): Promise<ScheduleGame[]> {
  const allGames = await parseScheduleCSV();

  // Filter games for the specific team and season type
  const teamGames = allGames.filter(game =>
    game.eventType === seasonType &&
    (game.homeAbbr.toLowerCase() === teamAbbr.toLowerCase() ||
     game.awayAbbr.toLowerCase() === teamAbbr.toLowerCase())
  );

  return teamGames.map(game => {
    const isHome = game.homeAbbr.toLowerCase() === teamAbbr.toLowerCase();
    const opponent = isHome ? game.awayTeam : game.homeTeam;
    const opponentAbbr = isHome ? game.awayAbbr : game.homeAbbr;

    // Determine result
    let result: 'W' | 'L' | 'T' | null = null;
    let score: { home: number; away: number } | undefined;

    if (game.status === 'Final' && game.homeScore && game.awayScore) {
      const homeScore = parseInt(game.homeScore);
      const awayScore = parseInt(game.awayScore);
      score = { home: homeScore, away: awayScore };

      if (homeScore === awayScore) {
        result = 'T';
      } else if (isHome) {
        result = homeScore > awayScore ? 'W' : 'L';
      } else {
        result = awayScore > homeScore ? 'W' : 'L';
      }
    }

    // Handle BYE weeks
    if (opponent.toLowerCase().includes('bye') || game.week === '' || !opponent) {
      return {
        week: parseInt(game.week) || 8, // Default bye week
        date: '',
        opponent: 'BYE WEEK',
        opponentLogo: '',
        isHome: true,
        time: '',
        tv: '',
        venue: '',
        result: null,
        score: undefined
      };
    }

    // Format venue to match Cardinals style (venue, city)
    let venue = game.venueName || 'TBD';
    if (game.city && game.state) {
      venue = `${venue}, ${game.city}`;
    }

    return {
      week: isNaN(parseInt(game.week)) ? game.week : parseInt(game.week),
      date: formatDate(game.gameDate),
      opponent,
      opponentLogo: getOpponentLogo(opponentAbbr),
      isHome,
      time: formatTime(game.gameTime),
      tv: game.tvStations || 'TBD',
      venue,
      result,
      score
    };
  });
}