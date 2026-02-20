// Real-time Events Hook - Supabase Realtime subscriptions for live updates
import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { eventKeys } from '@/queries/event-queries';

interface UseRealtimeEventsOptions {
  eventId: string;
  onUpdate?: (table: string, payload: any) => void;
  enabled?: boolean;
}

interface UseRealtimeEventsReturn {
  isConnected: boolean;
  reconnect: () => void;
}

export function useRealtimeEvents({
  eventId,
  onUpdate,
  enabled = true,
}: UseRealtimeEventsOptions): UseRealtimeEventsReturn {
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const isConnectedRef = useRef(false);

  const handleChange = useCallback(
    (table: string) => (payload: RealtimePostgresChangesPayload<any>) => {
      console.log(`[Realtime] ${table} changed:`, payload.eventType);
      
      // Notify callback
      onUpdate?.(table, payload);

      // Invalidate relevant queries based on table
      switch (table) {
        case 'rsvps':
          queryClient.invalidateQueries({ queryKey: eventKeys.stats(eventId) });
          queryClient.invalidateQueries({ queryKey: eventKeys.detail(eventId) });
          break;
        case 'guests':
          queryClient.invalidateQueries({ queryKey: eventKeys.detail(eventId) });
          queryClient.invalidateQueries({ queryKey: eventKeys.stats(eventId) });
          break;
        case 'nudges':
          // Nudges don't need to invalidate main queries, just track state
          break;
        case 'blocks':
          queryClient.invalidateQueries({ queryKey: eventKeys.detail(eventId) });
          break;
      }
    },
    [eventId, queryClient, onUpdate]
  );

  const setupSubscription = useCallback(() => {
    if (!enabled || !eventId) return;

    // Clean up existing channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    // Create new channel for this event
    const channel = supabase
      .channel(`event-${eventId}`)
      // Subscribe to RSVP changes for blocks in this event
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rsvps',
          filter: `block_id=in.(select id from blocks where event_id=eq.${eventId})`,
        },
        handleChange('rsvps')
      )
      // Subscribe to guest changes for this event
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'guests',
          filter: `event_id=eq.${eventId}`,
        },
        handleChange('guests')
      )
      // Subscribe to block changes for this event
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'blocks',
          filter: `event_id=eq.${eventId}`,
        },
        handleChange('blocks')
      )
      .subscribe((status) => {
        console.log(`[Realtime] Channel status:`, status);
        isConnectedRef.current = status === 'SUBSCRIBED';
      });

    channelRef.current = channel;
  }, [eventId, enabled, handleChange]);

  const reconnect = useCallback(() => {
    setupSubscription();
  }, [setupSubscription]);

  useEffect(() => {
    setupSubscription();

    return () => {
      if (channelRef.current) {
        console.log('[Realtime] Cleaning up channel');
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
        isConnectedRef.current = false;
      }
    };
  }, [setupSubscription]);

  return {
    isConnected: isConnectedRef.current,
    reconnect,
  };
}

// Hook for dashboard-level real-time updates (all events for a user)
interface UseRealtimeDashboardOptions {
  userId: string | undefined;
  onUpdate?: (table: string, payload: any) => void;
  enabled?: boolean;
}

export function useRealtimeDashboard({
  userId,
  onUpdate,
  enabled = true,
}: UseRealtimeDashboardOptions): UseRealtimeEventsReturn {
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const isConnectedRef = useRef(false);

  const handleChange = useCallback(
    (table: string) => (payload: RealtimePostgresChangesPayload<any>) => {
      console.log(`[Realtime Dashboard] ${table} changed:`, payload.eventType);
      
      // Notify callback
      onUpdate?.(table, payload);

      // Invalidate dashboard queries
      if (userId) {
        queryClient.invalidateQueries({ queryKey: eventKeys.list(userId) });
      }
    },
    [userId, queryClient, onUpdate]
  );

  const setupSubscription = useCallback(() => {
    if (!enabled || !userId) return;

    // Clean up existing channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    // Create new channel for dashboard updates
    const channel = supabase
      .channel(`dashboard-${userId}`)
      // Subscribe to event changes for this user
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'events',
          filter: `organiser_id=eq.${userId}`,
        },
        handleChange('events')
      )
      .subscribe((status) => {
        console.log(`[Realtime Dashboard] Channel status:`, status);
        isConnectedRef.current = status === 'SUBSCRIBED';
      });

    channelRef.current = channel;
  }, [userId, enabled, handleChange]);

  const reconnect = useCallback(() => {
    setupSubscription();
  }, [setupSubscription]);

  useEffect(() => {
    setupSubscription();

    return () => {
      if (channelRef.current) {
        console.log('[Realtime Dashboard] Cleaning up channel');
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
        isConnectedRef.current = false;
      }
    };
  }, [setupSubscription]);

  return {
    isConnected: isConnectedRef.current,
    reconnect,
  };
}

export default useRealtimeEvents;
