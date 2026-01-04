-- ============================================
-- EVENT PURCHASES: One-time payments per event
-- ============================================
CREATE TABLE IF NOT EXISTS public.event_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  stripe_payment_intent_id TEXT,
  stripe_checkout_session_id TEXT,
  tier TEXT CHECK (tier IN ('pro', 'wedding', 'business')) NOT NULL,
  amount_paid INTEGER NOT NULL, -- cents
  addons JSONB DEFAULT '[]'::jsonb, -- ['whatsapp', 'branding', 'export']
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  purchased_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on event_purchases
ALTER TABLE public.event_purchases ENABLE ROW LEVEL SECURITY;

-- RLS policies for event_purchases
CREATE POLICY "Users can view own purchases" 
ON public.event_purchases FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own purchases" 
ON public.event_purchases FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own purchases" 
ON public.event_purchases FOR UPDATE 
USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_event_purchases_event_id ON public.event_purchases(event_id);
CREATE INDEX IF NOT EXISTS idx_event_purchases_user_id ON public.event_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_event_purchases_stripe_session ON public.event_purchases(stripe_checkout_session_id);

-- ============================================
-- Update subscriptions table for annual plans
-- ============================================
ALTER TABLE public.subscriptions 
  ADD COLUMN IF NOT EXISTS tier TEXT CHECK (tier IN ('free', 'annual_pro')),
  ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '{}'::jsonb;

-- ============================================
-- NUDGE TRACKING: Track nudges sent per event for limits
-- ============================================
-- Add nudge count tracking if not exists
ALTER TABLE public.events 
  ADD COLUMN IF NOT EXISTS nudges_sent INTEGER DEFAULT 0;

-- ============================================
-- STRIPE PRODUCTS CONFIG TABLE
-- Store Stripe product/price IDs for each tier
-- ============================================
CREATE TABLE IF NOT EXISTS public.stripe_products (
  id TEXT PRIMARY KEY,
  tier TEXT NOT NULL,
  price_cents INTEGER NOT NULL,
  stripe_price_id TEXT,
  is_subscription BOOLEAN DEFAULT false,
  features JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default product configurations
INSERT INTO public.stripe_products (id, tier, price_cents, is_subscription, features) VALUES
  ('pro_event', 'pro', 2900, false, '{"guests": 75, "nudges": 20, "ai_summaries": true, "whatsapp": true}'::jsonb),
  ('wedding_event', 'wedding', 4900, false, '{"guests": 150, "nudges": -1, "ai_summaries": true, "whatsapp": true, "export": true, "priority_ai": true}'::jsonb),
  ('business_event', 'business', 9900, false, '{"guests": 200, "nudges": -1, "ai_summaries": true, "whatsapp": true, "export": true, "analytics": true, "team_access": true}'::jsonb),
  ('annual_pro', 'annual_pro', 14900, true, '{"guests": 75, "nudges": 20, "ai_summaries": true, "whatsapp": true, "unlimited_events": true}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- RLS for stripe_products (public read)
ALTER TABLE public.stripe_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view stripe products" 
ON public.stripe_products FOR SELECT 
USING (true);










