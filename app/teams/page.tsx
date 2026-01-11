import type { Metadata } from 'next';
import TeamsListPageContent from '@/components/TeamsListPageContent';

export const metadata: Metadata = {
  title: 'All 32 NFL Teams - Rosters, Stats, Schedules & News',
  description: 'Browse all 32 NFL teams organized by division. View team rosters, stats, schedules, standings, and the latest news for every AFC and NFC team.',
  keywords: [
    'NFL Teams',
    'All NFL Teams',
    'AFC Teams',
    'NFC Teams',
    'NFL Divisions',
    'NFL Rosters',
    'NFL Team Stats',
    'Football Teams'
  ],
  openGraph: {
    title: 'All 32 NFL Teams - Rosters, Stats, Schedules & News',
    description: 'Browse all 32 NFL teams organized by division. View team rosters, stats, schedules, and standings.',
    type: 'website',
    url: 'https://www.profootballnetwork.com/nfl-hq/teams',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'All 32 NFL Teams - Rosters, Stats, Schedules & News',
    description: 'Browse all 32 NFL teams organized by division. View team rosters, stats, schedules, and standings.',
  },
  alternates: {
    canonical: 'https://www.profootballnetwork.com/nfl-hq/teams',
  },
};

export default function TeamsPage() {
  return <TeamsListPageContent />;
}
