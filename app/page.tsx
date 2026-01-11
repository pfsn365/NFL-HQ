import type { Metadata } from 'next';
import HomePageContent from '@/components/HomePageContent';

export const metadata: Metadata = {
  title: 'NFL HQ - Team Pages, Standings, Stats & News',
  description: 'Your complete NFL resource featuring all 32 team pages, live standings, playoff bracket, stat leaders, schedules, injury reports, and interactive tools from PFSN.',
  keywords: [
    'NFL',
    'NFL Teams',
    'NFL Standings',
    'NFL Stats',
    'NFL Playoffs',
    'NFL Playoff Bracket',
    'NFL Schedule',
    'NFL Injury Report',
    'NFL Free Agency',
    'Football',
    'PFSN'
  ],
  openGraph: {
    title: 'NFL HQ - Team Pages, Standings, Stats & News',
    description: 'Your complete NFL resource featuring all 32 team pages, live standings, playoff bracket, stat leaders, and interactive tools.',
    type: 'website',
    url: 'https://www.profootballnetwork.com/nfl-hq/',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NFL HQ - Team Pages, Standings, Stats & News',
    description: 'Your complete NFL resource featuring all 32 team pages, live standings, playoff bracket, stat leaders, and interactive tools.',
  },
  alternates: {
    canonical: 'https://www.profootballnetwork.com/nfl-hq/',
  },
};

export default function HomePage() {
  return <HomePageContent />;
}
