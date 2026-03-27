import { Metadata } from 'next';
import StandingsClient from './StandingsClient';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export const metadata: Metadata = {
  title: 'NFL Standings 2025 Season | AFC & NFC Conference',
  description: 'View current NFL standings for the 2025 season. Track team records, win percentages, division rankings, and playoff positioning for all 32 teams across both conferences.',
  keywords: ['NFL standings', 'AFC standings', 'NFC standings', 'NFL division standings', 'NFL playoff standings'],
  openGraph: {
    title: 'NFL Standings 2025 Season | AFC & NFC Conference',
    description: 'View current NFL standings for the 2025 season. Track team records, win percentages, division rankings, and playoff positioning for all 32 teams across both conferences.',
  },
  alternates: {
    canonical: 'https://www.profootballnetwork.com/nfl-hq/standings',
  },
};

export default function StandingsPage() {
  return (
    <ErrorBoundary componentName="Standings">
      <StandingsClient />
    </ErrorBoundary>
  );
}
