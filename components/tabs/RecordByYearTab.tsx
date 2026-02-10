'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { TeamData } from '@/data/teams';
import { teamRecordsByYear, SeasonRecord } from '@/data/teamRecordsByYear';
import { getContrastTextColor } from '@/utils/colorHelpers';

interface RecordByYearTabProps {
  team: TeamData;
}

interface CoachSummary {
  name: string;
  startYear: number;
  endYear: number;
  wins: number;
  losses: number;
  ties: number;
  yearsCoaching: number;
  playoffAppearances: number;
  winningSeasons: number;
}

function buildCoachingSummaries(records: SeasonRecord[]): Map<string, CoachSummary> {
  const coachMap = new Map<string, CoachSummary>();
  const sorted = [...records].sort((a, b) => a.year - b.year);

  for (const r of sorted) {
    if (!r.coach) continue;
    const isWinningSeason = r.wins > r.losses;
    const madePlayoffs = r.playoffs.length > 0;
    const existing = coachMap.get(r.coach);
    if (existing) {
      existing.endYear = r.year;
      existing.wins += r.wins;
      existing.losses += r.losses;
      existing.ties += r.ties;
      existing.yearsCoaching += 1;
      if (madePlayoffs) existing.playoffAppearances += 1;
      if (isWinningSeason) existing.winningSeasons += 1;
    } else {
      coachMap.set(r.coach, {
        name: r.coach,
        startYear: r.year,
        endYear: r.year,
        wins: r.wins,
        losses: r.losses,
        ties: r.ties,
        yearsCoaching: 1,
        playoffAppearances: madePlayoffs ? 1 : 0,
        winningSeasons: isWinningSeason ? 1 : 0,
      });
    }
  }

  return coachMap;
}

function getWinPct(w: number, l: number, t: number): string {
  const total = w + l + t;
  if (total === 0) return '.000';
  const pct = (w + t * 0.5) / total;
  return pct.toFixed(3).replace(/^0/, '');
}

function getWinPctNum(w: number, l: number, t: number): number {
  const total = w + l + t;
  if (total === 0) return 0;
  return (w + t * 0.5) / total;
}

function isSuperbowlWin(playoffs: string): boolean {
  const lower = playoffs.toLowerCase();
  return lower.includes('won sb') || lower.includes('won super bowl');
}

function isPlayoffAppearance(playoffs: string): boolean {
  return playoffs.length > 0;
}

type SortField = 'year' | 'winPct';
type SortDir = 'asc' | 'desc';

function CoachPopover({ coach, teamColor, onClose }: { coach: CoachSummary; teamColor: string; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  const tenure = coach.startYear === coach.endYear
    ? `${coach.startYear}`
    : `${coach.startYear}-${coach.endYear}`;
  const recordStr = `${coach.wins}-${coach.losses}${coach.ties > 0 ? `-${coach.ties}` : ''} (${getWinPct(coach.wins, coach.losses, coach.ties)})`;

  return (
    <div ref={ref} className="absolute z-50 bg-white rounded-lg shadow-xl border border-gray-200 p-4 w-64 left-0 top-full mt-1">
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="font-bold text-gray-900">{coach.name}</div>
          <div className="text-xs text-gray-500">{tenure}</div>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none cursor-pointer">&times;</button>
      </div>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Overall Record</span>
          <span className="font-semibold text-gray-900">{recordStr}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Years Coaching</span>
          <span className="font-semibold text-gray-900">{coach.yearsCoaching}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Playoff Appearances</span>
          <span className="font-semibold text-gray-900">{coach.playoffAppearances}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Winning Seasons</span>
          <span className="font-semibold text-gray-900">{coach.winningSeasons}</span>
        </div>
      </div>
    </div>
  );
}

export default function RecordByYearTab({ team }: RecordByYearTabProps) {
  const records = teamRecordsByYear[team.id] || [];
  const [decadeFilter, setDecadeFilter] = useState<string>('all');
  const [coachFilter, setCoachFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('year');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [selectedCoachRow, setSelectedCoachRow] = useState<number | null>(null);

  const coachMap = useMemo(() => buildCoachingSummaries(records), [records]);

  // Franchise-level stats for summary boxes
  const franchiseStats = useMemo(() => {
    let winningSeasons = 0;
    let playoffAppearances = 0;
    let playoffWins = 0;
    let playoffLosses = 0;

    for (const r of records) {
      if (r.wins > r.losses) winningSeasons++;
      if (r.playoffs.length > 0) {
        playoffAppearances++;
        // Parse playoff result for W-L counting
        const p = r.playoffs.toLowerCase();
        if (p.includes('won sb')) { playoffWins += 4; }
        else if (p.includes('lost sb')) { playoffWins += 3; playoffLosses += 1; }
        else if (p.includes('won conf') || p.includes('lost sb')) { playoffWins += 3; playoffLosses += 1; }
        else if (p.includes('lost conf')) { playoffWins += 2; playoffLosses += 1; }
        else if (p.includes('lost div')) { playoffWins += 1; playoffLosses += 1; }
        else if (p.includes('lost wc')) { playoffLosses += 1; }
      }
    }

    return { winningSeasons, playoffAppearances, playoffWins, playoffLosses };
  }, [records]);

  const decades = useMemo(() => {
    if (records.length === 0) return [];
    const decadeSet = new Set<number>();
    for (const r of records) {
      decadeSet.add(Math.floor(r.year / 10) * 10);
    }
    return Array.from(decadeSet).sort((a, b) => b - a);
  }, [records]);

  const coachNames = useMemo(() => {
    const names = new Set<string>();
    for (const r of records) {
      if (r.coach) names.add(r.coach);
    }
    return Array.from(names).sort();
  }, [records]);

  const filtered = useMemo(() => {
    const result = records.filter(r => {
      if (decadeFilter !== 'all') {
        const decade = parseInt(decadeFilter, 10);
        if (r.year < decade || r.year >= decade + 10) return false;
      }
      if (coachFilter !== 'all' && r.coach !== coachFilter) return false;
      return true;
    });

    result.sort((a, b) => {
      let cmp: number;
      if (sortField === 'year') {
        cmp = a.year - b.year;
      } else {
        cmp = getWinPctNum(a.wins, a.losses, a.ties) - getWinPctNum(b.wins, b.losses, b.ties);
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [records, decadeFilter, coachFilter, sortField, sortDir]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const sortIndicator = (field: SortField) => {
    if (sortField !== field) return ' \u2195';
    return sortDir === 'asc' ? ' \u25B2' : ' \u25BC';
  };

  if (records.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
        No year-by-year record data available for {team.fullName}.
      </div>
    );
  }

  const contrastText = getContrastTextColor(team.primaryColor);

  return (
    <div className="bg-white rounded-lg shadow p-4 sm:p-6">
      {/* Title + color bar */}
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
          {team.fullName} Record By Year
        </h1>
        <div
          className="h-1 rounded-full"
          style={{ backgroundColor: team.primaryColor, width: 'fit-content', minWidth: '320px' }}
        />
      </div>

      {/* Franchise Summary Boxes */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="text-center p-4 rounded-lg border" style={{ borderColor: team.primaryColor + '40' }}>
          <div className="text-2xl sm:text-3xl font-bold text-gray-900">{franchiseStats.winningSeasons}</div>
          <div className="text-xs sm:text-sm text-gray-500 font-medium">Winning Seasons</div>
        </div>
        <div className="text-center p-4 rounded-lg border" style={{ borderColor: team.primaryColor + '40' }}>
          <div className="text-2xl sm:text-3xl font-bold text-gray-900">
            {franchiseStats.playoffWins}-{franchiseStats.playoffLosses}
          </div>
          <div className="text-xs sm:text-sm text-gray-500 font-medium">Postseason Record</div>
        </div>
        <div className="text-center p-4 rounded-lg border" style={{ borderColor: team.primaryColor + '40' }}>
          <div className="text-2xl sm:text-3xl font-bold text-gray-900">{franchiseStats.playoffAppearances}</div>
          <div className="text-xs sm:text-sm text-gray-500 font-medium">Playoff Appearances</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <select
          value={decadeFilter}
          onChange={(e) => setDecadeFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:outline-none cursor-pointer"
          style={{ '--tw-ring-color': team.primaryColor } as React.CSSProperties}
        >
          <option value="all">All Decades</option>
          {decades.map(d => (
            <option key={d} value={d}>{d}s</option>
          ))}
        </select>

        <select
          value={coachFilter}
          onChange={(e) => setCoachFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:outline-none cursor-pointer"
          style={{ '--tw-ring-color': team.primaryColor } as React.CSSProperties}
        >
          <option value="all">All Coaches</option>
          {coachNames.map(name => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
      </div>

      {/* Season count */}
      <div className="text-sm text-gray-600 mb-3">
        Showing {filtered.length} of {records.length} seasons
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: team.primaryColor, color: contrastText }}>
              <th className="p-3 text-left font-semibold cursor-pointer select-none hover:opacity-80" onClick={() => handleSort('year')}>Year{sortIndicator('year')}</th>
              <th className="p-3 text-left font-semibold">Record</th>
              <th className="p-3 text-left font-semibold hidden sm:table-cell cursor-pointer select-none hover:opacity-80" onClick={() => handleSort('winPct')}>Win%{sortIndicator('winPct')}</th>
              <th className="p-3 text-left font-semibold">Div. Finish</th>
              <th className="p-3 text-left font-semibold">Playoffs</th>
              <th className="p-3 text-left font-semibold hidden md:table-cell">Coach</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, idx) => {
              const sbWin = isSuperbowlWin(r.playoffs);
              const playoffTeam = isPlayoffAppearance(r.playoffs);
              const record = `${r.wins}-${r.losses}${r.ties > 0 ? `-${r.ties}` : ''}`;
              const winPct = getWinPct(r.wins, r.losses, r.ties);

              let rowBg = idx % 2 === 0 ? 'bg-white' : 'bg-gray-50';
              if (sbWin) rowBg = '';

              return (
                <tr
                  key={r.year}
                  className={`${rowBg} border-b border-gray-100`}
                  style={sbWin ? { backgroundColor: '#FEF3C7' } : undefined}
                >
                  <td className="p-3 font-medium text-gray-900">{r.year}</td>
                  <td className="p-3 text-gray-800">{record}</td>
                  <td className="p-3 text-gray-700 hidden sm:table-cell">{winPct}</td>
                  <td className="p-3 text-gray-700">{r.divisionFinish || '—'}</td>
                  <td className="p-3">
                    {r.playoffs ? (
                      <span
                        className="inline-block px-2 py-0.5 rounded text-xs font-medium"
                        style={
                          sbWin
                            ? { backgroundColor: '#F59E0B', color: '#fff' }
                            : playoffTeam
                              ? { backgroundColor: team.primaryColor + '20', color: team.primaryColor }
                              : undefined
                        }
                      >
                        {r.playoffs}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="p-3 hidden md:table-cell">
                    {r.coach ? (
                      <span className="relative inline-block">
                        <button
                          className="font-medium cursor-pointer hover:opacity-70"
                          style={{ color: team.primaryColor }}
                          onClick={() => setSelectedCoachRow(selectedCoachRow === r.year ? null : r.year)}
                        >
                          {r.coach}
                        </button>
                        {selectedCoachRow === r.year && coachMap.has(r.coach) && (
                          <CoachPopover
                            coach={coachMap.get(r.coach)!}
                            teamColor={team.primaryColor}
                            onClose={() => setSelectedCoachRow(null)}
                          />
                        )}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
