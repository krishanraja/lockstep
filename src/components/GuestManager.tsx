import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserPlus,
  Pencil,
  Trash2,
  Check,
  X as XIcon,
  Phone,
  Mail,
  AlertCircle,
} from 'lucide-react';
import { validatePhone, normalizeToE164, formatPhoneDisplay } from '@/lib/phoneValidator';

interface Guest {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  status: string | null;
  magic_token: string | null;
}

interface GuestManagerProps {
  eventId: string;
  guests: Guest[];
  onUpdateGuests: (guests: Guest[]) => void;
}

interface GuestDraft {
  name: string;
  email: string;
  phone: string;
}

const EMPTY_DRAFT: GuestDraft = { name: '', email: '', phone: '' };

function generateToken(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 24; i++) {
    token += chars[Math.floor(Math.random() * chars.length)];
  }
  return token;
}

export const GuestManager = ({ eventId, guests, onUpdateGuests }: GuestManagerProps) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<GuestDraft>(EMPTY_DRAFT);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const validateDraft = (): boolean => {
    if (!draft.name.trim()) return false;

    if (draft.phone.trim()) {
      const result = validatePhone(draft.phone);
      if (!result.valid) {
        setPhoneError(result.error || 'Invalid phone number');
        return false;
      }
    }
    setPhoneError(null);
    return true;
  };

  const handleAdd = async () => {
    if (!validateDraft()) return;
    setIsSaving(true);

    const normalizedPhone = draft.phone.trim()
      ? normalizeToE164(draft.phone)
      : null;

    const newGuest: Guest = {
      id: crypto.randomUUID(),
      name: draft.name.trim(),
      email: draft.email.trim() || null,
      phone: normalizedPhone,
      status: 'pending',
      magic_token: generateToken(),
    };

    onUpdateGuests([...guests, newGuest]);
    setDraft(EMPTY_DRAFT);
    setPhoneError(null);
    setIsAdding(false);
    setIsSaving(false);
  };

  const handleEdit = (guest: Guest) => {
    setEditingId(guest.id);
    setDraft({
      name: guest.name,
      email: guest.email || '',
      phone: guest.phone ? formatPhoneDisplay(guest.phone) : '',
    });
    setPhoneError(null);
  };

  const handleSaveEdit = async () => {
    if (!editingId || !validateDraft()) return;
    setIsSaving(true);

    const normalizedPhone = draft.phone.trim()
      ? normalizeToE164(draft.phone)
      : null;

    const updated = guests.map(g =>
      g.id === editingId
        ? { ...g, name: draft.name.trim(), email: draft.email.trim() || null, phone: normalizedPhone }
        : g,
    );

    onUpdateGuests(updated);
    setEditingId(null);
    setDraft(EMPTY_DRAFT);
    setPhoneError(null);
    setIsSaving(false);
  };

  const handleRemove = (guestId: string) => {
    onUpdateGuests(guests.filter(g => g.id !== guestId));
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setDraft(EMPTY_DRAFT);
    setPhoneError(null);
  };

  const renderForm = (onSave: () => void) => (
    <div className="space-y-3 p-4 rounded-xl bg-card border border-border/50">
      <input
        type="text"
        placeholder="Name *"
        value={draft.name}
        onChange={e => setDraft(d => ({ ...d, name: e.target.value }))}
        className="w-full px-3 py-2 rounded-lg bg-muted border border-border/50 text-foreground
          text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        autoFocus
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="email"
            placeholder="Email"
            value={draft.email}
            onChange={e => setDraft(d => ({ ...d, email: e.target.value }))}
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-muted border border-border/50 text-foreground
              text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <div>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              type="tel"
              placeholder="Phone (+61...)"
              value={draft.phone}
              onChange={e => {
                setDraft(d => ({ ...d, phone: e.target.value }));
                setPhoneError(null);
              }}
              className={`w-full pl-9 pr-3 py-2 rounded-lg bg-muted border text-foreground
                text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50
                ${phoneError ? 'border-destructive' : 'border-border/50'}`}
            />
          </div>
          {phoneError && (
            <div className="flex items-center gap-1 mt-1 text-xs text-destructive">
              <AlertCircle className="w-3 h-3" />
              {phoneError}
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center justify-end gap-2">
        <button
          onClick={handleCancel}
          className="px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground
            hover:bg-muted transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onSave}
          disabled={!draft.name.trim() || isSaving}
          className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium
            flex items-center gap-1.5 hover:opacity-90 transition-opacity
            disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Check className="w-3.5 h-3.5" />
          {isSaving ? 'Saving...' : editingId ? 'Save' : 'Add Guest'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <UserPlus className="w-4 h-4 text-primary" />
          Manage Guests
        </div>
        {!isAdding && !editingId && (
          <button
            onClick={() => setIsAdding(true)}
            className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium
              flex items-center gap-1.5 hover:opacity-90 transition-opacity"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Add Guest
          </button>
        )}
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            {renderForm(handleAdd)}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Guest list */}
      <div className="space-y-2">
        {guests.length === 0 && !isAdding && (
          <div className="p-6 text-center text-muted-foreground rounded-xl bg-card border border-border/50">
            <UserPlus className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No guests yet. Add your first guest to get started.</p>
          </div>
        )}

        {guests.map((guest, index) => (
          <motion.div
            key={guest.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.02 }}
          >
            {editingId === guest.id ? (
              renderForm(handleSaveEdit)
            ) : (
              <div className="flex items-center justify-between p-3 rounded-xl bg-card border border-border/50
                hover:border-primary/20 transition-colors group">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0
                    ${guest.status === 'responded'
                      ? 'bg-confirmed/10 border border-confirmed/30 text-confirmed'
                      : 'bg-muted border border-border/50 text-muted-foreground'
                    }`}
                  >
                    <span className="text-sm font-medium">
                      {guest.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-sm text-foreground truncate">{guest.name}</div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {guest.phone && (
                        <span className="flex items-center gap-0.5 truncate">
                          <Phone className="w-3 h-3 flex-shrink-0" />
                          {formatPhoneDisplay(guest.phone)}
                        </span>
                      )}
                      {guest.email && (
                        <span className="flex items-center gap-0.5 truncate">
                          <Mail className="w-3 h-3 flex-shrink-0" />
                          {guest.email}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <button
                    onClick={() => handleEdit(guest)}
                    className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                    title="Edit"
                  >
                    <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                  <button
                    onClick={() => handleRemove(guest.id)}
                    className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors"
                    title="Remove"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default GuestManager;
