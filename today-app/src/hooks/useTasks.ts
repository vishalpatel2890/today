import { useReducer, useState, useCallback, useRef } from 'react'
import type { Task } from '../types'

/**
 * Action types for task state management
 * Expandable for DEFER_TASK in future stories
 */
type TaskAction =
  | { type: 'ADD_TASK'; id: string; text: string }
  | { type: 'COMPLETE_TASK'; id: string }
  | { type: 'DELETE_TASK'; id: string }
  | { type: 'DEFER_TASK'; id: string; deferredTo: string | null; category: string }

const initialState: Task[] = []

const taskReducer = (state: Task[], action: TaskAction): Task[] => {
  switch (action.type) {
    case 'ADD_TASK':
      return [
        ...state,
        {
          id: action.id,
          text: action.text.trim(),
          createdAt: new Date().toISOString(),
          deferredTo: null,
          category: null,
          completedAt: null,
        },
      ]
    case 'COMPLETE_TASK':
      return state.map(task =>
        task.id === action.id
          ? { ...task, completedAt: new Date().toISOString() }
          : task
      )
    case 'DELETE_TASK':
      return state.filter(task => task.id !== action.id)
    case 'DEFER_TASK':
      if (import.meta.env.DEV) {
        console.log('[Today] DEFER_TASK', { id: action.id, deferredTo: action.deferredTo, category: action.category })
      }
      return state.map(task =>
        task.id === action.id
          ? { ...task, deferredTo: action.deferredTo, category: action.category }
          : task
      )
    default:
      return state
  }
}

/**
 * Custom hook for managing task state with useReducer
 * Source: notes/architecture.md ADR-005
 */
export const useTasks = () => {
  const [tasks, dispatch] = useReducer(taskReducer, initialState)
  const [categories, setCategories] = useState<string[]>([])
  const [newTaskIds, setNewTaskIds] = useState<Set<string>>(new Set())
  const timeoutRefs = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const addTask = useCallback((text: string) => {
    const id = crypto.randomUUID()

    // Add to new task IDs for animation
    setNewTaskIds(prev => new Set(prev).add(id))

    // Clear animation after it completes
    const timeoutId = setTimeout(() => {
      setNewTaskIds(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
      timeoutRefs.current.delete(id)
    }, 250) // Slightly longer than animation duration

    timeoutRefs.current.set(id, timeoutId)

    dispatch({ type: 'ADD_TASK', id, text })
  }, [])

  const completeTask = useCallback((id: string) => {
    dispatch({ type: 'COMPLETE_TASK', id })
  }, [])

  const deleteTask = useCallback((id: string) => {
    dispatch({ type: 'DELETE_TASK', id })
  }, [])

  /**
   * Defer a task to a future date with a category
   * @param id - Task ID to defer
   * @param deferredTo - ISO date string or null for "someday"
   * @param category - Category name (required)
   */
  const deferTask = useCallback((id: string, deferredTo: string | null, category: string) => {
    dispatch({ type: 'DEFER_TASK', id, deferredTo, category })
  }, [])

  /**
   * Add a new category to the categories list
   * Validates: non-empty, trimmed, no duplicates
   */
  const addCategory = useCallback((name: string) => {
    const trimmedName = name.trim()
    if (!trimmedName) return // Reject empty names

    setCategories(prev => {
      // Check for duplicate (case-insensitive comparison)
      if (prev.some(cat => cat.toLowerCase() === trimmedName.toLowerCase())) {
        return prev // Already exists, don't add duplicate
      }
      if (import.meta.env.DEV) {
        console.log('[Today] ADD_CATEGORY', trimmedName)
      }
      return [...prev, trimmedName]
    })
  }, [])

  return { tasks, categories, addTask, completeTask, deleteTask, deferTask, addCategory, newTaskIds, dispatch }
}
