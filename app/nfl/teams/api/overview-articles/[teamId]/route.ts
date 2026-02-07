import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const { teamId } = await params;

    // Map team IDs to PFSN RSS feed tags
    const teamRssMap: { [key: string]: string } = {
      'arizona-cardinals': 'arizona-cardinals',
      'atlanta-falcons': 'atlanta-falcons',
      'baltimore-ravens': 'baltimore-ravens',
      'buffalo-bills': 'buffalo-bills',
      'carolina-panthers': 'carolina-panthers',
      'chicago-bears': 'chicago-bears',
      'cincinnati-bengals': 'cincinnati-bengals',
      'cleveland-browns': 'cleveland-browns',
      'dallas-cowboys': 'dallas-cowboys',
      'denver-broncos': 'denver-broncos',
      'detroit-lions': 'detroit-lions',
      'green-bay-packers': 'green-bay-packers',
      'houston-texans': 'houston-texans',
      'indianapolis-colts': 'indianapolis-colts',
      'jacksonville-jaguars': 'jacksonville-jaguars',
      'kansas-city-chiefs': 'kansas-city-chiefs',
      'las-vegas-raiders': 'las-vegas-raiders',
      'los-angeles-chargers': 'los-angeles-chargers',
      'los-angeles-rams': 'los-angeles-rams',
      'miami-dolphins': 'miami-dolphins',
      'minnesota-vikings': 'minnesota-vikings',
      'new-england-patriots': 'new-england-patriots',
      'new-orleans-saints': 'new-orleans-saints',
      'new-york-giants': 'new-york-giants',
      'new-york-jets': 'new-york-jets',
      'philadelphia-eagles': 'philadelphia-eagles',
      'pittsburgh-steelers': 'pittsburgh-steelers',
      'san-francisco-49ers': 'san-francisco-49ers',
      'seattle-seahawks': 'seattle-seahawks',
      'tampa-bay-buccaneers': 'tampa-bay-buccaneers',
      'tennessee-titans': 'tennessee-titans',
      'washington-commanders': 'washington-commanders'
    };

    const rssTag = teamRssMap[teamId];
    if (!rssTag) {
      return NextResponse.json({
        success: false,
        error: `No RSS feed available for team: ${teamId}`
      }, { status: 404 });
    }

    // Define both RSS feed URLs
    const tagFeedUrl = `https://www.profootballnetwork.com/tag/${rssTag}/feed/`;
    const teamHqFeedUrl = `https://www.profootballnetwork.com/nfl-team-hq/${rssTag}/feed/`;

    // Fetch both RSS feeds in parallel
    const [tagResponse, teamHqResponse] = await Promise.all([
      fetch(tagFeedUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/rss+xml, application/xml, text/xml',
          'User-Agent': 'NFL Team Pages/1.0'
        },
        next: { revalidate: 3600 } // Cache for 1 hour
      }),
      fetch(teamHqFeedUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/rss+xml, application/xml, text/xml',
          'User-Agent': 'NFL Team Pages/1.0'
        },
        next: { revalidate: 3600 } // Cache for 1 hour
      })
    ]);

    // Helper function to parse RSS feed
    const parseRssFeed = (xmlData: string, feedSource: string) => {
      const $ = cheerio.load(xmlData, { xmlMode: true });
      const articles: any[] = [];

      $('item').each((_index, element) => {
        const $item = $(element);

        const title = $item.find('title').text();
        const link = $item.find('link').text();
        const pubDate = $item.find('pubDate').text();
        const author = $item.find('dc\\:creator, creator').text();
        const category = $item.find('category').first().text();

        // Extract featured image from media:thumbnail or description img tag
        let featuredImage = $item.find('media\\:thumbnail').attr('url') || '';

        if (!featuredImage) {
          // Fallback: try to extract from description HTML
          const descriptionHtml = $item.find('description').text();
          const imgMatch = descriptionHtml.match(/src="([^"]+)"/);
          if (imgMatch) {
            featuredImage = imgMatch[1];
          }
        }

        // Clean up description by removing HTML tags
        const cleanDescription = $item.find('description').text()
          .replace(/<[^>]*>/g, '')
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .trim();

        // Estimate read time based on content length
        const readTime = Math.max(1, Math.round(cleanDescription.length / 200)) + ' min read';

        articles.push({
          title: title.trim(),
          description: cleanDescription,
          link: link.trim(),
          pubDate: pubDate.trim(),
          author: author.trim() || 'PFSN',
          category: category.trim() || 'NFL News',
          readTime,
          featuredImage: featuredImage.trim(),
          teamId,
          source: feedSource
        });
      });

      return articles;
    };

    let allArticles: any[] = [];

    // Parse tag feed if successful
    if (tagResponse.ok) {
      const tagXmlData = await tagResponse.text();
      const tagArticles = parseRssFeed(tagXmlData, 'tag-feed');
      allArticles = allArticles.concat(tagArticles);
    }

    // Parse team HQ feed if successful
    if (teamHqResponse.ok) {
      const teamHqXmlData = await teamHqResponse.text();
      const teamHqArticles = parseRssFeed(teamHqXmlData, 'team-hq-feed');
      allArticles = allArticles.concat(teamHqArticles);
    }

    // If both feeds failed, throw an error
    if (!tagResponse.ok && !teamHqResponse.ok) {
      throw new Error(`Both RSS feeds failed: Tag feed ${tagResponse.status}, Team HQ feed ${teamHqResponse.status}`);
    }

    // Remove duplicates based on article link (URL)
    const uniqueArticles = Array.from(
      new Map(allArticles.map(article => [article.link, article])).values()
    );

    // Sort by publication date (newest first)
    const articles = uniqueArticles.sort((a, b) => {
      const dateA = new Date(a.pubDate).getTime();
      const dateB = new Date(b.pubDate).getTime();
      return dateB - dateA; // Descending order (newest first)
    });

    return NextResponse.json({
      success: true,
      articles: articles,
      count: articles.length,
      source: 'PFSN RSS Feed',
      teamId
    });

  } catch (error) {
    console.error('Overview Articles RSS Feed Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: `Failed to fetch articles for team`,
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