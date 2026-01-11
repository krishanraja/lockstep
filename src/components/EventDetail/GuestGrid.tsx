// Guest Grid - Visual guest management with drill-down
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Check, 
  HelpCircle, 
  X as XIcon,
  ChevronDown,
  ChevronUp,
  Phone,
  Mail,
  Send,
  CheckSquare,
  Square
} from 'lucide-react';

interface Guest {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  status: 'pending' | 'responded';
}

interface GuestRSVP {
  guestId: string;
  blockId: string;
  response: 'in' | 'maybe' | 'out';
}

interface Block {
  id: string;
  name: string;
}

interface GuestGridProps {
  guests: Guest[];
  blocks: Block[];
  rsvps: GuestRSVP[];
  onGuestClick?: (guest: Guest) => void;
  onBulkNudge?: (guestIds: string[]) => void;
}

export const GuestGrid = ({ guests, blocks, rsvps, onGuestClick, onBulkNudge }: GuestGridProps) => {
  const [expandedBlock, setExpandedBlock] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'in' | 'maybe' | 'out' | 'pending'>('all');
  const [selectedGuests, setSelectedGuests] = useState<Set<string>>(new Set());
  const [isSelectMode, setIsSelectMode] = useState(false);

  // Get RSVP for a specific guest and block
  const getGuestRSVP = (guestId: string, blockId: string): 'in' | 'maybe' | 'out' | null => {
    const rsvp = rsvps.find(r => r.guestId === guestId && r.blockId === blockId);
    return rsvp?.response || null;
  };

  // Get overall status for a guest across all blocks
  const getGuestOverallStatus = (guestId: string): 'in' | 'maybe' | 'out' | 'pending' => {
    const guestRsvps = rsvps.filter(r => r.guestId === guestId);
    if (guestRsvps.length === 0) return 'pending';
    
    const hasIn = guestRsvps.some(r => r.response === 'in');
    const hasOut = guestRsvps.every(r => r.response === 'out');
    
    if (hasOut) return 'out';
    if (hasIn) return 'in';
    return 'maybe';
  };

  // Filter guests
  const filteredGuests = guests.filter(guest => {
    if (filter === 'all') return true;
    if (filter === 'pending') return guest.status === 'pending';
    return getGuestOverallStatus(guest.id) === filter;
  });

  // Count by status
  const statusCounts = {
    all: guests.length,
    in: guests.filter(g => getGuestOverallStatus(g.id) === 'in').length,
    maybe: guests.filter(g => getGuestOverallStatus(g.id) === 'maybe').length,
    out: guests.filter(g => getGuestOverallStatus(g.id) === 'out').length,
    pending: guests.filter(g => g.status === 'pending').length,
  };

  const getStatusIcon = (status: 'in' | 'maybe' | 'out' | 'pending' | null) => {
    switch (status) {
      case 'in': return <Check className="w-3 h-3 text-confirmed" />;
      case 'maybe': return <HelpCircle className="w-3 h-3 text-maybe" />;
      case 'out': return <XIcon className="w-3 h-3 text-out" />;
      default: return <div className="w-3 h-3 rounded-full bg-muted" />;
    }
  };

  const getStatusColor = (status: 'in' | 'maybe' | 'out' | 'pending') => {
    switch (status) {
      case 'in': return 'bg-confirmed/10 border-confirmed/30 text-confirmed';
      case 'maybe': return 'bg-maybe/10 border-maybe/30 text-maybe';
      case 'out': return 'bg-out/10 border-out/30 text-out';
      case 'pending': return 'bg-muted border-border/50 text-muted-foreground';
    }
  };

  const toggleSelectMode = () => {
    setIsSelectMode(!isSelectMode);
    if (isSelectMode) {
      setSelectedGuests(new Set());
    }
  };

  const toggleGuestSelection = (guestId: string) => {
    setSelectedGuests(prev => {
      const next = new Set(prev);
      if (next.has(guestId)) {
        next.delete(guestId);
      } else {
        next.add(guestId);
      }
      return next;
    });
  };

  const handleBulkNudge = () => {
    if (onBulkNudge && selectedGuests.size > 0) {
      onBulkNudge(Array.from(selectedGuests));
      setSelectedGuests(new Set());
      setIsSelectMode(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Users className="w-4 h-4 text-primary" />
          Guests ({guests.length})
        </div>
        <div className="flex items-center gap-2">
          {isSelectMode && selectedGuests.size > 0 && onBulkNudge && (
            <button
              onClick={handleBulkNudge}
              className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium
                flex items-center gap-1.5 hover:opacity-90 transition-opacity"
            >
              <Send className="w-3.5 h-3.5" />
              Nudge {selectedGuests.size}
            </button>
          )}
          <button
            onClick={toggleSelectMode}
            className="px-3 py-1.5 rounded-lg bg-muted text-foreground text-xs font-medium
              hover:bg-muted/80 transition-colors"
          >
            {isSelectMode ? 'Cancel' : 'Select'}
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 p-1 bg-muted rounded-xl overflow-x-auto">
        {(['all', 'in', 'maybe', 'out', 'pending'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
              ${filter === status 
                ? 'bg-card text-foreground shadow-sm' 
                : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)} ({statusCounts[status]})
          </button>
        ))}
      </div>

      {/* Guest list */}
      <div className="space-y-2">
        {filteredGuests.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">
            No guests match this filter.
          </div>
        ) : (
          filteredGuests.map((guest, index) => {
            const overallStatus = getGuestOverallStatus(guest.id);
            const isExpanded = expandedBlock === guest.id;

            return (
              <motion.div
                key={guest.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
                className="rounded-xl bg-card border border-border/50 overflow-hidden"
              >
                {/* Guest header */}
                <div className="w-full p-3 flex items-center justify-between hover:bg-muted/30 transition-colors">
                  {isSelectMode ? (
                    <button
                      onClick={() => toggleGuestSelection(guest.id)}
                      className="flex items-center gap-3 flex-1 text-left"
                    >
                      {selectedGuests.has(guest.id) ? (
                        <CheckSquare className="w-5 h-5 text-primary" />
                      ) : (
                        <Square className="w-5 h-5 text-muted-foreground" />
                      )}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center
                        ${getStatusColor(overallStatus)}`}
                      >
                        <span className="text-sm font-medium">
                          {guest.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="text-left">
                        <div className="font-medium text-foreground">{guest.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {guest.status === 'pending' ? 'Awaiting response' : 'Responded'}
                        </div>
                      </div>
                    </button>
                  ) : (
                    <button
                      onClick={() => setExpandedBlock(isExpanded ? null : guest.id)}
                      className="flex items-center gap-3 flex-1 text-left"
                    >
                      {/* Avatar with status */}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center
                        ${getStatusColor(overallStatus)}`}
                      >
                        <span className="text-sm font-medium">
                          {guest.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      
                      <div className="text-left">
                        <div className="font-medium text-foreground">{guest.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {guest.status === 'pending' ? 'Awaiting response' : 'Responded'}
                        </div>
                      </div>
                    </button>
                  )}

                  {!isSelectMode && (
                    <div className="flex items-center gap-2">
                      {/* Block response indicators */}
                      <div className="flex gap-1">
                        {blocks.slice(0, 4).map(block => (
                          <div 
                            key={block.id}
                            className="w-5 h-5 rounded flex items-center justify-center bg-muted/50"
                            title={block.name}
                          >
                            {getStatusIcon(getGuestRSVP(guest.id, block.id))}
                          </div>
                        ))}
                        {blocks.length > 4 && (
                          <div className="w-5 h-5 rounded flex items-center justify-center 
                            bg-muted/50 text-xs text-muted-foreground">
                            +{blocks.length - 4}
                          </div>
                        )}
                      </div>
                      
                      <button
                        onClick={() => setExpandedBlock(isExpanded ? null : guest.id)}
                        className="p-1 rounded hover:bg-muted/50 transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* Expanded details */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border-t border-border/50"
                    >
                      <div className="p-3 space-y-3">
                        {/* Contact info */}
                        {(guest.email || guest.phone) && (
                          <div className="flex flex-wrap gap-2">
                            {guest.phone && (
                              <a
                                href={`tel:${guest.phone}`}
                                className="flex items-center gap-1 px-2 py-1 rounded-lg 
                                  bg-muted text-xs text-foreground hover:bg-muted/80"
                              >
                                <Phone className="w-3 h-3" />
                                {guest.phone}
                              </a>
                            )}
                            {guest.email && (
                              <a
                                href={`mailto:${guest.email}`}
                                className="flex items-center gap-1 px-2 py-1 rounded-lg 
                                  bg-muted text-xs text-foreground hover:bg-muted/80"
                              >
                                <Mail className="w-3 h-3" />
                                {guest.email}
                              </a>
                            )}
                          </div>
                        )}

                        {/* Per-block responses */}
                        <div className="space-y-1">
                          {blocks.map(block => {
                            const response = getGuestRSVP(guest.id, block.id);
                            return (
                              <div 
                                key={block.id}
                                className="flex items-center justify-between py-1.5 px-2 
                                  rounded-lg hover:bg-muted/30"
                              >
                                <span className="text-sm text-foreground">{block.name}</span>
                                <span className={`text-xs px-2 py-0.5 rounded-full
                                  ${response === 'in' ? 'bg-confirmed/10 text-confirmed' :
                                    response === 'maybe' ? 'bg-maybe/10 text-maybe' :
                                    response === 'out' ? 'bg-out/10 text-out' :
                                    'bg-muted text-muted-foreground'
                                  }`}
                                >
                                  {response || 'No response'}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default GuestGrid;
