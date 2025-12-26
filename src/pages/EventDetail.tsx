import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ChevronLeft, 
  Users, 
  Calendar, 
  MapPin, 
  Bell, 
  Send,
  Share2,
  Download,
  MoreHorizontal
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

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
  status: string | null;
}

interface Block {
  id: string;
  name: string;
}

interface RSVPCount {
  blockId: string;
  blockName: string;
  inCount: number;
  maybeCount: number;
  outCount: number;
}

const EventDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [event, setEvent] = useState<Event | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [rsvpCounts, setRsvpCounts] = useState<RSVPCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadEventData();
    }
  }, [id]);

  const loadEventData = async () => {
    setIsLoading(true);

    try {
      // Load event
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single();

      if (eventError) throw eventError;
      setEvent(eventData);

      // Load guests
      const { data: guestsData } = await supabase
        .from('guests')
        .select('*')
        .eq('event_id', id);
      
      if (guestsData) setGuests(guestsData);

      // Load blocks
      const { data: blocksData } = await supabase
        .from('blocks')
        .select('*')
        .eq('event_id', id)
        .order('order_index');

      if (blocksData) {
        setBlocks(blocksData);

        // Load RSVP counts per block
        const counts: RSVPCount[] = [];
        for (const block of blocksData) {
          const { data: rsvps } = await supabase
            .from('rsvps')
            .select('response')
            .eq('block_id', block.id);

          counts.push({
            blockId: block.id,
            blockName: block.name,
            inCount: rsvps?.filter(r => r.response === 'in').length || 0,
            maybeCount: rsvps?.filter(r => r.response === 'maybe').length || 0,
            outCount: rsvps?.filter(r => r.response === 'out').length || 0,
          });
        }
        setRsvpCounts(counts);
      }
    } catch (err: any) {
      toast({
        title: 'Error loading event',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const pendingGuests = guests.filter(g => g.status === 'pending');
  const respondedGuests = guests.filter(g => g.status === 'responded');

  if (isLoading) {
    return (
      <div className="h-dvh w-full flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
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
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm">Back</span>
          </button>
          <button className="p-2 rounded-full hover:bg-muted transition-colors">
            <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto">
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

        {/* Open loops / Pending guests */}
        {pendingGuests.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 border-b border-border/50 bg-maybe/5"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h2 className="font-medium text-foreground flex items-center gap-2">
                  <Bell className="w-4 h-4 text-maybe" />
                  {pendingGuests.length} people need a nudge
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  They haven't responded yet
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {pendingGuests.slice(0, 5).map((guest) => (
                <span
                  key={guest.id}
                  className="px-3 py-1 rounded-full bg-muted text-sm text-foreground"
                >
                  {guest.name}
                </span>
              ))}
              {pendingGuests.length > 5 && (
                <span className="px-3 py-1 text-sm text-muted-foreground">
                  +{pendingGuests.length - 5} more
                </span>
              )}
            </div>

            <button
              onClick={() => toast({ title: 'Nudge sending coming soon!' })}
              className="w-full py-3 rounded-xl bg-maybe text-background font-medium
                flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
            >
              <Send className="w-4 h-4" />
              Send Nudge
            </button>
          </motion.div>
        )}

        {/* RSVP counts by block */}
        <div className="p-6">
          <h2 className="font-medium text-foreground mb-4 flex items-center gap-2">
            <Users className="w-4 h-4" />
            Responses by Block
          </h2>

          <div className="space-y-3">
            {rsvpCounts.map((block, index) => {
              const total = block.inCount + block.maybeCount + block.outCount;
              const inPercent = total > 0 ? (block.inCount / total) * 100 : 0;
              const maybePercent = total > 0 ? (block.maybeCount / total) * 100 : 0;
              
              return (
                <motion.div
                  key={block.blockId}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 rounded-xl bg-card border border-border/50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-foreground">{block.blockName}</span>
                    <span className="text-sm text-confirmed">{block.inCount} in</span>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="h-2 rounded-full bg-muted overflow-hidden flex">
                    <div 
                      className="h-full bg-confirmed transition-all duration-500"
                      style={{ width: `${inPercent}%` }}
                    />
                    <div 
                      className="h-full bg-maybe transition-all duration-500"
                      style={{ width: `${maybePercent}%` }}
                    />
                  </div>
                  
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span>{block.inCount} in</span>
                    <span>{block.maybeCount} maybe</span>
                    <span>{block.outCount} out</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Quick actions */}
        <div className="p-6 border-t border-border/50">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => toast({ title: 'Share link coming soon!' })}
              className="p-4 rounded-xl bg-card border border-border/50
                flex flex-col items-center gap-2 hover:border-primary/50 transition-colors"
            >
              <Share2 className="w-5 h-5 text-primary" />
              <span className="text-sm text-foreground">Share Link</span>
            </button>
            <button
              onClick={() => toast({ title: 'Export coming soon!' })}
              className="p-4 rounded-xl bg-card border border-border/50
                flex flex-col items-center gap-2 hover:border-primary/50 transition-colors"
            >
              <Download className="w-5 h-5 text-primary" />
              <span className="text-sm text-foreground">Export CSV</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default EventDetail;



