# Lockstep Documentation

Welcome to the Lockstep project documentation. This folder contains comprehensive documentation for understanding, developing, and maintaining the Lockstep RSVP platform.

## Quick Navigation

| Document | Description |
|----------|-------------|
| [EXECUTIVE_SUMMARY](./EXECUTIVE_SUMMARY.md) | High-level overview for stakeholders |
| [PURPOSE](./PURPOSE.md) | Why Lockstep exists |
| [VALUE_PROP](./VALUE_PROP.md) | Core value proposition |
| [ICP](./ICP.md) | Ideal Customer Profile |
| [FEATURES](./FEATURES.md) | Complete feature documentation |
| [ARCHITECTURE](./ARCHITECTURE.md) | Technical architecture overview |
| [DESIGN_SYSTEM](./DESIGN_SYSTEM.md) | UI/UX design system |
| [VISUAL_GUIDELINES](./VISUAL_GUIDELINES.md) | Brand visual standards |
| [BRANDING](./BRANDING.md) | Brand identity guidelines |
| [DEPLOYMENT](./DEPLOYMENT.md) | Deployment procedures |
| [REPLICATION_GUIDE](./REPLICATION_GUIDE.md) | How to replicate this project |
| [COMMON_ISSUES](./COMMON_ISSUES.md) | Troubleshooting guide |
| [DECISIONS_LOG](./DECISIONS_LOG.md) | Architectural decisions record |
| [HISTORY](./HISTORY.md) | Project evolution timeline |
| [OUTCOMES](./OUTCOMES.md) | Success metrics and KPIs |
| [LLM_CRITICAL_THINKING_TRAINING](./LLM_CRITICAL_THINKING_TRAINING.md) | AI assistant context |

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, shadcn/ui
- **Animation**: Framer Motion
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions)
- **APIs**: OpenAI, Google AI, Twilio, Resend

## Project Structure

```
src/
├── components/       # React components
│   ├── ui/          # shadcn/ui components
│   ├── EventWizard/ # Event creation flow
│   └── animations/  # Animation components
├── hooks/           # Custom React hooks
├── pages/           # Route pages
├── integrations/    # External service integrations
├── lib/             # Utility functions
└── assets/          # Static assets
```
