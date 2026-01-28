import { NextRequest, NextResponse } from 'next/server';

// Lazy load the data only when the API is called
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const { teamId } = await params;

    // Dynamic import - only loads the data when this route is called
    const { getTeamInfo } = await import('@/data/teamInfo');
    const { getHallOfFamers } = await import('@/data/hallOfFame');

    const teamInfo = getTeamInfo(teamId);
    const hallOfFamers = getHallOfFamers(teamId);

    return NextResponse.json({
      teamInfo,
      hallOfFamers
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600',
      },
    });
  } catch (error) {
    console.error('Team info API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team info' },
      { status: 500 }
    );
  }
}
