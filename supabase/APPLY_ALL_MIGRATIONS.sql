-- ================================================================
-- LOCKSTEP COMPLETE DATABASE MIGRATION
-- Run this ENTIRE script in Supabase Dashboard > SQL Editor
-- Project: fauqcwrdkqwoatzptght
-- ================================================================
-- This combines all migrations in order:
-- 1. 20251225063926 - Core tables
-- 2. 20251226140000 - Schema enhancements
-- 3. 20251227000000 - Event purchases
-- 4. 20260103000000 - Cover image
-- ================================================================

-- ================================================================
-- MIGRATION 1: CORE TABLES
-- ================================================================

-- Create events table
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organiser_id UUID REFERENCES auth.users ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  timezone TEXT DEFAULT 'UTC',
  status TEXT DEFAULT 'draft',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create blocks table (time blocks within an event)
CREATE TABLE IF NOT EXISTS public.blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create questions table
CREATE TABLE IF NOT EXISTS public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  prompt TEXT NOT NULL,
  options JSONB,
  required BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create guests table
CREATE TABLE IF NOT EXISTS public.guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  magic_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create rsvps table
CREATE TABLE IF NOT EXISTS public.rsvps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id UUID REFERENCES public.guests ON DELETE CASCADE NOT NULL,
  block_id UUID REFERENCES public.blocks ON DELETE CASCADE NOT NULL,
  response TEXT NOT NULL,
  arrival_time TIMESTAMPTZ,
  departure_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(guest_id, block_id)
);

-- Create checkpoints table (deadline checkpoints for nudges)
CREATE TABLE IF NOT EXISTS public.checkpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events ON DELETE CASCADE NOT NULL,
  trigger_at TIMESTAMPTZ NOT NULL,
  type TEXT DEFAULT 'reminder',
  message TEXT,
  executed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create nudges table (sent nudge messages)
CREATE TABLE IF NOT EXISTS public.nudges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id UUID REFERENCES public.guests ON DELETE CASCADE,
  checkpoint_id UUID REFERENCES public.checkpoints ON DELETE CASCADE,
  channel TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nudges ENABLE ROW LEVEL SECURITY;

-- RLS policies for events (organisers can manage their own events)
DO $$ BEGIN
  CREATE POLICY "Organisers can view their own events" 
  ON public.events FOR SELECT 
  USING (auth.uid() = organiser_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Organisers can create events" 
  ON public.events FOR INSERT 
  WITH CHECK (auth.uid() = organiser_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Organisers can update their own events" 
  ON public.events FOR UPDATE 
  USING (auth.uid() = organiser_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Organisers can delete their own events" 
  ON public.events FOR DELETE 
  USING (auth.uid() = organiser_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- RLS policies for blocks (inherit from event ownership)
DO $$ BEGIN
  CREATE POLICY "Organisers can manage blocks" 
  ON public.blocks FOR ALL 
  USING (EXISTS (SELECT 1 FROM public.events WHERE events.id = blocks.event_id AND events.organiser_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- RLS policies for questions
DO $$ BEGIN
  CREATE POLICY "Organisers can manage questions" 
  ON public.questions FOR ALL 
  USING (EXISTS (SELECT 1 FROM public.events WHERE events.id = questions.event_id AND events.organiser_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- RLS policies for guests
DO $$ BEGIN
  CREATE POLICY "Organisers can manage guests" 
  ON public.guests FOR ALL 
  USING (EXISTS (SELECT 1 FROM public.events WHERE events.id = guests.event_id AND events.organiser_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- RLS policies for rsvps (organisers via guest->event, or guests via magic token)
DO $$ BEGIN
  CREATE POLICY "Organisers can view rsvps" 
  ON public.rsvps FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.guests g 
    JOIN public.events e ON e.id = g.event_id 
    WHERE g.id = rsvps.guest_id AND e.organiser_id = auth.uid()
  ));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Anyone can insert rsvp" 
  ON public.rsvps FOR INSERT 
  WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Anyone can update rsvp" 
  ON public.rsvps FOR UPDATE 
  USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- RLS policies for checkpoints
DO $$ BEGIN
  CREATE POLICY "Organisers can manage checkpoints" 
  ON public.checkpoints FOR ALL 
  USING (EXISTS (SELECT 1 FROM public.events WHERE events.id = checkpoints.event_id AND events.organiser_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- RLS policies for nudges
DO $$ BEGIN
  CREATE POLICY "Organisers can view nudges" 
  ON public.nudges FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.guests g 
    JOIN public.events e ON e.id = g.event_id 
    WHERE g.id = nudges.guest_id AND e.organiser_id = auth.uid()
  ));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add triggers for updated_at (drop first to avoid errors)
DROP TRIGGER IF EXISTS update_events_updated_at ON public.events;
CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_rsvps_updated_at ON public.rsvps;
CREATE TRIGGER update_rsvps_updated_at
  BEFORE UPDATE ON public.rsvps
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ================================================================
-- MIGRATION 2: SCHEMA ENHANCEMENTS
-- ================================================================

-- EVENTS: Add template and place data columns
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS template TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS place_id TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS place_data JSONB;

-- BLOCKS: Add location and attendance columns
ALTER TABLE public.blocks ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE public.blocks ADD COLUMN IF NOT EXISTS attendance_required BOOLEAN DEFAULT false;

-- CHECKPOINTS: Add name, question refs, and auto-resolve
ALTER TABLE public.checkpoints ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.checkpoints ADD COLUMN IF NOT EXISTS required_question_ids UUID[];
ALTER TABLE public.checkpoints ADD COLUMN IF NOT EXISTS applicable_block_ids UUID[];
-- Note: Cannot add CHECK constraint with ADD COLUMN IF NOT EXISTS, handle separately
DO $$ BEGIN
  ALTER TABLE public.checkpoints ADD COLUMN auto_resolve_to TEXT CHECK (auto_resolve_to IN ('out', 'maybe', NULL));
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- GUESTS: Add opted_out_at timestamp
ALTER TABLE public.guests ADD COLUMN IF NOT EXISTS opted_out_at TIMESTAMPTZ;

-- NUDGES: Add message, idempotency, and delivery tracking
ALTER TABLE public.nudges ADD COLUMN IF NOT EXISTS message TEXT;
DO $$ BEGIN
  ALTER TABLE public.nudges ADD COLUMN idempotency_key TEXT UNIQUE;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
ALTER TABLE public.nudges ADD COLUMN IF NOT EXISTS external_id TEXT;
ALTER TABLE public.nudges ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;
ALTER TABLE public.nudges ADD COLUMN IF NOT EXISTS error_message TEXT;

-- ANSWERS: Guest responses to questions
CREATE TABLE IF NOT EXISTS public.answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id UUID REFERENCES public.guests(id) ON DELETE CASCADE NOT NULL,
  question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE NOT NULL,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(guest_id, question_id)
);

-- Enable RLS on answers
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;

-- RLS policies for answers
DO $$ BEGIN
  CREATE POLICY "Organisers can view answers" 
  ON public.answers FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.guests g 
    JOIN public.events e ON e.id = g.event_id 
    WHERE g.id = answers.guest_id AND e.organiser_id = auth.uid()
  ));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Anyone can insert answer" 
  ON public.answers FOR INSERT 
  WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Anyone can update answer" 
  ON public.answers FOR UPDATE 
  USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- SUBSCRIPTIONS: Billing and plans
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  plan TEXT CHECK (plan IN ('free', 'per_event', 'annual')),
  status TEXT DEFAULT 'active',
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS policies for subscriptions
DO $$ BEGIN
  CREATE POLICY "Users can view own subscription" 
  ON public.subscriptions FOR SELECT 
  USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update own subscription" 
  ON public.subscriptions FOR UPDATE 
  USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- INDEXES for performance
CREATE INDEX IF NOT EXISTS idx_nudges_idempotency_key ON public.nudges(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_answers_guest_id ON public.answers(guest_id);
CREATE INDEX IF NOT EXISTS idx_answers_question_id ON public.answers(question_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);

-- TRIGGER: Update updated_at on answers
DROP TRIGGER IF EXISTS update_answers_updated_at ON public.answers;
CREATE TRIGGER update_answers_updated_at
  BEFORE UPDATE ON public.answers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- REALTIME: Enable for answers table
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.answers;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ================================================================
-- MIGRATION 3: EVENT PURCHASES
-- ================================================================

-- EVENT PURCHASES: One-time payments per event
CREATE TABLE IF NOT EXISTS public.event_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  stripe_payment_intent_id TEXT,
  stripe_checkout_session_id TEXT,
  tier TEXT CHECK (tier IN ('pro', 'wedding', 'business')) NOT NULL,
  amount_paid INTEGER NOT NULL,
  addons JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  purchased_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on event_purchases
ALTER TABLE public.event_purchases ENABLE ROW LEVEL SECURITY;

-- RLS policies for event_purchases
DO $$ BEGIN
  CREATE POLICY "Users can view own purchases" 
  ON public.event_purchases FOR SELECT 
  USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can insert own purchases" 
  ON public.event_purchases FOR INSERT 
  WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update own purchases" 
  ON public.event_purchases FOR UPDATE 
  USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_event_purchases_event_id ON public.event_purchases(event_id);
CREATE INDEX IF NOT EXISTS idx_event_purchases_user_id ON public.event_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_event_purchases_stripe_session ON public.event_purchases(stripe_checkout_session_id);

-- Update subscriptions table for annual plans
DO $$ BEGIN
  ALTER TABLE public.subscriptions ADD COLUMN tier TEXT CHECK (tier IN ('free', 'annual_pro'));
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '{}'::jsonb;

-- NUDGE TRACKING: Track nudges sent per event for limits
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS nudges_sent INTEGER DEFAULT 0;

-- STRIPE PRODUCTS CONFIG TABLE
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

DO $$ BEGIN
  CREATE POLICY "Anyone can view stripe products" 
  ON public.stripe_products FOR SELECT 
  USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ================================================================
-- MIGRATION 4: COVER IMAGE
-- ================================================================

-- Add cover_image_url column to events table
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS cover_image_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.events.cover_image_url IS 'URL of the event cover image (from Pexels or user upload)';

-- ================================================================
-- MIGRATION 5: PROFILES & PHONE VERIFICATION
-- ================================================================

-- PROFILES: Extended user data for organizers
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  phone_verified_at TIMESTAMPTZ,
  timezone TEXT DEFAULT 'UTC',
  preferences JSONB DEFAULT '{
    "notifications": {
      "email_updates": true,
      "sms_reminders": true,
      "marketing": false
    },
    "theme": "system",
    "language": "en"
  }'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DO $$ BEGIN
  CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);

-- Auto-create profile on signup (trigger)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- STORAGE: Avatars bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars', 
  'avatars', 
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

-- Storage policies for avatars
DO $$ BEGIN
  CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Anyone can view avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- OTP: Temporary storage for phone verification
CREATE TABLE IF NOT EXISTS public.phone_otps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  phone TEXT NOT NULL,
  otp_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  verified BOOLEAN DEFAULT false,
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS for OTP table
ALTER TABLE public.phone_otps ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users can view own OTPs"
  ON public.phone_otps FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can insert own OTPs"
  ON public.phone_otps FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update own OTPs"
  ON public.phone_otps FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Index for OTP lookups
CREATE INDEX IF NOT EXISTS idx_phone_otps_user_id ON public.phone_otps(user_id);
CREATE INDEX IF NOT EXISTS idx_phone_otps_expires_at ON public.phone_otps(expires_at);

-- Create profiles for existing users
INSERT INTO public.profiles (user_id)
SELECT id FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.profiles)
ON CONFLICT (user_id) DO NOTHING;

-- ================================================================
-- VERIFICATION QUERY
-- Run this after the migration to verify tables were created
-- ================================================================
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- ORDER BY table_name;

-- Expected tables:
-- answers, blocks, checkpoints, event_purchases, events, guests, 
-- nudges, phone_otps, profiles, questions, rsvps, stripe_products, subscriptions

