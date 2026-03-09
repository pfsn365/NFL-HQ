import type { FreeAgent } from './freeAgentHelpers';
import { type ContractSheet, findContractComps, parseMoney, POSITION_TO_SHEETS } from './contractCompHelpers';
import { teamNeeds as staticTeamNeeds, type TeamNeeds } from '@/data/team-needs';
import { getNeedCategoryFromAbbr } from '@/utils/positionMapping';

/** Historical NFL salary caps by year (used to calculate cap %) */
const SALARY_CAP_BY_YEAR: Record<number, number> = {
  2020: 198_200_000,
  2021: 182_500_000,
  2022: 208_200_000,
  2023: 224_800_000,
  2024: 255_400_000,
  2025: 272_500_000,
  2026: 275_000_000,
};

export interface TeamCapData {
  teamId: string;
  capSpace: number;
  salaryCap: number;
}

export interface TeamDraftData {
  totalPicks: number;
  rounds: number[];
}

export interface BestFitResult {
  teamId: string;
  fitScore: number;       // 0-100 composite score
  needLevel: number;      // raw need level from team-needs
  capSpace: number;       // team's available cap
  estimatedAAV: number;   // projected AAV for this player
  capPctRequired: number; // what % of cap this player would cost
  canAfford: boolean;     // team has room for this % allocation
  draftDiscount: boolean; // team has early pick that could address this need
}

/**
 * Get a player's projected AAV.
 * Uses the official PFN projection (Proj. AAV) from the API when available,
 * otherwise falls back to the median AAV from their top 5 contract comps.
 */
export function estimateAAV(agent: FreeAgent, sheets: ContractSheet[]): number {
  // Prefer official PFN projection
  if (agent.projAAV) {
    const official = parseMoney(agent.projAAV);
    if (official > 0) return official;
  }

  // Fallback: median of contract comps
  const comps = findContractComps(agent, sheets, 5);
  if (comps.length === 0) return 0;

  const apys = comps.map(c => parseMoney(c.apy)).filter(v => v > 0);
  if (apys.length === 0) return 0;

  apys.sort((a, b) => a - b);
  const mid = Math.floor(apys.length / 2);
  return apys.length % 2 === 0
    ? (apys[mid - 1] + apys[mid]) / 2
    : apys[mid];
}

/**
 * Calculate the typical cap % that contracts at this position/tier command.
 * Looks at historical contracts in the sheets that match the player's impact tier
 * and computes the median (AAV / salary cap for that year).
 */
function getTypicalCapPct(agent: FreeAgent, sheets: ContractSheet[]): number {
  const sheetNames = POSITION_TO_SHEETS[agent.position];
  if (!sheetNames) return 0.05; // default 5%

  const agentImpact = agent.averageImpact > 0 ? agent.averageImpact : agent.pfsn2025Impact;
  const capPcts: number[] = [];

  for (const name of sheetNames) {
    const sheet = sheets.find(s => s.sheetName === name);
    if (!sheet) continue;

    for (const c of sheet.contracts) {
      const yearSigned = parseInt((c['Year Signed'] || '').trim());
      if (!yearSigned || yearSigned < 2020) continue;

      const cap = SALARY_CAP_BY_YEAR[yearSigned];
      if (!cap) continue;

      const apy = parseMoney(c['APY'] || '');
      if (apy === 0) continue;

      // Only use contracts from similar impact tier (within 10 points)
      if (agentImpact >= 70) {
        const avg = parseFloat(c['3 Yr Average']);
        const impact = !isNaN(avg) && avg > 0 ? avg : parseFloat(c['PFSN Impact Year Before Sign']);
        if (isNaN(impact) || impact <= 0) continue;
        if (Math.abs(agentImpact - impact) > 10) continue;
      }

      capPcts.push(apy / cap);
    }
  }

  if (capPcts.length === 0) return 0.05;

  capPcts.sort((a, b) => a - b);
  const mid = Math.floor(capPcts.length / 2);
  return capPcts.length % 2 === 0
    ? (capPcts[mid - 1] + capPcts[mid]) / 2
    : capPcts[mid];
}

/**
 * Find the best team fits for a free agent.
 *
 * Scoring (4 factors):
 *  1. Need level (0-10 scale) → 40% of score
 *  2. Cap affordability → 30% of score
 *     Based on whether the team can comfortably allocate the typical cap %
 *     this player's tier commands.
 *  3. Impact–context alignment → 15% of score
 *     Elite players (85+) favor cap-rich teams who can afford a premium.
 *     Mid-tier starters (70-84) are good value for moderate-cap teams.
 *     Lower-impact players fit best where the team just needs a body.
 *  4. Draft capital discount → 15% of score
 *     Teams with early-round picks (Rd 1-2) may address the position
 *     in the draft instead, reducing FA likelihood.
 */
export function findBestFits(
  agent: FreeAgent,
  sheets: ContractSheet[],
  teamsCap: TeamCapData[],
  topN = 5,
  draftData?: Record<string, TeamDraftData>,
  teamNeedsOverride?: TeamNeeds
): BestFitResult[] {
  const teamNeeds = teamNeedsOverride || staticTeamNeeds;
  const estAAV = estimateAAV(agent, sheets);
  if (estAAV === 0) return [];

  const typicalCapPct = getTypicalCapPct(agent, sheets);
  const needCategory = getNeedCategoryFromAbbr(agent.position);
  const agentImpact = agent.averageImpact > 0 ? agent.averageImpact : agent.pfsn2025Impact;

  const results: BestFitResult[] = [];

  for (const tc of teamsCap) {
    // Skip the player's current team — they chose to let them hit FA
    if (agent.teamId && tc.teamId === agent.teamId) continue;

    const needs = teamNeeds[tc.teamId];
    if (!needs) continue;

    const positionNeed = needs.find(n => n.position === needCategory);
    const needLevel = positionNeed ? positionNeed.needLevel : 0;
    if (needLevel < 2) continue;

    // --- Factor 1: Need score (40%) ---
    const needScore = Math.min(needLevel / 10, 1.0);

    // --- Factor 2: Cap affordability (30%) ---
    const teamCap = tc.salaryCap > 0 ? tc.salaryCap : SALARY_CAP_BY_YEAR[2026];
    const capPctRequired = estAAV / teamCap;
    const canAfford = tc.capSpace >= estAAV;
    const capSpacePct = tc.capSpace / teamCap;
    const comfortThreshold = typicalCapPct * 1.5;

    let affordScore: number;
    if (capSpacePct >= comfortThreshold) {
      affordScore = 1.0;
    } else if (capSpacePct >= capPctRequired) {
      affordScore = 0.3 + 0.7 * ((capSpacePct - capPctRequired) / (comfortThreshold - capPctRequired || 1));
    } else {
      affordScore = Math.max(0, 0.3 * (capSpacePct / capPctRequired));
    }

    // --- Factor 3: Impact–context alignment (15%) ---
    // Elite players (85+) → favor teams with lots of cap (can pay premium)
    // Mid-tier (70-84) → favor teams with moderate cap (good value deals)
    // Lower impact (<70) → any team with need, cap doesn't matter as much
    let impactFitScore: number;
    if (agentImpact >= 85) {
      // Elite: best fit when team has high cap space (can afford a splash signing)
      // Perfect when capSpacePct >= 20%, scales down
      impactFitScore = Math.min(capSpacePct / 0.20, 1.0);
    } else if (agentImpact >= 70) {
      // Mid-tier starter: sweet spot is moderate cap space (8-18% of cap available)
      // Teams with too much cap might chase elite players instead
      // Teams with too little can't afford even a mid-tier deal
      const sweetSpotCenter = 0.13;
      const sweetSpotRange = 0.08;
      const distFromSweet = Math.abs(capSpacePct - sweetSpotCenter);
      impactFitScore = Math.max(0, 1.0 - distFromSweet / sweetSpotRange);
    } else {
      // Lower impact: just needs a team with need; cap is less important
      // Slight preference for cap-constrained teams looking for bargains
      impactFitScore = capSpacePct < 0.15 ? 0.8 : 0.6;
    }

    // --- Factor 4: Draft capital discount (15%) ---
    // Teams with round 1-2 picks could address this position in the draft
    // Higher need levels still push toward FA (can't wait for a rookie)
    let draftScore = 1.0; // Default: no draft discount (full score)
    let hasDraftDiscount = false;

    if (draftData && draftData[tc.teamId]) {
      const teamDraft = draftData[tc.teamId];
      const hasRd1 = teamDraft.rounds.includes(1);
      const hasRd2 = teamDraft.rounds.includes(2);

      if (hasRd1 || hasRd2) {
        // Discount is stronger when need is moderate (4-6) — team could go either way
        // Discount is weaker when need is critical (8+) — team needs FA help NOW
        const urgencyFactor = Math.min(needLevel / 10, 1.0);
        const draftDiscount = hasRd1 ? 0.4 : 0.25; // Rd 1 = bigger discount
        // At high urgency, reduce the discount (team can't wait for a rookie)
        const adjustedDiscount = draftDiscount * (1 - urgencyFactor * 0.6);
        draftScore = 1.0 - adjustedDiscount;
        hasDraftDiscount = true;
      }
    }

    // --- Composite score ---
    const fitScore = Math.round(
      (0.40 * needScore + 0.30 * affordScore + 0.15 * impactFitScore + 0.15 * draftScore) * 100
    );

    results.push({
      teamId: tc.teamId,
      fitScore,
      needLevel,
      capSpace: tc.capSpace,
      estimatedAAV: estAAV,
      capPctRequired: Math.round(capPctRequired * 1000) / 10,
      canAfford,
      draftDiscount: hasDraftDiscount,
    });
  }

  return results
    .sort((a, b) => b.fitScore - a.fitScore)
    .slice(0, topN);
}
