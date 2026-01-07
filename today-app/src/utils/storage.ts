import type { AppState } from '../types'

/**
 * localStorage key for persisting app state
 * AC-4.1.3: Data stored under 'today-app-state'
 */
export const STORAGE_KEY = 'today-app-state'

/**
 * Save app state to localStorage
 * AC-4.1.1: State saved immediately after task actions
 * AC-4.1.5: Returns success/error for graceful degradation
 */
export const saveState = (state: AppState): { success: boolean; error?: Error } => {
  try {
    const serialized = JSON.stringify(state)
    localStorage.setItem(STORAGE_KEY, serialized)
    if (import.meta.env.DEV) {
      console.log('[Today] Storage: saved', { tasks: state.tasks.length, categories: state.categories.length })
    }
    return { success: true }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('[Today] Storage: save failed', error)
    }
    return { success: false, error: error as Error }
  }
}

/**
 * Load app state from localStorage
 * AC-4.1.2: Restores tasks and categories on app load
 * AC-4.1.5: Returns null on failure (graceful degradation)
 */
export const loadState = (): AppState | null => {
  try {
    const serialized = localStorage.getItem(STORAGE_KEY)
    if (!serialized) {
      if (import.meta.env.DEV) {
        console.log('[Today] Storage: no saved state found')
      }
      return null
    }
    const state = JSON.parse(serialized) as AppState
    if (import.meta.env.DEV) {
      console.log('[Today] Storage: loaded', { tasks: state.tasks.length, categories: state.categories.length })
    }
    return state
  } catch (error) {
    // AC-4.1.5: Handle corrupt JSON gracefully
    if (import.meta.env.DEV) {
      console.warn('[Today] Storage: load failed (corrupt data?)', error)
    }
    return null
  }
}

/**
 * Clear app state from localStorage
 * Utility for development/testing
 */
export const clearState = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY)
    if (import.meta.env.DEV) {
      console.log('[Today] Storage: cleared')
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('[Today] Storage: clear failed', error)
    }
  }
}
