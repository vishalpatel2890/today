import { useState, useMemo } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import X from 'lucide-react/dist/esm/icons/x'
import {
  parseISO,
  isToday,
  isYesterday,
  isThisWeek,
  subDays,
  subWeeks,
  startOfDay,
  startOfWeek,
  endOfWeek,
} from 'date-fns'
import type { Task, TaskNotes } from '../types'
import { CompletedTaskRow } from './CompletedTaskRow'
import { NotesModal } from './NotesModal'

type DateGroup = 'today' | 'yesterday' | 'thisWeek' | 'lastWeek' | 'older'

interface CompletedTasksModalProps {
  isOpen: boolean
  onClose: () => void
  tasks: Task[]
  onUncomplete: (id: string) => void
  onUpdateNotes: (id: string, notes: TaskNotes | null) => void
}

/**
 * Get the date group for a completed task
 */
const getDateGroup = (completedAt: string): DateGroup => {
  const date = parseISO(completedAt)
  if (isToday(date)) return 'today'
  if (isYesterday(date)) return 'yesterday'
  if (isThisWeek(date, { weekStartsOn: 1 })) return 'thisWeek'

  // Check if in previous week
  const lastWeekStart = startOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 })
  const lastWeekEnd = endOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 })
  if (date >= lastWeekStart && date <= lastWeekEnd) return 'lastWeek'

  return 'older'
}

/**
 * Group label mapping
 */
const GROUP_LABELS: Record<DateGroup, string> = {
  today: 'Today',
  yesterday: 'Yesterday',
  thisWeek: 'This Week',
  lastWeek: 'Last Week',
  older: 'Older',
}

/**
 * Group order for rendering
 */
const GROUP_ORDER: DateGroup[] = ['today', 'yesterday', 'thisWeek', 'lastWeek', 'older']

/**
 * CompletedTasksModal - Modal for viewing and managing completed tasks
 *
 * Features:
 * - Shows tasks completed in the last 14 days (AC2)
 * - Groups tasks by date: Today, Yesterday, This Week, Last Week, Older (AC3)
 * - Each task shows text and relative completion time (AC4)
 * - Undo button to mark task incomplete (AC5, AC6)
 * - Notes button to view task notes (AC7)
 * - Empty state when no completed tasks (AC10)
 *
 * Source: notes/sprint-artifacts/story-completed-tasks-view-1.md - Task 5
 * Source: notes/tech-spec-completed-tasks-view.md
 */
export const CompletedTasksModal = ({
  isOpen,
  onClose,
  tasks,
  onUncomplete,
  onUpdateNotes,
}: CompletedTasksModalProps) => {
  // State for viewing notes
  const [notesTask, setNotesTask] = useState<Task | null>(null)

  // Filter to last 14 days and group by date (AC2, AC3)
  const groupedTasks = useMemo(() => {
    const fourteenDaysAgo = subDays(startOfDay(new Date()), 14)

    // Filter completed tasks from last 14 days
    const completedTasks = tasks.filter(
      (task) =>
        task.completedAt !== null &&
        parseISO(task.completedAt) >= fourteenDaysAgo
    )

    // Sort by completion date (most recent first)
    completedTasks.sort((a, b) => {
      const dateA = parseISO(a.completedAt!)
      const dateB = parseISO(b.completedAt!)
      return dateB.getTime() - dateA.getTime()
    })

    // Group tasks by date
    const groups = new Map<DateGroup, Task[]>()
    for (const task of completedTasks) {
      const group = getDateGroup(task.completedAt!)
      const existing = groups.get(group) || []
      groups.set(group, [...existing, task])
    }

    return groups
  }, [tasks])

  // Check if there are any completed tasks
  const hasCompletedTasks = groupedTasks.size > 0

  // Handle viewing notes
  const handleViewNotes = (task: Task) => {
    setNotesTask(task)
  }

  // Handle saving notes
  const handleSaveNotes = (notes: TaskNotes | null) => {
    if (notesTask) {
      onUpdateNotes(notesTask.id, notes)
    }
  }

  return (
    <>
      <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 data-[state=open]:animate-fade-in" />
          <Dialog.Content
            className="fixed left-0 right-0 z-50 w-full rounded-t-2xl bg-surface p-6 shadow-lg focus:outline-none data-[state=open]:animate-slide-up bottom-0 md:left-1/2 md:right-auto md:-translate-x-1/2 md:bottom-auto md:top-1/2 md:-translate-y-1/2 md:max-w-[450px] md:rounded-lg max-h-[80vh] overflow-y-auto"
            aria-describedby={undefined}
            aria-label="Completed Tasks"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <Dialog.Title className="font-display text-lg font-semibold text-foreground">
                Completed Tasks
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

            {/* Content */}
            <div className="space-y-4">
              {hasCompletedTasks ? (
                // Render grouped tasks
                GROUP_ORDER.map((group) => {
                  const groupTasks = groupedTasks.get(group)
                  if (!groupTasks || groupTasks.length === 0) return null

                  return (
                    <div key={group}>
                      <h3 className="text-sm font-medium text-foreground mb-2">
                        {GROUP_LABELS[group]}{' '}
                        <span className="text-muted-foreground font-normal">
                          ({groupTasks.length})
                        </span>
                      </h3>
                      <div className="bg-surface-muted rounded-lg divide-y divide-border/50">
                        {groupTasks.map((task) => (
                          <CompletedTaskRow
                            key={task.id}
                            task={task}
                            onUncomplete={onUncomplete}
                            onViewNotes={handleViewNotes}
                          />
                        ))}
                      </div>
                    </div>
                  )
                })
              ) : (
                // Empty state (AC10)
                <div className="bg-surface-muted rounded-lg p-8">
                  <p className="text-sm text-muted-foreground text-center">
                    No completed tasks in the last 14 days
                  </p>
                </div>
              )}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Notes Modal (AC7) */}
      {notesTask && (
        <NotesModal
          task={notesTask}
          isOpen={notesTask !== null}
          onClose={() => setNotesTask(null)}
          onSave={handleSaveNotes}
        />
      )}
    </>
  )
}
