# Lockstep

**RSVPs in sync** — Block-by-block RSVPs for events that deserve more than "yes" or "no."

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-repo/lockstep)

---

## What is Lockstep?

Lockstep is a modern RSVP and event coordination platform designed to eliminate the chaos of multi-day, multi-activity events. Unlike traditional RSVP tools that only capture a simple "yes" or "no", Lockstep lets guests respond to each activity separately.

**Perfect for:**
- 💒 Wedding weekends (ceremony, reception, brunch)
- 🎉 Bachelor/bachelorette parties (multi-day, multiple activities)
- 🏢 Corporate retreats (breakout sessions, dinners)
- 🎂 Milestone birthdays (dinner, party, after-party)
- ✈️ Group trips (ski weekends, beach houses)

## Key Features

| Feature | Description |
|---------|-------------|
| 🧱 **Block-based RSVPs** | Guests respond to each time block separately |
| ✨ **Magic link auth** | Zero friction—no passwords, no accounts for guests |
| 🤖 **AI summaries** | Instant insights from guest responses |
| 📱 **Mobile-first** | Designed for thumbs, works beautifully on phones |
| 📨 **Smart nudges** | SMS, WhatsApp, and email reminders |
| 📊 **Real-time dashboard** | Watch responses come in live |

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, shadcn/ui, Framer Motion
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions)
- **Messaging**: Twilio (SMS/WhatsApp), Resend (Email)
- **AI**: Google AI (Gemini), OpenAI (GPT)
- **Deployment**: Vercel

## Quick Start

```bash
# Clone the repository
git clone https://github.com/your-repo/lockstep.git
cd lockstep

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`.

## Project Structure

```
lockstep/
├── src/
│   ├── components/       # React components
│   │   ├── ui/           # shadcn/ui primitives
│   │   ├── CreateWizard/ # 6-step event creation wizard
│   │   ├── Dashboard/    # Dashboard components
│   │   ├── EventDetail/  # Event detail components
│   │   ├── Profile/      # Profile & avatar components
│   │   └── animations/   # Framer Motion components
│   ├── hooks/            # Custom React hooks
│   ├── pages/            # Route pages (14 pages)
│   ├── queries/          # TanStack Query hooks
│   ├── services/         # API & business logic
│   ├── integrations/     # Supabase client & types
│   ├── data/             # Static data & templates
│   ├── utils/            # Utility functions
│   └── lib/              # Shared utilities
├── supabase/
│   ├── functions/        # Edge Functions (Deno, 10 functions)
│   └── migrations/       # Database migrations (7 files)
├── docs/                 # Comprehensive documentation
├── email-templates/      # Supabase auth email templates
├── scripts/              # Build & utility scripts
└── public/               # Static assets
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run build:dev` | Development build |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

## Documentation

Comprehensive documentation is available in the `/docs` folder:

| Document | Description |
|----------|-------------|
| [README](./docs/README.md) | Documentation index |
| [ARCHITECTURE](./docs/ARCHITECTURE.md) | System design & tech stack |
| [FEATURES](./docs/FEATURES.md) | Feature documentation |
| [ROADMAP](./docs/ROADMAP.md) | Complete product roadmap |
| [DEPLOYMENT](./docs/DEPLOYMENT.md) | Deployment guide |
| [COMMON_ISSUES](./docs/COMMON_ISSUES.md) | Troubleshooting |

## Environment Variables

### Frontend (Vite)

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon key |
| `VITE_GOOGLE_PLACES_API_KEY` | Google Places API key |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |

### Backend (Supabase Edge Functions)

| Secret | Description |
|--------|-------------|
| `GOOGLE_AI_API_KEY` | Google AI (Gemini) API key |
| `OPENAI_API_KEY` | OpenAI API key (fallback) |
| `TWILIO_ACCOUNT_SID` | Twilio Account SID |
| `TWILIO_AUTH_TOKEN` | Twilio Auth Token |
| `RESEND_API_KEY` | Resend email API key |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `PEXELS_API_KEY` | Pexels API for cover photos |
| `OTP_SECRET` | Secret for OTP generation |

See [ENV_VARIABLES.md](./docs/ENV_VARIABLES.md) for complete setup instructions.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is proprietary software. All rights reserved.

---

**Built with ❤️ for event organizers who deserve better than group chat chaos.**
