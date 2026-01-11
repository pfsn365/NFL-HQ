'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
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
  startDate: string;
  isLive: boolean;
  isFinal: boolean;
}

interface TickerContextType {
  games: TickerGame[];
  loading: boolean;
  lastUpdated: Date | null;
}

// Module-level cache that persists across component re-mounts
let cachedGames: TickerGame[] = [];
let cachedLastUpdated: Date | null = null;
let hasFetchedOnce = false;
let pollInterval: NodeJS.Timeout | null = null;

const TickerContext = createContext<TickerContextType>({
  games: [],
  loading: true,
  lastUpdated: null,
});

export function useTickerContext() {
  return useContext(TickerContext);
}

export function TickerProvider({ children }: { children: ReactNode }) {
  // Initialize state from cache
  const [games, setGames] = useState<TickerGame[]>(cachedGames);
  const [loading, setLoading] = useState(!hasFetchedOnce);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(cachedLastUpdated);

  const fetchGames = useCallback(async () => {
    try {
      const response = await fetch(getApiPath('api/nfl/espn-scoreboard?ticker=true'));
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      const newGames = data.games || [];

      // Update both state and cache
      cachedGames = newGames;
      cachedLastUpdated = new Date();
      hasFetchedOnce = true;

      setGames(newGames);
      setLastUpdated(cachedLastUpdated);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching live scores:', error);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Only fetch if we haven't fetched before (globally)
    if (!hasFetchedOnce) {
      fetchGames();
    }

    // Set up polling interval (only once globally)
    if (!pollInterval) {
      pollInterval = setInterval(fetchGames, 30000);
    }

    // Don't clear interval on unmount - keep polling globally
    return () => {};
  }, [fetchGames]);

  return (
    <TickerContext.Provider value={{ games, loading, lastUpdated }}>
      {children}
    </TickerContext.Provider>
  );
}
