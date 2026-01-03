'use client';

import { useOptimizedTabChange, useINPMonitoring } from '../hooks/useINPOptimization';
import { useMemo, useEffect, useRef } from 'react';
import { TeamData } from '@/data/teams';

interface NavigationTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  team: TeamData;
}

export default function NavigationTabs({ activeTab, onTabChange, team }: NavigationTabsProps) {
  // Enable INP monitoring for this component
  useINPMonitoring();

  // Optimize tab change handler
  const optimizedTabChange = useOptimizedTabChange(onTabChange);

  // Refs for scroll management
  const navRef = useRef<HTMLElement>(null);
  const activeButtonRef = useRef<HTMLButtonElement>(null);

  // Memoize tabs to prevent unnecessary re-renders
  const tabs = useMemo(() => [
    { id: 'overview', label: 'Overview' },
    { id: 'news', label: 'News' },
    { id: 'schedule', label: 'Schedule' },
    { id: 'roster', label: 'Roster' },
    { id: 'injury-report', label: 'Injury Report' },
    { id: 'stats', label: 'Stats' },
    { id: 'depth-chart', label: 'Depth Chart' },
    { id: 'transactions', label: 'Transactions' },
    { id: 'draft-picks', label: 'Draft Picks' },
    { id: 'salary-cap', label: 'Salary Cap' },
    { id: 'team-info', label: 'Team Info' },
  ], []);

  // Scroll active tab into view when activeTab changes
  // Defer scroll to avoid blocking interaction (improves INP)
  useEffect(() => {
    if (activeButtonRef.current && navRef.current) {
      const button = activeButtonRef.current;
      const nav = navRef.current;

      // Use requestAnimationFrame to defer scroll and avoid blocking interaction
      requestAnimationFrame(() => {
        // Calculate button position relative to nav container
        const buttonRect = button.getBoundingClientRect();
        const navRect = nav.getBoundingClientRect();

        // Check if button is out of view
        const buttonLeft = buttonRect.left - navRect.left + nav.scrollLeft;
        const buttonRight = buttonLeft + buttonRect.width;
        const navWidth = nav.clientWidth;

        if (buttonLeft < nav.scrollLeft) {
          // Button is to the left of visible area
          nav.scrollTo({
            left: buttonLeft - 20, // Add some padding
            behavior: 'auto' // Use instant scroll to avoid INP impact
          });
        } else if (buttonRight > nav.scrollLeft + navWidth) {
          // Button is to the right of visible area
          nav.scrollTo({
            left: buttonRight - navWidth + 20, // Add some padding
            behavior: 'auto' // Use instant scroll to avoid INP impact
          });
        }
      });
    }
  }, [activeTab]);

  return (
    <div 
      className="bg-white border-b border-gray-200 sticky top-0 z-10"
      style={{
        contain: 'layout style paint',
        contentVisibility: 'auto',
        containIntrinsicSize: '0 57px'
      }}
    >
      <div className="container mx-auto px-4">
        <nav ref={navRef} className="flex space-x-8 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              ref={activeTab === tab.id ? activeButtonRef : null}
              onClick={() => optimizedTabChange(tab.id)}
              className={`py-4 px-2 border-b-2 font-medium text-sm whitespace-nowrap transition-colors will-change-auto ${
                activeTab === tab.id
                  ? 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              style={{
                contain: 'layout style',
                transform: 'translateZ(0)', // Force hardware acceleration
                ...(activeTab === tab.id && team ? {
                  borderBottomColor: team.primaryColor,
                  color: team.primaryColor
                } : {})
              }}
              aria-current={activeTab === tab.id ? 'page' : undefined}
              role="tab"
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}