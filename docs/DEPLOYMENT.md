# Deployment

## Overview

Lockstep uses a modern JAMstack architecture with:
- **Frontend**: Static React app deployed to Lovable's CDN
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions, Storage)

---

## Environments

| Environment | URL | Branch | Purpose |
|-------------|-----|--------|---------|
| Production | `lockstep.app` | `main` | Live users |
| Staging | `*.lovable.app` | `main` | Pre-release testing |
| Preview | PR-specific URLs | Feature branches | PR review |

---

## Frontend Deployment

### Lovable Platform

Frontend deploys automatically via Lovable:

1. **Development**: Changes appear instantly in preview iframe
2. **Publishing**: Click "Publish" → "Update" to deploy to production
3. **Custom Domain**: Configure in Project Settings → Domains

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

### Build Configuration

**vite.config.ts**:
```ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-*'],
        }
      }
    }
  }
})
```

---

## Backend Deployment

### Supabase Configuration

Backend is managed via Lovable Cloud (Supabase under the hood):

| Component | Deployment |
|-----------|------------|
| Database | Migrations in `supabase/migrations/` |
| Auth | Configured via Lovable tools |
| Edge Functions | `supabase/functions/` → Auto-deployed |
| Storage | Configured via Dashboard |

### Database Migrations

Migrations are SQL files in `supabase/migrations/`:

```
supabase/migrations/
├── 20251225063926_initial_schema.sql
├── 20251226120000_add_nudges.sql
└── ...
```

**Creating migrations**: Use the Lovable migration tool (never edit manually).

**Applying migrations**: Automatic on approval in Lovable.

### Edge Functions

Located in `supabase/functions/`:

```
supabase/functions/
├── send-nudge/
│   └── index.ts
├── generate-summary/
│   └── index.ts
└── ...
```

**Deployment**: Automatic when files change.

**Testing**: Use `supabase--curl_edge_functions` tool.

---

## Environment Variables

### Frontend (Client-side)

Exposed to browser (must be prefixed with `VITE_`):

| Variable | Source |
|----------|--------|
| `VITE_SUPABASE_URL` | Auto-configured |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Auto-configured |

### Backend (Secrets)

Server-side only, never exposed to client:

| Secret | Purpose |
|--------|---------|
| `SUPABASE_SERVICE_ROLE_KEY` | Admin database access |
| `OPENAI_API_KEY` | AI summaries |
| `GOOGLE_AI_API_KEY` | AI summaries (alt) |
| `TWILIO_ACCOUNT_SID` | SMS sending |
| `TWILIO_AUTH_TOKEN` | SMS authentication |
| `RESEND_API_KEY` | Email sending |

**Managing secrets**: Use Lovable's secrets tool.

---

## Deployment Checklist

### Before Deploy

- [ ] All tests passing locally
- [ ] No TypeScript errors (`npm run typecheck`)
- [ ] No lint errors (`npm run lint`)
- [ ] Preview tested in Lovable
- [ ] Database migrations reviewed

### Production Deploy

- [ ] Merge to `main` branch
- [ ] Click "Publish" → "Update" in Lovable
- [ ] Verify production site loads
- [ ] Test critical user flows
- [ ] Check error monitoring (if configured)

### Post-Deploy

- [ ] Monitor for errors (15 min)
- [ ] Verify database migrations applied
- [ ] Test edge functions
- [ ] Notify team of deployment

---

## Rollback Procedures

### Frontend Rollback

1. Go to Lovable project settings
2. View deployment history
3. Click "Restore" on previous version
4. Verify rollback successful

### Database Rollback

⚠️ **Caution**: Database changes are harder to roll back.

1. Create a backup before risky migrations
2. Write reverse migrations when possible
3. Contact support for point-in-time recovery

### Edge Function Rollback

1. Revert code changes in Git
2. Push to trigger new deployment
3. Or manually deploy previous version

---

## Monitoring

### Error Tracking (Recommended Setup)

Options:
- Sentry (frontend + edge functions)
- LogRocket (frontend session replay)
- Supabase Logs (database + auth)

### Health Checks

| Component | Check |
|-----------|-------|
| Frontend | Homepage loads |
| Auth | Login flow works |
| Database | Query returns data |
| Edge Functions | Test endpoint responds |

### Alerts

Configure alerts for:
- 5xx error rate > 1%
- Database connection failures
- Edge function timeouts
- Auth failures spike

---

## Performance Optimization

### Frontend

- **Code splitting**: Dynamic imports for routes
- **Asset optimization**: Images in `src/assets/` auto-optimized
- **Caching**: Static assets cached at CDN
- **Compression**: Gzip/Brotli by default

### Backend

- **Database indexes**: Added for frequent queries
- **Connection pooling**: Managed by Supabase
- **Edge locations**: Functions run at edge

### Metrics to Monitor

| Metric | Target |
|--------|--------|
| LCP (Largest Contentful Paint) | < 2.5s |
| FID (First Input Delay) | < 100ms |
| CLS (Cumulative Layout Shift) | < 0.1 |
| API Response Time (p95) | < 500ms |
| Edge Function Duration | < 10s |

---

## Custom Domain Setup

1. Go to Project Settings → Domains
2. Click "Connect Domain"
3. Enter your domain (e.g., `lockstep.app`)
4. Add DNS records as instructed:
   - `A` record → Lovable IP
   - `CNAME` for www → Lovable subdomain
5. Wait for SSL certificate provisioning
6. Verify domain is working

### DNS Configuration Example

```
Type    Name    Value
A       @       76.76.21.21
CNAME   www     cname.lovable.app
```
