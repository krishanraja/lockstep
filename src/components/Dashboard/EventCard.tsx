// Refactored Event Card component with AI summary support
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Users, ChevronRight, Sparkles, RefreshCw, Share2, Send } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import type { Event, EventStats, AISummary } from '@/queries/event-queries';
import { useAISummary } from '@/queries/event-queries';
import { supabase } from '@/integrations/supabase/client';

interface EventCardProps {
  event: Event;
  stats: EventStats | null;
  index: number;
}

export const EventCard = ({ event, stats, index, isSelectMode = false, isSelected = false, onToggleSelect }: EventCardProps) => {
  const navigate = useNavigate();
  
  // Fetch AI summary for active events with stats
  const { data: aiSummary, isLoading: aiLoading } = useAISummary(
    event.status === 'active' ? event : null,
    stats
  );

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

  const daysUntil = getDaysUntil(event.start_date);
  const needsAttention = stats && stats.pendingCount >= 3;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="rounded-2xl bg-card border border-border/50 overflow-hidden relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Quick actions on hover */}
      <AnimatePresence>
        {isHovered && stats && stats.pendingCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-2 right-2 flex gap-1 z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleQuickShare}
              className="p-2 rounded-lg bg-background/90 backdrop-blur-sm border border-border/50
                text-foreground hover:bg-primary hover:text-primary-foreground
                transition-colors shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label="Share RSVP link"
              title="Share RSVP link"
            >
              <Share2 className="w-4 h-4" />
            </button>
            {stats.pendingCount > 0 && (
              <button
                onClick={handleQuickNudge}
                className="p-2 rounded-lg bg-background/90 backdrop-blur-sm border border-border/50
                  text-foreground hover:bg-maybe hover:text-background
                  transition-colors shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-maybe"
                aria-label={`Nudge ${stats.pendingCount} pending guests`}
                title={`Nudge ${stats.pendingCount} pending`}
              >
                <Send className="w-4 h-4" />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selection checkbox */}
      {isSelectMode && (
        <div className="absolute top-4 left-4 z-10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelect?.(event.id);
            }}
            className="p-2 rounded-lg bg-background/90 backdrop-blur-sm border border-border/50
              hover:bg-primary/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label={isSelected ? "Deselect event" : "Select event"}
          >
            {isSelected ? (
              <CheckSquare className="w-5 h-5 text-primary" />
            ) : (
              <Square className="w-5 h-5 text-muted-foreground" />
            )}
          </button>
        </div>
      )}

      {/* Event header - clickable */}
      <button
        onClick={() => !isSelectMode && navigate(`/events/${event.id}`)}
        className="w-full p-4 text-left hover:bg-muted/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-t-2xl"
        aria-label={`View event ${event.title}`}
        disabled={isSelectMode}
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
              {aiLoading ? (
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
      {needsAttention && (
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
};

export default EventCard;
