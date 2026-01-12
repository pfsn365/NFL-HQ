'use client';

import { useState, useMemo } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import LayoutStabilizer from '@/components/LayoutStabilizer';
import { SWRErrorFallback } from '@/components/ErrorBoundary';
import { TeamData } from '@/data/teams';
import { getApiPath } from '@/utils/api';
import { getContrastTextColor } from '@/utils/colorHelpers';
import { fetcher, defaultSWROptions } from '@/lib/fetcher';

// Helper function to generate player slug for internal links
const generatePlayerSlug = (playerName: string) => {
  return playerName.toLowerCase().replace(/[.\s]+/g, '-').replace(/[^\w-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '');
};

interface Transaction {
  date: string;
  player: string;
  position: string;
  transaction: string;
  year: string;
  details?: string;
  fromTeam?: string;
  toTeam?: string;
}

interface TransactionsResponse {
  teamId: string;
  transactions: Transaction[];
  totalTransactions: number;
  lastUpdated: string;
  season: number;
}

interface TransactionsTabProps {
  team: TeamData;
}

export default function TransactionsTab({ team }: TransactionsTabProps) {
  const [selectedMonth, setSelectedMonth] = useState<string>('All Season');

  // SWR fetch - replaces useState/useCallback/useEffect boilerplate
  const { data, error, isLoading, mutate } = useSWR<TransactionsResponse>(
    getApiPath(`nfl/teams/api/transactions/${team.id}`),
    fetcher,
    defaultSWROptions
  );

  const transactionsData = data?.transactions || [];

  // Helper to get month key from date string (MM/DD format)
  // For NFL 2025 season: Sep-Dec are 2025, Jan-Feb are 2026
  const getMonthKey = (dateStr: string): string => {
    const month = dateStr.substring(0, 2);
    switch (month) {
      case '01': return 'Jan 2026';
      case '02': return 'Feb 2026';
      case '03': return 'Mar 2026';
      case '04': return 'Apr 2025';
      case '05': return 'May 2025';
      case '06': return 'Jun 2025';
      case '07': return 'Jul 2025';
      case '08': return 'Aug 2025';
      case '09': return 'Sep 2025';
      case '10': return 'Oct 2025';
      case '11': return 'Nov 2025';
      case '12': return 'Dec 2025';
      default: return 'Other';
    }
  };

  // Month sort order for NFL season (newest first: Jan 2026 -> Sep 2025)
  const monthSortOrder: Record<string, number> = {
    'Feb 2026': 1,
    'Jan 2026': 2,
    'Dec 2025': 3,
    'Nov 2025': 4,
    'Oct 2025': 5,
    'Sep 2025': 6,
    'Aug 2025': 7,
    'Jul 2025': 8,
    'Jun 2025': 9,
    'May 2025': 10,
    'Apr 2025': 11,
    'Mar 2026': 12,
  };

  // Generate month filter options from actual data
  const months = useMemo(() => {
    const uniqueMonths = Array.from(new Set(transactionsData.map(t => getMonthKey(t.date))));

    // Sort months with newest first
    const sortedMonths = uniqueMonths
      .filter(m => m !== 'Other')
      .sort((a, b) => (monthSortOrder[a] || 99) - (monthSortOrder[b] || 99));

    return ['All Season', ...sortedMonths];
  }, [transactionsData]);

  const filteredData = useMemo(() => {
    return transactionsData.filter(transaction => {
      if (selectedMonth === 'All Season') return true;
      return getMonthKey(transaction.date) === selectedMonth;
    });
  }, [transactionsData, selectedMonth]);

  // Group transactions by month for display
  const groupedData = useMemo(() => {
    const groups: { [key: string]: Transaction[] } = {};
    filteredData.forEach(transaction => {
      const monthKey = getMonthKey(transaction.date);

      if (!groups[monthKey]) {
        groups[monthKey] = [];
      }
      groups[monthKey].push(transaction);
    });

    // Sort transactions within each month by date (newest first)
    Object.keys(groups).forEach(monthKey => {
      groups[monthKey].sort((a, b) => {
        const dateA = parseInt(a.date.split('/')[1]);
        const dateB = parseInt(b.date.split('/')[1]);
        return dateB - dateA;
      });
    });

    return groups;
  }, [filteredData]);

  // Get sorted month keys for rendering (newest first)
  const sortedMonthKeys = useMemo(() => {
    return Object.keys(groupedData)
      .filter(m => m !== 'Other')
      .sort((a, b) => (monthSortOrder[a] || 99) - (monthSortOrder[b] || 99));
  }, [groupedData]);

  // Tab header component - reused across loading/error/data states
  const TabHeader = ({ showFilter = false }: { showFilter?: boolean }) => (
    <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-6 gap-4">
      <div className="flex-grow">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{team.fullName} Transactions</h2>
        <div className="h-1 rounded-full" style={{ backgroundColor: team.primaryColor, width: 'fit-content', minWidth: '290px' }}></div>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 lg:min-w-48">
        {showFilter ? (
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="flex-1 p-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:border-gray-400"
          >
            {months.map(month => (
              <option key={month} value={month}>{month}</option>
            ))}
          </select>
        ) : (
          <select disabled className="flex-1 p-2 border border-gray-300 rounded-lg bg-gray-100 text-sm">
            <option>Loading...</option>
          </select>
        )}
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <LayoutStabilizer className="bg-white rounded-lg shadow p-4 sm:p-6" minHeight={600}>
        <TabHeader />
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading transactions...</p>
        </div>
      </LayoutStabilizer>
    );
  }

  if (error) {
    return (
      <LayoutStabilizer className="bg-white rounded-lg shadow p-4 sm:p-6" minHeight={600}>
        <TabHeader />
        <SWRErrorFallback
          error={error}
          onRetry={() => mutate()}
          teamColor={team.primaryColor}
          title="Error Loading Transactions"
        />
      </LayoutStabilizer>
    );
  }

  return (
    <LayoutStabilizer className="bg-white rounded-lg shadow p-4 sm:p-6" minHeight={600}>
      <TabHeader showFilter />

      {/* Transactions by Month */}
      <div className="space-y-8">
        {sortedMonthKeys.map((monthKey) => (
          <div key={monthKey}>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 pt-2">{monthKey}</h3>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: team.primaryColor, color: getContrastTextColor(team.primaryColor) }}>
                    <th className="text-left p-3 font-medium w-24">DATE</th>
                    <th className="text-left p-3 font-medium">PLAYER</th>
                    <th className="text-left p-3 font-medium w-20 text-center">POS</th>
                    <th className="text-left p-3 font-medium">TRANSACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {groupedData[monthKey].map((transaction, index) => (
                    <tr key={`${transaction.date}-${transaction.player}-${index}`}
                        className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="p-3 text-gray-700">{transaction.date}</td>
                      <td className="p-3">
                        <Link
                          href={`/players/${generatePlayerSlug(transaction.player)}`}
                          className="font-medium hover:underline cursor-pointer"
                          style={{ color: team.primaryColor }}
                        >
                          {transaction.player}
                        </Link>
                      </td>
                      <td className="p-3 text-gray-700 text-center">{transaction.position}</td>
                      <td className="p-3 text-gray-700">
                        {transaction.fromTeam === team.fullName && transaction.toTeam ?
                          transaction.transaction.includes('Practice squad addition') ? 'Practice Squad Departure' :
                          transaction.transaction.includes('signed') ? 'Released/Signed Elsewhere' :
                          transaction.transaction
                          :
                          transaction.toTeam === team.fullName ?
                            transaction.transaction.replace('Practice squad addition', 'Practice Squad Addition')
                            : transaction.transaction
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      {sortedMonthKeys.length === 0 && (
        <div className="text-center py-8 text-gray-600">
          No transactions found for the selected criteria.
        </div>
      )}
    </LayoutStabilizer>
  );
}
