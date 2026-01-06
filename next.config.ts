import type { NextConfig } from "next";
import withBundleAnalyzer from '@next/bundle-analyzer';

const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig: NextConfig = {
  basePath: '/nfl-hq',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.profootballnetwork.com',
      },
      {
        protocol: 'https',
        hostname: 'staticd.profootballnetwork.com',
      },
      {
        protocol: 'https',
        hostname: '**.sportskeeda.com',
      },
      {
        protocol: 'https',
        hostname: '**.nba.com',
      },
      {
        protocol: 'https',
        hostname: '**.basketball-reference.com',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },
  // Optimize for Core Web Vitals
  compress: true,
  poweredByHeader: false,
};

export default bundleAnalyzer(nextConfig);
