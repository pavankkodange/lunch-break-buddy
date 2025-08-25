
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
          
          try {
            // Set flags to prevent race conditions
            isCreatingProfile.current = true;
            currentUserId.current = session.user.id;
            console.log('Fetching profile for user:', session.user.id);
            
            // Create or fetch profile via RPC to avoid duplicates
            const { data: rpcData, error: rpcError } = await supabase.rpc('create_or_get_profile', {
              p_user_id: session.user.id,
              p_employee_number: session.user.user_metadata?.employee_number || null,
              p_full_name: session.user.user_metadata?.full_name || '',
              p_company_email: session.user.user_metadata?.company_email || session.user.email || ''
            });

            if (!mounted) return;

            if (rpcError) {
              console.error('Profile RPC error:', rpcError);
              setProfile(null);
            } else if (rpcData && rpcData.length > 0) {
              const { id, user_id, employee_number, full_name, company_email, department } = rpcData[0];
              console.log('Profile upserted/fetched via RPC:', rpcData[0]);
              setProfile({ id, user_id, employee_number, full_name, company_email, department });
            } else {
              console.warn('Profile RPC returned no data');
              setProfile(null);
            }
          } catch (err) {
            console.error('Profile operation error:', err);
            if (mounted) setProfile(null);
          } finally {
            isCreatingProfile.current = false;
            if (mounted) setLoading(false);
          }
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
