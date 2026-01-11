import type { Metadata } from 'next';
import SchedulePageContent from '@/components/SchedulePageContent';

export const metadata: Metadata = {
  title: 'NFL Schedule - Game Times, Scores & Matchups',
  description: 'View the complete NFL schedule with game times, scores, TV channels, and matchups. Daily, weekly, and monthly views with live score updates.',
  keywords: [
    'NFL Schedule',
    'NFL Games',
    'NFL Matchups',
    'NFL Game Times',
    'NFL Scores',
    'NFL TV Schedule',
    'Football Schedule',
    'NFL This Week'
  ],
  openGraph: {
    title: 'NFL Schedule - Game Times, Scores & Matchups',
    description: 'View the complete NFL schedule with game times, scores, TV channels, and matchups.',
    type: 'website',
    url: 'https://www.profootballnetwork.com/nfl-hq/schedule',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NFL Schedule - Game Times, Scores & Matchups',
    description: 'View the complete NFL schedule with game times, scores, TV channels, and matchups.',
  },
  alternates: {
    canonical: 'https://www.profootballnetwork.com/nfl-hq/schedule',
  },
};

export default function SchedulePage() {
  return <SchedulePageContent />;
}
