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

    // Build the prompt
    const prompt = `Generate a brief, confident event description for:
- Event type: ${eventType}
- Host: ${hostName}
- Location: ${location}
- Dates: ${dateRange || 'TBD'}

Requirements:
- One short paragraph only (2-3 sentences max)
- Mature, exciting but not cheesy
- No emojis
- Professional yet warm tone
- Focus on the experience, not logistics

Just output the description text, nothing else.`;

    // Call LLM
    const response = await callLLM({
      prompt,
      maxTokens: 150,
      temperature: 0.8,
    });

    if (response.error) {
      // Return a fallback description
      const fallback = `An unforgettable ${eventType.toLowerCase()} in ${location.split(',')[0]}. Join us for an experience you won't want to miss.`;
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
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate description',
        description: 'A gathering you won\'t want to miss.',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

