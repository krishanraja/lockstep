// Dashboard - Refactored with TanStack Query for stable, flicker-free loading
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Calendar, LogOut, Crown, User, Archive, Trash2, CheckSquare, Square } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { UsageSummary } from '@/components/UsageIndicator';
import { TIER_LIMITS } from '@/services/subscription';
import { EventCard, EventCardSkeletonList } from '@/components/Dashboard';
import { 
  useCurrentUser, 
  useDashboardData, 
  useSubscription 
} from '@/queries/event-queries';
import { useRealtimeDashboard } from '@/hooks/use-realtime-events';

const Dashboard = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Get current user with React Query (stable, cached)
  const { data: user, isLoading: userLoading } = useCurrentUser();
  
  // Fetch all dashboard data in one batched query
  const { 
    data: dashboardData, 
    isLoading: dataLoading,
    isError: dataError
  } = useDashboardData(user?.id);
  
  // Get subscription status
  const { data: subscription } = useSubscription(user?.id);
  
  // Real-time updates for dashboard
  useRealtimeDashboard({
    userId: user?.id,
    enabled: !!user,
  });
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!userLoading && !user) {
      navigate('/auth');
    }
  }, [user, userLoading, navigate]);
  
  // Clean up upgrade success URL parameter
  useEffect(() => {
    if (searchParams.get('upgraded') === 'true') {
      window.history.replaceState({}, '', '/dashboard');
    }
  }, [searchParams]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  // Derive values from data
  const allEvents = dashboardData?.events || [];
  const eventStats = dashboardData?.stats || new Map();
  const tier = subscription?.tier || 'free';
  const isAnnual = subscription?.isAnnual || false;
  
  // Sort events: needs attention first, then by date (upcoming first)
  const events = [...allEvents].sort((a, b) => {
    const aStats = eventStats.get(a.id);
    const bStats = eventStats.get(b.id);
    const aNeedsAttention = aStats && aStats.pendingCount >= 3;
    const bNeedsAttention = bStats && bStats.pendingCount >= 3;
    
    // Needs attention first
    if (aNeedsAttention && !bNeedsAttention) return -1;
    if (!aNeedsAttention && bNeedsAttention) return 1;
    
    // Then by date (upcoming first, null dates last)
    if (!a.start_date && !b.start_date) return 0;
    if (!a.start_date) return 1;
    if (!b.start_date) return -1;
    
    const aDate = new Date(a.start_date).getTime();
    const bDate = new Date(b.start_date).getTime();
    return aDate - bDate;
  });
  
  // Calculate total usage across all events
  const totalUsage = {
    guests: Array.from(eventStats.values()).reduce((sum, s) => sum + s.totalGuests, 0),
    nudges: 0, // Would need separate query for nudges
  };

  // Loading state - show skeletons
  const isLoading = userLoading || dataLoading;

  return (
    <div className="h-dvh w-full flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 px-6 py-4 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-display font-bold text-foreground">Your Events</h1>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-sm text-muted-foreground">Manage and track your gatherings</p>
              {tier !== 'free' && (
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Crown className="w-3 h-3" />
                  {tier === 'annual_pro' ? 'Annual Pro' : tier}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {events.length > 0 && (
              <button
                onClick={() => {
                  setIsSelectMode(!isSelectMode);
                  if (isSelectMode) setSelectedEvents(new Set());
                }}
                className="p-2 rounded-full text-muted-foreground hover:text-foreground
                  hover:bg-muted transition-colors"
                aria-label={isSelectMode ? "Cancel selection" : "Select events"}
                title={isSelectMode ? "Cancel" : "Select"}
              >
                {isSelectMode ? (
                  <Square className="w-5 h-5" />
                ) : (
                  <CheckSquare className="w-5 h-5" />
                )}
              </button>
            )}
            <button
              onClick={() => navigate('/profile')}
              className="p-2 rounded-full text-muted-foreground hover:text-primary
                hover:bg-primary/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label="Open profile settings"
              title="Profile"
            >
              <User className="w-5 h-5" />
            </button>
            <button
              onClick={handleSignOut}
              className="p-2 rounded-full text-muted-foreground hover:text-foreground
                hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigate('/create')}
              className="w-10 h-10 rounded-full bg-primary flex items-center justify-center
                hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              aria-label="Create new event"
            >
              <Plus className="w-5 h-5 text-primary-foreground" />
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          // Skeleton loading state - smooth, no flash
          <EventCardSkeletonList count={3} />
        ) : dataError ? (
          // Error state
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <span className="text-2xl">😕</span>
            </div>
            <h2 className="text-lg font-medium text-foreground mb-2">Something went wrong</h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs">
              We couldn't load your events. Please try again.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium
                hover:opacity-90 transition-opacity"
            >
              Reload
            </button>
          </div>
        ) : events.length === 0 ? (
          // Empty state
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
                flex items-center gap-2 hover:opacity-90 transition-opacity
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              aria-label="Create your first event"
            >
              <Plus className="w-5 h-5" />
              Create Event
            </button>
          </motion.div>
        ) : (
          // Events list
          <div className="space-y-4">
            {/* Bulk actions bar */}
            {isSelectMode && selectedEvents.size > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="sticky top-0 z-10 p-4 bg-card border border-border/50 rounded-2xl
                  flex items-center justify-between gap-3 shadow-lg"
              >
                <span className="text-sm text-foreground font-medium">
                  {selectedEvents.size} event{selectedEvents.size !== 1 ? 's' : ''} selected
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      // Archive selected events
                      for (const eventId of selectedEvents) {
                        await supabase
                          .from('events')
                          .update({ status: 'archived' })
                          .eq('id', eventId);
                      }
                      setSelectedEvents(new Set());
                      setIsSelectMode(false);
                      window.location.reload();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-muted text-foreground text-sm font-medium
                      hover:bg-muted/80 transition-colors flex items-center gap-1.5"
                    aria-label={`Archive ${selectedEvents.size} events`}
                  >
                    <Archive className="w-4 h-4" />
                    Archive
                  </button>
                  <button
                    onClick={async () => {
                      // Delete selected events (with confirmation)
                      if (confirm(`Delete ${selectedEvents.size} event${selectedEvents.size !== 1 ? 's' : ''}? This cannot be undone.`)) {
                        for (const eventId of selectedEvents) {
                          await supabase.from('events').delete().eq('id', eventId);
                        }
                        setSelectedEvents(new Set());
                        setIsSelectMode(false);
                        window.location.reload();
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive text-sm font-medium
                      hover:bg-destructive/20 transition-colors flex items-center gap-1.5"
                    aria-label={`Delete ${selectedEvents.size} events`}
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </motion.div>
            )}

            {/* Usage Summary for Free Tier */}
            {tier === 'free' && events.length > 0 && (
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
                  tier={tier}
                  onUpgradeClick={() => navigate('/pricing')}
                />
              </motion.div>
            )}
            
            {/* Event cards */}
            {events.map((event, index) => (
              <EventCard
                key={event.id}
                event={event}
                stats={eventStats.get(event.id) || null}
                index={index}
                isSelectMode={isSelectMode}
                isSelected={selectedEvents.has(event.id)}
                onToggleSelect={(eventId) => {
                  setSelectedEvents(prev => {
                    const next = new Set(prev);
                    if (next.has(eventId)) {
                      next.delete(eventId);
                    } else {
                      next.add(eventId);
                    }
                    return next;
                  });
                }}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
