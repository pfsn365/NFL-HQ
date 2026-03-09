'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import type { FreeAgent } from '@/utils/freeAgentHelpers';
import type { ContractSheet } from '@/utils/contractCompHelpers';
import { type TeamCapData, type BestFitResult, findBestFits, estimateAAV } from '@/utils/bestFitHelpers';
import { getAllTeams } from '@/data/teams';
import type { TeamNeeds } from '@/data/team-needs';

interface BestFitTeamsProps {
  agent: FreeAgent;
  contractSheets: ContractSheet[];
  teamCapData: TeamCapData[];
  loading: boolean;
  teamNeeds?: TeamNeeds;
}

function formatMoney(val: number): string {
  if (val === 0) return '—';
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}K`;
  return `$${val}`;
}

function getFitColor(score: number): string {
  if (score >= 70) return 'text-green-700 bg-green-100';
  if (score >= 45) return 'text-amber-700 bg-amber-100';
  return 'text-red-700 bg-red-100';
}

function getNeedColor(level: number): string {
  if (level >= 7) return 'text-red-600';
  if (level >= 4) return 'text-amber-600';
  return 'text-green-600';
}

export default function BestFitTeams({ agent, contractSheets, teamCapData, loading, teamNeeds }: BestFitTeamsProps) {
  const allTeams = getAllTeams();

  const projectedAAV = useMemo(() => {
    if (contractSheets.length === 0) return 0;
    return estimateAAV(agent, contractSheets);
  }, [agent, contractSheets]);

  const fits = useMemo(() => {
    if (contractSheets.length === 0 || teamCapData.length === 0) return [];
    return findBestFits(agent, contractSheets, teamCapData, 5, undefined, teamNeeds);
  }, [agent, contractSheets, teamCapData, teamNeeds]);

  if (loading || contractSheets.length === 0) {
    return (
      <div className="flex items-center gap-2 py-2">
        <div className="w-4 h-4 border-2 border-[#0050A0] border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-gray-600">Analyzing fits...</span>
      </div>
    );
  }

  if (projectedAAV === 0) {
    return (
      <p className="text-sm text-gray-500 italic py-2">
        Not enough comp data to project fits.
      </p>
    );
  }

  if (fits.length === 0) {
    return (
      <p className="text-sm text-gray-500 italic py-2">
        No strong team fits found.
      </p>
    );
  }

  return (
    <div>
      <h4 className="text-sm font-bold text-gray-800 mb-1">
        Best Team Fits
      </h4>
      <p className="text-xs text-gray-500 mb-3">
        Projected AAV: <span className="font-bold text-gray-800">{formatMoney(projectedAAV)}</span>
        <span className="mx-1.5">|</span>
        Based on need level, cap space, and historical cap allocation
      </p>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-3 py-2 text-left font-semibold text-gray-600">Team</th>
              <th className="px-3 py-2 text-center font-semibold text-gray-600">Fit Score</th>
              <th className="px-3 py-2 text-center font-semibold text-gray-600">Need</th>
              <th className="px-3 py-2 text-right font-semibold text-gray-600">Cap Space</th>
              <th className="px-3 py-2 text-center font-semibold text-gray-600">Cap %</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {fits.map((fit, i) => {
              const team = allTeams.find(t => t.id === fit.teamId);
              if (!team) return null;
              return (
                <tr key={fit.teamId} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <Link
                      href={`/teams/${team.id}`}
                      className="flex items-center gap-2 hover:underline text-gray-900 font-medium"
                      onClick={e => e.stopPropagation()}
                    >
                      <img src={team.logoUrl} alt={team.abbreviation} className="w-5 h-5" />
                      {team.name}
                    </Link>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-center">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${getFitColor(fit.fitScore)}`}>
                      {fit.fitScore}
                    </span>
                  </td>
                  <td className={`px-3 py-2 whitespace-nowrap text-center font-semibold ${getNeedColor(fit.needLevel)}`}>
                    {fit.needLevel.toFixed(1)}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-right text-gray-700">
                    {formatMoney(fit.capSpace)}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-center text-gray-700">
                    {fit.capPctRequired}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
