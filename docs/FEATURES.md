# Features

## Core Features

### 1. Event Creation Wizard

**Status**: ✅ Implemented

Multi-step flow for creating events:

| Step | Name | Description |
|------|------|-------------|
| 1 | Basics | Event title, description, dates, location, timezone |
| 2 | Blocks | Define time blocks (activities) with start/end times |
| 3 | Questions | Add custom questions (text, select, multi-select) |
| 4 | Guests | Import guest list with names, emails, phone numbers |
| 5 | Review | Preview and publish event |

**Technical Details**:
- Components in `src/components/EventWizard/`
- State managed locally, persisted to Supabase on completion
- Supports drag-and-drop reordering for blocks and questions

---

### 2. Block-Based RSVPs

**Status**: 🔄 In Progress

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

**Status**: 📋 Planned

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

**Status**: 🔄 In Progress

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

**Status**: 📋 Planned

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

## Planned Features

### 11. Guest Portal
Full RSVP experience for guests with magic link access.

### 12. Email Templates
Branded invitation and reminder emails.

### 13. Export/Import
CSV export of responses, CSV import of guests.

### 14. Event Templates
Pre-built templates for common event types.

### 15. Collaborative Organizing
Multiple organizers per event with role-based permissions.

### 16. Analytics
Response time trends, channel effectiveness, conversion funnels.
