'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

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

// ESPN API response types
interface ESPNCompetitor {
  id: string;
  homeAway: 'home' | 'away';
  team: {
    abbreviation: string;
    logo: string;
  };
  score?: string;
}

interface ESPNCompetition {
  competitors: ESPNCompetitor[];
  status: {
    type: {
      state: string; // 'pre', 'in', 'post'
      shortDetail: string;
    };
  };
  situation?: {
    possession?: string;
  };
}

interface ESPNEvent {
  id: string;
  date: string;
  competitions: ESPNCompetition[];
}

interface ESPNScoreboardResponse {
  events: ESPNEvent[];
}

// Transform ESPN event to ticker game format
function transformToTickerGame(event: ESPNEvent): TickerGame | null {
  const competition = event.competitions[0];
  if (!competition) return null;

  const awayCompetitor = competition.competitors.find(c => c.homeAway === 'away');
  const homeCompetitor = competition.competitors.find(c => c.homeAway === 'home');

  if (!awayCompetitor || !homeCompetitor) return null;

  const isLive = competition.status.type.state === 'in';
  const isFinal = competition.status.type.state === 'post';
  const hasScore = isLive || isFinal;

  const possessionTeamId = competition.situation?.possession;

  return {
    id: event.id,
    awayTeam: {
      abbr: awayCompetitor.team.abbreviation,
      logo: awayCompetitor.team.logo,
      score: hasScore ? parseInt(awayCompetitor.score || '0') : undefined,
      hasPossession: isLive && possessionTeamId === awayCompetitor.id,
    },
    homeTeam: {
      abbr: homeCompetitor.team.abbreviation,
      logo: homeCompetitor.team.logo,
      score: hasScore ? parseInt(homeCompetitor.score || '0') : undefined,
      hasPossession: isLive && possessionTeamId === homeCompetitor.id,
    },
    statusDetail: competition.status.type.shortDetail,
    startDate: event.date,
    isLive,
    isFinal,
  };
}

// Module-level cache that persists across component re-mounts
let cachedGames: TickerGame[] = [];
let cachedLastUpdated: Date | null = null;
let hasFetchedOnce = false;

// Reference counting for poll interval management
let pollInterval: NodeJS.Timeout | null = null;
let subscriberCount = 0;

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
      // Call ESPN API directly
      const response = await fetch('https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard');
      if (!response.ok) throw new Error('Failed to fetch');
      const data: ESPNScoreboardResponse = await response.json();

      // Transform ESPN data to ticker format
      const tickerGames = (data.events || [])
        .map(transformToTickerGame)
        .filter((game): game is TickerGame => game !== null);

      // Check if there are any live games
      const hasLiveGames = tickerGames.some(g => g.isLive);

      // Sort games: Live first, then Final (if no live), then upcoming
      const sortedGames = [...tickerGames].sort((a, b) => {
        // Live games always first
        if (a.isLive && !b.isLive) return -1;
        if (!a.isLive && b.isLive) return 1;

        // If no live games, Final games come before upcoming
        if (!hasLiveGames) {
          if (a.isFinal && !b.isFinal) return -1;
          if (!a.isFinal && b.isFinal) return 1;
        }

        return 0; // Keep original order within same category
      });

      // Update both state and cache
      cachedGames = sortedGames;
      cachedLastUpdated = new Date();
      hasFetchedOnce = true;

      setGames(sortedGames);
      setLastUpdated(cachedLastUpdated);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching live scores from ESPN:', error);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Increment subscriber count
    subscriberCount++;

    // Only fetch if we haven't fetched before (globally)
    if (!hasFetchedOnce) {
      fetchGames();
    }

    // Set up polling interval (only once globally when first subscriber mounts)
    if (!pollInterval) {
      pollInterval = setInterval(fetchGames, 30000);
    }

    // Cleanup: decrement subscriber count and clear interval when last subscriber unmounts
    return () => {
      subscriberCount--;

      // Only clear interval when no more subscribers
      if (subscriberCount === 0 && pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
      }
    };
  }, [fetchGames]);

  return (
    <TickerContext.Provider value={{ games, loading, lastUpdated }}>
      {children}
    </TickerContext.Provider>
  );
}
