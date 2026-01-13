'use client';

import { useState, useEffect } from 'react';
import { getAllTeams } from '@/data/teams';

interface Team {
  seed: number;
  name: string;
  teamId: string;
  score?: number;
  isWinner?: boolean;
}

interface Matchup {
  id: string;
  team1: Team | null;
  team2: Team | null;
  round: string;
  date?: string;
  completed?: boolean;
}

// Bracket progression mapping: matchupId -> { nextMatchup, slot }
// Note: Wild Card to Divisional uses reseeding logic (handled in useEffect)
const bracketProgression: { [key: string]: { nextMatchup: string; slot: 'team1' | 'team2' } } = {
  // AFC Divisional to Conference
  'afc-div-1': { nextMatchup: 'afc-conf', slot: 'team1' },
  'afc-div-2': { nextMatchup: 'afc-conf', slot: 'team2' },
  // NFC Divisional to Conference
  'nfc-div-1': { nextMatchup: 'nfc-conf', slot: 'team1' },
  'nfc-div-2': { nextMatchup: 'nfc-conf', slot: 'team2' },
  // Conference to Super Bowl
  'afc-conf': { nextMatchup: 'superbowl', slot: 'team1' },
  'nfc-conf': { nextMatchup: 'superbowl', slot: 'team2' },
};

// 2025-26 NFL Playoff data
const initialPlayoffData: { [key: string]: Matchup } = {
  // AFC Wild Card Round
  'afc-wc-1': {
    id: 'afc-wc-1',
    team1: { seed: 4, name: 'Steelers', teamId: 'pittsburgh-steelers', score: 6 },
    team2: { seed: 5, name: 'Texans', teamId: 'houston-texans', score: 30 },
    round: 'Wild Card',
    date: 'Mon, Jan 12',
    completed: true,
  },
  'afc-wc-2': {
    id: 'afc-wc-2',
    team1: { seed: 3, name: 'Jaguars', teamId: 'jacksonville-jaguars', score: 24 },
    team2: { seed: 6, name: 'Bills', teamId: 'buffalo-bills', score: 27 },
    round: 'Wild Card',
    date: 'Sun, Jan 11',
    completed: true,
  },
  'afc-wc-3': {
    id: 'afc-wc-3',
    team1: { seed: 2, name: 'Patriots', teamId: 'new-england-patriots', score: 16 },
    team2: { seed: 7, name: 'Chargers', teamId: 'los-angeles-chargers', score: 3 },
    round: 'Wild Card',
    date: 'Sun, Jan 11',
    completed: true,
  },
  // NFC Wild Card Round
  'nfc-wc-1': {
    id: 'nfc-wc-1',
    team1: { seed: 4, name: 'Panthers', teamId: 'carolina-panthers', score: 31 },
    team2: { seed: 5, name: 'Rams', teamId: 'los-angeles-rams', score: 34 },
    round: 'Wild Card',
    date: 'Sat, Jan 10',
    completed: true,
  },
  'nfc-wc-2': {
    id: 'nfc-wc-2',
    team1: { seed: 3, name: 'Eagles', teamId: 'philadelphia-eagles', score: 19 },
    team2: { seed: 6, name: '49ers', teamId: 'san-francisco-49ers', score: 23 },
    round: 'Wild Card',
    date: 'Sun, Jan 11',
    completed: true,
  },
  'nfc-wc-3': {
    id: 'nfc-wc-3',
    team1: { seed: 2, name: 'Bears', teamId: 'chicago-bears', score: 31 },
    team2: { seed: 7, name: 'Packers', teamId: 'green-bay-packers', score: 27 },
    round: 'Wild Card',
    date: 'Sat, Jan 10',
    completed: true,
  },
  // AFC Divisional Round
  'afc-div-1': {
    id: 'afc-div-1',
    team1: { seed: 1, name: 'Broncos', teamId: 'denver-broncos' },
    team2: null,
    round: 'Divisional',
    date: 'Sat, Jan 17',
    completed: false,
  },
  'afc-div-2': {
    id: 'afc-div-2',
    team1: null,
    team2: null,
    round: 'Divisional',
    date: 'Sun, Jan 18',
    completed: false,
  },
  // NFC Divisional Round
  'nfc-div-1': {
    id: 'nfc-div-1',
    team1: { seed: 1, name: 'Seahawks', teamId: 'seattle-seahawks' },
    team2: null,
    round: 'Divisional',
    date: 'Sat, Jan 17',
    completed: false,
  },
  'nfc-div-2': {
    id: 'nfc-div-2',
    team1: null,
    team2: null,
    round: 'Divisional',
    date: 'Sun, Jan 18',
    completed: false,
  },
  // Conference Championships
  'afc-conf': {
    id: 'afc-conf',
    team1: null,
    team2: null,
    round: 'AFC Championship',
    date: 'Sun, Jan 25',
    completed: false,
  },
  'nfc-conf': {
    id: 'nfc-conf',
    team1: null,
    team2: null,
    round: 'NFC Championship',
    date: 'Sun, Jan 25',
    completed: false,
  },
  // Super Bowl
  'superbowl': {
    id: 'superbowl',
    team1: null,
    team2: null,
    round: 'Super Bowl LX',
    date: 'Sun, Feb 8',
    completed: false,
  },
};

function TeamLogo({ teamId, size = 24 }: { teamId: string; size?: number }) {
  if (!teamId || teamId === 'TBD') {
    return (
      <div
        className="bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ width: size, height: size }}
      >
        <span className="text-gray-500 text-xs">?</span>
      </div>
    );
  }

  const allTeams = getAllTeams();
  const team = allTeams.find(t => t.id === teamId);

  if (!team) {
    return (
      <div
        className="bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ width: size, height: size }}
      >
        <span className="text-gray-500 text-xs">?</span>
      </div>
    );
  }

  return (
    <img
      src={team.logoUrl}
      alt={`${team.name} logo`}
      className="flex-shrink-0 object-contain"
      style={{ width: size, height: size }}
    />
  );
}

interface MatchupCardProps {
  matchup: Matchup;
  compact?: boolean;
  userPick?: 'team1' | 'team2' | null;
  onPickWinner?: (matchupId: string, pick: 'team1' | 'team2') => void;
  canPick?: boolean;
}

function MatchupCard({ matchup, compact = false, userPick, onPickWinner, canPick = false }: MatchupCardProps) {
  const team1 = matchup.team1;
  const team2 = matchup.team2;

  // Create placeholder teams for TBD slots
  const displayTeam1 = team1 && team1.name ? team1 : { seed: 0, name: 'TBD', teamId: 'TBD' };
  const displayTeam2 = team2 && team2.name ? team2 : { seed: 0, name: 'TBD', teamId: 'TBD' };

  // Determine winners based on scores if completed
  let team1Winner = false;
  let team2Winner = false;
  if (matchup.completed && team1?.score !== undefined && team2?.score !== undefined) {
    team1Winner = team1.score > team2.score;
    team2Winner = team2.score > team1.score;
  }

  const canPickTeam1 = !!(canPick && !matchup.completed && team1 && team1.name && team1.name !== 'TBD');
  const canPickTeam2 = !!(canPick && !matchup.completed && team2 && team2.name && team2.name !== 'TBD');

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden`}>
      <div className={compact ? 'p-1.5' : 'p-2'}>
        <TeamRow
          team={displayTeam1}
          compact={compact}
          isWinner={team1Winner}
          isPicked={userPick === 'team1'}
          canPick={canPickTeam1}
          onPick={() => onPickWinner?.(matchup.id, 'team1')}
        />
        <div className="border-t border-gray-100 my-1"></div>
        <TeamRow
          team={displayTeam2}
          compact={compact}
          isWinner={team2Winner}
          isPicked={userPick === 'team2'}
          canPick={canPickTeam2}
          onPick={() => onPickWinner?.(matchup.id, 'team2')}
        />
      </div>
      {matchup.date && (
        <div className="bg-gray-50 px-2 py-1 border-t border-gray-200">
          <span className="text-xs text-gray-600">{matchup.date}</span>
        </div>
      )}
    </div>
  );
}

interface TeamRowProps {
  team: Team;
  compact?: boolean;
  isWinner?: boolean;
  isPicked?: boolean;
  canPick?: boolean;
  onPick?: () => void;
}

function TeamRow({ team, compact = false, isWinner = false, isPicked = false, canPick = false, onPick }: TeamRowProps) {
  const isTBD = !team.name || team.name === 'TBD';

  return (
    <div
      onClick={canPick && !isTBD ? onPick : undefined}
      className={`flex items-center justify-between ${compact ? 'py-0.5' : 'py-1'}
        ${isWinner ? 'font-semibold' : ''}
        ${isPicked ? 'bg-green-50 -mx-1.5 px-1.5 rounded' : ''}
        ${canPick && !isTBD ? 'cursor-pointer hover:bg-gray-50 -mx-1.5 px-1.5 rounded transition-colors' : ''}`}
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {team.seed > 0 && (
          <span className={`${compact ? 'text-xs' : 'text-sm'} text-gray-500 w-4 flex-shrink-0`}>
            {team.seed}
          </span>
        )}
        <TeamLogo teamId={team.teamId} size={compact ? 20 : 24} />
        <span className={`${compact ? 'text-xs' : 'text-sm'} ${isTBD ? 'text-gray-500 italic' : isWinner ? 'text-gray-900' : 'text-gray-600'} truncate`}>
          {team.name || 'TBD'}
        </span>
        {isPicked && (
          <span className="text-green-600 text-xs ml-1">✓</span>
        )}
      </div>
      {team.score !== undefined && (
        <span className={`${compact ? 'text-xs' : 'text-sm'} ${isWinner ? 'text-gray-900 font-bold' : 'text-gray-500'} ml-2`}>
          {team.score}
        </span>
      )}
    </div>
  );
}

export default function NFLPlayoffBracket() {
  // User picks for incomplete games
  const [userPicks, setUserPicks] = useState<{ [matchupId: string]: 'team1' | 'team2' }>({});

  // Computed bracket with user picks applied to future rounds
  const [displayData, setDisplayData] = useState(initialPlayoffData);

  // Recompute display data when user picks change
  useEffect(() => {
    const newData = JSON.parse(JSON.stringify(initialPlayoffData)) as typeof initialPlayoffData;

    // Process each matchup and propagate winners/picks
    const processMatchup = (matchupId: string) => {
      const matchup = newData[matchupId];
      if (!matchup) return null;

      // If game is completed, determine winner by score
      if (matchup.completed && matchup.team1?.score !== undefined && matchup.team2?.score !== undefined) {
        return matchup.team1.score > matchup.team2.score ? matchup.team1 : matchup.team2;
      }

      // If user has a pick for this game
      if (userPicks[matchupId] && matchup.team1 && matchup.team2) {
        return userPicks[matchupId] === 'team1' ? matchup.team1 : matchup.team2;
      }

      return null;
    };

    // Process wild card winners for each conference with reseeding
    const processConferenceReseeding = (conference: 'afc' | 'nfc') => {
      const wcWinners: Team[] = [];

      // Collect wild card winners
      for (let i = 1; i <= 3; i++) {
        const winner = processMatchup(`${conference}-wc-${i}`);
        if (winner) {
          wcWinners.push(winner);
        }
      }

      // If we have all 3 wild card winners, apply reseeding
      if (wcWinners.length === 3) {
        // Sort winners by seed (lowest seed number = highest ranking)
        const sortedWinners = [...wcWinners].sort((a, b) => a.seed - b.seed);

        // Lowest seed (highest number) plays the 1 seed
        const lowestSeed = sortedWinners[2]; // highest seed number
        newData[`${conference}-div-1`].team2 = { seed: lowestSeed.seed, name: lowestSeed.name, teamId: lowestSeed.teamId };

        // Other two winners play each other
        newData[`${conference}-div-2`].team1 = { seed: sortedWinners[0].seed, name: sortedWinners[0].name, teamId: sortedWinners[0].teamId };
        newData[`${conference}-div-2`].team2 = { seed: sortedWinners[1].seed, name: sortedWinners[1].name, teamId: sortedWinners[1].teamId };
      }
    };

    // Apply reseeding for both conferences
    processConferenceReseeding('afc');
    processConferenceReseeding('nfc');

    // Propagate divisional and championship winners (no reseeding here)
    ['afc-div-1', 'afc-div-2', 'nfc-div-1', 'nfc-div-2'].forEach(matchupId => {
      const winner = processMatchup(matchupId);
      if (winner && bracketProgression[matchupId]) {
        const { nextMatchup, slot } = bracketProgression[matchupId];
        if (newData[nextMatchup]) {
          const existingTeam = newData[nextMatchup][slot];
          if (existingTeam?.score === undefined) {
            newData[nextMatchup][slot] = { seed: winner.seed, name: winner.name, teamId: winner.teamId };
          }
        }
      }
    });

    // Propagate conference championship winners to Super Bowl
    ['afc-conf', 'nfc-conf'].forEach(matchupId => {
      const winner = processMatchup(matchupId);
      if (winner && bracketProgression[matchupId]) {
        const { nextMatchup, slot } = bracketProgression[matchupId];
        if (newData[nextMatchup]) {
          const existingTeam = newData[nextMatchup][slot];
          if (existingTeam?.score === undefined) {
            newData[nextMatchup][slot] = { seed: winner.seed, name: winner.name, teamId: winner.teamId };
          }
        }
      }
    });

    setDisplayData(newData);
  }, [userPicks]);

  const handlePickWinner = (matchupId: string, pick: 'team1' | 'team2') => {
    setUserPicks(prev => {
      // If clicking the same pick, deselect it
      if (prev[matchupId] === pick) {
        const newPicks = { ...prev };
        delete newPicks[matchupId];
        // Also clear downstream picks
        clearDownstreamPicks(matchupId, newPicks);
        return newPicks;
      }
      // Otherwise set the new pick and clear downstream
      const newPicks = { ...prev, [matchupId]: pick };
      clearDownstreamPicks(matchupId, newPicks);
      return newPicks;
    });
  };

  // Clear picks for games that depend on this matchup
  const clearDownstreamPicks = (matchupId: string, picks: typeof userPicks) => {
    // If a wild card game changes, clear all divisional and later picks for that conference
    if (matchupId.includes('-wc-')) {
      const conference = matchupId.split('-')[0]; // 'afc' or 'nfc'
      // Clear divisional picks
      delete picks[`${conference}-div-1`];
      delete picks[`${conference}-div-2`];
      // Clear conference championship
      delete picks[`${conference}-conf`];
      // Clear Super Bowl
      delete picks['superbowl'];
      return;
    }

    // For other games, use standard progression
    const progression = bracketProgression[matchupId];
    if (progression) {
      const { nextMatchup } = progression;
      if (picks[nextMatchup]) {
        delete picks[nextMatchup];
        clearDownstreamPicks(nextMatchup, picks);
      }
    }
  };

  // Find Super Bowl champion (either from completed game or user pick)
  const finalMatchup = displayData['superbowl'];
  const champion = (() => {
    if (finalMatchup.completed && finalMatchup.team1?.score !== undefined && finalMatchup.team2?.score !== undefined) {
      return finalMatchup.team1.score > finalMatchup.team2.score ? finalMatchup.team1 : finalMatchup.team2;
    }
    if (userPicks['superbowl'] && finalMatchup.team1 && finalMatchup.team2) {
      return userPicks['superbowl'] === 'team1' ? finalMatchup.team1 : finalMatchup.team2;
    }
    return null;
  })();

  const hasAnyPicks = Object.keys(userPicks).length > 0;

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
      <div className="px-4 py-2 border-b border-gray-200 flex items-center justify-between" style={{ backgroundColor: '#0050A0' }}>
        <h3 className="text-lg font-bold text-white">2025-26 NFL Playoff Bracket</h3>
        <button
          onClick={() => setUserPicks({})}
          className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${hasAnyPicks ? 'bg-white/20 text-white hover:bg-white/30' : 'invisible'}`}
        >
          Clear Picks
        </button>
      </div>

      <div className="bg-blue-50 border-b border-blue-200 px-4 py-2">
        <p className="text-sm text-blue-700">Click on a team to pick them as the winner. Your picks will advance through the bracket.</p>
      </div>

      <div className="px-4 pt-2 pb-4 overflow-x-auto">
        {/* Desktop Bracket View */}
        <div className="hidden lg:block">
          <div className="flex gap-5 justify-center">
            {/* AFC Side */}
            <div className="flex items-stretch gap-3.5">
              {/* AFC Wild Card */}
              <div className="flex flex-col gap-3 w-[155px]">
                <div className="text-center mb-2 text-sm font-bold text-[#0050A0]">AFC</div>
                <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide text-center">Wild Card</div>
                <MatchupCard matchup={displayData['afc-wc-1']} compact userPick={userPicks['afc-wc-1']} onPickWinner={handlePickWinner} canPick />
                <MatchupCard matchup={displayData['afc-wc-2']} compact userPick={userPicks['afc-wc-2']} onPickWinner={handlePickWinner} canPick />
                <MatchupCard matchup={displayData['afc-wc-3']} compact userPick={userPicks['afc-wc-3']} onPickWinner={handlePickWinner} canPick />
              </div>

              {/* AFC Divisional */}
              <div className="flex flex-col gap-3 w-[155px] justify-around">
                <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide text-center">Divisional</div>
                <div className="flex-1 flex flex-col justify-around">
                  <MatchupCard matchup={displayData['afc-div-1']} compact userPick={userPicks['afc-div-1']} onPickWinner={handlePickWinner} canPick />
                  <MatchupCard matchup={displayData['afc-div-2']} compact userPick={userPicks['afc-div-2']} onPickWinner={handlePickWinner} canPick />
                </div>
              </div>

              {/* AFC Championship */}
              <div className="flex flex-col w-[155px]">
                <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide text-center">AFC Champ</div>
                <div className="flex-1 flex flex-col justify-center">
                  <MatchupCard matchup={displayData['afc-conf']} compact userPick={userPicks['afc-conf']} onPickWinner={handlePickWinner} canPick />
                </div>
              </div>
            </div>

            {/* Super Bowl Center */}
            <div className="flex flex-col w-[190px] justify-center">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide text-center mb-2">Super Bowl LX</div>
              <MatchupCard matchup={displayData['superbowl']} userPick={userPicks['superbowl']} onPickWinner={handlePickWinner} canPick />
              <div className="mt-3 text-center">
                <div className={`inline-block rounded-lg px-4 py-2 ${champion ? 'bg-yellow-100 border border-yellow-300' : 'bg-gray-100 border border-gray-200'}`}>
                  <span className={`font-semibold text-sm ${champion ? 'text-yellow-800' : 'text-gray-500'}`}>
                    {userPicks['superbowl'] && !finalMatchup.completed ? 'Your Winner' : 'Champion'}
                  </span>
                  {champion ? (
                    <div className="flex items-center justify-center gap-2 mt-1">
                      <TeamLogo teamId={champion.teamId} size={24} />
                      <span className="text-gray-900 font-bold">{champion.name}</span>
                    </div>
                  ) : (
                    <div className="text-gray-500 italic">TBD</div>
                  )}
                </div>
              </div>
            </div>

            {/* NFC Side */}
            <div className="flex items-stretch gap-3.5 flex-row-reverse">
              {/* NFC Wild Card */}
              <div className="flex flex-col gap-3 w-[155px]">
                <div className="text-center mb-2 text-sm font-bold text-[#0050A0]">NFC</div>
                <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide text-center">Wild Card</div>
                <MatchupCard matchup={displayData['nfc-wc-1']} compact userPick={userPicks['nfc-wc-1']} onPickWinner={handlePickWinner} canPick />
                <MatchupCard matchup={displayData['nfc-wc-2']} compact userPick={userPicks['nfc-wc-2']} onPickWinner={handlePickWinner} canPick />
                <MatchupCard matchup={displayData['nfc-wc-3']} compact userPick={userPicks['nfc-wc-3']} onPickWinner={handlePickWinner} canPick />
              </div>

              {/* NFC Divisional */}
              <div className="flex flex-col gap-3 w-[155px] justify-around">
                <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide text-center">Divisional</div>
                <div className="flex-1 flex flex-col justify-around">
                  <MatchupCard matchup={displayData['nfc-div-1']} compact userPick={userPicks['nfc-div-1']} onPickWinner={handlePickWinner} canPick />
                  <MatchupCard matchup={displayData['nfc-div-2']} compact userPick={userPicks['nfc-div-2']} onPickWinner={handlePickWinner} canPick />
                </div>
              </div>

              {/* NFC Championship */}
              <div className="flex flex-col w-[155px]">
                <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide text-center">NFC Champ</div>
                <div className="flex-1 flex flex-col justify-center">
                  <MatchupCard matchup={displayData['nfc-conf']} compact userPick={userPicks['nfc-conf']} onPickWinner={handlePickWinner} canPick />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile/Tablet View */}
        <div className="lg:hidden space-y-6">
          {/* Wild Card Round */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Wild Card Round - Jan 10-12</h4>
            <div className="space-y-3">
              <div>
                <div className="text-xs text-gray-600 mb-1 font-medium">AFC Wild Card</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <MatchupCard matchup={displayData['afc-wc-1']} userPick={userPicks['afc-wc-1']} onPickWinner={handlePickWinner} canPick />
                  <MatchupCard matchup={displayData['afc-wc-2']} userPick={userPicks['afc-wc-2']} onPickWinner={handlePickWinner} canPick />
                  <MatchupCard matchup={displayData['afc-wc-3']} userPick={userPicks['afc-wc-3']} onPickWinner={handlePickWinner} canPick />
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-600 mb-1 font-medium">NFC Wild Card</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <MatchupCard matchup={displayData['nfc-wc-1']} userPick={userPicks['nfc-wc-1']} onPickWinner={handlePickWinner} canPick />
                  <MatchupCard matchup={displayData['nfc-wc-2']} userPick={userPicks['nfc-wc-2']} onPickWinner={handlePickWinner} canPick />
                  <MatchupCard matchup={displayData['nfc-wc-3']} userPick={userPicks['nfc-wc-3']} onPickWinner={handlePickWinner} canPick />
                </div>
              </div>
            </div>
          </div>

          {/* Divisional Round */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Divisional Round - Jan 17-18</h4>
            <div className="space-y-3">
              <div>
                <div className="text-xs text-gray-600 mb-1 font-medium">AFC Divisional</div>
                <div className="space-y-2">
                  <MatchupCard matchup={displayData['afc-div-1']} userPick={userPicks['afc-div-1']} onPickWinner={handlePickWinner} canPick />
                  <MatchupCard matchup={displayData['afc-div-2']} userPick={userPicks['afc-div-2']} onPickWinner={handlePickWinner} canPick />
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-600 mb-1 font-medium">NFC Divisional</div>
                <div className="space-y-2">
                  <MatchupCard matchup={displayData['nfc-div-1']} userPick={userPicks['nfc-div-1']} onPickWinner={handlePickWinner} canPick />
                  <MatchupCard matchup={displayData['nfc-div-2']} userPick={userPicks['nfc-div-2']} onPickWinner={handlePickWinner} canPick />
                </div>
              </div>
            </div>
          </div>

          {/* Conference Championships */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Conference Championships - Jan 25</h4>
            <div className="space-y-3">
              <div>
                <div className="text-xs text-gray-600 mb-1 font-medium">AFC Championship</div>
                <MatchupCard matchup={displayData['afc-conf']} userPick={userPicks['afc-conf']} onPickWinner={handlePickWinner} canPick />
              </div>
              <div>
                <div className="text-xs text-gray-600 mb-1 font-medium">NFC Championship</div>
                <MatchupCard matchup={displayData['nfc-conf']} userPick={userPicks['nfc-conf']} onPickWinner={handlePickWinner} canPick />
              </div>
            </div>
          </div>

          {/* Super Bowl */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Super Bowl LX - Feb 8</h4>
            <MatchupCard matchup={displayData['superbowl']} userPick={userPicks['superbowl']} onPickWinner={handlePickWinner} canPick />
          </div>

          {/* Champion Banner */}
          <div className={`rounded-lg p-4 text-center ${champion ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50 border border-gray-200'}`}>
            <span className={`font-semibold text-sm ${champion ? 'text-yellow-800' : 'text-gray-500'}`}>
              {userPicks['superbowl'] && !finalMatchup.completed ? 'Your Winner' : 'Super Bowl LX Champion'}
            </span>
            {champion ? (
              <div className="flex items-center justify-center gap-2 mt-2">
                <TeamLogo teamId={champion.teamId} size={32} />
                <span className="text-xl font-bold text-gray-900">{champion.name}</span>
              </div>
            ) : (
              <div className="text-xl font-bold text-gray-500 mt-1 italic">TBD</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
