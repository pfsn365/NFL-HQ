'use client';

import { useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { getApiPath } from '@/utils/api';
import PlayerImage from '@/components/PlayerImage';

// SWR fetcher function
const fetcher = (url: string) => fetch(url).then(res => res.json());

type ViewMode = 'roster' | 'depth-chart';
type SelectedTeam = 'patriots' | 'seahawks';

interface Player {
  name: string;
  slug: string;
  jerseyNumber: number;
  position: string;
  positionFull?: string;
  age: number;
  height: string;
  weight: number;
  college: string;
  experience: number;
  impactPlus: number;
  isActive: boolean;
  isInjured: boolean;
  status: string;
}

interface RosterData {
  activeRoster: Player[];
  practiceSquad: Player[];
  injuredReserve: Player[];
  physicallyUnableToPerform: Player[];
  nonFootballInjuryReserve: Player[];
  suspended: Player[];
  exempt: Player[];
}

// Depth Chart interfaces
interface DepthChartPlayer {
  name: string;
  slug: string;
  depth: number;
  impactScore: number;
}

interface DepthChartPosition {
  name: string;
  abbreviation: string;
  players: DepthChartPlayer[];
}

interface DepthChartData {
  offense: DepthChartPosition[];
  defense: DepthChartPosition[];
  specialTeams: DepthChartPosition[];
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

const teamConfig = {
  patriots: {
    id: 'new-england-patriots',
    name: 'New England Patriots',
    shortName: 'Patriots',
    logo: '/nfl-hq/new-england-patriots.png',
    primaryColor: '#002244',
    secondaryColor: '#C60C30'
  },
  seahawks: {
    id: 'seattle-seahawks',
    name: 'Seattle Seahawks',
    shortName: 'Seahawks',
    logo: '/nfl-hq/seattle-seahawks-sb.png',
    primaryColor: '#002244',
    secondaryColor: '#69BE28'
  }
};

export default function RostersDepthChartsTab() {
  const [viewMode, setViewMode] = useState<ViewMode>('roster');
  const [selectedTeam, setSelectedTeam] = useState<SelectedTeam>('patriots');
  const [activeSection, setActiveSection] = useState<string>('activeRoster');

  // Use SWR for efficient caching - data is shared across components
  const { data: patriotsData, error: patriotsError } = useSWR(
    getApiPath('nfl/teams/api/roster/new-england-patriots'),
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 300000 } // 5 minute deduping
  );

  const { data: seahawksData, error: seahawksError } = useSWR(
    getApiPath('nfl/teams/api/roster/seattle-seahawks'),
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 300000 }
  );

  // Depth Chart data
  const { data: patriotsDepthChart } = useSWR(
    getApiPath('nfl/teams/api/depth-chart/new-england-patriots'),
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 300000 }
  );

  const { data: seahawksDepthChart } = useSWR(
    getApiPath('nfl/teams/api/depth-chart/seattle-seahawks'),
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 300000 }
  );

  const patriotsRoster = patriotsData?.roster || null;
  const seahawksRoster = seahawksData?.roster || null;

  const loading = !patriotsData || !seahawksData;
  const error = (patriotsError || seahawksError) ? 'Failed to load rosters' : null;

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

  const getSectionInfo = (sectionKey: string, roster: RosterData) => {
    const sectionMap: Record<string, string> = {
      activeRoster: 'Active Roster',
      practiceSquad: 'Practice Squad',
      injuredReserve: 'Injured Reserve',
      physicallyUnableToPerform: 'PUP',
      nonFootballInjuryReserve: 'NFI Reserve',
      suspended: 'Suspended',
      exempt: 'Exempt'
    };

    return {
      name: sectionMap[sectionKey] || sectionKey,
      count: roster[sectionKey as keyof RosterData]?.length || 0
    };
  };

  const team = teamConfig[selectedTeam];
  const currentRoster = selectedTeam === 'patriots' ? patriotsRoster : seahawksRoster;

  const renderRoster = () => {
    if (!currentRoster) return null;

    const players = currentRoster[activeSection as keyof RosterData] as Player[];
    if (!players || players.length === 0) {
      return (
        <div className="p-8 text-center text-gray-600">
          No players in this section
        </div>
      );
    }

    const groupedPlayers = groupPlayersByPosition(players);

    return (
      <div className="space-y-8">
        {positionOrder.map((positionGroup) => {
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
                    <tr style={{ backgroundColor: team.primaryColor }} className="text-white">
                      <th scope="col" className="text-center px-3 py-3 font-medium whitespace-nowrap w-12">#</th>
                      <th scope="col" className="text-left px-3 py-3 font-medium whitespace-nowrap min-w-[200px]">Name</th>
                      <th scope="col" className="text-center px-3 py-3 font-medium whitespace-nowrap w-24">Impact Grade</th>
                      <th scope="col" className="text-center px-3 py-3 font-medium whitespace-nowrap w-24">Experience</th>
                      <th scope="col" className="text-center px-3 py-3 font-medium whitespace-nowrap w-16">Age</th>
                      <th scope="col" className="text-center px-3 py-3 font-medium whitespace-nowrap w-16 hidden sm:table-cell">Height</th>
                      <th scope="col" className="text-center px-3 py-3 font-medium whitespace-nowrap w-16 hidden sm:table-cell">Weight</th>
                      <th scope="col" className="text-left px-3 py-3 font-medium whitespace-nowrap min-w-[120px] hidden md:table-cell">College</th>
                    </tr>
                  </thead>
                  <tbody>
                    {positionPlayers.map((player, index) => (
                      <tr key={`${player.jerseyNumber}-${player.name}`}
                          className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-3 py-3 font-semibold text-gray-900 whitespace-nowrap text-center">{player.jerseyNumber}</td>
                        <td className="px-3 py-3">
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
                            <span className="text-gray-600">-</span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-gray-700 whitespace-nowrap text-center">{player.experience === 0 ? 'R' : player.experience}</td>
                        <td className="px-3 py-3 text-gray-700 whitespace-nowrap text-center">{player.age}</td>
                        <td className="px-3 py-3 text-gray-700 whitespace-nowrap text-center hidden sm:table-cell">{player.height}</td>
                        <td className="px-3 py-3 text-gray-700 whitespace-nowrap text-center hidden sm:table-cell">{player.weight}</td>
                        <td className="px-3 py-3 text-gray-700 whitespace-nowrap hidden md:table-cell">{player.college}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderDepthChart = () => {
    const currentDepthChart = selectedTeam === 'patriots' ? patriotsDepthChart : seahawksDepthChart;
    const depthChartData: DepthChartData | null = currentDepthChart?.positions || null;

    if (!depthChartData) {
      return (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading depth chart...</p>
        </div>
      );
    }

    // Render a player cell with image and score
    const renderPlayerCell = (player: DepthChartPlayer | undefined) => {
      if (!player) {
        return <span className="text-gray-400">-</span>;
      }

      return (
        <div className="flex items-center gap-2">
          <PlayerImage
            slug={player.slug}
            name={player.name}
            size="sm"
            teamColor={team.primaryColor}
          />
          <Link
            href={`/players/${player.slug}`}
            className="font-medium hover:underline cursor-pointer"
            style={{ color: team.primaryColor }}
          >
            {player.name}
          </Link>
          {player.impactScore > 0 && (
            <span className="text-xs font-semibold text-blue-600">
              {player.impactScore.toFixed(1)}
            </span>
          )}
        </div>
      );
    };

    const PositionTable = ({ title, positions }: { title: string; positions: DepthChartPosition[] }) => (
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: team.primaryColor }} className="text-white">
                <th scope="col" className="text-left p-3 font-medium w-16">POS</th>
                <th scope="col" className="text-left p-3 font-medium min-w-[220px]">STARTER</th>
                <th scope="col" className="text-left p-3 font-medium min-w-[220px]">2ND</th>
                <th scope="col" className="text-left p-3 font-medium min-w-[220px]">3RD</th>
              </tr>
            </thead>
            <tbody>
              {positions.map((position, index) => {
                const starter = position.players.find(p => p.depth === 1);
                const second = position.players.find(p => p.depth === 2);
                const third = position.players.find(p => p.depth === 3);

                return (
                  <tr key={position.abbreviation} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="p-3 font-medium text-gray-900">{position.abbreviation}</td>
                    <td className="p-3">{renderPlayerCell(starter)}</td>
                    <td className="p-3">{renderPlayerCell(second)}</td>
                    <td className="p-3">{renderPlayerCell(third)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );

    return (
      <div className="space-y-8">
        {depthChartData.offense.length > 0 && (
          <PositionTable title="Offense" positions={depthChartData.offense} />
        )}
        {depthChartData.defense.length > 0 && (
          <PositionTable title="Defense" positions={depthChartData.defense} />
        )}
        {depthChartData.specialTeams.length > 0 && (
          <PositionTable title="Special Teams" positions={depthChartData.specialTeams} />
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-center gap-4 mb-6">
          <div className="h-10 w-32 bg-gray-200 rounded-lg animate-pulse" />
          <div className="h-10 w-32 bg-gray-200 rounded-lg animate-pulse" />
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4 animate-pulse" />
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 bg-gray-100 rounded mb-2 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-700 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-[#0050A0] text-white rounded-lg hover:bg-[#003d7a] transition-colors cursor-pointer"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* View Mode & Team Toggle */}
      <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-4">
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setViewMode('roster')}
            className={`px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base font-medium transition-colors cursor-pointer min-h-[44px] ${
              viewMode === 'roster'
                ? 'bg-[#0050A0] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span className="hidden sm:inline">Full Roster</span>
            <span className="sm:hidden">Roster</span>
          </button>
          <button
            onClick={() => setViewMode('depth-chart')}
            className={`px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base font-medium transition-colors cursor-pointer min-h-[44px] ${
              viewMode === 'depth-chart'
                ? 'bg-[#0050A0] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Depth Chart
          </button>
        </div>

        {/* Divider */}
        <div className="hidden sm:block w-px h-8 bg-gray-300"></div>
        <div className="sm:hidden w-32 h-px bg-gray-300"></div>

        <div className="flex justify-center gap-2">
          <button
            onClick={() => { setSelectedTeam('patriots'); setActiveSection('activeRoster'); }}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base font-medium transition-colors cursor-pointer min-h-[44px] ${
              selectedTeam === 'patriots'
                ? 'bg-[#002244] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <img src="/nfl-hq/new-england-patriots.png" alt="Patriots" className="w-5 h-5 sm:w-6 sm:h-6" />
            Patriots
          </button>
          <button
            onClick={() => { setSelectedTeam('seahawks'); setActiveSection('activeRoster'); }}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base font-medium transition-colors cursor-pointer min-h-[44px] ${
              selectedTeam === 'seahawks'
                ? 'bg-[#002244] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <img src="/nfl-hq/seattle-seahawks-sb.png" alt="Seahawks" className="w-5 h-5 sm:w-6 sm:h-6" />
            Seahawks
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Team Header */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b" style={{ backgroundColor: team.primaryColor }}>
          <div className="flex items-center gap-2 sm:gap-3">
            <img src={team.logo} alt={team.name} className="w-8 h-8 sm:w-10 sm:h-10 object-contain" />
            <h3 className="text-base sm:text-lg font-bold text-white">
              <span className="hidden sm:inline">{team.name} {viewMode === 'roster' ? 'Roster' : 'Depth Chart'}</span>
              <span className="sm:hidden">{team.shortName} {viewMode === 'roster' ? 'Roster' : 'Depth'}</span>
            </h3>
          </div>
        </div>

        <div className="p-3 sm:p-6">
          {viewMode === 'roster' && currentRoster && (
            <>
              {/* Section Tabs */}
              <div className="mb-4 sm:mb-6">
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {Object.keys(currentRoster).map((sectionKey) => {
                    const section = getSectionInfo(sectionKey, currentRoster);
                    if (section.count === 0) return null;

                    return (
                      <button
                        key={sectionKey}
                        onClick={() => setActiveSection(sectionKey)}
                        className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors cursor-pointer min-h-[36px] sm:min-h-[44px] ${
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

              {renderRoster()}
            </>
          )}

          {viewMode === 'depth-chart' && renderDepthChart()}
        </div>
      </div>
    </div>
  );
}
