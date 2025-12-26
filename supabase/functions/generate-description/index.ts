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

// Tone-aware fallback descriptions by event type
const fallbacksByEventType: Record<string, (location: string, hostName: string) => string[]> = {
  'bucks party': (location, hostName) => [
    `${makePossessive(hostName)} bucks party in ${location} is going to be legendary. Clear the schedule and get ready for a proper send-off.`,
    `The crew is heading to ${location} for ${makePossessive(hostName)} bucks. This is the kind of weekend you'll be talking about for years.`,
  ],
  'hens party': (location, hostName) => [
    `${makePossessive(hostName)} hens party in ${location} is set to be unforgettable. Get ready for a weekend of celebrations.`,
    `${location} awaits for ${makePossessive(hostName)} hens. A perfect escape with the best company.`,
  ],
  'wedding': (location, hostName) => [
    `Join us in ${location} for ${makePossessive(hostName)} wedding celebration. A heartfelt gathering of loved ones.`,
    `${makePossessive(hostName)} wedding in ${location} promises to be a beautiful celebration of love and togetherness.`,
  ],
  'birthday': (location, hostName) => [
    `${makePossessive(hostName)} birthday celebration in ${location}. Good friends, good times, and a night to remember.`,
    `Come celebrate ${makePossessive(hostName)} birthday in ${location}. An evening with the people who matter most.`,
  ],
  'reunion': (location, hostName) => [
    `The ${hostName} family is coming together in ${location}. A chance to reconnect, reminisce, and make new memories.`,
    `${location} is where the ${hostName} family will gather for a meaningful reunion.`,
  ],
  'trip': (location, hostName) => [
    `${makePossessive(hostName)} group trip to ${location} is coming together. Adventure and unforgettable experiences await.`,
    `The destination is ${location}. ${makePossessive(hostName)} trip is shaping up to be an incredible journey.`,
  ],
  'team offsite': (location, hostName) => [
    `${makePossessive(hostName)} team offsite in ${location}. A focused retreat to connect, collaborate, and move forward together.`,
    `The team is gathering in ${location} for a productive offsite. Strategy, team building, and meaningful conversations ahead.`,
  ],
};

function getRandomFallback(eventType: string, location: string, hostName: string): string {
  const loc = location.split(',')[0];
  const eventTypeLower = eventType.toLowerCase();
  const fallbacks = fallbacksByEventType[eventTypeLower];
  
  if (fallbacks) {
    const options = fallbacks(loc, hostName);
    return options[Math.floor(Math.random() * options.length)];
  }
  
  // Generic fallback
  return `${makePossessive(hostName)} ${eventTypeLower} in ${loc} is coming together. Mark your calendar for a gathering worth attending.`;
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

    // Build the prompt with tone awareness
    const prompt = `Generate a brief event description for:
- Event type: ${eventType}
- Host: ${hostName}
- Location: ${location}
- Dates: ${dateRange || 'TBD'}

Tone: ${descriptionTone}

Requirements:
- One short paragraph only (2-3 sentences max)
- Match the tone exactly - ${eventType === 'Team Offsite' ? 'keep it professional, no party language' : 'be engaging but appropriate'}
- No emojis
- Be creative and unique (seed: ${creativitySeed})
- Focus on the experience and anticipation

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
