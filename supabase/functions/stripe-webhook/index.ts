import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

async function verifyStripeSignature(
  payload: string,
  sigHeader: string,
  secret: string,
): Promise<boolean> {
  const parts = sigHeader.split(',').reduce((acc, part) => {
    const [key, val] = part.split('=');
    acc[key.trim()] = val;
    return acc;
  }, {} as Record<string, string>);

  const timestamp = parts['t'];
  const v1Signature = parts['v1'];
  if (!timestamp || !v1Signature) return false;

  // Reject timestamps older than 5 minutes
  const age = Math.floor(Date.now() / 1000) - parseInt(timestamp, 10);
  if (Math.abs(age) > 300) return false;

  const signedPayload = `${timestamp}.${payload}`;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(signedPayload));
  const expected = Array.from(new Uint8Array(sig))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return expected === v1Signature;
}

serve(async (req: Request) => {
  try {
    const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!STRIPE_WEBHOOK_SECRET || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error('[stripe-webhook] Missing configuration');
      return new Response('Configuration error', { status: 500 });
    }

    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      return new Response('No signature', { status: 400 });
    }

    const body = await req.text();

    const valid = await verifyStripeSignature(body, signature, STRIPE_WEBHOOK_SECRET);
    if (!valid) {
      console.error('[stripe-webhook] Invalid signature');
      return new Response('Invalid signature', { status: 400 });
    }

    const event = JSON.parse(body);
    console.log(`[stripe-webhook] Received event: ${event.type}`);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata?.user_id || session.client_reference_id;
        const tier = session.metadata?.tier || 'pro';
        const eventId = session.metadata?.event_id;

        if (!userId) {
          console.error('[stripe-webhook] No user ID in session');
          break;
        }

        console.log(`[stripe-webhook] Checkout completed for user ${userId}, tier ${tier}`);

        // Upsert subscription
        const { error: upsertError } = await supabase
          .from('subscriptions')
          .upsert({
            user_id: userId,
            tier,
            stripe_customer_id: session.customer,
            stripe_subscription_id: session.subscription || null,
            status: 'active',
          }, { onConflict: 'user_id' });

        if (upsertError) {
          console.error('[stripe-webhook] Subscription upsert error:', upsertError);
        }

        // Create event purchase record if this was an event-specific purchase
        if (eventId) {
          const { error: purchaseError } = await supabase
            .from('event_purchases')
            .insert({
              event_id: eventId,
              user_id: userId,
              stripe_checkout_session_id: session.id,
              stripe_payment_intent_id: session.payment_intent || null,
              tier,
              amount_paid: session.amount_total || 0,
              status: 'completed',
            });

          if (purchaseError) {
            console.error('[stripe-webhook] Event purchase insert error:', purchaseError);
          }
        }
        break;
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const customerId = subscription.customer;

        const { data: existingSub } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (!existingSub) {
          console.error('[stripe-webhook] No subscription for customer:', customerId);
          break;
        }

        const isDeleted = event.type === 'customer.subscription.deleted';
        const newStatus = isDeleted ? 'cancelled' : subscription.status;

        const { error: updateError } = await supabase
          .from('subscriptions')
          .update({
            status: newStatus,
            tier: isDeleted ? 'free' : 'pro',
            current_period_end: subscription.current_period_end
              ? new Date(subscription.current_period_end * 1000).toISOString()
              : null,
          })
          .eq('user_id', existingSub.user_id);

        if (updateError) {
          console.error('[stripe-webhook] Subscription update error:', updateError);
        } else {
          console.log(`[stripe-webhook] Subscription ${newStatus} for user ${existingSub.user_id}`);
        }
        break;
      }

      default:
        console.log(`[stripe-webhook] Unhandled event: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[stripe-webhook] Error:', error);
    return new Response('Webhook error', { status: 500 });
  }
});
