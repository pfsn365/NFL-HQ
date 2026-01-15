'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { teams } from '@/data/teams';
import NFLTeamsSidebar from '@/components/NFLTeamsSidebar';
import { getApiPath } from '@/utils/api';

interface ScheduleGame {
  week: number | string;
  eventType: string;
  result?: 'W' | 'L' | 'T' | null;
}

interface TeamRecord {
  teamId: string;
  record: string;
  divisionRank: string;
}

export default function TeamsListPageContent() {
  const teamsList = Object.values(teams);
  const [teamRecords, setTeamRecords] = useState<Map<string, TeamRecord>>(new Map());
  const [isLoading, setIsLoading] = useState(true);

  // Calculate record from schedule
  const calculateRecord = (schedule: ScheduleGame[]) => {
    const regularSeasonGames = schedule.filter(
      (game: ScheduleGame) => game.eventType === 'Regular Season' && game.result
    );
    const wins = regularSeasonGames.filter((game: ScheduleGame) => game.result === 'W').length;
    const losses = regularSeasonGames.filter((game: ScheduleGame) => game.result === 'L').length;
    const ties = regularSeasonGames.filter((game: ScheduleGame) => game.result === 'T').length;
    return `${wins}-${losses}${ties > 0 ? `-${ties}` : ''}`;
  };

  useEffect(() => {
    const fetchAllRecords = async () => {
      try {
        // Fetch team schedules in batches to avoid overwhelming the server
        const batchSize = 5;
        const records: Array<{ teamId: string; record: string }> = [];

        for (let i = 0; i < teamsList.length; i += batchSize) {
          const batch = teamsList.slice(i, i + batchSize);
          const batchPromises = batch.map(async (team) => {
            try {
              const response = await fetch(getApiPath(`nfl/teams/api/schedule/${team.id}`), {
                headers: {
                  'Content-Type': 'application/json',
                },
              });

              if (!response || !response.ok) {
                console.error(`Failed response for ${team.id}:`, response?.status);
                return { teamId: team.id, record: '0-0' };
              }

              const data = await response.json();
              const record = calculateRecord(data.schedule || []);
              return { teamId: team.id, record };
            } catch (error) {
              console.error(`Failed to fetch schedule for ${team.id}:`, error);
              return { teamId: team.id, record: '0-0' };
            }
          });

          const batchResults = await Promise.all(batchPromises);
          records.push(...batchResults);

          // Small delay between batches
          if (i + batchSize < teamsList.length) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }

        // Calculate division ranks
        const divisions: { [key: string]: Array<{ teamId: string; record: string; wins: number }> } = {};

        records.forEach((rec) => {
          const team = teamsList.find(t => t.id === rec.teamId);
          if (team) {
            if (!divisions[team.division]) {
              divisions[team.division] = [];
            }
            const [wins] = rec.record.split('-').map(Number);
            divisions[team.division].push({ teamId: rec.teamId, record: rec.record, wins: wins || 0 });
          }
        });

        // Sort each division and assign ranks
        Object.keys(divisions).forEach(division => {
          divisions[division].sort((a, b) => b.wins - a.wins);
        });

        // Create final records map with ranks
        const recordsMap = new Map<string, TeamRecord>();
        Object.keys(divisions).forEach(division => {
          divisions[division].forEach((team, index) => {
            const rank = index + 1;
            const rankSuffix = rank === 1 ? 'st' : rank === 2 ? 'nd' : rank === 3 ? 'rd' : 'th';
            recordsMap.set(team.teamId, {
              teamId: team.teamId,
              record: team.record,
              divisionRank: `${rank}${rankSuffix}`
            });
          });
        });

        setTeamRecords(recordsMap);
      } catch (error) {
        console.error('Failed to fetch records:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllRecords();
  }, []);

  // Group teams by division
  const divisions: { [key: string]: typeof teams[string][] } = {};
  teamsList.forEach(team => {
    if (!divisions[team.division]) {
      divisions[team.division] = [];
    }
    divisions[team.division].push(team);
  });

  // Sort divisions (NFC first, then AFC)
  const sortedDivisions = Object.keys(divisions).sort((a, b) => {
    if (a.startsWith('NFC') && b.startsWith('AFC')) return -1;
    if (a.startsWith('AFC') && b.startsWith('NFC')) return 1;
    return a.localeCompare(b);
  });

  const TeamCard = ({ team }: { team: typeof teams[string] }) => {
    const teamRecord = teamRecords.get(team.id);
    const record = teamRecord?.record || '0-0';
    const divisionRank = teamRecord?.divisionRank || '-';

    return (
      <Link
        href={`/teams/${team.id}`}
        className="group block bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-200 border border-gray-200"
      >
        <div className="p-4 flex items-center space-x-4">
          <div className="w-12 h-12 flex items-center justify-center flex-shrink-0">
            <img
              src={team.logoUrl}
              alt={`${team.fullName} Logo`}
              width={48}
              height={48}
              className="w-12 h-12 object-contain"
              loading="lazy"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className={`font-bold text-gray-900 ${team.name === 'Buccaneers' || team.name === 'Commanders' ? 'text-sm sm:text-base' : ''}`}>
              <div>{team.abbreviation}</div>
              <div>{team.name}</div>
            </h3>
          </div>
          <div className="text-right flex-shrink-0 hidden lg:block">
            {isLoading ? (
              <>
                <div className="h-5 w-16 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-12 bg-gray-200 rounded animate-pulse mt-1"></div>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-gray-900">{record}</p>
                <p className="text-xs text-gray-600 mt-1">{divisionRank}</p>
              </>
            )}
          </div>
        </div>
      </Link>
    );
  };

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
      <main id="main-content" className="flex-1 lg:ml-64 min-w-0">
          {/* Header */}
          <div className="bg-[#0050A0] text-white pt-[57px] lg:pt-0 pb-4 lg:pb-6">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-4 lg:pt-10">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-3">
                NFL Teams
              </h1>
              <p className="text-base sm:text-lg lg:text-xl xl:text-2xl opacity-90">
                Select a team to view rosters, schedules, stats, and more
              </p>
            </div>
          </div>

          {/* Raptive Header Ad */}
          <div className="container mx-auto px-4 h-[120px] flex items-center justify-center">
            <div className="raptive-pfn-header-90 w-full h-full"></div>
          </div>

          {/* Teams by Division */}
          <div className="container mx-auto px-4 pt-4 pb-24">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6 max-w-7xl mx-auto">
              {sortedDivisions.map((division) => {
                const isNFC = division.startsWith('NFC');
                return (
                  <div key={division} className="space-y-3">
                    <h2 className={`text-xl font-bold px-4 py-2 rounded-lg text-center ${
                      isNFC
                        ? 'bg-blue-600 text-white'
                        : 'bg-red-600 text-white'
                    }`}>
                      {division}
                    </h2>
                    {divisions[division]
                      .sort((a, b) => a.city.localeCompare(b.city))
                      .map((team) => (
                        <TeamCard key={team.id} team={team} />
                      ))}
                  </div>
                );
              })}
            </div>
          </div>
        </main>
    </div>
  );
}
