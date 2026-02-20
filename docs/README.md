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

The development server runs at `http://localhost:8080`.

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
│   │   ├── ui/               # shadcn/ui primitives
│   │   ├── CreateWizard/     # 6-step event creation wizard
│   │   │   ├── steps/        # Individual wizard steps
│   │   │   └── components/   # Wizard sub-components
│   │   └── animations/       # Framer Motion components
│   ├── hooks/                # Custom React hooks
│   ├── pages/                # Route pages
│   │   ├── Index.tsx         # Landing page
│   │   ├── Auth.tsx          # Authentication
│   │   ├── CreateEvent.tsx   # Event wizard
│   │   ├── Dashboard.tsx     # Organizer dashboard
│   │   ├── EventDetail.tsx   # Single event view
│   │   ├── RSVPPage.tsx      # Guest RSVP experience
│   │   ├── Pricing.tsx       # Pricing tiers
│   │   └── Profile.tsx       # User profile
│   ├── services/             # Business logic
│   │   ├── subscription.ts   # Tier limits, billing
│   │   ├── llm/              # AI integration
│   │   └── places/           # Google Places API
│   ├── integrations/         # External integrations
│   │   └── supabase/         # Supabase client & types
│   └── lib/                  # Utilities
├── supabase/
│   ├── functions/            # Edge Functions (Deno)
│   │   ├── generate-description/
│   │   ├── generate-summary/
│   │   ├── send-nudge/
│   │   ├── fetch-pexels/
│   │   ├── create-checkout-session/
│   │   └── stripe-webhook/
│   └── migrations/           # Database migrations
├── docs/                     # This documentation
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
| `/pricing` | Pricing tiers | No |
| `/profile` | User profile | Yes |

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

---

## Database Tables

| Table | Purpose |
|-------|---------|
| `events` | Event metadata (title, dates, location) |
| `blocks` | Time blocks/activities within events |
| `guests` | Invitees with magic tokens |
| `rsvps` | Guest responses per block |
| `questions` | Custom questions for events |
| `answers` | Guest answers to questions |
| `checkpoints` | Nudge schedule |
| `nudges` | Sent message audit log |
| `subscriptions` | User subscription status |
| `event_purchases` | Per-event upgrades |

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

*Last updated: January 2025*
