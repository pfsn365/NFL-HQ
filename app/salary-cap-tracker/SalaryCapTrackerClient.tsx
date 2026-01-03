'use client';

import { useState, useMemo } from 'react';

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

// Sample NBA salary cap data for 2025-26 season
// NBA salary cap for 2025-26 is set at $154.647 million
const sampleSalaryCapData: SalaryCapData[] = [
  { teamId: 'detroit-pistons', teamName: 'Detroit Pistons', capSpace: 25420000, salaryCap: 154647000, activeCapSpend: 129227000, deadMoney: 0 },
  { teamId: 'san-antonio-spurs', teamName: 'San Antonio Spurs', capSpace: 22150000, salaryCap: 154647000, activeCapSpend: 132497000, deadMoney: 0 },
  { teamId: 'utah-jazz', teamName: 'Utah Jazz', capSpace: 20800000, salaryCap: 154647000, activeCapSpend: 133847000, deadMoney: 0 },
  { teamId: 'portland-trail-blazers', teamName: 'Portland Trail Blazers', capSpace: 18650000, salaryCap: 154647000, activeCapSpend: 135997000, deadMoney: 0 },
  { teamId: 'oklahoma-city-thunder', teamName: 'Oklahoma City Thunder', capSpace: 15200000, salaryCap: 154647000, activeCapSpend: 139447000, deadMoney: 0 },
  { teamId: 'indiana-pacers', teamName: 'Indiana Pacers', capSpace: 12400000, salaryCap: 154647000, activeCapSpend: 142247000, deadMoney: 0 },
  { teamId: 'charlotte-hornets', teamName: 'Charlotte Hornets', capSpace: 11800000, salaryCap: 154647000, activeCapSpend: 142847000, deadMoney: 0 },
  { teamId: 'orlando-magic', teamName: 'Orlando Magic', capSpace: 9500000, salaryCap: 154647000, activeCapSpend: 145147000, deadMoney: 0 },
  { teamId: 'brooklyn-nets', teamName: 'Brooklyn Nets', capSpace: 8200000, salaryCap: 154647000, activeCapSpend: 146447000, deadMoney: 0 },
  { teamId: 'houston-rockets', teamName: 'Houston Rockets', capSpace: 7100000, salaryCap: 154647000, activeCapSpend: 147547000, deadMoney: 0 },
  { teamId: 'toronto-raptors', teamName: 'Toronto Raptors', capSpace: 5800000, salaryCap: 154647000, activeCapSpend: 148847000, deadMoney: 0 },
  { teamId: 'washington-wizards', teamName: 'Washington Wizards', capSpace: 4500000, salaryCap: 154647000, activeCapSpend: 150147000, deadMoney: 0 },
  { teamId: 'atlanta-hawks', teamName: 'Atlanta Hawks', capSpace: 2900000, salaryCap: 154647000, activeCapSpend: 151747000, deadMoney: 0 },
  { teamId: 'memphis-grizzlies', teamName: 'Memphis Grizzlies', capSpace: 1200000, salaryCap: 154647000, activeCapSpend: 153447000, deadMoney: 0 },
  { teamId: 'chicago-bulls', teamName: 'Chicago Bulls', capSpace: -2400000, salaryCap: 154647000, activeCapSpend: 157047000, deadMoney: 0 },
  { teamId: 'cleveland-cavaliers', teamName: 'Cleveland Cavaliers', capSpace: -4100000, salaryCap: 154647000, activeCapSpend: 158747000, deadMoney: 0 },
  { teamId: 'new-york-knicks', teamName: 'New York Knicks', capSpace: -5800000, salaryCap: 154647000, activeCapSpend: 160447000, deadMoney: 0 },
  { teamId: 'sacramento-kings', teamName: 'Sacramento Kings', capSpace: -7200000, salaryCap: 154647000, activeCapSpend: 161847000, deadMoney: 0 },
  { teamId: 'minnesota-timberwolves', teamName: 'Minnesota Timberwolves', capSpace: -9500000, salaryCap: 154647000, activeCapSpend: 164147000, deadMoney: 0 },
  { teamId: 'new-orleans-pelicans', teamName: 'New Orleans Pelicans', capSpace: -11800000, salaryCap: 154647000, activeCapSpend: 166447000, deadMoney: 0 },
  { teamId: 'dallas-mavericks', teamName: 'Dallas Mavericks', capSpace: -13200000, salaryCap: 154647000, activeCapSpend: 167847000, deadMoney: 0 },
  { teamId: 'miami-heat', teamName: 'Miami Heat', capSpace: -15600000, salaryCap: 154647000, activeCapSpend: 170247000, deadMoney: 0 },
  { teamId: 'denver-nuggets', teamName: 'Denver Nuggets', capSpace: -17900000, salaryCap: 154647000, activeCapSpend: 172547000, deadMoney: 0 },
  { teamId: 'philadelphia-76ers', teamName: 'Philadelphia 76ers', capSpace: -20100000, salaryCap: 154647000, activeCapSpend: 174747000, deadMoney: 0 },
  { teamId: 'milwaukee-bucks', teamName: 'Milwaukee Bucks', capSpace: -22400000, salaryCap: 154647000, activeCapSpend: 177047000, deadMoney: 0 },
  { teamId: 'los-angeles-clippers', teamName: 'Los Angeles Clippers', capSpace: -24700000, salaryCap: 154647000, activeCapSpend: 179347000, deadMoney: 0 },
  { teamId: 'boston-celtics', teamName: 'Boston Celtics', capSpace: -27800000, salaryCap: 154647000, activeCapSpend: 182447000, deadMoney: 0 },
  { teamId: 'phoenix-suns', teamName: 'Phoenix Suns', capSpace: -30200000, salaryCap: 154647000, activeCapSpend: 184847000, deadMoney: 0 },
  { teamId: 'los-angeles-lakers', teamName: 'Los Angeles Lakers', capSpace: -32500000, salaryCap: 154647000, activeCapSpend: 187147000, deadMoney: 0 },
  { teamId: 'golden-state-warriors', teamName: 'Golden State Warriors', capSpace: -35800000, salaryCap: 154647000, activeCapSpend: 190447000, deadMoney: 0 },
];

type SortKey = 'teamName' | 'capSpace' | 'salaryCap' | 'activeCapSpend' | 'deadMoney';
type SortDirection = 'asc' | 'desc';

export default function SalaryCapTrackerClient() {
  const [sortKey, setSortKey] = useState<SortKey>('capSpace');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const allTeams = getAllTeams();

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
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
    const sorted = [...sampleSalaryCapData].sort((a, b) => {
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
  }, [sortKey, sortDirection]);

  // Get team info
  const getTeamInfo = (teamId: string) => {
    return allTeams.find(t => t.id === teamId);
  };

  // Get last updated timestamp
  const lastUpdated = new Date().toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZoneName: 'short'
  });

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
              NBA Salary Cap Tracker by Team
            </h1>
            <p className="text-base sm:text-lg lg:text-xl opacity-90">
              Track cap space, active spending, and dead money for all 30 teams
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
              <strong>Last Updated:</strong> {lastUpdated}
            </p>
          </div>

          {/* Table */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
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
                        2025-26 SALARY CAP
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
          </div>

          {/* Salary Cap Explanation Section */}
          <div className="mt-12 space-y-8">
            {/* What Is the NBA Salary Cap? */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                What Is the NBA Salary Cap?
              </h2>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed mb-4">
                  The NBA salary cap is the limit on the total amount of money that NBA teams can spend on their players' salaries for a given season. For the 2025-26 season, the salary cap has been set at $154.647 million, which represents a 10% increase from the previous season. This cap is based on Basketball Related Income (BRI), which includes revenue from ticket sales, broadcasting rights, merchandise, and other basketball-related sources.
                </p>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Unlike the NFL and NHL, the NBA features what is known as a "soft cap," meaning teams can exceed the salary cap threshold using various exceptions. However, teams that significantly exceed the cap face luxury tax penalties. The luxury tax threshold for 2025-26 is set at $187.895 million, and teams that surpass this amount must pay additional taxes on the overage.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  The NBA also enforces a salary floor, which is the minimum amount teams must spend on player salaries. For 2025-26, the salary floor is $139.182 million. Teams that fail to meet this minimum by the start of the regular season must pay the shortfall to the NBA and forfeit their full share of luxury tax distribution.
                </p>
              </div>
            </div>

            {/* How Does the NBA Salary Cap Work? */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                How Does the NBA Salary Cap Work?
              </h2>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed mb-4">
                  The NBA's soft salary cap system allows teams to exceed the cap limit through various exceptions designed to help teams retain their own players and remain competitive. The most significant exception is the Larry Bird Exception (named after Boston Celtics legend Larry Bird), which allows teams to re-sign their own free agents for any amount, even if it puts them over the cap. This encourages team continuity and loyalty by allowing franchises to keep their star players.
                </p>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Other key exceptions include the Mid-Level Exception (MLE), which allows teams to sign players even when over the cap. For 2025-26, the Non-Taxpayer Mid-Level is $14.104 million, the Taxpayer Mid-Level is $5.685 million, and teams with cap room can use a $8.781 million Mid-Level. Additionally, teams can use the Bi-Annual Exception and various trade exceptions to acquire talent.
                </p>
                <p className="text-gray-700 leading-relaxed mb-4">
                  The NBA has also implemented the Apron System to create additional spending tiers. The First Apron is set at $195.945 million and the Second Apron at $207.824 million for 2025-26. Teams whose total salary exceeds these thresholds face increasingly severe restrictions. Teams over the First Apron lose access to certain exceptions and trade flexibility. Teams over the Second Apron face even harsher penalties, including the loss of most signing exceptions and the inability to make trades that increase their payroll.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  Teams that exceed the luxury tax threshold must pay dollar-for-dollar penalties on the overage, with the tax rate increasing for repeat offenders. These luxury tax payments are then distributed among teams that stayed under the tax line, creating a financial incentive for fiscal responsibility while still allowing wealthy franchises to spend on championship-caliber rosters.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
