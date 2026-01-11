import type { Metadata } from "next";
import "./globals.css";
import GoogleAnalytics from '@/components/GoogleAnalytics';
import RaptiveScript from '@/components/RaptiveScript';
import VisiblTracking from '@/components/VisiblTracking';
import CanonicalURL from '@/components/CanonicalURL';
import StructuredData from '@/components/StructuredData';
import { WebVitals } from '@/components/WebVitals';
import VideoPlayerScript from '@/components/VideoPlayerScript';
import NFLScoreTicker from '@/components/NFLScoreTicker';
import { TickerProvider } from '@/context/TickerContext';

export const metadata: Metadata = {
  metadataBase: new URL('https://profootballnetwork.com/nfl-hq'),
  title: {
    default: "NFL HQ - Team Pages, Standings, Stats & News",
    template: "%s | NFL HQ"
  },
  description: "Your complete NFL resource featuring all 32 team pages, live standings, stats, rosters, schedules, and the latest news from PFSN.",
  keywords: [
    "NFL",
    "NFL Teams",
    "NFL Standings",
    "NFL Stats",
    "NFL News",
    "NFL Rosters",
    "NFL Schedules",
    "Football",
    "PFSN"
  ],
  authors: [{ name: "PFSN" }],
  creator: "PFSN",
  publisher: "PFSN",
  icons: {
    icon: [
      { url: '/nfl-hq/favicon.ico', sizes: 'any' },
      { url: '/nfl-hq/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/nfl-hq/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/nfl-hq/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { url: '/nfl-hq/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/nfl-hq/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
  },
  manifest: '/nfl-hq/manifest.json',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://profootballnetwork.com/nfl-hq',
    title: 'NFL HQ - Team Pages, Standings, Stats & News',
    description: 'Your complete NFL resource featuring all 32 team pages, live standings, stats, rosters, schedules, and the latest news.',
    siteName: 'NFL HQ',
    images: [
      {
        url: '/nfl-hq/og-image.png',
        width: 1200,
        height: 630,
        alt: 'NFL HQ - Complete NFL Coverage',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NFL HQ - Team Pages, Standings, Stats & News',
    description: 'Your complete NFL resource featuring all 32 team pages, live standings, stats, rosters, schedules, and the latest news.',
    creator: '@PFSN365',
    site: '@PFSN365',
    images: ['/nfl-hq/og-image.png'],
  },
  alternates: {
    canonical: 'https://profootballnetwork.com/nfl-hq',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-us">
      <head>
        {/* Analytics and Ad Scripts */}
        <GoogleAnalytics />
        <RaptiveScript />
        <VisiblTracking />

        {/* Resource hints for performance */}
        <link rel="preconnect" href="https://www.profootballnetwork.com" />
        <link rel="preconnect" href="https://staticd.profootballnetwork.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="//www.profootballnetwork.com" />
        <link rel="dns-prefetch" href="//staticd.profootballnetwork.com" />
        <link rel="dns-prefetch" href="//ads.adthrive.com" />
        <link rel="dns-prefetch" href="//www.googletagmanager.com" />
        <link rel="dns-prefetch" href="//statico.profootballnetwork.com" />

        {/* Viewport for mobile optimization */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover" />

        {/* Theme colors - NFL colors */}
        <meta name="theme-color" content="#0050A0" />
        <meta name="msapplication-TileColor" content="#0050A0" />

        {/* Performance and security */}
        <meta httpEquiv="X-DNS-Prefetch-Control" content="on" />
      </head>
      <body className="antialiased raptive-pfn-disable-footer-close pb-24">
        <TickerProvider>
          <NFLScoreTicker />
          <CanonicalURL />
          <StructuredData />
          <WebVitals />
          <VideoPlayerScript />
          {children}
        </TickerProvider>
      </body>
    </html>
  );
}
