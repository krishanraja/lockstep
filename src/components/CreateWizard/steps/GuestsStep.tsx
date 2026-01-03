import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Users, X, Loader2, UserPlus, RefreshCw, AlertCircle } from 'lucide-react';
import type { OperationProgress } from '@/lib/async-utils';
import { progressMessages } from '@/lib/async-utils';

// Contact Picker API types (not yet in standard TypeScript lib)
interface ContactAddress {
  city?: string;
  country?: string;
  postalCode?: string;
  region?: string;
  streetAddress?: string;
}

interface ContactInfo {
  name?: string[];
  tel?: string[];
  email?: string[];
  address?: ContactAddress[];
  icon?: Blob[];
}

interface ContactsManager {
  select(
    properties: ('name' | 'tel' | 'email' | 'address' | 'icon')[],
    options?: { multiple?: boolean }
  ): Promise<ContactInfo[]>;
  getProperties(): Promise<string[]>;
}

declare global {
  interface Navigator {
    contacts?: ContactsManager;
  }
  interface Window {
    ContactsManager?: new () => ContactsManager;
  }
}

interface GuestsStepProps {
  eventName: string;
  guests: string[];
  onGuestsChange: (guests: string[]) => void;
  onSendInvites: () => void;
  onSkip: () => void;
  isSubmitting: boolean;
  progress?: OperationProgress;
  error?: string | null;
  canRetry?: boolean;
  onRetry?: () => void;
}

// Check if Contact Picker API is available
function isContactPickerSupported(): boolean {
  return 'contacts' in navigator && 'ContactsManager' in window;
}

// Normalize phone numbers for consistency
function normalizePhoneNumber(phone: string): string {
  // Remove all non-digit characters except + at the start
  const cleaned = phone.replace(/[^\d+]/g, '');
  // If it starts with a country code, keep it; otherwise assume it's a local number
  return cleaned;
}

export function GuestsStep({
  eventName,
  guests,
  onGuestsChange,
  onSendInvites,
  onSkip,
  isSubmitting,
  progress = 'idle',
  error,
  canRetry,
  onRetry,
}: GuestsStepProps) {
  // Get the display message based on progress
  const progressMessage = progressMessages[progress] || 'Creating Event...';
  const [inputValue, setInputValue] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
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
    setImportError(null);
  };

  const handleRemoveGuest = (index: number) => {
    const newGuests = guests.filter((_, i) => i !== index);
    onGuestsChange(newGuests);
    setInputValue(newGuests.join('\n'));
  };

  // Import contacts using the native Contact Picker API
  const handleImportContacts = async () => {
    setImportError(null);
    
    if (!isContactPickerSupported()) {
      setImportError('Contact import requires a mobile browser (Chrome/Edge on Android). Try pasting contacts manually.');
      return;
    }

    setIsImporting(true);

    try {
      // Request contacts with name and phone number
      const contacts = await navigator.contacts!.select(
        ['name', 'tel'],
        { multiple: true }
      );

      if (contacts && contacts.length > 0) {
        const newGuests: string[] = [];

        for (const contact of contacts) {
          // Prefer phone number, fall back to name
          if (contact.tel && contact.tel.length > 0) {
            // Use the first phone number
            const phone = normalizePhoneNumber(contact.tel[0]);
            if (phone) {
              // If we have a name, format as "Name: Phone"
              if (contact.name && contact.name.length > 0 && contact.name[0]) {
                newGuests.push(`${contact.name[0]}: ${phone}`);
              } else {
                newGuests.push(phone);
              }
            }
          } else if (contact.name && contact.name.length > 0 && contact.name[0]) {
            // No phone, just use name
            newGuests.push(contact.name[0]);
          }
        }

        if (newGuests.length > 0) {
          // Merge with existing guests (avoid duplicates)
          const existingSet = new Set(guests.map(g => g.toLowerCase()));
          const uniqueNew = newGuests.filter(g => !existingSet.has(g.toLowerCase()));
          const mergedGuests = [...guests, ...uniqueNew];
          
          onGuestsChange(mergedGuests);
          setInputValue(mergedGuests.join('\n'));
        }
      }
    } catch (err: any) {
      // User cancelled or permission denied
      if (err.name !== 'AbortError') {
        console.error('Contact import error:', err);
        setImportError('Could not access contacts. Please check permissions and try again.');
      }
    } finally {
      setIsImporting(false);
    }
  };

  const guestCount = guests.length;
  const contactPickerAvailable = isContactPickerSupported();

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

        {/* Import contacts button */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className={`mt-4 w-full py-3 rounded-xl
            bg-card border border-border/50
            text-sm
            flex items-center justify-center gap-2
            transition-all duration-200
            ${contactPickerAvailable 
              ? 'text-foreground hover:border-primary hover:bg-primary/5 active:scale-[0.98]' 
              : 'text-muted-foreground hover:border-primary/50'
            }
            disabled:opacity-50 disabled:cursor-not-allowed`}
          onClick={handleImportContacts}
          disabled={isImporting}
        >
          {isImporting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Importing...
            </>
          ) : (
            <>
              <UserPlus className="w-4 h-4" />
              Import from Contacts
            </>
          )}
        </motion.button>

        {/* Import error message */}
        {importError && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 text-xs text-amber-400/80 text-center"
          >
            {importError}
          </motion.p>
        )}
      </motion.div>

      {/* Error message with retry */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-sm mx-auto w-full mb-4"
        >
          <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-destructive">{error}</p>
                {canRetry && onRetry && (
                  <button
                    onClick={onRetry}
                    disabled={isSubmitting}
                    className="mt-2 flex items-center gap-1.5 text-xs font-medium
                      text-destructive hover:text-destructive/80 transition-colors
                      disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <RefreshCw className={`w-3 h-3 ${isSubmitting ? 'animate-spin' : ''}`} />
                    Try again
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Action buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="pt-6 max-w-sm mx-auto w-full space-y-3"
      >
        {/* Show Create Event button only when there are guests */}
        {guestCount > 0 && (
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
                <Loader2 className="w-5 h-5 animate-spin" />
                {progressMessage || 'Creating Event...'}
              </>
            ) : (
              <>
                Create Event
                <Send className="w-5 h-5" />
              </>
            )}
          </button>
        )}
        
        {/* Skip for now - always visible when no guests, becomes primary action */}
        {guestCount === 0 && (
          <button
            onClick={onSkip}
            disabled={isSubmitting}
            className="w-full py-4 rounded-2xl
              bg-primary text-primary-foreground font-medium
              flex items-center justify-center gap-2
              hover:opacity-90 transition-opacity
              disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {progressMessage || 'Creating Event...'}
              </>
            ) : (
              <>
                Create Event
                <Send className="w-5 h-5" />
              </>
            )}
          </button>
        )}
        
        {/* Add guests later hint when no guests */}
        {guestCount === 0 && !isSubmitting && (
          <p className="text-xs text-muted-foreground text-center">
            You can add guests later from the event page
          </p>
        )}
      </motion.div>
    </div>
  );
}
