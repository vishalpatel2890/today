# Story 5.1: Link Email UI + Send Magic Link

## Story Info

**Epic:** 5 - Email Linking for Cross-Device Sync
**Story ID:** 5.1
**Status:** TODO
**Tech Spec:** `notes/tech-spec-email-linking.md`

---

## User Story

**As a** user with tasks I want to keep,
**I want to** link my email to my account,
**So that** I can access my tasks from any device.

---

## Acceptance Criteria

- [ ] **AC-5.1.1:** `useAuth` hook exposes `isAnonymous` boolean (true if user.is_anonymous)
- [ ] **AC-5.1.2:** `useAuth` hook exposes `isLinked` boolean (true if has email)
- [ ] **AC-5.1.3:** `useAuth` hook exposes `linkEmail(email: string)` async function
- [ ] **AC-5.1.4:** `useAuth` hook exposes `linkingStatus` ('idle' | 'sending' | 'sent' | 'error')
- [ ] **AC-5.1.5:** `SyncStatusIcon` component renders in Header
- [ ] **AC-5.1.6:** Icon shows hollow cloud when anonymous, solid when linked
- [ ] **AC-5.1.7:** Clicking icon opens `LinkEmailModal`
- [ ] **AC-5.1.8:** Modal has email input with validation (valid email format required)
- [ ] **AC-5.1.9:** Submitting valid email calls `supabase.auth.updateUser({ email })`
- [ ] **AC-5.1.10:** Success state shows "Check your email for a magic link"
- [ ] **AC-5.1.11:** Error "Email already in use" displays for duplicate emails
- [ ] **AC-5.1.12:** Tooltip on linked icon shows user's email address

---

## Technical Implementation

### Files to Create

**1. `src/components/SyncStatusIcon.tsx`**
```typescript
// Cloud icon from Lucide
// Props: isLinked, email, onClick
// Renders: Cloud (solid if linked, outline if not)
// Tooltip: "Not synced" or "Synced to {email}"
```

**2. `src/components/LinkEmailModal.tsx`**
```typescript
// Radix Dialog (follow DeferModal pattern)
// Props: open, onOpenChange, onSubmit, status, error
// States: input → loading → success → error
// Email validation before submit
```

### Files to Modify

**1. `src/hooks/useAuth.ts`**

Add to existing hook:
```typescript
// New state
const [linkingStatus, setLinkingStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
const [linkingError, setLinkingError] = useState<string | null>(null)

// Computed
const isAnonymous = user?.is_anonymous ?? true
const isLinked = !isAnonymous && !!user?.email

// New function
const linkEmail = async (email: string) => {
  setLinkingStatus('sending')
  setLinkingError(null)

  const { error } = await supabase.auth.updateUser({ email })

  if (error) {
    setLinkingStatus('error')
    setLinkingError(error.message)
    return
  }

  setLinkingStatus('sent')
}

// Return new values
return {
  user, isLoading, error,
  isAnonymous, isLinked,
  linkEmail, linkingStatus, linkingError
}
```

**2. `src/components/Header.tsx`**

Add SyncStatusIcon to right side of header.

---

## Dev Notes

- Use `Cloud` icon from `lucide-react` for both states
- Solid fill via `fill="currentColor"` when linked
- Modal should match DeferModal styling (white bg, rounded, shadow)
- Email validation: basic regex or `input type="email"` native validation
- Console log auth events with `[Today] Auth:` prefix in dev mode

---

## Testing Checklist

- [ ] Icon renders in header
- [ ] Icon is hollow for anonymous user
- [ ] Clicking icon opens modal
- [ ] Empty email shows validation error
- [ ] Invalid email format shows error
- [ ] Valid email triggers API call
- [ ] Loading state shows while sending
- [ ] Success message appears after send
- [ ] Check actual email received (use real email)
- [ ] Error message for duplicate email
