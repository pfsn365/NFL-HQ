// Static playoff game data for 2025-2026 season
// This will be used until the API has actual game results

export interface StaticPlayoffGame {
  date: string; // YYYY-MM-DD format
  time: string; // Game time
  awayTeam: string; // Team slug
  homeTeam: string;
  tv: string;
  venue: string;
  city: string;
  state: string;
  round: string;
}

export const wildCardGames2026: StaticPlayoffGame[] = [
  // Saturday, January 11, 2026
  {
    date: '2026-01-11',
    time: '1:30 PM ET',
    awayTeam: 'los-angeles-rams', // "Los Angeles" from ESPN
    homeTeam: 'carolina-panthers', // "Carolina" from ESPN
    tv: 'FOX',
    venue: 'Bank of America Stadium',
    city: 'Charlotte',
    state: 'NC',
    round: 'NFC Wild Card',
  },
  {
    date: '2026-01-11',
    time: '5:00 PM ET',
    awayTeam: 'green-bay-packers',
    homeTeam: 'chicago-bears',
    tv: 'Prime Video',
    venue: 'Soldier Field',
    city: 'Chicago',
    state: 'IL',
    round: 'NFC Wild Card',
  },
  // Sunday, January 12, 2026
  {
    date: '2026-01-12',
    time: '10:00 AM ET',
    awayTeam: 'buffalo-bills',
    homeTeam: 'jacksonville-jaguars',
    tv: 'CBS',
    venue: 'EverBank Stadium',
    city: 'Jacksonville',
    state: 'FL',
    round: 'AFC Wild Card',
  },
  {
    date: '2026-01-12',
    time: '1:30 PM ET',
    awayTeam: 'san-francisco-49ers',
    homeTeam: 'philadelphia-eagles',
    tv: 'FOX',
    venue: 'Lincoln Financial Field',
    city: 'Philadelphia',
    state: 'PA',
    round: 'NFC Wild Card',
  },
  {
    date: '2026-01-12',
    time: '5:00 PM ET',
    awayTeam: 'los-angeles-chargers', // "Los Angeles" from ESPN
    homeTeam: 'new-england-patriots',
    tv: 'NBC/Peacock',
    venue: 'Gillette Stadium',
    city: 'Foxborough',
    state: 'MA',
    round: 'AFC Wild Card',
  },
  {
    date: '2026-01-12',
    time: '8:15 PM ET',
    awayTeam: 'houston-texans',
    homeTeam: 'pittsburgh-steelers',
    tv: 'ESPN/ABC',
    venue: 'Acrisure Stadium',
    city: 'Pittsburgh',
    state: 'PA',
    round: 'AFC Wild Card',
  },
];
