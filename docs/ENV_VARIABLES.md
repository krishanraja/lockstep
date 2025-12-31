# Environment Variables

## Frontend (Vercel)

These variables are exposed to the browser and must be prefixed with `VITE_`:

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL: `https://wtainaqexarwyrinvhjj.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/publishable key (safe for client-side) |
| `VITE_GOOGLE_PLACES_API_KEY` | Google Places API key for location autocomplete |

## Backend (Supabase Edge Function Secrets)

These are configured in Supabase Dashboard > Edge Functions > Secrets:

| Secret | Description |
|--------|-------------|
| `GOOGLE_AI_API_KEY` | Google AI API key for Gemini (primary LLM) |
| `OPENAI_API_KEY` | OpenAI API key (fallback LLM) |
| `TWILIO_ACCOUNT_SID` | Twilio Account SID for SMS/WhatsApp |
| `TWILIO_API_SECRET` | Twilio API Secret |
| `RESEND_API_KEY` | Resend API key for email |
| `STRIPE_SECRET_KEY` | Stripe secret key (add when going to production) |

## Setup Instructions

### Vercel

1. Go to your Vercel project settings
2. Navigate to Environment Variables
3. Add each `VITE_*` variable for Production, Preview, and Development

### Supabase Edge Functions

1. Go to Supabase Dashboard
2. Navigate to Edge Functions > Secrets
3. Add each backend secret

### Google Places API

1. Go to Google Cloud Console
2. Enable Places API and Maps JavaScript API
3. Create an API key with appropriate restrictions
4. Add the key to Vercel as `VITE_GOOGLE_PLACES_API_KEY`







