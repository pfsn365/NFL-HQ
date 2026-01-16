import type { Metadata } from 'next';
import PlayerProfileClient from './PlayerProfileClient';
import { ErrorBoundary } from '@/components/ErrorBoundary';

interface Props {
  params: Promise<{ playerSlug: string }>;
}

interface PlayerData {
  player: {
    name: string;
    team: { name: string; abbreviation: string };
    position: string;
    positionFull: string;
    jerseyNumber: number;
    headshotUrl: string;
    pfsnImpact: { grade: string; score: number } | null;
  };
}

async function getPlayerData(playerSlug: string): Promise<PlayerData | null> {
  try {
    // Use absolute URL for server-side fetch
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NODE_ENV === 'development'
        ? 'http://localhost:3000'
        : 'https://nfl-hq.vercel.app';

    const response = await fetch(`${baseUrl}/api/nfl/player/${playerSlug}`, {
      next: { revalidate: 86400 },
    });

    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { playerSlug } = await params;

  // Try to fetch actual player data for better SEO
  const data = await getPlayerData(playerSlug);

  // Fallback to slug-based name if API fails
  const playerName = data?.player?.name || playerSlug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  const teamName = data?.player?.team?.name || '';
  const position = data?.player?.positionFull || data?.player?.position || '';
  const jerseyNumber = data?.player?.jerseyNumber;
  const impactGrade = data?.player?.pfsnImpact?.grade;
  const headshotUrl = data?.player?.headshotUrl;

  // Build rich description
  const descriptionParts = [`View ${playerName}'s complete NFL player profile`];
  if (teamName && position) {
    descriptionParts[0] = `${playerName} is a ${position} for the ${teamName}`;
  }
  if (impactGrade) {
    descriptionParts.push(`PFSN Impact Grade: ${impactGrade}`);
  }
  descriptionParts.push('Bio, stats, and analytics.');
  const description = descriptionParts.join('. ');

  // Build title
  let title = `${playerName}`;
  if (teamName) {
    title += ` - ${teamName}`;
  }
  if (position) {
    title += ` ${position}`;
  }
  if (jerseyNumber) {
    title += ` #${jerseyNumber}`;
  }

  return {
    title,
    description,
    keywords: [
      playerName,
      teamName,
      position,
      'NFL Player',
      'PFSN Impact',
      'Player Profile',
      'NFL Stats',
      '2025 NFL',
    ].filter(Boolean),
    openGraph: {
      title: `${playerName}${teamName ? ` - ${teamName}` : ''} Player Profile`,
      description,
      type: 'profile',
      url: `https://www.profootballnetwork.com/nfl-hq/players/${playerSlug}`,
      images: headshotUrl ? [
        {
          url: headshotUrl,
          width: 128,
          height: 128,
          alt: `${playerName} headshot`,
        },
      ] : undefined,
    },
    twitter: {
      card: 'summary',
      title: `${playerName}${teamName ? ` - ${teamName}` : ''} Player Profile`,
      description,
      images: headshotUrl ? [headshotUrl] : undefined,
    },
    alternates: {
      canonical: `https://www.profootballnetwork.com/nfl-hq/players/${playerSlug}`,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function PlayerProfilePage({ params }: Props) {
  const { playerSlug } = await params;
  return (
    <ErrorBoundary componentName="Player Profile">
      <PlayerProfileClient playerSlug={playerSlug} />
    </ErrorBoundary>
  );
}
