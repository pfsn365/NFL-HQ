/**
 * Scrape year-by-year franchise records from Pro Football Reference.
 * Run with: npx tsx scripts/scrape-pfr-records.ts
 *
 * Outputs: data/teamRecordsByYear.ts
 */

import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';

// PFR abbreviation mapping: teamId → PFR code
const TEAM_PFR_MAP: Record<string, string> = {
  'arizona-cardinals': 'crd',
  'atlanta-falcons': 'atl',
  'baltimore-ravens': 'rav',
  'buffalo-bills': 'buf',
  'carolina-panthers': 'car',
  'chicago-bears': 'chi',
  'cincinnati-bengals': 'cin',
  'cleveland-browns': 'cle',
  'dallas-cowboys': 'dal',
  'denver-broncos': 'den',
  'detroit-lions': 'det',
  'green-bay-packers': 'gnb',
  'houston-texans': 'htx',
  'indianapolis-colts': 'clt',
  'jacksonville-jaguars': 'jax',
  'kansas-city-chiefs': 'kan',
  'las-vegas-raiders': 'rai',
  'los-angeles-chargers': 'sdg',
  'los-angeles-rams': 'ram',
  'miami-dolphins': 'mia',
  'minnesota-vikings': 'min',
  'new-england-patriots': 'nwe',
  'new-orleans-saints': 'nor',
  'new-york-giants': 'nyg',
  'new-york-jets': 'nyj',
  'philadelphia-eagles': 'phi',
  'pittsburgh-steelers': 'pit',
  'san-francisco-49ers': 'sfo',
  'seattle-seahawks': 'sea',
  'tampa-bay-buccaneers': 'tam',
  'tennessee-titans': 'oti',
  'washington-commanders': 'was',
};

interface SeasonRecord {
  year: number;
  wins: number;
  losses: number;
  ties: number;
  divisionFinish: string;
  playoffs: string;
  coach: string;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function randomDelay(): number {
  // 5-7 seconds with random jitter
  return 5000 + Math.random() * 2000;
}

async function fetchPage(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`);
  }
  return response.text();
}

function parseTeamPage(html: string): SeasonRecord[] {
  let $ = cheerio.load(html);
  const records: SeasonRecord[] = [];

  // PFR sometimes wraps tables in HTML comments. Unwrap them.
  $('*').contents().each(function () {
    if (this.type === 'comment') {
      const commentText = (this as unknown as { data: string }).data;
      if (commentText.includes('id="team_index"') || commentText.includes('id="team_record"') || commentText.includes('<table')) {
        // Replace the comment node with actual HTML
        $(this).replaceWith(commentText);
      }
    }
  });
  // Re-parse after unwrapping comments
  $ = cheerio.load($.html());

  // Look for the main franchise table — try multiple selectors
  let table = $('table#team_index');
  if (table.length === 0) {
    table = $('table#team_record');
  }
  if (table.length === 0) {
    // Fallback: find the first table that has year/wins/losses columns
    $('table').each(function () {
      const headerText = $(this).find('thead').text().toLowerCase();
      if (headerText.includes('year') && (headerText.includes('w') || headerText.includes('wins'))) {
        table = $(this);
        return false; // break
      }
    });
  }

  if (table.length === 0) {
    console.warn('  ⚠ Could not find team record table');
    return records;
  }

  // Parse header to find column indices
  const headers: string[] = [];
  table.find('thead tr').last().find('th').each(function () {
    headers.push($(this).attr('data-stat') || $(this).text().trim().toLowerCase());
  });

  table.find('tbody tr').each(function () {
    const row = $(this);

    // Skip header rows and summary/divider rows
    if (row.hasClass('thead') || row.hasClass('over_header') || row.hasClass('divider')) {
      return;
    }

    // Extract data using data-stat attributes (PFR standard)
    const yearCell = row.find('[data-stat="year_id"], [data-stat="year"]');
    const yearText = yearCell.text().trim();
    // Year text might include team name or asterisk/plus, extract the 4-digit year
    const yearMatch = yearText.match(/(\d{4})/);
    if (!yearMatch) return;

    const year = parseInt(yearMatch[1], 10);
    if (isNaN(year) || year < 1920) return;

    const winsText = row.find('[data-stat="wins"]').text().trim();
    const lossesText = row.find('[data-stat="losses"]').text().trim();
    const tiesText = row.find('[data-stat="ties"]').text().trim();

    const wins = parseInt(winsText, 10) || 0;
    const losses = parseInt(lossesText, 10) || 0;
    const ties = parseInt(tiesText, 10) || 0;

    // Division finish
    const divFinish = row.find('[data-stat="div_finish"]').text().trim() ||
                      row.find('[data-stat="league_finish"]').text().trim() || '';

    // Playoffs
    const playoffText = row.find('[data-stat="playoff_result"]').text().trim() || '';

    // Coach — prefer full name from link title attribute
    const coachCell = row.find('[data-stat="coaches"], [data-stat="coach"]');
    const coachLink = coachCell.find('a');
    const coach = (coachLink.length > 0 ? coachLink.attr('title') : null)
                  || coachCell.text().trim() || '';

    records.push({
      year,
      wins,
      losses,
      ties,
      divisionFinish: divFinish,
      playoffs: playoffText,
      coach,
    });
  });

  return records;
}

async function main() {
  const teams = Object.entries(TEAM_PFR_MAP).sort((a, b) => a[0].localeCompare(b[0]));
  const allRecords: Record<string, SeasonRecord[]> = {};
  let totalSeasons = 0;

  console.log(`\nScraping ${teams.length} teams from Pro Football Reference...\n`);

  for (let i = 0; i < teams.length; i++) {
    const [teamId, pfrAbbr] = teams[i];
    const url = `https://www.pro-football-reference.com/teams/${pfrAbbr}/index.htm`;

    process.stdout.write(`[${String(i + 1).padStart(2)}/32] Scraping ${teamId} (${pfrAbbr})... `);

    try {
      const html = await fetchPage(url);
      const records = parseTeamPage(html);

      // Sort newest-first
      records.sort((a, b) => b.year - a.year);
      allRecords[teamId] = records;
      totalSeasons += records.length;

      console.log(`${records.length} seasons found`);
    } catch (err) {
      console.error(`FAILED — ${(err as Error).message}`);
      allRecords[teamId] = [];
    }

    // Delay between requests (skip delay after last team)
    if (i < teams.length - 1) {
      const delay = randomDelay();
      await sleep(delay);
    }
  }

  console.log(`\nTotal: ${totalSeasons} season records across ${teams.length} teams`);

  // Generate output file
  const outputPath = path.join(__dirname, '..', 'data', 'teamRecordsByYear.ts');

  let output = `// Auto-generated by scripts/scrape-pfr-records.ts
// Source: Pro Football Reference
// Generated: ${new Date().toISOString().split('T')[0]}

export interface SeasonRecord {
  year: number;
  wins: number;
  losses: number;
  ties: number;
  divisionFinish: string;
  playoffs: string;
  coach: string;
}

export const teamRecordsByYear: Record<string, SeasonRecord[]> = {\n`;

  const sortedTeamIds = Object.keys(allRecords).sort();
  for (const teamId of sortedTeamIds) {
    const records = allRecords[teamId];
    output += `  '${teamId}': [\n`;
    for (const r of records) {
      const divFinishStr = r.divisionFinish.replace(/'/g, "\\'");
      const playoffsStr = r.playoffs.replace(/'/g, "\\'");
      const coachStr = r.coach.replace(/'/g, "\\'");
      output += `    { year: ${r.year}, wins: ${r.wins}, losses: ${r.losses}, ties: ${r.ties}, divisionFinish: '${divFinishStr}', playoffs: '${playoffsStr}', coach: '${coachStr}' },\n`;
    }
    output += `  ],\n`;
  }

  output += `};\n`;

  fs.writeFileSync(outputPath, output, 'utf-8');
  console.log(`\nWritten to ${outputPath}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
