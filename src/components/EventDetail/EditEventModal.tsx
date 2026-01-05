// EditEventModal - Full event editing modal
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Calendar, 
  MapPin, 
  Type, 
  FileText,
  Image,
  Loader2,
  Check
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';

interface EditEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: {
    id: string;
    title: string;
    description: string | null;
    location: string | null;
    start_date: string | null;
    end_date: string | null;
    cover_image_url?: string | null;
  };
  onSave: (updatedEvent: any) => void;
}

export const EditEventModal = ({
  isOpen,
  onClose,
  event,
  onSave,
}: EditEventModalProps) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    start_date: '',
    end_date: '',
    cover_image_url: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // Initialize form data when modal opens or event changes
  useEffect(() => {
    if (event && isOpen) {
      setFormData({
        title: event.title || '',
        description: event.description || '',
        location: event.location || '',
        start_date: event.start_date 
          ? format(new Date(event.start_date), "yyyy-MM-dd'T'HH:mm")
          : '',
        end_date: event.end_date 
          ? format(new Date(event.end_date), "yyyy-MM-dd'T'HH:mm")
          : '',
        cover_image_url: event.cover_image_url || '',
      });
      setError(null);
      setShowSuccess(false);
    }
  }, [event, isOpen]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      setError('Event title is required');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const updateData: any = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        location: formData.location.trim() || null,
        start_date: formData.start_date ? new Date(formData.start_date).toISOString() : null,
        end_date: formData.end_date ? new Date(formData.end_date).toISOString() : null,
        cover_image_url: formData.cover_image_url.trim() || null,
      };

      const { data, error: updateError } = await supabase
        .from('events')
        .update(updateData)
        .eq('id', event.id)
        .select()
        .single();

      if (updateError) throw updateError;

      setShowSuccess(true);
      setTimeout(() => {
        onSave(data);
        onClose();
      }, 500);
    } catch (err: any) {
      console.error('Error updating event:', err);
      setError(err.message || 'Failed to update event');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isSaving) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleBackdropClick}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-4 top-[5%] bottom-[5%] md:inset-auto md:left-1/2 md:top-1/2 
              md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-lg md:w-full z-50 
              flex items-start justify-center overflow-y-auto"
          >
            <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-h-full overflow-y-auto">
              {/* Header */}
              <div className="sticky top-0 bg-card border-b border-border/50 px-6 py-4 flex items-center justify-between z-10">
                <h2 className="text-xl font-bold text-foreground">Edit Event</h2>
                <button
                  onClick={onClose}
                  disabled={isSaving}
                  className="p-2 rounded-full hover:bg-muted transition-colors disabled:opacity-50"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title" className="flex items-center gap-2">
                    <Type className="w-4 h-4 text-muted-foreground" />
                    Event Title
                  </Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleChange('title', e.target.value)}
                    placeholder="Enter event title"
                    className="bg-background"
                    disabled={isSaving}
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description" className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    placeholder="Describe your event..."
                    rows={3}
                    className="bg-background resize-none"
                    disabled={isSaving}
                  />
                </div>

                {/* Location */}
                <div className="space-y-2">
                  <Label htmlFor="location" className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    Location
                  </Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => handleChange('location', e.target.value)}
                    placeholder="Enter location"
                    className="bg-background"
                    disabled={isSaving}
                  />
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_date" className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      Start Date
                    </Label>
                    <Input
                      id="start_date"
                      type="datetime-local"
                      value={formData.start_date}
                      onChange={(e) => handleChange('start_date', e.target.value)}
                      className="bg-background"
                      disabled={isSaving}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_date" className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      End Date
                    </Label>
                    <Input
                      id="end_date"
                      type="datetime-local"
                      value={formData.end_date}
                      onChange={(e) => handleChange('end_date', e.target.value)}
                      className="bg-background"
                      disabled={isSaving}
                    />
                  </div>
                </div>

                {/* Cover Image URL */}
                <div className="space-y-2">
                  <Label htmlFor="cover_image_url" className="flex items-center gap-2">
                    <Image className="w-4 h-4 text-muted-foreground" />
                    Cover Image URL
                  </Label>
                  <Input
                    id="cover_image_url"
                    type="url"
                    value={formData.cover_image_url}
                    onChange={(e) => handleChange('cover_image_url', e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="bg-background"
                    disabled={isSaving}
                  />
                  {formData.cover_image_url && (
                    <div className="mt-2 rounded-lg overflow-hidden border border-border">
                      <img 
                        src={formData.cover_image_url} 
                        alt="Cover preview"
                        className="w-full h-32 object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Error */}
                {error && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                )}

                {/* Success */}
                {showSuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-lg bg-confirmed/10 border border-confirmed/20 flex items-center gap-2"
                  >
                    <Check className="w-4 h-4 text-confirmed" />
                    <p className="text-sm text-confirmed">Event updated successfully!</p>
                  </motion.div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    disabled={isSaving}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 bg-primary hover:bg-primary/90"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default EditEventModal;
