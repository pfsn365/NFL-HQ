'use client';

import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';

import { getAllTeams, TeamData } from '@/data/teams';
import NFLTeamsSidebar from '@/components/NFLTeamsSidebar';
import NFLTeamModal from '@/components/NFLTeamModal';
import { getAllTeamPicksForYear, TeamDraftPicks } from '@/lib/draftPicksUtils';
import { ArrowRight } from 'lucide-react';

const DRAFT_YEAR = 2026;

interface TankathonPick {
  pick: number;
  team: string;
  via: string;
  round: number;
}

interface TankathonData {
  lastUpdated: string;
  source: string;
  picks: TankathonPick[];
}

interface DraftBoardPick {
  pickNumber: number;
  round: number;
  owningTeam: TeamData;
  originalTeam: string;
  from: string;
  protections: string;
  isTraded: boolean;
  isSwapRights: boolean;
}

// Team abbreviation mapping
const TEAM_ABBREV_TO_ID: Record<string, string> = {
  'ATL': 'atlanta-hawks', 'BOS': 'boston-celtics', 'BKN': 'brooklyn-nets',
  'CHA': 'charlotte-hornets', 'CHI': 'chicago-bulls', 'CLE': 'cleveland-cavaliers',
  'DAL': 'dallas-mavericks', 'DEN': 'denver-nuggets', 'DET': 'detroit-pistons',
  'GSW': 'golden-state-warriors', 'HOU': 'houston-rockets', 'IND': 'indiana-pacers',
  'LAC': 'los-angeles-clippers', 'LAL': 'los-angeles-lakers', 'MEM': 'memphis-grizzlies',
  'MIA': 'miami-heat', 'MIL': 'milwaukee-bucks', 'MIN': 'minnesota-timberwolves',
  'NOP': 'new-orleans-pelicans', 'NYK': 'new-york-knicks', 'OKC': 'oklahoma-city-thunder',
  'ORL': 'orlando-magic', 'PHI': 'philadelphia-76ers', 'PHX': 'phoenix-suns',
  'POR': 'portland-trail-blazers', 'SAC': 'sacramento-kings', 'SAS': 'san-antonio-spurs',
  'TOR': 'toronto-raptors', 'UTA': 'utah-jazz', 'WAS': 'washington-wizards'
};

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

export default function DraftOrderClient() {
  const allTeams = getAllTeams();
  const [tankathonData, setTankathonData] = useState<TankathonData | null>(null);
  const [teamRecords, setTeamRecords] = useState<Map<string, string>>(new Map());
  const [allTeamsPicks, setAllTeamsPicks] = useState<Map<string, TeamDraftPicks>>(new Map());
  const [isLoadingTankathon, setIsLoadingTankathon] = useState(true);
  const [isLoadingStandings, setIsLoadingStandings] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);

  // Fetch Tankathon draft order
  useEffect(() => {
    async function fetchTankathonData() {
      try {
        setIsLoadingTankathon(true);
        const response = await fetch('/nba-hq/data/tankathon-draft-order.json');
        if (!response.ok) throw new Error('Failed to fetch draft order');
        const data: TankathonData = await response.json();
        setTankathonData(data);
      } catch (err) {
        console.error('Error fetching Tankathon data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load draft order');
      } finally {
        setIsLoadingTankathon(false);
      }
    }
    fetchTankathonData();
  }, []);

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
      } finally {
        setIsLoadingStandings(false);
      }
    }
    fetchStandings();
  }, []);

  // Convert Tankathon data to DraftBoardPick format
  const draftBoard = useMemo((): DraftBoardPick[] => {
    if (!tankathonData) return [];

    return tankathonData.picks.map(pick => {
      const teamId = TEAM_ABBREV_TO_ID[pick.team];
      const owningTeam = allTeams.find(t => t.id === teamId);

      if (!owningTeam) {
        console.warn(`Team not found for abbreviation: ${pick.team}`);
        return null;
      }

      const isTraded = pick.via !== 'Own';
      const fromText = isTraded ? `via ${pick.via}` : 'Own';

      return {
        pickNumber: pick.pick,
        round: pick.round,
        owningTeam,
        originalTeam: pick.via === 'Own' ? 'Own' : pick.via,
        from: fromText,
        protections: '',
        isTraded,
        isSwapRights: false
      };
    }).filter((pick): pick is DraftBoardPick => pick !== null);
  }, [tankathonData, allTeams]);

  // Group picks by round
  const picksByRound = useMemo(() => {
    const rounds: { [key: number]: DraftBoardPick[] } = { 1: [], 2: [] };
    draftBoard.forEach(pick => {
      if (pick.round === 1 || pick.round === 2) {
        rounds[pick.round].push(pick);
      }
    });
    return rounds;
  }, [draftBoard]);

  const isLoading = isLoadingTankathon || isLoadingStandings;

  // Get selected team data
  const selectedTeamData = useMemo(() => {
    if (!selectedTeam) return null;
    return allTeams.find(t => t.id === selectedTeam);
  }, [selectedTeam, allTeams]);

  const selectedTeamPicks = useMemo(() => {
    if (!selectedTeam) return [];
    // Filter picks from Tankathon data for this team
    return draftBoard.filter(pick => pick.owningTeam.id === selectedTeam);
  }, [selectedTeam, draftBoard]);

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
              {DRAFT_YEAR} NBA Draft Order
            </h1>
            <p className="text-base sm:text-lg lg:text-xl opacity-90">
              Complete draft order with actual pick ownership, trades, and protections
            </p>
          </div>
        </div>

        {/* Raptive Header Ad */}
        <div className="container mx-auto px-4 min-h-[150px]">
          <div className="raptive-pfn-header"></div>
        </div>

        {/* Draft Picks Content */}
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <svg
                  className="animate-spin h-12 w-12 mx-auto mb-4 text-[#0050A0]"
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
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <p className="text-gray-600 font-medium">Loading draft order...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h3 className="text-red-800 font-semibold mb-1">Failed to load draft data</h3>
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Draft Picks */}
          {!isLoading && [1, 2].map((round) => (
            <div key={round} className="mb-12">
              {/* Round Header */}
              <div className="bg-[#0050A0] text-white px-6 py-4 rounded-t-lg mb-6">
                <h2 className="text-2xl font-bold">Round {round}</h2>
              </div>

              {/* Lottery Note - Only show for Round 1 */}
              {round === 1 && (
                <div className="mb-4 px-2 space-y-2">
                  <p className="text-sm text-gray-600">
                    <span className="inline-block w-4 h-4 border-2 border-yellow-400 rounded mr-2 align-middle"></span>
                    Yellow border indicates lottery picks (1-14)
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="inline-block w-4 h-4 border-2 border-blue-400 rounded mr-2 align-middle"></span>
                    Blue border indicates traded picks
                  </p>
                </div>
              )}

              {/* Picks Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {picksByRound[round]?.map((pick, index) => {
                  const isLotteryPick = round === 1 && pick.pickNumber <= 14;
                  const owningTeamRecord = teamRecords.get(pick.owningTeam.id) || pick.owningTeam.record || '0-0';

                  const getFromTeamAbbr = (fromStr: string): string => {
                    if (!fromStr || fromStr === 'Own') return '';
                    const viaMatch = fromStr.match(/via\s+([A-Z]{2,3})/i);
                    if (viaMatch) return viaMatch[1].toUpperCase();
                    const abbrMatch = fromStr.match(/\b([A-Z]{2,3})\b/);
                    if (abbrMatch) return abbrMatch[1];
                    return fromStr;
                  };

                  const fromAbbr = getFromTeamAbbr(pick.from);

                  return (
                    <button
                      key={`${pick.pickNumber}-${pick.owningTeam.id}-${index}`}
                      onClick={() => setSelectedTeam(pick.owningTeam.id)}
                      className={`bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden cursor-pointer text-left w-full ${
                        isLotteryPick ? 'border-2 border-yellow-400' : pick.isTraded ? 'border-2 border-blue-400' : ''
                      }`}
                    >
                      <div className="p-4">
                        <div className="flex items-center gap-4 mb-3">
                          {/* Pick Number Box */}
                          <div
                            className="flex-shrink-0 w-14 h-14 rounded flex items-center justify-center text-white text-2xl font-bold"
                            style={{ backgroundColor: pick.owningTeam.primaryColor }}
                          >
                            {pick.pickNumber}
                          </div>

                          {/* Team Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <img
                                src={pick.owningTeam.logoUrl}
                                alt={pick.owningTeam.name}
                                
                                
                                className="w-8 h-8"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="text-base font-semibold text-gray-900 truncate">
                                  {pick.owningTeam.abbreviation} ({owningTeamRecord})
                                </div>
                                <div className="text-sm text-gray-600">
                                  {pick.owningTeam.name}
                                </div>
                                {fromAbbr && (
                                  <div className="text-xs text-blue-600 font-medium mt-0.5">
                                    via {fromAbbr}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Link to Lottery Simulator */}
          {!isLoading && (
            <div className="mt-12 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-lg p-6 text-center">
              <div className="max-w-2xl mx-auto">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  🎲 Try the Draft Lottery Simulator
                </h2>
                <p className="text-gray-700 mb-4">
                  Run thousands of lottery simulations to see probability distributions and possible outcomes for all 14 lottery teams
                </p>
                <Link
                  href="/lottery-simulator"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#0050A0] text-white rounded-lg hover:bg-[#003d7a] transition-colors font-semibold shadow-lg hover:shadow-xl"
                >
                  Launch Lottery Simulator
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          )}

          {/* NBA Draft Lottery Odds Table */}
          {!isLoading && (
            <div className="mt-12 bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">NBA Draft Lottery Odds</h2>
              <p className="text-sm text-gray-600 mb-6">Probability of landing each pick position (based on record)</p>

              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-[#0050A0] text-white">
                      <th className="p-3 text-center font-bold border border-blue-400">SEED</th>
                      <th className="p-3 text-center font-bold border border-blue-400">1</th>
                      <th className="p-3 text-center font-bold border border-blue-400">2</th>
                      <th className="p-3 text-center font-bold border border-blue-400">3</th>
                      <th className="p-3 text-center font-bold border border-blue-400">4</th>
                      <th className="p-3 text-center font-bold border border-blue-400">5</th>
                      <th className="p-3 text-center font-bold border border-blue-400">6</th>
                      <th className="p-3 text-center font-bold border border-blue-400">7</th>
                      <th className="p-3 text-center font-bold border border-blue-400">8</th>
                      <th className="p-3 text-center font-bold border border-blue-400">9</th>
                      <th className="p-3 text-center font-bold border border-blue-400">10</th>
                      <th className="p-3 text-center font-bold border border-blue-400">11</th>
                      <th className="p-3 text-center font-bold border border-blue-400">12</th>
                      <th className="p-3 text-center font-bold border border-blue-400">13</th>
                      <th className="p-3 text-center font-bold border border-blue-400">14</th>
                      <th className="p-3 text-center font-bold border border-blue-400 bg-[#0050A0]">AVG</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-700">
                    {[
                      [1, '14.0', '13.4', '12.7', '12.0', '47.9', '', '', '', '', '', '', '', '', '', '3.7'],
                      [2, '14.0', '13.4', '12.7', '12.0', '27.8', '20.0', '', '', '', '', '', '', '', '', '3.9'],
                      [3, '14.0', '13.4', '12.7', '12.0', '17.8', '19.0', '11.0', '', '', '', '', '', '', '', '4.2'],
                      [4, '14.0', '13.4', '12.7', '11.2', '9.8', '14.6', '13.6', '10.6', '', '', '', '', '', '', '5.0'],
                      [5, '10.5', '10.5', '10.5', '10.5', '7.7', '11.4', '11.3', '10.9', '11.7', '5.0', '', '', '', '', '6.0'],
                      [6, '9.0', '9.2', '9.4', '9.5', '7.8', '9.6', '9.6', '9.5', '9.0', '9.3', '9.0', '', '', '', '6.9'],
                      [7, '7.5', '7.8', '8.1', '8.3', '7.8', '8.0', '8.2', '8.2', '7.8', '8.2', '8.1', '8.0', '4.0', '', '7.8'],
                      [8, '6.0', '6.3', '6.7', '7.0', '7.5', '6.9', '7.0', '7.1', '6.9', '7.2', '7.1', '7.0', '7.2', '12.0', '8.5'],
                      [9, '4.5', '4.8', '5.2', '5.6', '6.8', '5.9', '6.0', '6.1', '6.1', '6.3', '6.2', '6.1', '6.3', '18.1', '9.4'],
                      [10, '3.0', '3.3', '3.7', '4.2', '5.8', '5.1', '5.2', '5.3', '5.4', '5.6', '5.5', '5.4', '5.7', '24.7', '10.3'],
                      [11, '2.0', '2.3', '2.7', '3.2', '4.8', '4.3', '4.5', '4.6', '4.8', '5.0', '5.0', '4.9', '5.2', '23.9', '11.1'],
                      [12, '1.5', '1.8', '2.2', '2.7', '3.8', '3.7', '3.9', '4.0', '4.2', '4.4', '4.4', '4.3', '4.7', '20.5', '11.8'],
                      [13, '1.0', '1.3', '1.7', '2.2', '2.8', '3.1', '3.3', '3.5', '3.7', '3.9', '3.9', '3.9', '4.2', '17.1', '12.4'],
                      [14, '0.5', '0.8', '1.2', '1.7', '1.8', '2.7', '2.9', '3.0', '3.2', '3.4', '3.4', '3.4', '3.7', '14.5', '13.0']
                    ].map((row, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="p-3 text-center font-semibold border border-gray-200 bg-gray-50">{row[0]}</td>
                        {row.slice(1).map((val, cellIdx) => (
                          <td
                            key={cellIdx}
                            className={`p-3 text-center border border-gray-200 ${cellIdx === 14 ? 'font-semibold bg-blue-50' : ''}`}
                          >
                            {val}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* NBA Draft Tiebreakers */}
          {!isLoading && (
            <div className="mt-12 bg-white rounded-lg shadow-sm p-6 border border-gray-200 mb-16">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                NBA Draft Tiebreakers
              </h2>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed mb-4">
                  When two or more teams finish the regular season with identical records, the NBA uses
                  random drawings to determine their draft order. These drawings take place at NBA
                  headquarters and are overseen by a representative from Ernst & Young to ensure impartiality.
                </p>
                <p className="text-gray-700 leading-relaxed mb-4">
                  <strong>For Lottery Teams (Non-Playoff Teams):</strong> When multiple lottery teams
                  have the same record, all of their assigned lottery combinations are pooled together
                  and then split evenly among them. If the total number of combinations cannot be divided
                  equally, a random drawing determines which team(s) receive the extra combination(s).
                </p>
                <p className="text-gray-700 leading-relaxed mb-4">
                  <strong>For Non-Lottery Teams (Playoff Teams):</strong> The random drawing directly
                  determines the order these teams will pick in the draft. Among playoff teams, those
                  who advance further in the playoffs pick later, with the NBA champion selecting last
                  at pick #30.
                </p>
                <p className="text-gray-700 leading-relaxed mb-4">
                  <strong>Second Round Order:</strong> An important note is that tiebreaker results
                  are reversed in the second round. If Team A wins a tiebreaker over Team B and picks
                  ahead in the first round, Team B will pick ahead of Team A in the second round.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Team Modal */}
      {selectedTeamData && (
        <NFLTeamModal
          isOpen={true}
          team={selectedTeamData}
          onClose={() => setSelectedTeam(null)}
          picks={selectedTeamPicks}
        />
      )}
    </div>
  );
}
