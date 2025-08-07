
import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  user_id: string;
  employee_number: string;
  full_name: string;
  company_email: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const isAutorabitEmployee = (email: string) => {
    return email.includes('@autorabit.com');
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch user profile when authenticated
          setTimeout(async () => {
            try {
              const { data: profileData, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('user_id', session.user.id)
                .maybeSingle();
              
              if (error) {
                console.error('Profile fetch error:', error);
                setProfile(null);
              } else if (!profileData) {
                // Profile doesn't exist, create one from user metadata
                const { data: newProfile, error: insertError } = await supabase
                  .from('profiles')
                  .insert({
                    user_id: session.user.id,
                    employee_number: session.user.user_metadata?.employee_number || '',
                    full_name: session.user.user_metadata?.full_name || '',
                    company_email: session.user.user_metadata?.company_email || session.user.email || ''
                  })
                  .select()
                  .maybeSingle();
                
                if (insertError) {
                  console.error('Profile creation error:', insertError);
                  setProfile(null);
                } else {
                  setProfile(newProfile);
                }
              } else {
                setProfile(profileData);
              }
            } catch (err) {
              console.error('Profile operation error:', err);
              setProfile(null);
            } finally {
              setLoading(false);
            }
          }, 0);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (!session) {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
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
