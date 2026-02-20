// Supabase Edge Function: Create Stripe Checkout Session
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders, handleCors } from '../_shared/cors.ts';

interface RequestBody {
  userId: string;
  email: string;
  tier: 'pro';
}

serve(async (req: Request) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');
    
    if (!STRIPE_SECRET_KEY) {
      console.error('[create-checkout-session] CRITICAL: STRIPE_SECRET_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Payment system not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: RequestBody = await req.json();
    const { userId, email, tier } = body;

    if (!userId || !email) {
      return new Response(
        JSON.stringify({ error: 'User ID and email are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Stripe checkout session
    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'mode': 'subscription',
        'customer_email': email,
        'client_reference_id': userId,
        'success_url': `${req.headers.get('origin') || 'https://inlockstep.ai'}/profile?upgrade=success`,
        'cancel_url': `${req.headers.get('origin') || 'https://inlockstep.ai'}/profile?upgrade=cancelled`,
        'line_items[0][price]': 'price_1ProLiveFromStripeKey', // Replace with actual Stripe Price ID
        'line_items[0][quantity]': '1',
        'metadata[user_id]': userId,
        'metadata[tier]': tier,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[create-checkout-session] Stripe error:', response.status, errorText);
      throw new Error('Failed to create checkout session');
    }

    const session = await response.json();
    
    console.log(`[create-checkout-session] Created session for user ${userId}`);

    return new Response(
      JSON.stringify({ 
        url: session.url,
        sessionId: session.id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[create-checkout-session] Error:', error);
    
    return new Response(
      JSON.stringify({ error: 'Failed to create checkout session' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
