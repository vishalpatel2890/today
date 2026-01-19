# Today - Time Tracking Feature Architecture

## Executive Summary

This architecture document defines the technical decisions for implementing the Time Tracking feature in the Today app. Time Tracking is a hidden power-user feature activated via keyboard shortcuts (`Cmd+Shift+T`) that enables tracking time spent on tasks with minimal friction. The architecture extends the existing app patterns (React, TypeScript, Tailwind, Supabase) while adding IndexedDB for active session persistence and a new Supabase table for cross-device time entry storage.

---

## Decision Summary

| Category | Decision | Version | Affects FRs | Rationale |
|----------|----------|---------|-------------|-----------|
| Timer Persistence | IndexedDB Active Session | Native | FR4-8, FR44-46 | Crash-resistant, single storage mechanism |
| Time Entry Storage | Supabase + IndexedDB cache | Latest | FR9-12, FR44-47 | Cross-device sync, offline support |
| Keyboard Shortcuts | Native useEffect + Custom Hook | Native | FR1, FR13 | Minimal dependencies, full control |
| State Management | Dedicated useTimeTracking hook | Native | FR3-8, FR44 | Matches existing patterns, separation of concerns |
| Timer Updates | Derived from startTime + setInterval | Native | FR4-5, NFR2/4 | No drift, minimal CPU impact |
| Insights Aggregation | Client-side with useMemo | Native | FR13-29, NFR3 | Performant for expected volumes, works offline |

---

## Project Structure

```
today-app/
├── src/
│   ├── components/
│   │   ├── ... (existing components)
│   │   └── time-tracking/
│   │       ├── TimeTrackingModal.tsx    # Main tracking modal (idle/active states)
│   │       ├── TimeInsightsModal.tsx    # Insights view modal
│   │       ├── TimeDisplay.tsx          # Live elapsed time component
│   │       ├── TaskSelector.tsx         # Dropdown for today's tasks
│   │       ├── InsightCard.tsx          # Summary metric card
│   │       ├── InsightRow.tsx           # Time entry list item
│   │       ├── QuickFilterBar.tsx       # Date range quick filters
│   │       ├── FilterDropdown.tsx       # Task/category filter
│   │       └── FilterChip.tsx           # Removable active filter
│   ├── hooks/
│   │   ├── ... (existing hooks)
│   │   ├── useTimeTracking.ts           # Active session management
│   │   ├── useTimeEntries.ts            # CRUD for time entries
│   │   ├── useTimeInsights.ts           # Aggregation calculations
│   │   └── useTimeTrackingHotkeys.ts    # Global keyboard shortcuts
│   ├── lib/
│   │   ├── ... (existing lib)
│   │   └── timeTrackingDb.ts            # IndexedDB operations for active session
│   └── types/
│       ├── ... (existing types)
│       └── timeTracking.ts              # TimeEntry, ActiveSession interfaces
└── ... (rest unchanged)
```

---

## FR Category to Architecture Mapping

| FR Category | Components | Hooks | Storage |
|-------------|------------|-------|---------|
| Time Tracking Core (FR1-8) | TimeTrackingModal, TimeDisplay, TaskSelector | useTimeTracking, useTimeTrackingHotkeys | IndexedDB (active), Supabase (completed) |
| Time Entry Management (FR9-12) | TimeTrackingModal | useTimeEntries | Supabase + sync queue |
| Insights View (FR13-19) | TimeInsightsModal, InsightCard, InsightRow | useTimeInsights | Supabase (read) |
| Insights Filtering (FR20-29) | QuickFilterBar, FilterDropdown, FilterChip | useTimeInsights | Client-side filtering |
| Data & State (FR44-47) | N/A (cross-cutting) | useTimeTracking, useSyncQueue | IndexedDB + Supabase |

---

## Technology Stack Details

### Core Technologies (Inherited from Main App)

- **Framework**: React 18 + TypeScript 5.x
- **Build Tool**: Vite 5.x
- **Styling**: Tailwind CSS 3.x
- **UI Primitives**: Radix UI (Dialog for modals)
- **Date Handling**: date-fns 3.x
- **Icons**: Lucide React

### Time Tracking Specific

- **Active Session Storage**: IndexedDB (browser-native)
- **Completed Entries Storage**: Supabase PostgreSQL
- **Sync Mechanism**: Existing sync queue pattern

### Integration Points

| Component A | Component B | Integration |
|-------------|-------------|-------------|
| App.tsx | useTimeTrackingHotkeys | Registers global hotkeys at app root |
| TimeTrackingModal | useTasks | Gets today's tasks for dropdown |
| TimeTrackingModal | useTimeTracking | Start/stop tracking operations |
| useTimeTracking | timeTrackingDb | Persists active session to IndexedDB |
| useTimeEntries | syncQueue | Queues completed entries for Supabase sync |
| TimeInsightsModal | useTimeInsights | Gets aggregated data with filters |

---

## Data Architecture

### TypeScript Interfaces

```typescript
// src/types/timeTracking.ts

export interface TimeEntry {
  id: string;              // UUID (crypto.randomUUID())
  user_id: string;         // References auth.users
  task_id: string | null;  // References tasks (null if task deleted)
  task_name: string;       // Snapshot of task name at creation
  start_time: string;      // ISO 8601 timestamp
  end_time: string;        // ISO 8601 timestamp
  duration: number;        // Milliseconds
  date: string;            // YYYY-MM-DD for grouping/filtering
  created_at: string;      // ISO 8601 timestamp
  updated_at: string;      // ISO 8601 timestamp
}

export interface ActiveSession {
  taskId: string;
  taskName: string;
  startTime: string;       // ISO 8601 timestamp
}

export interface InsightFilters {
  dateRange: {
    start: string;         // YYYY-MM-DD
    end: string;           // YYYY-MM-DD
  };
  taskId?: string;
  category?: string;
}

export interface TimeInsights {
  totalToday: number;      // Milliseconds
  totalWeek: number;       // Milliseconds
  avgPerDay: number;       // Milliseconds
  byTask: Array<{ taskId: string; taskName: string; duration: number }>;
  byDate: Array<{ date: string; duration: number }>;
  recentEntries: TimeEntry[];
}
```

### Supabase Schema

```sql
-- Migration: create_time_entries_table

CREATE TABLE time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  task_name TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  duration INTEGER NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for filtering
CREATE INDEX idx_time_entries_user_date ON time_entries(user_id, date);
CREATE INDEX idx_time_entries_user_task ON time_entries(user_id, task_id);

-- RLS policies
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own time entries"
  ON time_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own time entries"
  ON time_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own time entries"
  ON time_entries FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own time entries"
  ON time_entries FOR DELETE
  USING (auth.uid() = user_id);
```

### IndexedDB Schema

```typescript
// Active session store (singleton)
// Store name: 'activeSession'
// Key: 'current' (fixed)
// Value: ActiveSession | null
```

---

## Implementation Patterns

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `TimeTrackingModal.tsx` |
| Hooks | camelCase with `use` prefix | `useTimeTracking.ts` |
| Types/Interfaces | PascalCase | `interface TimeEntry` |
| Supabase columns | snake_case | `start_time`, `task_id` |
| IndexedDB stores | camelCase | `activeSession` |
| Constants | SCREAMING_SNAKE_CASE | `DOUBLE_TAP_THRESHOLD` |

### Component Patterns

All time tracking components MUST:
- Be functional components with TypeScript
- Use arrow function syntax
- Export as named export (not default)
- Destructure props in function signature
- Use Tailwind for styling
- Follow existing Radix patterns for modals

```typescript
// CORRECT
export const TimeTrackingModal = ({ isOpen, onClose }: TimeTrackingModalProps) => {
  return <Dialog open={isOpen} onOpenChange={onClose}>...</Dialog>;
};

// INCORRECT
export default function TimeTrackingModal(props) { ... }
```

### Hook Patterns

```typescript
// useTimeTracking.ts - Core pattern
export function useTimeTracking() {
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load active session from IndexedDB on mount
  useEffect(() => {
    loadActiveSession().then(session => {
      setActiveSession(session);
      setIsLoading(false);
    });
  }, []);

  const startTracking = async (taskId: string, taskName: string) => {
    const session: ActiveSession = {
      taskId,
      taskName,
      startTime: new Date().toISOString()
    };
    await saveActiveSession(session);
    setActiveSession(session);
  };

  const stopTracking = async (): Promise<TimeEntry | null> => {
    if (!activeSession) return null;

    const entry = createTimeEntry(activeSession);
    await saveTimeEntry(entry);  // To Supabase via sync queue
    await clearActiveSession();
    setActiveSession(null);
    return entry;
  };

  return {
    activeSession,
    isTracking: !!activeSession,
    isLoading,
    startTracking,
    stopTracking,
  };
}
```

### Keyboard Shortcut Pattern

```typescript
// useTimeTrackingHotkeys.ts
export function useTimeTrackingHotkeys(
  onOpenTracking: () => void,
  onOpenInsights: () => void
) {
  const lastTriggerRef = useRef<number>(0);
  const DOUBLE_TAP_THRESHOLD = 300; // ms

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+Shift+T (Mac) or Ctrl+Shift+T (Windows)
      const isTrigger = (e.metaKey || e.ctrlKey) && e.shiftKey &&
                        e.key.toLowerCase() === 't';

      if (!isTrigger) return;

      e.preventDefault();

      const now = Date.now();
      const timeSinceLastTrigger = now - lastTriggerRef.current;

      if (timeSinceLastTrigger < DOUBLE_TAP_THRESHOLD) {
        // Double-tap: open insights
        onOpenInsights();
        lastTriggerRef.current = 0;
      } else {
        // Single tap: delayed to detect double-tap
        lastTriggerRef.current = now;
        setTimeout(() => {
          if (lastTriggerRef.current === now) {
            onOpenTracking();
          }
        }, DOUBLE_TAP_THRESHOLD);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onOpenTracking, onOpenInsights]);
}
```

### Timer Display Pattern

```typescript
// TimeDisplay.tsx
export const TimeDisplay = ({ startTime }: { startTime: string }) => {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => forceUpdate(n => n + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const elapsed = Date.now() - new Date(startTime).getTime();

  return (
    <span className="font-semibold text-3xl tabular-nums">
      {formatDuration(elapsed)}
    </span>
  );
};

// Duration formatting
function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');

  if (hours > 0) {
    return `${hours}:${pad(minutes)}:${pad(secs)}`;
  }
  return `${minutes}:${pad(secs)}`;
}

// For summaries (different format)
function formatDurationSummary(ms: number): string {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}
```

---

## Consistency Rules

### Date/Time Handling

All dates and times MUST:
- Be stored as ISO 8601 strings in Supabase
- Use `date-fns` for parsing and formatting
- Store duration as milliseconds (integer)
- Use `YYYY-MM-DD` string for date grouping keys

```typescript
import { parseISO, format, startOfDay, endOfDay } from 'date-fns';

// Creating a time entry
const entry: TimeEntry = {
  start_time: new Date().toISOString(),
  end_time: new Date().toISOString(),
  duration: endTime - startTime, // milliseconds
  date: format(new Date(), 'yyyy-MM-dd'),
};
```

### Error Handling

```typescript
// Pattern for time tracking operations
try {
  await stopTracking();
  addToast('Time saved', { type: 'success' });
} catch (error) {
  console.error('[Today] TimeTracking:', error);
  addToast('Failed to save time entry', { type: 'error' });
}
```

### Logging

```typescript
// Development logging pattern
if (import.meta.env.DEV) {
  console.log('[Today] TimeTracking:', action, data);
}
```

### Empty States

| Context | Message |
|---------|---------|
| No tasks today | "No tasks for today. Add a task first." |
| No time tracked today | "No time tracked today. Press Cmd+Shift+T to start." |
| No time tracked ever | "Start tracking time to see insights here." |
| No results for filter | "No time entries match your filters." |

---

## Security Architecture

### Row Level Security

Time entries follow the same RLS pattern as tasks:
- Users can only read/write their own time entries
- `user_id` column links to `auth.users(id)`
- Anonymous users have their own `user_id` from anonymous auth

### Data Privacy

- Time data stays with user account (anonymous or linked)
- No time data shared between users
- Exported reports contain only user's own data

---

## Performance Considerations

| NFR | Implementation | Target |
|-----|----------------|--------|
| NFR1: Modal open time | Lightweight modal, no network fetch on open | < 100ms |
| NFR2: Timer updates | setInterval + derived calculation | No jank |
| NFR3: Insights calculation | Client-side aggregation with useMemo | < 500ms for 1 year |
| NFR4: Battery impact | Timer only runs when modal open | Negligible |
| NFR7: Persist through background | IndexedDB save on start | Immediate |
| NFR8: No data loss | IndexedDB checkpoint on start | Zero loss |
| NFR9: Timer accuracy | Derived from startTime | ±1 second |

---

## Development Environment

### Prerequisites

Same as main app:
- Node.js 18+ (LTS)
- npm 9+
- Modern browser

### New Dependencies

None required - uses existing dependencies.

### Setup for Time Tracking Development

```bash
# No additional setup needed
# Time tracking uses existing app infrastructure

# Run the app
npm run dev

# Test keyboard shortcuts
# Cmd+Shift+T - Open tracking modal
# Cmd+Shift+T T (double-tap) - Open insights modal
```

---

## Architecture Decision Records (ADRs)

### ADR-TT-001: IndexedDB for Active Session

**Context:** Active tracking session needs to survive page refresh and unexpected termination.

**Decision:** Store active session in IndexedDB immediately on tracking start.

**Rationale:**
- Consistent with app's existing IndexedDB usage
- Crash-resistant - session persisted before modal closes
- Single storage mechanism (not split with localStorage)
- Meets NFR7 and NFR8

**Consequences:**
- Requires async read on app load to restore active session
- Small complexity increase vs in-memory only

---

### ADR-TT-002: Supabase for Completed Time Entries

**Context:** User requested cross-device access for time entries.

**Decision:** Store completed time entries in Supabase with IndexedDB cache for offline.

**Rationale:**
- Enables cross-device sync (FR45)
- Leverages existing sync queue pattern
- RLS provides security
- IndexedDB cache enables offline access (FR46)

**Consequences:**
- Requires Supabase migration for new table
- Sync queue integration needed

---

### ADR-TT-003: Native Keyboard Shortcut Hook

**Context:** Need global hotkeys with double-tap detection.

**Decision:** Custom hook using native `document.addEventListener('keydown')` with timing logic.

**Rationale:**
- No additional dependencies (keeps bundle small)
- Full control over double-tap threshold (300ms)
- Simple cleanup with useEffect
- Fallback to Cmd+Shift+I available if needed

**Consequences:**
- Manual implementation of timing logic
- Need to handle both Mac (Cmd) and Windows (Ctrl)

---

### ADR-TT-004: Client-Side Insights Aggregation

**Context:** Need to compute time summaries with filtering for insights view.

**Decision:** Fetch entries once, aggregate in JavaScript with useMemo.

**Rationale:**
- Expected data volume is small (< 1000 entries/year)
- Client-side enables offline access
- useMemo prevents unnecessary recalculation
- Simpler than SQL aggregation queries

**Consequences:**
- All entries fetched to client (acceptable for expected volumes)
- May need optimization if usage exceeds expectations

---

### ADR-TT-005: Derived Timer Display

**Context:** Need to update elapsed time display every second without drift.

**Decision:** Calculate elapsed time as `Date.now() - startTime` on each render, triggered by setInterval.

**Rationale:**
- Always accurate - no accumulated drift
- setInterval only runs when modal open (battery friendly)
- Simple implementation
- Meets NFR2, NFR4, NFR9

**Consequences:**
- Minor re-render every second when modal open
- Negligible performance impact

---

_Generated by BMAD Decision Architecture Workflow v1.0_
_Date: 2026-01-10_
_For: Vishal_
