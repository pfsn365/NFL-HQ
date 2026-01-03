'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { TeamData } from '@/data/teams';
import LayoutStabilizer from '@/components/LayoutStabilizer';

// Helper function to generate Pro Football Network URL
const getPFNUrl = (playerName: string | undefined | null) => {
  if (!playerName || typeof playerName !== 'string') {
    return '#';
  }
  return `https://www.profootballnetwork.com/players/${playerName.toLowerCase().replace(/[.\s]+/g, '-').replace(/[^\w-]/g, '').replace(/-+/g, '-')}/`;
};

interface PlayerStats {
  player: string;
  gp: number;
  [key: string]: string | number;
}

interface TeamStat {
  name: string;
  own: number | string;
  opponent: number | string;
  net: number | string;
}

interface LiveTeamStats {
  offense: TeamStat[];
  passing: TeamStat[];
  rushing: TeamStat[];
  defense: TeamStat[];
  scoring: TeamStat[];
  fieldGoals: TeamStat[];
  returning: TeamStat[];
  punting: TeamStat[];
  kickoffs: TeamStat[];
  miscellaneous: TeamStat[];
}

interface LivePlayerStats {
  passing: PlayerStats[];
  rushing: PlayerStats[];
  receiving: PlayerStats[];
  defense: PlayerStats[];
  returning: PlayerStats[];
  kicking: PlayerStats[];
  punting: PlayerStats[];
}

interface StatsApiResponse {
  teamId: string;
  stats: any;
  teamStats: LiveTeamStats;
  playerStats: LivePlayerStats;
  lastUpdated: string;
  season: number;
}

// 2025 NFL player statistics
const passingStats: PlayerStats[] = [
  { player: 'Kyler Murray', gp: 17, cmp: 372, att: 541, cmpPercent: 68.8, yds: 3851, ya: 7.1, yg: 226.5, td: 30, tdPercent: 5.5, int: 11, intPercent: 2.0, lng: 60, sack: 21, syl: 220, qbr: 93.5 },
  { player: 'Clayton Tune', gp: 6, cmp: 2, att: 2, cmpPercent: 100.0, yds: 8, ya: 4.0, yg: 1.3, td: 0, tdPercent: 0.0, int: 0, intPercent: 0.0, lng: 7, sack: 0, syl: 0, qbr: 83.3 }
];

const rushingStats: PlayerStats[] = [
  { player: 'James Conner', gp: 16, att: 236, yds: 1094, yg: 68.4, ya: 4.6, lng: 53, td: 8, stf: 21, stfyl: 52, stfPercent: 8.9 },
  { player: 'Kyler Murray', gp: 17, att: 78, yds: 572, yg: 33.6, ya: 7.3, lng: 50, td: 5, stf: 5, stfyl: 5, stfPercent: 6.4 },
  { player: 'Trey Benson', gp: 13, att: 63, yds: 291, yg: 22.4, ya: 4.6, lng: 20, td: 1, stf: 4, stfyl: 6, stfPercent: 6.3 },
  { player: 'Emari Demercado', gp: 13, att: 24, yds: 223, yg: 17.2, ya: 9.3, lng: 53, td: 1, stf: 1, stfyl: 1, stfPercent: 4.2 },
  { player: 'Michael Carter', gp: 3, att: 35, yds: 131, yg: 43.7, ya: 3.7, lng: 13, td: 1, stf: 2, stfyl: 2, stfPercent: 5.7 },
  { player: 'DeeJay Dallas', gp: 17, att: 5, yds: 11, yg: 0.6, ya: 2.2, lng: 9, td: 0, stf: 0, stfyl: 0, stfPercent: 0.0 },
  { player: 'Tony Jones Jr.', gp: 1, att: 1, yds: 55, yg: 55.0, ya: 55.0, lng: 55, td: 1, stf: 0, stfyl: 0, stfPercent: 0.0 }
];

const receivingStats: PlayerStats[] = [
  { player: 'Trey McBride', gp: 16, rec: 111, tgt: 147, yds: 1146, yg: 71.6, ya: 10.3, lng: 37, td: 1, yac: 632, yacA: 5.7, firstD: 61 },
  { player: 'Marvin Harrison Jr.', gp: 17, rec: 62, tgt: 116, yds: 885, yg: 52.1, ya: 14.3, lng: 60, td: 8, yac: 721, yacA: 11.6, firstD: 48 },
  { player: 'Michael Wilson', gp: 16, rec: 47, tgt: 71, yds: 548, yg: 34.3, ya: 11.7, lng: 41, td: 4, yac: 416, yacA: 8.9, firstD: 24 },
  { player: 'James Conner', gp: 16, rec: 53, tgt: 84, yds: 414, yg: 25.9, ya: 7.8, lng: 44, td: 2, yac: 480, yacA: 9.1, firstD: 25 },
  { player: 'Greg Dortch', gp: 17, rec: 37, tgt: 50, yds: 342, yg: 20.1, ya: 9.2, lng: 39, td: 3, yac: 280, yacA: 7.6, firstD: 18 },
  { player: 'Zay Jones', gp: 11, rec: 25, tgt: 36, yds: 84, yg: 7.6, ya: 3.4, lng: 25, td: 0, yac: 20, yacA: 0.8, firstD: 8 },
  { player: 'Elijah Higgins', gp: 17, rec: 20, tgt: 24, yds: 172, yg: 10.1, ya: 8.6, lng: 23, td: 2, yac: 83, yacA: 4.2, firstD: 12 },
  { player: 'Trey Benson', gp: 13, rec: 6, tgt: 6, yds: 59, yg: 4.5, ya: 9.8, lng: 19, td: 1, yac: 77, yacA: 12.8, firstD: 6 },
  { player: 'Tip Reiman', gp: 17, rec: 6, tgt: 7, yds: 37, yg: 2.2, ya: 6.2, lng: 14, td: 0, yac: 7, yacA: 1.2, firstD: 0 }
];

const scoringStats: PlayerStats[] = [
  { player: 'Chad Ryland', gp: 13, pass: 0, rush: 0, rec: 0, ret: 0, td: 0, twoPt: 0, xpt: 39, fg: 26, saf: 0, pts: 117, ppg: 9.0 },
  { player: 'Matt Prater', gp: 4, pass: 0, rush: 0, rec: 0, ret: 0, td: 0, twoPt: 0, xpt: 10, fg: 6, saf: 0, pts: 28, ppg: 7.0 },
  { player: 'Kyler Murray', gp: 17, pass: 30, rush: 5, rec: 0, ret: 0, td: 35, twoPt: 1, xpt: 0, fg: 0, saf: 0, pts: 212, ppg: 12.5 },
  { player: 'James Conner', gp: 16, pass: 0, rush: 8, rec: 2, ret: 0, td: 10, twoPt: 0, xpt: 0, fg: 0, saf: 0, pts: 60, ppg: 3.8 },
  { player: 'Marvin Harrison Jr.', gp: 17, pass: 0, rush: 0, rec: 8, ret: 0, td: 8, twoPt: 0, xpt: 0, fg: 0, saf: 0, pts: 48, ppg: 2.8 },
  { player: 'Michael Wilson', gp: 16, pass: 0, rush: 0, rec: 4, ret: 0, td: 4, twoPt: 0, xpt: 0, fg: 0, saf: 0, pts: 24, ppg: 1.5 },
  { player: 'Greg Dortch', gp: 17, pass: 0, rush: 0, rec: 3, ret: 0, td: 3, twoPt: 0, xpt: 0, fg: 0, saf: 0, pts: 18, ppg: 1.1 }
];

const defenseStats: PlayerStats[] = [
  { player: 'Budda Baker', gp: 17, solo: 95, ast: 69, tot: 164, sacks: 2, syds: 13, int: 0, yds: 0, lng: 0, td: 0, pd: 5, saf: 0, ff: 1, fr: 1 },
  { player: 'Kyzir White', gp: 17, solo: 60, ast: 77, tot: 137, sacks: 2.5, syds: 14, int: 1, yds: 0, lng: 0, td: 0, pd: 3, saf: 0, ff: 0, fr: 1 },
  { player: 'Jalen Thompson', gp: 15, solo: 61, ast: 37, tot: 98, sacks: 0, syds: 0, int: 0, yds: 0, lng: 0, td: 0, pd: 3, saf: 0, ff: 0, fr: 2 },
  { player: 'Mack Wilson Sr.', gp: 16, solo: 44, ast: 31, tot: 75, sacks: 3, syds: 20, int: 1, yds: 0, lng: 0, td: 0, pd: 5, saf: 0, ff: 0, fr: 1 },
  { player: 'Zaven Collins', gp: 17, solo: 33, ast: 24, tot: 57, sacks: 1, syds: 49, int: 0, yds: 0, lng: 0, td: 0, pd: 1, saf: 0, ff: 2, fr: 2 },
  { player: 'Sean Murphy-Bunting', gp: 15, solo: 30, ast: 22, tot: 52, sacks: 0, syds: 0, int: 2, yds: 3, lng: 2, td: 0, pd: 5, saf: 0, ff: 2, fr: 2 },
  { player: 'Starling Thomas V', gp: 17, solo: 31, ast: 16, tot: 47, sacks: 0, syds: 0, int: 1, yds: 0, lng: 0, td: 0, pd: 6, saf: 0, ff: 1, fr: 1 },
  { player: 'Garrett Williams', gp: 16, solo: 40, ast: 18, tot: 58, sacks: 0, syds: 0, int: 1, yds: 0, lng: 0, td: 0, pd: 9, saf: 0, ff: 1, fr: 1 },
  { player: 'Max Melton', gp: 17, solo: 31, ast: 14, tot: 45, sacks: 0, syds: 0, int: 1, yds: 0, lng: 0, td: 0, pd: 5, saf: 0, ff: 1, fr: 1 },
  { player: 'Dadrion Taylor-Demerson', gp: 17, solo: 22, ast: 13, tot: 35, sacks: 0, syds: 0, int: 1, yds: 0, lng: 0, td: 0, pd: 5, saf: 0, ff: 1, fr: 1 }
];

const returningStats: PlayerStats[] = [];

const kickingStats: PlayerStats[] = [];

const puntingStats: PlayerStats[] = [];

// Helper function to transform team stat data for display
const transformTeamStatForDisplay = (stat: TeamStat) => ({
  category: stat.name.replace(/ Efficiency/g, ''),
  own: stat.own,
  opponent: stat.opponent,
  net: stat.net
});

const statCategories = [
  { key: 'passing', name: 'Passing', data: passingStats },
  { key: 'rushing', name: 'Rushing', data: rushingStats },
  { key: 'receiving', name: 'Receiving', data: receivingStats },
  { key: 'scoring', name: 'Scoring', data: scoringStats },
  { key: 'defense', name: 'Defense', data: defenseStats }
];

const columnHeaders: { [key: string]: { [key: string]: string } } = {
  passing: {
    player: 'PLAYER',
    gp: 'GP',
    cmp: 'CMP',
    att: 'ATT',
    cmpPercent: 'CMP%',
    yds: 'YDS',
    ya: 'Y/A',
    yg: 'Y/G',
    td: 'TD',
    tdPercent: 'TD%',
    int: 'INT',
    intPercent: 'INT%',
    lng: 'LNG',
    sack: 'SACK',
    syl: 'SYL',
    qbr: 'QBR'
  },
  rushing: {
    player: 'PLAYER',
    gp: 'GP',
    att: 'ATT',
    yds: 'YDS',
    yg: 'Y/G',
    ya: 'Y/A',
    lng: 'LNG',
    td: 'TD',
    stf: 'STF',
    stfyl: 'STFYL',
    stfPercent: 'STF%'
  },
  receiving: {
    player: 'PLAYER',
    gp: 'GP',
    rec: 'REC',
    tgt: 'TGT',
    yds: 'YDS',
    yg: 'Y/G',
    ya: 'Y/A',
    lng: 'LNG',
    td: 'TD',
    yac: 'YAC',
    yacA: 'YAC/A',
    firstD: '1stD'
  },
  scoring: {
    player: 'PLAYER',
    gp: 'GP',
    pass: 'PASS',
    rush: 'RUSH',
    rec: 'REC',
    ret: 'RET',
    td: 'TD',
    twoPt: '2PT',
    xpt: 'XPT',
    fg: 'FG',
    saf: 'SAF',
    pts: 'PTS',
    ppg: 'PPG'
  },
  defense: {
    player: 'PLAYER',
    gp: 'GP',
    solo: 'SOLO',
    ast: 'AST',
    tot: 'TOT',
    sacks: 'SACKS',
    syds: 'SYDS',
    int: 'INT',
    yds: 'YDS',
    lng: 'LNG',
    td: 'TD',
    pd: 'PD',
    saf: 'SAF',
    ff: 'FF',
    fr: 'FR'
  },
  returning: {
    player: 'PLAYER',
    gp: 'GP',
    kr: 'KR',
    yds: 'YDS',
    avg: 'AVG',
    td: 'TD',
    lng: 'LNG',
    fc: 'FC',
    pr: 'PR',
    pyds: 'YDS',
    pavg: 'AVG',
    pfc: 'FC',
    ptd: 'TD',
    plng: 'LNG'
  },
  kicking: {
    player: 'PLAYER',
    gp: 'GP',
    fgm: 'FGM',
    fga: 'FGA',
    fgPercent: 'FG%',
    lng: 'LNG',
    zeroNineteen: '0-19',
    twentyTwentyNine: '20-29',
    thirtyThirtyNine: '30-39',
    fortyFortyNine: '40-49',
    fiftyPlus: '50+',
    xpm: 'XPM',
    xpa: 'XPA',
    xpPercent: 'XP%',
    pts: 'PTS'
  },
  punting: {
    player: 'PLAYER',
    gp: 'GP',
    punts: 'PUNTS',
    yds: 'YDS',
    lng: 'LNG',
    avg: 'AVG',
    net: 'NET',
    pblk: 'PBLK',
    in20: 'IN20',
    in10: 'IN10',
    tb: 'TB'
  }
};


const glossaryData = {
  'General': {
    'GP': 'Games Played',
    'YDS': 'Yards',
    'TD': 'Touchdowns',
    'LNG': 'Longest',
    'AVG': 'Average'
  },
  'Passing': {
    'CMP': 'Completions',
    'ATT': 'Attempts',
    'CMP%': 'Completion Percentage',
    'Y/A': 'Yards per Attempt',
    'Y/G': 'Yards per Game',
    'TD%': 'Touchdown Percentage',
    'INT': 'Interceptions',
    'INT%': 'Interception Percentage',
    'SACK': 'Total Sacks',
    'SYL': 'Sack Yards Lost',
    'QBR': 'QB Rating'
  },
  'Rushing': {
    'ATT': 'Attempts',
    'Y/A': 'Yards per Attempt',
    'Y/G': 'Yards per Game',
    'STF': 'Stuffs',
    'STFYL': 'Stuffed Yards Lost',
    'STF%': 'Stuffed Percentage'
  },
  'Receiving': {
    'REC': 'Receptions',
    'TGT': 'Targets',
    'Y/A': 'Yards per Reception',
    'Y/G': 'Yards per Game',
    'YAC': 'Yards after Catch',
    'YAC/A': 'Average Yards after Catch',
    '1stD': 'First Downs'
  },
  'Scoring': {
    'PASS': 'Passing Touchdowns',
    'RUSH': 'Rushing Touchdowns',
    'REC': 'Receiving Touchdowns',
    'RET': 'Returning Touchdowns',
    '2PT': 'Two Point Conversions',
    'XPT': 'Extra Points',
    'FG': 'Field Goals',
    'SAF': 'Safeties',
    'PTS': 'Total Points',
    'PPG': 'Points Per Game'
  },
  'Defense': {
    'SOLO': 'Solo Tackles',
    'AST': 'Tackle Assists',
    'TOT': 'Total Tackles',
    'SACKS': 'Sacks',
    'SYDS': 'Sack Yards',
    'INT': 'Interceptions',
    'PD': 'Passes Defended',
    'FF': 'Forced Fumbles',
    'FR': 'Fumble Recoveries'
  },
  'Kicking': {
    'FGM': 'Field Goals Made',
    'FGA': 'Field Goals Attempted',
    'FG%': 'Field Goal Percentage',
    '0-19': 'Made-Attempts (0-19 yards)',
    '20-29': 'Made-Attempts (20-29 yards)',
    '30-39': 'Made-Attempts (30-39 yards)',
    '40-49': 'Made-Attempts (40-49 yards)',
    '50+': 'Made-Attempts (50+ yards)',
    'XPM': 'Extra Points Made',
    'XPA': 'Extra Points Attempted',
    'XP%': 'Extra Point Percentage'
  },
  'Punting': {
    'PUNTS': 'Total Punts',
    'NET': 'Net Average Yards',
    'PBLK': 'Punts Blocked',
    'IN20': 'Punts Inside 20',
    'IN10': 'Punts Inside 10',
    'TB': 'Touchbacks'
  },
  'Returning': {
    'KR': 'Kickoff Returns',
    'PR': 'Punt Returns',
    'FC': 'Fair Catches'
  }
};

interface StatsTabProps {
  team: TeamData;
}

export default function StatsTab({ team }: StatsTabProps) {
  const [viewType, setViewType] = useState('players');
  const [selectedCategory, setSelectedCategory] = useState('passing');
  const [isGlossaryOpen, setIsGlossaryOpen] = useState(false);
  const [liveTeamStats, setLiveTeamStats] = useState<LiveTeamStats | null>(null);
  const [livePlayerStats, setLivePlayerStats] = useState<LivePlayerStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const fetchTeamStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/nfl/teams/api/stats/${team.id}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Team stats not available yet');
        }
        throw new Error(`Failed to fetch team stats: ${response.status}`);
      }

      const data: StatsApiResponse = await response.json();

      if (!data.teamStats || !data.playerStats) {
        throw new Error('Invalid stats data received');
      }

      setLiveTeamStats(data.teamStats);
      setLivePlayerStats(data.playerStats);
    } catch (err) {
      console.error('Error fetching team stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to load team stats');
    } finally {
      setLoading(false);
    }
  }, [team.id]);

  useEffect(() => {
    fetchTeamStats();
  }, [fetchTeamStats]);

  const liveTeamStatCategories = useMemo(() => {
    if (!liveTeamStats) return [];

    return [
      { key: 'offense', name: 'Offense', data: liveTeamStats.offense.map(transformTeamStatForDisplay) },
      { key: 'passing', name: 'Passing', data: liveTeamStats.passing.map(transformTeamStatForDisplay) },
      { key: 'rushing', name: 'Rushing', data: liveTeamStats.rushing.map(transformTeamStatForDisplay) },
      { key: 'defense', name: 'Defense', data: liveTeamStats.defense.map(transformTeamStatForDisplay) },
      { key: 'scoring', name: 'Scoring', data: liveTeamStats.scoring.map(transformTeamStatForDisplay) },
      { key: 'fieldGoals', name: 'Field Goals', data: liveTeamStats.fieldGoals.map(transformTeamStatForDisplay) },
      { key: 'returning', name: 'Returning', data: liveTeamStats.returning.map(transformTeamStatForDisplay) },
      { key: 'punting', name: 'Punting', data: liveTeamStats.punting.map(transformTeamStatForDisplay) },
      { key: 'kickoffs', name: 'Kickoffs', data: liveTeamStats.kickoffs.map(transformTeamStatForDisplay) },
      { key: 'miscellaneous', name: 'Miscellaneous', data: liveTeamStats.miscellaneous.map(transformTeamStatForDisplay) }
    ];
  }, [liveTeamStats]);

  // Transform live API data to match static data structure
  const transformPassingData = (data: any[]) => {
    return data.map(player => ({
      player: player.name,
      gp: player.games_played,
      cmp: player.completions,
      att: player.attempts,
      cmpPercent: player.completion_percentage,
      yds: player.yards,
      ya: player.yards_per_attempt,
      yg: player.yards_per_game,
      td: player.touchdowns,
      tdPercent: player.touchdowns_percentage,
      int: player.interceptions,
      intPercent: player.interceptions_percentage,
      lng: player.longest_pass,
      sack: player.total_sacks,
      syl: player.yards_lost,
      qbr: player.qb_rating
    }));
  };

  const transformRushingData = (data: any[]) => {
    return data.map(player => ({
      player: player.name,
      gp: player.games_played,
      att: player.attempts,
      yds: player.yards,
      yg: player.yards_per_game,
      ya: player.yards_per_rush_attempt,
      lng: player.longest_rush,
      td: player.touchdowns,
      stf: player.stuffs,
      stfyl: player.stuffed_yards_lost,
      stfPercent: player.stuffed_percentage
    }));
  };

  const transformReceivingData = (data: any[]) => {
    return data.map(player => ({
      player: player.name,
      gp: player.games_played,
      rec: player.receptions,
      tgt: player.targets,
      yds: player.yards,
      yg: player.yards_per_game,
      ya: player.yards_per_reception,
      lng: player.long_receptions,
      td: player.touchdowns,
      yac: player.yards_after_catch,
      yacA: player.average__yards_after_catch,
      firstD: player.first_downs
    }));
  };

  const transformDefenseData = (data: any[]) => {
    return data.map(player => ({
      player: player.name,
      gp: player.games_played,
      solo: player.tackles?.solo_tackles || 0,
      ast: player.tackles?.tackle_assists || 0,
      tot: player.tackles?.total_tackles || 0,
      sacks: player.sacks?.sacks || 0,
      syds: player.sacks?.sack_yards || 0,
      int: player.interceptions?.interceptions || 0,
      yds: player.interceptions?.interception_yards || 0,
      lng: player.interceptions?.long_interceptions || 0,
      td: player.interceptions?.interception_touchdowns || 0,
      pd: player.interceptions?.passes_defended || 0,
      saf: player.interceptions?.safeties || 0,
      ff: player.fumbles?.forced_fumbles || 0,
      fr: player.fumbles?.fumbles_recovered || 0
    }));
  };

  // Sorting functionality
  const handleSort = (columnKey: string) => {
    if (viewType === 'team') return; // Only sort player stats

    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnKey);
      setSortDirection('desc'); // Default to descending (greatest to least)
    }
  };

  const sortData = (data: any[], column: string, direction: 'asc' | 'desc') => {
    if (!column) return data;

    return [...data].sort((a, b) => {
      let aValue = a[column];
      let bValue = b[column];

      // Handle different data types
      if (typeof aValue === 'string' && !isNaN(parseFloat(aValue))) {
        aValue = parseFloat(aValue);
      }
      if (typeof bValue === 'string' && !isNaN(parseFloat(bValue))) {
        bValue = parseFloat(bValue);
      }

      // Handle percentage strings
      if (typeof aValue === 'string' && aValue.includes('%')) {
        aValue = parseFloat(aValue.replace('%', ''));
      }
      if (typeof bValue === 'string' && bValue.includes('%')) {
        bValue = parseFloat(bValue.replace('%', ''));
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return direction === 'asc' ? aValue - bValue : bValue - aValue;
      }

      // String comparison for non-numeric values
      const aStr = String(aValue || '').toLowerCase();
      const bStr = String(bValue || '').toLowerCase();

      if (direction === 'asc') {
        return aStr.localeCompare(bStr);
      } else {
        return bStr.localeCompare(aStr);
      }
    });
  };

  const livePlayerStatCategories = useMemo(() => {
    if (!livePlayerStats) return [];

    // Get static data for fallback when API returns empty arrays
    const getStaticData = (key: string) => {
      const staticCategory = statCategories.find(cat => cat.key === key);
      return staticCategory ? staticCategory.data : [];
    };

    return [
      {
        key: 'passing',
        name: 'Passing',
        data: livePlayerStats.passing && livePlayerStats.passing.length > 0
          ? transformPassingData(livePlayerStats.passing)
          : getStaticData('passing')
      },
      {
        key: 'rushing',
        name: 'Rushing',
        data: livePlayerStats.rushing && livePlayerStats.rushing.length > 0
          ? transformRushingData(livePlayerStats.rushing)
          : getStaticData('rushing')
      },
      {
        key: 'receiving',
        name: 'Receiving',
        data: livePlayerStats.receiving && livePlayerStats.receiving.length > 0
          ? transformReceivingData(livePlayerStats.receiving)
          : getStaticData('receiving')
      },
      {
        key: 'defense',
        name: 'Defense',
        data: livePlayerStats.defense && livePlayerStats.defense.length > 0
          ? transformDefenseData(livePlayerStats.defense)
          : getStaticData('defense')
      }
    ];
  }, [livePlayerStats]);

  const currentData = useMemo(() => {
    let data: any[] = [];

    if (viewType === 'team') {
      const category = liveTeamStatCategories.find(cat => cat.key === selectedCategory);
      data = category ? category.data : [];
    } else {
      // Use live player stats if available, otherwise fallback to static data
      if (livePlayerStats) {
        const category = livePlayerStatCategories.find(cat => cat.key === selectedCategory);
        data = category ? category.data : [];
      } else {
        const category = statCategories.find(cat => cat.key === selectedCategory);
        data = category ? category.data : [];
      }

      // Apply sorting only for player stats
      if (sortColumn && data.length > 0) {
        data = sortData(data, sortColumn, sortDirection);
      }
    }

    return data;
  }, [selectedCategory, viewType, liveTeamStatCategories, livePlayerStatCategories, livePlayerStats, sortColumn, sortDirection]);

  const currentHeaders = useMemo(() => {
    if (viewType === 'team') {
      return { category: 'Statistic', own: 'Team', opponent: 'Opponent', net: 'Net' };
    } else {
      return columnHeaders[selectedCategory] || {};
    }
  }, [selectedCategory, viewType]);

  const availableCategories = useMemo(() => {
    if (viewType === 'team') {
      return liveTeamStatCategories;
    } else {
      // Use live player categories if available
      if (livePlayerStats) {
        return livePlayerStatCategories;
      } else {
        return statCategories;
      }
    }
  }, [viewType, liveTeamStatCategories, livePlayerStatCategories, livePlayerStats]);

  // Reset category when switching view types if current category doesn't exist
  useMemo(() => {
    const categoryExists = availableCategories.some(cat => cat.key === selectedCategory);
    if (!categoryExists) {
      setSelectedCategory(availableCategories[0]?.key || 'passing');
    }
  }, [availableCategories, selectedCategory]);

  const getSortIcon = (columnKey: string) => {
    if (sortColumn !== columnKey) {
      return (
        <svg className="w-3 h-3 inline ml-1" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 10l4-4 4 4H8zm0 4l4 4 4-4H8z" opacity="0.5"/>
        </svg>
      );
    }
    if (sortDirection === 'asc') {
      return (
        <svg className="w-3 h-3 inline ml-1" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 14l4-4 4 4H8z"/>
        </svg>
      );
    }
    return (
      <svg className="w-3 h-3 inline ml-1" fill="currentColor" viewBox="0 0 24 24">
        <path d="M8 10l4 4 4-4H8z"/>
      </svg>
    );
  };

  return (
    <LayoutStabilizer className="bg-white rounded-lg shadow p-4 sm:p-6 pb-24" minHeight={800}>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{team.fullName} Stats</h2>
          <div className="h-1 rounded-full" style={{ backgroundColor: team.primaryColor, width: 'fit-content', minWidth: '240px' }}></div>
        </div>
      </div>

      {/* Loading and Error States for Live Stats */}
      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading live {viewType === 'team' ? 'team' : 'player'} stats...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <div className="text-red-600 mr-3">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-medium text-red-800">Error Loading Live Stats</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
              <button
                onClick={fetchTeamStats}
                className="text-sm text-red-800 hover:text-red-900 underline mt-2"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Type Toggle */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setViewType('players')}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            viewType === 'players'
              ? 'text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          style={viewType === 'players' ? { backgroundColor: team.primaryColor } : {}}
        >
          Players
        </button>
        <button
          onClick={() => setViewType('team')}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            viewType === 'team'
              ? 'text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          style={viewType === 'team' ? { backgroundColor: team.primaryColor } : {}}
        >
          Team
        </button>
      </div>

      {/* Category Buttons */}
      <div className="flex flex-wrap gap-2 mb-6">
        {availableCategories.map((category) => (
          <button
            key={category.key}
            onClick={() => setSelectedCategory(category.key)}
            className={`px-3 py-1 text-sm rounded ${
              selectedCategory === category.key
                ? 'bg-gray-800 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>

      {/* Stats Table */}
      <div className="overflow-x-auto mb-8">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-white" style={{ backgroundColor: team.primaryColor }}>
              {Object.entries(currentHeaders).map(([key, header]) => (
                <th key={key} className="text-left p-2 sm:p-3 font-medium whitespace-nowrap">
                  {viewType === 'players' && key !== 'player' ? (
                    <button
                      onClick={() => handleSort(key)}
                      className="flex items-center hover:opacity-90 w-full text-left cursor-pointer"
                    >
                      <span>{header}</span>
                      {getSortIcon(key)}
                    </button>
                  ) : (
                    header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {currentData.map((row, index) => (
              <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                {Object.keys(currentHeaders).map((key) => {
                  const value = (row as any)[key];
                  return (
                    <td key={key} className="p-2 sm:p-3 whitespace-nowrap">
                      {(key === 'player' || key === 'name') && value && typeof value === 'string' ? (
                        <a
                          href={getPFNUrl(value)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium hover:underline"
                          style={{ color: team.primaryColor }}
                        >
                          {value}
                        </a>
                      ) : key === 'category' && viewType === 'team' ? (
                        <span className="text-gray-900 font-medium">
                          {value}
                        </span>
                      ) : key === 'category' ? (
                        <span className="text-blue-600 font-medium hover:underline cursor-pointer">
                          {value}
                        </span>
                      ) : (
                        <span>{value || '--'}</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Collapsible Glossary */}
      <div className="border-t pt-6">
        <button
          onClick={() => setIsGlossaryOpen(!isGlossaryOpen)}
          className="flex items-center justify-between w-full text-left"
        >
          <h3 className="text-lg font-semibold text-gray-800">Glossary</h3>
          <span className="text-2xl text-gray-500">
            {isGlossaryOpen ? '−' : '+'}
          </span>
        </button>
        
        {isGlossaryOpen && (
          <div className="mt-4 space-y-6">
            {Object.entries(glossaryData).map(([category, terms]) => (
              <div key={category}>
                <h4 className="text-base font-semibold text-gray-900 mb-3 pb-1 border-b border-gray-200">{category}</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2 text-sm">
                  {Object.entries(terms).map(([abbrev, definition]) => (
                    <div key={abbrev} className="flex">
                      <span className="font-semibold text-gray-900 w-20 flex-shrink-0">{abbrev}</span>
                      <span className="text-gray-600">{definition}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </LayoutStabilizer>
  );
}