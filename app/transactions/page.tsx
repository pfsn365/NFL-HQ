import type { Metadata } from 'next';
import TransactionsClient from './TransactionsClient';

export const metadata: Metadata = {
  title: 'NFL Transactions 2025-26',
  description: 'Latest NFL transactions including signings, releases, trades, and roster moves for all 32 teams.',
  keywords: ['NFL transactions', 'NFL trades', 'NFL signings', 'NFL roster moves', 'NFL free agent signings'],
  openGraph: {
    title: 'NFL Transactions 2025-26',
    description: 'Latest NFL transactions including signings, releases, trades, and roster moves for all 32 teams.',
  },
  alternates: {
    canonical: 'https://www.profootballnetwork.com/nfl-hq/transactions',
  },
};

export default function TransactionsPage() {
  return <TransactionsClient />;
}
