import { useState, useMemo, useCallback } from 'react'
import { useDeferredViewHotkeys } from '../hooks/useDeferredViewHotkeys'
import type { Task, TaskNotes } from '../types'
import { CategorySection } from '../components/CategorySection'
import { EmptyState } from '../components/EmptyState'

interface DeferredViewProps {
  tasks: Task[]  // Pre-filtered by useAutoSurface hook
  categories: string[]
  onComplete: (id: string) => void
  onDelete: (id: string) => void
  onUpdate: (id: string, text: string, deferredTo: string | null, category: string | null) => void
  onCreateCategory: (name: string) => void
  onNotesUpdate?: (id: string, notes: TaskNotes | null) => void
}

/**
 * DeferredView - displays deferred tasks grouped by category
 * AC-4.2.3: Shows tasks deferred beyond tomorrow
 * AC-4.2.4: Shows "someday" tasks (no date but has category)
 * AC-4.2.5: Tasks are pre-filtered by useAutoSurface hook in App.tsx
 * AC-4.2.6: Completed tasks already filtered out by hook
 * AC-3.5.1: Tasks grouped under category headers
 * AC-3.5.4: First category expanded by default, others collapsed
 * AC-3.5.6: Categories sorted alphabetically
 */
export const DeferredView = ({
  tasks,
  categories,
  onComplete,
  onDelete,
  onUpdate,
  onCreateCategory,
  onNotesUpdate,
}: DeferredViewProps) => {
  // All categories collapsed by default
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  // Group pre-filtered tasks by category - memoized for performance
  // Tasks are already filtered by useAutoSurface hook in App.tsx (AC-4.2.5)
  // AC-8.1.1: Map null categories to "Other" for display
  const tasksByCategory = useMemo(() => {
    // Group by category, using "Other" for null categories
    return tasks.reduce(
      (acc, task) => {
        const cat = task.category ?? 'Other'
        if (!acc[cat]) acc[cat] = []
        acc[cat].push(task)
        return acc
      },
      {} as Record<string, Task[]>
    )
  }, [tasks])

  // AC-3.5.6: Get sorted category list (alphabetical)
  // AC-8.1.2: "Other" always sorts last
  const sortedCategories = useMemo(() => {
    return Object.keys(tasksByCategory).sort((a, b) => {
      if (a === 'Other') return 1
      if (b === 'Other') return -1
      return a.toLowerCase().localeCompare(b.toLowerCase())
    })
  }, [tasksByCategory])

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

  // Toggle all categories: if any expanded -> collapse all, if all collapsed -> expand all
  const toggleAllCategories = useCallback(() => {
    setExpandedCategories((prev) => {
      if (prev.size > 0) {
        // Some categories expanded -> collapse all
        return new Set()
      } else {
        // All collapsed -> expand all
        return new Set(sortedCategories)
      }
    })
  }, [sortedCategories])

  // Cmd+Opt+A / Ctrl+Alt+A hotkey to toggle all categories
  useDeferredViewHotkeys(toggleAllCategories)

  // AC-4.4.3: Empty state with single combined message per UX spec
  if (sortedCategories.length === 0) {
    return <EmptyState title="No deferred tasks. Everything is in Today or Tomorrow!" />
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
          onUpdate={onUpdate}
          categories={categories}
          onCreateCategory={onCreateCategory}
          onNotesUpdate={onNotesUpdate}
        />
      ))}
    </div>
  )
}
