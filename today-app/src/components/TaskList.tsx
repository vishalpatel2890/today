import { useState, useCallback } from 'react'
import type { Task, TaskNotes } from '../types'
import { TaskCard } from './TaskCard'

interface TaskListProps {
  tasks: Task[]
  categories: string[]
  newTaskIds?: Set<string>
  onComplete: (id: string) => void
  onDelete: (id: string) => void
  onUpdate: (id: string, text: string, deferredTo: string | null, category: string | null) => void
  onCreateCategory: (name: string) => void
  onNotesUpdate?: (id: string, notes: TaskNotes | null) => void
  onReorder?: (taskId: string, newSortOrder: number) => void
}

/**
 * Calculate new sortOrder using fractional indexing
 * Places task between two existing tasks without needing to update all tasks
 */
const calculateNewSortOrder = (
  tasks: Task[],
  fromIndex: number,
  toIndex: number
): number => {
  // Get sorted tasks by sortOrder
  const sortedTasks = [...tasks].sort((a, b) => a.sortOrder - b.sortOrder)

  // Handle edge cases
  if (toIndex === 0) {
    // Moving to start: use first task's sortOrder minus 1000
    return sortedTasks[0].sortOrder - 1000
  }

  if (toIndex >= sortedTasks.length) {
    // Moving to end: use last task's sortOrder plus 1000
    return sortedTasks[sortedTasks.length - 1].sortOrder + 1000
  }

  // Moving between two tasks: calculate midpoint
  // Account for the task being moved
  const adjustedToIndex = fromIndex < toIndex ? toIndex : toIndex - 1
  const prevTask = sortedTasks[adjustedToIndex]
  const nextTask = sortedTasks[adjustedToIndex + 1]

  if (!nextTask) {
    // Dropping at end
    return prevTask.sortOrder + 1000
  }

  // Calculate midpoint between prev and next
  return Math.floor((prevTask.sortOrder + nextTask.sortOrder) / 2)
}

export const TaskList = ({ tasks, categories, newTaskIds, onComplete, onDelete, onUpdate, onCreateCategory, onNotesUpdate, onReorder }: TaskListProps) => {
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null)
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null)

  const handleDragStart = useCallback((e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', taskId)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDropTargetIndex(index)
  }, [])

  const handleDragLeave = useCallback(() => {
    // Only clear if leaving the list entirely
  }, [])

  const handleDragEnd = useCallback(() => {
    setDraggedTaskId(null)
    setDropTargetIndex(null)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent, toIndex: number) => {
    e.preventDefault()
    const taskId = e.dataTransfer.getData('text/plain')

    if (!taskId || !onReorder) {
      handleDragEnd()
      return
    }

    // Find the current index of the dragged task
    const sortedTasks = [...tasks].sort((a, b) => a.sortOrder - b.sortOrder)
    const fromIndex = sortedTasks.findIndex(t => t.id === taskId)

    if (fromIndex === -1 || fromIndex === toIndex) {
      handleDragEnd()
      return
    }

    // Calculate new sort order using fractional indexing
    const newSortOrder = calculateNewSortOrder(tasks, fromIndex, toIndex)
    onReorder(taskId, newSortOrder)

    handleDragEnd()
  }, [tasks, onReorder, handleDragEnd])

  // Sort tasks by sortOrder for display
  const sortedTasks = [...tasks].sort((a, b) => a.sortOrder - b.sortOrder)

  return (
    <div
      className="flex flex-col gap-3"
      onDragLeave={handleDragLeave}
    >
      {sortedTasks.map((task, index) => (
        <div key={task.id}>
          {/* Drop placeholder line - shown above the current item */}
          {dropTargetIndex === index && draggedTaskId !== task.id && (
            <div className="h-1 bg-primary rounded-full mb-3 animate-pulse" />
          )}
          <TaskCard
            task={task}
            categories={categories}
            isNew={newTaskIds?.has(task.id)}
            isDragging={draggedTaskId === task.id}
            onComplete={onComplete}
            onDelete={onDelete}
            onUpdate={onUpdate}
            onCreateCategory={onCreateCategory}
            onNotesUpdate={onNotesUpdate}
            onDragStart={(e) => handleDragStart(e, task.id)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            onDrop={(e) => handleDrop(e, index)}
            draggable={!!onReorder}
          />
        </div>
      ))}
      {/* Drop placeholder at end of list */}
      {dropTargetIndex === sortedTasks.length && draggedTaskId && (
        <div className="h-1 bg-primary rounded-full animate-pulse" />
      )}
      {/* Invisible drop zone at end */}
      {onReorder && (
        <div
          className="h-8 -mt-4"
          onDragOver={(e) => handleDragOver(e, sortedTasks.length)}
          onDrop={(e) => handleDrop(e, sortedTasks.length)}
        />
      )}
    </div>
  )
}
