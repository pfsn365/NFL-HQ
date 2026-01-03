'use client';

import { useMemo, useState, useEffect } from 'react';
import Image from 'next/image';
import { getAllTeams, TeamData } from '@/data/teams';
import NFLTeamsSidebar from '@/components/NFLTeamsSidebar';

const DRAFT_YEAR = 2026;

interface TankathonPick {
  pick: number;
  team: string; // 3-letter abbreviation
  via: string; // 3-letter abbreviation or "Own"
  round: number;
}

interface TankathonData {
  lastUpdated: string;
  source: string;
  picks: TankathonPick[];
}

// Team abbreviation to team ID mapping
const TEAM_ABBREV_TO_ID: Record<string, string> = {
  'ATL': 'atlanta-hawks',
  'BOS': 'boston-celtics',
  'BKN': 'brooklyn-nets',
  'CHA': 'charlotte-hornets',
  'CHI': 'chicago-bulls',
  'CLE': 'cleveland-cavaliers',
  'DAL': 'dallas-mavericks',
  'DEN': 'denver-nuggets',
  'DET': 'detroit-pistons',
  'GSW': 'golden-state-warriors',
  'HOU': 'houston-rockets',
  'IND': 'indiana-pacers',
  'LAC': 'los-angeles-clippers',
  'LAL': 'los-angeles-lakers',
  'MEM': 'memphis-grizzlies',
  'MIA': 'miami-heat',
  'MIL': 'milwaukee-bucks',
  'MIN': 'minnesota-timberwolves',
  'NOP': 'new-orleans-pelicans',
  'NYK': 'new-york-knicks',
  'OKC': 'oklahoma-city-thunder',
  'ORL': 'orlando-magic',
  'PHI': 'philadelphia-76ers',
  'PHX': 'phoenix-suns',
  'POR': 'portland-trail-blazers',
  'SAC': 'sacramento-kings',
  'SAS': 'san-antonio-spurs',
  'TOR': 'toronto-raptors',
  'UTA': 'utah-jazz',
  'WAS': 'washington-wizards'
};

export default function DraftOrderClient() {
  const allTeams = getAllTeams();
  const [draftData, setDraftData] = useState<TankathonData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch draft order from Tankathon data
  useEffect(() => {
    async function fetchDraftOrder() {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch('/nba-hq/data/tankathon-draft-order.json');

        if (!response.ok) {
          throw new Error('Failed to fetch draft order');
        }

        const data: TankathonData = await response.json();
        setDraftData(data);
      } catch (err) {
        console.error('Error fetching draft order:', err);
        setError(err instanceof Error ? err.message : 'Failed to load draft order');
      } finally {
        setIsLoading(false);
      }
    }

    fetchDraftOrder();
  }, []);

  // Group picks by round
  const picksByRound = useMemo(() => {
    if (!draftData) return { 1: [], 2: [] };

    const rounds: { [key: number]: TankathonPick[] } = { 1: [], 2: [] };
    draftData.picks.forEach(pick => {
      if (pick.round === 1 || pick.round === 2) {
        rounds[pick.round].push(pick);
      }
    });
    return rounds;
  }, [draftData]);

  // Get team data by abbreviation
  const getTeamByAbbrev = (abbrev: string): TeamData | undefined => {
    const teamId = TEAM_ABBREV_TO_ID[abbrev];
    return allTeams.find(t => t.id === teamId);
  };

  // Format via text
  const formatViaText = (via: string) => {
    if (via === 'Own') return null;
    const viaTeam = getTeamByAbbrev(via);
    return viaTeam ? `via ${viaTeam.abbreviation}` : `via ${via}`;
  };

  // Get last updated time
  const lastUpdatedText = useMemo(() => {
    if (!draftData) return '';
    const date = new Date(draftData.lastUpdated);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short'
    });
  }, [draftData]);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="hidden lg:block lg:w-64 flex-shrink-0">
        <NFLTeamsSidebar />
      </aside>

      {/* Mobile Sidebar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50">
        <NFLTeamsSidebar isMobile={true} />
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto lg:pt-0 pt-14">
        {/* Header Section */}
        <div className="bg-[#FF6B35] text-white py-8 px-4 sm:px-6 lg:px-8 w-full">
          <div className="mx-auto max-w-7xl">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-2">
              {DRAFT_YEAR} NBA Draft Order
            </h1>
            <p className="text-base sm:text-lg lg:text-xl opacity-90">
              Complete draft order powered by Tankathon
            </p>
            {draftData && (
              <p className="text-sm mt-2 opacity-75">
                Last updated: {lastUpdatedText}
              </p>
            )}
          </div>
        </div>

        {/* Draft Picks Content */}
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <svg
                  className="animate-spin h-12 w-12 mx-auto mb-4 text-orange-500"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <p className="text-gray-600">Loading draft order...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">Error: {error}</p>
            </div>
          )}

          {/* Draft Board */}
          {!isLoading && !error && draftData && (
            <div className="space-y-8">
              {/* Round 1 */}
              <div>
                <h2 className="text-2xl font-bold mb-4 text-gray-900">Round 1</h2>
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="divide-y divide-gray-200">
                    {picksByRound[1].map((pick) => {
                      const team = getTeamByAbbrev(pick.team);
                      if (!team) return null;

                      const viaText = formatViaText(pick.via);

                      return (
                        <div
                          key={pick.pick}
                          className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
                        >
                          {/* Pick Number */}
                          <div className="flex-shrink-0 w-12 text-center">
                            <span className="text-2xl font-bold text-gray-900">
                              {pick.pick}
                            </span>
                          </div>

                          {/* Team Logo */}
                          <div className="flex-shrink-0">
                            <Image
                              src={team.logoUrl}
                              alt={team.name}
                              width={48}
                              height={48}
                              className="object-contain"
                            />
                          </div>

                          {/* Team Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-gray-900 truncate">
                                {team.name}
                              </span>
                              {viaText && (
                                <span className="text-sm text-gray-500">
                                  {viaText}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Round 2 */}
              <div>
                <h2 className="text-2xl font-bold mb-4 text-gray-900">Round 2</h2>
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="divide-y divide-gray-200">
                    {picksByRound[2].map((pick) => {
                      const team = getTeamByAbbrev(pick.team);
                      if (!team) return null;

                      const viaText = formatViaText(pick.via);

                      return (
                        <div
                          key={pick.pick}
                          className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
                        >
                          {/* Pick Number */}
                          <div className="flex-shrink-0 w-12 text-center">
                            <span className="text-2xl font-bold text-gray-900">
                              {pick.pick}
                            </span>
                          </div>

                          {/* Team Logo */}
                          <div className="flex-shrink-0">
                            <Image
                              src={team.logoUrl}
                              alt={team.name}
                              width={48}
                              height={48}
                              className="object-contain"
                            />
                          </div>

                          {/* Team Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-gray-900 truncate">
                                {team.name}
                              </span>
                              {viaText && (
                                <span className="text-sm text-gray-500">
                                  {viaText}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Data Source */}
              <div className="text-center text-sm text-gray-500 pt-4">
                <p>Draft order data from <a href="https://www.tankathon.com" target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:underline">Tankathon</a></p>
                <p className="mt-1">Updates every 30 minutes</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
