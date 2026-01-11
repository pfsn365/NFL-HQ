'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import NFLTeamsSidebar from '@/components/NFLTeamsSidebar';
import { getAllTeams } from '@/data/teams';
import { getApiPath } from '@/utils/api';
import SkeletonLoader from '@/components/SkeletonLoader';

interface RosterPlayer {
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
}

interface TeamRoster {
  teamId: string;
  roster: {
    activeRoster: RosterPlayer[];
    practiceSquad: RosterPlayer[];
    injuredReserve: RosterPlayer[];
    physicallyUnableToPerform: RosterPlayer[];
    nonFootballInjuryReserve: RosterPlayer[];
    suspended: RosterPlayer[];
    exempt: RosterPlayer[];
  };
}

interface PlayerWithTeam extends RosterPlayer {
  teamId: string;
  teamName: string;
  teamLogo: string;
  teamAbbr: string;
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

const OL_POSITIONS = ['OT', 'OG', 'C', 'T', 'G', 'OL', 'OC'];
const DL_POSITIONS = ['DE', 'DT', 'NT', 'EDGE', 'DL'];
const S_POSITIONS = ['S', 'FS', 'SS', 'SAF'];

function getPositionColor(position: string): string {
  const pos = position.toUpperCase();
  if (pos === 'QB') return 'bg-purple-100 text-purple-700';
  if (pos === 'RB' || pos === 'FB') return 'bg-green-100 text-green-700';
  if (pos === 'WR') return 'bg-blue-100 text-blue-700';
  if (pos === 'TE') return 'bg-orange-100 text-orange-700';
  if (OL_POSITIONS.includes(pos)) return 'bg-yellow-100 text-yellow-700';
  if (DL_POSITIONS.includes(pos)) return 'bg-red-100 text-red-700';
  if (pos === 'LB' || pos === 'ILB' || pos === 'MLB' || pos === 'OLB') return 'bg-indigo-100 text-indigo-700';
  if (pos === 'CB') return 'bg-teal-100 text-teal-700';
  if (S_POSITIONS.includes(pos)) return 'bg-cyan-100 text-cyan-700';
  return 'bg-gray-100 text-gray-700';
}

export default function PlayersDirectoryClient() {
  const allTeams = getAllTeams();
  const [allPlayers, setAllPlayers] = useState<PlayerWithTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [selectedPosition, setSelectedPosition] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(24);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function fetchAllRosters() {
      setLoading(true);
      setError(null);

      try {
        const teamPromises = allTeams.map(async (team) => {
          try {
            const response = await fetch(getApiPath(`nfl/teams/api/roster/${team.id}`));
            if (!response.ok) return null;
            const data: TeamRoster = await response.json();
            return { team, data };
          } catch {
            return null;
          }
        });

        const results = await Promise.all(teamPromises);
        const players: PlayerWithTeam[] = [];

        for (const result of results) {
          if (!result) continue;
          const { team, data } = result;

          const allRosterPlayers = [
            ...data.roster.activeRoster,
            ...data.roster.practiceSquad,
            ...data.roster.injuredReserve,
            ...data.roster.physicallyUnableToPerform,
            ...data.roster.nonFootballInjuryReserve,
            ...data.roster.suspended,
            ...data.roster.exempt,
          ];

          for (const player of allRosterPlayers) {
            players.push({
              ...player,
              teamId: team.id,
              teamName: team.fullName,
              teamLogo: team.logoUrl,
              teamAbbr: team.abbreviation,
            });
          }
        }

        // Sort by name
        players.sort((a, b) => a.name.localeCompare(b.name));
        setAllPlayers(players);
      } catch (err) {
        console.error('Error fetching rosters:', err);
        setError('Failed to load player data. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    fetchAllRosters();
  }, [allTeams]);

  // Filter players
  const filteredPlayers = useMemo(() => {
    return allPlayers.filter((player) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = player.name.toLowerCase().includes(query);
        const matchesTeam = player.teamName.toLowerCase().includes(query) || player.teamAbbr.toLowerCase().includes(query);
        const matchesPosition = player.position.toLowerCase().includes(query);
        if (!matchesName && !matchesTeam && !matchesPosition) return false;
      }

      // Team filter
      if (selectedTeam !== 'all' && player.teamId !== selectedTeam) return false;

      // Position filter
      if (selectedPosition !== 'all') {
        const pos = player.position.toUpperCase();
        if (selectedPosition === 'OL' && !OL_POSITIONS.includes(pos)) return false;
        if (selectedPosition === 'DL' && !DL_POSITIONS.includes(pos)) return false;
        if (selectedPosition === 'S' && !S_POSITIONS.includes(pos)) return false;
        if (selectedPosition !== 'OL' && selectedPosition !== 'DL' && selectedPosition !== 'S') {
          if (pos !== selectedPosition && !pos.startsWith(selectedPosition)) return false;
        }
      }

      return true;
    });
  }, [allPlayers, searchQuery, selectedTeam, selectedPosition]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredPlayers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const displayedPlayers = filteredPlayers.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedTeam, selectedPosition, searchQuery]);

  const handleImageError = (slug: string) => {
    setImageErrors(prev => new Set(prev).add(slug));
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
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
      <main className="flex-1 lg:ml-64 min-w-0">
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

        {/* Content */}
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div>
                <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                  Search Players
                </label>
                <input
                  type="text"
                  id="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, team, or position..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Team Filter */}
              <div>
                <label htmlFor="team" className="block text-sm font-medium text-gray-700 mb-1">
                  Team
                </label>
                <select
                  id="team"
                  value={selectedTeam}
                  onChange={(e) => setSelectedTeam(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Teams</option>
                  {allTeams.map((team) => (
                    <option key={team.id} value={team.id}>{team.fullName}</option>
                  ))}
                </select>
              </div>

              {/* Position Filter */}
              <div>
                <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-1">
                  Position
                </label>
                <select
                  id="position"
                  value={selectedPosition}
                  onChange={(e) => setSelectedPosition(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {POSITIONS.map((pos) => (
                    <option key={pos.value} value={pos.value}>{pos.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Results Count */}
          <div className="mb-4 flex items-center justify-between text-sm text-gray-600">
            <div>
              {loading ? (
                'Loading players...'
              ) : filteredPlayers.length > 0 ? (
                `Showing ${startIndex + 1}-${Math.min(endIndex, filteredPlayers.length)} of ${filteredPlayers.length} players`
              ) : (
                '0 players found'
              )}
            </div>
            {!loading && filteredPlayers.length > 0 && (
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-700">Per page:</label>
                <select
                  value={itemsPerPage}
                  onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                  className="px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#0050A0] text-sm bg-white"
                >
                  <option value={12}>12</option>
                  <option value={24}>24</option>
                  <option value={48}>48</option>
                  <option value={96}>96</option>
                </select>
              </div>
            )}
          </div>

          {/* Loading State */}
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <SkeletonLoader className="w-16 h-16 rounded-full mx-auto mb-3" />
                  <SkeletonLoader className="h-5 w-32 mx-auto mb-2" />
                  <SkeletonLoader className="h-4 w-24 mx-auto" />
                </div>
              ))}
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
              {error}
            </div>
          )}

          {/* Players Grid */}
          {!loading && !error && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {displayedPlayers.map((player) => (
                  <Link
                    key={`${player.teamId}-${player.slug}`}
                    href={`/players/${player.slug}`}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md hover:border-gray-300 transition-all"
                  >
                    {/* Headshot */}
                    <div className="flex justify-center mb-3">
                      {!imageErrors.has(player.slug) ? (
                        <Image
                          src={`https://staticd.profootballnetwork.com/skm/assets/player-images/nfl/${player.slug}.png`}
                          alt={player.name}
                          width={64}
                          height={64}
                          className="w-16 h-16 rounded-full object-cover bg-gray-100"
                          onError={() => handleImageError(player.slug)}
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-semibold text-lg">
                          {getInitials(player.name)}
                        </div>
                      )}
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
                    <div className="flex items-center justify-center gap-2 mt-3 pt-3 border-t border-gray-100">
                      <Image
                        src={player.teamLogo}
                        alt={player.teamName}
                        width={20}
                        height={20}
                        className="w-5 h-5"
                      />
                      <span className="text-sm text-gray-600">{player.teamAbbr}</span>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 px-4 py-3 flex items-center justify-between">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <span className="flex items-center text-sm text-gray-700">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Page <span className="font-medium">{currentPage}</span> of{' '}
                        <span className="font-medium">{totalPages}</span>
                      </p>
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

              {/* No Results */}
              {filteredPlayers.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  No players found matching your criteria
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
