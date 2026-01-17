'use client';

import NFLPlayoffBracket from '@/components/NFLPlayoffBracket';

export default function PlayoffBracketTab() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">2025-26 NFL Playoff Bracket</h2>
        <p className="text-gray-600 mb-6">
          Follow the path to Super Bowl LX. Click on any completed game to see details.
        </p>
        <NFLPlayoffBracket />
      </div>
    </div>
  );
}
