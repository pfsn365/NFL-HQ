'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getAllTeams } from '@/data/teams';
import { useState, useEffect, useRef, useCallback } from 'react';
import { getApiPath } from '@/utils/api';
import { getPositionColor } from '@/utils/colorHelpers';
import { transformFreeAgentData, type RawFreeAgentData, type FreeAgent } from '@/utils/freeAgentHelpers';

export default function HomePageContent() {
  const router = useRouter();
  const allTeams = getAllTeams();

  // Free agents state
  const [topFreeAgents, setTopFreeAgents] = useState<FreeAgent[]>([]);
  const [freeAgentsLoading, setFreeAgentsLoading] = useState(true);

  // Pill nav state & refs
  const SECTIONS = [
    { id: 'free-agency', label: 'Free Agency' },
    { id: 'stat-leaders', label: 'Stat Leaders' },
    { id: 'tools', label: 'Tools' },
    { id: 'articles', label: 'Articles' },
  ] as const;

  const [activeSection, setActiveSection] = useState<string>('free-agency');
  const pillNavRef = useRef<HTMLElement>(null);
  const activePillRef = useRef<HTMLButtonElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Scroll indicator logic for pill nav
  const updatePillScrollIndicators = useCallback(() => {
    if (pillNavRef.current) {
      const nav = pillNavRef.current;
      setCanScrollLeft(nav.scrollLeft > 5);
      setCanScrollRight(nav.scrollLeft < nav.scrollWidth - nav.clientWidth - 5);
    }
  }, []);

  // Initialize and update pill scroll indicators
  useEffect(() => {
    const nav = pillNavRef.current;
    if (!nav) return;
    updatePillScrollIndicators();
    nav.addEventListener('scroll', updatePillScrollIndicators, { passive: true });
    window.addEventListener('resize', updatePillScrollIndicators, { passive: true });
    return () => {
      nav.removeEventListener('scroll', updatePillScrollIndicators);
      window.removeEventListener('resize', updatePillScrollIndicators);
    };
  }, [updatePillScrollIndicators]);

  // Auto-scroll active pill into view
  useEffect(() => {
    if (activePillRef.current && pillNavRef.current) {
      const pill = activePillRef.current;
      const nav = pillNavRef.current;
      requestAnimationFrame(() => {
        const pillRect = pill.getBoundingClientRect();
        const navRect = nav.getBoundingClientRect();
        const pillLeft = pillRect.left - navRect.left + nav.scrollLeft;
        const pillRight = pillLeft + pillRect.width;
        const navWidth = nav.clientWidth;
        if (pillLeft < nav.scrollLeft) {
          nav.scrollTo({ left: pillLeft - 20, behavior: 'auto' });
        } else if (pillRight > nav.scrollLeft + navWidth) {
          nav.scrollTo({ left: pillRight - navWidth + 20, behavior: 'auto' });
        }
      });
    }
  }, [activeSection]);

  // IntersectionObserver scroll-spy
  useEffect(() => {
    const sectionIds = SECTIONS.map(s => s.id);
    const elements = sectionIds.map(id => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Find the most-visible intersecting entry
        let bestEntry: IntersectionObserverEntry | null = null;
        for (const entry of entries) {
          if (entry.isIntersecting) {
            if (!bestEntry || entry.intersectionRatio > bestEntry.intersectionRatio) {
              bestEntry = entry;
            }
          }
        }
        if (bestEntry) {
          setActiveSection(bestEntry.target.id);
        }
      },
      { threshold: 0.3, rootMargin: '-80px 0px -50% 0px' }
    );

    elements.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Pill click handler
  const handlePillClick = useCallback((sectionId: string) => {
    setActiveSection(sectionId);
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  // Fetch top free agents
  useEffect(() => {
    async function fetchTopFreeAgents() {
      try {
        const response = await fetch(getApiPath('api/free-agents'));
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        const transformed = transformFreeAgentData(data.output as RawFreeAgentData[]);
        const top = transformed
          .sort((a, b) => a.rank - b.rank)
          .slice(0, 10);
        setTopFreeAgents(top);
      } catch (err) {
        console.error('Error fetching free agents:', err);
      } finally {
        setFreeAgentsLoading(false);
      }
    }
    fetchTopFreeAgents();
  }, []);

  // Stat leaders - NFL stats
  interface StatLeader {
    playerId: number;
    playerSlug?: string;
    name: string;
    value: string | number;
    teamId: string;
    position?: string;
    gamesPlayed?: number;
  }

  interface StatLeaders {
    passingYards: StatLeader[];
    rushingYards: StatLeader[];
    receivingYards: StatLeader[];
    tackles: StatLeader[];
  }

  const [statLeaders, setStatLeaders] = useState<StatLeaders | null>(null);
  const [statLeadersLoading, setStatLeadersLoading] = useState(true);

  // Latest articles state
  interface Article {
    title: string;
    link: string;
    pubDate: string;
    description: string;
    featuredImage?: string;
    author?: string;
    category?: string;
  }
  const [latestArticles, setLatestArticles] = useState<Article[]>([]);
  const [articlesLoading, setArticlesLoading] = useState(true);

  // Format relative time for articles
  const getRelativeTime = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    }
  };

  // Fetch stat leaders
  useEffect(() => {
    async function fetchStatLeaders() {
      try {
        const response = await fetch(getApiPath('api/nfl/stat-leaders?season=2025&limit=5'));

        if (response.ok) {
          const data = await response.json();
          // Only set data if there's no error
          if (data.data && !data.error) {
            // Extract only the 4 categories we want
            setStatLeaders({
              passingYards: data.data.passingYards || [],
              rushingYards: data.data.rushingYards || [],
              receivingYards: data.data.receivingYards || [],
              tackles: data.data.tackles || [],
            });
          } else if (data.error) {
            // Keep statLeaders as null to show unavailable message
          }
        }
      } catch (err) {
        console.error('Error fetching stat leaders:', err);
      } finally {
        setStatLeadersLoading(false);
      }
    }

    fetchStatLeaders();
  }, []);

  // Fetch latest articles
  useEffect(() => {
    async function fetchLatestArticles() {
      try {
        // Fetch from the Insights feed (most general news)
        const response = await fetch(getApiPath('api/proxy-rss?url=' + encodeURIComponent('https://www.profootballnetwork.com/insights/feed/')));

        if (response.ok) {
          const data = await response.json();
          if (data.articles && Array.isArray(data.articles)) {
            setLatestArticles(data.articles.slice(0, 3));
          }
        }
      } catch (err) {
        console.error('Error fetching latest articles:', err);
      } finally {
        setArticlesLoading(false);
      }
    }

    fetchLatestArticles();
  }, []);

  return (
    <main id="main-content" className="pt-[48px] lg:pt-0">
        {/* Header */}
        <header
          className="text-white shadow-lg"
          style={{
            background: 'linear-gradient(180deg, #0050A0 0%, #003A75 100%)',
            boxShadow: 'inset 0 -30px 40px -30px rgba(0,0,0,0.15), 0 4px 6px -1px rgba(0,0,0,0.1)'
          }}
        >
          <div className="container mx-auto px-4 pt-6 sm:pt-7 md:pt-8 lg:pt-10 pb-0.5 sm:pb-1 md:pb-2 lg:pb-3">
            <h1 className="text-4xl lg:text-5xl font-extrabold mb-2">
              NFL HQ
            </h1>
            <p className="text-lg opacity-90 font-medium">
              Your destination for NFL teams, stats, rankings, and interactive tools
            </p>
          </div>
        </header>

        {/* Raptive Header Ad */}
        <div className="container mx-auto px-4 h-[120px] flex items-center justify-center">
          <div className="raptive-pfn-header-90 w-full h-full"></div>
        </div>

        {/* Sticky Pill Navigation — mobile only */}
        <div className="sticky top-[48px] z-10 bg-white border-b border-gray-200 shadow-sm lg:hidden">
          <div className="container mx-auto px-4 relative">
            {/* Left fade indicator */}
            {canScrollLeft && (
              <div
                className="absolute left-0 top-0 bottom-0 w-12 pointer-events-none z-10"
                style={{ background: 'linear-gradient(to right, rgb(255,255,255) 0%, rgba(255,255,255,0) 100%)' }}
              />
            )}
            {/* Right fade indicator */}
            {canScrollRight && (
              <div
                className="absolute right-0 top-0 bottom-0 w-24 pointer-events-none z-10"
                style={{ background: 'linear-gradient(to left, rgb(255,255,255) 0%, rgb(255,255,255) 30%, rgba(255,255,255,0) 100%)' }}
              />
            )}
            <nav ref={pillNavRef} className="flex gap-2 overflow-x-auto scrollbar-hide py-2.5">
              {SECTIONS.map((section) => (
                <button
                  key={section.id}
                  ref={activeSection === section.id ? activePillRef : null}
                  onClick={() => handlePillClick(section.id)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    activeSection === section.id
                      ? 'bg-[#0050A0] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {section.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Top Free Agents */}
        <div id="free-agency" className="container mx-auto px-4 sm:px-6 lg:px-8 pt-3 mb-8" style={{ scrollMarginTop: '100px' }}>
          {/* Animated gradient border wrapper */}
          <div className="relative rounded-xl p-[2px] overflow-hidden fa-glow-border">
            <div className="rounded-xl overflow-hidden bg-white">
              {/* Dark header with shine effect */}
              <div className="relative overflow-hidden bg-gradient-to-r from-[#002244] via-[#0050A0] to-[#002244] px-5 sm:px-6 py-4 sm:py-5">
                <div className="absolute inset-0 fa-shine-effect" />
                <h2 className="relative text-xl sm:text-2xl font-extrabold text-white">NFL Free Agency Tracker</h2>
              </div>

              {/* Table */}
              {freeAgentsLoading ? (
                <div className="bg-white p-4">
                  <div className="animate-pulse space-y-3">
                    {[...Array(10)].map((_, i) => (
                      <div key={i} className="h-10 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                </div>
              ) : topFreeAgents.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="py-2.5 px-3 text-center text-xs font-semibold text-gray-600">Rank</th>
                        <th className="py-2.5 px-3 text-left text-xs font-semibold text-gray-600">Name</th>
                        <th className="py-2.5 px-3 text-center text-xs font-semibold text-gray-600">Pos</th>
                        <th className="py-2.5 px-3 text-center text-xs font-semibold text-gray-600">2025 Team</th>
                        <th className="py-2.5 px-3 text-center text-xs font-semibold text-gray-600 hidden sm:table-cell">Age</th>
                        <th className="py-2.5 px-3 text-center text-xs font-semibold text-gray-600">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {topFreeAgents.map((agent, index) => {
                        const teamInfo = allTeams.find(t => t.id === agent.teamId);
                        const isUnsigned = !agent.signed2026Team || agent.signed2026Team.trim() === '';

                        return (
                          <tr key={`${agent.rank}-${agent.name}`} onClick={() => router.push('/free-agency-tracker')} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} hover:bg-blue-50 transition-colors cursor-pointer group`}>
                            <td className="px-3 py-2.5 whitespace-nowrap text-sm text-center">
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#0050A0] text-white text-xs font-bold">{agent.rank}</span>
                            </td>
                            <td className="px-3 py-2.5 whitespace-nowrap text-sm font-semibold text-gray-900 group-hover:text-[#0050A0] transition-colors">
                              {agent.name}
                            </td>
                            <td className="px-3 py-2.5 whitespace-nowrap text-sm text-center">
                              <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold border ${getPositionColor(agent.position)}`}>
                                {agent.position}
                              </span>
                            </td>
                            <td className="px-3 py-2.5 whitespace-nowrap text-sm text-center">
                              {teamInfo ? (
                                <div className="flex items-center justify-center gap-1.5">
                                  <img src={teamInfo.logoUrl} alt={teamInfo.abbreviation} className="w-5 h-5" />
                                  <span className="text-gray-700">{teamInfo.abbreviation}</span>
                                </div>
                              ) : (
                                <span className="text-gray-500">{agent.current2025Team || '—'}</span>
                              )}
                            </td>
                            <td className="px-3 py-2.5 whitespace-nowrap text-sm text-gray-700 text-center hidden sm:table-cell">
                              {agent.age}
                            </td>
                            <td className="px-3 py-2.5 whitespace-nowrap text-sm text-center">
                              {isUnsigned ? (
                                <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-700 border border-red-200">
                                  Unsigned
                                </span>
                              ) : (
                                <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-700 border border-green-200">
                                  Signed
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 bg-white">
                  <p>Free agent data unavailable</p>
                </div>
              )}

              {/* CTA footer */}
              <Link
                href="/free-agency-tracker"
                className="group flex items-center justify-center gap-2 bg-gradient-to-r from-[#002244] via-[#0050A0] to-[#002244] px-6 py-4 text-white font-bold text-sm hover:brightness-125 transition-all"
              >
                <span className="fa-cta-pulse inline-flex items-center gap-2">
                  View All Free Agents
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </Link>
            </div>
          </div>

          <style jsx>{`
            .fa-glow-border {
              background: linear-gradient(135deg, #002244, #0050A0, #0078D4, #0050A0, #002244);
              background-size: 400% 400%;
              animation: fa-border-glow 6s ease infinite;
            }
            @keyframes fa-border-glow {
              0%, 100% { background-position: 0% 50%; }
              50% { background-position: 100% 50%; }
            }
            .fa-shine-effect {
              background: linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.08) 45%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.08) 55%, transparent 60%);
              background-size: 250% 100%;
              animation: fa-shine 4s ease-in-out infinite;
            }
            @keyframes fa-shine {
              0% { background-position: 200% 0; }
              100% { background-position: -50% 0; }
            }
            .fa-cta-pulse {
              animation: fa-pulse 2s ease-in-out infinite;
            }
            @keyframes fa-pulse {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.8; }
            }
          `}</style>
        </div>

        {/* Stat Leaders Section */}
        <section id="stat-leaders" className="bg-white border-t border-gray-200 py-8 sm:py-10 lg:py-12" style={{ scrollMarginTop: '100px' }}>
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Stat Leaders</h2>
                <div className="w-12 h-1 bg-[#0050A0] rounded-full mt-2"></div>
              </div>
              <Link
                href="/stats"
                className="text-[#0050A0] hover:text-[#003A75] font-semibold text-sm transition-colors"
              >
                View All Stats →
              </Link>
            </div>

            {statLeadersLoading ? (
              /* Loading Skeleton */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {['Passing Yards', 'Rushing Yards', 'Receiving Yards', 'Tackles'].map((stat) => (
                  <div key={stat} className="bg-gray-50 rounded-lg p-4 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-24 mb-3"></div>
                    <div className="space-y-2">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-1">
                            <div className="w-4 h-4 bg-gray-200 rounded"></div>
                            <div className="w-4 h-4 bg-gray-200 rounded"></div>
                            <div className="h-3 bg-gray-200 rounded flex-1"></div>
                          </div>
                          <div className="h-3 bg-gray-200 rounded w-8"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : statLeaders ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {/* Passing Yards */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-xs font-bold text-gray-600 uppercase mb-3">Passing Yards</h3>
                  <div className="space-y-2">
                    {statLeaders.passingYards.slice(0, 3).map((leader, idx) => {
                      const team = allTeams.find(t => t.id === leader.teamId);
                      return (
                        <div key={leader.playerId} className="flex items-center justify-between text-base">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="text-gray-600 font-semibold w-4">{idx + 1}</span>
                            {team && (
                              <img
                                src={team.logoUrl}
                                alt={team.abbreviation}
                                className="w-4 h-4 flex-shrink-0"
                              />
                            )}
                            <span className="font-medium text-gray-900 truncate text-sm">{leader.name}</span>
                          </div>
                          <span className="font-bold text-[#0050A0] ml-2">{leader.value}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Rushing Yards */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-xs font-bold text-gray-600 uppercase mb-3">Rushing Yards</h3>
                  <div className="space-y-2">
                    {statLeaders.rushingYards.slice(0, 3).map((leader, idx) => {
                      const team = allTeams.find(t => t.id === leader.teamId);
                      return (
                        <div key={leader.playerId} className="flex items-center justify-between text-base">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="text-gray-600 font-semibold w-4">{idx + 1}</span>
                            {team && (
                              <img
                                src={team.logoUrl}
                                alt={team.abbreviation}
                                className="w-4 h-4 flex-shrink-0"
                              />
                            )}
                            <span className="font-medium text-gray-900 truncate text-sm">{leader.name}</span>
                          </div>
                          <span className="font-bold text-[#0050A0] ml-2">{leader.value}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Receiving Yards */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-xs font-bold text-gray-600 uppercase mb-3">Receiving Yards</h3>
                  <div className="space-y-2">
                    {statLeaders.receivingYards.slice(0, 3).map((leader, idx) => {
                      const team = allTeams.find(t => t.id === leader.teamId);
                      return (
                        <div key={leader.playerId} className="flex items-center justify-between text-base">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="text-gray-600 font-semibold w-4">{idx + 1}</span>
                            {team && (
                              <img
                                src={team.logoUrl}
                                alt={team.abbreviation}
                                className="w-4 h-4 flex-shrink-0"
                              />
                            )}
                            <span className="font-medium text-gray-900 truncate text-sm">{leader.name}</span>
                          </div>
                          <span className="font-bold text-[#0050A0] ml-2">{leader.value}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Tackles */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-xs font-bold text-gray-600 uppercase mb-3">Tackles</h3>
                  <div className="space-y-2">
                    {statLeaders.tackles.slice(0, 3).map((leader, idx) => {
                      const team = allTeams.find(t => t.id === leader.teamId);
                      return (
                        <div key={leader.playerId} className="flex items-center justify-between text-base">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="text-gray-600 font-semibold w-4">{idx + 1}</span>
                            {team && (
                              <img
                                src={team.logoUrl}
                                alt={team.abbreviation}
                                className="w-4 h-4 flex-shrink-0"
                              />
                            )}
                            <span className="font-medium text-gray-900 truncate text-sm">{leader.name}</span>
                          </div>
                          <span className="font-bold text-[#0050A0] ml-2">{leader.value}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>Stat leaders data unavailable</p>
                <p className="text-xs mt-2">Check the <Link href="/stats" className="text-[#0050A0] hover:underline">Stat Leaders page</Link> for current NFL stats</p>
              </div>
            )}
          </div>
        </section>

        {/* Features Grid */}
        <section id="tools" className="bg-gray-50 border-t border-gray-200 py-8 sm:py-10 lg:py-12" style={{ scrollMarginTop: '100px' }}>
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
                Interactive Tools & Features
              </h2>
              <div className="w-12 h-1 bg-[#0050A0] rounded-full mt-2"></div>
            </div>

            {/* Hero Tier — 2 large cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Player Rankings Builder Card — Hero */}
              <Link
                href="/player-rankings-builder"
                className="group relative bg-white rounded-xl p-8 border-l-4 border-l-orange-500 border border-gray-200 hover:border-[#0050A0] hover:shadow-lg transition-all cursor-pointer flex flex-col h-full"
              >
                <h3 className="text-2xl font-bold text-gray-900 group-hover:text-[#0050A0] transition-colors mb-2">
                  Player Rankings Builder
                </h3>
                <p className="text-gray-600 text-sm mb-5">
                  Rank and compare NFL players by position
                </p>

                <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg p-6 text-center flex-grow flex flex-col justify-center min-h-[100px]">
                  <p className="text-lg font-semibold text-gray-700">Drag & Drop Player Rankings</p>
                </div>

                <div className="mt-5 flex items-center text-[#0050A0]">
                  <span className="text-sm font-medium group-hover:underline">Start Ranking</span>
                  <svg className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>

              {/* Power Rankings Builder Card — Hero */}
              <Link
                href="/power-rankings-builder"
                className="group relative bg-white rounded-xl p-8 border-l-4 border-l-cyan-500 border border-gray-200 hover:border-[#0050A0] hover:shadow-lg transition-all cursor-pointer flex flex-col h-full"
              >
                <h3 className="text-2xl font-bold text-gray-900 group-hover:text-[#0050A0] transition-colors mb-2">
                  Power Rankings Builder
                </h3>
                <p className="text-gray-600 text-sm mb-5">
                  Create and customize your own NFL team power rankings
                </p>

                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-6 text-center flex-grow flex flex-col justify-center min-h-[100px]">
                  <p className="text-lg font-semibold text-gray-700">Drag & Drop Rankings</p>
                </div>

                <div className="mt-5 flex items-center text-[#0050A0]">
                  <span className="text-sm font-medium group-hover:underline">Start Building</span>
                  <svg className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            </div>

            {/* Standard Tier — 4 compact cards */}
            <div className="flex overflow-x-auto scrollbar-hide gap-3 -mx-4 px-4 snap-x snap-mandatory pb-2 md:grid md:grid-cols-4 md:gap-4 md:mx-0 md:px-0 md:overflow-visible md:pb-0 md:snap-none">
              {/* NFL Team Pages */}
              <Link
                href="/teams"
                className="min-w-[160px] w-[45vw] flex-shrink-0 snap-start md:min-w-0 md:w-auto md:flex-shrink group relative bg-white rounded-xl p-4 border border-gray-200 hover:border-[#0050A0] hover:shadow-lg transition-all cursor-pointer flex flex-col"
              >
                <h3 className="text-base font-bold text-gray-900 group-hover:text-[#0050A0] transition-colors mb-1">
                  NFL Team Pages
                </h3>
                <p className="text-gray-500 text-xs mb-3 line-clamp-2">
                  Rosters, schedules, stats & info for all 32 teams
                </p>
                <div className="mt-auto flex items-center text-[#0050A0]">
                  <span className="text-xs font-medium group-hover:underline">View Teams</span>
                  <svg className="w-3 h-3 ml-1 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>

              {/* Salary Cap Tracker */}
              <Link
                href="/salary-cap-tracker"
                className="min-w-[160px] w-[45vw] flex-shrink-0 snap-start md:min-w-0 md:w-auto md:flex-shrink group relative bg-white rounded-xl p-4 border border-gray-200 hover:border-[#0050A0] hover:shadow-lg transition-all cursor-pointer flex flex-col"
              >
                <h3 className="text-base font-bold text-gray-900 group-hover:text-[#0050A0] transition-colors mb-1">
                  Salary Cap Tracker
                </h3>
                <p className="text-gray-500 text-xs mb-3 line-clamp-2">
                  Track team salary cap situations & contracts
                </p>
                <div className="mt-auto flex items-center text-[#0050A0]">
                  <span className="text-xs font-medium group-hover:underline">View Salaries</span>
                  <svg className="w-3 h-3 ml-1 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>

              {/* NFL Player Pages */}
              <Link
                href="/players"
                className="min-w-[160px] w-[45vw] flex-shrink-0 snap-start md:min-w-0 md:w-auto md:flex-shrink group relative bg-white rounded-xl p-4 border border-gray-200 hover:border-[#0050A0] hover:shadow-lg transition-all cursor-pointer flex flex-col"
              >
                <h3 className="text-base font-bold text-gray-900 group-hover:text-[#0050A0] transition-colors mb-1">
                  NFL Player Pages
                </h3>
                <p className="text-gray-500 text-xs mb-3 line-clamp-2">
                  Search player profiles, stats & career info
                </p>
                <div className="mt-auto flex items-center text-[#0050A0]">
                  <span className="text-xs font-medium group-hover:underline">Browse Players</span>
                  <svg className="w-3 h-3 ml-1 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>

              {/* NFL Transactions */}
              <Link
                href="/transactions"
                className="min-w-[160px] w-[45vw] flex-shrink-0 snap-start md:min-w-0 md:w-auto md:flex-shrink group relative bg-white rounded-xl p-4 border border-gray-200 hover:border-[#0050A0] hover:shadow-lg transition-all cursor-pointer flex flex-col"
              >
                <h3 className="text-base font-bold text-gray-900 group-hover:text-[#0050A0] transition-colors mb-1">
                  NFL Transactions
                </h3>
                <p className="text-gray-500 text-xs mb-3 line-clamp-2">
                  Latest trades, signings & roster moves
                </p>
                <div className="mt-auto flex items-center text-[#0050A0]">
                  <span className="text-xs font-medium group-hover:underline">View Transactions</span>
                  <svg className="w-3 h-3 ml-1 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            </div>
          </div>
        </section>

        {/* Latest NFL Articles Section */}
        <section id="articles" className="bg-white border-t border-gray-200 py-8 sm:py-10 lg:py-12" style={{ scrollMarginTop: '100px' }}>
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-6">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Latest NFL Articles</h2>
              <div className="w-12 h-1 bg-[#0050A0] rounded-full mt-2"></div>
            </div>

            {articlesLoading ? (
              <div className="flex overflow-x-auto scrollbar-hide gap-4 -mx-4 px-4 snap-x snap-mandatory pb-2 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-6 sm:mx-0 sm:px-0 sm:overflow-visible sm:pb-0 sm:snap-none">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="min-w-[280px] w-[85vw] flex-shrink-0 snap-start sm:min-w-0 sm:w-auto sm:flex-shrink bg-gray-50 rounded-lg overflow-hidden animate-pulse">
                    <div className="w-full aspect-video bg-gray-200"></div>
                    <div className="p-4">
                      <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-full mb-1"></div>
                      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : latestArticles.length > 0 ? (
              <div className="flex overflow-x-auto scrollbar-hide gap-4 -mx-4 px-4 snap-x snap-mandatory pb-2 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-6 sm:mx-0 sm:px-0 sm:overflow-visible sm:pb-0 sm:snap-none">
                {latestArticles.map((article, index) => (
                  <a
                    key={`${article.link}-${index}`}
                    href={article.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-w-[280px] w-[85vw] flex-shrink-0 snap-start sm:min-w-0 sm:w-auto sm:flex-shrink group bg-white rounded-lg overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                  >
                    {article.featuredImage ? (
                      <div className="w-full aspect-video overflow-hidden bg-gray-200">
                        <img
                          src={article.featuredImage}
                          alt={article.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ) : (
                      <div className="w-full aspect-video bg-gradient-to-br from-[#0050A0] to-[#003A75] flex items-center justify-center">
                        <span className="text-white text-3xl font-bold opacity-30">PFN</span>
                      </div>
                    )}
                    <div className="p-4">
                      <h3 className="text-base font-semibold text-gray-900 group-hover:text-[#0050A0] line-clamp-2 mb-2 transition-colors">
                        {article.title}
                      </h3>
                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                        {article.description}
                      </p>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">
                          {getRelativeTime(article.pubDate)}
                        </span>
                        <span className="font-medium text-[#0050A0]">
                          Read More →
                        </span>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>Unable to load articles</p>
              </div>
            )}

            {/* See All NFL Articles button */}
            <div className="mt-6 text-center">
              <Link
                href="/articles"
                className="inline-flex items-center gap-2 px-6 py-3 min-h-[44px] bg-[#0050A0] hover:bg-[#003A75] active:scale-[0.98] text-white font-medium rounded-lg transition-all cursor-pointer"
              >
                See All NFL Articles
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </section>
    </main>
  );
}
