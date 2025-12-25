import { Plus, Trash2 } from "lucide-react";
import type { EventFormData } from "@/pages/CreateEvent";

interface EventGuestsStepProps {
  formData: EventFormData;
  updateFormData: (updates: Partial<EventFormData>) => void;
}

const EventGuestsStep = ({ formData, updateFormData }: EventGuestsStepProps) => {
  const addGuest = () => {
    updateFormData({
      guests: [...formData.guests, { name: "", email: "", phone: "" }],
    });
  };

  const updateGuest = (index: number, updates: Partial<typeof formData.guests[0]>) => {
    const newGuests = [...formData.guests];
    newGuests[index] = { ...newGuests[index], ...updates };
    updateFormData({ guests: newGuests });
  };

  const removeGuest = (index: number) => {
    updateFormData({
      guests: formData.guests.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Add Guests</h2>
        <p className="text-muted-foreground">
          Add the people you want to invite. You can add more later!
        </p>
      </div>

      <div className="space-y-4">
        {formData.guests.map((guest, index) => (
          <div
            key={index}
            className="p-4 rounded-lg border border-border bg-muted/20 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                Guest {index + 1}
              </span>
              <button
                onClick={() => removeGuest(index)}
                className="text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <input
              type="text"
              value={guest.name}
              onChange={(e) => updateGuest(index, { name: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              placeholder="Name"
            />

            <div className="grid grid-cols-2 gap-3">
              <input
                type="email"
                value={guest.email}
                onChange={(e) => updateGuest(index, { email: e.target.value })}
                className="px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-all text-sm"
                placeholder="Email"
              />
              <input
                type="tel"
                value={guest.phone}
                onChange={(e) => updateGuest(index, { phone: e.target.value })}
                className="px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-all text-sm"
                placeholder="Phone"
              />
            </div>
          </div>
        ))}

        <button
          onClick={addGuest}
          className="w-full py-3 rounded-lg border-2 border-dashed border-border hover:border-primary text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Guest
        </button>

        {formData.guests.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No guests yet. You can add them now or after creating the event.
          </p>
        )}
      </div>
    </div>
  );
};

export default EventGuestsStep;
