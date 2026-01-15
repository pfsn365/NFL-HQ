import type { Metadata } from 'next';
import FreeAgencyTrackerClient from './FreeAgencyTrackerClient';

export const metadata: Metadata = {
  title: 'NFL Free Agency Tracker 2025 | NFL HQ',
  description: 'Track NFL free agents, signings, and player availability. View contract details and recent free agency moves across all 32 teams.',
  openGraph: {
    title: 'NFL Free Agency Tracker 2025 | NFL HQ',
    description: 'Track NFL free agents, signings, and player availability. View contract details and recent free agency moves across all 32 teams.',
    images: [
      {
        url: '/nfl-hq/nfl-free-agency-tracker-og.png',
        width: 1200,
        height: 630,
        alt: 'NFL Free Agency Tracker',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NFL Free Agency Tracker 2025 | NFL HQ',
    description: 'Track NFL free agents, signings, and player availability. View contract details and recent free agency moves across all 32 teams.',
    images: ['/nfl-hq/nfl-free-agency-tracker-og.png'],
  },
};

export default function FreeAgencyTrackerPage() {
  return <FreeAgencyTrackerClient />;
}
