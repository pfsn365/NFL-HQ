'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';

import { getAllTeams } from '@/data/teams';
import NFLTeamsSidebar from '@/components/NFLTeamsSidebar';
import { getApiPath } from '@/utils/api';
import SkeletonLoader from '@/components/SkeletonLoader';

interface StatLeader {
  playerId: number;
  playerSlug: string;
  name: string;
  value: string;
  teamId: string;
  gamesPlayed: number;
  position: string;
}

interface PlayerFullStats {
  playerId: number;
  name: string;
  teamId: string;
  gamesPlayed: number;
  position: string;
  // Passing
  passingYards: string;
  passingTDs: string;
  interceptions: string;
  completionPct: string;
  passerRating: string;
  // Rushing
  rushingYards: string;
  rushingTDs: string;
  yardsPerCarry: string;
  rushingAttempts: string;
  // Receiving
  receivingYards: string;
  receptions: string;
  receivingTDs: string;
  yardsPerReception: string;
  // Defense
  tackles: string;
  sacks: string;
  defensiveInterceptions: string;
  forcedFumbles: string;
}

interface StatLeaders {
  passingYards: StatLeader[];
  passingTDs: StatLeader[];
  rushingYards: StatLeader[];
  rushingTDs: StatLeader[];
  receivingYards: StatLeader[];
  receptions: StatLeader[];
  tackles: StatLeader[];
  sacks: StatLeader[];
  interceptions: StatLeader[];
}

type StatCategory = 'passingYards' | 'passingTDs' | 'rushingYards' | 'rushingTDs' | 'receivingYards' | 'receptions' | 'tackles' | 'sacks' | 'interceptions';

const STAT_CATEGORIES: { key: StatCategory; label: string; abbr: string; format?: (val: string) => string }[] = [
  { key: 'passingYards', label: 'Passing Yards', abbr: 'PASS YDS' },
  { key: 'passingTDs', label: 'Passing Touchdowns', abbr: 'PASS TD' },
  { key: 'rushingYards', label: 'Rushing Yards', abbr: 'RUSH YDS' },
  { key: 'rushingTDs', label: 'Rushing Touchdowns', abbr: 'RUSH TD' },
  { key: 'receivingYards', label: 'Receiving Yards', abbr: 'REC YDS' },
  { key: 'receptions', label: 'Receptions', abbr: 'REC' },
  { key: 'tackles', label: 'Tackles', abbr: 'TACK' },
  { key: 'sacks', label: 'Sacks', abbr: 'SACK' },
  { key: 'interceptions', label: 'Interceptions', abbr: 'INT' },
];

export default function StatsPage() {
  const allTeams = getAllTeams();
  const [statLeaders, setStatLeaders] = useState<StatLeaders | null>(null);
  const [allPlayerStats, setAllPlayerStats] = useState<PlayerFullStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<StatCategory>('passingYards');

  // Filter state
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [displayLimit, setDisplayLimit] = useState(25);

  // Modal state
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerFullStats | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Reset display limit when team or category changes
  useEffect(() => {
    setDisplayLimit(25);
  }, [selectedTeam, activeCategory]);

  // Fetch stat leaders
  useEffect(() => {
    async function fetchStatLeaders() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(getApiPath('api/nfl/stat-leaders?season=2025&limit=100&includeAllStats=true'));

        if (!response.ok) {
          console.error('API Response Status:', response.status, response.statusText);
          throw new Error('Failed to fetch stat leaders');
        }

        const data = await response.json();
        console.log('Stat Leaders Data:', data);
        setStatLeaders(data.data);
        if (data.allPlayerStats) {
          setAllPlayerStats(data.allPlayerStats);
        }
      } catch (err) {
        console.error('Error fetching stat leaders:', err);
        setError('Failed to load stat leaders. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    fetchStatLeaders();
  }, []);

  const getTeamInfo = (teamId: string) => {
    return allTeams.find(t => t.id === teamId);
  };

  // Get color for position badge
  const getPositionColor = (position: string) => {
    const pos = position.toUpperCase();
    // Quarterbacks
    if (pos === 'QB') {
      return 'bg-purple-100 text-purple-700 border-purple-200';
    }
    // Running Backs
    else if (pos === 'RB' || pos === 'FB') {
      return 'bg-green-100 text-green-700 border-green-200';
    }
    // Wide Receivers / Tight Ends
    else if (pos === 'WR' || pos === 'TE') {
      return 'bg-blue-100 text-blue-700 border-blue-200';
    }
    // Offensive Line
    else if (pos === 'OT' || pos === 'OG' || pos === 'C' || pos === 'OL') {
      return 'bg-amber-100 text-amber-700 border-amber-200';
    }
    // Defensive Line
    else if (pos === 'DE' || pos === 'DT' || pos === 'NT' || pos === 'DL') {
      return 'bg-red-100 text-red-700 border-red-200';
    }
    // Linebackers
    else if (pos === 'LB' || pos === 'ILB' || pos === 'OLB' || pos === 'MLB') {
      return 'bg-orange-100 text-orange-700 border-orange-200';
    }
    // Defensive Backs
    else if (pos === 'CB' || pos === 'S' || pos === 'FS' || pos === 'SS' || pos === 'DB') {
      return 'bg-cyan-100 text-cyan-700 border-cyan-200';
    }
    // Special Teams
    else if (pos === 'K' || pos === 'P' || pos === 'LS') {
      return 'bg-pink-100 text-pink-700 border-pink-200';
    }
    return 'bg-gray-100 text-gray-700 border-gray-200';
  };

  // Filter players based on search and team selection
  const filteredLeaders = useMemo(() => {
    if (!statLeaders) return null;

    // If a specific team is selected, show all players from that team sorted by category
    if (selectedTeam !== 'all') {
      const teamPlayers = allPlayerStats.filter(player => player.teamId === selectedTeam);

      // Helper to sort players by a specific stat
      const sortByCategory = (category: StatCategory): StatLeader[] => {
        const statKey = {
          'passingYards': 'passingYards',
          'passingTDs': 'passingTDs',
          'rushingYards': 'rushingYards',
          'rushingTDs': 'rushingTDs',
          'receivingYards': 'receivingYards',
          'receptions': 'receptions',
          'tackles': 'tackles',
          'sacks': 'sacks',
          'interceptions': 'defensiveInterceptions',
        }[category] as keyof PlayerFullStats;

        return [...teamPlayers]
          .sort((a, b) => {
            const aVal = parseFloat(String(a[statKey]) || '0');
            const bVal = parseFloat(String(b[statKey]) || '0');
            return bVal - aVal;
          })
          .map((player, index) => ({
            playerId: player.playerId,
            playerSlug: '', // Not needed for display
            name: player.name,
            value: String(player[statKey]),
            teamId: player.teamId,
            gamesPlayed: player.gamesPlayed,
            position: player.position,
          }));
      };

      return {
        passingYards: sortByCategory('passingYards'),
        passingTDs: sortByCategory('passingTDs'),
        rushingYards: sortByCategory('rushingYards'),
        rushingTDs: sortByCategory('rushingTDs'),
        receivingYards: sortByCategory('receivingYards'),
        receptions: sortByCategory('receptions'),
        tackles: sortByCategory('tackles'),
        sacks: sortByCategory('sacks'),
        interceptions: sortByCategory('interceptions'),
      };
    }

    // Show league-wide leaders, limited by displayLimit
    const limitPlayers = (players: StatLeader[]) => {
      return players.slice(0, displayLimit);
    };

    return {
      passingYards: limitPlayers(statLeaders.passingYards),
      passingTDs: limitPlayers(statLeaders.passingTDs),
      rushingYards: limitPlayers(statLeaders.rushingYards),
      rushingTDs: limitPlayers(statLeaders.rushingTDs),
      receivingYards: limitPlayers(statLeaders.receivingYards),
      receptions: limitPlayers(statLeaders.receptions),
      tackles: limitPlayers(statLeaders.tackles),
      sacks: limitPlayers(statLeaders.sacks),
      interceptions: limitPlayers(statLeaders.interceptions),
    };
  }, [statLeaders, allPlayerStats, selectedTeam, displayLimit]);

  // Open player modal
  const openPlayerModal = (playerId: number) => {
    const playerStats = allPlayerStats.find(p => p.playerId === playerId);
    if (playerStats) {
      setSelectedPlayer(playerStats);
      setIsModalOpen(true);
    }
  };

  // Close player modal
  const closePlayerModal = () => {
    setIsModalOpen(false);
    setSelectedPlayer(null);
  };

  const activeCategoryInfo = STAT_CATEGORIES.find(c => c.key === activeCategory)!;

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

      {/* Main content */}
      <main className="flex-1 lg:ml-64 min-w-0">
        {/* Header */}
        <div className="bg-[#0050A0] text-white pt-[57px] lg:pt-0 pb-8 lg:pb-10">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-8 lg:pt-10">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-3 tracking-tight">
              NFL Stat Leaders
            </h1>
            <p className="text-base md:text-lg text-white/95 max-w-2xl">
              2025 NFL Season Statistical Leaders
            </p>
          </div>
        </div>

        {/* Raptive Header Ad */}
        <div className="container mx-auto px-4 min-h-[150px]">
          <div className="raptive-pfn-header"></div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Category Tabs */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Select Category</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {STAT_CATEGORIES.map((category) => (
                <button
                  key={category.key}
                  onClick={() => setActiveCategory(category.key)}
                  className={`px-4 py-3 rounded-lg font-semibold text-sm transition-all border-2 ${
                    activeCategory === category.key
                      ? 'bg-[#0050A0] border-[#0050A0] text-white shadow-md'
                      : 'bg-white border-gray-200 text-gray-700 hover:border-[#0050A0] hover:text-[#0050A0]'
                  }`}
                >
                  {category.abbr}
                </button>
              ))}
            </div>
          </div>

          {/* Stats Table */}
          {loading ? (
            <SkeletonLoader type="table" rows={10} />
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
              <p className="text-red-600">{error}</p>
            </div>
          ) : filteredLeaders ? (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              {/* Table Header */}
              <div className="bg-gradient-to-r from-[#0050A0] to-blue-700 text-white px-6 py-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <h2 className="text-xl font-bold">
                    {activeCategoryInfo.label}
                    {selectedTeam !== 'all' && getTeamInfo(selectedTeam) && (
                      <span className="text-white/90 font-normal ml-2">
                        - {getTeamInfo(selectedTeam)!.fullName}
                      </span>
                    )}
                  </h2>
                  <div>
                    <select
                      id="team-filter-header"
                      value={selectedTeam}
                      onChange={(e) => setSelectedTeam(e.target.value)}
                      className="px-3 py-1.5 bg-white/10 border border-white/30 text-white rounded-lg focus:ring-2 focus:ring-white/50 focus:border-white outline-none transition-all text-sm backdrop-blur-sm hover:bg-white/20"
                    >
                      <option value="all" className="text-gray-900">All Teams</option>
                      {allTeams.sort((a, b) => a.fullName.localeCompare(b.fullName)).map((team) => (
                        <option key={team.id} value={team.id} className="text-gray-900">
                          {team.fullName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Table */}
              {filteredLeaders[activeCategory].length === 0 ? (
                <div className="p-8 text-center">
                  <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <p className="text-gray-500 mb-2">No players found</p>
                  {selectedTeam !== 'all' && (
                    <button
                      onClick={() => setSelectedTeam('all')}
                      className="text-[#0050A0] hover:underline font-medium"
                    >
                      View all teams
                    </button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto -mx-6 sm:mx-0">
                  <table className="w-full min-w-[640px]">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="pl-4 sm:pl-6 pr-2 sm:pr-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-12 sm:w-16">Rank</th>
                        <th className="px-2 sm:px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Player</th>
                        <th className="px-2 sm:px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-20 sm:w-24">Position</th>
                        <th className="px-2 sm:px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Team</th>
                        <th className="px-2 sm:px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider w-16 sm:w-20">GP</th>
                        <th className="px-4 sm:px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider w-20 sm:w-24">{activeCategoryInfo.abbr}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredLeaders[activeCategory].map((player, index) => {
                        const team = getTeamInfo(player.teamId);
                        const isTop3 = index < 3;

                        return (
                          <tr
                            key={player.playerId}
                            onClick={() => openPlayerModal(player.playerId)}
                            className={`hover:bg-gray-50 transition-colors cursor-pointer ${isTop3 ? 'bg-blue-50/50' : ''}`}
                          >
                            {/* Rank */}
                            <td className="pl-4 sm:pl-6 pr-2 sm:pr-4 py-3 sm:py-4">
                              <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm ${
                                index === 0 ? 'bg-yellow-400 text-yellow-900' :
                                index === 1 ? 'bg-gray-300 text-gray-700' :
                                index === 2 ? 'bg-blue-400 text-blue-900' :
                                'bg-gray-100 text-gray-600'
                              }`}>
                                {index + 1}
                              </div>
                            </td>

                            {/* Player */}
                            <td className="px-2 sm:px-4 py-3 sm:py-4">
                              <div className="font-semibold text-sm sm:text-base text-gray-900 group-hover:text-[#0050A0]">{player.name}</div>
                            </td>

                            {/* Position */}
                            <td className="px-2 sm:px-4 py-3 sm:py-4">
                              <span className={`inline-flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md border text-[10px] sm:text-xs font-semibold ${getPositionColor(player.position)}`}>
                                {player.position}
                              </span>
                            </td>

                            {/* Team */}
                            <td className="px-2 sm:px-4 py-3 sm:py-4">
                              {team ? (
                                <Link
                                  href={`/teams/${team.id}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="flex items-center gap-1 sm:gap-2 hover:opacity-80 transition-opacity"
                                >
                                  <img
                                    src={team.logoUrl}
                                    alt={team.abbreviation}


                                    className="w-5 h-5 sm:w-6 sm:h-6"
                                  />
                                  <span className="text-gray-700 font-medium text-xs sm:text-sm">{team.abbreviation}</span>
                                </Link>
                              ) : (
                                <span className="text-gray-500 text-xs sm:text-sm">{player.teamId}</span>
                              )}
                            </td>

                            {/* Games Played */}
                            <td className="px-2 sm:px-4 py-3 sm:py-4 text-center text-gray-600 text-sm">
                              {player.gamesPlayed}
                            </td>

                            {/* Stat Value */}
                            <td className="px-4 sm:px-6 py-3 sm:py-4 text-right">
                              <span className="text-base sm:text-lg font-bold text-[#0050A0]">
                                {activeCategoryInfo.format ? activeCategoryInfo.format(player.value) : player.value}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Expand buttons for All Teams view */}
              {selectedTeam === 'all' && filteredLeaders[activeCategory].length > 0 && (
                <div className="px-4 sm:px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-center gap-2 sm:gap-3">
                  {displayLimit === 25 && (
                    <>
                      <button
                        onClick={() => setDisplayLimit(50)}
                        className="px-3 sm:px-4 py-2 bg-white border-2 border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:border-[#0050A0] hover:text-[#0050A0] transition-all"
                      >
                        <span className="hidden sm:inline">Show </span>Top 50
                      </button>
                      <button
                        onClick={() => setDisplayLimit(100)}
                        className="px-3 sm:px-4 py-2 bg-white border-2 border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:border-[#0050A0] hover:text-[#0050A0] transition-all"
                      >
                        <span className="hidden sm:inline">Show </span>Top 100
                      </button>
                    </>
                  )}
                  {displayLimit === 50 && (
                    <>
                      <button
                        onClick={() => setDisplayLimit(25)}
                        className="px-3 sm:px-4 py-2 bg-white border-2 border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:border-[#0050A0] hover:text-[#0050A0] transition-all"
                      >
                        <span className="hidden sm:inline">Show </span>Top 25
                      </button>
                      <button
                        onClick={() => setDisplayLimit(100)}
                        className="px-3 sm:px-4 py-2 bg-white border-2 border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:border-[#0050A0] hover:text-[#0050A0] transition-all"
                      >
                        <span className="hidden sm:inline">Show </span>Top 100
                      </button>
                    </>
                  )}
                  {displayLimit === 100 && (
                    <>
                      <button
                        onClick={() => setDisplayLimit(25)}
                        className="px-3 sm:px-4 py-2 bg-white border-2 border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:border-[#0050A0] hover:text-[#0050A0] transition-all"
                      >
                        <span className="hidden sm:inline">Show </span>Top 25
                      </button>
                      <button
                        onClick={() => setDisplayLimit(50)}
                        className="px-3 sm:px-4 py-2 bg-white border-2 border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:border-[#0050A0] hover:text-[#0050A0] transition-all"
                      >
                        <span className="hidden sm:inline">Show </span>Top 50
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          ) : null}

          {/* All Categories Overview */}
          {!loading && !error && statLeaders && (
            <div className="mt-8">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Top 3 Leaders - All Categories</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {STAT_CATEGORIES.map((category) => {
                    const leaders = statLeaders[category.key].slice(0, 3);
                    return (
                      <div
                        key={category.key}
                        className="bg-gray-50 rounded-lg border border-gray-200 p-4 cursor-pointer hover:border-[#0050A0] hover:bg-white transition-all group"
                        onClick={() => setActiveCategory(category.key)}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-bold text-sm text-gray-900 group-hover:text-[#0050A0] transition-colors">{category.label}</h3>
                          <span className="text-xs font-semibold text-gray-500 bg-white px-2 py-1 rounded border border-gray-200">{category.abbr}</span>
                        </div>
                        <div className="space-y-3">
                          {leaders.map((player, idx) => {
                            const team = getTeamInfo(player.teamId);
                            return (
                              <div key={player.playerId} className="flex items-center gap-2">
                                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                                  idx === 0 ? 'bg-yellow-400 text-yellow-900' :
                                  idx === 1 ? 'bg-gray-300 text-gray-700' :
                                  'bg-blue-400 text-blue-900'
                                }`}>
                                  {idx + 1}
                                </span>
                                {team && (
                                  <img
                                    src={team.logoUrl}
                                    alt={team.abbreviation}
                                    
                                    
                                    className="w-4 h-4 flex-shrink-0"
                                  />
                                )}
                                <span className="text-xs font-medium text-gray-900 truncate flex-1">{player.name}</span>
                                <span className="text-xs font-bold text-[#0050A0]">{category.format ? category.format(player.value) : player.value}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Player Detail Modal */}
      {isModalOpen && selectedPlayer && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-3 sm:px-4 pt-4 pb-20 text-center sm:p-0">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/60 transition-opacity"
              onClick={closePlayerModal}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-xl sm:rounded-2xl shadow-xl transform transition-all w-full max-w-lg mx-auto">
              {/* Header */}
              <div className="bg-[#0050A0] text-white px-6 py-4 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getTeamInfo(selectedPlayer.teamId) && (
                      <img
                        src={getTeamInfo(selectedPlayer.teamId)!.logoUrl}
                        alt={getTeamInfo(selectedPlayer.teamId)!.abbreviation}
                        
                        
                        className="w-10 h-10"
                      />
                    )}
                    <div>
                      <h3 className="text-xl font-bold">{selectedPlayer.name}</h3>
                      <p className="text-sm text-white/80">
                        {getTeamInfo(selectedPlayer.teamId)?.name || selectedPlayer.teamId}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={closePlayerModal}
                    className="p-2 hover:bg-white/20 rounded-full transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm text-gray-500">
                    {selectedPlayer.gamesPlayed} Games Played
                  </div>
                  <span className={`inline-flex items-center px-3 py-1 rounded-md border text-sm font-semibold ${getPositionColor(selectedPlayer.position)}`}>
                    {selectedPlayer.position}
                  </span>
                </div>

                <div className="space-y-4">
                  {/* Passing Stats */}
                  {(selectedPlayer.passingYards && parseInt(selectedPlayer.passingYards) > 0) && (
                    <div>
                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Passing</h4>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-gray-50 rounded-lg p-3 text-center border border-gray-200">
                          <div className="text-2xl font-bold text-[#0050A0]">{selectedPlayer.passingYards}</div>
                          <div className="text-xs font-medium text-gray-600">YDS</div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3 text-center border border-gray-200">
                          <div className="text-2xl font-bold text-[#0050A0]">{selectedPlayer.passingTDs}</div>
                          <div className="text-xs font-medium text-gray-600">TD</div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3 text-center border border-gray-200">
                          <div className="text-2xl font-bold text-gray-900">{selectedPlayer.interceptions}</div>
                          <div className="text-xs font-medium text-gray-600">INT</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Rushing Stats */}
                  {(selectedPlayer.rushingYards && parseInt(selectedPlayer.rushingYards) > 0) && (
                    <div>
                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Rushing</h4>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-gray-50 rounded-lg p-3 text-center border border-gray-200">
                          <div className="text-2xl font-bold text-[#0050A0]">{selectedPlayer.rushingYards}</div>
                          <div className="text-xs font-medium text-gray-600">YDS</div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3 text-center border border-gray-200">
                          <div className="text-2xl font-bold text-[#0050A0]">{selectedPlayer.rushingTDs}</div>
                          <div className="text-xs font-medium text-gray-600">TD</div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3 text-center border border-gray-200">
                          <div className="text-2xl font-bold text-gray-900">{selectedPlayer.yardsPerCarry}</div>
                          <div className="text-xs font-medium text-gray-600">YPC</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Receiving Stats */}
                  {(selectedPlayer.receivingYards && parseInt(selectedPlayer.receivingYards) > 0) && (
                    <div>
                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Receiving</h4>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-gray-50 rounded-lg p-3 text-center border border-gray-200">
                          <div className="text-2xl font-bold text-[#0050A0]">{selectedPlayer.receivingYards}</div>
                          <div className="text-xs font-medium text-gray-600">YDS</div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3 text-center border border-gray-200">
                          <div className="text-2xl font-bold text-[#0050A0]">{selectedPlayer.receptions}</div>
                          <div className="text-xs font-medium text-gray-600">REC</div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3 text-center border border-gray-200">
                          <div className="text-2xl font-bold text-gray-900">{selectedPlayer.receivingTDs}</div>
                          <div className="text-xs font-medium text-gray-600">TD</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Defensive Stats */}
                  {(selectedPlayer.tackles && parseInt(selectedPlayer.tackles) > 0) && (
                    <div>
                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Defense</h4>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-gray-50 rounded-lg p-3 text-center border border-gray-200">
                          <div className="text-2xl font-bold text-[#0050A0]">{selectedPlayer.tackles}</div>
                          <div className="text-xs font-medium text-gray-600">TACK</div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3 text-center border border-gray-200">
                          <div className="text-2xl font-bold text-[#0050A0]">{selectedPlayer.sacks}</div>
                          <div className="text-xs font-medium text-gray-600">SACK</div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3 text-center border border-gray-200">
                          <div className="text-2xl font-bold text-gray-900">{selectedPlayer.defensiveInterceptions}</div>
                          <div className="text-xs font-medium text-gray-600">INT</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Team Link */}
                {getTeamInfo(selectedPlayer.teamId) && (
                  <Link
                    href={`/teams/${selectedPlayer.teamId}`}
                    className="mt-4 block w-full text-center bg-[#0050A0] text-white py-3 rounded-lg font-semibold hover:bg-[#003d7a] transition-colors"
                  >
                    View {getTeamInfo(selectedPlayer.teamId)!.name} Homepage
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
