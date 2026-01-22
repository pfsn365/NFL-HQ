import type { Metadata } from 'next';
import SuperBowlLXContent from '@/components/SuperBowlLXContent';

export const metadata: Metadata = {
  title: 'Super Bowl LX',
  description: 'Super Bowl LX coverage and information.',
  openGraph: {
    title: 'Super Bowl LX',
    description: 'Super Bowl LX coverage and information.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Super Bowl LX',
    description: 'Super Bowl LX coverage and information.',
  },
};

export default function SuperBowlLXPage() {
  return <SuperBowlLXContent />;
}
