import { contextBridge } from 'electron'

// Empty stub for Story 1.1 - IPC bridge will be added in Story 2.2
contextBridge.exposeInMainWorld('electronAPI', {
  // Methods will be added in Story 2.2 (IPC Bridge Setup)
})
