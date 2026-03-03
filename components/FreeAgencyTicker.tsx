'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { getApiPath } from '@/utils/api';
import { getPositionColor } from '@/utils/colorHelpers';
import { transformFreeAgentData, type RawFreeAgentData, type FreeAgent } from '@/utils/freeAgentHelpers';

let cachedAgents: FreeAgent[] | null = null;

export default function FreeAgencyTicker() {
  const [agents, setAgents] = useState<FreeAgent[]>(cachedAgents ?? []);
  const [loading, setLoading] = useState(!cachedAgents);
  const tickerRef = useRef<HTMLDivElement>(null);

  const fetchFreeAgents = useCallback(async (isRefresh = false) => {
    try {
      const response = await fetch(getApiPath('api/free-agents'));
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      const transformed = transformFreeAgentData(data.output as RawFreeAgentData[]);
      // Take top 25 free agents by rank (including signed players)
      const topAgents = transformed
        .sort((a, b) => a.rank - b.rank)
        .slice(0, 25);
      cachedAgents = topAgents;
      // Only update state if data actually changed to avoid restarting the animation
      if (!isRefresh) {
        setAgents(topAgents);
      } else {
        setAgents(prev => {
          const prevKey = prev.map(a => `${a.rank}-${a.name}`).join(',');
          const newKey = topAgents.map(a => `${a.rank}-${a.name}`).join(',');
          return prevKey === newKey ? prev : topAgents;
        });
      }
    } catch (error) {
      console.error('Error fetching free agents:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!cachedAgents) {
      fetchFreeAgents(false);
    }
    // Refresh data every hour — pass isRefresh=true to avoid restarting animation
    const interval = setInterval(() => fetchFreeAgents(true), 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchFreeAgents]);

  // Dynamically set animation duration based on content width for consistent scroll speed
  useEffect(() => {
    if (tickerRef.current && agents.length > 0) {
      const scrollWidth = tickerRef.current.scrollWidth;
      // One copy is half the total width; faster on mobile for snappier feel
      const onePassWidth = scrollWidth / 2;
      const isMobile = window.innerWidth < 640;
      const speed = isMobile ? 150 : 75;
      const duration = Math.max(15, onePassWidth / speed);
      tickerRef.current.style.setProperty('--ticker-duration', `${duration}s`);
    }
  }, [agents]);

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

  return (
    <>
      <Link href="/free-agency-tracker" className="block">
        <div className="fixed top-[48px] lg:top-0 right-0 left-0 lg:left-64 bg-black text-white z-10 lg:z-40 overflow-hidden cursor-pointer hover:bg-gray-900 transition-colors">
          <div className="flex items-center h-10">
            {/* Fixed label */}
            <div className="flex-shrink-0 bg-black text-white text-[10px] sm:text-xs font-bold px-2 sm:px-3 h-full flex items-center tracking-wider z-10 border-r border-white/50">
              <span className="hidden sm:inline uppercase">Top Free Agents</span>
              <span className="sm:hidden">TOP FAs</span>
            </div>

            {/* Scrolling container */}
            <div className="overflow-hidden flex-1">
              <div
                ref={tickerRef}
                className="ticker-scroll flex items-center will-change-transform"
              >
                {duplicatedAgents.map((agent, index) => (
                  <div
                    key={`${agent.rank}-${index}`}
                    className="flex items-center gap-2 px-4 flex-shrink-0 border-r border-white/10"
                  >
                    <span className="text-xs text-gray-400 font-mono">#{agent.rank}</span>
                    <span className="text-sm font-semibold whitespace-nowrap">{agent.name}</span>
                    {agent.faType === 'Franchise' || agent.faType === 'Transition' ? (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-500/90 text-white">
                        TAGGED
                      </span>
                    ) : agent.signed2026Team && agent.signed2026Team.trim() !== '' ? (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-green-600/80 text-white">
                        SIGNED
                      </span>
                    ) : (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${getPositionColor(agent.position)}`}>
                        {agent.position}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <style jsx>{`
            .ticker-scroll {
              animation: ticker-marquee var(--ticker-duration, 60s) linear infinite;
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
