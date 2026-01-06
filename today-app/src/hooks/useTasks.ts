import { useReducer, useState, useCallback, useRef } from 'react'
import type { Task } from '../types'

/**
 * Action types for task state management
 * Expandable for DELETE_TASK, DEFER_TASK in future stories
 */
type TaskAction =
  | { type: 'ADD_TASK'; id: string; text: string }
  | { type: 'COMPLETE_TASK'; id: string }
  | { type: 'DELETE_TASK'; id: string }

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

  return { tasks, addTask, completeTask, deleteTask, newTaskIds, dispatch }
}
