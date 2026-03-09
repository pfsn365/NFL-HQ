'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Link from 'next/link';
import PlayerImage from '@/components/PlayerImage';
import SkeletonLoader from '@/components/SkeletonLoader';
import Pagination from '@/components/Pagination';
import ContractComps from '@/components/ContractComps';
import ContractRankings from '@/components/ContractRankings';
import MarketSidebar from '@/components/MarketSidebar';
import { getAllTeams } from '@/data/teams';
import { getApiPath } from '@/utils/api';
import {
  type FreeAgent,
  type RawFreeAgentData,
  type SortKey,
  generatePlayerSlug,
  mapTeamNameToId,
  getPositionImpactUrl,
  transformFreeAgentData,
} from '@/utils/freeAgentHelpers';
import { type ContractSheet, hasContractComps, formatCompactMoney, parseMoney } from '@/utils/contractCompHelpers';
import { teamNeeds as staticTeamNeeds, type TeamNeeds } from '@/data/team-needs';
import { getNeedCategoryFromAbbr } from '@/utils/positionMapping';

export default function FreeAgencyTrackerClient() {
  const allTeams = getAllTeams();

  // Team needs (API with static fallback)
  const [teamNeeds, setTeamNeeds] = useState<TeamNeeds>(staticTeamNeeds);

  // State Management
  const [allFreeAgents, setAllFreeAgents] = useState<FreeAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Expandable row + contract comps state (lazy loaded)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [contractSheets, setContractSheets] = useState<ContractSheet[]>([]);
  const [contractsLoading, setContractsLoading] = useState(false);
  const [contractsFetched, setContractsFetched] = useState(false);

  const fetchContractSheets = useCallback(async () => {
    if (contractsFetched || contractsLoading) return;
    setContractsLoading(true);
    try {
      const res = await fetch(getApiPath('api/contract-estimations'));
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      if (data.sheets) setContractSheets(data.sheets);
      setContractsFetched(true);
    } catch {
      // Silent fail — comps just won't show
    } finally {
      setContractsLoading(false);
    }
  }, [contractsFetched, contractsLoading]);

  const toggleRow = useCallback((rowKey: string, isExpandable: boolean) => {
    if (!isExpandable) return;
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(rowKey)) {
        next.delete(rowKey);
      } else {
        next.add(rowKey);
        // Lazy-load contract data on first expand
        if (!contractsFetched) fetchContractSheets();
      }
      return next;
    });
  }, [contractsFetched, fetchContractSheets]);

  // Tab state
  const [activeTab, setActiveTab] = useState<'tracker' | 'rankings'>('tracker');

  const handleTabChange = useCallback((tab: 'tracker' | 'rankings') => {
    setActiveTab(tab);
    if (tab === 'rankings' && !contractsFetched) {
      fetchContractSheets();
    }
  }, [contractsFetched, fetchContractSheets]);

  // Filter States
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [selectedPositions, setSelectedPositions] = useState<Set<string>>(new Set());
  const [positionDropdownOpen, setPositionDropdownOpen] = useState(false);
  const [selectedFaType, setSelectedFaType] = useState('all');
  const [selectedSignedStatus, setSelectedSignedStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search query (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Sorting States
  const [sortKey, setSortKey] = useState<SortKey>('rank');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Load items per page from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('free_agency_items_per_page');
    if (stored) {
      const parsed = parseInt(stored, 10);
      if ([25, 50, 100].includes(parsed)) {
        setItemsPerPage(parsed);
      }
    }
  }, []);

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (count: number) => {
    localStorage.setItem('free_agency_items_per_page', count.toString());
    setItemsPerPage(count);
    setCurrentPage(1);
  };

  // Data Fetching
  useEffect(() => {
    if (hasLoaded) return;
    const controller = new AbortController();

    async function fetchFreeAgents() {
      try {
        setLoading(true);
        const response = await fetch(getApiPath('api/free-agents'), { signal: controller.signal });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('API Error Response:', errorData);
          throw new Error(errorData.message || `Failed to fetch free agents: ${response.status}`);
        }

        const data = await response.json();

        if (data.error) {
          throw new Error(data.message || data.error);
        }

        if (data.output && Array.isArray(data.output)) {
          const transformed = transformFreeAgentData(data.output);
          setAllFreeAgents(transformed);
        } else {
          console.error('Invalid data format. Received:', Object.keys(data));
          throw new Error('Invalid data format from API');
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        console.error('Error fetching free agents:', err);
        setError(err instanceof Error ? err.message : 'Failed to load free agent data');
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
          setHasLoaded(true);
        }
      }
    }

    fetchFreeAgents();

    // Fetch live team needs (non-blocking)
    fetch(getApiPath('api/team-needs'), { signal: controller.signal })
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data?.teamNeeds) setTeamNeeds(data.teamNeeds); })
      .catch(() => {}); // keep static fallback

    return () => controller.abort();
  }, [hasLoaded]);

  // Silent background polling every 5 minutes for live updates
  useEffect(() => {
    if (!hasLoaded) return;
    const controller = new AbortController();

    const POLL_INTERVAL = 5 * 60 * 1000; // 5 minutes

    const interval = setInterval(async () => {
      try {
        const response = await fetch(getApiPath('api/free-agents'), { signal: controller.signal });
        if (!response.ok) return;

        const data = await response.json();
        if (data.error || !data.output || !Array.isArray(data.output)) return;

        const transformed = transformFreeAgentData(data.output);
        setAllFreeAgents(transformed);
      } catch {
        // Silent fail — don't disrupt the user
      }
    }, POLL_INTERVAL);

    return () => { clearInterval(interval); controller.abort(); };
  }, [hasLoaded]);

  // Eagerly fetch contract sheets for market sidebar
  useEffect(() => {
    if (hasLoaded && !contractsFetched) {
      fetchContractSheets();
    }
  }, [hasLoaded, contractsFetched, fetchContractSheets]);

  // Position groupings for offense/defense filter
  const offensePositions = ['QB', 'RB', 'FB', 'WR', 'TE', 'OT', 'OG', 'OC', 'OL'];
  const defensePositions = ['DT', 'DE', 'EDGE', 'LB', 'ILB', 'OLB', 'CB', 'S', 'FS', 'SS'];
  const specialTeamsPositions = ['K', 'P', 'LS'];

  // Extract unique positions for filter with custom order
  const availablePositions = useMemo(() => {
    const positionOrder = [...offensePositions, ...defensePositions, ...specialTeamsPositions];
    const positions = new Set(allFreeAgents.map(a => a.position).filter(Boolean));
    return Array.from(positions).sort((a, b) => {
      const indexA = positionOrder.indexOf(a);
      const indexB = positionOrder.indexOf(b);
      if (indexA === -1 && indexB === -1) return a.localeCompare(b);
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });
  }, [allFreeAgents]);

  // Group available positions by side of ball
  const groupedPositions = useMemo(() => {
    const offense = availablePositions.filter(p => offensePositions.includes(p));
    const defense = availablePositions.filter(p => defensePositions.includes(p));
    const special = availablePositions.filter(p => specialTeamsPositions.includes(p));
    const other = availablePositions.filter(p => !offensePositions.includes(p) && !defensePositions.includes(p) && !specialTeamsPositions.includes(p));
    return { offense, defense, special, other };
  }, [availablePositions]);

  // Extract unique FA types for filter
  const availableFaTypes = useMemo(() => {
    const types = new Set(allFreeAgents.map(a => a.faType).filter(Boolean));
    return Array.from(types).sort();
  }, [allFreeAgents]);

  // Position counts for filter options
  const positionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allFreeAgents.forEach(a => {
      if (a.position) {
        counts[a.position] = (counts[a.position] || 0) + 1;
      }
    });
    return counts;
  }, [allFreeAgents]);

  // Active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedTeam !== 'all') count++;
    if (selectedPositions.size > 0) count++;
    if (selectedFaType !== 'all') count++;
    if (selectedSignedStatus !== 'all') count++;
    if (searchQuery.trim() !== '') count++;
    return count;
  }, [selectedTeam, selectedPositions, selectedFaType, selectedSignedStatus, searchQuery]);

  // Filtering Logic
  const filteredFreeAgents = useMemo(() => {
    return allFreeAgents.filter(agent => {
      const matchesTeam = selectedTeam === 'all' || agent.teamId === selectedTeam;
      const matchesPosition = selectedPositions.size === 0 || selectedPositions.has(agent.position);
      const matchesFaType = selectedFaType === 'all' || agent.faType === selectedFaType;
      const matchesSearch = debouncedSearch.trim() === '' || agent.name.toLowerCase().includes(debouncedSearch.toLowerCase());

      let matchesSignedStatus = true;
      if (selectedSignedStatus === 'unsigned') {
        matchesSignedStatus = !agent.signed2026Team || agent.signed2026Team.trim() === '';
      } else if (selectedSignedStatus === 'signed') {
        matchesSignedStatus = !!(agent.signed2026Team && agent.signed2026Team.trim() !== '') && agent.faType !== 'Franchise' && agent.faType !== 'Transition';
      } else if (selectedSignedStatus === 'tagged') {
        matchesSignedStatus = agent.faType === 'Franchise' || agent.faType === 'Transition';
      }

      return matchesTeam && matchesPosition && matchesFaType && matchesSignedStatus && matchesSearch;
    });
  }, [allFreeAgents, selectedTeam, selectedPositions, selectedFaType, selectedSignedStatus, debouncedSearch]);

  // Sorting Logic
  const sortedFreeAgents = useMemo(() => {
    const sorted = [...filteredFreeAgents].sort((a, b) => {
      let aValue: number | string = a[sortKey];
      let bValue: number | string = b[sortKey];

      if (sortKey === 'name') {
        return sortDirection === 'asc'
          ? aValue.toString().localeCompare(bValue.toString())
          : bValue.toString().localeCompare(aValue.toString());
      }

      // Parse money strings for newAAV
      if (sortKey === 'newAAV') {
        const aNum = parseMoney(a.newAAV);
        const bNum = parseMoney(b.newAAV);
        return sortDirection === 'desc' ? bNum - aNum : aNum - bNum;
      }

      // Numeric comparison
      const aNum = typeof aValue === 'number' ? aValue : 0;
      const bNum = typeof bValue === 'number' ? bValue : 0;

      return sortDirection === 'desc' ? bNum - aNum : aNum - bNum;
    });

    return sorted;
  }, [filteredFreeAgents, sortKey, sortDirection]);

  // Pagination Logic
  const totalPages = Math.ceil(sortedFreeAgents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedFreeAgents = sortedFreeAgents.slice(startIndex, startIndex + itemsPerPage);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedTeam, selectedPositions, selectedFaType, selectedSignedStatus, searchQuery]);

  // Market summary stats — scoped to the currently selected position (or all)
  const marketSummary = useMemo(() => {
    const positionGroup = selectedPositions.size === 0
      ? allFreeAgents
      : allFreeAgents.filter(a => selectedPositions.has(a.position));

    const total = positionGroup.length;
    const signed = positionGroup.filter(a => a.signed2026Team && a.signed2026Team.trim() !== '' && a.faType !== 'Franchise' && a.faType !== 'Transition');
    const tagged = positionGroup.filter(a => a.faType === 'Franchise' || a.faType === 'Transition');
    const signedCount = signed.length + tagged.length;

    let totalCommitted = 0;
    for (const a of [...signed, ...tagged]) {
      if (a.newAAV) totalCommitted += parseMoney(a.newAAV);
    }

    // Top remaining unsigned FA (highest rank = lowest number)
    const unsigned = positionGroup
      .filter(a => (!a.signed2026Team || a.signed2026Team.trim() === '') && a.faType !== 'Franchise' && a.faType !== 'Transition')
      .sort((a, b) => a.rank - b.rank);
    const topUnsigned = unsigned[0] || null;

    return { total, signedCount, totalCommitted, topUnsigned, positions: selectedPositions };
  }, [allFreeAgents, selectedPositions]);

  // Sort Handler
  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('desc');
    }
  };

  // Sort Indicator Component
  const SortIndicator = ({ column }: { column: SortKey }) => {
    if (sortKey !== column) return null;

    return (
      <span className="ml-1">
        {sortDirection === 'asc' ? '↑' : '↓'}
      </span>
    );
  };

  // Get Team Info
  const getTeamInfo = (teamId?: string) => {
    if (!teamId) return null;
    return allTeams.find(t => t.id === teamId);
  };

  // Main table ref for syncing sidebar height
  const mainTableRef = useRef<HTMLDivElement>(null);
  const [mainTableHeight, setMainTableHeight] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (!mainTableRef.current) return;
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        setMainTableHeight(entry.contentRect.height);
      }
    });
    observer.observe(mainTableRef.current);
    return () => observer.disconnect();
  }, [loading, error]);

  // Position needs popover
  const [needsPopover, setNeedsPopover] = useState<{ position: string; top: number; left: number } | null>(null);

  const getTopTeamNeeds = useCallback((posAbbr: string) => {
    const needCategory = getNeedCategoryFromAbbr(posAbbr);
    const results: { teamId: string; teamName: string; logoUrl: string; needLevel: number }[] = [];

    for (const [teamId, needs] of Object.entries(teamNeeds)) {
      const match = needs.find(n => n.position === needCategory);
      if (match) {
        const team = allTeams.find(t => t.id === teamId);
        if (team) {
          results.push({
            teamId,
            teamName: team.name,
            logoUrl: team.logoUrl,
            needLevel: match.needLevel,
          });
        }
      }
    }

    return results.sort((a, b) => b.needLevel - a.needLevel).slice(0, 5);
  }, [allTeams, teamNeeds]);

  const handlePositionClick = useCallback((e: React.MouseEvent, position: string) => {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setNeedsPopover(prev =>
      prev?.position === position ? null : { position, top: rect.bottom + 4, left: rect.left + rect.width / 2 }
    );
  }, []);

  // Close popover on outside click
  useEffect(() => {
    if (!needsPopover) return;
    const handleClick = () => setNeedsPopover(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [needsPopover]);

  return (
      <main id="main-content" className="pt-[48px] lg:pt-0">
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
              NFL Free Agency Tracker
            </h1>
            <p className="text-sm sm:text-lg opacity-90 font-medium">
              Track free agents, signings, and player availability across the league
            </p>
          </div>
        </header>

        {/* Raptive Header Ad */}
        <div className="container mx-auto px-4 h-[120px] flex items-center justify-center">
          <div className="raptive-pfn-header-90 w-full h-full"></div>
        </div>

        {/* Content */}
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-[1400px]">
          {loading ? (
            /* Loading State */
            <SkeletonLoader type="table" rows={15} />
          ) : error ? (
            /* Error State */
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h3 className="text-red-800 font-semibold mb-1">Failed to load free agents</h3>
                  <p className="text-red-600 text-sm">{error}</p>
                  <button
                    onClick={() => { setHasLoaded(false); setError(null); }}
                    className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                  >
                    Retry
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Filters */}
              <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-700">Filters</span>
                    {activeFilterCount > 0 && (
                      <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-[#0050A0] rounded-full">
                        {activeFilterCount}
                      </span>
                    )}
                  </div>
                  {activeFilterCount > 0 && (
                    <button
                      onClick={() => {
                        setSelectedTeam('all');
                        setSelectedPositions(new Set());
                        setSelectedFaType('all');
                        setSelectedSignedStatus('all');
                        setSearchQuery('');
                      }}
                      className="text-xs font-medium text-[#0050A0] hover:text-[#003A75] cursor-pointer"
                    >
                      Clear all
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                  {/* Team Filter */}
                  <div>
                    <label htmlFor="fa-team-filter" className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Team</label>
                    <select
                      id="fa-team-filter"
                      value={selectedTeam}
                      onChange={e => setSelectedTeam(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0050A0] bg-white text-sm cursor-pointer"
                    >
                      <option value="all">All Teams</option>
                      {allTeams.map(team => (
                        <option key={team.id} value={team.id}>{team.fullName}</option>
                      ))}
                    </select>
                  </div>

                  {/* Position Filter — Multi-select */}
                  <div className="relative">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Position</label>
                    <button
                      type="button"
                      onClick={() => setPositionDropdownOpen(!positionDropdownOpen)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0050A0] bg-white text-sm cursor-pointer text-left flex items-center justify-between"
                    >
                      <span className="truncate">
                        {selectedPositions.size === 0
                          ? 'All Positions'
                          : selectedPositions.size <= 3
                            ? [...selectedPositions].join(', ')
                            : `${selectedPositions.size} positions`}
                      </span>
                      <svg className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${positionDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {positionDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setPositionDropdownOpen(false)} />
                        <div className="absolute z-20 mt-1 w-72 bg-white border border-gray-200 rounded-lg shadow-lg p-3 max-h-80 overflow-y-auto">
                          {/* Quick select buttons */}
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            <button
                              type="button"
                              onClick={() => setSelectedPositions(new Set())}
                              className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                                selectedPositions.size === 0
                                  ? 'bg-[#0050A0] text-white'
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              }`}
                            >
                              All
                            </button>
                            {[
                              { label: 'Offense', positions: groupedPositions.offense },
                              { label: 'Defense', positions: groupedPositions.defense },
                              { label: 'Special Teams', positions: groupedPositions.special },
                            ].map(group => {
                              const groupSet = new Set(group.positions);
                              const allSelected = group.positions.length > 0 && group.positions.every(p => selectedPositions.has(p));
                              return (
                                <button
                                  key={group.label}
                                  type="button"
                                  onClick={() => {
                                    if (allSelected) {
                                      setSelectedPositions(prev => {
                                        const next = new Set(prev);
                                        group.positions.forEach(p => next.delete(p));
                                        return next;
                                      });
                                    } else {
                                      setSelectedPositions(prev => {
                                        const next = new Set(prev);
                                        group.positions.forEach(p => next.add(p));
                                        return next;
                                      });
                                    }
                                  }}
                                  className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                                    allSelected
                                      ? 'bg-[#0050A0] text-white'
                                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                  }`}
                                >
                                  {group.label}
                                </button>
                              );
                            })}
                          </div>

                          {/* Position checkboxes by group */}
                          {[
                            { label: 'Offense', positions: groupedPositions.offense },
                            { label: 'Defense', positions: groupedPositions.defense },
                            { label: 'Special Teams', positions: groupedPositions.special },
                          ].map(group => group.positions.length > 0 && (
                            <div key={group.label} className="mb-2.5">
                              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{group.label}</div>
                              <div className="flex flex-wrap gap-1.5">
                                {group.positions.map(pos => {
                                  const isSelected = selectedPositions.has(pos);
                                  return (
                                    <button
                                      key={pos}
                                      type="button"
                                      onClick={() => {
                                        setSelectedPositions(prev => {
                                          const next = new Set(prev);
                                          if (next.has(pos)) next.delete(pos);
                                          else next.add(pos);
                                          return next;
                                        });
                                      }}
                                      className={`px-2 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                                        isSelected
                                          ? 'bg-[#0050A0] text-white'
                                          : 'bg-gray-50 text-gray-700 border border-gray-200 hover:border-[#0050A0] hover:text-[#0050A0]'
                                      }`}
                                    >
                                      {pos} <span className="opacity-60">({positionCounts[pos] || 0})</span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                          {groupedPositions.other.length > 0 && (
                            <div className="mb-2.5">
                              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Other</div>
                              <div className="flex flex-wrap gap-1.5">
                                {groupedPositions.other.map(pos => {
                                  const isSelected = selectedPositions.has(pos);
                                  return (
                                    <button
                                      key={pos}
                                      type="button"
                                      onClick={() => {
                                        setSelectedPositions(prev => {
                                          const next = new Set(prev);
                                          if (next.has(pos)) next.delete(pos);
                                          else next.add(pos);
                                          return next;
                                        });
                                      }}
                                      className={`px-2 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                                        isSelected
                                          ? 'bg-[#0050A0] text-white'
                                          : 'bg-gray-50 text-gray-700 border border-gray-200 hover:border-[#0050A0] hover:text-[#0050A0]'
                                      }`}
                                    >
                                      {pos} <span className="opacity-60">({positionCounts[pos] || 0})</span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  {/* FA Type Filter */}
                  <div>
                    <label htmlFor="fa-type-filter" className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">FA Type</label>
                    <select
                      id="fa-type-filter"
                      value={selectedFaType}
                      onChange={e => setSelectedFaType(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0050A0] bg-white text-sm cursor-pointer"
                    >
                      <option value="all">All Types</option>
                      {availableFaTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  {/* Signed Status Filter */}
                  <div>
                    <label htmlFor="fa-status-filter" className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Status</label>
                    <select
                      id="fa-status-filter"
                      value={selectedSignedStatus}
                      onChange={e => setSelectedSignedStatus(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0050A0] bg-white text-sm cursor-pointer"
                    >
                      <option value="all">All Status</option>
                      <option value="unsigned">Unsigned</option>
                      <option value="signed">Signed</option>
                      <option value="tagged">Tagged</option>
                    </select>
                  </div>

                  {/* Player Search */}
                  <div>
                    <label htmlFor="fa-search" className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Search</label>
                    <div className="relative">
                      <input
                        id="fa-search"
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Search players..."
                        className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0050A0] bg-white text-sm"
                      />
                      <svg
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Market Summary Bar */}
              {allFreeAgents.length > 0 && (
                <div className="rounded-lg shadow-sm mb-6 overflow-hidden">
                  <div className="px-4 py-2" style={{ backgroundColor: '#0050A0' }}>
                    <h4 className="text-sm font-bold text-white tracking-wide">
                      {marketSummary.positions.size === 0 ? '2026 Free Agency Overview' : marketSummary.positions.size === 1 ? `${[...marketSummary.positions][0]} Market Overview` : `${marketSummary.positions.size}-Position Market Overview`}
                    </h4>
                  </div>
                  <div className="bg-white grid grid-cols-2 lg:grid-cols-4 divide-x divide-gray-100">
                    {/* Signed */}
                    <div className="px-4 py-3 text-center">
                      <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Signed / Tagged</p>
                      <p className="text-xl font-extrabold text-gray-900">
                        {marketSummary.signedCount}
                      </p>
                    </div>
                    {/* Remaining */}
                    <div className="px-4 py-3 text-center">
                      <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Still Available</p>
                      <p className="text-xl font-extrabold text-gray-900">
                        {marketSummary.total - marketSummary.signedCount}
                      </p>
                    </div>
                    {/* Money Committed */}
                    <div className="px-4 py-3 text-center">
                      <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Money Committed</p>
                      <p className="text-xl font-extrabold text-gray-900">
                        {marketSummary.totalCommitted >= 1_000_000_000
                          ? `$${(marketSummary.totalCommitted / 1_000_000_000).toFixed(2)}B`
                          : marketSummary.totalCommitted >= 1_000_000
                            ? `$${(marketSummary.totalCommitted / 1_000_000).toFixed(1)}M`
                            : marketSummary.totalCommitted > 0
                              ? `$${(marketSummary.totalCommitted / 1_000).toFixed(0)}K`
                              : '$0'}
                      </p>
                    </div>
                    {/* Top Unsigned */}
                    <div className="px-4 py-3 text-center">
                      <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Top Available Free Agent</p>
                      {marketSummary.topUnsigned ? (
                        <Link
                          href={`/players/${generatePlayerSlug(marketSummary.topUnsigned.name)}`}
                          className="text-base font-extrabold text-[#0050A0] hover:underline"
                        >
                          {marketSummary.topUnsigned.name}
                        </Link>
                      ) : (
                        <p className="text-base font-extrabold text-gray-500">—</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-col lg:flex-row gap-6">
              {/* Main Content */}
              <div className="flex-1 min-w-0" ref={mainTableRef}>
              {/* Table */}
              {paginatedFreeAgents.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                  <p className="text-gray-600">No free agents found matching your filters.</p>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-sm">
                  <div className="table-scroll-container table-scroll-lg overflow-x-auto rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200 table-sticky-col">
                      <thead style={{ backgroundColor: '#0050A0' }}>
                        <tr>
                          <th
                            className="py-2 px-2 sm:px-3 text-center text-xs font-semibold text-white cursor-pointer hover:bg-[#003A75] select-none"
                            onClick={() => handleSort('rank')}
                          >
                            Rank
                            <SortIndicator column="rank" />
                          </th>
                          <th
                            className="py-2 px-2 sm:px-3 text-left text-xs font-semibold text-white cursor-pointer hover:bg-[#003A75] select-none"
                            onClick={() => handleSort('name')}
                          >
                            Name
                            <SortIndicator column="name" />
                          </th>
                          <th scope="col" className="py-2 px-2 sm:px-3 text-center text-xs font-semibold text-white">
                            Position
                          </th>
                          <th scope="col" className="py-2 px-2 sm:px-3 text-center text-xs font-semibold text-white">
                            2025 Team
                          </th>
                          <th scope="col" className="py-2 px-2 sm:px-3 text-center text-xs font-semibold text-white">
                            FA Type
                          </th>
                          <th
                            className="py-2 px-2 sm:px-3 text-center text-xs font-semibold text-white cursor-pointer hover:bg-[#003A75] select-none"
                            onClick={() => handleSort('age')}
                          >
                            Age
                            <SortIndicator column="age" />
                          </th>
                          <th
                            className="py-2 px-2 sm:px-3 text-center text-xs font-semibold text-white cursor-pointer hover:bg-[#003A75] select-none"
                            onClick={() => handleSort('pfsn2025Impact')}
                          >
                            2025 Impact
                            <SortIndicator column="pfsn2025Impact" />
                          </th>
                          <th scope="col" className="py-2 px-2 sm:px-3 text-center text-xs font-semibold text-white">
                            2026 Team
                          </th>
                          <th
                            scope="col"
                            className="py-2 px-2 sm:px-3 text-center text-xs font-semibold text-white cursor-pointer hover:bg-[#003A75] select-none"
                            onClick={() => handleSort('newAAV')}
                          >
                            New AAV <SortIndicator column="newAAV" />
                          </th>
                          <th
                            className="py-2 px-2 sm:px-3 text-center text-xs font-semibold text-white cursor-pointer hover:bg-[#003A75] select-none"
                            onClick={() => handleSort('positionRank')}
                          >
                            Pos Rank
                            <SortIndicator column="positionRank" />
                          </th>
                          <th scope="col" className="py-2 px-2 sm:px-3 text-center text-xs font-semibold text-white">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {paginatedFreeAgents.map((agent, index) => {
                          const teamInfo = getTeamInfo(mapTeamNameToId(agent.current2025Team));
                          const signed2026TeamInfo = getTeamInfo(mapTeamNameToId(agent.signed2026Team));
                          const isTagged = agent.faType === 'Franchise' || agent.faType === 'Transition';
                          const isUnsigned = !agent.signed2026Team || agent.signed2026Team.trim() === '';
                          const isReSigned = !isTagged && !isUnsigned && !!agent.current2025Team &&
                            mapTeamNameToId(agent.signed2026Team) === mapTeamNameToId(agent.current2025Team);
                          const rowKey = `${agent.rank}-${agent.name}`;
                          const isExpandable = hasContractComps(agent.position);
                          const isExpanded = expandedRows.has(rowKey);

                          return (
                            <React.Fragment key={rowKey}>
                              <tr
                                className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} ${isExpandable ? 'cursor-pointer hover:bg-blue-50/50' : ''} ${isExpanded ? '!bg-blue-50' : ''}`}
                                onClick={() => toggleRow(rowKey, isExpandable)}
                              >
                                <td
                                  className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 text-center"
                                  style={{ backgroundColor: isExpanded ? '#eff6ff' : index % 2 === 0 ? 'white' : '#f9fafb' }}
                                >
                                  <span className="flex items-center justify-center gap-1">
                                    {isExpandable && (
                                      <svg
                                        className={`w-3 h-3 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                      </svg>
                                    )}
                                    {agent.rank}
                                  </span>
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm font-medium">
                                  <Link
                                    href={`/players/${generatePlayerSlug(agent.name)}`}
                                    className="flex items-center gap-2 text-[#0050A0] hover:underline"
                                    onClick={e => e.stopPropagation()}
                                  >
                                    <PlayerImage slug={generatePlayerSlug(agent.name)} name={agent.name} size="sm" />
                                    {agent.name}
                                  </Link>
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-center">
                                  <button
                                    className="text-xs font-semibold text-[#0050A0] hover:underline cursor-pointer"
                                    onClick={(e) => handlePositionClick(e, agent.position)}
                                  >
                                    {agent.position}
                                  </button>
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm">
                                  {teamInfo ? (
                                    <Link href={`/teams/${teamInfo.id}/depth-chart`} className="flex items-center justify-center hover:opacity-80 transition-opacity" onClick={e => e.stopPropagation()} title={teamInfo.fullName}>
                                      <img src={teamInfo.logoUrl} alt={teamInfo.abbreviation} className="w-6 h-6 sm:w-8 sm:h-8" />
                                    </Link>
                                  ) : agent.current2025Team ? (
                                    <span className="text-gray-500 text-xs block text-center">{agent.current2025Team}</span>
                                  ) : (
                                    <span className="text-gray-400 block text-center">—</span>
                                  )}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700 text-center">
                                  {agent.faType}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700 text-center">
                                  {agent.age}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm font-semibold text-center">
                                  {agent.pfsn2025Impact > 0 ? (
                                    <a
                                      href={getPositionImpactUrl(agent.position)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="hover:underline text-[#0050A0]"
                                      onClick={e => e.stopPropagation()}
                                    >
                                      {agent.pfsn2025Impact.toFixed(1)}
                                    </a>
                                  ) : (
                                    <span className="text-gray-400">—</span>
                                  )}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm">
                                  {signed2026TeamInfo ? (
                                    <Link href={`/teams/${signed2026TeamInfo.id}`} className="flex items-center justify-center hover:opacity-80 transition-opacity" onClick={e => e.stopPropagation()} title={signed2026TeamInfo.fullName}>
                                      <img src={signed2026TeamInfo.logoUrl} alt={signed2026TeamInfo.abbreviation} className="w-6 h-6 sm:w-8 sm:h-8" />
                                    </Link>
                                  ) : isUnsigned ? (
                                    <span className="text-gray-400 block text-center">—</span>
                                  ) : (
                                    <span className="text-gray-500 text-xs block text-center">{agent.signed2026Team}</span>
                                  )}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700 text-center font-medium">
                                  {agent.newAAV ? formatCompactMoney(agent.newAAV) : <span className="text-gray-400">—</span>}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700 text-center">
                                  {agent.positionRank}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-center font-semibold">
                                  {isTagged ? (
                                    <span className="text-purple-600">Tagged</span>
                                  ) : isUnsigned ? (
                                    <span className="text-red-600">Unsigned</span>
                                  ) : isReSigned ? (
                                    <span className="text-blue-600">Re-Signed</span>
                                  ) : (
                                    <span className="text-green-600">Signed</span>
                                  )}
                                </td>
                              </tr>
                              {isExpanded && (
                                <tr className="bg-white">
                                  <td colSpan={11} className="p-0 border-b-2 border-[#0050A0]/20">
                                    <div className="px-4 sm:px-6 py-4">
                                      <ContractComps
                                        agent={agent}
                                        contractSheets={contractSheets}
                                        loading={contractsLoading}
                                      />
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Controls */}
                  {sortedFreeAgents.length > 0 && (
                    <div className="bg-gray-50 px-4 border-t border-gray-200">
                      <Pagination
                        totalItems={sortedFreeAgents.length}
                        currentPage={currentPage}
                        onPageChange={handlePageChange}
                        itemsPerPage={itemsPerPage}
                        onItemsPerPageChange={handleItemsPerPageChange}
                        storageKey="free_agency_items_per_page"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Market Sidebar */}
            <div className="w-full lg:w-72 flex-shrink-0" style={mainTableHeight ? { height: mainTableHeight } : undefined}>
              <MarketSidebar
                selectedPositions={selectedPositions}
                freeAgents={allFreeAgents}
                contractSheets={contractSheets}
                loading={contractsLoading}
              />
            </div>
            </div>
            </>
          )}
        </div>

        {/* Position Needs Popover */}
        {needsPopover && (() => {
          const topNeeds = getTopTeamNeeds(needsPopover.position);
          const needCategory = getNeedCategoryFromAbbr(needsPopover.position);
          const displayNames: Record<string, string> = {
            'Offensive Center': 'Center',
            'Offensive Guard': 'Guard',
            'Offensive Tackle': 'Tackle',
            'Defensive Tackle': 'DT',
            'Running Back': 'RB',
            'Wide Receiver': 'WR',
            'Tight End': 'TE',
          };
          const displayName = displayNames[needCategory] || needCategory;
          return (
            <div
              className="fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200 p-3 w-64"
              style={{ top: needsPopover.top, left: needsPopover.left, transform: 'translateX(-50%)' }}
              onClick={e => e.stopPropagation()}
            >
              <h4 className="text-xs font-bold text-gray-800 mb-2 uppercase tracking-wide">
                Top {displayName} Needs
              </h4>
              {topNeeds.length === 0 ? (
                <p className="text-xs text-gray-500">No team needs data available.</p>
              ) : (
                <div className="space-y-1.5">
                  {topNeeds.map((team, i) => (
                    <Link
                      key={team.teamId}
                      href="/team-needs"
                      className="flex items-center gap-2 hover:bg-gray-50 rounded px-1.5 py-1 -mx-1.5 transition-colors"
                      onClick={() => setNeedsPopover(null)}
                    >
                      <span className="text-xs font-bold text-gray-400 w-4">{i + 1}</span>
                      <img src={team.logoUrl} alt={team.teamName} className="w-5 h-5" />
                      <span className="text-sm font-medium text-gray-900 flex-1">{team.teamName}</span>
                      <span className={`text-xs font-bold ${team.needLevel >= 7 ? 'text-red-600' : team.needLevel >= 4 ? 'text-amber-600' : 'text-green-600'}`}>
                        {team.needLevel.toFixed(1)}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })()}
      </main>
  );
}
