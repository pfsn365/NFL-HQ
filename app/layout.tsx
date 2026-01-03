import type { Metadata } from "next";
import "./globals.css";
import GoogleAnalytics from '@/components/GoogleAnalytics';
import RaptiveScript from '@/components/RaptiveScript';
import { WebVitals } from '@/components/WebVitals';
import VideoPlayerScript from '@/components/VideoPlayerScript';

export const metadata: Metadata = {
  metadataBase: new URL('https://profootballnetwork.com/nfl-hq'),
  title: {
    default: "NFL HQ - Team Pages, Standings, Stats & News",
    template: "%s | NFL HQ"
  },
  description: "Your complete NFL resource featuring all 32 team pages, live standings, stats, rosters, schedules, and the latest news from Pro Football Network.",
  keywords: [
    "NFL",
    "NFL Teams",
    "NFL Standings",
    "NFL Stats",
    "NFL News",
    "NFL Rosters",
    "NFL Schedules",
    "Football",
    "Pro Football Network"
  ],
  authors: [{ name: "Pro Football Network" }],
  creator: "Pro Football Network",
  publisher: "Pro Football Network",
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
        url: '/og-image.png',
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
    creator: '@PFN365',
    site: '@PFN365',
    images: ['/og-image.png'],
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
        <meta name="theme-color" content="#013369" />
        <meta name="msapplication-TileColor" content="#013369" />

        {/* Performance and security */}
        <meta httpEquiv="X-DNS-Prefetch-Control" content="on" />
      </head>
      <body className="antialiased raptive-pfn-disable-footer-close pb-24">
        <WebVitals />
        <VideoPlayerScript />
        {children}
      </body>
    </html>
  );
}
