'use client';

import { useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { TeamData } from '@/data/teams';
import { getApiPath } from '@/utils/api';
import { getContrastTextColor } from '@/utils/colorHelpers';
import LayoutStabilizer from '@/components/LayoutStabilizer';
import { SWRErrorFallback } from '@/components/ErrorBoundary';
import { fetcher, defaultSWROptions } from '@/lib/fetcher';
import PlayerImage from '@/components/PlayerImage';

interface Player {
  name: string;
  slug: string;
  jerseyNumber: number;
  position: string;
  positionFull: string;
  age: number;
  height: string;
  weight: number;
  college: string;
  experience: number;
  impactPlus: number;
  isActive: boolean;
  isInjured: boolean;
  isSuspended: boolean;
  isPracticeSquad: boolean;
  isPhysicallyUnable: boolean;
  isNonFootballInjuryReserve: boolean;
  isExempt: boolean;
  status: string;
  draft?: {
    year: number;
    round: number;
    pick: number;
  } | null;
  birthDate: string;
  birthPlace: string;
}

interface RosterResponse {
  teamId: string;
  roster: {
    activeRoster: Player[];
    practiceSquad: Player[];
    injuredReserve: Player[];
    physicallyUnableToPerform: Player[];
    nonFootballInjuryReserve: Player[];
    suspended: Player[];
    exempt: Player[];
  };
  totalPlayers: number;
  lastUpdated: string;
}

// Position groupings for organizing players
const positionGroups = {
  'Quarterback': ['QB'],
  'Running Back': ['RB', 'FB'],
  'Wide Receiver': ['WR'],
  'Tight End': ['TE'],
  'Offensive Line': ['OT', 'OG', 'OL', 'C', 'G', 'T'],
  'Defensive Line': ['DE', 'DT', 'NT', 'DL'],
  'Linebacker': ['LB', 'OLB', 'ILB', 'MLB'],
  'Defensive Back': ['CB', 'S', 'FS', 'SS', 'DB'],
  'Special Teams': ['K', 'P', 'LS', 'KR', 'PR']
};

function getPositionGroup(position: string): string {
  for (const [group, positions] of Object.entries(positionGroups)) {
    if (positions.includes(position)) {
      return group;
    }
  }
  return 'Other';
}

function getPositionImpactUrl(position: string): string {
  const pos = position.toUpperCase();
  if (pos === 'QB') return 'https://www.profootballnetwork.com/nfl-qb-rankings-impact/';
  if (pos === 'RB' || pos === 'FB') return 'https://www.profootballnetwork.com/nfl-rb-rankings-impact/';
  if (pos === 'WR') return 'https://www.profootballnetwork.com/nfl-wr-rankings-impact/';
  if (pos === 'TE') return 'https://www.profootballnetwork.com/nfl-te-rankings-impact/';
  if (pos === 'OL' || pos === 'OT' || pos === 'OG' || pos === 'OC' || pos === 'T' || pos === 'G' || pos === 'C') {
    return 'https://www.profootballnetwork.com/nfl-player-ol-rankings-impact/';
  }
  if (pos === 'DT' || pos === 'NT') return 'https://www.profootballnetwork.com/nfl-dt-rankings-impact/';
  if (pos === 'EDGE' || pos === 'DE') return 'https://www.profootballnetwork.com/nfl-edge-rankings-impact/';
  if (pos === 'LB' || pos === 'ILB' || pos === 'OLB' || pos === 'MLB') return 'https://www.profootballnetwork.com/nfl-lb-rankings-impact/';
  if (pos === 'CB') return 'https://www.profootballnetwork.com/nfl-cb-rankings-impact/';
  if (pos === 'S' || pos === 'FS' || pos === 'SS' || pos === 'SAF' || pos === 'DB') {
    return 'https://www.profootballnetwork.com/nfl-saf-rankings-impact/';
  }
  return 'https://www.profootballnetwork.com/nfl-player-rankings-impact/';
}

const positionOrder = [
  'Quarterback',
  'Running Back',
  'Wide Receiver',
  'Tight End',
  'Offensive Line',
  'Defensive Line',
  'Linebacker',
  'Defensive Back',
  'Special Teams',
  'Other'
];

interface RosterTabProps {
  team: TeamData;
}

export default function RosterTab({ team }: RosterTabProps) {
  const [activeSection, setActiveSection] = useState<string>('activeRoster');

  // SWR fetch - replaces useState/useCallback/useEffect boilerplate
  const { data, error, isLoading, mutate } = useSWR<RosterResponse>(
    getApiPath(`nfl/teams/api/roster/${team.id}`),
    fetcher,
    defaultSWROptions
  );

  const rosterData = data?.roster;

  // Tab header component - reused across loading/error/data states
  const TabHeader = () => (
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{team.fullName} Roster</h1>
        <div className="h-1 rounded-full" style={{ backgroundColor: team.primaryColor, width: 'fit-content', minWidth: '230px' }}></div>
      </div>
      <div className="text-sm text-gray-600">
        2025 Season
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <LayoutStabilizer className="bg-white rounded-lg shadow p-4 sm:p-6" minHeight={800}>
        <TabHeader />
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading roster...</p>
        </div>
      </LayoutStabilizer>
    );
  }

  if (error) {
    return (
      <LayoutStabilizer className="bg-white rounded-lg shadow p-4 sm:p-6" minHeight={800}>
        <TabHeader />
        <SWRErrorFallback
          error={error}
          onRetry={() => mutate()}
          teamColor={team.primaryColor}
          title="Error Loading Roster"
        />
      </LayoutStabilizer>
    );
  }

  // Helper function to get section display name and count
  const getSectionInfo = (sectionKey: string) => {
    if (!rosterData) return { name: '', count: 0 };

    const sectionMap: Record<string, string> = {
      activeRoster: 'Active Roster',
      practiceSquad: 'Practice Squad',
      injuredReserve: 'Injured Reserve',
      physicallyUnableToPerform: 'Physically Unable to Perform',
      nonFootballInjuryReserve: 'Non-Football Injury Reserve',
      suspended: 'Suspended',
      exempt: 'Exempt'
    };

    return {
      name: sectionMap[sectionKey] || sectionKey,
      count: rosterData[sectionKey as keyof typeof rosterData]?.length || 0
    };
  };

  // Helper function to group players by position within a section
  const groupPlayersByPosition = (players: Player[]) => {
    const grouped: { [key: string]: Player[] } = {};

    players.forEach(player => {
      const group = getPositionGroup(player.position);
      if (!grouped[group]) {
        grouped[group] = [];
      }
      grouped[group].push(player);
    });

    // Sort players within each group by jersey number
    Object.keys(grouped).forEach(group => {
      grouped[group].sort((a, b) => a.jerseyNumber - b.jerseyNumber);
    });

    return grouped;
  };

  return (
    <LayoutStabilizer className="bg-white rounded-lg shadow p-4 sm:p-6 pb-24" minHeight={800}>
      <TabHeader />

      {/* Section Tabs */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          {Object.keys(rosterData || {}).map((sectionKey) => {
            const section = getSectionInfo(sectionKey);
            if (section.count === 0) return null;

            return (
              <button
                key={sectionKey}
                onClick={() => setActiveSection(sectionKey)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeSection === sectionKey
                    ? 'text-white'
                    : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
                }`}
                style={{
                  backgroundColor: activeSection === sectionKey ? team.primaryColor : undefined
                }}
              >
                {section.name} ({section.count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Section Content */}
      {rosterData && rosterData[activeSection as keyof typeof rosterData] && (
        <div className="space-y-8">
          {(() => {
            const players = rosterData[activeSection as keyof typeof rosterData] as Player[];
            const groupedPlayers = groupPlayersByPosition(players);

            return positionOrder.map((positionGroup) => {
              const positionPlayers = groupedPlayers[positionGroup];
              if (!positionPlayers || positionPlayers.length === 0) return null;

              return (
                <div key={positionGroup}>
                  {/* Position Group Header */}
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b-2 border-gray-200">
                    {positionGroup}
                  </h3>

                  {/* Players Table */}
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr style={{ backgroundColor: team.primaryColor, color: getContrastTextColor(team.primaryColor) }}>
                          <th scope="col" className="text-center px-3 py-3 font-medium whitespace-nowrap w-12">#</th>
                          <th scope="col" className="text-left px-3 py-3 font-medium whitespace-nowrap min-w-[200px]">Name</th>
                          <th scope="col" className="text-center px-3 py-3 font-medium whitespace-nowrap w-24">Impact Grade</th>
                          <th scope="col" className="text-center px-3 py-3 font-medium whitespace-nowrap w-24">Experience</th>
                          <th scope="col" className="text-center px-3 py-3 font-medium whitespace-nowrap w-16">Age</th>
                          <th scope="col" className="text-center px-3 py-3 font-medium whitespace-nowrap w-16">Height</th>
                          <th scope="col" className="text-center px-3 py-3 font-medium whitespace-nowrap w-16">Weight</th>
                          <th scope="col" className="text-left px-3 py-3 font-medium whitespace-nowrap min-w-[120px]">College</th>
                        </tr>
                      </thead>
                      <tbody>
                        {positionPlayers.map((player, index) => (
                          <tr key={`${player.jerseyNumber}-${player.name}`}
                              className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-3 py-3 font-semibold text-gray-900 whitespace-nowrap text-center">{player.jerseyNumber}</td>
                            <td className="px-3 py-3">
                              <div className="flex items-center space-x-3 min-w-[200px]">
                                <PlayerImage
                                  slug={player.slug}
                                  name={player.name}
                                  size="sm"
                                  teamColor={team.primaryColor}
                                />
                                <div className="flex flex-col">
                                  <Link
                                    href={`/players/${player.slug}`}
                                    className="font-medium hover:underline whitespace-nowrap cursor-pointer"
                                    style={{ color: team.primaryColor }}
                                  >
                                    {player.name}
                                  </Link>
                                  {player.isInjured && activeSection !== 'injuredReserve' && (
                                    <span className="text-xs text-red-600 font-medium">
                                      Injured
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap text-center">
                              {player.impactPlus > 0 ? (
                                <a
                                  href={getPositionImpactUrl(player.position)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-semibold hover:underline text-blue-600"
                                >
                                  {player.impactPlus.toFixed(1)}
                                </a>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-3 py-3 text-gray-700 whitespace-nowrap text-center">{player.experience === 0 ? 'R' : player.experience}</td>
                            <td className="px-3 py-3 text-gray-700 whitespace-nowrap text-center">{player.age}</td>
                            <td className="px-3 py-3 text-gray-700 whitespace-nowrap text-center">{player.height}</td>
                            <td className="px-3 py-3 text-gray-700 whitespace-nowrap text-center">{player.weight}</td>
                            <td className="px-3 py-3 text-gray-700 whitespace-nowrap">{player.college}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            });
          })()}
        </div>
      )}
    </LayoutStabilizer>
  );
}
