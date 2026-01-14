'use client';

import { useParams, usePathname } from 'next/navigation';
import { getTeam } from '@/data/teams';
import NFLTeamsSidebar from '@/components/NFLTeamsSidebar';

export default function TeamLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const teamId = params?.teamId as string;
  const team = getTeam(teamId);

  // Extract current tab from pathname
  const pathParts = pathname?.split('/') || [];
  const currentTab = pathParts[pathParts.length - 1] === teamId ? 'overview' : pathParts[pathParts.length - 1];

  if (!team) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:block w-64 fixed left-0 top-0 bottom-0 z-10">
        <NFLTeamsSidebar currentTeam={team} currentTab={currentTab} />
      </aside>

      {/* Mobile Sidebar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-20">
        <NFLTeamsSidebar isMobile={true} currentTeam={team} currentTab={currentTab} />
      </div>

      {/* Main Content */}
      <div className="flex-1 lg:ml-64 min-w-0 pt-12 lg:pt-0">
        {/* Tab Content - TeamPage component handles its own hero */}
        {children}
      </div>
    </div>
  );
}
