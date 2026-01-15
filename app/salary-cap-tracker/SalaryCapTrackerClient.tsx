'use client';

import { useState, useMemo, useEffect } from 'react';

import NFLTeamsSidebar from '@/components/NFLTeamsSidebar';
import { getAllTeams } from '@/data/teams';
import { getApiPath } from '@/utils/api';
import SkeletonLoader from '@/components/SkeletonLoader';

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

  // Fetch salary cap data for all teams in a single bulk request
  useEffect(() => {
    async function fetchAllTeamsSalaryCap() {
      setLoading(true);

      try {
        const response = await fetch(getApiPath('api/nfl/salary-cap/all'));
        if (!response.ok) {
          throw new Error(`Failed to fetch salary cap data: ${response.status}`);
        }

        const data = await response.json();

        // Transform bulk response to match expected format
        const results: SalaryCapData[] = data.teams.map((team: {
          teamId: string;
          capSpace: number;
          salaryCap: number;
          activeCapSpend: number;
          deadMoney: number;
        }) => {
          const teamInfo = allTeams.find(t => t.id === team.teamId);
          return {
            teamId: team.teamId,
            teamName: teamInfo?.fullName || team.teamId,
            capSpace: team.capSpace,
            salaryCap: team.salaryCap,
            activeCapSpend: team.activeCapSpend,
            deadMoney: team.deadMoney
          };
        });

        setSalaryCapData(results);
        setLastUpdated(new Date().toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        }));
      } catch (error) {
        console.error('Error fetching salary cap data:', error);
        // Set empty data on error
        setSalaryCapData([]);
      }

      setLoading(false);
    }

    fetchAllTeamsSalaryCap();
  }, []);

  // Format currency
  const formatCurrency = (amount: number) => {
    if (isNaN(amount)) {
      return 'N/A';
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount); // Amount is already in full dollars
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

  // Calculate league averages
  const leagueAverages = useMemo(() => {
    if (salaryCapData.length === 0) {
      return {
        avgCapSpace: 0,
        avgSalaryCap: 0,
        avgActiveCapSpend: 0,
        avgDeadMoney: 0
      };
    }

    // Filter out teams with NaN values for proper averaging
    const validTeams = salaryCapData.filter(t => !isNaN(t.capSpace) && !isNaN(t.activeCapSpend) && !isNaN(t.deadMoney));

    const totalCapSpace = validTeams.reduce((sum, team) => sum + team.capSpace, 0);
    const totalSalaryCap = salaryCapData.reduce((sum, team) => sum + team.salaryCap, 0);
    const totalActiveCapSpend = validTeams.reduce((sum, team) => sum + team.activeCapSpend, 0);
    const totalDeadMoney = validTeams.reduce((sum, team) => sum + team.deadMoney, 0);

    return {
      avgCapSpace: totalCapSpace / validTeams.length,
      avgSalaryCap: totalSalaryCap / salaryCapData.length,
      avgActiveCapSpend: totalActiveCapSpend / validTeams.length,
      avgDeadMoney: totalDeadMoney / validTeams.length
    };
  }, [salaryCapData]);

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
              NFL Salary Cap Tracker by Team
            </h1>
            <p className="text-base sm:text-lg lg:text-xl xl:text-2xl opacity-90">
              Track cap space, active spending, and dead money for all 32 teams
            </p>
          </div>
        </div>

        {/* Raptive Header Ad */}
        <div className="container mx-auto px-4 h-[120px] flex items-center justify-center">
          <div className="raptive-pfn-header-90 w-full h-full"></div>
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
              <SkeletonLoader type="table" rows={32} />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px]">
                  <thead className="bg-[#0050A0] text-white">
                    <tr>
                      <th
                        className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-bold cursor-pointer hover:bg-[#003d7a] transition-colors"
                        onClick={() => handleSort('teamName')}
                      >
                        <div className="flex items-center gap-1 sm:gap-2">
                          TEAM
                          <SortIndicator column="teamName" />
                        </div>
                      </th>
                      <th
                        className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-bold cursor-pointer hover:bg-[#003d7a] transition-colors"
                        onClick={() => handleSort('capSpace')}
                      >
                        <div className="flex items-center gap-1 sm:gap-2">
                          CAP SPACE
                          <SortIndicator column="capSpace" />
                        </div>
                      </th>
                      <th
                        className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-bold cursor-pointer hover:bg-[#003d7a] transition-colors"
                        onClick={() => handleSort('salaryCap')}
                      >
                        <div className="flex items-center gap-1 sm:gap-2">
                          <span className="hidden sm:inline">2025 </span>SALARY CAP
                          <SortIndicator column="salaryCap" />
                        </div>
                      </th>
                      <th
                        className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-bold cursor-pointer hover:bg-[#003d7a] transition-colors"
                        onClick={() => handleSort('activeCapSpend')}
                      >
                        <div className="flex items-center gap-1 sm:gap-2">
                          ACTIVE<span className="hidden sm:inline"> CAP</span> SPEND
                          <SortIndicator column="activeCapSpend" />
                        </div>
                      </th>
                      <th
                        className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-bold cursor-pointer hover:bg-[#003d7a] transition-colors"
                        onClick={() => handleSort('deadMoney')}
                      >
                        <div className="flex items-center gap-1 sm:gap-2">
                          DEAD MONEY
                          <SortIndicator column="deadMoney" />
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* League Averages Row */}
                    <tr className="bg-gradient-to-r from-blue-50 to-indigo-50 border-t-2 border-b-2 border-[#0050A0]">
                      <td className="px-2 sm:px-4 py-3 sm:py-4">
                        <span className="font-bold text-sm sm:text-base text-[#0050A0]">
                          League Average
                        </span>
                      </td>
                      <td className="px-2 sm:px-4 py-3 sm:py-4 text-sm sm:text-base font-bold text-gray-900">
                        {formatCurrency(leagueAverages.avgCapSpace)}
                      </td>
                      <td className="px-2 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-700">
                        {formatCurrency(leagueAverages.avgSalaryCap)}
                      </td>
                      <td className="px-2 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-700">
                        {formatCurrency(leagueAverages.avgActiveCapSpend)}
                      </td>
                      <td className="px-2 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-700">
                        {formatCurrency(leagueAverages.avgDeadMoney)}
                      </td>
                    </tr>
                    {sortedData.map((team, index) => {
                      const teamInfo = getTeamInfo(team.teamId);
                      return (
                        <tr
                          key={team.teamId}
                          className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                        >
                          <td className="px-2 sm:px-4 py-3 sm:py-4">
                            <a
                              href={`/teams/${team.teamId}/salary-cap`}
                              className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity"
                            >
                              {teamInfo && (
                                <img
                                  src={teamInfo.logoUrl}
                                  alt={team.teamName}
                                  className="w-6 h-6 sm:w-8 sm:h-8"
                                />
                              )}
                              <span className="font-medium text-sm sm:text-base text-[#0050A0]">
                                {team.teamName}
                              </span>
                            </a>
                          </td>
                          <td className={`px-2 sm:px-4 py-3 sm:py-4 text-sm sm:text-base font-semibold ${isNaN(team.capSpace) ? 'text-gray-600' : team.capSpace >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(team.capSpace)}
                          </td>
                          <td className="px-2 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm text-gray-700">
                            {formatCurrency(team.salaryCap)}
                          </td>
                          <td className="px-2 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm text-gray-700">
                            {formatCurrency(team.activeCapSpend)}
                          </td>
                          <td className="px-2 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm text-gray-700">
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
