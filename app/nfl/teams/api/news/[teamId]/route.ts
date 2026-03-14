import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

// All 32 team IDs double as RSS feed tag slugs
const validTeamIds = new Set([
  'arizona-cardinals', 'atlanta-falcons', 'baltimore-ravens', 'buffalo-bills',
  'carolina-panthers', 'chicago-bears', 'cincinnati-bengals', 'cleveland-browns',
  'dallas-cowboys', 'denver-broncos', 'detroit-lions', 'green-bay-packers',
  'houston-texans', 'indianapolis-colts', 'jacksonville-jaguars', 'kansas-city-chiefs',
  'las-vegas-raiders', 'los-angeles-chargers', 'los-angeles-rams', 'miami-dolphins',
  'minnesota-vikings', 'new-england-patriots', 'new-orleans-saints', 'new-york-giants',
  'new-york-jets', 'philadelphia-eagles', 'pittsburgh-steelers', 'san-francisco-49ers',
  'seattle-seahawks', 'tampa-bay-buccaneers', 'tennessee-titans', 'washington-commanders',
]);

function parseRssFeed(xmlData: string): any[] {
  const $ = cheerio.load(xmlData, { xmlMode: true });
  const articles: any[] = [];

  $('item').each((_index, element) => {
    const $item = $(element);
    const title = $item.find('title').text().trim();
    const link = $item.find('link').text().trim();
    const pubDate = $item.find('pubDate').text().trim();
    const author = $item.find('dc\\:creator, creator').text().trim();
    const category = $item.find('category').first().text().trim();

    // Clean up description by removing HTML tags
    const cleanDescription = $item.find('description').text()
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .trim();

    articles.push({
      title: title || 'Untitled',
      description: cleanDescription,
      link: link || '#',
      pubDate: pubDate || new Date().toISOString(),
      author: author || undefined,
      category: category || 'NFL News',
    });
  });

  return articles;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const { teamId } = await params;

    if (!validTeamIds.has(teamId)) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    // Fetch both PFN RSS feeds in parallel (tag feed + team HQ feed)
    const tagFeedUrl = `https://www.profootballnetwork.com/tag/${teamId}/feed/`;
    const teamHqFeedUrl = `https://www.profootballnetwork.com/nfl-team-hq/${teamId}/feed/`;

    const [tagResponse, teamHqResponse] = await Promise.all([
      fetch(tagFeedUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/rss+xml, application/xml, text/xml',
          'User-Agent': 'NFL Team Pages/1.0'
        },
        next: { revalidate: 3600 }
      }),
      fetch(teamHqFeedUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/rss+xml, application/xml, text/xml',
          'User-Agent': 'NFL Team Pages/1.0'
        },
        next: { revalidate: 3600 }
      })
    ]);

    let allArticles: any[] = [];

    if (tagResponse.ok) {
      const tagXml = await tagResponse.text();
      allArticles = allArticles.concat(parseRssFeed(tagXml));
    }

    if (teamHqResponse.ok) {
      const teamHqXml = await teamHqResponse.text();
      allArticles = allArticles.concat(parseRssFeed(teamHqXml));
    }

    if (!tagResponse.ok && !teamHqResponse.ok) {
      throw new Error(`Both RSS feeds failed: Tag feed ${tagResponse.status}, Team HQ feed ${teamHqResponse.status}`);
    }

    // Deduplicate by link URL
    const uniqueArticles = Array.from(
      new Map(allArticles.map(a => [a.link, a])).values()
    );

    // Sort newest first
    const articles = uniqueArticles
      .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())
      .slice(0, 12);

    return NextResponse.json({
      success: true,
      articles,
      count: articles.length,
      isCardinalsFocused: articles.length > 0,
    });

  } catch (error) {
    console.error('News API Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch team news',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Enable CORS for this route (restricted to known origins)
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin') || '';
  const allowedOrigins = [
    'https://www.profootballnetwork.com',
    'https://profootballnetwork.com',
    'https://nfl-hq.vercel.app',
    'http://localhost:3000',
  ];

  const corsOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];

  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': corsOrigin,
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
