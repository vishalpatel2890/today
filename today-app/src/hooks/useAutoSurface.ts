import { useMemo } from 'react'
import { isToday, isTomorrow, isPast, startOfDay, parseISO, isValid } from 'date-fns'
import type { Task } from '../types'

/**
 * Auto-surfacing hook for date-based task filtering
 * AC-4.2.1: Tasks deferred to today appear in Today view
 * AC-4.2.2: Tasks deferred to tomorrow appear in Tomorrow view
 * AC-4.2.3: Tasks deferred beyond tomorrow appear in Deferred view
 * AC-4.2.4: Tasks with no date (someday) appear in Deferred view
 * AC-4.2.5: Surfacing occurs automatically on app load (via useMemo)
 * AC-4.2.6: Completed tasks filtered from all views
 *
 * Source: notes/sprint-artifacts/tech-spec-epic-4.md APIs and Interfaces
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
      if (!task.deferredTo) {
        // No deferred date
        if (task.category) {
          // AC-4.2.4: "Someday" task - has category but no date → Deferred
          deferred.push(task)
        } else {
          // New task with no category and no date → Today
          today.push(task)
        }
      } else if (!isValidDate) {
        // Invalid date string - treat as "someday" if has category, else Today
        if (task.category) {
          deferred.push(task)
        } else {
          today.push(task)
        }
      } else if (isToday(taskDate!)) {
        // AC-4.2.1: Task deferred to today → Today view
        today.push(task)
      } else if (isPast(startOfDay(taskDate!))) {
        // Overdue task: past date always surfaces to Today view
        today.push(task)
      } else if (isTomorrow(taskDate!)) {
        // AC-4.2.2: Task deferred to tomorrow → Tomorrow view
        tomorrow.push(task)
      } else if (task.category) {
        // AC-4.2.3: Task deferred to future date (beyond tomorrow) with category → Deferred
        deferred.push(task)
      } else {
        // Edge case: Task with future date but no category
        // Per story dev notes: should stay in Today (not yet properly deferred)
        today.push(task)
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
