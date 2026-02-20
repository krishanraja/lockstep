# History

## Project Timeline

This document tracks the evolution of Lockstep from concept to current state.

---

## Phase 0: Concept (Pre-Development)

### The Problem

Complex events—wedding weekends, bachelor parties, corporate retreats—generate chaos:
- Group chats with hundreds of messages
- Organizers asking "who's coming?" repeatedly
- Guests confused about which activities require RSVPs
- Spreadsheets that nobody updates

### The Insight

The solution isn't better group chat management—it's structured RSVPs at the activity level. Guests should respond to each "block" of time, not just the overall event.

### Initial Vision

A mobile-first RSVP platform where:
1. Organizers define event "blocks" (activities with times)
2. Guests receive magic links—no accounts needed
3. Each block gets its own response (in/out/maybe)
4. Smart reminders reduce follow-up burden
5. Dashboard shows real-time attendance projections

---

## Phase 1: Foundation (December 2024)

### Week 1: Core Infrastructure

**Accomplishments**:
- Lovable project created
- Supabase backend connected via Lovable Cloud
- Initial database schema designed:
  - `events` table for event metadata
  - `blocks` table for time blocks
  - `guests` table for attendees
  - `rsvps` table for responses
  - `questions` table for custom questions
  - `checkpoints` and `nudges` tables for automation

**Technical Decisions**:
- React + Vite + TypeScript stack
- Tailwind CSS with shadcn/ui components
- Framer Motion for animations
- RLS policies for data security

### Week 1: Landing Page

**Accomplishments**:
- Hero section with rotating event types
- Interactive phone mockup with mini RSVP demo
- Features section with reveal animations
- RSVP demo showing block-based responses
- CTA section driving to event creation

**Design Decisions**:
- Mobile-first responsive design
- Dark/light mode support via CSS variables
- Subtle animations that respect reduced motion preferences

### Week 1: Event Creation Flow (Original)

**Accomplishments**:
- Multi-step wizard implemented:
  1. Event Basics (title, dates, location)
  2. Time Blocks (activities with times)
  3. Custom Questions (text, select, multi-select)
  4. Guest List (name, email, phone)
  5. Review & Publish

**Technical Details**:
- Local state management during wizard
- Supabase insert on completion
- Form validation with visual feedback

### Week 1: Authentication

**Accomplishments**:
- Auth page with login/signup forms
- Supabase Auth integration
- Email/password authentication
- Auto-confirm enabled for development

### Week 1: Animation System

**Accomplishments**:
- `Reveal` component for scroll-triggered animations
- `SlideController` with auto-play, swipe, keyboard navigation
- Sound effects and haptic feedback hooks
- Auto-play with pause on interaction

---

## Phase 2: Core Features (December 2024 - January 2025)

### Guest RSVP Experience

**Accomplishments**:
- Magic link landing page (`/rsvp/:token`)
- Event details display with blocks
- Block-by-block response UI (In/Maybe/Out)
- Positive-bias RSVP design
- Confirmation screen

**Implementation**:
- `RSVPPage.tsx` component
- Token validation via Supabase RLS
- Pre-filled responses for updates

### Organizer Dashboard

**Accomplishments**:
- Event list view with cards
- Per-event response tracking
- AI-generated summaries via Edge Function
- Guest count and response statistics
- Real-time updates via Supabase Realtime

**Implementation**:
- `Dashboard.tsx` and `EventDetail.tsx` pages
- TanStack Query for data fetching
- AI insights panel with Gemini integration

### 6-Step Conversational Event Wizard

**Accomplishments**:
- Complete redesign of event creation flow
- Conversational, mobile-first interface
- Six focused steps:
  1. **EventTypeStep**: Choose event type (Bucks, Hens, Wedding, Birthday, Reunion, Trip, Team Offsite, Custom)
  2. **HostNameStep**: Organizer name input
  3. **DateStep**: Weekend picker with visual calendar
  4. **LocationStep**: Google Places autocomplete integration
  5. **GuestsStep**: Phone number input with country codes
  6. **ConfirmStep**: Review & AI-generated event description

**Technical Details**:
- `src/components/CreateWizard/` component structure
- `use-wizard-state.ts` hook for state management
- Smooth Framer Motion transitions between steps
- Cover photo search via Pexels API
- AI description generation via Edge Function

### Edge Functions

**Accomplishments**:
- `generate-description`: AI event description generation using Google AI (Gemini)
- `generate-summary`: AI event summaries for organizers
- `send-nudge`: SMS/WhatsApp sending via Twilio
- `fetch-pexels`: Cover photo search
- `create-checkout-session`: Stripe integration
- `stripe-webhook`: Payment processing

**Implementation**:
- Deno runtime on Supabase Edge
- CORS headers for browser access
- Secrets management via Supabase Dashboard

### Pricing & Subscriptions

**Accomplishments**:
- Pricing page with tier comparison
- Stripe Checkout integration
- Per-event pricing model:
  - Free: 15 guests, 3 nudges
  - Pro ($29): 75 guests, 20 nudges, AI summaries
  - Wedding ($49): 150 guests, unlimited nudges
  - Business ($99): 200 guests, team access, analytics
  - Annual Pro ($149/year): Unlimited events

**Implementation**:
- `Pricing.tsx` page
- `subscription.ts` service
- `event_purchases` table for per-event upgrades

### Profile Management

**Accomplishments**:
- User profile page
- Account settings
- Subscription management

**Implementation**:
- `Profile.tsx` page
- Supabase Auth user data

---

## Phase 3: Polish & Deployment (January 2025)

### Vercel Deployment

**Accomplishments**:
- Production deployment to Vercel
- Custom domain configuration (`inlockstep.ai`)
- Security headers (CSP, X-Frame-Options, etc.)
- Asset caching with immutable headers
- SPA routing configuration

**Configuration**:
- `vercel.json` with rewrites and headers
- Stripe script CSP allowances
- Google APIs and Supabase connectivity

### Database Enhancements

**Migrations Applied**:
1. `20251225063926_initial_schema.sql` - Core tables
2. `20251226140000_schema_enhancements.sql` - Additional fields
3. `20251227000000_event_purchases.sql` - Billing tables
4. `20260103000000_add_cover_image.sql` - Cover photo support

### Performance Optimization

**Accomplishments**:
- Code splitting with React.lazy for secondary pages
- Eager loading for critical pages (Index, Auth, CreateEvent)
- TanStack Query caching configuration
- Loading states with spinner fallback

---

## Current State (January 2025)

### Pages Implemented

| Page | Route | Status |
|------|-------|--------|
| Landing | `/` | ✅ Complete |
| Auth | `/auth` | ✅ Complete |
| Create Event | `/create` | ✅ Complete (6-step wizard) |
| Dashboard | `/dashboard` | ✅ Complete |
| Event Detail | `/events/:id` | ✅ Complete |
| RSVP | `/rsvp/:token` | ✅ Complete |
| Pricing | `/pricing` | ✅ Complete |
| Profile | `/profile` | ✅ Complete |
| 404 | `*` | ✅ Complete |

### Edge Functions Deployed

| Function | Purpose | Status |
|----------|---------|--------|
| `generate-description` | AI event descriptions | ✅ Active |
| `generate-summary` | AI organizer summaries | ✅ Active |
| `send-nudge` | SMS/WhatsApp reminders | ✅ Active |
| `fetch-pexels` | Cover photo search | ✅ Active |
| `create-checkout-session` | Stripe checkout | ✅ Active |
| `stripe-webhook` | Payment callbacks | ✅ Active |

### Pending Features

- [ ] Heatmap visualization for arrival/departure
- [ ] Inbound message handling (STOP, HELP)
- [ ] Status callbacks from Twilio
- [ ] Escalation logic for nudges
- [ ] Summary caching
- [ ] CSV export
- [ ] Guest manager UI improvements

---

## Version History

| Version | Date | Highlights |
|---------|------|------------|
| 0.1.0 | 2024-12-25 | Initial foundation: DB schema, landing page, event wizard |
| 0.2.0 | 2024-12-27 | Guest RSVP experience, dashboard |
| 0.3.0 | 2024-12-30 | 6-step conversational wizard, AI integration |
| 0.4.0 | 2025-01-02 | Stripe integration, pricing page, profile |
| 0.5.0 | 2025-01-03 | Cover photos, Places autocomplete, polish |
| 1.0.0 | TBD | Public launch |

---

## Changelog

### 2025-01-03

**Added**:
- Cover photo support for events (via Pexels API)
- Event type selection with visual cards
- Weekend picker calendar component
- Google Places autocomplete integration

**Changed**:
- Event creation wizard redesigned to 6 conversational steps
- Improved mobile experience throughout

### 2025-01-02

**Added**:
- Pricing page with tier comparison
- Stripe Checkout integration
- Profile page with account management
- Per-event purchases database table

### 2024-12-30

**Added**:
- AI-generated event descriptions
- Conversational event wizard
- Phone number input with country codes

### 2024-12-27

**Added**:
- RSVP page for guests
- Dashboard with event cards
- Event detail page
- AI summaries integration

### 2024-12-25

**Added**:
- Project initialization
- Database schema with 7 tables
- RLS policies for all tables
- Landing page with hero, features, RSVP demo
- Event creation wizard (5 steps)
- Auth page with login/signup
- Animation system (Reveal, SlideController)
- Auto-play carousel with progress indicator
- Sound effects and haptic feedback hooks
- Secrets for external APIs (OpenAI, Google AI, Twilio, Resend)
- Project documentation (16 docs)

**Technical**:
- React 18 + TypeScript
- Vite build system
- Tailwind CSS + shadcn/ui
- Framer Motion animations
- Supabase backend via Lovable Cloud

---

## Lessons Learned

### What Worked Well

1. **Block-based model**: The core concept validated—people immediately understand it
2. **Magic links**: Zero friction is a real differentiator
3. **Animation polish**: First impressions matter for trust
4. **RLS-first security**: Peace of mind during development
5. **Conversational wizard**: 6 focused steps feel faster than 5 complex ones
6. **AI integration**: Gemini works well for description/summary generation

### What Could Be Better

1. **Scope management**: Easy to add "one more feature"
2. **Mobile testing**: Need more device testing earlier
3. **User feedback**: Should get real users testing sooner
4. **Type safety**: Some edge cases with Supabase types

### Key Insights

1. Guests don't want another app—web is right
2. Organizers will tolerate complexity if it saves time later
3. Visual polish correlates with response rates (theory to test)
4. SMS > email for reminder effectiveness
5. AI-generated content saves significant time for organizers
6. Per-event pricing better than subscription for casual users

---

## Contributors

- **Product/Design**: Krish
- **Engineering**: Built with Lovable AI + Cursor AI
- **Documentation**: Comprehensive docs maintained alongside development
