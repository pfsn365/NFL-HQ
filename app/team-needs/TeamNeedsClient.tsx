'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import PlayerImage from '@/components/PlayerImage';
import { getAllTeams, TeamData } from '@/data/teams';
import { teamNeeds as staticTeamNeeds, PositionNeed, TeamNeeds } from '@/data/team-needs';
import { getApiPath } from '@/utils/api';
import {
  type FreeAgent,
  generatePlayerSlug,
  mapTeamNameToId,
  transformFreeAgentData,
} from '@/utils/freeAgentHelpers';
import {
  HEATMAP_POSITIONS,
  getAbbrFromFullName,
  getNeedCategoryFromAbbr,
} from '@/utils/positionMapping';
import GMSimBanner from '@/components/GMSimBanner';

// ---------------------------------------------------------------------------
// Reuse need-level helpers from TeamNeedsTab
// ---------------------------------------------------------------------------
function getNeedColor(needLevel: number): string {
  if (needLevel >= 8) return '#dc2626';
  if (needLevel >= 6) return '#ea580c';
  if (needLevel >= 4) return '#ca8a04';
  if (needLevel >= 2) return '#16a34a';
  return '#059669';
}

function getNeedLabel(needLevel: number): string {
  if (needLevel >= 8) return 'Critical';
  if (needLevel >= 6) return 'High';
  if (needLevel >= 4) return 'Medium';
  if (needLevel >= 2) return 'Low';
  return 'Minimal';
}

// ---------------------------------------------------------------------------
// Cap space color helper
// ---------------------------------------------------------------------------
function getCapColor(cap: number): string {
  if (cap >= 30_000_000) return '#16a34a';
  if (cap >= 10_000_000) return '#ca8a04';
  if (cap >= 0) return '#ea580c';
  return '#dc2626';
}

function formatCap(cap: number): string {
  if (cap >= 0) return `$${(cap / 1_000_000).toFixed(1)}M`;
  return `-$${(Math.abs(cap) / 1_000_000).toFixed(1)}M`;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface TeamSummary {
  team: TeamData;
  needs: PositionNeed[];
  criticalCount: number;
  highCount: number;
  avgNeed: number;
  capSpace: number | null;
  record: string | null;
  draftPicks: number | null;
}

type SortMode = 'needs' | 'alpha' | 'division' | 'cap';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function TeamNeedsClient() {
  const allTeams = useMemo(() => getAllTeams(), []);

  // Team needs data (API with static fallback)
  const [teamNeeds, setTeamNeeds] = useState<TeamNeeds>(staticTeamNeeds);

  // Live data
  const [freeAgents, setFreeAgents] = useState<FreeAgent[]>([]);
  const [salaryCapMap, setSalaryCapMap] = useState<Record<string, number>>({});
  const [recordMap, setRecordMap] = useState<Record<string, string>>({});
  const [draftPicksMap, setDraftPicksMap] = useState<Record<string, number>>({});
  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [positionFilter, setPositionFilter] = useState('all');
  const [sortMode, setSortMode] = useState<SortMode>('alpha');
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [expandedPositions, setExpandedPositions] = useState<Set<string>>(new Set());

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // ---------------------------------------------------------------------------
  // Fetch live data on mount
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const controller = new AbortController();
    async function fetchLiveData() {
      try {
        const opts = { signal: controller.signal };
        const [faRes, capRes, standingsRes, draftRes, needsRes] = await Promise.all([
          fetch(getApiPath('api/free-agents'), opts),
          fetch(getApiPath('api/nfl/salary-cap/all'), opts),
          fetch(getApiPath('nfl/teams/api/standings'), opts),
          fetch(getApiPath('nfl/teams/api/future-draft-picks/all'), opts),
          fetch(getApiPath('api/team-needs'), opts),
        ]);

        if (faRes.ok) {
          const faData = await faRes.json();
          if (faData.output && Array.isArray(faData.output)) {
            setFreeAgents(transformFreeAgentData(faData.output));
          }
        }

        if (capRes.ok) {
          const capData = await capRes.json();
          const capTeams = capData.teams ?? capData;
          if (Array.isArray(capTeams)) {
            const map: Record<string, number> = {};
            for (const entry of capTeams) {
              const teamId = entry.teamId || mapTeamNameToId(entry.team || entry.teamName);
              if (teamId && entry.capSpace != null) {
                map[teamId] = typeof entry.capSpace === 'number'
                  ? entry.capSpace
                  : parseFloat(String(entry.capSpace).replace(/[$,]/g, '')) || 0;
              }
            }
            setSalaryCapMap(map);
          }
        }
        if (standingsRes.ok) {
          const standingsData = await standingsRes.json();
          if (Array.isArray(standingsData.standings)) {
            const map: Record<string, string> = {};
            for (const entry of standingsData.standings) {
              if (entry.teamId && entry.recordString) {
                // Strip trailing "-0" ties (show 3-14, not 3-14-0)
                map[entry.teamId] = entry.recordString.replace(/-0$/, '');
              }
            }
            setRecordMap(map);
          }
        }

        if (draftRes.ok) {
          const draftData = await draftRes.json();
          if (draftData.teams) {
            const map: Record<string, number> = {};
            for (const [teamId, info] of Object.entries<any>(draftData.teams)) {
              map[teamId] = info.totalPicks;
            }
            setDraftPicksMap(map);
          }
        }

        if (needsRes.ok) {
          const needsData = await needsRes.json();
          if (needsData.teamNeeds) {
            setTeamNeeds(needsData.teamNeeds);
          }
        }
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') return;
        console.error('Error fetching live data:', e);
      }
    }
    fetchLiveData();
    return () => controller.abort();
  }, []);

  // ---------------------------------------------------------------------------
  // Computed data
  // ---------------------------------------------------------------------------

  // Unsigned FAs grouped by need-category position
  const unsignedFAsByPosition = useMemo(() => {
    const map = new Map<string, FreeAgent[]>();
    for (const fa of freeAgents) {
      if (fa.signed2026Team && fa.signed2026Team.trim() !== '') continue;
      const category = getNeedCategoryFromAbbr(fa.position);
      if (!map.has(category)) map.set(category, []);
      map.get(category)!.push(fa);
    }
    // Sort each bucket by impact descending
    for (const [, list] of map) {
      list.sort((a, b) => b.pfsn2025Impact - a.pfsn2025Impact);
    }
    return map;
  }, [freeAgents]);

  // Signed FAs by team (teamId → FreeAgent[])
  const signedFAsByTeam = useMemo(() => {
    const map = new Map<string, FreeAgent[]>();
    for (const fa of freeAgents) {
      if (!fa.signed2026Team || fa.signed2026Team.trim() === '') continue;
      const teamId = mapTeamNameToId(fa.signed2026Team);
      if (!teamId) continue;
      if (!map.has(teamId)) map.set(teamId, []);
      map.get(teamId)!.push(fa);
    }
    return map;
  }, [freeAgents]);

  // Top 3 signings per team (by rank, lower = better)
  const topSigningsByTeam = useMemo(() => {
    const map = new Map<string, FreeAgent[]>();
    for (const [teamId, signings] of signedFAsByTeam) {
      const sorted = [...signings].sort((a, b) => a.rank - b.rank);
      map.set(teamId, sorted.slice(0, 3));
    }
    return map;
  }, [signedFAsByTeam]);

  // Team summaries
  const teamSummaries: TeamSummary[] = useMemo(() => {
    return allTeams.map(team => {
      const needs = teamNeeds[team.id] || [];
      const criticalCount = needs.filter(n => n.needLevel >= 8).length;
      const highCount = needs.filter(n => n.needLevel >= 6 && n.needLevel < 8).length;
      const avgNeed = needs.length > 0
        ? needs.reduce((s, n) => s + n.needLevel, 0) / needs.length
        : 0;
      return {
        team,
        needs,
        criticalCount,
        highCount,
        avgNeed,
        capSpace: salaryCapMap[team.id] ?? null,
        record: recordMap[team.id] ?? null,
        draftPicks: draftPicksMap[team.id] ?? null,
      };
    });
  }, [allTeams, salaryCapMap, recordMap, draftPicksMap, teamNeeds]);

  // Filtered + sorted
  const filteredTeams = useMemo(() => {
    let list = teamSummaries;

    // Search
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      list = list.filter(ts =>
        ts.team.fullName.toLowerCase().includes(q) ||
        ts.team.abbreviation.toLowerCase().includes(q) ||
        ts.team.city.toLowerCase().includes(q) ||
        ts.team.division.toLowerCase().includes(q)
      );
    }

    // Position filter: only show teams where the selected position has needLevel >= 4
    if (positionFilter !== 'all') {
      list = list.filter(ts =>
        ts.needs.some(n => getAbbrFromFullName(n.position) === positionFilter && n.needLevel >= 4)
      );
    }

    // Sort
    const sorted = [...list];
    switch (sortMode) {
      case 'needs':
        sorted.sort((a, b) => (b.criticalCount + b.highCount) - (a.criticalCount + a.highCount) || b.avgNeed - a.avgNeed);
        break;
      case 'alpha':
        sorted.sort((a, b) => a.team.fullName.localeCompare(b.team.fullName));
        break;
      case 'division':
        sorted.sort((a, b) => a.team.division.localeCompare(b.team.division) || a.team.fullName.localeCompare(b.team.fullName));
        break;
      case 'cap':
        sorted.sort((a, b) => (b.capSpace ?? -Infinity) - (a.capSpace ?? -Infinity));
        break;
    }

    return sorted;
  }, [teamSummaries, debouncedSearch, positionFilter, sortMode]);

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------
  const toggleCard = (teamId: string) => {
    // Find the sibling card in the 2-col grid so both expand/collapse together
    const idx = filteredTeams.findIndex(t => t.team.id === teamId);
    const siblingIdx = idx % 2 === 0 ? idx + 1 : idx - 1;
    const siblingId = filteredTeams[siblingIdx]?.team.id;
    const expanding = !expandedCards.has(teamId);

    setExpandedCards(prev => {
      const next = new Set(prev);
      if (expanding) {
        next.add(teamId);
        if (siblingId) next.add(siblingId);
      } else {
        next.delete(teamId);
        if (siblingId) next.delete(siblingId);
      }
      return next;
    });
  };

  const togglePosition = (key: string) => {
    setExpandedPositions(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header
        className="text-white shadow-lg"
        style={{
          background: 'linear-gradient(180deg, #0050A0 0%, #003A75 100%)',
          boxShadow: 'inset 0 -30px 40px -30px rgba(0,0,0,0.15), 0 4px 6px -1px rgba(0,0,0,0.1)'
        }}
      >
        <div className="container mx-auto px-4 pt-4 sm:pt-7 md:pt-8 lg:pt-10 pb-4 sm:pb-5 md:pb-6 lg:pb-7">
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold mb-1 sm:mb-2">
            NFL Team Needs
          </h1>
          <p className="text-sm sm:text-lg opacity-90 font-medium">
            Position-by-position analysis for all 32 teams heading into the 2026 NFL Draft and free agency
          </p>
        </div>
      </header>
      <GMSimBanner />

      {/* Raptive Header Ad */}
      <div className="container mx-auto px-4 h-[120px] flex items-center justify-center">
        <div className="raptive-pfn-header-90 w-full h-full"></div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search teams..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0050A0] focus:border-[#0050A0] outline-none transition-colors text-sm"
            />
          </div>

          {/* Position filter */}
          <select
            value={positionFilter}
            onChange={e => setPositionFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0050A0] focus:border-[#0050A0] outline-none transition-colors text-sm cursor-pointer"
          >
            <option value="all">All Positions</option>
            {HEATMAP_POSITIONS.map(pos => (
              <option key={pos} value={pos}>{pos}</option>
            ))}
          </select>

          {/* Sort */}
          <select
            value={sortMode}
            onChange={e => setSortMode(e.target.value as SortMode)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0050A0] focus:border-[#0050A0] outline-none transition-colors text-sm cursor-pointer"
          >
            <option value="needs">Most Needs</option>
            <option value="alpha">Alphabetical</option>
            <option value="division">By Division</option>
            <option value="cap">Cap Space</option>
          </select>
        </div>
      </div>

      {/* Team Cards */}
      <div className="px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredTeams.map(({ team, needs, criticalCount, highCount, avgNeed, capSpace, record, draftPicks }) => {
            const isExpanded = expandedCards.has(team.id);
            const topSignings = topSigningsByTeam.get(team.id);

            return (
              <div
                key={team.id}
                id={`team-card-${team.id}`}
                className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden scroll-mt-4"
              >
                {/* Color bar */}
                <div className="h-1" style={{ backgroundColor: team.primaryColor }} />

                {/* Header */}
                <div
                  className="p-4 cursor-pointer select-none"
                  onClick={() => toggleCard(team.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img src={team.logoUrl} alt={team.fullName} className="w-8 h-8 object-contain" />
                      <div>
                        <h3 className="font-bold text-gray-900 text-sm sm:text-base">
                          {team.fullName}
                          {record && <span className="font-normal text-gray-500 ml-1">({record})</span>}
                        </h3>
                        <span className="text-xs text-gray-500">{team.division}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <svg
                        className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  {/* Summary stats */}
                  <div className="flex gap-4 mt-2 text-xs">
                    {capSpace !== null && (
                      <span className="font-semibold text-[#0050A0]">
                        Cap: {formatCap(capSpace)}
                      </span>
                    )}
                    {draftPicks !== null && (
                      <span className="font-semibold text-[#0050A0]">
                        2026 Draft Picks: {draftPicks}
                      </span>
                    )}
                    <span className="font-semibold text-[#0050A0]">
                      Avg Need: {avgNeed.toFixed(1)}
                    </span>
                  </div>

                  {/* Top Signings */}
                  {topSignings && topSignings.length > 0 && (
                    <div className="mt-3" onClick={e => e.stopPropagation()}>
                      <h4 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Top Signings</h4>
                      <div className="space-y-1">
                        {topSignings.map(fa => (
                          <Link
                            key={fa.name}
                            href={`/free-agency-tracker?team=${team.id}`}
                            className="flex items-center justify-between gap-2 px-2 py-1 rounded hover:bg-gray-50 transition-colors group"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <PlayerImage
                                slug={generatePlayerSlug(fa.name)}
                                name={fa.name}
                                size="sm"
                                teamColor={team.primaryColor}
                                className="!w-5 !h-5 flex-shrink-0"
                              />
                              <span className="text-xs font-medium text-gray-900 group-hover:text-[#0050A0] transition-colors truncate">{fa.name}</span>
                              <span className="text-[10px] text-gray-500 flex-shrink-0">{fa.position}</span>
                            </div>
                            <span className="text-[10px] font-semibold text-gray-700 flex-shrink-0">
                              {fa.newAAV && fa.newAAV !== '-' ? fa.newAAV : 'TBD'}
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="border-t border-gray-100 px-4 pb-4">
                    <div className="space-y-2 mt-3">
                      {[...needs].sort((a, b) => b.needLevel - a.needLevel).map(need => {
                        const posAbbr = getAbbrFromFullName(need.position);
                        const posKey = `${team.id}-${need.position}`;
                        const isPosExpanded = expandedPositions.has(posKey);
                        const needColor = getNeedColor(need.needLevel);
                        const topFAFits = need.needLevel >= 7
                          ? (unsignedFAsByPosition.get(need.position) || []).slice(0, 3)
                          : [];

                        return (
                          <div key={need.position} className="border border-gray-100 rounded-lg overflow-hidden">
                            {/* Position row */}
                            <div
                              className="flex items-center gap-2 p-2.5 cursor-pointer hover:bg-gray-50 transition-colors"
                              onClick={() => togglePosition(posKey)}
                            >
                              {/* Position badge */}
                              <span className="text-[10px] font-bold text-gray-900">
                                {posAbbr}
                              </span>

                              {/* Need bar */}
                              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all duration-300"
                                  style={{ width: `${(need.needLevel / 10) * 100}%`, backgroundColor: needColor }}
                                />
                              </div>

                              {/* Score */}
                              <span className="text-xs font-bold min-w-[28px] text-right" style={{ color: needColor }}>
                                {need.needLevel.toFixed(1)}
                              </span>

                              {/* Label */}
                              <span
                                className="text-[10px] px-1.5 py-0.5 rounded-full font-medium min-w-[52px] text-center"
                                style={{ backgroundColor: needColor + '20', color: needColor }}
                              >
                                {getNeedLabel(need.needLevel)}
                              </span>

                              {/* Expand icon */}
                              <svg
                                className={`w-4 h-4 text-gray-400 transition-transform duration-200 flex-shrink-0 ${isPosExpanded ? 'rotate-180' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>

                            {/* FA Fits (shown below the row when needLevel >= 7) */}
                            {topFAFits.length > 0 && !isPosExpanded && (
                              <div className="px-2.5 pb-2 flex flex-wrap items-center gap-2 text-[10px] text-gray-600">
                                <span className="font-medium text-gray-500">Top FAs:</span>
                                {topFAFits.map(fa => (
                                  <Link
                                    key={fa.name}
                                    href="/free-agency-tracker"
                                    className="inline-flex items-center gap-1 hover:text-[#0050A0] transition-colors"
                                    onClick={e => e.stopPropagation()}
                                  >
                                    <PlayerImage
                                      slug={generatePlayerSlug(fa.name)}
                                      name={fa.name}
                                      size="sm"
                                      teamColor={team.primaryColor}
                                      className="!w-4 !h-4"
                                    />
                                    <span>{fa.name}</span>
                                    <span className="text-gray-400">({fa.pfsn2025Impact.toFixed(1)})</span>
                                  </Link>
                                ))}
                              </div>
                            )}

                            {/* Expanded position detail */}
                            {isPosExpanded && (
                              <div className="border-t border-gray-100 bg-gray-50 p-3">
                                {/* Writeup */}
                                <p className="text-xs text-gray-700 leading-relaxed mb-3">{need.writeup}</p>

                                {/* FA Fits (in expanded view) */}
                                {topFAFits.length > 0 && (
                                  <div>
                                    <h4 className="text-xs font-semibold text-gray-900 mb-1.5">Top FAs</h4>
                                    <div className="flex flex-wrap gap-2">
                                      {topFAFits.map(fa => (
                                        <Link
                                          key={fa.name}
                                          href="/free-agency-tracker"
                                          className="inline-flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-2 py-1 hover:border-[#0050A0] transition-colors"
                                        >
                                          <PlayerImage
                                            slug={generatePlayerSlug(fa.name)}
                                            name={fa.name}
                                            size="sm"
                                            teamColor={team.primaryColor}
                                          />
                                          <div className="text-xs">
                                            <span className="font-medium text-gray-900">{fa.name}</span>
                                            <span className="text-gray-500 ml-1">({fa.pfsn2025Impact.toFixed(1)})</span>
                                          </div>
                                        </Link>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {filteredTeams.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg font-medium">No teams found</p>
            <p className="text-sm mt-1">Try adjusting your search or filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
