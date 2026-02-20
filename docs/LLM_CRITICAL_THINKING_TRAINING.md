# LLM Critical Thinking Training

## Overview

This document provides context and guidelines for AI assistants working on the Lockstep codebase. It helps LLMs understand the project deeply and make better decisions when implementing features or debugging issues.

---

## Project Understanding

### What Lockstep IS

1. **Block-based RSVP platform**: Guests respond to individual activities, not just the overall event
2. **Mobile-first web app**: Optimized for phones, works on all devices
3. **Organizer-centric tool**: Designed to reduce organizer burden
4. **Magic-link authenticated**: Guests don't need accounts

### What Lockstep is NOT

1. **Not a calendar app**: We don't sync with Google Calendar, etc.
2. **Not a ticketing system**: No payments, no tickets
3. **Not a social network**: Guests don't interact with each other
4. **Not a general event platform**: Focused on RSVPs only

### Core User Story

> As an event organizer with a multi-day, multi-activity event, I want to know exactly who's attending each activity so I can plan logistics without constantly asking guests.

---

## Technical Context

### Architecture Summary

```
Frontend (React + Vite)
    ↓
Supabase Client
    ↓
Supabase Backend
├── PostgreSQL (data)
├── Auth (organizers + guest tokens)
├── Edge Functions (nudges, AI)
└── Storage (future: images)
```

### Key Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `events` | Event metadata | title, organiser_id, dates, cover_image |
| `blocks` | Time blocks (activities) | name, start_time, end_time |
| `guests` | Attendee list | name, email, phone, magic_token |
| `rsvps` | Responses | guest_id, block_id, response |
| `questions` | Custom questions | prompt, type, options |
| `checkpoints` | Nudge schedule | trigger_at, type |
| `nudges` | Sent messages | guest_id, channel, status |
| `subscriptions` | User tier info | user_id, tier, stripe_customer_id |
| `event_purchases` | Per-event upgrades | event_id, tier, status |

### Key Pages

| Route | File | Purpose |
|-------|------|---------|
| `/` | `Index.tsx` | Landing page |
| `/auth` | `Auth.tsx` | Login/signup |
| `/create` | `CreateEvent.tsx` | 6-step wizard |
| `/dashboard` | `Dashboard.tsx` | Event list, AI summaries |
| `/events/:id` | `EventDetail.tsx` | Single event view |
| `/rsvp/:token` | `RSVPPage.tsx` | Guest RSVP experience |
| `/pricing` | `Pricing.tsx` | Tier comparison, Stripe checkout |
| `/profile` | `Profile.tsx` | User settings |

### Edge Functions

| Function | Purpose |
|----------|---------|
| `generate-description` | AI event descriptions (Gemini) |
| `generate-summary` | AI summaries for organizers |
| `send-nudge` | SMS/WhatsApp via Twilio |
| `fetch-pexels` | Cover photo search |
| `create-checkout-session` | Stripe checkout |
| `stripe-webhook` | Payment processing |

### Security Model

All tables use Row Level Security:
- Organizers: `auth.uid() = organiser_id`
- Guests: Validated via `magic_token` in URL
- No cross-event data leakage possible

---

## Implementation Guidelines

### When Adding Features

1. **Check schema first**: Does the data structure support this?
2. **Consider RLS**: What policies need updating?
3. **Mobile-first**: Will this work on phones?
4. **Guest vs organizer**: Who is the user?

### Common Patterns

**Fetching organizer's events**:
```typescript
const { data } = await supabase
  .from('events')
  .select('*, blocks(*), guests(*)')
  .eq('organiser_id', user.id);
```

**Guest access via magic token**:
```typescript
const { data } = await supabase
  .from('guests')
  .select('*, event:events(*)')
  .eq('magic_token', token)
  .single();
```

**Creating related records**:
```typescript
// Always create in transaction or with proper ordering
const { data: event } = await supabase.from('events').insert({...}).select().single();
await supabase.from('blocks').insert(blocks.map(b => ({ ...b, event_id: event.id })));
```

### Anti-Patterns to Avoid

1. **Don't bypass RLS**: Never use service role in frontend
2. **Don't hardcode IDs**: Use relationships and foreign keys
3. **Don't ignore errors**: Always check `error` from Supabase
4. **Don't fetch too much**: Select only needed columns

---

## Debugging Approach

### Common Issues

| Symptom | Likely Cause | Check |
|---------|--------------|-------|
| Empty data returned | RLS policy blocking | Check `auth.uid()` |
| 404 on magic link | Token invalid/expired | Check `guests.magic_token` |
| Animation janky | Wrong properties animated | Use transform/opacity only |
| Mobile layout broken | Not responsive | Check Tailwind breakpoints |

### Debugging Steps

1. **Check console logs** first
2. **Check network tab** for failed requests
3. **Check Supabase logs** for RLS/auth issues
4. **Reproduce in isolation** if complex

---

## Decision-Making Framework

### When Implementing a Feature

Ask yourself:
1. Does this align with the core user story?
2. What's the simplest implementation that works?
3. What could break? (RLS, auth, mobile)
4. Is this tested? (or at least testable)

### When Faced with Ambiguity

1. **Default to mobile users**: Most guests are on phones
2. **Default to security**: Err on the side of restriction
3. **Default to simplicity**: Don't over-engineer
4. **Ask if unsure**: Better to clarify than guess

### Trade-off Guidelines

| Priority | Over |
|----------|------|
| Security | Convenience |
| Mobile UX | Desktop UX |
| Simplicity | Features |
| Working code | Perfect code |
| User value | Technical elegance |

---

## Code Style

### React Components

```tsx
// Good: Small, focused component
function BlockCard({ block, onStatusChange }: BlockCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{block.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <StatusButtons block={block} onChange={onStatusChange} />
      </CardContent>
    </Card>
  );
}
```

### Styling

```tsx
// Good: Semantic tokens
<div className="bg-background text-foreground">

// Bad: Hardcoded colors
<div className="bg-white text-black">
```

### Data Fetching

```tsx
// Good: Error handling
const { data, error } = await supabase.from('events').select();
if (error) {
  console.error('Failed to fetch events:', error);
  toast.error('Could not load events');
  return;
}
```

---

## Edge Function Guidelines

### Structure

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Your logic here

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
```

### Accessing Secrets

```typescript
const apiKey = Deno.env.get('OPENAI_API_KEY');
if (!apiKey) {
  throw new Error('OPENAI_API_KEY not configured');
}
```

---

## Testing Considerations

### What to Test Manually

1. **Full flows**: Create event → Add guests → RSVP → Dashboard
2. **Edge cases**: Empty states, long text, special characters
3. **Mobile**: Touch, swipe, keyboard on mobile
4. **Auth states**: Logged in, logged out, expired session

### What to Watch For

1. **Loading states**: Never show blank screens
2. **Error states**: Always inform user of failures
3. **Accessibility**: Keyboard navigation, screen readers
4. **Performance**: No jank, fast loads

---

## Documentation Updates

When making changes, consider updating:

| Change Type | Docs to Update |
|-------------|----------------|
| New feature | FEATURES.md |
| Architecture change | ARCHITECTURE.md |
| New decision | DECISIONS_LOG.md |
| Bug pattern | COMMON_ISSUES.md |
| Visual change | VISUAL_GUIDELINES.md |
| New metrics | OUTCOMES.md |

---

## Quick Reference

### Important Files

| File | Purpose |
|------|---------|
| `src/App.tsx` | Route definitions (lazy loading) |
| `src/index.css` | CSS variables, global styles |
| `tailwind.config.ts` | Tailwind customization |
| `src/integrations/supabase/client.ts` | Supabase client (don't edit) |
| `src/integrations/supabase/types.ts` | Generated types (don't edit) |
| `src/services/subscription.ts` | Tier limits, Stripe checkout |
| `src/hooks/use-wizard-state.ts` | CreateWizard state management |
| `vercel.json` | Deployment configuration, CSP headers |

### Key Commands

```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run lint     # Check for issues
```

### Supabase Quick Queries

```sql
-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'events';

-- List all events
SELECT * FROM events ORDER BY created_at DESC;

-- Find guest by token
SELECT * FROM guests WHERE magic_token = 'xxx';

-- Response summary
SELECT block_id, response, COUNT(*) 
FROM rsvps GROUP BY block_id, response;
```
