// Supabase Edge Function: Generate Event Description
// Uses Google AI (primary) with OpenAI fallback

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { callLLM } from '../_shared/llm-router.ts';

interface RequestBody {
  eventType: string;
  hostName: string;
  location: string;
  dateRange: string;
  tone?: string;
}

// Helper for possessive names
function makePossessive(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return '';
  if (trimmed.toLowerCase().endsWith('s')) {
    return `${trimmed}'`;
  }
  return `${trimmed}'s`;
}

// Venue types that should use "at" instead of "in"
const venueTypes = [
  'house party', 'home', 'backyard', 'rooftop', 'restaurant', 'bar', 
  'club', 'venue', 'hotel', 'beach', 'park', 'local restaurant'
];

// Check if location is a venue type (use "at") vs a city/region (use "in")
function isVenueType(location: string): boolean {
  const locationLower = location.toLowerCase().trim();
  return venueTypes.some(venue => locationLower.includes(venue));
}

// Format location with correct preposition
function formatLocationPhrase(location: string): string {
  const loc = location.split(',')[0].trim();
  if (isVenueType(loc)) {
    // Add article for venue types: "at a house party", "at the restaurant"
    const needsArticle = loc.toLowerCase().match(/^(house party|local restaurant|rooftop|backyard|beach|park)$/i);
    if (needsArticle) {
      return `at a ${loc.toLowerCase()}`;
    }
    return `at ${loc}`;
  }
  return `in ${loc}`;
}

// Tone-aware fallback descriptions by event type
// Uses formatLocationPhrase for correct preposition handling
const fallbacksByEventType: Record<string, (location: string, hostName: string) => string[]> = {
  'bucks party': (location, hostName) => {
    const locPhrase = formatLocationPhrase(location);
    return [
      `${makePossessive(hostName)} bucks party ${locPhrase} is going to be legendary. Clear the schedule and get ready for a proper send-off.`,
      `The crew is heading ${locPhrase} for ${makePossessive(hostName)} bucks. This is the kind of weekend you'll be talking about for years.`,
    ];
  },
  'hens party': (location, hostName) => {
    const locPhrase = formatLocationPhrase(location);
    return [
      `${makePossessive(hostName)} hens party ${locPhrase} is set to be unforgettable. Get ready for a weekend of celebrations.`,
      `Get ready for ${makePossessive(hostName)} hens ${locPhrase}. A perfect escape with the best company.`,
    ];
  },
  'wedding': (location, hostName) => {
    const locPhrase = formatLocationPhrase(location);
    return [
      `Join us ${locPhrase} for ${makePossessive(hostName)} wedding celebration. A heartfelt gathering of loved ones.`,
      `${makePossessive(hostName)} wedding ${locPhrase} promises to be a beautiful celebration of love and togetherness.`,
    ];
  },
  'birthday': (location, hostName) => {
    const locPhrase = formatLocationPhrase(location);
    return [
      `${makePossessive(hostName)} birthday celebration ${locPhrase}. Good friends, good times, and a night to remember.`,
      `Come celebrate ${makePossessive(hostName)} birthday ${locPhrase}. An evening with the people who matter most.`,
    ];
  },
  'reunion': (location, hostName) => {
    const locPhrase = formatLocationPhrase(location);
    return [
      `The ${hostName} family is coming together ${locPhrase}. A chance to reconnect, reminisce, and make new memories.`,
      `${makePossessive(hostName)} family will gather ${locPhrase} for a meaningful reunion.`,
    ];
  },
  'trip': (location, hostName) => {
    const loc = location.split(',')[0].trim();
    return [
      `${makePossessive(hostName)} group trip to ${loc} is coming together. Adventure and unforgettable experiences await.`,
      `The destination is ${loc}. ${makePossessive(hostName)} trip is shaping up to be an incredible journey.`,
    ];
  },
  'team offsite': (location, hostName) => {
    const locPhrase = formatLocationPhrase(location);
    return [
      `${makePossessive(hostName)} team offsite ${locPhrase}. A focused retreat to connect, collaborate, and move forward together.`,
      `The team is gathering ${locPhrase} for a productive offsite. Strategy, team building, and meaningful conversations ahead.`,
    ];
  },
};

function getRandomFallback(eventType: string, location: string, hostName: string): string {
  const eventTypeLower = eventType.toLowerCase();
  const fallbacks = fallbacksByEventType[eventTypeLower];
  
  if (fallbacks) {
    const options = fallbacks(location, hostName);
    return options[Math.floor(Math.random() * options.length)];
  }
  
  // Generic fallback with correct preposition
  const locPhrase = formatLocationPhrase(location);
  return `${makePossessive(hostName)} ${eventTypeLower} ${locPhrase} is coming together. Mark your calendar for a gathering worth attending.`;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const body: RequestBody = await req.json();
    const { eventType, hostName, location, dateRange, tone } = body;

    // Validate required fields
    if (!eventType || !hostName || !location) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate a creativity seed for variety on regeneration
    const creativitySeed = Math.random().toString(36).substring(2, 8);
    
    // Use provided tone or pick a default based on event type
    const descriptionTone = tone || 'confident and engaging';

    // Determine if this is a venue type or geographic location
    const locationIsVenue = isVenueType(location);
    const locationGuidance = locationIsVenue 
      ? `Note: "${location}" is a venue type, not a city. Use "at a ${location.toLowerCase()}" or similar phrasing, NOT "in ${location}".`
      : `Note: "${location}" is a geographic location. Use "in ${location}" naturally.`;

    // Build the prompt with tone awareness
    const prompt = `Generate a brief event description for:
- Event type: ${eventType}
- Host: ${hostName}
- Location: ${location}
- Dates: ${dateRange || 'TBD'}

Tone: ${descriptionTone}

${locationGuidance}

Requirements:
- One short paragraph only (2-3 sentences max)
- Match the tone exactly - ${eventType === 'Team Offsite' ? 'keep it professional, no party language' : 'be engaging but appropriate'}
- No emojis
- Be creative and unique (seed: ${creativitySeed})
- Focus on the experience and anticipation
- Use grammatically correct prepositions for the location

Just output the description text, nothing else.`;

    // Call LLM with higher temperature for more creativity
    const response = await callLLM({
      prompt,
      maxTokens: 150,
      temperature: 0.85,
    });

    if (response.error) {
      // Return a tone-appropriate fallback description
      const fallback = getRandomFallback(eventType, location, hostName);
      return new Response(
        JSON.stringify({ 
          description: fallback,
          model: 'fallback',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Clean up the response
    let description = response.text.trim();
    // Remove quotes if the LLM wrapped it in quotes
    if (description.startsWith('"') && description.endsWith('"')) {
      description = description.slice(1, -1);
    }

    return new Response(
      JSON.stringify({ 
        description,
        model: response.model,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error generating description:', error);
    
    // Return a generic but professional fallback
    const genericFallbacks = [
      'A gathering you won\'t want to miss.',
      'Clear your schedule. This one\'s going to be special.',
      'Some moments are worth making time for. This is one of them.',
    ];
    const randomFallback = genericFallbacks[Math.floor(Math.random() * genericFallbacks.length)];
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate description',
        description: randomFallback,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
