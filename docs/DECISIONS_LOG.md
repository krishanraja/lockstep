# Decisions Log

## Overview

This document records significant architectural and design decisions made during the development of Lockstep. Each entry includes context, options considered, decision made, and consequences.

---

## ADR-001: Block-Based RSVP Model

**Date**: 2024-12-25
**Status**: Accepted

### Context

Traditional RSVP systems treat events as atomic units—guests say yes or no to the entire event. For multi-day, multi-activity events (weddings, bachelor parties, retreats), this provides insufficient granularity.

### Options Considered

1. **Single RSVP with notes**: Guest RSVPs once, adds notes about specific activities
2. **Activity checklist**: Single form with checkboxes for each activity
3. **Block-based RSVPs**: Each time block gets its own RSVP record

### Decision

Option 3: Block-based RSVPs. Each `block` in an event has separate `rsvp` records per guest.

### Consequences

**Positive**:
- Precise headcounts per activity
- Guests can update individual blocks
- Clear data model

**Negative**:
- More database rows
- More complex queries for aggregate views
- UI must present many choices simply

---

## ADR-002: Magic Link Authentication for Guests

**Date**: 2024-12-25
**Status**: Accepted

### Context

Guest RSVP conversion is critical. Any friction (account creation, passwords) reduces response rates.

### Options Considered

1. **Full accounts**: Guests create accounts with email/password
2. **Email magic links**: One-time login links sent via email
3. **Unique URL tokens**: Each guest gets a permanent unique URL
4. **SMS OTP**: Send code via text for verification

### Decision

Option 3: Unique URL tokens (with email/SMS delivery). Each guest receives a permanent magic link that works for their event.

### Consequences

**Positive**:
- Zero friction—just click
- Works across devices if link is shared
- No password reset flows needed

**Negative**:
- Security relies on link secrecy
- Sharing link = sharing access
- No guest-side account for multi-event reuse

---

## ADR-003: React + Vite + Tailwind Stack

**Date**: 2024-12-25
**Status**: Accepted

### Context

Need to choose a frontend stack that supports rapid development, excellent DX, and optimal production performance.

### Options Considered

1. **Next.js**: Full framework with SSR/SSG
2. **React + Vite**: Fast bundler, minimal framework
3. **Vue + Nuxt**: Alternative ecosystem
4. **Svelte + SvelteKit**: Different paradigm

### Decision

Option 2: React + Vite. Used with Lovable platform which provides hosting and deployment.

### Consequences

**Positive**:
- Fast development iteration
- Large ecosystem and community
- Lovable platform optimized for React
- shadcn/ui component library

**Negative**:
- No SSR (SEO considerations)
- Client-side only (no server components)
- Must use Lovable Cloud for backend

---

## ADR-004: Supabase for Backend

**Date**: 2024-12-25
**Status**: Accepted

### Context

Need database, authentication, and serverless functions. Build vs. buy decision.

### Options Considered

1. **Custom backend**: Express/Fastify + PostgreSQL + custom auth
2. **Firebase**: Google's BaaS
3. **Supabase**: Open-source Firebase alternative
4. **AWS Amplify**: Amazon's full-stack platform

### Decision

Option 3: Supabase via Lovable Cloud. Provides PostgreSQL, Auth, Edge Functions, and Storage with minimal configuration.

### Consequences

**Positive**:
- Rapid development
- Native Lovable integration
- Strong RLS for security
- Edge functions for custom logic

**Negative**:
- Vendor dependency
- Limited to PostgreSQL
- Edge function cold starts

---

## ADR-005: Framer Motion for Animations

**Date**: 2024-12-25
**Status**: Accepted

### Context

Landing page and user experience require polished animations. Need a system that's declarative and integrates with React.

### Options Considered

1. **CSS animations only**: Keyframes and transitions
2. **React Spring**: Physics-based animations
3. **Framer Motion**: Declarative, feature-rich
4. **GSAP**: Professional animation library

### Decision

Option 3: Framer Motion. Best DX for React, handles layout animations, supports gestures.

### Consequences

**Positive**:
- Declarative API fits React model
- AnimatePresence for exit animations
- Gesture support (drag, swipe)
- Built-in reduced motion support

**Negative**:
- Bundle size (~40KB)
- Learning curve for advanced features
- Can conflict with CSS transitions

---

## ADR-006: Multi-Channel Nudges via External APIs

**Date**: 2024-12-25
**Status**: Accepted

### Context

Need to send reminders to guests who haven't responded. Email alone has low engagement; SMS/WhatsApp have higher open rates.

### Options Considered

1. **Email only**: Simpler, cheaper
2. **SMS via Twilio**: High engagement, cost per message
3. **WhatsApp Business**: Popular in some markets
4. **Push notifications**: Requires app installation
5. **Multi-channel**: All of the above based on preference

### Decision

Option 5: Multi-channel approach. Start with Twilio (SMS) and Resend (email). WhatsApp via Twilio as future addition.

### Consequences

**Positive**:
- Higher response rates
- Meet guests where they are
- Channel preference per guest

**Negative**:
- Multiple integrations to maintain
- Cost per message (SMS)
- Regulatory compliance (SMS opt-in)

---

## ADR-007: LLM Integration for Summaries

**Date**: 2024-12-25
**Status**: Accepted

### Context

Organizers want quick insights from guest responses without reading every answer individually. AI can summarize patterns and highlight important details.

### Options Considered

1. **No AI**: Manual review only
2. **Simple aggregation**: Counts and percentages
3. **LLM summarization**: Natural language summaries
4. **Both 2 and 3**: Combine stats with prose

### Decision

Option 4: Provide both statistical aggregation and LLM-generated prose summaries. Use OpenAI or Google AI via user-provided API keys.

### Consequences

**Positive**:
- Actionable insights quickly
- Surfaces patterns humans might miss
- Premium feel

**Negative**:
- API costs passed to users
- LLM outputs can be unpredictable
- Latency for generation

---

## ADR-008: Row-Level Security First

**Date**: 2024-12-25
**Status**: Accepted

### Context

Data isolation is critical—organizers should only see their events, guests should only see their RSVPs.

### Options Considered

1. **Application-level checks**: Filter in code
2. **Database views**: Pre-filtered views
3. **RLS policies**: PostgreSQL enforced at database level
4. **Combination**: RLS + application checks

### Decision

Option 4: RLS as primary enforcement, application checks as secondary. All tables have RLS enabled with policies matching access rules.

### Consequences

**Positive**:
- Security at lowest level
- Can't accidentally leak data
- Works for direct DB access

**Negative**:
- Policies can be complex
- Debugging RLS issues is harder
- Must keep policies in sync with features

---

## ADR-009: CSS Variables for Theming

**Date**: 2024-12-25
**Status**: Accepted

### Context

Need consistent colors, support for dark mode, and potential for custom themes (white-labeling).

### Options Considered

1. **Tailwind default colors**: Use gray-900, blue-500, etc.
2. **Tailwind extend**: Define custom palette in config
3. **CSS variables**: Define tokens consumed by Tailwind
4. **CSS-in-JS**: Styled-components or Emotion

### Decision

Option 3: CSS variables defined in `index.css`, referenced in `tailwind.config.ts`. Semantic naming (--background, --foreground) rather than descriptive (--blue-500).

### Consequences

**Positive**:
- Dark mode is trivial (just swap variables)
- Theme switching without rebuild
- White-labeling possible

**Negative**:
- Extra layer of indirection
- Must maintain variable/Tailwind sync
- HSL format has learning curve

---

## ADR-010: No Native Mobile App (Initially)

**Date**: 2024-12-25
**Status**: Accepted

### Context

80%+ of guests will access via phone. Should we build native apps?

### Options Considered

1. **Native iOS + Android**: Best experience, highest cost
2. **React Native**: Shared codebase, native feel
3. **PWA**: Web app with app-like features
4. **Responsive web only**: Mobile-optimized website

### Decision

Option 4: Responsive web only. Guests access via browser; no app installation required. PWA features (offline, install prompt) as future enhancement.

### Consequences

**Positive**:
- Zero friction for guests
- Single codebase
- Faster iteration
- No app store dependencies

**Negative**:
- No push notifications (without PWA)
- No home screen icon by default
- Limited offline capability
- Some features not accessible (NFC, Bluetooth)

---

## ADR-011: Conversational 6-Step Wizard

**Date**: 2025-01-02
**Status**: Accepted

### Context

The original 5-step wizard was comprehensive but felt complex on mobile. Users hesitated at the multi-field forms. We needed a flow that felt faster and more engaging.

### Options Considered

1. **Keep 5-step wizard**: Simplify each step
2. **Single-page form**: All fields on one screen
3. **Conversational wizard**: One question per screen, 6 focused steps

### Decision

Option 3: Conversational 6-step wizard. Each step asks one clear question, uses the full screen, and animates smoothly between steps.

### Consequences

**Positive**:
- Feels faster despite more screens
- Better mobile experience (one-hand operation)
- Clearer mental model for users
- Easier to add AI assistance per step

**Negative**:
- More components to maintain
- More animation code
- Template blocks now auto-generated instead of user-defined

---

## ADR-012: Per-Event Pricing Model

**Date**: 2025-01-02
**Status**: Accepted

### Context

Need to monetize the platform. Most RSVP tools use subscription models, but our users organize events infrequently.

### Options Considered

1. **Monthly subscription**: $9-29/month unlimited events
2. **Per-event pricing**: $19-99 per event
3. **Freemium + add-ons**: Free base, pay for features
4. **Hybrid**: Annual subscription OR per-event

### Decision

Option 4: Hybrid model. Users can pay per-event ($29-99) or subscribe annually ($149) for unlimited events. Free tier with limits for trial.

### Consequences

**Positive**:
- Matches user behavior (infrequent events)
- Low barrier to first paid event
- Annual option for power users
- Clear upgrade path

**Negative**:
- More pricing complexity
- Need to track per-event purchases
- Stripe integration complexity

---

## ADR-013: Google AI (Gemini) as Primary LLM

**Date**: 2024-12-28
**Status**: Accepted

### Context

Need LLM for event descriptions, summaries, and nudge copy. Multiple providers available.

### Options Considered

1. **OpenAI only**: GPT-4/4o
2. **Anthropic**: Claude
3. **Google AI**: Gemini
4. **Multi-provider**: Primary + fallback

### Decision

Option 4: Google AI (Gemini 2.5 Flash) as primary with OpenAI as fallback. Gemini is fast, cost-effective, and good for structured output.

### Consequences

**Positive**:
- Lower cost than GPT-4
- Fast response times
- Good at following JSON schemas
- Fallback ensures reliability

**Negative**:
- Two APIs to maintain
- Slightly different prompting styles
- Google AI API still maturing

---

## Template for New Decisions

```markdown
## ADR-XXX: [Title]

**Date**: YYYY-MM-DD
**Status**: Proposed | Accepted | Deprecated | Superseded

### Context

[Why is this decision needed? What problem are we solving?]

### Options Considered

1. **Option A**: Description
2. **Option B**: Description
3. **Option C**: Description

### Decision

[Which option was chosen and why?]

### Consequences

**Positive**:
- [Good outcome 1]
- [Good outcome 2]

**Negative**:
- [Trade-off 1]
- [Trade-off 2]
```
