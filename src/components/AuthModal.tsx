import { useState } from 'react';
import { Lock, Mail, User, X } from 'lucide-react';
import { signIn, signUp, signOut } from '../services/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  onAuthChange: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, user, onAuthChange }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) throw error;
      } else {
        const { error } = await signUp(email, password, username);
        if (error) throw error;
      }
      
      onAuthChange();
      onClose();
      setEmail('');
      setPassword('');
      setUsername('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    onAuthChange();
    onClose();
  };

  if (user) {
    const userData = user.user_metadata;
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-8 rounded-2xl border border-white/20 max-w-md w-full mx-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white font-orbitron">Profile</h2>
            <button onClick={onClose} className="text-white/60 hover:text-white">
              <X size={24} />
            </button>
          </div>
          
          <div className="space-y-4 text-center">
            <div className="p-4 bg-white/10 rounded-lg">
              <div className="text-cyan-400 font-semibold">Username</div>
              <div className="text-white text-xl">{userData?.username || 'Unknown'}</div>
            </div>
            
            <div className="p-4 bg-white/10 rounded-lg">
              <div className="text-purple-400 font-semibold">High Score</div>
              <div className="text-white text-2xl font-bold">
                {userData?.high_score?.toLocaleString() || '0'}
              </div>
            </div>
            
            <button
              onClick={handleSignOut}
              className="w-full py-3 bg-red-600 hover:bg-red-700 rounded-lg font-semibold text-white transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-8 rounded-2xl border border-white/20 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white font-orbitron">
            {isLogin ? 'Login' : 'Sign Up'}
          </h2>
          <button onClick={onClose} className="text-white/60 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60" size={20} />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                required
                className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-cyan-400"
              />
            </div>
          )}
          
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60" size={20} />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
              className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-cyan-400"
            />
          </div>
          
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60" size={20} />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-cyan-400"
            />
          </div>
          
          {error && (
            <div className="text-red-400 text-sm bg-red-500/20 p-3 rounded-lg">
              {error}
            </div>
          )}
          
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-lg font-bold text-white disabled:opacity-50 hover:scale-105 transition-transform"
          >
            {loading ? 'Loading...' : (isLogin ? 'Login' : 'Sign Up')}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            {isLogin ? 'Need an account? Sign up' : 'Already have an account? Login'}
          </button>
        </div>
      </div>
    </div>
  );
};
