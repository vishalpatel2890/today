import { useState, useEffect, useRef } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import X from 'lucide-react/dist/esm/icons/x'
import Mail from 'lucide-react/dist/esm/icons/mail'
import CheckCircle from 'lucide-react/dist/esm/icons/check-circle'
import AlertCircle from 'lucide-react/dist/esm/icons/alert-circle'
import Loader2 from 'lucide-react/dist/esm/icons/loader-2'
import KeyRound from 'lucide-react/dist/esm/icons/key-round'
import type { LinkingStatus, OtpStatus } from '../hooks/useAuth'
import { OtpInput } from './OtpInput'

interface LinkEmailModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (email: string) => void
  status: LinkingStatus
  error: string | null
  onReset: () => void
  // OTP props
  otpStatus: OtpStatus
  otpError: string | null
  pendingEmail: string | null
  onVerifyOtp: (email: string, token: string) => void
  onResendOtp: () => void
  onResetOtp: () => void
}

/**
 * Modal for linking email to anonymous account
 * Shows email input → OTP entry → success states
 * AC3.1-AC3.10: OTP verification flow
 */
export const LinkEmailModal = ({
  isOpen,
  onClose,
  onSubmit,
  status,
  error,
  onReset,
  otpStatus,
  otpError,
  pendingEmail,
  onVerifyOtp,
  onResendOtp,
  onResetOtp
}: LinkEmailModalProps) => {
  const [email, setEmail] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)
  const [otpValue, setOtpValue] = useState('')
  const [resendTimer, setResendTimer] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const resendDisabled = resendTimer > 0

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setEmail('')
      setValidationError(null)
      setOtpValue('')
      onReset()
      onResetOtp()
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen, onReset, onResetOtp])

  // AC3.10: Start resend timer when status becomes 'sent'
  useEffect(() => {
    if (status === 'sent') {
      setResendTimer(60) // 60 second cooldown

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

  // Basic email validation
  const validateEmail = (value: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(value)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      setValidationError('Please enter your email')
      return
    }

    if (!validateEmail(trimmedEmail)) {
      setValidationError('Please enter a valid email')
      return
    }

    setValidationError(null)
    onSubmit(trimmedEmail)
  }

  const handleClose = () => {
    onClose()
  }

  // AC3.4: Handle OTP completion - triggers verification
  const handleOtpComplete = (code: string) => {
    if (pendingEmail) {
      onVerifyOtp(pendingEmail, code)
    }
  }

  // AC3.8: Resend code handler
  const handleResend = () => {
    setOtpValue('')
    onResetOtp()
    onResendOtp()
    setResendTimer(60)
  }

  // AC3.9: Change email handler - return to email input
  const handleChangeEmail = () => {
    setOtpValue('')
    onReset()
    onResetOtp()
  }

  // Determine modal title based on state
  const getTitle = () => {
    if (otpStatus === 'verified') return 'Success!'
    if (status === 'sent') return 'Enter verification code'
    return 'Sync across devices'
  }

  // Render different content based on status
  const renderContent = () => {
    // AC3.5: OTP verification in progress - loading state
    if (otpStatus === 'verifying') {
      return (
        <div className="text-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Verifying code...</p>
        </div>
      )
    }

    // AC3.7: Success view - modal auto-closes after verification
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

    // AC3.1-AC3.2: OTP entry view (after email sent)
    if (status === 'sent') {
      return (
        <div className="py-4">
          <div className="text-center mb-6">
            <KeyRound className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              Enter verification code
            </h3>
            {/* AC3.3: Email address shown as confirmation */}
            <p className="text-sm text-muted-foreground">
              We sent a 6-digit code to{' '}
              <span className="font-medium text-foreground">{pendingEmail}</span>
            </p>
          </div>

          <div className="mb-6">
            {/* AC3.2: OtpInput component displayed */}
            <OtpInput
              value={otpValue}
              onChange={setOtpValue}
              onComplete={handleOtpComplete}
              error={!!otpError}
            />

            {/* AC3.6: Error displayed inline if verification fails */}
            {otpError && (
              <div className="mt-3 flex items-center justify-center gap-1.5 text-sm text-red-500">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{otpError}</span>
              </div>
            )}
          </div>

          <div className="text-center space-y-3">
            {/* AC3.8 & AC3.10: Resend code link with rate limit timer */}
            <button
              type="button"
              onClick={handleResend}
              disabled={resendDisabled}
              className="text-sm text-primary hover:underline disabled:text-muted-foreground disabled:no-underline"
            >
              {resendDisabled ? `Resend code in ${resendTimer}s` : "Didn't receive a code? Resend"}
            </button>

            {/* AC3.9: Use different email link */}
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

    // Email input form (initial state)
    return (
      <form onSubmit={handleSubmit}>
        <p className="text-sm text-muted-foreground mb-4">
          Link your email to access your tasks from any device.
          We&apos;ll send you a verification code - no password needed.
        </p>

        <div className="mb-4">
          <label htmlFor="email-input" className="block text-sm font-medium text-foreground mb-2">
            Email address
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              ref={inputRef}
              id="email-input"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (validationError) setValidationError(null)
              }}
              placeholder="you@example.com"
              disabled={status === 'sending'}
              className="w-full rounded-md border border-border bg-background pl-10 pr-3 py-2 text-base text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none disabled:opacity-50"
            />
          </div>
          {(validationError || error) && (
            <div className="mt-2 flex items-center gap-1.5 text-sm text-red-500">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{validationError || error}</span>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleClose}
            disabled={status === 'sending'}
            className="flex-1 py-2 px-4 text-sm font-medium rounded-md border border-border bg-surface text-foreground hover:bg-surface-muted transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={status === 'sending'}
            className="flex-1 py-2 px-4 text-sm font-medium rounded-md bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {status === 'sending' ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              'Send code'
            )}
          </button>
        </div>
      </form>
    )
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 data-[state=open]:animate-fade-in" />
        <Dialog.Content
          className="fixed left-0 right-0 z-50 w-full rounded-t-2xl bg-surface p-6 shadow-lg focus:outline-none data-[state=open]:animate-slide-up bottom-0 md:left-1/2 md:right-auto md:-translate-x-1/2 md:bottom-auto md:top-1/2 md:-translate-y-1/2 md:max-w-md md:rounded-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="font-display text-lg font-semibold text-foreground">
              {getTitle()}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                className="rounded-full p-1 text-muted-foreground hover:bg-surface-muted hover:text-foreground transition-colors"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </div>

          {renderContent()}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
