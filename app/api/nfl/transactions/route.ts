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

export interface Transaction {
  id: number;
  date: string;
  dateTimestamp: string;
  month: string;
  player: string;
  playerSlug: string;
  position: string;
  transaction: string;
  teamId: string;
  teamName: string;
  teamAbbr: string;
  fromTeam?: string;
  toTeam?: string;
}

// Helper function to transform transaction type for clarity
function transformTransactionType(type: string): string {
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
  if (normalizedType.includes('reinstated')) {
    return 'Reinstated';
  }
  if (normalizedType.includes('taken off ir')) {
    return 'Taken Off IR';
  }
  if (normalizedType.includes('reserve/non-football-injury')) {
    return 'Reserve/NFI';
  }
  if (normalizedType.includes('placed on')) {
    return type;
  }

  return type.split(' ').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ');
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const teamFilter = searchParams.get('team');
    const limit = parseInt(searchParams.get('limit') || '100');

    // Step 1: First call to get available months
    const initialResponse = await fetch(
      'https://cf-gotham.sportskeeda.com/taxonomy/sport/nfl/transactions/2025',
      {
        headers: {
          'User-Agent': 'PFN-Internal-NON-Blocking',
        },
        next: { revalidate: 10800 } // Cache for 3 hours
      }
    );

    if (!initialResponse.ok) {
      throw new Error(`Sportskeeda API error: ${initialResponse.status}`);
    }

    const initialData: SportsKeedaResponse = await initialResponse.json();

    // Step 2: Get all available months and fetch full data
    let responseData: SportsKeedaResponse = initialData;

    if (initialData.months && Array.isArray(initialData.months) && initialData.months.length > 0) {
      // Build months parameter string (format: MMYYYY,MMYYYY,...)
      const monthCodes = initialData.months
        .map((m: string | { month_of_transaction?: string }) => {
          // Handle both string format and object format
          const monthStr = typeof m === 'string' ? m : m.month_of_transaction;
          return monthStr;
        })
        .filter(Boolean)
        .join(',');

      if (monthCodes) {
        // Fetch with all months
        const fullResponse = await fetch(
          `https://cf-gotham.sportskeeda.com/taxonomy/sport/nfl/transactions/2025?months=${monthCodes}`,
          {
            headers: {
              'User-Agent': 'PFN-Internal-NON-Blocking',
            },
            next: { revalidate: 10800 }
          }
        );

        if (fullResponse.ok) {
          responseData = await fullResponse.json();
        }
      }
    }

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

    // Transform and optionally filter transactions
    let transactions: Transaction[] = allTransactions.map(transaction => {
      const position = transaction.positions.length > 0 ? transaction.positions[0].abbr : 'N/A';

      return {
        id: transaction.transaction_id,
        date: new Date(transaction.date_of_transaction).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        }),
        dateTimestamp: transaction.date_of_transaction,
        month: transaction.month_of_transaction_full,
        player: transaction.player.name,
        playerSlug: transaction.player.slug || '',
        position,
        transaction: transformTransactionType(transaction.transaction_type),
        teamId: transaction.team.slug,
        teamName: transaction.team.name,
        teamAbbr: transaction.team.abbr,
        fromTeam: transaction.old_team?.name,
        toTeam: transaction.new_team?.name,
      };
    });

    // Filter by team if specified
    if (teamFilter && teamFilter !== 'all') {
      transactions = transactions.filter(t =>
        t.teamId === teamFilter ||
        t.fromTeam?.toLowerCase().includes(teamFilter.toLowerCase()) ||
        t.toTeam?.toLowerCase().includes(teamFilter.toLowerCase())
      );
    }

    // Sort by date (most recent first)
    transactions.sort((a, b) => {
      return new Date(b.dateTimestamp).getTime() - new Date(a.dateTimestamp).getTime();
    });

    // Limit results
    transactions = transactions.slice(0, limit);

    // Extract just the month strings from the months array
    const availableMonths = Array.isArray(responseData.months)
      ? responseData.months.map((m: any) => m.month_of_transaction_full || m)
      : [];

    return NextResponse.json({
      transactions,
      totalTransactions: transactions.length,
      availableMonths,
      lastUpdated: new Date().toISOString(),
      season: 2025
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=10800, stale-while-revalidate=1800',
      },
    });

  } catch (error) {
    console.error('Transactions API error:', error);
    return NextResponse.json(
      {
        transactions: [],
        totalTransactions: 0,
        availableMonths: [],
        lastUpdated: new Date().toISOString(),
        season: 2025,
        error: 'Failed to fetch transactions data'
      },
      { status: 200 }
    );
  }
}
