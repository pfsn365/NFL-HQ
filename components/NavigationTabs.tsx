'use client';

import { useMemo, useEffect, useRef, useState, useCallback } from 'react';
import { TeamData } from '@/data/teams';

interface NavigationTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  team: TeamData;
}

export default function NavigationTabs({ activeTab, onTabChange, team }: NavigationTabsProps) {

  // Refs for scroll management
  const navRef = useRef<HTMLElement>(null);
  const activeLinkRef = useRef<HTMLAnchorElement>(null);

  // Track scroll state for fade indicators
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Check scroll position and update indicators
  const updateScrollIndicators = useCallback(() => {
    if (navRef.current) {
      const nav = navRef.current;
      const scrollLeft = nav.scrollLeft;
      const scrollWidth = nav.scrollWidth;
      const clientWidth = nav.clientWidth;

      setCanScrollLeft(scrollLeft > 5);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5);
    }
  }, []);

  // Initialize and update scroll indicators
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    // Initial check
    updateScrollIndicators();

    // Listen for scroll events
    nav.addEventListener('scroll', updateScrollIndicators, { passive: true });

    // Listen for resize events
    window.addEventListener('resize', updateScrollIndicators, { passive: true });

    return () => {
      nav.removeEventListener('scroll', updateScrollIndicators);
      window.removeEventListener('resize', updateScrollIndicators);
    };
  }, [updateScrollIndicators]);

  // Memoize tabs to prevent unnecessary re-renders
  const tabs = useMemo(() => [
    { id: 'overview', label: 'Overview' },
    { id: 'schedule', label: 'Schedule' },
    { id: 'roster', label: 'Roster' },
    { id: 'depth-chart', label: 'Depth Chart' },
    { id: 'injury-report', label: 'Injury Report' },
    { id: 'stats', label: 'Stats' },
    { id: 'team-needs', label: 'Team Needs' },
    { id: 'transactions', label: 'Transactions' },
    { id: 'record-by-year', label: 'Record By Year' },
    { id: 'draft-picks', label: 'NFL Draft History' },
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
      <div className="container mx-auto px-4 relative">
        {/* Left fade indicator */}
        {canScrollLeft && (
          <div
            className="absolute left-0 top-0 bottom-0 w-12 pointer-events-none z-10"
            style={{
              background: 'linear-gradient(to right, rgb(255,255,255) 0%, rgba(255,255,255,0) 100%)'
            }}
          />
        )}
        {/* Right fade indicator */}
        {canScrollRight && (
          <div
            className="absolute right-0 top-0 bottom-0 w-24 pointer-events-none z-10"
            style={{
              background: 'linear-gradient(to left, rgb(255,255,255) 0%, rgb(255,255,255) 30%, rgba(255,255,255,0) 100%)'
            }}
          />
        )}
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
              className="py-4 px-3 border-b-2 font-medium text-sm whitespace-nowrap transition-colors will-change-auto cursor-pointer border-transparent text-gray-600 hover:text-gray-700 hover:border-gray-300 active:text-gray-800"
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