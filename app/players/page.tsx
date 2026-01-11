import type { Metadata } from 'next';
import PlayersDirectoryClient from './PlayersDirectoryClient';

export const metadata: Metadata = {
  title: 'NFL Players - Player Profiles & PFSN Impact Grades',
  description: 'Browse NFL player profiles with bio information, stats, and PFSN Impact Grades. Search and filter players by team or position.',
  keywords: [
    'NFL Players',
    'NFL Player Profiles',
    'PFSN Impact',
    'NFL Stats',
    'NFL Roster',
    'Football Players',
  ],
  openGraph: {
    title: 'NFL Players - Player Profiles & PFSN Impact Grades',
    description: 'Browse NFL player profiles with bio information, stats, and PFSN Impact Grades.',
    type: 'website',
    url: 'https://www.profootballnetwork.com/nfl-hq/players',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NFL Players - Player Profiles & PFSN Impact Grades',
    description: 'Browse NFL player profiles with bio information, stats, and PFSN Impact Grades.',
  },
  alternates: {
    canonical: 'https://www.profootballnetwork.com/nfl-hq/players',
  },
};

export default function PlayersPage() {
  return <PlayersDirectoryClient />;
}
