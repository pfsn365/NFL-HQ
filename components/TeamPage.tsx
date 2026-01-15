'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { TeamData, getAllTeams } from '@/data/teams';
import { useSEO } from '@/hooks/useSEO';
import { useINPMonitoring, useOptimizedTabChange } from '@/hooks/useINPOptimization';
import PerformanceMonitor from '@/components/PerformanceMonitor';
import CriticalCSS from '@/components/CriticalCSS';
import {
  trackPageEngagement,
  trackTeamView,
  trackTabChange,
  pageview
} from '@/utils/ga-events';
import { getApiPath } from '@/utils/api';
import LayoutStabilizer from '@/components/LayoutStabilizer';
import OptimizedImage from '@/components/OptimizedImage';
import NavigationTabs from '@/components/NavigationTabs';
import OverviewTab from '@/components/tabs/OverviewTab';
import TeamInfoTab from '@/components/tabs/TeamInfoTab';
import DraftPicksTab from '@/components/tabs/DraftPicksTab';
import TransactionsTab from '@/components/tabs/TransactionsTab';
import SalaryCapTab from '@/components/tabs/SalaryCapTab';
import RosterTab from '@/components/tabs/RosterTab';
import DepthChartTab from '@/components/tabs/DepthChartTab';
import ScheduleTab from '@/components/tabs/ScheduleTab';
import StatsTab from '@/components/tabs/StatsTab';
import NewsTab from '@/components/tabs/NewsTab';
import InjuryReportTab from '@/components/tabs/InjuryReportTab';
import { ErrorBoundary } from '@/components/ErrorBoundary';

interface TeamPageProps {
  team: TeamData;
  initialTab?: string;
}

interface TeamStats {
  offi: {
    value: number;
    grade: string;
    rank: string;
  } | null; // Can be null if offensive data is unavailable
  defi: {
    value: number | string;
    grade: string;
    rank: string;
  } | null; // Can be null if defensive data is unavailable
}

interface TeamHeroSectionProps {
  team: TeamData;
  liveRecord?: string;
  liveDivisionRank?: string;
  teamStats?: TeamStats | null;
}

function TeamHeroSection({ team, liveRecord, liveDivisionRank, teamStats }: TeamHeroSectionProps) {
  return (
    <div style={{ backgroundColor: team.primaryColor }} className="text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row items-center justify-between">
          <div className="flex items-center space-x-6 mb-6 lg:mb-0">
            <div className="w-24 h-24 lg:w-32 lg:h-32 bg-white rounded-full flex items-center justify-center shadow-lg p-2">
              <OptimizedImage
                src={team.logoUrl}
                alt={`${team.fullName} Logo`}
                width={80}
                height={80}
                className="w-16 h-16 lg:w-20 lg:h-20"
                priority={true}
                sizes="(max-width: 1024px) 64px, 80px"
                quality={90}
              />
            </div>
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold">{team.fullName}</h1>
              <p className="text-lg lg:text-xl opacity-90 min-w-[300px]">
                {liveDivisionRank && liveRecord ? (
                  `${liveDivisionRank} in ${team.division} • ${liveRecord}`
                ) : (
                  <span className="inline-block min-w-[300px]">Loading standings data...</span>
                )}
              </p>
              <p className="text-sm lg:text-base opacity-80 mt-1">
                GM: {team.generalManager} • HC: {team.headCoach}
              </p>
            </div>
          </div>

          <div className="bg-white text-gray-800 rounded-lg p-6 w-full lg:w-auto shadow-lg">
            <h3 className="text-lg font-semibold mb-4 text-center text-gray-700">2025-26 REGULAR SEASON</h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="text-center">
                {teamStats && teamStats.offi ? (
                  <>
                    <div className="text-2xl font-bold text-gray-900 min-w-[100px] inline-block">
                      {teamStats.offi.value}
                      <span className="text-sm text-gray-600 ml-1">({teamStats.offi.rank})</span>
                    </div>
                    <a
                      href="https://www.profootballnetwork.com/nfl-offense-rankings-impact/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-gray-600 hover:underline transition-colors"
                      style={{ color: 'inherit' }}
                      onMouseEnter={(e) => e.currentTarget.style.color = team.primaryColor}
                      onMouseLeave={(e) => e.currentTarget.style.color = 'inherit'}
                    >
                      OFFi
                    </a>
                  </>
                ) : (
                  <>
                    <div className="text-2xl font-bold text-gray-900 min-w-[100px] inline-block">N/A</div>
                    <a
                      href="https://www.profootballnetwork.com/nfl-offense-rankings-impact/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-gray-600 hover:underline transition-colors"
                      style={{ color: 'inherit' }}
                      onMouseEnter={(e) => e.currentTarget.style.color = team.primaryColor}
                      onMouseLeave={(e) => e.currentTarget.style.color = 'inherit'}
                    >
                      OFFi
                    </a>
                  </>
                )}
              </div>
              <div className="text-center">
                {teamStats && teamStats.defi ? (
                  <>
                    <div className="text-2xl font-bold text-gray-900 min-w-[100px] inline-block">
                      {teamStats.defi.value}
                      <span className="text-sm text-gray-600 ml-1">({teamStats.defi.rank})</span>
                    </div>
                    <a
                      href="https://www.profootballnetwork.com/nfl-defense-rankings-impact/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-gray-600 hover:underline transition-colors"
                      style={{ color: 'inherit' }}
                      onMouseEnter={(e) => e.currentTarget.style.color = team.primaryColor}
                      onMouseLeave={(e) => e.currentTarget.style.color = 'inherit'}
                    >
                      DEFi
                    </a>
                  </>
                ) : (
                  <>
                    <div className="text-2xl font-bold text-gray-900 min-w-[100px] inline-block">N/A</div>
                    <a
                      href="https://www.profootballnetwork.com/nfl-defense-rankings-impact/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-gray-600 hover:underline transition-colors"
                      style={{ color: 'inherit' }}
                      onMouseEnter={(e) => e.currentTarget.style.color = team.primaryColor}
                      onMouseLeave={(e) => e.currentTarget.style.color = 'inherit'}
                    >
                      DEFi
                    </a>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface TeamStanding {
  recordString: string;
  divisionRank: string;
}

interface TeamRecord {
  wins: number;
  losses: number;
  ties: number;
  winPercentage: number;
}

interface ScheduleGame {
  week: number | string;
  date: string;
  opponent: string;
  opponentLogo: string;
  opponentAbbr?: string;
  isHome: boolean | null;
  time: string;
  tv: string;
  venue: string;
  result?: 'W' | 'L' | 'T' | null;
  score?: { home: number; away: number };
  eventType: string;
}

// Helper function to calculate team record from schedule
const calculateTeamRecord = (schedule: ScheduleGame[]): TeamRecord => {
  const regularSeasonGames = schedule.filter(
    (game: ScheduleGame) => game.eventType === 'Regular Season' && game.result
  );

  const wins = regularSeasonGames.filter((game: ScheduleGame) => game.result === 'W').length;
  const losses = regularSeasonGames.filter((game: ScheduleGame) => game.result === 'L').length;
  const ties = regularSeasonGames.filter((game: ScheduleGame) => game.result === 'T').length;

  return {
    wins,
    losses,
    ties,
    winPercentage: wins + losses + ties > 0 ? wins / (wins + losses + ties) : 0
  };
};

// Helper function to format record as string
const formatRecord = (record: TeamRecord): string => {
  return `${record.wins}-${record.losses}${record.ties > 0 ? `-${record.ties}` : ''}`;
};

// Helper function to get teams in the same division
const getDivisionTeams = (currentTeam: TeamData): TeamData[] => {
  const allTeams = getAllTeams();
  return allTeams.filter(team => team.division === currentTeam.division);
};

function TeamPageContent({ team, initialTab }: TeamPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(initialTab || 'overview');
  const [standings, setStandings] = useState<TeamStanding | null>(null);
  const [, setLiveRecord] = useState<TeamRecord | null>(null);
  const [teamSchedule, setTeamSchedule] = useState<ScheduleGame[]>([]);
  const [divisionStandings, setDivisionStandings] = useState<any[]>([]);
  const [teamStats, setTeamStats] = useState<TeamStats | null>(null);

  // Update SEO metadata based on active tab
  useSEO(team, activeTab);

  // Performance monitoring
  useINPMonitoring();

  // Optimized tab change handler
  const optimizedTabChange = useOptimizedTabChange(setActiveTab);

  // Analytics tracking
  useEffect(() => {
    // Track initial team page view
    trackTeamView(team.id, team.fullName);

    // Track page engagement
    const startTime = Date.now();

    // Cleanup function to track engagement time on unmount
    return () => {
      const engagementTime = Date.now() - startTime;
      trackPageEngagement(engagementTime);
    };
  }, [team.id, team.fullName]);

  // Track page view changes (for tab navigation without full page reload)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname;
      pageview(currentPath);
    }
  }, [activeTab]);

  // Fetch team's schedule and calculate live standings
  useEffect(() => {
    const fetchScheduleAndCalculateStandings = async () => {
      try {
        // Get current team's schedule
        const response = await fetch(getApiPath(`nfl/teams/api/schedule/${team.id}`));
        if (response.ok) {
          const data = await response.json();
          const schedule: ScheduleGame[] = data.schedule || [];

          // Store the full schedule for passing to OverviewTab
          setTeamSchedule(schedule);

          // Calculate current team's record
          const teamRecord = calculateTeamRecord(schedule);
          setLiveRecord(teamRecord);

          // Get division teams and calculate their records
          const divisionTeams = getDivisionTeams(team);
          const standingsPromises = divisionTeams.map(async (divisionTeam) => {
            try {
              const divisionResponse = await fetch(getApiPath(`nfl/teams/api/schedule/${divisionTeam.id}`));
              if (divisionResponse.ok) {
                const divisionData = await divisionResponse.json();
                const divisionSchedule: ScheduleGame[] = divisionData.schedule || [];
                const record = calculateTeamRecord(divisionSchedule);
                return {
                  ...divisionTeam,
                  wins: record.wins,
                  losses: record.losses,
                  ties: record.ties,
                  winPercentage: record.winPercentage
                };
              }
              return {
                ...divisionTeam,
                wins: 0,
                losses: 0,
                ties: 0,
                winPercentage: 0
              };
            } catch {
              return {
                ...divisionTeam,
                wins: 0,
                losses: 0,
                ties: 0,
                winPercentage: 0
              };
            }
          });

          const divisionStandingsData = await Promise.all(standingsPromises);

          // Sort by win percentage (highest first), then by wins as tiebreaker
          divisionStandingsData.sort((a, b) => {
            if (b.winPercentage !== a.winPercentage) {
              return b.winPercentage - a.winPercentage;
            }
            return b.wins - a.wins;
          });

          setDivisionStandings(divisionStandingsData);

          // Find current team's rank
          const teamIndex = divisionStandingsData.findIndex(t => t.id === team.id);
          if (teamIndex !== -1) {
            const rank = teamIndex + 1;
            const rankSuffix = rank === 1 ? 'st' : rank === 2 ? 'nd' : rank === 3 ? 'rd' : 'th';

            setStandings({
              recordString: formatRecord(teamRecord),
              divisionRank: `${rank}${rankSuffix}`
            });
          }
        }
      } catch (error) {
        console.error('Failed to fetch schedule and calculate standings:', error);
      }
    };

    fetchScheduleAndCalculateStandings();
  }, [team.id, team]);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    } else {
      const tabFromUrl = searchParams.get('tab');
      if (tabFromUrl) {
        setActiveTab(tabFromUrl);
      }
    }
  }, [searchParams, initialTab]);

  // Fetch team stats from new API with localStorage caching
  useEffect(() => {
    const fetchTeamStats = async () => {
      const cacheKey = `team-stats-${team.id}`;

      try {
        // Try to load cached stats first to show immediately
        const cachedStats = localStorage.getItem(cacheKey);
        if (cachedStats) {
          try {
            const parsed = JSON.parse(cachedStats);
            setTeamStats(parsed);
          } catch {
            // Invalid cache, ignore
          }
        }

        // Fetch fresh stats
        const response = await fetch(getApiPath(`nfl/teams/api/team-stats/${team.id}/`));
        console.log('Team stats response status:', response.status);
        if (response.ok) {
          const data = await response.json();
          console.log('Team stats data:', data);
          console.log('Setting teamStats to:', data.stats);
          setTeamStats(data.stats);

          // Cache the successful response
          try {
            localStorage.setItem(cacheKey, JSON.stringify(data.stats));
          } catch {
            // localStorage might be full or unavailable
          }
        } else {
          console.error('Failed to fetch team stats:', response.status);
          // Keep showing cached data if fetch fails
        }
      } catch (error) {
        console.error('Error fetching team stats:', error);
        // Keep showing cached data if fetch fails
      }
    };

    fetchTeamStats();
  }, [team.id]);

  const handleTabChange = (tab: string) => {
    // Don't do anything if clicking the already active tab
    if (tab === activeTab) return;

    // Track tab change for analytics
    trackTabChange(tab, team.id);

    // Use optimized tab change with requestAnimationFrame batching
    optimizedTabChange(tab);

    // Navigate to path-based URL
    if (tab === 'overview') {
      router.replace(`/teams/${team.id}`, { scroll: false });
    } else {
      router.replace(`/teams/${team.id}/${tab}`, { scroll: false });
    }
  };

  const renderActiveTab = () => {
    // Wrap each tab with ErrorBoundary for graceful error handling
    const wrapWithErrorBoundary = (component: React.ReactNode, tabName: string) => (
      <ErrorBoundary teamColor={team.primaryColor} componentName={tabName}>
        {component}
      </ErrorBoundary>
    );

    switch (activeTab) {
      case 'overview':
        return wrapWithErrorBoundary(
          <OverviewTab team={team} onTabChange={handleTabChange} schedule={teamSchedule} divisionStandings={divisionStandings} />,
          'Overview'
        );
      case 'team-info':
        return wrapWithErrorBoundary(<TeamInfoTab team={team} />, 'Team Info');
      case 'draft-picks':
        return wrapWithErrorBoundary(<DraftPicksTab team={team} />, 'Draft Picks');
      case 'transactions':
        return wrapWithErrorBoundary(<TransactionsTab team={team} />, 'Transactions');
      case 'salary-cap':
        return wrapWithErrorBoundary(<SalaryCapTab team={team} />, 'Salary Cap');
      case 'roster':
        return wrapWithErrorBoundary(<RosterTab team={team} />, 'Roster');
      case 'depth-chart':
        return wrapWithErrorBoundary(<DepthChartTab team={team} />, 'Depth Chart');
      case 'schedule':
        return wrapWithErrorBoundary(<ScheduleTab team={team} />, 'Schedule');
      case 'stats':
        return wrapWithErrorBoundary(<StatsTab team={team} />, 'Stats');
      case 'news':
        return wrapWithErrorBoundary(<NewsTab team={team} />, 'News');
      case 'injury-report':
        return wrapWithErrorBoundary(<InjuryReportTab team={team} />, 'Injury Report');
      default:
        return wrapWithErrorBoundary(
          <OverviewTab team={team} onTabChange={handleTabChange} />,
          'Overview'
        );
    }
  };

  return (
    <>
      <CriticalCSS />
      <PerformanceMonitor />

      {/* Main content - No sidebar here, layout.tsx handles it */}
      <main id="main-content" className="w-full min-w-0 bg-gray-50">
        <LayoutStabilizer minHeight={200}>
          <TeamHeroSection
            team={team}
            liveRecord={standings?.recordString}
            liveDivisionRank={standings?.divisionRank}
            teamStats={teamStats}
          />
        </LayoutStabilizer>

        <NavigationTabs activeTab={activeTab} onTabChange={handleTabChange} team={team} />

        {/* Raptive Header Ad - Below Tabs */}
        <div className="container mx-auto px-4 h-[120px] flex items-center justify-center">
          <div className="raptive-pfn-header-90 w-full h-full"></div>
        </div>

        <LayoutStabilizer minHeight={400} className="w-full max-w-none px-4 py-6 pb-24">
          {renderActiveTab()}
        </LayoutStabilizer>
      </main>
    </>
  );
}

export default function TeamPage({ team, initialTab }: TeamPageProps) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="loading-skeleton w-32 h-8 rounded"></div>
      </div>
    }>
      <TeamPageContent team={team} initialTab={initialTab} />
    </Suspense>
  );
}