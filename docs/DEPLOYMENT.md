# Deployment

## Overview

Lockstep uses a modern JAMstack architecture with:
- **Frontend**: Static React app deployed to Vercel
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions, Storage)

---

## Environments

| Environment | URL | Branch | Purpose |
|-------------|-----|--------|---------|
| Production | `inlockstep.ai` | `main` | Live users |
| Preview | PR-specific URLs | Feature branches | PR review |
| Development | `localhost:8080` | Local | Development |

---

## Frontend Deployment

### Vercel Platform

Frontend deploys automatically via Vercel GitHub integration:

1. **Development**: Run `npm run dev` locally
2. **Preview**: Every PR gets a preview deployment
3. **Production**: Merge to `main` triggers production deploy
4. **Custom Domain**: Configure in Vercel Project Settings → Domains

### Build Process

```bash
# Local build (for testing)
npm run build

# Output
dist/
├── index.html
├── assets/
│   ├── index-[hash].js
│   ├── index-[hash].css
│   └── ...
└── ...
```

### Vercel Configuration

See `vercel.json` for:
- SPA rewrites (all routes → index.html)
- Security headers
- Asset caching

---

## Backend Deployment

### Supabase Configuration

| Component | Deployment |
|-----------|------------|
| Database | Migrations in `supabase/migrations/` |
| Auth | Configured via Supabase Dashboard |
| Edge Functions | `supabase/functions/` |
| Storage | Configured via Dashboard |

### Database Migrations

Migrations are SQL files in `supabase/migrations/`:

```
supabase/migrations/
├── 20251225063926_initial_schema.sql
├── 20251226120000_add_schema_updates.sql
└── ...
```

**Creating migrations**: Use Supabase CLI or Dashboard.

**Applying migrations**: 
```bash
supabase db push
```

### Edge Functions

Located in `supabase/functions/`:

```
supabase/functions/
├── generate-description/
│   └── index.ts
├── generate-summary/
│   └── index.ts
├── send-nudge/
│   └── index.ts
├── process-checkpoint/
│   └── index.ts
└── webhook-twilio/
    └── index.ts
```

**Deployment**:
```bash
supabase functions deploy <function-name>
```

---

## Environment Variables

### Frontend (Vercel)

Set in Vercel Project Settings → Environment Variables:

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon key |
| `VITE_GOOGLE_PLACES_API_KEY` | Google Places API key |

### Backend (Supabase Secrets)

Set in Supabase Dashboard → Edge Functions → Secrets:

| Secret | Purpose |
|--------|---------|
| `GOOGLE_AI_API_KEY` | Primary LLM (Gemini) |
| `OPENAI_API_KEY` | Fallback LLM |
| `TWILIO_ACCOUNT_SID` | SMS/WhatsApp |
| `TWILIO_API_SECRET` | SMS authentication |
| `RESEND_API_KEY` | Email sending |

See `docs/ENV_VARIABLES.md` for complete documentation.

---

## Deployment Checklist

### Before Deploy

- [ ] All TypeScript errors resolved
- [ ] No lint errors (`npm run lint`)
- [ ] Local build succeeds (`npm run build`)
- [ ] Database migrations reviewed

### Production Deploy

1. Push to `main` branch
2. Vercel auto-deploys
3. Verify production site loads
4. Test critical user flows:
   - Event creation wizard
   - RSVP flow
   - Dashboard

### Post-Deploy

- [ ] Monitor for errors (15 min)
- [ ] Verify database migrations applied
- [ ] Test edge functions
- [ ] Check AI integrations working

---

## Rollback Procedures

### Frontend Rollback

1. Go to Vercel Dashboard
2. View Deployments tab
3. Click "..." on previous deployment
4. Select "Promote to Production"

### Database Rollback

⚠️ **Caution**: Database changes are harder to roll back.

1. Create a backup before risky migrations
2. Write reverse migrations when possible
3. Use Supabase point-in-time recovery if needed

### Edge Function Rollback

1. Revert code changes in Git
2. Redeploy: `supabase functions deploy <name>`

---

## Monitoring

### Error Tracking

Recommended:
- Sentry (frontend + edge functions)
- Supabase Logs (database + auth)

### Health Checks

| Component | Check |
|-----------|-------|
| Frontend | Homepage loads |
| Auth | Login flow works |
| Database | Query returns data |
| Edge Functions | Test endpoint responds |
| AI | Description generation works |

### Performance Targets

| Metric | Target |
|--------|--------|
| LCP (Largest Contentful Paint) | < 2.5s |
| FID (First Input Delay) | < 100ms |
| CLS (Cumulative Layout Shift) | < 0.1 |
| Event Creation | < 45s |
| RSVP Completion | < 30s |
| AI Generation | < 2s |

---

## Custom Domain Setup

### Vercel

1. Go to Vercel Project Settings → Domains
2. Add your domain (e.g., `inlockstep.ai`)
3. Configure DNS as instructed:
   - `A` record → Vercel IP
   - `CNAME` for www → `cname.vercel-dns.com`
4. SSL certificate auto-provisions

### DNS Configuration Example

```
Type    Name    Value
A       @       76.76.21.21
CNAME   www     cname.vercel-dns.com
```

### Current Configuration

- **Production**: `inlockstep.ai`
- **Supabase Site URL**: `https://inlockstep.ai` (set in Dashboard → Authentication → URL Configuration)
