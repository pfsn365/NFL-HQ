'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import Pagination from '@/components/Pagination';
import { getAllTeams } from '@/data/teams';
import { getApiPath } from '@/utils/api';
import { getPositionColor, getStatusColor } from '@/utils/colorHelpers';
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
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [lastUpdated, setLastUpdated] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Load items per page from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('injuries_items_per_page');
    if (stored) {
      const parsed = parseInt(stored, 10);
      if ([25, 50, 100].includes(parsed)) {
        setItemsPerPage(parsed);
      }
    }
  }, []);

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (count: number) => {
    localStorage.setItem('injuries_items_per_page', count.toString());
    setItemsPerPage(count);
    setCurrentPage(1);
  };

  // Debounce search query (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

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
    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    async function fetchInjuries() {
      setLoading(true);
      try {
        // Single API call - injuries endpoint already includes team info
        const injuryResponse = await fetch(
          getApiPath('nfl/teams/api/injuries'),
          { signal: abortControllerRef.current?.signal }
        );
        if (!injuryResponse.ok) throw new Error('Failed to fetch injuries');

        const injuryData = await injuryResponse.json();

        if (!injuryData.success || !injuryData.injuries || !injuryData.injuries.ALL) {
          throw new Error('Invalid injury data format');
        }

        // Use injury data directly - team info is already included
        const rawInjuries = injuryData.injuries.ALL;
        setInjuries(rawInjuries);
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
        // Ignore abort errors
        if (error instanceof Error && error.name === 'AbortError') return;
        console.error('Error fetching injuries:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchInjuries();

    // Cleanup on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
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
        debouncedSearch === '' ||
        injury.player.toLowerCase().includes(debouncedSearch.toLowerCase());
      return matchesTeam && matchesPosition && matchesStatus && matchesSearch;
    });
  }, [injuries, selectedTeam, selectedPosition, selectedStatus, debouncedSearch]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredInjuries.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedInjuries = filteredInjuries.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedTeam, selectedPosition, selectedStatus, debouncedSearch]);

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

  return (
      <main id="main-content" className="pt-[57px] lg:pt-0">
        {/* Header */}
        <header
          className="text-white shadow-lg"
          style={{
            background: 'linear-gradient(180deg, #0050A0 0%, #003A75 100%)',
            boxShadow: 'inset 0 -30px 40px -30px rgba(0,0,0,0.15), 0 4px 6px -1px rgba(0,0,0,0.1)'
          }}
        >
          <div className="container mx-auto px-4 pt-6 sm:pt-7 md:pt-8 lg:pt-10 pb-5 sm:pb-6 md:pb-7 lg:pb-8">
            <h1 className="text-4xl lg:text-5xl font-extrabold mb-2">
              NFL Injury Report
            </h1>
            <p className="text-lg opacity-90 font-medium">
              Latest player injury updates and status reports
            </p>
          </div>
        </header>

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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0050A0] bg-white text-sm cursor-pointer"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0050A0] bg-white text-sm cursor-pointer"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0050A0] bg-white text-sm cursor-pointer"
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
                          } hover:bg-[#0050A0]/5 transition-colors`}
                        >
                          {/* Player */}
                          <td className="px-4 py-3">
                            <Link
                              href={`/players/${generatePlayerSlug(injury.player)}`}
                              className="font-semibold text-[#0050A0] hover:underline text-sm"
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
              {filteredInjuries.length > 0 && (
                <div className="bg-gray-50 px-4 border-t border-gray-200">
                  <Pagination
                    totalItems={filteredInjuries.length}
                    currentPage={currentPage}
                    onPageChange={handlePageChange}
                    itemsPerPage={itemsPerPage}
                    onItemsPerPageChange={handleItemsPerPageChange}
                    storageKey="injuries_items_per_page"
                  />
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
                              } hover:bg-[#0050A0]/5 transition-colors`}
                            >
                              {/* Player */}
                              <td className="px-4 py-3">
                                <Link
                                  href={`/players/${generatePlayerSlug(injury.player)}`}
                                  className="font-semibold text-[#0050A0] hover:underline text-sm"
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
  );
}
