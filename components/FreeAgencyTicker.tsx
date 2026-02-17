'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { getApiPath } from '@/utils/api';
import { getPositionColor } from '@/utils/colorHelpers';
import { transformFreeAgentData, type RawFreeAgentData, type FreeAgent } from '@/utils/freeAgentHelpers';

// Module-level cache so data persists across navigations/remounts
let cachedAgents: FreeAgent[] | null = null;
// Track when the animation first started so scroll position persists across navigations
let animationStartTime: number | null = null;
const ANIMATION_DURATION = 40; // seconds, must match the CSS animation duration

export default function FreeAgencyTicker() {
  const [agents, setAgents] = useState<FreeAgent[]>(cachedAgents ?? []);
  const [loading, setLoading] = useState(!cachedAgents);

  // Calculate animation delay once on mount so re-renders don't restart the animation
  // Must be called before any early returns to satisfy Rules of Hooks
  const animationDelayRef = useRef<number | null>(null);
  if (animationDelayRef.current === null) {
    if (!animationStartTime) {
      animationStartTime = Date.now();
    }
    const elapsedSeconds = (Date.now() - animationStartTime) / 1000;
    animationDelayRef.current = -(elapsedSeconds % ANIMATION_DURATION);
  }

  const fetchFreeAgents = useCallback(async () => {
    try {
      const response = await fetch(getApiPath('api/free-agents'));
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      const transformed = transformFreeAgentData(data.output as RawFreeAgentData[]);
      // Take top 25 unsigned free agents by rank
      const topAgents = transformed
        .filter(a => !a.signed2026Team || a.signed2026Team.trim() === '')
        .sort((a, b) => a.rank - b.rank)
        .slice(0, 25);
      cachedAgents = topAgents;
      setAgents(topAgents);
    } catch (error) {
      console.error('Error fetching free agents:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!cachedAgents) {
      fetchFreeAgents();
    }
    // Refresh data every hour to pick up new signings
    const interval = setInterval(fetchFreeAgents, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchFreeAgents]);

  if (loading) {
    return (
      <>
        <div className="fixed top-[48px] lg:top-0 right-0 left-0 lg:left-64 bg-black text-white py-2 px-4 z-10 lg:z-40">
          <div className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Loading free agents...</span>
          </div>
        </div>
        <div className="h-10" />
      </>
    );
  }

  if (agents.length === 0) {
    return (
      <>
        <div className="fixed top-[48px] lg:top-0 right-0 left-0 lg:left-64 bg-black text-white py-2 px-4 z-10 lg:z-40">
          <div className="flex items-center justify-center gap-2">
            <span className="text-sm">No free agent data available</span>
          </div>
        </div>
        <div className="h-10" />
      </>
    );
  }

  // Duplicate the list for seamless looping
  const duplicatedAgents = [...agents, ...agents];
  const animationDelay = animationDelayRef.current;

  return (
    <>
      <Link href="/free-agency-tracker" className="block">
        <div className="fixed top-[48px] lg:top-0 right-0 left-0 lg:left-64 bg-black text-white z-10 lg:z-40 overflow-hidden cursor-pointer hover:bg-gray-900 transition-colors">
          <div className="flex items-center h-10">
            {/* Fixed label */}
            <div className="flex-shrink-0 bg-black text-white text-xs font-bold px-3 h-full flex items-center uppercase tracking-wider z-10 border-r border-white/50">
              Top Free Agents
            </div>

            {/* Scrolling container */}
            <div className="overflow-hidden flex-1">
              <div
                className="ticker-scroll flex items-center"
                style={{ animationDelay: `${animationDelay}s` }}
              >
                {duplicatedAgents.map((agent, index) => (
                  <div
                    key={`${agent.rank}-${index}`}
                    className="flex items-center gap-2 px-4 flex-shrink-0 border-r border-white/10"
                  >
                    <span className="text-xs text-gray-400 font-mono">#{agent.rank}</span>
                    <span className="text-sm font-semibold whitespace-nowrap">{agent.name}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${getPositionColor(agent.position)}`}>
                      {agent.position}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <style jsx>{`
            .ticker-scroll {
              animation: ticker-marquee 40s linear infinite;
            }
            .ticker-scroll:hover {
              animation-play-state: paused;
            }
            @keyframes ticker-marquee {
              0% {
                transform: translateX(0);
              }
              100% {
                transform: translateX(-50%);
              }
            }
          `}</style>
        </div>
      </Link>
      <div className="h-10" />
    </>
  );
}
