'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

import { getCurrentPlayers, getAlltimePlayersPublic, PlayerData } from '@/data/players/index';
import { getAllTeams } from '@/data/teams';
import NFLTeamsSidebar from '@/components/NFLTeamsSidebar';
import { CURRENT_TOP_100_IDS } from '@/data/player-rankings/current-top-100';
import { ALLTIME_TOP_100_IDS } from '@/data/player-rankings/alltime-top-100';
import toast, { Toaster } from 'react-hot-toast';

interface RankedPlayer {
  rank: number;
  player: PlayerData;
}

// PFSN Logo (actual white logo from NFL Power Rankings Builder)
// Source: https://staticd.profootballnetwork.com/skm/assets/pfn/pfsn-logo-white-ver-2.png
const PFSN_LOGO_DATA_URL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAqcAAAKnCAMAAACMOxQ2AAAASFBMVEUAAAD////////////////////////////////////////////////////////////////////////////////////////////neHiwAAAAF3RSTlMAEB8gMD9AT1BfYG9wf4CPn6Cvv8/f7+HmMdcAAAnsSURBVHja7N3NTttAFIDRO/YkKQrkB4T6/o+HKnVTqa1obLcbkAC3dQRJZpJzVlnffLKJfD0EAAAAAAAAAAAAAAAAAABMl1peimkM6o04oM1nXopp7k3qtVnsoXGP4ER0ik5Bp6BTdAo6RaegU9ApOgWdgk7RKegUdIpOQafoFHQKOkWnoFPQKToFnYJO0SnoFJ2CTkGn6BR0CjpFp6BT0Ck6BZ2iU9Ap6LR8gxHoVKc6BZ2CTtEp6BR0ik5Bp+gUdAo6RaegU9ApOgWdgk7RKegUnUKhclSnjxHDECO6GDH08WzRRj2GH3FO+sI7/fl9clFDHFhbVaffXE+P6PGX2xj+PkWnoFPQKToFnaJTI0CnoFN0CjoFnaJT0CnoFJ2CTtEp6BTq7LQ3dXSKTkGnoFN0CjoFnaJTnnRGoFN0CjoFnZ6ZQafoVKegU3QKOgWdolPQKegUnYJO0SnoFHSKTkGnoFN0CjoFnaJT0Ck6BZ2CTtEp6BR0ik7haBpHK6NT0Ck6BZ2CTtEp6BR0ik5Bp+gUdIr/c6bTi9LrFHQKOkWn+A2kU7+B0Ck6BZ2CTtEp6BSdgk5Bp5cu3dUoxx6yb7l+TY4KJddT3PcPIW1OZKaAOuQoQbPwTeC+j05Bp6BTdAo6RaegU9hf4xVhdKpT3PfRKegUdIpOQaegU3QKOkWnoFPQqTP+dYoz/nUKOkWnoFPQKToFnaJT0CnoFJ2CTkGn6BR0aicPndpx1inoFJ2CTkGn6BR0CjpFp6BT0Ck6tZGB6yk6BZ2CTtEp6BR0ik5Bp/BCNgJvXeuUY+i+uO/jqqlTdFrRfb97UCGup+gUdAo6RaegU3QKOgWdolPQKegUnYJOQafoFHSKTkGnoFN0CjoFnaJT0Ok52BmBTtGpU5JwPQWdolPQKegUnYJO0SnoFHSKTkGn2IzQqU51CjoFnaJT0Ck6BZ2CTtEp6BR0ik5Bp6BTdAo6RaegU9ApOgWdgk7RKegUdIpOQafoFHT6R2fouJ6iU9Ap6BSdgk5Bp87W1ynPBiPQKToFnYJOD8tmhE5Bp+gUdIpOQaegU3QKOgWdolPQKegUnYJO0SnoFHSKTkGnoFN0CmVa3b3b0hQBAAAAAAAAAAAAAAAAAAAASpbnjEl7jC+3T1KcgTR/v5goxUT3TvgZ9fDe8fUjn4b+7afoYvcYJZlvjza+yEo7sWb6WV/D150pUby0bXVK+Zpt0inla1c6pQKfrnVKBZZznVKBTatTypduk04pX7PVKXvq4/hmK51SgasrnVKBm6xType2SaeUr7nVKRXIa53iAapO+RjLrFMqsG11ykSDZVSd6vSf2rVOqcBipVMqcDXXKZZRdYplVJ16gKpTipJXOsUyqk6xjKpTp/nolGedF/t0igeoOrWMqlOc5qNT3ti0OsUDVJ3yIZq1TrGMqlM8QNXpgQ1RjptWp4zr/ZbSKZZRdeo0H53iAapO+atl1ilO89EpTvPRqWVUnVKUxbVOeaW3jKpTnVpG1allVJ3iDVSd8j+zlU6xjKpTnOajU6f56JSiNBudYhlVpzXZWUbVKR6g6vQCrFudYhlVp7/bu7fltK0oAMMbEI6dA7bbSf3+79cYMEJlFB1652mnTh3C2lgbf99VL5heaH4jdrRYYBhVp7b56JRJublOl6BK0zKc+oLx5BcMx7ygS1O3+t7r9Cj1X2nwBnf+YdQ/R/f9YwyDTG3z8fmUl1W3OsU2H50S42OlUwyj6hQPUHX6fixWOsVZSqcYRtWpn5bUKbb56JTjD/06xTYfnRLj5kan2OajU0LM7mc6xTCqTglR3eoUD1B1SoxPlU7x05I6JWoYVafY5qNTQnxY6ZQC3FzpFMOoOiVqGFWneICqU0JUK51iGFWnxPhS6RTbfHRKiPm9TvEAVadEDaPqFNt8ivwdiZuqP/WnRtKr/4dRe0e5+9br9N+Wy/T2xvHkFwwpPdv1fg5lUr4+8ILlOS/fHw853KVfdPVwOp9PL1Db5RlGdY4i1OOQ5wGqTok0Po4pgy8LnRKpf8o0jKpTIh2aPMOoOv0Rvwv/S3bf82zzcZ11Gmo95HmA6jpTwFnqU6VTIvWbTNt8dEqktsm0zUenRNq1eYZRdUqoTZ8y+PBZp0Qa12OeYVSdUsBZ6m6hUyK1+0wPUHXq3/kj1Yc8h37XWaehnvqUwXLlOhNpXGcaRtUpkfp1pm0+OiVSt8+0zUenFHCWutMpobZdnmFUnRJqk2kYVadE6nM9QNUpkbom5XC70OlFWaQz6s/4XGqmU6Z/llrc6pQClqR8WOmUAoZRb651SqSuTjmsFjolUtNkGkbVKZF2XZ5tPjqlgLNUdatTCliScv1Zp0x/4WT6WOnU86hIhybTMKpOibRrMz1A1SnTn/FbrHSKs5ROLUmJGkbVKZHafaZtPjolUt1meoCqU6a/cHJ+r1MKWJKyXOm0bLM0Lf025RlG1alOCzhLLXVKqPpgLyIF2PY6pQDrQae8z4WTg06J1u11Srj4WOqD+z7T7zRtO51SgM2gU9Kz2XQXTuqUyXeaulqnFKA56JQCbDudUoDHQacU8cU+nTJ9fa1TCtA0OqUAu+86xYzf9DodeNHMWeocqvSTvnlvKlK/uU8BOvd9smobn08pwK7VKQXY9DqliB9C0ynT1290SgHavU6xJEWnxHjqdUoRCyd1yvT1W53iLKVTnKV0WpLu1IWTOsUwqk6JWpKiU6ava9IvGnXK+dQH+0+xJEWnxHgcdIphVJ3yjhdOVukdu7pPrxjH/xwkxuf/6lNKTZ9K0yw++mstytXDyZbp53x9CLBMMX5/ONo89vI9c9/nhx4Hn0+xcFKnhOifdEoBDo1OsXBSp8RYDzrFWUqnrl+IfuM667QAbWP+lALsWp1i4aROiZrx0ynOUjolRLvX6TQt/sEfaaoPlzYnfT1/NYGTXzCfnfpnddHpjSne03JxUZ0ubr35vLUhy1nqt7n7PpPXr30+pQDdXqc4S/m+qesXY1tVF/N+utDk5doM7vtYOKlTQnS1TilAc9ApxS+cHHSKJSk65Ygv9umU6etrnVKAptEplqScYi5onq0Hnfr+vrOU6/xWZhZO6hQLJ3XKS3atTjHjp1OizlI6xZIUnRKi3euUAtSt70dRgE1v/pRjnb+WcT247zN9/VanOEvp1PWLUR9cZ3MoBdj2OsUwqk4J0a91ioWTOiVGffA8igJsO++nGEbVKVELJ3WKhZM6JURz0CnOUjr13DRu4eSoU51O/4t95qSxcNJ+KS5l4eTcDY5X7Q7u+xRAp6BTdAo6BZ2iUzIZdYpO/49/5/d8H53q1H0fdAo6RaegU3QKOgWdolNB4/0U4sx50Tkv3+U14W0SAAAAAAAAAAAAAAAAAICf8jcp1I59vBC65AAAAABJRU5ErkJggg==';

// Helper function to get position colors
const getPositionColor = (position: string): { bg: string; text: string } => {
  switch (position) {
    case 'PG':
      return { bg: 'bg-blue-100', text: 'text-blue-800' };
    case 'SG':
      return { bg: 'bg-purple-100', text: 'text-purple-800' };
    case 'SF':
      return { bg: 'bg-green-100', text: 'text-green-800' };
    case 'PF':
      return { bg: 'bg-orange-100', text: 'text-orange-800' };
    case 'C':
      return { bg: 'bg-red-100', text: 'text-red-800' };
    default:
      return { bg: 'bg-gray-100', text: 'text-gray-800' };
  }
};

// Helper function to get team info from team name
const getTeamInfo = (teamName: string): { abbreviation: string; logoUrl: string } | null => {
  const allTeams = getAllTeams();

  // First try exact match
  let team = allTeams.find(t => t.fullName === teamName || t.name === teamName);

  // If no exact match, try partial match (for cases like "LA Clippers" vs "Los Angeles Clippers")
  if (!team) {
    team = allTeams.find(t =>
      t.fullName.toLowerCase().includes(teamName.toLowerCase()) ||
      teamName.toLowerCase().includes(t.name.toLowerCase())
    );
  }

  if (team) {
    return { abbreviation: team.abbreviation, logoUrl: team.logoUrl };
  }
  return null;
};

// Helper function to sort players based on curated rankings
const sortPlayersByRanking = (players: PlayerData[], isCurrentTab: boolean): PlayerData[] => {
  const rankingList = isCurrentTab ? CURRENT_TOP_100_IDS : ALLTIME_TOP_100_IDS;

  // Split players into top 100 and rest
  const top100: PlayerData[] = [];
  const remaining: PlayerData[] = [];

  players.forEach(player => {
    const rankIndex = rankingList.indexOf(player.id);
    if (rankIndex !== -1) {
      top100.push(player);
    } else {
      remaining.push(player);
    }
  });

  // Sort top 100 by ranking list order
  top100.sort((a, b) => {
    const aIndex = rankingList.indexOf(a.id);
    const bIndex = rankingList.indexOf(b.id);
    return aIndex - bIndex;
  });

  // Sort remaining players alphabetically by team, then by name
  remaining.sort((a, b) => {
    const teamCompare = a.team.localeCompare(b.team);
    if (teamCompare !== 0) return teamCompare;
    return a.name.localeCompare(b.name);
  });

  return [...top100, ...remaining];
};

// Profanity filter - checks for inappropriate words including bypass attempts
const containsProfanity = (text: string): boolean => {
  const profanityList = [
    'fuck', 'shit', 'damn', 'bitch', 'ass', 'bastard', 'crap', 'piss', 'dick', 'cock',
    'pussy', 'cunt', 'whore', 'slut', 'fag', 'nigger', 'nigga', 'retard', 'rape', 'sex',
    'porn', 'xxx', 'anal', 'penis', 'vagina', 'tits', 'boobs', 'cum', 'jizz', 'masturbate',
    'motherfucker', 'asshole', 'bullshit', 'goddamn', 'jackass', 'dumbass', 'shitty', 'fucked',
    'fucker', 'fucking', 'bitches', 'asses', 'dicks', 'cocks', 'pussies', 'cunts', 'whores',
    'sluts', 'fags', 'retards', 'penises', 'vaginas', 'assholes', 'fuckers'
  ];

  // Normalize text - remove spaces, periods, dashes, underscores, etc. to catch bypass attempts
  const normalizedText = text.toLowerCase().replace(/[\s._\-*@#$%^&+=]/g, '');

  // Check if any profanity is in the normalized text
  for (const word of profanityList) {
    if (normalizedText.includes(word)) {
      return true;
    }
  }

  return false;
};

// Curated list of famous players organized by team (top 15 per team - mix of legends and current stars)
const TEAM_FAMOUS_PLAYERS: Record<string, PlayerData[]> = {
  'Atlanta Hawks': [
    { id: 'trae-young', name: 'Trae Young', team: 'Atlanta Hawks', position: 'PG', number: '11', ppg: '26.2', apg: '10.8', rpg: '2.8', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/1629027.png', era: 'alltime' },
    { id: 'dominique-wilkins', name: 'Dominique Wilkins', team: 'Atlanta Hawks', position: 'SF', number: '21', ppg: '24.8', apg: '2.5', rpg: '6.7', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/155.png', era: 'alltime' },
    { id: 'dejounte-murray-atl', name: 'Dejounte Murray', team: 'Atlanta Hawks', position: 'PG', number: '5', ppg: '20.5', apg: '5.3', rpg: '5.5', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/1627749.png', era: 'alltime' },
    { id: 'bob-pettit', name: 'Bob Pettit', team: 'Atlanta Hawks', position: 'PF', number: '9', ppg: '26.4', apg: '3.0', rpg: '16.2', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/76130.png', era: 'alltime' },
    { id: 'pete-maravich-atl', name: 'Pete Maravich', team: 'Atlanta Hawks', position: 'PG', number: '44', ppg: '24.2', apg: '5.4', rpg: '4.2', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/76107.png', era: 'alltime' },
  ],

  'Boston Celtics': [
    { id: 'jayson-tatum', name: 'Jayson Tatum', team: 'Boston Celtics', position: 'SF', number: '0', ppg: '27.0', apg: '4.6', rpg: '8.3', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/1628369.png', era: 'alltime' },
    { id: 'jaylen-brown', name: 'Jaylen Brown', team: 'Boston Celtics', position: 'SG', number: '7', ppg: '23.2', apg: '3.5', rpg: '6.3', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/1627759.png', era: 'alltime' },
    { id: 'larry-bird', name: 'Larry Bird', team: 'Boston Celtics', position: 'SF', number: '33', ppg: '24.3', apg: '6.3', rpg: '10.0', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/7.png', era: 'alltime' },
    { id: 'bill-russell', name: 'Bill Russell', team: 'Boston Celtics', position: 'C', number: '6', ppg: '15.1', apg: '4.3', rpg: '22.5', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/76194.png', era: 'alltime' },
    { id: 'john-havlicek', name: 'John Havlicek', team: 'Boston Celtics', position: 'SF', number: '17', ppg: '20.8', apg: '4.8', rpg: '6.3', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/24.png', era: 'alltime' },
    { id: 'paul-pierce', name: 'Paul Pierce', team: 'Boston Celtics', position: 'SF', number: '34', ppg: '19.7', apg: '3.5', rpg: '5.6', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/1718.png', era: 'alltime' },
    { id: 'kevin-garnett', name: 'Kevin Garnett', team: 'Boston Celtics', position: 'PF', number: '5', ppg: '17.8', apg: '3.7', rpg: '10.0', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/708.png', era: 'alltime' },
    { id: 'ray-allen', name: 'Ray Allen', team: 'Boston Celtics', position: 'SG', number: '20', ppg: '18.9', apg: '3.4', rpg: '4.1', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/951.png', era: 'alltime' },
    { id: 'bob-cousy', name: 'Bob Cousy', team: 'Boston Celtics', position: 'PG', number: '14', ppg: '18.4', apg: '7.5', rpg: '5.2', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/12.png', era: 'alltime' },
    { id: 'dave-cowens', name: 'Dave Cowens', team: 'Boston Celtics', position: 'C', number: '18', ppg: '17.6', apg: '3.8', rpg: '13.6', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/11.png', era: 'alltime' },
  ],

  'Brooklyn Nets': [
    { id: 'mikal-bridges-bkn', name: 'Mikal Bridges', team: 'Brooklyn Nets', position: 'SF', number: '1', ppg: '21.2', apg: '3.5', rpg: '4.5', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/1628969.png', era: 'alltime' },
    { id: 'jason-kidd-nets', name: 'Jason Kidd', team: 'Brooklyn Nets', position: 'PG', number: '5', ppg: '14.6', apg: '9.1', rpg: '7.2', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/467.png', era: 'alltime' },
    { id: 'julius-erving-nets', name: 'Julius Erving', team: 'Brooklyn Nets', position: 'SF', number: '32', ppg: '28.2', apg: '4.8', rpg: '10.9', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/76018.png', era: 'alltime' },
    { id: 'vince-carter-nets', name: 'Vince Carter', team: 'Brooklyn Nets', position: 'SG', number: '15', ppg: '23.6', apg: '4.7', rpg: '5.8', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/1713.png', era: 'alltime' },
    { id: 'brook-lopez-nets', name: 'Brook Lopez', team: 'Brooklyn Nets', position: 'C', number: '11', ppg: '18.6', apg: '2.0', rpg: '6.4', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/201572.png', era: 'alltime' },
  ],

  'Charlotte Hornets': [
    { id: 'lamelo-ball', name: 'LaMelo Ball', team: 'Charlotte Hornets', position: 'PG', number: '1', ppg: '23.9', apg: '8.4', rpg: '6.2', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/1630163.png', era: 'alltime' },
    { id: 'brandon-miller', name: 'Brandon Miller', team: 'Charlotte Hornets', position: 'SF', number: '24', ppg: '16.9', apg: '2.4', rpg: '4.2', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/1641705.png', era: 'alltime' },
    { id: 'alonzo-mourning', name: 'Alonzo Mourning', team: 'Charlotte Hornets', position: 'C', number: '33', ppg: '21.0', apg: '1.1', rpg: '10.0', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/177.png', era: 'alltime' },
    { id: 'larry-johnson-hor', name: 'Larry Johnson', team: 'Charlotte Hornets', position: 'PF', number: '2', ppg: '19.2', apg: '3.6', rpg: '11.0', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/66.png', era: 'alltime' },
    { id: 'kemba-walker', name: 'Kemba Walker', team: 'Charlotte Hornets', position: 'PG', number: '15', ppg: '19.8', apg: '5.5', rpg: '3.8', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/202689.png', era: 'alltime' },
  ],

  'Chicago Bulls': [
    { id: 'zach-lavine', name: 'Zach LaVine', team: 'Chicago Bulls', position: 'SG', number: '8', ppg: '24.8', apg: '4.2', rpg: '4.8', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/203897.png', era: 'alltime' },
    { id: 'nikola-vucevic', name: 'Nikola Vucevic', team: 'Chicago Bulls', position: 'C', number: '9', ppg: '17.5', apg: '3.2', rpg: '11.0', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/202696.png', era: 'alltime' },
    { id: 'michael-jordan', name: 'Michael Jordan', team: 'Chicago Bulls', position: 'SG', number: '23', ppg: '30.1', apg: '5.3', rpg: '6.2', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/893.png', era: 'alltime' },
    { id: 'scottie-pippen', name: 'Scottie Pippen', team: 'Chicago Bulls', position: 'SF', number: '33', ppg: '16.1', apg: '5.2', rpg: '6.4', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/1152.png', era: 'alltime' },
    { id: 'derrick-rose', name: 'Derrick Rose', team: 'Chicago Bulls', position: 'PG', number: '1', ppg: '25.0', apg: '7.7', rpg: '4.1', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/201565.png', era: 'alltime' },
    { id: 'dennis-rodman', name: 'Dennis Rodman', team: 'Chicago Bulls', position: 'PF', number: '91', ppg: '7.3', apg: '1.8', rpg: '16.1', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/252.png', era: 'alltime' },
    { id: 'jerry-sloan', name: 'Jerry Sloan', team: 'Chicago Bulls', position: 'SG', number: '4', ppg: '14.0', apg: '2.5', rpg: '7.4', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/76207.png', era: 'alltime' },
    { id: 'bob-love', name: 'Bob Love', team: 'Chicago Bulls', position: 'PF', number: '10', ppg: '21.3', apg: '2.0', rpg: '6.8', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/76069.png', era: 'alltime' },
  ],

  'Cleveland Cavaliers': [
    { id: 'donovan-mitchell', name: 'Donovan Mitchell', team: 'Cleveland Cavaliers', position: 'SG', number: '45', ppg: '27.1', apg: '5.1', rpg: '4.4', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/1628378.png', era: 'alltime' },
    { id: 'darius-garland', name: 'Darius Garland', team: 'Cleveland Cavaliers', position: 'PG', number: '10', ppg: '21.6', apg: '7.8', rpg: '2.8', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/1629636.png', era: 'alltime' },
    { id: 'lebron-james-cav', name: 'LeBron James', team: 'Cleveland Cavaliers', position: 'SF', number: '23', ppg: '27.1', apg: '7.4', rpg: '7.4', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/2544.png', era: 'alltime' },
    { id: 'kyrie-irving-cav', name: 'Kyrie Irving', team: 'Cleveland Cavaliers', position: 'PG', number: '2', ppg: '22.4', apg: '5.7', rpg: '3.4', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/202681.png', era: 'alltime' },
    { id: 'brad-daugherty', name: 'Brad Daugherty', team: 'Cleveland Cavaliers', position: 'C', number: '43', ppg: '19.0', apg: '3.5', rpg: '9.5', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/97.png', era: 'alltime' },
    { id: 'mark-price', name: 'Mark Price', team: 'Cleveland Cavaliers', position: 'PG', number: '25', ppg: '16.4', apg: '7.2', rpg: '2.7', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/239.png', era: 'alltime' },
    { id: 'kevin-love', name: 'Kevin Love', team: 'Cleveland Cavaliers', position: 'PF', number: '0', ppg: '17.6', apg: '2.4', rpg: '10.0', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/201567.png', era: 'alltime' },
  ],

  'Dallas Mavericks': [
    { id: 'luka-doncic', name: 'Luka Doncic', team: 'Dallas Mavericks', position: 'PG', number: '77', ppg: '28.4', apg: '8.7', rpg: '9.1', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/1629029.png', era: 'alltime' },
    { id: 'kyrie-irving', name: 'Kyrie Irving', team: 'Dallas Mavericks', position: 'PG', number: '11', ppg: '23.6', apg: '5.7', rpg: '4.0', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/202681.png', era: 'alltime' },
    { id: 'dirk-nowitzki', name: 'Dirk Nowitzki', team: 'Dallas Mavericks', position: 'PF', number: '41', ppg: '20.7', apg: '2.4', rpg: '7.5', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/1717.png', era: 'alltime' },
    { id: 'jason-kidd', name: 'Jason Kidd', team: 'Dallas Mavericks', position: 'PG', number: '5', ppg: '12.6', apg: '8.7', rpg: '6.3', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/467.png', era: 'alltime' },
    { id: 'mark-aguirre', name: 'Mark Aguirre', team: 'Dallas Mavericks', position: 'SF', number: '24', ppg: '24.6', apg: '4.0', rpg: '5.7', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/2.png', era: 'alltime' },
    { id: 'rolando-blackman', name: 'Rolando Blackman', team: 'Dallas Mavericks', position: 'SG', number: '22', ppg: '18.0', apg: '3.3', rpg: '3.3', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/753.png', era: 'alltime' },
    { id: 'steve-nash-dal', name: 'Steve Nash', team: 'Dallas Mavericks', position: 'PG', number: '13', ppg: '14.5', apg: '7.3', rpg: '3.1', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/959.png', era: 'alltime' },
  ],

  'Denver Nuggets': [
    { id: 'nikola-jokic', name: 'Nikola Jokic', team: 'Denver Nuggets', position: 'C', number: '15', ppg: '24.5', apg: '9.8', rpg: '11.8', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/203999.png', era: 'alltime' },
    { id: 'jamal-murray', name: 'Jamal Murray', team: 'Denver Nuggets', position: 'PG', number: '27', ppg: '20.0', apg: '6.5', rpg: '4.0', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/1627750.png', era: 'alltime' },
    { id: 'alex-english', name: 'Alex English', team: 'Denver Nuggets', position: 'SF', number: '2', ppg: '25.9', apg: '4.5', rpg: '5.6', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/116.png', era: 'alltime' },
    { id: 'carmelo-anthony-den', name: 'Carmelo Anthony', team: 'Denver Nuggets', position: 'SF', number: '15', ppg: '24.8', apg: '3.1', rpg: '6.3', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/2546.png', era: 'alltime' },
    { id: 'dan-issel', name: 'Dan Issel', team: 'Denver Nuggets', position: 'C', number: '44', ppg: '22.6', apg: '2.8', rpg: '9.2', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/76044.png', era: 'alltime' },
    { id: 'fat-lever', name: 'Fat Lever', team: 'Denver Nuggets', position: 'PG', number: '12', ppg: '17.0', apg: '7.5', rpg: '6.0', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/76064.png', era: 'alltime' },
    { id: 'david-thompson', name: 'David Thompson', team: 'Denver Nuggets', position: 'SG', number: '33', ppg: '22.7', apg: '3.9', rpg: '4.7', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/76318.png', era: 'alltime' },
  ],

  'Detroit Pistons': [
    { id: 'cade-cunningham', name: 'Cade Cunningham', team: 'Detroit Pistons', position: 'PG', number: '2', ppg: '22.7', apg: '7.5', rpg: '4.3', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/1630595.png', era: 'alltime' },
    { id: 'isiah-thomas', name: 'Isiah Thomas', team: 'Detroit Pistons', position: 'PG', number: '11', ppg: '19.2', apg: '9.3', rpg: '3.6', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/313.png', era: 'alltime' },
    { id: 'joe-dumars', name: 'Joe Dumars', team: 'Detroit Pistons', position: 'SG', number: '4', ppg: '16.1', apg: '4.5', rpg: '2.2', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/102.png', era: 'alltime' },
    { id: 'chauncey-billups', name: 'Chauncey Billups', team: 'Detroit Pistons', position: 'PG', number: '1', ppg: '16.5', apg: '6.2', rpg: '3.0', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/951.png', era: 'alltime' },
    { id: 'ben-wallace', name: 'Ben Wallace', team: 'Detroit Pistons', position: 'C', number: '3', ppg: '5.7', apg: '1.4', rpg: '9.6', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/1996.png', era: 'alltime' },
    { id: 'grant-hill', name: 'Grant Hill', team: 'Detroit Pistons', position: 'SF', number: '33', ppg: '21.6', apg: '7.0', rpg: '7.9', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/671.png', era: 'alltime' },
    { id: 'bob-lanier', name: 'Bob Lanier', team: 'Detroit Pistons', position: 'C', number: '16', ppg: '22.7', apg: '3.3', rpg: '11.8', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/76057.png', era: 'alltime' },
  ],

  'Golden State Warriors': [
    { id: 'stephen-curry', name: 'Stephen Curry', team: 'Golden State Warriors', position: 'PG', number: '30', ppg: '24.8', apg: '6.4', rpg: '4.7', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/201939.png', era: 'alltime' },
    { id: 'klay-thompson', name: 'Klay Thompson', team: 'Golden State Warriors', position: 'SG', number: '11', ppg: '19.6', apg: '2.3', rpg: '3.5', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/202691.png', era: 'alltime' },
    { id: 'draymond-green', name: 'Draymond Green', team: 'Golden State Warriors', position: 'PF', number: '23', ppg: '8.7', apg: '6.2', rpg: '7.0', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/203110.png', era: 'alltime' },
    { id: 'rick-barry', name: 'Rick Barry', team: 'Golden State Warriors', position: 'SF', number: '24', ppg: '25.7', apg: '6.2', rpg: '6.8', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/75992.png', era: 'alltime' },
    { id: 'wilt-chamberlain-gsw', name: 'Wilt Chamberlain', team: 'Golden State Warriors', position: 'C', number: '13', ppg: '41.5', apg: '2.4', rpg: '25.1', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/76375.png', era: 'alltime' },
    { id: 'chris-mullin', name: 'Chris Mullin', team: 'Golden State Warriors', position: 'SF', number: '17', ppg: '20.1', apg: '3.5', rpg: '4.1', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/171.png', era: 'alltime' },
    { id: 'nate-thurmond', name: 'Nate Thurmond', team: 'Golden State Warriors', position: 'C', number: '42', ppg: '15.0', apg: '2.7', rpg: '15.0', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/76328.png', era: 'alltime' },
    { id: 'chris-paul', name: 'Chris Paul', team: 'Golden State Warriors', position: 'PG', number: '3', ppg: '17.9', apg: '9.5', rpg: '4.5', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/101108.png', era: 'alltime' },
  ],

  'Houston Rockets': [
    { id: 'alperen-sengun', name: 'Alperen Sengun', team: 'Houston Rockets', position: 'C', number: '28', ppg: '21.1', apg: '5.0', rpg: '9.3', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/1630578.png', era: 'alltime' },
    { id: 'jalen-green', name: 'Jalen Green', team: 'Houston Rockets', position: 'SG', number: '4', ppg: '19.6', apg: '3.5', rpg: '5.2', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/1630224.png', era: 'alltime' },
    { id: 'hakeem-olajuwon', name: 'Hakeem Olajuwon', team: 'Houston Rockets', position: 'C', number: '34', ppg: '21.8', apg: '2.5', rpg: '11.1', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/165.png', era: 'alltime' },
    { id: 'james-harden-hou', name: 'James Harden', team: 'Houston Rockets', position: 'SG', number: '13', ppg: '29.6', apg: '7.7', rpg: '6.0', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/201935.png', era: 'alltime' },
    { id: 'yao-ming', name: 'Yao Ming', team: 'Houston Rockets', position: 'C', number: '11', ppg: '19.0', apg: '1.6', rpg: '9.2', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/2397.png', era: 'alltime' },
    { id: 'clyde-drexler-hou', name: 'Clyde Drexler', team: 'Houston Rockets', position: 'SG', number: '22', ppg: '19.3', apg: '5.1', rpg: '6.0', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/108.png', era: 'alltime' },
    { id: 'moses-malone-hou', name: 'Moses Malone', team: 'Houston Rockets', position: 'C', number: '24', ppg: '24.8', apg: '1.8', rpg: '15.0', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/76080.png', era: 'alltime' },
  ],

  'Indiana Pacers': [
    { id: 'tyrese-haliburton', name: 'Tyrese Haliburton', team: 'Indiana Pacers', position: 'PG', number: '0', ppg: '20.1', apg: '10.9', rpg: '3.9', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/1630169.png', era: 'alltime' },
    { id: 'pascal-siakam', name: 'Pascal Siakam', team: 'Indiana Pacers', position: 'PF', number: '43', ppg: '21.7', apg: '4.3', rpg: '7.8', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/1627783.png', era: 'alltime' },
    { id: 'reggie-miller', name: 'Reggie Miller', team: 'Indiana Pacers', position: 'SG', number: '31', ppg: '18.2', apg: '3.0', rpg: '3.0', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/1166.png', era: 'alltime' },
    { id: 'jermaine-oneal', name: "Jermaine O'Neal", team: 'Indiana Pacers', position: 'C', number: '7', ppg: '18.6', apg: '2.1', rpg: '9.6', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/1041.png', era: 'alltime' },
    { id: 'paul-george-ind', name: 'Paul George', team: 'Indiana Pacers', position: 'SF', number: '13', ppg: '18.1', apg: '3.5', rpg: '6.6', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/202331.png', era: 'alltime' },
    { id: 'mel-daniels', name: 'Mel Daniels', team: 'Indiana Pacers', position: 'C', number: '34', ppg: '18.9', apg: '1.9', rpg: '15.6', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/76429.png', era: 'alltime' },
    { id: 'rik-smits', name: 'Rik Smits', team: 'Indiana Pacers', position: 'C', number: '45', ppg: '14.8', apg: '1.4', rpg: '6.1', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/277.png', era: 'alltime' },
  ],

  'Los Angeles Clippers': [
    { id: 'kawhi-leonard', name: 'Kawhi Leonard', team: 'Los Angeles Clippers', position: 'SF', number: '2', ppg: '24.8', apg: '3.0', rpg: '6.5', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/202695.png', era: 'alltime' },
    { id: 'paul-george', name: 'Paul George', team: 'Los Angeles Clippers', position: 'SF', number: '13', ppg: '20.8', apg: '3.7', rpg: '6.4', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/202331.png', era: 'alltime' },
    { id: 'james-harden', name: 'James Harden', team: 'Los Angeles Clippers', position: 'SG', number: '1', ppg: '24.1', apg: '7.0', rpg: '5.6', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/201935.png', era: 'alltime' },
    { id: 'russell-westbrook', name: 'Russell Westbrook', team: 'Los Angeles Clippers', position: 'PG', number: '0', ppg: '21.7', apg: '8.4', rpg: '7.1', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/201566.png', era: 'alltime' },
    { id: 'chris-paul-lac', name: 'Chris Paul', team: 'Los Angeles Clippers', position: 'PG', number: '3', ppg: '18.8', apg: '10.2', rpg: '4.2', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/101108.png', era: 'alltime' },
    { id: 'blake-griffin', name: 'Blake Griffin', team: 'Los Angeles Clippers', position: 'PF', number: '32', ppg: '21.6', apg: '4.2', rpg: '9.3', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/201933.png', era: 'alltime' },
    { id: 'deandre-jordan', name: 'DeAndre Jordan', team: 'Los Angeles Clippers', position: 'C', number: '6', ppg: '9.4', apg: '1.0', rpg: '10.7', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/201599.png', era: 'alltime' },
  ],

  'Los Angeles Lakers': [
    { id: 'lebron-james', name: 'LeBron James', team: 'Los Angeles Lakers', position: 'SF', number: '23', ppg: '25.7', apg: '7.3', rpg: '7.5', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/2544.png', era: 'alltime' },
    { id: 'anthony-davis', name: 'Anthony Davis', team: 'Los Angeles Lakers', position: 'PF', number: '3', ppg: '24.0', apg: '2.5', rpg: '10.4', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/203076.png', era: 'alltime' },
    { id: 'kobe-bryant', name: 'Kobe Bryant', team: 'Los Angeles Lakers', position: 'SG', number: '24', ppg: '25.0', apg: '4.7', rpg: '5.2', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/977.png', era: 'alltime' },
    { id: 'magic-johnson', name: 'Magic Johnson', team: 'Los Angeles Lakers', position: 'PG', number: '32', ppg: '19.5', apg: '11.2', rpg: '7.2', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/77.png', era: 'alltime' },
    { id: 'kareem-abdul-jabbar', name: 'Kareem Abdul-Jabbar', team: 'Los Angeles Lakers', position: 'C', number: '33', ppg: '24.6', apg: '3.6', rpg: '11.2', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/76003.png', era: 'alltime' },
    { id: 'shaquille-oneal', name: "Shaquille O'Neal", team: 'Los Angeles Lakers', position: 'C', number: '34', ppg: '23.7', apg: '2.5', rpg: '10.9', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/406.png', era: 'alltime' },
    { id: 'jerry-west', name: 'Jerry West', team: 'Los Angeles Lakers', position: 'SG', number: '44', ppg: '27.0', apg: '6.7', rpg: '5.8', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/76460.png', era: 'alltime' },
    { id: 'elgin-baylor', name: 'Elgin Baylor', team: 'Los Angeles Lakers', position: 'SF', number: '22', ppg: '27.4', apg: '4.3', rpg: '13.5', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/75994.png', era: 'alltime' },
    { id: 'james-worthy', name: 'James Worthy', team: 'Los Angeles Lakers', position: 'SF', number: '42', ppg: '17.6', apg: '3.0', rpg: '5.1', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/77151.png', era: 'alltime' },
    { id: 'pau-gasol', name: 'Pau Gasol', team: 'Los Angeles Lakers', position: 'PF', number: '16', ppg: '17.7', apg: '3.5', rpg: '9.9', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/2200.png', era: 'alltime' },
  ],

  'Memphis Grizzlies': [
    { id: 'ja-morant', name: 'Ja Morant', team: 'Memphis Grizzlies', position: 'PG', number: '12', ppg: '25.1', apg: '8.1', rpg: '5.6', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/1629630.png', era: 'alltime' },
    { id: 'jaren-jackson-jr', name: 'Jaren Jackson Jr.', team: 'Memphis Grizzlies', position: 'PF', number: '13', ppg: '18.6', apg: '1.6', rpg: '5.5', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/1628991.png', era: 'alltime' },
    { id: 'zach-edey', name: 'Zach Edey', team: 'Memphis Grizzlies', position: 'C', number: '14', ppg: '11.1', apg: '0.8', rpg: '6.9', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/1641737.png', era: 'alltime' },
    { id: 'marc-gasol', name: 'Marc Gasol', team: 'Memphis Grizzlies', position: 'C', number: '33', ppg: '15.6', apg: '3.4', rpg: '7.9', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/201188.png', era: 'alltime' },
    { id: 'zach-randolph', name: 'Zach Randolph', team: 'Memphis Grizzlies', position: 'PF', number: '50', ppg: '17.4', apg: '1.7', rpg: '10.2', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/2216.png', era: 'alltime' },
    { id: 'mike-conley-mem', name: 'Mike Conley', team: 'Memphis Grizzlies', position: 'PG', number: '11', ppg: '14.9', apg: '5.7', rpg: '3.0', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/201144.png', era: 'alltime' },
    { id: 'shareef-abdur-rahim', name: 'Shareef Abdur-Rahim', team: 'Memphis Grizzlies', position: 'PF', number: '3', ppg: '20.4', apg: '2.9', rpg: '8.0', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/959.png', era: 'alltime' },
  ],

  'Miami Heat': [
    { id: 'jimmy-butler', name: 'Jimmy Butler', team: 'Miami Heat', position: 'SF', number: '22', ppg: '18.5', apg: '5.3', rpg: '5.2', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/202710.png', era: 'alltime' },
    { id: 'bam-adebayo', name: 'Bam Adebayo', team: 'Miami Heat', position: 'C', number: '13', ppg: '19.3', apg: '3.4', rpg: '10.4', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/1628389.png', era: 'alltime' },
    { id: 'tyler-herro', name: 'Tyler Herro', team: 'Miami Heat', position: 'SG', number: '14', ppg: '20.8', apg: '4.5', rpg: '5.3', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/1629639.png', era: 'alltime' },
    { id: 'dwyane-wade', name: 'Dwyane Wade', team: 'Miami Heat', position: 'SG', number: '3', ppg: '22.0', apg: '5.4', rpg: '4.7', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/2548.png', era: 'alltime' },
    { id: 'lebron-james-mia', name: 'LeBron James', team: 'Miami Heat', position: 'SF', number: '6', ppg: '26.9', apg: '7.0', rpg: '7.6', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/2544.png', era: 'alltime' },
    { id: 'chris-bosh', name: 'Chris Bosh', team: 'Miami Heat', position: 'PF', number: '1', ppg: '18.0', apg: '1.8', rpg: '7.3', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/2547.png', era: 'alltime' },
    { id: 'alonzo-mourning-mia', name: 'Alonzo Mourning', team: 'Miami Heat', position: 'C', number: '33', ppg: '17.1', apg: '1.0', rpg: '8.5', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/177.png', era: 'alltime' },
    { id: 'tim-hardaway', name: 'Tim Hardaway', team: 'Miami Heat', position: 'PG', number: '10', ppg: '17.3', apg: '7.9', rpg: '3.3', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/663.png', era: 'alltime' },
  ],

  'Milwaukee Bucks': [
    { id: 'giannis-antetokounmpo', name: 'Giannis Antetokounmpo', team: 'Milwaukee Bucks', position: 'PF', number: '34', ppg: '29.9', apg: '5.8', rpg: '11.6', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/203507.png', era: 'alltime' },
    { id: 'damian-lillard', name: 'Damian Lillard', team: 'Milwaukee Bucks', position: 'PG', number: '0', ppg: '25.2', apg: '6.7', rpg: '4.2', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/203081.png', era: 'alltime' },
    { id: 'khris-middleton', name: 'Khris Middleton', team: 'Milwaukee Bucks', position: 'SF', number: '22', ppg: '18.7', apg: '4.9', rpg: '5.3', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/203114.png', era: 'alltime' },
    { id: 'kareem-abdul-jabbar-mil', name: 'Kareem Abdul-Jabbar', team: 'Milwaukee Bucks', position: 'C', number: '33', ppg: '30.4', apg: '4.3', rpg: '15.3', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/76003.png', era: 'alltime' },
    { id: 'oscar-robertson', name: 'Oscar Robertson', team: 'Milwaukee Bucks', position: 'PG', number: '1', ppg: '25.7', apg: '9.5', rpg: '7.5', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/76139.png', era: 'alltime' },
    { id: 'ray-allen-mil', name: 'Ray Allen', team: 'Milwaukee Bucks', position: 'SG', number: '34', ppg: '19.6', apg: '3.7', rpg: '4.5', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/951.png', era: 'alltime' },
    { id: 'sidney-moncrief', name: 'Sidney Moncrief', team: 'Milwaukee Bucks', position: 'SG', number: '4', ppg: '15.6', apg: '3.6', rpg: '4.7', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/175.png', era: 'alltime' },
  ],

  'Minnesota Timberwolves': [
    { id: 'anthony-edwards', name: 'Anthony Edwards', team: 'Minnesota Timberwolves', position: 'SG', number: '5', ppg: '25.9', apg: '5.1', rpg: '5.4', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/1630162.png', era: 'alltime' },
    { id: 'karl-anthony-towns', name: 'Karl-Anthony Towns', team: 'Minnesota Timberwolves', position: 'C', number: '32', ppg: '22.9', apg: '3.2', rpg: '10.8', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/1626157.png', era: 'alltime' },
    { id: 'rudy-gobert', name: 'Rudy Gobert', team: 'Minnesota Timberwolves', position: 'C', number: '27', ppg: '14.0', apg: '1.3', rpg: '12.9', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/203497.png', era: 'alltime' },
    { id: 'kevin-garnett-min', name: 'Kevin Garnett', team: 'Minnesota Timberwolves', position: 'PF', number: '21', ppg: '19.8', apg: '4.3', rpg: '10.9', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/708.png', era: 'alltime' },
    { id: 'kevin-love-min', name: 'Kevin Love', team: 'Minnesota Timberwolves', position: 'PF', number: '42', ppg: '19.2', apg: '2.5', rpg: '12.2', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/201567.png', era: 'alltime' },
    { id: 'andrew-wiggins-min', name: 'Andrew Wiggins', team: 'Minnesota Timberwolves', position: 'SF', number: '22', ppg: '19.7', apg: '2.4', rpg: '4.3', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/203952.png', era: 'alltime' },
    { id: 'sam-cassell-min', name: 'Sam Cassell', team: 'Minnesota Timberwolves', position: 'PG', number: '19', ppg: '17.7', apg: '7.0', rpg: '2.7', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/795.png', era: 'alltime' },
  ],

  'New Orleans Pelicans': [
    { id: 'zion-williamson', name: 'Zion Williamson', team: 'New Orleans Pelicans', position: 'PF', number: '1', ppg: '24.6', apg: '3.7', rpg: '6.6', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/1629627.png', era: 'alltime' },
    { id: 'brandon-ingram', name: 'Brandon Ingram', team: 'New Orleans Pelicans', position: 'SF', number: '14', ppg: '20.8', apg: '5.1', rpg: '5.1', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/1627742.png', era: 'alltime' },
    { id: 'dejounte-murray-nop', name: 'Dejounte Murray', team: 'New Orleans Pelicans', position: 'PG', number: '5', ppg: '15.3', apg: '7.7', rpg: '5.3', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/1627749.png', era: 'alltime' },
    { id: 'chris-paul-nop', name: 'Chris Paul', team: 'New Orleans Pelicans', position: 'PG', number: '3', ppg: '18.7', apg: '9.9', rpg: '4.5', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/101108.png', era: 'alltime' },
    { id: 'anthony-davis-nop', name: 'Anthony Davis', team: 'New Orleans Pelicans', position: 'PF', number: '23', ppg: '23.7', apg: '2.0', rpg: '10.5', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/203076.png', era: 'alltime' },
    { id: 'pete-maravich', name: 'Pete Maravich', team: 'New Orleans Pelicans', position: 'PG', number: '7', ppg: '24.2', apg: '5.4', rpg: '4.2', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/76107.png', era: 'alltime' },
    { id: 'baron-davis', name: 'Baron Davis', team: 'New Orleans Pelicans', position: 'PG', number: '1', ppg: '17.1', apg: '7.5', rpg: '4.3', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/1892.png', era: 'alltime' },
  ],

  'New York Knicks': [
    { id: 'jalen-brunson', name: 'Jalen Brunson', team: 'New York Knicks', position: 'PG', number: '11', ppg: '28.7', apg: '6.7', rpg: '3.6', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/1628973.png', era: 'alltime' },
    { id: 'karl-anthony-towns-nyk', name: 'Karl-Anthony Towns', team: 'New York Knicks', position: 'C', number: '32', ppg: '22.9', apg: '3.2', rpg: '10.8', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/1626157.png', era: 'alltime' },
    { id: 'og-anunoby', name: 'OG Anunoby', team: 'New York Knicks', position: 'SF', number: '8', ppg: '16.4', apg: '2.8', rpg: '4.9', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/1628384.png', era: 'alltime' },
    { id: 'patrick-ewing', name: 'Patrick Ewing', team: 'New York Knicks', position: 'C', number: '33', ppg: '21.0', apg: '1.9', rpg: '9.8', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/121.png', era: 'alltime' },
    { id: 'walt-frazier', name: 'Walt Frazier', team: 'New York Knicks', position: 'PG', number: '10', ppg: '18.9', apg: '6.1', rpg: '5.9', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/76022.png', era: 'alltime' },
    { id: 'willis-reed', name: 'Willis Reed', team: 'New York Knicks', position: 'C', number: '19', ppg: '18.7', apg: '1.8', rpg: '12.9', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/76163.png', era: 'alltime' },
    { id: 'carmelo-anthony', name: 'Carmelo Anthony', team: 'New York Knicks', position: 'SF', number: '7', ppg: '22.5', apg: '2.7', rpg: '6.2', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/2546.png', era: 'alltime' },
    { id: 'bernard-king', name: 'Bernard King', team: 'New York Knicks', position: 'SF', number: '30', ppg: '22.5', apg: '3.1', rpg: '5.4', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/76054.png', era: 'alltime' },
  ],

  'Oklahoma City Thunder': [
    { id: 'shai-gilgeous-alexander', name: 'Shai Gilgeous-Alexander', team: 'Oklahoma City Thunder', position: 'PG', number: '2', ppg: '30.1', apg: '6.2', rpg: '5.5', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/1628983.png', era: 'alltime' },
    { id: 'jalen-williams-okc', name: 'Jalen Williams', team: 'Oklahoma City Thunder', position: 'SF', number: '8', ppg: '19.1', apg: '4.5', rpg: '5.3', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/1631117.png', era: 'alltime' },
    { id: 'chet-holmgren', name: 'Chet Holmgren', team: 'Oklahoma City Thunder', position: 'C', number: '7', ppg: '16.5', apg: '2.3', rpg: '7.9', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/1641705.png', era: 'alltime' },
    { id: 'kevin-durant-okc', name: 'Kevin Durant', team: 'Oklahoma City Thunder', position: 'SF', number: '35', ppg: '27.4', apg: '3.5', rpg: '7.0', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/201142.png', era: 'alltime' },
    { id: 'russell-westbrook-okc', name: 'Russell Westbrook', team: 'Oklahoma City Thunder', position: 'PG', number: '0', ppg: '23.0', apg: '8.3', rpg: '7.0', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/201566.png', era: 'alltime' },
    { id: 'james-harden-okc', name: 'James Harden', team: 'Oklahoma City Thunder', position: 'SG', number: '13', ppg: '12.7', apg: '2.1', rpg: '3.1', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/201935.png', era: 'alltime' },
    { id: 'gary-payton-okc', name: 'Gary Payton', team: 'Oklahoma City Thunder', position: 'PG', number: '20', ppg: '16.3', apg: '6.7', rpg: '3.9', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/297.png', era: 'alltime' },
  ],

  'Orlando Magic': [
    { id: 'paolo-banchero', name: 'Paolo Banchero', team: 'Orlando Magic', position: 'PF', number: '5', ppg: '22.6', apg: '5.4', rpg: '6.9', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/1631094.png', era: 'alltime' },
    { id: 'franz-wagner', name: 'Franz Wagner', team: 'Orlando Magic', position: 'SF', number: '22', ppg: '21.5', apg: '5.6', rpg: '5.4', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/1630532.png', era: 'alltime' },
    { id: 'tracy-mcgrady', name: 'Tracy McGrady', team: 'Orlando Magic', position: 'SG', number: '1', ppg: '19.6', apg: '4.4', rpg: '5.6', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/1487.png', era: 'alltime' },
    { id: 'shaquille-oneal-orl', name: "Shaquille O'Neal", team: 'Orlando Magic', position: 'C', number: '32', ppg: '27.2', apg: '2.4', rpg: '12.5', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/406.png', era: 'alltime' },
    { id: 'dwight-howard', name: 'Dwight Howard', team: 'Orlando Magic', position: 'C', number: '12', ppg: '18.4', apg: '1.4', rpg: '13.0', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/2730.png', era: 'alltime' },
    { id: 'penny-hardaway', name: 'Penny Hardaway', team: 'Orlando Magic', position: 'PG', number: '1', ppg: '19.0', apg: '6.3', rpg: '4.7', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/449.png', era: 'alltime' },
    { id: 'nick-anderson', name: 'Nick Anderson', team: 'Orlando Magic', position: 'SG', number: '25', ppg: '15.4', apg: '2.8', rpg: '5.3', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/75983.png', era: 'alltime' },
  ],

  'Philadelphia 76ers': [
    { id: 'joel-embiid', name: 'Joel Embiid', team: 'Philadelphia 76ers', position: 'C', number: '21', ppg: '33.1', apg: '4.2', rpg: '10.2', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/203954.png', era: 'alltime' },
    { id: 'tyrese-maxey', name: 'Tyrese Maxey', team: 'Philadelphia 76ers', position: 'PG', number: '0', ppg: '25.9', apg: '6.2', rpg: '3.7', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/1630178.png', era: 'alltime' },
    { id: 'paul-george-phi', name: 'Paul George', team: 'Philadelphia 76ers', position: 'SF', number: '8', ppg: '20.8', apg: '3.7', rpg: '6.4', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/202331.png', era: 'alltime' },
    { id: 'wilt-chamberlain', name: 'Wilt Chamberlain', team: 'Philadelphia 76ers', position: 'C', number: '13', ppg: '30.1', apg: '4.4', rpg: '22.9', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/76375.png', era: 'alltime' },
    { id: 'allen-iverson', name: 'Allen Iverson', team: 'Philadelphia 76ers', position: 'PG', number: '3', ppg: '26.7', apg: '6.2', rpg: '3.7', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/947.png', era: 'alltime' },
    { id: 'julius-erving', name: 'Julius Erving', team: 'Philadelphia 76ers', position: 'SF', number: '6', ppg: '22.0', apg: '3.9', rpg: '6.7', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/76018.png', era: 'alltime' },
    { id: 'charles-barkley-phi', name: 'Charles Barkley', team: 'Philadelphia 76ers', position: 'PF', number: '34', ppg: '23.3', apg: '3.7', rpg: '11.6', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/787.png', era: 'alltime' },
    { id: 'moses-malone', name: 'Moses Malone', team: 'Philadelphia 76ers', position: 'C', number: '2', ppg: '21.0', apg: '1.3', rpg: '11.8', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/76080.png', era: 'alltime' },
  ],

  'Phoenix Suns': [
    { id: 'kevin-durant', name: 'Kevin Durant', team: 'Phoenix Suns', position: 'PF', number: '35', ppg: '27.3', apg: '4.4', rpg: '7.0', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/201142.png', era: 'alltime' },
    { id: 'devin-booker', name: 'Devin Booker', team: 'Phoenix Suns', position: 'SG', number: '1', ppg: '27.1', apg: '6.9', rpg: '4.5', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/1626164.png', era: 'alltime' },
    { id: 'bradley-beal', name: 'Bradley Beal', team: 'Phoenix Suns', position: 'SG', number: '3', ppg: '22.1', apg: '4.4', rpg: '4.2', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/203078.png', era: 'alltime' },
    { id: 'charles-barkley', name: 'Charles Barkley', team: 'Phoenix Suns', position: 'PF', number: '34', ppg: '22.1', apg: '3.9', rpg: '11.7', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/787.png', era: 'alltime' },
    { id: 'steve-nash', name: 'Steve Nash', team: 'Phoenix Suns', position: 'PG', number: '13', ppg: '14.3', apg: '8.5', rpg: '3.0', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/959.png', era: 'alltime' },
    { id: 'amare-stoudemire', name: "Amar'e Stoudemire", team: 'Phoenix Suns', position: 'PF', number: '1', ppg: '21.4', apg: '1.2', rpg: '8.9', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/2405.png', era: 'alltime' },
    { id: 'shawn-marion', name: 'Shawn Marion', team: 'Phoenix Suns', position: 'SF', number: '31', ppg: '18.4', apg: '2.2', rpg: '10.3', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/1018.png', era: 'alltime' },
    { id: 'walter-davis', name: 'Walter Davis', team: 'Phoenix Suns', position: 'SG', number: '6', ppg: '20.5', apg: '3.5', rpg: '3.4', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/76009.png', era: 'alltime' },
  ],

  'Portland Trail Blazers': [
    { id: 'anfernee-simons', name: 'Anfernee Simons', team: 'Portland Trail Blazers', position: 'SG', number: '1', ppg: '21.2', apg: '5.5', rpg: '3.6', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/1629014.png', era: 'alltime' },
    { id: 'scoot-henderson', name: 'Scoot Henderson', team: 'Portland Trail Blazers', position: 'PG', number: '00', ppg: '13.5', apg: '5.4', rpg: '3.1', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/1641706.png', era: 'alltime' },
    { id: 'clyde-drexler', name: 'Clyde Drexler', team: 'Portland Trail Blazers', position: 'SG', number: '22', ppg: '20.4', apg: '5.6', rpg: '6.1', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/108.png', era: 'alltime' },
    { id: 'bill-walton', name: 'Bill Walton', team: 'Portland Trail Blazers', position: 'C', number: '32', ppg: '17.1', apg: '4.4', rpg: '13.5', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/76410.png', era: 'alltime' },
    { id: 'damian-lillard-por', name: 'Damian Lillard', team: 'Portland Trail Blazers', position: 'PG', number: '0', ppg: '25.2', apg: '6.7', rpg: '4.2', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/203081.png', era: 'alltime' },
    { id: 'lamarcus-aldridge', name: 'LaMarcus Aldridge', team: 'Portland Trail Blazers', position: 'PF', number: '12', ppg: '19.4', apg: '2.0', rpg: '8.4', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/200746.png', era: 'alltime' },
    { id: 'rasheed-wallace', name: 'Rasheed Wallace', team: 'Portland Trail Blazers', position: 'PF', number: '30', ppg: '16.0', apg: '2.0', rpg: '6.8', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/1007.png', era: 'alltime' },
  ],

  'Sacramento Kings': [
    { id: 'domantas-sabonis', name: 'Domantas Sabonis', team: 'Sacramento Kings', position: 'C', number: '10', ppg: '19.4', apg: '7.3', rpg: '13.7', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/1627734.png', era: 'alltime' },
    { id: 'deaaron-fox', name: "De'Aaron Fox", team: 'Sacramento Kings', position: 'PG', number: '5', ppg: '26.6', apg: '6.1', rpg: '4.6', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/1628368.png', era: 'alltime' },
    { id: 'demaramar-derozan', name: 'DeMar DeRozan', team: 'Sacramento Kings', position: 'SF', number: '10', ppg: '24.5', apg: '5.2', rpg: '4.0', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/201942.png', era: 'alltime' },
    { id: 'oscar-robertson-sac', name: 'Oscar Robertson', team: 'Sacramento Kings', position: 'PG', number: '14', ppg: '29.3', apg: '10.4', rpg: '10.0', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/76139.png', era: 'alltime' },
    { id: 'chris-webber', name: 'Chris Webber', team: 'Sacramento Kings', position: 'PF', number: '4', ppg: '23.5', apg: '4.8', rpg: '10.6', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/965.png', era: 'alltime' },
    { id: 'mitch-richmond', name: 'Mitch Richmond', team: 'Sacramento Kings', position: 'SG', number: '2', ppg: '21.7', apg: '3.0', rpg: '3.5', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/249.png', era: 'alltime' },
    { id: 'demarcus-cousins', name: 'DeMarcus Cousins', team: 'Sacramento Kings', position: 'C', number: '15', ppg: '21.1', apg: '2.9', rpg: '10.8', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/202326.png', era: 'alltime' },
  ],

  'San Antonio Spurs': [
    { id: 'victor-wembanyama', name: 'Victor Wembanyama', team: 'San Antonio Spurs', position: 'C', number: '1', ppg: '21.4', apg: '3.9', rpg: '10.6', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/1641705.png', era: 'alltime' },
    { id: 'tim-duncan', name: 'Tim Duncan', team: 'San Antonio Spurs', position: 'PF', number: '21', ppg: '19.0', apg: '3.0', rpg: '10.8', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/1495.png', era: 'alltime' },
    { id: 'david-robinson', name: 'David Robinson', team: 'San Antonio Spurs', position: 'C', number: '50', ppg: '21.1', apg: '2.5', rpg: '10.6', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/228.png', era: 'alltime' },
    { id: 'tony-parker', name: 'Tony Parker', team: 'San Antonio Spurs', position: 'PG', number: '9', ppg: '16.5', apg: '5.7', rpg: '2.9', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/2225.png', era: 'alltime' },
    { id: 'manu-ginobili', name: 'Manu Ginobili', team: 'San Antonio Spurs', position: 'SG', number: '20', ppg: '13.3', apg: '3.8', rpg: '3.5', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/1938.png', era: 'alltime' },
    { id: 'kawhi-leonard-sas', name: 'Kawhi Leonard', team: 'San Antonio Spurs', position: 'SF', number: '2', ppg: '16.3', apg: '2.3', rpg: '6.2', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/202695.png', era: 'alltime' },
    { id: 'george-gervin', name: 'George Gervin', team: 'San Antonio Spurs', position: 'SG', number: '44', ppg: '25.1', apg: '2.6', rpg: '5.3', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/76025.png', era: 'alltime' },
  ],

  'Toronto Raptors': [
    { id: 'scottie-barnes', name: 'Scottie Barnes', team: 'Toronto Raptors', position: 'PF', number: '4', ppg: '19.9', apg: '6.1', rpg: '8.2', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/1630567.png', era: 'alltime' },
    { id: 'rj-barrett', name: 'RJ Barrett', team: 'Toronto Raptors', position: 'SG', number: '9', ppg: '19.2', apg: '4.0', rpg: '5.3', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/1629628.png', era: 'alltime' },
    { id: 'vince-carter', name: 'Vince Carter', team: 'Toronto Raptors', position: 'SG', number: '15', ppg: '16.7', apg: '3.1', rpg: '4.3', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/1713.png', era: 'alltime' },
    { id: 'kawhi-leonard-tor', name: 'Kawhi Leonard', team: 'Toronto Raptors', position: 'SF', number: '2', ppg: '26.6', apg: '3.3', rpg: '7.3', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/202695.png', era: 'alltime' },
    { id: 'kyle-lowry', name: 'Kyle Lowry', team: 'Toronto Raptors', position: 'PG', number: '7', ppg: '17.0', apg: '6.8', rpg: '4.8', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/200768.png', era: 'alltime' },
    { id: 'demar-derozan-tor', name: 'DeMar DeRozan', team: 'Toronto Raptors', position: 'SG', number: '10', ppg: '20.1', apg: '3.4', rpg: '4.3', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/201942.png', era: 'alltime' },
    { id: 'chris-bosh-tor', name: 'Chris Bosh', team: 'Toronto Raptors', position: 'PF', number: '4', ppg: '20.2', apg: '2.3', rpg: '9.4', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/2547.png', era: 'alltime' },
  ],

  'Utah Jazz': [
    { id: 'lauri-markkanen', name: 'Lauri Markkanen', team: 'Utah Jazz', position: 'PF', number: '23', ppg: '23.2', apg: '2.0', rpg: '8.2', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/1628374.png', era: 'alltime' },
    { id: 'collin-sexton', name: 'Collin Sexton', team: 'Utah Jazz', position: 'PG', number: '2', ppg: '18.7', apg: '4.9', rpg: '2.9', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/1629012.png', era: 'alltime' },
    { id: 'john-stockton', name: 'John Stockton', team: 'Utah Jazz', position: 'PG', number: '12', ppg: '13.1', apg: '10.5', rpg: '2.7', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/1227.png', era: 'alltime' },
    { id: 'karl-malone', name: 'Karl Malone', team: 'Utah Jazz', position: 'PF', number: '32', ppg: '25.0', apg: '3.6', rpg: '10.1', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/1121.png', era: 'alltime' },
    { id: 'donovan-mitchell-uta', name: 'Donovan Mitchell', team: 'Utah Jazz', position: 'SG', number: '45', ppg: '23.9', apg: '4.5', rpg: '4.2', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/1628378.png', era: 'alltime' },
    { id: 'rudy-gobert-uta', name: 'Rudy Gobert', team: 'Utah Jazz', position: 'C', number: '27', ppg: '12.3', apg: '1.2', rpg: '11.7', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/203497.png', era: 'alltime' },
    { id: 'pete-maravich-uta', name: 'Pete Maravich', team: 'Utah Jazz', position: 'PG', number: '7', ppg: '25.2', apg: '4.4', rpg: '4.3', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/76107.png', era: 'alltime' },
  ],

  'Washington Wizards': [
    { id: 'jordan-poole', name: 'Jordan Poole', team: 'Washington Wizards', position: 'SG', number: '13', ppg: '17.4', apg: '3.5', rpg: '2.8', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/1629673.png', era: 'alltime' },
    { id: 'kyle-kuzma', name: 'Kyle Kuzma', team: 'Washington Wizards', position: 'PF', number: '33', ppg: '22.2', apg: '4.2', rpg: '6.6', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/1628398.png', era: 'alltime' },
    { id: 'wes-unseld', name: 'Wes Unseld', team: 'Washington Wizards', position: 'C', number: '41', ppg: '10.8', apg: '3.9', rpg: '14.0', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/76391.png', era: 'alltime' },
    { id: 'elvin-hayes', name: 'Elvin Hayes', team: 'Washington Wizards', position: 'PF', number: '11', ppg: '21.0', apg: '1.8', rpg: '12.5', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/76037.png', era: 'alltime' },
    { id: 'john-wall', name: 'John Wall', team: 'Washington Wizards', position: 'PG', number: '2', ppg: '19.0', apg: '9.2', rpg: '4.3', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/202322.png', era: 'alltime' },
    { id: 'gilbert-arenas', name: 'Gilbert Arenas', team: 'Washington Wizards', position: 'PG', number: '0', ppg: '20.7', apg: '5.3', rpg: '4.1', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/2240.png', era: 'alltime' },
    { id: 'bradley-beal-wiz', name: 'Bradley Beal', team: 'Washington Wizards', position: 'SG', number: '3', ppg: '22.1', apg: '4.4', rpg: '4.2', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/203078.png', era: 'alltime' },
  ],
};

// Top 50 famous players shown when "All" teams is selected on All Time tab
const TOP_50_FAMOUS_PLAYERS: PlayerData[] = [
  // Current superstars
  { id: 'lebron-james', name: 'LeBron James', team: 'Los Angeles Lakers', position: 'SF', number: '23', ppg: '25.7', apg: '7.3', rpg: '7.5', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/2544.png', era: 'alltime' },
  { id: 'stephen-curry', name: 'Stephen Curry', team: 'Golden State Warriors', position: 'PG', number: '30', ppg: '24.8', apg: '6.4', rpg: '4.7', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/201939.png', era: 'alltime' },
  { id: 'kevin-durant', name: 'Kevin Durant', team: 'Phoenix Suns', position: 'PF', number: '35', ppg: '27.3', apg: '4.4', rpg: '7.0', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/201142.png', era: 'alltime' },
  { id: 'giannis-antetokounmpo', name: 'Giannis Antetokounmpo', team: 'Milwaukee Bucks', position: 'PF', number: '34', ppg: '29.9', apg: '5.8', rpg: '11.6', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/203507.png', era: 'alltime' },
  { id: 'luka-doncic', name: 'Luka Doncic', team: 'Dallas Mavericks', position: 'PG', number: '77', ppg: '28.4', apg: '8.7', rpg: '9.1', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/1629029.png', era: 'alltime' },
  { id: 'nikola-jokic', name: 'Nikola Jokic', team: 'Denver Nuggets', position: 'C', number: '15', ppg: '24.5', apg: '9.8', rpg: '11.8', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/203999.png', era: 'alltime' },
  { id: 'joel-embiid', name: 'Joel Embiid', team: 'Philadelphia 76ers', position: 'C', number: '21', ppg: '33.1', apg: '4.2', rpg: '10.2', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/203954.png', era: 'alltime' },
  { id: 'kawhi-leonard', name: 'Kawhi Leonard', team: 'Los Angeles Clippers', position: 'SF', number: '2', ppg: '24.8', apg: '3.0', rpg: '6.5', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/202695.png', era: 'alltime' },

  // Legends
  { id: 'michael-jordan', name: 'Michael Jordan', team: 'Chicago Bulls', position: 'SG', number: '23', ppg: '30.1', apg: '5.3', rpg: '6.2', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/893.png', era: 'alltime' },
  { id: 'kobe-bryant', name: 'Kobe Bryant', team: 'Los Angeles Lakers', position: 'SG', number: '24', ppg: '25.0', apg: '4.7', rpg: '5.2', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/977.png', era: 'alltime' },
  { id: 'magic-johnson', name: 'Magic Johnson', team: 'Los Angeles Lakers', position: 'PG', number: '32', ppg: '19.5', apg: '11.2', rpg: '7.2', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/77.png', era: 'alltime' },
  { id: 'larry-bird', name: 'Larry Bird', team: 'Boston Celtics', position: 'SF', number: '33', ppg: '24.3', apg: '6.3', rpg: '10.0', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/7.png', era: 'alltime' },
  { id: 'kareem-abdul-jabbar', name: 'Kareem Abdul-Jabbar', team: 'Los Angeles Lakers', position: 'C', number: '33', ppg: '24.6', apg: '3.6', rpg: '11.2', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/76003.png', era: 'alltime' },
  { id: 'tim-duncan', name: 'Tim Duncan', team: 'San Antonio Spurs', position: 'PF', number: '21', ppg: '19.0', apg: '3.0', rpg: '10.8', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/1495.png', era: 'alltime' },
  { id: 'shaquille-oneal', name: "Shaquille O'Neal", team: 'Los Angeles Lakers', position: 'C', number: '34', ppg: '23.7', apg: '2.5', rpg: '10.9', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/406.png', era: 'alltime' },
  { id: 'wilt-chamberlain', name: 'Wilt Chamberlain', team: 'Philadelphia 76ers', position: 'C', number: '13', ppg: '30.1', apg: '4.4', rpg: '22.9', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/76375.png', era: 'alltime' },
  { id: 'bill-russell', name: 'Bill Russell', team: 'Boston Celtics', position: 'C', number: '6', ppg: '15.1', apg: '4.3', rpg: '22.5', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/76194.png', era: 'alltime' },
  { id: 'hakeem-olajuwon', name: 'Hakeem Olajuwon', team: 'Houston Rockets', position: 'C', number: '34', ppg: '21.8', apg: '2.5', rpg: '11.1', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/165.png', era: 'alltime' },
  { id: 'dirk-nowitzki', name: 'Dirk Nowitzki', team: 'Dallas Mavericks', position: 'PF', number: '41', ppg: '20.7', apg: '2.4', rpg: '7.5', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/1717.png', era: 'alltime' },
  { id: 'charles-barkley', name: 'Charles Barkley', team: 'Phoenix Suns', position: 'PF', number: '34', ppg: '22.1', apg: '3.9', rpg: '11.7', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/787.png', era: 'alltime' },
  { id: 'kevin-garnett', name: 'Kevin Garnett', team: 'Boston Celtics', position: 'PF', number: '5', ppg: '17.8', apg: '3.7', rpg: '10.0', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/708.png', era: 'alltime' },
  { id: 'oscar-robertson', name: 'Oscar Robertson', team: 'Milwaukee Bucks', position: 'PG', number: '1', ppg: '25.7', apg: '9.5', rpg: '7.5', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/76139.png', era: 'alltime' },
  { id: 'jerry-west', name: 'Jerry West', team: 'Los Angeles Lakers', position: 'SG', number: '44', ppg: '27.0', apg: '6.7', rpg: '5.8', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/76460.png', era: 'alltime' },
  { id: 'allen-iverson', name: 'Allen Iverson', team: 'Philadelphia 76ers', position: 'PG', number: '3', ppg: '26.7', apg: '6.2', rpg: '3.7', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/947.png', era: 'alltime' },
  { id: 'dwyane-wade', name: 'Dwyane Wade', team: 'Miami Heat', position: 'SG', number: '3', ppg: '22.0', apg: '5.4', rpg: '4.7', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/2548.png', era: 'alltime' },
  { id: 'steve-nash', name: 'Steve Nash', team: 'Phoenix Suns', position: 'PG', number: '13', ppg: '14.3', apg: '8.5', rpg: '3.0', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/959.png', era: 'alltime' },
  { id: 'chris-paul', name: 'Chris Paul', team: 'Golden State Warriors', position: 'PG', number: '3', ppg: '17.9', apg: '9.5', rpg: '4.5', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/101108.png', era: 'alltime' },
  { id: 'carmelo-anthony', name: 'Carmelo Anthony', team: 'New York Knicks', position: 'SF', number: '7', ppg: '22.5', apg: '2.7', rpg: '6.2', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/2546.png', era: 'alltime' },
  { id: 'paul-pierce', name: 'Paul Pierce', team: 'Boston Celtics', position: 'SF', number: '34', ppg: '19.7', apg: '3.5', rpg: '5.6', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/1718.png', era: 'alltime' },
  { id: 'ray-allen', name: 'Ray Allen', team: 'Boston Celtics', position: 'SG', number: '20', ppg: '18.9', apg: '3.4', rpg: '4.1', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/951.png', era: 'alltime' },
  { id: 'vince-carter', name: 'Vince Carter', team: 'Toronto Raptors', position: 'SG', number: '15', ppg: '16.7', apg: '3.1', rpg: '4.3', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/1713.png', era: 'alltime' },
  { id: 'tracy-mcgrady', name: 'Tracy McGrady', team: 'Orlando Magic', position: 'SG', number: '1', ppg: '19.6', apg: '4.4', rpg: '5.6', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/1487.png', era: 'alltime' },
  { id: 'anthony-davis', name: 'Anthony Davis', team: 'Los Angeles Lakers', position: 'PF', number: '3', ppg: '24.0', apg: '2.5', rpg: '10.4', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/203076.png', era: 'alltime' },
  { id: 'james-harden', name: 'James Harden', team: 'LA Clippers', position: 'SG', number: '1', ppg: '24.1', apg: '7.0', rpg: '5.6', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/201935.png', era: 'alltime' },
  { id: 'russell-westbrook', name: 'Russell Westbrook', team: 'LA Clippers', position: 'PG', number: '0', ppg: '21.7', apg: '8.4', rpg: '7.1', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/201566.png', era: 'alltime' },
  { id: 'damian-lillard', name: 'Damian Lillard', team: 'Milwaukee Bucks', position: 'PG', number: '0', ppg: '25.2', apg: '6.7', rpg: '4.2', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/203081.png', era: 'alltime' },
  { id: 'kyrie-irving', name: 'Kyrie Irving', team: 'Dallas Mavericks', position: 'PG', number: '11', ppg: '23.6', apg: '5.7', rpg: '4.0', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/202681.png', era: 'alltime' },
  { id: 'paul-george', name: 'Paul George', team: 'LA Clippers', position: 'SF', number: '13', ppg: '20.8', apg: '3.7', rpg: '6.4', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/202331.png', era: 'alltime' },
  { id: 'jimmy-butler', name: 'Jimmy Butler', team: 'Miami Heat', position: 'SF', number: '22', ppg: '18.5', apg: '5.3', rpg: '5.2', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/202710.png', era: 'alltime' },
  { id: 'klay-thompson', name: 'Klay Thompson', team: 'Golden State Warriors', position: 'SG', number: '11', ppg: '19.6', apg: '2.3', rpg: '3.5', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/202691.png', era: 'alltime' },
  { id: 'john-stockton', name: 'John Stockton', team: 'Utah Jazz', position: 'PG', number: '12', ppg: '13.1', apg: '10.5', rpg: '2.7', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/1227.png', era: 'alltime' },
  { id: 'karl-malone', name: 'Karl Malone', team: 'Utah Jazz', position: 'PF', number: '32', ppg: '25.0', apg: '3.6', rpg: '10.1', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/1121.png', era: 'alltime' },
  { id: 'scottie-pippen', name: 'Scottie Pippen', team: 'Chicago Bulls', position: 'SF', number: '33', ppg: '16.1', apg: '5.2', rpg: '6.4', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/1152.png', era: 'alltime' },
  { id: 'patrick-ewing', name: 'Patrick Ewing', team: 'New York Knicks', position: 'C', number: '33', ppg: '21.0', apg: '1.9', rpg: '9.8', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/121.png', era: 'alltime' },
  { id: 'reggie-miller', name: 'Reggie Miller', team: 'Indiana Pacers', position: 'SG', number: '31', ppg: '18.2', apg: '3.0', rpg: '3.0', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/1166.png', era: 'alltime' },
  { id: 'gary-payton', name: 'Gary Payton', team: 'Seattle SuperSonics', position: 'PG', number: '20', ppg: '16.3', apg: '6.7', rpg: '3.9', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/297.png', era: 'alltime' },
  { id: 'david-robinson', name: 'David Robinson', team: 'San Antonio Spurs', position: 'C', number: '50', ppg: '21.1', apg: '2.5', rpg: '10.6', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/228.png', era: 'alltime' },
  { id: 'clyde-drexler', name: 'Clyde Drexler', team: 'Portland Trail Blazers', position: 'SG', number: '22', ppg: '20.4', apg: '5.6', rpg: '6.1', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/108.png', era: 'alltime' },
  { id: 'isiah-thomas', name: 'Isiah Thomas', team: 'Detroit Pistons', position: 'PG', number: '11', ppg: '19.2', apg: '9.3', rpg: '3.6', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/313.png', era: 'alltime' },
  { id: 'jason-kidd', name: 'Jason Kidd', team: 'Dallas Mavericks', position: 'PG', number: '5', ppg: '12.6', apg: '8.7', rpg: '6.3', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/467.png', era: 'alltime' },
];

export default function PlayerRankingsClient() {
  const [currentPlayers, setCurrentPlayers] = useState<PlayerData[]>([]);
  const [alltimePlayers, setAlltimePlayers] = useState<PlayerData[]>(TOP_50_FAMOUS_PLAYERS);
  const [isLoadingPlayers, setIsLoadingPlayers] = useState(true);
  const [isLoadingAlltime, setIsLoadingAlltime] = useState(false);
  const [alltimeLoaded, setAlltimeLoaded] = useState(true);

  // Tab and filter state
  const [activeTab, setActiveTab] = useState<'current' | 'alltime'>('current');
  const [selectedPosition, setSelectedPosition] = useState<string>('All');
  const [selectedTeam, setSelectedTeam] = useState<string>('All');

  // Combined players based on active tab and selected team
  const allPlayers = activeTab === 'current'
    ? currentPlayers
    : selectedTeam !== 'All' && TEAM_FAMOUS_PLAYERS[selectedTeam]
      ? [...currentPlayers, ...TEAM_FAMOUS_PLAYERS[selectedTeam]]
      : [...currentPlayers, ...alltimePlayers];

  // Add player modal state
  const [showAddPlayerModal, setShowAddPlayerModal] = useState(false);
  const [showSearchPlayerModal, setShowSearchPlayerModal] = useState(false);
  const [playerSearchQuery, setPlayerSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PlayerData[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [allTimeDatabase, setAllTimeDatabase] = useState<PlayerData[]>([]);
  const [databaseLoaded, setDatabaseLoaded] = useState(false);
  const [newPlayer, setNewPlayer] = useState({
    firstName: '',
    lastName: '',
    number: '',
    team: '',
    position: 'PG',
    height: '',
    weight: '',
    ppg: '0.0',
    apg: '0.0',
    rpg: '0.0',
  });

  // Load current players on mount (fast initial load from API)
  useEffect(() => {
    const loadPlayers = async () => {
      setIsLoadingPlayers(true);
      try {
        const players = await getCurrentPlayers();
        // Deduplicate players by ID
        const uniquePlayers = players.filter((player, index, self) =>
          index === self.findIndex(p => p.id === player.id)
        );
        setCurrentPlayers(uniquePlayers);
      } catch (error) {
        console.error('Failed to load players:', error);
      } finally {
        setIsLoadingPlayers(false);
      }
    };

    loadPlayers();
  }, []);

  // Filter players based on tab, position, and team (used by reset function)
  const filteredPlayers = allPlayers.filter(player => {
    const matchesTab = activeTab === 'current' ? player.era === 'current' : true;
    const matchesPosition = selectedPosition === 'All' ? true : player.position === selectedPosition;

    // For all-time tab with team filter: only show all-time players (era === 'alltime')
    const matchesTeam = selectedTeam === 'All' ? true : (
      player.team.toLowerCase().includes(selectedTeam.toLowerCase()) &&
      (activeTab === 'current' || player.era === 'alltime')
    );

    return matchesTab && matchesPosition && matchesTeam;
  });

  // Separate rankings for current and all-time (preserves user's work when switching tabs)
  const [currentRankings, setCurrentRankings] = useState<RankedPlayer[]>([]);
  const [alltimeRankings, setAlltimeRankings] = useState<RankedPlayer[]>([]);

  // Active rankings based on current tab
  const rankings = activeTab === 'current' ? currentRankings : alltimeRankings;
  const setRankings = activeTab === 'current' ? setCurrentRankings : setAlltimeRankings;

  // Apply filters to rankings for display (preserves user's custom order)
  const displayedRankings = rankings.filter(rankedPlayer => {
    const matchesPosition = selectedPosition === 'All' || rankedPlayer.player.position === selectedPosition;

    // For all-time tab with team filter: only show all-time players (era === 'alltime')
    const matchesTeam = selectedTeam === 'All' || (
      rankedPlayer.player.team.toLowerCase().includes(selectedTeam.toLowerCase()) &&
      (activeTab === 'current' || rankedPlayer.player.era === 'alltime')
    );

    return matchesPosition && matchesTeam;
  });

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const isDropping = useRef(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [rankInput, setRankInput] = useState('');
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [history, setHistory] = useState<RankedPlayer[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [imageDataUrls, setImageDataUrls] = useState<Record<string, string>>({});
  const [imageObjects, setImageObjects] = useState<Record<string, HTMLImageElement>>({});
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [pfsnLogoImage, setPfsnLogoImage] = useState<HTMLImageElement | null>(null);
  const downloadMenuRef = useRef<HTMLDivElement>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<25 | 50 | 100>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('playerRankingsItemsPerPage');
      return (saved === '25' || saved === '50' || saved === '100') ? Number(saved) as 25 | 50 | 100 : 25;
    }
    return 25;
  });

  // Save/Load state
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [savedRankings, setSavedRankings] = useState<Array<{ name: string; date: string; rankings: RankedPlayer[] }>>([]);
  const [saveNameInput, setSaveNameInput] = useState('');

  // Helper function to save to history
  const saveToHistory = (newRankings: RankedPlayer[]) => {
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

  // Initialize current players rankings when current players load
  useEffect(() => {
    if (currentPlayers.length === 0 || currentRankings.length > 0) return; // Only initialize once

    // Get top 100 current players
    const top100Players = currentPlayers.filter(player => CURRENT_TOP_100_IDS.includes(player.id));
    const sortedPlayers = sortPlayersByRanking(top100Players, true);

    const initialRankings = sortedPlayers.map((player, index) => ({
      rank: index + 1,
      player
    }));

    setCurrentRankings(initialRankings);
    setHistory([initialRankings]);
    setHistoryIndex(0);
  }, [currentPlayers]);

  // Initialize all-time rankings when all-time players load
  useEffect(() => {
    if (alltimeRankings.length > 0) return; // Only initialize once

    // Combine current and all-time players, deduplicate
    const combined = [...currentPlayers, ...alltimePlayers];
    const uniqueMap = new Map<string, PlayerData>();
    combined.forEach(player => {
      if (!uniqueMap.has(player.id)) {
        uniqueMap.set(player.id, player);
      }
    });
    const allPlayers = Array.from(uniqueMap.values());

    if (allPlayers.length === 0) return;

    // Get top 100 all-time players
    const top100Players = allPlayers.filter(player => ALLTIME_TOP_100_IDS.includes(player.id));
    const sortedPlayers = sortPlayersByRanking(top100Players, false);

    const initialRankings = sortedPlayers.map((player, index) => ({
      rank: index + 1,
      player
    }));

    setAlltimeRankings(initialRankings);
  }, [currentPlayers, alltimePlayers]);

  // Initialize history with initial rankings
  useEffect(() => {
    if (history.length === 0) {
      setHistory([rankings]);
      setHistoryIndex(0);
    }
  }, []);

  // Pagination calculations (using filtered rankings for display)
  const totalPlayers = displayedRankings.length;
  const totalPages = Math.ceil(totalPlayers / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRankings = displayedRankings.slice(startIndex, endIndex);

  // Reset to page 1 when filters or tab change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedPosition, selectedTeam, activeTab]);

  // Handle items per page change
  const handleItemsPerPageChange = (value: 25 | 50 | 100) => {
    setItemsPerPage(value);
    setCurrentPage(1);
    if (typeof window !== 'undefined') {
      localStorage.setItem('playerRankingsItemsPerPage', String(value));
    }
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 7;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 4) {
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  // Pre-load player images as data URLs and Image objects when current players load
  useEffect(() => {
    if (currentPlayers.length === 0) return;

    const preloadImages = async () => {
      const urls: Record<string, string> = { ...imageDataUrls };
      const images: Record<string, HTMLImageElement> = { ...imageObjects };

      // Load PFSN logo if not already loaded
      if (!pfsnLogoImage) {
        const pfsnImg = document.createElement('img');
        await new Promise<void>((resolve) => {
          pfsnImg.onload = () => resolve();
          pfsnImg.onerror = () => resolve();
          pfsnImg.src = PFSN_LOGO_DATA_URL;
        });
        setPfsnLogoImage(pfsnImg);
      }

      // Only preload images for players not already loaded
      const playersToLoad = currentPlayers.filter(p => !urls[p.id]);

      await Promise.all(
        playersToLoad.map(async (player) => {
          try {
            const proxyUrl = `/nfl-hq/api/proxy-image?url=${encodeURIComponent(player.imageUrl)}`;
            const response = await fetch(proxyUrl);
            if (!response.ok) throw new Error('Failed to fetch image');

            const blob = await response.blob();
            const dataUrl = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL(blob);
            });

            urls[player.id] = dataUrl;

            // Create and load Image object for canvas drawing
            const img = document.createElement('img');
            await new Promise<void>((resolve) => {
              img.onload = () => resolve();
              img.onerror = () => resolve(); // Continue even if image fails
              img.src = dataUrl;
            });
            images[player.id] = img;
          } catch (error) {
            console.error(`Failed to preload image for ${player.name}:`, error);
          }
        })
      );

      setImageDataUrls(urls);
      setImageObjects(images);
      setImagesLoaded(true);
      console.log('Player images preloaded:', Object.keys(urls).length);
    };

    preloadImages();
  }, [currentPlayers]);

  // Load rankings from URL on mount
  useEffect(() => {
    if (currentPlayers.length === 0) return;

    const params = new URLSearchParams(window.location.search);
    const rankingsParam = params.get('rankings');

    if (rankingsParam) {
      try {
        const playerIds = rankingsParam.split(',');
        const rankedPlayers: RankedPlayer[] = [];

        // Map player IDs to player objects
        playerIds.forEach((playerId, index) => {
          const player = currentPlayers.find(p => p.id === playerId);
          if (player) {
            rankedPlayers.push({
              rank: index + 1,
              player
            });
          }
        });

        // Add any missing players at the end
        currentPlayers.forEach(player => {
          if (!rankedPlayers.find(r => r.player.id === player.id)) {
            rankedPlayers.push({
              rank: rankedPlayers.length + 1,
              player
            });
          }
        });

        if (rankedPlayers.length > 0) {
          setRankings(rankedPlayers);
          setHistory([rankedPlayers]);
          setHistoryIndex(0);
        }
      } catch (error) {
        console.error('Error loading rankings from URL:', error);
      }
    }
  }, [currentPlayers]);

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    isDropping.current = false;
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
    setDragOverIndex(null);
    isDropping.current = false;
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverIndex(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, dropDisplayIndex: number) => {
    e.preventDefault();
    e.stopPropagation();

    // Prevent multiple drops
    if (isDropping.current) {
      return;
    }
    isDropping.current = true;

    // Get the dragged display index from dataTransfer
    const dragDisplayIdx = parseInt(e.dataTransfer.getData('text/plain'), 10);

    if (isNaN(dragDisplayIdx) || dragDisplayIdx === dropDisplayIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      isDropping.current = false;
      return;
    }

    // Get the actual player objects from displayed rankings
    const draggedPlayer = displayedRankings[dragDisplayIdx];
    const dropTargetPlayer = displayedRankings[dropDisplayIndex];

    if (!draggedPlayer || !dropTargetPlayer) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      isDropping.current = false;
      return;
    }

    setRankings(prevRankings => {
      // Find real indices in full rankings
      const realDraggedIdx = prevRankings.findIndex(r => r.player.id === draggedPlayer.player.id);
      const realDropIdx = prevRankings.findIndex(r => r.player.id === dropTargetPlayer.player.id);

      if (realDraggedIdx === -1 || realDropIdx === -1) {
        return prevRankings;
      }

      const newRankings = [...prevRankings];
      const draggedItem = newRankings[realDraggedIdx];

      // Remove from old position
      newRankings.splice(realDraggedIdx, 1);

      // Adjust drop index if dragging down
      const adjustedDropIndex = realDraggedIdx < realDropIdx ? realDropIdx - 1 : realDropIdx;

      // Insert at new position
      newRankings.splice(adjustedDropIndex, 0, draggedItem);

      // Update rank numbers
      const updatedRankings = newRankings.map((item, idx) => ({
        ...item,
        rank: idx + 1
      }));

      // Save to history
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(updatedRankings);
      if (newHistory.length > 50) {
        newHistory.shift();
      } else {
        setHistoryIndex(prev => prev + 1);
      }
      setHistory(newHistory);

      return updatedRankings;
    });

    setDraggedIndex(null);
    setDragOverIndex(null);

    // Reset dropping flag after a short delay
    setTimeout(() => {
      isDropping.current = false;
    }, 100);
  }, [history, historyIndex, displayedRankings]);

  const handleRankClick = (index: number) => {
    setEditingIndex(index);
    setRankInput(String(index + 1));
  };

  const handleRankSubmit = (displayIndex: number) => {
    const rankNum = parseInt(rankInput);

    // Validate rank
    if (isNaN(rankNum) || rankNum < 1 || rankNum > rankings.length) {
      setEditingIndex(null);
      setRankInput('');
      return;
    }

    // Get the player from displayed rankings
    const player = displayedRankings[displayIndex];
    if (!player) {
      setEditingIndex(null);
      setRankInput('');
      return;
    }

    // Find the player's real index in full rankings
    const realIndex = rankings.findIndex(r => r.player.id === player.player.id);
    if (realIndex === -1) {
      setEditingIndex(null);
      setRankInput('');
      return;
    }

    // Only trigger change if rank actually changed
    if (rankNum !== realIndex + 1) {
      const newIndex = rankNum - 1;
      const newRankings = [...rankings];
      const item = newRankings[realIndex];

      // Remove from old position
      newRankings.splice(realIndex, 1);
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

  // Save/Load functionality
  const saveRankingsToLocalStorage = () => {
    if (!saveNameInput.trim()) {
      toast.error('Please enter a name for your rankings');
      return;
    }

    if (containsProfanity(saveNameInput)) {
      toast.error('Please use appropriate language for your ranking name');
      return;
    }

    const saved = {
      name: saveNameInput.trim(),
      date: new Date().toISOString(),
      rankings: rankings
    };

    const existing = localStorage.getItem('nba-player-rankings');
    const allSaved = existing ? JSON.parse(existing) : [];
    allSaved.push(saved);

    // Keep only last 10 saves
    if (allSaved.length > 10) {
      allSaved.shift();
    }

    localStorage.setItem('nba-player-rankings', JSON.stringify(allSaved));
    setSaveNameInput('');
    setShowSaveDialog(false);
    loadSavedRankings();
    toast.success('Rankings saved successfully!');
  };

  const loadSavedRankings = () => {
    const saved = localStorage.getItem('nba-player-rankings');
    if (saved) {
      setSavedRankings(JSON.parse(saved));
    }
  };

  const loadRankings = (savedRanking: { name: string; date: string; rankings: RankedPlayer[] }) => {
    setRankings(savedRanking.rankings);
    setHistory([savedRanking.rankings]);
    setHistoryIndex(0);
    setShowLoadDialog(false);
    toast.success(`Loaded "${savedRanking.name}"`);
  };

  const deleteSavedRanking = (index: number) => {
    const saved = localStorage.getItem('nba-player-rankings');
    if (saved) {
      const allSaved = JSON.parse(saved);
      const deletedName = allSaved[index]?.name;
      allSaved.splice(index, 1);
      localStorage.setItem('nba-player-rankings', JSON.stringify(allSaved));
      loadSavedRankings();
      if (deletedName) {
        toast.success(`Deleted "${deletedName}"`);
      }
    }
  };

  // Load saved rankings on mount
  useEffect(() => {
    loadSavedRankings();
  }, []);

  // Generate canvas directly (like NFL approach - much faster!)
  const generateCanvas = (selectedPlayers: RankedPlayer[]) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const canvasWidth = 1000;
    const dpr = 2;

    // Header
    let yPos = 20;
    const headerHeight = 78;

    // Player cards layout
    let gap = 20;
    const containerHeight = 64;
    let playersPerRow = 1;
    let containerWidth = canvasWidth - (gap * 2);

    // Top 30 uses 2 columns for better readability
    if (selectedPlayers.length > 10) {
      playersPerRow = 2;
      containerWidth = (canvasWidth - (gap * 3)) / 2;
    }

    // Calculate dynamic canvas height based on number of rows
    const totalRows = Math.ceil(selectedPlayers.length / playersPerRow);
    const playersContentHeight = totalRows * containerHeight + (totalRows - 1) * gap;
    const footerHeight = 64;
    const bottomPadding = 30; // Extra space before footer
    const canvasHeight = yPos + headerHeight + playersContentHeight + bottomPadding + footerHeight;

    canvas.width = canvasWidth * dpr;
    canvas.height = canvasHeight * dpr;
    ctx.scale(dpr, dpr);

    // Dark background
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Header
    ctx.fillStyle = '#ffffff';
    ctx.font = 'italic 900 38px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    const headerText = 'MY NBA PLAYER RANKINGS';
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
      ctx.font = 'italic 900 32px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      const rankFontSize = 32;
      const rankTextY = containerCenterY + (rankFontSize * 0.35);
      ctx.fillText(String(rankedPlayer.rank), xPos + paddingX, rankTextY);

      const rankWidth = ctx.measureText(String(rankedPlayer.rank)).width;

      // Player name
      ctx.fillStyle = '#000000';
      const playerFontSize = selectedPlayers.length > 10 ? 16 : 20;
      ctx.font = `600 ${playerFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
      const playerTextY = containerCenterY + (playerFontSize * 0.35);

      const playerText = rankedPlayer.player.name;
      ctx.fillText(playerText, xPos + paddingX + rankWidth + 20, playerTextY);

      // Player image
      const img = imageObjects[rankedPlayer.player.id];
      if (img) {
        const imgSize = 56;
        const imgX = xPos + containerWidth - imgSize - 12;
        const imgY = playerYPos + (containerHeight - imgSize) / 2;
        ctx.drawImage(img, imgX, imgY, imgSize, imgSize);
      }
    });

    // Footer
    const footerY = canvasHeight - 64;
    ctx.fillStyle = '#0050A0';
    ctx.fillRect(0, footerY, canvasWidth, 64);

    const footerPadding = 30;
    ctx.fillStyle = '#ffffff';
    ctx.font = '600 16px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillText('nfl-hq.com/player-rankings', footerPadding, footerY + 38);

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
    if (!imagesLoaded) {
      toast.error('Images are still loading. Please wait a moment and try again');
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

      const link = document.createElement('a');
      link.download = `NBA_Player_Rankings_${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();
      toast.success(`Downloaded top ${count} players`);
    } catch (error) {
      console.error('Error generating image:', error);
      toast.error('Failed to generate image. Please try again');
    } finally {
      setIsDownloading(false);
    }
  };


  const resetRankings = () => {
    // Get the appropriate top 100 list
    const top100List = activeTab === 'current' ? CURRENT_TOP_100_IDS : ALLTIME_TOP_100_IDS;

    // Filter to only top 100 players
    const top100Players = filteredPlayers.filter(player => top100List.includes(player.id));

    // Use curated rankings for top 100
    const sortedPlayers = sortPlayersByRanking(top100Players, activeTab === 'current');

    const newRankings = sortedPlayers.map((player, index) => ({
      rank: index + 1,
      player
    }));

    saveToHistory(newRankings);
    setShowResetDialog(false);
  };

  // Handle adding a new player
  const handleAddPlayer = () => {
    if (!newPlayer.firstName || !newPlayer.lastName || !newPlayer.number || !newPlayer.team) {
      toast.error('Please fill in all required fields (First Name, Last Name, Number, Team)');
      return;
    }

    // Check for profanity in names
    if (containsProfanity(newPlayer.firstName) || containsProfanity(newPlayer.lastName)) {
      toast.error('Inappropriate language detected. Please use appropriate player names');
      return;
    }

    const playerData: PlayerData = {
      id: `${newPlayer.firstName.toLowerCase()}-${newPlayer.lastName.toLowerCase()}`,
      name: `${newPlayer.firstName} ${newPlayer.lastName}`,
      team: newPlayer.team,
      position: newPlayer.position,
      number: newPlayer.number,
      ppg: newPlayer.ppg,
      apg: newPlayer.apg,
      rpg: newPlayer.rpg,
      imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/placeholder.png',
      era: 'current',
      height: newPlayer.height || undefined,
      weight: newPlayer.weight || undefined,
    };

    // Insert at the top of the current page
    const insertIndex = (currentPage - 1) * itemsPerPage;
    const newRankings = [...rankings];
    newRankings.splice(insertIndex, 0, {
      rank: insertIndex + 1,
      player: playerData
    });

    // Renumber all ranks
    const updatedRankings = newRankings.map((item, idx) => ({
      ...item,
      rank: idx + 1
    }));

    saveToHistory(updatedRankings);

    // Reset form
    setNewPlayer({
      firstName: '',
      lastName: '',
      number: '',
      team: '',
      position: 'PG',
      height: '',
      weight: '',
      ppg: '0.0',
      apg: '0.0',
      rpg: '0.0',
    });
    setShowAddPlayerModal(false);
    toast.success(`${playerData.name} added to rankings`);
  };

  // Load full all-time database for searching
  const loadAllTimeDatabase = async () => {
    if (databaseLoaded || isSearching) return;

    setIsSearching(true);
    try {
      const players = await getAlltimePlayersPublic();
      setAllTimeDatabase(players);
      setDatabaseLoaded(true);
    } catch (error) {
      console.error('Failed to load all-time database:', error);
      toast.error('Failed to load player database. Please try again');
    } finally {
      setIsSearching(false);
    }
  };

  // Search players in database
  const searchDatabase = (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    const lowerQuery = query.toLowerCase();
    let results = allTimeDatabase.filter(player =>
      player.name.toLowerCase().includes(lowerQuery) ||
      player.team.toLowerCase().includes(lowerQuery)
    );

    // Filter by selected team if one is selected
    if (selectedTeam !== 'All') {
      results = results.filter(player =>
        player.team.toLowerCase().includes(selectedTeam.toLowerCase())
      );
    }

    setSearchResults(results.slice(0, 20)); // Limit to 20 results
  };

  // Add player from search results to rankings
  const addPlayerFromSearch = (player: PlayerData) => {
    // Check if player already exists in rankings
    const exists = rankings.some(r => r.player.id === player.id);
    if (exists) {
      toast.error('This player is already in your rankings');
      return;
    }

    // Insert at the top of the current page
    const insertIndex = (currentPage - 1) * itemsPerPage;
    const newRankings = [...rankings];
    newRankings.splice(insertIndex, 0, {
      rank: insertIndex + 1,
      player: player
    });

    // Renumber all ranks
    const updatedRankings = newRankings.map((item, idx) => ({
      ...item,
      rank: idx + 1
    }));

    saveToHistory(updatedRankings);
    setShowSearchPlayerModal(false);
    setPlayerSearchQuery('');
    setSearchResults([]);
    toast.success(`${player.name} added to rankings`);
  };

  // Remove player from rankings
  const removePlayer = (playerId: string) => {
    const playerToRemove = rankings.find(r => r.player.id === playerId);
    if (!playerToRemove) return;

    const newRankings = rankings.filter(r => r.player.id !== playerId);

    // Renumber all ranks
    const updatedRankings = newRankings.map((item, idx) => ({
      ...item,
      rank: idx + 1
    }));

    saveToHistory(updatedRankings);
    toast.success(`${playerToRemove.player.name} removed from rankings`);
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
      // Escape to clear download menu
      if (e.key === 'Escape') {
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
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
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
        <div className="bg-[#0050A0] text-white pt-[57px] lg:pt-0 pb-4 lg:pb-6">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-8 lg:pt-10">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-3 tracking-tight">
              NFL Player Rankings Builder
            </h1>
            <p className="text-base md:text-lg text-white/95 max-w-2xl">
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
          {/* Loading State */}
          {isLoadingPlayers ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-gray-200 border-t-[#0050A0] rounded-full animate-spin"></div>
              </div>
              <p className="mt-6 text-gray-600 text-lg font-medium">Loading players...</p>
              <p className="mt-2 text-gray-500 text-sm">Please wait while we load current NFL players</p>
            </div>
          ) : (
            <>
          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-900">
              <strong>How to use:</strong> Drag and drop players to reorder, or click the rank number to type a new position.
            </p>
          </div>

          {/* Tabs and Filter */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <div className="flex flex-wrap gap-4 items-center justify-between">
              {/* Tabs */}
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('current')}
                  className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                    activeTab === 'current'
                      ? 'bg-[#0050A0] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Current Players
                </button>
                <button
                  onClick={() => setActiveTab('alltime')}
                  className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                    activeTab === 'alltime'
                      ? 'bg-[#0050A0] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All Time
                </button>
              </div>

              {/* Filters and Actions */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Position Filter */}
                <select
                  id="position-filter"
                  value={selectedPosition}
                  onChange={(e) => setSelectedPosition(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0050A0] bg-white text-sm"
                >
                  <option value="All">All Positions</option>
                  <option value="PG">PG</option>
                  <option value="SG">SG</option>
                  <option value="SF">SF</option>
                  <option value="PF">PF</option>
                  <option value="C">C</option>
                </select>

                {/* Team Filter */}
                <select
                  id="team-filter"
                  value={selectedTeam}
                  onChange={(e) => setSelectedTeam(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0050A0] bg-white text-sm"
                >
                  <option value="All">All Teams</option>
                  {getAllTeams().map((team) => (
                    <option key={team.id} value={team.fullName}>
                      {team.fullName}
                    </option>
                  ))}
                </select>

                {/* Search Players Button */}
                <button
                  onClick={() => {
                    setShowSearchPlayerModal(true);
                    loadAllTimeDatabase();
                  }}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium text-sm flex items-center gap-1.5"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Search Players
                </button>

                {/* Add Player Button */}
                <button
                  onClick={() => setShowAddPlayerModal(true)}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium text-sm flex items-center gap-1.5"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Player
                </button>
              </div>
            </div>
          </div>

          {/* Rankings Table with Header */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {/* Table Header with Actions */}
            <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex flex-wrap gap-3 justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">
                Player Rankings
              </h2>
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
                          <span className="font-medium">Top 5 Players</span>
                        </button>
                        <button
                          onClick={() => handleDownload(10)}
                          className="w-full px-4 py-2 text-left hover:bg-gray-50 text-gray-700 transition-colors"
                        >
                          <span className="font-medium">Top 10 Players</span>
                        </button>
                        <button
                          onClick={() => handleDownload(30)}
                          className="w-full px-4 py-2 text-left hover:bg-gray-50 text-gray-700 transition-colors"
                        >
                          <span className="font-medium">Top 30 Players</span>
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
                    <th className="hidden sm:table-cell px-4 py-3 text-left text-sm font-bold w-24">Position</th>
                    <th className="hidden md:table-cell px-4 py-3 text-left text-sm font-bold w-32">Team</th>
                    <th className="pr-3 sm:pr-6 py-3 text-center text-xs sm:text-sm font-bold w-12 sm:w-16"></th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRankings.map((rankedPlayer, pageIndex) => {
                    const actualIndex = startIndex + pageIndex;
                    return (
                    <tr
                      key={`${rankedPlayer.player.id}-${actualIndex}`}
                      draggable={true}
                      onDragStart={(e) => handleDragStart(e, actualIndex)}
                      onDragEnd={handleDragEnd}
                      onDragOver={(e) => handleDragOver(e, actualIndex)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, actualIndex)}
                      className={`
                        border-b border-gray-200 cursor-move relative border-l-4 border-l-[#0050A0]
                        ${draggedIndex === actualIndex ? 'opacity-50 bg-gray-100' : ''}
                        ${dragOverIndex === actualIndex ? 'bg-blue-100 border-t-2 border-t-blue-500' : 'hover:bg-gray-50'}
                      `}
                    >

                      {/* Rank Number (Editable) */}
                      <td className="pl-3 sm:pl-6 pr-2 sm:pr-4 py-3 sm:py-4">
                        <div className="flex items-center justify-center">
                          {editingIndex === actualIndex ? (
                            <input
                              type="number"
                              value={rankInput}
                              onChange={(e) => setRankInput(e.target.value)}
                              onBlur={() => handleRankSubmit(actualIndex)}
                              onKeyDown={(e) => handleRankKeyDown(e, actualIndex)}
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
                                handleRankClick(actualIndex);
                              }}
                              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-blue-100 hover:ring-2 hover:ring-blue-300 cursor-pointer"
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
                        <div>
                          <div className="font-semibold text-gray-900 text-sm sm:text-base">
                            {rankedPlayer.player.name}
                          </div>
                          <div className="text-xs sm:text-sm text-gray-500">
                            #{rankedPlayer.player.number} <span className="sm:hidden">• {rankedPlayer.player.position}</span>
                          </div>
                        </div>
                      </td>

                      {/* Position */}
                      <td className="hidden sm:table-cell px-4 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${getPositionColor(rankedPlayer.player.position).bg} ${getPositionColor(rankedPlayer.player.position).text}`}>
                          {rankedPlayer.player.position}
                        </span>
                      </td>

                      {/* Team */}
                      <td className="hidden md:table-cell px-4 py-4">
                        {(() => {
                          const teamInfo = getTeamInfo(rankedPlayer.player.team);
                          return teamInfo ? (
                            <div className="flex items-center gap-2">
                              <img
                                src={teamInfo.logoUrl}
                                alt={teamInfo.abbreviation}
                                
                                
                                className="w-5 h-5"
                              />
                              <span className="text-sm font-medium text-gray-700">
                                {teamInfo.abbreviation}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-700">
                              {rankedPlayer.player.team}
                            </span>
                          );
                        })()}
                      </td>

                      {/* Delete Button */}
                      <td className="pr-3 sm:pr-6 py-3 sm:py-4 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removePlayer(rankedPlayer.player.id);
                          }}
                          className="text-gray-400 hover:text-red-600 transition-colors p-1 rounded hover:bg-red-50"
                          title="Remove player"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                {/* Items per page selector and count */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <label htmlFor="itemsPerPage" className="text-sm text-gray-600 font-medium">
                      Players per page:
                    </label>
                    <select
                      id="itemsPerPage"
                      value={itemsPerPage}
                      onChange={(e) => handleItemsPerPageChange(Number(e.target.value) as 25 | 50 | 100)}
                      className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>
                  <div className="text-sm text-gray-600">
                    Showing {startIndex + 1}-{Math.min(endIndex, totalPlayers)} of {totalPlayers}
                  </div>
                </div>

                {/* Page navigation */}
                {totalPages > 1 && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      ← Previous
                    </button>

                    {getPageNumbers().map((page, index) => (
                      typeof page === 'number' ? (
                        <button
                          key={index}
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                            currentPage === page
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      ) : (
                        <span key={index} className="px-2 text-gray-500">
                          {page}
                        </span>
                      )
                    ))}

                    <button
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Next →
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          </>
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
                <p className="text-sm text-gray-600">This will restore the default rankings based on PPG.</p>
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
              placeholder="e.g., My Top Players 2025"
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

      {/* Add Player Modal */}
      {showAddPlayerModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Add Custom Player</h3>
              <button
                onClick={() => setShowAddPlayerModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleAddPlayer(); }} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* First Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newPlayer.firstName}
                    onChange={(e) => setNewPlayer({ ...newPlayer, firstName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0050A0]"
                    placeholder="LeBron"
                    required
                  />
                </div>

                {/* Last Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newPlayer.lastName}
                    onChange={(e) => setNewPlayer({ ...newPlayer, lastName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0050A0]"
                    placeholder="James"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Jersey Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Jersey Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newPlayer.number}
                    onChange={(e) => setNewPlayer({ ...newPlayer, number: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0050A0]"
                    placeholder="23"
                    required
                  />
                </div>

                {/* Position */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Position <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newPlayer.position}
                    onChange={(e) => setNewPlayer({ ...newPlayer, position: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0050A0]"
                    required
                  >
                    <option value="PG">Point Guard (PG)</option>
                    <option value="SG">Shooting Guard (SG)</option>
                    <option value="SF">Small Forward (SF)</option>
                    <option value="PF">Power Forward (PF)</option>
                    <option value="C">Center (C)</option>
                  </select>
                </div>
              </div>

              {/* Team */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Team <span className="text-red-500">*</span>
                </label>
                <select
                  value={newPlayer.team}
                  onChange={(e) => setNewPlayer({ ...newPlayer, team: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0050A0]"
                  required
                >
                  <option value="">Select a team...</option>
                  {getAllTeams().map((team) => (
                    <option key={team.id} value={team.fullName}>
                      {team.fullName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Height */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Height
                  </label>
                  <input
                    type="text"
                    value={newPlayer.height}
                    onChange={(e) => setNewPlayer({ ...newPlayer, height: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0050A0]"
                    placeholder="6-8"
                  />
                </div>

                {/* Weight */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Weight (lbs)
                  </label>
                  <input
                    type="text"
                    value={newPlayer.weight}
                    onChange={(e) => setNewPlayer({ ...newPlayer, weight: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0050A0]"
                    placeholder="250"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowAddPlayerModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors font-medium"
                >
                  Add Player
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Search Player Modal */}
      {showSearchPlayerModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full p-6 animate-in fade-in zoom-in duration-200 max-h-[85vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Search All-Time Players</h3>
              <button
                onClick={() => {
                  setShowSearchPlayerModal(false);
                  setPlayerSearchQuery('');
                  setSearchResults([]);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {isSearching && !databaseLoaded ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-12 h-12 border-4 border-gray-200 border-t-purple-600 rounded-full animate-spin"></div>
                <p className="mt-4 text-gray-600">Loading player database...</p>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <input
                    type="text"
                    value={playerSearchQuery}
                    onChange={(e) => {
                      setPlayerSearchQuery(e.target.value);
                      searchDatabase(e.target.value);
                    }}
                    placeholder="Search by player name or team..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    autoFocus
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    {databaseLoaded ? `${allTimeDatabase.length} players available` : 'Loading database...'}
                  </p>
                </div>

                <div className="flex-1 overflow-y-auto">
                  {searchResults.length === 0 && playerSearchQuery ? (
                    <p className="text-center text-gray-500 py-8">No players found matching "{playerSearchQuery}"</p>
                  ) : searchResults.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">Start typing to search for players</p>
                  ) : (
                    <div className="space-y-2">
                      {searchResults.map((player) => (
                        <div key={player.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-purple-500 transition-colors">
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-gray-900">{player.name}</div>
                            <div className="text-sm text-gray-600">{player.team} • {player.position} • #{player.number}</div>
                          </div>
                          <button
                            onClick={() => addPlayerFromSearch(player)}
                            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium text-sm flex-shrink-0"
                          >
                            Add
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            <div className="flex justify-end mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowSearchPlayerModal(false);
                  setPlayerSearchQuery('');
                  setSearchResults([]);
                }}
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
