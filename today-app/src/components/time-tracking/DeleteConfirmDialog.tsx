import { useState, useCallback } from 'react'
import * as AlertDialog from '@radix-ui/react-alert-dialog'
import type { TimeEntry } from '../../types/timeTracking'
import { formatDurationSummary } from '../../lib/timeFormatters'

interface DeleteConfirmDialogProps {
  /** Whether the dialog is open */
  isOpen: boolean
  /** Callback when dialog is closed (cancel) */
  onClose: () => void
  /** The time entry to be deleted */
  entry: TimeEntry | null
  /** Callback when deletion is confirmed */
  onConfirm: (id: string) => Promise<void>
}

/**
 * DeleteConfirmDialog - Confirmation dialog for deleting a time entry
 *
 * Uses Radix AlertDialog for accessibility (focus trap, Escape to cancel).
 *
 * Features:
 * - Shows entry details (duration, task name)
 * - Cancel and Delete buttons
 * - Loading state during deletion
 *
 * Source: notes/tech-spec-swipe-actions.md#Delete Confirmation Dialog
 * Source: AC-7, AC-8, AC-9
 */
export const DeleteConfirmDialog = ({
  isOpen,
  onClose,
  entry,
  onConfirm,
}: DeleteConfirmDialogProps) => {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleConfirm = useCallback(async () => {
    if (!entry) return

    setIsDeleting(true)

    try {
      await onConfirm(entry.id)
      onClose()
    } catch (error) {
      console.error('[Today] DeleteConfirmDialog: Failed to delete', error)
    } finally {
      setIsDeleting(false)
    }
  }, [entry, onConfirm, onClose])

  if (!entry) return null

  const duration = formatDurationSummary(entry.duration)

  return (
    <AlertDialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 bg-black/50 data-[state=open]:animate-fade-in z-[70]" />
        <AlertDialog.Content className="fixed left-1/2 top-1/2 z-[70] w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-lg bg-surface p-6 shadow-lg focus:outline-none data-[state=open]:animate-fade-in">
          <AlertDialog.Title className="font-display text-lg font-semibold text-foreground mb-2">
            Delete Time Entry?
          </AlertDialog.Title>
          <AlertDialog.Description className="text-sm text-muted-foreground mb-6">
            This will permanently remove <span className="font-medium text-foreground">{duration}</span> from "{entry.task_name}".
            This cannot be undone.
          </AlertDialog.Description>

          <div className="flex gap-3 justify-end">
            <AlertDialog.Cancel asChild>
              <button
                type="button"
                disabled={isDeleting}
                className="py-2 px-4 text-sm font-medium rounded-md border border-border bg-surface text-foreground hover:bg-surface-muted transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isDeleting}
                className="py-2 px-4 text-sm font-medium rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}
