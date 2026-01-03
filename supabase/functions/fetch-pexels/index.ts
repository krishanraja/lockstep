// Supabase Edge Function: Fetch photos from Pexels API
// Proxies requests to Pexels to keep API key server-side

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders, handleCors } from '../_shared/cors.ts';

interface PexelsPhoto {
  id: number;
  width: number;
  height: number;
  url: string;
  photographer: string;
  photographer_url: string;
  src: {
    original: string;
    large2x: string;
    large: string;
    medium: string;
    small: string;
    portrait: string;
    landscape: string;
    tiny: string;
  };
  alt: string;
}

interface PexelsResponse {
  total_results: number;
  page: number;
  per_page: number;
  photos: PexelsPhoto[];
  next_page?: string;
}

interface RequestBody {
  query: string;
  per_page?: number;
  page?: number;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const PEXELS_API_KEY = Deno.env.get('PEXELS_API_KEY');
    
    if (!PEXELS_API_KEY) {
      console.error('[fetch-pexels] CRITICAL: PEXELS_API_KEY not configured in Supabase Edge Function Secrets');
      console.error('[fetch-pexels] To fix: Go to Supabase Dashboard -> Edge Functions -> Secrets -> Add PEXELS_API_KEY');
      return new Response(
        JSON.stringify({ error: 'Photo search not configured. PEXELS_API_KEY missing from Edge Function Secrets.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('[fetch-pexels] API key configured (length:', PEXELS_API_KEY.length, ')');

    const body: RequestBody = await req.json();
    const { query, per_page = 12, page = 1 } = body;

    if (!query || typeof query !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Query parameter is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Sanitize query
    const sanitizedQuery = query.trim().slice(0, 100);
    
    // Build Pexels API URL
    const pexelsUrl = new URL('https://api.pexels.com/v1/search');
    pexelsUrl.searchParams.set('query', sanitizedQuery);
    pexelsUrl.searchParams.set('per_page', String(Math.min(per_page, 30))); // Max 30 per page
    pexelsUrl.searchParams.set('page', String(page));
    
    console.log(`[fetch-pexels] Searching for: "${sanitizedQuery}"`);

    const response = await fetch(pexelsUrl.toString(), {
      headers: {
        'Authorization': PEXELS_API_KEY,
      },
    });

    if (!response.ok) {
      console.error(`[fetch-pexels] Pexels API error: ${response.status} ${response.statusText}`);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch photos from Pexels' }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data: PexelsResponse = await response.json();
    
    // Return simplified photo data
    const photos = data.photos.map((photo) => ({
      id: photo.id,
      src: {
        medium: photo.src.medium,
        large: photo.src.large,
      },
      alt: photo.alt || `Photo by ${photo.photographer}`,
      photographer: photo.photographer,
    }));

    console.log(`[fetch-pexels] Found ${photos.length} photos for "${sanitizedQuery}"`);

    return new Response(
      JSON.stringify({ 
        photos,
        total: data.total_results,
        page: data.page,
        per_page: data.per_page,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[fetch-pexels] Error:', error);
    
    return new Response(
      JSON.stringify({ error: 'Failed to fetch photos' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});




