import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export function useAdmin() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkAdminStatus = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .maybeSingle();

      if (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
        return;
      }

      setIsAdmin(!!data);
    } catch (err) {
      console.error('Admin check failed:', err);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Important: user can be null on first render even when a session exists.
    // If we mark loading=false too early, callers may redirect before the admin check completes.
    if (!user?.id) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    checkAdminStatus(user.id);
  }, [user?.id, checkAdminStatus]);

  return { isAdmin, loading };
}

