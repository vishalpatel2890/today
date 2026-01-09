import { useMemo } from 'react'
import { isToday, isTomorrow, isPast, startOfDay, parseISO, isValid } from 'date-fns'
import type { Task } from '../types'

/**
 * Auto-surfacing hook for date-based task filtering
 *
 * Routing logic (category does NOT affect view placement):
 * - Today view: Tasks with today's date OR overdue (past) dates
 * - Tomorrow view: Tasks with tomorrow's date
 * - Deferred view: Tasks with no date, invalid dates, or future dates (beyond tomorrow)
 * - Completed tasks: Excluded from all views
 *
 * Source: notes/tech-spec.md (fix-deferred-routing)
 */
export const useAutoSurface = (tasks: Task[]): {
  todayTasks: Task[]
  tomorrowTasks: Task[]
  deferredTasks: Task[]
} => {
  // Memoize for performance - only recalculate when tasks change
  // Performance target: < 5ms per tech-spec
  const { todayTasks, tomorrowTasks, deferredTasks } = useMemo(() => {
    if (import.meta.env.DEV) {
      console.log('[Today] useAutoSurface: filtering', tasks.length, 'tasks')
    }

    const today: Task[] = []
    const tomorrow: Task[] = []
    const deferred: Task[] = []

    for (const task of tasks) {
      // AC-4.2.6: Completed tasks do not appear in any view
      if (task.completedAt) continue

      // Parse the deferred date if present
      let taskDate: Date | null = null
      let isValidDate = false

      if (task.deferredTo) {
        taskDate = parseISO(task.deferredTo)
        isValidDate = isValid(taskDate)
      }

      // Determine which view this task belongs to
      // Routing is based on date only - category does not affect view placement
      if (!task.deferredTo || !isValidDate) {
        // No date or invalid date → Deferred view
        deferred.push(task)
      } else if (isToday(taskDate!)) {
        // Today's date → Today view
        today.push(task)
      } else if (isPast(startOfDay(taskDate!))) {
        // Overdue (past date) → Today view (surfaces for attention)
        today.push(task)
      } else if (isTomorrow(taskDate!)) {
        // Tomorrow's date → Tomorrow view
        tomorrow.push(task)
      } else {
        // Future date (beyond tomorrow) → Deferred view
        deferred.push(task)
      }
    }

    if (import.meta.env.DEV) {
      console.log('[Today] useAutoSurface result:', {
        today: today.length,
        tomorrow: tomorrow.length,
        deferred: deferred.length
      })
    }

    return { todayTasks: today, tomorrowTasks: tomorrow, deferredTasks: deferred }
  }, [tasks])

  return { todayTasks, tomorrowTasks, deferredTasks }
}
