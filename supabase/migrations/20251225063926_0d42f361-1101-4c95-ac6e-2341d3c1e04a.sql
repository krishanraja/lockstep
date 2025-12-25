-- Create events table
CREATE TABLE public.events (
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
CREATE TABLE public.blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create questions table
CREATE TABLE public.questions (
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
CREATE TABLE public.guests (
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
CREATE TABLE public.rsvps (
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
CREATE TABLE public.checkpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events ON DELETE CASCADE NOT NULL,
  trigger_at TIMESTAMPTZ NOT NULL,
  type TEXT DEFAULT 'reminder',
  message TEXT,
  executed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create nudges table (sent nudge messages)
CREATE TABLE public.nudges (
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
CREATE POLICY "Organisers can view their own events" 
ON public.events FOR SELECT 
USING (auth.uid() = organiser_id);

CREATE POLICY "Organisers can create events" 
ON public.events FOR INSERT 
WITH CHECK (auth.uid() = organiser_id);

CREATE POLICY "Organisers can update their own events" 
ON public.events FOR UPDATE 
USING (auth.uid() = organiser_id);

CREATE POLICY "Organisers can delete their own events" 
ON public.events FOR DELETE 
USING (auth.uid() = organiser_id);

-- RLS policies for blocks (inherit from event ownership)
CREATE POLICY "Organisers can manage blocks" 
ON public.blocks FOR ALL 
USING (EXISTS (SELECT 1 FROM public.events WHERE events.id = blocks.event_id AND events.organiser_id = auth.uid()));

-- RLS policies for questions
CREATE POLICY "Organisers can manage questions" 
ON public.questions FOR ALL 
USING (EXISTS (SELECT 1 FROM public.events WHERE events.id = questions.event_id AND events.organiser_id = auth.uid()));

-- RLS policies for guests
CREATE POLICY "Organisers can manage guests" 
ON public.guests FOR ALL 
USING (EXISTS (SELECT 1 FROM public.events WHERE events.id = guests.event_id AND events.organiser_id = auth.uid()));

-- RLS policies for rsvps (organisers via guest->event, or guests via magic token)
CREATE POLICY "Organisers can view rsvps" 
ON public.rsvps FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.guests g 
  JOIN public.events e ON e.id = g.event_id 
  WHERE g.id = rsvps.guest_id AND e.organiser_id = auth.uid()
));

CREATE POLICY "Anyone can insert rsvp" 
ON public.rsvps FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update rsvp" 
ON public.rsvps FOR UPDATE 
USING (true);

-- RLS policies for checkpoints
CREATE POLICY "Organisers can manage checkpoints" 
ON public.checkpoints FOR ALL 
USING (EXISTS (SELECT 1 FROM public.events WHERE events.id = checkpoints.event_id AND events.organiser_id = auth.uid()));

-- RLS policies for nudges
CREATE POLICY "Organisers can view nudges" 
ON public.nudges FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.guests g 
  JOIN public.events e ON e.id = g.event_id 
  WHERE g.id = nudges.guest_id AND e.organiser_id = auth.uid()
));

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add triggers for updated_at
CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rsvps_updated_at
  BEFORE UPDATE ON public.rsvps
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();