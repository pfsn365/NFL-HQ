'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import NFLTeamsSidebar from '@/components/NFLTeamsSidebar';
import { getAllTeams } from '@/data/teams';
import { getApiPath } from '@/utils/api';
import SkeletonLoader from '@/components/SkeletonLoader';

interface Transaction {
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

interface GroupedTransactions {
  [date: string]: Transaction[];
}

export default function TransactionsClient() {
  const allTeams = getAllTeams();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [selectedPosition, setSelectedPosition] = useState('all');
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [lastUpdated, setLastUpdated] = useState('');

  // Fetch all transactions once
  useEffect(() => {
    async function fetchTransactions() {
      setLoading(true);
      try {
        const response = await fetch(getApiPath('api/nfl/transactions?limit=500'));
        if (!response.ok) throw new Error('Failed to fetch transactions');

        const data = await response.json();
        setAllTransactions(data.transactions || []);
        setAvailableMonths(data.availableMonths || []);
        setLastUpdated(new Date(data.lastUpdated).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        }));
      } catch (error) {
        console.error('Error fetching transactions:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchTransactions();
  }, []);

  // Get unique positions from all transactions
  const availablePositions = useMemo(() => {
    const positions = new Set(allTransactions.map(t => t.position).filter(Boolean));
    const positionsArray = Array.from(positions);

    // Custom position order
    const positionOrder = ['QB', 'RB', 'WR', 'TE', 'T', 'G', 'C', 'NT', 'DT', 'DE', 'LB', 'CB', 'S', 'K', 'P'];

    // Sort positions by custom order, then alphabetically for any not in the order list
    return positionsArray.sort((a, b) => {
      const aIndex = positionOrder.indexOf(a);
      const bIndex = positionOrder.indexOf(b);

      // If both are in the custom order, sort by their index
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex;
      }
      // If only a is in the custom order, it comes first
      if (aIndex !== -1) return -1;
      // If only b is in the custom order, it comes first
      if (bIndex !== -1) return 1;
      // If neither is in the custom order, sort alphabetically
      return a.localeCompare(b);
    });
  }, [allTransactions]);

  // Filter transactions client-side when team, month, or position changes
  useEffect(() => {
    let filtered = allTransactions;

    // Filter by team
    if (selectedTeam !== 'all') {
      filtered = filtered.filter(t =>
        t.teamId === selectedTeam ||
        t.fromTeam?.toLowerCase().includes(selectedTeam.toLowerCase()) ||
        t.toTeam?.toLowerCase().includes(selectedTeam.toLowerCase())
      );
    }

    // Filter by month
    if (selectedMonth !== 'all') {
      filtered = filtered.filter(t => t.month === selectedMonth);
    }

    // Filter by position
    if (selectedPosition !== 'all') {
      filtered = filtered.filter(t => t.position === selectedPosition);
    }

    setTransactions(filtered);
  }, [selectedTeam, selectedMonth, selectedPosition, allTransactions]);

  // Group transactions by date
  const groupedTransactions: GroupedTransactions = {};
  transactions.forEach(transaction => {
    const date = transaction.date;
    if (!groupedTransactions[date]) {
      groupedTransactions[date] = [];
    }
    groupedTransactions[date].push(transaction);
  });

  const dates = Object.keys(groupedTransactions);

  const getTeamInfo = (teamId: string) => {
    return allTeams.find(t => t.id === teamId);
  };

  // Get position badge color
  const getPositionColor = (position: string) => {
    const pos = position.toUpperCase();
    // Quarterbacks
    if (pos === 'QB') return 'bg-purple-100 text-purple-700 border-purple-200';
    // Running Backs
    if (pos === 'RB' || pos === 'FB') return 'bg-green-100 text-green-700 border-green-200';
    // Wide Receivers / Tight Ends
    if (pos === 'WR' || pos === 'TE') return 'bg-blue-100 text-blue-700 border-blue-200';
    // Offensive Line
    if (pos === 'OT' || pos === 'OG' || pos === 'C' || pos === 'OL' || pos === 'G' || pos === 'T') return 'bg-amber-100 text-amber-700 border-amber-200';
    // Defensive Line
    if (pos === 'DE' || pos === 'DT' || pos === 'NT' || pos === 'DL' || pos === 'EDGE') return 'bg-red-100 text-red-700 border-red-200';
    // Linebackers
    if (pos === 'LB' || pos === 'ILB' || pos === 'OLB' || pos === 'MLB') return 'bg-orange-100 text-orange-700 border-orange-200';
    // Defensive Backs
    if (pos === 'CB' || pos === 'S' || pos === 'FS' || pos === 'SS' || pos === 'DB') return 'bg-cyan-100 text-cyan-700 border-cyan-200';
    // Special Teams
    if (pos === 'K' || pos === 'P' || pos === 'LS') return 'bg-pink-100 text-pink-700 border-pink-200';
    // Default
    return 'bg-gray-100 text-gray-700 border-gray-200';
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <div className="fixed top-0 left-0 w-64 h-screen z-10">
          <NFLTeamsSidebar />
        </div>
      </div>

      {/* Mobile sidebar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-20">
        <NFLTeamsSidebar isMobile={true} />
      </div>

      {/* Main Content */}
      <main id="main-content" className="flex-1 lg:ml-64 min-w-0">
        {/* Header */}
        <div className="bg-[#0050A0] text-white pt-[57px] lg:pt-0 pb-4 lg:pb-6">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-4 lg:pt-10">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-3">
              NFL Transactions
            </h1>
            <p className="text-base sm:text-lg lg:text-xl xl:text-2xl opacity-90">
              Latest signings, releases, trades, and roster moves
            </p>
          </div>
        </div>

        {/* Raptive Header Ad */}
        <div className="container mx-auto px-4 h-[120px] flex items-center justify-center">
          <div className="raptive-pfn-header-90 w-full h-full"></div>
        </div>

        {/* Content */}
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl">
          {/* Filters and Last Updated */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mb-4">
              {/* Team Filter */}
              <div>
                <label htmlFor="team-filter" className="block text-sm font-semibold text-gray-700 mb-2">
                  Team:
                </label>
                <select
                  id="team-filter"
                  value={selectedTeam}
                  onChange={(e) => setSelectedTeam(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0050A0] bg-white text-sm"
                >
                  <option value="all">All Teams</option>
                  {allTeams.map(team => (
                    <option key={team.id} value={team.id}>
                      {team.fullName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Month Filter */}
              <div>
                <label htmlFor="month-filter" className="block text-sm font-semibold text-gray-700 mb-2">
                  Month:
                </label>
                <select
                  id="month-filter"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0050A0] bg-white text-sm"
                >
                  <option value="all">All Months</option>
                  {availableMonths.map(month => (
                    <option key={month} value={month}>
                      {month}
                    </option>
                  ))}
                </select>
              </div>

              {/* Position Filter */}
              <div>
                <label htmlFor="position-filter" className="block text-sm font-semibold text-gray-700 mb-2">
                  Position:
                </label>
                <select
                  id="position-filter"
                  value={selectedPosition}
                  onChange={(e) => setSelectedPosition(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0050A0] bg-white text-sm"
                >
                  <option value="all">All Positions</option>
                  {availablePositions.map(position => (
                    <option key={position} value={position}>
                      {position}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                <strong>Last Updated:</strong> {lastUpdated || 'Loading...'}
              </div>
            </div>
          </div>

          {/* Transactions Table */}
          {loading ? (
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <SkeletonLoader type="table" rows={20} />
            </div>
          ) : transactions.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <p className="text-gray-600">No transactions found for the selected filter.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {dates.map(date => (
                <div key={date} className="bg-white rounded-lg shadow-sm overflow-hidden">
                  {/* Date Header */}
                  <div className="bg-gray-100 border-b border-gray-200 px-4 sm:px-6 py-3">
                    <h2 className="text-lg font-bold text-gray-900">
                      {date}
                    </h2>
                  </div>

                  {/* Transactions Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[800px] table-fixed">
                      <thead className="bg-[#0050A0] text-white">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-sm sm:text-base font-bold w-44">TEAM</th>
                          <th scope="col" className="px-6 py-3 text-left text-sm sm:text-base font-bold w-64">PLAYER</th>
                          <th scope="col" className="px-6 py-3 text-left text-sm sm:text-base font-bold w-32">POS</th>
                          <th scope="col" className="px-6 py-3 text-left text-sm sm:text-base font-bold">TRANSACTION</th>
                        </tr>
                      </thead>
                      <tbody>
                        {groupedTransactions[date].map((transaction, index) => {
                          const team = getTeamInfo(transaction.teamId);
                          return (
                            <tr
                              key={transaction.id}
                              className={`border-b border-gray-200 ${
                                index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                              } hover:bg-blue-50 transition-colors`}
                            >
                              {/* Team */}
                              <td className="px-6 py-3">
                                {team ? (
                                  <Link
                                    href={`/teams/${team.id}`}
                                    className="flex items-center gap-2 hover:opacity-75 transition-opacity"
                                  >
                                    <img
                                      src={team.logoUrl}
                                      alt={team.abbreviation}
                                      className="w-6 h-6 sm:w-8 sm:h-8 object-contain"
                                    />
                                    <span className="font-semibold text-[#0050A0] text-sm sm:text-base">
                                      {transaction.teamAbbr}
                                    </span>
                                  </Link>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-[#0050A0] text-sm sm:text-base">
                                      {transaction.teamAbbr}
                                    </span>
                                  </div>
                                )}
                              </td>

                              {/* Player */}
                              <td className="px-6 py-3">
                                <Link
                                  href={`/players/${transaction.playerSlug}`}
                                  className="font-medium text-blue-600 hover:underline text-base"
                                >
                                  {transaction.player}
                                </Link>
                              </td>

                              {/* Position */}
                              <td className="px-6 py-3">
                                <span className={`inline-block px-2 py-1 rounded text-xs font-semibold border ${getPositionColor(transaction.position)}`}>
                                  {transaction.position}
                                </span>
                              </td>

                              {/* Transaction */}
                              <td className="px-6 py-3">
                                <div className="text-base text-gray-700">
                                  {transaction.transaction}
                                  {transaction.fromTeam && transaction.toTeam && (
                                    <span className="text-gray-600 ml-1">
                                      (from {transaction.fromTeam} to {transaction.toTeam})
                                    </span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
