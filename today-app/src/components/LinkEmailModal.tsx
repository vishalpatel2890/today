import { useState, useEffect, useRef } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X, Mail, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import type { LinkingStatus } from '../hooks/useAuth'

interface LinkEmailModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (email: string) => void
  status: LinkingStatus
  error: string | null
  onReset: () => void
}

/**
 * Modal for linking email to anonymous account
 * Shows email input → loading → success/error states
 */
export const LinkEmailModal = ({
  isOpen,
  onClose,
  onSubmit,
  status,
  error,
  onReset
}: LinkEmailModalProps) => {
  const [email, setEmail] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setEmail('')
      setValidationError(null)
      onReset()
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen, onReset])

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

  // Render different content based on status
  const renderContent = () => {
    if (status === 'sent') {
      return (
        <div className="text-center py-4">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            Check your email
          </h3>
          <p className="text-sm text-muted-foreground mb-6">
            We sent a magic link to <span className="font-medium text-foreground">{email}</span>.
            Click the link in the email to sync your tasks across devices.
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

    return (
      <form onSubmit={handleSubmit}>
        <p className="text-sm text-muted-foreground mb-4">
          Link your email to access your tasks from any device.
          We&apos;ll send you a magic link - no password needed.
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
              'Send magic link'
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
          className="fixed left-1/2 z-50 w-full -translate-x-1/2 rounded-t-2xl bg-surface p-6 shadow-lg focus:outline-none data-[state=open]:animate-slide-up bottom-0 md:bottom-auto md:top-1/2 md:-translate-y-1/2 md:max-w-md md:rounded-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="font-display text-lg font-semibold text-foreground">
              {status === 'sent' ? 'Email sent!' : 'Sync across devices'}
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
