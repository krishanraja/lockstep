# Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │   React     │  │   Framer    │  │      Tanstack Query     │ │
│  │   Router    │  │   Motion    │  │     (Data Fetching)     │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
│                              │                                   │
│                    ┌─────────▼─────────┐                        │
│                    │  Supabase Client  │                        │
│                    └─────────┬─────────┘                        │
└──────────────────────────────┼──────────────────────────────────┘
                               │ HTTPS
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SUPABASE PLATFORM                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │  PostgREST  │  │   Auth      │  │    Edge Functions       │ │
│  │  (API)      │  │  (GoTrue)   │  │    (Deno)               │ │
│  └──────┬──────┘  └──────┬──────┘  └───────────┬─────────────┘ │
│         │                │                      │               │
│         ▼                ▼                      ▼               │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    PostgreSQL Database                      ││
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────────┐││
│  │  │ events │ │ blocks │ │ guests │ │ rsvps  │ │ checkpoints│││
│  │  └────────┘ └────────┘ └────────┘ └────────┘ └────────────┘││
│  │                       + RLS Policies                        ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                     EXTERNAL SERVICES                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │   Twilio    │  │   Resend    │  │   OpenAI / Google AI    │ │
│  │   (SMS)     │  │   (Email)   │  │   (Summaries)           │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Frontend Architecture

### Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Framework | React 18 | Component-based UI |
| Language | TypeScript | Type safety |
| Build | Vite | Fast dev server, optimized builds |
| Routing | React Router 6 | Client-side navigation |
| Styling | Tailwind CSS | Utility-first CSS |
| Components | shadcn/ui | Accessible, customizable UI primitives |
| Animation | Framer Motion | Declarative animations |
| Data | Tanstack Query | Server state management |

### Directory Structure

```
src/
├── components/
│   ├── ui/              # shadcn/ui components (button, card, etc.)
│   ├── EventWizard/     # Multi-step event creation
│   ├── animations/      # Reveal, KineticText, etc.
│   ├── Hero.tsx         # Landing page hero
│   ├── Features.tsx     # Feature grid
│   ├── RSVPDemo.tsx     # Interactive demo
│   └── SlideController.tsx
│
├── hooks/
│   ├── use-auto-play.ts        # Carousel auto-advance
│   ├── use-swipe.ts            # Touch gestures
│   ├── use-transition-feedback.ts  # Sound/haptics
│   └── use-mobile.tsx          # Responsive detection
│
├── pages/
│   ├── Index.tsx        # Landing page
│   ├── Auth.tsx         # Login/signup
│   ├── CreateEvent.tsx  # Event wizard
│   └── NotFound.tsx     # 404
│
├── integrations/
│   └── supabase/
│       ├── client.ts    # Supabase client instance
│       └── types.ts     # Generated TypeScript types
│
├── lib/
│   └── utils.ts         # Utility functions (cn, etc.)
│
├── index.css            # Global styles, CSS variables
└── main.tsx             # App entry point
```

### Component Patterns

**1. Compound Components**
```tsx
<SlideController>
  <Slide1 />
  <Slide2 />
  <Slide3 />
</SlideController>
```

**2. Render Props for Flexibility**
```tsx
<Reveal animation="fadeUp" delay={0.2}>
  {(ref) => <div ref={ref}>Content</div>}
</Reveal>
```

**3. Custom Hooks for Logic**
```tsx
const { goNext, goPrev, currentSlide } = useSlideController();
const { play, pause, isPlaying } = useAutoPlay(goNext, 6000);
```

---

## Backend Architecture

### Database Schema

```
┌──────────────┐       ┌──────────────┐
│    events    │       │    blocks    │
├──────────────┤       ├──────────────┤
│ id (PK)      │◄──────│ event_id (FK)│
│ organiser_id │       │ id (PK)      │
│ title        │       │ name         │
│ description  │       │ start_time   │
│ start_date   │       │ end_time     │
│ end_date     │       │ order_index  │
│ location     │       └──────┬───────┘
│ timezone     │              │
│ settings     │              │
│ status       │              │
└──────────────┘              │
       │                      │
       │                      ▼
       │               ┌──────────────┐
       │               │    rsvps     │
       │               ├──────────────┤
       │               │ id (PK)      │
       │               │ guest_id (FK)│───┐
       │               │ block_id (FK)│   │
       │               │ response     │   │
       │               │ arrival_time │   │
       │               │ departure    │   │
       │               └──────────────┘   │
       │                                  │
       ▼                                  ▼
┌──────────────┐              ┌──────────────┐
│  questions   │              │    guests    │
├──────────────┤              ├──────────────┤
│ event_id (FK)│              │ event_id (FK)│
│ id (PK)      │              │ id (PK)      │
│ prompt       │              │ name         │
│ type         │              │ email        │
│ options      │              │ phone        │
│ required     │              │ magic_token  │
│ order_index  │              │ status       │
└──────────────┘              └──────┬───────┘
                                     │
                                     ▼
                              ┌──────────────┐
                              │   nudges     │
                              ├──────────────┤
                              │ id (PK)      │
                              │ guest_id (FK)│
                              │ checkpoint_id│
                              │ channel      │
                              │ status       │
                              │ sent_at      │
                              └──────────────┘
```

### Row Level Security (RLS)

| Table | Policy | Rule |
|-------|--------|------|
| events | Organizers manage own | `auth.uid() = organiser_id` |
| blocks | Via event ownership | `event_id IN (SELECT id FROM events WHERE organiser_id = auth.uid())` |
| guests | Via event ownership | Same as blocks |
| rsvps | Guest via magic token | `guest_id IN (SELECT id FROM guests WHERE magic_token = current_token)` |
| questions | Via event ownership | Same as blocks |

### Edge Functions

| Function | Trigger | Purpose |
|----------|---------|---------|
| `send-nudge` | Scheduled / Manual | Send SMS/email reminders |
| `generate-summary` | On demand | Create AI summary of responses |
| `process-webhook` | Incoming | Handle Twilio/Resend webhooks |

---

## Data Flow

### Event Creation Flow
```
User Input → EventWizard → Local State → Supabase Insert → 
  → events table
  → blocks table (multiple)
  → questions table (multiple)
  → guests table (multiple)
  → Trigger: generate magic_tokens
```

### Guest RSVP Flow
```
Magic Link → Validate Token → Load Event + Blocks → 
  → Display RSVP UI → Submit Responses → 
  → Upsert rsvps table → Update guest.status → 
  → Trigger: notify organizer (optional)
```

### Nudge Flow
```
Checkpoint time reached → Edge Function triggered →
  → Query non-responders → For each guest:
    → Determine channel (SMS/Email) → 
    → Call Twilio/Resend → 
    → Log to nudges table
```

---

## Security Model

### Authentication
- **Organizers**: Email + password via Supabase Auth
- **Guests**: Magic links (no password)

### Authorization
- All tables have RLS enabled
- Organizers can only access their own events
- Guests can only access events they're invited to
- Guests cannot see other guests' responses or contact info

### Data Protection
- All data at rest encrypted by Supabase
- All traffic over HTTPS
- Magic tokens are UUIDs (128-bit entropy)
- API keys stored in Supabase secrets (never in client)

---

## Scalability Considerations

### Current (MVP)
- Single Supabase project
- Edge functions for async work
- No caching layer

### Future (Scale)
- Read replicas for dashboard queries
- Redis cache for hot data (response counts)
- Queue system for nudges (avoid rate limits)
- CDN for static assets
