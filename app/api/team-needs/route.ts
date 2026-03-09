import { NextResponse } from 'next/server';
import { getAllTeams } from '@/data/teams';

export const revalidate = 300; // 5 minutes

/** Maps API need field names to full position names used in the app */
const NEED_FIELD_TO_POSITION: Record<string, string> = {
  needQB: 'Quarterback',
  needRB: 'Running Back',
  needWR: 'Wide Receiver',
  needTE: 'Tight End',
  needOT: 'Offensive Tackle',
  needOG: 'Offensive Guard',
  needOC: 'Offensive Center',
  needEDGE: 'EDGE',
  needDT: 'Defensive Tackle',
  needLB: 'Linebacker',
  needCB: 'Cornerback',
  needS: 'Safety',
};

/** Maps position abbreviations (writeup sheet headers) to full position names */
const ABBR_TO_POSITION: Record<string, string> = {
  QB: 'Quarterback',
  RB: 'Running Back',
  WR: 'Wide Receiver',
  TE: 'Tight End',
  OT: 'Offensive Tackle',
  OG: 'Offensive Guard',
  OC: 'Offensive Center',
  EDGE: 'EDGE',
  DT: 'Defensive Tackle',
  LB: 'Linebacker',
  CB: 'Cornerback',
  S: 'Safety',
};

export async function GET() {
  try {
    const response = await fetch(
      'https://staticj.profootballnetwork.com/assets/sheets/static/nflTeamNeeds/data.json',
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'PFN-Internal-NON-Blocking',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }

    const data = await response.json();

    if (!data.collections || !Array.isArray(data.collections)) {
      throw new Error('Invalid data structure from team needs API');
    }

    const needsCollection = data.collections.find((c: any) => c.sheetName === 'team_needs');
    const writeupCollection = data.collections.find((c: any) => c.sheetName === 'writeup');

    if (!needsCollection?.data || !writeupCollection?.data) {
      throw new Error('Missing team_needs or writeup collection');
    }

    // Parse headers
    const needsHeaders: string[] = needsCollection.data[0];
    const writeupHeaders: string[] = writeupCollection.data[0];

    // Build team abbreviation → team ID mapping
    const allTeams = getAllTeams();
    const abbrToTeamId: Record<string, string> = {};
    for (const team of allTeams) {
      abbrToTeamId[team.abbreviation] = team.id;
    }

    // Build writeup lookup: shortName → { position → writeup }
    const writeupMap: Record<string, Record<string, string>> = {};
    for (let i = 1; i < writeupCollection.data.length; i++) {
      const row = writeupCollection.data[i];
      const shortName = row[writeupHeaders.indexOf('shortName')];
      if (!shortName) continue;

      writeupMap[shortName] = {};
      for (const [abbr, posName] of Object.entries(ABBR_TO_POSITION)) {
        const colIdx = writeupHeaders.indexOf(abbr);
        if (colIdx >= 0 && row[colIdx]) {
          writeupMap[shortName][posName] = row[colIdx];
        }
      }
    }

    // Build teamNeeds: teamId → PositionNeed[]
    const teamNeeds: Record<string, { position: string; needLevel: number; writeup: string }[]> = {};

    for (let i = 1; i < needsCollection.data.length; i++) {
      const row = needsCollection.data[i];
      const shortName = row[needsHeaders.indexOf('shortName')];
      if (!shortName) continue;

      const teamId = abbrToTeamId[shortName];
      if (!teamId) continue;

      const positions: { position: string; needLevel: number; writeup: string }[] = [];
      const teamWriteups = writeupMap[shortName] || {};

      for (const [field, posName] of Object.entries(NEED_FIELD_TO_POSITION)) {
        const colIdx = needsHeaders.indexOf(field);
        if (colIdx < 0) continue;

        const rawLevel = row[colIdx];
        const needLevel = parseFloat(rawLevel) || 0;
        const writeup = teamWriteups[posName] || '';

        positions.push({ position: posName, needLevel, writeup });
      }

      teamNeeds[teamId] = positions;
    }

    return NextResponse.json({ teamNeeds }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('Error in team-needs API route:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch team needs data',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
