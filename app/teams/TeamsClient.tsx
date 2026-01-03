'use client';

import { useEffect, useState } from 'react';
import { getAllTeams, TeamData } from '@/data/teams';
import NFLTeamsSidebar from '@/components/NFLTeamsSidebar';
import Link from 'next/link';


// Map API slugs to our team IDs
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

interface TeamWithRecord extends TeamData {
  wins: number;
  losses: number;
  liveRecord: string;
}

export default function TeamsClient() {
  const [teamsWithRecords, setTeamsWithRecords] = useState<TeamWithRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStandings() {
      const teams = getAllTeams();

      try {
        const response = await fetch('/nba-hq/api/nba/standings?season=2025&level=conference');

        if (!response.ok) {
          throw new Error('Failed to fetch standings');
        }

        const data = await response.json();
        const conferences = data.data?.standings?.conferences;

        // Create a map of team records
        const recordsMap: Record<string, { wins: number; losses: number }> = {};

        if (conferences) {
          for (const conf of conferences) {
            for (const team of conf.teams) {
              const teamId = teamSlugMapping[team.sk_slug] || team.sk_slug;
              recordsMap[teamId] = {
                wins: team.wins || 0,
                losses: team.losses || 0,
              };
            }
          }
        }

        // Merge records with team data
        const merged = teams.map(team => ({
          ...team,
          wins: recordsMap[team.id]?.wins ?? 0,
          losses: recordsMap[team.id]?.losses ?? 0,
          liveRecord: recordsMap[team.id]
            ? `${recordsMap[team.id].wins}-${recordsMap[team.id].losses}`
            : team.record,
        }));

        setTeamsWithRecords(merged);
      } catch (err) {
        console.error('Error fetching standings:', err);
        // Fall back to static records
        const merged = teams.map(team => ({
          ...team,
          wins: 0,
          losses: 0,
          liveRecord: team.record,
        }));
        setTeamsWithRecords(merged);
      } finally {
        setIsLoading(false);
      }
    }

    fetchStandings();
  }, []);

  // Organize teams by conference and division, sorted by wins
  const sortByWins = (a: TeamWithRecord, b: TeamWithRecord) => b.wins - a.wins || a.losses - b.losses;

  const easternDivisions = {
    'Atlantic': teamsWithRecords.filter(t => t.division === 'Atlantic').sort(sortByWins),
    'Central': teamsWithRecords.filter(t => t.division === 'Central').sort(sortByWins),
    'Southeast': teamsWithRecords.filter(t => t.division === 'Southeast').sort(sortByWins),
  };

  const westernDivisions = {
    'Northwest': teamsWithRecords.filter(t => t.division === 'Northwest').sort(sortByWins),
    'Pacific': teamsWithRecords.filter(t => t.division === 'Pacific').sort(sortByWins),
    'Southwest': teamsWithRecords.filter(t => t.division === 'Southwest').sort(sortByWins),
  };

  const DivisionCard = ({ team, index }: { team: TeamWithRecord; index: number }) => {
    const rankSuffix = (index + 1) === 1 ? 'st' : (index + 1) === 2 ? 'nd' : (index + 1) === 3 ? 'rd' : 'th';

    return (
      <Link
        href={`/teams/${team.id}`}
        className="block bg-white border border-gray-200 rounded-lg p-4 hover:border-[#0050A0] hover:shadow-md transition-all"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 relative flex-shrink-0">
              <img
                src={team.logoUrl}
                alt={team.fullName}
                
                
                className="object-contain"
              />
            </div>
            <div className="font-bold text-gray-900 text-lg">
              {team.abbreviation}
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            {isLoading ? (
              <>
                <div className="h-7 w-16 bg-gray-200 animate-pulse rounded mb-1"></div>
                <div className="h-5 w-10 bg-gray-200 animate-pulse rounded mx-auto"></div>
              </>
            ) : (
              <>
                <div className="text-lg font-bold text-gray-900">
                  {team.liveRecord}
                </div>
                <div className="text-sm text-gray-500">{index + 1}{rankSuffix}</div>
              </>
            )}
          </div>
        </div>
      </Link>
    );
  };

  const SkeletonCard = () => (
    <div className="block bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gray-200 animate-pulse rounded flex-shrink-0"></div>
          <div className="h-7 w-12 bg-gray-200 animate-pulse rounded"></div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="h-7 w-16 bg-gray-200 animate-pulse rounded mb-1"></div>
          <div className="h-5 w-10 bg-gray-200 animate-pulse rounded mx-auto"></div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:block w-64 fixed left-0 top-0 bottom-0 z-10">
        <NFLTeamsSidebar />
      </aside>

      {/* Mobile Sidebar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-20">
        <NFLTeamsSidebar isMobile={true} />
      </div>

      {/* Main Content */}
      <div className="flex-1 lg:ml-64 mt-[57px] lg:mt-0">
        {/* Header */}
        <header style={{ backgroundColor: '#0050A0' }} className="text-white shadow-lg">
          <div className="container mx-auto px-4 py-6">
            <div className="text-center">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-3">NBA Teams</h1>
              <p className="text-base sm:text-lg lg:text-xl xl:text-2xl opacity-90">
                Select a team to view rosters, schedules, stats, and more
              </p>
            </div>
          </div>
        </header>

        {/* Raptive Header Ad */}
        <div className="container mx-auto px-4 min-h-[150px]">
          <div className="raptive-pfn-header"></div>
        </div>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          {/* Eastern Conference */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Eastern Conference</h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Atlantic Division */}
              <div>
                <div className="bg-blue-600 text-white text-center py-3 rounded-t-lg font-bold text-lg">
                  Atlantic
                </div>
                <div className="space-y-3 mt-3">
                  {isLoading || easternDivisions['Atlantic'].length === 0 ? (
                    Array.from({ length: 5 }).map((_, index) => (
                      <SkeletonCard key={index} />
                    ))
                  ) : (
                    easternDivisions['Atlantic'].map((team, index) => (
                      <DivisionCard key={team.id} team={team} index={index} />
                    ))
                  )}
                </div>
              </div>

              {/* Central Division */}
              <div>
                <div className="bg-blue-600 text-white text-center py-3 rounded-t-lg font-bold text-lg">
                  Central
                </div>
                <div className="space-y-3 mt-3">
                  {isLoading || easternDivisions['Central'].length === 0 ? (
                    Array.from({ length: 5 }).map((_, index) => (
                      <SkeletonCard key={index} />
                    ))
                  ) : (
                    easternDivisions['Central'].map((team, index) => (
                      <DivisionCard key={team.id} team={team} index={index} />
                    ))
                  )}
                </div>
              </div>

              {/* Southeast Division */}
              <div>
                <div className="bg-blue-600 text-white text-center py-3 rounded-t-lg font-bold text-lg">
                  Southeast
                </div>
                <div className="space-y-3 mt-3">
                  {isLoading || easternDivisions['Southeast'].length === 0 ? (
                    Array.from({ length: 5 }).map((_, index) => (
                      <SkeletonCard key={index} />
                    ))
                  ) : (
                    easternDivisions['Southeast'].map((team, index) => (
                      <DivisionCard key={team.id} team={team} index={index} />
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Western Conference */}
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Western Conference</h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Northwest Division */}
              <div>
                <div className="bg-red-600 text-white text-center py-3 rounded-t-lg font-bold text-lg">
                  Northwest
                </div>
                <div className="space-y-3 mt-3">
                  {isLoading || westernDivisions['Northwest'].length === 0 ? (
                    Array.from({ length: 5 }).map((_, index) => (
                      <SkeletonCard key={index} />
                    ))
                  ) : (
                    westernDivisions['Northwest'].map((team, index) => (
                      <DivisionCard key={team.id} team={team} index={index} />
                    ))
                  )}
                </div>
              </div>

              {/* Pacific Division */}
              <div>
                <div className="bg-red-600 text-white text-center py-3 rounded-t-lg font-bold text-lg">
                  Pacific
                </div>
                <div className="space-y-3 mt-3">
                  {isLoading || westernDivisions['Pacific'].length === 0 ? (
                    Array.from({ length: 5 }).map((_, index) => (
                      <SkeletonCard key={index} />
                    ))
                  ) : (
                    westernDivisions['Pacific'].map((team, index) => (
                      <DivisionCard key={team.id} team={team} index={index} />
                    ))
                  )}
                </div>
              </div>

              {/* Southwest Division */}
              <div>
                <div className="bg-red-600 text-white text-center py-3 rounded-t-lg font-bold text-lg">
                  Southwest
                </div>
                <div className="space-y-3 mt-3">
                  {isLoading || westernDivisions['Southwest'].length === 0 ? (
                    Array.from({ length: 5 }).map((_, index) => (
                      <SkeletonCard key={index} />
                    ))
                  ) : (
                    westernDivisions['Southwest'].map((team, index) => (
                      <DivisionCard key={team.id} team={team} index={index} />
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
