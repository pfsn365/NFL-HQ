'use client';

import { useState, useEffect, useCallback } from 'react';
import LayoutStabilizer from '@/components/LayoutStabilizer';
import { TeamData } from '@/data/teams';
import { getApiPath } from '@/utils/api';

// Helper function to generate PFSN URL
const getPFSNUrl = (playerName: string) => {
  return `https://www.profootballnetwork.com/players/${playerName.toLowerCase().replace(/[.\s]+/g, '-').replace(/[^\w-]/g, '').replace(/-+/g, '-')}/`;
};

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
  team: any;
}) => (
  <div className="mb-8">
    <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-white" style={{ backgroundColor: team.primaryColor }}>
            <th className="text-left p-3 font-medium">POS</th>
            <th className="text-left p-3 font-medium">STARTER</th>
            <th className="text-left p-3 font-medium">2ND</th>
            <th className="text-left p-3 font-medium">3RD</th>
            <th className="text-left p-3 font-medium">4TH</th>
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
                    <a
                      href={getPFSNUrl(starter.name)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium hover:underline cursor-pointer"
                      style={{ color: team.primaryColor }}
                    >
                      {starter.name}
                    </a>
                  ) : (
                    <span className="text-gray-600">-</span>
                  )}
                </td>
                <td className="p-3">
                  {second ? (
                    <a
                      href={getPFSNUrl(second.name)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium hover:underline cursor-pointer"
                      style={{ color: team.primaryColor }}
                    >
                      {second.name}
                    </a>
                  ) : (
                    <span className="text-gray-600">-</span>
                  )}
                </td>
                <td className="p-3">
                  {third ? (
                    <a
                      href={getPFSNUrl(third.name)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium hover:underline cursor-pointer"
                      style={{ color: team.primaryColor }}
                    >
                      {third.name}
                    </a>
                  ) : (
                    <span className="text-gray-600">-</span>
                  )}
                </td>
                <td className="p-3">
                  {fourth ? (
                    <a
                      href={getPFSNUrl(fourth.name)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium hover:underline cursor-pointer"
                      style={{ color: team.primaryColor }}
                    >
                      {fourth.name}
                    </a>
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
  const [depthChartData, setDepthChartData] = useState<DepthChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDepthChart = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(getApiPath(`nfl/teams/api/depth-chart/${team.id}`));

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Depth chart data not available for this team yet');
        }
        throw new Error(`Failed to fetch depth chart: ${response.status}`);
      }

      const data: DepthChartResponse = await response.json();

      if (!data.positions) {
        throw new Error('Invalid depth chart data received');
      }

      setDepthChartData(data.positions);
    } catch (err) {
      console.error('Error fetching depth chart:', err);
      setError(err instanceof Error ? err.message : 'Failed to load depth chart');
    } finally {
      setLoading(false);
    }
  }, [team.id]);

  useEffect(() => {
    fetchDepthChart();
  }, [fetchDepthChart]);

  if (loading) {
    return (
      <LayoutStabilizer className="bg-white rounded-lg shadow p-4 sm:p-6" minHeight={800}>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{team.fullName} Depth Chart</h2>
            <div className="h-1 rounded-full" style={{ backgroundColor: team.primaryColor, width: 'fit-content', minWidth: '270px' }}></div>
          </div>
        </div>
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
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{team.fullName} Depth Chart</h2>
            <div className="h-1 rounded-full" style={{ backgroundColor: team.primaryColor, width: 'fit-content', minWidth: '270px' }}></div>
          </div>
        </div>
        <div className="text-center py-12">
          <div className="text-red-600 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Depth Chart</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchDepthChart}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2"
            style={{ backgroundColor: team.primaryColor }}
          >
            Try Again
          </button>
        </div>
      </LayoutStabilizer>
    );
  }

  if (!depthChartData) {
    return (
      <LayoutStabilizer className="bg-white rounded-lg shadow p-4 sm:p-6" minHeight={800}>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{team.fullName} Depth Chart</h2>
            <div className="h-1 rounded-full" style={{ backgroundColor: team.primaryColor, width: 'fit-content', minWidth: '270px' }}></div>
          </div>
        </div>
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Depth Chart Available</h3>
          <p className="text-gray-600">No depth chart data found for this team.</p>
        </div>
      </LayoutStabilizer>
    );
  }

  return (
    <LayoutStabilizer className="bg-white rounded-lg shadow p-4 sm:p-6" minHeight={800}>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{team.fullName} Depth Chart</h2>
          <div className="h-1 rounded-full" style={{ backgroundColor: team.primaryColor, width: 'fit-content', minWidth: '270px' }}></div>
        </div>
        <div className="text-sm text-gray-600">
          2025 Season
        </div>
      </div>

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