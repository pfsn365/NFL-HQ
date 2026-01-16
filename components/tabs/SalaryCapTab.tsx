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
  const [showPotentialSavings, setShowPotentialSavings] = useState(false);

  // SWR fetch - replaces useState/useCallback/useEffect boilerplate
  const { data, error, isLoading, mutate } = useSWR<SalaryCapResponse>(
    getApiPath(`nfl/teams/api/salary-cap/${team.id}`),
    fetcher,
    defaultSWROptions
  );

  const salaryCapData = data?.salaryCapData;

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection(field === 'name' ? 'asc' : 'desc');
    }
  };

  const sortedData = useMemo(() => {
    if (!salaryCapData?.players) return [];

    return [...salaryCapData.players].sort((a, b) => {
      let aValue: string | number = a[sortField];
      let bValue: string | number = b[sortField];

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = (bValue as string).toLowerCase();
      }

      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
  }, [salaryCapData?.players, sortField, sortDirection]);

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

  // Tab header component - reused across loading/error/data states
  const TabHeader = () => (
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{team.fullName} Salary Cap</h2>
        <div className="h-1 rounded-full" style={{ backgroundColor: team.primaryColor, width: 'fit-content', minWidth: '270px' }}></div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <LayoutStabilizer className="bg-white rounded-lg shadow p-4 sm:p-6" minHeight={600}>
        <TabHeader />
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
        <TabHeader />
        <SWRErrorFallback
          error={error}
          onRetry={() => mutate()}
          teamColor={team.primaryColor}
          title="Error Loading Salary Cap"
        />
      </LayoutStabilizer>
    );
  }

  if (!salaryCapData) {
    return (
      <LayoutStabilizer className="bg-white rounded-lg shadow p-4 sm:p-6" minHeight={600}>
        <TabHeader />
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Salary Cap Data Available</h3>
          <p className="text-gray-600">No salary cap data found for this team.</p>
        </div>
      </LayoutStabilizer>
    );
  }

  return (
    <LayoutStabilizer className="bg-white rounded-lg shadow p-4 sm:p-6" minHeight={600}>
      <TabHeader />

      <div className="space-y-8">
        {/* Cap Summary Cards */}
        <div className="mb-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 card-hover" style={{ borderLeftColor: team.primaryColor }}>
              <div className="text-center">
                <h4 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">Salary Cap</h4>
                <div className="text-2xl font-bold text-gray-900 mb-1">${(salaryCapData.teamSummary.salaryCap / 1000000).toFixed(1)}M</div>
                <div className="text-sm text-gray-600">2026 Season</div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 card-hover" style={{ borderLeftColor: team.primaryColor }}>
              <div className="text-center">
                <h4 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">Available Cap Space</h4>
                <div className={`text-2xl font-bold mb-1 ${salaryCapData.teamSummary.capSpace > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${(salaryCapData.teamSummary.capSpace / 1000000).toFixed(1)}M
                </div>
                <div className="text-sm text-gray-600">
                  {salaryCapData.teamSummary.capSpace > 0 ? 'Over Cap' : 'Under Cap'}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 card-hover" style={{ borderLeftColor: team.primaryColor }}>
              <div className="text-center">
                <h4 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">Active Cap Spend</h4>
                <div className="text-2xl font-bold text-gray-900 mb-1">${(salaryCapData.teamSummary.activeCapSpend / 1000000).toFixed(1)}M</div>
                <div className="text-sm text-gray-600">
                  {((salaryCapData.teamSummary.activeCapSpend / salaryCapData.teamSummary.salaryCap) * 100).toFixed(1)}% of cap
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 card-hover" style={{ borderLeftColor: team.primaryColor }}>
              <div className="text-center">
                <h4 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">Dead Money</h4>
                <div className="text-2xl font-bold text-gray-900 mb-1">${(salaryCapData.teamSummary.deadMoney / 1000000).toFixed(1)}M</div>
                <div className="text-sm text-gray-600">
                  {((salaryCapData.teamSummary.deadMoney / salaryCapData.teamSummary.salaryCap) * 100).toFixed(1)}% of cap
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2026 Active Roster Cap */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
            <h3 className="text-lg font-semibold text-gray-800">2026 Active Roster Cap</h3>
            <button
              onClick={() => setShowPotentialSavings(!showPotentialSavings)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors border cursor-pointer ${
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
            <table className="min-w-full text-sm sort-animation" key={`${sortField}-${sortDirection}`}>
              <thead>
                <tr style={{ backgroundColor: team.primaryColor, color: getContrastTextColor(team.primaryColor) }}>
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
                      <Link
                        href={`/nfl-hq/players/${player.slug}`}
                        className="font-medium hover:underline cursor-pointer"
                        style={{ color: team.primaryColor }}
                      >
                        {player.name}
                      </Link>
                    </td>
                    <td className="p-3 text-gray-900 font-medium whitespace-nowrap">
                      ${(player.capHit / 1000000).toFixed(1)}M
                    </td>
                    <td className="p-3 text-gray-700 whitespace-nowrap">
                      ${(player.baseSalary / 1000000).toFixed(1)}M
                    </td>
                    <td className="p-3 text-gray-700 whitespace-nowrap">
                      ${(player.guaranteed / 1000000).toFixed(1)}M
                    </td>

                    {showPotentialSavings ? (
                      <>
                        <td className={`p-3 whitespace-nowrap font-medium ${
                          player.restructureCapSaving > 0 ? 'text-green-600' :
                          player.restructureCapSaving < 0 ? 'text-red-600' : 'text-gray-700'
                        }`}>
                          {player.restructureCapSaving < 0 ? `-$${Math.abs(player.restructureCapSaving / 1000000).toFixed(1)}M` : `$${(player.restructureCapSaving / 1000000).toFixed(1)}M`}
                        </td>
                        <td className={`p-3 whitespace-nowrap font-medium ${
                          player.extensionCapSaving > 0 ? 'text-green-600' :
                          player.extensionCapSaving < 0 ? 'text-red-600' : 'text-gray-700'
                        }`}>
                          {player.extensionCapSaving < 0 ? `-$${Math.abs(player.extensionCapSaving / 1000000).toFixed(1)}M` : `$${(player.extensionCapSaving / 1000000).toFixed(1)}M`}
                        </td>
                        <td className={`p-3 whitespace-nowrap font-medium ${
                          player.cutSaving > 0 ? 'text-green-600' :
                          player.cutSaving < 0 ? 'text-red-600' : 'text-gray-700'
                        }`}>
                          {player.cutSaving < 0 ? `-$${Math.abs(player.cutSaving / 1000000).toFixed(1)}M` : `$${(player.cutSaving / 1000000).toFixed(1)}M`}
                        </td>
                        <td className="p-3 text-red-600 whitespace-nowrap font-medium">
                          ${(player.cutDeadMoney / 1000000).toFixed(1)}M
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
