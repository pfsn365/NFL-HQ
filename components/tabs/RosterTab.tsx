'use client';

import { useState, useEffect, useCallback } from 'react';
import { TeamData } from '@/data/teams';
import { getApiPath } from '@/utils/api';
import LayoutStabilizer from '@/components/LayoutStabilizer';

// Helper function to generate PFSN URL
const getPFSNUrl = (playerName: string) => {
  return `https://www.profootballnetwork.com/players/${playerName.toLowerCase().replace(/[.\s]+/g, '-').replace(/[^\w-]/g, '').replace(/-+/g, '-')}/`;
};

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
  const [rosterData, setRosterData] = useState<RosterResponse['roster'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string>('activeRoster');

  const fetchRosterData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(getApiPath(`nfl/teams/api/roster/${team.id}`));

      if (!response.ok) {
        throw new Error(`Failed to fetch roster: ${response.status}`);
      }

      const data: RosterResponse = await response.json();
      setRosterData(data.roster);
    } catch (err) {
      console.error('Error fetching roster:', err);
      setError(err instanceof Error ? err.message : 'Failed to load roster');
    } finally {
      setLoading(false);
    }
  }, [team.id]);

  useEffect(() => {
    fetchRosterData();
  }, [fetchRosterData]);

  if (loading) {
    return (
      <LayoutStabilizer className="bg-white rounded-lg shadow p-4 sm:p-6" minHeight={800}>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{team.fullName} Roster</h2>
            <div className="h-1 rounded-full" style={{ backgroundColor: team.primaryColor, width: 'fit-content', minWidth: '230px' }}></div>
          </div>
        </div>
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
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{team.fullName} Roster</h2>
            <div className="h-1 rounded-full" style={{ backgroundColor: team.primaryColor, width: 'fit-content', minWidth: '230px' }}></div>
          </div>
        </div>
        <div className="text-center py-12">
          <div className="text-red-600 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Roster</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchRosterData}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2"
            style={{ backgroundColor: team.primaryColor }}
          >
            Try Again
          </button>
        </div>
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
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{team.fullName} Roster</h2>
          <div className="h-1 rounded-full" style={{ backgroundColor: team.primaryColor, width: 'fit-content', minWidth: '230px' }}></div>
        </div>
        <div className="text-sm text-gray-600">
          2025 Season
        </div>
      </div>

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
                        <tr className="text-white" style={{ backgroundColor: team.primaryColor }}>
                          <th className="text-center px-4 py-3 font-medium whitespace-nowrap">#</th>
                          <th className="text-left px-4 py-3 font-medium whitespace-nowrap min-w-[200px]">Name</th>
                          <th className="text-center px-4 py-3 font-medium whitespace-nowrap">Experience</th>
                          <th className="text-center px-4 py-3 font-medium whitespace-nowrap">Age</th>
                          <th className="text-center px-4 py-3 font-medium whitespace-nowrap">Height</th>
                          <th className="text-center px-4 py-3 font-medium whitespace-nowrap">Weight</th>
                          <th className="text-left px-4 py-3 font-medium whitespace-nowrap min-w-[150px]">College</th>
                        </tr>
                      </thead>
                      <tbody>
                        {positionPlayers.map((player, index) => (
                          <tr key={`${player.jerseyNumber}-${player.name}`}
                              className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap text-center">{player.jerseyNumber}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center space-x-3 min-w-[200px]">
                                <img
                                  src={`https://staticd.profootballnetwork.com/skm/assets/player-images/nfl/${player.slug}.png?w=80`}
                                  alt={player.name}
                                  className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    const fallback = target.nextElementSibling as HTMLElement;
                                    if (fallback) fallback.style.display = 'flex';
                                  }}
                                />
                                <div
                                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                                  style={{
                                    backgroundColor: `${team.primaryColor}20`,
                                    display: 'none'
                                  }}
                                >
                                  <span
                                    className="font-semibold text-xs"
                                    style={{ color: team.primaryColor }}
                                  >
                                    {player.name.split(' ').map(n => n[0]).join('')}
                                  </span>
                                </div>
                                <div className="flex flex-col">
                                  <a
                                    href={getPFSNUrl(player.name)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-medium hover:underline whitespace-nowrap cursor-pointer"
                                    style={{ color: team.primaryColor }}
                                  >
                                    {player.name}
                                  </a>
                                  {player.isInjured && activeSection !== 'injuredReserve' && (
                                    <span className="text-xs text-red-600 font-medium">
                                      Injured
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-gray-700 whitespace-nowrap text-center">{player.experience === 0 ? 'R' : player.experience}</td>
                            <td className="px-4 py-3 text-gray-700 whitespace-nowrap text-center">{player.age}</td>
                            <td className="px-4 py-3 text-gray-700 whitespace-nowrap text-center">{player.height}</td>
                            <td className="px-4 py-3 text-gray-700 whitespace-nowrap text-center">{player.weight}</td>
                            <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{player.college}</td>
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