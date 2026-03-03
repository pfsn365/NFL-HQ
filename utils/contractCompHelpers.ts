import type { FreeAgent } from './freeAgentHelpers';

export interface ContractSheet {
  sheetName: string;
  contracts: Record<string, string>[];
}

export interface ContractComp {
  matchPct: number;
  player: string;
  team: string;
  yearSigned: string;
  years: string;
  apy: string;
  guaranteed: string;
  age: string;
  pfsnImpact: number;
}

// Map free-agent positions to contract sheet names
const POSITION_TO_SHEETS: Record<string, string[]> = {
  QB: ['qb'],
  RB: ['rb'],
  FB: ['rb'],
  WR: ['wr'],
  TE: ['te'],
  OT: ['lt', 'rt'],
  OG: ['lg', 'rg'],
  OC: ['lg', 'rg'], // Centers grouped with guards
  OL: ['lt', 'rt', 'lg', 'rg'],
  DT: ['dt'],
  EDGE: ['edge'],
  DE: ['edge'],
  LB: ['lb'],
  ILB: ['lb'],
  OLB: ['lb'],
  CB: ['cb'],
  S: ['s'],
  FS: ['s'],
  SS: ['s'],
  DB: ['s', 'cb'],
};

// Positions with no contract estimation sheets
const NO_COMP_POSITIONS = new Set(['K', 'P', 'LS']);

export function hasContractComps(position: string): boolean {
  return !NO_COMP_POSITIONS.has(position) && position in POSITION_TO_SHEETS;
}

/** Parse dollar strings like "$25,000,000" → number */
function parseMoney(val: string): number {
  if (!val) return 0;
  const cleaned = val.replace(/[$,]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

/** Get the best available PFSN impact from a contract row */
function getContractImpact(contract: Record<string, string>): number {
  // Use "3 Yr Average" if available, else fall back to individual year columns
  const avg = parseFloat(contract['3 Yr Average']);
  if (!isNaN(avg) && avg > 0) return avg;

  const year1 = parseFloat(contract['PFSN Impact Year Before Sign']);
  if (!isNaN(year1) && year1 > 0) return year1;

  return 0;
}

/** Format a number as a dollar string like "$25.0M" */
export function formatCompactMoney(val: string): string {
  const num = parseMoney(val);
  if (num === 0) return '—';
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `$${(num / 1_000).toFixed(0)}K`;
  return `$${num}`;
}

/** Build a ContractComp object from a raw contract row */
function toComp(c: Record<string, string>, matchPct: number): ContractComp | null {
  const contractAge = parseFloat(c['Age']);
  const yearSigned = (c['Year Signed'] || '').trim();
  if (isNaN(contractAge) || !yearSigned) return null;

  return {
    matchPct,
    player: c['Player'] || '',
    team: c['Team'] || '',
    yearSigned,
    years: c['Years'] || '',
    apy: c['APY'] || '',
    guaranteed: c['Guaranteed'] || '',
    age: c['Age'] || '',
    pfsnImpact: getContractImpact(c),
  };
}

/**
 * Find the top N historical contract comps for a free agent.
 *
 * Tiered matching strategy:
 *  1. Agent has solid impact (>= 70) → use impact (70%) + age (30%) for contracts
 *     that have impact data. Contracts without impact data fall back to age-only
 *     matching (capped at 60% so impact-matched contracts are preferred).
 *  2. Agent has low/no impact (< 70) → find similar-age contracts at the position
 *     and show the top values (highest APY) so the user sees the market.
 */
export function findContractComps(
  agent: FreeAgent,
  sheets: ContractSheet[],
  topN = 5
): ContractComp[] {
  const sheetNames = POSITION_TO_SHEETS[agent.position];
  if (!sheetNames) return [];

  // Pool contracts from all relevant position sheets
  const allContracts: Record<string, string>[] = [];
  for (const name of sheetNames) {
    const sheet = sheets.find(s => s.sheetName === name);
    if (sheet) allContracts.push(...sheet.contracts);
  }

  const useImpactMatching = agent.pfsn2025Impact >= 75;

  if (useImpactMatching) {
    // --- Tier 1: Impact-based matching ---
    return allContracts
      .map(c => {
        const contractAge = parseFloat(c['Age']);
        if (isNaN(contractAge)) return null;

        const ageDiff = Math.abs(agent.age - contractAge);
        const ageSimilarity = Math.max(0, 1 - ageDiff / 15);

        const contractImpact = getContractImpact(c);
        let matchPct: number;

        if (contractImpact > 0) {
          // Has impact data → 70% impact + 30% age
          const impactDiff = Math.abs(agent.pfsn2025Impact - contractImpact);
          const impactSimilarity = Math.max(0, 1 - impactDiff / 40);
          matchPct = (0.7 * impactSimilarity + 0.3 * ageSimilarity) * 100;
        } else {
          // No impact data → age-only, capped at 60% so impact matches rank higher
          matchPct = ageSimilarity * 60;
        }

        matchPct = Math.round(matchPct * 10) / 10;
        return toComp(c, matchPct);
      })
      .filter((c): c is ContractComp => c !== null)
      .sort((a, b) => b.matchPct - a.matchPct)
      .slice(0, topN);
  }

  // --- Tier 2: Low/no impact → top contracts by value within ±3 years of age ---
  return allContracts
    .map(c => {
      const contractAge = parseFloat(c['Age']);
      if (isNaN(contractAge)) return null;
      if (Math.abs(agent.age - contractAge) > 3) return null;
      return toComp(c, 0);
    })
    .filter((c): c is ContractComp => c !== null)
    .sort((a, b) => parseMoney(b.apy) - parseMoney(a.apy))
    .slice(0, topN);
}
