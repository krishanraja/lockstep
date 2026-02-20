// Event-related TanStack Query hooks
// Centralized data fetching with proper caching and batching

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { differenceInDays } from 'date-fns';

// Types
export interface Event {
  id: string;
  title: string;
  location: string | null;
  start_date: string | null;
  end_date: string | null;
  status: string | null;
  template: string | null;
  cover_image_url?: string | null;
}

export interface EventStats {
  eventId: string;
  totalGuests: number;
  respondedCount: number;
  pendingCount: number;
  inCount: number;
}

export interface AISummary {
  eventId: string;
  summary: string;
  isLoading: boolean;
}

export interface EventWithStats extends Event {
  stats: EventStats | null;
  aiSummary: AISummary | null;
}

// Query Keys
export const eventKeys = {
  all: ['events'] as const,
  list: (userId: string) => [...eventKeys.all, 'list', userId] as const,
  detail: (eventId: string) => [...eventKeys.all, 'detail', eventId] as const,
  stats: (eventId: string) => [...eventKeys.all, 'stats', eventId] as const,
  allStats: (userId: string) => [...eventKeys.all, 'allStats', userId] as const,
  summary: (eventId: string) => [...eventKeys.all, 'summary', eventId] as const,
};

// Fetch all events for a user
async function fetchEvents(userId: string): Promise<Event[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('organiser_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

// Fetch stats for a single event
async function fetchEventStats(eventId: string): Promise<EventStats> {
  // Get guests count
  const { data: guests } = await supabase
    .from('guests')
    .select('id, status')
    .eq('event_id', eventId);

  const guestList = guests || [];
  const totalGuests = guestList.length;
  const respondedCount = guestList.filter(g => g.status === 'responded').length;
  const pendingCount = guestList.filter(g => g.status === 'pending').length;

  // Get "in" RSVPs - only if there are guests
  let inCount = 0;
  if (guestList.length > 0) {
    const { data: rsvps } = await supabase
      .from('rsvps')
      .select('guest_id, response')
      .in('guest_id', guestList.map(g => g.id))
      .eq('response', 'in');

    inCount = new Set(rsvps?.map(r => r.guest_id)).size;
  }

  return {
    eventId,
    totalGuests,
    respondedCount,
    pendingCount,
    inCount,
  };
}

// Fetch stats for all events in parallel (batched)
async function fetchAllEventStats(events: Event[]): Promise<Map<string, EventStats>> {
  const statsPromises = events.map(event => fetchEventStats(event.id));
  const statsArray = await Promise.all(statsPromises);
  
  const statsMap = new Map<string, EventStats>();
  statsArray.forEach(stats => {
    statsMap.set(stats.eventId, stats);
  });
  
  return statsMap;
}

// Generate AI summary for an event
async function generateAISummary(
  event: Event,
  stats: EventStats
): Promise<AISummary> {
  try {
    const daysUntilEvent = event.start_date 
      ? differenceInDays(new Date(event.start_date), new Date())
      : 0;

    const { data, error } = await supabase.functions.invoke('generate-summary', {
      body: {
        eventId: event.id,
        eventTitle: event.title,
        totalGuests: stats.totalGuests,
        respondedCount: stats.respondedCount,
        pendingCount: stats.pendingCount,
        daysUntilEvent,
        blockSummaries: [],
        summaryType: 'status',
      },
    });

    if (!error && data?.summary) {
      return {
        eventId: event.id,
        summary: data.summary,
        isLoading: false,
      };
    }
  } catch (err) {
    console.error('[event-queries] Error generating AI summary:', err);
  }

  // Fallback summary
  return {
    eventId: event.id,
    summary: `${stats.respondedCount} of ${stats.totalGuests} have responded.`,
    isLoading: false,
  };
}

// Combined fetch for dashboard - events + stats in optimized batches
async function fetchDashboardData(userId: string): Promise<{
  events: Event[];
  stats: Map<string, EventStats>;
}> {
  // First fetch events
  const events = await fetchEvents(userId);
  
  // Then batch fetch all stats in parallel
  const stats = await fetchAllEventStats(events);
  
  return { events, stats };
}

// ============ HOOKS ============

// Hook to get current user
export function useCurrentUser() {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
    staleTime: 5 * 60 * 1000, // User info is stable for 5 minutes
    gcTime: 10 * 60 * 1000,
  });
}

// Hook to fetch all dashboard data with batched loading
export function useDashboardData(userId: string | undefined) {
  return useQuery({
    queryKey: eventKeys.list(userId || ''),
    queryFn: () => fetchDashboardData(userId!),
    enabled: !!userId,
    staleTime: 30000, // Consider data fresh for 30 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    placeholderData: (previousData) => previousData, // Keep showing old data while refetching
  });
}

// Hook to fetch AI summary for a single event (on-demand)
export function useAISummary(event: Event | null, stats: EventStats | null) {
  return useQuery({
    queryKey: eventKeys.summary(event?.id || ''),
    queryFn: () => generateAISummary(event!, stats!),
    enabled: !!event && !!stats && event.status === 'active',
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
}

// Hook to fetch event detail
export function useEventDetail(eventId: string | undefined) {
  return useQuery({
    queryKey: eventKeys.detail(eventId || ''),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!eventId,
  });
}

// Hook to fetch event stats
export function useEventStats(eventId: string | undefined) {
  return useQuery({
    queryKey: eventKeys.stats(eventId || ''),
    queryFn: () => fetchEventStats(eventId!),
    enabled: !!eventId,
    staleTime: 30000,
  });
}

// Hook for subscription status
export function useSubscription(userId: string | undefined) {
  return useQuery({
    queryKey: ['subscription', userId],
    queryFn: async () => {
      const { data } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      return data || { tier: 'free', isAnnual: false };
    },
    enabled: !!userId,
    staleTime: 60000, // Subscription info rarely changes
  });
}

// Hook to invalidate dashboard data (for real-time updates)
export function useInvalidateDashboard() {
  const queryClient = useQueryClient();
  
  return () => {
    queryClient.invalidateQueries({ queryKey: eventKeys.all });
  };
}
