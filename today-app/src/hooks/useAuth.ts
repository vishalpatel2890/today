import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import type { User } from '@supabase/supabase-js'
import { clearAllTimeEntries, clearActiveSession } from '../lib/timeTrackingDb'

export type LinkingStatus = 'idle' | 'sending' | 'sent' | 'error'
export type OtpStatus = 'idle' | 'verifying' | 'verified' | 'error'

/**
 * Hook for anonymous authentication with Supabase
 * Auto signs in anonymously if no session exists
 * Persists session across page reloads
 * Supports email linking for cross-device sync
 */
export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [linkingStatus, setLinkingStatus] = useState<LinkingStatus>('idle')
  const [linkingError, setLinkingError] = useState<string | null>(null)
  const [otpStatus, setOtpStatus] = useState<OtpStatus>('idle')
  const [otpError, setOtpError] = useState<string | null>(null)
  const [pendingEmail, setPendingEmail] = useState<string | null>(null)

  // Track previous user ID for detecting user changes
  const previousUserIdRef = useRef<string | null>(null)

  useEffect(() => {
    // Get initial session
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()

        if (session?.user) {
          previousUserIdRef.current = session.user.id
          setUser(session.user)
          if (import.meta.env.DEV) {
            console.log('[Today] Auth: existing session', session.user.id)
          }
        } else {
          // No session, sign in anonymously
          const { data, error: signInError } = await supabase.auth.signInAnonymously()

          if (signInError) {
            throw signInError
          }

          previousUserIdRef.current = data.user?.id ?? null
          setUser(data.user)
          if (import.meta.env.DEV) {
            console.log('[Today] Auth: signed in anonymously', data.user?.id)
          }
        }
      } catch (err) {
        console.error('[Today] Auth error:', err)
        setError(err as Error)
      } finally {
        setIsLoading(false)
      }
    }

    initAuth()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const newUserId = session?.user?.id ?? null
        const previousUserId = previousUserIdRef.current

        // Clear time tracking data on sign out or user change to prevent data leakage
        // Source: notes/sprint-artifacts/tech-spec-time-entries-data-isolation.md
        if (event === 'SIGNED_OUT' || (previousUserId && previousUserId !== newUserId)) {
          if (import.meta.env.DEV) {
            console.log('[Today] Auth: User changed, clearing time tracking cache', {
              event,
              previousUserId,
              newUserId,
            })
          }
          try {
            await clearAllTimeEntries()
            await clearActiveSession()
          } catch (err) {
            console.error('[Today] Auth: Failed to clear time tracking data', err)
          }
        }

        previousUserIdRef.current = newUserId
        setUser(session?.user ?? null)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Computed properties for email linking status
  const isAnonymous = user?.is_anonymous ?? true
  const isLinked = !isAnonymous && !!user?.email

  // Link email to anonymous account via OTP
  // If email already exists or no session, sign in with OTP instead
  const linkEmail = useCallback(async (email: string) => {
    setLinkingStatus('sending')
    setLinkingError(null)
    setPendingEmail(email)  // Store for OTP verification

    if (import.meta.env.DEV) {
      console.log('[Today] Auth: requesting OTP for', email)
    }

    // Check if we have an active session
    const { data: { session } } = await supabase.auth.getSession()

    // If no session or user isn't anonymous, use signInWithOtp directly
    if (!session || !session.user.is_anonymous) {
      if (import.meta.env.DEV) {
        console.log('[Today] Auth: no anonymous session, using signInWithOtp')
      }

      const { error: signInError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true
          // NO emailRedirectTo → triggers OTP email instead of magic link
        }
      })

      if (signInError) {
        setLinkingStatus('error')
        setPendingEmail(null)
        if (signInError.message.includes('rate limit')) {
          setLinkingError('Too many attempts. Please wait a moment.')
        } else {
          setLinkingError(signInError.message)
        }
        return
      }

      setLinkingStatus('sent')
      if (import.meta.env.DEV) {
        console.log('[Today] Auth: OTP code sent to', email)
      }
      return
    }

    // We have an anonymous session, try to link the email
    // Note: updateUser still requires a redirect URL for email confirmation
    // For anonymous-to-linked flow, we use signInWithOtp instead for OTP mode
    const { error: updateError } = await supabase.auth.updateUser({ email })

    if (updateError) {
      // If email is already registered, try signing in with OTP instead
      if (updateError.message.includes('already registered') ||
          updateError.message.includes('already been registered')) {
        if (import.meta.env.DEV) {
          console.log('[Today] Auth: email exists, sending OTP code')
        }

        const { error: signInError } = await supabase.auth.signInWithOtp({
          email,
          options: {
            shouldCreateUser: true
            // NO emailRedirectTo → triggers OTP email instead of magic link
          }
        })

        if (signInError) {
          setLinkingStatus('error')
          setPendingEmail(null)
          if (signInError.message.includes('rate limit')) {
            setLinkingError('Too many attempts. Please wait a moment.')
          } else {
            setLinkingError(signInError.message)
          }
          return
        }

        setLinkingStatus('sent')
        if (import.meta.env.DEV) {
          console.log('[Today] Auth: OTP code sent to', email)
        }
        return
      }

      // Handle session missing error by falling back to signInWithOtp
      if (updateError.message.includes('session missing') ||
          updateError.message.includes('Auth session missing')) {
        if (import.meta.env.DEV) {
          console.log('[Today] Auth: session missing, falling back to signInWithOtp')
        }

        const { error: signInError } = await supabase.auth.signInWithOtp({
          email,
          options: {
            shouldCreateUser: true
            // NO emailRedirectTo → triggers OTP email instead of magic link
          }
        })

        if (signInError) {
          setLinkingStatus('error')
          setPendingEmail(null)
          setLinkingError(signInError.message)
          return
        }

        setLinkingStatus('sent')
        if (import.meta.env.DEV) {
          console.log('[Today] Auth: OTP code sent to', email)
        }
        return
      }

      // Other errors
      setLinkingStatus('error')
      setPendingEmail(null)
      if (updateError.message.includes('rate limit')) {
        setLinkingError('Too many attempts. Please wait a moment.')
      } else {
        setLinkingError(updateError.message)
      }

      if (import.meta.env.DEV) {
        console.error('[Today] Auth: link email error', updateError)
      }
      return
    }

    setLinkingStatus('sent')
    if (import.meta.env.DEV) {
      console.log('[Today] Auth: email update initiated for', email)
    }
  }, [])

  // Reset linking status to idle
  const resetLinkingStatus = useCallback(() => {
    setLinkingStatus('idle')
    setLinkingError(null)
  }, [])

  // Verify OTP code for email authentication
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

  // Resend OTP code to pending email
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

  // Reset OTP status for retry flows
  const resetOtpStatus = useCallback(() => {
    setOtpStatus('idle')
    setOtpError(null)
  }, [])

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
}
