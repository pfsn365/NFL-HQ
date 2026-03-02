/**
 * Position mapping utilities for bridging team-needs data (full names)
 * with API data (abbreviations).
 */

/** Maps full position names (from team-needs.ts) to standard abbreviations */
export const POSITION_NAME_TO_ABBR: Record<string, string> = {
  'Quarterback': 'QB',
  'Running Back': 'RB',
  'Wide Receiver': 'WR',
  'Tight End': 'TE',
  'Offensive Tackle': 'OT',
  'Offensive Guard': 'OG',
  'Offensive Center': 'C',
  'EDGE': 'EDGE',
  'Defensive Tackle': 'DT',
  'Linebacker': 'LB',
  'Cornerback': 'CB',
  'Safety': 'S',
};

/**
 * Maps FA/roster/depth-chart position abbreviations (which can be sub-positions)
 * back to the need category names used in team-needs.ts.
 *
 * Depth chart APIs return variants like WR1, WR2, LDE, RDE, LOLB, ROLB,
 * LILB, RILB, LCB, RCB, LDT, RDT, TE2, RB2, SLB, WLB, etc.
 */
export const POSITION_ABBR_TO_NEED_CATEGORY: Record<string, string> = {
  // Quarterback
  'QB': 'Quarterback',
  // Running Back
  'RB': 'Running Back',
  'RB2': 'Running Back',
  'FB': 'Running Back',
  'HB': 'Running Back',
  // Wide Receiver
  'WR': 'Wide Receiver',
  'WR1': 'Wide Receiver',
  'WR2': 'Wide Receiver',
  'WR3': 'Wide Receiver',
  // Tight End
  'TE': 'Tight End',
  'TE2': 'Tight End',
  // Offensive Tackle
  'OT': 'Offensive Tackle',
  'T': 'Offensive Tackle',
  'LT': 'Offensive Tackle',
  'RT': 'Offensive Tackle',
  'LOT': 'Offensive Tackle',
  'ROT': 'Offensive Tackle',
  // Offensive Guard
  'OG': 'Offensive Guard',
  'G': 'Offensive Guard',
  'LG': 'Offensive Guard',
  'RG': 'Offensive Guard',
  'LOG': 'Offensive Guard',
  'ROG': 'Offensive Guard',
  // Offensive Center
  'C': 'Offensive Center',
  'OC': 'Offensive Center',
  'OL': 'Offensive Guard', // generic OL → guard as closest match
  // EDGE / Defensive End
  'EDGE': 'EDGE',
  'DE': 'EDGE',
  'LDE': 'EDGE',
  'RDE': 'EDGE',
  // Defensive Tackle
  'DT': 'Defensive Tackle',
  'NT': 'Defensive Tackle',
  'DL': 'Defensive Tackle',
  'LDT': 'Defensive Tackle',
  'RDT': 'Defensive Tackle',
  // Linebacker
  'OLB': 'Linebacker',
  'LOLB': 'Linebacker',
  'ROLB': 'Linebacker',
  'LB': 'Linebacker',
  'ILB': 'Linebacker',
  'LILB': 'Linebacker',
  'RILB': 'Linebacker',
  'MLB': 'Linebacker',
  'SLB': 'Linebacker',
  'WLB': 'Linebacker',
  'LLB': 'Linebacker',
  'RLB': 'Linebacker',
  'SAM': 'Linebacker',
  'WILL': 'Linebacker',
  'MIKE': 'Linebacker',
  // Cornerback
  'CB': 'Cornerback',
  'LCB': 'Cornerback',
  'RCB': 'Cornerback',
  'CB2': 'Cornerback',
  'NCB': 'Cornerback',
  'DB': 'Cornerback',
  // Safety
  'S': 'Safety',
  'FS': 'Safety',
  'SS': 'Safety',
  'SAF': 'Safety',
};

/** Ordered array of 12 canonical abbreviations for heatmap columns */
export const HEATMAP_POSITIONS: string[] = [
  'QB', 'RB', 'WR', 'TE', 'OT', 'OG', 'C', 'EDGE', 'DT', 'LB', 'CB', 'S',
];

/** Get abbreviation from a full position name */
export function getAbbrFromFullName(fullName: string): string {
  return POSITION_NAME_TO_ABBR[fullName] || fullName;
}

/** Get the team-needs category name from a position abbreviation */
export function getNeedCategoryFromAbbr(abbr: string): string {
  const upper = abbr.toUpperCase();
  // Direct lookup
  if (POSITION_ABBR_TO_NEED_CATEGORY[upper]) return POSITION_ABBR_TO_NEED_CATEGORY[upper];
  // Strip trailing numbers (e.g. WR3 → WR, TE2 → TE, RB2 → RB)
  const stripped = upper.replace(/\d+$/, '');
  if (stripped !== upper && POSITION_ABBR_TO_NEED_CATEGORY[stripped]) return POSITION_ABBR_TO_NEED_CATEGORY[stripped];
  // Strip leading L/R (e.g. LCB → CB, RDE → DE)
  const noSide = upper.replace(/^[LR]/, '');
  if (noSide !== upper && POSITION_ABBR_TO_NEED_CATEGORY[noSide]) return POSITION_ABBR_TO_NEED_CATEGORY[noSide];
  return abbr;
}
