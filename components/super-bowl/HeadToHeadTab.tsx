'use client';

import { useState } from 'react';

interface GameResult {
  date: string;
  visitor: string;
  visitorScore: number;
  home: string;
  homeScore: number;
  result: 'W' | 'L';
  isOvertime?: boolean;
  isSuperBowl?: boolean;
  superBowlName?: string;
}

const headToHeadGames: GameResult[] = [
  { date: '09/15/2024', visitor: 'Seattle Seahawks', visitorScore: 23, home: 'New England Patriots', homeScore: 20, result: 'L', isOvertime: true },
  { date: '09/20/2020', visitor: 'New England Patriots', visitorScore: 30, home: 'Seattle Seahawks', homeScore: 35, result: 'L' },
  { date: '11/13/2016', visitor: 'Seattle Seahawks', visitorScore: 31, home: 'New England Patriots', homeScore: 24, result: 'L' },
  { date: '02/01/2015', visitor: 'New England Patriots', visitorScore: 28, home: 'Seattle Seahawks', homeScore: 24, result: 'W', isSuperBowl: true, superBowlName: 'Super Bowl XLIX' },
  { date: '10/14/2012', visitor: 'New England Patriots', visitorScore: 23, home: 'Seattle Seahawks', homeScore: 24, result: 'L' },
  { date: '12/07/2008', visitor: 'New England Patriots', visitorScore: 24, home: 'Seattle Seahawks', homeScore: 21, result: 'W' },
  { date: '10/17/2004', visitor: 'Seattle Seahawks', visitorScore: 20, home: 'New England Patriots', homeScore: 30, result: 'W' },
  { date: '10/24/1993', visitor: 'New England Patriots', visitorScore: 9, home: 'Seattle Seahawks', homeScore: 10, result: 'L' },
  { date: '09/19/1993', visitor: 'Seattle Seahawks', visitorScore: 17, home: 'New England Patriots', homeScore: 14, result: 'L' },
  { date: '09/20/1992', visitor: 'Seattle Seahawks', visitorScore: 10, home: 'New England Patriots', homeScore: 6, result: 'L' },
  { date: '10/07/1990', visitor: 'Seattle Seahawks', visitorScore: 33, home: 'New England Patriots', homeScore: 20, result: 'L' },
  { date: '09/24/1989', visitor: 'Seattle Seahawks', visitorScore: 24, home: 'New England Patriots', homeScore: 3, result: 'L' },
  { date: '12/04/1988', visitor: 'Seattle Seahawks', visitorScore: 7, home: 'New England Patriots', homeScore: 13, result: 'W' },
  { date: '09/21/1986', visitor: 'Seattle Seahawks', visitorScore: 38, home: 'New England Patriots', homeScore: 31, result: 'L' },
  { date: '11/17/1985', visitor: 'New England Patriots', visitorScore: 20, home: 'Seattle Seahawks', homeScore: 13, result: 'W' },
  { date: '09/16/1984', visitor: 'Seattle Seahawks', visitorScore: 23, home: 'New England Patriots', homeScore: 38, result: 'W' },
  { date: '12/18/1983', visitor: 'New England Patriots', visitorScore: 6, home: 'Seattle Seahawks', homeScore: 24, result: 'L' },
  { date: '12/19/1982', visitor: 'New England Patriots', visitorScore: 16, home: 'Seattle Seahawks', homeScore: 0, result: 'W' },
  { date: '09/21/1980', visitor: 'New England Patriots', visitorScore: 37, home: 'Seattle Seahawks', homeScore: 31, result: 'W' },
  { date: '10/09/1977', visitor: 'Seattle Seahawks', visitorScore: 0, home: 'New England Patriots', homeScore: 31, result: 'W' },
];

// Patriots stats from user data
const patriotsStats = {
  games: 1017,
  wins: 559,
  losses: 449,
  winPct: .555,
  pointsPerGame: 22.5,
  pointsAllowedPerGame: 20.4,
  playoffApps: 29,
  finalsApps: 11,
  championships: 6,
};

// Seahawks stats from user data
const seahawksStats = {
  games: 793,
  wins: 416,
  losses: 376,
  winPct: .525,
  pointsPerGame: 21.8,
  pointsAllowedPerGame: 21.1,
  playoffApps: 21,
  finalsApps: 3,
  championships: 1,
};

export default function HeadToHeadTab() {
  const [showAllGames, setShowAllGames] = useState(false);

  const displayedGames = showAllGames ? headToHeadGames : headToHeadGames.slice(0, 5);

  // Calculate head-to-head record (from Patriots perspective based on result column)
  const patriotsWins = headToHeadGames.filter(g => g.result === 'W').length;
  const seahawksWins = headToHeadGames.filter(g => g.result === 'L').length;

  // Regular season vs playoffs
  const playoffGames = headToHeadGames.filter(g => g.isSuperBowl);
  const regularSeasonGames = headToHeadGames.filter(g => !g.isSuperBowl);
  const patriotsRegSeasonWins = regularSeasonGames.filter(g => g.result === 'W').length;
  const seahawksRegSeasonWins = regularSeasonGames.filter(g => g.result === 'L').length;
  const patriotsPlayoffWins = playoffGames.filter(g => g.result === 'W').length;
  const seahawksPlayoffWins = playoffGames.filter(g => g.result === 'L').length;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Head-to-Head Record Summary */}
      <div className="rounded-lg overflow-hidden border border-gray-200">
        <div className="bg-gradient-to-r from-[#002244] via-[#0050A0] to-[#002244] text-white px-4 sm:px-6 py-3 sm:py-4">
          <h2 className="text-base sm:text-xl font-bold text-center">Patriots vs Seahawks: All-Time Series</h2>
        </div>

        <div className="p-4 sm:p-6 bg-white">
          {/* Main Record Display */}
          <div className="flex items-center justify-center gap-4 sm:gap-8 mb-6 sm:mb-8">
            <div className="text-center">
              <img src="/nfl-hq/new-england-patriots.png" alt="Patriots" className="w-14 h-14 sm:w-20 sm:h-20 mx-auto mb-2" />
              <div className="text-2xl sm:text-3xl font-bold text-[#002244]">{patriotsWins}</div>
              <div className="text-xs sm:text-sm text-gray-600">Wins</div>
            </div>
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-bold text-gray-600">-</div>
            </div>
            <div className="text-center">
              <img src="/nfl-hq/seattle-seahawks-sb.png" alt="Seahawks" className="w-14 h-14 sm:w-20 sm:h-20 mx-auto mb-2" />
              <div className="text-2xl sm:text-3xl font-bold text-[#002244]">{seahawksWins}</div>
              <div className="text-xs sm:text-sm text-gray-600">Wins</div>
            </div>
          </div>

          {/* Record Breakdown */}
          <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-4 sm:mb-6">
            <div className="bg-gray-50 rounded-lg p-3 sm:p-4 text-center">
              <div className="text-xs sm:text-sm text-gray-600 mb-1">Regular Season</div>
              <div className="text-lg sm:text-xl font-bold">
                <span className="text-[#002244]">{patriotsRegSeasonWins}</span>
                <span className="text-gray-600 mx-1 sm:mx-2">-</span>
                <span className="text-[#002244]">{seahawksRegSeasonWins}</span>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 sm:p-4 text-center">
              <div className="text-xs sm:text-sm text-gray-600 mb-1">Playoffs</div>
              <div className="text-lg sm:text-xl font-bold">
                <span className="text-[#002244]">{patriotsPlayoffWins}</span>
                <span className="text-gray-600 mx-1 sm:mx-2">-</span>
                <span className="text-[#002244]">{seahawksPlayoffWins}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Franchise Comparison */}
      <div className="rounded-lg overflow-hidden border border-gray-200">
        <div className="bg-[#0050A0] text-white px-4 sm:px-6 py-3 sm:py-4">
          <h3 className="font-bold text-base sm:text-lg">Franchise Comparison</h3>
        </div>
        <div className="overflow-x-auto bg-white">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 sm:py-3 px-2 sm:px-4 text-left text-xs sm:text-sm font-semibold text-gray-700">Stat</th>
                <th className="py-2 sm:py-3 px-2 sm:px-4 text-center text-xs sm:text-sm font-semibold text-gray-700">
                  <div className="flex items-center justify-center gap-1 sm:gap-2">
                    <img src="/nfl-hq/new-england-patriots.png" alt="Patriots" className="w-5 h-5 sm:w-6 sm:h-6" />
                    <span className="hidden sm:inline">Patriots</span>
                    <span className="sm:hidden">NE</span>
                  </div>
                </th>
                <th className="py-2 sm:py-3 px-2 sm:px-4 text-center text-xs sm:text-sm font-semibold text-gray-700">
                  <div className="flex items-center justify-center gap-1 sm:gap-2">
                    <img src="/nfl-hq/seattle-seahawks-sb.png" alt="Seahawks" className="w-5 h-5 sm:w-6 sm:h-6" />
                    <span className="hidden sm:inline">Seahawks</span>
                    <span className="sm:hidden">SEA</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm text-gray-700">All-Time Record</td>
                <td className={`py-2 sm:py-3 px-2 sm:px-4 text-center text-xs sm:text-sm font-semibold ${patriotsStats.wins > seahawksStats.wins ? 'text-green-600' : ''}`}>
                  {patriotsStats.wins}-{patriotsStats.losses}
                </td>
                <td className={`py-2 sm:py-3 px-2 sm:px-4 text-center text-xs sm:text-sm font-semibold ${seahawksStats.wins > patriotsStats.wins ? 'text-green-600' : ''}`}>
                  {seahawksStats.wins}-{seahawksStats.losses}
                </td>
              </tr>
              <tr className="border-b bg-gray-50">
                <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm text-gray-700">Win Percentage</td>
                <td className={`py-2 sm:py-3 px-2 sm:px-4 text-center text-xs sm:text-sm font-semibold ${patriotsStats.winPct > seahawksStats.winPct ? 'text-green-600' : ''}`}>
                  {(patriotsStats.winPct * 100).toFixed(1)}%
                </td>
                <td className={`py-2 sm:py-3 px-2 sm:px-4 text-center text-xs sm:text-sm font-semibold ${seahawksStats.winPct > patriotsStats.winPct ? 'text-green-600' : ''}`}>
                  {(seahawksStats.winPct * 100).toFixed(1)}%
                </td>
              </tr>
              <tr className="border-b bg-gray-50">
                <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm text-gray-700"><span className="hidden sm:inline">Playoff Appearances</span><span className="sm:hidden">Playoff Apps</span></td>
                <td className={`py-2 sm:py-3 px-2 sm:px-4 text-center text-xs sm:text-sm font-semibold ${patriotsStats.playoffApps > seahawksStats.playoffApps ? 'text-green-600' : ''}`}>
                  {patriotsStats.playoffApps}
                </td>
                <td className={`py-2 sm:py-3 px-2 sm:px-4 text-center text-xs sm:text-sm font-semibold ${seahawksStats.playoffApps > patriotsStats.playoffApps ? 'text-green-600' : ''}`}>
                  {seahawksStats.playoffApps}
                </td>
              </tr>
              <tr className="border-b bg-gray-50">
                <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm text-gray-700"><span className="hidden sm:inline">Super Bowl Appearances</span><span className="sm:hidden">SB Apps</span></td>
                <td className={`py-2 sm:py-3 px-2 sm:px-4 text-center text-xs sm:text-sm font-semibold ${patriotsStats.finalsApps > seahawksStats.finalsApps ? 'text-green-600' : ''}`}>
                  {patriotsStats.finalsApps}
                </td>
                <td className={`py-2 sm:py-3 px-2 sm:px-4 text-center text-xs sm:text-sm font-semibold ${seahawksStats.finalsApps > patriotsStats.finalsApps ? 'text-green-600' : ''}`}>
                  {seahawksStats.finalsApps}
                </td>
              </tr>
              <tr>
                <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm text-gray-700 font-semibold">Championships</td>
                <td className={`py-2 sm:py-3 px-2 sm:px-4 text-center font-bold text-sm sm:text-lg ${patriotsStats.championships > seahawksStats.championships ? 'text-green-600' : ''}`}>
                  {patriotsStats.championships}
                </td>
                <td className={`py-2 sm:py-3 px-2 sm:px-4 text-center font-bold text-sm sm:text-lg ${seahawksStats.championships > patriotsStats.championships ? 'text-green-600' : ''}`}>
                  {seahawksStats.championships}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Game History */}
      <div className="rounded-lg overflow-hidden border border-gray-200">
        <div className="bg-[#0050A0] text-white px-4 sm:px-6 py-3 sm:py-4">
          <h3 className="font-bold text-base sm:text-lg">Game History</h3>
        </div>
        <div className="overflow-x-auto bg-white">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 sm:py-3 px-2 sm:px-4 text-left text-xs sm:text-sm font-semibold text-gray-700">Date</th>
                <th className="py-2 sm:py-3 px-2 sm:px-4 text-left text-xs sm:text-sm font-semibold text-gray-700 hidden sm:table-cell">Matchup</th>
                <th className="py-2 sm:py-3 px-2 sm:px-4 text-center text-xs sm:text-sm font-semibold text-gray-700">Score</th>
                <th className="py-2 sm:py-3 px-2 sm:px-4 text-center text-xs sm:text-sm font-semibold text-gray-700">Result</th>
              </tr>
            </thead>
            <tbody>
              {displayedGames.map((game, idx) => {
                const patriotsHome = game.home === 'New England Patriots';
                const patriotsScore = patriotsHome ? game.homeScore : game.visitorScore;
                const seahawksScore = patriotsHome ? game.visitorScore : game.homeScore;

                return (
                  <tr key={idx} className={`border-b ${game.isSuperBowl ? 'bg-[#D4AF37]/10' : idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm text-gray-700 whitespace-nowrap">
                      {game.date}
                      {game.isSuperBowl && <span className="ml-1 sm:ml-2 text-[#D4AF37] font-bold">★</span>}
                    </td>
                    <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm text-gray-700 hidden sm:table-cell">
                      <span className={!patriotsHome ? 'font-semibold' : ''}>{game.visitor}</span>
                      <span className="mx-2 text-gray-600">@</span>
                      <span className={patriotsHome ? 'font-semibold' : ''}>{game.home}</span>
                      {game.isSuperBowl && <span className="ml-2 text-xs text-[#D4AF37] font-semibold">{game.superBowlName}</span>}
                    </td>
                    <td className="py-2 sm:py-3 px-2 sm:px-4 text-center text-xs sm:text-sm tabular-nums">
                      <span className={game.result === 'W' ? 'font-bold text-green-600' : ''}>{patriotsScore}</span>
                      <span className="mx-1 sm:mx-2 text-gray-600">-</span>
                      <span className={game.result === 'L' ? 'font-bold text-green-600' : ''}>{seahawksScore}</span>
                      {game.isOvertime && <span className="ml-1 text-xs text-gray-600">OT</span>}
                    </td>
                    <td className="py-2 sm:py-3 px-2 sm:px-4 text-center">
                      <span className={`px-1.5 sm:px-2 py-1 rounded text-xs font-semibold ${
                        game.result === 'W'
                          ? 'bg-[#002244] text-white'
                          : 'bg-[#002244]/20 text-[#002244]'
                      }`}>
                        {game.result === 'W' ? 'NE Win' : 'SEA Win'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {headToHeadGames.length > 5 && (
          <div className="p-3 sm:p-4 text-center border-t bg-white">
            <button
              onClick={() => setShowAllGames(!showAllGames)}
              className="px-4 sm:px-6 py-2 min-h-[44px] bg-[#0050A0] hover:bg-[#003A75] active:scale-[0.98] text-white rounded-lg text-sm sm:text-base font-medium transition-all cursor-pointer"
            >
              {showAllGames ? 'Show Less' : `Show All ${headToHeadGames.length} Games`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
