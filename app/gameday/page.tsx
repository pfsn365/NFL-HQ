import { Metadata } from 'next';
import dynamic from 'next/dynamic';

const GamedayClient = dynamic(() => import('./GamedayClient'), {
  loading: () => (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-gray-200 border-t-[#0050A0] rounded-full animate-spin mx-auto"></div>
        <p className="mt-6 text-gray-600 text-lg font-medium">Loading NFL Gameday Center...</p>
      </div>
    </div>
  ),
});

export const metadata: Metadata = {
  title: 'NFL Gameday Center - Live Scores, Stats & Game Updates',
  description: 'Real-time NFL scores, live game updates, possession tracking, and stat leaders. Your hub for all NFL games happening today.',
  keywords: [
    'NFL Scores',
    'NFL Live Scores',
    'NFL Gameday',
    'NFL Game Center',
    'Live NFL Games',
    'NFL Today',
    'Football Scores',
    'NFL Stats'
  ],
  openGraph: {
    title: 'NFL Gameday Center - Live Scores, Stats & Game Updates',
    description: 'Real-time NFL scores, live game updates, and stat leaders for all games.',
    type: 'website',
    url: 'https://www.profootballnetwork.com/nfl-hq/gameday',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NFL Gameday Center - Live Scores & Updates',
    description: 'Real-time NFL scores, live game updates, and stat leaders for all games.',
  },
  alternates: {
    canonical: 'https://www.profootballnetwork.com/nfl-hq/gameday',
  },
};

export default function GamedayPage() {
  return <GamedayClient />;
}
