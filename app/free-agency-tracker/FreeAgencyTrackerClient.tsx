'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import NFLTeamsSidebar from '@/components/NFLTeamsSidebar';
import { getAllTeams } from '@/data/teams';
import { getApiPath } from '@/utils/api';

// TypeScript Interfaces
interface FreeAgent {
  rank: number;
  name: string;
  position: string;
  current2025Team: string;
  faType: 'UFA' | 'RFA' | 'ERFA' | 'Void' | 'SFA' | string;
  age: number;
  pfsn2025Impact: number;
  signed2026Team: string;
  positionRank: number;
  teamId?: string;
}

interface RawFreeAgentData {
  Rank: string | number;
  Name: string;
  Position: string;
  '2025 Team': string;
  'FA Type': string;
  Age: string | number;
  'PFSN 2025 Impact': string | number;
  '2026 Team': string;
  'Pos. Rank': string | number;
}

type SortKey = 'pfsn2025Impact' | 'positionRank' | 'age' | 'name' | 'rank';

// Helper Functions
function generatePlayerSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[.\s]+/g, '-')
    .replace(/[^\w-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function mapTeamNameToId(teamName: string): string | undefined {
  if (!teamName || teamName.trim() === '') return undefined;

  const allTeams = getAllTeams();
  const normalized = teamName.trim().toLowerCase();

  // Try matching against name, fullName, and abbreviation
  return allTeams.find(t =>
    t.name.toLowerCase() === normalized ||
    t.fullName.toLowerCase() === normalized ||
    t.abbreviation.toLowerCase() === normalized
  )?.id;
}

function getPositionColor(position: string): string {
  const pos = position.toUpperCase();

  // Quarterback
  if (pos === 'QB') return 'bg-purple-100 text-purple-700 border-purple-200';

  // Running Backs
  if (pos === 'RB' || pos === 'FB') return 'bg-green-100 text-green-700 border-green-200';

  // Receivers
  if (pos === 'WR' || pos === 'TE') return 'bg-blue-100 text-blue-700 border-blue-200';

  // Offensive Line
  if (pos === 'OT' || pos === 'OG' || pos === 'OC' || pos === 'C' || pos === 'OL' || pos === 'G' || pos === 'T')
    return 'bg-amber-100 text-amber-700 border-amber-200';

  // Defensive Line
  if (pos === 'DE' || pos === 'DT' || pos === 'NT' || pos === 'EDGE' || pos === 'DL')
    return 'bg-red-100 text-red-700 border-red-200';

  // Linebackers
  if (pos === 'LB' || pos === 'ILB' || pos === 'OLB' || pos === 'MLB')
    return 'bg-orange-100 text-orange-700 border-orange-200';

  // Defensive Backs
  if (pos === 'CB' || pos === 'S' || pos === 'FS' || pos === 'SS' || pos === 'DB')
    return 'bg-cyan-100 text-cyan-700 border-cyan-200';

  // Special Teams
  if (pos === 'K' || pos === 'P' || pos === 'LS')
    return 'bg-pink-100 text-pink-700 border-pink-200';

  return 'bg-gray-100 text-gray-700 border-gray-200';
}

function getPositionImpactUrl(position: string): string {
  const pos = position.toUpperCase();

  // Position-specific impact grade pages
  if (pos === 'QB') return 'https://www.profootballnetwork.com/nfl-qb-rankings-impact/';
  if (pos === 'RB' || pos === 'FB') return 'https://www.profootballnetwork.com/nfl-rb-rankings-impact/';
  if (pos === 'WR') return 'https://www.profootballnetwork.com/nfl-wr-rankings-impact/';
  if (pos === 'TE') return 'https://www.profootballnetwork.com/nfl-te-rankings-impact/';
  if (pos === 'OL' || pos === 'OT' || pos === 'OG' || pos === 'OC' || pos === 'T' || pos === 'G' || pos === 'C') {
    return 'https://www.profootballnetwork.com/nfl-player-ol-rankings-impact/';
  }
  if (pos === 'DT' || pos === 'NT') return 'https://www.profootballnetwork.com/nfl-dt-rankings-impact/';
  if (pos === 'EDGE' || pos === 'DE') return 'https://www.profootballnetwork.com/nfl-edge-rankings-impact/';
  if (pos === 'LB' || pos === 'ILB' || pos === 'OLB' || pos === 'MLB') return 'https://www.profootballnetwork.com/nfl-lb-rankings-impact/';
  if (pos === 'CB') return 'https://www.profootballnetwork.com/nfl-cb-rankings-impact/';
  if (pos === 'S' || pos === 'FS' || pos === 'SS' || pos === 'SAF' || pos === 'DB') {
    return 'https://www.profootballnetwork.com/nfl-saf-rankings-impact/';
  }

  // Default fallback
  return 'https://www.profootballnetwork.com/nfl-player-rankings-impact/';
}

function transformFreeAgentData(rawData: RawFreeAgentData[]): FreeAgent[] {
  return rawData.map((agent, index) => {
    const teamId = mapTeamNameToId(agent['2025 Team']);

    // Parse position rank - handle formats like "WR1", "CB2", "EDGE1"
    let positionRank = 0;
    if (agent['Pos. Rank'] !== null && agent['Pos. Rank'] !== undefined && agent['Pos. Rank'] !== '') {
      if (typeof agent['Pos. Rank'] === 'number') {
        positionRank = agent['Pos. Rank'];
      } else {
        // Extract numeric part from strings like "WR1", "EDGE1", "CB2"
        const numericPart = String(agent['Pos. Rank']).replace(/\D/g, '');
        const parsed = parseInt(numericPart);
        positionRank = isNaN(parsed) ? 0 : parsed;
      }
    }

    return {
      rank: typeof agent.Rank === 'number' ? agent.Rank : parseInt(agent.Rank) || 0,
      name: agent.Name || '',
      position: agent.Position || '',
      current2025Team: agent['2025 Team'] || '',
      faType: agent['FA Type'] || '',
      age: typeof agent.Age === 'number' ? agent.Age : parseInt(agent.Age) || 0,
      pfsn2025Impact: typeof agent['PFSN 2025 Impact'] === 'number'
        ? agent['PFSN 2025 Impact']
        : parseFloat(agent['PFSN 2025 Impact']) || 0,
      signed2026Team: agent['2026 Team'] || '',
      positionRank,
      teamId
    };
  });
}

export default function FreeAgencyTrackerClient() {
  const allTeams = getAllTeams();

  // State Management
  const [allFreeAgents, setAllFreeAgents] = useState<FreeAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter States
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [selectedPosition, setSelectedPosition] = useState('all');
  const [selectedFaType, setSelectedFaType] = useState('all');
  const [selectedSignedStatus, setSelectedSignedStatus] = useState('all');

  // Sorting States
  const [sortKey, setSortKey] = useState<SortKey>('rank');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Data Fetching
  useEffect(() => {
    if (hasLoaded) return;

    async function fetchFreeAgents() {
      try {
        setLoading(true);
        const response = await fetch(getApiPath('api/free-agents'));

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('API Error Response:', errorData);
          throw new Error(errorData.message || `Failed to fetch free agents: ${response.status}`);
        }

        const data = await response.json();

        if (data.error) {
          throw new Error(data.message || data.error);
        }

        if (data.output && Array.isArray(data.output)) {
          const transformed = transformFreeAgentData(data.output);
          setAllFreeAgents(transformed);
        } else {
          console.error('Invalid data format. Received:', Object.keys(data));
          throw new Error('Invalid data format from API');
        }
      } catch (err) {
        console.error('Error fetching free agents:', err);
        setError(err instanceof Error ? err.message : 'Failed to load free agent data');
      } finally {
        setLoading(false);
        setHasLoaded(true);
      }
    }

    fetchFreeAgents();
  }, [hasLoaded]);

  // Extract unique positions for filter
  const availablePositions = useMemo(() => {
    const positions = new Set(allFreeAgents.map(a => a.position).filter(Boolean));
    return Array.from(positions).sort();
  }, [allFreeAgents]);

  // Extract unique FA types for filter
  const availableFaTypes = useMemo(() => {
    const types = new Set(allFreeAgents.map(a => a.faType).filter(Boolean));
    return Array.from(types).sort();
  }, [allFreeAgents]);

  // Filtering Logic
  const filteredFreeAgents = useMemo(() => {
    return allFreeAgents.filter(agent => {
      const matchesTeam = selectedTeam === 'all' || agent.teamId === selectedTeam;
      const matchesPosition = selectedPosition === 'all' || agent.position === selectedPosition;
      const matchesFaType = selectedFaType === 'all' || agent.faType === selectedFaType;

      let matchesSignedStatus = true;
      if (selectedSignedStatus === 'unsigned') {
        matchesSignedStatus = !agent.signed2026Team || agent.signed2026Team.trim() === '';
      } else if (selectedSignedStatus === 'signed') {
        matchesSignedStatus = !!(agent.signed2026Team && agent.signed2026Team.trim() !== '');
      }

      return matchesTeam && matchesPosition && matchesFaType && matchesSignedStatus;
    });
  }, [allFreeAgents, selectedTeam, selectedPosition, selectedFaType, selectedSignedStatus]);

  // Sorting Logic
  const sortedFreeAgents = useMemo(() => {
    const sorted = [...filteredFreeAgents].sort((a, b) => {
      let aValue: number | string = a[sortKey];
      let bValue: number | string = b[sortKey];

      if (sortKey === 'name') {
        return sortDirection === 'asc'
          ? aValue.toString().localeCompare(bValue.toString())
          : bValue.toString().localeCompare(aValue.toString());
      }

      // Numeric comparison
      const aNum = typeof aValue === 'number' ? aValue : 0;
      const bNum = typeof bValue === 'number' ? bValue : 0;

      return sortDirection === 'desc' ? bNum - aNum : aNum - bNum;
    });

    return sorted;
  }, [filteredFreeAgents, sortKey, sortDirection]);

  // Pagination Logic
  const totalPages = Math.ceil(sortedFreeAgents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedFreeAgents = sortedFreeAgents.slice(startIndex, startIndex + itemsPerPage);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedTeam, selectedPosition, selectedFaType, selectedSignedStatus]);

  // Sort Handler
  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('desc');
    }
  };

  // Sort Indicator Component
  const SortIndicator = ({ column }: { column: SortKey }) => {
    if (sortKey !== column) return null;

    return (
      <span className="ml-1">
        {sortDirection === 'asc' ? '↑' : '↓'}
      </span>
    );
  };

  // Get Team Info
  const getTeamInfo = (teamId?: string) => {
    if (!teamId) return null;
    return allTeams.find(t => t.id === teamId);
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
              NFL Free Agency Tracker
            </h1>
            <p className="text-base sm:text-lg lg:text-xl xl:text-2xl opacity-90">
              Track free agents, signings, and player availability across the league
            </p>
          </div>
        </div>

        {/* Raptive Header Ad */}
        <div className="container mx-auto px-4 h-[120px] flex items-center justify-center">
          <div className="raptive-pfn-header-90 w-full h-full"></div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {loading ? (
            /* Loading State */
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="animate-pulse space-y-4">
                {[...Array(20)].map((_, i) => (
                  <div key={i} className="h-12 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          ) : error ? (
            /* Error State */
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h3 className="text-red-800 font-semibold mb-1">Failed to load free agents</h3>
                  <p className="text-red-600 text-sm">{error}</p>
                  <button
                    onClick={() => { setHasLoaded(false); setError(null); }}
                    className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                  >
                    Retry
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Filters */}
              <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Team Filter */}
                  <div>
                    <label htmlFor="fa-team-filter" className="block text-sm font-semibold text-gray-700 mb-2">Team</label>
                    <select
                      id="fa-team-filter"
                      value={selectedTeam}
                      onChange={e => setSelectedTeam(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0050A0] bg-white text-sm"
                    >
                      <option value="all">All Teams</option>
                      {allTeams.map(team => (
                        <option key={team.id} value={team.id}>{team.fullName}</option>
                      ))}
                    </select>
                  </div>

                  {/* Position Filter */}
                  <div>
                    <label htmlFor="fa-position-filter" className="block text-sm font-semibold text-gray-700 mb-2">Position</label>
                    <select
                      id="fa-position-filter"
                      value={selectedPosition}
                      onChange={e => setSelectedPosition(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0050A0] bg-white text-sm"
                    >
                      <option value="all">All Positions</option>
                      {availablePositions.map(position => (
                        <option key={position} value={position}>{position}</option>
                      ))}
                    </select>
                  </div>

                  {/* FA Type Filter */}
                  <div>
                    <label htmlFor="fa-type-filter" className="block text-sm font-semibold text-gray-700 mb-2">FA Type</label>
                    <select
                      id="fa-type-filter"
                      value={selectedFaType}
                      onChange={e => setSelectedFaType(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0050A0] bg-white text-sm"
                    >
                      <option value="all">All Types</option>
                      {availableFaTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  {/* Signed Status Filter */}
                  <div>
                    <label htmlFor="fa-status-filter" className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                    <select
                      id="fa-status-filter"
                      value={selectedSignedStatus}
                      onChange={e => setSelectedSignedStatus(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0050A0] bg-white text-sm"
                    >
                      <option value="all">All Status</option>
                      <option value="unsigned">Unsigned</option>
                      <option value="signed">Signed</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Table */}
              {paginatedFreeAgents.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                  <p className="text-gray-600">No free agents found matching your filters.</p>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead style={{ backgroundColor: '#0050A0' }}>
                        <tr>
                          <th
                            className="px-4 py-3 text-center text-xs font-bold text-white uppercase tracking-wider cursor-pointer hover:bg-[#003d7a]"
                            onClick={() => handleSort('rank')}
                          >
                            <div className="flex items-center justify-center">
                              Rank
                              <SortIndicator column="rank" />
                            </div>
                          </th>
                          <th
                            className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider cursor-pointer hover:bg-[#003d7a]"
                            onClick={() => handleSort('name')}
                          >
                            <div className="flex items-center">
                              Name
                              <SortIndicator column="name" />
                            </div>
                          </th>
                          <th scope="col" className="px-4 py-3 text-center text-xs font-bold text-white uppercase tracking-wider">
                            Position
                          </th>
                          <th scope="col" className="px-4 py-3 text-center text-xs font-bold text-white uppercase tracking-wider">
                            2025 Team
                          </th>
                          <th scope="col" className="px-4 py-3 text-center text-xs font-bold text-white uppercase tracking-wider">
                            FA Type
                          </th>
                          <th
                            className="px-4 py-3 text-center text-xs font-bold text-white uppercase tracking-wider cursor-pointer hover:bg-[#003d7a]"
                            onClick={() => handleSort('age')}
                          >
                            <div className="flex items-center justify-center">
                              Age
                              <SortIndicator column="age" />
                            </div>
                          </th>
                          <th
                            className="px-4 py-3 text-center text-xs font-bold text-white uppercase tracking-wider cursor-pointer hover:bg-[#003d7a]"
                            onClick={() => handleSort('pfsn2025Impact')}
                          >
                            <div className="flex items-center justify-center">
                              Impact Grade
                              <SortIndicator column="pfsn2025Impact" />
                            </div>
                          </th>
                          <th scope="col" className="px-4 py-3 text-center text-xs font-bold text-white uppercase tracking-wider">
                            2026 Team
                          </th>
                          <th
                            className="px-4 py-3 text-center text-xs font-bold text-white uppercase tracking-wider cursor-pointer hover:bg-[#003d7a]"
                            onClick={() => handleSort('positionRank')}
                          >
                            <div className="flex items-center justify-center">
                              Pos Rank
                              <SortIndicator column="positionRank" />
                            </div>
                          </th>
                          <th scope="col" className="px-4 py-3 text-center text-xs font-bold text-white uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {paginatedFreeAgents.map((agent, index) => {
                          const teamInfo = getTeamInfo(mapTeamNameToId(agent.current2025Team));
                          const signed2026TeamInfo = getTeamInfo(mapTeamNameToId(agent.signed2026Team));
                          const isUnsigned = !agent.signed2026Team || agent.signed2026Team.trim() === '';

                          return (
                            <tr key={`${agent.rank}-${agent.name}`} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-center">
                                {agent.rank}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                                <Link
                                  href={`/players/${generatePlayerSlug(agent.name)}`}
                                  className="text-[#0050A0] hover:underline"
                                >
                                  {agent.name}
                                </Link>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                                <span className={`inline-block px-2 py-1 rounded text-xs font-semibold border ${getPositionColor(agent.position)}`}>
                                  {agent.position}
                                </span>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm">
                                {teamInfo ? (
                                  <Link href={`/teams/${teamInfo.id}`} className="flex items-center justify-center gap-2 hover:opacity-80 transition-opacity">
                                    <img src={teamInfo.logoUrl} alt={teamInfo.abbreviation} className="w-6 h-6 sm:w-8 sm:h-8" />
                                    <span className="font-medium text-[#0050A0]">{teamInfo.abbreviation}</span>
                                  </Link>
                                ) : agent.current2025Team ? (
                                  <span className="text-gray-500 text-xs block text-center">{agent.current2025Team}</span>
                                ) : (
                                  <span className="text-gray-400 block text-center">—</span>
                                )}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 text-center">
                                {agent.faType}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 text-center">
                                {agent.age}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-center">
                                {agent.pfsn2025Impact > 0 ? (
                                  <a
                                    href={getPositionImpactUrl(agent.position)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`hover:opacity-80 transition-opacity ${agent.pfsn2025Impact >= 80 ? 'text-green-600' : agent.pfsn2025Impact >= 70 ? 'text-blue-600' : 'text-gray-700'}`}
                                  >
                                    {agent.pfsn2025Impact.toFixed(1)}
                                  </a>
                                ) : (
                                  <span className="text-gray-400">—</span>
                                )}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm">
                                {signed2026TeamInfo ? (
                                  <Link href={`/teams/${signed2026TeamInfo.id}`} className="flex items-center justify-center gap-2 hover:opacity-80 transition-opacity">
                                    <img src={signed2026TeamInfo.logoUrl} alt={signed2026TeamInfo.abbreviation} className="w-6 h-6 sm:w-8 sm:h-8" />
                                    <span className="font-medium text-[#0050A0]">{signed2026TeamInfo.abbreviation}</span>
                                  </Link>
                                ) : isUnsigned ? (
                                  <span className="text-gray-400 block text-center">—</span>
                                ) : (
                                  <span className="text-gray-500 text-xs block text-center">{agent.signed2026Team}</span>
                                )}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 text-center">
                                {agent.positionRank}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                                {isUnsigned ? (
                                  <span className="inline-block px-2 py-1 rounded text-xs font-semibold bg-red-100 text-red-700 border border-red-200">
                                    Unsigned
                                  </span>
                                ) : (
                                  <span className="inline-block px-2 py-1 rounded text-xs font-semibold bg-green-100 text-green-700 border border-green-200">
                                    Signed
                                  </span>
                                )}
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
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
