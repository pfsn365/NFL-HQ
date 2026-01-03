import { notFound } from 'next/navigation';
import { getTeam, getAllTeamIds } from '@/data/teams';
import TeamPage from '@/components/TeamPage';

interface PageProps {
  params: Promise<{ teamId: string }>;
}

export async function generateStaticParams() {
  return getAllTeamIds().map((teamId) => ({
    teamId,
  }));
}

export default async function TeamPageRoute({ params }: PageProps) {
  const { teamId } = await params;
  const team = getTeam(teamId);

  if (!team) {
    notFound();
  }

  return <TeamPage team={team} initialTab="overview" />;
}

export async function generateMetadata({ params }: PageProps) {
  const { teamId } = await params;
  const team = getTeam(teamId);

  if (!team) {
    return {
      title: 'Team Not Found',
    };
  }

  const canonicalUrl = `https://www.profootballnetwork.com/nfl/teams/${teamId}/`;

  return {
    title: `${team.fullName} - NFL Team Page`,
    description: `${team.fullName} roster, schedule, stats, depth chart, and more. ${team.generalManager} (GM), ${team.headCoach} (HC). ${team.record} record in ${team.division}.`,
    keywords: [
      team.fullName,
      team.name,
      team.city,
      'NFL',
      team.conference,
      team.division,
      'roster',
      'schedule',
      'stats',
      'depth chart'
    ].join(', '),
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${team.fullName} - NFL Team Page`,
      description: `${team.fullName} roster, schedule, stats, and more.`,
      images: [team.logoUrl],
      url: canonicalUrl,
    },
  };
}