# Lockstep — Product Roadmap to Nirvana State

> **Purpose**: This document defines the complete 10/10 production-ready state of Lockstep. A junior software engineer should be able to read this and build any component from scratch, ready for customer acquisition.

---

## Table of Contents

1. [Vision & Philosophy](#1-vision--philosophy)
2. [Frontend Architecture](#2-frontend-architecture)
3. [Backend Architecture](#3-backend-architecture)
4. [Database Schema (Complete)](#4-database-schema-complete)
5. [Authentication & Security](#5-authentication--security)
6. [Data Pipeline & Workflows](#6-data-pipeline--workflows)
7. [AI/LLM Integration](#7-aillm-integration)
8. [Messaging System](#8-messaging-system)
9. [User Experience (UX)](#9-user-experience-ux)
10. [User Interface (UI)](#10-user-interface-ui)
11. [Motion & Animation](#11-motion--animation)
12. [API Specifications](#12-api-specifications)
13. [Performance & Scalability](#13-performance--scalability)
14. [Testing Strategy](#14-testing-strategy)
15. [Deployment & DevOps](#15-deployment--devops)
16. [Commercial Model](#16-commercial-model)
17. [Analytics & Observability](#17-analytics--observability)
18. [Privacy & Compliance](#18-privacy--compliance)
19. [Implementation Phases](#19-implementation-phases)
20. [Component Inventory](#20-component-inventory)

---

## 1. Vision & Philosophy

### What Lockstep IS
Lockstep is a **decision-closure system** for complex group events. It forces group decisions to resolve by deadlines without organisers manually chasing people.

### What Lockstep is NOT
- Not an event planner
- Not a calendar app
- Not a chat app
- Not a party invitation tool

### Core Jobs
1. Collect partial availability across multiple time blocks
2. Require specific answers by checkpoints (deadlines)
3. Automatically remind ONLY the people blocking progress
4. Produce a final, usable plan

### Design Philosophy
```
┌─────────────────────────────────────────────────────────────────┐
│  "If it doesn't reduce anxiety or cognitive load, remove it."  │
└─────────────────────────────────────────────────────────────────┘
```

**Non-negotiable principles:**
- One-hand, thumb-first mobile usage
- Single-screen task completion
- Minimal cognitive load
- No unnecessary choices
- No decorative UI
- Motion communicates progress, not delight

**Quality bar**: This should feel like a private Apple internal tool or high-end financial product — not a consumer party app.

---

## 2. Frontend Architecture

### Technology Stack
```
├── React 18+ (with TypeScript strict mode)
├── Vite (build tool)
├── Tailwind CSS (utility-first styling)
├── Framer Motion (animations)
├── React Router (client-side routing)
├── TanStack Query (server state management)
├── React Hook Form + Zod (form validation)
├── Radix UI / shadcn (accessible primitives)
└── date-fns (date manipulation)
```

### Directory Structure (Target State)
```
src/
├── assets/                    # Static assets (logos, icons)
├── components/
│   ├── ui/                    # Primitive components (button, input, etc.)
│   ├── patterns/              # Composite patterns (cards, lists)
│   ├── features/              # Feature-specific components
│   │   ├── rsvp/              # Guest RSVP flow
│   │   ├── dashboard/         # Organiser dashboard
│   │   ├── wizard/            # Event creation wizard
│   │   ├── timeline/          # Checkpoint timeline
│   │   └── messaging/         # Nudge previews
│   └── layout/                # Layout components (nav, footer)
├── hooks/                     # Custom React hooks
│   ├── use-event.ts
│   ├── use-guests.ts
│   ├── use-checkpoints.ts
│   ├── use-rsvp.ts
│   └── use-realtime.ts
├── lib/                       # Utilities
│   ├── utils.ts
│   ├── validators.ts
│   └── formatters.ts
├── pages/                     # Route pages
│   ├── Index.tsx              # Landing page
│   ├── Auth.tsx               # Organiser auth
│   ├── Dashboard.tsx          # Event list
│   ├── Event.tsx              # Single event view
│   ├── CreateEvent.tsx        # Wizard
│   ├── RSVP.tsx               # Guest RSVP (magic link)
│   └── Plan.tsx               # Final shareable plan
├── services/                  # API layer
│   ├── api.ts                 # Supabase client wrapper
│   └── queries/               # TanStack Query definitions
├── stores/                    # Global state (if needed)
├── styles/                    # Global styles
└── types/                     # TypeScript definitions
```

### State Management Strategy
| State Type | Solution |
|------------|----------|
| Server state | TanStack Query |
| Form state | React Hook Form |
| UI state | React useState/useReducer |
| Global app state | React Context (minimal) |
| Real-time | Supabase Realtime subscriptions |

### Routing Structure
```typescript
const routes = [
  // Public
  { path: '/', element: <Landing /> },
  { path: '/rsvp/:token', element: <RSVPFlow /> },
  { path: '/plan/:eventId', element: <PublicPlan /> },
  
  // Authenticated (Organiser)
  { path: '/auth', element: <Auth /> },
  { path: '/dashboard', element: <Dashboard /> },
  { path: '/events/new', element: <CreateEventWizard /> },
  { path: '/events/:id', element: <EventDetail /> },
  { path: '/events/:id/edit', element: <EditEvent /> },
  { path: '/events/:id/guests', element: <GuestManager /> },
  { path: '/events/:id/checkpoints', element: <CheckpointManager /> },
];
```

---

## 3. Backend Architecture

### Technology Stack
```
├── Supabase (PostgreSQL + Auth + Realtime + Storage + Edge Functions)
├── Edge Functions (Deno runtime)
│   ├── send-nudge/           # SMS/WhatsApp dispatch
│   ├── process-checkpoint/   # Checkpoint automation
│   ├── generate-summary/     # LLM integration
│   ├── webhook-twilio/       # Inbound message handler
│   └── stripe-webhook/       # Payment processing
└── Scheduled Jobs (pg_cron or external)
```

### Edge Function Inventory

#### 1. `send-nudge`
**Purpose**: Send SMS or WhatsApp nudges to guests
```typescript
// Input
interface SendNudgeRequest {
  guestId: string;
  checkpointId: string;
  channel: 'sms' | 'whatsapp';
  message: string;
}

// Logic
1. Validate guest exists and has phone number
2. Check opt-out status
3. Generate idempotency key: `${eventId}:${checkpointId}:${guestId}:${channel}`
4. Send via Twilio
5. Log to nudges table
6. Return delivery status
```

#### 2. `process-checkpoint`
**Purpose**: Triggered by cron at checkpoint time
```typescript
// Input
interface ProcessCheckpointRequest {
  checkpointId: string;
}

// Logic
1. Load checkpoint with related event, questions, guests
2. Identify guests with missing required answers
3. For each guest with missing answers:
   a. Compose personalized nudge message
   b. Call send-nudge function
4. Mark checkpoint as executed
5. If auto-resolution enabled, mark unanswered as "Out"
6. Trigger LLM summary generation
```

#### 3. `generate-summary`
**Purpose**: Generate AI summaries for organisers
```typescript
// Input
interface GenerateSummaryRequest {
  eventId: string;
  summaryType: 'status' | 'blockers' | 'suggestions';
}

// Logic
1. Fetch event data (sanitized, no PII)
2. Compose prompt based on summary type
3. Call LLM (OpenAI/Gemini via router)
4. Parse structured JSON response
5. Cache result in event.settings.summaries
6. Return summary
```

#### 4. `webhook-twilio`
**Purpose**: Handle inbound SMS/WhatsApp messages
```typescript
// Handles
- STOP → Update guest opt-out status
- HELP → Send help message
- Status callbacks → Update nudge delivery status
```

### Supabase Realtime Subscriptions
```sql
-- Tables enabled for realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.rsvps;
ALTER PUBLICATION supabase_realtime ADD TABLE public.guests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.nudges;
```

---

## 4. Database Schema (Complete)

### Core Tables

```sql
-- ============================================
-- EVENTS: Container for the entire gathering
-- ============================================
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organiser_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  timezone TEXT DEFAULT 'UTC',
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
  settings JSONB DEFAULT '{}'::jsonb,
  -- settings includes:
  -- {
  --   "whatsapp_enabled": boolean,
  --   "auto_resolution": boolean,
  --   "reminder_escalation": boolean,
  --   "template": "bucks" | "wedding" | "custom",
  --   "summaries": { cached AI summaries }
  -- }
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- BLOCKS: Time windows within an event
-- ============================================
CREATE TABLE public.blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  location TEXT,
  attendance_required BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- QUESTIONS: Data points to collect
-- ============================================
CREATE TABLE public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  block_id UUID REFERENCES public.blocks(id) ON DELETE CASCADE, -- NULL = global question
  prompt TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('boolean', 'single_select', 'multi_select', 'time_range', 'text', 'number')),
  options JSONB, -- For select types: ["Option A", "Option B"]
  required BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- CHECKPOINTS: Deadlines with required questions
-- ============================================
CREATE TABLE public.checkpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  name TEXT,
  trigger_at TIMESTAMPTZ NOT NULL,
  type TEXT DEFAULT 'reminder' CHECK (type IN ('reminder', 'deadline', 'final')),
  message TEXT, -- Custom message template
  required_question_ids UUID[], -- Which questions must be answered
  applicable_block_ids UUID[], -- Which blocks this applies to (NULL = all)
  auto_resolve_to TEXT CHECK (auto_resolve_to IN ('out', 'maybe', NULL)),
  executed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- GUESTS: Invitees
-- ============================================
CREATE TABLE public.guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  magic_token TEXT DEFAULT encode(gen_random_bytes(16), 'hex') UNIQUE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'responded', 'opted_out')),
  opted_out_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- RSVPS: Guest responses per block
-- ============================================
CREATE TABLE public.rsvps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id UUID REFERENCES public.guests(id) ON DELETE CASCADE NOT NULL,
  block_id UUID REFERENCES public.blocks(id) ON DELETE CASCADE NOT NULL,
  response TEXT NOT NULL CHECK (response IN ('in', 'out', 'maybe')),
  arrival_time TIMESTAMPTZ,
  departure_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(guest_id, block_id)
);

-- ============================================
-- ANSWERS: Responses to questions
-- ============================================
CREATE TABLE public.answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id UUID REFERENCES public.guests(id) ON DELETE CASCADE NOT NULL,
  question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE NOT NULL,
  value JSONB NOT NULL, -- Flexible: string, array, number, boolean
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(guest_id, question_id)
);

-- ============================================
-- NUDGES: Message audit log
-- ============================================
CREATE TABLE public.nudges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id UUID REFERENCES public.guests(id) ON DELETE CASCADE,
  checkpoint_id UUID REFERENCES public.checkpoints(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('sms', 'whatsapp', 'email')),
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'read')),
  idempotency_key TEXT UNIQUE,
  external_id TEXT, -- Twilio SID
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- SUBSCRIPTIONS: Billing (future)
-- ============================================
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  plan TEXT CHECK (plan IN ('free', 'per_event', 'annual')),
  status TEXT DEFAULT 'active',
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Indexes for Performance
```sql
CREATE INDEX idx_blocks_event_id ON public.blocks(event_id);
CREATE INDEX idx_questions_event_id ON public.questions(event_id);
CREATE INDEX idx_checkpoints_event_id ON public.checkpoints(event_id);
CREATE INDEX idx_checkpoints_trigger_at ON public.checkpoints(trigger_at) WHERE NOT executed;
CREATE INDEX idx_guests_event_id ON public.guests(event_id);
CREATE INDEX idx_guests_magic_token ON public.guests(magic_token);
CREATE INDEX idx_rsvps_guest_id ON public.rsvps(guest_id);
CREATE INDEX idx_rsvps_block_id ON public.rsvps(block_id);
CREATE INDEX idx_answers_guest_id ON public.answers(guest_id);
CREATE INDEX idx_nudges_checkpoint_id ON public.nudges(checkpoint_id);
CREATE INDEX idx_nudges_idempotency_key ON public.nudges(idempotency_key);
```

### Row Level Security (RLS)

```sql
-- Events: Organisers can only see/edit their own
CREATE POLICY "Organisers manage own events"
ON public.events FOR ALL
USING (auth.uid() = organiser_id)
WITH CHECK (auth.uid() = organiser_id);

-- Blocks, Questions, Checkpoints: Via event ownership
CREATE POLICY "Organisers manage via event"
ON public.blocks FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.events
  WHERE events.id = blocks.event_id
  AND events.organiser_id = auth.uid()
));

-- Guests: Organisers manage, guests can view own via magic token
CREATE POLICY "Organisers manage guests"
ON public.guests FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.events
  WHERE events.id = guests.event_id
  AND events.organiser_id = auth.uid()
));

-- RSVPs: Anyone can insert/update (guest flow is anonymous)
CREATE POLICY "Anyone can submit RSVP"
ON public.rsvps FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update RSVP"
ON public.rsvps FOR UPDATE USING (true);

CREATE POLICY "Organisers can view RSVPs"
ON public.rsvps FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.guests g
  JOIN public.events e ON e.id = g.event_id
  WHERE g.id = rsvps.guest_id
  AND e.organiser_id = auth.uid()
));
```

---

## 5. Authentication & Security

### Authentication Flow

#### Organisers
```
1. Sign up with email/password
2. Email confirmation (auto-confirm for MVP)
3. Session persisted via Supabase Auth
4. Protected routes check session
```

#### Guests (No Auth Required)
```
1. Receive magic link via SMS/WhatsApp
2. Link format: /rsvp/{magic_token}
3. Token validates guest identity
4. No login, no friction
```

### Security Measures

#### Input Validation
```typescript
// All inputs validated with Zod
const rsvpSchema = z.object({
  response: z.enum(['in', 'out', 'maybe']),
  arrivalTime: z.string().datetime().optional(),
  departureTime: z.string().datetime().optional(),
});
```

#### Rate Limiting
```typescript
// Edge function rate limits
const RATE_LIMITS = {
  'send-nudge': { requests: 100, window: '1h' },
  'generate-summary': { requests: 20, window: '1h' },
};
```

#### Data Sanitization for LLM
```typescript
// Never send PII to LLM
const sanitizeForLLM = (data: EventData) => ({
  guestCount: data.guests.length,
  respondedCount: data.guests.filter(g => g.status === 'responded').length,
  blockSummaries: data.blocks.map(b => ({
    name: b.name,
    inCount: countResponses(b.id, 'in'),
    outCount: countResponses(b.id, 'out'),
    maybeCount: countResponses(b.id, 'maybe'),
  })),
  // NO names, emails, phone numbers
});
```

#### Magic Token Security
- Tokens are 32 hex characters (128 bits of entropy)
- Tokens are single-use per session (optional: expire after first use)
- Tokens can be regenerated by organiser

---

## 6. Data Pipeline & Workflows

### Event Lifecycle
```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  DRAFT   │───▶│  ACTIVE  │───▶│ COMPLETED│───▶│ ARCHIVED │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
     │               │               │
     │               │               │
     ▼               ▼               ▼
  Editing       Collecting       Viewable
  Blocks        RSVPs            Read-only
  Questions     Nudges           Export
  Guests        Checkpoints      Analytics
```

### Checkpoint Execution Pipeline
```
┌─────────────────────────────────────────────────────────────────┐
│ CRON: Every minute, check for checkpoints where:               │
│   trigger_at <= NOW() AND executed = false                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 1. Load checkpoint with event, blocks, questions, guests       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. For each guest, check required questions:                   │
│    - If block-level: Check RSVPs for applicable blocks         │
│    - If global: Check answers table                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. Identify guests with missing answers (blockers)             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. For each blocker:                                           │
│    - Compose nudge message (with LLM for tone, or template)    │
│    - Generate deep-link to missing fields only                 │
│    - Send via preferred channel (WhatsApp → SMS fallback)      │
│    - Log to nudges table                                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. If auto_resolve_to is set AND checkpoint.type = 'deadline': │
│    - Mark unanswered guests as auto_resolve_to value           │
│    - Update their RSVP records                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. Mark checkpoint as executed                                 │
│ 7. Trigger generate-summary for organiser                      │
└─────────────────────────────────────────────────────────────────┘
```

### RSVP Submission Flow
```
Guest taps magic link
        │
        ▼
┌───────────────────┐
│ Load guest + event│
│ + blocks          │
└───────────────────┘
        │
        ▼
┌───────────────────┐
│ Display RSVP form │
│ Pre-fill existing │
└───────────────────┘
        │
        ▼
┌───────────────────┐
│ Guest submits     │
└───────────────────┘
        │
        ▼
┌───────────────────┐
│ Validate input    │
│ (Zod schema)      │
└───────────────────┘
        │
        ▼
┌───────────────────┐
│ Upsert RSVPs      │
│ Upsert Answers    │
│ Update guest      │
│ status='responded'│
└───────────────────┘
        │
        ▼
┌───────────────────┐
│ Show confirmation │
│ "You're all set"  │
└───────────────────┘
        │
        ▼
┌───────────────────┐
│ Realtime update   │
│ Dashboard         │
└───────────────────┘
```

---

## 7. AI/LLM Integration

### Available Models (via Lovable AI Gateway or direct)
| Model | Use Case | Cost |
|-------|----------|------|
| `google/gemini-2.5-flash` | Default for summaries, suggestions | Low |
| `openai/gpt-5` | Complex reasoning, nuanced copy | High |
| `google/gemini-2.5-flash-lite` | Simple classification | Lowest |

### LLM Use Cases

#### 1. Organiser Summaries
```typescript
interface StatusSummary {
  headline: string; // "8 of 12 confirmed for Saturday"
  blockers: string[]; // ["3 guests haven't responded to dietary"]
  confidence: 'high' | 'medium' | 'low';
}

// Prompt template
const prompt = `
You are summarizing RSVP status for an event organiser.
Be direct, factual, and calm. No emojis. No excitement.

Event: ${sanitizedData.blockCount} time blocks
Guests: ${sanitizedData.guestCount} invited
Responded: ${sanitizedData.respondedCount}

Per-block summary:
${sanitizedData.blockSummaries.map(b => 
  `- ${b.name}: ${b.inCount} in, ${b.outCount} out, ${b.maybeCount} maybe`
).join('\n')}

Missing answers:
${sanitizedData.missingByQuestion.map(q =>
  `- ${q.prompt}: ${q.missingCount} guests`
).join('\n')}

Respond in JSON: { headline, blockers, confidence }
`;
```

#### 2. Suggested Next Actions
```typescript
interface SuggestedAction {
  action: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
}

// Examples:
// "Send reminder to 3 guests who haven't confirmed Saturday dinner"
// "Consider removing Sunday brunch - only 2 confirmed"
```

#### 3. Nudge Copy Generation
```typescript
interface NudgeCopy {
  subject?: string; // For email
  body: string;
  tone: 'friendly' | 'urgent' | 'final';
}

// Template inputs:
// - Guest name
// - Event title
// - Missing fields
// - Days until event
// - Escalation level (1, 2, 3)
```

### LLM Router Architecture
```typescript
// supabase/functions/_shared/llm-router.ts
export async function callLLM(request: LLMRequest): Promise<LLMResponse> {
  const { model = 'google/gemini-2.5-flash', messages, tools } = request;
  
  // Route to appropriate provider
  if (model.startsWith('openai/')) {
    return callOpenAI(request);
  } else if (model.startsWith('google/')) {
    return callGoogleAI(request);
  }
  
  // Default to Lovable AI Gateway
  return callLovableGateway(request);
}
```

### Token Budgets
| Job Type | Max Tokens | Model |
|----------|------------|-------|
| Status summary | 500 | gemini-flash |
| Next actions | 300 | gemini-flash |
| Nudge copy | 200 | gemini-flash-lite |
| Complex reasoning | 1000 | gpt-5 |

---

## 8. Messaging System

### Channels
| Channel | Provider | Use Case |
|---------|----------|----------|
| SMS | Twilio | Default, always works |
| WhatsApp | Twilio | Opt-in, richer experience |
| Email | Resend | Formal communications |

### Message Types

#### 1. Initial Invitation
```
Hey [Name]! You're invited to [Event Title].

Tap to RSVP: [magic_link]

Takes 30 seconds. [Organiser Name] needs your answer by [deadline].
```

#### 2. Friendly Reminder (Escalation 1)
```
Quick reminder: [Organiser Name] is waiting on your RSVP for [Event Title].

Missing: [Block/Question list]

Tap to complete: [deep_link]
```

#### 3. Booking Warning (Escalation 2)
```
[Event Title] bookings close soon.

Without your response, [Organiser Name] can't confirm numbers.

Please respond: [deep_link]
```

#### 4. Final Notice (Escalation 3)
```
Final call: Your RSVP for [Event Title] is needed now.

If we don't hear back by [deadline], you'll be marked as "not attending".

[deep_link]
```

### Deep Links
```
Standard: /rsvp/{magic_token}
Targeted: /rsvp/{magic_token}?focus=block:{blockId}
Targeted: /rsvp/{magic_token}?focus=question:{questionId}
```

### Inbound Message Handling
```typescript
// Webhook: /functions/v1/webhook-twilio
switch (body.Body?.toUpperCase()) {
  case 'STOP':
    await optOutGuest(phoneNumber);
    reply('You have been unsubscribed. Reply START to resubscribe.');
    break;
  case 'START':
    await optInGuest(phoneNumber);
    reply('You have been resubscribed to event updates.');
    break;
  case 'HELP':
    reply('Reply STOP to unsubscribe. Questions? Contact the event organiser.');
    break;
}
```

### Idempotency
```typescript
const idempotencyKey = `${eventId}:${checkpointId}:${guestId}:${channel}`;
// Check if nudge with this key exists before sending
```

---

## 9. User Experience (UX)

### Guest RSVP Flow (Target: <30 seconds)
```
┌─────────────────────────────────────────────────────────────────┐
│ Step 1: Tap magic link (0s)                                    │
├─────────────────────────────────────────────────────────────────┤
│ Step 2: See event details + your name (2s)                     │
├─────────────────────────────────────────────────────────────────┤
│ Step 3: Toggle blocks In/Out/Maybe (10s)                       │
├─────────────────────────────────────────────────────────────────┤
│ Step 4: Set arrival/departure sliders (5s)                     │
├─────────────────────────────────────────────────────────────────┤
│ Step 5: Answer global questions (10s)                          │
│         - Budget range                                         │
│         - Dietary (multi-select)                               │
│         - Transport                                            │
├─────────────────────────────────────────────────────────────────┤
│ Step 6: Submit (2s)                                            │
├─────────────────────────────────────────────────────────────────┤
│ Step 7: Confirmation screen "You're all set" (1s)              │
└─────────────────────────────────────────────────────────────────┘

TOTAL: ~30 seconds
```

### Organiser Event Creation (Target: <5 minutes)
```
┌─────────────────────────────────────────────────────────────────┐
│ Step 1: Basic Info (1 min)                                     │
│         - Event name                                           │
│         - Date range                                           │
│         - Location                                             │
│         - Timezone                                             │
├─────────────────────────────────────────────────────────────────┤
│ Step 2: Define Blocks (1 min)                                  │
│         - Use template (Bucks Weekend) OR                      │
│         - Custom blocks                                        │
│         - Drag to reorder                                      │
├─────────────────────────────────────────────────────────────────┤
│ Step 3: Questions (1 min)                                      │
│         - Global questions (dietary, budget, transport)        │
│         - Block-specific questions                             │
├─────────────────────────────────────────────────────────────────┤
│ Step 4: Checkpoints (1 min)                                    │
│         - Use defaults OR                                      │
│         - Custom checkpoints                                   │
│         - Set auto-resolution rules                            │
├─────────────────────────────────────────────────────────────────┤
│ Step 5: Add Guests (1 min)                                     │
│         - Paste phone numbers OR                               │
│         - Upload CSV                                           │
│         - Choose SMS or WhatsApp                               │
├─────────────────────────────────────────────────────────────────┤
│ Step 6: Review & Launch                                        │
└─────────────────────────────────────────────────────────────────┘
```

### Dashboard Information Hierarchy
```
┌─────────────────────────────────────────────────────────────────┐
│ PRIMARY: What is blocking this plan?                           │
│          → Open loops list (guests who haven't responded)      │
│          → One-tap nudge buttons                               │
├─────────────────────────────────────────────────────────────────┤
│ SECONDARY: Current status                                      │
│            → Headcount per block (bar chart)                   │
│            → Arrival/departure heatmap                         │
├─────────────────────────────────────────────────────────────────┤
│ TERTIARY: AI insights                                          │
│           → LLM summary                                        │
│           → Suggested next actions                             │
├─────────────────────────────────────────────────────────────────┤
│ ACTIONS:                                                       │
│           → Send nudges                                        │
│           → Export data                                        │
│           → Share final plan                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 10. User Interface (UI)

### Color System
```css
/* index.css */
:root {
  /* Background */
  --background: 222 14% 7%;        /* #0E1116 - Near-black charcoal */
  --foreground: 220 20% 97%;       /* #F5F7FA - Soft off-white */
  
  /* Primary accent - Decisive blue-violet */
  --primary: 235 100% 68%;         /* #5B6CFF */
  --primary-foreground: 220 20% 97%;
  
  /* Secondary text */
  --muted: 215 16% 65%;            /* #9AA3AF */
  --muted-foreground: 215 16% 47%;
  
  /* Status colors - muted, not alarming */
  --status-in: 156 52% 50%;        /* #3FB984 - Muted green */
  --status-maybe: 38 72% 65%;      /* #E6B566 - Amber */
  --status-out: 0 52% 62%;         /* #D46A6A - Restrained red */
  
  /* Card surfaces */
  --card: 222 14% 10%;
  --card-foreground: 220 20% 97%;
  
  /* Borders */
  --border: 222 14% 20%;
  
  /* Radius */
  --radius: 1rem;                  /* 16-24px */
}
```

### Typography
```css
/* Primary: Modern editorial sans-serif */
--font-sans: 'Inter', system-ui, sans-serif;

/* Display: For headlines (optional) */
--font-display: 'Söhne', 'Inter', system-ui, sans-serif;

/* Type scale */
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
--text-4xl: 2.25rem;   /* 36px */
```

### Spacing (8pt Grid)
```css
--space-1: 0.25rem;  /* 4px */
--space-2: 0.5rem;   /* 8px */
--space-3: 0.75rem;  /* 12px */
--space-4: 1rem;     /* 16px */
--space-5: 1.25rem;  /* 20px */
--space-6: 1.5rem;   /* 24px */
--space-8: 2rem;     /* 32px */
--space-10: 2.5rem;  /* 40px */
--space-12: 3rem;    /* 48px */
```

### Core Components

#### 1. Block Card
```tsx
interface BlockCardProps {
  block: Block;
  response?: 'in' | 'out' | 'maybe';
  onResponseChange: (response: 'in' | 'out' | 'maybe') => void;
}

// Visual: Rounded card with block name, time, location
// Contains: Segmented control (In / Maybe / Out)
// States: Default, Selected, Disabled
```

#### 2. Segmented Control
```tsx
interface SegmentedControlProps {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}

// Visual: 3-segment toggle (In / Maybe / Out)
// Animation: Sliding indicator
// Colors: Use status colors based on selection
```

#### 3. Time Range Slider
```tsx
interface TimeRangeSliderProps {
  min: Date;
  max: Date;
  value: [Date, Date];
  onChange: (value: [Date, Date]) => void;
}

// Visual: Dual-handle slider with time labels
// Thumb zone: Large touch targets
// Snapping: 15-minute increments
```

#### 4. Open Loops List
```tsx
interface OpenLoopsListProps {
  guests: Guest[];
  missingFields: Map<string, string[]>;
  onNudge: (guestId: string) => void;
}

// Visual: List of guests with missing items
// Action: One-tap nudge button per guest
// Sorting: Most critical first
```

#### 5. Checkpoint Timeline
```tsx
interface CheckpointTimelineProps {
  checkpoints: Checkpoint[];
  currentDate: Date;
}

// Visual: Vertical timeline with checkpoint nodes
// States: Past (dimmed), Current (active), Future
// Indicators: Executed, Pending, Failed
```

#### 6. Heatmap Grid
```tsx
interface HeatmapGridProps {
  blocks: Block[];
  timeSlots: Date[];
  data: { blockId: string; time: Date; count: number }[];
}

// Visual: Grid showing arrival/departure density
// Colors: Intensity based on guest count
// Interaction: Tap to see names
```

---

## 11. Motion & Animation

### Principles
1. Motion exists only to indicate progress, signal completion, reduce uncertainty, or confirm irreversible actions
2. Motion must NEVER entertain, distract, or compete for attention
3. No bouncing, no elastic easing, no playful micro-interactions

### Timing Guidelines
```typescript
const transitions = {
  page: { duration: 0.4, ease: [0.4, 0, 0.2, 1] },       // Slow, smooth
  stateChange: { duration: 0.2, ease: 'easeInOut' },     // Gentle fade
  progressFill: { duration: 0.6, ease: 'linear' },       // Deliberate
  success: { duration: 0.3, ease: 'easeOut' },           // Quiet resolve
};
```

### Key Animations

#### 1. Page Transitions
```tsx
<motion.div
  initial={{ opacity: 0, x: 20 }}
  animate={{ opacity: 1, x: 0 }}
  exit={{ opacity: 0, x: -20 }}
  transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
>
  {children}
</motion.div>
```

#### 2. State Changes
```tsx
// Fade, never snap
<motion.div
  animate={{ opacity: isVisible ? 1 : 0 }}
  transition={{ duration: 0.2 }}
/>
```

#### 3. Progress Indicators
```tsx
// Slow, deliberate fill
<motion.div
  className="bg-primary h-1"
  initial={{ width: '0%' }}
  animate={{ width: `${progress}%` }}
  transition={{ duration: 0.6, ease: 'linear' }}
/>
```

#### 4. RSVP Submit Success
```tsx
// Quiet, resolved - not celebratory
<motion.div
  initial={{ scale: 0.95, opacity: 0 }}
  animate={{ scale: 1, opacity: 1 }}
  transition={{ duration: 0.3, ease: 'easeOut' }}
>
  <Check className="text-status-in" />
  <span>You're all set</span>
</motion.div>
```

#### 5. Accent Color Animation
```tsx
// Accent color ONLY animates on commit actions
const commitActions = ['rsvp_submit', 'checkpoint_locked', 'nudge_sent'];

<motion.button
  whileTap={{ scale: 0.98 }}
  animate={{ 
    backgroundColor: isCommitting ? 'hsl(var(--primary))' : undefined 
  }}
/>
```

### Lottie Usage (Selective)
- **Allowed**: Hero moments (event completion, final plan generated)
- **Not allowed**: Loading spinners, decorative elements

---

## 12. API Specifications

### Public Endpoints (No Auth)

#### GET /rsvp/:token
```typescript
// Load guest RSVP form data
Response: {
  guest: { id, name },
  event: { id, title, startDate, endDate, location },
  blocks: Block[],
  questions: Question[],
  existingRsvps: RSVP[],
  existingAnswers: Answer[]
}
```

#### POST /rsvp/:token
```typescript
// Submit RSVP
Request: {
  rsvps: { blockId: string, response: 'in' | 'out' | 'maybe', arrivalTime?, departureTime? }[],
  answers: { questionId: string, value: any }[]
}
Response: { success: true }
```

#### GET /plan/:eventId
```typescript
// Public shareable plan
Response: {
  event: { title, startDate, endDate, location },
  blocks: { name, startTime, endTime, headcount }[],
  generatedAt: Date
}
```

### Protected Endpoints (Organiser Auth)

#### GET /api/events
```typescript
Response: { events: Event[] }
```

#### POST /api/events
```typescript
Request: {
  title: string,
  startDate: Date,
  endDate: Date,
  location?: string,
  timezone: string,
  template?: 'bucks' | 'wedding' | 'custom'
}
Response: { event: Event }
```

#### GET /api/events/:id/dashboard
```typescript
Response: {
  event: Event,
  blocks: Block[],
  guests: Guest[],
  rsvps: RSVP[],
  checkpoints: Checkpoint[],
  summary: LLMSummary,
  openLoops: { guestId: string, missing: string[] }[]
}
```

#### POST /api/events/:id/nudge
```typescript
Request: {
  guestIds: string[],
  channel: 'sms' | 'whatsapp',
  message?: string // Optional custom message
}
Response: { sent: number, failed: number }
```

---

## 13. Performance & Scalability

### Targets
| Metric | Target |
|--------|--------|
| First Contentful Paint | < 1.5s |
| Largest Contentful Paint | < 2.5s |
| Time to Interactive | < 3s |
| RSVP submission | < 500ms |
| Dashboard load | < 2s |

### Strategies

#### 1. Code Splitting
```typescript
// Lazy load routes
const Dashboard = lazy(() => import('./pages/Dashboard'));
const RSVPFlow = lazy(() => import('./pages/RSVPFlow'));
```

#### 2. Image Optimization
```typescript
// All images served via Supabase Storage with transforms
const getOptimizedImage = (path: string, width: number) =>
  `${SUPABASE_URL}/storage/v1/object/public/${path}?width=${width}`;
```

#### 3. Query Optimization
```sql
-- Use partial indexes
CREATE INDEX idx_checkpoints_pending 
ON public.checkpoints(trigger_at) 
WHERE NOT executed;

-- Batch queries with joins
SELECT e.*, 
  (SELECT COUNT(*) FROM guests WHERE event_id = e.id) as guest_count,
  (SELECT COUNT(*) FROM guests WHERE event_id = e.id AND status = 'responded') as responded_count
FROM events e
WHERE e.organiser_id = $1;
```

#### 4. Caching Strategy
```typescript
// TanStack Query cache times
const queryConfig = {
  staleTime: 30_000,      // 30 seconds
  gcTime: 5 * 60_000,     // 5 minutes
};

// LLM summaries cached in event.settings
// Invalidated on checkpoint execution
```

#### 5. Realtime Efficiency
```typescript
// Subscribe only to necessary channels
const channel = supabase
  .channel(`event:${eventId}`)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'rsvps',
    filter: `guest_id=in.(${guestIds.join(',')})`,
  }, handleUpdate);
```

---

## 14. Testing Strategy

### Unit Tests
```typescript
// Components
describe('BlockCard', () => {
  it('renders block name and time');
  it('calls onChange when response selected');
  it('applies correct status color');
});

// Utilities
describe('formatTimeRange', () => {
  it('formats same-day range');
  it('formats multi-day range');
});
```

### Integration Tests
```typescript
// RSVP Flow
describe('RSVP Flow', () => {
  it('loads guest data from magic token');
  it('submits RSVP and shows confirmation');
  it('updates dashboard via realtime');
});

// Checkpoint Processing
describe('process-checkpoint', () => {
  it('identifies guests with missing answers');
  it('sends nudges only to blockers');
  it('marks checkpoint as executed');
});
```

### E2E Tests (Playwright)
```typescript
test('organiser creates event and invites guests', async ({ page }) => {
  await page.goto('/auth');
  // ... login
  await page.goto('/events/new');
  // ... complete wizard
  // ... verify event created
});

test('guest completes RSVP in under 30 seconds', async ({ page }) => {
  const start = Date.now();
  await page.goto('/rsvp/test-token');
  // ... complete RSVP
  const duration = Date.now() - start;
  expect(duration).toBeLessThan(30000);
});
```

### Load Testing
```yaml
# k6 script for checkpoint processing
scenarios:
  checkpoint_spike:
    executor: 'ramping-vus'
    stages:
      - duration: '1m', target: 100
      - duration: '5m', target: 100
      - duration: '1m', target: 0
```

---

## 15. Deployment & DevOps

### Environments
| Environment | Purpose | URL |
|-------------|---------|-----|
| Development | Local dev | localhost:5173 |
| Staging | Pre-production testing | staging.lockstep.app |
| Production | Live users | lockstep.app |

### CI/CD Pipeline
```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run test
      - run: npm run lint

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run build
      - uses: lovable/deploy-action@v1
```

### Edge Function Deployment
```bash
# Edge functions deploy automatically with code changes
# Manual deploy for testing:
supabase functions deploy send-nudge --project-ref $PROJECT_ID
```

### Environment Variables
```bash
# .env (managed by Lovable)
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=

# Supabase Secrets (managed via Lovable Cloud)
OPENAI_API_KEY=
GOOGLE_AI_API_KEY=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
RESEND_API_KEY=
STRIPE_SECRET_KEY=  # Add when going to production
```

### Monitoring & Alerts
```typescript
// Sentry for error tracking
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});

// Alert conditions:
// - Nudge failure rate > 5%
// - LLM response time > 5s
// - Checkpoint processing failure
// - Error rate spike
```

---

## 16. Commercial Model

### Pricing Tiers

| Tier | Price | Limits |
|------|-------|--------|
| Free | $0 | 1 event, 8 guests, limited nudges |
| Per Event | $19 | Unlimited guests, full messaging |
| Annual | $49/year | Unlimited events + guests |

### Stripe Integration
```typescript
// supabase/functions/stripe-webhook/index.ts
switch (event.type) {
  case 'checkout.session.completed':
    await activateSubscription(session.customer);
    break;
  case 'customer.subscription.deleted':
    await deactivateSubscription(session.customer);
    break;
}
```

### Paywall Enforcement
```typescript
// Check before event creation
const canCreateEvent = async (userId: string) => {
  const { plan, eventsCreated } = await getSubscription(userId);
  
  if (plan === 'free' && eventsCreated >= 1) return false;
  if (plan === 'per_event') return await hasActiveEventPurchase(userId);
  if (plan === 'annual') return true;
  
  return false;
};
```

---

## 17. Analytics & Observability

### Key Metrics
| Metric | Definition | Target |
|--------|------------|--------|
| RSVP completion rate | RSVPs submitted / magic links clicked | > 70% |
| Time to complete RSVP | Median time from link click to submit | < 30s |
| Nudge effectiveness | RSVPs after nudge / nudges sent | > 40% |
| Event completion rate | Events reaching "completed" status | > 80% |
| Organiser retention | Organisers creating 2nd event within 90 days | > 30% |

### Analytics Events
```typescript
// Track with PostHog or similar
track('rsvp_started', { eventId, guestId });
track('rsvp_completed', { eventId, guestId, duration });
track('nudge_sent', { eventId, channel, escalationLevel });
track('nudge_converted', { eventId, guestId, minutesSinceNudge });
track('event_completed', { eventId, guestCount, responseRate });
```

### Dashboard Metrics (Internal)
```sql
-- Daily active organisers
SELECT COUNT(DISTINCT organiser_id) 
FROM events 
WHERE updated_at > NOW() - INTERVAL '24 hours';

-- RSVP funnel
SELECT 
  COUNT(*) FILTER (WHERE magic_link_clicked) as clicks,
  COUNT(*) FILTER (WHERE status = 'responded') as completions
FROM guests
WHERE created_at > NOW() - INTERVAL '7 days';
```

---

## 18. Privacy & Compliance

### Data Handling

#### PII Inventory
| Data | Where Stored | Encryption | Retention |
|------|--------------|------------|-----------|
| Phone numbers | guests.phone | At rest | Event + 90 days |
| Email addresses | guests.email | At rest | Event + 90 days |
| Names | guests.name | At rest | Event + 90 days |
| RSVP responses | rsvps | At rest | Event + 1 year |

#### LLM Data Rules
```typescript
// NEVER send to LLM:
// - Phone numbers
// - Email addresses
// - Full names
// - Any raw PII

// ALLOWED:
// - Anonymized counts
// - Block names
// - Aggregate statistics
```

### GDPR Compliance
```typescript
// Data export endpoint
GET /api/me/export
Response: { events, rsvps, answers } // All user data as JSON

// Data deletion endpoint
DELETE /api/me
// Cascades to all related data
```

### Opt-Out Handling
```typescript
// Inbound STOP message
await supabase
  .from('guests')
  .update({ status: 'opted_out', opted_out_at: new Date() })
  .eq('phone', phoneNumber);

// Never send to opted-out guests
const sendableGuests = guests.filter(g => g.status !== 'opted_out');
```

### Cookie Policy
```
// Essential only - no tracking cookies
// Session authentication via Supabase Auth
// No third-party cookies
```

---

## 19. Implementation Phases

### Phase 1: Foundation (Weeks 1-2)
- [x] Database schema with RLS
- [x] Auth flow for organisers
- [x] Basic RSVP page (magic link)
- [x] SMS sending via Twilio (Edge Function created)
- [x] Event creation (wizard-based)

### Phase 2: Core Flow (Weeks 3-4)
- [x] Checkpoint system
- [x] Automated nudge sending (Edge Function created)
- [x] Guest management UI
- [x] Dashboard with headcounts
- [x] Block CRUD

### Phase 3: Polish (Weeks 5-6)
- [x] Event creation wizard (animated, 6-step conversational)
- [x] Framer Motion transitions
- [ ] Heatmap visualization
- [x] Open loops list with one-tap nudge
- [x] Mobile-first responsive design

### Phase 4: Messaging (Weeks 7-8)
- [x] WhatsApp integration (Edge Function ready)
- [ ] Inbound message handling (STOP, HELP)
- [ ] Status callbacks
- [ ] Escalation logic
- [x] Deep links to missing fields

### Phase 5: AI (Weeks 9-10)
- [x] LLM router setup (Google AI primary, OpenAI fallback)
- [x] Status summaries (Edge Function created)
- [x] Suggested next actions
- [x] Tone-aware nudge copy
- [ ] Summary caching

### Phase 6: Launch (Weeks 11-12)
- [x] Stripe integration (Checkout + Webhooks)
- [x] Pricing page with tier comparison
- [x] Profile page with account settings
- [ ] Shareable final plan page
- [ ] CSV export
- [ ] Bug fixes and polish
- [ ] Beta user testing
- [x] Production deployment (Vercel configured)

---

## 20. Component Inventory

### Page Components
| Component | Priority | Status |
|-----------|----------|--------|
| LandingPage | P0 | ✅ Built |
| AuthPage | P0 | ✅ Built |
| CreateEventWizard | P0 | ✅ Built (6-step conversational) |
| RSVPPage | P0 | ✅ Built (with positive bias) |
| DashboardPage | P0 | ✅ Built (with AI insights) |
| EventDetailPage | P1 | ✅ Built |
| PricingPage | P1 | ✅ Built (Stripe integration) |
| ProfilePage | P1 | ✅ Built (account settings) |
| GuestManagerPage | P2 | 🔜 Planned |
| PublicPlanPage | P2 | 🔜 Planned |

### UI Components
| Component | Priority | Status |
|-----------|----------|--------|
| Button (variants) | P0 | ✅ Built |
| Card | P0 | ✅ Built |
| Input | P0 | ✅ Built |
| SegmentedControl | P0 | ✅ Built (in RSVP) |
| BlockCard | P0 | ✅ Built |
| OpenLoopsList | P0 | ✅ Built |
| StepperWizard | P0 | ✅ Built |
| PlacesAutocomplete | P0 | ✅ Built (Google Places) |
| EventTypeCard | P0 | ✅ Built |
| WeekendPicker | P0 | ✅ Built |
| AIGeneratedCard | P0 | ✅ Built |
| CoverPhotoSelector | P1 | ✅ Built (Pexels API) |
| PhoneInput | P0 | ✅ Built (Country codes) |
| UsageIndicator | P1 | ✅ Built (Tier limits) |
| UpgradeModal | P1 | ✅ Built (Stripe checkout) |
| TimeRangeSlider | P2 | 🔜 Planned |
| CheckpointTimeline | P2 | 🔜 Planned |
| HeatmapGrid | P2 | 🔜 Planned |

### Edge Functions
| Function | Priority | Status |
|----------|----------|--------|
| generate-description | P0 | ✅ Built (Google AI / Gemini) |
| generate-summary | P0 | ✅ Built (Organizer insights) |
| send-nudge | P0 | ✅ Built (Twilio SMS/WhatsApp) |
| fetch-pexels | P1 | ✅ Built (Cover photos) |
| create-checkout-session | P0 | ✅ Built (Stripe Checkout) |
| stripe-webhook | P0 | ✅ Built (Payment callbacks) |
| process-checkpoint | P1 | 🔜 Planned (Automated nudges) |
| webhook-twilio | P2 | 🔜 Planned (Inbound messages) |

### Event Templates
| Template | Status |
|----------|--------|
| Bucks Party | ✅ Built |
| Hens Party | ✅ Built |
| Wedding | ✅ Built |
| Birthday | ✅ Built |
| Reunion | ✅ Built |
| Trip | ✅ Built |
| Team Offsite | ✅ Built |
| Custom | ✅ Built |

---

## Appendix: Quick Reference

### Magic Token URL Format
```
Production: https://inlockstep.ai/rsvp/{32-char-hex-token}
Development: http://localhost:8080/rsvp/{token}
```

### Default Checkpoint Template (Bucks Weekend)
```
T-21 days: Overall attendance
T-14 days: Block attendance + dietary
T-7 days: Final headcount
T-2 days: Arrival/departure confirmation
```

### Block Template (Bucks Weekend)
```
1. Friday Night
2. Saturday Daytime
3. Saturday Dinner
4. Saturday Night
5. Sunday Brunch
```

### Status Color Usage
```
In: hsl(156, 52%, 50%)      // #3FB984
Maybe: hsl(38, 72%, 65%)    // #E6B566
Out: hsl(0, 52%, 62%)       // #D46A6A
```

### Animation Easing
```
Page transitions: [0.4, 0, 0.2, 1] (slow, smooth)
State changes: 'easeInOut' (gentle)
Progress: 'linear' (deliberate)
```

---

*This document is the single source of truth for building Lockstep to production-ready state. All implementation decisions should reference this roadmap.*
