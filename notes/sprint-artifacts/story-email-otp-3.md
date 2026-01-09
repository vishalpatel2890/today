# Story 8.3: Update LinkEmailModal with OTP Entry

## Story Overview

**Story ID:** 8.3
**Epic:** Email OTP Authentication (E8)
**Priority:** High
**Points:** 5
**Status:** Draft

## User Story

As a user in the PWA, I want to enter my verification code directly in the sync modal, so that I can authenticate without leaving the app to click a magic link.

## Description

Update the existing `LinkEmailModal` component to add an OTP entry view. After the user submits their email and receives the "sent" status, the modal should transition to show an OTP input interface where they can enter the 6-digit code from their email.

## Acceptance Criteria

- [ ] **AC3.1:** After email sent (`linkingStatus === 'sent'`), modal shows OTP entry view
- [ ] **AC3.2:** OTP entry view displays the OtpInput component
- [ ] **AC3.3:** Email address shown as confirmation ("Code sent to {email}")
- [ ] **AC3.4:** Entering complete 6-digit code triggers `verifyOtp()`
- [ ] **AC3.5:** Loading state shown during OTP verification
- [ ] **AC3.6:** Error displayed inline if verification fails
- [ ] **AC3.7:** Modal closes automatically on successful verification
- [ ] **AC3.8:** "Resend code" link calls `resendOtp()`
- [ ] **AC3.9:** "Use different email" link returns to email input view
- [ ] **AC3.10:** Rate limit message shown if resend is throttled

## Technical Details

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/LinkEmailModal.tsx` | Add OTP entry view, integrate OtpInput |

### Updated Props Interface

```typescript
interface LinkEmailModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (email: string) => void
  status: LinkingStatus
  error: string | null
  onReset: () => void
  // New OTP props
  otpStatus: OtpStatus
  otpError: string | null
  pendingEmail: string | null
  onVerifyOtp: (email: string, token: string) => void
  onResendOtp: () => void
  onResetOtp: () => void
}
```

### New Modal View

Add new view in `renderContent()` for OTP entry:

```typescript
const renderContent = () => {
  // New: OTP verification in progress
  if (otpStatus === 'verifying') {
    return (
      <div className="text-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
        <p className="text-sm text-muted-foreground">Verifying code...</p>
      </div>
    )
  }

  // New: OTP entry view (after email sent)
  if (status === 'sent' && otpStatus !== 'verified') {
    return (
      <div className="py-4">
        <div className="text-center mb-6">
          <KeyRound className="h-12 w-12 text-primary mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            Enter verification code
          </h3>
          <p className="text-sm text-muted-foreground">
            We sent a 6-digit code to{' '}
            <span className="font-medium text-foreground">{pendingEmail}</span>
          </p>
        </div>

        <div className="mb-6">
          <OtpInput
            value={otpValue}
            onChange={setOtpValue}
            onComplete={handleOtpComplete}
            disabled={otpStatus === 'verifying'}
            error={!!otpError}
          />

          {otpError && (
            <div className="mt-3 flex items-center justify-center gap-1.5 text-sm text-red-500">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{otpError}</span>
            </div>
          )}
        </div>

        <div className="text-center space-y-3">
          <button
            type="button"
            onClick={handleResend}
            disabled={resendDisabled}
            className="text-sm text-primary hover:underline disabled:text-muted-foreground disabled:no-underline"
          >
            {resendDisabled ? `Resend code in ${resendTimer}s` : "Didn't receive a code? Resend"}
          </button>

          <div>
            <button
              type="button"
              onClick={handleChangeEmail}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Use different email
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Existing success view (now for OTP verified)
  if (otpStatus === 'verified') {
    return (
      <div className="text-center py-4">
        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">
          You're all set!
        </h3>
        <p className="text-sm text-muted-foreground mb-6">
          Your tasks will now sync across all your devices.
        </p>
        <button
          type="button"
          onClick={handleClose}
          className="w-full py-2 px-4 text-sm font-medium rounded-md bg-primary text-white hover:bg-primary/90 transition-colors"
        >
          Got it
        </button>
      </div>
    )
  }

  // Existing email input form
  return (
    <form onSubmit={handleSubmit}>
      {/* ... existing form code ... */}
    </form>
  )
}
```

### New State Variables

```typescript
const [otpValue, setOtpValue] = useState('')
const [resendTimer, setResendTimer] = useState(0)
const resendDisabled = resendTimer > 0
```

### Resend Timer Logic

```typescript
// Start resend timer when status becomes 'sent'
useEffect(() => {
  if (status === 'sent') {
    setResendTimer(60)  // 60 second cooldown

    const interval = setInterval(() => {
      setResendTimer(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }
}, [status])
```

### Handler Functions

```typescript
const handleOtpComplete = (code: string) => {
  if (pendingEmail) {
    onVerifyOtp(pendingEmail, code)
  }
}

const handleResend = () => {
  setOtpValue('')
  onResetOtp()
  onResendOtp()
  setResendTimer(60)
}

const handleChangeEmail = () => {
  setOtpValue('')
  onReset()
  onResetOtp()
}
```

### Icon Import

Add to imports:

```typescript
import { X, Mail, CheckCircle, AlertCircle, Loader2, KeyRound } from 'lucide-react'
```

### Component Import

```typescript
import { OtpInput } from './OtpInput'
```

## Update Parent Component (App.tsx or SyncStatusIcon)

Where `LinkEmailModal` is used, pass the new props:

```typescript
<LinkEmailModal
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  onSubmit={linkEmail}
  status={linkingStatus}
  error={linkingError}
  onReset={resetLinkingStatus}
  // New OTP props
  otpStatus={otpStatus}
  otpError={otpError}
  pendingEmail={pendingEmail}
  onVerifyOtp={verifyOtp}
  onResendOtp={resendOtp}
  onResetOtp={resetOtpStatus}
/>
```

## Dependencies

- `OtpInput` component from Story 8.1
- `useAuth` hook updates from Story 8.2
- `lucide-react` - KeyRound icon (already installed)

## Testing Notes

### Manual Testing

- [ ] Submit email → modal transitions to OTP entry view
- [ ] Email address displayed correctly
- [ ] Enter 6 digits → verification triggered
- [ ] Loading spinner during verification
- [ ] Wrong code → error message shown inline
- [ ] Correct code → success view → modal closes
- [ ] "Resend code" disabled for 60 seconds after send
- [ ] "Resend code" sends new code
- [ ] "Use different email" returns to email input
- [ ] Rate limit error displayed properly

### Edge Cases

- [ ] User closes modal during OTP entry → reopening shows email input
- [ ] User pastes partial code → only valid digits accepted
- [ ] Network error during verification → shows error message

## Definition of Done

- [ ] OTP entry view implemented after email sent
- [ ] OtpInput component integrated
- [ ] All handlers implemented (complete, resend, change email)
- [ ] Resend timer with countdown
- [ ] Error states displayed inline
- [ ] Success view on verification
- [ ] TypeScript: No type errors
- [ ] Follows existing code conventions
- [ ] Accessible: keyboard navigation, screen reader support

## UI/UX Notes

### Visual Flow

```
[Email Input] → Send Code
      ↓
[OTP Entry] → Enter 6 digits → Verify
      ↓
[Success] → "You're all set!" → Close
```

### Error States

| Error | Display |
|-------|---------|
| Invalid code | Red border on OtpInput, error text below |
| Expired code | Error text: "Code expired. Please request a new one." |
| Rate limited | Error text + resend button disabled |

---

*Story created as part of BMAD tech-spec workflow*
*Date: 2026-01-08*
