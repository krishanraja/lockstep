// Skeleton loader for event cards - provides smooth loading state
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';

interface EventCardSkeletonProps {
  index?: number;
}

export const EventCardSkeleton = ({ index = 0 }: EventCardSkeletonProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="rounded-2xl bg-card border border-border/50 overflow-hidden"
    >
      {/* Event header skeleton */}
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            {/* Title + status badge */}
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-5 w-14 rounded-full" />
            </div>
            {/* Location */}
            <Skeleton className="h-4 w-32" />
            {/* Date + countdown */}
            <div className="flex items-center gap-3 mt-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          </div>
          {/* Chevron */}
          <Skeleton className="h-5 w-5 rounded" />
        </div>
      </div>

      {/* Stats bar skeleton */}
      <div className="px-4 pb-3 flex items-center gap-4">
        <div className="flex items-center gap-1">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-4 w-20" />
      </div>

      {/* AI Summary skeleton */}
      <div className="border-t border-border/50 px-4 py-3 bg-muted/30">
        <div className="flex items-start gap-2">
          <Skeleton className="h-4 w-4 rounded flex-shrink-0 mt-0.5" />
          <div className="flex-1 space-y-1">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Multiple skeletons for initial load
export const EventCardSkeletonList = ({ count = 3 }: { count?: number }) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <EventCardSkeleton key={i} index={i} />
      ))}
    </div>
  );
};

export default EventCardSkeleton;
