import type { Metadata } from 'next';
import ArticlesClient from './ArticlesClient';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export const metadata: Metadata = {
  title: 'NFL Articles - News, Draft Coverage & Analysis | NFL HQ',
  description: 'Browse the latest NFL articles covering draft analysis, expert insights, lifestyle content, trending topics, and vault archives from Pro Football Network.',
  keywords: [
    'NFL Articles',
    'NFL News',
    'NFL Draft Coverage',
    'NFL Analysis',
    'Pro Football Network',
    'NFL Insights',
    'Football News',
  ],
  openGraph: {
    title: 'NFL Articles - News, Draft Coverage & Analysis | NFL HQ',
    description: 'Browse the latest NFL articles covering draft analysis, expert insights, lifestyle content, and trending topics from Pro Football Network.',
    type: 'website',
    url: 'https://www.profootballnetwork.com/nfl-hq/articles',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NFL Articles - News, Draft Coverage & Analysis | NFL HQ',
    description: 'Browse the latest NFL articles covering draft analysis, expert insights, lifestyle content, and trending topics from Pro Football Network.',
  },
  alternates: {
    canonical: 'https://www.profootballnetwork.com/nfl-hq/articles',
  },
};

export default function ArticlesPage() {
  return (
    <ErrorBoundary componentName="NFL Articles">
      <ArticlesClient />
    </ErrorBoundary>
  );
}
