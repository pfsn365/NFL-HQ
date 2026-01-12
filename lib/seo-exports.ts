/**
 * SEO Export Configuration
 * 
 * This file provides exit points for external SEO configuration.
 * You can modify these exports to integrate with your CMS, 
 * configuration files, or external SEO management systems.
 */

import { getTabSEO, getBaseSEO, type SEOConfig } from './seo-config';
import { TeamData } from '@/data/teams';

// Export interface for external configuration systems
export interface ExternalSEOConfig {
  baseUrl: string;
  siteName: string;
  defaultImage: string;
  twitterHandle: string;
  googleSiteVerification?: string;
  bingSiteVerification?: string;
  facebookAppId?: string;
}

// Function to generate external SEO config for a team
export function getExternalSEOConfig(team: TeamData): ExternalSEOConfig {
  return {
    baseUrl: `https://www.profootballnetwork.com/nfl-hq/teams/${team.id}`,
    siteName: team.fullName,
    defaultImage: team.logoUrl,
    twitterHandle: `@${team.abbreviation}`, // This is a placeholder - you'd want to map actual Twitter handles
    googleSiteVerification: 'google-site-verification-token', // Replace with actual token
    bingSiteVerification: 'bing-site-verification-token', // Replace with actual token
    facebookAppId: 'facebook-app-id' // Replace with actual app ID
  };
}

// Function to get tab-specific sitemap data
export function getSitemapData(team: TeamData) {
  const tabSEO = getTabSEO(team);
  const tabs = Object.keys(tabSEO);
  const externalSEOConfig = getExternalSEOConfig(team);
  const baseUrl = externalSEOConfig.baseUrl;

  return tabs.map(tab => ({
    url: tab === 'overview' ? baseUrl : `${baseUrl}?tab=${tab}`,
    lastModified: new Date(),
    changeFrequency: getChangeFrequency(tab),
    priority: getPriority(tab)
  }));
}

function getChangeFrequency(tab: string): 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never' {
  switch (tab) {
    case 'schedule':
    case 'injury-report':
    case 'transactions':
      return 'daily';
    case 'roster':
    case 'stats':
      return 'weekly';
    case 'overview':
      return 'daily';
    default:
      return 'monthly';
  }
}

function getPriority(tab: string): number {
  switch (tab) {
    case 'overview':
      return 1.0;
    case 'roster':
    case 'schedule':
      return 0.9;
    case 'stats':
      return 0.8;
    default:
      return 0.7;
  }
}

// Function to generate robots.txt content
export function getRobotsContent(team: TeamData): string {
  const externalSEOConfig = getExternalSEOConfig(team);
  return `User-agent: *
Allow: /

Sitemap: ${externalSEOConfig.baseUrl}/sitemap.xml`;
}

// Function to export SEO data for external systems
export function exportSEOData(team: TeamData) {
  const baseSEO = getBaseSEO(team);
  const tabSEO = getTabSEO(team);
  const externalSEOConfig = getExternalSEOConfig(team);

  return {
    base: baseSEO,
    tabs: tabSEO,
    external: externalSEOConfig,
    sitemap: getSitemapData(team)
  };
}

// Generate meta tags for server-side rendering
export function generateMetaTags(team: TeamData, tab?: string): Array<{ name?: string; property?: string; content: string }> {
  const baseSEO = getBaseSEO(team);
  const tabSEO = getTabSEO(team);
  const externalSEOConfig = getExternalSEOConfig(team);
  const config = tabSEO[tab || 'overview'] || baseSEO;
  
  const tags = [
    { name: 'description', content: config.description },
    { name: 'keywords', content: config.keywords.join(', ') },
    { property: 'og:title', content: config.openGraph?.title || config.title },
    { property: 'og:description', content: config.openGraph?.description || config.description },
    { property: 'og:type', content: config.openGraph?.type || 'website' },
    { property: 'og:url', content: tab && tab !== 'overview' ? `${externalSEOConfig.baseUrl}?tab=${tab}` : externalSEOConfig.baseUrl },
    { property: 'og:site_name', content: externalSEOConfig.siteName },
    { name: 'twitter:card', content: config.twitter?.card || 'summary_large_image' },
    { name: 'twitter:site', content: externalSEOConfig.twitterHandle },
    { name: 'twitter:title', content: config.twitter?.title || config.title },
    { name: 'twitter:description', content: config.twitter?.description || config.description }
  ];

  // Add image tags if available
  const ogImage = config.openGraph?.images?.[0] || externalSEOConfig.defaultImage;
  const twitterImage = config.twitter?.images?.[0] || externalSEOConfig.defaultImage;
  
  tags.push(
    { property: 'og:image', content: ogImage },
    { name: 'twitter:image', content: twitterImage }
  );

  return tags;
}