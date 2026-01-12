'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import NFLTeamsSidebar from '@/components/NFLTeamsSidebar';
import { getAllTeams } from '@/data/teams';

interface Player {
  id: string;
  name: string;
  position: string;
  team: string;
  teamId: string;
  age?: number;
  impactGrade?: number;
  headshotUrl?: string;
}

interface RankedPlayer {
  rank: number;
  player: Player;
}

// Position groups for filtering
const POSITION_GROUPS: Record<string, string[]> = {
  'All': [],
  'QB': ['QB'],
  'RB': ['RB', 'FB'],
  'WR': ['WR'],
  'TE': ['TE'],
  'OL': ['OT', 'OG', 'C', 'G', 'T'],
  'DL': ['DT', 'DE', 'NT', 'EDGE'],
  'LB': ['LB', 'ILB', 'OLB', 'MLB'],
  'DB': ['CB', 'S', 'FS', 'SS'],
  'K/P': ['K', 'P'],
};

// Top 100 NFL Players (2024-2025 Season - curated list)
const TOP_100_PLAYERS: Player[] = [
  // Quarterbacks
  { id: 'patrick-mahomes', name: 'Patrick Mahomes', position: 'QB', team: 'Kansas City Chiefs', teamId: 'kansas-city-chiefs' },
  { id: 'josh-allen', name: 'Josh Allen', position: 'QB', team: 'Buffalo Bills', teamId: 'buffalo-bills' },
  { id: 'lamar-jackson', name: 'Lamar Jackson', position: 'QB', team: 'Baltimore Ravens', teamId: 'baltimore-ravens' },
  { id: 'joe-burrow', name: 'Joe Burrow', position: 'QB', team: 'Cincinnati Bengals', teamId: 'cincinnati-bengals' },
  { id: 'jalen-hurts', name: 'Jalen Hurts', position: 'QB', team: 'Philadelphia Eagles', teamId: 'philadelphia-eagles' },
  { id: 'cj-stroud', name: 'C.J. Stroud', position: 'QB', team: 'Houston Texans', teamId: 'houston-texans' },
  { id: 'dak-prescott', name: 'Dak Prescott', position: 'QB', team: 'Dallas Cowboys', teamId: 'dallas-cowboys' },
  { id: 'tua-tagovailoa', name: 'Tua Tagovailoa', position: 'QB', team: 'Miami Dolphins', teamId: 'miami-dolphins' },
  { id: 'brock-purdy', name: 'Brock Purdy', position: 'QB', team: 'San Francisco 49ers', teamId: 'san-francisco-49ers' },
  { id: 'jordan-love', name: 'Jordan Love', position: 'QB', team: 'Green Bay Packers', teamId: 'green-bay-packers' },

  // Running Backs
  { id: 'christian-mccaffrey', name: 'Christian McCaffrey', position: 'RB', team: 'San Francisco 49ers', teamId: 'san-francisco-49ers' },
  { id: 'derrick-henry', name: 'Derrick Henry', position: 'RB', team: 'Baltimore Ravens', teamId: 'baltimore-ravens' },
  { id: 'saquon-barkley', name: 'Saquon Barkley', position: 'RB', team: 'Philadelphia Eagles', teamId: 'philadelphia-eagles' },
  { id: 'breece-hall', name: 'Breece Hall', position: 'RB', team: 'New York Jets', teamId: 'new-york-jets' },
  { id: 'jonathan-taylor', name: 'Jonathan Taylor', position: 'RB', team: 'Indianapolis Colts', teamId: 'indianapolis-colts' },
  { id: 'travis-etienne', name: 'Travis Etienne Jr.', position: 'RB', team: 'Jacksonville Jaguars', teamId: 'jacksonville-jaguars' },
  { id: 'nick-chubb', name: 'Nick Chubb', position: 'RB', team: 'Cleveland Browns', teamId: 'cleveland-browns' },
  { id: 'josh-jacobs', name: 'Josh Jacobs', position: 'RB', team: 'Green Bay Packers', teamId: 'green-bay-packers' },
  { id: 'bijan-robinson', name: 'Bijan Robinson', position: 'RB', team: 'Atlanta Falcons', teamId: 'atlanta-falcons' },
  { id: 'jahmyr-gibbs', name: 'Jahmyr Gibbs', position: 'RB', team: 'Detroit Lions', teamId: 'detroit-lions' },

  // Wide Receivers
  { id: 'tyreek-hill', name: 'Tyreek Hill', position: 'WR', team: 'Miami Dolphins', teamId: 'miami-dolphins' },
  { id: 'justin-jefferson', name: 'Justin Jefferson', position: 'WR', team: 'Minnesota Vikings', teamId: 'minnesota-vikings' },
  { id: 'ja-marr-chase', name: "Ja'Marr Chase", position: 'WR', team: 'Cincinnati Bengals', teamId: 'cincinnati-bengals' },
  { id: 'ceedee-lamb', name: 'CeeDee Lamb', position: 'WR', team: 'Dallas Cowboys', teamId: 'dallas-cowboys' },
  { id: 'davante-adams', name: 'Davante Adams', position: 'WR', team: 'New York Jets', teamId: 'new-york-jets' },
  { id: 'aj-brown', name: 'A.J. Brown', position: 'WR', team: 'Philadelphia Eagles', teamId: 'philadelphia-eagles' },
  { id: 'amon-ra-st-brown', name: 'Amon-Ra St. Brown', position: 'WR', team: 'Detroit Lions', teamId: 'detroit-lions' },
  { id: 'deebo-samuel', name: 'Deebo Samuel', position: 'WR', team: 'San Francisco 49ers', teamId: 'san-francisco-49ers' },
  { id: 'stefon-diggs', name: 'Stefon Diggs', position: 'WR', team: 'Houston Texans', teamId: 'houston-texans' },
  { id: 'nico-collins', name: 'Nico Collins', position: 'WR', team: 'Houston Texans', teamId: 'houston-texans' },
  { id: 'garrett-wilson', name: 'Garrett Wilson', position: 'WR', team: 'New York Jets', teamId: 'new-york-jets' },
  { id: 'dk-metcalf', name: 'DK Metcalf', position: 'WR', team: 'Seattle Seahawks', teamId: 'seattle-seahawks' },
  { id: 'chris-olave', name: 'Chris Olave', position: 'WR', team: 'New Orleans Saints', teamId: 'new-orleans-saints' },
  { id: 'mike-evans', name: 'Mike Evans', position: 'WR', team: 'Tampa Bay Buccaneers', teamId: 'tampa-bay-buccaneers' },
  { id: 'puka-nacua', name: 'Puka Nacua', position: 'WR', team: 'Los Angeles Rams', teamId: 'los-angeles-rams' },

  // Tight Ends
  { id: 'travis-kelce', name: 'Travis Kelce', position: 'TE', team: 'Kansas City Chiefs', teamId: 'kansas-city-chiefs' },
  { id: 'tj-hockenson', name: 'T.J. Hockenson', position: 'TE', team: 'Minnesota Vikings', teamId: 'minnesota-vikings' },
  { id: 'george-kittle', name: 'George Kittle', position: 'TE', team: 'San Francisco 49ers', teamId: 'san-francisco-49ers' },
  { id: 'mark-andrews', name: 'Mark Andrews', position: 'TE', team: 'Baltimore Ravens', teamId: 'baltimore-ravens' },
  { id: 'sam-laporta', name: 'Sam LaPorta', position: 'TE', team: 'Detroit Lions', teamId: 'detroit-lions' },
  { id: 'dallas-goedert', name: 'Dallas Goedert', position: 'TE', team: 'Philadelphia Eagles', teamId: 'philadelphia-eagles' },
  { id: 'evan-engram', name: 'Evan Engram', position: 'TE', team: 'Jacksonville Jaguars', teamId: 'jacksonville-jaguars' },

  // Offensive Linemen
  { id: 'trent-williams', name: 'Trent Williams', position: 'OT', team: 'San Francisco 49ers', teamId: 'san-francisco-49ers' },
  { id: 'penei-sewell', name: 'Penei Sewell', position: 'OT', team: 'Detroit Lions', teamId: 'detroit-lions' },
  { id: 'tristan-wirfs', name: 'Tristan Wirfs', position: 'OT', team: 'Tampa Bay Buccaneers', teamId: 'tampa-bay-buccaneers' },
  { id: 'lane-johnson', name: 'Lane Johnson', position: 'OT', team: 'Philadelphia Eagles', teamId: 'philadelphia-eagles' },
  { id: 'laremy-tunsil', name: 'Laremy Tunsil', position: 'OT', team: 'Houston Texans', teamId: 'houston-texans' },
  { id: 'rashawn-slater', name: 'Rashawn Slater', position: 'OT', team: 'Los Angeles Chargers', teamId: 'los-angeles-chargers' },
  { id: 'zack-martin', name: 'Zack Martin', position: 'OG', team: 'Dallas Cowboys', teamId: 'dallas-cowboys' },
  { id: 'quenton-nelson', name: 'Quenton Nelson', position: 'OG', team: 'Indianapolis Colts', teamId: 'indianapolis-colts' },
  { id: 'chris-lindstrom', name: 'Chris Lindstrom', position: 'OG', team: 'Atlanta Falcons', teamId: 'atlanta-falcons' },
  { id: 'joel-bitonio', name: 'Joel Bitonio', position: 'OG', team: 'Cleveland Browns', teamId: 'cleveland-browns' },
  { id: 'tyler-linderbaum', name: 'Tyler Linderbaum', position: 'C', team: 'Baltimore Ravens', teamId: 'baltimore-ravens' },
  { id: 'creed-humphrey', name: 'Creed Humphrey', position: 'C', team: 'Kansas City Chiefs', teamId: 'kansas-city-chiefs' },
  { id: 'frank-ragnow', name: 'Frank Ragnow', position: 'C', team: 'Detroit Lions', teamId: 'detroit-lions' },

  // Defensive Linemen
  { id: 'myles-garrett', name: 'Myles Garrett', position: 'DE', team: 'Cleveland Browns', teamId: 'cleveland-browns' },
  { id: 'micah-parsons', name: 'Micah Parsons', position: 'EDGE', team: 'Dallas Cowboys', teamId: 'dallas-cowboys' },
  { id: 'tj-watt', name: 'T.J. Watt', position: 'EDGE', team: 'Pittsburgh Steelers', teamId: 'pittsburgh-steelers' },
  { id: 'nick-bosa', name: 'Nick Bosa', position: 'DE', team: 'San Francisco 49ers', teamId: 'san-francisco-49ers' },
  { id: 'maxx-crosby', name: 'Maxx Crosby', position: 'DE', team: 'Las Vegas Raiders', teamId: 'las-vegas-raiders' },
  { id: 'chris-jones', name: 'Chris Jones', position: 'DT', team: 'Kansas City Chiefs', teamId: 'kansas-city-chiefs' },
  { id: 'cameron-heyward', name: 'Cameron Heyward', position: 'DT', team: 'Pittsburgh Steelers', teamId: 'pittsburgh-steelers' },
  { id: 'quinnen-williams', name: 'Quinnen Williams', position: 'DT', team: 'New York Jets', teamId: 'new-york-jets' },
  { id: 'dexter-lawrence', name: 'Dexter Lawrence', position: 'DT', team: 'New York Giants', teamId: 'new-york-giants' },
  { id: 'cameron-jordan', name: 'Cameron Jordan', position: 'DE', team: 'New Orleans Saints', teamId: 'new-orleans-saints' },
  { id: 'aidan-hutchinson', name: 'Aidan Hutchinson', position: 'DE', team: 'Detroit Lions', teamId: 'detroit-lions' },
  { id: 'trey-hendrickson', name: 'Trey Hendrickson', position: 'DE', team: 'Cincinnati Bengals', teamId: 'cincinnati-bengals' },
  { id: 'brian-burns', name: 'Brian Burns', position: 'DE', team: 'New York Giants', teamId: 'new-york-giants' },
  { id: 'danielle-hunter', name: 'Danielle Hunter', position: 'DE', team: 'Houston Texans', teamId: 'houston-texans' },
  { id: 'will-anderson-jr', name: 'Will Anderson Jr.', position: 'EDGE', team: 'Houston Texans', teamId: 'houston-texans' },

  // Linebackers
  { id: 'fred-warner', name: 'Fred Warner', position: 'LB', team: 'San Francisco 49ers', teamId: 'san-francisco-49ers' },
  { id: 'roquan-smith', name: 'Roquan Smith', position: 'LB', team: 'Baltimore Ravens', teamId: 'baltimore-ravens' },
  { id: 'lavonte-david', name: 'Lavonte David', position: 'LB', team: 'Tampa Bay Buccaneers', teamId: 'tampa-bay-buccaneers' },
  { id: 'demario-davis', name: 'Demario Davis', position: 'LB', team: 'New Orleans Saints', teamId: 'new-orleans-saints' },
  { id: 'bobby-okereke', name: 'Bobby Okereke', position: 'LB', team: 'New York Giants', teamId: 'new-york-giants' },
  { id: 'tremaine-edmunds', name: 'Tremaine Edmunds', position: 'LB', team: 'Chicago Bears', teamId: 'chicago-bears' },
  { id: 'alex-highsmith', name: 'Alex Highsmith', position: 'LB', team: 'Pittsburgh Steelers', teamId: 'pittsburgh-steelers' },
  { id: 'foyesade-oluokun', name: 'Foyesade Oluokun', position: 'LB', team: 'Jacksonville Jaguars', teamId: 'jacksonville-jaguars' },

  // Cornerbacks
  { id: 'sauce-gardner', name: 'Sauce Gardner', position: 'CB', team: 'New York Jets', teamId: 'new-york-jets' },
  { id: 'derek-stingley-jr', name: 'Derek Stingley Jr.', position: 'CB', team: 'Houston Texans', teamId: 'houston-texans' },
  { id: 'pat-surtain-ii', name: 'Pat Surtain II', position: 'CB', team: 'Denver Broncos', teamId: 'denver-broncos' },
  { id: 'jaire-alexander', name: 'Jaire Alexander', position: 'CB', team: 'Green Bay Packers', teamId: 'green-bay-packers' },
  { id: 'devon-witherspoon', name: 'Devon Witherspoon', position: 'CB', team: 'Seattle Seahawks', teamId: 'seattle-seahawks' },
  { id: 'denzel-ward', name: 'Denzel Ward', position: 'CB', team: 'Cleveland Browns', teamId: 'cleveland-browns' },
  { id: 'marlon-humphrey', name: 'Marlon Humphrey', position: 'CB', team: 'Baltimore Ravens', teamId: 'baltimore-ravens' },
  { id: 'jaylon-johnson', name: 'Jaylon Johnson', position: 'CB', team: 'Chicago Bears', teamId: 'chicago-bears' },
  { id: 'marshon-lattimore', name: 'Marshon Lattimore', position: 'CB', team: 'Washington Commanders', teamId: 'washington-commanders' },
  { id: 'trevon-diggs', name: 'Trevon Diggs', position: 'CB', team: 'Dallas Cowboys', teamId: 'dallas-cowboys' },

  // Safeties
  { id: 'jessie-bates-iii', name: 'Jessie Bates III', position: 'S', team: 'Atlanta Falcons', teamId: 'atlanta-falcons' },
  { id: 'minkah-fitzpatrick', name: 'Minkah Fitzpatrick', position: 'S', team: 'Pittsburgh Steelers', teamId: 'pittsburgh-steelers' },
  { id: 'antoine-winfield-jr', name: 'Antoine Winfield Jr.', position: 'S', team: 'Tampa Bay Buccaneers', teamId: 'tampa-bay-buccaneers' },
  { id: 'kyle-hamilton', name: 'Kyle Hamilton', position: 'S', team: 'Baltimore Ravens', teamId: 'baltimore-ravens' },
  { id: 'derwin-james', name: 'Derwin James', position: 'S', team: 'Los Angeles Chargers', teamId: 'los-angeles-chargers' },
  { id: 'brian-branch', name: 'Brian Branch', position: 'S', team: 'Detroit Lions', teamId: 'detroit-lions' },
  { id: 'budda-baker', name: 'Budda Baker', position: 'S', team: 'Arizona Cardinals', teamId: 'arizona-cardinals' },
  { id: 'talanoa-hufanga', name: 'Talanoa Hufanga', position: 'S', team: 'San Francisco 49ers', teamId: 'san-francisco-49ers' },

  // Kickers/Punters
  { id: 'justin-tucker', name: 'Justin Tucker', position: 'K', team: 'Baltimore Ravens', teamId: 'baltimore-ravens' },
  { id: 'harrison-butker', name: 'Harrison Butker', position: 'K', team: 'Kansas City Chiefs', teamId: 'kansas-city-chiefs' },
  { id: 'evan-mcpherson', name: 'Evan McPherson', position: 'K', team: 'Cincinnati Bengals', teamId: 'cincinnati-bengals' },
  { id: 'jake-moody', name: 'Jake Moody', position: 'K', team: 'San Francisco 49ers', teamId: 'san-francisco-49ers' },
];

// PFSN Logo
const PFSN_LOGO_DATA_URL = 'data:image/png;base64,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';

// Get position badge color
const getPositionColor = (position: string) => {
  const pos = position.toUpperCase();
  if (pos === 'QB') return 'bg-purple-100 text-purple-700 border-purple-200';
  if (pos === 'RB' || pos === 'FB') return 'bg-green-100 text-green-700 border-green-200';
  if (pos === 'WR' || pos === 'TE') return 'bg-blue-100 text-blue-700 border-blue-200';
  if (['OT', 'OG', 'C', 'G', 'T'].includes(pos)) return 'bg-amber-100 text-amber-700 border-amber-200';
  if (['DE', 'DT', 'NT', 'EDGE'].includes(pos)) return 'bg-red-100 text-red-700 border-red-200';
  if (['LB', 'ILB', 'OLB', 'MLB'].includes(pos)) return 'bg-orange-100 text-orange-700 border-orange-200';
  if (['CB', 'S', 'FS', 'SS'].includes(pos)) return 'bg-cyan-100 text-cyan-700 border-cyan-200';
  if (pos === 'K' || pos === 'P') return 'bg-pink-100 text-pink-700 border-pink-200';
  return 'bg-gray-100 text-gray-700 border-gray-200';
};

export default function PlayerRankingsClient() {
  const allTeams = getAllTeams();

  // Create team lookup map
  const teamsById = useMemo(() => {
    const map: Record<string, typeof allTeams[0]> = {};
    allTeams.forEach(team => {
      map[team.id] = team;
    });
    return map;
  }, [allTeams]);

  // State
  const [rankings, setRankings] = useState<RankedPlayer[]>([]);
  const [initialTop100, setInitialTop100] = useState<Player[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([]);
  const [selectedPosition, setSelectedPosition] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [rankInput, setRankInput] = useState('');
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [history, setHistory] = useState<RankedPlayer[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [showAddPlayerDialog, setShowAddPlayerDialog] = useState(false);
  const [addPlayerSearch, setAddPlayerSearch] = useState('');
  const [allNFLPlayers, setAllNFLPlayers] = useState<Player[]>([]);
  const [loadingPlayers, setLoadingPlayers] = useState(false);
  const [playersLoaded, setPlayersLoaded] = useState(false);
  const downloadMenuRef = useRef<HTMLDivElement>(null);

  // Logo states for canvas rendering
  const [logoImages, setLogoImages] = useState<Record<string, HTMLImageElement>>({});
  const [logosLoaded, setLogosLoaded] = useState(false);
  const [pfsnLogoImage, setPfsnLogoImage] = useState<HTMLImageElement | null>(null);

  // Save/Load state
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [savedRankings, setSavedRankings] = useState<Array<{ name: string; date: string; rankings: RankedPlayer[] }>>([]);
  const [saveNameInput, setSaveNameInput] = useState('');

  // Helper function to save to history
  const saveToHistory = (newRankings: RankedPlayer[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newRankings);
    if (newHistory.length > 50) {
      newHistory.shift();
    } else {
      setHistoryIndex(historyIndex + 1);
    }
    setHistory(newHistory);
    setRankings(newRankings);
  };

  // Undo/Redo
  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setRankings(history[historyIndex - 1]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setRankings(history[historyIndex + 1]);
    }
  };

  // Save/Load functionality
  const saveRankingsToLocalStorage = () => {
    if (!saveNameInput.trim()) {
      alert('Please enter a name for your rankings');
      return;
    }

    const saved = {
      name: saveNameInput.trim(),
      date: new Date().toISOString(),
      rankings: rankings
    };

    const existing = localStorage.getItem('nfl-player-rankings');
    const allSaved = existing ? JSON.parse(existing) : [];
    allSaved.push(saved);

    if (allSaved.length > 10) {
      allSaved.shift();
    }

    localStorage.setItem('nfl-player-rankings', JSON.stringify(allSaved));
    setSaveNameInput('');
    setShowSaveDialog(false);
    loadSavedRankings();
    alert('Rankings saved successfully!');
  };

  const loadSavedRankings = () => {
    const saved = localStorage.getItem('nfl-player-rankings');
    if (saved) {
      setSavedRankings(JSON.parse(saved));
    }
  };

  const loadRankings = (savedRanking: { name: string; date: string; rankings: RankedPlayer[] }) => {
    setRankings(savedRanking.rankings);
    setHistory([savedRanking.rankings]);
    setHistoryIndex(0);
    setShowLoadDialog(false);
  };

  const deleteSavedRanking = (index: number) => {
    const saved = localStorage.getItem('nfl-player-rankings');
    if (saved) {
      const allSaved = JSON.parse(saved);
      allSaved.splice(index, 1);
      localStorage.setItem('nfl-player-rankings', JSON.stringify(allSaved));
      loadSavedRankings();
    }
  };

  // Load saved rankings on mount
  useEffect(() => {
    loadSavedRankings();
  }, []);

  // Load initial top 100 players from API
  useEffect(() => {
    const fetchInitialRankings = async () => {
      try {
        const response = await fetch('/nfl-hq/api/nfl/all-players');
        if (response.ok) {
          const data = await response.json();
          const top100 = data.top100 || [];
          setInitialTop100(top100);
          setAllNFLPlayers(data.players || []);
          setPlayersLoaded(true);

          // Set initial rankings from top 100
          const initialRankings = top100.map((player: Player, index: number) => ({
            rank: index + 1,
            player
          }));
          setRankings(initialRankings);
          setHistory([initialRankings]);
          setHistoryIndex(0);
        }
      } catch (error) {
        console.error('Error fetching initial rankings:', error);
        // Fall back to static list if API fails
        const fallbackRankings = TOP_100_PLAYERS.map((player, index) => ({
          rank: index + 1,
          player
        }));
        setRankings(fallbackRankings);
        setHistory([fallbackRankings]);
        setHistoryIndex(0);
      } finally {
        setLoadingInitial(false);
      }
    };
    fetchInitialRankings();
  }, []);

  // Pre-load team logos
  useEffect(() => {
    const preloadLogos = async () => {
      const images: Record<string, HTMLImageElement> = {};

      // Load PFSN logo
      const pfsnImg = document.createElement('img');
      await new Promise<void>((resolve) => {
        pfsnImg.onload = () => resolve();
        pfsnImg.onerror = () => resolve();
        pfsnImg.src = PFSN_LOGO_DATA_URL;
      });
      setPfsnLogoImage(pfsnImg);

      await Promise.all(
        allTeams.map(async (team) => {
          try {
            const proxyUrl = `/nfl-hq/api/proxy-image?url=${encodeURIComponent(team.logoUrl)}`;
            const response = await fetch(proxyUrl);
            if (!response.ok) throw new Error('Failed to fetch logo');

            const blob = await response.blob();
            const dataUrl = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL(blob);
            });

            const img = document.createElement('img');
            await new Promise<void>((resolve) => {
              img.onload = () => resolve();
              img.onerror = () => resolve();
              img.src = dataUrl;
            });
            images[team.id] = img;
          } catch (error) {
            console.error(`Failed to preload logo for ${team.name}:`, error);
          }
        })
      );

      setLogoImages(images);
      setLogosLoaded(true);
    };

    preloadLogos();
  }, []);

  // Fetch all NFL players when Add Player dialog is opened
  useEffect(() => {
    if (showAddPlayerDialog && !playersLoaded && !loadingPlayers) {
      const fetchAllPlayers = async () => {
        setLoadingPlayers(true);
        try {
          const response = await fetch('/nfl-hq/api/nfl/all-players');
          if (response.ok) {
            const data = await response.json();
            setAllNFLPlayers(data.players || []);
            setPlayersLoaded(true);
          }
        } catch (error) {
          console.error('Error fetching all players:', error);
        } finally {
          setLoadingPlayers(false);
        }
      };
      fetchAllPlayers();
    }
  }, [showAddPlayerDialog, playersLoaded, loadingPlayers]);

  // Filter rankings by position
  const filteredRankings = useMemo(() => {
    let filtered = rankings;

    if (selectedPosition !== 'All') {
      const positions = POSITION_GROUPS[selectedPosition] || [];
      filtered = filtered.filter(r => positions.includes(r.player.position));
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r =>
        r.player.name.toLowerCase().includes(query) ||
        r.player.team.toLowerCase().includes(query) ||
        r.player.position.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [rankings, selectedPosition, searchQuery]);

  // Available players for adding (not in rankings)
  const filteredAvailablePlayers = useMemo(() => {
    const rankedIds = new Set(rankings.map(r => r.player.id));
    // Use all NFL players from API, or fall back to TOP_100 if not loaded yet
    const playerPool = playersLoaded ? allNFLPlayers : TOP_100_PLAYERS;
    let available = playerPool.filter(p => !rankedIds.has(p.id));

    if (addPlayerSearch.trim()) {
      const query = addPlayerSearch.toLowerCase();
      available = available.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.team.toLowerCase().includes(query) ||
        p.position.toLowerCase().includes(query)
      );
    }

    // Limit results to 25 for better UX - users can search for specific players
    return available.slice(0, 25);
  }, [rankings, addPlayerSearch, allNFLPlayers, playersLoaded]);

  // Drag handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5';
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1';
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDragOverIndex(null);
      return;
    }

    const newRankings = [...rankings];
    const draggedItem = newRankings[draggedIndex];
    newRankings.splice(draggedIndex, 1);
    newRankings.splice(dropIndex, 0, draggedItem);

    const updatedRankings = newRankings.map((item, index) => ({
      ...item,
      rank: index + 1
    }));

    saveToHistory(updatedRankings);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Rank editing
  const handleRankClick = (index: number) => {
    setEditingIndex(index);
    setRankInput(String(index + 1));
  };

  const handleRankSubmit = (index: number) => {
    const rankNum = parseInt(rankInput);
    if (isNaN(rankNum) || rankNum < 1 || rankNum > rankings.length) {
      setEditingIndex(null);
      setRankInput('');
      return;
    }

    if (rankNum !== index + 1) {
      const newIndex = rankNum - 1;
      const newRankings = [...rankings];
      const item = newRankings[index];
      newRankings.splice(index, 1);
      newRankings.splice(newIndex, 0, item);

      const updatedRankings = newRankings.map((item, idx) => ({
        ...item,
        rank: idx + 1
      }));

      saveToHistory(updatedRankings);
    }

    setEditingIndex(null);
    setRankInput('');
  };

  const handleRankKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Enter') {
      handleRankSubmit(index);
    } else if (e.key === 'Escape') {
      setEditingIndex(null);
      setRankInput('');
    }
  };

  // Remove player from rankings
  const removePlayer = (index: number) => {
    const newRankings = [...rankings];
    newRankings.splice(index, 1);
    const updatedRankings = newRankings.map((item, idx) => ({
      ...item,
      rank: idx + 1
    }));
    saveToHistory(updatedRankings);
  };

  // Add player to rankings
  const addPlayer = (player: Player) => {
    const newRankings = [...rankings, { rank: rankings.length + 1, player }];
    saveToHistory(newRankings);
    setShowAddPlayerDialog(false);
    setAddPlayerSearch('');
  };

  // Generate canvas for download
  const generateCanvas = (selectedPlayers: RankedPlayer[]) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const canvasWidth = 1000;
    const dpr = 2;

    let yPos = 20;
    const headerHeight = 78;

    let gap = 20;
    const containerHeight = 64;
    let playersPerRow = 1;
    let containerWidth = canvasWidth - (gap * 2);

    if (selectedPlayers.length > 10 && selectedPlayers.length <= 25) {
      playersPerRow = 2;
      containerWidth = (canvasWidth - (gap * 3)) / 2;
    } else if (selectedPlayers.length > 25) {
      playersPerRow = 4;
      gap = 12;
      containerWidth = (canvasWidth - (gap * 5)) / 4;
    }

    const totalRows = Math.ceil(selectedPlayers.length / playersPerRow);
    const playersContentHeight = totalRows * containerHeight + (totalRows - 1) * gap;
    const footerHeight = 64;
    const bottomPadding = 30;
    const canvasHeight = yPos + headerHeight + playersContentHeight + bottomPadding + footerHeight;

    canvas.width = canvasWidth * dpr;
    canvas.height = canvasHeight * dpr;
    ctx.scale(dpr, dpr);

    // Background
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Header
    ctx.fillStyle = '#ffffff';
    ctx.font = 'italic 900 38px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    const headerText = 'MY NFL PLAYER RANKINGS';
    const headerWidth = ctx.measureText(headerText).width;
    ctx.fillText(headerText, (canvasWidth - headerWidth) / 2, yPos + 38);
    yPos += headerHeight;

    // Draw players
    selectedPlayers.forEach((rankedPlayer, i) => {
      const totalRows = Math.ceil(selectedPlayers.length / playersPerRow);
      const col = Math.floor(i / totalRows);
      const row = i % totalRows;

      let xPos = gap + (col * (containerWidth + gap));
      if (playersPerRow === 1) {
        xPos = (canvasWidth - containerWidth) / 2;
      }

      const playerYPos = yPos + (row * (containerHeight + gap));

      // White card background
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(xPos, playerYPos, containerWidth, containerHeight, 12);
      ctx.fill();

      // Rank number
      const paddingX = 20;
      const containerCenterY = playerYPos + containerHeight / 2;
      ctx.fillStyle = '#000000';
      ctx.font = 'italic 900 28px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      const rankTextY = containerCenterY + 10;
      ctx.fillText(String(rankedPlayer.rank), xPos + paddingX, rankTextY);

      const rankWidth = ctx.measureText(String(rankedPlayer.rank)).width;

      // Player name and position
      ctx.fillStyle = '#000000';
      const baseFontSize = selectedPlayers.length > 25 ? 14 : (selectedPlayers.length > 10 ? 16 : 20);

      // Calculate available width for name (container - padding - rank - gap - logo - logo padding)
      const logoSize = 48;
      const availableWidth = containerWidth - paddingX - rankWidth - 20 - logoSize - 20;

      // Measure name and reduce font size if needed
      let fontSize = baseFontSize;
      const playerName = rankedPlayer.player.name;
      ctx.font = `600 ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;

      while (ctx.measureText(playerName).width > availableWidth && fontSize > 10) {
        fontSize -= 1;
        ctx.font = `600 ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
      }

      const nameY = containerCenterY + (fontSize * 0.35);
      ctx.fillText(playerName, xPos + paddingX + rankWidth + 20, nameY);

      // Team logo
      const team = teamsById[rankedPlayer.player.teamId];
      const img = team ? logoImages[team.id] : null;
      if (img) {
        const logoSize = 48;
        const logoX = xPos + containerWidth - logoSize - 12;
        const logoY = playerYPos + (containerHeight - logoSize) / 2;
        ctx.drawImage(img, logoX, logoY, logoSize, logoSize);
      }
    });

    // Footer
    const footerY = canvasHeight - 64;
    ctx.fillStyle = '#0050A0';
    ctx.fillRect(0, footerY, canvasWidth, 64);

    const footerPadding = 30;
    ctx.fillStyle = '#ffffff';
    ctx.font = '600 16px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillText('https://www.profootballnetwork.com/nfl-hq/player-rankings-builder', footerPadding, footerY + 38);

    if (pfsnLogoImage) {
      const logoSize = 44;
      const logoX = canvasWidth - footerPadding - logoSize;
      const logoY = footerY + (64 - logoSize) / 2;
      ctx.drawImage(pfsnLogoImage, logoX, logoY, logoSize, logoSize);
    }

    return canvas;
  };

  const handleDownload = async (count: 10 | 25 | 50) => {
    if (!logosLoaded) {
      alert('Logos are still loading. Please wait a moment and try again.');
      return;
    }

    setShowDownloadMenu(false);
    setIsDownloading(true);

    try {
      const selectedPlayers = rankings.slice(0, count);
      const canvas = generateCanvas(selectedPlayers);

      if (!canvas) {
        throw new Error('Failed to generate canvas');
      }

      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

      if (isMobile) {
        canvas.toBlob(async (blob) => {
          if (!blob) {
            throw new Error('Failed to create image blob');
          }

          const fileName = `NFL_Player_Rankings_${Date.now()}.png`;

          if (navigator.share && navigator.canShare) {
            const file = new File([blob], fileName, { type: 'image/png' });

            if (navigator.canShare({ files: [file] })) {
              try {
                await navigator.share({
                  files: [file],
                  title: 'My NFL Player Rankings',
                  text: 'Check out my NFL Player Rankings!'
                });
                setIsDownloading(false);
                return;
              } catch (err) {
                console.log('Share cancelled or failed:', err);
              }
            }
          }

          const url = URL.createObjectURL(blob);
          const newWindow = window.open(url, '_blank');

          if (newWindow) {
            setTimeout(() => URL.revokeObjectURL(url), 100);
          } else {
            const link = document.createElement('a');
            link.download = fileName;
            link.href = url;
            link.click();
            URL.revokeObjectURL(url);
          }

          setIsDownloading(false);
        }, 'image/png', 1.0);
      } else {
        const link = document.createElement('a');
        link.download = `NFL_Player_Rankings_${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png', 1.0);
        link.click();
        setIsDownloading(false);
      }
    } catch (error) {
      console.error('Error generating image:', error);
      alert('Failed to generate image. Please try again.');
      setIsDownloading(false);
    }
  };

  const resetRankings = () => {
    // Use initialTop100 from API, or fall back to static list
    const sourceList = initialTop100.length > 0 ? initialTop100 : TOP_100_PLAYERS;
    const newRankings = sourceList.map((player, index) => ({
      rank: index + 1,
      player
    }));
    saveToHistory(newRankings);
    setShowResetDialog(false);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        redo();
      }
      if (e.key === 'Escape') {
        setShowDownloadMenu(false);
        setShowAddPlayerDialog(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [historyIndex, history]);

  // Close download menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(event.target as Node)) {
        setShowDownloadMenu(false);
      }
    };

    if (showDownloadMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDownloadMenu]);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <div className="fixed top-0 left-0 w-64 h-screen z-10">
          <NFLTeamsSidebar />
        </div>
      </div>

      {/* Mobile sidebar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-20">
        <NFLTeamsSidebar isMobile={true} />
      </div>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 min-w-0">
        {/* Header */}
        <div className="bg-[#0050A0] text-white pt-[57px] lg:pt-0 pb-4 lg:pb-6">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-4 lg:pt-10">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-3">
              NFL Player Rankings Builder
            </h1>
            <p className="text-base sm:text-lg lg:text-xl xl:text-2xl opacity-90">
              Create your own custom NFL player rankings
            </p>
          </div>
        </div>

        {/* Raptive Header Ad */}
        <div className="container mx-auto px-4 min-h-[150px]">
          <div className="raptive-pfn-header"></div>
        </div>

        {/* Content */}
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl">
          {loadingInitial ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <svg className="animate-spin w-12 h-12 mx-auto text-[#0050A0] mb-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-gray-600 text-lg">Loading top 100 players by PFSN Impact Grade...</p>
            </div>
          ) : (
          <>
          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-900">
              <strong>How to use:</strong> Drag and drop players to reorder, click the rank number to move to a specific position, or use the X button to remove players. Use filters to view by position.
            </p>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              {/* Position Filter Buttons */}
              <div className="flex flex-wrap gap-2">
                {Object.keys(POSITION_GROUPS).map(group => (
                  <button
                    key={group}
                    onClick={() => setSelectedPosition(group)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                      selectedPosition === group
                        ? 'bg-[#0050A0] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {group}
                  </button>
                ))}
              </div>

              {/* Search */}
              <div className="relative w-full lg:w-64">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search Player"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0050A0] bg-white text-sm"
                />
              </div>
            </div>
          </div>

          {/* Rankings Table */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {/* Table Header with Actions */}
            <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex flex-wrap gap-3 justify-between items-center">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-gray-900">Player Rankings</h2>
                <span className="text-sm text-gray-500">({filteredRankings.length} players)</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={undo}
                  disabled={historyIndex <= 0}
                  className="px-3 py-1.5 text-sm bg-gray-200 hover:bg-gray-300 disabled:bg-gray-200 disabled:text-gray-600 text-gray-700 rounded-lg transition-colors font-medium flex items-center gap-1.5"
                  title="Undo (Ctrl/Cmd+Z)"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                  </svg>
                  Undo
                </button>
                <button
                  onClick={redo}
                  disabled={historyIndex >= history.length - 1}
                  className="px-3 py-1.5 text-sm bg-gray-200 hover:bg-gray-300 disabled:bg-gray-200 disabled:text-gray-600 text-gray-700 rounded-lg transition-colors font-medium flex items-center gap-1.5"
                  title="Redo (Ctrl/Cmd+Shift+Z)"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
                  </svg>
                  Redo
                </button>
                <button
                  onClick={() => setShowAddPlayerDialog(true)}
                  className="px-3 py-1.5 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium flex items-center gap-1.5"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Player
                </button>
                <button
                  onClick={() => setShowResetDialog(true)}
                  className="px-3 py-1.5 text-sm bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium"
                >
                  Reset
                </button>

                {/* Save/Load */}
                <button
                  onClick={() => setShowSaveDialog(true)}
                  className="px-3 py-1.5 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium flex items-center gap-1.5"
                  title="Save Rankings"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  Save
                </button>

                <button
                  onClick={() => setShowLoadDialog(true)}
                  disabled={savedRankings.length === 0}
                  className="px-3 py-1.5 text-sm bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg transition-colors font-medium flex items-center gap-1.5"
                  title="Load Rankings"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Load
                </button>

                {/* Download Dropdown */}
                <div className="relative" ref={downloadMenuRef}>
                  <button
                    onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                    disabled={isDownloading}
                    className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors font-medium flex items-center gap-1.5"
                  >
                    {isDownloading ? (
                      <>
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Generating...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download Image
                      </>
                    )}
                  </button>

                  {showDownloadMenu && !isDownloading && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                      <div className="py-2">
                        <button
                          onClick={() => handleDownload(10)}
                          className="w-full px-4 py-2 text-left hover:bg-gray-50 text-gray-700 transition-colors"
                        >
                          <span className="font-medium">Top 10 Players</span>
                        </button>
                        <button
                          onClick={() => handleDownload(25)}
                          className="w-full px-4 py-2 text-left hover:bg-gray-50 text-gray-700 transition-colors"
                        >
                          <span className="font-medium">Top 25 Players</span>
                        </button>
                        <button
                          onClick={() => handleDownload(50)}
                          className="w-full px-4 py-2 text-left hover:bg-gray-50 text-gray-700 transition-colors"
                        >
                          <span className="font-medium">Top 50 Players</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#0050A0] text-white">
                  <tr>
                    <th className="pl-3 sm:pl-6 pr-2 sm:pr-4 py-3 text-left text-xs sm:text-sm font-bold w-16 sm:w-20">Rank</th>
                    <th className="px-2 sm:px-4 py-3 text-left text-xs sm:text-sm font-bold">Player</th>
                    <th className="hidden sm:table-cell px-3 py-3 text-center text-sm font-bold w-16">Pos</th>
                    <th className="hidden md:table-cell px-3 py-3 text-left text-sm font-bold w-44">Team</th>
                    <th className="hidden lg:table-cell px-3 py-3 text-center text-sm font-bold w-14">Age</th>
                    <th className="hidden lg:table-cell px-3 py-3 text-center text-sm font-bold w-24">Impact Grade</th>
                    <th className="px-3 py-3 text-center text-sm font-bold w-16">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRankings.map((rankedPlayer, index) => {
                    const team = teamsById[rankedPlayer.player.teamId];
                    return (
                      <tr
                        key={rankedPlayer.player.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragEnd={handleDragEnd}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, index)}
                        className={`
                          border-b border-gray-200 cursor-move transition-all duration-300 ease-in-out relative
                          ${draggedIndex === index ? 'opacity-50 scale-95' : 'scale-100'}
                          ${dragOverIndex === index ? 'bg-blue-100 shadow-lg' : 'hover:bg-gray-50'}
                          border-l-4
                        `}
                        style={{
                          borderLeftColor: team?.primaryColor || '#0050A0'
                        }}
                      >
                        {/* Rank Number (Editable) */}
                        <td className="pl-3 sm:pl-6 pr-2 sm:pr-4 py-3 sm:py-4">
                          <div className="flex items-center justify-center">
                            {editingIndex === index ? (
                              <input
                                type="number"
                                value={rankInput}
                                onChange={(e) => setRankInput(e.target.value)}
                                onBlur={() => handleRankSubmit(index)}
                                onKeyDown={(e) => handleRankKeyDown(e, index)}
                                autoFocus
                                min={1}
                                max={rankings.length}
                                className="w-14 h-10 px-2 text-center text-lg font-bold border-2 border-[#0050A0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0050A0]"
                                onClick={(e) => e.stopPropagation()}
                              />
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRankClick(index);
                                }}
                                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-blue-100 hover:ring-2 hover:ring-blue-300 cursor-pointer transition-all"
                                title="Click to edit rank"
                              >
                                <span className="text-base sm:text-lg font-bold text-gray-900">
                                  {rankedPlayer.rank}
                                </span>
                              </button>
                            )}
                          </div>
                        </td>

                        {/* Player Info */}
                        <td className="px-2 sm:px-4 py-3 sm:py-4">
                          <div className="flex items-center gap-2 sm:gap-3">
                            {/* Player Headshot */}
                            <div className="relative flex-shrink-0">
                              <img
                                src={`https://staticd.profootballnetwork.com/skm/assets/player-images/nfl/${rankedPlayer.player.id}.png?w=80`}
                                alt={rankedPlayer.player.name}
                                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover bg-gray-100"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  const fallback = target.nextElementSibling as HTMLElement;
                                  if (fallback) fallback.style.display = 'flex';
                                }}
                              />
                              <div
                                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full items-center justify-center flex-shrink-0 hidden"
                                style={{ backgroundColor: `${team?.primaryColor || '#0050A0'}20` }}
                              >
                                <span
                                  className="font-semibold text-sm"
                                  style={{ color: team?.primaryColor || '#0050A0' }}
                                >
                                  {rankedPlayer.player.name.split(' ').map(n => n[0]).join('')}
                                </span>
                              </div>
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                                {rankedPlayer.player.name}
                              </div>
                              <div className="sm:hidden text-xs text-gray-500">
                                {rankedPlayer.player.position} - {rankedPlayer.player.team}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Position */}
                        <td className="hidden sm:table-cell px-3 py-4 text-center">
                          <span className={`inline-block px-2 py-1 rounded text-xs font-semibold border ${getPositionColor(rankedPlayer.player.position)}`}>
                            {rankedPlayer.player.position}
                          </span>
                        </td>

                        {/* Team */}
                        <td className="hidden md:table-cell px-3 py-4">
                          <div className="flex items-center gap-2">
                            {team && (
                              <img
                                src={team.logoUrl}
                                alt={team.name}
                                className="w-6 h-6 object-contain flex-shrink-0"
                              />
                            )}
                            <span className="text-sm text-gray-700 truncate">{rankedPlayer.player.team}</span>
                          </div>
                        </td>

                        {/* Age */}
                        <td className="hidden lg:table-cell px-3 py-4 text-center">
                          <span className="text-sm text-gray-700">
                            {rankedPlayer.player.age || '-'}
                          </span>
                        </td>

                        {/* Impact Grade */}
                        <td className="hidden lg:table-cell px-3 py-4 text-center">
                          {rankedPlayer.player.impactGrade && rankedPlayer.player.impactGrade > 0 ? (
                            <span className="font-semibold text-blue-600">
                              {rankedPlayer.player.impactGrade.toFixed(1)}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-3 py-4 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removePlayer(index);
                            }}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Remove player"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          </>
          )}
        </div>
      </main>

      {/* Reset Confirmation Dialog */}
      {showResetDialog && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Reset Rankings?</h3>
                <p className="text-sm text-gray-600">This will restore the default player rankings.</p>
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => setShowResetDialog(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={resetRankings}
                className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors font-medium"
              >
                Reset Rankings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Player Dialog */}
      {showAddPlayerDialog && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Add Player to Rankings</h3>
              <button
                onClick={() => {
                  setShowAddPlayerDialog(false);
                  setAddPlayerSearch('');
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <input
              type="text"
              value={addPlayerSearch}
              onChange={(e) => setAddPlayerSearch(e.target.value)}
              placeholder="Search players by name, team, or position..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0050A0] mb-4"
            />
            {loadingPlayers ? (
              <div className="text-center py-8">
                <svg className="animate-spin w-8 h-8 mx-auto text-[#0050A0] mb-2" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-gray-600">Loading all NFL players...</p>
              </div>
            ) : filteredAvailablePlayers.length === 0 ? (
              <p className="text-gray-600 text-center py-8">
                {addPlayerSearch.trim() ? 'No players found matching your search.' : 'No available players to add.'}
              </p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredAvailablePlayers.map((player) => {
                  const team = teamsById[player.teamId];
                  return (
                    <div
                      key={player.id}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-blue-500 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {team && (
                          <img
                            src={team.logoUrl}
                            alt={team.name}
                            className="w-8 h-8 object-contain"
                          />
                        )}
                        <div>
                          <div className="font-semibold text-gray-900">{player.name}</div>
                          <div className="text-sm text-gray-500">
                            {player.position} - {player.team}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => addPlayer(player)}
                        className="px-3 py-1.5 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
                      >
                        Add
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Save Rankings Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Save Rankings</h3>
              <button
                onClick={() => setShowSaveDialog(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-gray-600 mb-4">
              Give your rankings a name to save them for later.
            </p>
            <input
              type="text"
              value={saveNameInput}
              onChange={(e) => setSaveNameInput(e.target.value)}
              placeholder="e.g., My NFL Player Rankings 2025"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4"
              maxLength={50}
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowSaveDialog(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={saveRankingsToLocalStorage}
                className="px-4 py-2 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors font-medium"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Load Rankings Dialog */}
      {showLoadDialog && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Load Saved Rankings</h3>
              <button
                onClick={() => setShowLoadDialog(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {savedRankings.length === 0 ? (
              <p className="text-gray-600 text-center py-8">No saved rankings yet.</p>
            ) : (
              <div className="space-y-3">
                {savedRankings.map((saved, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 hover:border-indigo-500 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{saved.name}</h4>
                        <p className="text-sm text-gray-500 mt-1">
                          {new Date(saved.date).toLocaleDateString()} at {new Date(saved.date).toLocaleTimeString()}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {saved.rankings.length} players
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => loadRankings(saved)}
                          className="px-3 py-1.5 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium"
                        >
                          Load
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this saved ranking?')) {
                              deleteSavedRanking(index);
                            }
                          }}
                          className="px-3 py-1.5 text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-end mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={() => setShowLoadDialog(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
