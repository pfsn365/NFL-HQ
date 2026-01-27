'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { superBowlHistory, superBowlRecords, getTeamSuperBowlHistory, getSuperBowlWinsByTeam, SuperBowlGame } from '@/data/superBowlHistory';
import { getAllTeams } from '@/data/teams';

type SortField = 'number' | 'date' | 'winner' | 'score' | 'loser' | 'mvp' | 'venue';
type SortOrder = 'asc' | 'desc';

export default function HistoryTab() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('number');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [activeSection, setActiveSection] = useState<'results' | 'records' | 'teams'>('results');

  const allTeams = getAllTeams();
  const winsByTeam = useMemo(() => getSuperBowlWinsByTeam(), []);

  // Filter and sort Super Bowl history
  const filteredHistory = useMemo(() => {
    let results = [...superBowlHistory];

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      results = results.filter(sb =>
        sb.winner.toLowerCase().includes(term) ||
        sb.loser.toLowerCase().includes(term) ||
        sb.mvp.player.toLowerCase().includes(term) ||
        sb.venue.toLowerCase().includes(term) ||
        sb.number.toLowerCase().includes(term)
      );
    }

    // Filter by team
    if (selectedTeam) {
      results = results.filter(sb =>
        sb.winnerTeamId === selectedTeam || sb.loserTeamId === selectedTeam
      );
    }

    // Sort
    results.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'number':
          comparison = a.arabicNumber - b.arabicNumber;
          break;
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case 'winner':
          comparison = a.winner.localeCompare(b.winner);
          break;
        case 'score':
          comparison = (a.winnerScore - a.loserScore) - (b.winnerScore - b.loserScore);
          break;
        case 'loser':
          comparison = a.loser.localeCompare(b.loser);
          break;
        case 'mvp':
          comparison = a.mvp.player.localeCompare(b.mvp.player);
          break;
        case 'venue':
          comparison = a.venue.localeCompare(b.venue);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return results;
  }, [searchTerm, selectedTeam, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>;
  };

  const getTeamLogo = (teamId: string): string | null => {
    const team = allTeams.find(t => t.id === teamId);
    return team?.logoUrl || null;
  };

  return (
    <div className="space-y-6">
      {/* Section Tabs */}
      <div className="flex space-x-4 border-b border-gray-200">
        <button
          onClick={() => setActiveSection('results')}
          className={`py-2 px-4 font-medium border-b-2 transition-colors cursor-pointer ${
            activeSection === 'results'
              ? 'border-[#013369] text-[#013369]'
              : 'border-transparent text-gray-600 hover:text-gray-800'
          }`}
        >
          All Results
        </button>
        <button
          onClick={() => setActiveSection('records')}
          className={`py-2 px-4 font-medium border-b-2 transition-colors cursor-pointer ${
            activeSection === 'records'
              ? 'border-[#013369] text-[#013369]'
              : 'border-transparent text-gray-600 hover:text-gray-800'
          }`}
        >
          Records
        </button>
        <button
          onClick={() => setActiveSection('teams')}
          className={`py-2 px-4 font-medium border-b-2 transition-colors cursor-pointer ${
            activeSection === 'teams'
              ? 'border-[#013369] text-[#013369]'
              : 'border-transparent text-gray-600 hover:text-gray-800'
          }`}
        >
          By Team
        </button>
      </div>

      {/* All Results Section */}
      {activeSection === 'results' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Super Bowl Results</h2>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by team, MVP, venue..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#013369]"
              />
            </div>
            <div>
              <select
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                className="w-full md:w-48 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#013369] cursor-pointer"
              >
                <option value="">All Teams</option>
                {allTeams.map(team => (
                  <option key={team.id} value={team.id}>{team.fullName}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Results Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th
                    className="py-3 px-4 text-left cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('number')}
                  >
                    SB <SortIcon field="number" />
                  </th>
                  <th
                    className="py-3 px-4 text-left cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('date')}
                  >
                    Date <SortIcon field="date" />
                  </th>
                  <th
                    className="py-3 px-4 text-left cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('winner')}
                  >
                    Winner <SortIcon field="winner" />
                  </th>
                  <th
                    className="py-3 px-4 text-center cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('score')}
                  >
                    Score <SortIcon field="score" />
                  </th>
                  <th
                    className="py-3 px-4 text-left cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('loser')}
                  >
                    Loser <SortIcon field="loser" />
                  </th>
                  <th
                    className="py-3 px-4 text-left cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('mvp')}
                  >
                    MVP <SortIcon field="mvp" />
                  </th>
                  <th
                    className="py-3 px-4 text-left cursor-pointer hover:bg-gray-50 hidden lg:table-cell"
                    onClick={() => handleSort('venue')}
                  >
                    Venue <SortIcon field="venue" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map((sb) => {
                  const winnerLogo = getTeamLogo(sb.winnerTeamId);
                  const loserLogo = getTeamLogo(sb.loserTeamId);

                  return (
                    <tr key={sb.number} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-bold text-[#013369]">{sb.number}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{sb.date}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {winnerLogo && (
                            <img src={winnerLogo} alt="" className="w-6 h-6 object-contain" />
                          )}
                          <Link
                            href={`/nfl-hq/teams/${sb.winnerTeamId}`}
                            className="font-semibold hover:underline cursor-pointer"
                          >
                            {sb.winner}
                          </Link>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center font-mono">
                        <span className="font-bold">{sb.winnerScore}</span>
                        <span className="text-gray-400 mx-1">-</span>
                        <span>{sb.loserScore}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {loserLogo && (
                            <img src={loserLogo} alt="" className="w-6 h-6 object-contain" />
                          )}
                          <Link
                            href={`/nfl-hq/teams/${sb.loserTeamId}`}
                            className="hover:underline cursor-pointer"
                          >
                            {sb.loser}
                          </Link>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium">{sb.mvp.player}</p>
                          <p className="text-xs text-gray-500">{sb.mvp.position}, {sb.mvp.team}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 hidden lg:table-cell">{sb.venue}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredHistory.length === 0 && (
            <p className="text-center text-gray-500 py-8">No results found</p>
          )}
        </div>
      )}

      {/* Records Section */}
      {activeSection === 'records' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Super Bowl Records</h2>

            {/* Team Records */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4 text-[#013369]">Most Super Bowl Wins</h3>
                <div className="space-y-3">
                  {superBowlRecords.mostWins.slice(0, 5).map((item, idx) => {
                    const team = allTeams.find(t => t.fullName === item.team || t.id === item.team.toLowerCase().replace(/\s+/g, '-'));
                    return (
                      <div key={item.team} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-gray-400 w-6">{idx + 1}.</span>
                          {team?.logoUrl && (
                            <img src={team.logoUrl} alt="" className="w-6 h-6 object-contain" />
                          )}
                          <span className="font-medium">{item.team}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-[#013369]">{item.wins}</span>
                          <span className="text-gray-500 text-sm ml-1">({item.appearances} app.)</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4 text-[#D50A0A]">Most Super Bowl Losses</h3>
                <div className="space-y-3">
                  {superBowlRecords.mostLosses.map((item, idx) => {
                    const team = allTeams.find(t => t.fullName === item.team || t.id === item.team.toLowerCase().replace(/\s+/g, '-'));
                    return (
                      <div key={item.team} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-gray-400 w-6">{idx + 1}.</span>
                          {team?.logoUrl && (
                            <img src={team.logoUrl} alt="" className="w-6 h-6 object-contain" />
                          )}
                          <span className="font-medium">{item.team}</span>
                        </div>
                        <span className="font-bold text-[#D50A0A]">{item.losses}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Individual Records */}
            <h3 className="text-xl font-semibold mb-4">Individual Records</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500 mb-1">Most Passing Yards (Single Game)</p>
                <p className="text-2xl font-bold text-[#013369]">{superBowlRecords.mostPassingYards.record}</p>
                <p className="font-medium">{superBowlRecords.mostPassingYards.player}</p>
                <p className="text-sm text-gray-500">{superBowlRecords.mostPassingYards.game}</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500 mb-1">Most Rushing Yards (Single Game)</p>
                <p className="text-2xl font-bold text-[#013369]">{superBowlRecords.mostRushingYards.record}</p>
                <p className="font-medium">{superBowlRecords.mostRushingYards.player}</p>
                <p className="text-sm text-gray-500">{superBowlRecords.mostRushingYards.game}</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500 mb-1">Most Receiving Yards (Single Game)</p>
                <p className="text-2xl font-bold text-[#013369]">{superBowlRecords.mostReceivingYards.record}</p>
                <p className="font-medium">{superBowlRecords.mostReceivingYards.player}</p>
                <p className="text-sm text-gray-500">{superBowlRecords.mostReceivingYards.game}</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500 mb-1">Most Points (Single Game - Team)</p>
                <p className="text-2xl font-bold text-[#013369]">{superBowlRecords.mostPointsScored.record}</p>
                <p className="font-medium">{superBowlRecords.mostPointsScored.team}</p>
                <p className="text-sm text-gray-500">{superBowlRecords.mostPointsScored.game} ({superBowlRecords.mostPointsScored.score})</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500 mb-1">Largest Margin of Victory</p>
                <p className="text-2xl font-bold text-[#013369]">{superBowlRecords.largestMargin.record} pts</p>
                <p className="font-medium">{superBowlRecords.largestMargin.team}</p>
                <p className="text-sm text-gray-500">{superBowlRecords.largestMargin.game} ({superBowlRecords.largestMargin.score})</p>
              </div>
            </div>

            {/* Most MVPs */}
            <h3 className="text-xl font-semibold mt-8 mb-4">Most Super Bowl MVPs</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {superBowlRecords.mostMVPs.map((item, idx) => (
                <div key={item.player} className="bg-gradient-to-r from-[#013369] to-[#D50A0A] text-white rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-3xl font-bold">{item.count}</span>
                    <span className="text-sm opacity-75">MVPs</span>
                  </div>
                  <p className="font-bold text-lg">{item.player}</p>
                  <p className="text-sm opacity-75">Super Bowls: {item.games.join(', ')}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* By Team Section */}
      {activeSection === 'teams' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Super Bowl History by Team</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {winsByTeam.map(({ teamId, wins }) => {
              const team = allTeams.find(t => t.id === teamId);
              if (!team) return null;

              const history = getTeamSuperBowlHistory(teamId);

              return (
                <Link
                  key={teamId}
                  href={`/nfl-hq/teams/${teamId}`}
                  className="block border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <img src={team.logoUrl} alt={team.name} className="w-12 h-12 object-contain" />
                    <div>
                      <h3 className="font-bold" style={{ color: team.primaryColor }}>{team.fullName}</h3>
                      <p className="text-sm text-gray-500">
                        {history.wins}W - {history.losses}L ({history.appearances} appearances)
                      </p>
                    </div>
                  </div>
                  {history.games.length > 0 && (
                    <div className="text-sm text-gray-600">
                      <p className="font-medium mb-1">Super Bowl Appearances:</p>
                      <div className="flex flex-wrap gap-1">
                        {history.games.map((game) => (
                          <span
                            key={game.number}
                            className={`px-2 py-0.5 rounded text-xs ${
                              game.result === 'W'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {game.number} ({game.result})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
