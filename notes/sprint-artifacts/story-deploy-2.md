# Story: Configure Custom Domain

**Story ID:** deploy-2
**Epic:** Production Deployment
**Status:** TODO
**Depends On:** deploy-1

---

## User Story

**As a** product owner
**I want to** access the app at productivity.pitchsmith.ai
**So that** users have a branded, memorable URL

---

## Technical Context

**Tech Spec Reference:** [tech-spec.md](../tech-spec.md)

**Prerequisites:**
- Story deploy-1 completed (app deployed to `.pages.dev`)
- pitchsmith.ai domain managed in Cloudflare DNS

---

## Tasks

### Task 1: Access Cloudflare Pages Dashboard

1. Go to https://dash.cloudflare.com
2. Navigate to: **Workers & Pages** → **today-productivity**
3. Click **Custom domains** tab

### Task 2: Add Custom Domain

1. Click **"Set up a custom domain"**
2. Enter: `productivity.pitchsmith.ai`
3. Click **Continue**

**Cloudflare will automatically:**
- Create a CNAME record pointing to your Pages deployment
- Provision an SSL certificate
- Configure edge routing

### Task 3: Wait for DNS Propagation

- Usually takes less than 5 minutes (since domain is already on Cloudflare)
- Status will show "Active" when ready

### Task 4: Verify Custom Domain

- [ ] Navigate to `https://productivity.pitchsmith.ai`
- [ ] SSL certificate shows valid (green lock)
- [ ] App loads correctly
- [ ] No mixed content warnings

---

## Acceptance Criteria

- [ ] AC-1: Custom domain configured in Cloudflare Pages
- [ ] AC-2: DNS record created automatically
- [ ] AC-3: SSL certificate provisioned and valid
- [ ] AC-4: App accessible at https://productivity.pitchsmith.ai
- [ ] AC-5: HTTP automatically redirects to HTTPS

---

## Troubleshooting

**If domain doesn't work:**
1. Verify pitchsmith.ai is active in Cloudflare
2. Check DNS tab for the CNAME record
3. Wait up to 24 hours for edge propagation (rare)

**If SSL shows invalid:**
1. Cloudflare auto-provisions certs - wait 10 minutes
2. Check Universal SSL is enabled in SSL/TLS settings

---

## Definition of Done

- [ ] All tasks completed
- [ ] All acceptance criteria met
- [ ] App accessible at branded URL
- [ ] Ready for Story 3 (environment variables)
