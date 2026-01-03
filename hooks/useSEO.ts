import { useEffect } from 'react';
import { getSEOConfig, type SEOConfig } from '@/lib/seo-config';
import { TeamData } from '@/data/teams';

export function useSEO(team: TeamData, tab?: string, customSEO?: Partial<SEOConfig>) {
  useEffect(() => {
    const seoConfig = getSEOConfig(team, tab);
    const finalConfig = customSEO ? { ...seoConfig, ...customSEO } : seoConfig;

    // Update document title
    if (finalConfig.title) {
      document.title = finalConfig.title;
    }

    // Update meta description
    updateMetaTag('name', 'description', finalConfig.description);

    // Update meta keywords
    if (finalConfig.keywords?.length) {
      updateMetaTag('name', 'keywords', finalConfig.keywords.join(', '));
    }

    // Update Open Graph tags
    if (finalConfig.openGraph) {
      updateMetaTag('property', 'og:title', finalConfig.openGraph.title || finalConfig.title);
      updateMetaTag('property', 'og:description', finalConfig.openGraph.description || finalConfig.description);
      updateMetaTag('property', 'og:type', finalConfig.openGraph.type || 'website');
      
      if (finalConfig.openGraph.images?.length) {
        updateMetaTag('property', 'og:image', finalConfig.openGraph.images[0]);
      }
    }

    // Update Twitter Card tags
    if (finalConfig.twitter) {
      updateMetaTag('name', 'twitter:card', finalConfig.twitter.card || 'summary_large_image');
      updateMetaTag('name', 'twitter:title', finalConfig.twitter.title || finalConfig.title);
      updateMetaTag('name', 'twitter:description', finalConfig.twitter.description || finalConfig.description);
      
      if (finalConfig.twitter.images?.length) {
        updateMetaTag('name', 'twitter:image', finalConfig.twitter.images[0]);
      }
    }

    // Add structured data
    if (finalConfig.structuredData) {
      addStructuredData(finalConfig.structuredData);
    }

    // Update canonical URL based on current tab
    updateCanonicalUrl(tab);

  }, [team, tab, customSEO]);
}

function updateMetaTag(attribute: 'name' | 'property', attributeValue: string, content: string) {
  let element = document.querySelector(`meta[${attribute}="${attributeValue}"]`);
  
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, attributeValue);
    document.head.appendChild(element);
  }
  
  element.setAttribute('content', content);
}

function addStructuredData(data: Record<string, any>) {
  // Remove existing structured data
  const existingScript = document.querySelector('script[type="application/ld+json"]');
  if (existingScript) {
    existingScript.remove();
  }

  // Add new structured data
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(data);
  document.head.appendChild(script);
}

function updateCanonicalUrl(tab?: string) {
  let canonical = document.querySelector('link[rel="canonical"]');

  if (!canonical) {
    canonical = document.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    document.head.appendChild(canonical);
  }

  // Get current pathname to extract team ID
  const pathname = window.location.pathname;
  const pathSegments = pathname.split('/');
  const teamIndex = pathSegments.indexOf('teams');
  const teamId = teamIndex !== -1 && pathSegments[teamIndex + 1] ? pathSegments[teamIndex + 1] : 'arizona-cardinals';

  const baseUrl = 'https://www.profootballnetwork.com/nfl/teams';
  const url = tab && tab !== 'overview'
    ? `${baseUrl}/${teamId}/?tab=${tab}`
    : `${baseUrl}/${teamId}/`;
  canonical.setAttribute('href', url);
}

// Export the SEO config for external usage
export { getSEOConfig, getBaseSEO, getTabSEO } from '@/lib/seo-config';