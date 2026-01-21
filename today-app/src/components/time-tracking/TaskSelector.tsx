import { useState, useRef, useEffect, useCallback } from 'react'
import * as Popover from '@radix-ui/react-popover'
import ChevronDown from 'lucide-react/dist/esm/icons/chevron-down'
import Check from 'lucide-react/dist/esm/icons/check'
import Search from 'lucide-react/dist/esm/icons/search'
import type { Task } from '../../types'

export interface SelectedTask {
  id: string
  name: string
}

interface TaskSelectorProps {
  tasks: Task[]
  selectedTask: SelectedTask | null
  onSelect: (task: SelectedTask) => void
  disabled?: boolean
  autoFocus?: boolean
}

/**
 * TaskSelector - Dropdown component for selecting tasks to track time for
 *
 * Uses Radix Popover for accessible dropdown with:
 * - Type-ahead filtering
 * - Keyboard navigation (Arrow Up/Down, Enter, Escape)
 * - Visual indication of selected task
 *
 * Source: notes/ux-design-time-tracking.md#6.1 TaskSelector Component
 */
export const TaskSelector = ({
  tasks,
  selectedTask,
  onSelect,
  disabled = false,
  autoFocus = false,
}: TaskSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState(0)

  const triggerRef = useRef<HTMLButtonElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Filter tasks based on search query
  const filteredTasks = tasks.filter(task =>
    task.text.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Reset highlighted index when filtered tasks change
  useEffect(() => {
    setHighlightedIndex(0)
  }, [searchQuery])

  // Auto-focus trigger when autoFocus prop is true
  useEffect(() => {
    if (autoFocus && triggerRef.current) {
      // Small delay to ensure modal animation completes
      const timer = setTimeout(() => {
        triggerRef.current?.focus()
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [autoFocus])

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isOpen])

  // Scroll highlighted item into view
  useEffect(() => {
    if (isOpen && listRef.current) {
      const highlightedElement = listRef.current.querySelector('[data-highlighted="true"]')
      // scrollIntoView may not be available in test environments (jsdom)
      if (highlightedElement && typeof highlightedElement.scrollIntoView === 'function') {
        highlightedElement.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [highlightedIndex, isOpen])

  const handleSelect = useCallback((task: Task) => {
    onSelect({ id: task.id, name: task.text })
    setIsOpen(false)
    setSearchQuery('')
    // Return focus to trigger after selection
    triggerRef.current?.focus()
  }, [onSelect])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen) {
      // Open dropdown on Enter or ArrowDown when closed
      if (e.key === 'Enter' || e.key === 'ArrowDown') {
        e.preventDefault()
        setIsOpen(true)
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex(prev =>
          prev < filteredTasks.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : 0)
        break
      case 'Enter':
        e.preventDefault()
        if (filteredTasks[highlightedIndex]) {
          handleSelect(filteredTasks[highlightedIndex])
        }
        break
      case 'Escape':
        e.preventDefault()
        setIsOpen(false)
        setSearchQuery('')
        triggerRef.current?.focus()
        break
    }
  }, [isOpen, filteredTasks, highlightedIndex, handleSelect])

  // Handle empty state
  const hasNoTasks = tasks.length === 0
  const hasNoResults = filteredTasks.length === 0 && searchQuery.length > 0

  return (
    <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
      <Popover.Trigger asChild>
        <button
          ref={triggerRef}
          type="button"
          disabled={disabled || hasNoTasks}
          onKeyDown={handleKeyDown}
          className={`
            w-full flex items-center justify-between px-3 py-2.5 rounded-md border text-left
            transition-colors text-sm
            ${disabled || hasNoTasks
              ? 'border-border bg-surface-muted text-muted-foreground cursor-not-allowed'
              : 'border-border bg-background text-foreground hover:border-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20'
            }
          `}
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-controls="task-listbox"
        >
          <span className={selectedTask ? 'text-foreground' : 'text-muted-foreground'}>
            {hasNoTasks
              ? 'No tasks for today. Add a task first.'
              : selectedTask?.name || 'Select a task...'}
          </span>
          <ChevronDown
            className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`}
            aria-hidden="true"
          />
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          className="w-[var(--radix-popover-trigger-width)] bg-surface border border-border rounded-md shadow-lg overflow-hidden z-50"
          sideOffset={4}
          align="start"
          onKeyDown={handleKeyDown}
        >
          {/* Search input for type-ahead filtering */}
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tasks..."
                className="w-full pl-8 pr-3 py-1.5 text-sm bg-background border border-border rounded focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                aria-label="Search tasks"
              />
            </div>
          </div>

          {/* Task list */}
          <div
            ref={listRef}
            id="task-listbox"
            role="listbox"
            aria-label="Tasks"
            className="max-h-48 overflow-y-auto"
          >
            {hasNoResults ? (
              <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                No tasks match "{searchQuery}"
              </div>
            ) : (
              filteredTasks.map((task, index) => {
                const isHighlighted = index === highlightedIndex
                const isSelected = selectedTask?.id === task.id

                return (
                  <div
                    key={task.id}
                    role="option"
                    aria-selected={isSelected}
                    data-highlighted={isHighlighted}
                    onClick={() => handleSelect(task)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`
                      flex items-center justify-between px-3 py-2 cursor-pointer text-sm
                      ${isHighlighted ? 'bg-surface-muted' : ''}
                      ${isSelected ? 'text-primary font-medium' : 'text-foreground'}
                    `}
                  >
                    <span className="truncate">{task.text}</span>
                    {isSelected && (
                      <Check className="h-4 w-4 text-primary flex-shrink-0 ml-2" aria-hidden="true" />
                    )}
                  </div>
                )
              })
            )}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
