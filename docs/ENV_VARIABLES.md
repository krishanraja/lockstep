# Environment Variables

## Frontend (Vercel)

These variables are exposed to the browser and must be prefixed with `VITE_`:

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_PROJECT_ID` | Supabase project ID |
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/publishable key (safe for client-side) |
| `VITE_GOOGLE_PLACES_API_KEY` | Google Places API key for location autocomplete |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (starts with `pk_live_` or `pk_test_`) |

## Backend (Supabase Edge Function Secrets)

These are configured in Supabase Dashboard → Edge Functions → Secrets:

| Secret | Description | Required |
|--------|-------------|----------|
| `GOOGLE_AI_API_KEY` | Google AI API key for Gemini (primary LLM) | ✅ |
| `OPENAI_API_KEY` | OpenAI API key (fallback LLM) | Optional |
| `TWILIO_ACCOUNT_SID` | Twilio Account SID for SMS/WhatsApp | ✅ |
| `TWILIO_AUTH_TOKEN` | Twilio Auth Token | ✅ |
| `RESEND_API_KEY` | Resend API key for email | ✅ |
| `STRIPE_SECRET_KEY` | Stripe secret key for payments | ✅ |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | ✅ |
| `PEXELS_API_KEY` | Pexels API key for cover photos | ✅ |
| `OTP_SECRET` | Secret key for OTP generation (phone verification) | ✅ |

## Setup Instructions

### Vercel

1. Go to your Vercel project settings
2. Navigate to Environment Variables
3. Add each `VITE_*` variable for Production, Preview, and Development

### Supabase Edge Functions

1. Go to Supabase Dashboard
2. Navigate to Edge Functions → Secrets
3. Add each backend secret

### Google Places API

1. Go to Google Cloud Console
2. Enable Places API and Maps JavaScript API
3. Create an API key with appropriate restrictions:
   - HTTP referrers: `inlockstep.ai/*`, `localhost:5173/*`
4. Add the key to Vercel as `VITE_GOOGLE_PLACES_API_KEY`

### Stripe

1. Go to Stripe Dashboard → Developers → API keys
2. Copy the Secret Key (starts with `sk_live_` or `sk_test_`)
3. Add as `STRIPE_SECRET_KEY` in Supabase secrets
4. Go to Webhooks → Add Endpoint:
   - URL: `https://<project>.supabase.co/functions/v1/stripe-webhook`
   - Events: `checkout.session.completed`, `customer.subscription.*`
5. Copy the Signing Secret and add as `STRIPE_WEBHOOK_SECRET`

### Twilio

1. Go to Twilio Console
2. Copy Account SID and Auth Token from Dashboard
3. Add as `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN`
4. Ensure you have a verified phone number for sending

### Pexels

1. Go to pexels.com/api
2. Create an API key
3. Add as `PEXELS_API_KEY`

### Stripe (Frontend)

1. Go to Stripe Dashboard → Developers → API keys
2. Copy the Publishable Key (starts with `pk_live_` or `pk_test_`)
3. Add as `VITE_STRIPE_PUBLISHABLE_KEY` in Vercel environment variables

### Google AI (Gemini)

1. Go to Google AI Studio (aistudio.google.com)
2. Create an API key
3. Add as `GOOGLE_AI_API_KEY`

### OTP Secret

1. Generate a random 32+ character secret string
2. Add as `OTP_SECRET` in Supabase secrets
3. Used by `send-otp` and `verify-otp` edge functions for phone verification









