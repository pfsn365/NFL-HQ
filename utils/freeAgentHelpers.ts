import { getAllTeams } from '@/data/teams';

// TypeScript Interfaces
export interface FreeAgent {
  rank: number;
  name: string;
  position: string;
  current2025Team: string;
  faType: 'UFA' | 'RFA' | 'ERFA' | 'Void' | 'SFA' | string;
  age: number;
  pfsn2025Impact: number;
  signed2026Team: string;
  positionRank: number;
  teamId?: string;
}

export interface RawFreeAgentData {
  Rank: string | number;
  Name: string;
  Position: string;
  '2025 Team': string;
  'FA Type': string;
  Age: string | number;
  'PFSN 2025 Impact': string | number;
  '2026 Team': string;
  'Pos. Rank': string | number;
}

export type SortKey = 'pfsn2025Impact' | 'positionRank' | 'age' | 'name' | 'rank';

export function generatePlayerSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[.\s]+/g, '-')
    .replace(/[^\w-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function mapTeamNameToId(teamName: string): string | undefined {
  if (!teamName || teamName.trim() === '') return undefined;

  const allTeams = getAllTeams();
  const normalized = teamName.trim().toLowerCase();

  // Try matching against name, fullName, and abbreviation
  return allTeams.find(t =>
    t.name.toLowerCase() === normalized ||
    t.fullName.toLowerCase() === normalized ||
    t.abbreviation.toLowerCase() === normalized
  )?.id;
}

export function getPositionImpactUrl(position: string): string {
  const pos = position.toUpperCase();

  // Position-specific impact grade pages
  if (pos === 'QB') return 'https://www.profootballnetwork.com/nfl-qb-rankings-impact/';
  if (pos === 'RB' || pos === 'FB') return 'https://www.profootballnetwork.com/nfl-rb-rankings-impact/';
  if (pos === 'WR') return 'https://www.profootballnetwork.com/nfl-wr-rankings-impact/';
  if (pos === 'TE') return 'https://www.profootballnetwork.com/nfl-te-rankings-impact/';
  if (pos === 'OL' || pos === 'OT' || pos === 'OG' || pos === 'OC' || pos === 'T' || pos === 'G' || pos === 'C') {
    return 'https://www.profootballnetwork.com/nfl-player-ol-rankings-impact/';
  }
  if (pos === 'DT' || pos === 'NT') return 'https://www.profootballnetwork.com/nfl-dt-rankings-impact/';
  if (pos === 'EDGE' || pos === 'DE') return 'https://www.profootballnetwork.com/nfl-edge-rankings-impact/';
  if (pos === 'LB' || pos === 'ILB' || pos === 'OLB' || pos === 'MLB') return 'https://www.profootballnetwork.com/nfl-lb-rankings-impact/';
  if (pos === 'CB') return 'https://www.profootballnetwork.com/nfl-cb-rankings-impact/';
  if (pos === 'S' || pos === 'FS' || pos === 'SS' || pos === 'SAF' || pos === 'DB') {
    return 'https://www.profootballnetwork.com/nfl-saf-rankings-impact/';
  }

  // Default fallback
  return 'https://www.profootballnetwork.com/nfl-player-rankings-impact/';
}

export function transformFreeAgentData(rawData: RawFreeAgentData[]): FreeAgent[] {
  // Deduplicate by name + position + team to prevent duplicate entries
  // while allowing players with same name but different positions/teams
  const seenKeys = new Set<string>();
  const uniqueData = rawData.filter(agent => {
    const key = `${agent.Name?.trim().toLowerCase()}-${agent.Position?.trim().toLowerCase()}-${agent['2025 Team']?.trim().toLowerCase()}`;
    if (seenKeys.has(key)) return false;
    seenKeys.add(key);
    return true;
  });

  return uniqueData.map((agent) => {
    const teamId = mapTeamNameToId(agent['2025 Team']);

    // Parse position rank - handle formats like "WR1", "CB2", "EDGE1"
    let positionRank = 0;
    if (agent['Pos. Rank'] !== null && agent['Pos. Rank'] !== undefined && agent['Pos. Rank'] !== '') {
      if (typeof agent['Pos. Rank'] === 'number') {
        positionRank = agent['Pos. Rank'];
      } else {
        // Extract numeric part from strings like "WR1", "EDGE1", "CB2"
        const numericPart = String(agent['Pos. Rank']).replace(/\D/g, '');
        const parsed = parseInt(numericPart);
        positionRank = isNaN(parsed) ? 0 : parsed;
      }
    }

    return {
      rank: typeof agent.Rank === 'number' ? agent.Rank : parseInt(agent.Rank as string) || 0,
      name: agent.Name || '',
      position: agent.Position || '',
      current2025Team: agent['2025 Team'] || '',
      faType: agent['FA Type'] || '',
      age: typeof agent.Age === 'number' ? agent.Age : parseInt(agent.Age as string) || 0,
      pfsn2025Impact: typeof agent['PFSN 2025 Impact'] === 'number'
        ? agent['PFSN 2025 Impact']
        : parseFloat(agent['PFSN 2025 Impact'] as string) || 0,
      signed2026Team: agent['2026 Team'] || '',
      positionRank,
      teamId
    };
  });
}
