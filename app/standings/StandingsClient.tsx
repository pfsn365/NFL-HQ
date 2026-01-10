'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { getAllTeams } from '@/data/teams';
import Link from 'next/link';
import NFLTeamsSidebar from '@/components/NFLTeamsSidebar';
import SkeletonLoader from '@/components/SkeletonLoader';

interface StandingData {
  teamId: string;
  teamName: string;
  conference: 'AFC' | 'NFC';
  division: string;
  wins: number;
  losses: number;
  ties: number;
  winPct: number;
  gamesBack: number;
  homeRecord: string;
  awayRecord: string;
  confRecord: string;
  divRecord: string;
  streak: string;
  last10: string;
}

// Map API team slugs to our team IDs (already defined in teams data)
const teamSlugMapping: Record<string, string> = {
  'arizona-cardinals': 'arizona-cardinals',
  'atlanta-falcons': 'atlanta-falcons',
  'baltimore-ravens': 'baltimore-ravens',
  'buffalo-bills': 'buffalo-bills',
  'carolina-panthers': 'carolina-panthers',
  'chicago-bears': 'chicago-bears',
  'cincinnati-bengals': 'cincinnati-bengals',
  'cleveland-browns': 'cleveland-browns',
  'dallas-cowboys': 'dallas-cowboys',
  'denver-broncos': 'denver-broncos',
  'detroit-lions': 'detroit-lions',
  'green-bay-packers': 'green-bay-packers',
  'houston-texans': 'houston-texans',
  'indianapolis-colts': 'indianapolis-colts',
  'jacksonville-jaguars': 'jacksonville-jaguars',
  'kansas-city-chiefs': 'kansas-city-chiefs',
  'las-vegas-raiders': 'las-vegas-raiders',
  'los-angeles-chargers': 'los-angeles-chargers',
  'los-angeles-rams': 'los-angeles-rams',
  'miami-dolphins': 'miami-dolphins',
  'minnesota-vikings': 'minnesota-vikings',
  'new-england-patriots': 'new-england-patriots',
  'new-orleans-saints': 'new-orleans-saints',
  'new-york-giants': 'new-york-giants',
  'new-york-jets': 'new-york-jets',
  'philadelphia-eagles': 'philadelphia-eagles',
  'pittsburgh-steelers': 'pittsburgh-steelers',
  'san-francisco-49ers': 'san-francisco-49ers',
  'seattle-seahawks': 'seattle-seahawks',
  'tampa-bay-buccaneers': 'tampa-bay-buccaneers',
  'tennessee-titans': 'tennessee-titans',
  'washington-commanders': 'washington-commanders',
};

// Sample standings data for 2025 season (fallback - will be replaced by API data)
const sampleStandingsData: StandingData[] = [
  // AFC East
  { teamId: 'buffalo-bills', teamName: 'Buffalo Bills', conference: 'AFC', division: 'AFC East', wins: 13, losses: 3, ties: 0, winPct: 0.813, gamesBack: 0, homeRecord: '7-1', awayRecord: '6-2', confRecord: '9-2', divRecord: '5-1', streak: 'W3', last10: '8-2' },
  { teamId: 'miami-dolphins', teamName: 'Miami Dolphins', conference: 'AFC', division: 'AFC East', wins: 11, losses: 5, ties: 0, winPct: 0.688, gamesBack: 2, homeRecord: '6-2', awayRecord: '5-3', confRecord: '7-4', divRecord: '4-2', streak: 'W2', last10: '7-3' },
  { teamId: 'new-york-jets', teamName: 'New York Jets', conference: 'AFC', division: 'AFC East', wins: 7, losses: 9, ties: 0, winPct: 0.438, gamesBack: 6, homeRecord: '4-4', awayRecord: '3-5', confRecord: '5-6', divRecord: '2-4', streak: 'L2', last10: '4-6' },
  { teamId: 'new-england-patriots', teamName: 'New England Patriots', conference: 'AFC', division: 'AFC East', wins: 4, losses: 12, ties: 0, winPct: 0.250, gamesBack: 9, homeRecord: '3-5', awayRecord: '1-7', confRecord: '3-8', divRecord: '1-5', streak: 'L4', last10: '2-8' },

  // AFC North
  { teamId: 'baltimore-ravens', teamName: 'Baltimore Ravens', conference: 'AFC', division: 'AFC North', wins: 12, losses: 4, ties: 0, winPct: 0.750, gamesBack: 0, homeRecord: '6-2', awayRecord: '6-2', confRecord: '8-3', divRecord: '4-2', streak: 'W2', last10: '7-3' },
  { teamId: 'pittsburgh-steelers', teamName: 'Pittsburgh Steelers', conference: 'AFC', division: 'AFC North', wins: 10, losses: 6, ties: 0, winPct: 0.625, gamesBack: 2, homeRecord: '6-2', awayRecord: '4-4', confRecord: '7-4', divRecord: '3-3', streak: 'W1', last10: '6-4' },
  { teamId: 'cincinnati-bengals', teamName: 'Cincinnati Bengals', conference: 'AFC', division: 'AFC North', wins: 9, losses: 7, ties: 0, winPct: 0.563, gamesBack: 3, homeRecord: '5-3', awayRecord: '4-4', confRecord: '6-5', divRecord: '3-3', streak: 'L1', last10: '5-5' },
  { teamId: 'cleveland-browns', teamName: 'Cleveland Browns', conference: 'AFC', division: 'AFC North', wins: 5, losses: 11, ties: 0, winPct: 0.313, gamesBack: 7, homeRecord: '3-5', awayRecord: '2-6', confRecord: '4-7', divRecord: '2-4', streak: 'L3', last10: '3-7' },

  // AFC South
  { teamId: 'houston-texans', teamName: 'Houston Texans', conference: 'AFC', division: 'AFC South', wins: 11, losses: 5, ties: 0, winPct: 0.688, gamesBack: 0, homeRecord: '6-2', awayRecord: '5-3', confRecord: '8-3', divRecord: '4-2', streak: 'W1', last10: '7-3' },
  { teamId: 'jacksonville-jaguars', teamName: 'Jacksonville Jaguars', conference: 'AFC', division: 'AFC South', wins: 8, losses: 8, ties: 0, winPct: 0.500, gamesBack: 3, homeRecord: '5-3', awayRecord: '3-5', confRecord: '6-5', divRecord: '3-3', streak: 'L1', last10: '5-5' },
  { teamId: 'indianapolis-colts', teamName: 'Indianapolis Colts', conference: 'AFC', division: 'AFC South', wins: 8, losses: 8, ties: 0, winPct: 0.500, gamesBack: 3, homeRecord: '4-4', awayRecord: '4-4', confRecord: '5-6', divRecord: '2-4', streak: 'W2', last10: '6-4' },
  { teamId: 'tennessee-titans', teamName: 'Tennessee Titans', conference: 'AFC', division: 'AFC South', wins: 6, losses: 10, ties: 0, winPct: 0.375, gamesBack: 5, homeRecord: '4-4', awayRecord: '2-6', confRecord: '4-7', divRecord: '2-4', streak: 'L2', last10: '4-6' },

  // AFC West
  { teamId: 'kansas-city-chiefs', teamName: 'Kansas City Chiefs', conference: 'AFC', division: 'AFC West', wins: 14, losses: 2, ties: 0, winPct: 0.875, gamesBack: 0, homeRecord: '7-1', awayRecord: '7-1', confRecord: '10-1', divRecord: '5-1', streak: 'W4', last10: '9-1' },
  { teamId: 'los-angeles-chargers', teamName: 'Los Angeles Chargers', conference: 'AFC', division: 'AFC West', wins: 10, losses: 6, ties: 0, winPct: 0.625, gamesBack: 4, homeRecord: '6-2', awayRecord: '4-4', confRecord: '7-4', divRecord: '3-3', streak: 'W1', last10: '6-4' },
  { teamId: 'denver-broncos', teamName: 'Denver Broncos', conference: 'AFC', division: 'AFC West', wins: 9, losses: 7, ties: 0, winPct: 0.563, gamesBack: 5, homeRecord: '5-3', awayRecord: '4-4', confRecord: '6-5', divRecord: '2-4', streak: 'L1', last10: '5-5' },
  { teamId: 'las-vegas-raiders', teamName: 'Las Vegas Raiders', conference: 'AFC', division: 'AFC West', wins: 3, losses: 13, ties: 0, winPct: 0.188, gamesBack: 11, homeRecord: '2-6', awayRecord: '1-7', confRecord: '2-9', divRecord: '1-5', streak: 'L5', last10: '1-9' },

  // NFC East
  { teamId: 'philadelphia-eagles', teamName: 'Philadelphia Eagles', conference: 'NFC', division: 'NFC East', wins: 13, losses: 3, ties: 0, winPct: 0.813, gamesBack: 0, homeRecord: '7-1', awayRecord: '6-2', confRecord: '9-2', divRecord: '5-1', streak: 'W3', last10: '8-2' },
  { teamId: 'washington-commanders', teamName: 'Washington Commanders', conference: 'NFC', division: 'NFC East', wins: 11, losses: 5, ties: 0, winPct: 0.688, gamesBack: 2, homeRecord: '6-2', awayRecord: '5-3', confRecord: '7-4', divRecord: '4-2', streak: 'W2', last10: '7-3' },
  { teamId: 'dallas-cowboys', teamName: 'Dallas Cowboys', conference: 'NFC', division: 'NFC East', wins: 7, losses: 9, ties: 0, winPct: 0.438, gamesBack: 6, homeRecord: '4-4', awayRecord: '3-5', confRecord: '5-6', divRecord: '2-4', streak: 'L2', last10: '4-6' },
  { teamId: 'new-york-giants', teamName: 'New York Giants', conference: 'NFC', division: 'NFC East', wins: 3, losses: 13, ties: 0, winPct: 0.188, gamesBack: 10, homeRecord: '2-6', awayRecord: '1-7', confRecord: '2-9', divRecord: '1-5', streak: 'L6', last10: '1-9' },

  // NFC North
  { teamId: 'detroit-lions', teamName: 'Detroit Lions', conference: 'NFC', division: 'NFC North', wins: 14, losses: 2, ties: 0, winPct: 0.875, gamesBack: 0, homeRecord: '8-0', awayRecord: '6-2', confRecord: '10-1', divRecord: '5-1', streak: 'W5', last10: '9-1' },
  { teamId: 'minnesota-vikings', teamName: 'Minnesota Vikings', conference: 'NFC', division: 'NFC North', wins: 13, losses: 3, ties: 0, winPct: 0.813, gamesBack: 1, homeRecord: '7-1', awayRecord: '6-2', confRecord: '9-2', divRecord: '4-2', streak: 'W3', last10: '8-2' },
  { teamId: 'green-bay-packers', teamName: 'Green Bay Packers', conference: 'NFC', division: 'NFC North', wins: 11, losses: 5, ties: 0, winPct: 0.688, gamesBack: 3, homeRecord: '6-2', awayRecord: '5-3', confRecord: '8-3', divRecord: '3-3', streak: 'W2', last10: '7-3' },
  { teamId: 'chicago-bears', teamName: 'Chicago Bears', conference: 'NFC', division: 'NFC North', wins: 4, losses: 12, ties: 0, winPct: 0.250, gamesBack: 10, homeRecord: '3-5', awayRecord: '1-7', confRecord: '3-8', divRecord: '1-5', streak: 'L4', last10: '2-8' },

  // NFC South
  { teamId: 'tampa-bay-buccaneers', teamName: 'Tampa Bay Buccaneers', conference: 'NFC', division: 'NFC South', wins: 9, losses: 7, ties: 0, winPct: 0.563, gamesBack: 0, homeRecord: '5-3', awayRecord: '4-4', confRecord: '7-4', divRecord: '4-2', streak: 'W1', last10: '6-4' },
  { teamId: 'atlanta-falcons', teamName: 'Atlanta Falcons', conference: 'NFC', division: 'NFC South', wins: 8, losses: 8, ties: 0, winPct: 0.500, gamesBack: 1, homeRecord: '5-3', awayRecord: '3-5', confRecord: '6-5', divRecord: '3-3', streak: 'L1', last10: '5-5' },
  { teamId: 'new-orleans-saints', teamName: 'New Orleans Saints', conference: 'NFC', division: 'NFC South', wins: 5, losses: 11, ties: 0, winPct: 0.313, gamesBack: 4, homeRecord: '3-5', awayRecord: '2-6', confRecord: '4-7', divRecord: '2-4', streak: 'L3', last10: '3-7' },
  { teamId: 'carolina-panthers', teamName: 'Carolina Panthers', conference: 'NFC', division: 'NFC South', wins: 4, losses: 12, ties: 0, winPct: 0.250, gamesBack: 5, homeRecord: '2-6', awayRecord: '2-6', confRecord: '3-8', divRecord: '1-5', streak: 'L2', last10: '3-7' },

  // NFC West
  { teamId: 'los-angeles-rams', teamName: 'Los Angeles Rams', conference: 'NFC', division: 'NFC West', wins: 10, losses: 6, ties: 0, winPct: 0.625, gamesBack: 0, homeRecord: '6-2', awayRecord: '4-4', confRecord: '7-4', divRecord: '4-2', streak: 'W2', last10: '6-4' },
  { teamId: 'seattle-seahawks', teamName: 'Seattle Seahawks', conference: 'NFC', division: 'NFC West', wins: 9, losses: 7, ties: 0, winPct: 0.563, gamesBack: 1, homeRecord: '5-3', awayRecord: '4-4', confRecord: '6-5', divRecord: '3-3', streak: 'W1', last10: '6-4' },
  { teamId: 'arizona-cardinals', teamName: 'Arizona Cardinals', conference: 'NFC', division: 'NFC West', wins: 7, losses: 9, ties: 0, winPct: 0.438, gamesBack: 3, homeRecord: '4-4', awayRecord: '3-5', confRecord: '5-6', divRecord: '2-4', streak: 'L2', last10: '4-6' },
  { teamId: 'san-francisco-49ers', teamName: 'San Francisco 49ers', conference: 'NFC', division: 'NFC West', wins: 6, losses: 10, ties: 0, winPct: 0.375, gamesBack: 4, homeRecord: '3-5', awayRecord: '3-5', confRecord: '4-7', divRecord: '2-4', streak: 'L1', last10: '4-6' },
];

type SortKey = 'wins' | 'losses' | 'winPct' | 'gamesBack' | 'confRecord' | 'divRecord' | 'streak' | 'last10';

// Calculate Games Back for each team based on their division leader
function calculateGamesBack(standings: StandingData[]): StandingData[] {
  // Group teams by division
  const divisionGroups: Record<string, StandingData[]> = {};

  standings.forEach(team => {
    if (!divisionGroups[team.division]) {
      divisionGroups[team.division] = [];
    }
    divisionGroups[team.division].push(team);
  });

  // Calculate games back for each division
  const updatedStandings: StandingData[] = [];

  Object.keys(divisionGroups).forEach(division => {
    const divisionTeams = divisionGroups[division];

    // Sort by wins (descending) to find division leader
    const sortedTeams = [...divisionTeams].sort((a, b) => {
      // Primary: wins
      if (b.wins !== a.wins) return b.wins - a.wins;
      // Tiebreaker: losses (fewer is better)
      if (a.losses !== b.losses) return a.losses - b.losses;
      // Tiebreaker: win percentage
      return b.winPct - a.winPct;
    });

    const leader = sortedTeams[0];

    // Calculate games back for each team
    sortedTeams.forEach(team => {
      if (team.teamId === leader.teamId) {
        // Leader has 0 games back
        team.gamesBack = 0;
      } else {
        // GB = ((Leader Wins - Team Wins) + (Team Losses - Leader Losses)) / 2
        const gb = ((leader.wins - team.wins) + (team.losses - leader.losses)) / 2;
        team.gamesBack = gb;
      }
      updatedStandings.push(team);
    });
  });

  return updatedStandings;
}

export default function StandingsClient() {
  const [conferenceView, setConferenceView] = useState<'all' | 'conference' | 'AFC' | 'NFC'>('all');
  const [sortKey, setSortKey] = useState<SortKey>('wins');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [standingsData, setStandingsData] = useState<StandingData[]>(sampleStandingsData);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allTeams = getAllTeams();

  // Fetch standings from API - only runs once on mount
  useEffect(() => {
    // Prevent re-fetching if already loaded
    if (hasLoaded) return;

    async function fetchStandings() {
      try {
        setIsLoading(true);
        setError(null);

        // Use getApiPath for proper basePath handling
        const { getApiPath } = await import('@/utils/api');
        const response = await fetch(getApiPath('nfl/teams/api/standings?season=2025'));

        if (!response.ok) {
          throw new Error('Failed to fetch standings');
        }

        const data = await response.json();

        // Transform API data to our format
        const transformedData: StandingData[] = [];
        const teams = getAllTeams();

        if (data.standings && Array.isArray(data.standings)) {
          for (const team of data.standings) {
            transformedData.push({
              teamId: team.teamId,
              teamName: team.fullName,
              conference: team.conference as 'AFC' | 'NFC',
              division: team.division,
              wins: team.record.wins,
              losses: team.record.losses,
              ties: team.record.ties,
              winPct: team.winPercentage,
              gamesBack: 0, // Calculate this if needed
              homeRecord: team.homeRecord || '0-0',
              awayRecord: team.awayRecord || '0-0',
              confRecord: team.confRecord || '0-0',
              divRecord: team.divRecord || '0-0',
              streak: team.streak || '-',
              last10: team.last10 || '0-0',
            });
          }
        }

        if (transformedData.length > 0) {
          // Calculate Games Back for each team by division
          const dataWithGamesBack = calculateGamesBack(transformedData);
          setStandingsData(dataWithGamesBack);
        } else {
          // If no data, keep using sample data
          console.warn('No standings data received from API, using sample data');
        }

      } catch (err) {
        console.error('Error fetching standings:', err);
        setError(err instanceof Error ? err.message : 'Failed to load standings');
        // Keep using sample data on error
      } finally {
        setIsLoading(false);
        setHasLoaded(true);
      }
    }

    fetchStandings();
  }, [hasLoaded]);

  const getTeamInfo = (teamName: string) => {
    const team = allTeams.find(t => t.fullName === teamName || t.name === teamName);
    if (team) {
      return { abbreviation: team.abbreviation, logoUrl: team.logoUrl, primaryColor: team.primaryColor };
    }
    return null;
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('desc');
    }
  };

  const parseRecord = (record: string): number => {
    const [wins] = record.split('-').map(Number);
    return wins;
  };

  const filteredAndSortedData = useMemo(() => {
    let filtered = standingsData;

    // For 'all', show all teams. For 'conference', show all teams but grouped by conference
    // For 'AFC' or 'NFC', filter to that conference only
    if (conferenceView === 'AFC' || conferenceView === 'NFC') {
      filtered = filtered.filter(team => team.conference === conferenceView);
    }

    const sorted = [...filtered].sort((a, b) => {
      let aValue: number | string = a[sortKey];
      let bValue: number | string = b[sortKey];

      // Handle string-based records
      if (sortKey === 'confRecord' || sortKey === 'divRecord' || sortKey === 'last10') {
        aValue = parseRecord(aValue as string);
        bValue = parseRecord(bValue as string);
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'desc' ? bValue - aValue : aValue - bValue;
      }

      return 0;
    });

    return sorted;
  }, [standingsData, conferenceView, sortKey, sortDirection]);

  const afcTeams = filteredAndSortedData.filter(team => team.conference === 'AFC');
  const nfcTeams = filteredAndSortedData.filter(team => team.conference === 'NFC');

  // Calculate playoff picture
  const getPlayoffPicture = (conferenceTeams: StandingData[]) => {
    // Get division winners (top team from each division)
    const divisions = ['East', 'North', 'South', 'West'];
    const conference = conferenceTeams[0]?.conference || 'AFC';

    const divisionWinners: StandingData[] = [];
    divisions.forEach(div => {
      const divisionName = `${conference} ${div}`;
      const divTeams = conferenceTeams.filter(t => t.division === divisionName);
      if (divTeams.length > 0) {
        // Manual override for NFC South - Carolina is the actual division winner
        if (divisionName === 'NFC South') {
          const carolina = divTeams.find(t => t.teamId === 'carolina-panthers');
          if (carolina) {
            divisionWinners.push(carolina);
            return;
          }
        }

        // Sort by wins, then by conference record, then by win percentage
        const sorted = [...divTeams].sort((a, b) => {
          if (b.wins !== a.wins) return b.wins - a.wins;
          // Parse conference record for tiebreaker
          const aConfWins = parseInt((a.confRecord || '0-0').split('-')[0]);
          const bConfWins = parseInt((b.confRecord || '0-0').split('-')[0]);
          if (bConfWins !== aConfWins) return bConfWins - aConfWins;
          return b.winPct - a.winPct;
        });
        divisionWinners.push(sorted[0]);
      }
    });

    // Sort division winners by record with tiebreakers (seeds 1-4)
    const seededDivisionWinners = [...divisionWinners].sort((a, b) => {
      // Manual tiebreaker overrides based on NFL rules
      // AFC: DEN beats NE (both 14-3) - DEN wins on common games
      if (conference === 'AFC' && a.wins === 14 && b.wins === 14) {
        if (a.teamId === 'denver-broncos' && b.teamId === 'new-england-patriots') return -1;
        if (a.teamId === 'new-england-patriots' && b.teamId === 'denver-broncos') return 1;
      }
      // NFC: CHI beats PHI (both 11-6) - CHI wins on head-to-head
      if (conference === 'NFC' && a.wins === 11 && b.wins === 11) {
        if (a.teamId === 'chicago-bears' && b.teamId === 'philadelphia-eagles') return -1;
        if (a.teamId === 'philadelphia-eagles' && b.teamId === 'chicago-bears') return 1;
      }

      if (b.wins !== a.wins) return b.wins - a.wins;
      // Use conference record as tiebreaker
      const aConfWins = parseInt((a.confRecord || '0-0').split('-')[0]);
      const bConfWins = parseInt((b.confRecord || '0-0').split('-')[0]);
      if (bConfWins !== aConfWins) return bConfWins - aConfWins;
      // Use division record as secondary tiebreaker
      const aDivWins = parseInt((a.divRecord || '0-0').split('-')[0]);
      const bDivWins = parseInt((b.divRecord || '0-0').split('-')[0]);
      if (bDivWins !== aDivWins) return bDivWins - aDivWins;
      return b.winPct - a.winPct;
    });

    // Get wild card teams (best 3 non-division winners)
    const nonDivisionWinners = conferenceTeams.filter(
      team => !divisionWinners.some(dw => dw.teamId === team.teamId)
    );
    const wildCardTeams = [...nonDivisionWinners]
      .sort((a, b) => {
        // Manual tiebreaker overrides for wild card teams
        // AFC: HOU beats BUF (both 12-5) - HOU wins on head-to-head
        if (conference === 'AFC' && a.wins === 12 && b.wins === 12) {
          if (a.teamId === 'houston-texans' && b.teamId === 'buffalo-bills') return -1;
          if (a.teamId === 'buffalo-bills' && b.teamId === 'houston-texans') return 1;
        }
        // NFC: LAR beats SF (both 12-5) - LAR wins on common games
        if (conference === 'NFC' && a.wins === 12 && b.wins === 12) {
          if (a.teamId === 'los-angeles-rams' && b.teamId === 'san-francisco-49ers') return -1;
          if (a.teamId === 'san-francisco-49ers' && b.teamId === 'los-angeles-rams') return 1;
        }

        if (b.wins !== a.wins) return b.wins - a.wins;
        // Use conference record as tiebreaker
        const aConfWins = parseInt((a.confRecord || '0-0').split('-')[0]);
        const bConfWins = parseInt((b.confRecord || '0-0').split('-')[0]);
        if (bConfWins !== aConfWins) return bConfWins - aConfWins;
        // Use division record as secondary tiebreaker
        const aDivWins = parseInt((a.divRecord || '0-0').split('-')[0]);
        const bDivWins = parseInt((b.divRecord || '0-0').split('-')[0]);
        if (bDivWins !== aDivWins) return bDivWins - aDivWins;
        return b.winPct - a.winPct;
      })
      .slice(0, 3);

    return {
      divisionWinners: seededDivisionWinners,
      wildCardTeams
    };
  };

  const afcPlayoffs = getPlayoffPicture(afcTeams);
  const nfcPlayoffs = getPlayoffPicture(nfcTeams);

  // Group teams by division
  const afcEastTeams = afcTeams.filter(team => team.division === 'AFC East');
  const afcNorthTeams = afcTeams.filter(team => team.division === 'AFC North');
  const afcSouthTeams = afcTeams.filter(team => team.division === 'AFC South');
  const afcWestTeams = afcTeams.filter(team => team.division === 'AFC West');

  const nfcEastTeams = nfcTeams.filter(team => team.division === 'NFC East');
  const nfcNorthTeams = nfcTeams.filter(team => team.division === 'NFC North');
  const nfcSouthTeams = nfcTeams.filter(team => team.division === 'NFC South');
  const nfcWestTeams = nfcTeams.filter(team => team.division === 'NFC West');

  const SortIndicator = ({ column }: { column: SortKey }) => {
    if (sortKey !== column) {
      return (
        <svg className="w-4 h-4 text-white opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }

    return sortDirection === 'desc' ? (
      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    );
  };

  const StandingsTable = ({ teams, conferenceName }: { teams: StandingData[], conferenceName?: string }) => (
    <div className="mb-8">
      {conferenceName && <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">{conferenceName}</h2>}

      {/* Mobile Card Layout - Hidden on md+ */}
      <div className="block md:hidden space-y-4">
        {teams.map((team, index) => {
          const teamInfo = getTeamInfo(team.teamName);
          return (
            <div key={team.teamId} className="bg-white rounded-lg border border-gray-200 p-4">
              {/* Team header with logo/name */}
              <Link href={`/teams/${team.teamId}`} className="flex items-center gap-3 mb-3">
                <span className="text-lg font-bold text-gray-900">#{index + 1}</span>
                {teamInfo && (
                  <>
                    <img src={teamInfo.logoUrl} alt={teamInfo.abbreviation} className="w-8 h-8" />
                    <div className="flex-1">
                      <div className="font-bold text-gray-900">{teamInfo.abbreviation}</div>
                      <div className="text-sm text-gray-600">{getAllTeams().find(t => t.id === team.teamId)?.name}</div>
                    </div>
                  </>
                )}
              </Link>

              {/* Key stats in 3-column grid */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-gray-50 p-2 rounded">
                  <div className="text-xs text-gray-600">Record</div>
                  <div className="font-bold text-gray-900">{team.wins}-{team.losses}-{team.ties}</div>
                </div>
                <div className="bg-gray-50 p-2 rounded">
                  <div className="text-xs text-gray-600">Win %</div>
                  <div className="font-bold text-gray-900">{team.winPct.toFixed(3)}</div>
                </div>
                <div className="bg-gray-50 p-2 rounded">
                  <div className="text-xs text-gray-600">GB</div>
                  <div className="font-bold text-gray-900">{team.gamesBack === 0 ? '-' : team.gamesBack.toFixed(1)}</div>
                </div>
              </div>

              {/* Secondary stats in 4-column grid */}
              <div className="grid grid-cols-4 gap-2 mt-2">
                <div className="text-center">
                  <div className="text-[10px] text-gray-600">HOME</div>
                  <div className="text-xs font-semibold text-gray-900">{team.homeRecord}</div>
                </div>
                <div className="text-center">
                  <div className="text-[10px] text-gray-600">AWAY</div>
                  <div className="text-xs font-semibold text-gray-900">{team.awayRecord}</div>
                </div>
                <div className="text-center">
                  <div className="text-[10px] text-gray-600">STREAK</div>
                  <div className={`text-xs font-semibold ${team.streak.startsWith('W') ? 'text-green-600' : 'text-red-600'}`}>
                    {team.streak}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-[10px] text-gray-600">L10</div>
                  <div className="text-xs font-semibold text-gray-900">{team.last10}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop Table - Hidden on mobile */}
      <div className="hidden md:block overflow-x-auto -mx-4 sm:mx-0">
        <table className="min-w-[900px] w-full bg-white rounded-lg overflow-hidden shadow-sm">
          <thead style={{ backgroundColor: '#0050A0' }}>
            <tr>
              <th className="pl-4 sm:pl-6 pr-2 sm:pr-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-bold text-white w-10 sm:w-12">#</th>
              <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-bold text-white">Team</th>
              <th
                className="px-2 sm:px-4 py-2 sm:py-3 text-center text-xs sm:text-sm font-bold text-white cursor-pointer hover:bg-[#003d7a] transition-colors"
                onClick={() => handleSort('wins')}
              >
                <div className="flex items-center justify-center gap-1 sm:gap-2">
                  W
                  <SortIndicator column="wins" />
                </div>
              </th>
              <th
                className="px-2 sm:px-4 py-2 sm:py-3 text-center text-xs sm:text-sm font-bold text-white cursor-pointer hover:bg-[#003d7a] transition-colors"
                onClick={() => handleSort('losses')}
              >
                <div className="flex items-center justify-center gap-1 sm:gap-2">
                  L
                  <SortIndicator column="losses" />
                </div>
              </th>
              <th className="px-2 sm:px-4 py-2 sm:py-3 text-center text-xs sm:text-sm font-bold text-white">T</th>
              <th
                className="px-2 sm:px-4 py-2 sm:py-3 text-center text-xs sm:text-sm font-bold text-white cursor-pointer hover:bg-[#003d7a] transition-colors"
                onClick={() => handleSort('winPct')}
              >
                <div className="flex items-center justify-center gap-1 sm:gap-2">
                  Win%
                  <SortIndicator column="winPct" />
                </div>
              </th>
              <th
                className="px-2 sm:px-4 py-2 sm:py-3 text-center text-xs sm:text-sm font-bold text-white cursor-pointer hover:bg-[#003d7a] transition-colors"
                onClick={() => handleSort('gamesBack')}
              >
                <div className="flex items-center justify-center gap-1 sm:gap-2">
                  GB
                  <SortIndicator column="gamesBack" />
                </div>
              </th>
              <th className="px-2 sm:px-4 py-2 sm:py-3 text-center text-xs sm:text-sm font-bold text-white">Home</th>
              <th className="px-2 sm:px-4 py-2 sm:py-3 text-center text-xs sm:text-sm font-bold text-white">Away</th>
              <th
                className="px-2 sm:px-4 py-2 sm:py-3 text-center text-xs sm:text-sm font-bold text-white cursor-pointer hover:bg-[#003d7a] transition-colors"
                onClick={() => handleSort('confRecord')}
              >
                <div className="flex items-center justify-center gap-1 sm:gap-2">
                  Conf
                  <SortIndicator column="confRecord" />
                </div>
              </th>
              <th
                className="px-2 sm:px-4 py-2 sm:py-3 text-center text-xs sm:text-sm font-bold text-white cursor-pointer hover:bg-[#003d7a] transition-colors"
                onClick={() => handleSort('divRecord')}
              >
                <div className="flex items-center justify-center gap-1 sm:gap-2">
                  Div
                  <SortIndicator column="divRecord" />
                </div>
              </th>
              <th className="px-2 sm:px-4 py-2 sm:py-3 text-center text-xs sm:text-sm font-bold text-white">Streak</th>
              <th
                className="px-2 sm:px-4 py-2 sm:py-3 text-center text-xs sm:text-sm font-bold text-white cursor-pointer hover:bg-[#003d7a] transition-colors"
                onClick={() => handleSort('last10')}
              >
                <div className="flex items-center justify-center gap-1 sm:gap-2">
                  L10
                  <SortIndicator column="last10" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {teams.map((team, index) => {
              const teamInfo = getTeamInfo(team.teamName);
              return (
                <tr key={team.teamId} className="hover:bg-gray-50 transition-colors">
                  <td className="pl-4 sm:pl-6 pr-2 sm:pr-4 py-3 sm:py-4 text-sm sm:text-base text-gray-900 font-semibold">{index + 1}</td>
                  <td className="px-2 sm:px-4 py-3 sm:py-4">
                    <Link href={`/teams/${team.teamId}`} className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity">
                      {teamInfo && (
                        <>
                          <img
                            src={teamInfo.logoUrl}
                            alt={teamInfo.abbreviation}
                            width={32}
                            height={32}
                            className="w-6 h-6 sm:w-8 sm:h-8"
                          />
                          <div className="flex flex-col">
                            <span className="text-sm sm:text-base font-bold text-gray-900 leading-tight">{teamInfo.abbreviation}</span>
                            <span className="text-xs sm:text-sm text-gray-600 leading-tight">{getAllTeams().find(t => t.id === team.teamId)?.name}</span>
                          </div>
                        </>
                      )}
                    </Link>
                  </td>
                  <td className="px-2 sm:px-4 py-3 sm:py-4 text-center text-sm sm:text-base text-gray-900 font-semibold">{team.wins}</td>
                  <td className="px-2 sm:px-4 py-3 sm:py-4 text-center text-sm sm:text-base text-gray-900">{team.losses}</td>
                  <td className="px-2 sm:px-4 py-3 sm:py-4 text-center text-sm sm:text-base text-gray-900">{team.ties}</td>
                  <td className="px-2 sm:px-4 py-3 sm:py-4 text-center text-sm sm:text-base text-gray-900">{team.winPct.toFixed(3)}</td>
                  <td className="px-2 sm:px-4 py-3 sm:py-4 text-center text-sm sm:text-base text-gray-900">
                    {team.gamesBack === 0 ? '-' : team.gamesBack.toFixed(1)}
                  </td>
                  <td className="px-2 sm:px-4 py-3 sm:py-4 text-center text-sm sm:text-base text-gray-600">{team.homeRecord}</td>
                  <td className="px-2 sm:px-4 py-3 sm:py-4 text-center text-sm sm:text-base text-gray-600">{team.awayRecord}</td>
                  <td className="px-2 sm:px-4 py-3 sm:py-4 text-center text-sm sm:text-base text-gray-600">{team.confRecord}</td>
                  <td className="px-2 sm:px-4 py-3 sm:py-4 text-center text-sm sm:text-base text-gray-600">{team.divRecord}</td>
                  <td className="px-2 sm:px-4 py-3 sm:py-4 text-center text-sm sm:text-base">
                    <span className={`font-semibold ${team.streak.startsWith('W') ? 'text-green-600' : 'text-red-600'}`}>
                      {team.streak}
                    </span>
                  </td>
                  <td className="px-2 sm:px-4 py-3 sm:py-4 text-center text-sm sm:text-base text-gray-600">{team.last10}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <div className="fixed top-0 left-0 w-64 h-screen z-10">
          <NFLTeamsSidebar />
        </div>
      </div>

      {/* Mobile sidebar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-20">
        <NFLTeamsSidebar isMobile={true} />
      </div>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 min-w-0">
        {/* Header */}
        <div className="bg-[#0050A0] text-white pt-[57px] lg:pt-0 pb-4 lg:pb-6">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-4 lg:pt-10">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-3">
              NFL Standings
            </h1>
            <p className="text-base sm:text-lg lg:text-xl xl:text-2xl opacity-90">
              Live standings and playoff race for all 32 teams
            </p>
          </div>
        </div>

        {/* Raptive Header Ad */}
        <div className="container mx-auto px-4 min-h-[150px]">
          <div className="raptive-pfn-header"></div>
        </div>

        {/* Content */}
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
          {/* Error State */}
          {error && !isLoading && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h3 className="text-red-800 font-semibold mb-1">Failed to load live standings</h3>
                  <p className="text-red-600 text-sm">{error}</p>
                  <p className="text-red-600 text-sm mt-2">Showing sample data instead.</p>
                </div>
              </div>
            </div>
          )}

          {/* Conference Filter */}
          <div className="mb-6">
            <div className="inline-flex flex-wrap sm:flex-nowrap rounded-lg border border-gray-300 bg-white p-1 gap-1 sm:gap-0">
              <button
                onClick={() => setConferenceView('all')}
                className={`px-3 sm:px-4 md:px-6 py-2 rounded-md text-xs sm:text-sm font-semibold transition-colors min-h-[44px] flex items-center justify-center ${
                  conferenceView === 'all'
                    ? 'bg-[#0050A0] text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                All Teams
              </button>
              <button
                onClick={() => setConferenceView('conference')}
                className={`px-3 sm:px-4 md:px-6 py-2 rounded-md text-xs sm:text-sm font-semibold transition-colors min-h-[44px] flex items-center justify-center ${
                  conferenceView === 'conference'
                    ? 'bg-[#0050A0] text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Conference
              </button>
              <button
                onClick={() => setConferenceView('AFC')}
                className={`px-3 sm:px-4 md:px-6 py-2 rounded-md text-xs sm:text-sm font-semibold transition-colors min-h-[44px] flex items-center justify-center ${
                  conferenceView === 'AFC'
                    ? 'bg-[#0050A0] text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                AFC
              </button>
              <button
                onClick={() => setConferenceView('NFC')}
                className={`px-3 sm:px-4 md:px-6 py-2 rounded-md text-xs sm:text-sm font-semibold transition-colors min-h-[44px] flex items-center justify-center ${
                  conferenceView === 'NFC'
                    ? 'bg-[#0050A0] text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                NFC
              </button>
            </div>
          </div>

          {/* Playoff Picture */}
          {!isLoading && conferenceView === 'all' && (
            <div className="mb-8">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Playoff Picture</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* AFC Playoff Picture */}
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <span className="bg-red-100 text-red-700 px-3 py-1 rounded-md text-sm">AFC</span>
                    </h3>
                    <div className="space-y-3">
                      {/* Division Winners */}
                      <div>
                        <p className="text-xs font-bold text-gray-600 uppercase mb-2">Division Winners</p>
                        {afcPlayoffs.divisionWinners.map((team, idx) => {
                          const teamInfo = getTeamInfo(team.teamName);
                          return (
                            <div key={team.teamId} className="flex items-center gap-3 py-2 px-3 bg-green-50 rounded-lg mb-2 border border-green-200">
                              <span className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center font-bold text-sm">
                                {idx + 1}
                              </span>
                              {teamInfo && (
                                <img src={teamInfo.logoUrl} alt={teamInfo.abbreviation} className="w-6 h-6" />
                              )}
                              <div className="flex-1">
                                <span className="font-bold text-gray-900 text-sm">{teamInfo?.abbreviation}</span>
                                <span className="text-xs text-gray-600 ml-2">({team.wins}-{team.losses})</span>
                              </div>
                              <span className="text-xs text-green-700 font-semibold">{team.division.replace('AFC ', '')}</span>
                            </div>
                          );
                        })}
                      </div>
                      {/* Wild Card Teams */}
                      <div>
                        <p className="text-xs font-bold text-gray-600 uppercase mb-2">Wild Card</p>
                        {afcPlayoffs.wildCardTeams.map((team, idx) => {
                          const teamInfo = getTeamInfo(team.teamName);
                          return (
                            <div key={team.teamId} className="flex items-center gap-3 py-2 px-3 bg-blue-50 rounded-lg mb-2 border border-blue-200">
                              <span className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                                {idx + 5}
                              </span>
                              {teamInfo && (
                                <img src={teamInfo.logoUrl} alt={teamInfo.abbreviation} className="w-6 h-6" />
                              )}
                              <div className="flex-1">
                                <span className="font-bold text-gray-900 text-sm">{teamInfo?.abbreviation}</span>
                                <span className="text-xs text-gray-600 ml-2">({team.wins}-{team.losses})</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* NFC Playoff Picture */}
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-md text-sm">NFC</span>
                    </h3>
                    <div className="space-y-3">
                      {/* Division Winners */}
                      <div>
                        <p className="text-xs font-bold text-gray-600 uppercase mb-2">Division Winners</p>
                        {nfcPlayoffs.divisionWinners.map((team, idx) => {
                          const teamInfo = getTeamInfo(team.teamName);
                          return (
                            <div key={team.teamId} className="flex items-center gap-3 py-2 px-3 bg-green-50 rounded-lg mb-2 border border-green-200">
                              <span className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center font-bold text-sm">
                                {idx + 1}
                              </span>
                              {teamInfo && (
                                <img src={teamInfo.logoUrl} alt={teamInfo.abbreviation} className="w-6 h-6" />
                              )}
                              <div className="flex-1">
                                <span className="font-bold text-gray-900 text-sm">{teamInfo?.abbreviation}</span>
                                <span className="text-xs text-gray-600 ml-2">({team.wins}-{team.losses})</span>
                              </div>
                              <span className="text-xs text-green-700 font-semibold">{team.division.replace('NFC ', '')}</span>
                            </div>
                          );
                        })}
                      </div>
                      {/* Wild Card Teams */}
                      <div>
                        <p className="text-xs font-bold text-gray-600 uppercase mb-2">Wild Card</p>
                        {nfcPlayoffs.wildCardTeams.map((team, idx) => {
                          const teamInfo = getTeamInfo(team.teamName);
                          return (
                            <div key={team.teamId} className="flex items-center gap-3 py-2 px-3 bg-blue-50 rounded-lg mb-2 border border-blue-200">
                              <span className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                                {idx + 5}
                              </span>
                              {teamInfo && (
                                <img src={teamInfo.logoUrl} alt={teamInfo.abbreviation} className="w-6 h-6" />
                              )}
                              <div className="flex-1">
                                <span className="font-bold text-gray-900 text-sm">{teamInfo?.abbreviation}</span>
                                <span className="text-xs text-gray-600 ml-2">({team.wins}-{team.losses})</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Standings Tables */}
          {isLoading ? (
            <SkeletonLoader type="table" rows={32} />
          ) : (
            <>
              {conferenceView === 'all' ? (
                // All Teams - Single combined table sorted by record
                <StandingsTable teams={filteredAndSortedData} />
              ) : conferenceView === 'conference' ? (
                // Conference - Split by AFC and NFC
                <>
                  <StandingsTable teams={afcTeams} conferenceName="AFC" />
                  <StandingsTable teams={nfcTeams} conferenceName="NFC" />
                </>
              ) : conferenceView === 'AFC' ? (
                // AFC - Split by divisions
                <>
                  <StandingsTable teams={afcEastTeams} conferenceName="AFC East" />
                  <StandingsTable teams={afcNorthTeams} conferenceName="AFC North" />
                  <StandingsTable teams={afcSouthTeams} conferenceName="AFC South" />
                  <StandingsTable teams={afcWestTeams} conferenceName="AFC West" />
                </>
              ) : (
                // NFC - Split by divisions
                <>
                  <StandingsTable teams={nfcEastTeams} conferenceName="NFC East" />
                  <StandingsTable teams={nfcNorthTeams} conferenceName="NFC North" />
                  <StandingsTable teams={nfcSouthTeams} conferenceName="NFC South" />
                  <StandingsTable teams={nfcWestTeams} conferenceName="NFC West" />
                </>
              )}
            </>
          )}

          {/* Information Section */}
          <div className="mt-12 space-y-8">
            {/* What Are the NFL Standings? */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                What Are the NFL Standings?
              </h2>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed">
                  The NFL standings combine all 32 teams from both conferences into one comprehensive table. You can see how each team stacks up against every other team in the league. The table contains information on wins, losses, ties, win percentage, games back, home and away records, conference records, division records, current streaks, and last 10 games performance.
                </p>
                <p className="text-gray-700 leading-relaxed mt-4">
                  The standings are updated throughout the season, so you can track which teams are in playoff contention and which have clinched a playoff berth. The NFL playoff format includes seven teams from each conference: the four division winners are seeded 1-4 based on their record, while the remaining three spots go to the teams with the best records that didn't win their division (wild card teams).
                </p>
              </div>
            </div>

            {/* What Are the 2 Conferences? */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                What Are the 2 NFL Conferences?
              </h2>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed">
                  The two conferences in the NFL are the American Football Conference (AFC) and the National Football Conference (NFC). The conferences split the 32 NFL teams evenly, with each conference containing 16 teams split across four divisions. Each conference sends seven teams to the playoffs, with the conference champions meeting in the Super Bowl.
                </p>
              </div>
            </div>

            {/* What Are the 8 Divisions? */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                What Are the 8 NFL Divisions?
              </h2>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed mb-4">
                  There are eight divisions in the NFL, with four in each conference. Each division is organized geographically. In the AFC, the divisions are AFC East, AFC North, AFC South, and AFC West. In the NFC, the divisions are NFC East, NFC North, NFC South, and NFC West.
                </p>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Each division consists of four teams and features historic rivalries. Teams play division opponents twice per year (home and away), making divisional matchups some of the most important and intense games of the season. Winning your division guarantees a playoff spot and a home game in the wild card round.
                </p>
                <p className="text-gray-700 leading-relaxed mb-4">
                  <strong>The eight NFL divisions are:</strong>
                </p>
                <div className="space-y-3">
                  <p className="text-gray-700">
                    <strong>AFC East:</strong> Buffalo Bills, Miami Dolphins, New England Patriots, New York Jets
                  </p>
                  <p className="text-gray-700">
                    <strong>AFC North:</strong> Baltimore Ravens, Cincinnati Bengals, Cleveland Browns, Pittsburgh Steelers
                  </p>
                  <p className="text-gray-700">
                    <strong>AFC South:</strong> Houston Texans, Indianapolis Colts, Jacksonville Jaguars, Tennessee Titans
                  </p>
                  <p className="text-gray-700">
                    <strong>AFC West:</strong> Denver Broncos, Kansas City Chiefs, Las Vegas Raiders, Los Angeles Chargers
                  </p>
                  <p className="text-gray-700">
                    <strong>NFC East:</strong> Dallas Cowboys, New York Giants, Philadelphia Eagles, Washington Commanders
                  </p>
                  <p className="text-gray-700">
                    <strong>NFC North:</strong> Chicago Bears, Detroit Lions, Green Bay Packers, Minnesota Vikings
                  </p>
                  <p className="text-gray-700">
                    <strong>NFC South:</strong> Atlanta Falcons, Carolina Panthers, New Orleans Saints, Tampa Bay Buccaneers
                  </p>
                  <p className="text-gray-700">
                    <strong>NFC West:</strong> Arizona Cardinals, Los Angeles Rams, San Francisco 49ers, Seattle Seahawks
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
