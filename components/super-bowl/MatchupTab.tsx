'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getAllTeams, TeamData } from '@/data/teams';
import { getApiPath } from '@/utils/api';
import SkeletonLoader from '@/components/SkeletonLoader';

interface InjuryPlayer {
  player: string;
  position: string;
  status: string;
  details: string;
}

interface Transaction {
  date: string;
  type: string;
  description: string;
}

interface TeamStats {
  pointsPerGame: number;
  yardsPerGame: number;
  rushingYards: number;
  passingYards: number;
  turnovers: number;
  takeaways: number;
  pointsAllowed: number;
  yardsAllowed: number;
  sacks: number;
  sacksAllowed: number;
  thirdDownPct: number;
  redZonePct: number;
}

interface Article {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  author?: string;
}

// Placeholder for when matchup isn't set yet
const TBD_TEAM: TeamData = {
  id: 'tbd',
  name: 'TBD',
  city: 'TBD',
  fullName: 'To Be Determined',
  abbreviation: 'TBD',
  espnAbbr: 'tbd',
  conference: 'AFC',
  division: 'TBD',
  primaryColor: '#888888',
  secondaryColor: '#CCCCCC',
  logoUrl: '',
  record: '-',
  divisionRank: '-',
  generalManager: '-',
  headCoach: '-',
  offensiveCoordinator: '-',
  defensiveCoordinator: '-',
  specialTeamsCoordinator: '-',
  homeVenue: '-',
  location: '-',
  stats: {
    prPlus: { value: 0, rank: 0 },
    offPlus: { value: 0, rank: 0 },
    defPlus: { value: 0, rank: 0 },
    stPlus: { value: 0, rank: 0 },
  },
  searchTerms: [],
};

// Super Bowl date in UTC (6:30 PM ET = 23:30 UTC on Feb 8, 2026)
const SUPER_BOWL_DATE = new Date('2026-02-08T23:30:00Z');

export default function MatchupTab() {
  const [afcTeam, setAfcTeam] = useState<TeamData | null>(null);
  const [nfcTeam, setNfcTeam] = useState<TeamData | null>(null);
  const [afcInjuries, setAfcInjuries] = useState<InjuryPlayer[]>([]);
  const [nfcInjuries, setNfcInjuries] = useState<InjuryPlayer[]>([]);
  const [afcTransactions, setAfcTransactions] = useState<Transaction[]>([]);
  const [nfcTransactions, setNfcTransactions] = useState<Transaction[]>([]);
  const [afcStats, setAfcStats] = useState<TeamStats | null>(null);
  const [nfcStats, setNfcStats] = useState<TeamStats | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [articlesLoading, setArticlesLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [matchupSet, setMatchupSet] = useState(false);
  const [localGameTime, setLocalGameTime] = useState<string>('');

  // Fetch Super Bowl articles from RSS feed
  const fetchArticles = async () => {
    try {
      setArticlesLoading(true);
      const rssUrl = encodeURIComponent('https://www.profootballnetwork.com/nfl-news/feed/');
      const response = await fetch(getApiPath(`api/proxy-rss?url=${rssUrl}`));

      if (response.ok) {
        const data = await response.json();
        if (data.articles && data.articles.length > 0) {
          // Filter for Super Bowl related articles
          const superBowlKeywords = ['super bowl', 'superbowl', 'championship', 'playoff', 'postseason'];
          const filtered = data.articles.filter((article: Article) => {
            const titleLower = article.title.toLowerCase();
            const descLower = (article.description || '').toLowerCase();
            return superBowlKeywords.some(keyword =>
              titleLower.includes(keyword) || descLower.includes(keyword)
            );
          });
          // Show filtered articles or fallback to recent articles
          setArticles(filtered.length > 0 ? filtered.slice(0, 5) : data.articles.slice(0, 5));
        }
      }
    } catch (error) {
      console.error('Error fetching articles:', error);
    } finally {
      setArticlesLoading(false);
    }
  };

  // Format game time in user's local timezone
  const [localGameDate, setLocalGameDate] = useState<string>('');
  const [localGameTimeStr, setLocalGameTimeStr] = useState<string>('');

  useEffect(() => {
    const dateStr = SUPER_BOWL_DATE.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    const timeStr = SUPER_BOWL_DATE.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short',
    });
    setLocalGameDate(dateStr);
    setLocalGameTimeStr(timeStr);
    setLocalGameTime(`${dateStr} | ${timeStr}`);
  }, []);

  useEffect(() => {
    // For now, we'll hardcode the Super Bowl LX matchup
    // In production, this would fetch from the playoff bracket data
    const allTeams = getAllTeams();

    // TODO: Replace with actual Super Bowl matchup when set
    // These are placeholder teams - update after Conference Championships
    const afc = allTeams.find(t => t.id === 'kansas-city-chiefs'); // Placeholder
    const nfc = allTeams.find(t => t.id === 'detroit-lions'); // Placeholder

    if (afc && nfc) {
      setAfcTeam(afc);
      setNfcTeam(nfc);
      setMatchupSet(true);

      // Fetch additional data for both teams
      fetchTeamData(afc.id, 'afc');
      fetchTeamData(nfc.id, 'nfc');
    } else {
      setMatchupSet(false);
    }

    // Fetch articles
    fetchArticles();

    setLoading(false);
  }, []);

  const fetchTeamData = async (teamId: string, conference: 'afc' | 'nfc') => {
    try {
      // Fetch injuries
      const injuriesRes = await fetch(getApiPath(`nfl/teams/api/injuries/${teamId}`));
      if (injuriesRes.ok) {
        const injuriesData = await injuriesRes.json();
        if (conference === 'afc') {
          setAfcInjuries(injuriesData.injuries?.slice(0, 5) || []);
        } else {
          setNfcInjuries(injuriesData.injuries?.slice(0, 5) || []);
        }
      }

      // Fetch transactions
      const transactionsRes = await fetch(getApiPath(`nfl/teams/api/transactions/${teamId}`));
      if (transactionsRes.ok) {
        const transactionsData = await transactionsRes.json();
        if (conference === 'afc') {
          setAfcTransactions(transactionsData.transactions?.slice(0, 5) || []);
        } else {
          setNfcTransactions(transactionsData.transactions?.slice(0, 5) || []);
        }
      }

      // Fetch team stats
      const statsRes = await fetch(getApiPath(`nfl/teams/api/team-stats/${teamId}`));
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        if (conference === 'afc') {
          setAfcStats(statsData);
        } else {
          setNfcStats(statsData);
        }
      }
    } catch (error) {
      console.error(`Error fetching data for ${teamId}:`, error);
    }
  };

  if (loading) {
    return <SkeletonLoader type="full" />;
  }

  const displayAfcTeam = afcTeam || TBD_TEAM;
  const displayNfcTeam = nfcTeam || TBD_TEAM;

  // Position group edge calculation
  const getEdge = (afcValue: number, nfcValue: number): 'afc' | 'nfc' | 'even' => {
    const diff = afcValue - nfcValue;
    if (Math.abs(diff) < 2) return 'even';
    return diff > 0 ? 'afc' : 'nfc';
  };

  const positionGroups = [
    { name: 'Offense', afcValue: displayAfcTeam.stats.offPlus.value, nfcValue: displayNfcTeam.stats.offPlus.value },
    { name: 'Defense', afcValue: displayAfcTeam.stats.defPlus.value, nfcValue: displayNfcTeam.stats.defPlus.value },
    { name: 'Special Teams', afcValue: displayAfcTeam.stats.stPlus.value, nfcValue: displayNfcTeam.stats.stPlus.value },
  ];

  return (
    <div className="space-y-8">
      {/* Matchup Not Set Notice */}
      {!matchupSet && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
          <p className="text-yellow-800 font-medium">
            Super Bowl LX matchup will be set after the Conference Championships
          </p>
          <p className="text-yellow-600 text-sm mt-1">
            Check back after Conference Championship Sunday!
          </p>
        </div>
      )}

      {/* Team Comparison Header */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_1fr] items-stretch min-h-[280px]">
          {/* AFC Team */}
          <div
            className="relative p-6 flex flex-col items-center justify-center text-center overflow-hidden"
            style={{ backgroundColor: `${displayAfcTeam.primaryColor}20` }}
          >
            {/* Background Logo - using ESPN high-res logos */}
            {displayAfcTeam.espnAbbr && (
              <img
                src={`https://a.espncdn.com/i/teamlogos/nfl/500/${displayAfcTeam.espnAbbr}.png`}
                alt=""
                className="absolute inset-0 w-[90%] h-[90%] m-auto object-contain pointer-events-none opacity-15"
              />
            )}
            {/* Content */}
            <div className="relative z-10 bg-white/70 backdrop-blur-[1px] rounded-lg px-4 py-3">
              {matchupSet && displayAfcTeam.id !== 'tbd' ? (
                <Link
                  href={`/nfl-hq/teams/${displayAfcTeam.id}`}
                  className="text-2xl font-bold mb-1 hover:underline cursor-pointer"
                  style={{ color: displayAfcTeam.primaryColor }}
                >
                  {displayAfcTeam.fullName}
                </Link>
              ) : (
                <h2 className="text-2xl font-bold mb-1" style={{ color: displayAfcTeam.primaryColor }}>
                  {displayAfcTeam.fullName}
                </h2>
              )}
              <p className="text-gray-800 font-medium">{displayAfcTeam.record}</p>
              <p className="text-sm text-gray-700">AFC Champion</p>
            </div>
          </div>

          {/* VS */}
          <div className="px-6 py-4 flex flex-col items-center justify-center text-center bg-gray-100 min-w-[160px]">
            <div className="text-4xl font-bold text-gray-400 mb-3">VS</div>
            {localGameDate && (
              <div className="text-base font-medium text-gray-700">{localGameDate}</div>
            )}
            {localGameTimeStr && (
              <div className="text-base text-gray-600">{localGameTimeStr}</div>
            )}
          </div>

          {/* NFC Team */}
          <div
            className="relative p-6 flex flex-col items-center justify-center text-center overflow-hidden"
            style={{ backgroundColor: `${displayNfcTeam.primaryColor}20` }}
          >
            {/* Background Logo - using ESPN high-res logos */}
            {displayNfcTeam.espnAbbr && (
              <img
                src={`https://a.espncdn.com/i/teamlogos/nfl/500/${displayNfcTeam.espnAbbr}.png`}
                alt=""
                className="absolute inset-0 w-[90%] h-[90%] m-auto object-contain pointer-events-none opacity-15"
              />
            )}
            {/* Content */}
            <div className="relative z-10 bg-white/70 backdrop-blur-[1px] rounded-lg px-4 py-3">
              {matchupSet && displayNfcTeam.id !== 'tbd' ? (
                <Link
                  href={`/nfl-hq/teams/${displayNfcTeam.id}`}
                  className="text-2xl font-bold mb-1 hover:underline cursor-pointer"
                  style={{ color: displayNfcTeam.primaryColor }}
                >
                  {displayNfcTeam.fullName}
                </Link>
              ) : (
                <h2 className="text-2xl font-bold mb-1" style={{ color: displayNfcTeam.primaryColor }}>
                  {displayNfcTeam.fullName}
                </h2>
              )}
              <p className="text-gray-800 font-medium">{displayNfcTeam.record}</p>
              <p className="text-sm text-gray-700">NFC Champion</p>
            </div>
          </div>
        </div>

      </div>

      {/* PFSN Impact Grades Comparison */}
      {matchupSet && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">PFSN Impact Grades</h3>
          <div className="space-y-4">
            {positionGroups.map((group) => {
              const edge = getEdge(group.afcValue, group.nfcValue);
              return (
                <div key={group.name} className="flex items-center justify-between">
                  <div className="flex-1 text-right pr-4">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                        edge === 'afc' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {group.afcValue}
                    </span>
                  </div>
                  <div className="w-32 text-center">
                    <span className="font-medium text-gray-700">{group.name}</span>
                  </div>
                  <div className="flex-1 text-left pl-4">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                        edge === 'nfc' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {group.nfcValue}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Season Stats Comparison */}
      {matchupSet && afcStats && nfcStats && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Season Stats Comparison</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="py-2 px-4 text-right" style={{ color: displayAfcTeam.primaryColor }}>
                    {displayAfcTeam.abbreviation}
                  </th>
                  <th className="py-2 px-4 text-center text-gray-600">Stat</th>
                  <th className="py-2 px-4 text-left" style={{ color: displayNfcTeam.primaryColor }}>
                    {displayNfcTeam.abbreviation}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="py-2 px-4 text-right font-semibold">{afcStats.pointsPerGame?.toFixed(1) || '-'}</td>
                  <td className="py-2 px-4 text-center text-gray-600">Points/Game</td>
                  <td className="py-2 px-4 text-left font-semibold">{nfcStats.pointsPerGame?.toFixed(1) || '-'}</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-2 px-4 text-right font-semibold">{afcStats.yardsPerGame?.toFixed(1) || '-'}</td>
                  <td className="py-2 px-4 text-center text-gray-600">Yards/Game</td>
                  <td className="py-2 px-4 text-left font-semibold">{nfcStats.yardsPerGame?.toFixed(1) || '-'}</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-2 px-4 text-right font-semibold">{afcStats.pointsAllowed?.toFixed(1) || '-'}</td>
                  <td className="py-2 px-4 text-center text-gray-600">Points Allowed/Game</td>
                  <td className="py-2 px-4 text-left font-semibold">{nfcStats.pointsAllowed?.toFixed(1) || '-'}</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-2 px-4 text-right font-semibold">{afcStats.sacks || '-'}</td>
                  <td className="py-2 px-4 text-center text-gray-600">Sacks</td>
                  <td className="py-2 px-4 text-left font-semibold">{nfcStats.sacks || '-'}</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-2 px-4 text-right font-semibold">
                    {afcStats.takeaways && afcStats.turnovers ? afcStats.takeaways - afcStats.turnovers : '-'}
                  </td>
                  <td className="py-2 px-4 text-center text-gray-600">Turnover Diff</td>
                  <td className="py-2 px-4 text-left font-semibold">
                    {nfcStats.takeaways && nfcStats.turnovers ? nfcStats.takeaways - nfcStats.turnovers : '-'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Two Column Layout for Injuries and Transactions */}
      {matchupSet && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Injuries */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Injury Report</h3>

            {/* AFC Injuries */}
            <div className="mb-6">
              <h4 className="font-semibold mb-2" style={{ color: displayAfcTeam.primaryColor }}>
                {displayAfcTeam.name}
              </h4>
              {afcInjuries.length > 0 ? (
                <div className="space-y-2">
                  {afcInjuries.map((injury, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm border-b border-gray-100 pb-2">
                      <div>
                        <span className="font-medium">{injury.player}</span>
                        <span className="text-gray-500 ml-2">{injury.position}</span>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        injury.status === 'Out' ? 'bg-red-100 text-red-800' :
                        injury.status === 'Doubtful' ? 'bg-orange-100 text-orange-800' :
                        injury.status === 'Questionable' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {injury.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No injuries reported</p>
              )}
            </div>

            {/* NFC Injuries */}
            <div>
              <h4 className="font-semibold mb-2" style={{ color: displayNfcTeam.primaryColor }}>
                {displayNfcTeam.name}
              </h4>
              {nfcInjuries.length > 0 ? (
                <div className="space-y-2">
                  {nfcInjuries.map((injury, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm border-b border-gray-100 pb-2">
                      <div>
                        <span className="font-medium">{injury.player}</span>
                        <span className="text-gray-500 ml-2">{injury.position}</span>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        injury.status === 'Out' ? 'bg-red-100 text-red-800' :
                        injury.status === 'Doubtful' ? 'bg-orange-100 text-orange-800' :
                        injury.status === 'Questionable' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {injury.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No injuries reported</p>
              )}
            </div>
          </div>

          {/* Transactions */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Recent Transactions</h3>

            {/* AFC Transactions */}
            <div className="mb-6">
              <h4 className="font-semibold mb-2" style={{ color: displayAfcTeam.primaryColor }}>
                {displayAfcTeam.name}
              </h4>
              {afcTransactions.length > 0 ? (
                <div className="space-y-2">
                  {afcTransactions.map((tx, idx) => (
                    <div key={idx} className="text-sm border-b border-gray-100 pb-2">
                      <div className="flex justify-between">
                        <span className="font-medium">{tx.type}</span>
                        <span className="text-gray-500">{tx.date}</span>
                      </div>
                      <p className="text-gray-600 text-xs mt-1">{tx.description}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No recent transactions</p>
              )}
            </div>

            {/* NFC Transactions */}
            <div>
              <h4 className="font-semibold mb-2" style={{ color: displayNfcTeam.primaryColor }}>
                {displayNfcTeam.name}
              </h4>
              {nfcTransactions.length > 0 ? (
                <div className="space-y-2">
                  {nfcTransactions.map((tx, idx) => (
                    <div key={idx} className="text-sm border-b border-gray-100 pb-2">
                      <div className="flex justify-between">
                        <span className="font-medium">{tx.type}</span>
                        <span className="text-gray-500">{tx.date}</span>
                      </div>
                      <p className="text-gray-600 text-xs mt-1">{tx.description}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No recent transactions</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Latest Super Bowl Articles */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Latest Super Bowl Articles</h3>
        {articlesLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, idx) => (
              <div key={idx} className="border-b border-gray-100 pb-4">
                <div className="h-5 bg-gray-200 rounded w-3/4 mb-2 animate-pulse" />
                <div className="h-4 bg-gray-200 rounded w-full mb-1 animate-pulse" />
                <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse" />
              </div>
            ))}
          </div>
        ) : articles.length > 0 ? (
          <div className="space-y-4">
            {articles.map((article, idx) => (
              <a
                key={idx}
                href={article.link}
                target="_blank"
                rel="noopener noreferrer"
                className="block border-b border-gray-100 pb-4 last:border-0 hover:bg-gray-50 -mx-2 px-2 py-2 rounded transition-colors cursor-pointer"
              >
                <h4 className="font-semibold text-gray-900 hover:text-[#013369] mb-1">
                  {article.title}
                </h4>
                {article.description && (
                  <p className="text-sm text-gray-600 line-clamp-2 mb-1">
                    {article.description}
                  </p>
                )}
                <div className="text-xs text-gray-500">
                  {article.author && <span>By {article.author} · </span>}
                  {new Date(article.pubDate).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </div>
              </a>
            ))}
            <a
              href="https://www.profootballnetwork.com/nfl-news/"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center text-[#013369] font-medium hover:underline mt-4 cursor-pointer"
            >
              View More NFL News →
            </a>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">
            No articles available at this time.
          </p>
        )}
      </div>
    </div>
  );
}
