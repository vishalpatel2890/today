# Bug Fix Technical Specification: Time Entries Data Isolation

Date: 2026-01-11
Author: Claude (with Vishal)
Type: Security Bug Fix
Priority: Critical
Status: Draft

---

## Problem Statement

**Bug**: Time entries created by anonymous users are appearing in authenticated users' Insights view on the same device/browser.

**Impact**: Data leakage - users can see time tracking data that doesn't belong to them.

**Root Cause**: `useTimeInsights` reads directly from IndexedDB without user filtering. The IndexedDB cache contains entries from all users who have used the browser, and no `user_id` filtering is applied when fetching entries for display.

**Observed Behavior**:
- Anonymous user tracks time on Device X → entry saved with `user_id = anonymous-uuid`
- Authenticated user logs in on Device X → sees anonymous user's entries in Insights
- The entries are labeled "Test task for time tracking" from yesterday

---

## Architecture Misalignment

The current implementation diverges from the intended architecture:

**Architecture Doc (ADR-TT-002) States**:
> "Store completed time entries in Supabase with IndexedDB cache for offline"

**Architecture Doc (FR Category Mapping) States**:
> "Insights View (FR13-19) | ... | Storage: Supabase (read)"

**Current Implementation**:
- `useTimeInsights.ts:79` calls `getTimeEntries()` which reads **all** entries from IndexedDB
- No user filtering applied
- Supabase is never queried for insights data

**Intended Implementation**:
- Insights should read from **Supabase** (source of truth) for authenticated users
- IndexedDB should be a **user-scoped cache** for offline access only
- Active sessions (only) should use IndexedDB for crash recovery

---

## Solution: Option A - Supabase as Primary Source

### Design Principles

1. **Supabase is source of truth** for completed time entries
2. **IndexedDB is offline-only fallback** (not primary cache)
3. **Clear user boundaries** - no data mixing between users
4. **Preserve offline capability** - works when network unavailable

### Implementation Overview

```
Online Flow:
  useTimeInsights → fetchTimeEntries(userId) from Supabase → Display

Offline Flow:
  useTimeInsights → detect offline → getTimeEntries(userId) from IndexedDB → Display

User Change Flow:
  onAuthStateChange → clear IndexedDB time entries → fresh start for new user
```

---

## Detailed Design

### Changes to useTimeInsights.ts

**Current** (buggy):
```typescript
const fetchEntries = async () => {
  const allEntries = await getTimeEntries()  // IndexedDB, no user filter
  setEntries(allEntries)
}
```

**Fixed**:
```typescript
const fetchEntries = async () => {
  const { user } = useAuth()

  if (!user) {
    setEntries([])
    return
  }

  // Try Supabase first (source of truth)
  if (navigator.onLine) {
    try {
      const remoteEntries = await fetchTimeEntriesFromSupabase(user.id)
      setEntries(remoteEntries)
      // Optionally cache for offline (user-scoped)
      await cacheEntriesLocally(user.id, remoteEntries)
      return
    } catch (error) {
      console.warn('[Today] TimeInsights: Supabase fetch failed, falling back to cache')
    }
  }

  // Fallback to IndexedDB (offline or Supabase error)
  const cachedEntries = await getTimeEntriesByUserId(user.id)
  setEntries(cachedEntries)
}
```

### Changes to timeTrackingDb.ts

**Add user-filtered query**:
```typescript
/**
 * Get time entries from IndexedDB filtered by user_id
 *
 * @param userId - The user ID to filter by
 * @returns Array of cached time entries for this user only
 */
export async function getTimeEntriesByUserId(userId: string): Promise<CachedTimeEntry[]> {
  const entries = await timeTrackingDb.timeEntries
    .where('user_id')
    .equals(userId)
    .toArray()

  return entries
}

/**
 * Clear all time entries for a specific user
 * Called on logout to prevent data leakage
 */
export async function clearTimeEntriesForUser(userId: string): Promise<void> {
  await timeTrackingDb.timeEntries
    .where('user_id')
    .equals(userId)
    .delete()
}

/**
 * Clear ALL time entries from IndexedDB
 * Called on user change to ensure clean state
 */
export async function clearAllTimeEntries(): Promise<void> {
  await timeTrackingDb.timeEntries.clear()
}
```

### Changes to Auth Handling

**In useAuth or App.tsx - handle user changes**:
```typescript
useEffect(() => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      if (event === 'SIGNED_OUT') {
        // Clear local time entries to prevent leakage
        await clearAllTimeEntries()
      }

      if (event === 'SIGNED_IN' && previousUserId && previousUserId !== session?.user?.id) {
        // User changed - clear previous user's cached data
        await clearAllTimeEntries()
      }
    }
  )

  return () => subscription.unsubscribe()
}, [])
```

### Supabase Query (already exists but unused for insights)

**supabaseTimeEntries.ts** - already has correct implementation:
```typescript
export async function fetchTimeEntries(
  userId: string,
  since?: string
): Promise<TimeEntry[]> {
  let query = supabase
    .from('time_entries')
    .select('*')
    .eq('user_id', userId)  // ✓ Already user-filtered
    .order('created_at', { ascending: false })
  // ...
}
```

---

## Data Flow Changes

### Before (Buggy)

```
┌─────────────────────────────────────────────────────────────┐
│ useTimeInsights                                              │
│                                                              │
│  getTimeEntries() ─────────────► IndexedDB                  │
│  (ALL entries, no user filter)   (contains all users' data) │
│                                              │               │
│                                              ▼               │
│                                         Returns ALL         │
│                                         entries to UI       │
│                                         (DATA LEAK!)        │
└─────────────────────────────────────────────────────────────┘
```

### After (Fixed)

```
┌─────────────────────────────────────────────────────────────┐
│ useTimeInsights                                              │
│                                                              │
│  if (online) {                                               │
│    fetchTimeEntries(userId) ───► Supabase                   │
│    (RLS: only user's data)       (source of truth)          │
│  } else {                                    │               │
│    getTimeEntriesByUserId() ───► IndexedDB   │               │
│    (user-filtered cache)         (offline)   │               │
│  }                                           ▼               │
│                                         Returns only        │
│                                         current user's      │
│                                         entries             │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation Stories

### Story 1: Fix useTimeInsights to Query Supabase

**Acceptance Criteria**:
- AC-1.1: When online, `useTimeInsights` fetches time entries from Supabase using the current user's ID
- AC-1.2: Supabase query uses existing `fetchTimeEntries(userId)` function with RLS
- AC-1.3: When a user opens Insights, they only see their own time entries (never other users')
- AC-1.4: Loading state is shown while fetching from Supabase

**Implementation**:
- Modify `useTimeInsights.ts` to accept user context
- Call `fetchTimeEntriesFromSupabase()` when online
- Add loading state during fetch

### Story 2: Add Offline Fallback with User Filtering

**Acceptance Criteria**:
- AC-2.1: When offline, `useTimeInsights` falls back to IndexedDB cache
- AC-2.2: IndexedDB query filters by `user_id` - users only see their own cached entries
- AC-2.3: Network errors gracefully fall back to cache with console warning
- AC-2.4: Offline state is detected via `navigator.onLine`

**Implementation**:
- Add `getTimeEntriesByUserId(userId)` to `timeTrackingDb.ts`
- Implement try/catch fallback in `useTimeInsights`
- Use `navigator.onLine` for offline detection

### Story 3: Clear Local Data on User Change

**Acceptance Criteria**:
- AC-3.1: When a user logs out, all time entries are cleared from IndexedDB
- AC-3.2: When a different user logs in (user ID changes), previous user's entries are cleared
- AC-3.3: Anonymous user entries do not persist after an authenticated user logs in
- AC-3.4: Active tracking session is also cleared on user change (prevents session hijacking)

**Implementation**:
- Add `clearAllTimeEntries()` to `timeTrackingDb.ts`
- Hook into `onAuthStateChange` in auth handling
- Clear both `timeEntries` and `activeSession` stores on user change

---

## Testing

### Unit Tests

| Test Case | Expected Behavior |
|-----------|-------------------|
| `useTimeInsights` with online status | Calls `fetchTimeEntriesFromSupabase(userId)` |
| `useTimeInsights` with offline status | Calls `getTimeEntriesByUserId(userId)` |
| `getTimeEntriesByUserId` with user A | Returns only user A's entries |
| `getTimeEntriesByUserId` with mixed data | Filters out other users' entries |
| `clearAllTimeEntries` | IndexedDB `timeEntries` store is empty |

### Integration Tests

| Test Case | Steps | Expected |
|-----------|-------|----------|
| Data isolation | 1. Create entry as User A<br>2. Log out<br>3. Log in as User B<br>4. Open Insights | User B sees empty Insights (or only their own entries) |
| Offline fallback | 1. Go online, open Insights<br>2. Go offline<br>3. Refresh, open Insights | Same entries shown from cache |
| User change clears cache | 1. Track as anonymous<br>2. Link account (new user_id)<br>3. Open Insights | No anonymous entries visible |

### Manual Verification (for the reported bug)

1. Clear browser data for the app
2. Use app anonymously, track time on a task
3. Log in with `vishalpatel2890@gmail.com`
4. Open Insights modal
5. **Expected**: No anonymous entries visible
6. **Previously**: Anonymous entries were visible (the bug)

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Breaking offline functionality | High | Implement fallback first, test extensively |
| Performance regression (Supabase fetch vs local) | Medium | Use loading states, consider caching strategy |
| Clearing data loses unsynced entries | Medium | Only clear cache, sync queue handles pending entries |
| Race condition during user change | Low | Use async/await properly, handle edge cases |

---

## Rollout Plan

1. **Phase 1**: Add user filtering to IndexedDB queries (backward compatible)
2. **Phase 2**: Switch `useTimeInsights` to Supabase-first
3. **Phase 3**: Add cache clearing on user change
4. **Phase 4**: Clean up existing leaked data (optional migration)

### Immediate Hotfix (if needed)

If a quick fix is needed before full implementation:
- Add `user_id` filter to existing `getTimeEntries()` call
- Pass `user.id` from auth context to `useTimeInsights`
- This prevents the immediate data leakage

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useTimeInsights.ts` | Add Supabase fetch, offline fallback, user filtering |
| `src/lib/timeTrackingDb.ts` | Add `getTimeEntriesByUserId()`, `clearAllTimeEntries()` |
| `src/hooks/useAuth.ts` or `src/App.tsx` | Add cache clearing on auth state change |
| `src/lib/supabaseTimeEntries.ts` | No changes (already correct) |

---

## Success Metrics

- [ ] No time entries visible from other users
- [ ] Insights load correctly when online
- [ ] Insights work offline with cached data
- [ ] User logout clears sensitive data
- [ ] All existing tests pass
- [ ] No performance regression in Insights load time

---

_Generated for bug fix: Time entries data leakage between users_
_Date: 2026-01-11_
