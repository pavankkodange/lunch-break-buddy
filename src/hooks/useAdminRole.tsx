import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

type AdminRole = 'autorabit_admin' | 'view_only_admin' | 'hr_admin' | 'employee' | null;

export const useAdminRole = () => {
  const [adminRole, setAdminRole] = useState<AdminRole>(null);
  const [loading, setLoading] = useState(true);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    const fetchAdminRole = async () => {
      if (!isAuthenticated || !user) {
        setAdminRole(null);
        setLoading(false);
        return;
      }

      try {
        console.log('Fetching admin role for user:', user.id);
        const { data, error } = await supabase.rpc('get_user_admin_role', {
          user_id: user.id
        });

        console.log('Admin role response:', { data, error });

        if (error) {
          console.error('Error fetching admin role:', error);
          setAdminRole(null);
        } else {
          console.log('Setting admin role to:', data);
          setAdminRole(data as AdminRole);
        }
      } catch (error) {
        console.error('Error fetching admin role:', error);
        setAdminRole(null);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminRole();
  }, [user, isAuthenticated]);

  return {
    adminRole,
    loading,
    isAutorabitAdmin: adminRole === 'autorabit_admin',
    isViewOnlyAdmin: adminRole === 'view_only_admin',
    hasAdminAccess: adminRole === 'autorabit_admin' || adminRole === 'view_only_admin'
  };
};