-- Add cover_image_url column to events table
-- This stores the URL of the event's cover/header image
-- Can be a Pexels URL or a user-uploaded image URL

ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS cover_image_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.events.cover_image_url IS 'URL of the event cover image (from Pexels or user upload)';




