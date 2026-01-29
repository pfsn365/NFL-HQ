'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { getApiPath } from '@/utils/api';
import { fetcher } from '@/lib/fetcher';

type SubTab = 'regular-season' | 'strength-of-schedule' | 'playoff-bracket';

interface RegularSeasonData {
  record: string;
  wins: number;
  losses: number;
  ties: number;
  winPercentage: string;
  homeRecord: string;
  awayRecord: string;
  conferenceRecord: string;
  divisionRecord: string;
  streak: string;
  last10: string;
  pointsFor: number;
  pointsAgainst: number;
  pointDifferential: number;
  avgPointDifferential: string;
  ppg: string;
  oppPpg: string;
}

interface PlayoffGame {
  round: string;
  opponent: string;
  opponentName: string;
  opponentSeed: number;
  isHome: boolean;
  teamScore: number;
  opponentScore: number;
  result: 'W' | 'L';
  date: string;
  venue: string;
  note?: string;
}

interface QualityWins {
  record: string;
  wins: number;
  losses: number;
  games: { opponent: string; opponentSlug: string; opponentRecord: string; score: string; result: 'W' | 'L' }[];
}

interface StrengthOfSchedule {
  sos: number;
  sosRank: number;
  opponentRecord: {
    combined: string;
    winPct: string;
  };
}

interface TeamData {
  teamId: string;
  fullName: string;
  abbreviation: string;
  conference: string;
  division: string;
  seed: number;
  seedType: 'division-winner' | 'wild-card';
  regularSeason: RegularSeasonData;
  qualityWins: QualityWins;
  playoffTeamRecord: {
    record: string;
    wins: number;
    losses: number;
    games: { opponent: string; result: string; score: string }[];
  };
  playoffJourney: PlayoffGame[];
  strengthOfSchedule: StrengthOfSchedule;
}

interface CommonOpponent {
  opponent: string;
  opponentSlug: string;
  opponentRecord: string;
  patriots: { result: string; score: string; location: string }[];
  seahawks: { result: string; score: string; location: string }[];
}

interface PathToSuperBowlResponse {
  patriots: TeamData;
  seahawks: TeamData;
  commonOpponents: CommonOpponent[];
  lastUpdated: string;
}

// Team colors
const TEAM_COLORS = {
  patriots: { primary: '#002244', secondary: '#C60C30' },
  seahawks: { primary: '#002244', secondary: '#69BE28' },
};

export default function PathToSuperBowlTab() {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('regular-season');

  const { data, error, isLoading } = useSWR<PathToSuperBowlResponse>(
    getApiPath('api/nfl/path-to-super-bowl'),
    fetcher,
    { revalidateOnFocus: false }
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0050A0] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading path to Super Bowl data...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-700 mb-4">Failed to load data. Please try again later.</p>
      </div>
    );
  }

  const { patriots, seahawks, commonOpponents } = data;

  const subTabs = [
    { id: 'regular-season' as SubTab, label: 'Regular Season', mobileLabel: 'Season' },
    { id: 'strength-of-schedule' as SubTab, label: 'Strength of Schedule', mobileLabel: 'SOS' },
    { id: 'playoff-bracket' as SubTab, label: 'Playoff Performance', mobileLabel: 'Playoffs' },
  ];

  return (
    <div className="space-y-6">
      {/* Sub-tab Navigation */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="flex border-b border-gray-200">
          {subTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-colors cursor-pointer ${
                activeSubTab === tab.id
                  ? 'bg-[#0050A0] text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.mobileLabel}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Sub-tab Content */}
      {activeSubTab === 'regular-season' && (
        <RegularSeasonContent patriots={patriots} seahawks={seahawks} commonOpponents={commonOpponents} />
      )}
      {activeSubTab === 'strength-of-schedule' && (
        <StrengthOfScheduleContent patriots={patriots} seahawks={seahawks} commonOpponents={commonOpponents} />
      )}
      {activeSubTab === 'playoff-bracket' && (
        <PlayoffBracketContent patriots={patriots} seahawks={seahawks} />
      )}
    </div>
  );
}

// Regular Season Sub-tab
function RegularSeasonContent({
  patriots,
  seahawks,
  commonOpponents,
}: {
  patriots: TeamData;
  seahawks: TeamData;
  commonOpponents: CommonOpponent[];
}) {
  return (
    <div className="space-y-6">
      {/* Side by Side Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TeamSeasonCard team={patriots} teamKey="patriots" />
        <TeamSeasonCard team={seahawks} teamKey="seahawks" />
      </div>

      {/* Quality Games Section */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="bg-[#0050A0] text-white px-4 py-3">
          <h3 className="font-semibold text-center">vs .500+ Teams</h3>
          <p className="text-center text-white/80 text-sm">Games against teams with .500 or better records</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-200">
          <QualityWinsColumn team={patriots} teamKey="patriots" />
          <QualityWinsColumn team={seahawks} teamKey="seahawks" />
        </div>
      </div>

      {/* Record Comparison Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="bg-[#0050A0] text-white px-4 py-3">
          <h3 className="font-semibold text-center">Regular Season Comparison</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="py-3 px-4 text-center font-semibold text-[#002244] border-r-4 border-[#C60C30] w-1/3">Patriots</th>
                <th className="py-3 px-4 text-center font-semibold text-gray-700 bg-gray-100 w-1/3">Category</th>
                <th className="py-3 px-4 text-center font-semibold text-[#002244] border-l-4 border-[#69BE28] w-1/3">Seahawks</th>
              </tr>
            </thead>
            <tbody>
              <ComparisonRow
                patriotsValue={patriots.regularSeason.record}
                category="Record"
                seahawksValue={seahawks.regularSeason.record}
              />
              <ComparisonRow
                patriotsValue={`${patriots.regularSeason.winPercentage}%`}
                category="Win %"
                seahawksValue={`${seahawks.regularSeason.winPercentage}%`}
                highlight
              />
              <ComparisonRow
                patriotsValue={patriots.regularSeason.homeRecord}
                category="Home Record"
                seahawksValue={seahawks.regularSeason.homeRecord}
              />
              <ComparisonRow
                patriotsValue={patriots.regularSeason.awayRecord}
                category="Away Record"
                seahawksValue={seahawks.regularSeason.awayRecord}
                highlight
              />
              <ComparisonRow
                patriotsValue={patriots.regularSeason.conferenceRecord}
                category="Conference Record"
                seahawksValue={seahawks.regularSeason.conferenceRecord}
              />
              <ComparisonRow
                patriotsValue={patriots.regularSeason.divisionRecord}
                category="Division Record"
                seahawksValue={seahawks.regularSeason.divisionRecord}
                highlight
              />
              <ComparisonRow
                patriotsValue={patriots.regularSeason.ppg}
                category="Points Per Game"
                seahawksValue={seahawks.regularSeason.ppg}
                better={parseFloat(patriots.regularSeason.ppg) > parseFloat(seahawks.regularSeason.ppg) ? 'patriots' : 'seahawks'}
              />
              <ComparisonRow
                patriotsValue={patriots.regularSeason.oppPpg}
                category="Opp. Points Per Game"
                seahawksValue={seahawks.regularSeason.oppPpg}
                better={parseFloat(patriots.regularSeason.oppPpg) < parseFloat(seahawks.regularSeason.oppPpg) ? 'patriots' : 'seahawks'}
                highlight
              />
              <ComparisonRow
                patriotsValue={`+${patriots.regularSeason.pointDifferential}`}
                category="Point Differential"
                seahawksValue={`+${seahawks.regularSeason.pointDifferential}`}
                better={patriots.regularSeason.pointDifferential > seahawks.regularSeason.pointDifferential ? 'patriots' : 'seahawks'}
              />
              <ComparisonRow
                patriotsValue={patriots.regularSeason.last10}
                category="Last 10 Games"
                seahawksValue={seahawks.regularSeason.last10}
                highlight
              />
              <ComparisonRow
                patriotsValue={patriots.regularSeason.streak}
                category="Current Streak"
                seahawksValue={seahawks.regularSeason.streak}
              />
              <ComparisonRow
                patriotsValue={patriots.qualityWins.record}
                category="vs .500+ Teams"
                seahawksValue={seahawks.qualityWins.record}
                better={patriots.qualityWins.wins > seahawks.qualityWins.wins ? 'patriots' :
                        seahawks.qualityWins.wins > patriots.qualityWins.wins ? 'seahawks' : undefined}
                highlight
              />
              <ComparisonRow
                patriotsValue={patriots.playoffTeamRecord.record}
                category="vs Playoff Teams"
                seahawksValue={seahawks.playoffTeamRecord.record}
                better={patriots.playoffTeamRecord.wins > seahawks.playoffTeamRecord.wins ? 'patriots' :
                        seahawks.playoffTeamRecord.wins > patriots.playoffTeamRecord.wins ? 'seahawks' : undefined}
              />
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Team Season Card
function TeamSeasonCard({ team, teamKey }: { team: TeamData; teamKey: 'patriots' | 'seahawks' }) {
  const colors = TEAM_COLORS[teamKey];
  const logoUrl = teamKey === 'patriots'
    ? '/nfl-hq/new-england-patriots.png'
    : '/nfl-hq/seattle-seahawks-sb.png';

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div
        className="px-4 py-3 flex items-center gap-3"
        style={{ backgroundColor: colors.primary, borderBottom: `4px solid ${colors.secondary}` }}
      >
        <img src={logoUrl} alt={team.fullName} className="w-10 h-10 object-contain" />
        <div>
          <h3 className="font-semibold text-white">{team.fullName}</h3>
          <p className="text-white/80 text-sm">#{team.seed} Seed ({team.conference})</p>
        </div>
      </div>
      <div className="p-4 space-y-4">
        {/* Record */}
        <div className="text-center">
          <div className="text-4xl font-bold" style={{ color: colors.primary }}>{team.regularSeason.record}</div>
          <div className="text-gray-500 text-sm">Regular Season Record</div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <StatBox label="PPG" value={team.regularSeason.ppg} />
          <StatBox label="Opp PPG" value={team.regularSeason.oppPpg} />
          <StatBox label="Home" value={team.regularSeason.homeRecord} />
          <StatBox label="Away" value={team.regularSeason.awayRecord} />
          <StatBox label="Point Diff" value={`+${team.regularSeason.pointDifferential}`} />
          <StatBox label="Last 10" value={team.regularSeason.last10} />
        </div>

      </div>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded p-2 text-center">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="font-semibold text-gray-900">{value}</div>
    </div>
  );
}

// Team slug to ESPN ID mapping for logos
const teamSlugToEspnId: Record<string, string> = {
  'arizona-cardinals': '22',
  'atlanta-falcons': '1',
  'baltimore-ravens': '33',
  'buffalo-bills': '2',
  'carolina-panthers': '29',
  'chicago-bears': '3',
  'cincinnati-bengals': '4',
  'cleveland-browns': '5',
  'dallas-cowboys': '6',
  'denver-broncos': '7',
  'detroit-lions': '8',
  'green-bay-packers': '9',
  'houston-texans': '34',
  'indianapolis-colts': '11',
  'jacksonville-jaguars': '30',
  'kansas-city-chiefs': '12',
  'las-vegas-raiders': '13',
  'los-angeles-chargers': '24',
  'los-angeles-rams': '14',
  'miami-dolphins': '15',
  'minnesota-vikings': '16',
  'new-england-patriots': '17',
  'new-orleans-saints': '18',
  'new-york-giants': '19',
  'new-york-jets': '20',
  'philadelphia-eagles': '21',
  'pittsburgh-steelers': '23',
  'san-francisco-49ers': '25',
  'seattle-seahawks': '26',
  'tampa-bay-buccaneers': '27',
  'tennessee-titans': '10',
  'washington-commanders': '28',
};

// Get team logo URL from slug
function getTeamLogoUrl(teamSlug: string): string {
  const espnId = teamSlugToEspnId[teamSlug];
  if (espnId) {
    return `https://a.espncdn.com/i/teamlogos/nfl/500/${espnId}.png`;
  }
  return `https://www.profootballnetwork.com/apps/nfl-logos/${teamSlug}.png`;
}

function QualityWinsColumn({ team, teamKey }: { team: TeamData; teamKey: 'patriots' | 'seahawks' }) {
  const colors = TEAM_COLORS[teamKey];
  const logoUrl = teamKey === 'patriots'
    ? '/nfl-hq/new-england-patriots.png'
    : '/nfl-hq/seattle-seahawks-sb.png';

  return (
    <div className="p-4">
      <div className="flex items-center gap-3 mb-4 pb-3 border-b" style={{ borderColor: colors.secondary }}>
        <img src={logoUrl} alt={team.fullName} className="w-8 h-8 object-contain" />
        <div>
          <h4 className="font-semibold" style={{ color: colors.primary }}>{team.fullName}</h4>
          <div className="text-sm text-gray-600">
            <span className="font-medium text-green-600">{team.qualityWins.record}</span> vs .500+ teams
          </div>
        </div>
      </div>
      {team.qualityWins.games.length > 0 ? (
        <div className="space-y-2">
          {[...team.qualityWins.games].sort((a, b) => a.result === b.result ? 0 : a.result === 'W' ? -1 : 1).map((game, idx) => (
            <div key={idx} className={`flex items-center justify-between p-2 rounded ${game.result === 'W' ? 'bg-green-50' : 'bg-red-50'}`}>
              <div className="flex items-center gap-2">
                <img
                  src={getTeamLogoUrl(game.opponentSlug)}
                  alt={game.opponent}
                  className="w-6 h-6 object-contain"
                />
                <div>
                  <span className="text-sm font-medium text-gray-800">{game.opponent}</span>
                  <span className="text-xs text-gray-500 ml-1">({game.opponentRecord})</span>
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded text-sm font-medium ${game.result === 'W' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {game.result} {game.score}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-500 py-4">No games vs .500+ teams</div>
      )}
    </div>
  );
}

function ComparisonRow({
  patriotsValue,
  category,
  seahawksValue,
  highlight = false,
  better,
}: {
  patriotsValue: string;
  category: string;
  seahawksValue: string;
  highlight?: boolean;
  better?: 'patriots' | 'seahawks';
}) {
  return (
    <tr className={highlight ? 'bg-gray-50' : 'bg-white'}>
      <td className={`py-2 px-4 text-center font-medium ${better === 'patriots' ? 'text-green-600' : 'text-gray-900'}`}>
        {patriotsValue}
      </td>
      <td className="py-2 px-4 text-center text-gray-600 bg-gray-100 text-xs sm:text-sm">{category}</td>
      <td className={`py-2 px-4 text-center font-medium ${better === 'seahawks' ? 'text-green-600' : 'text-gray-900'}`}>
        {seahawksValue}
      </td>
    </tr>
  );
}

// Strength of Schedule Sub-tab
function StrengthOfScheduleContent({
  patriots,
  seahawks,
  commonOpponents,
}: {
  patriots: TeamData;
  seahawks: TeamData;
  commonOpponents: CommonOpponent[];
}) {
  return (
    <div className="space-y-6">
      {/* SOS Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SOSCard team={patriots} teamKey="patriots" />
        <SOSCard team={seahawks} teamKey="seahawks" />
      </div>

      {/* Common Opponents */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="bg-[#0050A0] text-white px-4 py-3">
          <h3 className="font-semibold text-center">Common Opponents Comparison</h3>
          <p className="text-center text-white/80 text-sm">{commonOpponents.length} teams both faced during the regular season</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="py-3 px-4 text-left font-semibold text-gray-700">Opponent</th>
                <th className="py-3 px-4 text-center font-semibold text-gray-700">Record</th>
                <th className="py-3 px-4 text-center font-semibold text-[#002244] border-l-4 border-[#C60C30]">Patriots</th>
                <th className="py-3 px-4 text-center font-semibold text-[#002244] border-l-4 border-[#69BE28]">Seahawks</th>
              </tr>
            </thead>
            <tbody>
              {commonOpponents.map((opp, idx) => (
                <tr key={opp.opponentSlug} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="py-2 px-4">
                    <div className="flex items-center gap-2">
                      <img
                        src={getTeamLogoUrl(opp.opponentSlug)}
                        alt={opp.opponent}
                        className="w-6 h-6 object-contain"
                      />
                      <span className="font-medium text-gray-900">{opp.opponent}</span>
                    </div>
                  </td>
                  <td className="py-2 px-4 text-center text-gray-600">{opp.opponentRecord}</td>
                  <td className="py-2 px-4 text-center">
                    {opp.patriots.map((g, i) => (
                      <span key={i} className={`inline-block px-2 py-0.5 rounded text-xs font-medium mr-1 ${
                        g.result === 'W' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {g.result} {g.score}
                      </span>
                    ))}
                  </td>
                  <td className="py-2 px-4 text-center">
                    {opp.seahawks.map((g, i) => (
                      <span key={i} className={`inline-block px-2 py-0.5 rounded text-xs font-medium mr-1 ${
                        g.result === 'W' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {g.result} {g.score}
                      </span>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Common Opponents Summary */}
        <div className="p-4 bg-gray-50 border-t">
          <div className="flex justify-around text-center">
            <div>
              <div className="text-xs text-gray-500 uppercase">Patriots vs Common</div>
              <div className="font-bold text-lg text-[#002244]">
                {commonOpponents.reduce((acc, opp) => acc + opp.patriots.filter(g => g.result === 'W').length, 0)}-
                {commonOpponents.reduce((acc, opp) => acc + opp.patriots.filter(g => g.result === 'L').length, 0)}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 uppercase">Seahawks vs Common</div>
              <div className="font-bold text-lg text-[#002244]">
                {commonOpponents.reduce((acc, opp) => acc + opp.seahawks.filter(g => g.result === 'W').length, 0)}-
                {commonOpponents.reduce((acc, opp) => acc + opp.seahawks.filter(g => g.result === 'L').length, 0)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SOSCard({ team, teamKey }: { team: TeamData; teamKey: 'patriots' | 'seahawks' }) {
  const colors = TEAM_COLORS[teamKey];
  const logoUrl = teamKey === 'patriots'
    ? '/nfl-hq/new-england-patriots.png'
    : '/nfl-hq/seattle-seahawks-sb.png';

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div
        className="px-4 py-3 flex items-center gap-3"
        style={{ backgroundColor: colors.primary, borderBottom: `4px solid ${colors.secondary}` }}
      >
        <img src={logoUrl} alt={team.fullName} className="w-10 h-10 object-contain" />
        <h3 className="font-semibold text-white">{team.fullName}</h3>
      </div>
      <div className="p-4 space-y-4">
        {/* SOS Rank */}
        <div className="text-center">
          <div className="text-5xl font-bold" style={{ color: colors.primary }}>#{team.strengthOfSchedule.sosRank}</div>
          <div className="text-gray-500 text-sm">Strength of Schedule Rank</div>
          <div className="text-sm text-gray-600 mt-1">SOS: {team.strengthOfSchedule.sos.toFixed(3)}</div>
        </div>

        {/* Opponent Record */}
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Combined Opponent Record</div>
          <div className="text-2xl font-bold text-gray-900">{team.strengthOfSchedule.opponentRecord.combined}</div>
          <div className="text-sm text-gray-600">{team.strengthOfSchedule.opponentRecord.winPct} Win Rate</div>
        </div>

        {/* Quality of Wins */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-green-50 rounded p-3 text-center">
            <div className="text-xs text-green-600 uppercase">vs .500+ Teams</div>
            <div className="text-xl font-bold text-green-700">{team.qualityWins.record}</div>
          </div>
          <div className="bg-blue-50 rounded p-3 text-center">
            <div className="text-xs text-blue-600 uppercase">vs Playoff Teams</div>
            <div className="text-xl font-bold text-blue-700">{team.playoffTeamRecord.record}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Playoff Bracket Sub-tab
function PlayoffBracketContent({ patriots, seahawks }: { patriots: TeamData; seahawks: TeamData }) {
  return (
    <div className="space-y-6">
      {/* Team Journeys Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PlayoffJourneyCard team={patriots} teamKey="patriots" />
        <PlayoffJourneyCard team={seahawks} teamKey="seahawks" />
      </div>

      {/* Playoff Stats Comparison */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="bg-[#0050A0] text-white px-4 py-3">
          <h3 className="font-semibold text-center">Playoff Performance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm table-fixed">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="py-3 px-4 text-center font-semibold text-[#002244] border-r-4 border-[#C60C30] w-1/3">Patriots</th>
                <th className="py-3 px-4 text-center font-semibold text-gray-700 bg-gray-100 w-1/3">Stat</th>
                <th className="py-3 px-4 text-center font-semibold text-[#002244] border-l-4 border-[#69BE28] w-1/3">Seahawks</th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-white">
                <td className="py-2 px-4 text-center font-medium">3-0</td>
                <td className="py-2 px-4 text-center text-gray-600 bg-gray-100">Playoff Record</td>
                <td className="py-2 px-4 text-center font-medium">2-0</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="py-2 px-4 text-center font-medium">
                  {Math.round(patriots.playoffJourney.reduce((acc, g) => acc + g.teamScore, 0) / patriots.playoffJourney.length)}
                </td>
                <td className="py-2 px-4 text-center text-gray-600 bg-gray-100">Avg Points Scored</td>
                <td className="py-2 px-4 text-center font-medium">
                  {Math.round(seahawks.playoffJourney.reduce((acc, g) => acc + g.teamScore, 0) / seahawks.playoffJourney.length)}
                </td>
              </tr>
              <tr className="bg-white">
                <td className="py-2 px-4 text-center font-medium">
                  {Math.round(patriots.playoffJourney.reduce((acc, g) => acc + g.opponentScore, 0) / patriots.playoffJourney.length)}
                </td>
                <td className="py-2 px-4 text-center text-gray-600 bg-gray-100">Avg Points Allowed</td>
                <td className="py-2 px-4 text-center font-medium">
                  {Math.round(seahawks.playoffJourney.reduce((acc, g) => acc + g.opponentScore, 0) / seahawks.playoffJourney.length)}
                </td>
              </tr>
              <tr className="bg-gray-50">
                <td className="py-2 px-4 text-center font-medium">
                  +{patriots.playoffJourney.reduce((acc, g) => acc + (g.teamScore - g.opponentScore), 0)}
                </td>
                <td className="py-2 px-4 text-center text-gray-600 bg-gray-100">Point Differential</td>
                <td className="py-2 px-4 text-center font-medium">
                  +{seahawks.playoffJourney.reduce((acc, g) => acc + (g.teamScore - g.opponentScore), 0)}
                </td>
              </tr>
              {/* Yardage Stats - From ESPN playoff data */}
              <tr className="bg-white">
                <td className="py-2 px-4 text-center font-medium">278.3</td>
                <td className="py-2 px-4 text-center text-gray-600 bg-gray-100">Total Yards/Game</td>
                <td className="py-2 px-4 text-center font-medium">338.5</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="py-2 px-4 text-center font-medium">147.7</td>
                <td className="py-2 px-4 text-center text-gray-600 bg-gray-100">Passing Yards/Game</td>
                <td className="py-2 px-4 text-center font-medium">213.5</td>
              </tr>
              <tr className="bg-white">
                <td className="py-2 px-4 text-center font-medium">130.7</td>
                <td className="py-2 px-4 text-center text-gray-600 bg-gray-100">Rushing Yards/Game</td>
                <td className="py-2 px-4 text-center font-medium">125.0</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="py-2 px-4 text-center font-medium">209.7</td>
                <td className="py-2 px-4 text-center text-gray-600 bg-gray-100">Yards Allowed/Game</td>
                <td className="py-2 px-4 text-center font-medium">357.5</td>
              </tr>
              <tr className="bg-white">
                <td className="py-2 px-4 text-center font-medium">32:30</td>
                <td className="py-2 px-4 text-center text-gray-600 bg-gray-100">Time of Possession</td>
                <td className="py-2 px-4 text-center font-medium">31:30</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="py-2 px-4 text-center font-medium">30.2%</td>
                <td className="py-2 px-4 text-center text-gray-600 bg-gray-100">3rd Down Conv %</td>
                <td className="py-2 px-4 text-center font-medium">47.8%</td>
              </tr>
              <tr className="bg-white">
                <td className="py-2 px-4 text-center font-medium">0.7</td>
                <td className="py-2 px-4 text-center text-gray-600 bg-gray-100">Turnovers/Game</td>
                <td className="py-2 px-4 text-center font-medium">0.0</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="py-2 px-4 text-center font-medium">4.0</td>
                <td className="py-2 px-4 text-center text-gray-600 bg-gray-100">Sacks/Game</td>
                <td className="py-2 px-4 text-center font-medium">1.5</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function PlayoffJourneyCard({ team, teamKey }: { team: TeamData; teamKey: 'patriots' | 'seahawks' }) {
  const colors = TEAM_COLORS[teamKey];
  const logoUrl = teamKey === 'patriots'
    ? '/nfl-hq/new-england-patriots.png'
    : '/nfl-hq/seattle-seahawks-sb.png';

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div
        className="px-4 py-3 flex items-center gap-3"
        style={{ backgroundColor: colors.primary, borderBottom: `4px solid ${colors.secondary}` }}
      >
        <img src={logoUrl} alt={team.fullName} className="w-10 h-10 object-contain" />
        <div>
          <h3 className="font-semibold text-white">{team.fullName}</h3>
          <p className="text-white/80 text-sm">Path to Super Bowl LX</p>
        </div>
      </div>
      <div className="p-4">
        {/* First Round Bye indicator for #1 seed - same structure as game cards */}
        {team.seed === 1 && (
          <div className="mb-3 border rounded-lg p-3 bg-gray-50 border-gray-200">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-400 text-lg font-bold">—</span>
                </div>
                <div>
                  <div className="text-xs text-gray-500 uppercase">Wild Card Round</div>
                  <div className="font-semibold text-gray-700">First Round Bye</div>
                </div>
              </div>
              <div className="text-right">
                <span className="inline-block px-2 py-1 rounded text-sm font-bold bg-gray-400 text-white">
                  BYE
                </span>
              </div>
            </div>
            <div className="flex justify-between items-center text-sm">
              <div className="text-gray-500">#1 Seed Advantage</div>
              <div className="font-bold text-lg text-gray-400">—</div>
            </div>
            <div className="text-xs text-gray-400 mt-1">No game played</div>
          </div>
        )}

        {/* Playoff Games */}
        <div className="space-y-3">
          {team.playoffJourney.map((game, idx) => (
            <div
              key={idx}
              className="border rounded-lg p-3 bg-green-50 border-green-200"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-3">
                  <img
                    src={getTeamLogoUrl(game.opponent)}
                    alt={game.opponentName}
                    className="w-10 h-10 object-contain"
                  />
                  <div>
                    <div className="text-xs text-gray-500 uppercase">{game.round}</div>
                    <div className="font-semibold text-gray-900">vs #{game.opponentSeed} {game.opponentName}</div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-block px-2 py-1 rounded text-sm font-bold bg-green-600 text-white">
                    W
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center text-sm">
                <div className="text-gray-600">
                  <span>{game.isHome ? 'Home' : 'Away'}</span>
                  <span className="mx-1">•</span>
                  <span>{game.date}</span>
                </div>
                <div className="font-bold text-lg" style={{ color: colors.primary }}>
                  {game.teamScore}-{game.opponentScore}
                </div>
              </div>
              <div className="text-xs text-gray-500 mt-1">{game.venue}</div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="mt-4 pt-4 border-t text-center">
          <div className="text-xs text-gray-500 uppercase">Playoff Total</div>
          <div className="text-2xl font-bold" style={{ color: colors.primary }}>
            {team.playoffJourney.reduce((acc, g) => acc + g.teamScore, 0)} - {team.playoffJourney.reduce((acc, g) => acc + g.opponentScore, 0)}
          </div>
          <div className="text-sm text-gray-600">
            +{team.playoffJourney.reduce((acc, g) => acc + (g.teamScore - g.opponentScore), 0)} Point Differential
          </div>
        </div>
      </div>
    </div>
  );
}
