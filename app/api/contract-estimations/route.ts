import { NextResponse } from 'next/server';

export const revalidate = 300;

export async function GET() {
  try {
    const response = await fetch(
      'https://staticj.profootballnetwork.com/assets/sheets/pfn/nfl-contract-estimations/data.json',
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'PFN-Internal-NON-Blocking',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }

    const data = await response.json();

    if (!data.collections || !Array.isArray(data.collections)) {
      throw new Error('Invalid data structure from contract estimations API');
    }

    // Transform each collection: normalize headers and build contract objects
    const sheets = data.collections
      .filter((c: any) => c.data && c.data.length > 1)
      .map((c: any) => {
        const rawHeaders: string[] = c.data[0];
        // Normalize header keys: strip newlines, ▾, trim whitespace
        const headers = rawHeaders.map((h: string) =>
          h.replace(/\n/g, ' ').replace(/▾/g, '').trim()
        );

        const contracts = c.data.slice(1).map((row: any[]) => {
          const obj: Record<string, string> = {};
          headers.forEach((header: string, i: number) => {
            obj[header] = row[i] != null ? String(row[i]) : '';
          });
          return obj;
        });

        return { sheetName: c.sheetName, contracts };
      });

    return NextResponse.json({ sheets }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('Error in contract-estimations API route:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch contract estimations data',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
