import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export function useAdmin() {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Track the user ID we last checked to prevent stale results
  const checkedUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    // If auth is still loading, keep admin loading too
    if (authLoading) {
      setLoading(true);
      return;
    }

    // No user after auth loaded = not admin
    if (!user?.id) {
      setIsAdmin(false);
      setLoading(false);
      checkedUserIdRef.current = null;
      return;
    }

    // If we already checked this exact user, don't re-check
    if (checkedUserIdRef.current === user.id) {
      return;
    }

    // New user to check - set loading and check
    const checkAdminStatus = async () => {
      setLoading(true);
      
      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .maybeSingle();

        if (error) {
          console.error('Error checking admin status:', error);
          setIsAdmin(false);
        } else {
          setIsAdmin(!!data);
        }
      } catch (err) {
        console.error('Admin check failed:', err);
        setIsAdmin(false);
      } finally {
        checkedUserIdRef.current = user.id;
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, [user?.id, authLoading]);

  return { isAdmin, loading };
}
