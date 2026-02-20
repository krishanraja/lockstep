import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Check, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

interface StripeCheckoutProps {
  tier: 'free' | 'pro';
  onSuccess?: () => void;
}

export function StripeCheckout({ tier, onSuccess }: StripeCheckoutProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpgrade = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('You must be logged in to upgrade');
        return;
      }

      // Call Supabase edge function to create checkout session
      const { data, error: fnError } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          userId: user.id,
          email: user.email,
          tier: 'pro', // Only pro tier available for now
        },
      });

      if (fnError) throw fnError;
      if (!data?.url) throw new Error('No checkout URL returned');

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (err: any) {
      console.error('[StripeCheckout] Error:', err);
      setError(err.message || 'Failed to start checkout');
    } finally {
      setIsLoading(false);
    }
  };

  if (tier === 'pro') {
    return (
      <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Check className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Pro Plan Active</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            You have unlimited events and all features unlocked.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 border-2 border-primary/20">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">Upgrade to Pro</h3>
          <p className="text-sm text-muted-foreground">
            Unlock unlimited events, nudges, and premium features.
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Check className="h-4 w-4 text-primary" />
            <span>Unlimited events</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Check className="h-4 w-4 text-primary" />
            <span>Unlimited guest nudges</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Check className="h-4 w-4 text-primary" />
            <span>Priority support</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Check className="h-4 w-4 text-primary" />
            <span>Advanced analytics (coming soon)</span>
          </div>
        </div>

        <div className="pt-2">
          <div className="text-3xl font-bold mb-1">$9.99<span className="text-lg text-muted-foreground">/mo</span></div>
          <p className="text-xs text-muted-foreground">Cancel anytime</p>
        </div>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        <Button
          onClick={handleUpgrade}
          disabled={isLoading}
          className="w-full"
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Starting checkout...
            </>
          ) : (
            'Upgrade to Pro'
          )}
        </Button>
      </div>
    </Card>
  );
}
