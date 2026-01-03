# Common Issues

## Overview

This document catalogs known issues, their causes, and solutions. Use this as a first reference when troubleshooting.

---

## Build & Development Issues

### Issue: "Module not found" errors

**Symptoms**:
```
Cannot find module '@/components/Something'
```

**Causes**:
1. Component doesn't exist
2. Path alias misconfigured
3. Case sensitivity mismatch

**Solutions**:
1. Verify file exists at expected path
2. Check `tsconfig.json` for path aliases
3. Match exact case (macOS is case-insensitive, Linux is not)

---

### Issue: Tailwind classes not applying

**Symptoms**:
- Styles don't appear
- Classes show in HTML but no effect

**Causes**:
1. Class not in Tailwind's scan path
2. Using custom class without defining it
3. CSS specificity conflict

**Solutions**:
1. Check `tailwind.config.ts` content paths
2. Define custom classes in `index.css`
3. Use `!important` sparingly or fix cascade

---

### Issue: Hot reload not working

**Symptoms**:
- Changes don't appear in preview
- Need to manually refresh

**Causes**:
1. Vite cache corrupted
2. Syntax error preventing rebuild
3. File not in watch path

**Solutions**:
1. Clear Vite cache: delete `node_modules/.vite`
2. Check console for syntax errors
3. Verify file is imported somewhere

---

## Authentication Issues

### Issue: User can't sign up

**Symptoms**:
- Signup form submits but nothing happens
- "User already registered" when they're not

**Causes**:
1. Email confirmation required but not set up
2. User exists but unconfirmed
3. Rate limiting

**Solutions**:
1. Enable auto-confirm for development
2. Check Supabase auth logs
3. Wait or adjust rate limits

---

### Issue: Email confirmation links redirect to localhost

**Symptoms**:
- User clicks email confirmation link
- Browser navigates to `localhost:3000` instead of production URL
- Error: "This site can't be reached" or "ERR_CONNECTION_REFUSED"

**Causes**:
1. Supabase Dashboard Site URL not configured for production
2. Redirect URLs whitelist missing production domain

**Solutions**:

**Required Supabase Dashboard Configuration:**

1. Go to **Supabase Dashboard** → **Authentication** → **URL Configuration**
2. Set **Site URL** to your production URL: `https://inlockstep.ai`
3. Add to **Redirect URLs**:
   - `https://inlockstep.ai/**`
   - `http://localhost:8080/**` (for local development)

**Optional: Customize Email Templates**

1. Go to **Authentication** → **Email Templates**
2. Update templates to use your branding
3. The `{{ .ConfirmationURL }}` variable uses the Site URL you configured

**Important Notes**:
- The `emailRedirectTo` option in code is overridden by Supabase's Site URL for confirmation emails
- After updating Site URL, new signups will receive correct links
- Existing unconfirmed users may need to request a new confirmation email

---

### Issue: Magic links not arriving

**Symptoms**:
- Guest clicks link but page errors
- Token expired messages

**Causes**:
1. Email not sent (check logs)
2. Token expired (default 1 hour)
3. Token already used

**Solutions**:
1. Check email delivery logs
2. Extend token expiry or regenerate
3. Allow token reuse for updates

---

### Issue: Session not persisting

**Symptoms**:
- User logged out on refresh
- Auth state lost between pages

**Causes**:
1. Supabase client not properly configured
2. Cookie/storage issues
3. SSR hydration mismatch

**Solutions**:
1. Verify `supabase/client.ts` configuration
2. Check browser cookie settings
3. Ensure client-side only auth checks

---

## Database Issues

### Issue: RLS blocking all queries

**Symptoms**:
- `[]` returned when data exists
- "permission denied" errors

**Causes**:
1. No policy for operation (SELECT/INSERT/UPDATE/DELETE)
2. Policy condition not matching
3. User not authenticated

**Solutions**:
1. Check policies: `SELECT * FROM pg_policies`
2. Debug policy conditions with test queries
3. Verify `auth.uid()` is set

---

### Issue: Foreign key constraint failures

**Symptoms**:
- "violates foreign key constraint" on insert
- Can't delete parent record

**Causes**:
1. Referenced record doesn't exist
2. Child records still reference parent
3. Cascade delete not configured

**Solutions**:
1. Insert parent records first
2. Delete children first or use CASCADE
3. Add `ON DELETE CASCADE` to constraint

---

### Issue: Data not updating in real-time

**Symptoms**:
- Changes in database not reflected in UI
- Need to refresh to see updates

**Causes**:
1. Realtime not enabled for table
2. Subscription not set up correctly
3. RLS blocking realtime

**Solutions**:
```sql
-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE your_table;
```

---

## UI/UX Issues

### Issue: Animations janky or stuttering

**Symptoms**:
- Choppy transitions
- Page feels slow

**Causes**:
1. Animating expensive properties (width, height)
2. Too many simultaneous animations
3. Large component re-renders

**Solutions**:
1. Animate `transform` and `opacity` only
2. Use `will-change` sparingly
3. Memoize components, use `layoutId`

---

### Issue: Mobile touch not registering

**Symptoms**:
- Buttons need multiple taps
- Swipes not detected

**Causes**:
1. Touch targets too small
2. Event handlers not touchscreen compatible
3. CSS `:hover` interfering

**Solutions**:
1. Minimum 44x44px touch targets
2. Use `onPointerDown` instead of `onClick`
3. Use `@media (hover: hover)` for hover states

---

### Issue: Dark mode colors wrong

**Symptoms**:
- Text invisible in dark mode
- Colors don't match design

**Causes**:
1. Using hardcoded colors instead of tokens
2. Dark mode variables not set
3. Component not using semantic tokens

**Solutions**:
1. Replace `text-white` with `text-foreground`
2. Define dark mode in `:root.dark`
3. Audit and fix color references

---

## Edge Function Issues

### Issue: Function timing out

**Symptoms**:
- 504 Gateway Timeout
- Function never completes

**Causes**:
1. External API slow or unresponsive
2. Large data processing
3. Infinite loop

**Solutions**:
1. Add timeouts to fetch calls
2. Process in batches
3. Add logging to identify bottleneck

---

### Issue: Secrets not accessible

**Symptoms**:
- `undefined` when accessing secret
- "Environment variable not found"

**Causes**:
1. Secret not added
2. Secret name misspelled
3. Function not redeployed after adding secret

**Solutions**:
1. Add via Lovable secrets tool
2. Check exact name (case-sensitive)
3. Redeploy function

---

### Issue: CORS errors from function

**Symptoms**:
- "Access-Control-Allow-Origin" error
- Request blocked by browser

**Causes**:
1. Missing CORS headers in response
2. Preflight request not handled

**Solutions**:
```typescript
// In edge function
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handle OPTIONS
if (req.method === 'OPTIONS') {
  return new Response(null, { headers });
}
```

---

## Integration Issues

### Issue: Twilio SMS not sending

**Symptoms**:
- No error but message not received
- Error: "Invalid phone number"

**Causes**:
1. Phone number format wrong
2. Twilio trial limitations
3. Account SID/Auth Token wrong

**Solutions**:
1. Use E.164 format: `+1234567890`
2. Verify recipient on Twilio trial
3. Verify credentials in secrets

---

### Issue: Resend emails going to spam

**Symptoms**:
- Emails arrive in spam folder
- Low open rates

**Causes**:
1. Domain not verified
2. No SPF/DKIM records
3. Content triggering filters

**Solutions**:
1. Verify sending domain in Resend
2. Add required DNS records
3. Review email content for spam triggers

---

## Performance Issues

### Issue: Slow initial load

**Symptoms**:
- White screen for seconds
- Poor LCP score

**Causes**:
1. Large JavaScript bundle
2. Render-blocking resources
3. Slow API calls on mount

**Solutions**:
1. Code split with dynamic imports
2. Defer non-critical scripts
3. Add loading states, prefetch data

---

### Issue: Memory leaks

**Symptoms**:
- App slows down over time
- Browser tab crashes

**Causes**:
1. Uncleared intervals/timeouts
2. Event listeners not removed
3. Subscriptions not unsubscribed

**Solutions**:
```tsx
useEffect(() => {
  const interval = setInterval(fn, 1000);
  return () => clearInterval(interval); // Cleanup!
}, []);
```

---

## Stripe Integration Issues

### Issue: Checkout session not creating

**Symptoms**:
- "Failed to create checkout session" error
- Network request fails

**Causes**:
1. STRIPE_SECRET_KEY not set in Supabase secrets
2. Price ID incorrect or not created in Stripe Dashboard
3. CORS issues with Edge Function

**Solutions**:
1. Verify secret is set: Supabase Dashboard → Edge Functions → Secrets
2. Create products/prices in Stripe Dashboard first
3. Check Edge Function logs for detailed error

---

### Issue: Webhook not processing

**Symptoms**:
- Payment succeeds but subscription not activated
- event_purchases row not created

**Causes**:
1. Webhook endpoint not configured in Stripe
2. Webhook secret mismatch
3. Edge Function error

**Solutions**:
1. Add webhook in Stripe Dashboard → Developers → Webhooks
2. Set endpoint to: `https://<project>.supabase.co/functions/v1/stripe-webhook`
3. Copy signing secret to Supabase secrets

---

## Debugging Tips

### Enable Verbose Logging

```typescript
// Supabase
const { data, error } = await supabase
  .from('table')
  .select()
console.log({ data, error });
```

### Check Network Tab

- Look for failed requests
- Examine response bodies
- Check request payloads

### Use React DevTools

- Inspect component tree
- Check state and props
- Profile renders

### Read Supabase Logs

Use Lovable's log tools:
- Database logs
- Auth logs
- Edge function logs
