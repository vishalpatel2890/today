/**
 * Platform detection utilities for Electron/Web environment detection
 *
 * This module provides utilities to detect whether the app is running
 * in Electron (desktop) or a web browser environment.
 *
 * Per ADR-007: All Electron features are exposed via window.electronAPI
 * using contextBridge with contextIsolation: true.
 */

/**
 * Detects if the app is running in an Electron environment
 *
 * Detection is based on the presence of window.electronAPI which is
 * exposed by the Electron preload script via contextBridge.
 *
 * @returns true if running in Electron, false if running in browser or SSR
 *
 * @example
 * ```typescript
 * import { isElectron } from '@/lib/platform';
 *
 * if (isElectron()) {
 *   // Desktop-only feature
 *   window.electronAPI.activity.start(entryId);
 * }
 * ```
 */
export function isElectron(): boolean {
  // Handle SSR/build case - window is undefined during server-side rendering
  if (typeof window === 'undefined') {
    return false
  }

  // Check for electronAPI presence (exposed by preload script)
  if (!('electronAPI' in window)) {
    return false
  }

  // Final verification that the API object exists
  return window.electronAPI !== undefined
}
