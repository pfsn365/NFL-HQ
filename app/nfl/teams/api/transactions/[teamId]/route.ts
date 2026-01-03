import { NextRequest, NextResponse } from 'next/server';

interface SportsKeedaPlayer {
  id: number;
  name: string;
  slug?: string;
}

interface SportsKeedaTeam {
  id: number;
  name: string;
  abbr: string;
  slug: string;
  img?: string;
}

interface SportsKeedaPosition {
  name: string;
  abbr: string;
}

interface SportsKeedaTransaction {
  season: number;
  transaction_id: number;
  transaction_type: string;
  date_of_transaction: string;
  month_of_transaction: string;
  month_of_transaction_full: string;
  player: SportsKeedaPlayer;
  team: SportsKeedaTeam;
  positions: SportsKeedaPosition[];
  old_team?: SportsKeedaTeam;
  new_team?: SportsKeedaTeam;
}

interface SportsKeedaMonthData {
  month: string;
  transactions: SportsKeedaTransaction[];
}

interface SportsKeedaResponse {
  data: SportsKeedaMonthData[];
  months: string[];
  from: string;
  to: string;
}

interface TransformedTransaction {
  date: string;
  player: string;
  position: string;
  transaction: string;
  year: string;
  details?: string;
  fromTeam?: string;
  toTeam?: string;
}

// Team ID to team name mapping for filtering
const teamIdMap: Record<string, string> = {
  'arizona-cardinals': 'Arizona Cardinals',
  'atlanta-falcons': 'Atlanta Falcons',
  'baltimore-ravens': 'Baltimore Ravens',
  'buffalo-bills': 'Buffalo Bills',
  'carolina-panthers': 'Carolina Panthers',
  'chicago-bears': 'Chicago Bears',
  'cincinnati-bengals': 'Cincinnati Bengals',
  'cleveland-browns': 'Cleveland Browns',
  'dallas-cowboys': 'Dallas Cowboys',
  'denver-broncos': 'Denver Broncos',
  'detroit-lions': 'Detroit Lions',
  'green-bay-packers': 'Green Bay Packers',
  'houston-texans': 'Houston Texans',
  'indianapolis-colts': 'Indianapolis Colts',
  'jacksonville-jaguars': 'Jacksonville Jaguars',
  'kansas-city-chiefs': 'Kansas City Chiefs',
  'las-vegas-raiders': 'Las Vegas Raiders',
  'los-angeles-chargers': 'Los Angeles Chargers',
  'los-angeles-rams': 'Los Angeles Rams',
  'miami-dolphins': 'Miami Dolphins',
  'minnesota-vikings': 'Minnesota Vikings',
  'new-england-patriots': 'New England Patriots',
  'new-orleans-saints': 'New Orleans Saints',
  'new-york-giants': 'New York Giants',
  'new-york-jets': 'New York Jets',
  'philadelphia-eagles': 'Philadelphia Eagles',
  'pittsburgh-steelers': 'Pittsburgh Steelers',
  'san-francisco-49ers': 'San Francisco 49ers',
  'seattle-seahawks': 'Seattle Seahawks',
  'tampa-bay-buccaneers': 'Tampa Bay Buccaneers',
  'tennessee-titans': 'Tennessee Titans',
  'washington-commanders': 'Washington Commanders',
};

// Helper function to format date from timestamp
function formatDate(timestamp: string): string {
  const date = new Date(timestamp);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${month}/${day}`;
}

// Helper function to transform transaction type for clarity
function transformTransactionType(type: string): string {
  // Normalize transaction types for consistency
  const normalizedType = type.toLowerCase();

  if (normalizedType.includes('activated from practice squad')) {
    return 'Activated from Practice Squad';
  }
  if (normalizedType.includes('signed to practice squad')) {
    return 'Signed to Practice Squad';
  }
  if (normalizedType.includes('practice squad')) {
    return 'Practice Squad Addition';
  }
  if (normalizedType.includes('signed')) {
    return 'Signed';
  }
  if (normalizedType.includes('cut') || normalizedType.includes('released')) {
    return 'Released';
  }
  if (normalizedType.includes('traded')) {
    return 'Traded';
  }
  if (normalizedType.includes('waived')) {
    return 'Waived';
  }
  if (normalizedType.includes('activated')) {
    return 'Activated';
  }
  if (normalizedType.includes('taken off ir')) {
    return 'Taken Off IR';
  }
  if (normalizedType.includes('reserve/non-football-injury')) {
    return 'Reserve/NFI';
  }
  if (normalizedType.includes('placed on')) {
    return type; // Keep original for injury reserve, etc.
  }

  // Capitalize first letter of each word for display
  return type.split(' ').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ');
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const { teamId } = await params;

    // Get team name for filtering
    const teamName = teamIdMap[teamId];

    if (!teamName) {
      return NextResponse.json(
        { error: 'Team not found or not yet mapped' },
        { status: 404 }
      );
    }

    // Fetch data from Sportskeeda API
    const response = await fetch(
      'https://cf-gotham.sportskeeda.com/taxonomy/sport/nfl/transactions/2025',
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

    const responseData: SportsKeedaResponse = await response.json();

    if (!responseData || !responseData.data || !Array.isArray(responseData.data)) {
      return NextResponse.json(
        { error: 'No transactions data found' },
        { status: 404 }
      );
    }

    // Flatten all transactions from all months
    const allTransactions: SportsKeedaTransaction[] = [];
    responseData.data.forEach(monthData => {
      if (monthData.transactions && Array.isArray(monthData.transactions)) {
        allTransactions.push(...monthData.transactions);
      }
    });

    // Filter transactions for the specific team
    const teamTransactions = allTransactions.filter(transaction =>
      transaction.team.name === teamName ||
      transaction.old_team?.name === teamName ||
      transaction.new_team?.name === teamName
    );

    // Transform the data to our format
    const transformedTransactions: TransformedTransaction[] = teamTransactions.map(transaction => {
      const position = transaction.positions.length > 0 ? transaction.positions[0].abbr : 'N/A';
      const date = formatDate(transaction.date_of_transaction);

      // Determine from/to teams based on transaction context
      let fromTeam: string | undefined;
      let toTeam: string | undefined;

      if (transaction.old_team && transaction.new_team) {
        fromTeam = transaction.old_team.name;
        toTeam = transaction.new_team.name;
      } else if (transaction.old_team) {
        fromTeam = transaction.old_team.name;
      } else if (transaction.new_team) {
        toTeam = transaction.new_team.name;
      }

      return {
        date,
        player: transaction.player.name,
        position,
        transaction: transformTransactionType(
          transaction.transaction_type
        ),
        year: transaction.season.toString(),
        fromTeam,
        toTeam
      };
    });

    // Sort by date (most recent first)
    transformedTransactions.sort((a, b) => {
      const [aMonth, aDay] = a.date.split('/').map(Number);
      const [bMonth, bDay] = b.date.split('/').map(Number);

      if (aMonth !== bMonth) {
        return bMonth - aMonth;
      }
      return bDay - aDay;
    });

    return NextResponse.json({
      teamId,
      transactions: transformedTransactions,
      totalTransactions: transformedTransactions.length,
      lastUpdated: new Date().toISOString(),
      season: 2025
    });

  } catch (error) {
    console.error('Transactions API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions data' },
      { status: 500 }
    );
  }
}