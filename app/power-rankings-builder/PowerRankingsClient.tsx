'use client';

import { useState, useRef, useEffect } from 'react';

import { getAllTeams, TeamData } from '@/data/teams';
import NFLTeamsSidebar from '@/components/NFLTeamsSidebar';
import { getApiPath } from '@/utils/api';

interface TeamWithRecord extends TeamData {
  liveRecord?: string;
  wins?: number;
  losses?: number;
  conferenceRank?: string;
}

interface TeamStats {
  ppg?: string;
  oppPpg?: string;
}

interface RankedTeam {
  rank: number;
  team: TeamWithRecord;
}

// Helper function to get ordinal suffix (1st, 2nd, 3rd, etc.)
const getOrdinalSuffix = (num: number): string => {
  const j = num % 10;
  const k = num % 100;
  if (j === 1 && k !== 11) return 'st';
  if (j === 2 && k !== 12) return 'nd';
  if (j === 3 && k !== 13) return 'rd';
  return 'th';
};

// NFL teams use conference names NFC and AFC

// PFSN Logo (actual white logo from NFL Power Rankings Builder)
// Source: https://staticd.profootballnetwork.com/skm/assets/pfn/pfsn-logo-white-ver-2.png
const PFSN_LOGO_DATA_URL = 'data:image/png;base64,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';

export default function PowerRankingsClient() {
  const allTeams = getAllTeams();

  // Initialize rankings with teams (will be updated with live records)
  const [rankings, setRankings] = useState<RankedTeam[]>(() => {
    const sortedTeams = [...allTeams].sort((a, b) => {
      const [aWins] = a.record.split('-').map(Number);
      const [bWins] = b.record.split('-').map(Number);
      return bWins - aWins; // Best teams first
    });

    return sortedTeams.map((team, index) => ({
      rank: index + 1,
      team: { ...team, liveRecord: team.record }
    }));
  });

  const [standingsLoaded, setStandingsLoaded] = useState(false);

  // Fetch live standings and update rankings
  useEffect(() => {
    if (standingsLoaded) return;

    async function fetchStandings() {
      try {
        const response = await fetch(getApiPath('nfl/teams/api/standings'));
        if (!response.ok) throw new Error('Failed to fetch standings');

        const data = await response.json();
        const standings = data.standings;

        // Create a map of team records
        const recordsMap: Record<string, { wins: number; losses: number; conferenceRank: string }> = {};

        if (standings) {
          for (const team of standings) {
            recordsMap[team.teamId] = {
              wins: team.record.wins || 0,
              losses: team.record.losses || 0,
              conferenceRank: team.divisionRank || '0th',
            };
          }
        }

        // Update rankings with live records and re-sort
        setRankings(prevRankings => {
          const updated = prevRankings.map(ranked => ({
            ...ranked,
            team: {
              ...ranked.team,
              wins: recordsMap[ranked.team.id]?.wins ?? 0,
              losses: recordsMap[ranked.team.id]?.losses ?? 0,
              conferenceRank: recordsMap[ranked.team.id]?.conferenceRank ?? '0th',
              liveRecord: recordsMap[ranked.team.id]
                ? `${recordsMap[ranked.team.id].wins}-${recordsMap[ranked.team.id].losses}`
                : ranked.team.record,
            }
          }));

          // Sort by wins (best first)
          const sorted = [...updated].sort((a, b) => {
            const aWins = a.team.wins ?? 0;
            const bWins = b.team.wins ?? 0;
            const aLosses = a.team.losses ?? 0;
            const bLosses = b.team.losses ?? 0;
            return bWins - aWins || aLosses - bLosses;
          });

          // Update ranks
          return sorted.map((item, index) => ({
            ...item,
            rank: index + 1
          }));
        });

        setStandingsLoaded(true);
      } catch (err) {
        console.error('Error fetching standings:', err);
        setStandingsLoaded(true);
      }
    }

    fetchStandings();
  }, [standingsLoaded]);

  // Fetch team stats for all teams
  useEffect(() => {
    async function fetchAllTeamStats() {
      try {
        const allTeams = getAllTeams();
        const statsPromises = allTeams.map(async (team) => {
          try {
            const response = await fetch(`/nfl-hq/api/nfl/team-stats/${team.id}?season=2025&event=regular`);
            if (!response.ok) return { teamId: team.id, stats: {} };

            const data = await response.json();
            const ppgOwn = data?.data?.team_stats?.points_per_game?.own || '0.0';
            const ppgOpp = data?.data?.team_stats?.points_per_game?.opponent || '0.0';

            return {
              teamId: team.id,
              stats: {
                ppg: ppgOwn,
                oppPpg: ppgOpp,
              }
            };
          } catch (error) {
            console.error(`Failed to fetch stats for ${team.id}:`, error);
            return { teamId: team.id, stats: {} };
          }
        });

        const results = await Promise.all(statsPromises);
        const statsMap: Record<string, TeamStats> = {};
        results.forEach(({ teamId, stats }) => {
          statsMap[teamId] = stats;
        });

        setTeamStats(statsMap);
      } catch (error) {
        console.error('Failed to fetch team stats:', error);
      }
    }

    fetchAllTeamStats();
  }, []);

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [rankInput, setRankInput] = useState('');
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [history, setHistory] = useState<RankedTeam[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [comparisonTeams, setComparisonTeams] = useState<number[]>([]);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [logoDataUrls, setLogoDataUrls] = useState<Record<string, string>>({});
  const [logoImages, setLogoImages] = useState<Record<string, HTMLImageElement>>({});
  const [logosLoaded, setLogosLoaded] = useState(false);
  const [pfsnLogoImage, setPfsnLogoImage] = useState<HTMLImageElement | null>(null);
  const downloadMenuRef = useRef<HTMLDivElement>(null);

  // Save/Load state
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [savedRankings, setSavedRankings] = useState<Array<{ name: string; date: string; rankings: RankedTeam[] }>>([]);
  const [saveNameInput, setSaveNameInput] = useState('');

  // Team stats state
  const [teamStats, setTeamStats] = useState<Record<string, TeamStats>>({});

  // Helper function to save to history
  const saveToHistory = (newRankings: RankedTeam[]) => {
    // Remove any future history if we're not at the end
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newRankings);

    // Keep only last 50 states to prevent memory issues
    if (newHistory.length > 50) {
      newHistory.shift();
    } else {
      setHistoryIndex(historyIndex + 1);
    }

    setHistory(newHistory);
    setRankings(newRankings);
  };

  // Undo function
  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setRankings(history[historyIndex - 1]);
    }
  };

  // Redo function
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

    const existing = localStorage.getItem('nba-power-rankings');
    const allSaved = existing ? JSON.parse(existing) : [];
    allSaved.push(saved);

    // Keep only last 10 saves
    if (allSaved.length > 10) {
      allSaved.shift();
    }

    localStorage.setItem('nba-power-rankings', JSON.stringify(allSaved));
    setSaveNameInput('');
    setShowSaveDialog(false);
    loadSavedRankings();
    alert('Rankings saved successfully!');
  };

  const loadSavedRankings = () => {
    const saved = localStorage.getItem('nba-power-rankings');
    if (saved) {
      setSavedRankings(JSON.parse(saved));
    }
  };

  const loadRankings = (savedRanking: { name: string; date: string; rankings: RankedTeam[] }) => {
    setRankings(savedRanking.rankings);
    setHistory([savedRanking.rankings]);
    setHistoryIndex(0);
    setShowLoadDialog(false);
  };

  const deleteSavedRanking = (index: number) => {
    const saved = localStorage.getItem('nba-power-rankings');
    if (saved) {
      const allSaved = JSON.parse(saved);
      allSaved.splice(index, 1);
      localStorage.setItem('nba-power-rankings', JSON.stringify(allSaved));
      loadSavedRankings();
    }
  };

  // Load saved rankings on mount
  useEffect(() => {
    loadSavedRankings();
  }, []);

  // Initialize history with initial rankings
  useEffect(() => {
    if (history.length === 0) {
      setHistory([rankings]);
      setHistoryIndex(0);
    }
  }, []);

  // Pre-load all team logos as data URLs and Image objects on mount
  useEffect(() => {
    const preloadLogos = async () => {
      const urls: Record<string, string> = {};
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

            urls[team.id] = dataUrl;

            // Create and load Image object for canvas drawing
            const img = document.createElement('img');
            await new Promise<void>((resolve) => {
              img.onload = () => resolve();
              img.onerror = () => resolve(); // Continue even if image fails
              img.src = dataUrl;
            });
            images[team.id] = img;
          } catch (error) {
            console.error(`Failed to preload logo for ${team.name}:`, error);
          }
        })
      );

      setLogoDataUrls(urls);
      setLogoImages(images);
      setLogosLoaded(true);
      console.log('All logos preloaded:', Object.keys(urls).length);
    };

    preloadLogos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Load rankings from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const rankingsParam = params.get('rankings');

    if (rankingsParam) {
      try {
        const teamIds = rankingsParam.split(',');
        const rankedTeams: RankedTeam[] = [];

        // Map team IDs to team objects
        teamIds.forEach((teamId, index) => {
          const team = allTeams.find(t => t.id === teamId);
          if (team) {
            rankedTeams.push({
              rank: index + 1,
              team
            });
          }
        });

        // Add any missing teams at the end
        allTeams.forEach(team => {
          if (!rankedTeams.find(r => r.team.id === team.id)) {
            rankedTeams.push({
              rank: rankedTeams.length + 1,
              team
            });
          }
        });

        if (rankedTeams.length > 0) {
          setRankings(rankedTeams);
          setHistory([rankedTeams]);
          setHistoryIndex(0);
        }
      } catch (error) {
        console.error('Error loading rankings from URL:', error);
      }
    }
  }, [allTeams]);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.currentTarget.innerHTML);

    // Make drag image slightly transparent
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

    // Remove from old position
    newRankings.splice(draggedIndex, 1);
    // Insert at new position
    newRankings.splice(dropIndex, 0, draggedItem);

    // Update rank numbers
    const updatedRankings = newRankings.map((item, index) => ({
      ...item,
      rank: index + 1
    }));

    saveToHistory(updatedRankings);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleRankClick = (index: number) => {
    setEditingIndex(index);
    setRankInput(String(index + 1));
  };

  const handleRankSubmit = (index: number) => {
    const rankNum = parseInt(rankInput);

    // Validate rank
    if (isNaN(rankNum) || rankNum < 1 || rankNum > rankings.length) {
      setEditingIndex(null);
      setRankInput('');
      return;
    }

    // Only trigger change if rank actually changed
    if (rankNum !== index + 1) {
      const newIndex = rankNum - 1;
      const newRankings = [...rankings];
      const item = newRankings[index];

      // Remove from old position
      newRankings.splice(index, 1);
      // Insert at new position
      newRankings.splice(newIndex, 0, item);

      // Update rank numbers
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

  // Generate canvas directly (like NFL approach - much faster!)
  const generateCanvas = (selectedTeams: RankedTeam[]) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const canvasWidth = 1000;
    const dpr = 2;

    // Header
    let yPos = 20;
    const headerHeight = 78;

    // Team cards layout
    let gap = 20;
    const containerHeight = 64;
    let teamsPerRow = 1;
    let containerWidth = canvasWidth - (gap * 2);

    if (selectedTeams.length > 5 && selectedTeams.length <= 10) {
      teamsPerRow = 2;
      containerWidth = (canvasWidth - (gap * 3)) / 2;
    } else if (selectedTeams.length > 10) {
      teamsPerRow = 4;
      gap = 12;
      containerWidth = (canvasWidth - (gap * 5)) / 4;
    }

    // Calculate dynamic canvas height based on number of rows
    const totalRows = Math.ceil(selectedTeams.length / teamsPerRow);
    const teamsContentHeight = totalRows * containerHeight + (totalRows - 1) * gap;
    const footerHeight = 64;
    const bottomPadding = 30; // Extra space before footer
    const canvasHeight = yPos + headerHeight + teamsContentHeight + bottomPadding + footerHeight;

    canvas.width = canvasWidth * dpr;
    canvas.height = canvasHeight * dpr;
    ctx.scale(dpr, dpr);

    // Dark background
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Header
    ctx.fillStyle = '#ffffff';
    ctx.font = 'italic 900 38px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    const headerText = 'MY NBA POWER RANKINGS';
    const headerWidth = ctx.measureText(headerText).width;
    ctx.fillText(headerText, (canvasWidth - headerWidth) / 2, yPos + 38);
    yPos += headerHeight;

    // Draw teams
    selectedTeams.forEach((rankedTeam, i) => {
      const totalRows = Math.ceil(selectedTeams.length / teamsPerRow);
      const col = Math.floor(i / totalRows);
      const row = i % totalRows;

      let xPos = gap + (col * (containerWidth + gap));
      if (teamsPerRow === 1) {
        xPos = (canvasWidth - containerWidth) / 2;
      }

      const teamYPos = yPos + (row * (containerHeight + gap));

      // White card background
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(xPos, teamYPos, containerWidth, containerHeight, 12);
      ctx.fill();

      // Rank number
      const paddingX = 20;
      const containerCenterY = teamYPos + containerHeight / 2;
      ctx.fillStyle = '#000000';
      ctx.font = 'italic 900 32px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      const rankFontSize = 32;
      const rankTextY = containerCenterY + (rankFontSize * 0.35);
      ctx.fillText(String(rankedTeam.rank), xPos + paddingX, rankTextY);

      const rankWidth = ctx.measureText(String(rankedTeam.rank)).width;

      // Team name
      ctx.fillStyle = '#000000';
      const teamFontSize = selectedTeams.length > 5 ? 18 : 24;
      ctx.font = `600 ${teamFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
      const teamTextY = containerCenterY + (teamFontSize * 0.35);

      // Use shortened names for long team names when showing all 30
      let teamName = selectedTeams.length > 10 ? rankedTeam.team.name : rankedTeam.team.fullName;
      if (selectedTeams.length === 30) {
        if (rankedTeam.team.id === 'minnesota-timberwolves') {
          teamName = 'T-Wolves';
        } else if (rankedTeam.team.id === 'portland-trail-blazers') {
          teamName = 'Blazers';
        }
      }

      ctx.fillText(teamName, xPos + paddingX + rankWidth + 20, teamTextY);

      // Team logo
      const img = logoImages[rankedTeam.team.id];
      if (img) {
        const logoSize = 56;
        const logoX = xPos + containerWidth - logoSize - 12;
        const logoY = teamYPos + (containerHeight - logoSize) / 2;
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
    ctx.fillText('nfl-hq.com/power-rankings', footerPadding, footerY + 38);

    // PFSN Logo on the right (square aspect ratio)
    if (pfsnLogoImage) {
      ctx.save();

      const logoSize = 44; // Square logo
      const logoX = canvasWidth - footerPadding - logoSize;
      const logoY = footerY + (64 - logoSize) / 2;

      ctx.drawImage(pfsnLogoImage, logoX, logoY, logoSize, logoSize);

      ctx.restore();
    }

    return canvas;
  };

  const handleDownload = async (count: 5 | 10 | 30) => {
    if (!logosLoaded) {
      alert('Logos are still loading. Please wait a moment and try again.');
      return;
    }

    setShowDownloadMenu(false);
    setIsDownloading(true);

    try {
      const selectedTeams = rankings.slice(0, count);
      const canvas = generateCanvas(selectedTeams);

      if (!canvas) {
        throw new Error('Failed to generate canvas');
      }

      const link = document.createElement('a');
      link.download = `NBA_Power_Rankings_${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();
    } catch (error) {
      console.error('Error generating image:', error);
      alert('Failed to generate image. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };


  const resetRankings = () => {
    const sortedTeams = [...allTeams].sort((a, b) => {
      const [aWins] = a.record.split('-').map(Number);
      const [bWins] = b.record.split('-').map(Number);
      return bWins - aWins;
    });

    const newRankings = sortedTeams.map((team, index) => ({
      rank: index + 1,
      team
    }));

    saveToHistory(newRankings);
    setShowResetDialog(false);
  };

  // Handle team comparison toggle
  const handleTeamClick = (index: number) => {
    if (comparisonTeams.includes(index)) {
      setComparisonTeams(comparisonTeams.filter(i => i !== index));
    } else if (comparisonTeams.length < 4) {
      setComparisonTeams([...comparisonTeams, index]);
    } else {
      // Replace the first team if already have 4
      setComparisonTeams([...comparisonTeams.slice(1), index]);
    }
  };

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + Z for undo
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      // Cmd/Ctrl + Shift + Z for redo
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        redo();
      }
      // Escape to clear comparison
      if (e.key === 'Escape') {
        setComparisonTeams([]);
        setShowDownloadMenu(false);
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
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="hidden lg:block lg:w-64 flex-shrink-0">
        <NFLTeamsSidebar />
      </aside>

      {/* Mobile Sidebar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50">
        <NFLTeamsSidebar isMobile={true} />
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto lg:pt-0 pt-14">
        {/* Header */}
        <div className="bg-[#0050A0] text-white pt-[57px] lg:pt-0 pb-6 lg:pb-8">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-8 lg:pt-10">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-3 tracking-tight">
              NFL Power Rankings Builder
            </h1>
            <p className="text-base md:text-lg text-white/95 max-w-2xl">
              Create your own custom NFL power rankings
            </p>
          </div>
        </div>

        {/* Raptive Header Ad */}
        <div className="container mx-auto px-4 min-h-[150px]">
          <div className="raptive-pfn-header"></div>
        </div>

        {/* Content */}
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl">
          {/* Instructions - shown immediately for better LCP */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-900">
              <strong>How to use:</strong> Drag and drop teams to reorder, or click the rank number to type a new position. Click team logos to compare teams.
            </p>
          </div>

          {/* Comparison Mode Banner */}
          {standingsLoaded && comparisonTeams.length > 0 && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span className="text-sm font-semibold text-purple-900">
                    {comparisonTeams.length === 1 ? 'Select more teams to compare (up to 4)' : `Comparing ${comparisonTeams.length} teams`}
                  </span>
                  {comparisonTeams.length >= 2 && (
                    <span className="text-sm text-purple-700">
                      {comparisonTeams.map((idx, i) =>
                        `${i > 0 ? ' vs ' : ''}${rankings[idx].team.fullName}`
                      ).join('')}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setComparisonTeams([])}
                  className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                >
                  Clear
                </button>
              </div>
              {comparisonTeams.length >= 2 && (
                <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {comparisonTeams.map((teamIndex) => {
                    const team = rankings[teamIndex].team;
                    const stats = teamStats[team.id] || {};
                    return (
                      <div key={teamIndex} className="bg-white rounded-lg p-3 border border-purple-200">
                        <div className="flex items-center gap-2 mb-2">
                          <img src={team.logoUrl} alt={team.name}   className="w-8 h-8 object-contain" />
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-gray-900 text-sm truncate">{team.fullName}</div>
                            <div className="text-xs text-gray-600">Rank #{rankings[teamIndex].rank}</div>
                          </div>
                        </div>
                        <div className="space-y-0.5 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Record:</span>
                            <span className="font-semibold">{team.liveRecord || team.record}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Conf. Rank:</span>
                            <span className="font-semibold">{team.conferenceRank}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">PPG:</span>
                            <span className="font-semibold">{stats.ppg || '-'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Opp PPG:</span>
                            <span className="font-semibold">{stats.oppPpg || '-'}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Loading State */}
          {!standingsLoaded && (
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
                <div className="h-7 w-40 bg-gray-200 animate-pulse rounded"></div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#0050A0] text-white">
                    <tr>
                      <th className="pl-6 pr-4 py-3 text-left text-sm font-bold w-20">Rank</th>
                      <th className="px-4 py-3 text-left text-sm font-bold">Team</th>
                      <th className="hidden md:table-cell px-4 py-3 text-left text-sm font-bold w-24">Conference</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: 30 }).map((_, i) => (
                      <tr key={i} className="border-b border-gray-200">
                        <td className="pl-6 pr-4 py-4">
                          <div className="w-10 h-10 bg-gray-200 animate-pulse rounded-full mx-auto"></div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-200 animate-pulse rounded-lg"></div>
                            <div>
                              <div className="h-5 w-32 bg-gray-200 animate-pulse rounded mb-1"></div>
                              <div className="h-4 w-16 bg-gray-200 animate-pulse rounded"></div>
                            </div>
                          </div>
                        </td>
                        <td className="hidden md:table-cell px-4 py-4">
                          <div className="h-6 w-20 bg-gray-200 animate-pulse rounded"></div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Rankings Table with Header */}
          {standingsLoaded && (
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              {/* Table Header with Actions */}
              <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex flex-wrap gap-3 justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Team Rankings</h2>
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
                        Download
                      </>
                    )}
                  </button>

                  {/* Download Menu Dropdown */}
                  {showDownloadMenu && !isDownloading && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="py-2">
                        <button
                          onClick={() => handleDownload(5)}
                          className="w-full px-4 py-2 text-left hover:bg-gray-50 text-gray-700 transition-colors"
                        >
                          <span className="font-medium">Top 5 Teams</span>
                        </button>
                        <button
                          onClick={() => handleDownload(10)}
                          className="w-full px-4 py-2 text-left hover:bg-gray-50 text-gray-700 transition-colors"
                        >
                          <span className="font-medium">Top 10 Teams</span>
                        </button>
                        <button
                          onClick={() => handleDownload(30)}
                          className="w-full px-4 py-2 text-left hover:bg-gray-50 text-gray-700 transition-colors"
                        >
                          <span className="font-medium">All 30 Teams</span>
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
                    <th className="px-2 sm:px-4 py-3 text-left text-xs sm:text-sm font-bold">Team</th>
                    <th className="hidden md:table-cell px-4 py-3 text-left text-sm font-bold w-24">Conference</th>
                  </tr>
                </thead>
                <tbody>
                  {rankings.map((rankedTeam, index) => {
                    const isComparing = comparisonTeams.includes(index);
                    return (
                    <tr
                      key={rankedTeam.team.id}
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
                        ${isComparing ? 'bg-purple-50 border-l-4' : 'border-l-4'}
                      `}
                      style={{
                        borderLeftColor: isComparing ? '#9333ea' : rankedTeam.team.primaryColor,
                        backgroundColor: isComparing ? '#faf5ff' : undefined
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
                                {rankedTeam.rank}
                              </span>
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Team Info */}
                      <td className="px-2 sm:px-4 py-3 sm:py-4">
                        <div className="flex items-center gap-2 sm:gap-3 relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTeamClick(index);
                            }}
                            className={`
                              w-8 h-8 sm:w-10 sm:h-10 rounded-lg transition-all flex-shrink-0
                              ${isComparing ? 'ring-4 ring-purple-500 bg-purple-100' : 'hover:ring-2 hover:ring-gray-300'}
                            `}
                            title={isComparing ? 'Click to remove from comparison' : 'Click to compare teams'}
                          >
                            <img
                              src={rankedTeam.team.logoUrl}
                              alt={rankedTeam.team.name}
                              className="w-8 h-8 sm:w-10 sm:h-10 object-contain"
                            />
                          </button>
                          <div className="min-w-0">
                            <div className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                              {rankedTeam.team.fullName}
                            </div>
                            <div className="text-xs sm:text-sm text-gray-500">
                              {rankedTeam.team.liveRecord || rankedTeam.team.record}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Conference */}
                      <td className="hidden md:table-cell px-4 py-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            rankedTeam.team.conference === 'NFC'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {rankedTeam.team.conference}
                        </span>
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>
          </div>
          )}
        </div>
      </main>

      {/* Reset Confirmation Dialog */}
      {showResetDialog && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Reset Rankings?</h3>
                <p className="text-sm text-gray-600">This will restore the default rankings based on team records.</p>
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

      {/* Save Rankings Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
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
              placeholder="e.g., My NFL Power Rankings 2025"
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
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 animate-in fade-in zoom-in duration-200 max-h-[80vh] overflow-y-auto">
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
                          {saved.rankings.length} teams
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
