# Features

## Core Features

### 1. Event Creation Wizard

**Status**: ✅ Implemented (6-Step Conversational)

Redesigned conversational flow optimized for mobile:

| Step | Name | Description |
|------|------|-------------|
| 1 | Event Type | Choose event type (Bucks, Hens, Wedding, Birthday, etc.) |
| 2 | Host Name | Enter organizer name |
| 3 | Date | Weekend picker with visual calendar |
| 4 | Location | Google Places autocomplete for venue |
| 5 | Guests | Phone number input with country codes |
| 6 | Confirm | Review with AI-generated description & cover photo |

**Technical Details**:
- Components in `src/components/CreateWizard/`
- Steps in `src/components/CreateWizard/steps/`
- State managed via `use-wizard-state.ts` hook
- Framer Motion transitions between steps
- AI description generation via `generate-description` Edge Function
- Cover photo search via `fetch-pexels` Edge Function
- Persisted to Supabase on completion

---

### 2. Block-Based RSVPs

**Status**: ✅ Implemented

Guests respond to individual time blocks, not just the overall event.

**Response Options**:
- ✅ **In**: Confirmed attending
- ❓ **Maybe**: Tentative
- ❌ **Out**: Not attending

**Additional Options** (per block):
- Arrival time (if different from block start)
- Departure time (if leaving early)

**Database Schema**:
```sql
rsvps (
  id, guest_id, block_id, 
  response, arrival_time, departure_time,
  created_at, updated_at
)
```

---

### 3. Magic Link Authentication

**Status**: ✅ Implemented (Guests)

Guests receive unique links—no passwords required.

**Flow**:
1. Organizer adds guest with email/phone
2. System generates `magic_token` (UUID)
3. Guest receives link: `lockstep.app/rsvp/{magic_token}`
4. Token validated, guest can respond
5. Token remains valid for updates

**Security**:
- Tokens are UUIDs, not guessable
- RLS policies restrict access to own responses
- Optional: Expire tokens after event date

---

### 4. Organizer Dashboard

**Status**: ✅ Implemented

Real-time visibility into event status.

**Widgets**:
- Response rate (overall and per-block)
- Headcount projections with confidence intervals
- Recent activity feed
- Non-responder list with nudge actions
- AI-generated summary

**Visualizations**:
- Timeline view of blocks with attendance bars
- Guest grid (guests × blocks matrix)
- Response trend over time

---

### 5. Smart Nudges

**Status**: ✅ Implemented (Edge Function)

Automated reminders via SMS, email, and WhatsApp.

**Nudge Types**:
| Type | Trigger | Channel |
|------|---------|---------|
| Initial invite | Event published | Email |
| First reminder | 7 days, no response | SMS |
| Second reminder | 3 days, no response | SMS |
| Final reminder | 1 day, no response | SMS + Email |
| Confirmation | Response received | Email |
| Update notification | Schedule changed | All |

**Configuration**:
- Organizer sets checkpoint times
- Per-guest channel preferences respected
- Quiet hours enforced (no messages 9pm-9am local)

**Technical**:
- Edge function: `send-nudge`
- Database: `checkpoints`, `nudges` tables
- Integrations: Twilio (SMS), Resend (Email)

---

### 6. Custom Questions

**Status**: ✅ Implemented

Collect additional info beyond RSVP.

**Question Types**:
- `text`: Free-form response
- `select`: Single choice from options
- `multi-select`: Multiple choices allowed

**Examples**:
- "Any dietary restrictions?"
- "T-shirt size?"
- "Need airport pickup?"
- "Song requests?"

**Database Schema**:
```sql
questions (
  id, event_id, prompt, type, 
  options (JSONB), required, order_index
)
```

---

### 7. AI-Powered Summaries

**Status**: ✅ Implemented (Gemini Integration)

LLM-generated insights from responses.

**Summary Types**:
- **Response summary**: "32 of 45 guests have responded. The ceremony has 100% attendance, but only 60% are joining the after-party."
- **Logistics summary**: "4 guests need vegetarian meals. 2 guests arriving late to Friday dinner."
- **Action items**: "Consider following up with the 5 guests who haven't responded to any blocks."

**Technical**:
- Edge function: `generate-summary`
- Uses OpenAI or Google AI (configurable)
- Cached and refreshed on significant changes

---

## UI/UX Features

### 8. Landing Page

**Status**: ✅ Implemented

Conversion-focused homepage with:
- Animated hero with rotating event types
- Interactive phone mockup demo
- Feature highlights with reveal animations
- RSVP demo (interactive)
- CTA to create first event

### 9. Slide Controller

**Status**: ✅ Implemented

Carousel component with:
- Auto-play (6s interval, pauses on interaction)
- Swipe gestures (mobile)
- Keyboard navigation (arrows)
- Progress indicator in dots
- Sound effects and haptic feedback

### 10. Animation System

**Status**: ✅ Implemented

Consistent animations via Framer Motion:
- `Reveal`: Scroll-triggered fade/slide
- `StaggerContainer` / `StaggerItem`: Sequential reveals
- `KineticText`: Animated text effects
- Reduced motion support via `prefers-reduced-motion`

---

## Recently Implemented Features

### 11. Pricing & Subscriptions

**Status**: ✅ Implemented

Tiered pricing with Stripe integration:

| Tier | Price | Guests | Nudges |
|------|-------|--------|--------|
| Free | $0 | 15 | 3 |
| Pro | $29/event | 75 | 20 |
| Wedding | $49/event | 150 | Unlimited |
| Business | $99/event | 200 | Unlimited |
| Annual Pro | $149/year | 75 | 20 (Unlimited events) |

**Implementation**:
- `Pricing.tsx` page with tier comparison
- `subscription.ts` service for limit checking
- `create-checkout-session` Edge Function
- `stripe-webhook` Edge Function

### 12. Cover Photos

**Status**: ✅ Implemented

AI-suggested cover photos for events via Pexels API.

**Features**:
- Automatic photo search based on event type
- Manual search override
- Photo preview and selection

### 13. Google Places Integration

**Status**: ✅ Implemented

Location autocomplete for event creation.

**Features**:
- Address autocomplete
- Place details (formatted address)
- Works on mobile keyboards

---

### 14. Public Plan Page

**Status**: ✅ Implemented

Shareable public view of an event plan—no authentication required.

**Features**:
- Cover image display
- Event title, description, location, dates
- Block schedule with times and attendance counts
- Visual attendance bars (in/maybe/out percentages)
- Privacy-respecting (no guest names or contacts shown)
- "Powered by Lockstep" footer with branding

**Route**: `/plan/:eventId`

**Technical**:
- `PublicPlanPage.tsx` component
- Anonymous RLS policies enable read access
- `get_organiser_display_name()` database function for host display

---

### 15. User Profiles & Phone Verification

**Status**: ✅ Implemented

User profile management with avatar upload and phone verification.

**Features**:
- Avatar upload via Supabase Storage (avatars bucket)
- Phone number verification via OTP (SMS)
- User preferences panel
- Subscription display

**Components**:
- `Profile/AvatarUpload.tsx`
- `Profile/PhoneVerification.tsx`
- `Profile/PreferencesPanel.tsx`

**Database**:
```sql
profiles (id, avatar_url, display_name, phone, phone_verified_at, timezone, preferences)
phone_otps (id, phone, otp_hash, expires_at, verified_at)
```

**Edge Functions**:
- `send-otp` — Delivers OTP code via SMS
- `verify-otp` — Validates submitted OTP code

---

### 16. Email Templates

**Status**: ✅ Implemented

Branded Supabase auth email templates in `email-templates/`:

| Template | Purpose |
|----------|---------|
| `confirmation.html` | Signup email confirmation |
| `magic-link.html` | Passwordless sign-in |
| `password-reset.html` | Password reset |
| `email-change-confirmation.html` | New email confirmation |
| `email-change-notification.html` | Old email notification |
| `invite-user.html` | User invitation |

---

### 17. Legal Pages

**Status**: ✅ Implemented

- Terms of Service (`/terms`)
- Privacy Policy (`/privacy`)

---

### 18. Blog & FAQ

**Status**: ✅ Implemented

- Blog page (`/blog`)
- FAQ page (`/faq`)

---

### 19. Inbound Message Handling

**Status**: ✅ Implemented (Edge Function)

STOP/HELP message processing via Twilio webhook.

**Technical**:
- Edge function: `webhook-twilio`
- Processes inbound SMS messages
- Handles opt-out (STOP) and help (HELP) keywords
- Updates `guests.opted_out_at` for opt-outs

---

### 20. Guest Management (Post-Creation)

**Status**: ✅ Implemented

Full CRUD operations for guests after event creation.

**Features**:
- Add guests with name, email (optional), phone (required + validated)
- Edit existing guests (inline editing)
- Remove guests
- Phone validation with visual feedback (E.164 normalization via `libphonenumber-js`)
- RSVP status display (pending/responded)

**Component**: `GuestManager.tsx`

---

### 21. Checkpoint Scheduling

**Status**: ✅ Implemented (Edge Function)

Automated nudge scheduling and processing.

**Technical**:
- Edge function: `process-checkpoint`
- Queries checkpoints that have reached their trigger time
- Identifies non-responding guests
- Dispatches nudges via appropriate channels

---

## Planned Features

### 22. Export/Import
CSV export of responses, CSV import of guests.

### 23. Collaborative Organizing
Multiple organizers per event with role-based permissions.

### 24. Analytics Dashboard
Response time trends, channel effectiveness, conversion funnels.
