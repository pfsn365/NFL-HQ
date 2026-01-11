'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import LayoutStabilizer from '@/components/LayoutStabilizer';
import { TeamData } from '@/data/teams';
import { getApiPath } from '@/utils/api';

// Helper function to generate PFSN URL
const getPFSNUrl = (playerName: string) => {
  return `https://www.profootballnetwork.com/players/${playerName.toLowerCase().replace(/[.\s]+/g, '-').replace(/[^\w-]/g, '').replace(/-+/g, '-')}/`;
};

// Helper function to generate team URL (using PFSN team pages)
const getTeamUrl = (teamName: string) => {
  const teamSlug = teamName.toLowerCase()
    .replace(/arizona cardinals/g, 'arizona-cardinals')
    .replace(/buffalo bills/g, 'buffalo-bills')
    .replace(/tennessee titans/g, 'tennessee-titans')
    .replace(/green bay packers/g, 'green-bay-packers')
    .replace(/dallas cowboys/g, 'dallas-cowboys')
    .replace(/new york jets/g, 'new-york-jets')
    .replace(/carolina panthers/g, 'carolina-panthers')
    .replace(/new york giants/g, 'new-york-giants')
    .replace(/cleveland browns/g, 'cleveland-browns')
    .replace(/houston texans/g, 'houston-texans')
    .replace(/new england patriots/g, 'new-england-patriots')
    .replace(/kansas city chiefs/g, 'kansas-city-chiefs')
    .replace(/\s+/g, '-');
  return `https://www.profootballnetwork.com/nfl-hq/teams/${teamSlug}/`;
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
  const [selectedMonth, setSelectedMonth] = useState<string>('All Year');
  const [transactionsData, setTransactionsData] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(getApiPath(`nfl/teams/api/transactions/${team.id}`));

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Transactions data not available for this team yet');
        }
        throw new Error(`Failed to fetch transactions: ${response.status}`);
      }

      const data: TransactionsResponse = await response.json();

      if (!data.transactions || !Array.isArray(data.transactions)) {
        throw new Error('Invalid transactions data received');
      }

      setTransactionsData(data.transactions);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError(err instanceof Error ? err.message : 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, [team.id]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Generate month filter options from actual data

  const months = useMemo(() => {
    const uniqueMonths = Array.from(new Set(transactionsData.map(t => {
      const monthKey = t.date.startsWith('09/') ? 'Sep 2025' :
                      t.date.startsWith('08/') ? 'Aug 2025' :
                      t.date.startsWith('07/') ? 'Jul 2025' :
                      t.date.startsWith('06/') ? 'Jun 2025' :
                      t.date.startsWith('05/') ? 'May 2025' :
                      t.date.startsWith('04/') ? 'Apr 2025' :
                      t.date.startsWith('03/') ? 'Mar 2025' :
                      t.date.startsWith('02/') ? 'Feb 2025' :
                      t.date.startsWith('01/') ? 'Jan 2025' :
                      t.date.startsWith('12/') ? 'Dec 2024' :
                      t.date.startsWith('11/') ? 'Nov 2024' :
                      t.date.startsWith('10/') ? 'Oct 2024' : 'Other';
      return monthKey;
    })));

    return ['All Year', ...uniqueMonths.filter(m => m !== 'Other').sort().reverse()];
  }, [transactionsData]);

  const filteredData = useMemo(() => {
    return transactionsData.filter(transaction => {
      const monthMatch = selectedMonth === 'All Year' ||
        (selectedMonth === 'Sep 2025' && transaction.date.startsWith('09/')) ||
        (selectedMonth === 'Aug 2025' && transaction.date.startsWith('08/')) ||
        (selectedMonth === 'Jul 2025' && transaction.date.startsWith('07/')) ||
        (selectedMonth === 'Jun 2025' && transaction.date.startsWith('06/')) ||
        (selectedMonth === 'May 2025' && transaction.date.startsWith('05/')) ||
        (selectedMonth === 'Apr 2025' && transaction.date.startsWith('04/')) ||
        (selectedMonth === 'Mar 2025' && transaction.date.startsWith('03/')) ||
        (selectedMonth === 'Feb 2025' && transaction.date.startsWith('02/')) ||
        (selectedMonth === 'Jan 2025' && transaction.date.startsWith('01/')) ||
        (selectedMonth === 'Dec 2024' && transaction.date.startsWith('12/')) ||
        (selectedMonth === 'Nov 2024' && transaction.date.startsWith('11/')) ||
        (selectedMonth === 'Oct 2024' && transaction.date.startsWith('10/'));

      return monthMatch;
    });
  }, [transactionsData, selectedMonth]);

  // Group transactions by month for display
  const groupedData = useMemo(() => {
    const groups: { [key: string]: Transaction[] } = {};
    filteredData.forEach(transaction => {
      const monthKey = transaction.date.startsWith('09/') ? 'Sep 2025' :
                      transaction.date.startsWith('08/') ? 'Aug 2025' :
                      transaction.date.startsWith('07/') ? 'Jul 2025' :
                      transaction.date.startsWith('06/') ? 'Jun 2025' :
                      transaction.date.startsWith('05/') ? 'May 2025' :
                      transaction.date.startsWith('04/') ? 'Apr 2025' :
                      transaction.date.startsWith('03/') ? 'Mar 2025' :
                      transaction.date.startsWith('02/') ? 'Feb 2025' :
                      transaction.date.startsWith('01/') ? 'Jan 2025' :
                      transaction.date.startsWith('12/') ? 'Dec 2024' :
                      transaction.date.startsWith('11/') ? 'Nov 2024' :
                      transaction.date.startsWith('10/') ? 'Oct 2024' : 'Other';

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

  if (loading) {
    return (
      <LayoutStabilizer className="bg-white rounded-lg shadow p-4 sm:p-6" minHeight={600}>
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-6 gap-4">
          <div className="flex-grow">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{team.fullName} Transactions</h2>
            <div className="h-1 rounded-full" style={{ backgroundColor: team.primaryColor, width: 'fit-content', minWidth: '290px' }}></div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 lg:min-w-48">
            <select disabled className="flex-1 p-2 border border-gray-300 rounded-lg bg-gray-100 text-sm">
              <option>Loading...</option>
            </select>
          </div>
        </div>
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
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-6 gap-4">
          <div className="flex-grow">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{team.fullName} Transactions</h2>
            <div className="h-1 rounded-full" style={{ backgroundColor: team.primaryColor, width: 'fit-content', minWidth: '290px' }}></div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 lg:min-w-48">
            <select disabled className="flex-1 p-2 border border-gray-300 rounded-lg bg-gray-100 text-sm">
              <option>Error</option>
            </select>
          </div>
        </div>
        <div className="text-center py-12">
          <div className="text-red-600 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Transactions</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchTransactions}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2"
            style={{ backgroundColor: team.primaryColor }}
          >
            Try Again
          </button>
        </div>
      </LayoutStabilizer>
    );
  }

  return (
    <LayoutStabilizer className="bg-white rounded-lg shadow p-4 sm:p-6" minHeight={600}>
      {/* Header with Filters */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-6 gap-4">
        <div className="flex-grow">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{team.fullName} Transactions</h2>
          <div className="h-1 rounded-full" style={{ backgroundColor: team.primaryColor, width: 'fit-content', minWidth: '290px' }}></div>
        </div>
        
        {/* Filters - moved to header */}
        <div className="flex flex-col sm:flex-row gap-3 lg:min-w-48">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="flex-1 p-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:border-gray-400"
          >
            {months.map(month => (
              <option key={month} value={month}>{month}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Transactions by Month */}
      <div className="space-y-8">
        {Object.entries(groupedData).map(([monthKey, transactions]) => (
          <div key={monthKey}>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 pt-2">{monthKey}</h3>
            
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm table-fixed">
                <colgroup>
                  <col className="w-20" />
                  <col className="w-48" />
                  <col className="w-16" />
                  <col className="w-56" />
                  <col className="w-auto" />
                </colgroup>
                <thead>
                  <tr className="text-white" style={{ backgroundColor: team.primaryColor }}>
                    <th className="text-left p-3 font-medium">DATE</th>
                    <th className="text-left p-3 font-medium">PLAYER</th>
                    <th className="text-left p-3 font-medium">POS</th>
                    <th className="text-left p-3 font-medium">TYPE</th>
                    <th className="text-left p-3 font-medium">DETAILS</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction, index) => (
                    <tr key={`${transaction.date}-${transaction.player}-${index}`} 
                        className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="p-3 text-gray-700">{transaction.date}</td>
                      <td className="p-3">
                        <a 
                          href={getPFSNUrl(transaction.player)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium hover:underline cursor-pointer"
                          style={{ color: team.primaryColor }}
                        >
                          {transaction.player}
                        </a>
                      </td>
                      <td className="p-3 text-gray-700">{transaction.position}</td>
                      <td className="p-3 text-gray-700">
                        <div className="font-medium">
                          {/* Make transaction type clear from Cardinals perspective */}
                          {transaction.fromTeam === team.fullName && transaction.toTeam ? 
                            // Player leaving Cardinals
                            transaction.transaction.includes('Practice squad addition') ? 'Practice Squad Departure' :
                            transaction.transaction.includes('signed') ? 'Released/Signed Elsewhere' :
                            transaction.transaction
                            :
                            // Player joining Cardinals or other transactions
                            transaction.toTeam === team.fullName ?
                              transaction.transaction.replace('Practice squad addition', 'Practice Squad Addition')
                              : transaction.transaction
                          }
                        </div>
                      </td>
                      <td className="p-3 text-gray-700">
                        <div>
                          {transaction.fromTeam && transaction.toTeam && (
                            <div className="text-sm">
                              <span className="text-gray-600">from:</span> 
                              <a 
                                href={getTeamUrl(transaction.fromTeam)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-medium hover:underline ml-1"
                                style={{ color: team.primaryColor }}
                              >
                                {transaction.fromTeam}
                              </a>
                              <span className="text-gray-600 ml-3">to:</span>
                              <a 
                                href={getTeamUrl(transaction.toTeam)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-medium hover:underline ml-1"
                                style={{ color: team.primaryColor }}
                              >
                                {transaction.toTeam}
                              </a>
                            </div>
                          )}
                          {transaction.fromTeam && !transaction.toTeam && (
                            <div className="text-sm">
                              <span className="text-gray-600">from:</span>
                              <a 
                                href={getTeamUrl(transaction.fromTeam)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-medium hover:underline ml-1"
                                style={{ color: team.primaryColor }}
                              >
                                {transaction.fromTeam}
                              </a>
                            </div>
                          )}
                          {!transaction.fromTeam && transaction.toTeam && transaction.toTeam !== team.fullName && (
                            <div className="text-sm">
                              <span className="text-gray-600">to:</span>
                              <a 
                                href={getTeamUrl(transaction.toTeam)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-medium hover:underline ml-1"
                                style={{ color: team.primaryColor }}
                              >
                                {transaction.toTeam}
                              </a>
                            </div>
                          )}
                          {transaction.details && (
                            <div className="text-sm text-gray-600 mt-1">
                              {transaction.details}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      {Object.keys(groupedData).length === 0 && (
        <div className="text-center py-8 text-gray-600">
          No transactions found for the selected criteria.
        </div>
      )}
    </LayoutStabilizer>
  );
}