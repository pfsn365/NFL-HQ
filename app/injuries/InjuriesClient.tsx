'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
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
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [lastUpdated, setLastUpdated] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Function to normalize name for matching
  function normalizePlayerName(name: string): string {
    return name
      .toLowerCase()
      .replace(/\s+(jr|sr|ii|iii|iv|v)\.?$/i, '')
      .replace(/[.\-']/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Generate player slug for linking to player pages
  function generatePlayerSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[.\s]+/g, '-')
      .replace(/[^\w-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  useEffect(() => {
    async function fetchInjuriesAndRosters() {
      setLoading(true);
      try {
        // Fetch injuries
        const injuryResponse = await fetch(getApiPath('nfl/teams/api/injuries'));
        if (!injuryResponse.ok) throw new Error('Failed to fetch injuries');

        const injuryData = await injuryResponse.json();

        if (!injuryData.success || !injuryData.injuries || !injuryData.injuries.ALL) {
          throw new Error('Invalid injury data format');
        }

        const rawInjuries = injuryData.injuries.ALL;

        // Fetch all team rosters in parallel (using client-side getApiPath which works)
        const rosterPromises = allTeams.map(team =>
          fetch(getApiPath(`nfl/teams/api/roster/${team.id}`))
            .then(res => res.ok ? res.json() : null)
            .catch(() => null)
        );

        const rosterResponses = await Promise.all(rosterPromises);

        // Build player-to-team map from rosters
        const playerToTeamMap = new Map<string, string>();

        rosterResponses.forEach((rosterData, index) => {
          if (rosterData && rosterData.roster) {
            const team = allTeams[index];
            const allPlayers = [
              ...(rosterData.roster.activeRoster || []),
              ...(rosterData.roster.practiceSquad || []),
              ...(rosterData.roster.injuredReserve || []),
              ...(rosterData.roster.physicallyUnableToPerform || []),
              ...(rosterData.roster.nonFootballInjuryReserve || []),
              ...(rosterData.roster.suspended || []),
              ...(rosterData.roster.exempt || []),
            ];

            allPlayers.forEach((player: any) => {
              const normalizedName = normalizePlayerName(player.name);
              playerToTeamMap.set(normalizedName, team.abbreviation);
            });
          }
        });

        console.log(`[INJURIES CLIENT] Built player-to-team map with ${playerToTeamMap.size} players`);

        // Match injuries to teams
        const injuriesWithTeams = rawInjuries.map((injury: any) => {
          const normalizedName = normalizePlayerName(injury.player);
          const teamAbbr = playerToTeamMap.get(normalizedName) || injury.team || 'N/A';

          return {
            ...injury,
            team: teamAbbr
          };
        });

        setInjuries(injuriesWithTeams);
        setLastUpdated(
          injuryData.lastUpdated
            ? new Date(injuryData.lastUpdated).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })
            : new Date().toLocaleDateString()
        );
      } catch (error) {
        console.error('Error fetching injuries:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchInjuriesAndRosters();
  }, []);

  // Get unique positions for filter in specified order
  const positions = useMemo(() => {
    const positionOrder = ['QB', 'RB', 'FB', 'WR', 'TE', 'OL', 'OT', 'T', 'OG', 'G', 'OC', 'C', 'NT', 'DT', 'DL', 'DE', 'EDGE', 'LB', 'CB', 'S', 'DB', 'K', 'P'];
    const uniquePositions = new Set(injuries.map(i => i.position));

    // Filter to only include positions that exist in the data, in the specified order
    return positionOrder.filter(pos => uniquePositions.has(pos));
  }, [injuries]);

  // Filter and search injuries
  const filteredInjuries = useMemo(() => {
    return injuries.filter(injury => {
      const statusLower = injury.status.toLowerCase();

      // Exclude suspended and exempt list players
      if (statusLower.includes('suspended') || statusLower.includes('exempt')) {
        return false;
      }

      const matchesTeam = selectedTeam === 'all' || injury.team === selectedTeam;
      const matchesPosition = selectedPosition === 'all' || injury.position === selectedPosition;
      const matchesStatus = selectedStatus === 'all' || injury.status.toLowerCase().includes(selectedStatus.toLowerCase());
      const matchesSearch =
        searchQuery === '' ||
        injury.player.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesTeam && matchesPosition && matchesStatus && matchesSearch;
    });
  }, [injuries, selectedTeam, selectedPosition, selectedStatus, searchQuery]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredInjuries.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedInjuries = filteredInjuries.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedTeam, selectedPosition, selectedStatus, searchQuery]);

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

  // Get status badge color (matching team page injury report colors)
  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('ir') || statusLower.includes('injured reserve'))
      return 'bg-red-100 text-red-800 border-red-600';
    if (statusLower.includes('pup') || statusLower.includes('physically unable'))
      return 'bg-purple-50 text-purple-700 border-purple-400';
    if (statusLower.includes('nfi') || statusLower.includes('non-football'))
      return 'bg-indigo-50 text-indigo-700 border-indigo-400';
    if (statusLower.includes('out')) return 'bg-red-50 text-red-700 border-red-400';
    if (statusLower.includes('doubtful')) return 'bg-orange-50 text-orange-700 border-orange-400';
    if (statusLower.includes('questionable')) return 'bg-yellow-50 text-yellow-700 border-yellow-400';
    if (statusLower.includes('probable')) return 'bg-green-50 text-green-700 border-green-400';
    return 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getTeamInfo = (teamAbbr: string) => {
    return allTeams.find(t => t.abbreviation === teamAbbr);
  };

  // Simplify status by removing practice participation details
  const simplifyStatus = (status: string) => {
    // Replace NFI (Non-Football Injury) with just NFI
    let simplified = status.replace(/NFI\s*\(Non-Football Injury\)/gi, 'NFI');

    // Remove practice participation details (DNP, Limited, Full, etc.)
    simplified = simplified
      .replace(/\s*-\s*(DNP|Limited|Full|Did Not Participate|Limited Participation|Full Participation)/gi, '')
      .trim();

    return simplified;
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
              NFL Injury Report
            </h1>
            <p className="text-base sm:text-lg lg:text-xl xl:text-2xl opacity-90">
              Latest player injury updates and status reports
            </p>
          </div>
        </div>

        {/* Raptive Header Ad */}
        <div className="container mx-auto px-4 h-[120px] flex items-center justify-center">
          <div className="raptive-pfn-header-90 w-full h-full"></div>
        </div>

        {/* Content */}
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl">
          {/* Filters and Search */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
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

              {/* Status Filter */}
              <div>
                <label htmlFor="status-filter" className="block text-sm font-semibold text-gray-700 mb-2">
                  Status:
                </label>
                <select
                  id="status-filter"
                  value={selectedStatus}
                  onChange={e => setSelectedStatus(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0050A0] bg-white text-sm"
                >
                  <option value="all">All Statuses</option>
                  <option value="out">Out</option>
                  <option value="ir">Injured Reserve</option>
                  <option value="questionable">Questionable</option>
                  <option value="doubtful">Doubtful</option>
                  <option value="pup">PUP</option>
                  <option value="nfi">NFI</option>
                </select>
              </div>

              {/* Search */}
              <div>
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
              <div className="text-sm">
                <span className="text-gray-600">
                  <strong>Last Updated:</strong> {lastUpdated || 'Loading...'}
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
              {/* Single table with all injuries */}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px]">
                  <thead className="bg-[#0050A0] text-white">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-left text-xs sm:text-sm font-bold">PLAYER</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs sm:text-sm font-bold w-24">POS</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs sm:text-sm font-bold w-32">TEAM</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs sm:text-sm font-bold">INJURY</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs sm:text-sm font-bold w-40">STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedInjuries.map((injury, index) => {
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
                            <Link
                              href={`/players/${generatePlayerSlug(injury.player)}`}
                              className="font-semibold text-blue-600 hover:underline text-sm"
                            >
                              {injury.player}
                            </Link>
                          </td>

                          {/* Position */}
                          <td className="px-4 py-3">
                            <span className={`inline-block px-2 py-1 rounded text-xs font-semibold border ${getPositionColor(injury.position)}`}>
                              {injury.position}
                            </span>
                          </td>

                          {/* Team */}
                          <td className="px-4 py-3">
                            {teamInfo ? (
                              <Link
                                href={`/teams/${teamInfo.id}/injury-report`}
                                className="flex items-center gap-2 hover:opacity-75 transition-opacity"
                              >
                                <img
                                  src={teamInfo.logoUrl}
                                  alt={teamInfo.abbreviation}
                                  className="w-6 h-6 object-contain"
                                />
                                <span className="font-semibold text-[#0050A0] text-xs sm:text-sm">
                                  {injury.team}
                                </span>
                              </Link>
                            ) : (
                              <span className="font-semibold text-gray-500 text-xs sm:text-sm">
                                {injury.team}
                              </span>
                            )}
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
                              {simplifyStatus(injury.status)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                      <p className="text-sm text-gray-700">
                        Page <span className="font-medium">{currentPage}</span> of{' '}
                        <span className="font-medium">{totalPages}</span>
                      </p>
                      {/* Items Per Page */}
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-700">Per page:</label>
                        <select
                          value={itemsPerPage}
                          onChange={e => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                          className="px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#0050A0] text-sm bg-white"
                        >
                          <option value={25}>25</option>
                          <option value={50}>50</option>
                          <option value={100}>100</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                        <button
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span className="sr-only">Previous</span>
                          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </button>

                        {/* Page Numbers */}
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }

                          return (
                            <button
                              key={pageNum}
                              onClick={() => setCurrentPage(pageNum)}
                              className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                currentPage === pageNum
                                  ? 'z-10 bg-[#0050A0] border-[#0050A0] text-white'
                                  : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}

                        <button
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span className="sr-only">Next</span>
                          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
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
                      {teamInfo ? (
                        <Link
                          href={`/teams/${teamInfo.id}/injury-report`}
                          className="flex items-center gap-3 hover:opacity-75 transition-opacity"
                        >
                          <img
                            src={teamInfo.logoUrl}
                            alt={teamInfo.abbreviation}
                            className="w-8 h-8 sm:w-10 sm:h-10 object-contain"
                          />
                          <h2 className="text-lg font-bold text-gray-900">
                            {teamInfo.fullName}
                            <span className="ml-2 text-sm font-normal text-gray-600">
                              ({teamInjuries.length} {teamInjuries.length === 1 ? 'injury' : 'injuries'})
                            </span>
                          </h2>
                        </Link>
                      ) : (
                        <div className="flex items-center gap-3">
                          <h2 className="text-lg font-bold text-gray-900">
                            {teamAbbr}
                            <span className="ml-2 text-sm font-normal text-gray-600">
                              ({teamInjuries.length} {teamInjuries.length === 1 ? 'injury' : 'injuries'})
                            </span>
                          </h2>
                        </div>
                      )}
                    </div>

                    {/* Injuries Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[640px]">
                        <thead className="bg-[#0050A0] text-white">
                          <tr>
                            <th scope="col" className="px-4 py-3 text-left text-xs sm:text-sm font-bold">PLAYER</th>
                            <th scope="col" className="px-4 py-3 text-left text-xs sm:text-sm font-bold w-24">POS</th>
                            <th scope="col" className="px-4 py-3 text-left text-xs sm:text-sm font-bold">INJURY</th>
                            <th scope="col" className="px-4 py-3 text-left text-xs sm:text-sm font-bold w-40">STATUS</th>
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
                                <Link
                                  href={`/players/${generatePlayerSlug(injury.player)}`}
                                  className="font-semibold text-blue-600 hover:underline text-sm"
                                >
                                  {injury.player}
                                </Link>
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
                                  {simplifyStatus(injury.status)}
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
