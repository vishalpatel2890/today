# Story 4.4: Activity Export to File

Status: ready-for-dev

## Story

As a **user**,
I want **to export my activity log to a JSON or CSV file**,
so that **I can keep records or analyze data externally**.

## Acceptance Criteria

1. **AC4.4.1**: Given the activity log modal is open, when I click "Export" and select JSON format, then a native file save dialog appears
2. **AC4.4.2**: Given I choose a location in the file save dialog, then a .json file is saved with the full activity array
3. **AC4.4.3**: Given I click "Export" and select CSV format, then a .csv file is saved with headers: timestamp, app_name, window_title, duration_seconds
4. **AC4.4.4**: Given I export a file, then the default filename includes the task name and date (e.g., "activity-TaskName-2026-01-20.json")
5. **AC4.4.5**: Given the export is successful, then a toast notification confirms "Activity exported successfully"
6. **AC4.4.6**: Given the export fails (e.g., permission denied), then an error toast shows the failure reason

## Frontend Test Gate

**Gate ID**: 4-4-TG1

### Prerequisites
- [ ] Story 4.3 complete (Activity Summary showing in modal)
- [ ] `npm run dev:electron` launches Electron app successfully
- [ ] Activity data exists in IndexedDB for a completed time entry
- [ ] Activity Log Modal opens and displays activity data

### Test Steps (Manual Browser Testing)
| Step | User Action | Where (UI Element) | Expected Result |
|------|-------------|-------------------|-----------------|
| 1 | Run `npm run dev:electron` | Terminal | Electron window opens with Today app |
| 2 | Track time for 1+ minutes, using different apps | Task timer | Activity entries captured |
| 3 | Stop time tracking | Task timer button | Time entry saved with endTime |
| 4 | Open Time Insights modal | Main view (double-tap T) | Time Insights modal opens |
| 5 | Find completed time entry | Recent Entries section | Entry visible with "View Activity" button |
| 6 | Click "View Activity" button | Time entry row | Activity Log Modal opens with summary and list |
| 7 | Look for Export button/dropdown | Modal footer | Export option visible |
| 8 | Click Export and select "JSON" | Export dropdown/buttons | Native macOS file save dialog appears |
| 9 | Choose location and save | File save dialog | Dialog closes, file saved |
| 10 | Verify toast notification | Bottom of screen | "Activity exported successfully" toast appears |
| 11 | Open saved JSON file | Finder/Text editor | Valid JSON with activity entries array |
| 12 | Repeat export with "CSV" format | Export dropdown | Native file save dialog appears again |
| 13 | Save CSV file | File save dialog | CSV file created |
| 14 | Open CSV file | Text editor/Numbers | Headers: timestamp,app_name,window_title,duration_seconds with data rows |
| 15 | Check default filename | File save dialog | Filename includes task name and date |

### Success Criteria (What User Sees)
- [ ] Export button/dropdown visible in Activity Log Modal footer
- [ ] JSON and CSV format options available
- [ ] Native macOS file save dialog opens on export
- [ ] Default filename includes task name and date
- [ ] JSON file contains valid activity data array
- [ ] CSV file has correct headers and data rows
- [ ] Success toast appears after export completes
- [ ] No console errors in browser DevTools
- [ ] No network request failures (4xx/5xx)

### Feedback Questions
1. Is the export button easy to find in the modal?
2. Are both JSON and CSV formats useful for your needs?
3. Does the default filename make sense for organizing exports?
4. Is the success feedback clear enough?

## Tasks / Subtasks

- [ ] **Task 1: Implement activity:export IPC handler in main process** (AC: 4.4.1, 4.4.2, 4.4.3, 4.4.4)
  - [ ] 1.1: Add `ACTIVITY_EXPORT` channel to `electron/ipc/channels.ts`
  - [ ] 1.2: Create export handler in `electron/ipc/handlers.ts` that accepts `{ timeEntryId, format, taskName }`
  - [ ] 1.3: Use `dialog.showSaveDialog()` with appropriate filters for format
  - [ ] 1.4: Generate default filename: `activity-${sanitizedTaskName}-${date}.${format}`
  - [ ] 1.5: Fetch activity data from IndexedDB via renderer IPC call
  - [ ] 1.6: For JSON: Use `JSON.stringify(entries, null, 2)` for pretty-printed output
  - [ ] 1.7: For CSV: Generate with headers `timestamp,app_name,window_title,duration_seconds`, escape commas in window titles
  - [ ] 1.8: Write file using `fs.writeFile`
  - [ ] 1.9: Return `{ success: true, filePath }` or `{ success: false, error }`

- [ ] **Task 2: Update preload script with export method** (AC: 4.4.1)
  - [ ] 2.1: Add `export` method to `window.electronAPI.activity` in `electron/preload.ts`
  - [ ] 2.2: Update `src/types/electron.d.ts` with export method signature
  - [ ] 2.3: Update `src/lib/electronBridge.ts` with typed wrapper for export

- [ ] **Task 3: Create Export UI in Activity Log Modal** (AC: 4.4.1, 4.4.5, 4.4.6)
  - [ ] 3.1: Add export button/dropdown to `ActivityLogModal.tsx` footer
  - [ ] 3.2: Create format selection UI (JSON/CSV buttons or dropdown)
  - [ ] 3.3: Style consistently with existing modal patterns (Tailwind, Radix)
  - [ ] 3.4: Wire up click handler to call `window.electronAPI.activity.export()`
  - [ ] 3.5: Pass timeEntryId, format, and taskName to export function
  - [ ] 3.6: Show success toast on successful export
  - [ ] 3.7: Show error toast on export failure with error message

- [ ] **Task 4: Write tests** (AC: all)
  - [ ] 4.1: Unit test: CSV generation escapes commas in window titles
  - [ ] 4.2: Unit test: CSV generation formats duration_seconds correctly
  - [ ] 4.3: Unit test: JSON export includes all activity entry fields
  - [ ] 4.4: Unit test: Filename sanitization removes invalid characters
  - [ ] 4.5: Component test: Export button renders in modal footer
  - [ ] 4.6: Component test: Export dropdown shows JSON and CSV options
  - [ ] 4.7: Ensure all existing tests pass (baseline: 650 tests)

## Dev Notes

### Architecture Alignment

This story implements FR24-26 from the PRD:
- **FR24:** Export activity for single entry
- **FR25:** JSON and CSV export formats
- **FR26:** Native file save dialog

**From Architecture `notes/architecture-electron-migration.md`:**

The IPC contract for export is already defined:

```typescript
// activity:export
// Request
invoke('activity:export', timeEntryId: string, format: 'json' | 'csv')

// Response
{ success: true, filePath: string } | { success: false, error: string }
// Note: Uses native file dialog, user picks location
```

**IPC Channel Pattern:**
```typescript
// electron/ipc/channels.ts
export const IPC_CHANNELS = {
  // ... existing channels
  ACTIVITY_EXPORT: 'activity:export',
}
```

**Error Handling Pattern:**
```typescript
ipcMain.handle(channel, async (event, ...args) => {
  try {
    return { success: true, data: await doWork(...args) };
  } catch (error) {
    console.error(`[Electron] ${channel} error:`, error);
    return { success: false, error: error.message };
  }
});
```

### Project Structure Notes

**Files to Create:**
- None (all work extends existing files)

**Files to Modify:**
- `electron/ipc/channels.ts` - Add ACTIVITY_EXPORT channel
- `electron/ipc/handlers.ts` - Add export IPC handler with dialog and file write
- `electron/preload.ts` - Expose export method via contextBridge
- `src/types/electron.d.ts` - Add export method type definition
- `src/lib/electronBridge.ts` - Add typed export wrapper
- `src/components/time-tracking/ActivityLogModal.tsx` - Add export UI to footer

**Files to Use (unchanged):**
- `src/hooks/useActivityLog.ts` - Activity data retrieval (Story 4.1)
- `src/components/time-tracking/ActivitySummary.tsx` - Summary display (Story 4.3)
- `src/components/time-tracking/ActivityLogList.tsx` - Chronological list (Story 4.2)

### Learnings from Previous Story

**From Story 4-3-activity-duration-summary (Status: done)**

- **Test Baseline**: 650 tests passing - maintain this baseline
- **Modal Layout**: Footer is the natural place for export button (below content area)
- **Toast Pattern**: Use existing toast component for success/error feedback
- **Hook Return Type**: `useActivityLog` returns `{ entries, isLoading, error, summary, totalDurationMs, totalDurationFormatted }` - entries already have all data needed for export
- **Files Modified**:
  - `src/hooks/useActivityLog.ts` - Contains activity entries with duration
  - `src/components/time-tracking/ActivityLogModal.tsx` - Will add export button here

**Reusable Code from Story 4.3:**
- `ActivityEntryWithDuration` interface in useActivityLog.ts - has all fields for export
- `formatActivityDuration()` - not needed for export (using raw ms for CSV)

[Source: notes/sprint-artifacts/4-3-activity-duration-summary.md#Dev-Agent-Record]

### Implementation Approach

1. **IPC Handler First** - Implement main process export handler with dialog and file write
2. **Update Bridge** - Expose export method via preload and typed wrapper
3. **Add UI** - Export button/dropdown in modal footer with format selection
4. **Add Feedback** - Success/error toasts
5. **Add Tests** - Unit tests for CSV/JSON generation, component tests for UI

**CSV Generation Pattern:**

```typescript
function generateCSV(entries: ActivityEntryWithDuration[]): string {
  const headers = 'timestamp,app_name,window_title,duration_seconds'
  const rows = entries.map(e => {
    // Escape commas and quotes in window title
    const escapedTitle = `"${e.windowTitle.replace(/"/g, '""')}"`
    const durationSeconds = Math.round(e.durationMs / 1000)
    return `${e.timestamp},${e.appName},${escapedTitle},${durationSeconds}`
  })
  return [headers, ...rows].join('\n')
}
```

**Filename Sanitization:**

```typescript
function sanitizeFilename(name: string): string {
  // Remove invalid filename characters
  return name.replace(/[<>:"/\\|?*]/g, '-').trim()
}
```

**Export Dialog Configuration:**

```typescript
const result = await dialog.showSaveDialog({
  defaultPath: `activity-${sanitizedTaskName}-${dateStr}.${format}`,
  filters: format === 'json'
    ? [{ name: 'JSON Files', extensions: ['json'] }]
    : [{ name: 'CSV Files', extensions: ['csv'] }],
})
```

### References

- [Source: notes/architecture-electron-migration.md#IPC-Contracts]
- [Source: notes/architecture-electron-migration.md#Activity-Export]
- [Source: notes/epics-electron-migration.md#Story-4.4]
- [Source: notes/sprint-artifacts/4-3-activity-duration-summary.md#Dev-Agent-Record]

## Dev Agent Record

### Context Reference

- [notes/sprint-artifacts/4-4-activity-export-to-file.context.xml](./4-4-activity-export-to-file.context.xml)

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-20 | Story drafted from epics, tech spec, architecture, and previous story learnings | SM Agent |
