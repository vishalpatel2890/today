import { useReducer, useState, useCallback, useRef, useEffect } from 'react'
import { startOfDay } from 'date-fns'
import type { Task, AppState, TaskNotes } from '../types'
import { loadState, saveState } from '../utils/storage'
import { supabase } from '../lib/supabase'
import { db, type LocalTask, type SyncStatus } from '../lib/db'
import { migrateFromLocalStorage, localTaskToTask } from '../lib/migration'
import { queueOperation } from '../lib/syncQueue'
import type { TaskRow, CategoryRow } from '../types/database'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'

/**
 * Action types for task state management
 */
type TaskAction =
  | { type: 'ADD_TASK'; id: string; text: string }
  | { type: 'COMPLETE_TASK'; id: string }
  | { type: 'UNCOMPLETE_TASK'; id: string; deferredTo: string }
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
          deferredTo: startOfDay(new Date()).toISOString(),
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
    case 'UNCOMPLETE_TASK':
      return state.map(task =>
        task.id === action.id
          ? { ...task, completedAt: null, deferredTo: action.deferredTo }
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
    case 'SYNC_TASK': {
      // Update or add task from remote
      const exists = state.find(t => t.id === action.task.id)
      if (exists) {
        return state.map(t => t.id === action.task.id ? action.task : t)
      }
      return [...state, action.task]
    }
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
 * Convert Task to LocalTask for IndexedDB storage
 */
const taskToLocalTask = (
  task: Task,
  userId: string,
  syncStatus: SyncStatus = 'pending'
): LocalTask => ({
  id: task.id,
  user_id: userId,
  text: task.text,
  created_at: task.createdAt,
  deferred_to: task.deferredTo,
  category: task.category,
  completed_at: task.completedAt,
  updated_at: new Date().toISOString(),
  notes: task.notes,
  _syncStatus: syncStatus,
  _localUpdatedAt: new Date().toISOString(),
})

/**
 * Save a task to IndexedDB with sync status tracking
 */
const saveTaskToIndexedDB = async (
  task: Task,
  userId: string,
  syncStatus: SyncStatus = 'pending'
): Promise<void> => {
  try {
    const localTask = taskToLocalTask(task, userId, syncStatus)
    await db.tasks.put(localTask)
    if (import.meta.env.DEV) {
      console.log('[Today] IndexedDB: saved task', { id: task.id, syncStatus })
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('[Today] IndexedDB: failed to save task', error)
    }
  }
}

/**
 * Delete a task from IndexedDB
 */
const deleteTaskFromIndexedDB = async (taskId: string): Promise<void> => {
  try {
    await db.tasks.delete(taskId)
    if (import.meta.env.DEV) {
      console.log('[Today] IndexedDB: deleted task', { id: taskId })
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('[Today] IndexedDB: failed to delete task', error)
    }
  }
}

/**
 * Load all tasks from IndexedDB
 */
const loadTasksFromIndexedDB = async (userId: string): Promise<Task[]> => {
  try {
    let localTasks: LocalTask[]
    if (userId) {
      localTasks = await db.tasks.where('user_id').equals(userId).toArray()
    } else {
      // For anonymous users, get all tasks (including those with empty user_id)
      localTasks = await db.tasks.toArray()
    }
    return localTasks.map(localTaskToTask)
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('[Today] IndexedDB: failed to load tasks', error)
    }
    return []
  }
}

/**
 * Custom hook for managing task state with IndexedDB storage,
 * Supabase sync, and localStorage backup
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

      // Save remote tasks to IndexedDB with 'synced' status
      for (const task of remoteTasks) {
        await saveTaskToIndexedDB(task, uid, 'synced')
      }

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

  // Initial data load - now uses IndexedDB with migration
  useEffect(() => {
    const initData = async () => {
      const effectiveUserId = userId || ''

      // Step 1: Run migration from localStorage to IndexedDB (if needed)
      const migrationResult = await migrateFromLocalStorage(effectiveUserId)
      if (import.meta.env.DEV && migrationResult.taskCount > 0) {
        console.log('[Today] Migrated tasks from localStorage to IndexedDB:', migrationResult.taskCount)
      }

      // Step 2: Load from IndexedDB for immediate display
      const idbTasks = await loadTasksFromIndexedDB(effectiveUserId)
      if (idbTasks.length > 0) {
        dispatch({ type: 'LOAD_STATE', tasks: idbTasks })
        if (import.meta.env.DEV) {
          console.log('[Today] Hydrated from IndexedDB', { tasks: idbTasks.length })
        }
      } else {
        // Fallback: Try localStorage if IndexedDB is empty (graceful degradation)
        const savedState = loadState()
        if (savedState && savedState.tasks.length > 0) {
          dispatch({ type: 'LOAD_STATE', tasks: savedState.tasks })
          setCategories(savedState.categories)
          if (import.meta.env.DEV) {
            console.log('[Today] Fallback: Hydrated from localStorage', {
              tasks: savedState.tasks.length,
              categories: savedState.categories.length
            })
          }
        }
      }

      // Step 3: Fetch from Supabase if authenticated (source of truth when online)
      if (userId) {
        await fetchFromSupabase(userId)
      }

      setIsHydrated(true)
    }

    initData()
  }, [userId, fetchFromSupabase])

  // Refetch data when app becomes visible (PWA reopened, tab focused, etc.)
  // Debounced to prevent excessive API calls when switching tabs frequently
  useEffect(() => {
    if (!userId) return

    let lastSyncTime = 0
    const SYNC_DEBOUNCE_MS = 5000 // Only sync if 5+ seconds since last sync

    const triggerSync = () => {
      const now = Date.now()
      if (now - lastSyncTime < SYNC_DEBOUNCE_MS) {
        if (import.meta.env.DEV) {
          console.log('[Today] Sync debounced - too recent')
        }
        return
      }

      if (navigator.onLine) {
        lastSyncTime = now
        if (import.meta.env.DEV) {
          console.log('[Today] Auto-sync triggered')
        }
        fetchFromSupabase(userId)
      }
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        triggerSync()
      }
    }

    // Also sync when window regains focus (for desktop browsers)
    const handleFocus = () => {
      triggerSync()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
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
        async (payload: RealtimePostgresChangesPayload<TaskRow>) => {
          if (import.meta.env.DEV) {
            console.log('[Today] Realtime task change:', payload.eventType)
          }

          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const task = rowToTask(payload.new as TaskRow)
            dispatch({ type: 'SYNC_TASK', task })
            // Update IndexedDB with synced status
            await saveTaskToIndexedDB(task, userId, 'synced')
          } else if (payload.eventType === 'DELETE') {
            const old = payload.old as { id?: string }
            if (old.id) {
              dispatch({ type: 'REMOVE_TASK', id: old.id })
              // Remove from IndexedDB
              await deleteTaskFromIndexedDB(old.id)
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

  // Save to localStorage after every change (backup for graceful degradation)
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
    const effectiveUserId = userId || ''
    const now = new Date().toISOString()

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

    // Create the task object for storage
    const todayDate = startOfDay(new Date()).toISOString()
    const newTask: Task = {
      id,
      text: trimmedText,
      createdAt: now,
      deferredTo: todayDate,
      category: null,
      completedAt: null,
      notes: null,
    }

    // Save to IndexedDB immediately with 'pending' sync status
    await saveTaskToIndexedDB(newTask, effectiveUserId, userId ? 'pending' : 'synced')

    // Sync to Supabase (or queue if offline)
    if (userId) {
      const payload = {
        id,
        user_id: userId,
        text: trimmedText,
        created_at: now,
        deferred_to: todayDate,
      }

      if (navigator.onLine) {
        // Online: try to sync immediately
        const { error } = await supabase.from('tasks').insert(payload)
        if (error) {
          console.error('[Today] Failed to sync add task:', error)
          // Queue for retry
          await queueOperation('INSERT', 'tasks', id, payload)
        } else {
          // Update sync status to 'synced'
          await saveTaskToIndexedDB(newTask, userId, 'synced')
        }
      } else {
        // Offline: queue for later sync
        await queueOperation('INSERT', 'tasks', id, payload)
        if (import.meta.env.DEV) {
          console.log('[Today] Offline: queued add task', { id })
        }
      }
    }
  }, [userId])

  const completeTask = useCallback(async (id: string) => {
    const completedAt = new Date().toISOString()
    const effectiveUserId = userId || ''
    dispatch({ type: 'COMPLETE_TASK', id })

    // Find the task to update in IndexedDB
    const task = tasks.find(t => t.id === id)
    if (task) {
      const updatedTask = { ...task, completedAt }
      await saveTaskToIndexedDB(updatedTask, effectiveUserId, userId ? 'pending' : 'synced')
    }

    if (userId) {
      const payload = { completed_at: completedAt }

      if (navigator.onLine) {
        const { error } = await supabase
          .from('tasks')
          .update(payload)
          .eq('id', id)
          .eq('user_id', userId)
        if (error) {
          console.error('[Today] Failed to sync complete task:', error)
          // Queue for retry
          await queueOperation('UPDATE', 'tasks', id, payload)
        } else if (task) {
          // Update sync status to 'synced'
          await saveTaskToIndexedDB({ ...task, completedAt }, userId, 'synced')
        }
      } else {
        // Offline: queue for later sync
        await queueOperation('UPDATE', 'tasks', id, payload)
        if (import.meta.env.DEV) {
          console.log('[Today] Offline: queued complete task', { id })
        }
      }
    }
  }, [userId, tasks])

  const uncompleteTask = useCallback(async (id: string) => {
    const deferredTo = startOfDay(new Date()).toISOString()
    const effectiveUserId = userId || ''
    dispatch({ type: 'UNCOMPLETE_TASK', id, deferredTo })

    // Find the task to update in IndexedDB
    const task = tasks.find(t => t.id === id)
    if (task) {
      const updatedTask = { ...task, completedAt: null, deferredTo }
      await saveTaskToIndexedDB(updatedTask, effectiveUserId, userId ? 'pending' : 'synced')
    }

    if (userId) {
      const payload = { completed_at: null, deferred_to: deferredTo }

      if (navigator.onLine) {
        const { error } = await supabase
          .from('tasks')
          .update(payload)
          .eq('id', id)
          .eq('user_id', userId)
        if (error) {
          console.error('[Today] Failed to sync uncomplete task:', error)
          // Queue for retry
          await queueOperation('UPDATE', 'tasks', id, payload)
        } else if (task) {
          // Update sync status to 'synced'
          await saveTaskToIndexedDB({ ...task, completedAt: null, deferredTo }, userId, 'synced')
        }
      } else {
        // Offline: queue for later sync
        await queueOperation('UPDATE', 'tasks', id, payload)
        if (import.meta.env.DEV) {
          console.log('[Today] Offline: queued uncomplete task', { id })
        }
      }
    }
  }, [userId, tasks])

  const deleteTask = useCallback(async (id: string) => {
    dispatch({ type: 'DELETE_TASK', id })

    // Delete from IndexedDB
    await deleteTaskFromIndexedDB(id)

    if (userId) {
      if (navigator.onLine) {
        const { error } = await supabase
          .from('tasks')
          .delete()
          .eq('id', id)
          .eq('user_id', userId)
        if (error) {
          console.error('[Today] Failed to sync delete task:', error)
          // Queue for retry
          await queueOperation('DELETE', 'tasks', id, {})
        }
      } else {
        // Offline: queue for later sync
        // Note: DELETE operations discard pending UPDATEs in coalesceOperations
        await queueOperation('DELETE', 'tasks', id, {})
        if (import.meta.env.DEV) {
          console.log('[Today] Offline: queued delete task', { id })
        }
      }
    }
  }, [userId])

  const deferTask = useCallback(async (id: string, deferredTo: string | null, category: string) => {
    const effectiveUserId = userId || ''
    dispatch({ type: 'DEFER_TASK', id, deferredTo, category })

    // Find and update task in IndexedDB
    const task = tasks.find(t => t.id === id)
    if (task) {
      const updatedTask = { ...task, deferredTo, category }
      await saveTaskToIndexedDB(updatedTask, effectiveUserId, userId ? 'pending' : 'synced')
    }

    if (userId) {
      const payload = { deferred_to: deferredTo, category }

      if (navigator.onLine) {
        const { error } = await supabase
          .from('tasks')
          .update(payload)
          .eq('id', id)
          .eq('user_id', userId)
        if (error) {
          console.error('[Today] Failed to sync defer task:', error)
          // Queue for retry
          await queueOperation('UPDATE', 'tasks', id, payload)
        } else if (task) {
          await saveTaskToIndexedDB({ ...task, deferredTo, category }, userId, 'synced')
        }
      } else {
        // Offline: queue for later sync
        await queueOperation('UPDATE', 'tasks', id, payload)
        if (import.meta.env.DEV) {
          console.log('[Today] Offline: queued defer task', { id })
        }
      }
    }
  }, [userId, tasks])

  const updateTask = useCallback(async (id: string, text: string, deferredTo: string | null, category: string | null) => {
    const effectiveUserId = userId || ''
    const trimmedText = text.trim()
    dispatch({ type: 'UPDATE_TASK', id, text, deferredTo, category })

    // Find and update task in IndexedDB
    const task = tasks.find(t => t.id === id)
    if (task) {
      const updatedTask = { ...task, text: trimmedText, deferredTo, category }
      await saveTaskToIndexedDB(updatedTask, effectiveUserId, userId ? 'pending' : 'synced')
    }

    if (userId) {
      const payload = { text: trimmedText, deferred_to: deferredTo, category }

      if (navigator.onLine) {
        const { error } = await supabase
          .from('tasks')
          .update(payload)
          .eq('id', id)
          .eq('user_id', userId)
        if (error) {
          console.error('[Today] Failed to sync update task:', error)
          // Queue for retry
          await queueOperation('UPDATE', 'tasks', id, payload)
        } else if (task) {
          await saveTaskToIndexedDB({ ...task, text: trimmedText, deferredTo, category }, userId, 'synced')
        }
      } else {
        // Offline: queue for later sync
        await queueOperation('UPDATE', 'tasks', id, payload)
        if (import.meta.env.DEV) {
          console.log('[Today] Offline: queued update task', { id })
        }
      }
    }
  }, [userId, tasks])

  const updateNotes = useCallback(async (id: string, notes: TaskNotes | null) => {
    const effectiveUserId = userId || ''
    dispatch({ type: 'UPDATE_NOTES', id, notes })

    // Find and update task in IndexedDB
    const task = tasks.find(t => t.id === id)
    if (task) {
      const updatedTask = { ...task, notes }
      await saveTaskToIndexedDB(updatedTask, effectiveUserId, userId ? 'pending' : 'synced')
    }

    if (userId) {
      const payload = { notes }

      if (navigator.onLine) {
        const { error } = await supabase
          .from('tasks')
          .update(payload)
          .eq('id', id)
          .eq('user_id', userId)
        if (error) {
          console.error('[Today] Failed to sync update notes:', error)
          // Queue for retry
          await queueOperation('UPDATE', 'tasks', id, payload)
        } else if (task) {
          await saveTaskToIndexedDB({ ...task, notes }, userId, 'synced')
        }
      } else {
        // Offline: queue for later sync
        await queueOperation('UPDATE', 'tasks', id, payload)
        if (import.meta.env.DEV) {
          console.log('[Today] Offline: queued update notes', { id })
        }
      }
    }
  }, [userId, tasks])

  const addCategory = useCallback(async (name: string) => {
    const trimmedName = name.trim()
    if (!trimmedName) return

    // Check for duplicate
    if (categories.some(cat => cat.toLowerCase() === trimmedName.toLowerCase())) {
      return
    }

    setCategories(prev => [...prev, trimmedName])

    if (userId) {
      const categoryId = crypto.randomUUID()
      const payload = {
        id: categoryId,
        user_id: userId,
        name: trimmedName,
      }

      if (navigator.onLine) {
        const { error } = await supabase.from('categories').insert(payload)
        if (error) {
          console.error('[Today] Failed to sync add category:', error)
          // Queue for retry
          await queueOperation('INSERT', 'categories', categoryId, payload)
        }
      } else {
        // Offline: queue for later sync
        await queueOperation('INSERT', 'categories', categoryId, payload)
        if (import.meta.env.DEV) {
          console.log('[Today] Offline: queued add category', { name: trimmedName })
        }
      }
    }
  }, [userId, categories])

  return {
    tasks,
    categories,
    addTask,
    completeTask,
    uncompleteTask,
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
