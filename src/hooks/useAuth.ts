import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';

interface Profile {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
}

interface Workspace {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
}

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Track initialization to prevent duplicate fetches
  const initializedRef = useRef(false);
  const fetchingRef = useRef(false);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (data && !error) {
        setProfile(data);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  };

  const fetchWorkspaces = async () => {
    try {
      const { data, error } = await supabase
        .from('workspaces')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (data && !error) {
        setWorkspaces(data);
        if (data.length > 0) {
          setActiveWorkspace((prev) => prev || data[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching workspaces:', err);
    }
  };

  useEffect(() => {
    // Prevent double initialization in strict mode
    if (initializedRef.current) return;
    initializedRef.current = true;

    let isMounted = true;

    // INITIAL load (controls loading state)
    const initializeAuth = async () => {
      if (fetchingRef.current) return;
      fetchingRef.current = true;

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!isMounted) return;

        setSession(session);
        setUser(session?.user ?? null);

        // Fetch profile and workspaces BEFORE setting loading false
        if (session?.user) {
          await Promise.all([
            fetchProfile(session.user.id),
            fetchWorkspaces()
          ]);
        }
      } catch (err) {
        console.error('Error initializing auth:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
          fetchingRef.current = false;
        }
      }
    };

    initializeAuth();

    // Listener for ONGOING auth changes (does NOT control loading)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isMounted) return;

        // Ignore transient null sessions unless it's an explicit sign-out
        if (!session && event !== 'SIGNED_OUT') return;

        // Only update if session actually changed
        setSession((prevSession) => {
          if (prevSession?.access_token === session?.access_token) {
            return prevSession;
          }
          return session;
        });

        setUser(session?.user ?? null);

        if (session?.user) {
          // Fire-and-forget; do NOT delay with setTimeout (avoids race conditions)
          fetchProfile(session.user.id);
          fetchWorkspaces();
          return;
        }

        // Signed out
        setProfile(null);
        setWorkspaces([]);
        setActiveWorkspace(null);
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          full_name: fullName,
        },
      },
    });
    return { data, error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  return {
    session,
    user,
    profile,
    workspaces,
    activeWorkspace,
    setActiveWorkspace,
    loading,
    signIn,
    signUp,
    signOut,
    refreshWorkspaces: fetchWorkspaces,
  };
}
