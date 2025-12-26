// Supabase Edge Function: Create Stripe Checkout Session
// Handles both one-time event purchases and annual subscriptions

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import Stripe from 'https://esm.sh/stripe@14.10.0?target=deno';

interface RequestBody {
  tier: 'pro' | 'wedding' | 'business' | 'annual_pro';
  eventId?: string; // Required for one-time purchases
  addons?: string[]; // ['whatsapp', 'branding', 'export']
  successUrl: string;
  cancelUrl: string;
}

// Tier configurations with pricing
const TIER_CONFIG = {
  pro: {
    name: 'Pro Event',
    price: 2900, // $29
    description: 'Up to 75 guests, 20 nudges, AI summaries, WhatsApp messaging',
    mode: 'payment' as const,
  },
  wedding: {
    name: 'Wedding Event',
    price: 4900, // $49
    description: 'Up to 150 guests, unlimited nudges, priority AI, CSV export',
    mode: 'payment' as const,
  },
  business: {
    name: 'Business Event',
    price: 9900, // $99
    description: 'Up to 200 guests, unlimited features, team access, analytics',
    mode: 'payment' as const,
  },
  annual_pro: {
    name: 'Annual Pro',
    price: 14900, // $149/year
    description: 'Unlimited events, Pro features on all events',
    mode: 'subscription' as const,
  },
};

const ADDON_PRICES = {
  whatsapp: { name: 'WhatsApp Messaging', price: 1000 }, // $10
  branding: { name: 'Custom Branding', price: 1500 }, // $15
  export: { name: 'CSV Export', price: 500 }, // $5
};

serve(async (req: Request) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const body: RequestBody = await req.json();
    const { tier, eventId, addons = [], successUrl, cancelUrl } = body;

    // Validate tier
    if (!TIER_CONFIG[tier]) {
      return new Response(
        JSON.stringify({ error: 'Invalid tier' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // One-time purchases require eventId
    if (tier !== 'annual_pro' && !eventId) {
      return new Response(
        JSON.stringify({ error: 'Event ID required for one-time purchases' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get Stripe key
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      return new Response(
        JSON.stringify({ error: 'Stripe not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Stripe
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader);
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get or create Stripe customer
    let stripeCustomerId: string;

    // Check if user already has a subscription with customer ID
    const { data: existingSub } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    if (existingSub?.stripe_customer_id) {
      stripeCustomerId = existingSub.stripe_customer_id;
    } else {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
        },
      });
      stripeCustomerId = customer.id;

      // Store customer ID in subscription record
      await supabase
        .from('subscriptions')
        .upsert({
          user_id: user.id,
          stripe_customer_id: stripeCustomerId,
          tier: 'free',
          plan: 'free',
          status: 'active',
        });
    }

    // If eventId provided, verify user owns the event
    if (eventId) {
      const { data: event, error: eventError } = await supabase
        .from('events')
        .select('id, title, organiser_id')
        .eq('id', eventId)
        .single();

      if (eventError || !event || event.organiser_id !== user.id) {
        return new Response(
          JSON.stringify({ error: 'Event not found or access denied' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Build line items
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
    const tierConfig = TIER_CONFIG[tier];

    // Main tier item
    lineItems.push({
      price_data: {
        currency: 'usd',
        product_data: {
          name: tierConfig.name,
          description: tierConfig.description,
        },
        unit_amount: tierConfig.price,
        ...(tier === 'annual_pro' && {
          recurring: {
            interval: 'year',
          },
        }),
      },
      quantity: 1,
    });

    // Add addons (only for one-time purchases)
    if (tier !== 'annual_pro') {
      for (const addonId of addons) {
        const addon = ADDON_PRICES[addonId as keyof typeof ADDON_PRICES];
        if (addon) {
          lineItems.push({
            price_data: {
              currency: 'usd',
              product_data: {
                name: addon.name,
              },
              unit_amount: addon.price,
            },
            quantity: 1,
          });
        }
      }
    }

    // Create pending purchase record for one-time purchases
    let purchaseId: string | null = null;
    if (tier !== 'annual_pro' && eventId) {
      const totalAmount = tierConfig.price + addons.reduce((sum, addonId) => {
        const addon = ADDON_PRICES[addonId as keyof typeof ADDON_PRICES];
        return sum + (addon?.price || 0);
      }, 0);

      const { data: purchase, error: purchaseError } = await supabase
        .from('event_purchases')
        .insert({
          event_id: eventId,
          user_id: user.id,
          tier,
          amount_paid: totalAmount,
          addons,
          status: 'pending',
        })
        .select()
        .single();

      if (purchaseError) {
        console.error('Error creating purchase record:', purchaseError);
      } else {
        purchaseId = purchase.id;
      }
    }

    // Create Checkout Session
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: tierConfig.mode,
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      metadata: {
        supabase_user_id: user.id,
        tier,
        event_id: eventId || '',
        purchase_id: purchaseId || '',
        addons: JSON.stringify(addons),
      },
    };

    const session = await stripe.checkout.sessions.create(sessionParams);

    // Update purchase with session ID
    if (purchaseId) {
      await supabase
        .from('event_purchases')
        .update({ stripe_checkout_session_id: session.id })
        .eq('id', purchaseId);
    }

    return new Response(
      JSON.stringify({
        sessionId: session.id,
        url: session.url,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error creating checkout session:', error);

    return new Response(
      JSON.stringify({ error: 'Failed to create checkout session' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

