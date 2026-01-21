import { useEffect, useRef } from 'react'
import CloudOff from 'lucide-react/dist/esm/icons/cloud-off'
import CloudUpload from 'lucide-react/dist/esm/icons/cloud-upload'
import { useOnlineStatus } from '../hooks/useOnlineStatus'
import { useSyncQueue } from '../hooks/useSyncQueue'
import { useToast } from '../contexts/ToastContext'

interface SyncStatusBadgeProps {
  userId: string | null
}

/**
 * SyncStatusBadge Component
 *
 * Displays the current sync status:
 * - Offline: CloudOff icon with "Offline" text (muted-foreground)
 * - Syncing: CloudUpload icon with "Syncing..." text (animate-pulse)
 * - Pending: CloudUpload icon with count badge (warning color)
 * - Online & Synced: null (no indicator shown)
 *
 * AC-7.4.1: Offline indicator in header
 * AC-7.4.2: Online indicator states
 * AC-7.4.3: Syncing state
 * AC-7.4.4: Sync success notification
 * AC-7.4.6: Accessibility with aria-labels and aria-live
 */
export const SyncStatusBadge = ({ userId }: SyncStatusBadgeProps) => {
  const { isOnline, statusAnnouncement } = useOnlineStatus()
  const { pendingCount, isSyncing, lastSyncResult } = useSyncQueue(userId)
  const { addToast } = useToast()
  const prevPendingRef = useRef<number>(pendingCount)
  const prevSyncingRef = useRef<boolean>(isSyncing)

  // Show toast when sync completes successfully (AC-7.4.4)
  useEffect(() => {
    // Detect transition from syncing to not syncing
    if (prevSyncingRef.current && !isSyncing) {
      // Sync just completed
      if (lastSyncResult && lastSyncResult.processed > 0 && pendingCount === 0) {
        addToast('All changes synced', { type: 'success' })

        if (import.meta.env.DEV) {
          console.log('[Today] SyncStatusBadge: sync complete toast shown')
        }
      }
    }
    prevSyncingRef.current = isSyncing
    prevPendingRef.current = pendingCount
  }, [isSyncing, lastSyncResult, pendingCount, addToast])

  // Offline state (AC-7.4.1)
  if (!isOnline) {
    return (
      <>
        {/* Aria-live region for status announcements (AC-7.4.6) */}
        <div
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
        >
          {statusAnnouncement}
        </div>
        <div
          className="flex items-center gap-1.5 text-muted-foreground"
          role="status"
          aria-label="You are offline"
        >
          <CloudOff className="h-4 w-4" aria-hidden="true" />
          <span className="text-xs font-medium">Offline</span>
        </div>
      </>
    )
  }

  // Syncing state (AC-7.4.3)
  if (isSyncing) {
    return (
      <>
        <div
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
        >
          {statusAnnouncement}
        </div>
        <div
          className="flex items-center gap-1.5 text-primary animate-pulse"
          role="status"
          aria-label="Syncing changes"
        >
          <CloudUpload className="h-4 w-4" aria-hidden="true" />
          <span className="text-xs font-medium">Syncing...</span>
        </div>
      </>
    )
  }

  // Pending changes state (AC-7.4.2)
  if (pendingCount > 0) {
    return (
      <>
        <div
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
        >
          {statusAnnouncement}
        </div>
        <div
          className="flex items-center gap-1.5 text-amber-600 dark:text-amber-500"
          role="status"
          aria-label={`${pendingCount} ${pendingCount === 1 ? 'change' : 'changes'} pending sync`}
        >
          <CloudUpload className="h-4 w-4" aria-hidden="true" />
          <span className="text-xs font-mono font-medium">{pendingCount}</span>
        </div>
      </>
    )
  }

  // Online and synced - no indicator needed (AC-7.4.2)
  // Still render aria-live region for status changes
  return statusAnnouncement ? (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    >
      {statusAnnouncement}
    </div>
  ) : null
}
