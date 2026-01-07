import type { Metadata } from 'next';
import FreeAgencyTrackerClient from './FreeAgencyTrackerClient';

export const metadata: Metadata = {
  title: 'NFL Free Agency Tracker 2025 | NFL HQ',
  description: 'Track NFL free agents, signings, and player availability. View contract details and recent free agency moves across all 32 teams.',
};

export default function FreeAgencyTrackerPage() {
  return <FreeAgencyTrackerClient />;
}
