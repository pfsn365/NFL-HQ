'use client';

import { useState, useMemo } from 'react';
import type { FreeAgent } from '@/utils/freeAgentHelpers';
import { mapTeamNameToId } from '@/utils/freeAgentHelpers';
import { getAllTeams } from '@/data/teams';
import {
  type ContractSheet,
  type RankedContract,
  buildContractRankings,
  POSITION_TO_SHEETS,
} from '@/utils/contractCompHelpers';

interface ContractRankingsProps {
  freeAgents: FreeAgent[];
  contractSheets: ContractSheet[];
  loading: boolean;
}

type SortField = 'apy' | 'guaranteed' | 'age' | 'yearSigned' | 'player' | 'years' | 'pfsnImpact';

const POSITION_GROUPS: { label: string; positions: string[] }[] = [
  { label: 'QB', positions: ['QB'] },
  { label: 'RB', positions: ['RB', 'FB'] },
  { label: 'WR', positions: ['WR'] },
  { label: 'TE', positions: ['TE'] },
  { label: 'OT', positions: ['OT'] },
  { label: 'OG/C', positions: ['OG', 'OC'] },
  { label: 'EDGE', positions: ['EDGE', 'DE'] },
  { label: 'DT', positions: ['DT'] },
  { label: 'LB', positions: ['LB', 'ILB', 'OLB'] },
  { label: 'CB', positions: ['CB'] },
  { label: 'S', positions: ['S', 'FS', 'SS'] },
];

function formatMoney(val: number): string {
  if (val === 0) return '—';
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}K`;
  return `$${val}`;
}

export default function ContractRankings({ freeAgents, contractSheets, loading }: ContractRankingsProps) {
  const allTeams = getAllTeams();
  const [selectedGroup, setSelectedGroup] = useState(0);
  const [sortField, setSortField] = useState<SortField>('apy');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const getTeamInfo = (teamName: string) => {
    if (!teamName) return null;
    const teamId = mapTeamNameToId(teamName);
    if (!teamId) return null;
    return allTeams.find(t => t.id === teamId) || null;
  };

  // Build 2026 signings from free agents who have signed or been tagged + have AAV
  const signings2026 = useMemo(() => {
    return freeAgents
      .filter(a => {
        if (!a.newAAV) return false;
        const isTagged = a.faType === 'Franchise' || a.faType === 'Transition';
        const isSigned = a.signed2026Team && a.signed2026Team.trim() !== '';
        return isSigned || isTagged;
      })
      .map(a => {
        const isTagged = a.faType === 'Franchise' || a.faType === 'Transition';
        const team = (a.signed2026Team && a.signed2026Team.trim() !== '')
          ? a.signed2026Team
          : isTagged ? a.current2025Team : '';
        return {
          player: a.name,
          team,
          position: a.position,
          age: a.age,
          apy: a.newAAV,
          impact: a.pfsn2025Impact,
        };
      });
  }, [freeAgents]);

  // Get available groups (only show groups that have sheet data)
  const availableGroups = useMemo(() => {
    return POSITION_GROUPS.filter(g =>
      g.positions.some(p => p in POSITION_TO_SHEETS)
    );
  }, []);

  // Build ranked contracts for selected position group
  const rankedContracts = useMemo(() => {
    if (contractSheets.length === 0) return [];
    const group = availableGroups[selectedGroup];
    if (!group) return [];

    // Build for primary position in group and merge
    const allContracts: RankedContract[] = [];
    const seen = new Set<string>();

    for (const pos of group.positions) {
      const posSignings = signings2026.filter(s => group.positions.includes(s.position));
      const contracts = buildContractRankings(pos, contractSheets, posSignings);
      for (const c of contracts) {
        const key = `${c.player}-${c.yearSigned}-${c.team}`;
        if (!seen.has(key)) {
          seen.add(key);
          allContracts.push(c);
        }
      }
    }

    return allContracts;
  }, [contractSheets, selectedGroup, availableGroups, signings2026]);

  // Sort contracts
  const sortedContracts = useMemo(() => {
    const sorted = [...rankedContracts].sort((a, b) => {
      let aVal: number | string;
      let bVal: number | string;

      switch (sortField) {
        case 'apy':
          aVal = a.apy; bVal = b.apy; break;
        case 'guaranteed':
          aVal = a.guaranteed; bVal = b.guaranteed; break;
        case 'age':
          aVal = parseFloat(a.age) || 0; bVal = parseFloat(b.age) || 0; break;
        case 'yearSigned':
          aVal = parseInt(a.yearSigned) || 0; bVal = parseInt(b.yearSigned) || 0; break;
        case 'years':
          aVal = parseInt(a.years) || 0; bVal = parseInt(b.years) || 0; break;
        case 'pfsnImpact':
          aVal = a.pfsnImpact; bVal = b.pfsnImpact; break;
        case 'player':
          return sortDir === 'asc'
            ? a.player.localeCompare(b.player)
            : b.player.localeCompare(a.player);
        default:
          aVal = a.apy; bVal = b.apy;
      }

      return sortDir === 'desc'
        ? (bVal as number) - (aVal as number)
        : (aVal as number) - (bVal as number);
    });
    return sorted;
  }, [rankedContracts, sortField, sortDir]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const SortIndicator = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return <span className="ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>;
  };

  // Count 2026 signings in current view
  const signingCount = sortedContracts.filter(c => c.is2026Signing).length;

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 flex items-center justify-center gap-3">
        <div className="w-5 h-5 border-2 border-[#0050A0] border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-gray-600">Loading contract data...</span>
      </div>
    );
  }

  if (contractSheets.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <p className="text-gray-600">Contract data is not available right now. Please try again later.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Position Group Selector */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Position Group</label>
        <div className="flex flex-wrap gap-2">
          {availableGroups.map((group, i) => (
            <button
              key={group.label}
              onClick={() => { setSelectedGroup(i); setSortField('apy'); setSortDir('desc'); }}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
                selectedGroup === i
                  ? 'bg-[#0050A0] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {group.label}
            </button>
          ))}
        </div>
        {signingCount > 0 && (
          <p className="mt-3 text-xs text-gray-500">
            <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1" />
            {signingCount} new 2026 signing{signingCount !== 1 ? 's' : ''} highlighted below
          </p>
        )}
      </div>

      {/* Rankings Table */}
      {sortedContracts.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <p className="text-gray-600">No contract data available for this position group.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm">
          <div className="overflow-x-auto rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead style={{ backgroundColor: '#0050A0' }}>
                <tr>
                  <th className="py-2 px-2 sm:px-3 text-center text-xs font-semibold text-white w-12">
                    #
                  </th>
                  <th
                    className="py-2 px-2 sm:px-3 text-left text-xs font-semibold text-white cursor-pointer hover:bg-[#003A75] select-none"
                    onClick={() => handleSort('player')}
                  >
                    Player<SortIndicator field="player" />
                  </th>
                  <th className="py-2 px-2 sm:px-3 text-center text-xs font-semibold text-white">
                    Team
                  </th>
                  <th
                    className="py-2 px-2 sm:px-3 text-center text-xs font-semibold text-white cursor-pointer hover:bg-[#003A75] select-none"
                    onClick={() => handleSort('yearSigned')}
                  >
                    Year<SortIndicator field="yearSigned" />
                  </th>
                  <th
                    className="py-2 px-2 sm:px-3 text-center text-xs font-semibold text-white cursor-pointer hover:bg-[#003A75] select-none"
                    onClick={() => handleSort('age')}
                  >
                    Age<SortIndicator field="age" />
                  </th>
                  <th
                    className="py-2 px-2 sm:px-3 text-center text-xs font-semibold text-white cursor-pointer hover:bg-[#003A75] select-none"
                    onClick={() => handleSort('years')}
                  >
                    Yrs<SortIndicator field="years" />
                  </th>
                  <th
                    className="py-2 px-2 sm:px-3 text-right text-xs font-semibold text-white cursor-pointer hover:bg-[#003A75] select-none"
                    onClick={() => handleSort('apy')}
                  >
                    AAV<SortIndicator field="apy" />
                  </th>
                  <th
                    className="py-2 px-2 sm:px-3 text-right text-xs font-semibold text-white cursor-pointer hover:bg-[#003A75] select-none"
                    onClick={() => handleSort('guaranteed')}
                  >
                    Guaranteed<SortIndicator field="guaranteed" />
                  </th>
                  <th
                    className="py-2 px-2 sm:px-3 text-center text-xs font-semibold text-white cursor-pointer hover:bg-[#003A75] select-none"
                    onClick={() => handleSort('pfsnImpact')}
                  >
                    Impact<SortIndicator field="pfsnImpact" />
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedContracts.map((contract, index) => {
                  const rank = sortField === 'apy' && sortDir === 'desc' ? index + 1 : null;
                  return (
                    <tr
                      key={`${contract.player}-${contract.yearSigned}-${contract.team}-${index}`}
                      className={
                        contract.is2026Signing
                          ? 'bg-green-50 border-l-4 border-l-green-500'
                          : index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      }
                    >
                      <td className="px-2 sm:px-3 py-2 whitespace-nowrap text-sm text-gray-500 text-center">
                        {rank ?? ''}
                      </td>
                      <td className="px-2 sm:px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                        <span className="flex items-center gap-1">
                          {contract.player}
                          {contract.is2026Signing && (
                            <span className="text-[10px] font-bold text-green-700 uppercase">New</span>
                          )}
                        </span>
                      </td>
                      <td className="px-2 sm:px-3 py-2 whitespace-nowrap text-sm text-gray-700 text-center">
                        {(() => {
                          const teamInfo = getTeamInfo(contract.team);
                          return (
                            <span className="flex items-center justify-center gap-2">
                              {teamInfo && (
                                <img src={teamInfo.logoUrl} alt={teamInfo.abbreviation} className="w-6 h-6 flex-shrink-0" />
                              )}
                              {teamInfo ? teamInfo.name : contract.team}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-2 sm:px-3 py-2 whitespace-nowrap text-sm text-gray-700 text-center">
                        {contract.yearSigned}
                      </td>
                      <td className="px-2 sm:px-3 py-2 whitespace-nowrap text-sm text-gray-700 text-center">
                        {parseFloat(contract.age) ? parseFloat(contract.age).toFixed(0) : contract.age}
                      </td>
                      <td className="px-2 sm:px-3 py-2 whitespace-nowrap text-sm text-gray-700 text-center">
                        {contract.years}
                      </td>
                      <td className="px-2 sm:px-3 py-2 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">
                        {formatMoney(contract.apy)}
                      </td>
                      <td className="px-2 sm:px-3 py-2 whitespace-nowrap text-sm text-gray-700 text-right">
                        {contract.guaranteed > 0 ? formatMoney(contract.guaranteed) : '—'}
                      </td>
                      <td className="px-2 sm:px-3 py-2 whitespace-nowrap text-sm text-gray-700 text-center">
                        {contract.pfsnImpact > 0 ? contract.pfsnImpact.toFixed(1) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
