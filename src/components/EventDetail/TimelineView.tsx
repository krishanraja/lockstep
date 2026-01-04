// Timeline View - Visual schedule with attendance indicators
import { motion } from 'framer-motion';
import { format, parseISO, isSameDay } from 'date-fns';
import { 
  Calendar, 
  Users, 
  Clock,
  Check,
  HelpCircle,
  X as XIcon
} from 'lucide-react';

interface Block {
  id: string;
  name: string;
  start_time: string | null;
  end_time: string | null;
}

interface RSVPCount {
  blockId: string;
  inCount: number;
  maybeCount: number;
  outCount: number;
}

interface TimelineViewProps {
  blocks: Block[];
  rsvpCounts: RSVPCount[];
  eventStartDate: string | null;
  eventEndDate: string | null;
}

export const TimelineView = ({ 
  blocks, 
  rsvpCounts, 
  eventStartDate,
  eventEndDate 
}: TimelineViewProps) => {
  // Group blocks by day
  const blocksByDay = blocks.reduce((acc, block) => {
    const dateKey = block.start_time 
      ? format(parseISO(block.start_time), 'yyyy-MM-dd')
      : 'unscheduled';
    
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(block);
    return acc;
  }, {} as Record<string, Block[]>);

  // Get RSVP counts for a block
  const getBlockCounts = (blockId: string): RSVPCount => {
    return rsvpCounts.find(r => r.blockId === blockId) || {
      blockId,
      inCount: 0,
      maybeCount: 0,
      outCount: 0,
    };
  };

  // Calculate attendance percentage
  const getAttendancePercentage = (counts: RSVPCount): number => {
    const total = counts.inCount + counts.maybeCount + counts.outCount;
    if (total === 0) return 0;
    return Math.round((counts.inCount / total) * 100);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <Calendar className="w-4 h-4 text-primary" />
        Schedule
      </div>

      {/* Event date range */}
      {eventStartDate && (
        <div className="text-sm text-muted-foreground">
          {format(parseISO(eventStartDate), 'EEEE, MMMM d')}
          {eventEndDate && !isSameDay(parseISO(eventStartDate), parseISO(eventEndDate)) && (
            <> — {format(parseISO(eventEndDate), 'EEEE, MMMM d')}</>
          )}
        </div>
      )}

      {/* Timeline by day */}
      <div className="space-y-6">
        {Object.entries(blocksByDay).map(([dateKey, dayBlocks], dayIndex) => (
          <motion.div
            key={dateKey}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: dayIndex * 0.1 }}
          >
            {/* Day header */}
            {dateKey !== 'unscheduled' && (
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span className="text-sm font-medium text-foreground">
                  {format(parseISO(dateKey), 'EEEE')}
                </span>
                <span className="text-xs text-muted-foreground">
                  {format(parseISO(dateKey), 'MMM d')}
                </span>
              </div>
            )}

            {/* Timeline blocks */}
            <div className="ml-4 border-l-2 border-border/50 pl-4 space-y-3">
              {dayBlocks.map((block, blockIndex) => {
                const counts = getBlockCounts(block.id);
                const total = counts.inCount + counts.maybeCount + counts.outCount;
                const percentage = getAttendancePercentage(counts);

                return (
                  <motion.div
                    key={block.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: (dayIndex * 0.1) + (blockIndex * 0.05) }}
                    className="relative rounded-xl bg-card border border-border/50 p-4 
                      hover:border-primary/30 transition-colors"
                  >
                    {/* Timeline dot */}
                    <div className="absolute -left-[22px] top-4 w-3 h-3 rounded-full 
                      bg-primary border-2 border-background" />

                    {/* Block content */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="font-medium text-foreground">{block.name}</h4>
                        
                        {block.start_time && (
                          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {format(parseISO(block.start_time), 'h:mm a')}
                            {block.end_time && (
                              <> — {format(parseISO(block.end_time), 'h:mm a')}</>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Attendance badge */}
                      {total > 0 && (
                        <div className={`px-2 py-1 rounded-full text-xs font-medium
                          ${percentage >= 70 ? 'bg-confirmed/10 text-confirmed' :
                            percentage >= 40 ? 'bg-maybe/10 text-maybe' :
                            'bg-out/10 text-out'
                          }`}
                        >
                          {counts.inCount} in
                        </div>
                      )}
                    </div>

                    {/* Attendance bar */}
                    {total > 0 && (
                      <div className="mt-3">
                        <div className="h-2 rounded-full bg-muted overflow-hidden flex">
                          <div 
                            className="h-full bg-confirmed transition-all duration-500"
                            style={{ width: `${(counts.inCount / total) * 100}%` }}
                          />
                          <div 
                            className="h-full bg-maybe transition-all duration-500"
                            style={{ width: `${(counts.maybeCount / total) * 100}%` }}
                          />
                        </div>
                        
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Check className="w-3 h-3 text-confirmed" />
                            {counts.inCount}
                          </span>
                          <span className="flex items-center gap-1">
                            <HelpCircle className="w-3 h-3 text-maybe" />
                            {counts.maybeCount}
                          </span>
                          <span className="flex items-center gap-1">
                            <XIcon className="w-3 h-3 text-out" />
                            {counts.outCount}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* No responses yet */}
                    {total === 0 && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        No responses yet
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Empty state */}
      {blocks.length === 0 && (
        <div className="p-6 rounded-xl bg-card border border-border/50 text-center">
          <Calendar className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            No schedule blocks defined yet.
          </p>
        </div>
      )}
    </div>
  );
};

export default TimelineView;
