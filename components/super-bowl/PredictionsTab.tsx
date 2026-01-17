'use client';

import { useState, useEffect } from 'react';
import { getAllTeams } from '@/data/teams';

interface Poll {
  id: string;
  question: string;
  options: { id: string; label: string; teamId?: string; votes: number }[];
  totalVotes: number;
}

interface StaffPick {
  name: string;
  title: string;
  winner: string;
  winnerTeamId: string;
  score: string;
  mvp: string;
  reasoning: string;
}

// Local storage key for votes
const VOTES_KEY = 'superbowl_votes';

export default function PredictionsTab() {
  const allTeams = getAllTeams();

  // Staff picks data (editorial content - would come from CMS in production)
  const staffPicks: StaffPick[] = [
    // Placeholder staff picks - replace with actual content during Super Bowl week
  ];

  // Polls state
  const [polls, setPolls] = useState<Poll[]>([
    {
      id: 'winner',
      question: 'Who will win Super Bowl LX?',
      options: [
        { id: 'afc', label: 'AFC Champion (TBD)', teamId: '', votes: 0 },
        { id: 'nfc', label: 'NFC Champion (TBD)', teamId: '', votes: 0 },
      ],
      totalVotes: 0,
    },
    {
      id: 'mvp',
      question: 'Who will be Super Bowl MVP?',
      options: [
        { id: 'afc-qb', label: 'AFC QB', votes: 0 },
        { id: 'nfc-qb', label: 'NFC QB', votes: 0 },
        { id: 'afc-other', label: 'AFC Non-QB', votes: 0 },
        { id: 'nfc-other', label: 'NFC Non-QB', votes: 0 },
      ],
      totalVotes: 0,
    },
    {
      id: 'margin',
      question: 'What will be the margin of victory?',
      options: [
        { id: '1-3', label: '1-3 points', votes: 0 },
        { id: '4-7', label: '4-7 points', votes: 0 },
        { id: '8-14', label: '8-14 points', votes: 0 },
        { id: '15+', label: '15+ points', votes: 0 },
      ],
      totalVotes: 0,
    },
  ]);

  const [userVotes, setUserVotes] = useState<Record<string, string>>({});
  const [scorePrediction, setScorePrediction] = useState({ afc: '', nfc: '' });
  const [scorePredictionSubmitted, setScorePredictionSubmitted] = useState(false);
  const [communityScorePredictions, setCommunityScorePredictions] = useState<{ afc: number; nfc: number; count: number } | null>(null);

  // Load votes from localStorage on mount
  useEffect(() => {
    const savedVotes = localStorage.getItem(VOTES_KEY);
    if (savedVotes) {
      try {
        const parsed = JSON.parse(savedVotes);
        setUserVotes(parsed.votes || {});
        setScorePredictionSubmitted(parsed.scoreSubmitted || false);

        // Simulate loading community data
        // In production, this would fetch from a backend
        setPolls(prev => prev.map(poll => {
          const savedPollVotes = parsed.pollData?.[poll.id];
          if (savedPollVotes) {
            return {
              ...poll,
              options: poll.options.map(opt => ({
                ...opt,
                votes: savedPollVotes[opt.id] || opt.votes,
              })),
              totalVotes: Object.values(savedPollVotes).reduce((sum: number, v) => sum + (v as number), 0) as number,
            };
          }
          return poll;
        }));
      } catch (e) {
        console.error('Error loading votes:', e);
      }
    }

    // Simulate loading community score predictions
    // In production, this would be an API call
    const savedScores = localStorage.getItem('superbowl_score_predictions');
    if (savedScores) {
      try {
        setCommunityScorePredictions(JSON.parse(savedScores));
      } catch (e) {
        console.error('Error loading score predictions:', e);
      }
    }
  }, []);

  const handleVote = (pollId: string, optionId: string) => {
    if (userVotes[pollId]) return; // Already voted

    // Update user votes
    const newUserVotes = { ...userVotes, [pollId]: optionId };
    setUserVotes(newUserVotes);

    // Update poll results
    const newPolls = polls.map(poll => {
      if (poll.id !== pollId) return poll;
      return {
        ...poll,
        options: poll.options.map(opt => ({
          ...opt,
          votes: opt.id === optionId ? opt.votes + 1 : opt.votes,
        })),
        totalVotes: poll.totalVotes + 1,
      };
    });
    setPolls(newPolls);

    // Save to localStorage
    const pollData: Record<string, Record<string, number>> = {};
    newPolls.forEach(poll => {
      pollData[poll.id] = {};
      poll.options.forEach(opt => {
        pollData[poll.id][opt.id] = opt.votes;
      });
    });

    localStorage.setItem(VOTES_KEY, JSON.stringify({
      votes: newUserVotes,
      pollData,
      scoreSubmitted: scorePredictionSubmitted,
    }));
  };

  const handleScorePrediction = () => {
    const afcScore = parseInt(scorePrediction.afc);
    const nfcScore = parseInt(scorePrediction.nfc);

    if (isNaN(afcScore) || isNaN(nfcScore) || afcScore < 0 || nfcScore < 0) {
      alert('Please enter valid scores');
      return;
    }

    setScorePredictionSubmitted(true);

    // Update community predictions
    const current = communityScorePredictions || { afc: 0, nfc: 0, count: 0 };
    const newPredictions = {
      afc: Math.round((current.afc * current.count + afcScore) / (current.count + 1)),
      nfc: Math.round((current.nfc * current.count + nfcScore) / (current.count + 1)),
      count: current.count + 1,
    };
    setCommunityScorePredictions(newPredictions);
    localStorage.setItem('superbowl_score_predictions', JSON.stringify(newPredictions));

    // Update localStorage
    const savedVotes = localStorage.getItem(VOTES_KEY);
    const parsed = savedVotes ? JSON.parse(savedVotes) : {};
    localStorage.setItem(VOTES_KEY, JSON.stringify({
      ...parsed,
      scoreSubmitted: true,
    }));
  };

  const getPercentage = (votes: number, total: number): number => {
    if (total === 0) return 0;
    return Math.round((votes / total) * 100);
  };

  return (
    <div className="space-y-8">
      {/* Community Polls Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Community Predictions</h2>
        <p className="text-gray-600 mb-6">Vote in our Super Bowl polls! Results are anonymous and update in real-time.</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {polls.map((poll) => (
            <div key={poll.id} className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-4">{poll.question}</h3>

              <div className="space-y-3">
                {poll.options.map((option) => {
                  const hasVoted = !!userVotes[poll.id];
                  const isSelected = userVotes[poll.id] === option.id;
                  const percentage = getPercentage(option.votes, poll.totalVotes);

                  return (
                    <button
                      key={option.id}
                      onClick={() => handleVote(poll.id, option.id)}
                      disabled={hasVoted}
                      className={`w-full text-left p-3 rounded-lg border transition-all cursor-pointer ${
                        hasVoted
                          ? isSelected
                            ? 'border-[#013369] bg-[#013369]/5'
                            : 'border-gray-200 bg-gray-50'
                          : 'border-gray-200 hover:border-[#013369] hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className={isSelected ? 'font-semibold' : ''}>{option.label}</span>
                        {hasVoted && (
                          <span className="text-sm font-medium">{percentage}%</span>
                        )}
                      </div>
                      {hasVoted && (
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="h-2 rounded-full transition-all duration-500"
                            style={{
                              width: `${percentage}%`,
                              backgroundColor: isSelected ? '#013369' : '#9CA3AF',
                            }}
                          />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              <p className="text-sm text-gray-500 mt-3 text-center">
                {poll.totalVotes} vote{poll.totalVotes !== 1 ? 's' : ''}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Score Prediction Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Predict the Score</h2>
        <p className="text-gray-600 mb-6">Submit your predicted final score for Super Bowl LX.</p>

        {!scorePredictionSubmitted ? (
          <div className="max-w-md mx-auto">
            <div className="flex items-center gap-4 justify-center mb-6">
              <div className="text-center">
                <label className="block text-sm text-gray-600 mb-1">AFC Champion</label>
                <input
                  type="number"
                  min="0"
                  max="99"
                  value={scorePrediction.afc}
                  onChange={(e) => setScorePrediction({ ...scorePrediction, afc: e.target.value })}
                  className="w-20 text-center text-2xl font-bold border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-[#013369]"
                  placeholder="0"
                />
              </div>
              <span className="text-2xl font-bold text-gray-400">-</span>
              <div className="text-center">
                <label className="block text-sm text-gray-600 mb-1">NFC Champion</label>
                <input
                  type="number"
                  min="0"
                  max="99"
                  value={scorePrediction.nfc}
                  onChange={(e) => setScorePrediction({ ...scorePrediction, nfc: e.target.value })}
                  className="w-20 text-center text-2xl font-bold border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-[#013369]"
                  placeholder="0"
                />
              </div>
            </div>
            <button
              onClick={handleScorePrediction}
              className="w-full py-3 bg-gradient-to-r from-[#013369] to-[#D50A0A] text-white font-semibold rounded-lg hover:opacity-90 transition-opacity cursor-pointer"
            >
              Submit Prediction
            </button>
          </div>
        ) : (
          <div className="text-center">
            <div className="text-green-600 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-lg font-semibold text-gray-900 mb-2">Prediction Submitted!</p>
            {communityScorePredictions && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Community Average Prediction:</p>
                <p className="text-3xl font-bold">
                  <span className="text-[#013369]">{communityScorePredictions.afc}</span>
                  <span className="text-gray-400 mx-2">-</span>
                  <span className="text-[#D50A0A]">{communityScorePredictions.nfc}</span>
                </p>
                <p className="text-sm text-gray-500 mt-2">{communityScorePredictions.count} predictions</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Staff Picks Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">PFN Staff Picks</h2>
        <p className="text-gray-600 mb-6">See who our experts are picking to win Super Bowl LX.</p>

        {staffPicks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {staffPicks.map((pick, idx) => {
              const team = allTeams.find(t => t.id === pick.winnerTeamId);
              return (
                <div key={idx} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-xl font-bold text-gray-500">{pick.name.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="font-semibold">{pick.name}</p>
                      <p className="text-sm text-gray-500">{pick.title}</p>
                    </div>
                  </div>
                  <div className="mb-3">
                    <div className="flex items-center gap-2 mb-1">
                      {team?.logoUrl && (
                        <img src={team.logoUrl} alt="" className="w-6 h-6 object-contain" />
                      )}
                      <span className="font-bold" style={{ color: team?.primaryColor || '#013369' }}>
                        {pick.winner}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">Score: {pick.score}</p>
                    <p className="text-sm text-gray-600">MVP: {pick.mvp}</p>
                  </div>
                  <p className="text-sm text-gray-700 italic">&quot;{pick.reasoning}&quot;</p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p className="text-lg mb-2">Staff picks coming soon!</p>
            <p className="text-sm">Check back during Super Bowl week for our experts&apos; predictions.</p>
          </div>
        )}
      </div>
    </div>
  );
}
