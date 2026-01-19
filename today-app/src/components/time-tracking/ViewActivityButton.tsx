import { Activity } from 'lucide-react'

interface ViewActivityButtonProps {
  /** Time entry ID for future Epic 4 activity modal */
  timeEntryId: string
  /** Tab index for accessibility - typically 0 when visible, -1 when hidden */
  tabIndex?: number
}

/**
 * ViewActivityButton - Electron-only button to view activity log
 *
 * This button appears only in Electron for completed time entries.
 * Clicking opens the activity log modal (implemented in Epic 4).
 *
 * For now, this is a placeholder that logs to console.
 *
 * Source: notes/sprint-artifacts/tech-spec-epic-2-electron.md#AC3
 * Source: notes/architecture-electron-migration.md#Feature-Detection-Pattern
 */
export const ViewActivityButton = ({ timeEntryId, tabIndex = 0 }: ViewActivityButtonProps) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    console.log('[Epic 2] View Activity clicked - modal in Epic 4', { timeEntryId })
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex-1 h-full flex items-center justify-center bg-blue-500 text-white hover:bg-blue-600 transition-colors"
      aria-label="View Activity"
      title="View Activity"
      tabIndex={tabIndex}
    >
      <Activity className="h-4 w-4" />
    </button>
  )
}
