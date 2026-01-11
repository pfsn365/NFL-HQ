export default function StructuredData() {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://www.profootballnetwork.com/#organization",
        "name": "PFSN",
        "legalName": "Pro Football Network Inc.",
        "alternateName": ["Pro Football Network", "Pro Football & Sports Network", "PFSN", "PFSN365"],
        "url": "https://www.profootballnetwork.com/",
        "foundingDate": "2019",
        "address": {
          "@type": "PostalAddress",
          "addressLocality": "Bristol",
          "addressRegion": "CT",
          "addressCountry": "US"
        },
        "logo": {
          "@type": "ImageObject",
          "@id": "https://www.profootballnetwork.com/#logo",
          "url": "https://statico.profootballnetwork.com/wp-content/uploads/2025/03/24154810/PFSN-Google-Icon-Black-White-112.png",
          "contentUrl": "https://statico.profootballnetwork.com/wp-content/uploads/2025/03/24154810/PFSN-Google-Icon-Black-White-112.png",
          "caption": "PFSN",
          "width": 560,
          "height": 560
        },
        "sameAs": [
          "https://www.wikidata.org/wiki/Q137636516",
          "https://twitter.com/PFSN365",
          "https://www.facebook.com/PFSN365",
          "https://www.instagram.com/pfsn365/",
          "https://www.linkedin.com/company/pfsn365",
          "https://www.youtube.com/c/profootballnetwork",
          "https://www.tiktok.com/@pfsn365",
          "https://www.threads.com/@pfsn365",
          "https://bsky.app/profile/did:plc:ymwh7dihf5ra32e5ms5jjaar",
          "https://apple.news/TNZRJixlpTJCDE_GPUJK2Lw",
          "https://muckrack.com/media-outlet/profootballnetwork",
          "https://theorg.com/org/pro-football-network",
          "https://www.crunchbase.com/organization/pro-football-network",
          "https://www.glassdoor.com/Overview/Working-at-Pro-Football-Network-EI_IE6573271.11,31.htm",
          "https://flipboard.com/@PFN365",
          "https://www.newsbreak.com/m/pro-football-network-299253692"
        ]
      },
      {
        "@type": "WebSite",
        "@id": "https://www.profootballnetwork.com/#website",
        "url": "https://www.profootballnetwork.com/",
        "name": "PFSN",
        "alternateName": "Pro Football Network",
        "inLanguage": "en-US",
        "publisher": {
          "@id": "https://www.profootballnetwork.com/#organization"
        }
      },
      {
        "@type": "WebPage",
        "@id": "https://www.profootballnetwork.com/nfl-hq/#webpage",
        "url": "https://www.profootballnetwork.com/nfl-hq",
        "name": "NFL HQ - NFL Team Pages, Standings, Stats & News",
        "description": "Your complete NFL resource featuring all 32 team pages, live standings, stats, rosters, schedules, and the latest news from PFSN.",
        "inLanguage": "en-US",
        "isPartOf": {
          "@id": "https://www.profootballnetwork.com/#website"
        },
        "about": {
          "@id": "https://www.profootballnetwork.com/nfl-hq/#softwareapplication"
        }
      },
      {
        "@type": "SoftwareApplication",
        "@id": "https://www.profootballnetwork.com/nfl-hq/#softwareapplication",
        "name": "NFL HQ",
        "description": "Your complete NFL resource featuring all 32 team pages, live standings, stats, rosters, schedules, and the latest news. Track your favorite NFL teams with comprehensive coverage.",
        "url": "https://www.profootballnetwork.com/nfl-hq",
        "applicationCategory": "SportsApplication",
        "operatingSystem": "Web browser",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "USD"
        },
        "creator": {
          "@id": "https://www.profootballnetwork.com/#organization"
        },
        "publisher": {
          "@id": "https://www.profootballnetwork.com/#organization"
        }
      },
      {
        "@type": "Dataset",
        "@id": "https://www.profootballnetwork.com/nfl-hq/#dataset",
        "name": "NFL Team Database",
        "description": "Comprehensive database of all 32 NFL teams including standings, stats, rosters, schedules, news, and injury reports. Updated daily with live NFL data.",
        "url": "https://www.profootballnetwork.com/nfl-hq",
        "keywords": ["NFL Teams", "NFL Standings", "NFL Stats", "NFL Rosters", "NFL Schedules", "NFL News", "NFL Injuries"],
        "temporalCoverage": "2025/..",
        "isAccessibleForFree": true,
        "license": "https://www.profootballnetwork.com/terms-of-service",
        "creator": {
          "@id": "https://www.profootballnetwork.com/#organization"
        },
        "includedInDataCatalog": {
          "@type": "DataCatalog",
          "name": "PFSN Sports Data"
        },
        "distribution": {
          "@type": "DataDownload",
          "encodingFormat": "text/html",
          "contentUrl": "https://www.profootballnetwork.com/nfl-hq"
        }
      },
      {
        "@type": "BreadcrumbList",
        "@id": "https://www.profootballnetwork.com/nfl-hq/#breadcrumb",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": "https://www.profootballnetwork.com/"
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "NFL HQ",
            "item": "https://www.profootballnetwork.com/nfl-hq"
          }
        ]
      },
      {
        "@type": "SportsOrganization",
        "@id": "https://www.profootballnetwork.com/nfl-hq/#nfl",
        "name": "National Football League",
        "alternateName": "NFL",
        "url": "https://www.nfl.com",
        "sport": "American Football"
      }
    ]
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
