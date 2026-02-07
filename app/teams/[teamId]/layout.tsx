'use client';

import { useParams } from 'next/navigation';
import { getTeam } from '@/data/teams';

export default function TeamLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const teamId = params?.teamId as string;
  const team = getTeam(teamId);

  if (!team) {
    return null;
  }

  return (
      <div className="pt-12 lg:pt-0">
        {/* Tab Content - TeamPage component handles its own hero */}
        {children}
      </div>
  );
}
