import { useState, useCallback } from 'react'

/**
 * Generic hook for localStorage persistence
 * AC-4.1.1: Saves state immediately on setValue
 * AC-4.1.2: Loads state from localStorage on mount
 * AC-4.1.5: Returns error state for graceful degradation
 *
 * @param key - localStorage key
 * @param initialValue - fallback value if localStorage is empty/fails
 * @returns [storedValue, setValue, error]
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T) => void, Error | null] {
  const [error, setError] = useState<Error | null>(null)

  // Initialize state from localStorage or use initial value
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key)
      if (item === null) {
        return initialValue
      }
      return JSON.parse(item) as T
    } catch (err) {
      // AC-4.1.5: Graceful degradation on parse failure
      if (import.meta.env.DEV) {
        console.warn(`[Today] useLocalStorage: Failed to load "${key}"`, err)
      }
      setError(err as Error)
      return initialValue
    }
  })

  // Wrapped setter that persists to localStorage
  const setValue = useCallback((value: T) => {
    try {
      setStoredValue(value)
      const serialized = JSON.stringify(value)
      localStorage.setItem(key, serialized)
      setError(null) // Clear any previous error on success

      if (import.meta.env.DEV) {
        console.log(`[Today] useLocalStorage: Saved "${key}"`)
      }
    } catch (err) {
      // AC-4.1.4: Capture error for toast display (QuotaExceededError)
      // AC-4.1.5: State still updates in memory even on storage failure
      if (import.meta.env.DEV) {
        console.warn(`[Today] useLocalStorage: Failed to save "${key}"`, err)
      }
      setError(err as Error)
    }
  }, [key])

  return [storedValue, setValue, error]
}
