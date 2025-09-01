
import { useState, useEffect, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  user_id: string;
  employee_number: string;
  full_name: string;
  company_email: string;
  department: string | null;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const isCreatingProfile = useRef(false);
  const currentUserId = useRef<string | null>(null);

  const isAutorabitEmployee = (email: string) => {
    return email.includes('@autorabit.com');
  };

  useEffect(() => {
    let mounted = true;
    
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.email);
        
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Skip if already processing this user or if already creating profile
          if (currentUserId.current === session.user.id && isCreatingProfile.current) {
            console.log('Profile operation already in progress for this user, skipping');
            return;
          }
          
          // Skip profile creation completely and just continue
          console.log('User authenticated, continuing without profile fetch');
          if (mounted) setLoading(false);
        } else {
          if (mounted) {
            setProfile(null);
            setLoading(false);
          }
        }
      }
    );

    // THEN check for existing session
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting session:', error);
        }
        if (!mounted) return;
        
      console.log('Initial session check:', session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);
      if (!session) {
        setLoading(false);
      }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        if (mounted) setLoading(false);
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
      }
      setUser(null);
      setSession(null);
      setProfile(null);
    } catch (error) {
      console.error('Failed to sign out:', error);
    }
  };

  return {
    user,
    session,
    profile,
    loading,
    signOut,
    isAuthenticated: !!user,
    isAutorabitEmployee: user?.email ? isAutorabitEmployee(user.email) : false
  };
};
