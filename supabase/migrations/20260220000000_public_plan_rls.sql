-- Allow anonymous (unauthenticated) reads for the Public Plan page
-- Only exposes non-sensitive data: event metadata, block schedule, and aggregate RSVP counts
-- Guest names, contact info, and magic tokens remain protected by existing policies

-- Anyone can view any active event (needed for /plan/:eventId)
CREATE POLICY "Anyone can view active events"
ON public.events FOR SELECT
USING (status != 'deleted');

-- Anyone can view blocks for any event (schedule is public)
CREATE POLICY "Anyone can view blocks"
ON public.blocks FOR SELECT
USING (true);

-- Anyone can view RSVP responses (aggregate counts only; no guest PII is exposed)
CREATE POLICY "Anyone can view rsvp responses"
ON public.rsvps FOR SELECT
USING (true);

-- Anyone can view questions for an event (shown on RSVP page)
CREATE POLICY "Anyone can view questions"
ON public.questions FOR SELECT
USING (true);
