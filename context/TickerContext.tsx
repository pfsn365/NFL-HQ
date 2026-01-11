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

const TickerContext = createContext<TickerContextType>({
  games: [],
  loading: true,
  lastUpdated: null,
});

export function useTickerContext() {
  return useContext(TickerContext);
}

export function TickerProvider({ children }: { children: ReactNode }) {
  const [games, setGames] = useState<TickerGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [hasFetched, setHasFetched] = useState(false);

  const fetchGames = useCallback(async () => {
    try {
      const response = await fetch(getApiPath('api/nfl/espn-scoreboard?ticker=true'));
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setGames(data.games || []);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching live scores:', error);
    } finally {
      setLoading(false);
      setHasFetched(true);
    }
  }, []);

  useEffect(() => {
    // Only fetch if we haven't fetched yet
    if (!hasFetched) {
      fetchGames();
    }

    // Set up polling interval
    const interval = setInterval(fetchGames, 30000);
    return () => clearInterval(interval);
  }, [fetchGames, hasFetched]);

  return (
    <TickerContext.Provider value={{ games, loading, lastUpdated }}>
      {children}
    </TickerContext.Provider>
  );
}
