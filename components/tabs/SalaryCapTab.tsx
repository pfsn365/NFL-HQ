import { useState, useEffect, useCallback } from 'react';
import LayoutStabilizer from '@/components/LayoutStabilizer';
import { TeamData } from '@/data/teams';

// Helper function to generate Pro Football Network URL
const getPFNUrl = (playerName: string) => {
  return `https://www.profootballnetwork.com/players/${playerName.toLowerCase().replace(/[.\s]+/g, '-').replace(/[^\w-]/g, '').replace(/-+/g, '-')}/`;
};

interface CapPlayer {
  name: string;
  slug: string;
  capHit: number;
  baseSalary: number;
  signingBonus: number;
  guaranteed: number;
  restructureCapSaving: number;
  extensionCapSaving: number;
  cutDeadMoney: number;
  cutSaving: number;
  tradeDeadMoney: number;
  tradeSaving: number;
}

interface TeamSummary {
  capSpace: number;
  salaryCap: number;
  activeCapSpend: number;
  deadMoney: number;
}

interface SalaryCapResponse {
  teamId: string;
  salaryCapData: {
    teamSummary: TeamSummary;
    players: CapPlayer[];
  };
  totalPlayers: number;
  lastUpdated: string;
  season: number;
}

type SortField = 'name' | 'capHit' | 'baseSalary' | 'guaranteed' | 'restructureCapSaving' | 'extensionCapSaving' | 'cutDeadMoney' | 'cutSaving';
type SortDirection = 'asc' | 'desc';

interface SalaryCapTabProps {
  team: TeamData;
}

export default function SalaryCapTab({ team }: SalaryCapTabProps) {
  const [sortField, setSortField] = useState<SortField>('capHit');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [salaryCapData, setSalaryCapData] = useState<{teamSummary: TeamSummary, players: CapPlayer[]} | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPotentialSavings, setShowPotentialSavings] = useState(false);

  const fetchSalaryCap = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/nfl/teams/api/salary-cap/${team.id}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Salary cap data not available for this team yet');
        }
        throw new Error(`Failed to fetch salary cap: ${response.status}`);
      }

      const data: SalaryCapResponse = await response.json();

      if (!data.salaryCapData) {
        throw new Error('Invalid salary cap data received');
      }

      setSalaryCapData(data.salaryCapData);
    } catch (err) {
      console.error('Error fetching salary cap:', err);
      setError(err instanceof Error ? err.message : 'Failed to load salary cap');
    } finally {
      setLoading(false);
    }
  }, [team.id]);

  useEffect(() => {
    fetchSalaryCap();
  }, [fetchSalaryCap]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection(field === 'name' ? 'asc' : 'desc');
    }
  };

  const sortedData = salaryCapData ? [...salaryCapData.players].sort((a, b) => {
    let aValue = a[sortField];
    let bValue = b[sortField];

    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = (bValue as string).toLowerCase();
    }

    if (sortDirection === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  }) : [];

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return (
        <svg className="w-3 h-3 inline ml-1" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 10l4-4 4 4H8zm0 4l4 4 4-4H8z" opacity="0.5"/>
        </svg>
      );
    }
    if (sortDirection === 'asc') {
      return (
        <svg className="w-3 h-3 inline ml-1" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 14l4-4 4 4H8z"/>
        </svg>
      );
    }
    return (
      <svg className="w-3 h-3 inline ml-1" fill="currentColor" viewBox="0 0 24 24">
        <path d="M8 10l4 4 4-4H8z"/>
      </svg>
    );
  };

  if (loading) {
    return (
      <LayoutStabilizer className="bg-white rounded-lg shadow p-4 sm:p-6" minHeight={600}>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{team.fullName} Salary Cap</h2>
            <div className="h-1 rounded-full" style={{ backgroundColor: team.primaryColor, width: 'fit-content', minWidth: '270px' }}></div>
          </div>
        </div>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading salary cap data...</p>
        </div>
      </LayoutStabilizer>
    );
  }

  if (error) {
    return (
      <LayoutStabilizer className="bg-white rounded-lg shadow p-4 sm:p-6" minHeight={600}>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{team.fullName} Salary Cap</h2>
            <div className="h-1 rounded-full" style={{ backgroundColor: team.primaryColor, width: 'fit-content', minWidth: '270px' }}></div>
          </div>
        </div>
        <div className="text-center py-12">
          <div className="text-red-600 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Salary Cap</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchSalaryCap}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2"
            style={{ backgroundColor: team.primaryColor }}
          >
            Try Again
          </button>
        </div>
      </LayoutStabilizer>
    );
  }

  if (!salaryCapData) {
    return (
      <LayoutStabilizer className="bg-white rounded-lg shadow p-4 sm:p-6" minHeight={600}>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{team.fullName} Salary Cap</h2>
            <div className="h-1 rounded-full" style={{ backgroundColor: team.primaryColor, width: 'fit-content', minWidth: '270px' }}></div>
          </div>
        </div>
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Salary Cap Data Available</h3>
          <p className="text-gray-600">No salary cap data found for this team.</p>
        </div>
      </LayoutStabilizer>
    );
  }

  return (
    <LayoutStabilizer className="bg-white rounded-lg shadow p-4 sm:p-6" minHeight={600}>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{team.fullName} Salary Cap</h2>
          <div className="h-1 rounded-full" style={{ backgroundColor: team.primaryColor, width: 'fit-content', minWidth: '270px' }}></div>
        </div>
      </div>

      <div className="space-y-8">
        {/* Cap Summary Cards */}
        <div className="mb-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg p-4 shadow-sm border-l-4" style={{ borderLeftColor: team.primaryColor }}>
              <div className="text-center">
                <h4 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">Salary Cap</h4>
                <div className="text-2xl font-bold text-gray-900 mb-1">${salaryCapData.teamSummary.salaryCap.toFixed(1)}M</div>
                <div className="text-sm text-gray-500">2025 Season</div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 shadow-sm border-l-4" style={{ borderLeftColor: team.primaryColor }}>
              <div className="text-center">
                <h4 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">Available Cap Space</h4>
                <div className={`text-2xl font-bold mb-1 ${salaryCapData.teamSummary.capSpace > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${salaryCapData.teamSummary.capSpace.toFixed(1)}M
                </div>
                <div className="text-sm text-gray-500">
                  {salaryCapData.teamSummary.capSpace > 0 ? 'Over Cap' : 'Under Cap'}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 shadow-sm border-l-4" style={{ borderLeftColor: team.primaryColor }}>
              <div className="text-center">
                <h4 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">Active Cap Spend</h4>
                <div className="text-2xl font-bold text-gray-900 mb-1">${salaryCapData.teamSummary.activeCapSpend.toFixed(1)}M</div>
                <div className="text-sm text-gray-500">
                  {((salaryCapData.teamSummary.activeCapSpend / salaryCapData.teamSummary.salaryCap) * 100).toFixed(1)}% of cap
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 shadow-sm border-l-4" style={{ borderLeftColor: team.primaryColor }}>
              <div className="text-center">
                <h4 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">Dead Money</h4>
                <div className="text-2xl font-bold text-gray-900 mb-1">${salaryCapData.teamSummary.deadMoney.toFixed(1)}M</div>
                <div className="text-sm text-gray-500">
                  {((salaryCapData.teamSummary.deadMoney / salaryCapData.teamSummary.salaryCap) * 100).toFixed(1)}% of cap
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2025 Active Roster Cap */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
            <h3 className="text-lg font-semibold text-gray-800">2025 Active Roster Cap</h3>
            <button
              onClick={() => setShowPotentialSavings(!showPotentialSavings)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors border ${
                showPotentialSavings
                  ? 'text-white border-transparent'
                  : 'text-gray-700 border-gray-300 bg-white hover:bg-gray-50'
              }`}
              style={showPotentialSavings ? { backgroundColor: team.primaryColor } : {}}
            >
              {showPotentialSavings ? '✓ ' : ''}Potential Savings
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-white" style={{ backgroundColor: team.primaryColor }}>
                  <th
                    className="text-left p-3 font-medium cursor-pointer hover:opacity-90 whitespace-nowrap min-w-[160px]"
                    onClick={() => handleSort('name')}
                  >
                    PLAYER {getSortIcon('name')}
                  </th>
                  <th
                    className="text-left p-3 font-medium cursor-pointer hover:opacity-90 whitespace-nowrap"
                    onClick={() => handleSort('capHit')}
                  >
                    CAP HIT {getSortIcon('capHit')}
                  </th>
                  <th
                    className="text-left p-3 font-medium cursor-pointer hover:opacity-90 whitespace-nowrap"
                    onClick={() => handleSort('baseSalary')}
                  >
                    BASE SALARY {getSortIcon('baseSalary')}
                  </th>
                  <th
                    className="text-left p-3 font-medium cursor-pointer hover:opacity-90 whitespace-nowrap"
                    onClick={() => handleSort('guaranteed')}
                  >
                    GUARANTEED {getSortIcon('guaranteed')}
                  </th>

                  {showPotentialSavings ? (
                    <>
                      <th
                        className="text-left p-3 font-medium cursor-pointer hover:opacity-90 whitespace-nowrap"
                        onClick={() => handleSort('restructureCapSaving')}
                      >
                        RESTRUCTURE {getSortIcon('restructureCapSaving')}
                      </th>
                      <th
                        className="text-left p-3 font-medium cursor-pointer hover:opacity-90 whitespace-nowrap"
                        onClick={() => handleSort('extensionCapSaving')}
                      >
                        EXTENSION {getSortIcon('extensionCapSaving')}
                      </th>
                      <th
                        className="text-left p-3 font-medium cursor-pointer hover:opacity-90 whitespace-nowrap"
                        onClick={() => handleSort('cutSaving')}
                      >
                        CUT SAVINGS {getSortIcon('cutSaving')}
                      </th>
                      <th
                        className="text-left p-3 font-medium cursor-pointer hover:opacity-90 whitespace-nowrap"
                        onClick={() => handleSort('cutDeadMoney')}
                      >
                        DEAD MONEY {getSortIcon('cutDeadMoney')}
                      </th>
                    </>
                  ) : null}
                </tr>
              </thead>
              <tbody>
                {sortedData.map((player, index) => (
                  <tr key={player.name} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="p-3 whitespace-nowrap">
                      <a
                        href={getPFNUrl(player.name)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium hover:underline"
                        style={{ color: team.primaryColor }}
                      >
                        {player.name}
                      </a>
                    </td>
                    <td className="p-3 text-gray-900 font-medium whitespace-nowrap">
                      {player.capHit >= 1 ? `$${player.capHit.toFixed(1)}M` : `$${(player.capHit * 1000000).toLocaleString()}`}
                    </td>
                    <td className="p-3 text-gray-700 whitespace-nowrap">
                      {player.baseSalary >= 1 ? `$${player.baseSalary.toFixed(1)}M` : `$${(player.baseSalary * 1000000).toLocaleString()}`}
                    </td>
                    <td className="p-3 text-gray-700 whitespace-nowrap">
                      {player.guaranteed >= 1 ? `$${player.guaranteed.toFixed(1)}M` : `$${(player.guaranteed * 1000000).toLocaleString()}`}
                    </td>

                    {showPotentialSavings ? (
                      <>
                        <td className={`p-3 whitespace-nowrap font-medium ${
                          player.restructureCapSaving > 0 ? 'text-green-600' :
                          player.restructureCapSaving < 0 ? 'text-red-600' : 'text-gray-700'
                        }`}>
                          {player.restructureCapSaving >= 1 ? `$${player.restructureCapSaving.toFixed(1)}M` :
                           player.restructureCapSaving <= -1 ? `-$${Math.abs(player.restructureCapSaving).toFixed(1)}M` :
                           `$${(player.restructureCapSaving * 1000000).toLocaleString()}`}
                        </td>
                        <td className={`p-3 whitespace-nowrap font-medium ${
                          player.extensionCapSaving > 0 ? 'text-green-600' :
                          player.extensionCapSaving < 0 ? 'text-red-600' : 'text-gray-700'
                        }`}>
                          {player.extensionCapSaving >= 1 ? `$${player.extensionCapSaving.toFixed(1)}M` :
                           player.extensionCapSaving <= -1 ? `-$${Math.abs(player.extensionCapSaving).toFixed(1)}M` :
                           `$${(player.extensionCapSaving * 1000000).toLocaleString()}`}
                        </td>
                        <td className={`p-3 whitespace-nowrap font-medium ${
                          player.cutSaving > 0 ? 'text-green-600' :
                          player.cutSaving < 0 ? 'text-red-600' : 'text-gray-700'
                        }`}>
                          {player.cutSaving >= 1 ? `$${player.cutSaving.toFixed(1)}M` :
                           player.cutSaving <= -1 ? `-$${Math.abs(player.cutSaving).toFixed(1)}M` :
                           `$${(player.cutSaving * 1000000).toLocaleString()}`}
                        </td>
                        <td className="p-3 text-red-600 whitespace-nowrap font-medium">
                          {player.cutDeadMoney >= 1 ? `$${player.cutDeadMoney.toFixed(1)}M` : `$${(player.cutDeadMoney * 1000000).toLocaleString()}`}
                        </td>
                      </>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </LayoutStabilizer>
  );
}