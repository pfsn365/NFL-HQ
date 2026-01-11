'use client';

import { useState, useEffect, useCallback } from 'react';
import { getApiPath } from '@/utils/api';

interface TickerGame {
  id: string;
  awayTeam: {
    abbr: string;
    logo: string;
    score?: number;
    hasPossession?: boolean;
  };
  homeTeam: {
    abbr: string;
    logo: string;
    score?: number;
    hasPossession?: boolean;
  };
  statusDetail: string;
  isLive: boolean;
  isFinal: boolean;
}

function PossessionIndicator() {
  return (
    <span className="inline-block w-0 h-0 border-l-[5px] border-l-yellow-400 border-y-[4px] border-y-transparent ml-1" />
  );
}

function TickerGameCard({ game }: { game: TickerGame }) {
  const isPreGame = !game.isLive && !game.isFinal;

  return (
    <div
      className={`flex-shrink-0 flex items-center gap-3 px-4 py-2 border-r border-gray-700 last:border-r-0
        ${game.isLive ? 'bg-green-900/30' : ''}`}
    >
      {/* Away Team */}
      <div className="flex items-center gap-1.5">
        <img
          src={game.awayTeam.logo}
          alt={game.awayTeam.abbr}
          className="w-6 h-6 object-contain"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://a.espncdn.com/i/teamlogos/nfl/500/default-team-logo-500.png';
          }}
        />
        <span className="text-sm font-medium text-white">{game.awayTeam.abbr}</span>
        {game.awayTeam.hasPossession && <PossessionIndicator />}
        {!isPreGame && (
          <span className={`text-sm font-bold ml-1 ${
            game.isFinal && game.awayTeam.score! > game.homeTeam.score!
              ? 'text-green-400'
              : 'text-gray-300'
          }`}>
            {game.awayTeam.score}
          </span>
        )}
      </div>

      {/* Separator / Status */}
      <div className="flex flex-col items-center min-w-[50px]">
        {isPreGame ? (
          <span className="text-xs text-gray-400">{game.statusDetail}</span>
        ) : (
          <>
            <span className="text-xs text-gray-500">@</span>
            {game.isLive && (
              <span className="text-xs font-medium text-green-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                {game.statusDetail}
              </span>
            )}
            {game.isFinal && (
              <span className="text-xs text-gray-400">Final</span>
            )}
          </>
        )}
      </div>

      {/* Home Team */}
      <div className="flex items-center gap-1.5">
        {!isPreGame && (
          <span className={`text-sm font-bold mr-1 ${
            game.isFinal && game.homeTeam.score! > game.awayTeam.score!
              ? 'text-green-400'
              : 'text-gray-300'
          }`}>
            {game.homeTeam.score}
          </span>
        )}
        {game.homeTeam.hasPossession && <PossessionIndicator />}
        <span className="text-sm font-medium text-white">{game.homeTeam.abbr}</span>
        <img
          src={game.homeTeam.logo}
          alt={game.homeTeam.abbr}
          className="w-6 h-6 object-contain"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://a.espncdn.com/i/teamlogos/nfl/500/default-team-logo-500.png';
          }}
        />
      </div>
    </div>
  );
}

export default function NFLScoreTicker() {
  const [games, setGames] = useState<TickerGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchGames = useCallback(async () => {
    try {
      const response = await fetch(getApiPath('api/nfl/espn-scoreboard?ticker=true'));

      if (!response.ok) {
        throw new Error('Failed to fetch scores');
      }

      const data = await response.json();
      setGames(data.games || []);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      console.error('Error fetching ticker data:', err);
      setError('Unable to load scores');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGames();

    // Refresh every 30 seconds
    const interval = setInterval(fetchGames, 30000);

    return () => clearInterval(interval);
  }, [fetchGames]);

  if (loading) {
    return (
      <div className="bg-[#111827] border-b border-gray-700 py-2 px-4 lg:pl-64">
        <div className="flex items-center justify-center">
          <div className="animate-pulse flex items-center gap-2">
            <div className="w-6 h-6 bg-gray-700 rounded-full" />
            <div className="w-16 h-4 bg-gray-700 rounded" />
            <div className="w-8 h-4 bg-gray-700 rounded" />
            <div className="w-16 h-4 bg-gray-700 rounded" />
            <div className="w-6 h-6 bg-gray-700 rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || games.length === 0) {
    return null; // Hide ticker if no games or error
  }

  const hasLiveGames = games.some(g => g.isLive);

  return (
    <div className="bg-[#111827] border-b border-gray-700 relative lg:pl-64">
      {/* Live indicator */}
      {hasLiveGames && (
        <div className="absolute left-2 lg:left-[calc(16rem+0.5rem)] top-1/2 -translate-y-1/2 z-10 flex items-center gap-1 bg-[#111827] pr-2">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="text-xs font-semibold text-red-400">LIVE</span>
        </div>
      )}

      {/* Scrolling ticker */}
      <div className="overflow-x-auto scrollbar-hide">
        <div className={`flex ${hasLiveGames ? 'pl-16' : ''}`}>
          {games.map(game => (
            <TickerGameCard key={game.id} game={game} />
          ))}
        </div>
      </div>

      {/* Gradient fade on edges */}
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#111827] to-transparent pointer-events-none" />
    </div>
  );
}
