// Dashboard - Refactored with TanStack Query for stable, flicker-free loading
import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Calendar, LogOut, Crown, User, Archive, Trash2, CheckSquare, Square, MoreVertical, X, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { UsageSummary } from '@/components/UsageIndicator';
import { TIER_LIMITS, canCreateEvent } from '@/services/subscription';
import { EventCard, EventCardSkeletonList } from '@/components/Dashboard';
import { UpgradeModal } from '@/components/UpgradeModal';
import { 
  useCurrentUser, 
  useDashboardData, 
  useSubscription 
} from '@/queries/event-queries';
import { useRealtimeDashboard } from '@/hooks/use-realtime-events';

const Dashboard = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Select mode state for bulk actions
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set());
  
  // Dropdown menu state
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  // Upgrade modal state
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [eventLimitMessage, setEventLimitMessage] = useState<string | null>(null);
  
  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Handler to enter selection mode (called from menu or long-press)
  const enterSelectMode = () => {
    setIsSelectMode(true);
    setIsMenuOpen(false);
  };
  
  // Handler to exit selection mode
  const exitSelectMode = () => {
    setIsSelectMode(false);
    setSelectedEvents(new Set());
  };
  
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
            {/* Profile button */}
            <button
              onClick={() => navigate('/profile')}
              className="p-2 rounded-full text-muted-foreground hover:text-primary
                hover:bg-primary/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label="Open profile settings"
              title="Profile"
            >
              <User className="w-5 h-5" />
            </button>
            
            {/* More menu (dropdown) */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-full text-muted-foreground hover:text-foreground
                  hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label="More options"
                title="More options"
              >
                <MoreVertical className="w-5 h-5" />
              </button>
              
              {/* Dropdown menu */}
              <AnimatePresence>
                {isMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-48 bg-card border border-border/50 rounded-xl shadow-lg overflow-hidden z-50"
                  >
                    {events.length > 0 && (
                      <button
                        onClick={enterSelectMode}
                        className="w-full px-4 py-3 text-left text-sm text-foreground hover:bg-muted/50 
                          transition-colors flex items-center gap-3"
                      >
                        <CheckSquare className="w-4 h-4 text-muted-foreground" />
                        Select events
                      </button>
                    )}
                    <button
                      onClick={() => {
                        handleSignOut();
                        setIsMenuOpen(false);
                      }}
                      className="w-full px-4 py-3 text-left text-sm text-foreground hover:bg-muted/50 
                        transition-colors flex items-center gap-3 border-t border-border/50"
                    >
                      <LogOut className="w-4 h-4 text-muted-foreground" />
                      Sign out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {/* Create event button */}
            <button
              onClick={async () => {
                if (!user?.id) return;
                
                // Check if user can create more events
                const limitCheck = await canCreateEvent(user.id);
                if (!limitCheck.allowed) {
                  setEventLimitMessage(limitCheck.reason || 'Event limit reached');
                  setShowUpgradeModal(true);
                  return;
                }
                
                navigate('/create');
              }}
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
          // Empty state — template quick-start grid
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col h-full px-2 py-6"
          >
            <div className="text-center mb-6">
              <h2 className="text-xl font-display font-bold text-foreground mb-1">Create your first event</h2>
              <p className="text-sm text-muted-foreground">Takes under 3 minutes. Pick a type to get started.</p>
            </div>

            {/* Template quick-start cards */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {[
                { id: 'bucks', icon: '🎉', label: 'Bucks Party', subtitle: 'Send him off in style' },
                { id: 'hens', icon: '✨', label: "Hen's Party", subtitle: 'Celebrate the bride-to-be' },
                { id: 'offsite', icon: '💼', label: 'Team Offsite', subtitle: 'Work hard, play harder' },
                { id: 'birthday', icon: '🎂', label: 'Birthday', subtitle: 'Make it memorable' },
                { id: 'wedding', icon: '💍', label: 'Wedding', subtitle: 'Every detail matters' },
                { id: 'trip', icon: '✈️', label: 'Group Trip', subtitle: 'Adventure awaits' },
              ].map((t, i) => (
                <motion.button
                  key={t.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={async () => {
                    if (!user?.id) return;
                    const limitCheck = await canCreateEvent(user.id);
                    if (!limitCheck.allowed) {
                      setEventLimitMessage(limitCheck.reason || 'Event limit reached');
                      setShowUpgradeModal(true);
                      return;
                    }
                    navigate(`/create?template=${t.id}`);
                  }}
                  className="flex flex-col items-start p-4 rounded-2xl bg-card border border-border/50
                    hover:border-primary/30 hover:bg-primary/5 transition-all text-left group"
                >
                  <span className="text-2xl mb-2">{t.icon}</span>
                  <span className="font-medium text-sm text-foreground">{t.label}</span>
                  <span className="text-xs text-muted-foreground mt-0.5">{t.subtitle}</span>
                </motion.button>
              ))}
            </div>

            {/* Fallback: blank custom event */}
            <button
              onClick={async () => {
                if (!user?.id) return;
                const limitCheck = await canCreateEvent(user.id);
                if (!limitCheck.allowed) {
                  setEventLimitMessage(limitCheck.reason || 'Event limit reached');
                  setShowUpgradeModal(true);
                  return;
                }
                navigate('/create');
              }}
              className="flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-border/50
                text-sm text-muted-foreground hover:text-foreground hover:border-border transition-colors"
            >
              <Plus className="w-4 h-4" />
              Start from scratch
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </motion.div>
        ) : (
          // Events list
          <div className="space-y-4">
            {/* Selection mode header bar */}
            <AnimatePresence>
              {isSelectMode && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="sticky top-0 z-10 p-4 bg-primary/5 border border-primary/20 rounded-2xl
                    flex items-center justify-between gap-3 shadow-lg backdrop-blur-sm"
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={exitSelectMode}
                      className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors"
                      aria-label="Cancel selection"
                    >
                      <X className="w-5 h-5 text-muted-foreground" />
                    </button>
                    <span className="text-sm text-foreground font-medium">
                      {selectedEvents.size === 0 
                        ? 'Select events' 
                        : `${selectedEvents.size} event${selectedEvents.size !== 1 ? 's' : ''} selected`}
                    </span>
                  </div>
                  
                  {selectedEvents.size > 0 && (
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
                          exitSelectMode();
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
                            exitSelectMode();
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
                  )}
                </motion.div>
              )}
            </AnimatePresence>

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
                onLongPress={(eventId) => {
                  // Enter selection mode and select this event
                  setIsSelectMode(true);
                  setSelectedEvents(new Set([eventId]));
                }}
              />
            ))}
          </div>
        )}
      </main>

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => {
          setShowUpgradeModal(false);
          setEventLimitMessage(null);
        }}
        reason={eventLimitMessage || undefined}
      />
    </div>
  );
};

export default Dashboard;
