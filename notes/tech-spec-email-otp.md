# Today - Technical Specification

**Author:** Vishal
**Date:** 2026-01-08
**Project Level:** Quick Flow
**Change Type:** Feature Enhancement
**Development Context:** Brownfield (existing Today app with Supabase auth + PWA)

---

## Context

### Available Documents

| Document | Status | Key Insights |
|----------|--------|--------------|
| PRD (prd.md) | ✅ Loaded | Minimalist philosophy, local-first with cloud sync |
| Architecture (architecture.md) | ✅ Loaded | React 19 + Vite + Tailwind + Radix UI |
| Email Linking Tech Spec | ✅ Loaded | Magic link flow already implemented via `signInWithOtp` |
| PWA Tech Spec (Epic 7) | ✅ Loaded | Service worker, IndexedDB, offline-first |
| Supabase Docs | ✅ Searched | Email OTP with `verifyOtp()` fully supported |

### Project Stack

| Category | Technology | Version |
|----------|------------|---------|
| Framework | React | 19.2.0 |
| Language | TypeScript | 5.9.3 |
| Build Tool | Vite | 7.2.4 |
| Styling | Tailwind CSS | 4.1.18 |
| UI Primitives | Radix UI | 1.1.15+ |
| Backend | Supabase | 2.89.0 (@supabase/supabase-js) |
| PWA | vite-plugin-pwa | 1.2.0 |
| Local DB | Dexie (IndexedDB) | 4.2.1 |
| Icons | Lucide React | 0.562.0 |

### Existing Codebase Structure

```
today-app/src/
├── lib/supabase.ts              # Supabase client
├── hooks/
│   ├── useAuth.ts               # Auth with magic link flow → EXTEND for OTP
│   ├── useTasks.ts              # Task CRUD with Supabase sync
│   ├── useOnlineStatus.ts       # Network connectivity detection
│   └── useSyncQueue.ts          # Offline sync queue
├── components/
│   ├── Header.tsx               # App header with sync icon
│   ├── SyncStatusIcon.tsx       # Cloud sync indicator
│   ├── LinkEmailModal.tsx       # Magic link modal → EXTEND for OTP
│   ├── Toast.tsx                # Toast notifications
│   └── ... (20+ total components)
├── contexts/ToastContext.tsx    # Toast state management
├── views/                       # Today/Tomorrow/Deferred views
└── types/database.ts            # Supabase types
```

---

## The Change

### Problem Statement

Magic links don't work well in PWA (installed app) contexts on mobile devices:

1. User clicks magic link in email app
2. Link opens in Safari/Chrome browser (NOT the installed PWA)
3. Session is created in the browser, not in the PWA
4. User returns to PWA with no session - authentication failed

This is a fundamental limitation affecting all PWA users trying to sync across devices.

### Proposed Solution

Implement Email OTP (One-Time Password) as an alternative to magic links:

1. User enters email in the PWA
2. Supabase sends email with 6-digit code (e.g., "305805")
3. User views code in email app and manually enters it in the PWA
4. PWA calls `verifyOtp()` to exchange code for session
5. Session created directly in the PWA context - works perfectly

**Key insight:** OTP verification happens entirely within the PWA, so no redirect is needed.

### Scope

**In Scope:**
- Extend `useAuth` hook with `verifyOtp()` functionality
- Add OTP input UI to `LinkEmailModal` (6-digit code entry)
- PWA detection to show OTP flow by default for installed apps
- Auto-paste support for OTP codes
- "Resend code" functionality with rate limiting feedback
- Update email template guidance for Supabase Dashboard
- Maintain magic link as fallback for browser users

**Out of Scope:**
- Phone/SMS OTP (requires SMS provider, additional cost)
- Custom email template configuration via code (manual in Supabase Dashboard)
- Automatic OTP detection from SMS/email (OS-level feature, not controllable)
- Password-based authentication
- Social auth providers

---

## Implementation Details

### Source Tree Changes

| File | Action | Changes |
|------|--------|---------|
| `src/hooks/useAuth.ts` | MODIFY | Add `verifyOtp()`, `otpStatus`, `resendOtp()` |
| `src/components/LinkEmailModal.tsx` | MODIFY | Add OTP entry view after email submission |
| `src/components/OtpInput.tsx` | CREATE | 6-digit input with auto-focus, paste support |
| `src/hooks/usePwaDetection.ts` | CREATE | Detect if running as installed PWA |

### Technical Approach

**Supabase Email OTP Flow:**

```typescript
// Step 1: Request OTP (already exists as signInWithOtp)
// Remove emailRedirectTo to trigger OTP email instead of magic link
const { error } = await supabase.auth.signInWithOtp({
  email: 'user@example.com',
  options: {
    shouldCreateUser: true,  // Allow new signups
    // NO emailRedirectTo = sends OTP code instead of magic link
  }
})

// Step 2: Verify OTP (NEW)
const { data: { session }, error } = await supabase.auth.verifyOtp({
  email: 'user@example.com',
  token: '305805',  // 6-digit code from email
  type: 'email'     // Required: specifies email OTP type
})
```

**PWA Detection Pattern:**

```typescript
export function usePwaDetection() {
  const [isPwa, setIsPwa] = useState(false)

  useEffect(() => {
    // Check for standalone display mode (installed PWA)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    // iOS Safari adds navigator.standalone
    const isIosPwa = (navigator as any).standalone === true

    setIsPwa(isStandalone || isIosPwa)
  }, [])

  return isPwa
}
```

**OTP Input Component Pattern:**

```typescript
// 6 individual digit inputs with auto-advance
// Paste support for full 6-digit code
// Auto-submit when complete
interface OtpInputProps {
  value: string
  onChange: (value: string) => void
  onComplete: (value: string) => void
  disabled?: boolean
  error?: boolean
}
```

### Existing Patterns to Follow

From `useAuth.ts`:
```typescript
// Arrow function component, named export
export function useAuth() {
  // State with explicit types
  const [linkingStatus, setLinkingStatus] = useState<LinkingStatus>('idle')

  // Dev logging pattern
  if (import.meta.env.DEV) {
    console.log('[Today] Auth: sign-in magic link sent to', email)
  }

  // useCallback for functions passed as props
  const linkEmail = useCallback(async (email: string) => { ... }, [])
}
```

From `LinkEmailModal.tsx`:
```typescript
// Named export, Tailwind styling
export const LinkEmailModal = ({ ... }: LinkEmailModalProps) => {
  // Form handling with validation
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Validation then submit
  }

  // Conditional rendering based on status
  const renderContent = () => {
    if (status === 'sent') { return <SuccessView /> }
    return <FormView />
  }
}
```

### Integration Points

| Component | Integrates With | How |
|-----------|-----------------|-----|
| `useAuth` | Supabase Auth | `signInWithOtp()`, `verifyOtp()` |
| `LinkEmailModal` | `useAuth` | Calls `linkEmail()`, then `verifyOtp()` |
| `LinkEmailModal` | `OtpInput` | Renders OTP entry after email sent |
| `usePwaDetection` | `LinkEmailModal` | Determines default flow (OTP vs magic link) |
| `OtpInput` | Clipboard API | Paste support for 6-digit codes |

---

## Development Context

### Relevant Existing Code

| File | Lines | Reference For |
|------|-------|---------------|
| `src/hooks/useAuth.ts` | 1-217 | Auth hook pattern, `signInWithOtp` flow |
| `src/components/LinkEmailModal.tsx` | 1-183 | Modal structure, form handling, status states |
| `src/hooks/useOnlineStatus.ts` | 1-30 | Simple hook pattern |
| `src/components/Toast.tsx` | 1-50 | Notification styling |

### Dependencies

**Framework/Libraries (already installed):**
- `@supabase/supabase-js` v2.89.0 - `verifyOtp()` method
- `@radix-ui/react-dialog` v1.1.15 - Modal primitives
- `lucide-react` v0.562.0 - Icons (KeyRound for OTP)

**No new dependencies required.**

**Internal Modules:**
- `src/lib/supabase.ts` - Supabase client
- `src/contexts/ToastContext.tsx` - Error notifications

### Configuration Changes

**Supabase Dashboard (manual, one-time):**

Navigate to **Authentication → Email Templates → Magic Link** and update:

```html
<h2>Your verification code</h2>
<p>Enter this code in the app to sign in:</p>
<p style="font-size: 32px; font-weight: bold; letter-spacing: 8px;">{{ .Token }}</p>
<p>This code expires in 60 seconds.</p>
<p style="color: #666; font-size: 12px;">
  If you didn't request this, you can safely ignore this email.
</p>
```

**Note:** The `{{ .Token }}` variable contains the 6-digit OTP code. This replaces the magic link approach.

### Existing Conventions

| Convention | Pattern | Apply To |
|------------|---------|----------|
| Exports | Named exports, no default | All new files |
| Functions | Arrow functions | All components/hooks |
| Semicolons | None | All TypeScript |
| Logging | `console.log('[Today]', ...)` in DEV | New auth flows |
| Styling | Tailwind utility classes | All components |
| State | useState with explicit types | useAuth extensions |
| Modals | Radix Dialog | OtpInput integration |

### Test Framework & Standards

| Aspect | Standard |
|--------|----------|
| Framework | Vitest 3.2.4 |
| Test files | `*.test.ts` / `*.test.tsx` |
| Location | Same directory as source |
| Mocking | Vitest mocks for Supabase |

---

## Implementation Stack

| Layer | Technology | Version | Usage |
|-------|------------|---------|-------|
| Runtime | Node.js | 18+ | Development |
| Framework | React | 19.2.0 | UI components |
| Language | TypeScript | 5.9.3 | Type safety |
| Styling | Tailwind CSS | 4.1.18 | Component styling |
| UI Primitives | Radix UI | 1.1.15 | Modal dialog |
| Auth | Supabase Auth | 2.89.0 | OTP verification |
| Icons | Lucide React | 0.562.0 | KeyRound icon |
| Build | Vite | 7.2.4 | Dev server, bundling |
| PWA | vite-plugin-pwa | 1.2.0 | Installed app detection |

---

## Technical Details

### OTP Flow Sequence

```
1. User opens LinkEmailModal (via SyncStatusIcon or banner)
   └─> PWA detection determines default view

2. User enters email, clicks "Send code"
   └─> useAuth.linkEmail() called
   └─> signInWithOtp() WITHOUT emailRedirectTo
   └─> Supabase sends email with 6-digit code

3. Modal transitions to OTP entry view
   └─> OtpInput rendered with 6 digit boxes
   └─> Timer shows code expiration (60s)

4. User enters code (or pastes from email)
   └─> Auto-submit on 6 digits entered
   └─> useAuth.verifyOtp(email, token)

5. Supabase verifies OTP
   └─> Success: Session created, modal closes
   └─> Error: Display error, allow retry

6. onAuthStateChange fires
   └─> isLinked = true
   └─> SyncStatusIcon updates to solid cloud
```

### State Shape Extensions (useAuth)

```typescript
export type OtpStatus = 'idle' | 'verifying' | 'verified' | 'error'

interface AuthState {
  // Existing
  user: User | null
  isLoading: boolean
  error: Error | null
  isAnonymous: boolean
  isLinked: boolean
  linkingStatus: LinkingStatus
  linkingError: string | null

  // New for OTP
  otpStatus: OtpStatus
  otpError: string | null
  pendingEmail: string | null  // Email waiting for OTP verification
}

// New methods
verifyOtp: (email: string, token: string) => Promise<void>
resendOtp: () => Promise<void>
resetOtpStatus: () => void
```

### Error Scenarios

| Error | Detection | User Message |
|-------|-----------|--------------|
| Invalid OTP code | Supabase error | "Invalid code. Please check and try again." |
| Expired OTP | Supabase error | "Code expired. Click 'Resend' for a new code." |
| Rate limited | Error message contains "rate limit" | "Too many attempts. Please wait a moment." |
| Network error | Catch block | "Connection error. Please try again." |
| Email not found | Supabase error | "Email not found. Please check and try again." |

### OTP Input Behavior

| Feature | Implementation |
|---------|---------------|
| Auto-focus first input | `useEffect` on mount |
| Auto-advance on digit entry | `onChange` handler moves focus |
| Backspace handling | Move to previous input, clear |
| Paste support | `onPaste` handler fills all inputs |
| Auto-submit on complete | Trigger verification when 6 digits entered |
| Keyboard navigation | Arrow keys between inputs |
| Invalid character rejection | Filter non-digits in `onChange` |

---

## Development Setup

```bash
# Already set up - just run:
cd today-app
npm run dev

# Opens http://localhost:5173
# Supabase credentials in .env.local
```

---

## Implementation Guide

### Setup Steps

1. Create feature branch: `git checkout -b feature/email-otp`
2. Verify dev server running: `npm run dev`
3. Review existing code: `useAuth.ts`, `LinkEmailModal.tsx`
4. Update Supabase email template in Dashboard (see Configuration Changes)

### Implementation Steps

**Story 1: OTP Input Component**

1. Create `src/components/OtpInput.tsx`:
   - 6 individual digit inputs (1-character each)
   - Auto-focus and auto-advance
   - Paste handler for full code
   - Error state styling (red border)
   - Disabled state during verification

2. Style with Tailwind:
   - Large, centered digit boxes
   - Border focus states
   - Mobile-friendly touch targets (min 44px)

**Story 2: Extend useAuth with verifyOtp**

1. Add new state to `useAuth.ts`:
   - `otpStatus: OtpStatus`
   - `otpError: string | null`
   - `pendingEmail: string | null`

2. Implement `verifyOtp(email, token)`:
   - Set status to 'verifying'
   - Call `supabase.auth.verifyOtp({ email, token, type: 'email' })`
   - Handle success: Set status to 'verified', clear pendingEmail
   - Handle errors: Set status to 'error', store error message

3. Implement `resendOtp()`:
   - Use stored `pendingEmail`
   - Call existing `linkEmail()` flow
   - Reset OTP status to idle

4. Modify `linkEmail()`:
   - Remove `emailRedirectTo` option (triggers OTP instead of magic link)
   - Store email as `pendingEmail` on success

**Story 3: Update LinkEmailModal with OTP Entry**

1. Add new modal view after 'sent' status:
   - Title: "Enter verification code"
   - Subtitle: "We sent a 6-digit code to {email}"
   - OtpInput component
   - "Resend code" link with rate limit text
   - "Use different email" link → back to email input

2. Handle OTP verification:
   - On OtpInput complete → call `verifyOtp()`
   - Show loading state during verification
   - Show error inline if invalid
   - Close modal on success

3. (Optional) PWA detection:
   - Import `usePwaDetection`
   - Skip "check your email" messaging for PWA
   - Show "Enter the code from your email" directly

### Testing Strategy

**Unit Tests:**

```typescript
// useAuth.test.ts
describe('verifyOtp', () => {
  it('should set otpStatus to verifying while in progress')
  it('should set otpStatus to verified on success')
  it('should set otpError on invalid code')
  it('should set otpError on expired code')
})

// OtpInput.test.tsx
describe('OtpInput', () => {
  it('should auto-focus first input on mount')
  it('should auto-advance focus on digit entry')
  it('should handle paste of 6-digit code')
  it('should call onComplete when all 6 digits entered')
  it('should reject non-digit characters')
})
```

**Manual Testing Checklist:**

- [ ] Fresh anonymous user can request OTP
- [ ] 6-digit code received in email
- [ ] Entering correct code creates session
- [ ] Entering wrong code shows error
- [ ] Expired code shows specific error
- [ ] Resend code works (check rate limiting)
- [ ] Paste from email works
- [ ] Modal closes on success
- [ ] Cloud icon updates to solid
- [ ] Cross-device sync works after OTP login
- [ ] PWA detection shows correct flow

### Acceptance Criteria

**Story 1: OTP Input Component**
- [ ] AC1.1: OtpInput renders 6 individual digit boxes
- [ ] AC1.2: First box auto-focuses on mount
- [ ] AC1.3: Typing digit advances to next box
- [ ] AC1.4: Pasting 6-digit code fills all boxes
- [ ] AC1.5: onComplete fires when all 6 digits entered
- [ ] AC1.6: Error state shows red border on all boxes
- [ ] AC1.7: Disabled state prevents input

**Story 2: useAuth verifyOtp**
- [ ] AC2.1: verifyOtp calls Supabase with email, token, type='email'
- [ ] AC2.2: otpStatus updates through 'verifying' → 'verified'/'error'
- [ ] AC2.3: Invalid code sets appropriate error message
- [ ] AC2.4: Session created on successful verification
- [ ] AC2.5: resendOtp uses stored pendingEmail
- [ ] AC2.6: linkEmail no longer sends magic link (OTP instead)

**Story 3: LinkEmailModal OTP View**
- [ ] AC3.1: After email sent, modal shows OTP entry view
- [ ] AC3.2: OtpInput displayed with email confirmation text
- [ ] AC3.3: Entering code triggers verification
- [ ] AC3.4: Loading state shown during verification
- [ ] AC3.5: Error displayed inline on failure
- [ ] AC3.6: Modal closes automatically on success
- [ ] AC3.7: "Resend code" link works
- [ ] AC3.8: "Use different email" returns to email input

---

## Developer Resources

### File Paths Reference

**Existing (to modify):**
- `/today-app/src/hooks/useAuth.ts`
- `/today-app/src/components/LinkEmailModal.tsx`

**New (to create):**
- `/today-app/src/components/OtpInput.tsx`
- `/today-app/src/hooks/usePwaDetection.ts` (optional)

### Key Code Locations

| What | File | Reference |
|------|------|-----------|
| Supabase client | `src/lib/supabase.ts` | Import for auth calls |
| Auth hook | `src/hooks/useAuth.ts:72-198` | `linkEmail` pattern |
| Modal styling | `src/components/LinkEmailModal.tsx:156-182` | Dialog structure |
| Form validation | `src/components/LinkEmailModal.tsx:42-63` | Validation pattern |

### Testing Locations

| Type | Location |
|------|----------|
| Unit tests | Same directory as source (e.g., `useAuth.test.ts`) |
| Manual | Incognito browser, PWA on mobile device |

### Documentation to Update

- [ ] Update Supabase Dashboard email template (required)
- [ ] (Optional) README.md - Add OTP login instructions

---

## UX/UI Considerations

### Components Affected

| Component | Change | Notes |
|-----------|--------|-------|
| LinkEmailModal | Add OTP entry view | New state after email sent |
| New: OtpInput | 6-digit code input | Accessible, paste-friendly |

### Visual Design

**OtpInput:**
- 6 boxes, 48x56px each on mobile
- 8px gap between boxes
- `text-2xl` font size (24px)
- `text-center` alignment
- Border: `border-border` default, `border-primary` focus, `border-red-500` error
- Background: `bg-background`

**OTP Entry View:**
- Title: "Enter verification code"
- Subtitle: "We sent a 6-digit code to {email}"
- OtpInput centered
- "Resend code" text link below
- "Use different email" secondary action

### Accessibility

- Each OTP input has `aria-label="Digit N of 6"`
- Focus trap maintained in modal (Radix handles)
- Keyboard navigation between digits
- Error state announced to screen readers
- Touch targets minimum 44x44px

---

## Testing Approach

### Test Plan

1. **Unit tests:**
   - OtpInput component behavior
   - useAuth verifyOtp state transitions
   - Error handling

2. **Manual testing:**
   - Full flow on desktop browser
   - Full flow on mobile PWA (installed app)
   - Cross-device sync after OTP login
   - Error scenarios (wrong code, expired, rate limit)

---

## Deployment Strategy

### Deployment Steps

1. Update Supabase email template in Dashboard (BEFORE deploying code)
2. Merge PR to main
3. Vercel auto-deploys
4. Test OTP flow on production
5. Verify PWA detection works on mobile

### Rollback Plan

1. Revert merge commit
2. Redeploy previous version
3. Restore original email template in Supabase Dashboard
4. Magic link flow still works as fallback

### Monitoring

- Check Supabase Auth logs for OTP errors
- Monitor console for `[Today] Auth:` logs in production
- User feedback on code delivery timing

---

*Generated by BMAD Tech-Spec Workflow*
*Date: 2026-01-08*
