import { useState } from 'react';
import { Plus, X, Edit2, Check, Phone, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { validateAndNormalizePhone, formatPhoneForDisplay } from '@/utils/phoneValidator';

interface Guest {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  status: string | null;
  magic_token?: string | null;
}

interface GuestManagerProps {
  eventId: string;
  guests: Guest[];
  onUpdateGuests: (updatedGuests: Guest[]) => Promise<void>;
}

export function GuestManager({ eventId, guests, onUpdateGuests }: GuestManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newGuest, setNewGuest] = useState({ name: '', email: '', phone: '' });
  const [editGuest, setEditGuest] = useState({ name: '', email: '', phone: '' });
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleAddGuest = async () => {
    setValidationError(null);

    // Validate name
    if (!newGuest.name.trim()) {
      setValidationError('Name is required');
      return;
    }

    // Validate and normalize phone (required)
    const validation = validateAndNormalizePhone(newGuest.phone);
    if (!validation.isValid) {
      setValidationError(validation.error || 'Valid phone number is required');
      return;
    }

    // Add guest with normalized phone
    const updatedGuests: Guest[] = [
      ...guests,
      {
        id: `guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: newGuest.name.trim(),
        email: newGuest.email.trim() || null,
        phone: validation.normalized!,
        status: 'pending',
      },
    ];

    await onUpdateGuests(updatedGuests);
    setNewGuest({ name: '', email: '', phone: '' });
    setIsAdding(false);
  };

  const handleUpdateGuest = async (guestId: string) => {
    setValidationError(null);

    // Validate name
    if (!editGuest.name.trim()) {
      setValidationError('Name is required');
      return;
    }

    // Validate and normalize phone
    const validation = validateAndNormalizePhone(editGuest.phone);
    if (!validation.isValid) {
      setValidationError(validation.error || 'Valid phone number is required');
      return;
    }

    // Update guest with normalized phone
    const updatedGuests = guests.map((g) =>
      g.id === guestId
        ? { 
            ...g, 
            name: editGuest.name.trim(), 
            email: editGuest.email.trim() || null,
            phone: validation.normalized! 
          }
        : g
    );

    await onUpdateGuests(updatedGuests);
    setEditingId(null);
    setEditGuest({ name: '', email: '', phone: '' });
  };

  const handleRemoveGuest = async (guestId: string) => {
    const updatedGuests = guests.filter((g) => g.id !== guestId);
    await onUpdateGuests(updatedGuests);
  };

  const startEdit = (guest: Guest) => {
    setEditingId(guest.id);
    setEditGuest({ 
      name: guest.name, 
      email: guest.email || '',
      phone: guest.phone || '' 
    });
    setValidationError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditGuest({ name: '', email: '', phone: '' });
    setValidationError(null);
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Guests ({guests.length})</h3>
          {!isAdding && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAdding(true)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Guest
            </Button>
          )}
        </div>

        {/* Add new guest form */}
        {isAdding && (
          <div className="border rounded-lg p-4 bg-muted/50 space-y-3">
            <div className="space-y-2">
              <Label htmlFor="new-guest-name">Name *</Label>
              <Input
                id="new-guest-name"
                placeholder="Guest name"
                value={newGuest.name}
                onChange={(e) => setNewGuest({ ...newGuest, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-guest-email">Email (optional)</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="new-guest-email"
                  type="email"
                  placeholder="guest@example.com"
                  value={newGuest.email}
                  onChange={(e) => setNewGuest({ ...newGuest, email: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-guest-phone">Phone Number *</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="new-guest-phone"
                  type="tel"
                  placeholder="+1 (234) 567-8900"
                  value={newGuest.phone}
                  onChange={(e) => {
                    setNewGuest({ ...newGuest, phone: e.target.value });
                    setValidationError(null);
                  }}
                  className="pl-10"
                />
              </div>
              {validationError && (
                <p className="text-sm text-destructive">{validationError}</p>
              )}
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddGuest} size="sm" className="gap-2">
                <Check className="h-4 w-4" />
                Add
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsAdding(false);
                  setNewGuest({ name: '', email: '', phone: '' });
                  setValidationError(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Guest list */}
        <div className="space-y-2">
          {guests.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No guests added yet
            </p>
          ) : (
            guests.map((guest) => (
              <div
                key={guest.id}
                className="flex items-center justify-between border rounded-lg p-3 bg-background"
              >
                {editingId === guest.id ? (
                  // Edit mode
                  <div className="flex-1 space-y-2">
                    <Input
                      placeholder="Name"
                      value={editGuest.name}
                      onChange={(e) => setEditGuest({ ...editGuest, name: e.target.value })}
                    />
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="email"
                        placeholder="Email (optional)"
                        value={editGuest.email}
                        onChange={(e) => setEditGuest({ ...editGuest, email: e.target.value })}
                        className="pl-10"
                      />
                    </div>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="tel"
                        placeholder="+1 (234) 567-8900"
                        value={editGuest.phone}
                        onChange={(e) => {
                          setEditGuest({ ...editGuest, phone: e.target.value });
                          setValidationError(null);
                        }}
                        className="pl-10"
                      />
                    </div>
                    {validationError && (
                      <p className="text-sm text-destructive">{validationError}</p>
                    )}
                    <div className="flex gap-2 mt-2">
                      <Button
                        size="sm"
                        onClick={() => handleUpdateGuest(guest.id)}
                        className="gap-2"
                      >
                        <Check className="h-4 w-4" />
                        Save
                      </Button>
                      <Button variant="outline" size="sm" onClick={cancelEdit}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  // View mode
                  <>
                    <div className="flex-1">
                      <p className="font-medium">{guest.name}</p>
                      {guest.email && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {guest.email}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {guest.phone ? formatPhoneForDisplay(guest.phone) : 'No phone'}
                      </p>
                      <span
                        className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${
                          guest.status === 'responded'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {guest.status === 'responded' ? 'Responded' : 'Pending'}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEdit(guest)}
                        className="gap-2"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveGuest(guest.id)}
                        className="gap-2 text-destructive hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </Card>
  );
}
