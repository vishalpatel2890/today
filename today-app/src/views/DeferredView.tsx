import { useState, useEffect, useMemo } from 'react'
import { isToday, isTomorrow, parseISO } from 'date-fns'
import type { Task } from '../types'
import { CategorySection } from '../components/CategorySection'

interface DeferredViewProps {
  tasks: Task[]
  categories: string[]
  onComplete: (id: string) => void
  onDelete: (id: string) => void
  onDefer: (id: string, deferredTo: string | null, category: string) => void
  onCreateCategory: (name: string) => void
  onShowToast: (message: string) => void
}

/**
 * DeferredView - displays deferred tasks grouped by category
 * AC-3.5.1: Tasks grouped under category headers
 * AC-3.5.4: First category expanded by default, others collapsed
 * AC-3.5.6: Categories sorted alphabetically
 */
export const DeferredView = ({
  tasks,
  categories,
  onComplete,
  onDelete,
  onDefer,
  onCreateCategory,
  onShowToast,
}: DeferredViewProps) => {
  // AC-3.5.4: Track which categories are expanded (first one by default)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  // Track if we've initialized the expanded state
  const [hasInitialized, setHasInitialized] = useState(false)

  // Filter and group tasks by category - memoized for performance
  const tasksByCategory = useMemo(() => {
    // Filter for deferred tasks:
    // - Future dates (not today, not tomorrow)
    // - OR "someday" tasks (deferredTo === null with category set)
    // - AND not completed
    // - AND has category
    const deferredTasks = tasks.filter((task) => {
      // Must not be completed
      if (task.completedAt) return false
      // Must have a category
      if (!task.category) return false

      // "Someday" task - no date but has category
      if (task.deferredTo === null) return true

      // Future date - not today, not tomorrow
      const date = parseISO(task.deferredTo)
      return !isToday(date) && !isTomorrow(date)
    })

    // Group by category
    return deferredTasks.reduce(
      (acc, task) => {
        const cat = task.category!
        if (!acc[cat]) acc[cat] = []
        acc[cat].push(task)
        return acc
      },
      {} as Record<string, Task[]>
    )
  }, [tasks])

  // AC-3.5.6: Get sorted category list (alphabetical)
  const sortedCategories = useMemo(() => {
    return Object.keys(tasksByCategory).sort((a, b) =>
      a.toLowerCase().localeCompare(b.toLowerCase())
    )
  }, [tasksByCategory])

  // AC-3.5.4: Initialize first category as expanded on mount
  useEffect(() => {
    if (!hasInitialized && sortedCategories.length > 0) {
      setExpandedCategories(new Set([sortedCategories[0]]))
      setHasInitialized(true)
    }
  }, [sortedCategories, hasInitialized])

  // AC-3.5.3: Toggle category expand/collapse
  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(category)) {
        next.delete(category)
      } else {
        next.add(category)
      }
      return next
    })
  }

  // Empty state
  if (sortedCategories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-foreground">No deferred tasks.</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Everything is in Today or Tomorrow!
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1">
      {sortedCategories.map((category) => (
        <CategorySection
          key={category}
          category={category}
          tasks={tasksByCategory[category]}
          isExpanded={expandedCategories.has(category)}
          onToggle={() => toggleCategory(category)}
          onComplete={onComplete}
          onDelete={onDelete}
          onDefer={onDefer}
          categories={categories}
          onCreateCategory={onCreateCategory}
          onShowToast={onShowToast}
        />
      ))}
    </div>
  )
}
