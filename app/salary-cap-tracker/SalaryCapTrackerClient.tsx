'use client';

import { useState, useMemo, useEffect } from 'react';

import NFLTeamsSidebar from '@/components/NFLTeamsSidebar';
import { getAllTeams } from '@/data/teams';

interface SalaryCapData {
  teamId: string;
  teamName: string;
  capSpace: number;
  salaryCap: number;
  activeCapSpend: number;
  deadMoney: number;
}

type SortKey = 'teamName' | 'capSpace' | 'salaryCap' | 'activeCapSpend' | 'deadMoney';
type SortDirection = 'asc' | 'desc';

export default function SalaryCapTrackerClient() {
  const [sortKey, setSortKey] = useState<SortKey>('capSpace');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [salaryCapData, setSalaryCapData] = useState<SalaryCapData[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const allTeams = getAllTeams();

  // Fetch salary cap data for all teams
  useEffect(() => {
    async function fetchAllTeamsSalaryCap() {
      setLoading(true);
      const dataPromises = allTeams.map(async (team) => {
        try {
          const response = await fetch(`/nfl/teams/api/salary-cap/${team.id}`);
          if (!response.ok) {
            throw new Error(`Failed to fetch data for ${team.id}`);
          }
          const data = await response.json();

          return {
            teamId: team.id,
            teamName: team.fullName,
            capSpace: data.salaryCapData.teamSummary.capSpace,
            salaryCap: data.salaryCapData.teamSummary.salaryCap,
            activeCapSpend: data.salaryCapData.teamSummary.activeCapSpend,
            deadMoney: data.salaryCapData.teamSummary.deadMoney
          };
        } catch (error) {
          console.error(`Error fetching salary cap for ${team.id}:`, error);
          // Return default values if fetch fails
          return {
            teamId: team.id,
            teamName: team.fullName,
            capSpace: 0,
            salaryCap: 255400000, // 2025 NFL salary cap
            activeCapSpend: 0,
            deadMoney: 0
          };
        }
      });

      const results = await Promise.all(dataPromises);
      setSalaryCapData(results);
      setLastUpdated(new Date().toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZoneName: 'short'
      }));
      setLoading(false);
    }

    fetchAllTeamsSalaryCap();
  }, []);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount * 1000000); // Convert from millions to dollars
  };

  // Handle column sort
  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('desc');
    }
  };

  // Sort data
  const sortedData = useMemo(() => {
    const sorted = [...salaryCapData].sort((a, b) => {
      let aValue = a[sortKey];
      let bValue = b[sortKey];

      // For string sorting (teamName)
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      // For number sorting
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }

      return 0;
    });

    return sorted;
  }, [salaryCapData, sortKey, sortDirection]);

  // Get team info
  const getTeamInfo = (teamId: string) => {
    return allTeams.find(t => t.id === teamId);
  };

  // Sort indicator component
  const SortIndicator = ({ column }: { column: SortKey }) => {
    if (sortKey !== column) {
      return (
        <svg className="w-4 h-4 text-white opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }

    return sortDirection === 'asc' ? (
      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="hidden lg:block lg:w-64 flex-shrink-0">
        <NFLTeamsSidebar />
      </aside>

      {/* Mobile Sidebar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50">
        <NFLTeamsSidebar isMobile={true} />
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto lg:pt-0 pt-14">
        {/* Header Section */}
        <div className="bg-[#0050A0] text-white py-8 px-4 sm:px-6 lg:px-8 w-full">
          <div className="mx-auto max-w-7xl">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-2">
              NFL Salary Cap Tracker by Team
            </h1>
            <p className="text-base sm:text-lg lg:text-xl opacity-90">
              Track cap space, active spending, and dead money for all 32 teams
            </p>
          </div>
        </div>

        {/* Raptive Header Ad */}
        <div className="container mx-auto px-4 min-h-[150px]">
          <div className="raptive-pfn-header"></div>
        </div>

        {/* Content */}
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl">
          {/* Last Updated */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <p className="text-sm text-gray-600">
              <strong>Last Updated:</strong> {lastUpdated || 'Loading...'}
            </p>
          </div>

          {/* Table */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-12 h-12 border-4 border-gray-200 border-t-[#0050A0] rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#0050A0] text-white">
                    <tr>
                      <th
                        className="px-4 py-3 text-left text-sm font-bold cursor-pointer hover:bg-[#003d7a] transition-colors"
                        onClick={() => handleSort('teamName')}
                      >
                        <div className="flex items-center gap-2">
                          TEAM
                          <SortIndicator column="teamName" />
                        </div>
                      </th>
                      <th
                        className="px-4 py-3 text-left text-sm font-bold cursor-pointer hover:bg-[#003d7a] transition-colors"
                        onClick={() => handleSort('capSpace')}
                      >
                        <div className="flex items-center gap-2">
                          CAP SPACE
                          <SortIndicator column="capSpace" />
                        </div>
                      </th>
                      <th
                        className="px-4 py-3 text-left text-sm font-bold cursor-pointer hover:bg-[#003d7a] transition-colors"
                        onClick={() => handleSort('salaryCap')}
                      >
                        <div className="flex items-center gap-2">
                          2025 SALARY CAP
                          <SortIndicator column="salaryCap" />
                        </div>
                      </th>
                      <th
                        className="px-4 py-3 text-left text-sm font-bold cursor-pointer hover:bg-[#003d7a] transition-colors"
                        onClick={() => handleSort('activeCapSpend')}
                      >
                        <div className="flex items-center gap-2">
                          ACTIVE CAP SPEND
                          <SortIndicator column="activeCapSpend" />
                        </div>
                      </th>
                      <th
                        className="px-4 py-3 text-left text-sm font-bold cursor-pointer hover:bg-[#003d7a] transition-colors"
                        onClick={() => handleSort('deadMoney')}
                      >
                        <div className="flex items-center gap-2">
                          DEAD MONEY
                          <SortIndicator column="deadMoney" />
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedData.map((team, index) => {
                      const teamInfo = getTeamInfo(team.teamId);
                      return (
                        <tr
                          key={team.teamId}
                          className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                        >
                          <td className="px-4 py-4">
                            <a
                              href={`/teams/${team.teamId}/salary-cap`}
                              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                            >
                              {teamInfo && (
                                <img
                                  src={teamInfo.logoUrl}
                                  alt={team.teamName}
                                  className="w-8 h-8"
                                />
                              )}
                              <span className="font-medium text-[#0050A0]">
                                {team.teamName}
                              </span>
                            </a>
                          </td>
                          <td className={`px-4 py-4 font-semibold ${team.capSpace >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(team.capSpace)}
                          </td>
                          <td className="px-4 py-4 text-gray-700">
                            {formatCurrency(team.salaryCap)}
                          </td>
                          <td className="px-4 py-4 text-gray-700">
                            {formatCurrency(team.activeCapSpend)}
                          </td>
                          <td className="px-4 py-4 text-gray-700">
                            {formatCurrency(team.deadMoney)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Salary Cap Explanation Section */}
          <div className="mt-12 space-y-8">
            {/* What Is the NFL Salary Cap? */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                What Is the NFL Salary Cap?
              </h2>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed mb-4">
                  The NFL salary cap is a hard cap that limits the total amount teams can spend on player salaries in a given season. For the 2025 season, the salary cap is set at $255.4 million per team. Unlike the NBA's soft cap system, the NFL enforces a strict limit with few exceptions, ensuring competitive balance across all 32 teams.
                </p>
                <p className="text-gray-700 leading-relaxed mb-4">
                  The salary cap is calculated based on league revenues, including television contracts, ticket sales, merchandise, and sponsorships. Each year, the cap is adjusted to reflect the league's financial performance, with both the owners and players' union agreeing to split revenues based on the Collective Bargaining Agreement (CBA).
                </p>
                <p className="text-gray-700 leading-relaxed">
                  Teams must also maintain a salary floor, which requires them to spend a minimum percentage of the cap. This ensures that all teams are competitive and prevents owners from pocketing profits instead of investing in their rosters. The salary floor is calculated over a multi-year period to give teams flexibility in managing their cap space.
                </p>
              </div>
            </div>

            {/* How Does the NFL Salary Cap Work? */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                How Does the NFL Salary Cap Work?
              </h2>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed mb-4">
                  The NFL's hard salary cap system means teams cannot exceed the cap limit except in very specific circumstances. However, teams can use various strategies to manage their cap space, including restructuring contracts, converting base salaries into signing bonuses, and releasing or trading players.
                </p>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Dead money refers to salary cap charges from players who are no longer on the roster. This occurs when a team releases a player who had guaranteed money or unamortized signing bonus remaining on their contract. The remaining guaranteed money counts against the cap, creating "dead cap space" that reduces the team's ability to sign new players.
                </p>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Teams can create cap space through several methods: releasing high-salary players (accepting dead cap hits), restructuring contracts to push cap hits into future years, signing players to front-loaded or back-loaded contracts, and utilizing performance-based incentives that don't count against the cap until earned.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  The NFL also allows teams to carry over unused cap space from previous seasons, giving teams that manage their cap wisely additional flexibility. This rollover provision encourages teams to be fiscally responsible and rewards those who build their rosters efficiently.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
