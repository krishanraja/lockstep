import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Calendar, Users, ChevronRight, Sparkles, RefreshCw, LogOut, Crown, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, differenceInDays } from 'date-fns';
import { UsageSummary } from '@/components/UsageIndicator';
import { getSubscription, getEventUsage, PricingTier, TIER_LIMITS } from '@/services/subscription';

interface Event {
  id: string;
  title: string;
  location: string | null;
  start_date: string | null;
  end_date: string | null;
  status: string | null;
  template: string | null;
}

interface EventStats {
  eventId: string;
  totalGuests: number;
  respondedCount: number;
  pendingCount: number;
  inCount: number;
}

interface AISummary {
  eventId: string;
  summary: string;
  isLoading: boolean;
}

interface UserSubscription {
  tier: PricingTier;
  isAnnual: boolean;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [events, setEvents] = useState<Event[]>([]);
  const [eventStats, setEventStats] = useState<Map<string, EventStats>>(new Map());
  const [aiSummaries, setAiSummaries] = useState<Map<string, AISummary>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [subscription, setSubscription] = useState<UserSubscription>({ tier: 'free', isAnnual: false });
  const [totalUsage, setTotalUsage] = useState({ guests: 0, nudges: 0 });
  
  // Track mounted state to prevent state updates after unmount
  const isMountedRef = useRef(true);
  const pendingTimeoutsRef = useRef<Set<NodeJS.Timeout>>(new Set());

  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      // Clear all pending timeouts on unmount
      pendingTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      pendingTimeoutsRef.current.clear();
    };
  }, []);

  const fetchEventStats = useCallback(async (eventId: string) => {
    // Get guests count
    const { data: guests } = await supabase
      .from('guests')
      .select('id, status')
      .eq('event_id', eventId);

    if (!isMountedRef.current) return;

    const totalGuests = guests?.length || 0;
    const respondedCount = guests?.filter(g => g.status === 'responded').length || 0;
    const pendingCount = guests?.filter(g => g.status === 'pending').length || 0;

    // Get "in" RSVPs
    const { data: rsvps } = await supabase
      .from('rsvps')
      .select('guest_id, response')
      .in('guest_id', guests?.map(g => g.id) || [])
      .eq('response', 'in');

    if (!isMountedRef.current) return;

    const inCount = new Set(rsvps?.map(r => r.guest_id)).size;

    setEventStats(prev => new Map(prev).set(eventId, {
      eventId,
      totalGuests,
      respondedCount,
      pendingCount,
      inCount,
    }));
    
    return { eventId, totalGuests, respondedCount, pendingCount, inCount };
  }, []);

  const generateAISummary = useCallback(async (event: Event, stats: EventStats | undefined, retryCount = 0) => {
    if (!isMountedRef.current) return;
    
    if (!stats && retryCount < 5) {
      // Wait for stats to load with retry limit
      const timeout = setTimeout(() => {
        if (isMountedRef.current) {
          generateAISummary(event, eventStats.get(event.id), retryCount + 1);
        }
      }, 500);
      pendingTimeoutsRef.current.add(timeout);
      return;
    }
    
    if (!stats) return; // Give up after max retries

    setAiSummaries(prev => new Map(prev).set(event.id, {
      eventId: event.id,
      summary: '',
      isLoading: true,
    }));

    try {
      const daysUntilEvent = event.start_date 
        ? differenceInDays(new Date(event.start_date), new Date())
        : 0;

      const { data, error } = await supabase.functions.invoke('generate-summary', {
        body: {
          eventTitle: event.title,
          totalGuests: stats.totalGuests,
          respondedCount: stats.respondedCount,
          pendingCount: stats.pendingCount,
          daysUntilEvent,
          blockSummaries: [], // Would need to fetch these
          summaryType: 'status',
        },
      });

      if (!isMountedRef.current) return;

      if (!error && data?.summary) {
        setAiSummaries(prev => new Map(prev).set(event.id, {
          eventId: event.id,
          summary: data.summary,
          isLoading: false,
        }));
      } else {
        // Fallback summary
        setAiSummaries(prev => new Map(prev).set(event.id, {
          eventId: event.id,
          summary: `${stats.respondedCount} of ${stats.totalGuests} have responded.`,
          isLoading: false,
        }));
      }
    } catch (err) {
      if (!isMountedRef.current) return;
      
      setAiSummaries(prev => new Map(prev).set(event.id, {
        eventId: event.id,
        summary: `${stats?.respondedCount || 0} of ${stats?.totalGuests || 0} have responded.`,
        isLoading: false,
      }));
    }
  }, [eventStats]);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!isMountedRef.current) return;
      
      if (!user) {
        navigate('/auth');
        return;
      }
      setUser(user);
      
      // Check for upgrade success - clean up URL silently
      if (searchParams.get('upgraded') === 'true') {
        // Clean up URL
        window.history.replaceState({}, '', '/dashboard');
      }
      
      // Fetch user subscription
      const sub = await getSubscription(user.id);
      if (isMountedRef.current) {
        setSubscription({ tier: sub.tier, isAnnual: sub.isAnnual });
      }
      
      // Fetch events
      setIsLoading(true);
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('organiser_id', user.id)
        .order('created_at', { ascending: false });

      if (!isMountedRef.current) return;

      if (!error && data) {
        setEvents(data);
        
        // Calculate total usage across all events
        let totalGuests = 0;
        let totalNudges = 0;
        
        // Fetch stats for each event and then generate summaries
        for (const event of data) {
          const stats = await fetchEventStats(event.id);
          if (stats) {
            totalGuests += stats.totalGuests;
          }
          
          // Get nudge count for this event
          const { count: nudgeCount } = await supabase
            .from('nudges')
            .select('*', { count: 'exact', head: true })
            .eq('checkpoint_id', event.id);
          totalNudges += nudgeCount || 0;
          
          // Generate AI summary for active events
          if (event.status === 'active' && stats) {
            generateAISummary(event, stats);
          }
        }
        
        if (isMountedRef.current) {
          setTotalUsage({ guests: totalGuests, nudges: totalNudges });
        }
      }
      
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, [navigate, fetchEventStats, generateAISummary, searchParams]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'active': return 'bg-confirmed/10 text-confirmed';
      case 'draft': return 'bg-maybe/10 text-maybe';
      case 'completed': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getDaysUntil = (dateStr: string | null) => {
    if (!dateStr) return null;
    const days = differenceInDays(new Date(dateStr), new Date());
    if (days < 0) return 'Past';
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    return `${days} days`;
  };

  return (
    <div className="h-dvh w-full flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 px-6 py-4 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-display font-bold text-foreground">Your Events</h1>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-sm text-muted-foreground">Manage and track your gatherings</p>
              {subscription.tier !== 'free' && (
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Crown className="w-3 h-3" />
                  {subscription.tier === 'annual_pro' ? 'Annual Pro' : subscription.tier}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/profile')}
              className="p-2 rounded-full text-muted-foreground hover:text-primary
                hover:bg-primary/10 transition-colors"
              title="Profile"
            >
              <User className="w-5 h-5" />
            </button>
            <button
              onClick={handleSignOut}
              className="p-2 rounded-full text-muted-foreground hover:text-foreground
                hover:bg-muted transition-colors"
              title="Sign out"
            >
              <LogOut className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigate('/create')}
              className="w-10 h-10 rounded-full bg-primary flex items-center justify-center
                hover:opacity-90 transition-opacity"
            >
              <Plus className="w-5 h-5 text-primary-foreground" />
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : events.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center h-full text-center"
          >
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Calendar className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-lg font-medium text-foreground mb-2">No events yet</h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs">
              Create your first event and start collecting RSVPs
            </p>
            <button
              onClick={() => navigate('/create')}
              className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium
                flex items-center gap-2 hover:opacity-90 transition-opacity"
            >
              <Plus className="w-5 h-5" />
              Create Event
            </button>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {/* Usage Summary for Free Tier */}
            {subscription.tier === 'free' && events.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl bg-card border border-border/50 p-4"
              >
                <UsageSummary
                  guestsUsed={totalUsage.guests}
                  guestsLimit={TIER_LIMITS.free.guests * events.length}
                  nudgesUsed={totalUsage.nudges}
                  nudgesLimit={TIER_LIMITS.free.nudges * events.length}
                  tier={subscription.tier}
                  onUpgradeClick={() => navigate('/pricing')}
                />
              </motion.div>
            )}
            
            {events.map((event, index) => {
              const stats = eventStats.get(event.id);
              const aiSummary = aiSummaries.get(event.id);
              const daysUntil = getDaysUntil(event.start_date);
              const needsAttention = stats && stats.pendingCount > 0;

              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="rounded-2xl bg-card border border-border/50 overflow-hidden"
                >
                  {/* Event header - clickable */}
                  <button
                    onClick={() => navigate(`/events/${event.id}`)}
                    className="w-full p-4 text-left hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-foreground">{event.title}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-xs ${getStatusColor(event.status)}`}>
                            {event.status || 'draft'}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {event.location || 'No location set'}
                        </p>
                        {event.start_date && (
                          <div className="flex items-center gap-3 mt-2 text-sm">
                            <span className="text-muted-foreground">
                              {format(new Date(event.start_date), 'MMM d, yyyy')}
                            </span>
                            {daysUntil && (
                              <span className={`px-2 py-0.5 rounded-full text-xs
                                ${daysUntil === 'Today' || daysUntil === 'Tomorrow'
                                  ? 'bg-maybe/10 text-maybe'
                                  : 'bg-muted text-muted-foreground'
                                }`}
                              >
                                {daysUntil}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    </div>
                  </button>

                  {/* Stats bar */}
                  {stats && stats.totalGuests > 0 && (
                    <div className="px-4 pb-3 flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span className="text-foreground">{stats.inCount}</span>
                        <span className="text-muted-foreground">/ {stats.totalGuests} in</span>
                      </div>
                      {stats.pendingCount > 0 && (
                        <span className="text-maybe">
                          {stats.pendingCount} pending
                        </span>
                      )}
                    </div>
                  )}

                  {/* AI Summary */}
                  <AnimatePresence>
                    {event.status === 'active' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border-t border-border/50 px-4 py-3 bg-muted/30"
                      >
                        <div className="flex items-start gap-2">
                          <Sparkles className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                          {aiSummary?.isLoading ? (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <RefreshCw className="w-3 h-3 animate-spin" />
                              Analyzing...
                            </div>
                          ) : (
                            <p className="text-sm text-foreground">
                              {aiSummary?.summary || 'No summary available.'}
                            </p>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Needs attention callout */}
                  {needsAttention && stats.pendingCount >= 3 && (
                    <div className="border-t border-border/50 px-4 py-3 bg-maybe/5">
                      <button
                        onClick={() => navigate(`/events/${event.id}`)}
                        className="w-full py-2 rounded-xl bg-maybe text-background font-medium text-sm
                          hover:opacity-90 transition-opacity"
                      >
                        Nudge {stats.pendingCount} pending guests
                      </button>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
