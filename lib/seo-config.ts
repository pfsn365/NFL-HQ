import { TeamData } from '@/data/teams';

export interface SEOConfig {
  title: string;
  description: string;
  keywords: string[];
  openGraph?: {
    title?: string;
    description?: string;
    images?: string[];
    type?: 'website' | 'article' | 'profile';
  };
  twitter?: {
    card?: 'summary' | 'summary_large_image';
    title?: string;
    description?: string;
    images?: string[];
  };
  structuredData?: Record<string, any>;
}

export function getBaseSEO(team: TeamData): SEOConfig {
  return {
    title: `${team.fullName} - Official Team Page`,
    description: `Get the latest ${team.fullName} news, roster, schedule, stats, and more. Your complete source for ${team.name} team information.`,
    keywords: [
      team.fullName,
      "NFL",
      "football",
      `${team.name} roster`,
      `${team.name} schedule`,
      `${team.name} stats`,
      team.homeVenue,
      team.division,
      `${team.name} news`
    ],
    openGraph: {
      title: `${team.fullName} - Official Team Page`,
      description: `Get the latest ${team.fullName} news, roster, schedule, stats, and more.`,
      type: "website",
      images: [team.logoUrl]
    },
    twitter: {
      card: "summary_large_image",
      title: `${team.fullName} - Official Team Page`,
      description: `Get the latest ${team.fullName} news, roster, schedule, stats, and more.`,
      images: [team.logoUrl]
    }
  };
}

export function getTabSEO(team: TeamData): Record<string, SEOConfig> {
  return {
    overview: {
      title: `${team.fullName} Overview - Team Information & Recent Games`,
      description: `Complete ${team.fullName} team overview including recent games, team information, ${team.division} standings, and key statistics.`,
      keywords: [
        `${team.name} overview`,
        `${team.name} team info`,
        `${team.name} recent games`,
        `${team.division} standings`,
        `${team.name} achievements`
      ],
      openGraph: {
        title: `${team.fullName} Overview`,
        description: `Complete team overview with recent games, standings, and key information.`,
        type: "website"
      },
      structuredData: {
        "@context": "https://schema.org",
        "@type": "SportsTeam",
        "name": team.fullName,
        "sport": "American Football",
        "memberOf": {
          "@type": "SportsOrganization",
          "name": "National Football League"
        },
        "location": {
          "@type": "Place",
          "name": team.location
        },
        "homeLocation": {
          "@type": "Stadium",
          "name": team.homeVenue,
          "address": {
            "@type": "PostalAddress",
            "addressLocality": team.location.split(',')[0],
            "addressRegion": team.location.split(',')[1]?.trim()
          }
        },
        "logo": team.logoUrl
      }
    },
    roster: {
      title: `${team.fullName} Roster 2024-25 - Players, Positions & Impact+ Ratings`,
      description: `Complete ${team.fullName} roster with player positions, Impact+ ratings, and detailed player information for offense and defense.`,
      keywords: [
        `${team.name} roster`,
        `${team.name} players`,
        `${team.name} offense`,
        `${team.name} defense`,
        "Impact+ ratings",
        `${team.name} depth chart`
      ],
      openGraph: {
        title: `${team.fullName} Roster 2024-25`,
        description: `Complete roster with player positions and Impact+ ratings.`,
        type: "website"
      }
    },
    schedule: {
      title: `${team.fullName} Schedule 2024-25 - Games, Results & Upcoming Matches`,
      description: `${team.fullName} complete schedule including preseason results, regular season games, game times, and opponent information.`,
      keywords: [
        `${team.name} schedule`,
        `${team.name} games`,
        `${team.name} fixtures`,
        "NFL schedule",
        `${team.name} calendar`,
        `${team.homeVenue} games`
      ],
      openGraph: {
        title: `${team.fullName} Schedule 2024-25`,
        description: `Complete schedule with game results and upcoming matches.`,
        type: "website"
      }
    },
    stats: {
      title: `${team.fullName} Stats - Team Statistics & Player Leaders`,
      description: `Complete ${team.fullName} statistics including team stats, individual player leaders, offensive and defensive rankings.`,
      keywords: [
        `${team.name} stats`,
        `${team.name} statistics`,
        `${team.name} leaders`,
        "NFL stats",
        `${team.name} offense stats`,
        `${team.name} defense stats`
      ],
      openGraph: {
        title: `${team.fullName} Statistics`,
        description: `Complete team statistics and player leaders.`,
        type: "website"
      }
    },
    "depth-chart": {
      title: `${team.fullName} Depth Chart - Position Groups & Player Rankings`,
      description: `${team.fullName} depth chart showing starting lineups and backups for offense, defense, and special teams.`,
      keywords: [
        `${team.name} depth chart`,
        `${team.name} starters`,
        `${team.name} lineup`,
        `${team.name} position groups`,
        `${team.name} roster depth`
      ],
      openGraph: {
        title: `${team.fullName} Depth Chart`,
        description: `Complete depth chart with position groups and player rankings.`,
        type: "website"
      }
    },
    "draft-picks": {
      title: `${team.fullName} Draft Picks - Recent Drafts & Player Analysis`,
      description: `${team.fullName} draft history, recent picks, draft analysis, and rookie information.`,
      keywords: [
        `${team.name} draft`,
        `${team.name} draft picks`,
        `${team.name} rookies`,
        "NFL draft",
        `${team.name} draft history`
      ],
      openGraph: {
        title: `${team.fullName} Draft Picks`,
        description: `Recent draft picks and player analysis.`,
        type: "website"
      }
    },
    transactions: {
      title: `${team.fullName} Transactions - Trades, Signings & Roster Moves`,
      description: `Latest ${team.fullName} transactions including player signings, trades, releases, and roster moves.`,
      keywords: [
        `${team.name} transactions`,
        `${team.name} trades`,
        `${team.name} signings`,
        `${team.name} roster moves`,
        "NFL transactions"
      ],
      openGraph: {
        title: `${team.fullName} Transactions`,
        description: `Latest trades, signings, and roster moves.`,
        type: "website"
      }
    },
    "salary-cap": {
      title: `${team.fullName} Salary Cap - Contract Details & Cap Space`,
      description: `${team.fullName} salary cap information, player contracts, cap space, and financial analysis.`,
      keywords: [
        `${team.name} salary cap`,
        `${team.name} contracts`,
        `${team.name} cap space`,
        "NFL salary cap",
        `${team.name} payroll`
      ],
      openGraph: {
        title: `${team.fullName} Salary Cap`,
        description: `Contract details and salary cap analysis.`,
        type: "website"
      }
    },
    "injury-report": {
      title: `${team.fullName} Injury Report - Player Status & Practice Updates`,
      description: `Current ${team.fullName} injury report with player status, practice participation, and game availability.`,
      keywords: [
        `${team.name} injury report`,
        `${team.name} injuries`,
        `${team.name} player status`,
        `${team.name} practice report`,
        "NFL injury report"
      ],
      openGraph: {
        title: `${team.fullName} Injury Report`,
        description: `Current player status and practice updates.`,
        type: "website"
      }
    }
  };
}

export function getSEOConfig(team: TeamData, tab?: string): SEOConfig {
  const baseSEO = getBaseSEO(team);
  const tabSEO = getTabSEO(team);

  if (tab && tabSEO[tab]) {
    return {
      ...baseSEO,
      ...tabSEO[tab],
      keywords: [...baseSEO.keywords, ...tabSEO[tab].keywords],
      openGraph: {
        ...baseSEO.openGraph,
        ...tabSEO[tab].openGraph
      },
      twitter: {
        ...baseSEO.twitter,
        ...tabSEO[tab].twitter
      }
    };
  }
  return baseSEO;
}