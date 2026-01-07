# Story: Configure Environment Variables

**Story ID:** deploy-3
**Epic:** Production Deployment
**Status:** TODO
**Depends On:** deploy-1, deploy-2

---

## User Story

**As a** user
**I want to** have full app functionality in production
**So that** I can create, manage, and sync my tasks

---

## Technical Context

**Tech Spec Reference:** [tech-spec.md](../tech-spec.md)

**Required Environment Variables:**
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key

**Source:** These values come from your Supabase project dashboard.

---

## Tasks

### Task 1: Get Supabase Credentials

1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon public** key (starts with `eyJ...`)

### Task 2: Configure Environment Variables in Cloudflare

1. Go to https://dash.cloudflare.com
2. Navigate to: **Workers & Pages** → **today-productivity**
3. Click **Settings** → **Environment variables**
4. Click **Add variable** for each:

| Variable Name | Value |
|--------------|-------|
| `VITE_SUPABASE_URL` | `https://your-project.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIs...` |

5. Set **Environment:** Production
6. Click **Save**

### Task 3: Trigger New Deployment

Environment variables only take effect on new deployments.

```bash
cd /Users/vishalpatel/Documents/apps/to-do/today-app

# Rebuild and redeploy
npm run build
npx wrangler pages deploy dist --project-name=today-productivity
```

### Task 4: Verify Full Functionality

Test at `https://productivity.pitchsmith.ai`:

- [ ] App loads without console errors
- [ ] Can create a new task
- [ ] Can complete a task
- [ ] Can delete a task
- [ ] Can defer a task to another date
- [ ] Toast notifications appear
- [ ] Data persists after page refresh
- [ ] Auth works (if using Supabase auth)

---

## Acceptance Criteria

- [ ] AC-1: Environment variables configured in Cloudflare Pages
- [ ] AC-2: New deployment triggered with env vars
- [ ] AC-3: No Supabase connection errors in browser console
- [ ] AC-4: All CRUD operations work
- [ ] AC-5: Data syncs with Supabase database

---

## Security Notes

- The Supabase `anon` key is designed to be public
- Row Level Security (RLS) on Supabase protects data
- Never expose the `service_role` key in client code

---

## Definition of Done

- [ ] All tasks completed
- [ ] All acceptance criteria met
- [ ] Full app functionality verified
- [ ] Epic 5 complete - app is live!

---

## Post-Deployment Checklist

After all stories complete:

- [ ] Bookmark production URL
- [ ] Test on mobile device
- [ ] Test in incognito/private browsing
- [ ] Share URL with any beta testers
- [ ] Consider setting up Cloudflare Web Analytics (free)
