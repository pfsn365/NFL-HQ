'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import Pagination from '@/components/Pagination';
import { getAllTeams } from '@/data/teams';
import { getApiPath } from '@/utils/api';
import { getPositionColor } from '@/utils/colorHelpers';
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

  // Load items per page from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('players_directory_items_per_page');
    if (stored) {
      const parsed = parseInt(stored, 10);
      if ([24, 48, 96].includes(parsed)) {
        setItemsPerPage(parsed);
      }
    }
  }, []);

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (count: number) => {
    localStorage.setItem('players_directory_items_per_page', count.toString());
    setItemsPerPage(count);
    setCurrentPage(1);
  };

  // Debounced search value
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const abortControllerRef = useRef<AbortController | null>(null);

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
  useEffect(() => {
    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    async function fetchPlayers() {
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

        const response = await fetch(
          getApiPath(`api/nfl/players?${params.toString()}`),
          { signal: abortControllerRef.current?.signal }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch players');
        }

        const data = await response.json();
        setPlayers(data.players);
        setPagination(data.pagination);
      } catch (err) {
        // Ignore abort errors
        if (err instanceof Error && err.name === 'AbortError') return;
        console.error('Error fetching players:', err);
        setError('Failed to load player data. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    fetchPlayers();

    // Cleanup on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [currentPage, itemsPerPage, debouncedSearch, selectedTeam, selectedPosition]);

  const handleImageError = (slug: string) => {
    setImageErrors(prev => new Set(prev).add(slug));
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  const totalPages = pagination?.totalPages || 1;

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
              NFL Players
            </h1>
            <p className="text-lg opacity-90 font-medium">
              Browse player profiles with bio information and PFSN Impact Grades
            </p>
          </div>
        </header>

        {/* Raptive Header Ad */}
        <div className="container mx-auto px-4 h-[120px] flex items-center justify-center">
          <div className="raptive-pfn-header-90 w-full h-full"></div>
        </div>

        {/* Content */}
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Browse All Players</h2>
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
                  className="w-full px-3 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#0050A0] focus:border-[#0050A0]"
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
                  className="w-full px-3 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#0050A0] focus:border-[#0050A0] cursor-pointer"
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
                  className="w-full px-3 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#0050A0] focus:border-[#0050A0] cursor-pointer"
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

                {/* Pagination Controls */}
                {pagination && pagination.totalPlayers > 0 && (
                  <div className="bg-gray-50 px-4 border-t border-gray-200">
                    <Pagination
                      totalItems={pagination.totalPlayers}
                      currentPage={currentPage}
                      onPageChange={handlePageChange}
                      itemsPerPage={itemsPerPage}
                      onItemsPerPageChange={handleItemsPerPageChange}
                      storageKey="players_directory_items_per_page"
                      itemsPerPageOptions={[24, 48, 96]}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
  );
}
