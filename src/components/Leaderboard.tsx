import { useState, useEffect } from 'react';
import { Crown, Medal, Trophy, X } from 'lucide-react';
import { getLeaderboard } from '../services/supabase';

interface LeaderboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ isOpen, onClose }) => {
  const [scores, setScores] = useState<Array<{ username: string; high_score: number }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadLeaderboard();
    }
  }, [isOpen]);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      const leaderboard = await getLeaderboard(10);
      setScores(leaderboard);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="text-yellow-400" size={24} />;
      case 2: return <Medal className="text-gray-300" size={24} />;
      case 3: return <Medal className="text-amber-600" size={24} />;
      default: return <Trophy className="text-white/60" size={20} />;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return 'from-yellow-500/20 to-yellow-600/20 border-yellow-400/30';
      case 2: return 'from-gray-400/20 to-gray-500/20 border-gray-300/30';
      case 3: return 'from-amber-500/20 to-amber-600/20 border-amber-600/30';
      default: return 'from-white/5 to-white/10 border-white/20';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-8 rounded-2xl border border-white/20 max-w-md w-full mx-4 max-h-[80vh] overflow-hidden">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white font-orbitron">🏆 Leaderboard</h2>
          <button onClick={onClose} className="text-white/60 hover:text-white">
            <X size={24} />
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-2 border-t-cyan-500 border-r-purple-500 border-b-pink-500 border-l-blue-500 rounded-full animate-spin mx-auto"></div>
            <p className="text-white/60 mt-4">Loading scores...</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {scores.length === 0 ? (
              <div className="text-center py-8 text-white/60">
                <Trophy size={48} className="mx-auto mb-4 opacity-50" />
                <p>No scores yet!</p>
                <p className="text-sm">Be the first to set a high score.</p>
              </div>
            ) : (
              scores.map((player, index) => (
                <div
                  key={player.username}
                  className={`flex items-center justify-between p-4 rounded-lg bg-gradient-to-r border ${getRankColor(index + 1)}`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8">
                      {getRankIcon(index + 1)}
                    </div>
                    <div>
                      <div className="text-white font-semibold">{player.username}</div>
                      <div className="text-white/60 text-sm">Rank #{index + 1}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-bold text-lg">
                      {player.high_score.toLocaleString()}
                    </div>
                    <div className="text-white/60 text-sm">points</div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        <div className="mt-6 text-center text-white/60 text-sm">
          Compete with players worldwide!
        </div>
      </div>
    </div>
  );
};
