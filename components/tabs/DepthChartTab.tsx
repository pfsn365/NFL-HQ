'use client';

import useSWR from 'swr';
import Link from 'next/link';
import LayoutStabilizer from '@/components/LayoutStabilizer';
import { SWRErrorFallback } from '@/components/ErrorBoundary';
import { TeamData } from '@/data/teams';
import { getApiPath } from '@/utils/api';
import { getContrastTextColor } from '@/utils/colorHelpers';
import { fetcher, defaultSWROptions } from '@/lib/fetcher';

interface DepthChartPlayer {
  name: string;
  slug: string;
  depth: number;
}

interface DepthChartPosition {
  name: string;
  abbreviation: string;
  players: DepthChartPlayer[];
}

interface DepthChartData {
  offense: DepthChartPosition[];
  defense: DepthChartPosition[];
  specialTeams: DepthChartPosition[];
}

interface DepthChartResponse {
  teamId: string;
  positions: DepthChartData;
  allPositions: DepthChartPosition[];
  totalPositions: number;
  lastUpdated: string;
  season: number;
}


const PositionTable = ({
  title,
  positions,
  team
}: {
  title: string;
  positions: DepthChartPosition[];
  team: TeamData;
}) => (
  <div className="mb-8">
    <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr style={{ backgroundColor: team.primaryColor, color: getContrastTextColor(team.primaryColor) }}>
            <th scope="col" className="text-left p-3 font-medium">POS</th>
            <th scope="col" className="text-left p-3 font-medium">STARTER</th>
            <th scope="col" className="text-left p-3 font-medium">2ND</th>
            <th scope="col" className="text-left p-3 font-medium">3RD</th>
            <th scope="col" className="text-left p-3 font-medium">4TH</th>
          </tr>
        </thead>
        <tbody>
          {positions.map((position, index) => {
            const starter = position.players.find(p => p.depth === 1);
            const second = position.players.find(p => p.depth === 2);
            const third = position.players.find(p => p.depth === 3);
            const fourth = position.players.find(p => p.depth === 4);

            return (
              <tr key={position.abbreviation} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="p-3 font-medium text-gray-900">{position.abbreviation}</td>
                <td className="p-3">
                  {starter ? (
                    <Link
                      href={`/nfl-hq/players/${starter.slug}`}
                      className="font-medium hover:underline cursor-pointer"
                      style={{ color: team.primaryColor }}
                    >
                      {starter.name}
                    </Link>
                  ) : (
                    <span className="text-gray-600">-</span>
                  )}
                </td>
                <td className="p-3">
                  {second ? (
                    <Link
                      href={`/nfl-hq/players/${second.slug}`}
                      className="font-medium hover:underline cursor-pointer"
                      style={{ color: team.primaryColor }}
                    >
                      {second.name}
                    </Link>
                  ) : (
                    <span className="text-gray-600">-</span>
                  )}
                </td>
                <td className="p-3">
                  {third ? (
                    <Link
                      href={`/nfl-hq/players/${third.slug}`}
                      className="font-medium hover:underline cursor-pointer"
                      style={{ color: team.primaryColor }}
                    >
                      {third.name}
                    </Link>
                  ) : (
                    <span className="text-gray-600">-</span>
                  )}
                </td>
                <td className="p-3">
                  {fourth ? (
                    <Link
                      href={`/nfl-hq/players/${fourth.slug}`}
                      className="font-medium hover:underline cursor-pointer"
                      style={{ color: team.primaryColor }}
                    >
                      {fourth.name}
                    </Link>
                  ) : (
                    <span className="text-gray-600">-</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </div>
);

interface DepthChartTabProps {
  team: TeamData;
}

export default function DepthChartTab({ team }: DepthChartTabProps) {
  // SWR fetch - replaces useState/useCallback/useEffect boilerplate
  const { data, error, isLoading, mutate } = useSWR<DepthChartResponse>(
    getApiPath(`nfl/teams/api/depth-chart/${team.id}`),
    fetcher,
    defaultSWROptions
  );

  const depthChartData = data?.positions;

  // Tab header component - reused across loading/error/data states
  const TabHeader = () => (
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{team.fullName} Depth Chart</h1>
        <div className="h-1 rounded-full" style={{ backgroundColor: team.primaryColor, width: 'fit-content', minWidth: '270px' }}></div>
      </div>
      <div className="text-sm text-gray-600">
        2025 Season
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <LayoutStabilizer className="bg-white rounded-lg shadow p-4 sm:p-6" minHeight={800}>
        <TabHeader />
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading depth chart...</p>
        </div>
      </LayoutStabilizer>
    );
  }

  if (error) {
    return (
      <LayoutStabilizer className="bg-white rounded-lg shadow p-4 sm:p-6" minHeight={800}>
        <TabHeader />
        <SWRErrorFallback
          error={error}
          onRetry={() => mutate()}
          teamColor={team.primaryColor}
          title="Error Loading Depth Chart"
        />
      </LayoutStabilizer>
    );
  }

  if (!depthChartData) {
    return (
      <LayoutStabilizer className="bg-white rounded-lg shadow p-4 sm:p-6" minHeight={800}>
        <TabHeader />
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Depth Chart Available</h3>
          <p className="text-gray-600">No depth chart data found for this team.</p>
        </div>
      </LayoutStabilizer>
    );
  }

  return (
    <LayoutStabilizer className="bg-white rounded-lg shadow p-4 sm:p-6" minHeight={800}>
      <TabHeader />

      {depthChartData.offense.length > 0 && (
        <PositionTable
          title={`Offense | OC: ${team.offensiveCoordinator}`}
          positions={depthChartData.offense}
          team={team}
        />
      )}

      {depthChartData.defense.length > 0 && (
        <PositionTable
          title={`Defense | DC: ${team.defensiveCoordinator}`}
          positions={depthChartData.defense}
          team={team}
        />
      )}

      {depthChartData.specialTeams.length > 0 && (
        <PositionTable
          title={`Special Teams | STC: ${team.specialTeamsCoordinator}`}
          positions={depthChartData.specialTeams}
          team={team}
        />
      )}
    </LayoutStabilizer>
  );
}
