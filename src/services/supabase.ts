import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qakbqdthvndmuxnvmmpp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFha2JxZHRodm5kbXV4bnZtbXBwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMxMjIyNDMsImV4cCI6MjA1ODY5ODI0M30.5cphbNo7EL_Z8Q7VzO-GyY7JaR059nDZ18c9xOCUexk';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface UserProfile {
  username: string;
  high_score?: number;
  email_verified?: boolean;
}

export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

export const signUp = async (email: string, password: string, username: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username,
        high_score: 0,
        email_verified: true
      }
    }
  });
  return { data, error };
};

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const updateHighScore = async (newScore: number) => {
  const user = await getCurrentUser();
  if (!user) return { error: 'No user logged in' };

  const currentData = user.user_metadata as UserProfile;
  const currentHighScore = currentData.high_score || 0;

  if (newScore > currentHighScore) {
    const { data, error } = await supabase.auth.updateUser({
      data: {
        ...currentData,
        high_score: newScore
      }
    });
    return { data, error };
  }
  
  return { data: null, error: null };
};

export const getLeaderboard = async (limit = 10) => {
  // Note: This is a workaround since we can't directly query auth.users
  // In a real implementation, you'd have a separate leaderboard table
  const { data: { user } } = await supabase.auth.getUser();
  
  // For now, we'll return mock data plus the current user
  const mockLeaderboard = [
    { username: 'nichochar', high_score: 1487 },
    { username: 'peter', high_score: 271 },
    { username: 'piper', high_score: 173 },
  ];

  if (user && user.user_metadata) {
    const userProfile = user.user_metadata as UserProfile;
    const userEntry = {
      username: userProfile.username,
      high_score: userProfile.high_score || 0
    };
    
    // Add current user to leaderboard if they have a score
    if (userEntry.high_score > 0) {
      mockLeaderboard.push(userEntry);
    }
  }

  // Sort by high score descending
  return mockLeaderboard
    .sort((a, b) => b.high_score - a.high_score)
    .slice(0, limit);
};
