import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Clock, Users, Check, HelpCircle, X as XIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO, isSameDay } from 'date-fns';

interface EventData {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  start_date: string | null;
  end_date: string | null;
  cover_image_url: string | null;
}

interface Block {
  id: string;
  name: string;
  start_time: string | null;
  end_time: string | null;
  order_index: number | null;
}

interface BlockCount {
  blockId: string;
  inCount: number;
  maybeCount: number;
  outCount: number;
}

const PublicPlanPage = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const [event, setEvent] = useState<EventData | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [counts, setCounts] = useState<BlockCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) return;

    const load = async () => {
      try {
        const { data: ev, error: evErr } = await supabase
          .from('events')
          .select('id, title, description, location, start_date, end_date, cover_image_url')
          .eq('id', eventId)
          .single();

        if (evErr || !ev) {
          setError('Event not found');
          setIsLoading(false);
          return;
        }
        setEvent(ev);

        const { data: blocksData } = await supabase
          .from('blocks')
          .select('id, name, start_time, end_time, order_index')
          .eq('event_id', eventId)
          .order('order_index');

        const blocksList = blocksData || [];
        setBlocks(blocksList);

        const blockCounts: BlockCount[] = [];
        for (const block of blocksList) {
          const { data: rsvps } = await supabase
            .from('rsvps')
            .select('response')
            .eq('block_id', block.id);

          blockCounts.push({
            blockId: block.id,
            inCount: rsvps?.filter(r => r.response === 'in').length || 0,
            maybeCount: rsvps?.filter(r => r.response === 'maybe').length || 0,
            outCount: rsvps?.filter(r => r.response === 'out').length || 0,
          });
        }
        setCounts(blockCounts);
      } catch {
        setError('Failed to load event');
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [eventId]);

  const getBlockCount = (blockId: string) =>
    counts.find(c => c.blockId === blockId) || { blockId, inCount: 0, maybeCount: 0, outCount: 0 };

  if (isLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-background px-4">
        <XIcon className="w-12 h-12 text-muted-foreground mb-4" />
        <h1 className="text-xl font-semibold text-foreground mb-2">Event Not Found</h1>
        <p className="text-muted-foreground text-sm mb-6">
          This plan may have been removed or the link is incorrect.
        </p>
        <Link to="/" className="text-sm text-primary hover:underline">
          Go to Lockstep
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background">
      {/* Cover image */}
      {event.cover_image_url && (
        <div className="w-full h-48 sm:h-64 relative overflow-hidden">
          <img
            src={event.cover_image_url}
            alt={event.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent" />
        </div>
      )}

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <h1 className="text-2xl font-bold text-foreground">{event.title}</h1>

          {event.description && (
            <p className="text-sm text-muted-foreground">{event.description}</p>
          )}

          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
            {event.start_date && (
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {format(parseISO(event.start_date), 'EEE, MMM d')}
                {event.end_date && !isSameDay(parseISO(event.start_date), parseISO(event.end_date)) && (
                  <> — {format(parseISO(event.end_date), 'EEE, MMM d')}</>
                )}
              </div>
            )}
            {event.location && (
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                {event.location}
              </div>
            )}
          </div>
        </motion.div>

        {/* Schedule blocks */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-3"
        >
          <h2 className="text-sm font-medium text-foreground flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            Schedule
          </h2>

          {blocks.length === 0 ? (
            <div className="p-6 rounded-xl bg-card border border-border/50 text-center text-muted-foreground text-sm">
              Schedule not yet published.
            </div>
          ) : (
            <div className="space-y-2">
              {blocks.map((block, i) => {
                const bc = getBlockCount(block.id);
                const total = bc.inCount + bc.maybeCount + bc.outCount;

                return (
                  <motion.div
                    key={block.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 + i * 0.05 }}
                    className="p-4 rounded-xl bg-card border border-border/50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-medium text-foreground">{block.name}</h3>
                        {block.start_time && (
                          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {format(parseISO(block.start_time), 'EEE, MMM d · h:mm a')}
                            {block.end_time && <> — {format(parseISO(block.end_time), 'h:mm a')}</>}
                          </div>
                        )}
                      </div>
                      {total > 0 && (
                        <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-xs font-medium text-primary flex-shrink-0">
                          <Users className="w-3 h-3" />
                          {bc.inCount}
                        </div>
                      )}
                    </div>

                    {total > 0 && (
                      <div className="mt-3">
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden flex">
                          <div className="h-full bg-confirmed" style={{ width: `${(bc.inCount / total) * 100}%` }} />
                          <div className="h-full bg-maybe" style={{ width: `${(bc.maybeCount / total) * 100}%` }} />
                        </div>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                          <span className="flex items-center gap-0.5">
                            <Check className="w-3 h-3 text-confirmed" />{bc.inCount} in
                          </span>
                          <span className="flex items-center gap-0.5">
                            <HelpCircle className="w-3 h-3 text-maybe" />{bc.maybeCount} maybe
                          </span>
                          <span className="flex items-center gap-0.5">
                            <XIcon className="w-3 h-3 text-out" />{bc.outCount} out
                          </span>
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="pt-6 pb-8 text-center"
        >
          <Link
            to="/"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Powered by <span className="font-semibold">Lockstep</span>
          </Link>
        </motion.div>
      </main>
    </div>
  );
};

export default PublicPlanPage;
