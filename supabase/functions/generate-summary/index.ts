import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { callLLM } from '../_shared/llm-router.ts';

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

interface BlockSummary {
  name: string;
  inCount: number;
  maybeCount: number;
  outCount: number;
}

interface RequestBody {
  eventId?: string;
  eventTitle: string;
  totalGuests: number;
  respondedCount: number;
  pendingCount: number;
  daysUntilEvent: number;
  blockSummaries: BlockSummary[];
  summaryType: 'status' | 'blockers' | 'suggestions';
  invalidate?: boolean;
}

serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const body: RequestBody = await req.json();
    const {
      eventId,
      eventTitle,
      totalGuests,
      respondedCount,
      pendingCount,
      daysUntilEvent,
      blockSummaries,
      summaryType = 'status',
      invalidate = false,
    } = body;

    let supabase: ReturnType<typeof createClient> | null = null;

    if (eventId) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      supabase = createClient(supabaseUrl, supabaseKey);

      // Check cache unless invalidation is requested
      if (!invalidate) {
        const { data: eventData } = await supabase
          .from('events')
          .select('settings')
          .eq('id', eventId)
          .single();

        const cached = (eventData?.settings as Record<string, unknown>)?.summaries as
          Record<string, { text: string; cached_at: string }> | undefined;

        if (cached?.[summaryType]) {
          const age = Date.now() - new Date(cached[summaryType].cached_at).getTime();
          if (age < CACHE_TTL_MS) {
            return new Response(
              JSON.stringify({ summary: cached[summaryType].text, model: 'cache' }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
            );
          }
        }
      }
    }

    let prompt = '';

    if (summaryType === 'status') {
      prompt = `You are an event planning assistant. Provide a brief status summary.

Event: ${eventTitle}
Total guests: ${totalGuests}
Responded: ${respondedCount}
Pending: ${pendingCount}
Days until event: ${daysUntilEvent}

Block attendance:
${(blockSummaries || []).map(b => `- ${b.name}: ${b.inCount} in, ${b.maybeCount} maybe, ${b.outCount} out`).join('\n')}

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

    const response = await callLLM({ prompt, maxTokens: 100, temperature: 0.5 });

    const summaryText = response.error
      ? ({
          status: `${respondedCount} of ${totalGuests} have responded.`,
          blockers: pendingCount > 0 ? `${pendingCount} people haven't responded yet.` : 'No blockers.',
          suggestions: pendingCount > 0 ? 'Send a reminder to pending guests.' : 'All responses received!',
        })[summaryType]
      : response.text.trim();

    const model = response.error ? 'fallback' : response.model;

    // Write to cache
    if (eventId && supabase) {
      try {
        const { data: current } = await supabase
          .from('events')
          .select('settings')
          .eq('id', eventId)
          .single();

        const existingSettings = (current?.settings as Record<string, unknown>) || {};
        const existingSummaries = (existingSettings.summaries as Record<string, unknown>) || {};

        await supabase
          .from('events')
          .update({
            settings: {
              ...existingSettings,
              summaries: {
                ...existingSummaries,
                [summaryType]: { text: summaryText, cached_at: new Date().toISOString() },
              },
            },
          })
          .eq('id', eventId);
      } catch (cacheErr) {
        console.error('[generate-summary] Cache write error:', cacheErr);
      }
    }

    return new Response(
      JSON.stringify({ summary: summaryText, model }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('Error generating summary:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate summary', summary: 'Unable to generate summary at this time.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
