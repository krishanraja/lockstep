// EventDetail - AI-powered event management with 2027 UX
import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ChevronLeft, 
  Calendar, 
  MapPin,
  Check as CheckIcon
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, differenceInDays } from 'date-fns';
import { UpgradeModal } from '@/components/UpgradeModal';
import { UsageIndicator } from '@/components/UsageIndicator';
import { GuestManager } from '@/components/GuestManager';
import { 
  AIAssistant,
  SmartActions,
  GuestGrid,
  TimelineView,
  VoiceFAB,
  EventActionsMenu,
  EditEventModal,
  BlockManager,
  QuestionManager
} from '@/components/EventDetail';
import { 
  canSendNudge, 
  getEventUsage, 
  incrementNudgeCount,
  EventUsage
} from '@/services/subscription';
import { useRealtimeEvents } from '@/hooks/use-realtime-events';

interface Event {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  start_date: string | null;
  end_date: string | null;
  status: string | null;
}

interface Guest {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  status: string | null;
  magic_token: string | null;
}

interface Block {
  id: string;
  name: string;
  start_time: string | null;
  end_time: string | null;
}

interface Question {
  id: string;
  prompt: string;
  type: string;
  options: string[] | null;
  required: boolean | null;
  order_index?: number;
}

interface RSVPCount {
  blockId: string;
  blockName: string;
  inCount: number;
  maybeCount: number;
  outCount: number;
}

interface GuestRSVP {
  guestId: string;
  blockId: string;
  response: 'in' | 'maybe' | 'out';
}

type TabView = 'overview' | 'guests' | 'schedule';

const EventDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [event, setEvent] = useState<Event | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [rsvpCounts, setRsvpCounts] = useState<RSVPCount[]>([]);
  const [guestRsvps, setGuestRsvps] = useState<GuestRSVP[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSendingNudge, setIsSendingNudge] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [eventUsage, setEventUsage] = useState<EventUsage | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  // Load last viewed tab from localStorage
  const getLastTab = (): TabView => {
    try {
      const saved = localStorage.getItem(`event_tab_${id}`);
      if (saved && ['overview', 'guests', 'schedule'].includes(saved)) {
        return saved as TabView;
      }
    } catch {
      // Ignore errors
    }
    return 'overview';
  };

  const [activeTab, setActiveTab] = useState<TabView>(getLastTab());

  // Save tab preference
  useEffect(() => {
    if (id) {
      localStorage.setItem(`event_tab_${id}`, activeTab);
    }
  }, [activeTab, id]);
  const [copiedLink, setCopiedLink] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [realtimeUpdateCounter, setRealtimeUpdateCounter] = useState(0);
  const [showEditModal, setShowEditModal] = useState(false);

  const loadEventData = useCallback(async (eventId: string, cancelled: { current: boolean }) => {
    setLoadError(null);
    setIsLoading(true);

    try {
      // Load event
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (cancelled.current) return;
      if (eventError) throw eventError;
      setEvent(eventData);

      // Load guests
      const { data: guestsData } = await supabase
        .from('guests')
        .select('*')
        .eq('event_id', eventId);
      
      if (cancelled.current) return;
      if (guestsData) setGuests(guestsData);

      // Load blocks
      const { data: blocksData } = await supabase
        .from('blocks')
        .select('*')
        .eq('event_id', eventId)
        .order('order_index');

      if (cancelled.current) return;

      // Load questions
      const { data: questionsData } = await supabase
        .from('questions')
        .select('*')
        .eq('event_id', eventId)
        .order('order_index');

      if (cancelled.current) return;
      if (questionsData) setQuestions(questionsData);

      if (blocksData) {
        setBlocks(blocksData);

        // Load RSVP counts per block
        const counts: RSVPCount[] = [];
        const allRsvps: GuestRSVP[] = [];
        
        for (const block of blocksData) {
          if (cancelled.current) return;
          
          const { data: rsvps } = await supabase
            .from('rsvps')
            .select('guest_id, response')
            .eq('block_id', block.id);

          if (rsvps) {
            rsvps.forEach(r => {
              allRsvps.push({
                guestId: r.guest_id,
                blockId: block.id,
                response: r.response as 'in' | 'maybe' | 'out',
              });
            });
          }

          counts.push({
            blockId: block.id,
            blockName: block.name,
            inCount: rsvps?.filter(r => r.response === 'in').length || 0,
            maybeCount: rsvps?.filter(r => r.response === 'maybe').length || 0,
            outCount: rsvps?.filter(r => r.response === 'out').length || 0,
          });
        }
        
        if (cancelled.current) return;
        setRsvpCounts(counts);
        setGuestRsvps(allRsvps);
      }
    } catch (err: any) {
      if (cancelled.current) return;
      console.error('[EventDetail] Error loading event:', err);
      setLoadError(err.message || 'Failed to load event');
    } finally {
      if (!cancelled.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!id) return;
    
    const cancelled = { current: false };
    
    const init = async () => {
      // Get user
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (cancelled.current) return;
      setUser(authUser);
      
      // Check for upgrade success - clean up URL silently
      if (searchParams.get('upgraded') === 'true') {
        window.history.replaceState({}, '', `/events/${id}`);
      }
      
      // Load event data
      await loadEventData(id, cancelled);
      
      // Load usage data
      if (authUser) {
        const usage = await getEventUsage(id, authUser.id);
        if (!cancelled.current) {
          setEventUsage(usage);
        }
      }
    };
    
    init();
    
    return () => {
      cancelled.current = true;
    };
  }, [id, loadEventData, searchParams]);

  // Real-time subscription for live updates
  useRealtimeEvents({
    eventId: id || '',
    enabled: !!id && !isLoading,
    onUpdate: useCallback((_table: string) => {
      // Trigger a re-fetch by incrementing counter
      setRealtimeUpdateCounter(c => c + 1);
    }, []),
  });

  // Re-fetch when real-time updates are detected
  useEffect(() => {
    if (realtimeUpdateCounter > 0 && id) {
      const cancelled = { current: false };
      loadEventData(id, cancelled);
      return () => { cancelled.current = true; };
    }
  }, [realtimeUpdateCounter, id, loadEventData]);

  const pendingGuests = guests.filter(g => g.status === 'pending');

  const handleSendNudge = async () => {
    if (!id || !user) return;
    
    // Check nudge limit
    const limitCheck = await canSendNudge(id, user.id);
    
    if (!limitCheck.allowed) {
      setShowUpgradeModal(true);
      return;
    }
    
    setIsSendingNudge(true);
    
    try {
      // Fetch an LLM-generated nudge template (1-hour cache, falls back to hardcoded)
      const fallbackTemplate = `Hey {name}! Just a reminder to RSVP for ${event?.title}. We need your response to finalize plans. {link}`;
      let nudgeTemplate = fallbackTemplate;
      try {
        const { data: templateData } = await supabase.functions.invoke('generate-summary', {
          body: {
            eventId: id,
            eventTitle: event?.title || '',
            totalGuests: guests.length,
            respondedCount: guests.filter(g => g.status === 'responded').length,
            pendingCount: pendingGuests.length,
            daysUntilEvent: daysUntilEvent ?? 0,
            summaryType: 'nudge',
          },
        });
        if (templateData?.summary) {
          nudgeTemplate = templateData.summary;
        }
      } catch {
        // Use fallback — LLM not critical for nudges
      }

      for (const guest of pendingGuests) {
        const rsvpLink = guest.magic_token
          ? `${window.location.origin}/rsvp/${guest.magic_token}`
          : '';
        const message = nudgeTemplate
          .replace('{name}', guest.name)
          .replace('{link}', rsvpLink);
        await supabase.functions.invoke('send-nudge', {
          body: { guestId: guest.id, eventId: id, channel: 'sms', message },
        });
        await incrementNudgeCount(id);
      }
      
      // Update usage after sending
      const newUsage = await getEventUsage(id, user.id);
      setEventUsage(newUsage);
    } catch (err) {
      console.error('Error sending nudges:', err);
    } finally {
      setIsSendingNudge(false);
    }
  };

  const handleShare = async () => {
    setShareError(null);
    // Copy the public plan link — guests receive personal RSVP links via SMS/WhatsApp
    const link = `${window.location.origin}/plan/${id}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      setShareError('Could not copy link. Please copy it manually: ' + link);
    }
  };

  // Escape CSV field (handles commas, quotes, newlines)
  const escapeCsvField = (field: string): string => {
    if (field.includes(',') || field.includes('"') || field.includes('\n')) {
      return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
  };

  const handleExport = () => {
    // Generate CSV with proper escaping
    const headers = ['Name', 'Email', 'Phone', 'Status', ...blocks.map(b => b.name)];
    const rows = guests.map(guest => {
      const guestResponses = blocks.map(block => {
        const rsvp = guestRsvps.find(r => r.guestId === guest.id && r.blockId === block.id);
        return rsvp?.response || 'No response';
      });
      return [
        escapeCsvField(guest.name),
        escapeCsvField(guest.email || ''),
        escapeCsvField(guest.phone || ''),
        escapeCsvField(guest.status || 'pending'),
        ...guestResponses.map(r => escapeCsvField(r)),
      ];
    });

    const csv = [
      headers.map(h => escapeCsvField(h)).join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${event?.title || 'guests'}-export.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleScheduleReminder = () => {
    setInfoMessage('Scheduled reminders are coming soon. Use the Nudge button to send reminders now.');
    setTimeout(() => setInfoMessage(null), 4000);
  };

  // Guest management functions
  const handleUpdateGuests = async (updatedGuests: Guest[]) => {
    if (!id) return;

    try {
      // Get current guest IDs from DB
      const { data: currentGuests } = await supabase
        .from('guests')
        .select('id')
        .eq('event_id', id);

      const currentIds = new Set(currentGuests?.map(g => g.id) || []);
      const updatedIds = new Set(updatedGuests.map(g => g.id));

      // Find guests to delete (in current but not in updated)
      const toDelete = Array.from(currentIds).filter(gid => !updatedIds.has(gid));

      // Find guests to insert (in updated but not in current)
      const toInsert = updatedGuests.filter(g => !currentIds.has(g.id));

      // Find guests to update (in both)
      const toUpdate = updatedGuests.filter(g => currentIds.has(g.id));

      // Execute deletes
      if (toDelete.length > 0) {
        await supabase
          .from('guests')
          .delete()
          .in('id', toDelete);
      }

      // Execute inserts
      if (toInsert.length > 0) {
        await supabase
          .from('guests')
          .insert(
            toInsert.map(g => ({
              id: g.id,
              event_id: id,
              name: g.name,
              email: g.email,
              phone: g.phone,
              status: g.status || 'pending',
            }))
          );
      }

      // Execute updates
      for (const guest of toUpdate) {
        await supabase
          .from('guests')
          .update({
            name: guest.name,
            email: guest.email,
            phone: guest.phone,
            status: guest.status,
          })
          .eq('id', guest.id);
      }

      // Reload guests from DB
      const { data: refreshedGuests } = await supabase
        .from('guests')
        .select('*')
        .eq('event_id', id);

      if (refreshedGuests) {
        setGuests(refreshedGuests);
      }
    } catch (error) {
      console.error('[EventDetail] Error updating guests:', error);
      setShareError('Failed to update guests. Please try again.');
    }
  };

  const daysUntilEvent = event?.start_date 
    ? differenceInDays(new Date(event.start_date), new Date())
    : null;

  // Calculate stats for AI Assistant
  const stats = {
    totalGuests: guests.length,
    respondedCount: guests.filter(g => g.status === 'responded').length,
    pendingCount: pendingGuests.length,
    inCount: rsvpCounts.reduce((sum, r) => sum + r.inCount, 0),
  };

  if (isLoading) {
    return (
      <div className="h-dvh w-full flex items-center justify-center bg-background" role="status" aria-live="polite">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" aria-label="Loading event details" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="h-dvh w-full flex flex-col items-center justify-center bg-background p-6">
        <h1 className="text-xl font-medium text-foreground mb-2">Event not found</h1>
        <button
          onClick={() => navigate('/dashboard')}
          className="text-primary hover:underline"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="h-dvh w-full flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 px-4 py-3 border-b border-border/50">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-lg px-2 py-1"
            aria-label="Go back to dashboard"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm">Back</span>
          </button>
          <EventActionsMenu
            eventId={id!}
            eventTitle={event?.title || ''}
            eventStatus={event?.status || null}
            onEdit={() => setShowEditModal(true)}
            onExport={handleExport}
            onArchive={() => {
              // Reload event data after archive
              if (id) {
                const cancelled = { current: false };
                loadEventData(id, cancelled);
              }
            }}
            onDelete={() => navigate('/dashboard')}
          />
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Error display */}
        {loadError && (
          <div className="p-6 border-b border-border/50">
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl">
              <p className="text-sm text-destructive mb-2">{loadError}</p>
              <button 
                onClick={() => window.location.reload()}
                className="text-xs text-primary hover:underline"
              >
                Reload page
              </button>
            </div>
          </div>
        )}

        {/* Event info */}
        <div className="p-6 border-b border-border/50">
          <h1 className="text-2xl font-display font-bold text-foreground mb-2">
            {event.title}
          </h1>
          
          <div className="space-y-2 text-sm text-muted-foreground">
            {event.location && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>{event.location}</span>
              </div>
            )}
            {event.start_date && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>
                  {format(new Date(event.start_date), 'MMM d')}
                  {event.end_date && ` - ${format(new Date(event.end_date), 'MMM d, yyyy')}`}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 py-3 border-b border-border/50">
          <div className="flex gap-1 p-1 bg-muted rounded-xl">
            {(['overview', 'guests', 'schedule'] as TabView[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
                  ${activeTab === tab 
                    ? 'bg-card text-foreground shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                  }`}
                aria-label={`Switch to ${tab} tab`}
                aria-selected={activeTab === tab}
                role="tab"
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'overview' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              {/* AI Assistant */}
              <AIAssistant
                eventId={id!}
                eventTitle={event.title}
                daysUntilEvent={daysUntilEvent}
                stats={stats}
                blocks={blocks}
                onAction={(action) => {
                  if (action.type === 'nudge') handleSendNudge();
                }}
              />

              {/* Smart Actions */}
              <SmartActions
                pendingCount={pendingGuests.length}
                totalGuests={guests.length}
                daysUntilEvent={daysUntilEvent}
                onNudge={handleSendNudge}
                onShare={handleShare}
                onExport={handleExport}
                onScheduleReminder={handleScheduleReminder}
                isNudgeLoading={isSendingNudge}
              />

              {/* Custom Questions */}
              <QuestionManager
                eventId={id!}
                questions={questions}
                onUpdate={() => loadEventData(id!, { current: false })}
              />

              {/* Usage indicator */}
              {eventUsage && eventUsage.nudgesLimit !== -1 && (
                <div className="p-4 rounded-xl bg-card border border-border/50">
                  <UsageIndicator
                    type="nudges"
                    used={eventUsage.nudgesUsed}
                    limit={eventUsage.nudgesLimit}
                    tier={eventUsage.tier}
                    showUpgradeHint={true}
                    onClick={eventUsage.nudgesUsed >= eventUsage.nudgesLimit 
                      ? () => setShowUpgradeModal(true) 
                      : undefined}
                  />
                </div>
              )}

              {/* Share error */}
              {shareError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-xl bg-destructive/10 border border-destructive/20"
                >
                  <p className="text-sm text-destructive">{shareError}</p>
                </motion.div>
              )}

              {/* Info message toast (non-error) */}
              {infoMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-xl bg-primary/10 border border-primary/20"
                >
                  <p className="text-sm text-primary">{infoMessage}</p>
                </motion.div>
              )}

              {/* Link copied toast */}
              {copiedLink && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 
                    rounded-xl bg-confirmed text-background text-sm font-medium
                    flex items-center gap-2 shadow-lg"
                >
                  <CheckIcon className="w-4 h-4" />
                  Plan link copied!
                </motion.div>
              )}
            </motion.div>
          )}

          {activeTab === 'guests' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              {/* Guest Management */}
              <GuestManager
                eventId={id!}
                guests={guests}
                onUpdateGuests={handleUpdateGuests}
              />

              {/* Guest Grid - RSVP tracking */}
              <GuestGrid
                guests={guests.map(g => ({
                  id: g.id,
                  name: g.name,
                  email: g.email,
                  phone: g.phone,
                  status: (g.status as 'pending' | 'responded') || 'pending',
                }))}
                blocks={blocks}
                rsvps={guestRsvps}
                onBulkNudge={async (guestIds) => {
                  if (!id || !user) return;
                  
                  // Check nudge limit
                  const limitCheck = await canSendNudge(id, user.id);
                  if (!limitCheck.allowed) {
                    setShowUpgradeModal(true);
                    return;
                  }
                  
                  setIsSendingNudge(true);
                  try {
                    for (const guestId of guestIds) {
                      const guest = guests.find(g => g.id === guestId);
                      if (guest) {
                        await supabase.functions.invoke('send-nudge', {
                          body: {
                            guestId: guest.id,
                            eventId: id,
                            channel: 'sms',
                            message: `Hey ${guest.name}! Just a reminder to RSVP for ${event?.title}. We need your response to finalize plans.`,
                          },
                        });
                        await incrementNudgeCount(id);
                      }
                    }
                    const newUsage = await getEventUsage(id, user.id);
                    setEventUsage(newUsage);
                  } catch (err) {
                    console.error('Error sending bulk nudges:', err);
                  } finally {
                    setIsSendingNudge(false);
                  }
                }}
              />
            </motion.div>
          )}

          {activeTab === 'schedule' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              {/* Time Blocks Management */}
              <BlockManager
                eventId={id!}
                blocks={blocks}
                onUpdate={() => loadEventData(id!, { current: false })}
              />

              {/* Timeline Visualization */}
              <TimelineView
                blocks={blocks}
                rsvpCounts={rsvpCounts}
                eventStartDate={event.start_date}
                eventEndDate={event.end_date}
              />
            </motion.div>
          )}
        </div>
      </main>

      {/* Voice FAB */}
      <VoiceFAB
        eventTitle={event.title}
        stats={stats}
        blocks={rsvpCounts.map(r => ({ 
          id: r.blockId, 
          name: r.blockName, 
          inCount: r.inCount 
        }))}
        onNudge={handleSendNudge}
        onScheduleReminder={handleScheduleReminder}
      />

      {/* Upgrade Modal */}
      {eventUsage && (
        <UpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          eventId={id!}
          eventType={event?.status || undefined}
          limitType="nudges"
          currentUsage={eventUsage.nudgesUsed}
          currentLimit={eventUsage.nudgesLimit}
          onUpgradeSuccess={() => {
            setShowUpgradeModal(false);
            if (user) {
              getEventUsage(id!, user.id).then(setEventUsage);
            }
          }}
        />
      )}

      {/* Edit Event Modal */}
      {event && (
        <EditEventModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          event={event}
          onSave={(updatedEvent) => {
            setEvent(updatedEvent);
          }}
        />
      )}
    </div>
  );
};

export default EventDetail;
