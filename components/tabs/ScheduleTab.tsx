'use client';

import { useState, useEffect, useCallback } from 'react';
import { TeamData, getAllTeams } from '@/data/teams';
import LayoutStabilizer from '@/components/LayoutStabilizer';
import OptimizedImage from '../OptimizedImage';

interface ScheduleGame {
  week: number | string;
  date: string;
  opponent: string;
  opponentLogo: string;
  opponentAbbr?: string;
  isHome: boolean;
  time: string;
  tv: string;
  venue: string;
  result?: 'W' | 'L' | null;
  score?: { home: number; away: number };
  overallRecord?: string;
}

interface ScheduleTabProps {
  team: TeamData;
}

export default function ScheduleTab({ team }: ScheduleTabProps) {
  const [selectedType, setSelectedType] = useState('regular');
  const [scheduleData, setScheduleData] = useState<ScheduleGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper function to get team by abbreviation or name
  const getTeamByAbbreviation = (abbr: string): TeamData | null => {
    const allTeams = getAllTeams();
    return allTeams.find(team =>
      team.abbreviation.toLowerCase() === abbr.toLowerCase() ||
      team.espnAbbr.toLowerCase() === abbr.toLowerCase()
    ) || null;
  };

  // Helper function to get team by full name
  const getTeamByName = (name: string): TeamData | null => {
    const allTeams = getAllTeams();
    return allTeams.find(team =>
      team.fullName.toLowerCase() === name.toLowerCase() ||
      team.name.toLowerCase() === name.toLowerCase()
    ) || null;
  };

  // Helper function to generate team URL
  const getTeamUrl = (opponent: string, opponentAbbr?: string): string => {
    let targetTeam: TeamData | null = null;

    if (opponentAbbr) {
      targetTeam = getTeamByAbbreviation(opponentAbbr);
    }

    if (!targetTeam) {
      targetTeam = getTeamByName(opponent);
    }

    if (targetTeam) {
      return `/nfl/teams/${targetTeam.id}`;
    }

    return '#';
  };

  const fetchSchedule = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/nfl/teams/api/schedule/${team.id}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Schedule data not available for this team yet');
        }
        throw new Error(`Failed to fetch schedule: ${response.status}`);
      }

      const data = await response.json();

      if (!data.schedule || !Array.isArray(data.schedule)) {
        throw new Error('Invalid schedule data received');
      }

      // Filter by selected type
      const filteredData = data.schedule.filter((game: any) => {
        if (selectedType === 'preseason') return game.eventType === 'Preseason';
        if (selectedType === 'regular') return game.eventType === 'Regular Season';
        if (selectedType === 'postseason') return game.eventType === 'Postseason';
        return false;
      });

      setScheduleData(filteredData);
    } catch (err) {
      console.error('Error fetching schedule:', err);
      setError(err instanceof Error ? err.message : 'Failed to load schedule');
    } finally {
      setLoading(false);
    }
  }, [team.id, selectedType]);

  useEffect(() => {
    fetchSchedule();
  }, [selectedType, fetchSchedule]);

  const currentData = scheduleData;

  return (
    <LayoutStabilizer className="bg-white rounded-lg shadow p-4 sm:p-6" minHeight={800}>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{team.fullName} Schedule</h2>
          <div className="h-1 rounded-full" style={{ backgroundColor: team.primaryColor, width: 'fit-content', minWidth: '260px' }}></div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">Type</label>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="preseason">Preseason</option>
            <option value="regular">Regular Season</option>
            <option value="postseason">Postseason</option>
          </select>
        </div>
      </div>

      {/* Schedule Content */}
      {loading ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">Week</th>
                <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">Date</th>
                <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Opponent</th>
                <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16 hidden sm:table-cell">Time</th>
                <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16 hidden md:table-cell">TV</th>
                <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Result</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {[...Array(selectedType === 'preseason' ? 3 : selectedType === 'postseason' ? 4 : 17)].map((_, index) => (
                <tr key={index}>
                  <td className="px-2 sm:px-4 py-3 whitespace-nowrap">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-8"></div>
                  </td>
                  <td className="px-2 sm:px-4 py-3 whitespace-nowrap">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-16"></div>
                  </td>
                  <td className="px-2 sm:px-4 py-3">
                    <div className="flex items-center">
                      <div className="h-5 w-5 bg-gray-200 rounded-full animate-pulse mr-2"></div>
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-32"></div>
                    </div>
                  </td>
                  <td className="px-2 sm:px-4 py-3 whitespace-nowrap hidden sm:table-cell">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-16"></div>
                  </td>
                  <td className="px-2 sm:px-4 py-3 whitespace-nowrap hidden md:table-cell">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-12"></div>
                  </td>
                  <td className="px-2 sm:px-4 py-3 whitespace-nowrap">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-8"></div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <div className="text-red-600 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Schedule</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchSchedule}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Try Again
          </button>
        </div>
      ) : currentData.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Games Available</h3>
          <p className="text-gray-600">No schedule data found for the selected filters.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">Week</th>
                <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">Date</th>
                <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Opponent</th>
                <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16 hidden sm:table-cell">Time</th>
                <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16 hidden md:table-cell">TV</th>
                <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Result</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentData.map((game, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-2 sm:px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{game.week}</td>
                  <td className="px-2 sm:px-4 py-3 whitespace-nowrap text-sm text-gray-900">{game.date}</td>
                  <td className="px-2 sm:px-4 py-3">
                    <div className="flex items-center min-w-0">
                      <span className="text-sm text-gray-600 mr-1 sm:mr-2 w-3 sm:w-4 flex-shrink-0">
                        {game.opponentAbbr === 'BYE' ? '' : (game.isHome ? 'vs' : '@')}
                      </span>
                      {game.opponentAbbr !== 'BYE' && (
                        <OptimizedImage
                          src={game.opponentLogo}
                          alt={game.opponentAbbr || ''}
                          width={20}
                          height={20}
                          className="w-5 h-5 mr-2 sm:mr-3 flex-shrink-0"
                          sizes="20px"
                        />
                      )}
                      {game.opponentAbbr === 'BYE' ? (
                        <span className="text-sm font-medium text-gray-600">

                        </span>
                      ) : (
                        <a
                          href={getTeamUrl(game.opponent, game.opponentAbbr)}
                          className="text-sm font-medium hover:underline transition-colors truncate"
                          style={{
                            color: team.primaryColor
                          }}
                        >
                          {game.opponent}
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="px-2 sm:px-4 py-3 whitespace-nowrap text-sm text-gray-900 hidden sm:table-cell">{game.time}</td>
                  <td className="px-2 sm:px-4 py-3 whitespace-nowrap text-sm text-gray-900 hidden md:table-cell">{game.tv}</td>
                  <td className="px-2 sm:px-4 py-3 whitespace-nowrap">
                    {game.result ? (
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                        <span className={`inline-flex px-1 py-0.5 sm:px-1.5 text-xs font-semibold rounded-full ${
                          game.result === 'W'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {game.result}
                        </span>
                        {game.score && (
                          <span className="text-xs sm:text-sm text-gray-600">
                            {game.score.home}-{game.score.away}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </LayoutStabilizer>
  );
}