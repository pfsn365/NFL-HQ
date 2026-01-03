'use client';

import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { getAllTeams } from '@/data/teams';
import NFLTeamsSidebar from '@/components/NFLTeamsSidebar';
import LotterySimulator from '@/components/LotterySimulator';
import { lotterySimulator } from '@/lib/lotterySimulator';
import { ArrowRight } from 'lucide-react';

// Map API team slugs to our team IDs
const teamSlugMapping: Record<string, string> = {
  'atlanta-hawks': 'atlanta-hawks', 'boston-celtics': 'boston-celtics',
  'brooklyn-nets': 'brooklyn-nets', 'charlotte-hornets': 'charlotte-hornets',
  'chicago-bulls': 'chicago-bulls', 'cleveland-cavaliers': 'cleveland-cavaliers',
  'dallas-mavericks': 'dallas-mavericks', 'denver-nuggets': 'denver-nuggets',
  'detroit-pistons': 'detroit-pistons', 'golden-state-warriors': 'golden-state-warriors',
  'houston-rockets': 'houston-rockets', 'indiana-pacers': 'indiana-pacers',
  'la-clippers': 'los-angeles-clippers', 'los-angeles-clippers': 'los-angeles-clippers',
  'lakers': 'los-angeles-lakers', 'los-angeles-lakers': 'los-angeles-lakers',
  'memphis-grizzlies': 'memphis-grizzlies', 'miami-heat': 'miami-heat',
  'milwaukee-bucks': 'milwaukee-bucks', 'minnesota-timberwolves': 'minnesota-timberwolves',
  'new-orleans-pelicans': 'new-orleans-pelicans', 'new-york-knicks': 'new-york-knicks',
  'oklahoma-city-thunder': 'oklahoma-city-thunder', 'orlando-magic': 'orlando-magic',
  'philadelphia-76ers': 'philadelphia-76ers', 'phoenix-suns': 'phoenix-suns',
  'portland-trail-blazers': 'portland-trail-blazers', 'portland-trailblazers': 'portland-trail-blazers',
  'sacramento-kings': 'sacramento-kings', 'san-antonio-spurs': 'san-antonio-spurs',
  'toronto-raptors': 'toronto-raptors', 'utah-jazz': 'utah-jazz',
  'washington-wizards': 'washington-wizards',
};

export default function LotterySimulatorClient() {
  const allTeams = getAllTeams();
  const [teamRecords, setTeamRecords] = useState<Map<string, string>>(new Map());
  const [isLoadingStandings, setIsLoadingStandings] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch live standings for team records
  useEffect(() => {
    async function fetchStandings() {
      try {
        setIsLoadingStandings(true);
        setError(null);
        const response = await fetch('/nba-hq/api/nba/standings?season=2025&level=conference');
        if (!response.ok) throw new Error('Failed to fetch standings');
        const data = await response.json();

        const recordsMap = new Map<string, string>();
        if (data.data?.standings?.conferences) {
          for (const conf of data.data.standings.conferences) {
            for (const team of conf.teams) {
              const teamId = teamSlugMapping[team.sk_slug] || team.sk_slug;
              const wins = team.wins || 0;
              const losses = team.losses || 0;
              recordsMap.set(teamId, `${wins}-${losses}`);
            }
          }
        }
        setTeamRecords(recordsMap);
      } catch (err) {
        console.error('Error fetching standings:', err);
        setError('Failed to load current standings. Please try again later.');
      } finally {
        setIsLoadingStandings(false);
      }
    }
    fetchStandings();
  }, []);

  // Create lottery teams for simulator
  const lotteryTeams = useMemo(() => {
    if (teamRecords.size === 0) return [];
    return lotterySimulator.createLotteryTeams(allTeams, teamRecords);
  }, [allTeams, teamRecords]);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="hidden lg:block lg:w-64 flex-shrink-0">
        <NFLTeamsSidebar />
      </aside>

      {/* Mobile Sidebar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50">
        <NFLTeamsSidebar isMobile={true} />
      </div>

      {/* Main Content */}
      <main className="flex-1 lg:pt-0 pt-14">
        {/* Header Section */}
        <div className="bg-[#0050A0] text-white py-8 px-4 sm:px-6 lg:px-8 w-full">
          <div className="mx-auto max-w-7xl">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-2">
              2026 NBA Draft Lottery Simulator
            </h1>
            <p className="text-base sm:text-lg lg:text-xl opacity-90">
              Simulate the draft lottery to see possible outcomes based on current standings
            </p>
          </div>
        </div>

        {/* Raptive Header Ad */}
        <div className="container mx-auto px-4 min-h-[150px]">
          <div className="raptive-pfn-header"></div>
        </div>

        {/* Content */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          {/* Loading State */}
          {isLoadingStandings && (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center border border-gray-200">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-[#0050A0] mb-4"></div>
              <p className="text-gray-600">Loading current standings...</p>
            </div>
          )}

          {/* Error State */}
          {error && !isLoadingStandings && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <p className="text-red-800 font-medium mb-2">Error</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Lottery Simulator */}
          {!isLoadingStandings && !error && lotteryTeams.length > 0 && (
            <div className="space-y-8">
              <LotterySimulator teams={lotteryTeams} />

              {/* Link to Draft Order */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 text-center">
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Want to see the actual projected draft order?
                </h3>
                <p className="text-gray-700 mb-4 text-sm">
                  Check out our complete 2026 NBA Draft Order with actual pick ownership, trades, and protections.
                </p>
                <Link
                  href="/draft-order"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-[#003d7a] transition-colors font-semibold"
                >
                  View Draft Order
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>

              {/* Information Section */}
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">About the NBA Draft Lottery</h2>

                <div className="space-y-4 text-gray-700">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">How It Works</h3>
                    <p className="text-sm">
                      The NBA Draft Lottery determines the order for the first 14 picks in the NBA Draft. The 14 teams that did not make the playoffs participate in the lottery. Four teams are selected at random through a weighted system based on their regular season record. The remaining 10 teams are slotted in reverse order of their regular season record.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Lottery Odds</h3>
                    <p className="text-sm">
                      The three teams with the worst records have the best chance at the top pick:
                    </p>
                    <ul className="text-sm list-disc list-inside mt-2 space-y-1">
                      <li>Worst record: 14.0% chance at #1 pick</li>
                      <li>2nd worst: 14.0% chance at #1 pick</li>
                      <li>3rd worst: 14.0% chance at #1 pick</li>
                      <li>4th worst: 12.5% chance at #1 pick</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Using This Simulator</h3>
                    <ul className="text-sm space-y-1">
                      <li><strong>Run Once:</strong> See one possible lottery outcome to get a feel for how it could go</li>
                      <li><strong>Run 1,000x:</strong> See probability analysis showing average outcomes and distributions</li>
                      <li><strong>Run 10,000x:</strong> Get more statistically accurate probability data</li>
                    </ul>
                  </div>

                  <div className="bg-blue-50 border-l-4 border-[#0050A0] p-4 mt-4">
                    <p className="text-sm text-blue-800">
                      <strong>Note:</strong> This simulator uses the official NBA lottery odds and methodology. Results are based on the current season standings and update automatically.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!isLoadingStandings && !error && lotteryTeams.length === 0 && (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center border border-gray-200">
              <p className="text-gray-600">No lottery teams available. Please check back later.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
