import type { Metadata } from 'next';
import PlayerProfileClient from './PlayerProfileClient';

interface Props {
  params: Promise<{ playerSlug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { playerSlug } = await params;

  // Convert slug to readable name for basic metadata
  const playerName = playerSlug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return {
    title: `${playerName} - Player Profile & PFSN Impact Grade | NFL HQ`,
    description: `View ${playerName}'s player profile including bio, stats, and PFSN Impact Grade. Complete NFL player information and analytics.`,
    keywords: [
      playerName,
      'NFL Player',
      'PFSN Impact',
      'Player Profile',
      'NFL Stats',
    ],
    openGraph: {
      title: `${playerName} - Player Profile & PFSN Impact Grade`,
      description: `View ${playerName}'s player profile including bio, stats, and PFSN Impact Grade.`,
      type: 'profile',
      url: `https://www.profootballnetwork.com/nfl-hq/players/${playerSlug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${playerName} - Player Profile & PFSN Impact Grade`,
      description: `View ${playerName}'s player profile including bio, stats, and PFSN Impact Grade.`,
    },
    alternates: {
      canonical: `https://www.profootballnetwork.com/nfl-hq/players/${playerSlug}`,
    },
  };
}

export default async function PlayerProfilePage({ params }: Props) {
  const { playerSlug } = await params;
  return <PlayerProfileClient playerSlug={playerSlug} />;
}
