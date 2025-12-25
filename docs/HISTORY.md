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

### Week 1: Event Creation Flow

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

**Pending**:
- Magic link auth for guests
- Password reset flow
- OAuth providers (Google, etc.)

### Week 1: Animation System

**Accomplishments**:
- `Reveal` component for scroll-triggered animations
- `SlideController` with auto-play, swipe, keyboard navigation
- Sound effects and haptic feedback hooks
- Auto-play with pause on interaction

---

## Phase 2: Core Features (Planned)

### Guest RSVP Experience

**Goals**:
- Magic link landing page
- Event details display
- Block-by-block response UI
- Custom question answers
- Confirmation and updates

### Organizer Dashboard

**Goals**:
- Event list/grid view
- Per-event detail page
- Response tracking (overall and per-block)
- Guest management (add, edit, remove)
- Nudge controls (send manually, configure automation)

### Nudge Automation

**Goals**:
- Edge function for sending nudges
- Twilio SMS integration
- Resend email integration
- Checkpoint scheduling
- Delivery tracking

### AI Summaries

**Goals**:
- Edge function for LLM calls
- Response aggregation
- Natural language summaries
- Dietary/logistics extraction
- Action item suggestions

---

## Phase 3: Polish & Launch (Planned)

### Performance Optimization

**Goals**:
- Code splitting
- Image optimization
- Lazy loading
- Caching strategies

### Accessibility Audit

**Goals**:
- Keyboard navigation throughout
- Screen reader testing
- Color contrast verification
- Focus management

### Launch Preparation

**Goals**:
- Custom domain setup
- Error monitoring (Sentry)
- Analytics (privacy-respecting)
- Documentation completion

---

## Version History

| Version | Date | Highlights |
|---------|------|------------|
| 0.1.0 | 2024-12-25 | Initial foundation: DB schema, landing page, event wizard |
| 0.2.0 | TBD | Guest RSVP experience |
| 0.3.0 | TBD | Organizer dashboard |
| 0.4.0 | TBD | Nudge automation |
| 0.5.0 | TBD | AI summaries |
| 1.0.0 | TBD | Public launch |

---

## Changelog

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

### What Could Be Better

1. **Scope management**: Easy to add "one more feature"
2. **Mobile testing**: Need more device testing earlier
3. **User feedback**: Should get real users testing sooner

### Key Insights

1. Guests don't want another app—web is right
2. Organizers will tolerate complexity if it saves time later
3. Visual polish correlates with response rates (theory to test)
4. SMS > email for reminder effectiveness

---

## Contributors

- **Product/Design**: [To be credited]
- **Engineering**: Built with Lovable AI
- **Documentation**: Comprehensive docs written alongside development
