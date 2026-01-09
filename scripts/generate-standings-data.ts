/**
 * Script to generate static standings and tiebreaker data for 2025 season
 * Run with: npx tsx scripts/generate-standings-data.ts
 */

async function generateStandingsData() {
  try {
    console.log('Fetching standings data from API...');

    // Fetch from the local API
    const response = await fetch('http://localhost:3000/nfl/teams/api/standings');

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();

    console.log(`✓ Fetched standings for ${data.standings.length} teams`);

    // Write to static JSON file
    const fs = await import('fs');
    const path = await import('path');

    const dataDir = path.join(process.cwd(), 'data');
    const filePath = path.join(dataDir, 'standings-2025.json');

    // Ensure data directory exists
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Write the data
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

    console.log(`✓ Standings data written to ${filePath}`);
    console.log('\nData includes:');
    console.log(`  - ${data.standings.length} teams`);
    console.log(`  - Complete tiebreaker data (head-to-head, common games, strength of victory)`);
    console.log(`  - Division and conference records`);
    console.log(`  - Playoff picture`);

  } catch (error) {
    console.error('Error generating standings data:', error);
    process.exit(1);
  }
}

// Run the script
generateStandingsData();
