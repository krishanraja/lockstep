// Supabase Edge Function: Stripe Webhook Handler
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req: Request) => {
  try {
    const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');
    const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET) {
      console.error('[stripe-webhook] Missing Stripe credentials');
      return new Response('Webhook configuration error', { status: 500 });
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error('[stripe-webhook] Missing Supabase credentials');
      return new Response('Database configuration error', { status: 500 });
    }

    // Verify webhook signature
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      return new Response('No signature', { status: 400 });
    }

    const body = await req.text();
    
    // In production, verify the webhook signature here using stripe-signature header
    // For now, we'll parse the event directly
    const event = JSON.parse(body);

    console.log(`[stripe-webhook] Received event: ${event.type}`);

    // Initialize Supabase admin client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata?.user_id || session.client_reference_id;
        const tier = session.metadata?.tier || 'pro';

        if (!userId) {
          console.error('[stripe-webhook] No user ID in session metadata');
          break;
        }

        console.log(`[stripe-webhook] Checkout completed for user ${userId}`);

        // Update or insert subscription
        const { error: upsertError } = await supabase
          .from('subscriptions')
          .upsert({
            user_id: userId,
            tier: tier,
            stripe_customer_id: session.customer,
            stripe_subscription_id: session.subscription,
            status: 'active',
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id',
          });

        if (upsertError) {
          console.error('[stripe-webhook] Error upserting subscription:', upsertError);
        } else {
          console.log(`[stripe-webhook] Subscription activated for user ${userId}`);
        }
        break;
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const customerId = subscription.customer;

        // Find user by stripe customer ID
        const { data: existingSub } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (!existingSub) {
          console.error('[stripe-webhook] No subscription found for customer:', customerId);
          break;
        }

        const newStatus = event.type === 'customer.subscription.deleted' 
          ? 'cancelled' 
          : subscription.status;

        const { error: updateError } = await supabase
          .from('subscriptions')
          .update({
            status: newStatus,
            tier: newStatus === 'active' ? 'pro' : 'free',
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', existingSub.user_id);

        if (updateError) {
          console.error('[stripe-webhook] Error updating subscription:', updateError);
        } else {
          console.log(`[stripe-webhook] Subscription ${newStatus} for user ${existingSub.user_id}`);
        }
        break;
      }

      default:
        console.log(`[stripe-webhook] Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[stripe-webhook] Error:', error);
    return new Response('Webhook error', { status: 500 });
  }
});
