import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

interface Article {
  title: string;
  link: string;
  pubDate: string;
  description: string;
  image?: string;
  featuredImage?: string;
  author?: string;
  category?: string;
  readTime?: string;
}

function parseRSSItems(xmlText: string): Article[] {
  const $ = cheerio.load(xmlText, { xmlMode: true });
  const articles: Article[] = [];

  $('item').each((_index, element) => {
    const $item = $(element);

    const title = $item.find('title').text().trim();
    const link = $item.find('link').text().trim();
    const pubDate = $item.find('pubDate').text().trim();
    const author = $item.find('dc\\:creator, creator').text().trim();
    const category = $item.find('category').first().text().trim();

    // Extract featured image from media:thumbnail (primary method)
    let featuredImage = $item.find('media\\:thumbnail').attr('url') || '';

    // Fallback: try media:content
    if (!featuredImage) {
      featuredImage = $item.find('media\\:content').attr('url') || '';
    }

    // Fallback: try enclosure
    if (!featuredImage) {
      featuredImage = $item.find('enclosure').attr('url') || '';
    }

    // Fallback: try to extract from content:encoded HTML
    if (!featuredImage) {
      const contentEncoded = $item.find('content\\:encoded').text();
      const imgMatch = contentEncoded.match(/<img[^>]+src=["']([^"']+)["']/i);
      if (imgMatch) {
        featuredImage = imgMatch[1];
      }
    }

    // Fallback: try to extract from description HTML
    if (!featuredImage) {
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
      .trim()
      .slice(0, 200);

    // Estimate read time based on content length
    const readTime = Math.max(1, Math.round(cleanDescription.length / 200)) + ' min read';

    if (title && link) {
      articles.push({
        title,
        link,
        pubDate,
        description: cleanDescription,
        image: featuredImage.trim(),
        featuredImage: featuredImage.trim(),
        author: author || 'PFSN',
        category: category || 'NFL News',
        readTime,
      });
    }
  });

  return articles;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rssUrl = searchParams.get('url');

  if (!rssUrl) {
    return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
  }

  // Validate URL is from profootballnetwork.com
  if (!rssUrl.includes('profootballnetwork.com')) {
    return NextResponse.json({ error: 'Invalid RSS feed URL' }, { status: 400 });
  }

  try {
    const response = await fetch(rssUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NFL-HQ/1.0)',
        'Accept': 'application/rss+xml, application/xml, text/xml',
      },
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      return NextResponse.json({ articles: [] });
    }

    const xmlText = await response.text();
    const articles = parseRSSItems(xmlText);

    return NextResponse.json({
      articles,
      count: articles.length,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=1800',
      },
    });
  } catch (error) {
    console.error('RSS proxy error:', error);
    return NextResponse.json({ articles: [] });
  }
}
