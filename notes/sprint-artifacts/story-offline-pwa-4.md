# Story 7.4: Offline UI + Conflict Resolution

**Status:** Draft

---

## User Story

As a **user**,
I want **to see when I'm offline and how many changes are pending sync**,
So that **I know the status of my data and can trust the app is working correctly**.

---

## Acceptance Criteria

**AC-7.4.1: Offline Indicator in Header**
- **Given** the device goes offline
- **When** the Header component renders
- **Then** an offline icon (CloudOff from Lucide) is displayed
- **And** the icon uses the muted-foreground color
- **And** tooltip or aria-label says "Offline"

**AC-7.4.2: Online Indicator States**
- **Given** the device is online
- **When** there are no pending sync operations
- **Then** no indicator is shown (clean state)

- **Given** the device is online
- **When** there are pending sync operations
- **Then** a sync icon (CloudUpload) with a badge showing count is displayed
- **And** clicking the badge shows a brief status message

**AC-7.4.3: Syncing State**
- **Given** the sync queue is processing
- **When** operations are being sent to Supabase
- **Then** "Syncing..." text is shown below the header
- **And** indicator animates or pulses subtly

**AC-7.4.4: Sync Success Notification**
- **Given** pending operations exist
- **When** sync completes successfully
- **Then** a toast notification shows "All changes synced"
- **And** the pending count badge disappears

**AC-7.4.5: Conflict Detection**
- **Given** a task was edited offline
- **When** sync attempts to push the change
- **And** the server version has a newer `updated_at` timestamp
- **Then** the server version wins (last-write-wins)
- **And** local task is updated with server data
- **And** a toast notifies "Task updated from another device"

**AC-7.4.6: Accessibility**
- **Given** a screen reader is active
- **When** online status changes
- **Then** the status is announced via aria-live region
- **And** all indicators have appropriate aria-labels

---

## Implementation Details

### Tasks / Subtasks

- [ ] Create `src/hooks/useOnlineStatus.ts` hook
- [ ] Create `src/components/SyncStatusBadge.tsx` component
- [ ] Update `src/components/Header.tsx` to include offline indicator
- [ ] Add conflict detection to `processQueue()` in syncQueue.ts
- [ ] Implement last-write-wins resolution
- [ ] Add toast notifications for sync status
- [ ] Add aria-live announcements for status changes
- [ ] Test offline → show indicator
- [ ] Test online with pending → show badge
- [ ] Test sync complete → hide badge, show toast
- [ ] Test conflict scenario → server wins

### Technical Summary

**useOnlineStatus Hook:**
```typescript
// src/hooks/useOnlineStatus.ts
import { useState, useEffect } from 'react'

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return isOnline
}
```

**SyncStatusBadge Component:**
```typescript
// src/components/SyncStatusBadge.tsx
import { Cloud, CloudOff, CloudUpload } from 'lucide-react'
import { useOnlineStatus } from '../hooks/useOnlineStatus'
import { useSyncQueue } from '../hooks/useSyncQueue'

interface SyncStatusBadgeProps {
  userId: string | null
}

export const SyncStatusBadge = ({ userId }: SyncStatusBadgeProps) => {
  const isOnline = useOnlineStatus()
  const { pendingCount, isSyncing } = useSyncQueue(userId)

  if (!isOnline) {
    return (
      <div
        className="flex items-center gap-1 text-muted-foreground"
        aria-label="You are offline"
      >
        <CloudOff className="h-4 w-4" />
        <span className="text-xs">Offline</span>
      </div>
    )
  }

  if (isSyncing) {
    return (
      <div
        className="flex items-center gap-1 text-primary animate-pulse"
        aria-label="Syncing changes"
      >
        <CloudUpload className="h-4 w-4" />
        <span className="text-xs">Syncing...</span>
      </div>
    )
  }

  if (pendingCount > 0) {
    return (
      <div
        className="flex items-center gap-1 text-warning"
        aria-label={`${pendingCount} changes pending sync`}
      >
        <CloudUpload className="h-4 w-4" />
        <span className="text-xs font-mono">{pendingCount}</span>
      </div>
    )
  }

  // Online and synced - no indicator needed
  return null
}
```

**Header.tsx Update:**
```typescript
// In Header component, add SyncStatusBadge
import { SyncStatusBadge } from './SyncStatusBadge'

export const Header = ({ isLinked, email, onSyncClick, userId }: HeaderProps) => {
  return (
    <header className="flex items-center justify-between py-4">
      <h1 className="font-display text-2xl">Today</h1>
      <div className="flex items-center gap-4">
        <SyncStatusBadge userId={userId} />
        {/* existing sync button */}
      </div>
    </header>
  )
}
```

**Conflict Resolution in syncQueue.ts:**
```typescript
async function processSyncItem(item: SyncOperation, userId: string) {
  if (item.operation === 'UPDATE') {
    // Check for conflict
    const { data: serverTask } = await supabase
      .from('tasks')
      .select('updated_at')
      .eq('id', item.entityId)
      .single()

    const localTask = await db.tasks.get(item.entityId)

    if (serverTask && localTask) {
      const serverTime = new Date(serverTask.updated_at).getTime()
      const localTime = new Date(localTask._localUpdatedAt).getTime()

      if (serverTime > localTime) {
        // Server wins - fetch full server version and update local
        const { data: fullServerTask } = await supabase
          .from('tasks')
          .select('*')
          .eq('id', item.entityId)
          .single()

        if (fullServerTask) {
          await db.tasks.put({
            ...fullServerTask,
            _syncStatus: 'synced',
            _localUpdatedAt: fullServerTask.updated_at,
          })
          // Show conflict toast
          showToast('Task updated from another device')
          return // Don't push local changes
        }
      }
    }
  }

  // Proceed with normal sync
  const payload = JSON.parse(item.payload)
  switch (item.operation) {
    case 'INSERT':
      await supabase.from(item.table).insert({ ...payload, user_id: userId })
      break
    case 'UPDATE':
      await supabase.from(item.table).update(payload).eq('id', item.entityId)
      break
    case 'DELETE':
      await supabase.from(item.table).delete().eq('id', item.entityId)
      break
  }
}
```

### Project Structure Notes

- **Files to create:** `src/hooks/useOnlineStatus.ts`, `src/components/SyncStatusBadge.tsx`
- **Files to modify:** `src/components/Header.tsx`, `src/lib/syncQueue.ts`
- **Expected test locations:** `tests/hooks/useOnlineStatus.test.ts`
- **Prerequisites:** Story 7.3 (Sync Queue)

### Key Code References

**Header.tsx (current):**
```typescript
// src/components/Header.tsx:1-20
export const Header = ({ isLinked, email, onSyncClick }: HeaderProps) => {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between bg-background py-4">
      <div className="flex items-center gap-2">
        <h1 className="font-display text-2xl font-medium tracking-tight text-foreground">
          Today
        </h1>
      </div>
      {/* existing link chip */}
    </header>
  )
}
```

**Toast integration (existing pattern):**
```typescript
// From src/contexts/ToastContext.tsx and App.tsx
const { addToast } = useToast()
addToast('Storage full. Some data may not save.', { type: 'error' })
```

---

## Context References

**Tech-Spec:** [tech-spec-offline-pwa.md](../tech-spec-offline-pwa.md) - Primary context document containing:
- Offline indicator design states
- Conflict resolution strategy (last-write-wins)
- Accessibility requirements

**Existing Code:**
- `src/components/Header.tsx` - Where to add indicator
- `src/contexts/ToastContext.tsx` - Toast notification pattern
- `src/lib/syncQueue.ts` - Add conflict detection (from Story 7.3)

---

## Dev Agent Record

### Agent Model Used
<!-- Will be populated during dev-story execution -->

### Completion Notes
<!-- Will be populated during dev-story execution -->

### Files Modified
<!-- Will be populated during dev-story execution -->

### Test Results
<!-- Will be populated during dev-story execution -->

---

## Review Notes
<!-- Will be populated during code review -->
