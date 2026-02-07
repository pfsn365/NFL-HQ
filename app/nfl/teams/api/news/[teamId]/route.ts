import { NextRequest, NextResponse } from 'next/server';

// Team ID to PFSN team abbreviation mapping
const teamIdToPFSNMap: Record<string, string> = {
  'arizona-cardinals': 'ARI',
  'atlanta-falcons': 'ATL',
  'baltimore-ravens': 'BAL',
  'buffalo-bills': 'BUF',
  'carolina-panthers': 'CAR',
  'chicago-bears': 'CHI',
  'cincinnati-bengals': 'CIN',
  'cleveland-browns': 'CLE',
  'dallas-cowboys': 'DAL',
  'denver-broncos': 'DEN',
  'detroit-lions': 'DET',
  'green-bay-packers': 'GB',
  'houston-texans': 'HOU',
  'indianapolis-colts': 'IND',
  'jacksonville-jaguars': 'JAX',
  'kansas-city-chiefs': 'KC',
  'las-vegas-raiders': 'LV',
  'los-angeles-chargers': 'LAC',
  'los-angeles-rams': 'LAR',
  'miami-dolphins': 'MIA',
  'minnesota-vikings': 'MIN',
  'new-england-patriots': 'NE',
  'new-orleans-saints': 'NO',
  'new-york-giants': 'NYG',
  'new-york-jets': 'NYJ',
  'philadelphia-eagles': 'PHI',
  'pittsburgh-steelers': 'PIT',
  'san-francisco-49ers': 'SF',
  'seattle-seahawks': 'SEA',
  'tampa-bay-buccaneers': 'TB',
  'tennessee-titans': 'TEN',
  'washington-commanders': 'WAS',
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const { teamId } = await params;

    // Get PFSN team abbreviation
    const pfsnTeamAbbr = teamIdToPFSNMap[teamId];

    if (!pfsnTeamAbbr) {
      return NextResponse.json(
        { error: 'Team not found or not yet mapped' },
        { status: 404 }
      );
    }

    // Use the new PFSN API endpoint with dynamic team
    const apiUrl = `https://gotham.profootballnetwork.com/taxonomy/nfl/news-feeds?pageStart=1&newsType=Fantasy&team=${pfsnTeamAbbr}`;

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'NFL Team Pages/1.0'
      },
      next: { revalidate: 3600 } // Cache for 1 hour
    });

    if (!response.ok) {
      throw new Error(`PFSN API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Extract articles from the feeds array
    const articles = data.feeds || [];

    // Map the PFSN API structure to our expected format
    const mappedNews = articles.slice(0, 12).map((article: any) => ({
      title: article.title || 'Untitled',
      description: article.content || '',
      link: article.url || '#',
      pubDate: article.pubDate || new Date().toISOString(),
      author: article.author || undefined,
      category: article.categories?.[0] || 'Fantasy'
    }));

    return NextResponse.json({
      success: true,
      articles: mappedNews,
      count: mappedNews.length,
      isCardinalsFocused: true, // This endpoint is team-specific
      team: pfsnTeamAbbr,
      debug: {
        totalArticles: articles.length,
        status: data.status,
        sampleTitles: mappedNews.slice(0, 3).map((a: any) => a.title)
      }
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