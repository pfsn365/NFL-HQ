import { Metadata } from 'next';
import dynamic from 'next/dynamic';
import SkeletonLoader from '@/components/SkeletonLoader';

// Dynamic import with loading state for code splitting
const PowerRankingsClient = dynamic(() => import('./PowerRankingsClient'), {
  loading: () => <SkeletonLoader type="full" />,
});

export const metadata: Metadata = {
  title: 'NFL Power Rankings Builder',
  description: 'Create and customize your own NFL power rankings. Rank all 32 teams, download and share your rankings.',
};

export default function PowerRankingsPage() {
  return <PowerRankingsClient />;
}
