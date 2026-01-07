import { ChevronDown, ChevronRight } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import type { Task } from '../types'
import { TaskList } from './TaskList'

interface CategorySectionProps {
  category: string
  tasks: Task[]
  isExpanded: boolean
  onToggle: () => void
  onComplete: (id: string) => void
  onDelete: (id: string) => void
  onUpdate: (id: string, text: string, deferredTo: string | null, category: string | null) => void
  categories: string[]
  onCreateCategory: (name: string) => void
}

/**
 * Format deferred date for display in Deferred view
 * AC-3.5.5: Show "Jan 15" format or "Someday" for null dates
 */
const formatDeferredDate = (deferredTo: string | null): string => {
  if (!deferredTo) return 'Someday'
  return format(parseISO(deferredTo), 'MMM d')
}

/**
 * CategorySection - Collapsible category with header and task list
 * AC-3.5.2: Displays chevron, category name, and task count
 * AC-3.5.3: Click header to toggle expand/collapse
 */
export const CategorySection = ({
  category,
  tasks,
  isExpanded,
  onToggle,
  onComplete,
  onDelete,
  onUpdate,
  categories,
  onCreateCategory,
}: CategorySectionProps) => {
  const ChevronIcon = isExpanded ? ChevronDown : ChevronRight

  return (
    <div className="mb-2">
      {/* Category Header - AC-3.5.2 */}
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-2 py-3 transition-colors hover:bg-surface-muted"
        aria-expanded={isExpanded}
        aria-controls={`category-content-${category}`}
      >
        <ChevronIcon
          className={`h-4 w-4 text-muted-foreground transition-transform duration-200`}
          strokeWidth={2}
        />
        <span className="font-medium text-foreground">{category}</span>
        <span className="text-sm text-muted-foreground">({tasks.length})</span>
      </button>

      {/* Collapsible Content - AC-3.5.3 */}
      <div
        id={`category-content-${category}`}
        className="grid transition-[grid-template-rows] duration-200 ease-out"
        style={{ gridTemplateRows: isExpanded ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden">
          <div className="pl-6 pt-2">
            {/* Task list with date badges - AC-3.5.5 */}
            <div className="flex flex-col gap-3">
              {tasks.map((task) => (
                <div key={task.id} className="relative">
                  <TaskList
                    tasks={[task]}
                    categories={categories}
                    onComplete={onComplete}
                    onDelete={onDelete}
                    onUpdate={onUpdate}
                    onCreateCategory={onCreateCategory}
                  />
                  {/* Date badge - AC-3.5.5 - positioned to left of edit/delete buttons */}
                  <span className="absolute right-24 top-1/2 -translate-y-1/2 rounded bg-surface-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {formatDeferredDate(task.deferredTo)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
