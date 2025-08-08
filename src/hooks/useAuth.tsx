
import { useState, useEffect, useRef } from 'react';
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
  const isCreatingProfile = useRef(false);
  const currentUserId = useRef<string | null>(null);

  const isAutorabitEmployee = (email: string) => {
    return email.includes('@autorabit.com');
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state change:', event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Skip if already processing this user or if already creating profile
          if (currentUserId.current === session.user.id && isCreatingProfile.current) {
            console.log('Profile operation already in progress for this user, skipping');
            return;
          }
          
          // Fetch user profile when authenticated
          setTimeout(async () => {            
            try {
              // Set flags to prevent race conditions
              isCreatingProfile.current = true;
              currentUserId.current = session.user.id;
              console.log('Fetching profile for user:', session.user.id);
              
              // First try to get existing profile
              const { data: profileData, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('user_id', session.user.id)
                .maybeSingle();
              
              if (error) {
                console.error('Profile fetch error:', error);
                setProfile(null);
              } else if (profileData) {
                console.log('Profile found:', profileData);
                setProfile(profileData);
              } else {
                console.log('No profile found, creating one...');
                // Profile doesn't exist, create one manually since trigger might have failed
                let employeeNumber = session.user.user_metadata?.employee_number;
                
                // Check if the employee number already exists for a different user
                if (employeeNumber) {
                  const { data: existingByNumber } = await supabase
                    .from('profiles')
                    .select('user_id, employee_number')
                    .eq('employee_number', employeeNumber)
                    .maybeSingle();
                  
                  // If employee number exists for different user, generate a new one
                  if (existingByNumber && existingByNumber.user_id !== session.user.id) {
                    console.log(`Employee number ${employeeNumber} exists for different user, generating new one`);
                    employeeNumber = `EMP${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 100).toString().padStart(2, '0')}`;
                  }
                }
                
                // If still no employee number, generate one
                if (!employeeNumber) {
                  employeeNumber = `EMP${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 100).toString().padStart(2, '0')}`;
                }
                
                const { data: newProfile, error: insertError } = await supabase
                  .from('profiles')
                  .insert({
                    user_id: session.user.id,
                    employee_number: employeeNumber,
                    full_name: session.user.user_metadata?.full_name || '',
                    company_email: session.user.user_metadata?.company_email || session.user.email || ''
                  })
                  .select()
                  .maybeSingle();
                
                if (insertError) {
                  console.error('Profile creation error:', insertError);
                  // If it's a duplicate key error, try to fetch the existing profile
                  if (insertError.code === '23505') {
                    console.log('Duplicate key error, attempting to fetch existing profile...');
                    // Add a small delay and retry fetching
                    await new Promise(resolve => setTimeout(resolve, 100));
                    const { data: existingProfile } = await supabase
                      .from('profiles')
                      .select('*')
                      .eq('user_id', session.user.id)
                      .maybeSingle();
                    
                    if (existingProfile) {
                      console.log('Found existing profile after duplicate error:', existingProfile);
                      setProfile(existingProfile);
                    } else {
                      setProfile(null);
                    }
                  } else {
                    setProfile(null);
                  }
                } else {
                  console.log('Profile created:', newProfile);
                  setProfile(newProfile);
                }
              }
            } catch (err) {
              console.error('Profile operation error:', err);
              setProfile(null);
            } finally {
              isCreatingProfile.current = false;
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
      console.log('Initial session check:', session?.user?.email);
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
