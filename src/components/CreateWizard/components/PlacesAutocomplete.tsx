import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Loader2 } from 'lucide-react';
import type { GooglePlaceResult } from '@/data/templates/types';
import { 
  loadGoogleMapsAPI, 
  isGoogleMapsAvailable, 
  initAutocomplete,
  getStaticMapUrl,
  geocodeAddress 
} from '@/services/places';

interface PlacesAutocompleteProps {
  value: string;
  location: GooglePlaceResult | null;
  suggestions?: string[];
  onValueChange: (value: string) => void;
  onLocationSelect: (location: GooglePlaceResult | null, text: string) => void;
  placeholder?: string;
}

export function PlacesAutocomplete({
  value,
  location,
  suggestions = [],
  onValueChange,
  onLocationSelect,
  placeholder = 'Search for a place...',
}: PlacesAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFocused, setIsFocused] = useState(false);
  const [googleAvailable, setGoogleAvailable] = useState(false);
  const [mapLoading, setMapLoading] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const geocodeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    const init = async () => {
      try {
        const apiKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;
        if (!apiKey) {
          console.warn('[PlacesAutocomplete] Google Places API key not configured. Map features will be limited.');
        } else {
          console.log('[PlacesAutocomplete] Google Places API key configured');
        }
        
        await loadGoogleMapsAPI();
        if (isMounted) {
          const available = isGoogleMapsAvailable();
          setGoogleAvailable(available);
          if (!available) {
            console.warn('[PlacesAutocomplete] Google Maps API not available after loading');
          }
        }
      } catch (err) {
        console.warn('[PlacesAutocomplete] Google Maps API not available:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    init();
    
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (googleAvailable && inputRef.current && !autocompleteRef.current) {
      autocompleteRef.current = initAutocomplete(
        inputRef.current,
        (place) => {
          onLocationSelect(place, place.formattedAddress);
          onValueChange(place.formattedAddress);
        }
      );
    }

    return () => {
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [googleAvailable, onLocationSelect, onValueChange]);

  // Geocode address when user has entered text but no coordinates
  const tryGeocodeAddress = useCallback(async (address: string) => {
    if (!address.trim() || !googleAvailable) return;
    
    // Don't geocode if we already have valid coordinates for this address
    if (location && location.formattedAddress === address) return;
    
    console.log('[PlacesAutocomplete] Attempting to geocode:', address);
    setIsGeocoding(true);
    
    try {
      const result = await geocodeAddress(address);
      if (result) {
        console.log('[PlacesAutocomplete] Geocoding successful:', result);
        onLocationSelect(result, result.formattedAddress);
      } else {
        console.warn('[PlacesAutocomplete] Geocoding returned no results for:', address);
      }
    } catch (err) {
      console.error('[PlacesAutocomplete] Geocoding failed:', err);
    } finally {
      setIsGeocoding(false);
    }
  }, [googleAvailable, location, onLocationSelect]);

  const handleSuggestionClick = (suggestion: string) => {
    onValueChange(suggestion);
    // Trigger geocoding for the suggestion to get coordinates
    tryGeocodeAddress(suggestion);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onValueChange(newValue);
    
    // Clear any pending geocode
    if (geocodeTimeoutRef.current) {
      clearTimeout(geocodeTimeoutRef.current);
    }
    
    // Clear location when user types (unless Google autocomplete handles it)
    if (!googleAvailable) {
      onLocationSelect(null, newValue);
    }
  };

  const handleInputBlur = useCallback(() => {
    setIsFocused(false);
    
    // If user has entered text but we don't have coordinates, try geocoding
    if (value.trim() && (!location || !location.lat || !location.lng)) {
      // Small delay to allow Google autocomplete selection to process first
      geocodeTimeoutRef.current = setTimeout(() => {
        tryGeocodeAddress(value);
      }, 300);
    }
  }, [value, location, tryGeocodeAddress]);

  // Cleanup geocode timeout on unmount
  useEffect(() => {
    return () => {
      if (geocodeTimeoutRef.current) {
        clearTimeout(geocodeTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="w-full">
      {/* Search input */}
      <div className={`
        flex items-center gap-3 p-4 rounded-2xl
        bg-card border transition-colors duration-200
        ${isFocused ? 'border-primary' : 'border-border/50'}
      `}>
        {isLoading || isGeocoding ? (
          <Loader2 className="w-5 h-5 text-muted-foreground animate-spin flex-shrink-0" />
        ) : (
          <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
        )}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={() => setIsFocused(true)}
          onBlur={handleInputBlur}
          placeholder={placeholder}
          className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground/50"
          autoComplete="off"
        />
      </div>

      {/* Map preview */}
      <AnimatePresence>
        {location && (() => {
          // Validate coordinates before rendering map
          const hasValidCoordinates = 
            typeof location.lat === 'number' && 
            typeof location.lng === 'number' &&
            !isNaN(location.lat) && 
            !isNaN(location.lng) &&
            location.lat >= -90 && location.lat <= 90 &&
            location.lng >= -180 && location.lng <= 180;

          if (!hasValidCoordinates) {
            console.warn('[PlacesAutocomplete] Invalid coordinates for map:', { lat: location.lat, lng: location.lng });
          }

          return (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-4 overflow-hidden"
            >
              <div className="h-32 rounded-xl overflow-hidden bg-card border border-border/50 relative">
                {hasValidCoordinates ? (
                  <>
                    {mapLoading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
                        <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
                      </div>
                    )}
                    <img
                      src={getStaticMapUrl(location.lat, location.lng, { 
                        width: 400, 
                        height: 200,
                        style: 'dark'
                      })}
                      alt={`Map of ${location.name || location.formattedAddress}`}
                      className="w-full h-full object-cover"
                      onLoad={() => {
                        setMapLoading(false);
                        setMapError(false);
                      }}
                      onError={() => {
                        console.error('[PlacesAutocomplete] Map image failed to load');
                        setMapLoading(false);
                        setMapError(true);
                      }}
                      onLoadStart={() => {
                        setMapLoading(true);
                        setMapError(false);
                      }}
                    />
                    {mapError && (
                      <div className="absolute inset-0 flex items-center justify-center bg-muted/80">
                        <p className="text-xs text-muted-foreground">Map unavailable</p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted/50">
                    <p className="text-xs text-muted-foreground">Map unavailable</p>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span className="truncate">{location.formattedAddress}</span>
              </div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* AI Suggestions */}
      {suggestions.length > 0 && !location && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="mt-4"
        >
          <p className="text-sm text-muted-foreground mb-2">Suggested locations:</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion, index) => (
              <motion.button
                key={suggestion}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                onClick={() => handleSuggestionClick(suggestion)}
                className={`
                  px-3 py-2 rounded-xl text-sm
                  border transition-all duration-200
                  ${value === suggestion
                    ? 'bg-primary/10 border-primary text-primary'
                    : 'bg-card border-border/50 text-foreground hover:border-primary/50'
                  }
                `}
              >
                {suggestion.split(',')[0]}
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}






