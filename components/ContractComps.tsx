'use client';

import { useMemo } from 'react';
import type { FreeAgent } from '@/utils/freeAgentHelpers';
import {
  type ContractSheet,
  findContractComps,
  formatCompactMoney,
  hasContractComps,
} from '@/utils/contractCompHelpers';

interface ContractCompsProps {
  agent: FreeAgent;
  contractSheets: ContractSheet[];
  loading: boolean;
}

export default function ContractComps({ agent, contractSheets, loading }: ContractCompsProps) {
  const comps = useMemo(() => {
    if (loading || contractSheets.length === 0) return [];
    return findContractComps(agent, contractSheets);
  }, [agent, contractSheets, loading]);

  if (!hasContractComps(agent.position)) {
    return (
      <div className="text-sm text-gray-500 italic">
        Contract comps are not available for {agent.position} players.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center gap-3 py-2">
        <div className="w-4 h-4 border-2 border-[#0050A0] border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-gray-600">Loading contract comps...</span>
      </div>
    );
  }

  if (comps.length === 0) {
    return (
      <div className="text-sm text-gray-500 italic">
        No comparable contracts found for this player.
      </div>
    );
  }

  return (
    <div>
      <h4 className="text-sm font-bold text-gray-800 mb-3">
        Historical Contract Comps
      </h4>

      {/* Comps table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-3 py-2 text-left font-semibold text-gray-600">Player</th>
              <th className="px-3 py-2 text-left font-semibold text-gray-600">Team</th>
              <th className="px-3 py-2 text-center font-semibold text-gray-600">Year</th>
              <th className="px-3 py-2 text-center font-semibold text-gray-600">Yrs</th>
              <th className="px-3 py-2 text-right font-semibold text-gray-600">APY</th>
              <th className="px-3 py-2 text-right font-semibold text-gray-600">Guaranteed</th>
              <th className="px-3 py-2 text-center font-semibold text-gray-600">Age</th>
              <th className="px-3 py-2 text-center font-semibold text-gray-600 cursor-help" title="Avg. PFSN Impact grade over the 3 seasons before signing">
                Impact
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {comps.map((comp, i) => (
              <tr key={`${comp.player}-${comp.yearSigned}-${i}`} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-3 py-2 whitespace-nowrap font-medium text-gray-900">{comp.player}</td>
                <td className="px-3 py-2 whitespace-nowrap text-gray-700">{comp.team}</td>
                <td className="px-3 py-2 whitespace-nowrap text-gray-700 text-center">{comp.yearSigned}</td>
                <td className="px-3 py-2 whitespace-nowrap text-gray-700 text-center">{comp.years}</td>
                <td className="px-3 py-2 whitespace-nowrap text-gray-900 font-medium text-right">{formatCompactMoney(comp.apy)}</td>
                <td className="px-3 py-2 whitespace-nowrap text-gray-900 font-medium text-right">{formatCompactMoney(comp.guaranteed)}</td>
                <td className="px-3 py-2 whitespace-nowrap text-gray-700 text-center">{parseFloat(comp.age).toFixed(1)}</td>
                <td className="px-3 py-2 whitespace-nowrap text-gray-700 text-center">{comp.pfsnImpact > 0 ? comp.pfsnImpact.toFixed(1) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
