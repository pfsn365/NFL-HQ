'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Pagination from '@/components/Pagination';
import { getAllTeams } from '@/data/teams';
import { getApiPath } from '@/utils/api';
import { getPositionColor } from '@/utils/colorHelpers';

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
  // Deduplicate by name + position + team to prevent duplicate entries
  // while allowing players with same name but different positions/teams
  const seenKeys = new Set<string>();
  const uniqueData = rawData.filter(agent => {
    const key = `${agent.Name?.trim().toLowerCase()}-${agent.Position?.trim().toLowerCase()}-${agent['2025 Team']?.trim().toLowerCase()}`;
    if (seenKeys.has(key)) return false;
    seenKeys.add(key);
    return true;
  });

  return uniqueData.map((agent, index) => {
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
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search query (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Sorting States
  const [sortKey, setSortKey] = useState<SortKey>('rank');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Load items per page from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('free_agency_items_per_page');
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
    localStorage.setItem('free_agency_items_per_page', count.toString());
    setItemsPerPage(count);
    setCurrentPage(1);
  };

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

  // Extract unique positions for filter with custom order
  const availablePositions = useMemo(() => {
    const positionOrder = ['QB', 'RB', 'FB', 'WR', 'TE', 'OT', 'OG', 'OC', 'OL', 'DT', 'EDGE', 'LB', 'CB', 'S', 'K', 'P', 'LS'];
    const positions = new Set(allFreeAgents.map(a => a.position).filter(Boolean));
    return Array.from(positions).sort((a, b) => {
      const indexA = positionOrder.indexOf(a);
      const indexB = positionOrder.indexOf(b);
      // If position not in order list, put it at the end
      if (indexA === -1 && indexB === -1) return a.localeCompare(b);
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });
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
      const matchesSearch = debouncedSearch.trim() === '' || agent.name.toLowerCase().includes(debouncedSearch.toLowerCase());

      let matchesSignedStatus = true;
      if (selectedSignedStatus === 'unsigned') {
        matchesSignedStatus = !agent.signed2026Team || agent.signed2026Team.trim() === '';
      } else if (selectedSignedStatus === 'signed') {
        matchesSignedStatus = !!(agent.signed2026Team && agent.signed2026Team.trim() !== '');
      }

      return matchesTeam && matchesPosition && matchesFaType && matchesSignedStatus && matchesSearch;
    });
  }, [allFreeAgents, selectedTeam, selectedPosition, selectedFaType, selectedSignedStatus, debouncedSearch]);

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
  }, [selectedTeam, selectedPosition, selectedFaType, selectedSignedStatus, searchQuery]);

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
              NFL Free Agency Tracker
            </h1>
            <p className="text-lg opacity-90 font-medium">
              Track free agents, signings, and player availability across the league
            </p>
          </div>
        </header>

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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  {/* Team Filter */}
                  <div>
                    <label htmlFor="fa-team-filter" className="block text-sm font-semibold text-gray-700 mb-2">Team</label>
                    <select
                      id="fa-team-filter"
                      value={selectedTeam}
                      onChange={e => setSelectedTeam(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0050A0] bg-white text-sm cursor-pointer"
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0050A0] bg-white text-sm cursor-pointer"
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0050A0] bg-white text-sm cursor-pointer"
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0050A0] bg-white text-sm cursor-pointer"
                    >
                      <option value="all">All Status</option>
                      <option value="unsigned">Unsigned</option>
                      <option value="signed">Signed</option>
                    </select>
                  </div>

                  {/* Player Search */}
                  <div>
                    <label htmlFor="fa-search" className="block text-sm font-semibold text-gray-700 mb-2">Search</label>
                    <div className="relative">
                      <input
                        id="fa-search"
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Search players..."
                        className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0050A0] bg-white text-sm"
                      />
                      <svg
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
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
                            className="py-3 px-3 sm:px-4 text-center text-xs font-semibold text-white cursor-pointer hover:bg-[#003A75] select-none"
                            onClick={() => handleSort('rank')}
                          >
                            Rank
                            <SortIndicator column="rank" />
                          </th>
                          <th
                            className="py-3 px-3 sm:px-4 text-left text-xs font-semibold text-white cursor-pointer hover:bg-[#003A75] select-none"
                            onClick={() => handleSort('name')}
                          >
                            Name
                            <SortIndicator column="name" />
                          </th>
                          <th scope="col" className="py-3 px-3 sm:px-4 text-center text-xs font-semibold text-white">
                            Position
                          </th>
                          <th scope="col" className="py-3 px-3 sm:px-4 text-center text-xs font-semibold text-white">
                            2025 Team
                          </th>
                          <th scope="col" className="py-3 px-3 sm:px-4 text-center text-xs font-semibold text-white">
                            FA Type
                          </th>
                          <th
                            className="py-3 px-3 sm:px-4 text-center text-xs font-semibold text-white cursor-pointer hover:bg-[#003A75] select-none"
                            onClick={() => handleSort('age')}
                          >
                            Age
                            <SortIndicator column="age" />
                          </th>
                          <th
                            className="py-3 px-3 sm:px-4 text-center text-xs font-semibold text-white cursor-pointer hover:bg-[#003A75] select-none"
                            onClick={() => handleSort('pfsn2025Impact')}
                          >
                            Impact Grade
                            <SortIndicator column="pfsn2025Impact" />
                          </th>
                          <th scope="col" className="py-3 px-3 sm:px-4 text-center text-xs font-semibold text-white">
                            2026 Team
                          </th>
                          <th
                            className="py-3 px-3 sm:px-4 text-center text-xs font-semibold text-white cursor-pointer hover:bg-[#003A75] select-none"
                            onClick={() => handleSort('positionRank')}
                          >
                            Pos Rank
                            <SortIndicator column="positionRank" />
                          </th>
                          <th scope="col" className="py-3 px-3 sm:px-4 text-center text-xs font-semibold text-white">
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
                                  <Link href={`/teams/${teamInfo.id}/depth-chart`} className="flex items-center justify-center gap-2 hover:opacity-80 transition-opacity">
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
                  {sortedFreeAgents.length > 0 && (
                    <div className="bg-gray-50 px-4 border-t border-gray-200">
                      <Pagination
                        totalItems={sortedFreeAgents.length}
                        currentPage={currentPage}
                        onPageChange={handlePageChange}
                        itemsPerPage={itemsPerPage}
                        onItemsPerPageChange={handleItemsPerPageChange}
                        storageKey="free_agency_items_per_page"
                      />
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>
  );
}
