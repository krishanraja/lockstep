// Dashboard - Refactored with TanStack Query for stable, flicker-free loading
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Calendar, LogOut, Crown, User } from 'lucide-react';
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
  const events = dashboardData?.events || [];
  const eventStats = dashboardData?.stats || new Map();
  const tier = subscription?.tier || 'free';
  const isAnnual = subscription?.isAnnual || false;
  
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
                flex items-center gap-2 hover:opacity-90 transition-opacity"
            >
              <Plus className="w-5 h-5" />
              Create Event
            </button>
          </motion.div>
        ) : (
          // Events list
          <div className="space-y-4">
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
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
