'use client';

import { useState, useEffect, useMemo } from 'react';
import NFLTeamsSidebar from '@/components/NFLTeamsSidebar';
import { getAllTeams } from '@/data/teams';
import { getApiPath } from '@/utils/api';
import SkeletonLoader from '@/components/SkeletonLoader';

interface InjuryData {
  player: string;
  position: string;
  team: string;
  status: string;
  injury: string;
  playerID: string;
}

export default function InjuriesClient() {
  const allTeams = getAllTeams();
  const [injuries, setInjuries] = useState<InjuryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [selectedPosition, setSelectedPosition] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [lastUpdated, setLastUpdated] = useState('');

  useEffect(() => {
    async function fetchInjuries() {
      setLoading(true);
      try {
        const response = await fetch(getApiPath('nfl/teams/api/injuries'));
        if (!response.ok) throw new Error('Failed to fetch injuries');

        const data = await response.json();
        if (data.success && data.injuries && data.injuries.ALL) {
          setInjuries(data.injuries.ALL);
          setLastUpdated(
            data.lastUpdated
              ? new Date(data.lastUpdated).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true,
                })
              : new Date().toLocaleString()
          );
        }
      } catch (error) {
        console.error('Error fetching injuries:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchInjuries();
  }, []);

  // Get unique positions for filter
  const positions = useMemo(() => {
    const uniquePositions = new Set(injuries.map(i => i.position));
    return Array.from(uniquePositions).sort();
  }, [injuries]);

  // Filter and search injuries
  const filteredInjuries = useMemo(() => {
    return injuries.filter(injury => {
      const matchesTeam = selectedTeam === 'all' || injury.team === selectedTeam;
      const matchesPosition = selectedPosition === 'all' || injury.position === selectedPosition;
      const matchesSearch =
        searchQuery === '' ||
        injury.player.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesTeam && matchesPosition && matchesSearch;
    });
  }, [injuries, selectedTeam, selectedPosition, searchQuery]);

  // Group injuries by team
  const injuriesByTeam = useMemo(() => {
    const grouped: Record<string, InjuryData[]> = {};
    filteredInjuries.forEach(injury => {
      if (!grouped[injury.team]) {
        grouped[injury.team] = [];
      }
      grouped[injury.team].push(injury);
    });
    return grouped;
  }, [filteredInjuries]);

  const teamNames = Object.keys(injuriesByTeam).sort();

  // Get status badge color
  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('out')) return 'bg-red-100 text-red-800 border-red-200';
    if (statusLower.includes('doubtful')) return 'bg-orange-100 text-orange-800 border-orange-200';
    if (statusLower.includes('questionable')) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (statusLower.includes('probable')) return 'bg-green-100 text-green-800 border-green-200';
    if (statusLower.includes('ir') || statusLower.includes('injured reserve'))
      return 'bg-gray-900 text-white border-gray-900';
    if (statusLower.includes('pup')) return 'bg-purple-100 text-purple-800 border-purple-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getTeamInfo = (teamAbbr: string) => {
    return allTeams.find(t => t.abbreviation === teamAbbr);
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
    if (pos === 'OT' || pos === 'OG' || pos === 'C' || pos === 'OL') return 'bg-amber-100 text-amber-700 border-amber-200';
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
              NFL Injury Report
            </h1>
            <p className="text-base sm:text-lg lg:text-xl opacity-90">
              Latest player injury updates and status reports
            </p>
          </div>
        </div>

        {/* Raptive Header Ad */}
        <div className="container mx-auto px-4 min-h-[150px]">
          <div className="raptive-pfn-header"></div>
        </div>

        {/* Content */}
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl">
          {/* Filters and Search */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Team Filter */}
              <div>
                <label htmlFor="team-filter" className="block text-sm font-semibold text-gray-700 mb-2">
                  Team:
                </label>
                <select
                  id="team-filter"
                  value={selectedTeam}
                  onChange={e => setSelectedTeam(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0050A0] bg-white text-sm"
                >
                  <option value="all">All Teams</option>
                  {allTeams.map(team => (
                    <option key={team.id} value={team.abbreviation}>
                      {team.fullName}
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
                  onChange={e => setSelectedPosition(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0050A0] bg-white text-sm"
                >
                  <option value="all">All Positions</option>
                  {positions.map(pos => (
                    <option key={pos} value={pos}>
                      {pos}
                    </option>
                  ))}
                </select>
              </div>

              {/* Search */}
              <div className="lg:col-span-2">
                <label htmlFor="search" className="block text-sm font-semibold text-gray-700 mb-2">
                  Search Player:
                </label>
                <input
                  id="search"
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Enter player name..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0050A0] text-sm"
                />
              </div>
            </div>

            {/* Last Updated */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">
                  <strong>Last Updated:</strong> {lastUpdated || 'Loading...'}
                </span>
                <span className="text-gray-600">
                  <strong>Total Injuries:</strong> {filteredInjuries.length}
                </span>
              </div>
            </div>
          </div>

          {/* Injuries List */}
          {loading ? (
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <SkeletonLoader type="table" rows={20} />
            </div>
          ) : filteredInjuries.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <p className="text-gray-600">No injuries found matching your filters.</p>
            </div>
          ) : selectedTeam === 'all' ? (
            /* Single table view for all teams */
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              {/* Header */}
              <div className="bg-gray-100 border-b border-gray-200 px-4 sm:px-6 py-3">
                <h2 className="text-lg font-bold text-gray-900">
                  ALL
                  <span className="ml-2 text-sm font-normal text-gray-600">
                    ({filteredInjuries.length} {filteredInjuries.length === 1 ? 'injury' : 'injuries'})
                  </span>
                </h2>
              </div>

              {/* Single table with all injuries */}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px]">
                  <thead className="bg-[#0050A0] text-white">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs sm:text-sm font-bold">PLAYER</th>
                      <th className="px-4 py-3 text-left text-xs sm:text-sm font-bold w-24">POS</th>
                      <th className="px-4 py-3 text-left text-xs sm:text-sm font-bold w-32">TEAM</th>
                      <th className="px-4 py-3 text-left text-xs sm:text-sm font-bold">INJURY</th>
                      <th className="px-4 py-3 text-left text-xs sm:text-sm font-bold w-40">STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInjuries.map((injury, index) => {
                      const teamInfo = getTeamInfo(injury.team);
                      return (
                        <tr
                          key={injury.playerID}
                          className={`border-b border-gray-200 ${
                            index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                          } hover:bg-blue-50 transition-colors`}
                        >
                          {/* Player */}
                          <td className="px-4 py-3">
                            <span className="font-semibold text-gray-900 text-sm">{injury.player}</span>
                          </td>

                          {/* Position */}
                          <td className="px-4 py-3">
                            <span className={`inline-block px-2 py-1 rounded text-xs font-semibold border ${getPositionColor(injury.position)}`}>
                              {injury.position}
                            </span>
                          </td>

                          {/* Team */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {teamInfo && (
                                <img
                                  src={teamInfo.logoUrl}
                                  alt={teamInfo.abbreviation}
                                  className="w-6 h-6 object-contain"
                                />
                              )}
                              <span className="font-semibold text-[#0050A0] text-xs sm:text-sm">
                                {injury.team}
                              </span>
                            </div>
                          </td>

                          {/* Injury */}
                          <td className="px-4 py-3">
                            <span className="text-sm text-gray-700">{injury.injury}</span>
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3">
                            <span
                              className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                                injury.status
                              )}`}
                            >
                              {injury.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Grouped by team view for specific team selection */
            <div className="space-y-6">
              {teamNames.map(teamAbbr => {
                const teamInfo = getTeamInfo(teamAbbr);
                const teamInjuries = injuriesByTeam[teamAbbr];

                return (
                  <div key={teamAbbr} className="bg-white rounded-lg shadow-sm overflow-hidden">
                    {/* Team Header */}
                    <div className="bg-gray-100 border-b border-gray-200 px-4 sm:px-6 py-3">
                      <div className="flex items-center gap-3">
                        {teamInfo && (
                          <img
                            src={teamInfo.logoUrl}
                            alt={teamInfo.abbreviation}
                            className="w-8 h-8 sm:w-10 sm:h-10 object-contain"
                          />
                        )}
                        <h2 className="text-lg font-bold text-gray-900">
                          {teamInfo?.fullName || teamAbbr}
                          <span className="ml-2 text-sm font-normal text-gray-600">
                            ({teamInjuries.length} {teamInjuries.length === 1 ? 'injury' : 'injuries'})
                          </span>
                        </h2>
                      </div>
                    </div>

                    {/* Injuries Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[640px]">
                        <thead className="bg-[#0050A0] text-white">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs sm:text-sm font-bold">PLAYER</th>
                            <th className="px-4 py-3 text-left text-xs sm:text-sm font-bold w-24">POS</th>
                            <th className="px-4 py-3 text-left text-xs sm:text-sm font-bold">INJURY</th>
                            <th className="px-4 py-3 text-left text-xs sm:text-sm font-bold w-40">STATUS</th>
                          </tr>
                        </thead>
                        <tbody>
                          {teamInjuries.map((injury, index) => (
                            <tr
                              key={injury.playerID}
                              className={`border-b border-gray-200 ${
                                index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                              } hover:bg-blue-50 transition-colors`}
                            >
                              {/* Player */}
                              <td className="px-4 py-3">
                                <span className="font-semibold text-gray-900 text-sm">{injury.player}</span>
                              </td>

                              {/* Position */}
                              <td className="px-4 py-3">
                                <span className={`inline-block px-2 py-1 rounded text-xs font-semibold border ${getPositionColor(injury.position)}`}>
                                  {injury.position}
                                </span>
                              </td>

                              {/* Injury */}
                              <td className="px-4 py-3">
                                <span className="text-sm text-gray-700">{injury.injury}</span>
                              </td>

                              {/* Status */}
                              <td className="px-4 py-3">
                                <span
                                  className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                                    injury.status
                                  )}`}
                                >
                                  {injury.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
