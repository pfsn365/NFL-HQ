'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getTeam, TeamData } from '@/data/teams';
import NFLTeamsSidebar from '@/components/NFLTeamsSidebar';
import TeamHero from '@/components/TeamHero';

interface LiveStandings {
  record: string;
  conferenceRank: string;
  divisionRank: string;
}

// Map API team slugs to our team IDs
const teamSlugMapping: Record<string, string> = {
  'la-clippers': 'los-angeles-clippers',
  'portland-trailblazers': 'portland-trail-blazers',
};

export default function TeamLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const teamId = params?.teamId as string;
  const team = getTeam(teamId);

  const [liveStandings, setLiveStandings] = useState<LiveStandings | undefined>();

  // Fetch live standings for this team
  useEffect(() => {
    async function fetchStandings() {
      try {
        const response = await fetch('/nba-hq/api/nba/standings?season=2025&level=conference');
        if (!response.ok) return;

        const data = await response.json();
        const conferences = data.data?.standings?.conferences;

        if (conferences && team) {
          for (const conf of conferences) {
            for (const apiTeam of conf.teams) {
              const apiTeamId = teamSlugMapping[apiTeam.sk_slug] || apiTeam.sk_slug;

              if (apiTeamId === team.id) {
                const confRank = apiTeam.conference_rank?.rank;
                const divRank = apiTeam.division_rank?.rank;

                setLiveStandings({
                  record: `${apiTeam.wins || 0}-${apiTeam.losses || 0}`,
                  conferenceRank: confRank ? getOrdinalSuffix(confRank) : team.conferenceRank,
                  divisionRank: divRank ? getOrdinalSuffix(divRank) : team.divisionRank,
                });
                break;
              }
            }
          }
        }
      } catch (err) {
        console.error('Error fetching team standings:', err);
      }
    }

    if (team) {
      fetchStandings();
    }
  }, [team]);

  if (!team) {
    return null;
  }

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
      <div className="flex-1 lg:ml-64 min-w-0">
        {/* Hero Section - Persists across tab changes */}
        <TeamHero team={team} liveStandings={liveStandings} />

        {/* Tab Content */}
        {children}
      </div>
    </div>
  );
}

function getOrdinalSuffix(num: number): string {
  const j = num % 10;
  const k = num % 100;
  if (j === 1 && k !== 11) return `${num}st`;
  if (j === 2 && k !== 12) return `${num}nd`;
  if (j === 3 && k !== 13) return `${num}rd`;
  return `${num}th`;
}
