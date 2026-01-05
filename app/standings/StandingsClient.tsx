'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { getAllTeams } from '@/data/teams';
import Link from 'next/link';
import NFLTeamsSidebar from '@/components/NFLTeamsSidebar';

interface StandingData {
  teamId: string;
  teamName: string;
  conference: 'Eastern' | 'Western';
  division: string;
  wins: number;
  losses: number;
  winPct: number;
  gamesBack: number;
  homeRecord: string;
  awayRecord: string;
  confRecord: string;
  divRecord: string;
  streak: string;
  last10: string;
}

// Map API team slugs to our team IDs
const teamSlugMapping: Record<string, string> = {
  'atlanta-hawks': 'atlanta-hawks',
  'boston-celtics': 'boston-celtics',
  'brooklyn-nets': 'brooklyn-nets',
  'charlotte-hornets': 'charlotte-hornets',
  'chicago-bulls': 'chicago-bulls',
  'cleveland-cavaliers': 'cleveland-cavaliers',
  'dallas-mavericks': 'dallas-mavericks',
  'denver-nuggets': 'denver-nuggets',
  'detroit-pistons': 'detroit-pistons',
  'golden-state-warriors': 'golden-state-warriors',
  'houston-rockets': 'houston-rockets',
  'indiana-pacers': 'indiana-pacers',
  'la-clippers': 'los-angeles-clippers',
  'los-angeles-clippers': 'los-angeles-clippers',
  'lakers': 'los-angeles-lakers',
  'los-angeles-lakers': 'los-angeles-lakers',
  'memphis-grizzlies': 'memphis-grizzlies',
  'miami-heat': 'miami-heat',
  'milwaukee-bucks': 'milwaukee-bucks',
  'minnesota-timberwolves': 'minnesota-timberwolves',
  'new-orleans-pelicans': 'new-orleans-pelicans',
  'new-york-knicks': 'new-york-knicks',
  'oklahoma-city-thunder': 'oklahoma-city-thunder',
  'orlando-magic': 'orlando-magic',
  'philadelphia-76ers': 'philadelphia-76ers',
  'phoenix-suns': 'phoenix-suns',
  'portland-trail-blazers': 'portland-trail-blazers',
  'portland-trailblazers': 'portland-trail-blazers',
  'sacramento-kings': 'sacramento-kings',
  'san-antonio-spurs': 'san-antonio-spurs',
  'toronto-raptors': 'toronto-raptors',
  'utah-jazz': 'utah-jazz',
  'washington-wizards': 'washington-wizards',
};

// Sample standings data for 2025-26 season (fallback)
const sampleStandingsData: StandingData[] = [
  // Eastern Conference - Atlantic
  { teamId: 'boston-celtics', teamName: 'Boston Celtics', conference: 'Eastern', division: 'Atlantic', wins: 12, losses: 3, winPct: 0.800, gamesBack: 0, homeRecord: '7-1', awayRecord: '5-2', confRecord: '8-2', divRecord: '3-1', streak: 'W3', last10: '8-2' },
  { teamId: 'new-york-knicks', teamName: 'New York Knicks', conference: 'Eastern', division: 'Atlantic', wins: 10, losses: 5, winPct: 0.667, gamesBack: 2, homeRecord: '6-2', awayRecord: '4-3', confRecord: '7-3', divRecord: '3-1', streak: 'W1', last10: '7-3' },
  { teamId: 'philadelphia-76ers', teamName: 'Philadelphia 76ers', conference: 'Eastern', division: 'Atlantic', wins: 9, losses: 6, winPct: 0.600, gamesBack: 3, homeRecord: '5-3', awayRecord: '4-3', confRecord: '6-4', divRecord: '2-2', streak: 'L1', last10: '6-4' },
  { teamId: 'brooklyn-nets', teamName: 'Brooklyn Nets', conference: 'Eastern', division: 'Atlantic', wins: 6, losses: 9, winPct: 0.400, gamesBack: 6, homeRecord: '4-4', awayRecord: '2-5', confRecord: '4-6', divRecord: '1-3', streak: 'L2', last10: '4-6' },
  { teamId: 'toronto-raptors', teamName: 'Toronto Raptors', conference: 'Eastern', division: 'Atlantic', wins: 4, losses: 11, winPct: 0.267, gamesBack: 8, homeRecord: '3-5', awayRecord: '1-6', confRecord: '3-7', divRecord: '1-3', streak: 'L3', last10: '3-7' },

  // Eastern Conference - Central
  { teamId: 'cleveland-cavaliers', teamName: 'Cleveland Cavaliers', conference: 'Eastern', division: 'Central', wins: 11, losses: 4, winPct: 0.733, gamesBack: 1, homeRecord: '6-2', awayRecord: '5-2', confRecord: '7-3', divRecord: '3-1', streak: 'W2', last10: '7-3' },
  { teamId: 'milwaukee-bucks', teamName: 'Milwaukee Bucks', conference: 'Eastern', division: 'Central', wins: 9, losses: 6, winPct: 0.600, gamesBack: 3, homeRecord: '5-3', awayRecord: '4-3', confRecord: '6-4', divRecord: '2-2', streak: 'W1', last10: '6-4' },
  { teamId: 'indiana-pacers', teamName: 'Indiana Pacers', conference: 'Eastern', division: 'Central', wins: 8, losses: 7, winPct: 0.533, gamesBack: 4, homeRecord: '5-3', awayRecord: '3-4', confRecord: '5-5', divRecord: '2-2', streak: 'L1', last10: '5-5' },
  { teamId: 'chicago-bulls', teamName: 'Chicago Bulls', conference: 'Eastern', division: 'Central', wins: 7, losses: 8, winPct: 0.467, gamesBack: 5, homeRecord: '4-4', awayRecord: '3-4', confRecord: '5-5', divRecord: '2-2', streak: 'W1', last10: '5-5' },
  { teamId: 'detroit-pistons', teamName: 'Detroit Pistons', conference: 'Eastern', division: 'Central', wins: 5, losses: 10, winPct: 0.333, gamesBack: 7, homeRecord: '3-5', awayRecord: '2-5', confRecord: '4-6', divRecord: '1-3', streak: 'L2', last10: '4-6' },

  // Eastern Conference - Southeast
  { teamId: 'orlando-magic', teamName: 'Orlando Magic', conference: 'Eastern', division: 'Southeast', wins: 10, losses: 5, winPct: 0.667, gamesBack: 2, homeRecord: '6-2', awayRecord: '4-3', confRecord: '7-3', divRecord: '3-1', streak: 'W2', last10: '7-3' },
  { teamId: 'miami-heat', teamName: 'Miami Heat', conference: 'Eastern', division: 'Southeast', wins: 9, losses: 6, winPct: 0.600, gamesBack: 3, homeRecord: '5-3', awayRecord: '4-3', confRecord: '6-4', divRecord: '2-2', streak: 'W1', last10: '6-4' },
  { teamId: 'atlanta-hawks', teamName: 'Atlanta Hawks', conference: 'Eastern', division: 'Southeast', wins: 7, losses: 8, winPct: 0.467, gamesBack: 5, homeRecord: '4-4', awayRecord: '3-4', confRecord: '5-5', divRecord: '2-2', streak: 'L1', last10: '5-5' },
  { teamId: 'charlotte-hornets', teamName: 'Charlotte Hornets', conference: 'Eastern', division: 'Southeast', wins: 6, losses: 9, winPct: 0.400, gamesBack: 6, homeRecord: '4-4', awayRecord: '2-5', confRecord: '4-6', divRecord: '1-3', streak: 'L2', last10: '4-6' },
  { teamId: 'washington-wizards', teamName: 'Washington Wizards', conference: 'Eastern', division: 'Southeast', wins: 3, losses: 12, winPct: 0.200, gamesBack: 9, homeRecord: '2-6', awayRecord: '1-6', confRecord: '2-8', divRecord: '0-4', streak: 'L4', last10: '2-8' },

  // Western Conference - Northwest
  { teamId: 'oklahoma-city-thunder', teamName: 'Oklahoma City Thunder', conference: 'Western', division: 'Northwest', wins: 13, losses: 2, winPct: 0.867, gamesBack: 0, homeRecord: '7-1', awayRecord: '6-1', confRecord: '9-1', divRecord: '4-0', streak: 'W4', last10: '9-1' },
  { teamId: 'denver-nuggets', teamName: 'Denver Nuggets', conference: 'Western', division: 'Northwest', wins: 10, losses: 5, winPct: 0.667, gamesBack: 3, homeRecord: '6-2', awayRecord: '4-3', confRecord: '7-3', divRecord: '3-1', streak: 'W2', last10: '7-3' },
  { teamId: 'minnesota-timberwolves', teamName: 'Minnesota Timberwolves', conference: 'Western', division: 'Northwest', wins: 9, losses: 6, winPct: 0.600, gamesBack: 4, homeRecord: '5-3', awayRecord: '4-3', confRecord: '6-4', divRecord: '2-2', streak: 'W1', last10: '6-4' },
  { teamId: 'portland-trail-blazers', teamName: 'Portland Trail Blazers', conference: 'Western', division: 'Northwest', wins: 6, losses: 9, winPct: 0.400, gamesBack: 7, homeRecord: '4-4', awayRecord: '2-5', confRecord: '4-6', divRecord: '1-3', streak: 'L2', last10: '4-6' },
  { teamId: 'utah-jazz', teamName: 'Utah Jazz', conference: 'Western', division: 'Northwest', wins: 4, losses: 11, winPct: 0.267, gamesBack: 9, homeRecord: '3-5', awayRecord: '1-6', confRecord: '3-7', divRecord: '1-3', streak: 'L3', last10: '3-7' },

  // Western Conference - Pacific
  { teamId: 'golden-state-warriors', teamName: 'Golden State Warriors', conference: 'Western', division: 'Pacific', wins: 11, losses: 4, winPct: 0.733, gamesBack: 2, homeRecord: '6-2', awayRecord: '5-2', confRecord: '8-2', divRecord: '3-1', streak: 'W3', last10: '8-2' },
  { teamId: 'los-angeles-lakers', teamName: 'Los Angeles Lakers', conference: 'Western', division: 'Pacific', wins: 10, losses: 5, winPct: 0.667, gamesBack: 3, homeRecord: '6-2', awayRecord: '4-3', confRecord: '7-3', divRecord: '3-1', streak: 'W2', last10: '7-3' },
  { teamId: 'phoenix-suns', teamName: 'Phoenix Suns', conference: 'Western', division: 'Pacific', wins: 9, losses: 6, winPct: 0.600, gamesBack: 4, homeRecord: '5-3', awayRecord: '4-3', confRecord: '6-4', divRecord: '2-2', streak: 'W1', last10: '6-4' },
  { teamId: 'los-angeles-clippers', teamName: 'Los Angeles Clippers', conference: 'Western', division: 'Pacific', wins: 8, losses: 7, winPct: 0.533, gamesBack: 5, homeRecord: '5-3', awayRecord: '3-4', confRecord: '5-5', divRecord: '2-2', streak: 'L1', last10: '5-5' },
  { teamId: 'sacramento-kings', teamName: 'Sacramento Kings', conference: 'Western', division: 'Pacific', wins: 7, losses: 8, winPct: 0.467, gamesBack: 6, homeRecord: '4-4', awayRecord: '3-4', confRecord: '5-5', divRecord: '1-3', streak: 'L2', last10: '5-5' },

  // Western Conference - Southwest
  { teamId: 'houston-rockets', teamName: 'Houston Rockets', conference: 'Western', division: 'Southwest', wins: 11, losses: 4, winPct: 0.733, gamesBack: 2, homeRecord: '6-2', awayRecord: '5-2', confRecord: '8-2', divRecord: '3-1', streak: 'W2', last10: '8-2' },
  { teamId: 'dallas-mavericks', teamName: 'Dallas Mavericks', conference: 'Western', division: 'Southwest', wins: 10, losses: 5, winPct: 0.667, gamesBack: 3, homeRecord: '6-2', awayRecord: '4-3', confRecord: '7-3', divRecord: '3-1', streak: 'W1', last10: '7-3' },
  { teamId: 'memphis-grizzlies', teamName: 'Memphis Grizzlies', conference: 'Western', division: 'Southwest', wins: 9, losses: 6, winPct: 0.600, gamesBack: 4, homeRecord: '5-3', awayRecord: '4-3', confRecord: '6-4', divRecord: '2-2', streak: 'W1', last10: '6-4' },
  { teamId: 'san-antonio-spurs', teamName: 'San Antonio Spurs', conference: 'Western', division: 'Southwest', wins: 7, losses: 8, winPct: 0.467, gamesBack: 6, homeRecord: '4-4', awayRecord: '3-4', confRecord: '5-5', divRecord: '2-2', streak: 'L1', last10: '5-5' },
  { teamId: 'new-orleans-pelicans', teamName: 'New Orleans Pelicans', conference: 'Western', division: 'Southwest', wins: 5, losses: 10, winPct: 0.333, gamesBack: 8, homeRecord: '3-5', awayRecord: '2-5', confRecord: '4-6', divRecord: '1-3', streak: 'L3', last10: '4-6' },
];

type SortKey = 'wins' | 'losses' | 'winPct' | 'gamesBack' | 'confRecord' | 'divRecord' | 'streak' | 'last10';

export default function StandingsClient() {
  const [conferenceView, setConferenceView] = useState<'all' | 'conference' | 'Eastern' | 'Western'>('all');
  const [sortKey, setSortKey] = useState<SortKey>('wins');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [standingsData, setStandingsData] = useState<StandingData[]>(sampleStandingsData);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allTeams = getAllTeams();

  // Fetch standings from API - only runs once on mount
  useEffect(() => {
    // Prevent re-fetching if already loaded
    if (hasLoaded) return;

    async function fetchStandings() {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch('/nfl-hq/api/nfl/standings?season=2025&level=conference');

        if (!response.ok) {
          throw new Error('Failed to fetch standings');
        }

        const data = await response.json();

        // Transform API data to our format
        // API returns { data: { standings: { conferences: [...] } } }
        const transformedData: StandingData[] = [];
        const conferences = data.data?.standings?.conferences;
        const teams = getAllTeams();

        if (conferences) {
          for (const conf of conferences) {
            const conferenceName = conf.name.includes('Eastern') ? 'Eastern' : 'Western';

            for (const team of conf.teams) {
              // Map API slug to our team ID
              const teamId = teamSlugMapping[team.sk_slug] || team.sk_slug;

              // Find our team data to get division
              const ourTeam = teams.find(t => t.id === teamId);

              if (ourTeam) {
                transformedData.push({
                  teamId,
                  teamName: ourTeam.fullName,
                  conference: conferenceName,
                  division: ourTeam.division,
                  wins: team.wins || 0,
                  losses: team.losses || 0,
                  winPct: parseFloat(team.percentage || '0'),
                  gamesBack: team.conference_rank?.games_behind || 0,
                  homeRecord: `${team.home_wins || 0}-${team.home_losses || 0}`,
                  awayRecord: `${team.away_wins || 0}-${team.away_losses || 0}`,
                  confRecord: `${team.conf_wins || 0}-${team.conf_losses || 0}`,
                  divRecord: `${team.div_wins || 0}-${team.div_losses || 0}`,
                  streak: team.streak || '-',
                  last10: `${team.last_10_wins || 0}-${team.last_10_losses || 0}`,
                });
              }
            }
          }
        }

        if (transformedData.length > 0) {
          setStandingsData(transformedData);
        } else {
          // If no data, keep using sample data
          console.warn('No standings data received from API, using sample data');
        }

      } catch (err) {
        console.error('Error fetching standings:', err);
        setError(err instanceof Error ? err.message : 'Failed to load standings');
        // Keep using sample data on error
      } finally {
        setIsLoading(false);
        setHasLoaded(true);
      }
    }

    fetchStandings();
  }, [hasLoaded]);

  const getTeamInfo = (teamName: string) => {
    const team = allTeams.find(t => t.fullName === teamName || t.name === teamName);
    if (team) {
      return { abbreviation: team.abbreviation, logoUrl: team.logoUrl, primaryColor: team.primaryColor };
    }
    return null;
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('desc');
    }
  };

  const parseRecord = (record: string): number => {
    const [wins] = record.split('-').map(Number);
    return wins;
  };

  const filteredAndSortedData = useMemo(() => {
    let filtered = standingsData;

    // For 'all', show all teams. For 'conference', show all teams but grouped by conference
    // For 'Eastern' or 'Western', filter to that conference only
    if (conferenceView === 'Eastern' || conferenceView === 'Western') {
      filtered = filtered.filter(team => team.conference === conferenceView);
    }

    const sorted = [...filtered].sort((a, b) => {
      let aValue: number | string = a[sortKey];
      let bValue: number | string = b[sortKey];

      // Handle string-based records
      if (sortKey === 'confRecord' || sortKey === 'divRecord' || sortKey === 'last10') {
        aValue = parseRecord(aValue as string);
        bValue = parseRecord(bValue as string);
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'desc' ? bValue - aValue : aValue - bValue;
      }

      return 0;
    });

    return sorted;
  }, [standingsData, conferenceView, sortKey, sortDirection]);

  const easternTeams = filteredAndSortedData.filter(team => team.conference === 'Eastern');
  const westernTeams = filteredAndSortedData.filter(team => team.conference === 'Western');

  // Group teams by division
  const atlanticTeams = easternTeams.filter(team => team.division === 'Atlantic');
  const centralTeams = easternTeams.filter(team => team.division === 'Central');
  const southeastTeams = easternTeams.filter(team => team.division === 'Southeast');

  const northwestTeams = westernTeams.filter(team => team.division === 'Northwest');
  const pacificTeams = westernTeams.filter(team => team.division === 'Pacific');
  const southwestTeams = westernTeams.filter(team => team.division === 'Southwest');

  const SortIndicator = ({ column }: { column: SortKey }) => {
    if (sortKey !== column) {
      return (
        <svg className="w-4 h-4 text-white opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }

    return sortDirection === 'desc' ? (
      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    );
  };

  const StandingsTable = ({ teams, conferenceName }: { teams: StandingData[], conferenceName?: string }) => (
    <div className="mb-8">
      {conferenceName && <h2 className="text-2xl font-bold text-gray-900 mb-4">{conferenceName}</h2>}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded-lg overflow-hidden shadow-sm">
          <thead style={{ backgroundColor: '#0050A0' }}>
            <tr>
              <th className="pl-6 pr-4 py-3 text-left text-sm font-bold text-white w-12">#</th>
              <th className="px-4 py-3 text-left text-sm font-bold text-white">Team</th>
              <th
                className="px-4 py-3 text-center text-sm font-bold text-white cursor-pointer hover:bg-[#003d7a] transition-colors"
                onClick={() => handleSort('wins')}
              >
                <div className="flex items-center justify-center gap-2">
                  W
                  <SortIndicator column="wins" />
                </div>
              </th>
              <th
                className="px-4 py-3 text-center text-sm font-bold text-white cursor-pointer hover:bg-[#003d7a] transition-colors"
                onClick={() => handleSort('losses')}
              >
                <div className="flex items-center justify-center gap-2">
                  L
                  <SortIndicator column="losses" />
                </div>
              </th>
              <th
                className="px-4 py-3 text-center text-sm font-bold text-white cursor-pointer hover:bg-[#003d7a] transition-colors"
                onClick={() => handleSort('winPct')}
              >
                <div className="flex items-center justify-center gap-2">
                  Win%
                  <SortIndicator column="winPct" />
                </div>
              </th>
              <th
                className="px-4 py-3 text-center text-sm font-bold text-white cursor-pointer hover:bg-[#003d7a] transition-colors"
                onClick={() => handleSort('gamesBack')}
              >
                <div className="flex items-center justify-center gap-2">
                  GB
                  <SortIndicator column="gamesBack" />
                </div>
              </th>
              <th className="px-4 py-3 text-center text-sm font-bold text-white">Home</th>
              <th className="px-4 py-3 text-center text-sm font-bold text-white">Away</th>
              <th
                className="px-4 py-3 text-center text-sm font-bold text-white cursor-pointer hover:bg-[#003d7a] transition-colors"
                onClick={() => handleSort('confRecord')}
              >
                <div className="flex items-center justify-center gap-2">
                  Conf
                  <SortIndicator column="confRecord" />
                </div>
              </th>
              <th
                className="px-4 py-3 text-center text-sm font-bold text-white cursor-pointer hover:bg-[#003d7a] transition-colors"
                onClick={() => handleSort('divRecord')}
              >
                <div className="flex items-center justify-center gap-2">
                  Div
                  <SortIndicator column="divRecord" />
                </div>
              </th>
              <th className="px-4 py-3 text-center text-sm font-bold text-white">Streak</th>
              <th
                className="px-4 py-3 text-center text-sm font-bold text-white cursor-pointer hover:bg-[#003d7a] transition-colors"
                onClick={() => handleSort('last10')}
              >
                <div className="flex items-center justify-center gap-2">
                  L10
                  <SortIndicator column="last10" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {teams.map((team, index) => {
              const teamInfo = getTeamInfo(team.teamName);
              return (
                <tr key={team.teamId} className="hover:bg-gray-50 transition-colors">
                  <td className="pl-6 pr-4 py-4 text-sm text-gray-900 font-semibold">{index + 1}</td>
                  <td className="px-4 py-4">
                    <Link href={`/teams/${team.teamId}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                      {teamInfo && (
                        <>
                          <img
                            src={teamInfo.logoUrl}
                            alt={teamInfo.abbreviation}
                            width={32}
                            height={32}
                            className="w-8 h-8"
                          />
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-gray-900 leading-tight">{teamInfo.abbreviation}</span>
                            <span className="text-xs text-gray-600 leading-tight">{getAllTeams().find(t => t.id === team.teamId)?.name}</span>
                          </div>
                        </>
                      )}
                    </Link>
                  </td>
                  <td className="px-4 py-4 text-center text-sm text-gray-900 font-semibold">{team.wins}</td>
                  <td className="px-4 py-4 text-center text-sm text-gray-900">{team.losses}</td>
                  <td className="px-4 py-4 text-center text-sm text-gray-900">{team.winPct.toFixed(3)}</td>
                  <td className="px-4 py-4 text-center text-sm text-gray-900">
                    {team.gamesBack === 0 ? '-' : team.gamesBack.toFixed(1)}
                  </td>
                  <td className="px-4 py-4 text-center text-sm text-gray-600">{team.homeRecord}</td>
                  <td className="px-4 py-4 text-center text-sm text-gray-600">{team.awayRecord}</td>
                  <td className="px-4 py-4 text-center text-sm text-gray-600">{team.confRecord}</td>
                  <td className="px-4 py-4 text-center text-sm text-gray-600">{team.divRecord}</td>
                  <td className="px-4 py-4 text-center text-sm">
                    <span className={`font-semibold ${team.streak.startsWith('W') ? 'text-green-600' : 'text-red-600'}`}>
                      {team.streak}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center text-sm text-gray-600">{team.last10}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

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
              NFL Standings
            </h1>
            <p className="text-base sm:text-lg lg:text-xl opacity-90">
              Live standings and playoff race for all 30 teams
            </p>
          </div>
        </div>

        {/* Raptive Header Ad */}
        <div className="container mx-auto px-4 min-h-[150px]">
          <div className="raptive-pfn-header"></div>
        </div>

        {/* Content */}
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
          {/* Error State */}
          {error && !isLoading && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h3 className="text-red-800 font-semibold mb-1">Failed to load live standings</h3>
                  <p className="text-red-600 text-sm">{error}</p>
                  <p className="text-red-600 text-sm mt-2">Showing sample data instead.</p>
                </div>
              </div>
            </div>
          )}

          {/* Conference Filter */}
          <div className="mb-6">
            <div className="inline-flex rounded-lg border border-gray-300 bg-white p-1">
              <button
                onClick={() => setConferenceView('all')}
                className={`px-6 py-2 rounded-md text-sm font-semibold transition-colors ${
                  conferenceView === 'all'
                    ? 'bg-[#0050A0] text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                All Teams
              </button>
              <button
                onClick={() => setConferenceView('conference')}
                className={`px-6 py-2 rounded-md text-sm font-semibold transition-colors ${
                  conferenceView === 'conference'
                    ? 'bg-[#0050A0] text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Conference
              </button>
              <button
                onClick={() => setConferenceView('Eastern')}
                className={`px-6 py-2 rounded-md text-sm font-semibold transition-colors ${
                  conferenceView === 'Eastern'
                    ? 'bg-[#0050A0] text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Eastern
              </button>
              <button
                onClick={() => setConferenceView('Western')}
                className={`px-6 py-2 rounded-md text-sm font-semibold transition-colors ${
                  conferenceView === 'Western'
                    ? 'bg-[#0050A0] text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Western
              </button>
            </div>
          </div>

          {/* Standings Tables */}
          <>
              {conferenceView === 'all' ? (
                // All Teams - Single combined table sorted by record
                <StandingsTable teams={filteredAndSortedData} />
              ) : conferenceView === 'conference' ? (
                // Conference - Split by Eastern and Western
                <>
                  <StandingsTable teams={easternTeams} conferenceName="Eastern Conference" />
                  <StandingsTable teams={westernTeams} conferenceName="Western Conference" />
                </>
              ) : conferenceView === 'Eastern' ? (
                // Eastern - Split by divisions
                <>
                  <StandingsTable teams={atlanticTeams} conferenceName="Atlantic Division" />
                  <StandingsTable teams={centralTeams} conferenceName="Central Division" />
                  <StandingsTable teams={southeastTeams} conferenceName="Southeast Division" />
                </>
              ) : (
                // Western - Split by divisions
                <>
                  <StandingsTable teams={northwestTeams} conferenceName="Northwest Division" />
                  <StandingsTable teams={pacificTeams} conferenceName="Pacific Division" />
                  <StandingsTable teams={southwestTeams} conferenceName="Southwest Division" />
                </>
              )}
          </>

          {/* Information Section */}
          <div className="mt-12 space-y-8">
            {/* What Are the NBA League Standings? */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                What Are the NBA League Standings?
              </h2>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed">
                  The NBA league standings combine the teams from both NBA conferences in one combined table. You're able to see how each team stacks up against every other team in the NBA. The table contains information on wins, losses, win percentage, games back, home and away records, conference records, division records, current streaks, and last 10 games performance.
                </p>
                <p className="text-gray-700 leading-relaxed mt-4">
                  The tables are updated throughout the season, so you can see which teams are in playoff contention and have already clinched a spot in the postseason. They also show the teams that have been eliminated from playoff contention and are now looking ahead to the NBA Draft. The top six teams in each conference earn automatic playoff berths, while teams ranked 7-10 compete in the Play-In Tournament for the final two playoff spots.
                </p>
              </div>
            </div>

            {/* What Are the 2 Conferences? */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                What Are the 2 Conferences?
              </h2>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed">
                  The two conferences in the NBA are the Eastern Conference and the Western Conference. The conferences split the 30 NBA teams in half, with each conference containing 15 teams split across three divisions.
                </p>
              </div>
            </div>

            {/* What Are the 6 Divisions? */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                What Are the 6 Divisions?
              </h2>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed mb-4">
                  There are six divisions in the NBA, with three in each conference. Each division is decided geographically. In the Eastern Conference, they are the Atlantic Division, Central Division, and Southeast Division. The divisions in the Western Conference are the Northwest Division, Pacific Division, and Southwest Division.
                </p>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Each division consists of five teams and involves some history and bitter rivalries. Teams play teams in their division multiple times a year, leading to epic matchups and some of the most anticipated fixtures on each team's schedule, given their fierce rivalries. Division standings play a role in tiebreakers for playoff seeding.
                </p>
                <p className="text-gray-700 leading-relaxed mb-4">
                  <strong>Those divisions are:</strong>
                </p>
                <div className="space-y-3">
                  <p className="text-gray-700">
                    <strong>Atlantic Division:</strong> Boston Celtics, Brooklyn Nets, New York Knicks, Philadelphia 76ers, Toronto Raptors
                  </p>
                  <p className="text-gray-700">
                    <strong>Central Division:</strong> Chicago Bulls, Cleveland Cavaliers, Detroit Pistons, Indiana Pacers, Milwaukee Bucks
                  </p>
                  <p className="text-gray-700">
                    <strong>Southeast Division:</strong> Atlanta Hawks, Charlotte Hornets, Miami Heat, Orlando Magic, Washington Wizards
                  </p>
                  <p className="text-gray-700">
                    <strong>Northwest Division:</strong> Denver Nuggets, Minnesota Timberwolves, Oklahoma City Thunder, Portland Trail Blazers, Utah Jazz
                  </p>
                  <p className="text-gray-700">
                    <strong>Pacific Division:</strong> Golden State Warriors, LA Clippers, Los Angeles Lakers, Phoenix Suns, Sacramento Kings
                  </p>
                  <p className="text-gray-700">
                    <strong>Southwest Division:</strong> Dallas Mavericks, Houston Rockets, Memphis Grizzlies, New Orleans Pelicans, San Antonio Spurs
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
