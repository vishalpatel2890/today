# Today - Technical Specification

**Author:** Vishal
**Date:** 2026-01-06
**Project Level:** Quick-Flow
**Change Type:** Deployment / Infrastructure
**Development Context:** Brownfield (existing React app)

---

## Context

### Available Documents

- ○ No product briefs found
- ○ No research documents found
- ○ No brownfield documentation index found
- ✓ Analyzed existing codebase structure directly

### Project Stack

**Runtime & Framework:**
- React 19.2.0
- Vite 7.2.4 (build tool)
- TypeScript 5.9.3

**Styling:**
- Tailwind CSS 4.1.18
- PostCSS 8.5.6
- Autoprefixer 10.4.23

**Backend Services:**
- Supabase JS Client 2.89.0 (auth + database)

**UI Components:**
- Radix UI Dialog 1.1.15
- Radix UI Popover 1.1.15
- Radix UI Select 2.2.6
- Lucide React 0.562.0 (icons)

**Utilities:**
- date-fns 4.1.0

**Dev Tools:**
- ESLint 9.39.1
- Vite React Plugin 5.1.1

**Build Output:** Static SPA (HTML/JS/CSS) → `dist/` folder

### Existing Codebase Structure

```
today-app/
├── src/
│   ├── components/        # UI components (Header, TabBar, TaskCard, etc.)
│   ├── views/             # Page views (TodayView, TomorrowView, DeferredView)
│   ├── hooks/             # Custom hooks (useTasks, useAuth, useAutoSurface)
│   ├── contexts/          # React contexts (ToastContext)
│   ├── lib/               # External service clients (supabase.ts)
│   ├── types/             # TypeScript types
│   ├── utils/             # Utility functions (storage.ts)
│   ├── App.tsx            # Main app component
│   └── main.tsx           # Entry point
├── package.json
├── vite.config.ts
├── tsconfig.json
└── index.html
```

**Key Patterns:**
- Functional components with hooks
- Custom hooks for state management (useTasks, useAuth)
- Context API for global state (ToastContext)
- Environment variables via `import.meta.env.VITE_*`

---

## The Change

### Problem Statement

The Today task management app needs to be deployed to production at `productivity.pitchsmith.ai`. The solution must be:
1. The absolute cheapest option available ($0/month preferred)
2. Simple to set up and maintain
3. Compatible with the existing React/Vite static build

### Proposed Solution

Deploy to **Cloudflare Pages** (free tier) with custom subdomain configuration.

**Why Cloudflare Pages:**
- **Cost:** $0/month (unlimited requests, bandwidth)
- **Integration:** Domain already registered with Cloudflare (seamless DNS)
- **Features:** Free SSL, global CDN, automatic builds
- **Simplicity:** Direct CLI deployment or Git integration

### Scope

**In Scope:**

1. Configure Vite build for production deployment
2. Set up Cloudflare Pages project
3. Configure `productivity.pitchsmith.ai` subdomain DNS
4. Set environment variables for Supabase connection
5. Deploy the application
6. Verify SSL and functionality

**Out of Scope:**

- CI/CD pipeline automation (manual deploys for now)
- Multiple environments (staging, preview)
- Custom error pages
- Analytics integration
- Performance monitoring

---

## Implementation Details

### Source Tree Changes

| File | Action | Description |
|------|--------|-------------|
| `today-app/vite.config.ts` | MODIFY | Add base path configuration if needed |
| `today-app/.env.production` | CREATE | Production environment variables template |
| `today-app/wrangler.toml` | CREATE | Optional Cloudflare Pages configuration |

### Technical Approach

**Deployment Method:** Cloudflare Wrangler CLI (direct deploy)

This is the simplest approach:
1. Build the app locally: `npm run build`
2. Deploy to Cloudflare Pages: `npx wrangler pages deploy dist`
3. Configure custom domain in Cloudflare dashboard

**Alternative:** Git integration (auto-deploy on push) - can be added later if desired.

### Existing Patterns to Follow

**Environment Variables:**
The app uses Vite's environment variable pattern:
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key

These must be configured in Cloudflare Pages dashboard under Settings → Environment Variables.

**Build Process:**
- Build command: `npm run build` (runs `tsc -b && vite build`)
- Output directory: `dist`
- No special configuration needed for static SPA

### Integration Points

**External Services:**
- **Supabase:** Auth and database (already configured, just needs env vars)
- **Cloudflare DNS:** Subdomain pointing to Pages deployment
- **Cloudflare Pages:** Static hosting with CDN

**No Backend Changes Required:** The app is a static SPA that connects directly to Supabase from the browser.

---

## Development Context

### Relevant Existing Code

- `today-app/src/lib/supabase.ts:4-5` - Environment variable usage
- `today-app/vite.config.ts` - Build configuration
- `today-app/package.json:8` - Build script definition

### Dependencies

**Framework/Libraries:**
- Vite 7.2.4 (build tool)
- React 19.2.0 (framework)
- TypeScript 5.9.3 (language)

**External Services:**
- Supabase (existing, no changes needed)
- Cloudflare Pages (new)
- Cloudflare DNS (existing)

**Internal Modules:**
- No internal module changes required

### Configuration Changes

**Cloudflare Pages Settings:**
```
Build command: npm run build
Build output directory: dist
Root directory: today-app
Node.js version: 20
```

**Environment Variables (Cloudflare Dashboard):**
```
VITE_SUPABASE_URL=<your-supabase-project-url>
VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
```

### Existing Conventions (Brownfield)

Following existing project patterns:
- Environment variables prefixed with `VITE_`
- Build outputs to `dist/` directory
- No changes to code conventions needed (deployment only)

### Test Framework & Standards

**No tests currently configured** - the project doesn't have a test setup. Deployment verification will be manual:
- Verify app loads at production URL
- Verify Supabase connection works
- Verify all views render correctly

---

## Implementation Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Hosting | Cloudflare Pages | Latest |
| CDN | Cloudflare (included) | Latest |
| SSL | Cloudflare (automatic) | Latest |
| DNS | Cloudflare | Existing |
| Build | Vite | 7.2.4 |
| Runtime | Node.js | 20.x |
| Deploy CLI | Wrangler | Latest |

---

## Technical Details

### Cloudflare Pages Free Tier Limits

- **Builds:** 500 per month
- **Bandwidth:** Unlimited
- **Requests:** Unlimited
- **Sites:** Unlimited
- **Custom domains:** Unlimited

These limits are more than sufficient for this application.

### DNS Configuration

**Subdomain:** `productivity.pitchsmith.ai`
**Record Type:** CNAME
**Target:** `<project-name>.pages.dev` (provided by Cloudflare Pages)

Cloudflare handles this automatically when you add a custom domain through the Pages dashboard.

### SPA Routing

Cloudflare Pages automatically handles SPA routing. No additional configuration needed for client-side routing.

### Environment Variable Security

- Supabase anon key is safe to expose (designed for client-side use)
- RLS (Row Level Security) on Supabase handles data access control
- No secrets need to be hidden from the client

---

## Development Setup

**Prerequisites:**
1. Node.js 20.x installed
2. npm (comes with Node.js)
3. Cloudflare account (free)
4. Wrangler CLI: `npm install -g wrangler`

**Local Development:**
```bash
cd today-app
npm install
npm run dev
```

**Production Build Test:**
```bash
npm run build
npm run preview  # Test production build locally
```

---

## Implementation Guide

### Setup Steps

1. ☐ Ensure Cloudflare account exists and is logged in
2. ☐ Install Wrangler CLI globally: `npm install -g wrangler`
3. ☐ Authenticate Wrangler: `wrangler login`
4. ☐ Get Supabase credentials ready (URL and anon key)

### Implementation Steps

**Story 1: Initial Cloudflare Pages Deployment**

1. Navigate to project directory:
   ```bash
   cd /Users/vishalpatel/Documents/apps/to-do/today-app
   ```

2. Build the production bundle:
   ```bash
   npm run build
   ```

3. Deploy to Cloudflare Pages:
   ```bash
   npx wrangler pages deploy dist --project-name=today-productivity
   ```
   - First run will create the project
   - Note the generated `*.pages.dev` URL

4. Verify deployment works at the `.pages.dev` URL

**Story 2: Configure Custom Domain**

1. Go to Cloudflare Dashboard → Pages → today-productivity
2. Click "Custom domains" tab
3. Click "Set up a custom domain"
4. Enter: `productivity.pitchsmith.ai`
5. Cloudflare will automatically configure DNS (since domain is on Cloudflare)
6. Wait for SSL certificate provisioning (usually < 5 minutes)

**Story 3: Configure Environment Variables**

1. Go to Cloudflare Dashboard → Pages → today-productivity
2. Click "Settings" → "Environment variables"
3. Add production variables:
   - `VITE_SUPABASE_URL` = your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` = your Supabase anon key
4. Trigger a new deployment to apply variables:
   ```bash
   npm run build && npx wrangler pages deploy dist --project-name=today-productivity
   ```

### Testing Strategy

**Manual Verification Checklist:**
- [ ] App loads at `https://productivity.pitchsmith.ai`
- [ ] SSL certificate is valid (green lock icon)
- [ ] Today view renders correctly
- [ ] Tomorrow view renders correctly
- [ ] Deferred view renders correctly
- [ ] Can create a new task
- [ ] Can complete a task
- [ ] Can defer a task
- [ ] Toast notifications appear
- [ ] Auth flow works (if applicable)

### Acceptance Criteria

1. ✓ App is accessible at `https://productivity.pitchsmith.ai`
2. ✓ SSL certificate is valid and auto-renewed
3. ✓ All app functionality works identically to local development
4. ✓ Supabase connection is successful
5. ✓ Page loads in under 3 seconds globally (CDN)
6. ✓ Total hosting cost is $0/month

---

## Developer Resources

### File Paths Reference

| Path | Purpose |
|------|---------|
| `today-app/dist/` | Production build output |
| `today-app/vite.config.ts` | Vite configuration |
| `today-app/package.json` | Dependencies and scripts |
| `today-app/src/lib/supabase.ts` | Supabase client config |

### Key Code Locations

- Entry point: `today-app/src/main.tsx:1`
- App component: `today-app/src/App.tsx:104`
- Supabase client: `today-app/src/lib/supabase.ts:11`
- Environment vars: `today-app/src/lib/supabase.ts:4-5`

### Testing Locations

No automated tests configured. Manual testing via browser.

### Documentation to Update

- [ ] README.md - Add deployment instructions
- [ ] Add `.env.example` file documenting required variables

---

## UX/UI Considerations

No UI/UX changes - deployment only. The app will function identically to local development.

---

## Testing Approach

**Pre-deployment:**
- Run `npm run build` and verify no errors
- Run `npm run preview` and test locally

**Post-deployment:**
- Verify all views load
- Test CRUD operations on tasks
- Verify responsive design on mobile
- Test in multiple browsers (Chrome, Safari, Firefox)

---

## Deployment Strategy

### Deployment Steps

1. Build: `npm run build`
2. Deploy: `npx wrangler pages deploy dist --project-name=today-productivity`
3. Verify at `.pages.dev` URL
4. Verify at custom domain

### Rollback Plan

Cloudflare Pages keeps deployment history. To rollback:

1. Go to Cloudflare Dashboard → Pages → today-productivity
2. Click "Deployments" tab
3. Find previous working deployment
4. Click "..." → "Rollback to this deployment"

### Monitoring

**Cloudflare Analytics (Free):**
- Request count
- Bandwidth usage
- Geographic distribution
- Status codes

Access via: Cloudflare Dashboard → Pages → today-productivity → Analytics
