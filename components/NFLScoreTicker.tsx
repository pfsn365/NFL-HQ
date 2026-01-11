'use client';

import Image from 'next/image';
import { useTickerContext } from '@/context/TickerContext';

// Format game time in user's local timezone
function formatLocalGameTime(isoDate: string): string {
  const date = new Date(isoDate);

  // Format date part (e.g., "1/11")
  const month = date.getMonth() + 1;
  const day = date.getDate();

  // Format time part in user's locale
  const timeStr = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZoneName: 'short'
  });

  return `${month}/${day} - ${timeStr}`;
}

export default function NFLScoreTicker() {
  const { games, loading } = useTickerContext();

  if (loading) {
    return (
      <>
        {/* Mobile: below nav header, Desktop: at top offset by sidebar */}
        <div className="fixed top-[48px] lg:top-0 right-0 left-0 lg:left-64 bg-black text-white py-2 px-4 z-10 lg:z-40">
          <div className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Loading scores...</span>
          </div>
        </div>
        <div className="h-10" /> {/* Spacer for fixed ticker */}
      </>
    );
  }

  if (games.length === 0) {
    return (
      <>
        {/* Mobile: below nav header, Desktop: at top offset by sidebar */}
        <div className="fixed top-[48px] lg:top-0 right-0 left-0 lg:left-64 bg-black text-white py-2 px-4 z-10 lg:z-40">
          <div className="flex items-center justify-center gap-2">
            <span className="text-sm">No games scheduled today</span>
          </div>
        </div>
        <div className="h-10" /> {/* Spacer for fixed ticker */}
      </>
    );
  }

  return (
    <>
      {/* Mobile: below nav header (top-[48px]), Desktop: at top offset by sidebar */}
      <div className="fixed top-[48px] lg:top-0 right-0 left-0 lg:left-64 bg-black text-white z-10 lg:z-40">
        <div className="flex items-center">
          {/* Scrollable Games Container */}
          <div className="overflow-x-auto scrollbar-hide flex-1">
            <div className="flex items-stretch min-w-max">
              {games.map((game, index) => {
                const isPreGame = !game.isLive && !game.isFinal;

                return (
                  <div
                    key={game.id}
                    className={`flex items-center px-3 py-2 ${
                      index === 0 ? 'pl-4' : ''
                    } ${
                      index !== games.length - 1 ? 'border-r border-white/20' : 'pr-4'
                    }`}
                  >
                    {/* Away Team */}
                    <div className="flex items-center gap-2 min-w-[80px]">
                      {game.awayTeam.hasPossession && game.isLive && (
                        <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse" title="Possession" />
                      )}
                      <div className="relative w-6 h-6 flex-shrink-0">
                        <Image
                          src={game.awayTeam.logo}
                          alt={game.awayTeam.abbr}
                          fill
                          className="object-contain"
                          unoptimized
                        />
                      </div>
                      <span className="font-semibold text-sm">{game.awayTeam.abbr}</span>
                      <span className={`font-bold text-sm min-w-[24px] text-right ${
                        game.isFinal && game.awayTeam.score! > game.homeTeam.score!
                          ? 'text-green-400'
                          : ''
                      }`}>
                        {isPreGame ? '' : game.awayTeam.score}
                      </span>
                    </div>

                    {/* Status */}
                    <div className="mx-3 text-center min-w-[70px]">
                      {game.isLive ? (
                        <div className="flex flex-col items-center">
                          <span className="text-[10px] bg-green-500 text-white px-1.5 py-0.5 rounded font-medium animate-pulse">
                            LIVE
                          </span>
                          <span className="text-xs mt-0.5">{game.statusDetail}</span>
                        </div>
                      ) : game.isFinal ? (
                        <span className="text-xs font-medium text-gray-300">Final</span>
                      ) : (
                        <span className="text-xs text-gray-300">{formatLocalGameTime(game.startDate)}</span>
                      )}
                    </div>

                    {/* Home Team */}
                    <div className="flex items-center gap-2 min-w-[80px]">
                      <span className={`font-bold text-sm min-w-[24px] ${
                        game.isFinal && game.homeTeam.score! > game.awayTeam.score!
                          ? 'text-green-400'
                          : ''
                      }`}>
                        {isPreGame ? '' : game.homeTeam.score}
                      </span>
                      <span className="font-semibold text-sm">{game.homeTeam.abbr}</span>
                      <div className="relative w-6 h-6 flex-shrink-0">
                        <Image
                          src={game.homeTeam.logo}
                          alt={game.homeTeam.abbr}
                          fill
                          className="object-contain"
                          unoptimized
                        />
                      </div>
                      {game.homeTeam.hasPossession && game.isLive && (
                        <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse" title="Possession" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <style jsx>{`
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}</style>
      </div>
      <div className="h-10" /> {/* Spacer for fixed ticker */}
    </>
  );
}
