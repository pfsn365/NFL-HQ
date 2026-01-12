import { Metadata } from 'next';
import PlayerRankingsClient from './PlayerRankingsClient';

export const metadata: Metadata = {
  title: 'NFL Player Rankings Builder | Create Your Own NFL Player Rankings',
  description: 'Build and share your own NFL player rankings. Rank the top 100 NFL players by position, compare stats, and download your custom rankings.',
  keywords: 'NFL player rankings, player rankings builder, best NFL players, top 100 NFL players, NFL player comparison',
  openGraph: {
    title: 'NFL Player Rankings Builder | Create Your Own NFL Player Rankings',
    description: 'Build and share your own NFL player rankings. Rank the top 100 NFL players by position, compare stats, and download your custom rankings.',
    type: 'website',
  },
};

export default function PlayerRankingsPage() {
  return <PlayerRankingsClient />;
}
