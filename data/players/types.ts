export interface PlayerData {
  id: string;
  name: string;
  team: string;
  position: string;
  number: string;
  ppg: string; // Points per game
  apg: string; // Assists per game
  rpg: string; // Rebounds per game
  imageUrl: string;
  era: 'current' | 'alltime'; // Current players or all-time (includes legends)
  height?: string; // Height in feet-inches (e.g., "6-6")
  weight?: string; // Weight in pounds (e.g., "215")
}
