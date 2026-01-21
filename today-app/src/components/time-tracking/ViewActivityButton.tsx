import { useState } from 'react'
import Activity from 'lucide-react/dist/esm/icons/activity'
import { ActivityLogModal } from './ActivityLogModal'

interface ViewActivityButtonProps {
  /** Time entry ID for fetching activity data */
  timeEntryId: string
  /** Task name to display in modal header */
  taskName: string
  /** Session start time (ISO 8601) */
  startTime: string
  /** Session end time (ISO 8601) */
  endTime: string
  /** Tab index for accessibility - typically 0 when visible, -1 when hidden */
  tabIndex?: number
}

/**
 * ViewActivityButton - Electron-only button to view activity log
 *
 * This button appears only in Electron for completed time entries.
 * Clicking opens the activity log modal showing which apps were used
 * during the time tracking session.
 *
 * Source: notes/sprint-artifacts/tech-spec-epic-2-electron.md#AC3
 * Source: notes/architecture-electron-migration.md#Feature-Detection-Pattern
 * Source: notes/sprint-artifacts/4-2-activity-log-modal-ui.md#Task-4
 */
export const ViewActivityButton = ({
  timeEntryId,
  taskName,
  startTime,
  endTime,
  tabIndex = 0,
}: ViewActivityButtonProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
  }

  return (
    <>
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

      <ActivityLogModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        timeEntryId={timeEntryId}
        taskName={taskName}
        startTime={startTime}
        endTime={endTime}
      />
    </>
  )
}
