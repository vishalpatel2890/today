# Today - Time Tracking Feature Epic Breakdown

**Author:** Vishal
**Date:** 2026-01-10
**Project Level:** Feature Addition to Existing PWA
**Target Scale:** Power-user feature

---

## Overview

This document provides the complete epic and story breakdown for the Time Tracking feature in the Today app. It decomposes requirements from the [Time Tracking PRD](./PRD-time-tracking.md) into implementable stories, incorporating interaction patterns from [UX Design](./ux-design-time-tracking.md) and technical decisions from [Architecture](./architecture-time-tracking.md).

**Living Document Notice:** This version incorporates all available context (PRD + UX + Architecture).

**Context Incorporated:**
- PRD requirements (47 FRs, 12 NFRs)
- UX interaction patterns and mockup references
- Architecture technical decisions and API contracts

---

## Functional Requirements Inventory

### Time Tracking Core (FR1-FR8) - MVP
| FR | Description |
|----|-------------|
| FR1 | Users can open the tracking modal via `Cmd+Shift+T` keyboard shortcut |
| FR2 | Users can see a dropdown list of today's tasks in the tracking modal |
| FR3 | Users can select a task from the dropdown and start tracking time |
| FR4 | System tracks elapsed time in the background after modal closes |
| FR5 | Users can reopen the tracking modal to see current tracking status and elapsed time |
| FR6 | Users can stop active time tracking via the modal |
| FR7 | System saves completed time entries with task association, start time, end time, and duration |
| FR8 | Tracking modal resets to idle state after stopping a session |

### Time Entry Management (FR9-FR12) - MVP
| FR | Description |
|----|-------------|
| FR9 | System persists all time entries locally using IndexedDB |
| FR10 | Time entries maintain referential integrity with associated tasks |
| FR11 | System handles edge case of tracked task being deleted (preserve time entry with task name snapshot) |
| FR12 | Users can track time for the same task multiple times (creates separate entries) |

### Insights View (FR13-FR19) - MVP
| FR | Description |
|----|-------------|
| FR13 | Users can open the insights view via `Cmd+Shift+T T` keyboard shortcut |
| FR14 | Users can view total time tracked today |
| FR15 | Users can view time breakdown by individual tasks for today |
| FR16 | Users can view total time tracked for the current week |
| FR17 | Users can view daily totals for the current week |
| FR18 | Users can view a chronological list of recent time entries |
| FR19 | Users can close insights modal and return to main app |

### Insights Filtering (FR20-FR29) - MVP
| FR | Description |
|----|-------------|
| FR20 | Users can filter insights by quick date presets (Today, Yesterday, This Week, This Month) |
| FR21 | Users can select a custom date range for filtering insights |
| FR22 | Users can filter insights to show only specific tasks via dropdown |
| FR23 | Users can filter insights by task category via dropdown |
| FR24 | System displays active filters as removable chips below filter controls |
| FR25 | Users can remove individual filters by clicking the × on filter chips |
| FR26 | All summary metrics (totals, averages) recalculate based on active filters |
| FR27 | Task breakdown list updates to show only filtered results |
| FR28 | Recent entries list updates to show only filtered results |
| FR29 | Filter state persists within the modal session (resets on close) |

### Data & State (FR44-FR47) - MVP
| FR | Description |
|----|-------------|
| FR44 | Time tracking state persists across browser refresh (active timer continues) |
| FR45 | System syncs time entries via existing sync mechanism (if sync is enabled) |
| FR46 | Users can access time tracking functionality offline |
| FR47 | Time entry data participates in app's export/backup functionality |

### Productivity Insights (FR30-FR34) - Growth
| FR | Description |
|----|-------------|
| FR30 | Users can view time aggregated by task category/tag |
| FR31 | Users can view weekly and monthly trend visualizations |
| FR32 | Users can identify their peak productivity hours based on tracking patterns |
| FR33 | Users can see correlation between time tracked and task completion rates |
| FR34 | System calculates and displays average time per task category |

### Freelancer Features (FR35-FR40) - Growth
| FR | Description |
|----|-------------|
| FR35 | Users can mark individual time entries as billable or non-billable |
| FR36 | Users can set an hourly rate for billable calculations |
| FR37 | Users can export time data as CSV for a selected date range |
| FR38 | Users can export a formatted time report as PDF |
| FR39 | Users can tag time entries with client/project identifiers |
| FR40 | Users can filter insights by client/project |

### Tracking Enhancements (FR41-FR43) - Growth
| FR | Description |
|----|-------------|
| FR41 | Users can manually edit time entry start and end times |
| FR42 | Users can delete erroneous time entries |
| FR43 | Users can add notes/descriptions to time entries |

---

## Epic Summary

| Epic | Title | User Value | FRs Covered |
|------|-------|------------|-------------|
| 1 | Time Tracking Foundation | User can start/stop tracking time on tasks via keyboard shortcut | FR1-FR12, FR44, FR46 |
| 2 | Time Insights Dashboard | User can view where their time went (today, this week, recent entries) | FR13-FR19 |
| 3 | Insights Filtering | User can drill down into specific time periods, tasks, or categories | FR20-FR29 |
| 4 | Cross-Device Sync | User's time data syncs across devices and participates in backup | FR45, FR47 |

---

## FR Coverage Map

| FR | Epic | Story |
|----|------|-------|
| FR1 | Epic 1 | 1.1 |
| FR2 | Epic 1 | 1.2 |
| FR3 | Epic 1 | 1.2 |
| FR4 | Epic 1 | 1.3 |
| FR5 | Epic 1 | 1.4 |
| FR6 | Epic 1 | 1.4 |
| FR7 | Epic 1 | 1.4 |
| FR8 | Epic 1 | 1.4 |
| FR9 | Epic 1 | 1.3, 1.4 |
| FR10 | Epic 1 | 1.2 |
| FR11 | Epic 1 | 1.4 |
| FR12 | Epic 1 | 1.4 |
| FR44 | Epic 1 | 1.3 |
| FR46 | Epic 1 | 1.3 |
| FR13 | Epic 2 | 2.1 |
| FR14 | Epic 2 | 2.2 |
| FR15 | Epic 2 | 2.2 |
| FR16 | Epic 2 | 2.2 |
| FR17 | Epic 2 | 2.2 |
| FR18 | Epic 2 | 2.3 |
| FR19 | Epic 2 | 2.1 |
| FR20 | Epic 3 | 3.1 |
| FR21 | Epic 3 | 3.2 |
| FR22 | Epic 3 | 3.3 |
| FR23 | Epic 3 | 3.3 |
| FR24 | Epic 3 | 3.4 |
| FR25 | Epic 3 | 3.4 |
| FR26 | Epic 3 | 3.1-3.4 |
| FR27 | Epic 3 | 3.1-3.4 |
| FR28 | Epic 3 | 3.1-3.4 |
| FR29 | Epic 3 | 3.1-3.4 |
| FR45 | Epic 4 | 4.1 |
| FR47 | Epic 4 | 4.2 |

---

## Epic 1: Time Tracking Foundation

**Goal:** Enable users to start and stop tracking time on tasks via keyboard shortcut, with the timer persisting across browser refresh.

**User Value:** After this epic, users can press `Cmd+Shift+T`, select a task, start tracking, and stop tracking—seeing their time entry saved. The core time tracking experience is complete.

**FRs Covered:** FR1-FR12, FR44, FR46

---

### Story 1.1: Global Keyboard Shortcut Registration

As a power user,
I want to press `Cmd+Shift+T` from anywhere in the app,
So that I can quickly access time tracking without navigating menus.

**Acceptance Criteria:**

**Given** I am anywhere in the Today app (any view, any modal open or closed)
**When** I press `Cmd+Shift+T` (Mac) or `Ctrl+Shift+T` (Windows)
**Then** the Time Tracking modal opens

**And** if the modal is already open, pressing the shortcut closes it
**And** the shortcut is prevented from triggering browser default behavior (e.g., reopen closed tab)
**And** the shortcut works regardless of focus state (except when in text input fields)

**Prerequisites:** None (first story)

**Technical Notes:**
- Create `useTimeTrackingHotkeys.ts` hook per Architecture spec
- Register listener at App.tsx level using `document.addEventListener('keydown')`
- Check for `e.metaKey` (Mac) or `e.ctrlKey` (Windows) + `e.shiftKey` + `e.key === 't'`
- Call `e.preventDefault()` to block browser's reopen-tab behavior
- Implement double-tap detection (300ms threshold) for insights modal (FR13) - store `lastTriggerRef`
- Export `onOpenTracking` and `onOpenInsights` callbacks

**Frontend Test Hint:** Press `Cmd+Shift+T` → modal appears. Press again → modal closes. Press while in a different view → still works.

---

### Story 1.2: Task Selection Dropdown in Tracking Modal

As a power user,
I want to see my today's tasks in a dropdown when I open the tracking modal,
So that I can quickly select which task to track time for.

**Acceptance Criteria:**

**Given** I open the Time Tracking modal (idle state)
**When** the modal appears
**Then** I see a dropdown labeled "Select a task..." that auto-focuses

**Given** I click the dropdown or press Enter
**When** the dropdown opens
**Then** I see a list of all tasks scheduled for today (from existing task data)
**And** tasks are displayed with their title text
**And** I can navigate with arrow keys and select with Enter
**And** I can type to filter/search tasks

**Given** there are no tasks for today
**When** I open the tracking modal
**Then** I see the message "No tasks for today. Add a task first."
**And** the Track button is disabled

**And** the dropdown uses existing Radix Select/Combobox patterns
**And** the modal matches the "Compact Command Palette" design (320px width, centered)

**Prerequisites:** Story 1.1 (modal must be openable)

**Technical Notes:**
- Create `TaskSelector.tsx` component using Radix Combobox
- Use existing `useTasks` hook to get today's tasks
- Filter tasks by `date === today` (use date-fns `format(new Date(), 'yyyy-MM-dd')`)
- Implement type-ahead filtering
- Accessibility: `role="combobox"`, `aria-expanded`, `aria-activedescendant`
- Store `task_name` snapshot when selected (for FR11 - deleted task handling)

**Frontend Test Hint:** Open modal → see dropdown with today's tasks → click to expand → arrow keys work → type to filter → select a task → dropdown shows selected task name.

---

### Story 1.3: Start Tracking and Background Timer

As a power user,
I want to click "Track" after selecting a task,
So that time tracking starts in the background while I work.

**Acceptance Criteria:**

**Given** I have selected a task from the dropdown
**When** I click the "Track" button or press Enter
**Then** the modal closes
**And** time tracking starts in the background (timer running)
**And** the active session is immediately persisted to IndexedDB

**Given** tracking is active and I refresh the browser
**When** the page reloads
**Then** the active tracking session is restored from IndexedDB
**And** elapsed time is calculated correctly from the original start time

**Given** tracking is active and I close the browser/tab
**When** I reopen the app later
**Then** the active session is still there (if within same browser session)

**And** the Track button uses primary button styling (slate-600 bg)
**And** no visible timer or indicator in main UI (hidden feature philosophy)

**Prerequisites:** Story 1.2 (must be able to select a task)

**Technical Notes:**
- Create `useTimeTracking.ts` hook with `startTracking(taskId, taskName)` function
- Create `timeTrackingDb.ts` for IndexedDB operations:
  - Store name: `activeSession`, Key: `current`
  - Value: `{ taskId, taskName, startTime: ISO string }`
- On app mount, check IndexedDB for active session and restore to state
- Use `crypto.randomUUID()` for entry IDs
- Elapsed time is DERIVED: `Date.now() - new Date(startTime).getTime()` (no drift per ADR-TT-005)
- IndexedDB provides offline support (FR46)

**Frontend Test Hint:** Select task → click Track → modal closes → refresh browser → reopen modal with `Cmd+Shift+T` → see active tracking state with elapsed time continuing.

---

### Story 1.4: View Active Tracking and Stop Session

As a power user,
I want to reopen the tracking modal while tracking to see elapsed time and stop,
So that I can end my tracking session and save the time entry.

**Acceptance Criteria:**

**Given** time tracking is active
**When** I press `Cmd+Shift+T` to open the modal
**Then** I see the "Active State" view instead of idle state
**And** I see "Currently tracking:" label with the task name
**And** I see a live elapsed time display (updates every second) in format `HH:MM:SS` (or `MM:SS` if under 1 hour)
**And** I see a "Stop" button (muted stone color per UX spec)

**Given** I am viewing active tracking state
**When** I click "Stop" or press Enter
**Then** the timer stops
**And** a time entry is created with: task_id, task_name, start_time, end_time, duration, date
**And** the entry is saved to IndexedDB (local storage)
**And** I see brief success feedback: "✓ Saved: Xh Ym on [task name]" (1.5s, muted styling)
**And** the modal resets to idle state after feedback

**Given** the task I was tracking has been deleted
**When** I stop tracking
**Then** the time entry is still saved with the original task_name snapshot
**And** task_id is set to null (referential integrity per FR11)

**Given** I tracked the same task earlier today
**When** I track it again and stop
**Then** a new separate time entry is created (FR12)

**Prerequisites:** Story 1.3 (must be able to start tracking)

**Technical Notes:**
- Create `TimeDisplay.tsx` component with live update per Architecture spec
- Use `setInterval` (1 second) + derived calculation from `startTime`
- Add `aria-live="polite"` for screen reader updates
- Create `TimeEntry` interface per Architecture types
- `stopTracking()` function in hook:
  1. Calculate `end_time = new Date().toISOString()`
  2. Calculate `duration = endTime - startTime` (milliseconds)
  3. Create entry object with `date: format(new Date(), 'yyyy-MM-dd')`
  4. Save to IndexedDB time entries store
  5. Clear active session from IndexedDB
  6. Update React state
- Success feedback: slate gray check icon on light gray bg (per UX calmer semantic colors)
- `formatDuration(ms)` and `formatDurationSummary(ms)` utility functions per Architecture

**Frontend Test Hint:** Start tracking → wait 30 seconds → reopen modal → see "0:30" elapsed → click Stop → see success message → modal resets to idle → start tracking same task again → stop → two separate entries exist.

---

## Epic 2: Time Insights Dashboard

**Goal:** Enable users to view their time tracking data with summaries and breakdowns.

**User Value:** After this epic, users can press `Cmd+Shift+T T` to see where their time went—total time today, this week, breakdown by task, and recent entries. Users gain visibility into their time usage patterns.

**FRs Covered:** FR13-FR19

---

### Story 2.1: Insights Modal with Double-Tap Hotkey

As a power user,
I want to double-tap `Cmd+Shift+T T` to open a dedicated insights view,
So that I can quickly see my time tracking data without interfering with the tracking modal.

**Acceptance Criteria:**

**Given** I am anywhere in the Today app
**When** I press `Cmd+Shift+T` and then press `T` again within 300ms (while still holding Cmd+Shift)
**Then** the Insights modal opens instead of the Tracking modal

**Given** the Insights modal is open
**When** I press Escape or click the X button or click outside the modal
**Then** the modal closes and I return to the main app

**Given** the Insights modal is open
**When** I press `Cmd+Shift+T T` again
**Then** the modal closes (toggle behavior)

**And** the Insights modal uses the larger size (420px width per UX spec)
**And** the modal has title "Time Insights" with close button
**And** the modal is scrollable if content exceeds 80vh

**Prerequisites:** Story 1.1 (hotkey infrastructure with double-tap detection)

**Technical Notes:**
- Extend `useTimeTrackingHotkeys.ts` to detect double-tap pattern
- Use `lastTriggerRef` with 300ms threshold per Architecture spec
- If double-tap unreliable in testing, fallback to `Cmd+Shift+I`
- Create `TimeInsightsModal.tsx` component using Radix Dialog
- Modal structure per UX spec section 2.3
- Implement focus trap and keyboard navigation (Tab through sections)

**Frontend Test Hint:** Press `Cmd+Shift+T` once → tracking modal opens. Press `Cmd+Shift+T T` (quick double) → insights modal opens instead. Press Escape → closes.

---

### Story 2.2: Time Summary Cards (Today and Week)

As a power user,
I want to see my total time tracked today and this week at a glance,
So that I can quickly understand my productivity level.

**Acceptance Criteria:**

**Given** I open the Insights modal
**When** the modal displays
**Then** I see two summary cards at the top:
  - "TODAY" card showing total time tracked today (format: "Xh Ym")
  - "AVG / DAY" card showing average daily time this week (format: "Xh Ym")

**Given** I have tracked 3h 42m today
**When** I view the TODAY card
**Then** it displays "3h 42m" with "tracked" label below

**Given** I have no time tracked today
**When** I view the TODAY card
**Then** it displays "0h 0m" with "tracked" label

**Given** I have tracked time on 3 days this week totaling 12h 36m
**When** I view the AVG / DAY card
**Then** it displays "4h 12m" (12h 36m ÷ 3 days) with "this week" label

**And** I see a "BREAKDOWN" section below the cards showing time per task
**And** each task row shows: task name (left) + duration (right, format "Xh Ym")
**And** tasks are sorted by duration descending (most time first)
**And** the section header shows task count: "BREAKDOWN (X tasks)"

**Prerequisites:** Story 1.4 (time entries must exist to display)

**Technical Notes:**
- Create `useTimeInsights.ts` hook for aggregation calculations
- Create `InsightCard.tsx` component per UX spec
- Use `useMemo` for calculations to prevent unnecessary recalculation
- Filter entries by date for "today": `entry.date === format(new Date(), 'yyyy-MM-dd')`
- Filter entries for "this week": use date-fns `startOfWeek` and `endOfWeek`
- Calculate average: total week duration ÷ distinct days with entries
- `formatDurationSummary(ms)` for display (e.g., "3h 42m")
- Empty state: "No time tracked today. Press Cmd+Shift+T to start."

**Frontend Test Hint:** Track some time on 2-3 tasks → open insights → see TODAY total matches sum of entries → see breakdown sorted by duration → see AVG / DAY calculated correctly.

---

### Story 2.3: Recent Time Entries List

As a power user,
I want to see a chronological list of my recent time entries,
So that I can review my tracking history and verify accuracy.

**Acceptance Criteria:**

**Given** I open the Insights modal
**When** I scroll to the "RECENT ENTRIES" section
**Then** I see a list of my time entries in reverse chronological order (newest first)

**Given** I have time entries from today and yesterday
**When** I view the Recent Entries list
**Then** each entry shows:
  - Relative timestamp (e.g., "Today 2:30pm", "Yesterday 11:00am", "Mon 9:15am")
  - Task name (truncated with ellipsis if too long)
  - Duration (format: "Xh Ym" or "Xm" if under 1 hour)

**Given** I have more than 10 recent entries
**When** I view the Recent Entries list
**Then** I see the 20 most recent entries (reasonable limit for MVP)
**And** the list is scrollable within the modal

**Given** I have no time entries
**When** I view the Recent Entries section
**Then** I see "Start tracking time to see insights here."

**And** the section header shows entry count: "RECENT ENTRIES (X entries)"
**And** entries have subtle hover state (light background highlight)

**Prerequisites:** Story 2.2 (modal and summary cards must exist)

**Technical Notes:**
- Create `InsightRow.tsx` component per UX spec
- Use date-fns for relative timestamp formatting:
  - `isToday(date)` → "Today X:XXpm"
  - `isYesterday(date)` → "Yesterday X:XXam"
  - Otherwise → "Mon X:XXpm" (day abbreviation)
- Limit to 20 entries for performance (can increase later)
- Task name truncation: CSS `text-overflow: ellipsis` with max-width
- Duration format: "Xh Ym" or just "Xm" if hours = 0
- Query IndexedDB time entries, sort by `start_time` descending

**Frontend Test Hint:** Track time on several tasks over 2 days → open insights → scroll to Recent Entries → verify chronological order → verify timestamps show relative dates → verify long task names truncate.

---

## Epic 3: Insights Filtering

**Goal:** Enable users to filter insights by date range, task, and category to drill down into specific time periods and analyze patterns.

**User Value:** After this epic, users can answer specific questions like "How much time did I spend on client work this week?" or "What was my time breakdown last month?" Filtering enables targeted analysis.

**FRs Covered:** FR20-FR29

---

### Story 3.1: Quick Date Filter Bar

As a power user,
I want to quickly filter insights by preset date ranges,
So that I can see my time data for specific periods without manual date entry.

**Acceptance Criteria:**

**Given** I open the Insights modal
**When** the modal displays
**Then** I see a row of quick filter pills at the top: "Today", "Yesterday", "This Week", "This Month", "Custom"

**Given** I am viewing insights with no filter active
**When** I click "This Week" pill
**Then** the pill becomes highlighted (filled primary background)
**And** all summary metrics recalculate to show only this week's data (FR26)
**And** the breakdown list shows only this week's tasks (FR27)
**And** the recent entries list shows only this week's entries (FR28)

**Given** I have "This Week" filter active
**When** I click "Today" pill
**Then** "Today" becomes active and "This Week" deactivates
**And** all data updates to show only today's entries

**Given** I have "Today" filter active
**When** I click "Today" again
**Then** the filter is removed (returns to default view showing all recent data)

**And** "Today" filter shows entries where `date === today`
**And** "Yesterday" filter shows entries where `date === yesterday`
**And** "This Week" filter shows entries from start of week to today
**And** "This Month" filter shows entries from start of month to today
**And** filter state persists within modal session but resets on close (FR29)

**Prerequisites:** Story 2.3 (insights modal with data sections must exist)

**Technical Notes:**
- Create `QuickFilterBar.tsx` component per UX spec
- Pill buttons: default = gray outline/muted text, active = filled primary bg/white text
- Use date-fns: `startOfDay`, `startOfWeek`, `startOfMonth` for range calculations
- Update `useTimeInsights.ts` to accept filter parameters
- Store filter state in modal component (local state, resets on unmount per FR29)
- Recalculate all aggregations when filter changes using `useMemo` dependencies

**Frontend Test Hint:** Open insights → click "This Week" → metrics change → click "Yesterday" → metrics change again → click "Yesterday" again → filter clears → close and reopen modal → filter is reset.

---

### Story 3.2: Custom Date Range Picker

As a power user,
I want to select a custom date range for filtering,
So that I can analyze time data for specific periods not covered by presets.

**Acceptance Criteria:**

**Given** I am viewing the Insights modal
**When** I click the "Custom" pill in the quick filter bar
**Then** a date range picker appears (inline or in a popover)
**And** I can select a start date and end date

**Given** I have selected a custom date range (e.g., Dec 1 - Dec 15)
**When** I confirm the selection
**Then** the "Custom" pill shows the date range (e.g., "Dec 1 - Dec 15")
**And** all insights data filters to show only entries within that range
**And** summary metrics, breakdown, and recent entries all update (FR26-28)

**Given** I have a custom range active
**When** I click a preset pill (e.g., "This Week")
**Then** the custom range is replaced by the preset filter

**And** date picker allows selecting past dates only (no future dates)
**And** start date cannot be after end date
**And** date picker is keyboard accessible

**Prerequisites:** Story 3.1 (quick filter bar must exist)

**Technical Notes:**
- Add date picker UI to `QuickFilterBar.tsx` or create `DateRangePicker.tsx`
- Use existing date picker pattern if available, or Radix Popover + custom calendar
- Store custom range as `{ start: 'YYYY-MM-DD', end: 'YYYY-MM-DD' }`
- Format display: "MMM d - MMM d" using date-fns `format`
- Validate: start <= end, end <= today
- Pass date range to `useTimeInsights.ts` filter

**Frontend Test Hint:** Open insights → click "Custom" → select Dec 1 start → select Dec 15 end → confirm → see pill show "Dec 1 - Dec 15" → verify data shows only that range → click "Today" → custom range replaced.

---

### Story 3.3: Task and Category Filter Dropdowns

As a power user,
I want to filter insights by specific tasks or categories,
So that I can analyze time spent on particular work areas.

**Acceptance Criteria:**

**Given** I am viewing the Insights modal
**When** I look below the quick filter bar
**Then** I see two filter dropdowns: "Tasks" and "Category"

**Given** I click the "Tasks" dropdown
**When** the dropdown opens
**Then** I see "All tasks" option (default) plus a list of all tasks that have time entries
**And** I can select a specific task to filter by

**Given** I select a specific task from the dropdown
**When** the selection is applied
**Then** all insights data filters to show only entries for that task (FR22)
**And** the dropdown shows the selected task name
**And** summary metrics show only time for that task (FR26)
**And** breakdown shows only that task (single item) (FR27)
**And** recent entries show only entries for that task (FR28)

**Given** I click the "Category" dropdown
**When** the dropdown opens
**Then** I see "All" option (default) plus categories from tasks that have time entries
**And** I can select a category to filter by (FR23)

**Given** I select a category (e.g., "Client Work")
**When** the selection is applied
**Then** insights filter to show only entries for tasks in that category

**Given** I have both a task filter and a date filter active
**When** I view insights
**Then** both filters are applied together (AND logic)

**Prerequisites:** Story 3.1 (filter infrastructure must exist)

**Technical Notes:**
- Create `FilterDropdown.tsx` component per UX spec
- Query distinct tasks from time entries (not all tasks, only ones with entries)
- Query categories from tasks that have time entries
- Use existing task data to get category for each task
- Combine filters in `useTimeInsights.ts`: date range AND task AND category
- Store filter state: `{ dateRange, taskId, category }`

**Frontend Test Hint:** Open insights → select task from dropdown → see data filter to that task only → select category → see data filter to that category → select both task and date range → both applied together.

---

### Story 3.4: Active Filter Chips with Remove

As a power user,
I want to see my active filters as removable chips,
So that I can easily understand what filters are applied and remove them individually.

**Acceptance Criteria:**

**Given** I have one or more filters active (date, task, or category)
**When** I view the Insights modal
**Then** I see active filters displayed as chips below the filter controls
**And** each chip shows the filter value (e.g., "This Week", "Client Work", "Review proposal")

**Given** I see an active filter chip
**When** I click the × button on the chip
**Then** that specific filter is removed (FR25)
**And** the chip disappears
**And** insights data updates to reflect remaining filters (FR26-28)

**Given** I have multiple filters active (e.g., "This Week" + "Client Work")
**When** I remove one filter chip
**Then** only that filter is removed, other filters remain active

**Given** I have the "Custom" date range active (Dec 1 - Dec 15)
**When** I view the filter chips
**Then** I see a chip showing "Dec 1 - Dec 15" with × button

**And** chips use primary background with white text per UX spec
**And** chips appear in a horizontal row that wraps if needed
**And** removing all filters returns to unfiltered state

**Prerequisites:** Story 3.3 (all filter types must exist)

**Technical Notes:**
- Create `FilterChip.tsx` component per UX spec
- Render chips based on active filter state
- Map filter values to display strings:
  - Date presets: "Today", "Yesterday", "This Week", "This Month"
  - Custom date: "Dec 1 - Dec 15" format
  - Task: task name
  - Category: category name
- onClick × removes that filter from state
- Chips container: `flex flex-wrap gap-2`

**Frontend Test Hint:** Apply "This Week" filter → see chip appear → apply category filter → see second chip → click × on first chip → only "This Week" removed → click × on second chip → no filters, full data shown.

---

## Epic 4: Cross-Device Sync

**Goal:** Enable time entries to sync across devices via Supabase and participate in the app's backup/export functionality.

**User Value:** After this epic, users can track time on their laptop and see their entries on their phone. Time data is backed up to the cloud and included in exports. No data loss if they switch devices.

**FRs Covered:** FR45, FR47

---

### Story 4.1: Supabase Time Entries Table and Sync

As a power user,
I want my time entries to sync to the cloud,
So that I can access my time tracking data from any device.

**Acceptance Criteria:**

**Given** I complete a time tracking session (stop tracking)
**When** the time entry is saved
**Then** the entry is saved to IndexedDB immediately (for offline support)
**And** the entry is queued for sync to Supabase via the existing sync queue

**Given** I am online and have pending time entries
**When** the sync runs
**Then** time entries are pushed to the `time_entries` Supabase table
**And** sync status is updated (entry marked as synced)

**Given** I open the app on a different device (same account)
**When** the app loads
**Then** time entries from Supabase are fetched and merged with local entries
**And** I see all my time entries from all devices

**Given** I am offline when I stop tracking
**When** I go back online
**Then** the pending time entry syncs automatically
**And** no data is lost

**And** Supabase table uses RLS: users can only read/write their own entries
**And** time entries include `user_id` column referencing `auth.users`
**And** indexes exist for efficient querying by `user_id + date` and `user_id + task_id`

**Prerequisites:** Epic 1 complete (time entries must exist locally first)

**Technical Notes:**
- Create Supabase migration per Architecture spec:
  ```sql
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
  ```
- Add RLS policies per Architecture spec
- Integrate with existing `useSyncQueue` pattern
- Add `useTimeEntries.ts` hook for CRUD with sync queue integration
- On app load: fetch from Supabase, merge with IndexedDB (newer wins)
- Conflict resolution: use `updated_at` timestamp, most recent wins

**Frontend Test Hint:** Track time on Device A → stop → verify entry syncs to Supabase (check network tab) → open app on Device B → see the time entry appears → track on Device B → verify it appears on Device A after refresh.

---

### Story 4.2: Time Entries in Export/Backup

As a power user,
I want my time entries included in app exports and backups,
So that I have a complete record of my productivity data.

**Acceptance Criteria:**

**Given** I trigger the app's export/backup functionality
**When** the export is generated
**Then** time entries are included in the export data
**And** each entry includes: task_name, start_time, end_time, duration, date

**Given** I restore from a backup that includes time entries
**When** the restore completes
**Then** time entries are restored to my account
**And** entries appear in the Insights modal

**Given** I have time entries with deleted tasks
**When** I export data
**Then** those entries are still included with their `task_name` snapshot
**And** `task_id` shows as null in export

**And** export format includes a `time_entries` section/array
**And** time entries are exported in chronological order
**And** duration is formatted as human-readable in export (e.g., "1h 23m")

**Prerequisites:** Story 4.1 (sync infrastructure must exist)

**Technical Notes:**
- Extend existing export functionality to include `time_entries` table
- Export format should match existing patterns (JSON or CSV depending on app)
- Include metadata: export date, entry count
- For restore: upsert entries using `id` as key
- Format duration for human readability in export: `formatDurationSummary(duration)`
- Ensure referential integrity: if task doesn't exist, `task_id` is null

**Frontend Test Hint:** Track some time entries → trigger export → download/view export file → verify time entries section exists with correct data → delete entries → restore from backup → verify entries reappear in Insights.

---

## FR Coverage Matrix

| FR | Description | Epic | Story |
|----|-------------|------|-------|
| FR1 | Open tracking modal via `Cmd+Shift+T` | Epic 1 | 1.1 |
| FR2 | See dropdown list of today's tasks | Epic 1 | 1.2 |
| FR3 | Select task and start tracking | Epic 1 | 1.2, 1.3 |
| FR4 | Track elapsed time in background | Epic 1 | 1.3 |
| FR5 | Reopen modal to see tracking status | Epic 1 | 1.4 |
| FR6 | Stop active time tracking | Epic 1 | 1.4 |
| FR7 | Save time entries with task association | Epic 1 | 1.4 |
| FR8 | Modal resets after stopping | Epic 1 | 1.4 |
| FR9 | Persist entries to IndexedDB | Epic 1 | 1.3, 1.4 |
| FR10 | Maintain referential integrity | Epic 1 | 1.2 |
| FR11 | Handle deleted task edge case | Epic 1 | 1.4 |
| FR12 | Track same task multiple times | Epic 1 | 1.4 |
| FR13 | Open insights via `Cmd+Shift+T T` | Epic 2 | 2.1 |
| FR14 | View total time tracked today | Epic 2 | 2.2 |
| FR15 | View time breakdown by task | Epic 2 | 2.2 |
| FR16 | View total time for current week | Epic 2 | 2.2 |
| FR17 | View daily totals for week | Epic 2 | 2.2 |
| FR18 | View chronological entry list | Epic 2 | 2.3 |
| FR19 | Close insights modal | Epic 2 | 2.1 |
| FR20 | Filter by date presets | Epic 3 | 3.1 |
| FR21 | Custom date range filter | Epic 3 | 3.2 |
| FR22 | Filter by specific task | Epic 3 | 3.3 |
| FR23 | Filter by category | Epic 3 | 3.3 |
| FR24 | Display active filters as chips | Epic 3 | 3.4 |
| FR25 | Remove individual filters | Epic 3 | 3.4 |
| FR26 | Recalculate metrics on filter | Epic 3 | 3.1-3.4 |
| FR27 | Update breakdown on filter | Epic 3 | 3.1-3.4 |
| FR28 | Update entries list on filter | Epic 3 | 3.1-3.4 |
| FR29 | Filter state persists in session | Epic 3 | 3.1 |
| FR44 | Persist tracking across refresh | Epic 1 | 1.3 |
| FR45 | Sync via existing mechanism | Epic 4 | 4.1 |
| FR46 | Offline functionality | Epic 1 | 1.3 |
| FR47 | Participate in export/backup | Epic 4 | 4.2 |

---

## Summary

**Total Epics:** 4
**Total Stories:** 13

| Epic | Stories | FRs Covered |
|------|---------|-------------|
| Epic 1: Time Tracking Foundation | 4 | FR1-FR12, FR44, FR46 |
| Epic 2: Time Insights Dashboard | 3 | FR13-FR19 |
| Epic 3: Insights Filtering | 4 | FR20-FR29 |
| Epic 4: Cross-Device Sync | 2 | FR45, FR47 |

**MVP Coverage:** All 33 MVP functional requirements are covered by the 13 stories across 4 epics.

**Implementation Order:**
1. Epic 1 → Core tracking works locally
2. Epic 2 → Users can see their time data
3. Epic 3 → Users can filter and analyze
4. Epic 4 → Data syncs and backs up

**Context Incorporated:**
- ✅ PRD requirements (all 33 MVP FRs mapped)
- ✅ UX interaction patterns (modal states, components, styling)
- ✅ Architecture technical decisions (IndexedDB, Supabase, hooks)

---

_For implementation: Use the `create-story` workflow to generate individual story implementation plans from this epic breakdown._

_This document incorporates all available context (PRD + UX + Architecture) and is ready for Phase 4 Implementation._

