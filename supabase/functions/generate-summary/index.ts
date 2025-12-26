// Supabase Edge Function: Generate Event Summary for Dashboard
// Provides AI-powered status summaries and next action suggestions

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { callLLM } from '../_shared/llm-router.ts';

interface BlockSummary {
  name: string;
  inCount: number;
  maybeCount: number;
  outCount: number;
}

interface RequestBody {
  eventTitle: string;
  totalGuests: number;
  respondedCount: number;
  pendingCount: number;
  daysUntilEvent: number;
  blockSummaries: BlockSummary[];
  summaryType: 'status' | 'blockers' | 'suggestions';
}

serve(async (req: Request) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const body: RequestBody = await req.json();
    const { 
      eventTitle, 
      totalGuests, 
      respondedCount, 
      pendingCount,
      daysUntilEvent,
      blockSummaries,
      summaryType = 'status'
    } = body;

    let prompt = '';

    if (summaryType === 'status') {
      prompt = `You are an event planning assistant. Provide a brief status summary.

Event: ${eventTitle}
Total guests: ${totalGuests}
Responded: ${respondedCount}
Pending: ${pendingCount}
Days until event: ${daysUntilEvent}

Block attendance:
${blockSummaries.map(b => `- ${b.name}: ${b.inCount} in, ${b.maybeCount} maybe, ${b.outCount} out`).join('\n')}

Provide a calm, factual one-sentence summary of the current status. No emojis. Be direct.`;
    } else if (summaryType === 'blockers') {
      prompt = `You are an event planning assistant. Identify blockers.

Event: ${eventTitle}
Pending responses: ${pendingCount} of ${totalGuests}
Days until event: ${daysUntilEvent}

What is blocking this plan from being finalized? One sentence, be specific.`;
    } else {
      prompt = `You are an event planning assistant. Suggest the next action.

Event: ${eventTitle}
Pending: ${pendingCount} responses
Days until event: ${daysUntilEvent}

What should the organizer do next? One specific, actionable sentence.`;
    }

    const response = await callLLM({
      prompt,
      maxTokens: 100,
      temperature: 0.5,
    });

    if (response.error) {
      // Fallback summaries
      const fallbacks = {
        status: `${respondedCount} of ${totalGuests} have responded.`,
        blockers: pendingCount > 0 ? `${pendingCount} people haven't responded yet.` : 'No blockers.',
        suggestions: pendingCount > 0 ? 'Send a reminder to pending guests.' : 'All responses received!',
      };

      return new Response(
        JSON.stringify({ 
          summary: fallbacks[summaryType],
          model: 'fallback',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        summary: response.text.trim(),
        model: response.model,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error generating summary:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate summary',
        summary: 'Unable to generate summary at this time.',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});






