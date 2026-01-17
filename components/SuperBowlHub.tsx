'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import NFLTeamsSidebar from '@/components/NFLTeamsSidebar';
import { superBowlLX } from '@/data/superBowlHistory';

// Import tab components
import MatchupTab from './super-bowl/MatchupTab';
import PlayoffBracketTab from './super-bowl/PlayoffBracketTab';
import HistoryTab from './super-bowl/HistoryTab';
import PredictionsTab from './super-bowl/PredictionsTab';
import EventInfoTab from './super-bowl/EventInfoTab';

type TabId = 'matchup' | 'bracket' | 'history' | 'predictions' | 'event-info';

interface Tab {
  id: TabId;
  label: string;
}

// Super Bowl date in UTC (6:30 PM ET = 23:30 UTC on Feb 8, 2026)
const SUPER_BOWL_DATE = new Date('2026-02-08T23:30:00Z');

export default function SuperBowlHub() {
  const [activeTab, setActiveTab] = useState<TabId>('matchup');
  const navRef = useRef<HTMLElement>(null);
  const activeLinkRef = useRef<HTMLButtonElement>(null);

  const tabs: Tab[] = useMemo(() => [
    { id: 'matchup', label: 'Matchup' },
    { id: 'bracket', label: 'Playoff Bracket' },
    { id: 'history', label: 'Super Bowl History' },
    { id: 'predictions', label: 'Predictions' },
    { id: 'event-info', label: 'Event Info' },
  ], []);

  // Scroll active tab into view
  useEffect(() => {
    if (activeLinkRef.current && navRef.current) {
      const link = activeLinkRef.current;
      const nav = navRef.current;

      requestAnimationFrame(() => {
        const linkRect = link.getBoundingClientRect();
        const navRect = nav.getBoundingClientRect();

        const linkLeft = linkRect.left - navRect.left + nav.scrollLeft;
        const linkRight = linkLeft + linkRect.width;
        const navWidth = nav.clientWidth;

        if (linkLeft < nav.scrollLeft) {
          nav.scrollTo({ left: linkLeft - 20, behavior: 'auto' });
        } else if (linkRight > nav.scrollLeft + navWidth) {
          nav.scrollTo({ left: linkRight - navWidth + 20, behavior: 'auto' });
        }
      });
    }
  }, [activeTab]);

  // Calculate countdown to Super Bowl in user's local time
  const getCountdown = () => {
    const now = new Date();
    const diff = SUPER_BOWL_DATE.getTime() - now.getTime();

    if (diff <= 0) {
      return null; // Game has started or passed
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return { days, hours, minutes };
  };

  const [countdown, setCountdown] = useState<{ days: number; hours: number; minutes: number } | null>(null);

  // Initialize countdown on client side only
  useEffect(() => {
    setCountdown(getCountdown());
    const timer = setInterval(() => {
      setCountdown(getCountdown());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'matchup':
        return <MatchupTab />;
      case 'bracket':
        return <PlayoffBracketTab />;
      case 'history':
        return <HistoryTab />;
      case 'predictions':
        return <PredictionsTab />;
      case 'event-info':
        return <EventInfoTab />;
      default:
        return <MatchupTab />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 fixed left-0 top-0 bottom-0 z-10">
        <NFLTeamsSidebar />
      </aside>

      {/* Mobile Sidebar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-20">
        <NFLTeamsSidebar isMobile={true} />
      </div>

      {/* Main Content */}
      <div className="flex-1 lg:ml-64 min-w-0 pt-12 lg:pt-0">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-[#013369] to-[#D50A0A] text-white">
          <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              {/* Logo and Title */}
              <div className="flex items-center gap-6">
                <img
                  src="/nfl-hq/super-bowl-lx-logo.png"
                  alt="Super Bowl LX Logo"
                  className="w-24 h-24 md:w-32 md:h-32 object-contain"
                />
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold mb-2">Super Bowl LX</h1>
                  <p className="text-lg opacity-90">{superBowlLX.venue}</p>
                  <p className="text-md opacity-75">{superBowlLX.city}</p>
                </div>
              </div>

              {/* Countdown */}
              {countdown && (
                <div className="flex flex-col items-center">
                  <p className="text-sm uppercase tracking-wider mb-2 opacity-75">Kickoff In</p>
                  <div className="flex gap-4">
                    <div className="text-center">
                      <div className="text-3xl md:text-4xl font-bold">{countdown.days}</div>
                      <div className="text-xs uppercase tracking-wider opacity-75">Days</div>
                    </div>
                    <div className="text-3xl md:text-4xl font-bold">:</div>
                    <div className="text-center">
                      <div className="text-3xl md:text-4xl font-bold">{countdown.hours}</div>
                      <div className="text-xs uppercase tracking-wider opacity-75">Hours</div>
                    </div>
                    <div className="text-3xl md:text-4xl font-bold">:</div>
                    <div className="text-center">
                      <div className="text-3xl md:text-4xl font-bold">{countdown.minutes}</div>
                      <div className="text-xs uppercase tracking-wider opacity-75">Minutes</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white border-b border-gray-200 sticky top-0 lg:top-0 z-10">
          <div className="container mx-auto px-4">
            <nav ref={navRef} className="flex space-x-8 overflow-x-auto scrollbar-hide">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  ref={activeTab === tab.id ? activeLinkRef : null}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-3 border-b-2 font-medium text-sm whitespace-nowrap transition-colors cursor-pointer ${
                    activeTab === tab.id
                      ? 'border-[#013369] text-[#013369]'
                      : 'border-transparent text-gray-600 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <main className="container mx-auto px-4 py-8">
          {renderTabContent()}
        </main>
      </div>
    </div>
  );
}
