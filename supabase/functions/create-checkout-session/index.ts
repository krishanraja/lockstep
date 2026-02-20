import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, handleCors } from '../_shared/cors.ts';

interface RequestBody {
  tier: string;
  eventId?: string;
  successUrl: string;
  cancelUrl: string;
}

serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');
    if (!STRIPE_SECRET_KEY) {
      console.error('[create-checkout-session] STRIPE_SECRET_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Payment system not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Authenticate the caller
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', ''),
    );
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body: RequestBody = await req.json();
    const { tier, eventId, successUrl, cancelUrl } = body;

    if (!tier || !successUrl || !cancelUrl) {
      return new Response(JSON.stringify({ error: 'tier, successUrl, and cancelUrl are required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Look up the Stripe Price ID from the database
    const { data: product, error: productError } = await supabase
      .from('stripe_products')
      .select('stripe_price_id, is_subscription')
      .eq('tier', tier)
      .single();

    if (productError || !product?.stripe_price_id) {
      console.error('[create-checkout-session] Price not found for tier:', tier, productError);
      return new Response(JSON.stringify({ error: 'Invalid pricing tier' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const mode = product.is_subscription ? 'subscription' : 'payment';

    const params: Record<string, string> = {
      mode,
      'customer_email': user.email || '',
      'client_reference_id': user.id,
      'success_url': successUrl,
      'cancel_url': cancelUrl,
      'line_items[0][price]': product.stripe_price_id,
      'line_items[0][quantity]': '1',
      'metadata[user_id]': user.id,
      'metadata[tier]': tier,
    };

    if (eventId) {
      params['metadata[event_id]'] = eventId;
    }

    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(params),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[create-checkout-session] Stripe error:', response.status, errorText);
      throw new Error('Failed to create checkout session');
    }

    const session = await response.json();
    console.log(`[create-checkout-session] Created session for user ${user.id}, tier ${tier}`);

    return new Response(
      JSON.stringify({ url: session.url, sessionId: session.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('[create-checkout-session] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to create checkout session' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
