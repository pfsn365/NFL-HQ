'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import Link from 'next/link';
import LayoutStabilizer from '@/components/LayoutStabilizer';
import { TeamData } from '@/data/teams';
import { getApiPath } from '@/utils/api';
import { getContrastTextColor } from '@/utils/colorHelpers';

// Helper function to generate player slug from name
const getPlayerSlug = (playerName: string) => {
  return playerName.toLowerCase().replace(/[.\s]+/g, '-').replace(/[^\w-]/g, '').replace(/-+/g, '-');
};

// Helper function to format trade notes
const formatTradeNotes = (notes: string) => {
  // Remove hashtags
  const formatted = notes.replace(/#/g, '');

  // Split into lines
  const lines = formatted.split('\n');
  const result: { content: string; isHistory: boolean; addSpacing: boolean }[] = [];
  let inHistorySection = false;

  lines.forEach((line, index) => {
    const trimmedLine = line.trim();

    // Check if this is a THEN line (start of history)
    if (trimmedLine === 'THEN') {
      inHistorySection = true;
      result.push({ content: 'Trade History:', isHistory: true, addSpacing: true });
      return;
    }

    // Skip empty lines unless we're transitioning
    if (trimmedLine === '') {
      return;
    }

    // Check if line ends with ":" (team receiving line)
    const endsWithColon = trimmedLine.endsWith(':');

    // Add spacing before "receive:" lines (except the first one)
    const addSpacing = endsWithColon && result.length > 0 && !result[result.length - 1].addSpacing;

    result.push({
      content: trimmedLine,
      isHistory: inHistorySection,
      addSpacing
    });
  });

  return result;
};

interface DraftPick {
  year: number;
  name: string;
  position: string;
  round: number;
  roundPick: number;
  overallPick: number;
  college: string;
  // Future pick fields
  isTraded?: boolean;
  tradedFrom?: string;
  tradedAway?: boolean;
  tradedTo?: string;
  originalTeamAbbr?: string;
  currentOwnerAbbr?: string;
  tradeNotes?: string;
}

interface DraftPicksResponse {
  teamId: string;
  picks: DraftPick[];
  totalPicks: number;
  lastUpdated: string;
  yearsRange: {
    earliest: number;
    latest: number;
  };
}

interface DraftPicksTabProps {
  team: TeamData;
}

export default function DraftPicksTab({ team }: DraftPicksTabProps) {
  const [selectedYear, setSelectedYear] = useState<string>('All');
  const [selectedRound, setSelectedRound] = useState<string>('All');
  const [selectedPosition, setSelectedPosition] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [draftData, setDraftData] = useState<DraftPick[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDraftPicks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch historical picks and future picks in parallel
      const [historicalResponse, futureResponse] = await Promise.all([
        fetch(getApiPath(`nfl/teams/api/draft-picks/${team.id}`)),
        fetch(getApiPath(`nfl/teams/api/future-draft-picks/${team.id}`))
      ]);

      if (!historicalResponse.ok) {
        if (historicalResponse.status === 404) {
          throw new Error('Draft picks data not available for this team yet');
        }
        throw new Error(`Failed to fetch draft picks: ${historicalResponse.status}`);
      }

      const historicalData: DraftPicksResponse = await historicalResponse.json();

      if (!historicalData.picks || !Array.isArray(historicalData.picks)) {
        throw new Error('Invalid draft picks data received');
      }

      // Get future picks from API (fallback to empty array if API fails)
      let futurePicks: DraftPick[] = [];
      if (futureResponse.ok) {
        const futureData = await futureResponse.json();
        if (futureData.picks && Array.isArray(futureData.picks)) {
          futurePicks = futureData.picks;
        }
      }

      // Combine historical and future picks
      const allPicks = [...historicalData.picks, ...futurePicks];

      setDraftData(allPicks);
    } catch (err) {
      console.error('Error fetching draft picks:', err);
      setError(err instanceof Error ? err.message : 'Failed to load draft picks');
    } finally {
      setLoading(false);
    }
  }, [team.id]);

  useEffect(() => {
    fetchDraftPicks();
  }, [fetchDraftPicks]);

  // Generate filter options from actual data
  const years = useMemo(() =>
    Array.from(new Set(draftData.map(pick => pick.year))).sort((a, b) => b - a)
  , [draftData]);

  const rounds = [1, 2, 3, 4, 5, 6, 7];

  const positions = useMemo(() =>
    Array.from(new Set(draftData.map(pick => pick.position))).sort()
  , [draftData]);

  const filteredData = useMemo(() => {
    return draftData.filter(pick => {
      const yearMatch = selectedYear === 'All' || pick.year.toString() === selectedYear;
      const roundMatch = selectedRound === 'All' || pick.round.toString() === selectedRound;
      const positionMatch = selectedPosition === 'All' || pick.position === selectedPosition;
      const searchMatch = searchTerm === '' ||
        pick.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pick.college.toLowerCase().includes(searchTerm.toLowerCase());

      return yearMatch && roundMatch && positionMatch && searchMatch;
    });
  }, [draftData, selectedYear, selectedRound, selectedPosition, searchTerm]);

  // Group picks by year and sort by overall pick number
  const groupedByYear = useMemo(() => {
    const groups: { [year: number]: DraftPick[] } = {};
    filteredData.forEach(pick => {
      if (!groups[pick.year]) {
        groups[pick.year] = [];
      }
      groups[pick.year].push(pick);
    });
    // Sort picks within each year by overall pick number
    Object.keys(groups).forEach(year => {
      groups[Number(year)].sort((a, b) => a.overallPick - b.overallPick);
    });
    return groups;
  }, [filteredData]);

  const sortedYears = useMemo(() => {
    return Object.keys(groupedByYear).map(Number).sort((a, b) => b - a);
  }, [groupedByYear]);

  if (loading) {
    return (
      <LayoutStabilizer className="bg-white rounded-lg shadow p-4 sm:p-6" minHeight={600}>
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{team.fullName} Draft Picks</h1>
          <div className="h-1 rounded-full" style={{ backgroundColor: team.primaryColor, width: 'fit-content', minWidth: '280px' }}></div>
        </div>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0050A0] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading draft picks...</p>
        </div>
      </LayoutStabilizer>
    );
  }

  if (error) {
    return (
      <LayoutStabilizer className="bg-white rounded-lg shadow p-4 sm:p-6" minHeight={600}>
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{team.fullName} Draft Picks</h1>
          <div className="h-1 rounded-full" style={{ backgroundColor: team.primaryColor, width: 'fit-content', minWidth: '280px' }}></div>
        </div>
        <div className="text-center py-12">
          <div className="text-red-600 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Draft Picks</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchDraftPicks}
            className="inline-flex items-center px-4 py-2 min-h-[44px] border border-transparent text-sm font-medium rounded-md shadow-sm text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2"
            style={{ backgroundColor: team.primaryColor }}
          >
            Try Again
          </button>
        </div>
      </LayoutStabilizer>
    );
  }

  return (
    <LayoutStabilizer className="bg-white rounded-lg shadow p-4 sm:p-6" minHeight={600}>
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{team.fullName} Draft Picks</h1>
        <div className="h-1 rounded-full" style={{ backgroundColor: team.primaryColor, width: 'fit-content', minWidth: '280px' }}></div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-[#0050A0] focus:border-transparent cursor-pointer"
          >
            <option value="All">Year: All</option>
            {years.map(year => (
              <option key={year} value={year.toString()}>{year}</option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={selectedRound}
            onChange={(e) => setSelectedRound(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-[#0050A0] focus:border-transparent cursor-pointer"
          >
            <option value="All">Round: All</option>
            {rounds.map(round => (
              <option key={round} value={round.toString()}>Round {round}</option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={selectedPosition}
            onChange={(e) => setSelectedPosition(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-[#0050A0] focus:border-transparent cursor-pointer"
          >
            <option value="All">Position: All</option>
            {positions.map(position => (
              <option key={position} value={position}>{position}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="draft-picks-search" className="sr-only">Search draft picks by player name</label>
          <input
            id="draft-picks-search"
            type="text"
            placeholder="Search Player..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0050A0] focus:border-transparent"
          />
        </div>
      </div>

      {/* Table with Year Headers */}
      <div className="overflow-x-auto">
        {sortedYears.length === 0 ? (
          <div className="text-center py-8 text-gray-600">
            No draft picks found matching your criteria.
          </div>
        ) : (
          <div className="space-y-6">
            {sortedYears.map(year => (
              <div key={year}>
                {/* Picks Table for this year */}
                <table className="w-full text-sm mb-6">
                  <thead>
                    {/* Year Header Row */}
                    <tr style={{ backgroundColor: team.primaryColor, color: getContrastTextColor(team.primaryColor) }}>
                      <th scope="col" colSpan={6} className="text-left p-3">
                        <span className="text-lg font-bold">{year} Draft Class</span>
                      </th>
                    </tr>
                    {/* Column Headers Row */}
                    <tr className="bg-gray-100 border-b border-gray-200">
                      <th scope="col" className="text-left py-3 px-3 sm:px-4 text-xs font-semibold text-gray-600">Name</th>
                      <th scope="col" className="text-left py-3 px-3 sm:px-4 text-xs font-semibold text-gray-600">Pos</th>
                      <th scope="col" className="text-left py-3 px-3 sm:px-4 text-xs font-semibold text-gray-600">Round</th>
                      <th scope="col" className="text-left py-3 px-3 sm:px-4 text-xs font-semibold text-gray-600">Rnd Pick</th>
                      <th scope="col" className="text-left py-3 px-3 sm:px-4 text-xs font-semibold text-gray-600">Ovr Pick</th>
                      <th scope="col" className="text-left py-3 px-3 sm:px-4 text-xs font-semibold text-gray-600 hidden sm:table-cell">College</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupedByYear[year].map((pick, index) => {
                      const isFuturePick = pick.name === 'TBD';
                      const tradeInfo = pick.isTraded && pick.originalTeamAbbr
                        ? ` (from ${pick.originalTeamAbbr})`
                        : '';

                      return (
                        <>
                          <tr key={`${pick.year}-${pick.round}-${pick.overallPick}-${index}`} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="p-3">
                              {isFuturePick ? (
                                <span className="font-medium text-gray-900">TBD</span>
                              ) : (
                                <Link
                                  href={`/nfl-hq/players/${getPlayerSlug(pick.name)}`}
                                  className="font-medium hover:underline cursor-pointer"
                                  style={{ color: team.primaryColor }}
                                >
                                  {pick.name}
                                </Link>
                              )}
                            </td>
                            <td className="p-3 text-gray-700">{pick.position}</td>
                            <td className="p-3 text-gray-700">
                              {pick.round}{tradeInfo && <span className="text-sm text-gray-600 italic">{tradeInfo}</span>}
                            </td>
                            <td className="p-3 text-gray-700">{pick.roundPick === 0 ? 'TBD' : pick.roundPick}</td>
                            <td className="p-3 text-gray-700">{pick.overallPick === 0 ? 'TBD' : pick.overallPick}</td>
                            <td className="p-3 text-gray-700 hidden sm:table-cell">{pick.college}</td>
                          </tr>
                          {pick.tradeNotes && (
                            <tr key={`${pick.year}-${pick.round}-${pick.overallPick}-${index}-notes`} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              <td colSpan={6} className="px-3 pb-3 pt-0">
                                <div className="text-xs border-l-2 pl-3" style={{ borderColor: team.primaryColor }}>
                                  {formatTradeNotes(pick.tradeNotes).map((item, i) => (
                                    <div
                                      key={i}
                                      className={`${item.addSpacing ? 'mt-2' : ''} ${
                                        item.isHistory
                                          ? 'text-gray-600 italic ml-4'
                                          : item.content.endsWith(':')
                                          ? 'text-gray-700 font-medium'
                                          : 'text-gray-600 italic'
                                      }`}
                                    >
                                      {item.content}
                                    </div>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}
      </div>
    </LayoutStabilizer>
  );
}