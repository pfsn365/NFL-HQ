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

export { POSITION_TO_SHEETS };

export interface RankedContract {
  player: string;
  team: string;
  position: string;
  yearSigned: string;
  years: string;
  apy: number;
  guaranteed: number;
  age: string;
  pfsnImpact: number;
  is2026Signing: boolean;
}

/**
 * Build a ranked list of contracts for a position group, with 2026 signings slotted in.
 * Returns all contracts sorted by AAV descending.
 */
export function buildContractRankings(
  position: string,
  sheets: ContractSheet[],
  signings: { player: string; team: string; position: string; age: number; apy: string; impact: number }[]
): RankedContract[] {
  const sheetNames = POSITION_TO_SHEETS[position];
  if (!sheetNames) return [];

  const contracts: RankedContract[] = [];

  // Add historical contracts from sheets
  for (const name of sheetNames) {
    const sheet = sheets.find(s => s.sheetName === name);
    if (!sheet) continue;
    for (const c of sheet.contracts) {
      const yearSigned = (c['Year Signed'] || '').trim();
      if (!yearSigned || parseInt(yearSigned) < 2020) continue;
      const apy = parseMoney(c['APY'] || '');
      if (apy === 0) continue;

      contracts.push({
        player: c['Player'] || '',
        team: c['Team'] || '',
        position,
        yearSigned,
        years: c['Years'] || '',
        apy,
        guaranteed: parseMoney(c['Guaranteed'] || ''),
        age: c['Age'] || '',
        pfsnImpact: getContractImpact(c),
        is2026Signing: false,
      });
    }
  }

  // Add 2026 signings
  for (const s of signings) {
    const apy = parseMoney(s.apy);
    if (apy === 0) continue;
    contracts.push({
      player: s.player,
      team: s.team,
      position: s.position,
      yearSigned: '2026',
      years: '—',
      apy,
      guaranteed: 0,
      age: String(s.age),
      pfsnImpact: s.impact,
      is2026Signing: true,
    });
  }

  // Sort by AAV descending by default
  contracts.sort((a, b) => b.apy - a.apy);

  return contracts;
}

/** Parse dollar strings like "$25,000,000" → number */
export function parseMoney(val: string): number {
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
  if (parseInt(yearSigned) < 2015) return null;

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

/** Keep only the first (best) entry per player name */
function dedupeByPlayer(): (comp: ContractComp) => boolean {
  const seen = new Set<string>();
  return (comp: ContractComp) => {
    const key = comp.player.trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
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

  // Pool contracts from all relevant position sheets, excluding the agent themselves
  const agentNameLower = agent.name.trim().toLowerCase();
  const allContracts: Record<string, string>[] = [];
  for (const name of sheetNames) {
    const sheet = sheets.find(s => s.sheetName === name);
    if (sheet) {
      for (const c of sheet.contracts) {
        if ((c['Player'] || '').trim().toLowerCase() !== agentNameLower) {
          allContracts.push(c);
        }
      }
    }
  }

  // Use 3-year average when available, fall back to single-year 2025 impact
  const agentImpact = agent.averageImpact > 0 ? agent.averageImpact : agent.pfsn2025Impact;
  const useImpactMatching = agentImpact >= 70;

  if (useImpactMatching) {
    // --- Unsigned, solid impact: 3yr avg impact (70%) + age (30%) ---
    return allContracts
      .map(c => {
        const contractAge = parseFloat(c['Age']);
        if (isNaN(contractAge)) return null;

        const ageDiff = Math.abs(agent.age - contractAge);
        if (ageDiff > 3) return null; // Max 3 year age difference
        const ageSimilarity = Math.max(0, 1 - ageDiff / 3);

        const contractImpact = getContractImpact(c);
        let matchPct: number;

        if (contractImpact <= 0) return null; // Skip contracts without impact data
        const impactDiff = Math.abs(agentImpact - contractImpact);
        if (impactDiff > 5) return null; // Skip contracts with 5+ point impact gap
        const impactSimilarity = Math.max(0, 1 - impactDiff / 5);
        matchPct = (0.7 * impactSimilarity + 0.3 * ageSimilarity) * 100;

        matchPct = Math.round(matchPct * 10) / 10;
        return toComp(c, matchPct);
      })
      .filter((c): c is ContractComp => c !== null)
      .sort((a, b) => b.matchPct - a.matchPct)
      .filter(dedupeByPlayer())
      .slice(0, topN);
  }

  // --- Unsigned, low/no impact: top contracts by value within ±3 years of age ---
  return allContracts
    .map(c => {
      const contractAge = parseFloat(c['Age']);
      if (isNaN(contractAge)) return null;
      if (Math.abs(agent.age - contractAge) > 3) return null;
      return toComp(c, 0);
    })
    .filter((c): c is ContractComp => c !== null)
    .sort((a, b) => parseMoney(b.apy) - parseMoney(a.apy))
    .filter(dedupeByPlayer())
    .slice(0, topN);
}
