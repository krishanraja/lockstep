// Supabase Edge Function: Stripe Webhook Handler
// Handles payment and subscription events from Stripe

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.10.0?target=deno';

// Tier feature configurations
const TIER_FEATURES = {
  pro: {
    guests: 75,
    nudges: 20,
    ai_summaries: true,
    whatsapp: true,
  },
  wedding: {
    guests: 150,
    nudges: -1, // unlimited
    ai_summaries: true,
    whatsapp: true,
    export: true,
    priority_ai: true,
  },
  business: {
    guests: 200,
    nudges: -1, // unlimited
    ai_summaries: true,
    whatsapp: true,
    export: true,
    analytics: true,
    team_access: true,
  },
  annual_pro: {
    guests: 75,
    nudges: 20,
    ai_summaries: true,
    whatsapp: true,
    unlimited_events: true,
  },
};

serve(async (req: Request) => {
  // Stripe sends POST requests
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

    if (!stripeSecretKey) {
      console.error('STRIPE_SECRET_KEY not configured');
      return new Response('Server configuration error', { status: 500 });
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });

    // Get the raw body for signature verification
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    let event: Stripe.Event;

    // Verify webhook signature if secret is configured
    if (webhookSecret && signature) {
      try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      } catch (err) {
        console.error('Webhook signature verification failed:', err);
        return new Response('Invalid signature', { status: 400 });
      }
    } else {
      // For development without signature verification
      event = JSON.parse(body);
      console.warn('Webhook signature not verified - development mode');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Processing Stripe event:', event.type);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const metadata = session.metadata || {};
        const userId = metadata.supabase_user_id;
        const tier = metadata.tier as keyof typeof TIER_FEATURES;
        const eventId = metadata.event_id;
        const purchaseId = metadata.purchase_id;
        const addons = metadata.addons ? JSON.parse(metadata.addons) : [];

        if (!userId || !tier) {
          console.error('Missing metadata in checkout session');
          break;
        }

        if (session.mode === 'payment') {
          // One-time event purchase
          if (purchaseId) {
            // Update purchase record
            const { error: updateError } = await supabase
              .from('event_purchases')
              .update({
                status: 'completed',
                stripe_payment_intent_id: session.payment_intent as string,
                purchased_at: new Date().toISOString(),
              })
              .eq('id', purchaseId);

            if (updateError) {
              console.error('Error updating purchase:', updateError);
            }
          }

          console.log(`Event purchase completed: ${eventId}, tier: ${tier}`);
        } else if (session.mode === 'subscription') {
          // Subscription purchase
          const { error: subError } = await supabase
            .from('subscriptions')
            .upsert({
              user_id: userId,
              stripe_customer_id: session.customer as string,
              stripe_subscription_id: session.subscription as string,
              tier: 'annual_pro',
              plan: 'annual',
              status: 'active',
              features: TIER_FEATURES.annual_pro,
              current_period_end: new Date(
                Date.now() + 365 * 24 * 60 * 60 * 1000
              ).toISOString(),
            });

          if (subError) {
            console.error('Error updating subscription:', subError);
          }

          console.log(`Subscription activated for user: ${userId}`);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Find user by customer ID
        const { data: sub } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (sub) {
          const { error: updateError } = await supabase
            .from('subscriptions')
            .update({
              status: subscription.status === 'active' ? 'active' : 'inactive',
              current_period_end: new Date(
                subscription.current_period_end * 1000
              ).toISOString(),
            })
            .eq('stripe_customer_id', customerId);

          if (updateError) {
            console.error('Error updating subscription status:', updateError);
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Downgrade to free tier
        const { error: downgradeError } = await supabase
          .from('subscriptions')
          .update({
            tier: 'free',
            plan: 'free',
            status: 'cancelled',
            stripe_subscription_id: null,
          })
          .eq('stripe_customer_id', customerId);

        if (downgradeError) {
          console.error('Error downgrading subscription:', downgradeError);
        }

        console.log(`Subscription cancelled for customer: ${customerId}`);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        // Mark subscription as past_due
        const { error: updateError } = await supabase
          .from('subscriptions')
          .update({
            status: 'past_due',
          })
          .eq('stripe_customer_id', customerId);

        if (updateError) {
          console.error('Error updating subscription to past_due:', updateError);
        }

        // TODO: Send email notification to user about payment failure

        console.log(`Payment failed for customer: ${customerId}`);
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        const paymentIntent = charge.payment_intent as string;

        // Mark purchase as refunded
        const { error: refundError } = await supabase
          .from('event_purchases')
          .update({
            status: 'refunded',
          })
          .eq('stripe_payment_intent_id', paymentIntent);

        if (refundError) {
          console.error('Error marking purchase as refunded:', refundError);
        }

        console.log(`Charge refunded: ${paymentIntent}`);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(
      JSON.stringify({ received: true }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: 'Webhook handler failed' }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
});

