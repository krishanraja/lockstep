-- Expose organiser display_name to anonymous callers (for RSVP page welcome screen)
-- Uses SECURITY DEFINER so the function runs with elevated privileges,
-- without granting a broad SELECT policy on the profiles table.

CREATE OR REPLACE FUNCTION public.get_organiser_display_name(organiser_uuid UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT display_name FROM public.profiles WHERE user_id = organiser_uuid LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_organiser_display_name(UUID) TO anon, authenticated;
