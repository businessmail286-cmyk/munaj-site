import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase, getProfile, updateProfile as updateProfileApi } from '../lib/supabase';
import { Profile } from '../types';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string, fullName: string, phone?: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  refreshProfile: () => Promise<void>;
  updateCustomerProfile: (updates: Partial<Profile>) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Sync profile when user changes
  const syncProfile = async (currentUser: User | null) => {
    if (!currentUser) {
      setProfile(null);
      return;
    }

    try {
      let currentProfile = await getProfile(currentUser.id);
      if (!currentProfile) {
        // Attempt to create a profile row if it doesn't exist yet
        const newProfileData: Profile = {
          id: currentUser.id,
          full_name: currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'Munaj Customer',
          email: currentUser.email || null,
          phone: currentUser.user_metadata?.phone || null,
          avatar_url: currentUser.user_metadata?.avatar_url || null,
          role: 'customer',
          status: 'active',
          created_at: new Date().toISOString(),
        };

        const { data } = await supabase
          .from('profiles')
          .upsert(newProfileData)
          .select()
          .maybeSingle();

        if (data) {
          setProfile(data);
        } else {
          setProfile(newProfileData);
        }
      } else {
        setProfile(currentProfile);
      }
    } catch (err) {
      console.warn('Profile sync warning:', err);
      // Construct in-memory fallback
      setProfile({
        id: currentUser.id,
        full_name: currentUser.user_metadata?.full_name || 'Munaj Customer',
        email: currentUser.email || null,
        phone: currentUser.user_metadata?.phone || null,
        avatar_url: null,
        role: 'customer',
        status: 'active',
        created_at: new Date().toISOString(),
      });
    }
  };

  useEffect(() => {
    // Initial session retrieval
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        syncProfile(session.user);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await syncProfile(session.user);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (data.session) {
      setSession(data.session);
      setUser(data.user);
      await syncProfile(data.user);
    }
    return { error };
  };

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    phone?: string
  ) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone: phone || '',
        },
      },
    });

    if (data.user) {
      // Create profile row immediately
      try {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          full_name: fullName,
          email: email,
          phone: phone || null,
          avatar_url: null,
          role: 'customer',
          status: 'active',
          created_at: new Date().toISOString(),
        });
      } catch (e) {
        console.warn('Could not insert profile upon registration:', e);
      }
      await syncProfile(data.user);
    }

    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    return { error };
  };

  const refreshProfile = async () => {
    if (user) {
      await syncProfile(user);
    }
  };

  const updateCustomerProfile = async (updates: Partial<Profile>): Promise<boolean> => {
    if (!user) return false;
    const updated = await updateProfileApi(user.id, updates);
    if (updated) {
      setProfile(updated);
      return true;
    } else {
      setProfile((prev) => (prev ? { ...prev, ...updates } : null));
      return true;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        signIn,
        signUp,
        signOut,
        resetPassword,
        refreshProfile,
        updateCustomerProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
