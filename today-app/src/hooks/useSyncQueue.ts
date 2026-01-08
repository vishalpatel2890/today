import { useState, useEffect, useCallback, useRef } from 'react'
import { processQueue, getPendingCount, setConflictCallback, type SyncResult } from '../lib/syncQueue'
import { useToast } from '../contexts/ToastContext'

/**
 * Hook for managing the offline sync queue
 *
 * Provides:
 * - pendingCount: Number of operations waiting to sync
 * - isSyncing: Whether the queue is currently being processed
 * - lastSyncResult: Result of the last sync attempt
 * - triggerSync: Manually trigger queue processing
 *
 * Automatically processes the queue when:
 * - Component mounts and device is online
 * - Device comes back online after being offline
 *
 * AC-7.4.5: Registers conflict callback for toast notifications
 */
export function useSyncQueue(userId: string | null) {
  const { addToast } = useToast()
  const addToastRef = useRef(addToast)
  addToastRef.current = addToast

  // Register conflict callback for toast notifications (AC-7.4.5)
  useEffect(() => {
    setConflictCallback((message: string) => {
      addToastRef.current(message, { type: 'success' })
    })

    return () => {
      setConflictCallback(null)
    }
  }, [])
  const [pendingCount, setPendingCount] = useState(0)
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null)

  /**
   * Update the pending count from IndexedDB
   */
  const refreshPendingCount = useCallback(async () => {
    try {
      const count = await getPendingCount()
      setPendingCount(count)
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('[Today] useSyncQueue: failed to get pending count', error)
      }
    }
  }, [])

  /**
   * Process the sync queue
   */
  const triggerSync = useCallback(async () => {
    if (!userId || isSyncing) {
      return null
    }

    setIsSyncing(true)

    try {
      const result = await processQueue(userId)
      setLastSyncResult(result)
      await refreshPendingCount()

      if (import.meta.env.DEV) {
        console.log('[Today] useSyncQueue: sync complete', result)
      }

      return result
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('[Today] useSyncQueue: sync failed', error)
      }
      return null
    } finally {
      setIsSyncing(false)
    }
  }, [userId, isSyncing, refreshPendingCount])

  /**
   * Handle device coming online
   */
  const handleOnline = useCallback(async () => {
    if (import.meta.env.DEV) {
      console.log('[Today] useSyncQueue: device online, triggering sync')
    }
    await triggerSync()
  }, [triggerSync])

  /**
   * Handle device going offline - just update the count
   */
  const handleOffline = useCallback(async () => {
    if (import.meta.env.DEV) {
      console.log('[Today] useSyncQueue: device offline')
    }
    await refreshPendingCount()
  }, [refreshPendingCount])

  // Initial count on mount
  useEffect(() => {
    refreshPendingCount()
  }, [refreshPendingCount])

  // Process queue on mount if online and we have a userId
  useEffect(() => {
    if (userId && navigator.onLine) {
      triggerSync()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]) // Intentionally only depend on userId to run once on auth

  // Listen for online/offline events
  useEffect(() => {
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [handleOnline, handleOffline])

  // Refresh count periodically while syncing (to catch queue changes)
  useEffect(() => {
    if (!isSyncing) return

    const interval = setInterval(refreshPendingCount, 1000)
    return () => clearInterval(interval)
  }, [isSyncing, refreshPendingCount])

  return {
    pendingCount,
    isSyncing,
    lastSyncResult,
    triggerSync,
    refreshPendingCount,
  }
}
