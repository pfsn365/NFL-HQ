import type { Metadata } from 'next';
import SuperBowlLXContent from '@/components/SuperBowlLXContent';

// Force dynamic rendering due to useSearchParams in SuperBowlLXContent
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Super Bowl LX: Patriots vs Seahawks | February 8, 2026',
  description: 'Complete Super Bowl LX coverage featuring the New England Patriots vs Seattle Seahawks. Game info, rosters, depth charts, injury reports, stats comparison, head-to-head matchups, and Super Bowl history. February 8, 2026 at Levi\'s Stadium in Santa Clara, CA.',
  keywords: [
    'Super Bowl LX',
    'Super Bowl 60',
    'Patriots vs Seahawks',
    'New England Patriots',
    'Seattle Seahawks',
    'NFL Playoffs 2026',
    'Super Bowl 2026',
    'Levi\'s Stadium',
    'Drake Maye',
    'Sam Darnold',
    'Mike Vrabel',
    'Mike Macdonald',
  ],
  openGraph: {
    title: 'Super Bowl LX: Patriots vs Seahawks',
    description: 'Complete Super Bowl LX coverage featuring the New England Patriots vs Seattle Seahawks. February 8, 2026 at Levi\'s Stadium.',
    type: 'website',
    url: 'https://www.profootballnetwork.com/super-bowl-lx',
    siteName: 'Pro Football Network',
    images: [
      {
        url: '/super-bowl-lx-og.png',
        width: 1200,
        height: 630,
        alt: 'Super Bowl LX - Patriots vs Seahawks',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Super Bowl LX: Patriots vs Seahawks',
    description: 'Complete Super Bowl LX coverage featuring the New England Patriots vs Seattle Seahawks. February 8, 2026 at Levi\'s Stadium.',
    images: ['/super-bowl-lx-og.png'],
    site: '@PFN365',
    creator: '@PFN365',
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: 'https://www.profootballnetwork.com/super-bowl-lx',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SportsEvent',
  name: 'Super Bowl LX',
  description: 'Super Bowl LX featuring the New England Patriots vs Seattle Seahawks',
  startDate: '2026-02-08T18:30:00-05:00',
  endDate: '2026-02-08T22:30:00-05:00',
  eventStatus: 'https://schema.org/EventScheduled',
  eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
  location: {
    '@type': 'StadiumOrArena',
    name: "Levi's Stadium",
    address: {
      '@type': 'PostalAddress',
      streetAddress: '4900 Marie P DeBartolo Way',
      addressLocality: 'Santa Clara',
      addressRegion: 'CA',
      postalCode: '95054',
      addressCountry: 'US',
    },
  },
  competitor: [
    {
      '@type': 'SportsTeam',
      name: 'New England Patriots',
      sport: 'American Football',
    },
    {
      '@type': 'SportsTeam',
      name: 'Seattle Seahawks',
      sport: 'American Football',
    },
  ],
  organizer: {
    '@type': 'Organization',
    name: 'National Football League',
    url: 'https://www.nfl.com',
  },
  image: 'https://www.profootballnetwork.com/super-bowl-lx-og.png',
};

export default function SuperBowlLXPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SuperBowlLXContent />
    </>
  );
}
