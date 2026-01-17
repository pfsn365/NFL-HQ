import type { Metadata } from 'next';
import SuperBowlHub from '@/components/SuperBowlHub';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export const metadata: Metadata = {
  title: 'Super Bowl LX Hub - Matchup, History, Predictions | NFL HQ',
  description: 'Your complete guide to Super Bowl LX at Levi\'s Stadium. Team matchup analysis, playoff bracket, complete Super Bowl history, staff picks, community predictions, and event information.',
  keywords: [
    'Super Bowl LX',
    'Super Bowl 60',
    'Super Bowl 2026',
    'NFL Playoffs',
    'Super Bowl History',
    'Super Bowl Predictions',
    'Super Bowl Matchup',
    'Levi\'s Stadium',
    'Super Bowl Halftime Show',
    'Bad Bunny Super Bowl',
  ],
  openGraph: {
    title: 'Super Bowl LX Hub - Matchup, History, Predictions | NFL HQ',
    description: 'Your complete guide to Super Bowl LX at Levi\'s Stadium. Team matchup analysis, complete history, and predictions.',
    type: 'website',
    url: 'https://www.profootballnetwork.com/nfl-hq/super-bowl-hub',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Super Bowl LX Hub - Matchup, History, Predictions | NFL HQ',
    description: 'Your complete guide to Super Bowl LX at Levi\'s Stadium. Team matchup analysis, complete history, and predictions.',
  },
  alternates: {
    canonical: 'https://www.profootballnetwork.com/nfl-hq/super-bowl-hub',
  },
};

export default function SuperBowlPage() {
  return (
    <ErrorBoundary componentName="SuperBowlHub">
      <SuperBowlHub />
    </ErrorBoundary>
  );
}
