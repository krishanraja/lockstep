// Supabase Edge Function: Send Nudge via SMS or WhatsApp
// Uses Twilio for message delivery

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, handleCors } from '../_shared/cors.ts';

interface RequestBody {
  guestId: string;
  checkpointId?: string;
  channel: 'sms' | 'whatsapp';
  message: string;
  eventId: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const body: RequestBody = await req.json();
    const { guestId, checkpointId, channel, message, eventId } = body;

    // Get Twilio credentials
    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const apiSecret = Deno.env.get('TWILIO_API_SECRET');
    
    if (!accountSid || !apiSecret) {
      return new Response(
        JSON.stringify({ error: 'Twilio credentials not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get guest details
    const { data: guest, error: guestError } = await supabase
      .from('guests')
      .select('*')
      .eq('id', guestId)
      .single();

    if (guestError || !guest) {
      return new Response(
        JSON.stringify({ error: 'Guest not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if guest has opted out
    if (guest.status === 'opted_out') {
      return new Response(
        JSON.stringify({ error: 'Guest has opted out of messages' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if guest has phone number
    if (!guest.phone) {
      return new Response(
        JSON.stringify({ error: 'Guest has no phone number' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate idempotency key
    const idempotencyKey = `${eventId}:${checkpointId || 'manual'}:${guestId}:${channel}`;

    // Check if nudge already sent
    const { data: existingNudge } = await supabase
      .from('nudges')
      .select('id')
      .eq('idempotency_key', idempotencyKey)
      .single();

    if (existingNudge) {
      return new Response(
        JSON.stringify({ 
          error: 'Nudge already sent',
          nudgeId: existingNudge.id,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format phone number for Twilio
    let toNumber = guest.phone.replace(/\s/g, '');
    if (channel === 'whatsapp') {
      toNumber = `whatsapp:${toNumber}`;
    }

    // Send via Twilio
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const fromNumber = channel === 'whatsapp' 
      ? `whatsapp:${Deno.env.get('TWILIO_WHATSAPP_NUMBER') || '+14155238886'}` // Twilio sandbox default
      : Deno.env.get('TWILIO_PHONE_NUMBER') || '';

    const twilioResponse = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${accountSid}:${apiSecret}`)}`,
      },
      body: new URLSearchParams({
        To: toNumber,
        From: fromNumber,
        Body: message,
      }),
    });

    const twilioData = await twilioResponse.json();

    // Log the nudge
    const { data: nudge, error: nudgeError } = await supabase
      .from('nudges')
      .insert({
        guest_id: guestId,
        checkpoint_id: checkpointId || null,
        channel,
        status: twilioResponse.ok ? 'sent' : 'failed',
        sent_at: new Date().toISOString(),
        idempotency_key: idempotencyKey,
        external_id: twilioData.sid || null,
        message,
        error_message: twilioResponse.ok ? null : twilioData.message,
      })
      .select()
      .single();

    if (nudgeError) {
      console.error('Error logging nudge:', nudgeError);
    }

    if (!twilioResponse.ok) {
      return new Response(
        JSON.stringify({ 
          error: 'Failed to send message',
          details: twilioData.message,
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        nudgeId: nudge?.id,
        messageSid: twilioData.sid,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error sending nudge:', error);
    
    return new Response(
      JSON.stringify({ error: 'Failed to send nudge' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});



