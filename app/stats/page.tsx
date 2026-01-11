import type { Metadata } from 'next';
import StatsPageContent from '@/components/StatsPageContent';

export const metadata: Metadata = {
  title: 'NFL Stat Leaders - Passing, Rushing, Receiving & Defense Stats',
  description: 'View NFL stat leaders for passing yards, rushing yards, receiving yards, touchdowns, tackles, sacks, and interceptions. Complete player statistics and rankings.',
  keywords: [
    'NFL Stats',
    'NFL Stat Leaders',
    'NFL Passing Leaders',
    'NFL Rushing Leaders',
    'NFL Receiving Leaders',
    'NFL Touchdowns',
    'NFL Tackles',
    'NFL Sacks',
    'NFL Interceptions',
    'Football Statistics'
  ],
  openGraph: {
    title: 'NFL Stat Leaders - Passing, Rushing, Receiving & Defense Stats',
    description: 'View NFL stat leaders for passing, rushing, receiving, and defensive statistics.',
    type: 'website',
    url: 'https://www.profootballnetwork.com/nfl-hq/stats',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NFL Stat Leaders - Passing, Rushing, Receiving & Defense Stats',
    description: 'View NFL stat leaders for passing, rushing, receiving, and defensive statistics.',
  },
  alternates: {
    canonical: 'https://www.profootballnetwork.com/nfl-hq/stats',
  },
};

export default function StatsPage() {
  return <StatsPageContent />;
}
