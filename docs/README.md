# Lockstep Documentation

Welcome to the Lockstep project documentation. This folder contains comprehensive documentation for understanding, developing, and maintaining the Lockstep RSVP platform.

## Quick Navigation

### Overview
| Document | Description |
|----------|-------------|
| [EXECUTIVE_SUMMARY](./EXECUTIVE_SUMMARY.md) | High-level overview for stakeholders |
| [PURPOSE](./PURPOSE.md) | Why Lockstep exists |
| [VALUE_PROP](./VALUE_PROP.md) | Core value proposition |
| [ICP](./ICP.md) | Ideal Customer Profile |

### Product
| Document | Description |
|----------|-------------|
| [FEATURES](./FEATURES.md) | Complete feature documentation |
| [ROADMAP](./ROADMAP.md) | Complete product roadmap to nirvana state |
| [OUTCOMES](./OUTCOMES.md) | Success metrics and KPIs |
| [HISTORY](./HISTORY.md) | Project evolution timeline |

### Technical
| Document | Description |
|----------|-------------|
| [ARCHITECTURE](./ARCHITECTURE.md) | Technical architecture overview |
| [DEPLOYMENT](./DEPLOYMENT.md) | Deployment procedures |
| [ENV_VARIABLES](./ENV_VARIABLES.md) | Environment configuration |
| [COMMON_ISSUES](./COMMON_ISSUES.md) | Troubleshooting guide |
| [REPLICATION_GUIDE](./REPLICATION_GUIDE.md) | How to replicate this project |
| [DECISIONS_LOG](./DECISIONS_LOG.md) | Architectural decisions record |

### Design
| Document | Description |
|----------|-------------|
| [DESIGN_SYSTEM](./DESIGN_SYSTEM.md) | UI/UX design system |
| [VISUAL_GUIDELINES](./VISUAL_GUIDELINES.md) | Brand visual standards |
| [BRANDING](./BRANDING.md) | Brand identity guidelines |

### AI/LLM
| Document | Description |
|----------|-------------|
| [LLM_CRITICAL_THINKING_TRAINING](./LLM_CRITICAL_THINKING_TRAINING.md) | AI assistant context |

---

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

The development server runs at `http://localhost:5173`.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, TypeScript, Vite |
| **Styling** | Tailwind CSS, shadcn/ui |
| **Animation** | Framer Motion |
| **Backend** | Supabase (PostgreSQL, Auth, Edge Functions) |
| **Messaging** | Twilio (SMS/WhatsApp), Resend (Email) |
| **AI** | Google AI (Gemini), OpenAI (GPT) |
| **Payments** | Stripe |
| **Deployment** | Vercel |

---

## Project Structure

```
lockstep/
├── src/
│   ├── components/           # React components
│   │   ├── ui/               # shadcn/ui primitives (40+ components)
│   │   ├── CreateWizard/     # 6-step event creation wizard
│   │   │   ├── steps/        # Individual wizard steps
│   │   │   └── components/   # Wizard sub-components
│   │   ├── Dashboard/        # Dashboard event cards & skeletons
│   │   ├── EventDetail/      # Event detail tabs & managers
│   │   ├── Profile/          # Avatar, phone verification, preferences
│   │   ├── EventWizard/      # Legacy wizard (deprecated)
│   │   └── animations/       # Framer Motion components
│   ├── hooks/                # Custom React hooks
│   ├── pages/                # Route pages (14 pages)
│   │   ├── Index.tsx         # Landing page
│   │   ├── Auth.tsx          # Authentication
│   │   ├── CreateEvent.tsx   # Event wizard
│   │   ├── Dashboard.tsx     # Organizer dashboard
│   │   ├── EventDetail.tsx   # Single event view
│   │   ├── RSVPPage.tsx      # Guest RSVP experience
│   │   ├── Pricing.tsx       # Pricing tiers
│   │   ├── Profile.tsx       # User profile
│   │   ├── PublicPlanPage.tsx # Public event plan view
│   │   ├── Blog.tsx          # Blog page
│   │   ├── FAQ.tsx           # FAQ page
│   │   ├── TermsOfService.tsx # Terms of Service
│   │   ├── PrivacyPolicy.tsx # Privacy Policy
│   │   └── NotFound.tsx      # 404 page
│   ├── queries/              # TanStack Query hooks
│   │   └── event-queries.ts  # Event data fetching
│   ├── services/             # Business logic
│   │   ├── subscription.ts   # Tier limits, billing
│   │   ├── llm/              # AI integration
│   │   └── places/           # Google Places API
│   ├── integrations/         # External integrations
│   │   └── supabase/         # Supabase client & types
│   ├── data/                 # Static data & event templates
│   ├── utils/                # Utility functions (phone validation)
│   └── lib/                  # Shared utilities (cn, async-utils)
├── supabase/
│   ├── functions/            # Edge Functions (Deno)
│   │   ├── _shared/          # Shared utilities (CORS, LLM router)
│   │   ├── generate-description/
│   │   ├── generate-summary/
│   │   ├── send-nudge/
│   │   ├── fetch-pexels/
│   │   ├── create-checkout-session/
│   │   ├── stripe-webhook/
│   │   ├── send-otp/
│   │   ├── verify-otp/
│   │   ├── process-checkpoint/
│   │   └── webhook-twilio/
│   └── migrations/           # Database migrations (7 files)
├── docs/                     # This documentation
├── email-templates/          # Supabase auth email templates
├── scripts/                  # Build & utility scripts
└── public/                   # Static assets
```

---

## Key Routes

| Route | Page | Auth Required |
|-------|------|---------------|
| `/` | Landing page | No |
| `/auth` | Login/Signup | No |
| `/create` | Event creation wizard | Yes |
| `/dashboard` | Organizer dashboard | Yes |
| `/events/:id` | Event detail | Yes |
| `/rsvp/:token` | Guest RSVP | No (magic link) |
| `/plan/:eventId` | Public event plan | No |
| `/pricing` | Pricing tiers | No |
| `/profile` | User profile | Yes |
| `/blog` | Blog | No |
| `/faq` | FAQ | No |
| `/terms` | Terms of Service | No |
| `/privacy` | Privacy Policy | No |

---

## Edge Functions

| Function | Purpose |
|----------|---------|
| `generate-description` | AI event descriptions using Google AI (Gemini) |
| `generate-summary` | AI summaries for organizers |
| `send-nudge` | SMS/WhatsApp sending via Twilio |
| `fetch-pexels` | Cover photo search |
| `create-checkout-session` | Stripe Checkout session creation |
| `stripe-webhook` | Stripe payment event processing |
| `send-otp` | OTP delivery for phone verification |
| `verify-otp` | OTP validation |
| `process-checkpoint` | Scheduled nudge checkpoint processing |
| `webhook-twilio` | Inbound Twilio message handling (STOP/HELP) |

---

## Database Tables

| Table | Purpose |
|-------|---------|
| `events` | Event metadata (title, dates, location, cover image) |
| `blocks` | Time blocks/activities within events |
| `guests` | Invitees with magic tokens |
| `rsvps` | Guest responses per block |
| `questions` | Custom questions for events |
| `answers` | Guest answers to questions |
| `checkpoints` | Nudge schedule and triggers |
| `nudges` | Sent message audit log |
| `subscriptions` | User subscription status and tier |
| `event_purchases` | Per-event tier upgrades |
| `profiles` | User profile information (avatar, phone, preferences) |
| `phone_otps` | Phone number OTP verification records |
| `stripe_products` | Stripe product/price mapping |

---

## Pricing Tiers

| Tier | Price | Guests | Nudges | Features |
|------|-------|--------|--------|----------|
| Free | $0 | 15 | 3 | Unlimited events |
| Pro | $29/event | 75 | 20 | AI summaries, WhatsApp |
| Wedding | $49/event | 150 | Unlimited | Priority AI, CSV export |
| Business | $99/event | 200 | Unlimited | Team access, Analytics |
| Annual Pro | $149/year | 75 | 20 | Unlimited events, Pro features |

---

## Contributing

1. Read the relevant documentation
2. Check [COMMON_ISSUES.md](./COMMON_ISSUES.md) for known issues
3. Review [DECISIONS_LOG.md](./DECISIONS_LOG.md) for context
4. Follow patterns established in [ARCHITECTURE.md](./ARCHITECTURE.md)
5. Update documentation alongside code changes

---

*Last updated: February 2026*
