import { useReducer, useState, useCallback, useRef, useEffect } from 'react'
import type { Task, AppState, TaskNotes } from '../types'
import { loadState, saveState } from '../utils/storage'
import { supabase } from '../lib/supabase'
import type { TaskRow, CategoryRow } from '../types/database'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'

/**
 * Action types for task state management
 */
type TaskAction =
  | { type: 'ADD_TASK'; id: string; text: string }
  | { type: 'COMPLETE_TASK'; id: string }
  | { type: 'DELETE_TASK'; id: string }
  | { type: 'DEFER_TASK'; id: string; deferredTo: string | null; category: string }
  | { type: 'UPDATE_TASK'; id: string; text: string; deferredTo: string | null; category: string | null }
  | { type: 'UPDATE_NOTES'; id: string; notes: TaskNotes | null }
  | { type: 'LOAD_STATE'; tasks: Task[] }
  | { type: 'SYNC_TASK'; task: Task }
  | { type: 'REMOVE_TASK'; id: string }

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
          notes: null,
        },
      ]
    case 'COMPLETE_TASK':
      return state.map(task =>
        task.id === action.id
          ? { ...task, completedAt: new Date().toISOString() }
          : task
      )
    case 'DELETE_TASK':
    case 'REMOVE_TASK':
      return state.filter(task => task.id !== action.id)
    case 'DEFER_TASK':
      return state.map(task =>
        task.id === action.id
          ? { ...task, deferredTo: action.deferredTo, category: action.category }
          : task
      )
    case 'UPDATE_TASK':
      return state.map(task =>
        task.id === action.id
          ? { ...task, text: action.text.trim(), deferredTo: action.deferredTo, category: action.category }
          : task
      )
    case 'UPDATE_NOTES':
      return state.map(task =>
        task.id === action.id
          ? { ...task, notes: action.notes }
          : task
      )
    case 'LOAD_STATE':
      return action.tasks
    case 'SYNC_TASK':
      // Update or add task from remote
      const exists = state.find(t => t.id === action.task.id)
      if (exists) {
        return state.map(t => t.id === action.task.id ? action.task : t)
      }
      return [...state, action.task]
    default:
      return state
  }
}

/**
 * Convert Supabase row to local Task type
 */
const rowToTask = (row: TaskRow): Task => ({
  id: row.id,
  text: row.text,
  createdAt: row.created_at,
  deferredTo: row.deferred_to,
  category: row.category,
  completedAt: row.completed_at,
  notes: row.notes,
})

/**
 * Custom hook for managing task state with Supabase sync and localStorage fallback
 */
export const useTasks = (userId: string | null) => {
  const [tasks, dispatch] = useReducer(taskReducer, initialState)
  const [categories, setCategories] = useState<string[]>([])
  const [newTaskIds, setNewTaskIds] = useState<Set<string>>(new Set())
  const [storageError, setStorageError] = useState<Error | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const timeoutRefs = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  // Fetch data from Supabase
  const fetchFromSupabase = useCallback(async (uid: string) => {
    try {
      setIsSyncing(true)

      // Fetch tasks and categories in parallel
      const [tasksResult, categoriesResult] = await Promise.all([
        supabase.from('tasks').select('*').eq('user_id', uid).order('created_at', { ascending: true }),
        supabase.from('categories').select('*').eq('user_id', uid).order('created_at', { ascending: true }),
      ])

      if (tasksResult.error) throw tasksResult.error
      if (categoriesResult.error) throw categoriesResult.error

      const remoteTasks = (tasksResult.data || []).map(rowToTask)
      const remoteCategories = (categoriesResult.data || []).map((c: CategoryRow) => c.name)

      dispatch({ type: 'LOAD_STATE', tasks: remoteTasks })
      setCategories(remoteCategories)

      if (import.meta.env.DEV) {
        console.log('[Today] Synced from Supabase', {
          tasks: remoteTasks.length,
          categories: remoteCategories.length
        })
      }

      return { tasks: remoteTasks, categories: remoteCategories }
    } catch (err) {
      console.error('[Today] Supabase fetch error:', err)
      return null
    } finally {
      setIsSyncing(false)
    }
  }, [])

  // Initial data load
  useEffect(() => {
    const initData = async () => {
      // First, try localStorage for immediate display
      const savedState = loadState()
      if (savedState) {
        dispatch({ type: 'LOAD_STATE', tasks: savedState.tasks })
        setCategories(savedState.categories)
        if (import.meta.env.DEV) {
          console.log('[Today] Hydrated from localStorage', {
            tasks: savedState.tasks.length,
            categories: savedState.categories.length
          })
        }
      }

      // Then fetch from Supabase if authenticated
      if (userId) {
        await fetchFromSupabase(userId)
      }

      setIsHydrated(true)
    }

    initData()
  }, [userId, fetchFromSupabase])

  // Real-time subscription for cross-device sync
  useEffect(() => {
    if (!userId) return

    const channel = supabase
      .channel('tasks-changes')
      .on<TaskRow>(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `user_id=eq.${userId}`,
        },
        (payload: RealtimePostgresChangesPayload<TaskRow>) => {
          if (import.meta.env.DEV) {
            console.log('[Today] Realtime task change:', payload.eventType)
          }

          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const task = rowToTask(payload.new as TaskRow)
            dispatch({ type: 'SYNC_TASK', task })
          } else if (payload.eventType === 'DELETE') {
            const old = payload.old as { id?: string }
            if (old.id) {
              dispatch({ type: 'REMOVE_TASK', id: old.id })
            }
          }
        }
      )
      .on<CategoryRow>(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'categories',
          filter: `user_id=eq.${userId}`,
        },
        (payload: RealtimePostgresChangesPayload<CategoryRow>) => {
          if (import.meta.env.DEV) {
            console.log('[Today] Realtime category change:', payload.eventType)
          }

          if (payload.eventType === 'INSERT') {
            const cat = payload.new as CategoryRow
            setCategories(prev => {
              if (prev.includes(cat.name)) return prev
              return [...prev, cat.name]
            })
          } else if (payload.eventType === 'DELETE') {
            const old = payload.old as { name?: string }
            if (old.name) {
              setCategories(prev => prev.filter(c => c !== old.name))
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  // Save to localStorage after every change (offline backup)
  useEffect(() => {
    if (!isHydrated) return

    const state: AppState = { tasks, categories }
    const result = saveState(state)

    if (!result.success && result.error) {
      setStorageError(result.error)
    } else {
      setStorageError(null)
    }
  }, [tasks, categories, isHydrated])

  const addTask = useCallback(async (text: string) => {
    const id = crypto.randomUUID()
    const trimmedText = text.trim()

    // Optimistic local update
    setNewTaskIds(prev => new Set(prev).add(id))
    const timeoutId = setTimeout(() => {
      setNewTaskIds(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
      timeoutRefs.current.delete(id)
    }, 250)
    timeoutRefs.current.set(id, timeoutId)

    dispatch({ type: 'ADD_TASK', id, text: trimmedText })

    // Sync to Supabase
    if (userId) {
      const { error } = await supabase.from('tasks').insert({
        id,
        user_id: userId,
        text: trimmedText,
      })
      if (error) {
        console.error('[Today] Failed to sync add task:', error)
      }
    }
  }, [userId])

  const completeTask = useCallback(async (id: string) => {
    const completedAt = new Date().toISOString()
    dispatch({ type: 'COMPLETE_TASK', id })

    if (userId) {
      const { error } = await supabase
        .from('tasks')
        .update({ completed_at: completedAt })
        .eq('id', id)
        .eq('user_id', userId)
      if (error) {
        console.error('[Today] Failed to sync complete task:', error)
      }
    }
  }, [userId])

  const deleteTask = useCallback(async (id: string) => {
    dispatch({ type: 'DELETE_TASK', id })

    if (userId) {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id)
        .eq('user_id', userId)
      if (error) {
        console.error('[Today] Failed to sync delete task:', error)
      }
    }
  }, [userId])

  const deferTask = useCallback(async (id: string, deferredTo: string | null, category: string) => {
    dispatch({ type: 'DEFER_TASK', id, deferredTo, category })

    if (userId) {
      const { error } = await supabase
        .from('tasks')
        .update({ deferred_to: deferredTo, category })
        .eq('id', id)
        .eq('user_id', userId)
      if (error) {
        console.error('[Today] Failed to sync defer task:', error)
      }
    }
  }, [userId])

  const updateTask = useCallback(async (id: string, text: string, deferredTo: string | null, category: string | null) => {
    dispatch({ type: 'UPDATE_TASK', id, text, deferredTo, category })

    if (userId) {
      const { error } = await supabase
        .from('tasks')
        .update({ text: text.trim(), deferred_to: deferredTo, category })
        .eq('id', id)
        .eq('user_id', userId)
      if (error) {
        console.error('[Today] Failed to sync update task:', error)
      }
    }
  }, [userId])

  const updateNotes = useCallback(async (id: string, notes: TaskNotes | null) => {
    dispatch({ type: 'UPDATE_NOTES', id, notes })

    if (userId) {
      const { error } = await supabase
        .from('tasks')
        .update({ notes })
        .eq('id', id)
        .eq('user_id', userId)
      if (error) {
        console.error('[Today] Failed to sync update notes:', error)
      }
    }
  }, [userId])

  const addCategory = useCallback(async (name: string) => {
    const trimmedName = name.trim()
    if (!trimmedName) return

    // Check for duplicate
    if (categories.some(cat => cat.toLowerCase() === trimmedName.toLowerCase())) {
      return
    }

    setCategories(prev => [...prev, trimmedName])

    if (userId) {
      const { error } = await supabase.from('categories').insert({
        user_id: userId,
        name: trimmedName,
      })
      if (error) {
        console.error('[Today] Failed to sync add category:', error)
      }
    }
  }, [userId, categories])

  return {
    tasks,
    categories,
    addTask,
    completeTask,
    deleteTask,
    deferTask,
    updateTask,
    updateNotes,
    addCategory,
    newTaskIds,
    dispatch,
    storageError,
    isHydrated,
    isSyncing,
  }
}
