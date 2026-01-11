import { Metadata } from 'next';
import dynamic from 'next/dynamic';

// Dynamic import with loading state for code splitting
const PlayerRankingsClient = dynamic(() => import('./PlayerRankingsClient'), {
  loading: () => (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-gray-200 border-t-[#0050A0] rounded-full animate-spin mx-auto"></div>
        <p className="mt-6 text-gray-600 text-lg font-medium">Loading Player Rankings Builder...</p>
      </div>
    </div>
  ),
});

export const metadata: Metadata = {
  title: 'NFL Player Rankings Builder - Create Your Own Player Rankings',
  description: 'Create and customize your own NFL player rankings. Rank the best NFL players by position, download and share your rankings.',
  keywords: [
    'NFL Player Rankings',
    'NFL Rankings Builder',
    'NFL Player Tiers',
    'Best NFL Players',
    'NFL Fantasy Rankings',
    'Custom NFL Rankings'
  ],
  openGraph: {
    title: 'NFL Player Rankings Builder - Create Your Own Player Rankings',
    description: 'Create and customize your own NFL player rankings. Rank the best players by position.',
    type: 'website',
    url: 'https://www.profootballnetwork.com/nfl-hq/player-rankings-builder',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NFL Player Rankings Builder - Create Your Own Player Rankings',
    description: 'Create and customize your own NFL player rankings. Rank the best players by position.',
  },
  alternates: {
    canonical: 'https://www.profootballnetwork.com/nfl-hq/player-rankings-builder',
  },
};

export default function PlayerRankingsPage() {
  return <PlayerRankingsClient />;
}
