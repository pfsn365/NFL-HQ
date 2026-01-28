'use client';

import { useState, useEffect } from 'react';
import { TeamData } from '@/data/teams';
import { TeamInfoData } from '@/data/teamInfo';
import { HallOfFamer } from '@/data/hallOfFame';
import { getContrastTextColor } from '@/utils/colorHelpers';

interface TeamInfoTabProps {
  team: TeamData;
}

// Default empty data to show while loading
const defaultTeamInfo: TeamInfoData = {
  founded: '',
  stadium: '',
  capacity: '',
  location: '',
  owner: '',
  conference: '',
  division: '',
  superbowlWins: 0,
  superbowlAppearances: [],
  conferenceChampionships: 0,
  divisionTitles: 0,
  playoffAppearances: 0,
  retiredNumbers: [],
  stadiumHistory: [],
  achievements: []
};

export default function TeamInfoTab({ team }: TeamInfoTabProps) {
  const [teamInfo, setTeamInfo] = useState<TeamInfoData>(defaultTeamInfo);
  const [hallOfFamers, setHallOfFamers] = useState<HallOfFamer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchTeamInfo() {
      try {
        const response = await fetch(`/api/nfl/team-info/${team.id}`);
        if (!response.ok) throw new Error('Failed to fetch');

        const data = await response.json();

        if (!cancelled) {
          setTeamInfo(data.teamInfo);
          setHallOfFamers(data.hallOfFamers);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error fetching team info:', error);
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    fetchTeamInfo();

    return () => {
      cancelled = true;
    };
  }, [team.id]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{team.fullName} Team Information</h2>
          <div className="h-1 rounded-full" style={{ backgroundColor: team.primaryColor, width: 'fit-content', minWidth: '320px' }}></div>
        </div>
      </div>

      {/* Team Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 card-hover" style={{ borderLeftColor: team.primaryColor }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900">{teamInfo.founded}</p>
              <p className="text-sm text-gray-600">Founded</p>
            </div>
            <div className="text-3xl">🏈</div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 card-hover" style={{ borderLeftColor: team.primaryColor }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xl font-bold text-gray-900">{teamInfo.stadium}</p>
              <p className="text-sm text-gray-600">Home Stadium</p>
            </div>
            <div className="text-3xl">🏟️</div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 card-hover" style={{ borderLeftColor: team.primaryColor }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900">{teamInfo.capacity}</p>
              <p className="text-sm text-gray-600">Stadium Capacity</p>
            </div>
            <div className="text-3xl">👥</div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 card-hover" style={{ borderLeftColor: team.primaryColor }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-bold text-gray-900">{teamInfo.division}</p>
              <p className="text-sm text-gray-600">Division</p>
            </div>
            <div className="text-3xl">🏆</div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 card-hover" style={{ borderLeftColor: team.primaryColor }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-bold text-gray-900">{teamInfo.location}</p>
              <p className="text-sm text-gray-600">Location</p>
            </div>
            <div className="text-3xl">📍</div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 card-hover" style={{ borderLeftColor: team.primaryColor }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-bold text-gray-900">{teamInfo.owner}</p>
              <p className="text-sm text-gray-600">Owner</p>
            </div>
            <div className="text-3xl">👤</div>
          </div>
        </div>
      </div>

      {/* Achievements Section */}
      <div className="bg-white rounded-xl p-6 shadow-sm mb-8">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Team Achievements</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            {/* Super Bowl Championships */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{ backgroundColor: team.primaryColor, color: getContrastTextColor(team.primaryColor) }}>
                {teamInfo.superbowlWins}
              </div>
              <div>
                <p className="font-semibold text-gray-900">Super Bowl Championships</p>
                <p className="text-sm text-gray-600">{teamInfo.superbowlAppearances.join(', ')}</p>
              </div>
            </div>

            {/* Conference Championships */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{ backgroundColor: team.primaryColor, color: getContrastTextColor(team.primaryColor) }}>
                {teamInfo.conferenceChampionships}
              </div>
              <div>
                <p className="font-semibold text-gray-900">Conference Championships</p>
                <p className="text-sm text-gray-600">Most Recent: {teamInfo.superbowlAppearances.length > 0 ? teamInfo.superbowlAppearances[teamInfo.superbowlAppearances.length - 1].split(' ')[0] : 'N/A'}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {/* Division Titles */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{ backgroundColor: team.primaryColor, color: getContrastTextColor(team.primaryColor) }}>
                {teamInfo.divisionTitles}
              </div>
              <div>
                <p className="font-semibold text-gray-900">Division Titles</p>
                <p className="text-sm text-gray-600">Most Recent: {
                  teamInfo.achievements.find(a => a.title.includes('Division'))?.description?.match(/Most recent: (\d{4})/)?.[1] ||
                  teamInfo.achievements.find(a => a.title.includes('Division'))?.description?.match(/(\d{4})/)?.[1] ||
                  'N/A'
                }</p>
              </div>
            </div>

            {/* Playoff Appearances */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{ backgroundColor: team.primaryColor, color: getContrastTextColor(team.primaryColor) }}>
                {teamInfo.playoffAppearances}
              </div>
              <div>
                <p className="font-semibold text-gray-900">Playoff Appearances</p>
                <p className="text-sm text-gray-600">Most Recent: {
                  teamInfo.achievements.find(a => a.title.includes('Playoff'))?.description?.match(/Most recent: (\d{4})/)?.[1] ||
                  teamInfo.achievements.find(a => a.title.includes('Playoff'))?.description?.match(/(\d{4})/)?.[1] ||
                  'N/A'
                }</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stadium History */}
      <div className="bg-white rounded-xl p-6 shadow-sm mb-8">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Stadium History</h3>
        <div className="space-y-4">
          {teamInfo.stadiumHistory.map((stadium, index) => (
            <div
              key={index}
              className={`rounded-lg p-4 ${stadium.isCurrent ? 'border-2' : 'bg-gray-50'}`}
              style={stadium.isCurrent ? {
                borderColor: team.primaryColor,
                backgroundColor: team.primaryColor + '10'
              } : {}}
            >
              <h4 className={`font-bold ${stadium.isCurrent ? '' : 'text-gray-900'}`}
                  style={stadium.isCurrent ? { color: team.primaryColor } : {}}>
                {stadium.name}
              </h4>
              <p className={`text-sm font-semibold ${stadium.isCurrent ? '' : 'text-gray-600'}`}
                 style={stadium.isCurrent ? { color: team.primaryColor } : {}}>
                {stadium.years}
              </p>
              {stadium.description && (
                <p className="text-xs text-gray-600 mt-1">{stadium.description}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Retired Numbers */}
      {teamInfo.retiredNumbers.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Retired Numbers</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {teamInfo.retiredNumbers.map((player, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-lg flex items-center justify-center font-bold text-xl" style={{ backgroundColor: team.primaryColor, color: getContrastTextColor(team.primaryColor) }}>
                  {player.number}
                </div>
                <div>
                  <div className="font-bold text-lg text-gray-900">{player.name}</div>
                  <div className="text-base text-gray-600">{player.position} ({player.years})</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hall of Fame Players */}
      <div className="bg-white rounded-xl p-6 shadow-sm mb-8">
        <h3 className="text-xl font-bold text-gray-900 mb-6">
          Hall of Famers {hallOfFamers.length > 0 && `(${hallOfFamers.length})`}
        </h3>

        {hallOfFamers.length === 0 ? (
          <div className="text-center py-8 text-gray-600">
            No Hall of Fame data available for {team.fullName}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {hallOfFamers.map((player, index) => (
              <div key={index} className="px-3 py-2 rounded-lg border-4 border-yellow-400" style={{ backgroundColor: team.primaryColor, color: getContrastTextColor(team.primaryColor) }}>
                <div className="font-semibold text-white text-sm leading-tight">{player.name}</div>
                <div className="text-xs text-gray-200 leading-snug">{player.position} {player.years && `(${player.years})`}</div>
                {player.inducted && player.inducted !== 'N/A' && (
                  <div className="text-xs text-yellow-200 leading-snug">Inducted: {player.inducted}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
