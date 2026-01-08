import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch(
      'https://statics.sportskeeda.com/assets/sheets/tools/free-agents/freeAgentsData.json',
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (compatible; NFL-HQ/1.0)',
        },
      }
    );

    if (!response.ok) {
      console.error(`Sportskeeda API responded with status: ${response.status}`);
      throw new Error(`API responded with status: ${response.status}`);
    }

    const data = await response.json();

    console.log('Free agents API response structure:', {
      hasOutput: !!data.output,
      isOutputArray: Array.isArray(data.output),
      outputLength: data.output?.length,
      sampleKeys: data.output?.[0] ? Object.keys(data.output[0]) : []
    });

    // Validate data structure
    if (!data.output || !Array.isArray(data.output)) {
      console.error('Invalid data structure from Sportskeeda API:', Object.keys(data));
      throw new Error('Invalid data structure from external API');
    }

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
      },
    });
  } catch (error) {
    console.error('Error in free-agents API route:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch free agents data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
