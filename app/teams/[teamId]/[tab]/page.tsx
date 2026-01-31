import { notFound } from 'next/navigation';
import { getTeam, getAllTeamIds } from '@/data/teams';
import TeamPage from '@/components/TeamPage';

interface PageProps {
  params: Promise<{ teamId: string; tab: string }>;
}

const validTabs = [
  'overview',
  'team-info',
  'team-needs',
  'draft-picks',
  'transactions',
  'salary-cap',
  'roster',
  'depth-chart',
  'schedule',
  'stats',
  'injury-report',
  'news'
];

export async function generateStaticParams() {
  const teamIds = getAllTeamIds();
  const paths: { teamId: string; tab: string }[] = [];

  teamIds.forEach(teamId => {
    validTabs.forEach(tab => {
      paths.push({ teamId, tab });
    });
  });

  return paths;
}

export default async function TeamTabPageRoute({ params }: PageProps) {
  const { teamId, tab } = await params;
  const team = getTeam(teamId);

  if (!team) {
    notFound();
  }

  if (!validTabs.includes(tab)) {
    notFound();
  }

  return <TeamPage team={team} initialTab={tab} />;
}

export async function generateMetadata({ params }: PageProps) {
  const { teamId, tab } = await params;
  const team = getTeam(teamId);

  if (!team || !validTabs.includes(tab)) {
    return {
      title: 'Page Not Found',
    };
  }

  const tabTitles: { [key: string]: string } = {
    'overview': 'Overview',
    'team-info': 'Team Info',
    'team-needs': 'Team Needs',
    'draft-picks': 'Draft Picks',
    'transactions': 'Transactions',
    'salary-cap': 'Salary Cap',
    'roster': 'Roster',
    'depth-chart': 'Depth Chart',
    'schedule': 'Schedule',
    'stats': 'Stats',
    'injury-report': 'Injury Report',
    'news': 'News'
  };

  const tabTitle = tabTitles[tab] || tab;

  const canonicalUrl = `https://www.profootballnetwork.com/nfl-hq/teams/${teamId}/${tab}`;

  return {
    title: `${team.fullName} ${tabTitle} - NFL Team Page`,
    description: `${team.fullName} ${tabTitle.toLowerCase()}. ${team.generalManager} (GM), ${team.headCoach} (HC). ${team.record} record in ${team.division}.`,
    keywords: [
      team.fullName,
      team.name,
      team.city,
      'NFL',
      team.conference,
      team.division,
      tabTitle.toLowerCase()
    ].join(', '),
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${team.fullName} ${tabTitle} - NFL Team Page`,
      description: `${team.fullName} ${tabTitle.toLowerCase()} information.`,
      images: [team.logoUrl],
      url: canonicalUrl,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${team.fullName} ${tabTitle} - NFL Team Page`,
      description: `${team.fullName} ${tabTitle.toLowerCase()} information.`,
    },
  };
}