import { useState, useEffect, useCallback } from 'react'

/**
 * Hook for tracking online/offline status
 *
 * Provides:
 * - isOnline: Current online status
 * - statusAnnouncement: Text for aria-live announcements
 *
 * AC-7.4.1, AC-7.4.6: Offline detection with accessibility
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [statusAnnouncement, setStatusAnnouncement] = useState('')

  const handleOnline = useCallback(() => {
    setIsOnline(true)
    setStatusAnnouncement('You are now online')

    if (import.meta.env.DEV) {
      console.log('[Today] useOnlineStatus: online')
    }

    // Clear announcement after screen reader has time to read it
    setTimeout(() => setStatusAnnouncement(''), 1000)
  }, [])

  const handleOffline = useCallback(() => {
    setIsOnline(false)
    setStatusAnnouncement('You are now offline. Changes will sync when reconnected.')

    if (import.meta.env.DEV) {
      console.log('[Today] useOnlineStatus: offline')
    }

    // Clear announcement after screen reader has time to read it
    setTimeout(() => setStatusAnnouncement(''), 1000)
  }, [])

  useEffect(() => {
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [handleOnline, handleOffline])

  return { isOnline, statusAnnouncement }
}
