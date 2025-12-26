import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Users, Clock, X } from 'lucide-react';

interface GuestsStepProps {
  eventName: string;
  guests: string[];
  onGuestsChange: (guests: string[]) => void;
  onSendInvites: () => void;
  onSkip: () => void;
  isSubmitting: boolean;
}

export function GuestsStep({
  eventName,
  guests,
  onGuestsChange,
  onSendInvites,
  onSkip,
  isSubmitting,
}: GuestsStepProps) {
  const [inputValue, setInputValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setTimeout(() => textareaRef.current?.focus(), 100);
  }, []);

  // Parse input and extract phone numbers/names
  const parseGuestInput = (text: string): string[] => {
    return text
      .split(/[\n,;]+/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInputValue(value);
    onGuestsChange(parseGuestInput(value));
  };

  const handleRemoveGuest = (index: number) => {
    const newGuests = guests.filter((_, i) => i !== index);
    onGuestsChange(newGuests);
    setInputValue(newGuests.join('\n'));
  };

  const guestCount = guests.length;

  return (
    <div className="h-full flex flex-col px-6 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center mb-6"
      >
        <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-2">
          Invite the crew
        </h1>
        <p className="text-muted-foreground text-sm">
          {eventName}
        </p>
      </motion.div>

      {/* Input area */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="flex-1 max-w-sm mx-auto w-full flex flex-col"
      >
        <div className="flex-1 min-h-0">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={handleInputChange}
            placeholder="Paste phone numbers or names, one per line...

+61 412 345 678
+61 423 456 789
John Smith"
            className="w-full h-full min-h-[200px] p-4 rounded-2xl
              bg-card border border-border/50 resize-none
              text-foreground placeholder:text-muted-foreground/50
              focus:border-primary focus:outline-none
              transition-colors duration-200"
          />
        </div>

        {/* Guest count */}
        {guestCount > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-4"
          >
            <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                {guestCount} guest{guestCount !== 1 ? 's' : ''} to invite
              </span>
            </div>
            
            {/* Guest preview */}
            <div className="flex flex-wrap gap-2">
              {guests.slice(0, 5).map((guest, index) => (
                <div
                  key={index}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full
                    bg-primary/10 text-primary text-xs"
                >
                  <span className="max-w-[120px] truncate">{guest}</span>
                  <button
                    onClick={() => handleRemoveGuest(index)}
                    className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {guests.length > 5 && (
                <span className="px-3 py-1.5 text-xs text-muted-foreground">
                  +{guests.length - 5} more
                </span>
              )}
            </div>
          </motion.div>
        )}

        {/* Import contacts button (placeholder) */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="mt-4 w-full py-3 rounded-xl
            bg-card border border-border/50
            text-muted-foreground text-sm
            flex items-center justify-center gap-2
            hover:border-primary/50 transition-colors"
          onClick={() => {
            // Placeholder for contacts import
            alert('Contact import coming soon!');
          }}
        >
          <Users className="w-4 h-4" />
          Import from Contacts
        </motion.button>
      </motion.div>

      {/* Action buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="pt-6 max-w-sm mx-auto w-full space-y-3"
      >
        <button
          onClick={onSendInvites}
          disabled={isSubmitting}
          className="w-full py-4 rounded-2xl
            bg-primary text-primary-foreground font-medium
            flex items-center justify-center gap-2
            disabled:opacity-50 disabled:cursor-not-allowed
            hover:opacity-90 transition-opacity"
        >
          {isSubmitting ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <Clock className="w-5 h-5" />
              </motion.div>
              Creating Event...
            </>
          ) : (
            <>
              {guestCount > 0 ? 'Send Invites' : 'Create Event'}
              <Send className="w-5 h-5" />
            </>
          )}
        </button>
        
        {guestCount === 0 && (
          <button
            onClick={onSkip}
            disabled={isSubmitting}
            className="w-full py-3 rounded-2xl
              bg-transparent text-muted-foreground font-medium
              flex items-center justify-center gap-2
              hover:text-foreground transition-colors
              disabled:opacity-50"
          >
            Skip for now
          </button>
        )}
      </motion.div>
    </div>
  );
}

