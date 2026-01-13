import { RotateCcw, FileText } from 'lucide-react'
import { formatDistanceToNow, parseISO } from 'date-fns'
import type { Task } from '../types'

interface CompletedTaskRowProps {
  task: Task
  onUncomplete: (id: string) => void
  onViewNotes: (task: Task) => void
}

/**
 * Individual row in the CompletedTasksModal
 *
 * Displays:
 * - Task text
 * - Relative completion time (e.g., "2h ago", "Yesterday")
 * - Undo button (mark incomplete)
 * - Notes button (only if task has notes)
 *
 * Source: notes/sprint-artifacts/story-completed-tasks-view-1.md - Task 4
 */
export const CompletedTaskRow = ({ task, onUncomplete, onViewNotes }: CompletedTaskRowProps) => {
  const hasNotes = task.notes && task.notes.items && task.notes.items.length > 0

  // Format completion time as relative (e.g., "2 hours ago")
  const completionTime = task.completedAt
    ? formatDistanceToNow(parseISO(task.completedAt), { addSuffix: true })
    : ''

  return (
    <div className="flex items-center justify-between px-4 py-3 group hover:bg-surface transition-colors">
      <div className="flex-1 min-w-0 mr-3">
        <p className="text-sm text-foreground truncate">{task.text}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{completionTime}</p>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {/* Notes button - only shown if task has notes (AC7) */}
        {hasNotes && (
          <button
            type="button"
            onClick={() => onViewNotes(task)}
            className="rounded-full p-1.5 text-muted-foreground hover:bg-border/50 hover:text-foreground transition-colors"
            aria-label="View notes"
          >
            <FileText className="h-4 w-4" />
          </button>
        )}

        {/* Undo button - mark incomplete (AC5, AC6) */}
        <button
          type="button"
          onClick={() => onUncomplete(task.id)}
          className="rounded-full p-1.5 text-muted-foreground hover:bg-border/50 hover:text-foreground transition-colors"
          aria-label="Restore task to Today"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
