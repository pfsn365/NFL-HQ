import { NextResponse } from 'next/server';

// Each row is an array: [Team, Short Name, Slug, Cap Space, 2025 Salary Cap, Active Cap Spend, Dead Money]
type SportsKeedaTeamRow = string[];

interface SportsKeedaSalaryCapResponse {
  collections: Array<{
    sheetName: string;
    data: SportsKeedaTeamRow[];
  }>;
}

interface TeamSalarySummary {
  teamId: string;
  capSpace: number;
  salaryCap: number;
  activeCapSpend: number;
  deadMoney: number;
}

// Helper function to parse currency strings
function parseCurrency(value: string): number {
  if (!value) return 0;
  // Remove $, commas, and handle negative values in parentheses
  const cleaned = value.replace(/[$,]/g, '').replace(/\((.+)\)/, '-$1');
  return parseFloat(cleaned) || 0;
}

export async function GET() {
  try {
    const response = await fetch(
      'https://statics.sportskeeda.com/assets/sheets/tools/salary-caps/salaryCaps.json',
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; NFL-HQ/1.0)',
        },
        next: { revalidate: 3600 } // Cache for 1 hour
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch salary cap data: ${response.status}`);
    }

    const data: SportsKeedaSalaryCapResponse = await response.json();

    const salaryCapSheet = data.collections?.find(c => c.sheetName === 'salary_caps');
    if (!salaryCapSheet?.data) {
      throw new Error('Invalid salary cap data structure');
    }

    // Skip header row (index 0) and map team data
    const teams: TeamSalarySummary[] = salaryCapSheet.data
      .slice(1) // Skip header row
      .filter(row => row[2]) // Ensure slug exists
      .map(row => ({
        teamId: row[2], // Slug
        capSpace: parseCurrency(row[3]),
        salaryCap: parseCurrency(row[4]),
        activeCapSpend: parseCurrency(row[5]),
        deadMoney: parseCurrency(row[6]),
      }));

    return NextResponse.json({
      teams,
      lastUpdated: new Date().toISOString(),
      season: 2026,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=1800',
      },
    });
  } catch (error) {
    console.error('Salary Cap API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch salary cap data' },
      { status: 500 }
    );
  }
}
