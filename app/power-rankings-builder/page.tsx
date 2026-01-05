import { Metadata } from 'next';
import dynamic from 'next/dynamic';

// Dynamic import with loading state for code splitting
const PowerRankingsClient = dynamic(() => import('./PowerRankingsClient'), {
  loading: () => (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-gray-200 border-t-[#0050A0] rounded-full animate-spin mx-auto"></div>
        <p className="mt-6 text-gray-600 text-lg font-medium">Loading Power Rankings Builder...</p>
      </div>
    </div>
  ),
});

export const metadata: Metadata = {
  title: 'NFL Power Rankings Builder | NFL HQ',
  description: 'Create and customize your own NFL power rankings. Rank all 32 teams, download and share your rankings.',
};

export default function PowerRankingsPage() {
  return <PowerRankingsClient />;
}
