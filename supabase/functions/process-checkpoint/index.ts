import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, handleCors } from '../_shared/cors.ts';

interface RequestBody {
  checkpointId?: string;
}

serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body: RequestBody = await req.json().catch(() => ({}));

    let checkpointIds: string[] = [];

    if (body.checkpointId) {
      checkpointIds = [body.checkpointId];
    } else {
      // Scan mode: find all due, unexecuted checkpoints
      const { data: dueCheckpoints } = await supabase
        .from('checkpoints')
        .select('id')
        .eq('executed', false)
        .lte('trigger_at', new Date().toISOString());

      checkpointIds = (dueCheckpoints || []).map(c => c.id);
    }

    if (checkpointIds.length === 0) {
      return new Response(
        JSON.stringify({ processed: 0, nudgesSent: 0, message: 'No due checkpoints' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    let totalProcessed = 0;
    let totalNudges = 0;

    for (const cpId of checkpointIds) {
      const { data: checkpoint, error: cpError } = await supabase
        .from('checkpoints')
        .select('*')
        .eq('id', cpId)
        .single();

      if (cpError || !checkpoint) {
        console.error(`[process-checkpoint] Checkpoint ${cpId} not found`);
        continue;
      }

      if (checkpoint.executed) continue;

      const eventId = checkpoint.event_id;

      // Load event
      const { data: event } = await supabase
        .from('events')
        .select('title')
        .eq('id', eventId)
        .single();

      if (!event) continue;

      // Load all guests (excluding opted-out)
      const { data: guests } = await supabase
        .from('guests')
        .select('id, name, phone, status')
        .eq('event_id', eventId)
        .neq('status', 'opted_out');

      const eligibleGuests = (guests || []).filter(g => g.phone);

      // Determine which guests are missing required answers
      const requiredQuestionIds: string[] = checkpoint.required_question_ids || [];
      const guestsToNudge: typeof eligibleGuests = [];

      if (requiredQuestionIds.length > 0) {
        for (const guest of eligibleGuests) {
          const { data: answers } = await supabase
            .from('answers')
            .select('question_id')
            .eq('guest_id', guest.id)
            .in('question_id', requiredQuestionIds);

          const answeredIds = new Set((answers || []).map(a => a.question_id));
          const hasMissing = requiredQuestionIds.some(qId => !answeredIds.has(qId));
          if (hasMissing) {
            guestsToNudge.push(guest);
          }
        }
      } else {
        // No specific questions — nudge guests who haven't responded to any block
        const blockIds: string[] = checkpoint.applicable_block_ids || [];

        for (const guest of eligibleGuests) {
          if (blockIds.length > 0) {
            const { data: rsvps } = await supabase
              .from('rsvps')
              .select('block_id')
              .eq('guest_id', guest.id)
              .in('block_id', blockIds);

            const respondedBlocks = new Set((rsvps || []).map(r => r.block_id));
            if (blockIds.some(bId => !respondedBlocks.has(bId))) {
              guestsToNudge.push(guest);
            }
          } else if (guest.status === 'pending') {
            guestsToNudge.push(guest);
          }
        }
      }

      // Send nudges
      const nudgeMessage = checkpoint.message
        || `Reminder: We need your response for ${event.title}. Please check your RSVP link.`;

      for (const guest of guestsToNudge) {
        try {
          await supabase.functions.invoke('send-nudge', {
            body: {
              guestId: guest.id,
              checkpointId: cpId,
              channel: 'sms',
              message: `Hey ${guest.name}! ${nudgeMessage}`,
              eventId,
            },
          });
          totalNudges++;
        } catch (err) {
          console.error(`[process-checkpoint] Nudge failed for guest ${guest.id}:`, err);
        }
      }

      // Auto-resolve: if configured, mark non-responders with the default response
      if (checkpoint.auto_resolve_to) {
        const blockIds: string[] = checkpoint.applicable_block_ids || [];
        for (const guest of guestsToNudge) {
          for (const blockId of blockIds) {
            const { data: existing } = await supabase
              .from('rsvps')
              .select('id')
              .eq('guest_id', guest.id)
              .eq('block_id', blockId)
              .single();

            if (!existing) {
              await supabase.from('rsvps').insert({
                guest_id: guest.id,
                block_id: blockId,
                response: checkpoint.auto_resolve_to,
              });
            }
          }

          // Mark guest as responded
          await supabase
            .from('guests')
            .update({ status: 'responded' })
            .eq('id', guest.id)
            .eq('status', 'pending');
        }
      }

      // Mark checkpoint executed
      await supabase
        .from('checkpoints')
        .update({ executed: true })
        .eq('id', cpId);

      totalProcessed++;
    }

    console.log(`[process-checkpoint] Processed ${totalProcessed} checkpoints, sent ${totalNudges} nudges`);

    return new Response(
      JSON.stringify({ processed: totalProcessed, nudgesSent: totalNudges }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('[process-checkpoint] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process checkpoints' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
