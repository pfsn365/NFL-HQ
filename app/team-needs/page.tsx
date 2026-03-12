import type { Metadata } from 'next';
import TeamNeedsClient from './TeamNeedsClient';

export const metadata: Metadata = {
  title: 'NFL Team Needs 2026: All 32 Teams Draft & Free Agency Needs',
  description:
    'Comprehensive NFL team needs for all 32 teams heading into the 2026 NFL Draft and free agency. Position-by-position analysis with need ratings, free agent fits, salary cap context, and roster depth.',
  keywords: [
    'NFL team needs',
    'NFL team needs 2026',
    '2026 NFL Draft needs',
    'NFL free agency needs',
    'NFL offseason needs',
    'NFL roster needs',
    'NFL draft needs by team',
    'NFL position needs',
    'NFL team needs rankings',
  ],
  openGraph: {
    title: 'NFL Team Needs 2026: All 32 Teams',
    description:
      'Position-by-position team needs analysis for all 32 NFL teams. Explore the heatmap, free agent fits, and cap space context for the 2026 offseason.',
    type: 'website',
    url: 'https://www.profootballnetwork.com/nfl-hq/team-needs',
    siteName: 'Pro Football Network',
    images: [
      {
        url: 'https://statico.profootballnetwork.com/wp-content/uploads/2026/03/02165035/NFL-HQ.png',
        width: 1200,
        height: 630,
        alt: 'NFL Team Needs 2026',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NFL Team Needs 2026: All 32 Teams',
    description:
      'Position-by-position team needs analysis for all 32 NFL teams. Heatmap, free agent fits, cap space context, and more.',
    images: [
      'https://statico.profootballnetwork.com/wp-content/uploads/2026/03/02165035/NFL-HQ.png',
    ],
    site: '@PFN365',
    creator: '@PFN365',
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: 'https://www.profootballnetwork.com/nfl-hq/team-needs',
  },
  other: {
    'article:content_tier': 'free',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'NFL Team Needs 2026',
  description:
    'Comprehensive NFL team needs for all 32 teams heading into the 2026 NFL Draft and free agency.',
  url: 'https://www.profootballnetwork.com/nfl-hq/team-needs',
  isPartOf: {
    '@type': 'WebSite',
    name: 'NFL HQ by Pro Football Network',
    url: 'https://www.profootballnetwork.com/nfl-hq/',
  },
  about: {
    '@type': 'SportsOrganization',
    name: 'National Football League',
    sport: 'American Football',
    url: 'https://www.nfl.com',
  },
  mainEntity: {
    '@type': 'Dataset',
    name: '2026 NFL Team Needs',
    description:
      'Position-by-position need ratings for all 32 NFL teams, including critical needs analysis, free agent fits, salary cap context, and roster depth.',
    keywords: [
      'NFL team needs',
      'NFL Draft 2026',
      'NFL free agency',
      'position needs',
    ],
    creator: {
      '@type': 'Organization',
      name: 'PFSN',
      url: 'https://www.profootballnetwork.com',
    },
  },
  publisher: {
    '@type': 'Organization',
    name: 'PFSN',
    url: 'https://www.profootballnetwork.com',
    logo: {
      '@type': 'ImageObject',
      url: 'https://www.profootballnetwork.com/apps/nfl-logos/nfl-logo.png',
    },
  },
  breadcrumb: {
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'NFL HQ',
        item: 'https://www.profootballnetwork.com/nfl-hq/',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Team Needs',
        item: 'https://www.profootballnetwork.com/nfl-hq/team-needs',
      },
    ],
  },
};

export default function TeamNeedsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <TeamNeedsClient />
    </>
  );
}
