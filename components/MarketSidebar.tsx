'use client';

import { useMemo } from 'react';
import type { FreeAgent } from '@/utils/freeAgentHelpers';
import { mapTeamNameToId } from '@/utils/freeAgentHelpers';
import { getAllTeams } from '@/data/teams';
import {
  type ContractSheet,
  type RankedContract,
  buildContractRankings,
  POSITION_TO_SHEETS,
} from '@/utils/contractCompHelpers';

interface MarketSidebarProps {
  selectedPositions: Set<string>;
  freeAgents: FreeAgent[];
  contractSheets: ContractSheet[];
  loading: boolean;
}

// Map FA abbreviations to position groups for the sidebar
const POSITION_GROUP: Record<string, string[]> = {
  QB: ['QB'],
  RB: ['RB', 'FB'],
  WR: ['WR'],
  TE: ['TE'],
  OT: ['OT'],
  OG: ['OG', 'OC'],
  OC: ['OG', 'OC'],
  OL: ['OT', 'OG', 'OC'],
  EDGE: ['EDGE', 'DE'],
  DE: ['EDGE', 'DE'],
  DT: ['DT'],
  LB: ['LB', 'ILB', 'OLB'],
  ILB: ['LB', 'ILB', 'OLB'],
  OLB: ['LB', 'ILB', 'OLB'],
  CB: ['CB'],
  S: ['S', 'FS', 'SS'],
  FS: ['S', 'FS', 'SS'],
  SS: ['S', 'FS', 'SS'],
};

function formatMoney(val: number): string {
  if (val === 0) return '—';
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}K`;
  return `$${val}`;
}

export default function MarketSidebar({ selectedPositions, freeAgents, contractSheets, loading }: MarketSidebarProps) {
  const allTeams = getAllTeams();

  const getTeamInfo = (teamName: string) => {
    if (!teamName) return null;
    const teamId = mapTeamNameToId(teamName);
    if (!teamId) return null;
    return allTeams.find(t => t.id === teamId) || null;
  };

  // Build 2026 signings
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

  // Build ranked contracts for selected position
  const rankedContracts = useMemo(() => {
    if (contractSheets.length === 0) return [];

    const allContracts: RankedContract[] = [];
    const seen = new Set<string>();

    // Determine which positions to show contracts for
    let targetPositions: string[];
    if (selectedPositions.size === 0) {
      targetPositions = Object.keys(POSITION_TO_SHEETS);
    } else {
      // Expand each selected position through POSITION_GROUP, then deduplicate
      const expanded = new Set<string>();
      for (const pos of selectedPositions) {
        const group = POSITION_GROUP[pos] || [pos];
        group.forEach(p => expanded.add(p));
      }
      targetPositions = [...expanded].filter(p => p in POSITION_TO_SHEETS);
    }

    for (const pos of targetPositions) {
      const posSignings = signings2026.filter(s => targetPositions.includes(s.position));
      const contracts = buildContractRankings(pos, contractSheets, posSignings);
      for (const c of contracts) {
        const key = `${c.player}-${c.yearSigned}-${c.team}`;
        if (!seen.has(key)) {
          seen.add(key);
          allContracts.push(c);
        }
      }
    }

    allContracts.sort((a, b) => b.apy - a.apy);
    return allContracts;
  }, [contractSheets, selectedPositions, signings2026]);

  const posLabel = selectedPositions.size === 0
    ? 'Current'
    : selectedPositions.size === 1
      ? [...selectedPositions][0]
      : `${selectedPositions.size}-Pos`;

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-4 h-full">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-4 h-4 border-2 border-[#0050A0] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-gray-500">Loading market data...</span>
        </div>
      </div>
    );
  }

  if (contractSheets.length === 0) return null;

  return (
    <div className="bg-white rounded-lg shadow-sm h-full flex flex-col">
      <div
        className="px-3 py-2.5 rounded-t-lg flex-shrink-0"
        style={{ backgroundColor: '#0050A0' }}
      >
        <h3 className="text-sm font-bold text-white tracking-wide">
          {posLabel} Market
        </h3>
      </div>

      {rankedContracts.length === 0 ? (
        <div className="p-4 text-center flex-1">
          <p className="text-xs text-gray-500">No market data available.</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100 flex-1 overflow-y-auto">
          {rankedContracts.map((contract, index) => {
            const teamInfo = getTeamInfo(contract.team);
            return (
              <div
                key={`${contract.player}-${contract.yearSigned}-${index}`}
                className={`flex items-center gap-2 px-3 py-2 ${
                  contract.is2026Signing ? 'bg-green-50 border-l-2 border-l-green-500' : ''
                }`}
              >
                <span className="text-[10px] font-bold text-gray-400 w-4 flex-shrink-0">{index + 1}</span>
                <span className="text-xs font-medium text-gray-900 flex-1 truncate">
                  {contract.player}
                  {contract.is2026Signing && (
                    <span className="ml-1 text-[9px] font-bold text-green-700 uppercase">New</span>
                  )}
                </span>
                {teamInfo && (
                  <img src={teamInfo.logoUrl} alt={teamInfo.name} className="w-4 h-4 flex-shrink-0" />
                )}
                <span className="text-[10px] text-gray-500 flex-shrink-0 w-5 text-center">
                  {parseFloat(contract.age) ? Math.round(parseFloat(contract.age)) : ''}
                </span>
                <span className="text-xs font-bold text-gray-900 flex-shrink-0 w-14 text-right">
                  {formatMoney(contract.apy)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
