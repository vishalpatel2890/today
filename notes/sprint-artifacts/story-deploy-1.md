# Story: Initial Cloudflare Pages Deployment

**Story ID:** deploy-1
**Epic:** Production Deployment
**Status:** TODO

---

## User Story

**As a** developer
**I want to** deploy the Today app to Cloudflare Pages
**So that** the app is accessible on the web with a `.pages.dev` URL

---

## Technical Context

**Tech Spec Reference:** [tech-spec.md](../tech-spec.md)

**Stack:**
- Vite 7.2.4 (build)
- Cloudflare Wrangler CLI (deploy)
- Node.js 20.x

---

## Tasks

### Task 1: Install and Configure Wrangler CLI

```bash
# Install globally
npm install -g wrangler

# Authenticate with Cloudflare
wrangler login
```

**Acceptance:** `wrangler whoami` shows your Cloudflare account

### Task 2: Build Production Bundle

```bash
cd /Users/vishalpatel/Documents/apps/to-do/today-app

# Install dependencies (if needed)
npm install

# Build for production
npm run build
```

**Acceptance:**
- Build completes without errors
- `dist/` folder contains `index.html` and assets

### Task 3: Deploy to Cloudflare Pages

```bash
npx wrangler pages deploy dist --project-name=today-productivity
```

**First run will:**
1. Create the project `today-productivity`
2. Upload the `dist/` folder
3. Return a URL like `https://today-productivity.pages.dev`

**Acceptance:** Deployment URL is accessible and shows the app

### Task 4: Verify Deployment

- [ ] Navigate to the `.pages.dev` URL
- [ ] App loads without errors
- [ ] All three views (Today, Tomorrow, Deferred) render
- [ ] Console shows no critical errors (Supabase may fail without env vars - OK for now)

---

## Acceptance Criteria

- [ ] AC-1: Wrangler CLI installed and authenticated
- [ ] AC-2: Production build succeeds
- [ ] AC-3: App deployed to `*.pages.dev` URL
- [ ] AC-4: App UI loads correctly at deployment URL

---

## Notes

- Supabase functionality won't work yet (env vars not configured)
- This is intentional - we verify the static deployment first
- Environment variables are configured in Story 3

---

## Definition of Done

- [ ] All tasks completed
- [ ] All acceptance criteria met
- [ ] Deployment URL documented
- [ ] Ready for Story 2 (custom domain)
