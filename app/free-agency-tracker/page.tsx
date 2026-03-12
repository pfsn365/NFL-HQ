import { Suspense } from 'react';
import type { Metadata } from 'next';
import FreeAgencyTrackerClient from './FreeAgencyTrackerClient';

export const metadata: Metadata = {
  title: 'NFL Free Agency Tracker 2026',
  description: 'Track NFL free agents, signings, and player availability. View contract details and recent free agency moves across all 32 teams.',
  openGraph: {
    title: 'NFL Free Agency Tracker 2026',
    description: 'Track NFL free agents, signings, and player availability. View contract details and recent free agency moves across all 32 teams.',
    images: [
      {
        url: 'https://statico.profootballnetwork.com/wp-content/uploads/2026/02/17150329/NFL-Free-Agency-Tracker-2-1.png',
        width: 1200,
        height: 630,
        alt: 'NFL Free Agency Tracker',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NFL Free Agency Tracker 2026',
    description: 'Track NFL free agents, signings, and player availability. View contract details and recent free agency moves across all 32 teams.',
    images: ['https://statico.profootballnetwork.com/wp-content/uploads/2026/02/17150329/NFL-Free-Agency-Tracker-2-1.png'],
  },
};

export default function FreeAgencyTrackerPage() {
  return (
    <Suspense>
      <FreeAgencyTrackerClient />
    </Suspense>
  );
}
