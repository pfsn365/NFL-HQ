'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import NFLTeamsSidebar from '@/components/NFLTeamsSidebar';
import HistoryTab from '@/components/super-bowl/HistoryTab';
import HeadToHeadTab from '@/components/super-bowl/HeadToHeadTab';
import InjuryReportTab from '@/components/super-bowl/InjuryReportTab';
import StatsComparisonTab from '@/components/super-bowl/StatsComparisonTab';
import RostersDepthChartsTab from '@/components/super-bowl/RostersDepthChartsTab';
import PathToSuperBowlTab from '@/components/super-bowl/PathToSuperBowlTab';
import { getApiPath } from '@/utils/api';

// Countdown Timer Component
function CountdownTimer({ targetDate }: { targetDate: string }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(targetDate).getTime() - new Date().getTime();
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <div className="text-center">
      <div className="text-white text-xs sm:text-sm lg:text-base font-semibold uppercase tracking-wider mb-1 sm:mb-2">Kickoff In</div>
      <div className="flex gap-1 sm:gap-2 lg:gap-3 justify-center">
        <div className="bg-black/30 backdrop-blur-sm rounded w-10 sm:w-14 lg:w-16 py-1 sm:py-2 lg:py-3">
          <div className="text-white font-bold text-base sm:text-xl lg:text-2xl tabular-nums">{timeLeft.days}</div>
          <div className="text-white text-[10px] sm:text-xs uppercase">Days</div>
        </div>
        <div className="bg-black/30 backdrop-blur-sm rounded w-10 sm:w-14 lg:w-16 py-1 sm:py-2 lg:py-3">
          <div className="text-white font-bold text-base sm:text-xl lg:text-2xl tabular-nums">{timeLeft.hours}</div>
          <div className="text-white text-[10px] sm:text-xs uppercase">Hrs</div>
        </div>
        <div className="bg-black/30 backdrop-blur-sm rounded w-10 sm:w-14 lg:w-16 py-1 sm:py-2 lg:py-3">
          <div className="text-white font-bold text-base sm:text-xl lg:text-2xl tabular-nums">{timeLeft.minutes}</div>
          <div className="text-white text-[10px] sm:text-xs uppercase">Min</div>
        </div>
        <div className="bg-black/30 backdrop-blur-sm rounded w-10 sm:w-14 lg:w-16 py-1 sm:py-2 lg:py-3">
          <div className="text-white font-bold text-base sm:text-xl lg:text-2xl tabular-nums">{timeLeft.seconds}</div>
          <div className="text-white text-[10px] sm:text-xs uppercase">Sec</div>
        </div>
      </div>
    </div>
  );
}

type MainTab = 'overview' | 'path' | 'rosters' | 'injuries' | 'stats' | 'head-to-head' | 'history';

interface Article {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  author?: string;
  category?: string;
  featuredImage?: string;
}

export default function SuperBowlLXContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<MainTab>(() => {
    const validTabs: MainTab[] = ['overview', 'path', 'rosters', 'injuries', 'stats', 'head-to-head', 'history'];
    if (tabParam && validTabs.includes(tabParam as MainTab)) return tabParam as MainTab;
    return 'overview';
  });
  const [activeMatchup, setActiveMatchup] = useState<'seahawks-offense' | 'patriots-offense'>('seahawks-offense');
  const [articles, setArticles] = useState<Article[]>([]);
  const [articlesLoading, setArticlesLoading] = useState(true);
  const [articlesError, setArticlesError] = useState<string | null>(null);
  const [visibleArticles, setVisibleArticles] = useState(3);

  // Sync tab state with URL param
  useEffect(() => {
    const validTabs: MainTab[] = ['overview', 'path', 'rosters', 'injuries', 'stats', 'head-to-head', 'history'];
    if (tabParam && validTabs.includes(tabParam as MainTab)) {
      setActiveTab(tabParam as MainTab);
    } else if (!tabParam) {
      setActiveTab('overview');
    }
  }, [tabParam]);

  // Handle tab change and update URL
  const handleTabChange = (tabId: MainTab) => {
    setActiveTab(tabId);
    router.push(`/super-bowl-lx?tab=${tabId}`, { scroll: false });
  };

  useEffect(() => {
    fetchSuperBowlArticles();
  }, []);

  const fetchSuperBowlArticles = async () => {
    try {
      setArticlesLoading(true);
      setArticlesError(null);

      const rssUrl = encodeURIComponent('https://www.profootballnetwork.com/tag/super-bowl-60/feed/');
      const response = await fetch(getApiPath(`api/proxy-rss?url=${rssUrl}`));

      if (!response.ok) {
        throw new Error('Failed to fetch articles');
      }

      const data = await response.json();

      if (data.articles && data.articles.length > 0) {
        setArticles(data.articles);
      } else {
        throw new Error('No articles found');
      }
    } catch (err) {
      console.error('Error fetching Super Bowl articles:', err);
      setArticlesError('Failed to load articles. Please try again later.');
    } finally {
      setArticlesLoading(false);
    }
  };

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
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }
  };

  const truncateDescription = (text: string, maxLength: number = 150) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const loadMoreArticles = () => {
    setVisibleArticles(prev => prev + 3);
  };

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

      {/* Main content */}
      <main id="main-content" className="flex-1 lg:ml-64 min-w-0">
        {/* Header */}
        <div className="bg-[#0050A0] text-white pt-[57px] lg:pt-0 pb-4 lg:pb-6">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-4 lg:pt-10">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-3">
                  Super Bowl HQ
                </h1>
                <p className="text-base sm:text-lg lg:text-xl xl:text-2xl opacity-90">
                  Super Bowl LX coverage and information
                </p>
              </div>
              <img
                src="https://staticd.profootballnetwork.com/skm/assets/pfn/sblx-logo.png"
                alt="Super Bowl LX Logo"
                className="h-16 sm:h-20 lg:h-24 xl:h-28 w-auto object-contain"
              />
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white border-b border-gray-200">
          <div className="container mx-auto px-4 xl:px-8">
            <nav className="flex space-x-1 sm:space-x-4 lg:space-x-8 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
              {[
                { id: 'overview', label: 'Overview', mobileLabel: 'Overview' },
                { id: 'path', label: 'Path to Super Bowl', mobileLabel: 'Path' },
                { id: 'rosters', label: 'Rosters & Depth Charts', mobileLabel: 'Rosters' },
                { id: 'injuries', label: 'Injury Report', mobileLabel: 'Injuries' },
                { id: 'stats', label: 'Stats Comparison', mobileLabel: 'Stats' },
                { id: 'head-to-head', label: 'Head-to-Head', mobileLabel: 'H2H' },
                { id: 'history', label: 'Super Bowl History', mobileLabel: 'History' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id as MainTab)}
                  className={`py-3 sm:py-4 px-2 sm:px-3 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap transition-colors cursor-pointer min-h-[44px] ${
                    activeTab === tab.id
                      ? 'border-[#0050A0] text-[#0050A0]'
                      : 'border-transparent text-gray-600 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="sm:hidden">{tab.mobileLabel}</span>
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Raptive Header Ad - Below Tabs */}
        <div className="container mx-auto px-4 h-[120px] flex items-center justify-center">
          <div className="raptive-pfn-header-90 w-full h-full"></div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 xl:px-8 py-8">
          {activeTab === 'history' && <HistoryTab />}
          {activeTab === 'path' && <PathToSuperBowlTab />}
          {activeTab === 'rosters' && <RostersDepthChartsTab />}
          {activeTab === 'injuries' && <InjuryReportTab />}
          {activeTab === 'stats' && <StatsComparisonTab />}
          {activeTab === 'head-to-head' && <HeadToHeadTab />}
          {activeTab === 'overview' && (
            <>

              {/* Hero Section with Gradient */}
              <div className="bg-gradient-to-r from-[#C60C30] via-[#002244] via-50% to-[#69BE28] rounded-xl p-4 sm:p-6 mb-4 sm:mb-6 shadow-lg">
                {/* Team Logos and Super Bowl Logo */}
                <div className="flex items-center justify-between sm:justify-center gap-2 sm:gap-8 lg:gap-12">
                  {/* Patriots Side */}
                  <div className="flex flex-col items-center flex-shrink-0">
                    <img
                      src="/nfl-hq/new-england-patriots.png"
                      alt="New England Patriots"
                      className="w-16 h-16 sm:w-36 sm:h-36 lg:w-44 lg:h-44 object-contain drop-shadow-lg"
                    />
                    {/* Record Badge */}
                    <div className="mt-1 sm:mt-2 bg-white/20 backdrop-blur-sm rounded-full px-1.5 sm:px-4 py-0.5 sm:py-1">
                      <span className="text-white font-bold text-[10px] sm:text-xl">14-3</span>
                      <span className="text-white text-[8px] sm:text-sm ml-0.5 sm:ml-2">#2 AFC</span>
                    </div>
                  </div>

                  {/* Countdown Timer Center */}
                  <div className="flex flex-col items-center justify-center flex-shrink min-w-0">
                    <CountdownTimer targetDate="2026-02-08T18:30:00-05:00" />
                  </div>

                  {/* Seahawks Side */}
                  <div className="flex flex-col items-center flex-shrink-0">
                    <img
                      src="/nfl-hq/seattle-seahawks-sb.png"
                      alt="Seattle Seahawks"
                      className="w-16 h-16 sm:w-36 sm:h-36 lg:w-44 lg:h-44 object-contain drop-shadow-lg"
                    />
                    {/* Record Badge */}
                    <div className="mt-1 sm:mt-2 bg-white/20 backdrop-blur-sm rounded-full px-1.5 sm:px-4 py-0.5 sm:py-1">
                      <span className="text-white font-bold text-[10px] sm:text-xl">14-3</span>
                      <span className="text-white text-[8px] sm:text-sm ml-0.5 sm:ml-2">#1 NFC</span>
                    </div>
                  </div>
                </div>
              </div>

          {/* Three Column Layout: Broadcast Info | Stats | Game Info */}
          <div className="flex flex-col lg:flex-row gap-4 lg:gap-8 items-start">
            {/* Broadcast Information Box - Left (hidden below 1400px) */}
            <div className="hidden min-[1400px]:block w-full lg:w-[300px] lg:flex-shrink-0 rounded-lg overflow-hidden border border-gray-200">
              <div className="bg-[#0050A0] text-white px-4 py-3">
                <h3 className="font-semibold text-center">Broadcast Information</h3>
              </div>
              <div className="bg-white p-4 space-y-3">
                <div>
                  <span className="font-semibold text-gray-700">Television:</span>
                  <span className="text-gray-600 ml-2">NBC</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Streaming:</span>
                  <span className="text-gray-600 ml-2">Peacock & NFL+</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Spanish:</span>
                  <span className="text-gray-600 ml-2">Telemundo</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Radio:</span>
                  <span className="text-gray-600 ml-2">Westwood One & Entravision</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Halftime Show:</span>
                  <span className="text-gray-600 ml-2">Bad Bunny</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Opening Ceremony:</span>
                  <span className="text-gray-600 ml-2">Green Day</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">National Anthem:</span>
                  <span className="text-gray-600 ml-2">Charlie Puth (ASL: Fred Beam)</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">America the Beautiful:</span>
                  <span className="text-gray-600 ml-2">Brandi Carlile (ASL: Julian Ortiz)</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Lift Every Voice & Sing:</span>
                  <span className="text-gray-600 ml-2">Coco Jones (ASL: Fred Beam)</span>
                </div>
              </div>
            </div>

            {/* Stats Table - Center with Team Color Accents */}
            <div className="flex-1 w-full rounded-lg overflow-hidden border border-gray-200">
              <div className="overflow-x-auto">
                <div className="min-w-[320px]">
                  {/* Header Row */}
                  <div className="flex">
                    <div className="flex-1 p-2 sm:p-3 text-center font-bold text-white bg-[#002244] border-b-4 border-[#C60C30] text-sm sm:text-base">Patriots</div>
                    <div className="w-[100px] sm:w-[140px] lg:w-[180px] xl:w-[250px] p-2 sm:p-3 text-center font-semibold text-white bg-[#0050A0] text-xs sm:text-sm lg:text-base">Category</div>
                    <div className="flex-1 p-2 sm:p-3 text-center font-bold text-white bg-[#002244] border-b-4 border-[#69BE28] text-sm sm:text-base">Seahawks</div>
                  </div>
                  <div className="flex">
                    <div className="flex-1 p-2 sm:p-3 text-center text-[#002244] font-semibold bg-[#002244]/5 text-xs sm:text-sm lg:text-base">44.2%</div>
                    <div className="w-[100px] sm:w-[140px] lg:w-[180px] xl:w-[250px] p-2 sm:p-3 text-center font-semibold text-white bg-[#0050A0] text-[10px] sm:text-xs lg:text-sm">Projected Win Rate</div>
                    <div className="flex-1 p-2 sm:p-3 text-center text-[#002244] font-semibold bg-[#69BE28]/10 text-xs sm:text-sm lg:text-base">55.8%</div>
                  </div>
                  <div className="flex">
                    <div className="flex-1 p-2 sm:p-3 text-center text-[#002244] bg-white text-xs sm:text-sm lg:text-base">7th</div>
                    <div className="w-[100px] sm:w-[140px] lg:w-[180px] xl:w-[250px] p-2 sm:p-3 text-center font-semibold text-white bg-[#0050A0] text-[10px] sm:text-xs lg:text-sm">Power Ranking</div>
                    <div className="flex-1 p-2 sm:p-3 text-center text-[#002244] bg-white text-xs sm:text-sm lg:text-base">1st</div>
                  </div>
                  <div className="flex">
                    <div className="flex-1 p-2 sm:p-3 text-center text-[#002244] bg-[#002244]/5 text-xs sm:text-sm lg:text-base">2nd (86.6 B)</div>
                    <div className="w-[100px] sm:w-[140px] lg:w-[180px] xl:w-[250px] p-2 sm:p-3 text-center font-semibold text-white bg-[#0050A0] text-[10px] sm:text-xs lg:text-sm">Offense</div>
                    <div className="flex-1 p-2 sm:p-3 text-center text-[#002244] bg-[#69BE28]/10 text-xs sm:text-sm lg:text-base">9th (79.8 C+)</div>
                  </div>
                  <div className="flex">
                    <div className="flex-1 p-2 sm:p-3 text-center text-[#002244] bg-white text-xs sm:text-sm lg:text-base">Maye 2nd (91.1 A-)</div>
                    <div className="w-[100px] sm:w-[140px] lg:w-[180px] xl:w-[250px] p-2 sm:p-3 text-center font-semibold text-white bg-[#0050A0] text-[10px] sm:text-xs lg:text-sm">Quarterback</div>
                    <div className="flex-1 p-2 sm:p-3 text-center text-[#002244] bg-white text-xs sm:text-sm lg:text-base">Darnold 13th (78.7 C+)</div>
                  </div>
                  <div className="flex">
                    <div className="flex-1 p-2 sm:p-3 text-center text-[#002244] bg-[#002244]/5 text-xs sm:text-sm lg:text-base">12th (74.5 C)</div>
                    <div className="w-[100px] sm:w-[140px] lg:w-[180px] xl:w-[250px] p-2 sm:p-3 text-center font-semibold text-white bg-[#0050A0] text-[10px] sm:text-xs lg:text-sm">O-Line</div>
                    <div className="flex-1 p-2 sm:p-3 text-center text-[#002244] bg-[#69BE28]/10 text-xs sm:text-sm lg:text-base">17th (72.0 C)</div>
                  </div>
                  <div className="flex">
                    <div className="flex-1 p-2 sm:p-3 text-center text-[#002244] bg-white text-xs sm:text-sm lg:text-base">12th (78.2 C+)</div>
                    <div className="w-[100px] sm:w-[140px] lg:w-[180px] xl:w-[250px] p-2 sm:p-3 text-center font-semibold text-white bg-[#0050A0] text-[10px] sm:text-xs lg:text-sm">Defense</div>
                    <div className="flex-1 p-2 sm:p-3 text-center text-[#002244] bg-white text-xs sm:text-sm lg:text-base">3rd (88.4 B+)</div>
                  </div>
                  <div className="flex">
                    <div className="flex-1 p-2 sm:p-3 text-center text-[#002244] bg-[#002244]/5 text-xs sm:text-sm lg:text-base">20th (73.9 C-)</div>
                    <div className="w-[100px] sm:w-[140px] lg:w-[180px] xl:w-[250px] p-2 sm:p-3 text-center font-semibold text-white bg-[#0050A0] text-[10px] sm:text-xs lg:text-sm">Special Teams</div>
                    <div className="flex-1 p-2 sm:p-3 text-center text-[#002244] bg-[#69BE28]/10 text-xs sm:text-sm lg:text-base">2nd (90.9 A-)</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Game Information Box - Right (hidden below 1400px) */}
            <div className="hidden min-[1400px]:block w-full lg:w-[300px] lg:flex-shrink-0 rounded-lg overflow-hidden border border-gray-200">
              <div className="bg-[#0050A0] text-white px-4 py-3">
                <h3 className="font-semibold text-center">Game Information</h3>
              </div>
              <div className="bg-white p-4 space-y-3">
                <div>
                  <span className="font-semibold text-gray-700">Date:</span>
                  <span className="text-gray-600 ml-2">February 8, 2026</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Kickoff:</span>
                  <span className="text-gray-600 ml-2">6:30 PM ET</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Stadium:</span>
                  <span className="text-gray-600 ml-2">Levi's Stadium</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Location:</span>
                  <span className="text-gray-600 ml-2">Santa Clara, CA</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Capacity:</span>
                  <span className="text-gray-600 ml-2">68,500</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Surface:</span>
                  <span className="text-gray-600 ml-2">Grass</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Referee:</span>
                  <span className="text-gray-600 ml-2">Shawn Smith</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Weather:</span>
                  <span className="text-gray-600 ml-2">TBD</span>
                </div>
              </div>
            </div>
          </div>

          {/* NFL Field Diagram with Coach Boxes on sides (1400px+) */}
          <div className="mt-[50px] flex gap-4">
            {/* Patriots Coaches Box - Left side on 1400px+ */}
            <div className="hidden min-[1400px]:block w-[375px] flex-shrink-0">
              <div className="rounded-lg overflow-hidden border border-gray-200 sticky top-4">
                <div className="bg-[#002244] text-white px-4 py-3 border-b-4 border-[#C60C30]">
                  <h3 className="font-semibold text-center">Patriots Coaches</h3>
                </div>
                <div className="bg-white p-4 space-y-3">
                  <div>
                    <span className="font-semibold text-gray-700">Head Coach:</span>
                    <span className="text-gray-600 ml-2">Mike Vrabel</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Offensive Coordinator:</span>
                    <span className="text-gray-600 ml-2">Josh McDaniels</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Defensive Coordinator:</span>
                    <span className="text-gray-600 ml-2">Terrell Williams</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Spec. Teams Coordinator:</span>
                    <span className="text-gray-600 ml-2">Jeremy Springer</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Field Diagram - Center (75% of original size) */}
            <div className="flex-1 w-full min-[1400px]:max-w-[75%] mx-auto">
                  {/* Matchup Tabs */}
                  <div className="flex">
                  <button
                    onClick={() => setActiveMatchup('seahawks-offense')}
                    className={`flex-1 py-3 px-4 font-semibold text-sm rounded-tl-lg transition-colors cursor-pointer ${
                      activeMatchup === 'seahawks-offense'
                        ? 'bg-[#0050A0] text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Seahawks Offense vs. Patriots Defense
                  </button>
                  <button
                    onClick={() => setActiveMatchup('patriots-offense')}
                    className={`flex-1 py-3 px-4 font-semibold text-sm rounded-tr-lg transition-colors cursor-pointer ${
                      activeMatchup === 'patriots-offense'
                        ? 'bg-[#0050A0] text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Patriots Offense vs. Seahawks Defense
                  </button>
                </div>

                <div className="bg-green-800 rounded-b-lg p-6 relative" style={{ minHeight: '500px' }}>
                  {/* Super Bowl Logo - Center */}
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50">
                    <img
                      src="https://staticd.profootballnetwork.com/skm/assets/pfn/sblx-logo.png"
                      alt="Super Bowl LX"
                      className="w-24 h-24 object-contain"
                    />
                  </div>

                  {/* Field lines - center line */}
                  <div className="absolute inset-x-0 top-1/2 h-[2px] bg-white/50"></div>

                  {/* Hash marks - left side */}
                  <div className="absolute left-0 top-[10%] w-4 border-t-2 border-white/50"></div>
                  <div className="absolute left-0 top-[20%] w-4 border-t-2 border-white/50"></div>
                  <div className="absolute left-0 top-[30%] w-4 border-t-2 border-white/50"></div>
                  <div className="absolute left-0 top-[40%] w-4 border-t-2 border-white/50"></div>
                  <div className="absolute left-0 top-[50%] w-4 border-t-2 border-white/50"></div>
                  <div className="absolute left-0 top-[60%] w-4 border-t-2 border-white/50"></div>
                  <div className="absolute left-0 top-[70%] w-4 border-t-2 border-white/50"></div>
                  <div className="absolute left-0 top-[80%] w-4 border-t-2 border-white/50"></div>
                  <div className="absolute left-0 top-[90%] w-4 border-t-2 border-white/50"></div>

                  {/* Hash marks - right side */}
                  <div className="absolute right-0 top-[10%] w-4 border-t-2 border-white/50"></div>
                  <div className="absolute right-0 top-[20%] w-4 border-t-2 border-white/50"></div>
                  <div className="absolute right-0 top-[30%] w-4 border-t-2 border-white/50"></div>
                  <div className="absolute right-0 top-[40%] w-4 border-t-2 border-white/50"></div>
                  <div className="absolute right-0 top-[50%] w-4 border-t-2 border-white/50"></div>
                  <div className="absolute right-0 top-[60%] w-4 border-t-2 border-white/50"></div>
                  <div className="absolute right-0 top-[70%] w-4 border-t-2 border-white/50"></div>
                  <div className="absolute right-0 top-[80%] w-4 border-t-2 border-white/50"></div>
                  <div className="absolute right-0 top-[90%] w-4 border-t-2 border-white/50"></div>

                  {/* Defense Section */}
                  <div className="mb-20">
                    <p className="text-white text-center font-bold mb-4 text-lg">
                      {activeMatchup === 'seahawks-offense' ? 'PATRIOTS DEFENSE' : 'SEAHAWKS DEFENSE'}
                    </p>

                    {/* Safeties */}
                    <div className="flex justify-center gap-24 mb-4">
                      <div className="text-center">
                        <span className="bg-white text-green-800 w-14 py-1 rounded font-bold text-sm block text-center mx-auto">S</span>
                        <span className="text-white text-xs mt-1 block">{activeMatchup === 'seahawks-offense' ? 'Hawkins' : 'Bryant'}</span>
                        <span className="text-white text-xs block">{activeMatchup === 'seahawks-offense' ? '76.4 C' : '84.0 B'}</span>
                      </div>
                      <div className="text-center">
                        <span className="bg-white text-green-800 w-14 py-1 rounded font-bold text-sm block text-center mx-auto">S</span>
                        <span className="text-white text-xs mt-1 block">{activeMatchup === 'seahawks-offense' ? 'Woodson' : 'Love'}</span>
                        <span className="text-white text-xs block">{activeMatchup === 'seahawks-offense' ? '69.7 D+' : '90.7 A-'}</span>
                      </div>
                    </div>

                    {/* Cornerbacks and Linebackers on same level */}
                    <div className="flex justify-between px-8 mb-4">
                      <div className="text-center">
                        <span className="bg-white text-green-800 w-14 py-1 rounded font-bold text-sm block text-center mx-auto">CB</span>
                        <span className="text-white text-xs mt-1 block">{activeMatchup === 'seahawks-offense' ? 'Gonzalez' : 'Woolen'}</span>
                        <span className="text-white text-xs block">{activeMatchup === 'seahawks-offense' ? '85.7 B' : '81.7 B-'}</span>
                      </div>
                      <div className="text-center">
                        <span className="bg-white text-green-800 w-14 py-1 rounded font-bold text-sm block text-center mx-auto">LB</span>
                        <span className="text-white text-xs mt-1 block">{activeMatchup === 'seahawks-offense' ? 'Spillane' : 'Jones'}</span>
                        <span className="text-white text-xs block">{activeMatchup === 'seahawks-offense' ? '85.3 B' : '89.9 B+'}</span>
                      </div>
                      <div className="text-center">
                        <span className="bg-white text-green-800 w-14 py-1 rounded font-bold text-sm block text-center mx-auto">LB</span>
                        <span className="text-white text-xs mt-1 block">{activeMatchup === 'seahawks-offense' ? 'Gibbens' : 'Thomas'}</span>
                        <span className="text-white text-xs block">{activeMatchup === 'seahawks-offense' ? '70.4 C-' : '77.9 C+'}</span>
                      </div>
                      <div className="text-center">
                        <span className="bg-white text-green-800 w-14 py-1 rounded font-bold text-sm block text-center mx-auto">{activeMatchup === 'seahawks-offense' ? 'LB' : 'S'}</span>
                        <span className="text-white text-xs mt-1 block">{activeMatchup === 'seahawks-offense' ? 'Elliss' : 'Emmanwori'}</span>
                        <span className="text-white text-xs block">{activeMatchup === 'seahawks-offense' ? '62.7 D-' : '80.2 B-'}</span>
                      </div>
                      <div className="text-center">
                        <span className="bg-white text-green-800 w-14 py-1 rounded font-bold text-sm block text-center mx-auto">CB</span>
                        <span className="text-white text-xs mt-1 block">{activeMatchup === 'seahawks-offense' ? 'Davis III' : 'Witherspoon'}</span>
                        <span className="text-white text-xs block">{activeMatchup === 'seahawks-offense' ? '78.8 C+' : '76.2 C'}</span>
                      </div>
                    </div>

                    {/* Defensive Line */}
                    <div className="flex justify-center gap-4">
                      <div className="text-center">
                        <span className="bg-white text-green-800 w-14 py-1 rounded font-bold text-sm block text-center mx-auto">EDGE</span>
                        <span className="text-white text-xs mt-1 block">{activeMatchup === 'seahawks-offense' ? 'Landry III' : 'Nwosu'}</span>
                        <span className="text-white text-xs block">{activeMatchup === 'seahawks-offense' ? '76.3 C' : '74.0 C'}</span>
                      </div>
                      <div className="text-center">
                        <span className="bg-white text-green-800 w-14 py-1 rounded font-bold text-sm block text-center mx-auto">DT</span>
                        <span className="text-white text-xs mt-1 block">{activeMatchup === 'seahawks-offense' ? 'Williams' : 'Williams'}</span>
                        <span className="text-white text-xs block">{activeMatchup === 'seahawks-offense' ? '87.9 B+' : '84.2 B'}</span>
                      </div>
                      <div className="text-center">
                        <span className="bg-white text-green-800 w-14 py-1 rounded font-bold text-sm block text-center mx-auto">DT</span>
                        <span className="text-white text-xs mt-1 block">{activeMatchup === 'seahawks-offense' ? 'Barmore' : 'Murphy II'}</span>
                        <span className="text-white text-xs block">{activeMatchup === 'seahawks-offense' ? '78.6 C+' : '81.2 B-'}</span>
                      </div>
                      <div className="text-center">
                        <span className="bg-white text-green-800 w-14 py-1 rounded font-bold text-sm block text-center mx-auto">EDGE</span>
                        <span className="text-white text-xs mt-1 block">{activeMatchup === 'seahawks-offense' ? 'Chaisson' : 'Lawrence'}</span>
                        <span className="text-white text-xs block">{activeMatchup === 'seahawks-offense' ? '76.2 C' : '81.5 B-'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Offense Section */}
                  <div className="mt-20">
                    <p className="text-white text-center font-bold mb-4 text-lg">
                      {activeMatchup === 'seahawks-offense' ? 'SEAHAWKS OFFENSE' : 'PATRIOTS OFFENSE'}
                    </p>

                    {/* Offensive Line with TE on right */}
                    <div className="flex justify-center gap-4 mb-4">
                      <div className="text-center">
                        <span className="bg-white text-green-800 w-14 py-1 rounded font-bold text-sm block text-center mx-auto">LT</span>
                        <span className="text-white text-xs mt-1 block">{activeMatchup === 'patriots-offense' ? 'Campbell' : 'Cross'}</span>
                        <span className="text-white text-xs block">{activeMatchup === 'patriots-offense' ? '75.1 C' : '79.1 C+'}</span>
                      </div>
                      <div className="text-center">
                        <span className="bg-white text-green-800 w-14 py-1 rounded font-bold text-sm block text-center mx-auto">LG</span>
                        <span className="text-white text-xs mt-1 block">{activeMatchup === 'patriots-offense' ? 'Wilson' : 'Zabel'}</span>
                        <span className="text-white text-xs block">{activeMatchup === 'patriots-offense' ? '69.5 D+' : '77.1 C+'}</span>
                      </div>
                      <div className="text-center">
                        <span className="bg-white text-green-800 w-14 py-1 rounded font-bold text-sm block text-center mx-auto">C</span>
                        <span className="text-white text-xs mt-1 block">{activeMatchup === 'patriots-offense' ? 'Bradbury' : 'Sundell'}</span>
                        <span className="text-white text-xs block">{activeMatchup === 'patriots-offense' ? '80.4 B-' : '78.6 C+'}</span>
                      </div>
                      <div className="text-center">
                        <span className="bg-white text-green-800 w-14 py-1 rounded font-bold text-sm block text-center mx-auto">RG</span>
                        <span className="text-white text-xs mt-1 block">{activeMatchup === 'patriots-offense' ? 'Onwenu' : 'Bradford'}</span>
                        <span className="text-white text-xs block">{activeMatchup === 'patriots-offense' ? '87.0 B+' : '74.7 C'}</span>
                      </div>
                      <div className="text-center">
                        <span className="bg-white text-green-800 w-14 py-1 rounded font-bold text-sm block text-center mx-auto">RT</span>
                        <span className="text-white text-xs mt-1 block">{activeMatchup === 'patriots-offense' ? 'Moses' : 'Lucas'}</span>
                        <span className="text-white text-xs block">{activeMatchup === 'patriots-offense' ? '85.2 B' : '82.5 B-'}</span>
                      </div>
                    </div>

                    {/* WRs and QB on same level */}
                    <div className="flex justify-between px-8 mb-4">
                      <div className="text-center w-20">
                        <span className="bg-white text-green-800 w-14 py-1 rounded font-bold text-sm block text-center mx-auto">WR</span>
                        <span className="text-white text-xs mt-1 block">{activeMatchup === 'patriots-offense' ? 'Diggs' : 'Smith-Njigba'}</span>
                        <span className="text-white text-xs block">{activeMatchup === 'patriots-offense' ? '87.0 B+' : '94.4 A'}</span>
                      </div>
                      <div className="text-center w-20">
                        <span className="bg-white text-green-800 w-14 py-1 rounded font-bold text-sm block text-center mx-auto">TE</span>
                        <span className="text-white text-xs mt-1 block">{activeMatchup === 'patriots-offense' ? 'Henry' : 'Barner'}</span>
                        <span className="text-white text-xs block">{activeMatchup === 'patriots-offense' ? '82.0 B-' : '77.4 C+'}</span>
                      </div>
                      <div className="text-center w-20">
                        <span className="bg-white text-green-800 w-14 py-1 rounded font-bold text-sm block text-center mx-auto">QB</span>
                        <span className="text-white text-xs mt-1 block">{activeMatchup === 'patriots-offense' ? 'Maye' : 'Darnold'}</span>
                        <span className="text-white text-xs block">{activeMatchup === 'patriots-offense' ? '91.1 A-' : '78.7 C+'}</span>
                      </div>
                      <div className="text-center w-20">
                        <span className="bg-white text-green-800 w-14 py-1 rounded font-bold text-sm block text-center mx-auto">WR</span>
                        <span className="text-white text-xs mt-1 block">{activeMatchup === 'patriots-offense' ? 'Douglas' : 'Shaheed'}</span>
                        <span className="text-white text-xs block">{activeMatchup === 'patriots-offense' ? '79.3 C+' : '71.9 C-'}</span>
                      </div>
                      <div className="text-center w-20">
                        <span className="bg-white text-green-800 w-14 py-1 rounded font-bold text-sm block text-center mx-auto">WR</span>
                        <span className="text-white text-xs mt-1 block">{activeMatchup === 'patriots-offense' ? 'Boutte' : 'Kupp'}</span>
                        <span className="text-white text-xs block">{activeMatchup === 'patriots-offense' ? '81.5 B-' : '73.2 C'}</span>
                      </div>
                    </div>

                    {/* RB */}
                    <div className="flex justify-center">
                      <div className="text-center">
                        <span className="bg-white text-green-800 w-14 py-1 rounded font-bold text-sm block text-center mx-auto">RB</span>
                        <span className="text-white text-xs mt-1 block">{activeMatchup === 'patriots-offense' ? 'Stevenson' : 'Walker III'}</span>
                        <span className="text-white text-xs block">{activeMatchup === 'patriots-offense' ? '54.4 F' : '65.8 D'}</span>
                      </div>
                    </div>
                  </div>
                </div>
            </div>

            {/* Seahawks Coaches Box - Right side on 1400px+ */}
            <div className="hidden min-[1400px]:block w-[375px] flex-shrink-0">
              <div className="rounded-lg overflow-hidden border border-gray-200 sticky top-4">
                <div className="bg-[#002244] text-white px-4 py-3 border-b-4 border-[#69BE28]">
                  <h3 className="font-semibold text-center">Seahawks Coaches</h3>
                </div>
                <div className="bg-white p-4 space-y-3">
                  <div>
                    <span className="font-semibold text-gray-700">Head Coach:</span>
                    <span className="text-gray-600 ml-2">Mike Macdonald</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Offensive Coordinator:</span>
                    <span className="text-gray-600 ml-2">Klint Kubiak</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Defensive Coordinator:</span>
                    <span className="text-gray-600 ml-2">Aden Durde</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Spec. Teams Coordinator:</span>
                    <span className="text-gray-600 ml-2">Jay Harbaugh</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

              {/* Coach Boxes - Only visible below 1400px */}
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 min-[1400px]:hidden">
                {/* Patriots Coaches Box */}
                <div className="rounded-lg overflow-hidden border border-gray-200">
                  <div className="bg-[#002244] text-white px-4 py-3 border-b-4 border-[#C60C30]">
                    <h3 className="font-semibold text-center">Patriots Coaches</h3>
                  </div>
                  <div className="bg-white p-4 space-y-3">
                    <div>
                      <span className="font-semibold text-gray-700">Head Coach:</span>
                      <span className="text-gray-600 ml-2">Mike Vrabel</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Offensive Coordinator:</span>
                      <span className="text-gray-600 ml-2">Josh McDaniels</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Defensive Coordinator:</span>
                      <span className="text-gray-600 ml-2">Terrell Williams</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Spec. Teams Coordinator:</span>
                      <span className="text-gray-600 ml-2">Jeremy Springer</span>
                    </div>
                  </div>
                </div>
                {/* Seahawks Coaches Box */}
                <div className="rounded-lg overflow-hidden border border-gray-200">
                  <div className="bg-[#002244] text-white px-4 py-3 border-b-4 border-[#69BE28]">
                    <h3 className="font-semibold text-center">Seahawks Coaches</h3>
                  </div>
                  <div className="bg-white p-4 space-y-3">
                    <div>
                      <span className="font-semibold text-gray-700">Head Coach:</span>
                      <span className="text-gray-600 ml-2">Mike Macdonald</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Offensive Coordinator:</span>
                      <span className="text-gray-600 ml-2">Klint Kubiak</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Defensive Coordinator:</span>
                      <span className="text-gray-600 ml-2">Aden Durde</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Spec. Teams Coordinator:</span>
                      <span className="text-gray-600 ml-2">Jay Harbaugh</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Broadcast and Game Info - Only visible below 1400px */}
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 min-[1400px]:hidden">
                {/* Broadcast Information Box */}
                <div className="rounded-lg overflow-hidden border border-gray-200">
                  <div className="bg-[#0050A0] text-white px-4 py-3">
                    <h3 className="font-semibold text-center">Broadcast Information</h3>
                  </div>
                  <div className="bg-white p-4 space-y-3">
                    <div>
                      <span className="font-semibold text-gray-700">Television:</span>
                      <span className="text-gray-600 ml-2">NBC</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Streaming:</span>
                      <span className="text-gray-600 ml-2">Peacock & NFL+</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Spanish:</span>
                      <span className="text-gray-600 ml-2">Telemundo</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Radio:</span>
                      <span className="text-gray-600 ml-2">Westwood One & Entravision</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Halftime Show:</span>
                      <span className="text-gray-600 ml-2">Bad Bunny</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Opening Ceremony:</span>
                      <span className="text-gray-600 ml-2">Green Day</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">National Anthem:</span>
                      <span className="text-gray-600 ml-2">Charlie Puth (ASL: Fred Beam)</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">America the Beautiful:</span>
                      <span className="text-gray-600 ml-2">Brandi Carlile (ASL: Julian Ortiz)</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Lift Every Voice & Sing:</span>
                      <span className="text-gray-600 ml-2">Coco Jones (ASL: Fred Beam)</span>
                    </div>
                  </div>
                </div>
                {/* Game Information Box */}
                <div className="rounded-lg overflow-hidden border border-gray-200">
                  <div className="bg-[#0050A0] text-white px-4 py-3">
                    <h3 className="font-semibold text-center">Game Information</h3>
                  </div>
                  <div className="bg-white p-4 space-y-3">
                    <div>
                      <span className="font-semibold text-gray-700">Date:</span>
                      <span className="text-gray-600 ml-2">February 8, 2026</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Kickoff:</span>
                      <span className="text-gray-600 ml-2">6:30 PM ET</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Stadium:</span>
                      <span className="text-gray-600 ml-2">Levi's Stadium</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Location:</span>
                      <span className="text-gray-600 ml-2">Santa Clara, CA</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Capacity:</span>
                      <span className="text-gray-600 ml-2">68,500</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Surface:</span>
                      <span className="text-gray-600 ml-2">Grass</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Referee:</span>
                      <span className="text-gray-600 ml-2">Shawn Smith</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Weather:</span>
                      <span className="text-gray-600 ml-2">TBD</span>
                    </div>
                  </div>
                </div>
              </div>

          {/* Latest Super Bowl Articles Section */}
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Latest Super Bowl Articles</h2>

            {articlesLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, idx) => (
                  <div key={idx} className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="h-48 bg-gray-200 animate-pulse" />
                    <div className="p-4">
                      <div className="h-5 bg-gray-200 rounded w-3/4 mb-3 animate-pulse" />
                      <div className="h-4 bg-gray-200 rounded w-full mb-2 animate-pulse" />
                      <div className="h-4 bg-gray-200 rounded w-5/6 mb-3 animate-pulse" />
                      <div className="h-3 bg-gray-200 rounded w-1/4 animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {articlesError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                <p className="text-red-700 mb-4">{articlesError}</p>
                <button
                  onClick={fetchSuperBowlArticles}
                  className="px-4 py-2 bg-[#0050A0] text-white rounded-lg hover:bg-[#003d7a] transition-colors"
                >
                  Try Again
                </button>
              </div>
            )}

            {!articlesLoading && !articlesError && articles.length === 0 && (
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <p className="text-gray-600">No Super Bowl articles available at this time.</p>
              </div>
            )}

            {!articlesLoading && !articlesError && articles.length > 0 && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {articles.slice(0, visibleArticles).map((article, idx) => (
                    <a
                      key={idx}
                      href={article.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow group"
                    >
                      {article.featuredImage ? (
                        <div className="h-48 overflow-hidden">
                          <img
                            src={article.featuredImage}
                            alt={article.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      ) : (
                        <div className="h-48 bg-gradient-to-br from-[#0050A0] to-[#003d7a] flex items-center justify-center">
                          <img
                            src="https://staticd.profootballnetwork.com/skm/assets/pfn/sblx-logo.png"
                            alt="Super Bowl LX"
                            className="w-24 h-24 object-contain opacity-50"
                          />
                        </div>
                      )}
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-[#0050A0] transition-colors">
                          {article.title}
                        </h3>
                        {article.description && (
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                            {truncateDescription(article.description)}
                          </p>
                        )}
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">{getRelativeTime(article.pubDate)}</span>
                          <span className="font-medium text-[#0050A0]">Read More →</span>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>

                {visibleArticles < articles.length && (
                  <div className="text-center mt-8">
                    <button
                      onClick={loadMoreArticles}
                      className="px-6 py-3 bg-[#0050A0] text-white rounded-lg hover:bg-[#003d7a] transition-colors font-medium"
                    >
                      Show More
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
