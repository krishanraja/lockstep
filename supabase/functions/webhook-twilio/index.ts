import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

function twiml(message: string): Response {
  const xml = `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${message}</Message></Response>`;
  return new Response(xml, {
    headers: { 'Content-Type': 'text/xml' },
  });
}

function emptyTwiml(): Response {
  return new Response(
    '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
    { headers: { 'Content-Type': 'text/xml' } },
  );
}

serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const formData = await req.text();
    const params = new URLSearchParams(formData);

    const from = params.get('From') || '';
    const body = (params.get('Body') || '').trim();
    const messageSid = params.get('MessageSid') || '';
    const messageStatus = params.get('MessageStatus') || '';

    // --- Status callback (delivery receipt) ---
    if (messageStatus && messageSid) {
      const updateData: Record<string, string> = { status: messageStatus };
      if (messageStatus === 'delivered') {
        updateData.delivered_at = new Date().toISOString();
      }

      await supabase
        .from('nudges')
        .update(updateData)
        .eq('external_id', messageSid);

      console.log(`[webhook-twilio] Status update: ${messageSid} -> ${messageStatus}`);
      return emptyTwiml();
    }

    // --- Inbound message ---
    if (!body || !from) {
      return emptyTwiml();
    }

    // Normalize phone (strip whatsapp: prefix)
    const normalizedPhone = from.replace(/^whatsapp:/, '');

    // Look up guest by phone
    const { data: guest } = await supabase
      .from('guests')
      .select('id, event_id, name')
      .eq('phone', normalizedPhone)
      .limit(1)
      .single();

    const command = body.toUpperCase();

    if (command === 'STOP' || command === 'UNSUBSCRIBE') {
      if (guest) {
        await supabase
          .from('guests')
          .update({
            status: 'opted_out',
            opted_out_at: new Date().toISOString(),
          })
          .eq('id', guest.id);

        console.log(`[webhook-twilio] Guest ${guest.id} opted out`);
      }

      return twiml(
        "You've been unsubscribed from Lockstep reminders. Reply START to re-subscribe.",
      );
    }

    if (command === 'START' || command === 'SUBSCRIBE') {
      if (guest) {
        await supabase
          .from('guests')
          .update({
            status: 'pending',
            opted_out_at: null,
          })
          .eq('id', guest.id);

        console.log(`[webhook-twilio] Guest ${guest.id} re-subscribed`);
      }

      return twiml(
        "You've been re-subscribed to Lockstep reminders.",
      );
    }

    if (command === 'HELP' || command === 'INFO') {
      return twiml(
        'Lockstep event reminders. Reply STOP to unsubscribe, START to re-subscribe.',
      );
    }

    // Unrecognized message
    console.log(`[webhook-twilio] Unrecognized message from ${normalizedPhone}: ${body}`);
    return emptyTwiml();
  } catch (error) {
    console.error('[webhook-twilio] Error:', error);
    return emptyTwiml();
  }
});
