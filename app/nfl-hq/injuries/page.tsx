import type { Metadata } from 'next';
import InjuriesClient from './InjuriesClient';

export const metadata: Metadata = {
  title: 'NFL Injury Report 2025 | NFL HQ',
  description: 'Latest NFL injury reports including player status, injury details, and estimated return dates for all 32 teams.',
};

export default function InjuriesPage() {
  return <InjuriesClient />;
}
