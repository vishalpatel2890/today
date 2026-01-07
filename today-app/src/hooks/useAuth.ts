import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { User } from '@supabase/supabase-js'

export type LinkingStatus = 'idle' | 'sending' | 'sent' | 'error'

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

  useEffect(() => {
    // Get initial session
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()

        if (session?.user) {
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
      (_event, session) => {
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

  // Link email to anonymous account via magic link
  // If email already exists or no session, sign in with that account instead
  const linkEmail = useCallback(async (email: string) => {
    setLinkingStatus('sending')
    setLinkingError(null)

    // Determine redirect URL based on environment
    const redirectUrl = import.meta.env.DEV
      ? 'http://localhost:5173'
      : 'https://productivity.pitchsmith.ai'

    if (import.meta.env.DEV) {
      console.log('[Today] Auth: linking email', email, 'redirect:', redirectUrl)
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
          emailRedirectTo: redirectUrl,
        }
      })

      if (signInError) {
        setLinkingStatus('error')
        if (signInError.message.includes('rate limit')) {
          setLinkingError('Too many attempts. Please wait a moment.')
        } else {
          setLinkingError(signInError.message)
        }
        return
      }

      setLinkingStatus('sent')
      if (import.meta.env.DEV) {
        console.log('[Today] Auth: sign-in magic link sent to', email)
      }
      return
    }

    // We have an anonymous session, try to link the email
    const { error: updateError } = await supabase.auth.updateUser(
      { email },
      { emailRedirectTo: redirectUrl }
    )

    if (updateError) {
      // If email is already registered, try signing in with magic link instead
      if (updateError.message.includes('already registered') ||
          updateError.message.includes('already been registered')) {
        if (import.meta.env.DEV) {
          console.log('[Today] Auth: email exists, sending sign-in magic link')
        }

        const { error: signInError } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: redirectUrl,
          }
        })

        if (signInError) {
          setLinkingStatus('error')
          if (signInError.message.includes('rate limit')) {
            setLinkingError('Too many attempts. Please wait a moment.')
          } else {
            setLinkingError(signInError.message)
          }
          return
        }

        setLinkingStatus('sent')
        if (import.meta.env.DEV) {
          console.log('[Today] Auth: sign-in magic link sent to', email)
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
            emailRedirectTo: redirectUrl,
          }
        })

        if (signInError) {
          setLinkingStatus('error')
          setLinkingError(signInError.message)
          return
        }

        setLinkingStatus('sent')
        return
      }

      // Other errors
      setLinkingStatus('error')
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
      console.log('[Today] Auth: magic link sent to', email)
    }
  }, [])

  // Reset linking status to idle
  const resetLinkingStatus = useCallback(() => {
    setLinkingStatus('idle')
    setLinkingError(null)
  }, [])

  return {
    user,
    isLoading,
    error,
    isAnonymous,
    isLinked,
    linkEmail,
    linkingStatus,
    linkingError,
    resetLinkingStatus
  }
}
