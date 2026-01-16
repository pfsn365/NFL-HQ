'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import NFLTeamsSidebar from '@/components/NFLTeamsSidebar';
import { getAllTeams } from '@/data/teams';
import { getApiPath } from '@/utils/api';
import SkeletonLoader from '@/components/SkeletonLoader';

interface PlayerWithTeam {
  name: string;
  slug: string;
  jerseyNumber: number;
  position: string;
  positionFull: string;
  age: number;
  height: string;
  weight: number;
  college: string;
  experience: number;
  status: string;
  teamId: string;
  teamName: string;
  teamLogo: string;
  teamAbbr: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  totalPlayers: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

const POSITIONS = [
  { value: 'all', label: 'All Positions' },
  { value: 'QB', label: 'Quarterback' },
  { value: 'RB', label: 'Running Back' },
  { value: 'WR', label: 'Wide Receiver' },
  { value: 'TE', label: 'Tight End' },
  { value: 'OL', label: 'Offensive Line' },
  { value: 'DL', label: 'Defensive Line' },
  { value: 'LB', label: 'Linebacker' },
  { value: 'CB', label: 'Cornerback' },
  { value: 'S', label: 'Safety' },
];

function getPositionColor(position: string): string {
  const pos = position.toUpperCase();
  if (pos === 'QB') return 'bg-purple-100 text-purple-700';
  if (pos === 'RB' || pos === 'FB') return 'bg-green-100 text-green-700';
  if (pos === 'WR') return 'bg-blue-100 text-blue-700';
  if (pos === 'TE') return 'bg-orange-100 text-orange-700';
  if (['OT', 'OG', 'C', 'T', 'G', 'OL', 'OC'].includes(pos)) return 'bg-yellow-100 text-yellow-700';
  if (['DE', 'DT', 'NT', 'EDGE', 'DL'].includes(pos)) return 'bg-red-100 text-red-700';
  if (pos === 'LB' || pos === 'ILB' || pos === 'MLB' || pos === 'OLB') return 'bg-indigo-100 text-indigo-700';
  if (pos === 'CB') return 'bg-teal-100 text-teal-700';
  if (['S', 'FS', 'SS', 'SAF'].includes(pos)) return 'bg-cyan-100 text-cyan-700';
  return 'bg-gray-100 text-gray-700';
}

export default function PlayersDirectoryClient() {
  const allTeams = getAllTeams();
  const [players, setPlayers] = useState<PlayerWithTeam[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [selectedPosition, setSelectedPosition] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(24);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  // Debounced search value
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1); // Reset to page 1 when search changes
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedTeam, selectedPosition, itemsPerPage]);

  // Fetch players from API
  const fetchPlayers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
      });

      if (debouncedSearch) params.set('search', debouncedSearch);
      if (selectedTeam !== 'all') params.set('team', selectedTeam);
      if (selectedPosition !== 'all') params.set('position', selectedPosition);

      const response = await fetch(getApiPath(`api/nfl/players?${params.toString()}`));

      if (!response.ok) {
        throw new Error('Failed to fetch players');
      }

      const data = await response.json();
      setPlayers(data.players);
      setPagination(data.pagination);
    } catch (err) {
      console.error('Error fetching players:', err);
      setError('Failed to load player data. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, debouncedSearch, selectedTeam, selectedPosition]);

  useEffect(() => {
    fetchPlayers();
  }, [fetchPlayers]);

  const handleImageError = (slug: string) => {
    setImageErrors(prev => new Set(prev).add(slug));
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  const totalPages = pagination?.totalPages || 1;

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
              NFL Players
            </h1>
            <p className="text-base sm:text-lg lg:text-xl xl:text-2xl opacity-90">
              Browse player profiles with bio information and PFSN Impact Grades
            </p>
          </div>
        </div>

        {/* Raptive Header Ad */}
        <div className="container mx-auto px-4 h-[120px] flex items-center justify-center">
          <div className="raptive-pfn-header-90 w-full h-full"></div>
        </div>

        {/* Content */}
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl">
          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div>
                <label htmlFor="search" className="block text-sm font-semibold text-gray-700 mb-2">
                  Search Players
                </label>
                <input
                  type="text"
                  id="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, team, or position..."
                  className="w-full px-3 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Team Filter */}
              <div>
                <label htmlFor="team" className="block text-sm font-semibold text-gray-700 mb-2">
                  Team
                </label>
                <select
                  id="team"
                  value={selectedTeam}
                  onChange={(e) => setSelectedTeam(e.target.value)}
                  className="w-full px-3 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                >
                  <option value="all">All Teams</option>
                  {allTeams.map((team) => (
                    <option key={team.id} value={team.id}>{team.fullName}</option>
                  ))}
                </select>
              </div>

              {/* Position Filter */}
              <div>
                <label htmlFor="position" className="block text-sm font-semibold text-gray-700 mb-2">
                  Position
                </label>
                <select
                  id="position"
                  value={selectedPosition}
                  onChange={(e) => setSelectedPosition(e.target.value)}
                  className="w-full px-3 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                >
                  {POSITIONS.map((pos) => (
                    <option key={pos.value} value={pos.value}>{pos.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Players Container */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Loading State */}
            {loading && (
              <div className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="bg-gray-50 rounded-lg p-4">
                      <SkeletonLoader className="w-16 h-16 rounded-full mx-auto mb-3" />
                      <SkeletonLoader className="h-5 w-32 mx-auto mb-2" />
                      <SkeletonLoader className="h-4 w-24 mx-auto" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Error State */}
            {error && !loading && (
              <div className="p-8 text-center">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 inline-block">
                  {error}
                </div>
              </div>
            )}

            {/* Players Grid */}
            {!loading && !error && (
              <>
                {players.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    No players found matching your criteria
                  </div>
                ) : (
                  <div className="p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {players.map((player) => (
                        <Link
                          key={`${player.teamId}-${player.slug}`}
                          href={`/players/${player.slug}`}
                          className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 hover:shadow-md transition-all"
                        >
                          {/* Headshot */}
                          <div className="flex justify-center mb-3">
                            <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                              {!imageErrors.has(player.slug) ? (
                                <img
                                  src={`https://staticd.profootballnetwork.com/skm/assets/player-images/nfl/${player.slug}.png`}
                                  alt={player.name}
                                  className="w-full h-full object-cover scale-125 translate-y-1"
                                  onError={() => handleImageError(player.slug)}
                                />
                              ) : (
                                <span className="text-gray-500 font-semibold text-lg">
                                  {getInitials(player.name)}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Name and Jersey */}
                          <div className="text-center">
                            <h3 className="font-semibold text-gray-900 truncate">
                              {player.name}
                            </h3>
                            <div className="flex items-center justify-center gap-2 mt-1">
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${getPositionColor(player.position)}`}>
                                {player.position}
                              </span>
                              <span className="text-gray-500 text-sm">#{player.jerseyNumber}</span>
                            </div>
                          </div>

                          {/* Team */}
                          <div className="flex items-center justify-center gap-2 mt-3 pt-3 border-t border-gray-200">
                            <img
                              src={player.teamLogo}
                              alt={player.teamName}
                              className="w-5 h-5"
                            />
                            <span className="text-sm text-gray-600">{player.teamAbbr}</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pagination Controls - matching injury report style */}
                {pagination && totalPages > 1 && (
                  <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                    <div className="flex-1 flex justify-between sm:hidden">
                      <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 active:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 active:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
                            onChange={e => setItemsPerPage(Number(e.target.value))}
                            className="px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#0050A0] text-sm bg-white cursor-pointer"
                          >
                            <option value={24}>24</option>
                            <option value={48}>48</option>
                            <option value={96}>96</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                          <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 active:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium cursor-pointer ${
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
                            className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 active:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
