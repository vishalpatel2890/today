# Epic 5: Email Linking for Cross-Device Sync

## Epic Overview

**Goal:** Enable users to optionally link their anonymous account to an email address via magic link, allowing them to access their tasks from any device.

**Value Proposition:** Users who want cross-device sync can opt-in without disrupting the "no account required" simplicity for casual users.

**Epic Slug:** `email-linking`

---

## Stories

| Story | Title | Status |
|-------|-------|--------|
| 5.1 | Link Email UI + Send Magic Link | TODO |
| 5.2 | First-Task Prompt + Verification Handling | TODO |

---

## Technical Context

**Tech Spec:** `notes/tech-spec-email-linking.md`

**Key Files:**
- `src/hooks/useAuth.ts` - Extend with email linking
- `src/components/Header.tsx` - Add sync status icon
- `src/components/SyncStatusIcon.tsx` - NEW
- `src/components/LinkEmailModal.tsx` - NEW
- `src/components/LinkEmailBanner.tsx` - NEW
- `src/hooks/useFirstTaskPrompt.ts` - NEW

**Dependencies:** None new (uses existing Supabase, Radix, Lucide)

---

## Acceptance Criteria Summary

- [ ] Anonymous users see prompt after first task
- [ ] Users can enter email and receive magic link
- [ ] Magic link click upgrades anonymous → email account
- [ ] Header shows sync status (hollow cloud = anonymous, solid = linked)
- [ ] Same email works across devices to access same data
- [ ] Errors handled gracefully (expired link, duplicate email)

---

## Definition of Done

- [ ] All story acceptance criteria met
- [ ] Manual testing checklist completed
- [ ] No TypeScript errors
- [ ] Code follows existing conventions
