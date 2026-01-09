# Story 8.2: Extend useAuth with verifyOtp

## Story Overview

**Story ID:** 8.2
**Epic:** Email OTP Authentication (E8)
**Priority:** High
**Points:** 3
**Status:** done

## User Story

As a developer, I want the useAuth hook to support OTP verification, so that the LinkEmailModal can complete authentication after the user enters their code.

## Description

Extend the existing `useAuth` hook to add OTP verification functionality. This includes new state for tracking OTP status, a `verifyOtp()` method, and a `resendOtp()` method. Also modify the existing `linkEmail()` function to omit `emailRedirectTo`, which triggers OTP mode instead of magic link mode.

## Acceptance Criteria

- [x] **AC2.1:** `verifyOtp(email, token)` calls Supabase with correct parameters
- [x] **AC2.2:** `otpStatus` transitions through 'idle' → 'verifying' → 'verified'/'error'
- [x] **AC2.3:** Invalid OTP code sets appropriate `otpError` message
- [x] **AC2.4:** Successful verification creates session and updates user state
- [x] **AC2.5:** `resendOtp()` uses stored `pendingEmail` to request new code
- [x] **AC2.6:** `linkEmail()` no longer sends magic link (OTP instead)
- [x] **AC2.7:** `resetOtpStatus()` clears OTP state for retry flows
- [x] **AC2.8:** Dev logging follows existing `[Today] Auth:` pattern

## Technical Details

### Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useAuth.ts` | Add OTP state, verifyOtp, resendOtp, modify linkEmail |

### New Types

```typescript
export type OtpStatus = 'idle' | 'verifying' | 'verified' | 'error'
```

### New State

```typescript
const [otpStatus, setOtpStatus] = useState<OtpStatus>('idle')
const [otpError, setOtpError] = useState<string | null>(null)
const [pendingEmail, setPendingEmail] = useState<string | null>(null)
```

### New Methods

#### verifyOtp

```typescript
const verifyOtp = useCallback(async (email: string, token: string) => {
  setOtpStatus('verifying')
  setOtpError(null)

  if (import.meta.env.DEV) {
    console.log('[Today] Auth: verifying OTP for', email)
  }

  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'email'
  })

  if (error) {
    setOtpStatus('error')

    // Map common error messages to user-friendly text
    if (error.message.includes('expired')) {
      setOtpError('Code expired. Please request a new one.')
    } else if (error.message.includes('invalid') || error.message.includes('Token')) {
      setOtpError('Invalid code. Please check and try again.')
    } else if (error.message.includes('rate limit')) {
      setOtpError('Too many attempts. Please wait a moment.')
    } else {
      setOtpError(error.message)
    }

    if (import.meta.env.DEV) {
      console.error('[Today] Auth: OTP verification error', error)
    }
    return
  }

  setOtpStatus('verified')
  setPendingEmail(null)

  if (import.meta.env.DEV) {
    console.log('[Today] Auth: OTP verified, session created', data.session?.user.id)
  }
}, [])
```

#### resendOtp

```typescript
const resendOtp = useCallback(async () => {
  if (!pendingEmail) {
    if (import.meta.env.DEV) {
      console.error('[Today] Auth: cannot resend, no pending email')
    }
    return
  }

  // Reuse linkEmail to send new code
  await linkEmail(pendingEmail)
  setOtpStatus('idle')
  setOtpError(null)
}, [pendingEmail, linkEmail])
```

#### resetOtpStatus

```typescript
const resetOtpStatus = useCallback(() => {
  setOtpStatus('idle')
  setOtpError(null)
}, [])
```

### Modify linkEmail

Remove `emailRedirectTo` from the `signInWithOtp` call to trigger OTP mode:

```typescript
const linkEmail = useCallback(async (email: string) => {
  setLinkingStatus('sending')
  setLinkingError(null)
  setPendingEmail(email)  // Store for OTP verification

  if (import.meta.env.DEV) {
    console.log('[Today] Auth: requesting OTP for', email)
  }

  // ... existing session check logic ...

  // For signInWithOtp calls, REMOVE emailRedirectTo option
  const { error: signInError } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true
      // NO emailRedirectTo → triggers OTP email instead of magic link
    }
  })

  // ... rest of existing error handling ...
}, [])
```

### Updated Return Object

```typescript
return {
  // Existing
  user,
  isLoading,
  error,
  isAnonymous,
  isLinked,
  linkEmail,
  linkingStatus,
  linkingError,
  resetLinkingStatus,

  // New for OTP
  otpStatus,
  otpError,
  pendingEmail,
  verifyOtp,
  resendOtp,
  resetOtpStatus
}
```

## Dependencies

- `@supabase/supabase-js` v2.89.0 - `verifyOtp` method
- Existing `supabase` client from `src/lib/supabase.ts`

## Testing Notes

### Unit Tests

```typescript
describe('useAuth - OTP', () => {
  it('verifyOtp sets status to verifying during verification')
  it('verifyOtp sets status to verified on success')
  it('verifyOtp sets status to error on invalid code')
  it('verifyOtp sets user-friendly error for expired code')
  it('resendOtp calls linkEmail with pendingEmail')
  it('resendOtp does nothing if no pendingEmail')
  it('resetOtpStatus clears otpStatus and otpError')
  it('linkEmail stores email as pendingEmail')
})
```

### Manual Testing

- [ ] Request OTP → receive email with 6-digit code
- [ ] Enter correct code → session created
- [ ] Enter wrong code → error message shown
- [ ] Wait 60+ seconds → expired error shown
- [ ] Click resend → new code sent

## Definition of Done

- [x] All new state variables added
- [x] `verifyOtp` method implemented with error handling
- [x] `resendOtp` method implemented
- [x] `resetOtpStatus` method implemented
- [x] `linkEmail` modified to omit `emailRedirectTo`
- [x] Dev logging added for all new flows
- [x] TypeScript: No type errors
- [x] Follows existing code conventions

## Frontend Test Gate

### Prerequisites
- Development server running: `npm run dev`
- Browser open to http://localhost:5173
- Access to email for OTP codes

### Test Steps

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click sync/cloud icon in header to open LinkEmailModal | Modal opens with email input |
| 2 | Enter a valid email address and submit | Console shows `[Today] Auth: requesting OTP for {email}` |
| 3 | Check the useAuth hook exports | `verifyOtp`, `resendOtp`, `resetOtpStatus`, `otpStatus`, `otpError`, `pendingEmail` available |

### Success Criteria
- [ ] TypeScript compilation has no errors
- [ ] Console shows correct dev logging pattern
- [ ] All new methods are exported from useAuth

### Feedback Questions
- Does the linkEmail flow correctly store the pendingEmail?
- Are the new OTP methods accessible from useAuth?

## Dev Agent Record

### Debug Log
```
Plan for Story 8.2:
1. Add OtpStatus type export ✓
2. Add new state: otpStatus, otpError, pendingEmail ✓
3. Implement verifyOtp callback with Supabase verifyOtp call ✓
4. Implement resendOtp callback (reuses linkEmail with pendingEmail) ✓
5. Implement resetOtpStatus callback ✓
6. Modify linkEmail to remove emailRedirectTo and store pendingEmail ✓
7. Update return object with new state/methods ✓

Implementation notes:
- All signInWithOtp calls now use shouldCreateUser: true instead of emailRedirectTo
- Removed redirect URL handling entirely from linkEmail
- Added pendingEmail state cleared on error cases
- Error message mapping for expired, invalid, and rate limit errors
```

### Completion Notes
- Implemented all OTP state and methods in useAuth.ts
- Modified linkEmail to trigger OTP mode instead of magic link
- TypeScript compilation: PASSED
- All 23 tests: PASSED (no regressions)
- Date: 2026-01-08
- ✅ Test Gate PASSED by Vishal (2026-01-08)

## File List

| File | Action | Description |
|------|--------|-------------|
| `today-app/src/hooks/useAuth.ts` | Modified | Added OtpStatus type, otpStatus/otpError/pendingEmail state, verifyOtp/resendOtp/resetOtpStatus methods, modified linkEmail for OTP mode |

## Change Log

| Date | Change |
|------|--------|
| 2026-01-08 | Story implementation complete - all OTP functionality added to useAuth hook |

---

*Story created as part of BMAD tech-spec workflow*
*Date: 2026-01-08*
