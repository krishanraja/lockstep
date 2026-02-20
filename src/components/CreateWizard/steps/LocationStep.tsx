import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import type { EventTemplate, GooglePlaceResult } from '@/data/templates/types';
import { PlacesAutocomplete } from '../components/PlacesAutocomplete';

interface LocationStepProps {
  template: EventTemplate;
  eventName: string;
  locationText: string;
  location: GooglePlaceResult | null;
  onLocationChange: (location: GooglePlaceResult | null, text: string) => void;
  onLocationTextChange: (text: string) => void;
  onContinue: () => void;
}

export function LocationStep({
  template,
  eventName,
  locationText,
  location,
  onLocationChange,
  onLocationTextChange,
  onContinue,
}: LocationStepProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && locationText.trim()) {
      onContinue();
    }
  };

  return (
    <div className="h-full flex flex-col px-6 py-8" onKeyDown={handleKeyDown}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center mb-8"
      >
        <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-2">
          Where?
        </h1>
        <p className="text-muted-foreground text-sm">
          {eventName}
        </p>
      </motion.div>

      {/* Places autocomplete */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="max-w-sm mx-auto w-full"
      >
        <PlacesAutocomplete
          value={locationText}
          location={location}
          suggestions={template.suggestedLocations}
          onValueChange={onLocationTextChange}
          onLocationSelect={onLocationChange}
          placeholder="Search for a place..."
        />
      </motion.div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Continue button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: locationText.trim() ? 1 : 0.5, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="pt-6 max-w-sm mx-auto w-full"
      >
        <button
          onClick={onContinue}
          disabled={!locationText.trim()}
          className="w-full py-4 rounded-2xl
            bg-button-bg text-button-text font-medium
            flex items-center justify-center gap-2
            disabled:opacity-50 disabled:cursor-not-allowed
            hover:opacity-90 transition-opacity"
        >
          Continue
          <ChevronRight className="w-5 h-5" />
        </button>
      </motion.div>
    </div>
  );
}
