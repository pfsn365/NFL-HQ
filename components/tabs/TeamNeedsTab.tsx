'use client';

import { useState, useEffect } from 'react';
import { TeamData } from '@/data/teams';
import { teamNeeds, PositionNeed } from '@/data/team-needs';

interface TeamNeedsTabProps {
  team: TeamData;
}

function getNeedColor(needLevel: number): string {
  if (needLevel >= 8) return '#dc2626'; // red-600 - Critical
  if (needLevel >= 6) return '#ea580c'; // orange-600 - High
  if (needLevel >= 4) return '#ca8a04'; // yellow-600 - Medium
  if (needLevel >= 2) return '#16a34a'; // green-600 - Low
  return '#059669'; // emerald-600 - Minimal
}

function getNeedLabel(needLevel: number): string {
  if (needLevel >= 8) return 'Critical';
  if (needLevel >= 6) return 'High';
  if (needLevel >= 4) return 'Medium';
  if (needLevel >= 2) return 'Low';
  return 'Minimal';
}

function NeedLevelBar({ needLevel, teamColor }: { needLevel: number; teamColor: string }) {
  const percentage = (needLevel / 10) * 100;
  const color = getNeedColor(needLevel);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
      <div className="flex-1 h-3 sm:h-3 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${percentage}%`,
            backgroundColor: color
          }}
        />
      </div>
      <div className="flex items-center gap-2 sm:min-w-[100px]">
        <span className="text-base sm:text-sm font-bold" style={{ color }}>{needLevel.toFixed(1)}</span>
        <span
          className="text-sm sm:text-xs px-2 py-0.5 rounded-full font-medium"
          style={{
            backgroundColor: color + '20',
            color: color
          }}
        >
          {getNeedLabel(needLevel)}
        </span>
      </div>
    </div>
  );
}

function PositionNeedCard({ need, teamColor, isExpanded, onToggle }: {
  need: PositionNeed;
  teamColor: string;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:border-[#0050A0] hover:shadow-md transition-all cursor-pointer select-none"
      onClick={onToggle}
    >
      {/* Increased padding for better touch targets on mobile */}
      <div className="p-4 sm:p-4 min-h-[72px]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-gray-900 text-base sm:text-base">{need.position}</h3>
          <div className="p-2 -mr-2 touch-manipulation">
            <svg
              className={`w-5 h-5 sm:w-5 sm:h-5 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        <NeedLevelBar needLevel={need.needLevel} teamColor={teamColor} />
      </div>

      {isExpanded && (
        <div className="px-4 pb-5 pt-3 sm:px-4 sm:pb-4 sm:pt-2 border-t border-gray-100 bg-gray-50">
          <div className="text-base sm:text-lg text-gray-700 leading-relaxed whitespace-pre-line">
            {need.writeup}
          </div>
        </div>
      )}
    </div>
  );
}

export default function TeamNeedsTab({ team }: TeamNeedsTabProps) {
  const [expandedPositions, setExpandedPositions] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'position' | 'need'>('need');
  const [isLoading, setIsLoading] = useState(true);
  const [needs, setNeeds] = useState<PositionNeed[]>([]);

  useEffect(() => {
    // Simulate loading state for consistency with other tabs
    const teamData = teamNeeds[team.id];
    if (teamData) {
      setNeeds(teamData);
    }
    setIsLoading(false);
  }, [team.id]);

  const togglePosition = (position: string) => {
    setExpandedPositions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(position)) {
        newSet.delete(position);
      } else {
        newSet.add(position);
      }
      return newSet;
    });
  };

  const expandAll = () => {
    setExpandedPositions(new Set(needs.map(n => n.position)));
  };

  const collapseAll = () => {
    setExpandedPositions(new Set());
  };

  const sortedNeeds = [...needs].sort((a, b) => {
    if (sortBy === 'need') {
      return b.needLevel - a.needLevel;
    }
    return 0; // Keep original order for position sort
  });

  // Calculate summary stats
  const criticalNeeds = needs.filter(n => n.needLevel >= 8);
  const highNeeds = needs.filter(n => n.needLevel >= 6 && n.needLevel < 8);
  const avgNeed = needs.length > 0
    ? (needs.reduce((sum, n) => sum + n.needLevel, 0) / needs.length).toFixed(1)
    : '0.0';

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (needs.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Team Needs Data Available</h3>
          <p className="text-gray-600">Team needs analysis for the {team.fullName} is not yet available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{team.fullName} Team Needs</h2>
        <div className="h-1 rounded-full w-full sm:w-auto sm:min-w-[280px]" style={{ backgroundColor: team.primaryColor }}></div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6 sm:mb-8">
        <div className="bg-white rounded-lg p-3 sm:p-4 shadow-sm border-l-4" style={{ borderLeftColor: team.primaryColor }}>
          <p className="text-2xl sm:text-3xl font-bold" style={{ color: team.primaryColor }}>{criticalNeeds.length}</p>
          <p className="text-xs sm:text-sm text-gray-600">Critical Needs (8+)</p>
        </div>

        <div className="bg-white rounded-lg p-3 sm:p-4 shadow-sm border-l-4" style={{ borderLeftColor: team.primaryColor }}>
          <p className="text-2xl sm:text-3xl font-bold" style={{ color: team.primaryColor }}>{highNeeds.length}</p>
          <p className="text-xs sm:text-sm text-gray-600">High Needs (6-8)</p>
        </div>

        <div className="bg-white rounded-lg p-3 sm:p-4 shadow-sm border-l-4" style={{ borderLeftColor: team.primaryColor }}>
          <p className="text-2xl sm:text-3xl font-bold" style={{ color: team.primaryColor }}>{avgNeed}</p>
          <p className="text-xs sm:text-sm text-gray-600">Average Need Level</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-6">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Sort by:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'position' | 'need')}
            className="text-base sm:text-sm border border-gray-300 rounded-lg px-3 py-2 sm:py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#0050A0] touch-manipulation"
          >
            <option value="need">Need Level (Highest First)</option>
            <option value="position">Position Order</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={expandAll}
            className="text-sm px-4 py-2 sm:px-3 sm:py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 active:bg-gray-100 transition-colors touch-manipulation"
          >
            Expand All
          </button>
          <button
            onClick={collapseAll}
            className="text-sm px-4 py-2 sm:px-3 sm:py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 active:bg-gray-100 transition-colors touch-manipulation"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* Needs List */}
      <div className="space-y-3 sm:space-y-4">
        {sortedNeeds.map((need) => (
          <PositionNeedCard
            key={need.position}
            need={need}
            teamColor={team.primaryColor}
            isExpanded={expandedPositions.has(need.position)}
            onToggle={() => togglePosition(need.position)}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="mt-8 p-4 sm:p-4 bg-gray-50 rounded-lg">
        <h4 className="text-base font-semibold text-gray-700 mb-3">Need Level Guide</h4>
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-3 sm:gap-4">
          {[
            { label: 'Critical (8-10)', color: '#dc2626' },
            { label: 'High (6-8)', color: '#ea580c' },
            { label: 'Medium (4-6)', color: '#ca8a04' },
            { label: 'Low (2-4)', color: '#16a34a' },
            { label: 'Minimal (0-2)', color: '#059669' },
          ].map(({ label, color }) => (
            <div key={label} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
              <span className="text-sm text-gray-600">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
