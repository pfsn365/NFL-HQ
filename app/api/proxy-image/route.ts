import { NextRequest, NextResponse } from 'next/server';

// Allowed domains for image proxying
const ALLOWED_DOMAINS = [
  'profootballnetwork.com',
  'staticd.profootballnetwork.com',
  'static.profootballnetwork.com',
];

function isAllowedUrl(urlString: string): boolean {
  try {
    const parsed = new URL(urlString);

    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return false;
    }

    // Check if hostname matches or is a subdomain of allowed domains
    return ALLOWED_DOMAINS.some(domain =>
      parsed.hostname === domain || parsed.hostname.endsWith('.' + domain)
    );
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl.searchParams.get('url');

    if (!url) {
      return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
    }

    // Validate URL format and domain
    if (!isAllowedUrl(url)) {
      return NextResponse.json({ error: 'Only PFSN URLs are allowed' }, { status: 403 });
    }

    // Fetch the image from the external URL
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'PFN-Internal-NON-Blocking',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch image: ${response.statusText}` },
        { status: response.status }
      );
    }

    // Get the image data
    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/svg+xml';

    // Return the image with proper headers
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
      },
    });
  } catch (error) {
    console.error('Error proxying image:', error);
    return NextResponse.json(
      { error: 'Failed to proxy image' },
      { status: 500 }
    );
  }
}
