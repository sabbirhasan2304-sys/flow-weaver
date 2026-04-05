import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Subscribes to realtime changes on tracking_events and
 * invalidates all related react-query caches so every
 * dashboard / list auto-refreshes instantly.
 */
export function useTrackingRealtime(enabled: boolean) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return;

    const channel = supabase
      .channel('tracking-events-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tracking_events' },
        () => {
          // Invalidate every query whose key starts with "tracking-events"
          queryClient.invalidateQueries({ queryKey: ['tracking-events'] });
          queryClient.invalidateQueries({ queryKey: ['tracking-events-overview'] });
          queryClient.invalidateQueries({ queryKey: ['tracking-events-stats'] });
          queryClient.invalidateQueries({ queryKey: ['tracking-events-monitoring'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [enabled, queryClient]);
}
