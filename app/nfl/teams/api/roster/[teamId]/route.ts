import { NextRequest, NextResponse } from 'next/server';

interface SportsKeedaPlayer {
  name: string;
  slug: string;
  jersey_no: string;
  is_active: boolean;
  is_suspended: boolean;
  is_injured: boolean;
  is_physically_unable: boolean;
  is_practice_squad: boolean;
  is_non_football_injury_reserve: boolean;
  is_exempt: boolean;
  provider_id: number;
  height_in_inch: number;
  height_in_cm: number;
  weight_in_lbs: number;
  weight_in_kg: number;
  college: string;
  college_id: number;
  experience: number;
  draft: {
    year: number;
    round: number;
    roundPickNumber: number;
    overallPickNumber: number;
  };
  age: number;
  birth_date: string;
  birth_place: string;
  height: string;
  weight: string;
  positions: Array<{
    name: string;
    abbreviation: string;
  }>;
  league: string;
  league_abbr: string;
  sk_name: string;
}

interface SportsKeedaResponse {
  squad: SportsKeedaPlayer[];
}

// Team ID to Sportskeeda slug mapping
const teamSlugMap: Record<string, string> = {
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const { teamId } = await params;

    // Get Sportskeeda slug for the team
    const sportsKeedaSlug = teamSlugMap[teamId];

    if (!sportsKeedaSlug) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    // Fetch data from Sportskeeda API
    const response = await fetch(
      `https://api.sportskeeda.com/v1/taxonomy/${sportsKeedaSlug}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; NFL-Team-Pages/1.0)',
        },
        next: { revalidate: 3600 } // Cache for 1 hour
      }
    );

    if (!response.ok) {
      throw new Error(`Sportskeeda API error: ${response.status}`);
    }

    const data: SportsKeedaResponse = await response.json();

    if (!data.squad || !Array.isArray(data.squad)) {
      return NextResponse.json(
        { error: 'No roster data found' },
        { status: 404 }
      );
    }

    // Transform the data to our format
    const transformedRoster = data.squad
      .map(player => ({
        name: player.name,
        slug: player.slug,
        jerseyNumber: parseInt(player.jersey_no) || 0,
        position: player.positions?.[0]?.abbreviation || 'N/A',
        positionFull: player.positions?.[0]?.name || 'Not Available',
        age: player.age,
        height: formatHeight(player.height_in_inch),
        weight: player.weight_in_lbs,
        college: player.college?.replace('University of ', '').replace(' University', '') || 'N/A',
        experience: player.experience,
        impactPlus: generateImpactPlus(player), // Generate placeholder Impact+ rating
        isActive: player.is_active,
        isInjured: player.is_injured,
        isSuspended: player.is_suspended,
        isPracticeSquad: player.is_practice_squad,
        isPhysicallyUnable: player.is_physically_unable,
        isNonFootballInjuryReserve: player.is_non_football_injury_reserve,
        isExempt: player.is_exempt,
        status: getPlayerStatus(player),
        draft: player.draft.year > 0 ? {
          year: player.draft.year,
          round: player.draft.round,
          pick: player.draft.overallPickNumber
        } : null,
        birthDate: player.birth_date,
        birthPlace: player.birth_place
      }))
      .sort((a, b) => a.jerseyNumber - b.jerseyNumber); // Sort by jersey number

    // Organize players by status
    const activeRoster = transformedRoster.filter(player => player.status === 'Active');
    const practiceSquad = transformedRoster.filter(player => player.status === 'Practice Squad');
    const injuredReserve = transformedRoster.filter(player => player.status === 'Injured Reserve');
    const physicallyUnableToPerform = transformedRoster.filter(player => player.status === 'Physically Unable to Perform');
    const nonFootballInjuryReserve = transformedRoster.filter(player => player.status === 'Non-Football Injury Reserve');
    const suspended = transformedRoster.filter(player => player.status === 'Suspended');
    const exempt = transformedRoster.filter(player => player.status === 'Exempt');

    return NextResponse.json({
      teamId,
      roster: {
        activeRoster,
        practiceSquad,
        injuredReserve,
        physicallyUnableToPerform,
        nonFootballInjuryReserve,
        suspended,
        exempt
      },
      totalPlayers: transformedRoster.length,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Roster API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch roster data' },
      { status: 500 }
    );
  }
}

function formatHeight(heightInInches: number): string {
  if (!heightInInches) return 'N/A';
  const feet = Math.floor(heightInInches / 12);
  const inches = heightInInches % 12;
  return `${feet}'${inches}"`;
}

function getPlayerStatus(player: SportsKeedaPlayer): string {
  // Priority order for status determination
  if (player.is_suspended) return 'Suspended';
  if (player.is_exempt) return 'Exempt';
  if (player.is_injured) return 'Injured Reserve';
  if (player.is_physically_unable) return 'Physically Unable to Perform';
  if (player.is_non_football_injury_reserve) return 'Non-Football Injury Reserve';
  if (player.is_practice_squad) return 'Practice Squad';
  if (player.is_active) return 'Active';

  // Default fallback
  return 'Active';
}

function generateImpactPlus(player: SportsKeedaPlayer): number {
  // Generate a realistic Impact+ rating based on experience, draft position, etc.
  let baseRating = 75;

  // Adjust based on experience
  if (player.experience >= 5) baseRating += 10;
  else if (player.experience >= 3) baseRating += 5;
  else if (player.experience === 0) baseRating -= 5; // Rookies

  // Adjust based on draft position (if available)
  if (player.draft.year > 0) {
    if (player.draft.round === 1) baseRating += 15;
    else if (player.draft.round === 2) baseRating += 10;
    else if (player.draft.round === 3) baseRating += 5;
  }

  // Add some randomization to make it feel realistic
  const randomAdjustment = Math.floor(Math.random() * 20) - 10; // -10 to +10
  baseRating += randomAdjustment;

  // Keep within reasonable bounds
  return Math.max(60, Math.min(140, baseRating));
}