// Google Places API Integration
// This service provides autocomplete and place details functionality

import type { GooglePlaceResult } from '@/data/templates/types';

let googleMapsLoaded = false;
let loadingPromise: Promise<void> | null = null;

// Load Google Maps API
export async function loadGoogleMapsAPI(): Promise<void> {
  if (googleMapsLoaded) return;
  
  if (loadingPromise) return loadingPromise;
  
  const apiKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;
  
  if (!apiKey) {
    console.warn('Google Places API key not configured. Using fallback mode.');
    return;
  }

  loadingPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      googleMapsLoaded = true;
      resolve();
    };
    
    script.onerror = () => {
      reject(new Error('Failed to load Google Maps API'));
    };
    
    document.head.appendChild(script);
  });
  
  return loadingPromise;
}

// Check if Google Maps is available
export function isGoogleMapsAvailable(): boolean {
  return typeof google !== 'undefined' && typeof google.maps !== 'undefined';
}

// Initialize Places Autocomplete on an input element
export function initAutocomplete(
  inputElement: HTMLInputElement,
  onPlaceSelect: (place: GooglePlaceResult) => void,
  options?: {
    types?: string[];
    componentRestrictions?: { country: string | string[] };
  }
): google.maps.places.Autocomplete | null {
  if (!isGoogleMapsAvailable()) {
    console.warn('Google Maps not available');
    return null;
  }

  const autocomplete = new google.maps.places.Autocomplete(inputElement, {
    types: options?.types || ['(cities)'],
    fields: ['place_id', 'name', 'formatted_address', 'geometry', 'types'],
    ...(options?.componentRestrictions && { componentRestrictions: options.componentRestrictions }),
  });

  autocomplete.addListener('place_changed', () => {
    const place = autocomplete.getPlace();
    
    if (place && place.place_id && place.geometry?.location) {
      onPlaceSelect({
        placeId: place.place_id,
        name: place.name || '',
        formattedAddress: place.formatted_address || '',
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
        types: place.types,
      });
    }
  });

  return autocomplete;
}

// Get static map URL for a location
export function getStaticMapUrl(
  lat: number,
  lng: number,
  options?: {
    width?: number;
    height?: number;
    zoom?: number;
    style?: 'dark' | 'light';
  }
): string {
  const apiKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;
  
  if (!apiKey) {
    // Return a placeholder for development
    return `https://via.placeholder.com/${options?.width || 400}x${options?.height || 200}/1a1a2e/5B6CFF?text=Map`;
  }

  const width = options?.width || 400;
  const height = options?.height || 200;
  const zoom = options?.zoom || 12;
  
  // Dark mode map style
  const darkStyle = '&style=element:geometry|color:0x1a1a2e&style=element:labels.text.fill|color:0x8a8a8a&style=element:labels.text.stroke|color:0x1a1a2e&style=feature:road|element:geometry|color:0x2a2a3e&style=feature:water|element:geometry|color:0x0e1116';
  
  const styleParam = options?.style === 'light' ? '' : darkStyle;

  return `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=${zoom}&size=${width}x${height}&maptype=roadmap${styleParam}&markers=color:0x5B6CFF|${lat},${lng}&key=${apiKey}`;
}

// Geocode an address to get coordinates
export async function geocodeAddress(address: string): Promise<GooglePlaceResult | null> {
  if (!isGoogleMapsAvailable()) {
    console.warn('Google Maps not available for geocoding');
    return null;
  }

  return new Promise((resolve) => {
    const geocoder = new google.maps.Geocoder();
    
    geocoder.geocode({ address }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        const result = results[0];
        resolve({
          placeId: result.place_id || '',
          name: address,
          formattedAddress: result.formatted_address || address,
          lat: result.geometry.location.lat(),
          lng: result.geometry.location.lng(),
          types: result.types,
        });
      } else {
        resolve(null);
      }
    });
  });
}






