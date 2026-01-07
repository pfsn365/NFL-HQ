import type { Metadata } from 'next';
import TransactionsClient from './TransactionsClient';

export const metadata: Metadata = {
  title: 'NFL Transactions 2025 | NFL HQ',
  description: 'Latest NFL transactions including signings, releases, trades, and roster moves for all 32 teams.',
};

export default function TransactionsPage() {
  return <TransactionsClient />;
}
