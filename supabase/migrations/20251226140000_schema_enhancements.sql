-- Schema Enhancements for Lockstep 2026 Experience
-- This migration adds missing columns and new tables

-- ============================================
-- EVENTS: Add template and place data columns
-- ============================================
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS template TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS place_id TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS place_data JSONB;

-- ============================================
-- BLOCKS: Add location and attendance columns
-- ============================================
ALTER TABLE public.blocks ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE public.blocks ADD COLUMN IF NOT EXISTS attendance_required BOOLEAN DEFAULT false;

-- ============================================
-- CHECKPOINTS: Add name, question refs, and auto-resolve
-- ============================================
ALTER TABLE public.checkpoints ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.checkpoints ADD COLUMN IF NOT EXISTS required_question_ids UUID[];
ALTER TABLE public.checkpoints ADD COLUMN IF NOT EXISTS applicable_block_ids UUID[];
ALTER TABLE public.checkpoints ADD COLUMN IF NOT EXISTS auto_resolve_to TEXT CHECK (auto_resolve_to IN ('out', 'maybe', NULL));

-- ============================================
-- GUESTS: Add opted_out_at timestamp
-- ============================================
ALTER TABLE public.guests ADD COLUMN IF NOT EXISTS opted_out_at TIMESTAMPTZ;

-- ============================================
-- NUDGES: Add message, idempotency, and delivery tracking
-- ============================================
ALTER TABLE public.nudges ADD COLUMN IF NOT EXISTS message TEXT;
ALTER TABLE public.nudges ADD COLUMN IF NOT EXISTS idempotency_key TEXT UNIQUE;
ALTER TABLE public.nudges ADD COLUMN IF NOT EXISTS external_id TEXT;
ALTER TABLE public.nudges ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;
ALTER TABLE public.nudges ADD COLUMN IF NOT EXISTS error_message TEXT;

-- ============================================
-- ANSWERS: Guest responses to questions
-- ============================================
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
CREATE POLICY "Organisers can view answers" 
ON public.answers FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.guests g 
  JOIN public.events e ON e.id = g.event_id 
  WHERE g.id = answers.guest_id AND e.organiser_id = auth.uid()
));

CREATE POLICY "Anyone can insert answer" 
ON public.answers FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update answer" 
ON public.answers FOR UPDATE 
USING (true);

-- ============================================
-- SUBSCRIPTIONS: Billing and plans
-- ============================================
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
CREATE POLICY "Users can view own subscription" 
ON public.subscriptions FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription" 
ON public.subscriptions FOR UPDATE 
USING (auth.uid() = user_id);

-- ============================================
-- INDEXES for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_nudges_idempotency_key ON public.nudges(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_answers_guest_id ON public.answers(guest_id);
CREATE INDEX IF NOT EXISTS idx_answers_question_id ON public.answers(question_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);

-- ============================================
-- TRIGGER: Update updated_at on answers
-- ============================================
CREATE TRIGGER update_answers_updated_at
  BEFORE UPDATE ON public.answers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- REALTIME: Enable for new tables
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.answers;











