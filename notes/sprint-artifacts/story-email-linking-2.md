# Story 5.2: First-Task Prompt + Verification Handling

## Story Info

**Epic:** 5 - Email Linking for Cross-Device Sync
**Story ID:** 5.2
**Status:** TODO
**Tech Spec:** `notes/tech-spec-email-linking.md`
**Depends On:** Story 5.1 (useAuth extensions, LinkEmailModal)

---

## User Story

**As a** new user who just created my first task,
**I want to** be prompted to link my email,
**So that** I know I can sync my tasks and don't lose them.

---

## Acceptance Criteria

- [ ] **AC-5.2.1:** `useFirstTaskPrompt` hook tracks if prompt should show
- [ ] **AC-5.2.2:** Banner appears after first task is created (anonymous user only)
- [ ] **AC-5.2.3:** Banner does NOT appear for already-linked users
- [ ] **AC-5.2.4:** Banner shows "Sync across devices? Link your email" message
- [ ] **AC-5.2.5:** [Link] button opens LinkEmailModal
- [ ] **AC-5.2.6:** [×] dismiss button hides banner
- [ ] **AC-5.2.7:** Dismissing sets localStorage flag `today-app-link-prompt-dismissed`
- [ ] **AC-5.2.8:** Banner does not reappear after dismiss (persists across sessions)
- [ ] **AC-5.2.9:** After clicking magic link in email, user state updates automatically
- [ ] **AC-5.2.10:** SyncStatusIcon changes to solid after successful verification
- [ ] **AC-5.2.11:** LinkEmailModal closes on successful verification (if open)
- [ ] **AC-5.2.12:** Cross-device sync works - same email shows same tasks on different device

---

## Technical Implementation

### Files to Create

**1. `src/hooks/useFirstTaskPrompt.ts`**
```typescript
import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'today-app-link-prompt-dismissed'

export function useFirstTaskPrompt(isAnonymous: boolean, taskCount: number) {
  const [showPrompt, setShowPrompt] = useState(false)
  const [hasTriggered, setHasTriggered] = useState(false)

  // Check if should show prompt
  useEffect(() => {
    // Don't show if already linked
    if (!isAnonymous) return

    // Don't show if previously dismissed
    const dismissed = localStorage.getItem(STORAGE_KEY)
    if (dismissed) return

    // Show after first task created (taskCount goes from 0 to 1)
    if (taskCount === 1 && !hasTriggered) {
      setShowPrompt(true)
      setHasTriggered(true)
    }
  }, [isAnonymous, taskCount, hasTriggered])

  const dismissPrompt = useCallback(() => {
    setShowPrompt(false)
    localStorage.setItem(STORAGE_KEY, 'true')
  }, [])

  return { showPrompt, dismissPrompt }
}
```

**2. `src/components/LinkEmailBanner.tsx`**
```typescript
// Fixed position bottom banner
// Props: onLink (opens modal), onDismiss
// Style: white bg, subtle shadow, matches Toast positioning
// Content: Text + [Link] button + [×] close
```

### Files to Modify

**1. `src/App.tsx`**

Add:
```typescript
import { useFirstTaskPrompt } from './hooks/useFirstTaskPrompt'
import { LinkEmailBanner } from './components/LinkEmailBanner'
import { LinkEmailModal } from './components/LinkEmailModal'

// In component:
const { showPrompt, dismissPrompt } = useFirstTaskPrompt(
  isAnonymous,
  tasks.length
)
const [showLinkModal, setShowLinkModal] = useState(false)

// In JSX:
{showPrompt && (
  <LinkEmailBanner
    onLink={() => setShowLinkModal(true)}
    onDismiss={dismissPrompt}
  />
)}

<LinkEmailModal
  open={showLinkModal}
  onOpenChange={setShowLinkModal}
  onSubmit={linkEmail}
  status={linkingStatus}
  error={linkingError}
/>
```

**2. `src/hooks/useAuth.ts`**

The existing `onAuthStateChange` listener already handles magic link verification:
```typescript
// This fires when user clicks magic link and is redirected back
supabase.auth.onAuthStateChange((_event, session) => {
  setUser(session?.user ?? null)
  // isAnonymous/isLinked will auto-update based on new user state
})
```

Add handling for successful link (auto-close modal):
```typescript
// Reset linking status when user becomes linked
useEffect(() => {
  if (isLinked && linkingStatus === 'sent') {
    setLinkingStatus('idle')
  }
}, [isLinked, linkingStatus])
```

---

## Dev Notes

- Banner z-index should be below modal but above page content
- Use `Cloud` icon from lucide-react in banner for visual consistency
- Test with incognito window to simulate fresh user
- Magic link redirect is handled automatically by Supabase client
- Cross-device test: use different browser or device, sign in with same email

---

## Testing Checklist

**First Task Prompt:**
- [ ] Open incognito/fresh browser
- [ ] Banner does NOT show on empty state
- [ ] Add first task
- [ ] Banner appears after task added
- [ ] Banner shows correct message
- [ ] [Link] button opens modal
- [ ] [×] dismisses banner
- [ ] Refresh page - banner stays dismissed
- [ ] Clear localStorage - banner can appear again

**Magic Link Verification:**
- [ ] Send magic link (from Story 5.1)
- [ ] Click link in email
- [ ] App opens/redirects correctly
- [ ] User state updates (isLinked = true)
- [ ] Icon changes to solid cloud
- [ ] Modal closes if it was open
- [ ] Console shows auth state change log

**Cross-Device Sync:**
- [ ] Device A: Create tasks, link email
- [ ] Device B: Open app (anonymous)
- [ ] Device B: Click cloud icon, enter same email
- [ ] Device B: Click magic link
- [ ] Device B: Verify same tasks appear
- [ ] Device A: Add new task
- [ ] Device B: Verify new task appears (real-time)
