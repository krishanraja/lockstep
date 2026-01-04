# Deploy Supabase Edge Functions

## Prerequisites
1. Install Supabase CLI: https://supabase.com/docs/guides/cli
2. Or use npx: `npx supabase`

## Step 1: Login to Supabase

```bash
npx supabase login
```

This will open a browser to authenticate.

## Step 2: Link the Project

```bash
cd C:\Users\krish\OneDrive\Documents\Lockstep\lockstep
npx supabase link --project-ref fauqcwrdkqwoatzptght
```

## Step 3: Deploy All Edge Functions

Run each of these commands:

```bash
npx supabase functions deploy fetch-pexels
npx supabase functions deploy generate-description
npx supabase functions deploy generate-summary
npx supabase functions deploy send-nudge
npx supabase functions deploy create-checkout-session
npx supabase functions deploy stripe-webhook
```

Or deploy all at once:

```bash
npx supabase functions deploy
```

## Step 4: Verify Secrets in Dashboard

Go to: https://supabase.com/dashboard/project/fauqcwrdkqwoatzptght/settings/functions

Ensure these secrets are configured:
- `PEXELS_API_KEY` - Get from https://www.pexels.com/api/
- `GOOGLE_AI_API_KEY` - Get from https://aistudio.google.com/
- `TWILIO_ACCOUNT_SID` - Get from Twilio Console
- `TWILIO_AUTH_TOKEN` - Get from Twilio Console
- `STRIPE_SECRET_KEY` - Get from Stripe Dashboard
- `STRIPE_WEBHOOK_SECRET` - Get from Stripe Dashboard > Webhooks
- `RESEND_API_KEY` - Get from Resend Dashboard

## Verification

After deployment, go to Edge Functions in your Supabase Dashboard:
https://supabase.com/dashboard/project/fauqcwrdkqwoatzptght/functions

You should see all 6 functions listed and "Deployed" status.

