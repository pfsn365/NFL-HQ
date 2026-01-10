'use client';

import { useINPMonitoring } from '../hooks/useINPOptimization';
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

  // Refs for scroll management
  const navRef = useRef<HTMLElement>(null);
  const activeLinkRef = useRef<HTMLAnchorElement>(null);

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
    if (activeLinkRef.current && navRef.current) {
      const link = activeLinkRef.current;
      const nav = navRef.current;

      // Use requestAnimationFrame to defer scroll and avoid blocking interaction
      requestAnimationFrame(() => {
        // Calculate link position relative to nav container
        const linkRect = link.getBoundingClientRect();
        const navRect = nav.getBoundingClientRect();

        // Check if link is out of view
        const linkLeft = linkRect.left - navRect.left + nav.scrollLeft;
        const linkRight = linkLeft + linkRect.width;
        const navWidth = nav.clientWidth;

        if (linkLeft < nav.scrollLeft) {
          // Link is to the left of visible area
          nav.scrollTo({
            left: linkLeft - 20, // Add some padding
            behavior: 'auto' // Use instant scroll to avoid INP impact
          });
        } else if (linkRight > nav.scrollLeft + navWidth) {
          // Link is to the right of visible area
          nav.scrollTo({
            left: linkRight - navWidth + 20, // Add some padding
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
            <a
              key={tab.id}
              ref={activeTab === tab.id ? activeLinkRef : null}
              href={tab.id === 'overview' ? `/nfl-hq/teams/${team.id}/` : `/nfl-hq/teams/${team.id}/${tab.id}/`}
              onClick={(e) => {
                e.preventDefault();
                onTabChange(tab.id);
              }}
              className={`py-4 px-2 border-b-2 font-medium text-sm whitespace-nowrap transition-colors will-change-auto cursor-pointer ${
                activeTab === tab.id
                  ? 'border-transparent text-gray-600 hover:text-gray-700 hover:border-gray-300'
                  : 'border-transparent text-gray-600 hover:text-gray-700 hover:border-gray-300'
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
            </a>
          ))}
        </nav>
      </div>
    </div>
  );
}