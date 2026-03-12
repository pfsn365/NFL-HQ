import type { Metadata } from 'next';
import InjuriesClient from './InjuriesClient';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export const metadata: Metadata = {
  title: 'NFL Injury Report 2025',
  description: 'Latest NFL injury reports including player status, injury details, and estimated return dates for all 32 teams.',
};

export default function InjuriesPage() {
  return (
    <ErrorBoundary componentName="Injury Report">
      <InjuriesClient />
    </ErrorBoundary>
  );
}
