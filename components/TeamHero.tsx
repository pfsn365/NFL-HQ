'use client';

import { TeamData } from '@/data/teams';
import { getContrastTextColor } from '@/utils/colorHelpers';

interface LiveStandings {
  record: string;
  conferenceRank: string;
  divisionRank: string;
}

interface TeamHeroProps {
  team: TeamData;
  liveStandings?: LiveStandings;
}

export default function TeamHero({ team, liveStandings }: TeamHeroProps) {
  const record = liveStandings?.record || team.record;
  const conferenceRank = liveStandings?.conferenceRank || '0th';
  const divisionRank = liveStandings?.divisionRank || '0th';
  const textColor = getContrastTextColor(team.primaryColor);

  return (
    <div style={{ backgroundColor: team.primaryColor, color: textColor }} className="pt-[48px] lg:pt-0">
      <div className="container mx-auto px-4 py-4 sm:py-8">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 sm:gap-6">
          <div className="flex items-center space-x-3 sm:space-x-6">
            <div className="w-20 h-20 sm:w-24 sm:h-24 lg:w-32 lg:h-32 bg-white rounded-full flex items-center justify-center shadow-lg p-3 sm:p-4">
              <img
                src={team.logoUrl}
                alt={`${team.fullName} Logo`}
                className="w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 object-contain"
              />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold">{team.fullName}</h1>
              <p className="text-sm sm:text-base lg:text-lg xl:text-xl opacity-90 mt-1">
                {conferenceRank} in {team.conference} Conference
              </p>
              <p className="text-xs sm:text-sm lg:text-base opacity-80 mt-1">
                GM: {team.generalManager} • HC: {team.headCoach}
              </p>
            </div>
          </div>

          <div className="bg-white text-gray-800 rounded-lg p-6 w-full lg:w-auto shadow-lg">
            <h3 className="text-lg font-semibold mb-4 text-center text-gray-700">2025-26 Season</h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{record}</div>
                <div className="text-sm text-gray-600 mt-1">Record</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{divisionRank}</div>
                <div className="text-sm text-gray-600 mt-1">Division</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
