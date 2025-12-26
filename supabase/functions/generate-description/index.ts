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
}

// Fallback description templates for variety when LLM is unavailable
const fallbackTemplates = [
  (eventType: string, location: string, hostName: string) =>
    `${hostName}'s ${eventType.toLowerCase()} in ${location.split(',')[0]} promises to be one for the books. Clear your calendar and get ready.`,
  (eventType: string, location: string, hostName: string) =>
    `An unforgettable ${eventType.toLowerCase()} awaits in ${location.split(',')[0]}. This is the kind of experience that becomes a story you tell for years.`,
  (eventType: string, location: string, hostName: string) =>
    `${location.split(',')[0]} is the backdrop for ${hostName}'s ${eventType.toLowerCase()}. Pack your bags, bring your energy, and expect the unexpected.`,
  (eventType: string, location: string, hostName: string) =>
    `When ${hostName} said "${location.split(',')[0]}" for the ${eventType.toLowerCase()}, we knew this was going to be special. You're not going to want to miss this.`,
  (eventType: string, location: string, hostName: string) =>
    `The destination is ${location.split(',')[0]}. The occasion is ${hostName}'s ${eventType.toLowerCase()}. The vibe? Absolutely unforgettable.`,
];

function getRandomFallback(eventType: string, location: string, hostName: string): string {
  const randomIndex = Math.floor(Math.random() * fallbackTemplates.length);
  return fallbackTemplates[randomIndex](eventType, location, hostName);
}

serve(async (req: Request) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const body: RequestBody = await req.json();
    const { eventType, hostName, location, dateRange } = body;

    // Validate required fields
    if (!eventType || !hostName || !location) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate a creativity seed for variety on regeneration
    const creativitySeed = Math.random().toString(36).substring(2, 8);
    const toneOptions = ['confident and exciting', 'warm and inviting', 'bold and adventurous', 'sophisticated yet fun'];
    const randomTone = toneOptions[Math.floor(Math.random() * toneOptions.length)];

    // Build the prompt with variety built in
    const prompt = `Generate a brief, ${randomTone} event description for:
- Event type: ${eventType}
- Host: ${hostName}
- Location: ${location}
- Dates: ${dateRange || 'TBD'}

Requirements:
- One short paragraph only (2-3 sentences max)
- Mature, exciting but not cheesy
- No emojis
- Be creative and unique (seed: ${creativitySeed})
- Focus on the experience and anticipation

Just output the description text, nothing else.`;

    // Call LLM with higher temperature for more creativity
    const response = await callLLM({
      prompt,
      maxTokens: 150,
      temperature: 0.9,
    });

    if (response.error) {
      // Return a varied fallback description
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
    
    // Return a generic but varied fallback
    const genericFallbacks = [
      'A gathering you won\'t want to miss.',
      'Clear your schedule. This one\'s going to be special.',
      'Some moments are worth making time for. This is one of them.',
      'Get ready for an experience that\'ll have everyone talking.',
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
