# Replication Guide

## Overview

This guide explains how to replicate the Lockstep project—either to create a similar application or to understand the architecture for learning purposes.

---

## Prerequisites

### Required Accounts

1. **Lovable Account**: For building and deploying
2. **Supabase Account** (optional): If using external Supabase instead of Lovable Cloud

### Required Knowledge

- React fundamentals
- TypeScript basics
- SQL basics
- Understanding of REST APIs

---

## Step-by-Step Replication

### Phase 1: Project Setup

#### 1.1 Create New Lovable Project

1. Go to [lovable.dev](https://lovable.dev)
2. Click "New Project"
3. Give it a name
4. Enable Lovable Cloud when prompted (or connect external Supabase)

#### 1.2 Initial Dependencies

The following are pre-installed, but verify:
- React 18
- TypeScript
- Tailwind CSS
- shadcn/ui

Add additional dependencies:
```bash
# Via Lovable chat
"Add framer-motion for animations"
"Add @tanstack/react-query for data fetching"
"Add react-router-dom for routing"
```

### Phase 2: Design System

#### 2.1 Configure Tailwind

Update `tailwind.config.ts`:
- Add custom colors
- Configure fonts
- Set up animations

#### 2.2 Set Up CSS Variables

Update `src/index.css`:
- Define color tokens
- Set up light/dark mode
- Add custom properties

#### 2.3 Install shadcn Components

Install needed components:
- Button, Card, Input, Select
- Dialog, Sheet, Popover
- Form, Label, Checkbox
- Toast, Tabs, etc.

### Phase 3: Database Schema

#### 3.1 Create Core Tables

Use Lovable's migration tool:

```sql
-- Events table
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organiser_id UUID REFERENCES auth.users,
  title TEXT NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  location TEXT,
  timezone TEXT DEFAULT 'UTC',
  status TEXT DEFAULT 'draft',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Blocks table
CREATE TABLE public.blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  order_index INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Continue with guests, rsvps, questions, etc.
```

#### 3.2 Enable RLS

```sql
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizers manage own events"
ON public.events
FOR ALL
USING (auth.uid() = organiser_id);
```

### Phase 4: Authentication

#### 4.1 Configure Auth

Use Lovable's auth configuration:
- Enable email/password signup
- Enable auto-confirm for development
- Configure magic link auth for guests

#### 4.2 Create Auth Page

Build `src/pages/Auth.tsx`:
- Login form
- Signup form
- Password reset
- Supabase auth integration

### Phase 5: Core Features

#### 5.1 Landing Page

Create `src/pages/Index.tsx`:
- Hero section with animations
- Feature highlights
- Interactive demo
- CTA sections

#### 5.2 Event Creation Wizard

Create conversational 6-step wizard in `src/components/CreateWizard/`:

| Step | Component | Purpose |
|------|-----------|---------|
| 1 | `EventTypeStep.tsx` | Choose event type (visual cards) |
| 2 | `HostNameStep.tsx` | Organizer name input |
| 3 | `DateStep.tsx` | Weekend picker calendar |
| 4 | `LocationStep.tsx` | Google Places autocomplete |
| 5 | `GuestsStep.tsx` | Phone number input |
| 6 | `ConfirmStep.tsx` | AI description, cover photo, submit |

**Key patterns**:
- One question per screen
- Framer Motion transitions
- `use-wizard-state.ts` hook for state management
- AI assistance via Edge Functions

#### 5.3 Dashboard

- Event list with cards
- AI-generated summaries
- Response statistics
- Nudge controls

### Phase 6: Guest Experience

#### 6.1 Magic Link Auth

Implement token-based guest access:
- Generate unique tokens per guest
- Validate tokens on RSVP page
- Allow response updates

#### 6.2 RSVP Interface

Build guest-facing UI:
- Event details display
- Block-by-block responses
- Custom question answers
- Confirmation

### Phase 7: Automation

#### 7.1 Edge Functions

Create serverless functions:

```typescript
// supabase/functions/send-nudge/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req) => {
  // Fetch pending nudges
  // Send via Twilio/Resend
  // Update nudge status
})
```

#### 7.2 Scheduled Tasks

Set up checkpoints:
- Initial invitation
- Reminder sequence
- Confirmation messages

### Phase 8: Polish

#### 8.1 Animations

Add Framer Motion:
- Reveal animations
- Page transitions
- Micro-interactions

#### 8.2 Responsive Design

Test and fix:
- Mobile layouts
- Touch interactions
- Keyboard navigation

#### 8.3 Accessibility

Audit and fix:
- Focus management
- Screen reader support
- Color contrast

---

## Key Files Reference

### Configuration Files

| File | Purpose |
|------|---------|
| `vite.config.ts` | Build configuration |
| `tailwind.config.ts` | Tailwind customization |
| `tsconfig.json` | TypeScript settings |
| `supabase/config.toml` | Supabase settings |

### Core Application

| File | Purpose |
|------|---------|
| `src/main.tsx` | App entry point |
| `src/App.tsx` | Router setup |
| `src/index.css` | Global styles |

### Components

| Directory | Purpose |
|-----------|---------|
| `src/components/ui/` | shadcn components |
| `src/components/CreateWizard/` | 6-step event wizard |
| `src/components/CreateWizard/steps/` | Individual wizard steps |
| `src/components/animations/` | Animation helpers |

### Services

| File | Purpose |
|------|---------|
| `src/services/subscription.ts` | Tier limits, Stripe checkout |
| `src/services/llm/` | AI integration utilities |
| `src/services/places/` | Google Places API |

### Integration

| File | Purpose |
|------|---------|
| `src/integrations/supabase/client.ts` | Supabase client |
| `src/integrations/supabase/types.ts` | Generated types |

### Edge Functions

| Directory | Purpose |
|-----------|---------|
| `supabase/functions/generate-description/` | AI event descriptions |
| `supabase/functions/generate-summary/` | AI organizer summaries |
| `supabase/functions/send-nudge/` | SMS/WhatsApp sending |
| `supabase/functions/fetch-pexels/` | Cover photo search |
| `supabase/functions/create-checkout-session/` | Stripe checkout |
| `supabase/functions/stripe-webhook/` | Payment processing |

---

## Common Customizations

### Different Event Types

Modify `events` table:
- Add `event_type` column
- Create type-specific settings
- Build type-specific UI

### Different Communication Channels

Add new nudge channels:
- WhatsApp via Twilio
- Push notifications
- Slack integration

### Different Question Types

Extend `questions` table:
- Add new `type` values
- Build renderers for each type
- Handle validation

---

## Troubleshooting

### Build Errors

```bash
# Clear cache
rm -rf node_modules/.vite

# Reinstall dependencies
npm install
```

### Database Issues

```sql
-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'your_table';

-- Check table structure
\d public.your_table
```

### Auth Issues

- Check Supabase auth settings
- Verify email confirmation settings
- Check magic link configuration

---

## Resources

- [Lovable Documentation](https://docs.lovable.dev)
- [Supabase Documentation](https://supabase.com/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Framer Motion Documentation](https://www.framer.com/motion/)
