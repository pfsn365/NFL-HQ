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

    // Validate and transform data structure
    if (!data.collections || !Array.isArray(data.collections) || !data.collections[0]?.data) {
      console.error('Invalid data structure from Sportskeeda API:', Object.keys(data));
      throw new Error('Invalid data structure from external API');
    }

    // Transform from collections format to output format
    const rawData = data.collections[0].data;
    const headers = rawData[0]; // First row is headers
    const rows = rawData.slice(1); // Remaining rows are data

    // Debug: Log headers to identify field names
    console.log('Free Agents API Headers:', headers);

    // Convert to array of objects
    const output = rows.map((row: any[]) => {
      const obj: any = {};
      headers.forEach((header: string, index: number) => {
        obj[header] = row[index];
      });
      return obj;
    });

    return NextResponse.json({ output }, {
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
