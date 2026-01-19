# Today - Time Tracking UX Design Specification

_Created on 2026-01-10 by Vishal_
_Generated using BMad Method - Create UX Design Workflow v1.0_

---

## Executive Summary

This UX specification defines the user experience for Time Tracking, a hidden power-user feature in the Today app. The design prioritizes:

- **Keyboard-first interaction** - Every action achievable via hotkeys
- **Minimal friction** - Start/stop tracking in under 2 seconds
- **Visual consistency** - Seamless integration with existing Slate Sophisticated theme
- **Easter egg delight** - Rewards discovery without cluttering the main experience

**Core Experience Statement:** "Press a hotkey, pick a task, track time - no friction, no context switch."

**Target Users:**
- Productivity enthusiasts seeking pattern insights
- Freelancers tracking billable hours

---

## 1. Design System Foundation

### 1.1 Design System Choice

**Decision:** Extend existing Today app design system

**Rationale:** Time Tracking is a feature addition, not a standalone product. It must feel native to the existing app experience. Using the established Slate Sophisticated theme ensures:
- Visual coherence with existing modals (DeferModal, LinkEmailModal)
- Familiar interaction patterns for existing users
- Zero learning curve for design language
- Consistent accessibility compliance

**Existing System Provides:**
- Color tokens (background, surface, primary, semantic colors)
- Typography (Playfair Display for headings, DM Sans for body)
- Spacing system (8px base unit)
- Border radius (6px default)
- Shadow system (sm, default, lg)
- Modal component patterns (Radix Dialog)
- Button hierarchy (primary, secondary)
- Animation patterns (fade-in, slide-up)

**Custom Components Needed:**
1. **TimeDisplay** - Live elapsed time counter
2. **TaskSelector** - Dropdown optimized for keyboard selection
3. **InsightCard** - Data summary component
4. **InsightRow** - Time entry list item
5. **QuickFilterBar** - Date range quick selection chips
6. **FilterDropdown** - Task/Category filter dropdowns
7. **FilterChip** - Removable active filter indicator
8. **WeeklyChart** - Simple bar visualization (Growth phase)

---

## 2. Core User Experience

### 2.1 Defining Experience

**The defining experience is: "Invisible power at your fingertips"**

When someone describes this feature to a friend, they'd say:
_"There's this hidden time tracker - you just hit a keyboard shortcut and boom, you're tracking. No apps to open, no UI to navigate. And it shows you exactly where your time goes."_

**UX Classification:** This uses **standard modal patterns** with a **novel trigger mechanism** (hidden keyboard shortcut). The interaction model itself is familiar (dropdown → button → timer), but the access pattern is novel.

### 2.2 Core Experience Principles

| Principle | Definition | Application |
|-----------|------------|-------------|
| **Speed** | Instant response | Modal appears within 100ms of hotkey |
| **Guidance** | Minimal - power users only | No onboarding, no tooltips, no hints |
| **Flexibility** | Constrained for simplicity | Limited options, clear paths |
| **Feedback** | Subtle but confirming | Brief visual cues, no celebration |

### 2.3 Interaction Model

**Tracking Modal States:**

```
┌─────────────────────────────────────────────────────────┐
│                      IDLE STATE                         │
│                                                         │
│  [Task Dropdown ▾]                                      │
│                                                         │
│           [ Track ]                                     │
│                                                         │
└─────────────────────────────────────────────────────────┘
                         │
                         │ User selects task + clicks Track
                         ▼
┌─────────────────────────────────────────────────────────┐
│                     ACTIVE STATE                        │
│                                                         │
│  Currently tracking:                                    │
│  "Review client proposal"                               │
│                                                         │
│           ⏱ 01:23:45                                    │
│                                                         │
│           [ Stop ]                                      │
│                                                         │
└─────────────────────────────────────────────────────────┘
                         │
                         │ User clicks Stop
                         ▼
┌─────────────────────────────────────────────────────────┐
│                   SUCCESS FEEDBACK                      │
│                                                         │
│  ✓ Saved: 1h 23m on "Review client proposal"           │
│                                                         │
│           (auto-closes after 1.5s)                      │
│                                                         │
└─────────────────────────────────────────────────────────┘
                         │
                         │ Auto-reset
                         ▼
                    [IDLE STATE]
```

**Insights Modal Structure (with Filtering):**

```
┌─────────────────────────────────────────────────────────┐
│  Time Insights                                    [×]   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  [Today] [Yesterday] [This Week] [This Month] [Custom]  │
│                                                         │
│  ┌─────────────────┐  ┌─────────────────┐               │
│  │ Tasks ▾         │  │ Category ▾      │               │
│  │ All tasks       │  │ All             │               │
│  └─────────────────┘  └─────────────────┘               │
│                                                         │
│  [Active filters as chips: "This Week" ×] ["Client" ×]  │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  TODAY                           AVG / DAY              │
│  ┌─────────────────┐             ┌─────────────────┐    │
│  │   3h 42m        │             │   4h 12m        │    │
│  │   tracked       │             │   this week     │    │
│  └─────────────────┘             └─────────────────┘    │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  BREAKDOWN                                   (4 tasks)  │
│                                                         │
│  Review client proposal          1h 23m                 │
│  Write documentation             1h 05m                 │
│  Fix login bug                   0h 42m                 │
│  Team sync                       0h 32m                 │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  RECENT ENTRIES                            (4 entries)  │
│                                                         │
│  Today 2:30pm   Review client proposal    1h 23m        │
│  Today 11:00am  Write documentation       1h 05m        │
│  Yesterday      Fix login bug             0h 42m        │
│  Yesterday      Team sync                 0h 32m        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Filtering Capabilities:**
- **Quick Date Filters**: Today, Yesterday, This Week, This Month, Custom (date picker)
- **Task Filter**: Filter to specific tasks from dropdown
- **Category Filter**: Filter by task category (from existing categories)
- **Active Filters**: Shown as removable chips below filter bar
- **Summary Updates**: All metrics recalculate based on active filters

---

## 3. Visual Foundation

### 3.1 Color System

**Using existing Slate Sophisticated theme with calmer semantic colors.**

| Token | Value | Usage in Time Tracking |
|-------|-------|----------------------|
| `--background` | #f8fafc | Modal backdrop content |
| `--surface` | #ffffff | Modal surface |
| `--surface-muted` | #f1f5f9 | Insight cards, hover states, success feedback bg |
| `--border` | #e2e8f0 | Section dividers |
| `--foreground` | #0f172a | Primary text, time display |
| `--muted-foreground` | #64748b | Labels, secondary text, success icon |
| `--primary` | #475569 | Track button |
| `--primary-hover` | #334155 | Button hover |
| `--stop` | #78716c | Stop button (muted stone) |
| `--stop-hover` | #57534e | Stop button hover |

**Design Decision:** Avoid bright red/green for semantic colors. Use muted slate tones that maintain calm, minimalist aesthetic. Success feedback uses slate gray icon on light gray background instead of bright green.

### 3.2 Typography

**Using existing font system:**

| Element | Font | Size | Weight | Usage |
|---------|------|------|--------|-------|
| Modal title | Playfair Display | 18px | 600 | "Time Tracking", "Time Insights" |
| Time display | DM Sans | 32px | 600 | Elapsed time counter |
| Section headers | DM Sans | 14px | 500 | "TODAY'S BREAKDOWN" |
| Task names | DM Sans | 15px | 400 | Task text in lists |
| Duration | DM Sans | 14px | 500 | Time values |
| Labels | DM Sans | 13px | 400 | "tracked", timestamps |

### 3.3 Spacing System

**Using existing 8px base unit:**

| Context | Spacing | CSS Variable |
|---------|---------|--------------|
| Modal padding | 24px | `--space-6` |
| Section gap | 16px | `--space-4` |
| Component padding | 12px | `--space-3` |
| Tight spacing | 8px | `--space-2` |
| Minimal spacing | 4px | `--space-1` |

### 3.4 Border & Shadow

| Element | Border Radius | Shadow |
|---------|--------------|--------|
| Modal | 16px (mobile top), 8px (desktop) | `--shadow-lg` |
| Buttons | 6px | none |
| Insight cards | 8px | `--shadow-sm` |
| Dropdown | 6px | `--shadow` |

---

## 4. Design Direction

### 4.1 Chosen Design Approach

**Direction: "Compact Command Palette"**

**Characteristics:**
- **Layout:** Centered modal, minimal height
- **Density:** Compact - only essential information
- **Visual weight:** Light - subtle borders, minimal shadows
- **Interaction:** Keyboard-optimized, single-action focus

**Rationale:** This approach matches:
1. The hidden/power-user nature (no hand-holding)
2. The keyboard-first requirement (compact = less to navigate)
3. The existing modal patterns in Today app
4. The goal of <2 second interactions

### 4.2 Modal Sizing

**Tracking Modal:**
- Width: 320px (desktop) / full-width minus padding (mobile)
- Height: Auto (content-driven, ~200px idle, ~220px active)
- Position: Centered (desktop) / Bottom sheet (mobile)

**Insights Modal:**
- Width: 420px (desktop) / full-width minus padding (mobile)
- Height: Auto with max-height 80vh, scrollable
- Position: Centered (desktop) / Bottom sheet (mobile)

---

## 5. User Journey Flows

### 5.1 Flow: Start Tracking

**User Goal:** Begin tracking time on a specific task

**Approach:** Single-screen, minimal steps

```
┌────────────────────────────────────────────────────────────────┐
│ STEP 1: Trigger                                                │
│ User presses Cmd+Shift+T (anywhere in app)                     │
│                                                                │
│ → System: Show tracking modal (idle state)                     │
│ → Focus: Auto-focus task dropdown                              │
└────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│ STEP 2: Select Task                                            │
│ User clicks dropdown or starts typing to filter                │
│                                                                │
│ → System: Show today's tasks in dropdown                       │
│ → Keyboard: Arrow keys to navigate, Enter to select            │
└────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│ STEP 3: Start Tracking                                         │
│ User clicks "Track" button or presses Enter                    │
│                                                                │
│ → System: Close modal, start background timer                  │
│ → Feedback: None needed (modal closes = tracking started)      │
│ → Persistence: Save start time to IndexedDB                    │
└────────────────────────────────────────────────────────────────┘
```

**Error States:**
- No tasks for today → Show message "No tasks for today. Add a task first."
- Already tracking → Show active state instead of idle state

---

### 5.2 Flow: Stop Tracking

**User Goal:** End current tracking session

```
┌────────────────────────────────────────────────────────────────┐
│ STEP 1: Open Modal                                             │
│ User presses Cmd+Shift+T (while tracking active)               │
│                                                                │
│ → System: Show tracking modal (active state)                   │
│ → Display: Task name + live elapsed time                       │
└────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│ STEP 2: Stop                                                   │
│ User clicks "Stop" button or presses Enter                     │
│                                                                │
│ → System: Stop timer, save time entry                          │
│ → Feedback: Brief success message (1.5s)                       │
│ → Then: Auto-reset to idle state                               │
└────────────────────────────────────────────────────────────────┘
```

---

### 5.3 Flow: View Insights

**User Goal:** Understand time usage patterns

```
┌────────────────────────────────────────────────────────────────┐
│ STEP 1: Trigger                                                │
│ User presses Cmd+Shift+T T (double-tap T)                      │
│                                                                │
│ → System: Show insights modal                                  │
│ → Display: Today summary, week summary, breakdown, entries     │
└────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│ STEP 2: Browse                                                 │
│ User scrolls through insights                                  │
│                                                                │
│ → Keyboard: Tab to navigate sections                           │
│ → Scroll: Mouse or arrow keys                                  │
└────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│ STEP 3: Close                                                  │
│ User presses Escape or clicks X                                │
│                                                                │
│ → System: Close modal, return to app                           │
└────────────────────────────────────────────────────────────────┘
```

**Empty States:**
- No time tracked today → "No time tracked today. Press Cmd+Shift+T to start."
- No time tracked ever → "Start tracking time to see insights here."

---

## 6. Component Library

### 6.1 Component Strategy

**From Existing System:**
- Modal shell (Radix Dialog + existing styles)
- Buttons (primary, secondary patterns)
- Close button (X icon pattern)
- Overlay (black/50 backdrop)

**Custom Components:**

#### TimeDisplay

**Purpose:** Show live elapsed time in tracking modal

**Anatomy:**
- Time text (HH:MM:SS format for >1hr, MM:SS for <1hr)
- Optional label ("tracked")

**States:**
- Active: Updates every second
- Paused: Static display (for insights entries)

**Variants:**
- Large (32px) - Active tracking display
- Medium (16px) - Insight cards
- Small (14px) - Entry list items

**Accessibility:**
- aria-live="polite" for screen reader updates
- aria-label="Elapsed time: X hours Y minutes Z seconds"

---

#### TaskSelector

**Purpose:** Dropdown to select from today's tasks

**Anatomy:**
- Trigger button (shows selected task or placeholder)
- Dropdown menu (list of today's tasks)
- Empty state message

**States:**
- Default: "Select a task..."
- Open: Dropdown visible with task list
- Selected: Shows task name
- Disabled: When no tasks available
- Loading: (rare) Skeleton placeholder

**Behavior:**
- Opens on click or Enter
- Type-ahead filtering
- Arrow keys to navigate
- Enter to select
- Escape to close

**Accessibility:**
- role="combobox"
- aria-expanded
- aria-activedescendant for keyboard nav

---

#### InsightCard

**Purpose:** Display summary metric (e.g., "Today: 3h 42m")

**Anatomy:**
- Label (e.g., "TODAY")
- Value (e.g., "3h 42m")
- Sublabel (e.g., "tracked")

**States:**
- Default: Shows data
- Empty: Shows "0h 0m"
- Loading: Skeleton placeholder

**Variants:**
- Standard (single metric)
- Comparison (with trend indicator - Growth phase)

---

#### InsightRow

**Purpose:** Display individual time entry in list

**Anatomy:**
- Timestamp (e.g., "Today 2:30pm")
- Task name (truncated with ellipsis if long)
- Duration (e.g., "1h 23m")

**States:**
- Default: Normal display
- Hover: Subtle background highlight (Growth: show edit icon)

---

#### QuickFilterBar

**Purpose:** Quick date range selection for insights

**Anatomy:**
- Row of pill buttons: Today, Yesterday, This Week, This Month, Custom
- Only one active at a time

**States:**
- Default: Gray outline, muted text
- Active: Filled primary background, white text
- Hover: Border highlights

**Behavior:**
- Click to select date range
- Custom opens date picker modal
- Selection updates all insights data

---

#### FilterDropdown

**Purpose:** Filter insights by task or category

**Anatomy:**
- Label (e.g., "Tasks", "Category")
- Current value (e.g., "All tasks", "Client Work")
- Chevron icon
- Dropdown menu with options

**States:**
- Default: Shows current filter value
- Open: Dropdown visible with options
- Active filter: Border highlights, value in primary color

**Behavior:**
- Click to open dropdown
- Select option to filter
- "All" option clears the filter

---

#### FilterChip

**Purpose:** Display active filters as removable chips

**Anatomy:**
- Filter name text
- Remove (×) button

**States:**
- Active: Primary background, white text

**Behavior:**
- Click × to remove filter
- Removing updates insights data

---

## 7. UX Pattern Decisions

### 7.1 Consistency Rules

| Pattern | Decision | Rationale |
|---------|----------|-----------|
| **Button Hierarchy** | Primary: Track/Stop, Secondary: Cancel | Match existing modal buttons |
| **Feedback: Success** | Inline message in modal, auto-dismiss 1.5s | Minimal interruption |
| **Feedback: Error** | Inline message, persists until dismissed | Must be acknowledged |
| **Loading** | Skeleton in InsightCards, no full-page loader | Data loads fast enough |
| **Modal Dismiss** | Click outside, Escape key, X button | Match existing DeferModal |
| **Focus Management** | Auto-focus first actionable element | Standard modal pattern |
| **Form Labels** | Above input | Match existing form pattern |
| **Keyboard Shortcuts** | Cmd+Shift+T (track), Cmd+Shift+T T (insights) | Modifier+letter pattern |
| **Time Format** | "Xh Ym" for display, "HH:MM:SS" for live counter | Human-readable summaries |
| **Empty States** | Encouraging message + call to action | Guide user to next step |

### 7.2 Hotkey Implementation

**Primary Hotkey: `Cmd+Shift+T`**
- Opens tracking modal (toggles between idle/active states)
- If already open, closes it
- Works from any view in the app

**Secondary Hotkey: `Cmd+Shift+T T`**
- Opens insights modal
- Detection: If second T pressed within 300ms of first Cmd+Shift+T
- If detection unreliable, fallback to `Cmd+Shift+I`

**Keyboard within Modals:**
- `Enter`: Confirm action (Track, Stop, Select)
- `Escape`: Close modal
- `Tab`: Navigate focusable elements
- `Arrow Up/Down`: Navigate dropdown options

---

## 8. Responsive Design & Accessibility

### 8.1 Responsive Strategy

**Breakpoints:**
- Mobile: < 768px
- Desktop: >= 768px

**Mobile Adaptations:**

| Element | Mobile | Desktop |
|---------|--------|---------|
| Modal position | Bottom sheet (slide up) | Centered |
| Modal border-radius | 16px top corners | 8px all corners |
| Modal width | 100% - 32px padding | 320px / 420px |
| Touch targets | Min 44px height | Min 36px height |
| Dropdown | Full-width | Standard width |

**Hotkey on Mobile:**
- Hotkeys don't work on mobile (no keyboard typically)
- For Growth phase: Add discreet settings gear icon that reveals time tracking toggle
- MVP: Feature is keyboard-only, mobile users won't discover it

### 8.2 Accessibility Strategy

**WCAG Compliance Target:** AA

**Key Requirements:**

| Requirement | Implementation |
|-------------|----------------|
| **Color Contrast** | All text meets 4.5:1 ratio (inherits from existing system) |
| **Keyboard Navigation** | Full keyboard support for all interactions |
| **Focus Indicators** | Use existing focus ring styles (`focus:border-primary focus:outline-none`) |
| **Screen Reader** | Announce modal open, tracking start/stop, time updates |
| **ARIA Labels** | Descriptive labels for all interactive elements |
| **Motion** | Respect `prefers-reduced-motion` for animations |

**Screen Reader Announcements:**
- Modal open: "Time tracking dialog opened"
- Tracking started: "Now tracking [task name]"
- Time update: Every minute, announce current duration (aria-live="polite")
- Tracking stopped: "Stopped tracking. [Duration] logged for [task name]"
- Modal close: "Time tracking dialog closed"

---

## 9. Implementation Guidance

### 9.1 Component Hierarchy

```
TimeTrackingFeature/
├── hooks/
│   ├── useTimeTracking.ts      # Timer logic, state management
│   ├── useTimeEntries.ts       # CRUD for time entries in IndexedDB
│   └── useTimeInsights.ts      # Aggregation calculations
├── components/
│   ├── TimeTrackingModal.tsx   # Main tracking modal
│   ├── TimeInsightsModal.tsx   # Insights view modal
│   ├── TimeDisplay.tsx         # Elapsed time component
│   ├── TaskSelector.tsx        # Task dropdown
│   ├── InsightCard.tsx         # Summary metric card
│   └── InsightRow.tsx          # Time entry row
└── types/
    └── timeTracking.ts         # TypeScript interfaces
```

### 9.2 State Management

**Global State (persisted in IndexedDB):**
- `timeEntries[]` - All completed time entries
- `activeSession` - Currently tracking: `{ taskId, taskName, startTime }` or null

**Local State (component):**
- Modal open/closed
- Selected task (before tracking starts)
- Live elapsed time (derived from activeSession.startTime)

### 9.3 Data Schema

```typescript
interface TimeEntry {
  id: string;              // UUID
  taskId: string;          // Reference to task (may be deleted)
  taskName: string;        // Snapshot of task name at creation
  startTime: string;       // ISO timestamp
  endTime: string;         // ISO timestamp
  duration: number;        // Milliseconds
  date: string;            // YYYY-MM-DD for easy grouping
  createdAt: string;       // ISO timestamp
}

interface ActiveSession {
  taskId: string;
  taskName: string;
  startTime: string;       // ISO timestamp
}
```

---

## Appendix

### Related Documents

- Product Requirements: `notes/PRD-time-tracking.md`
- Main App PRD: `notes/prd.md`
- Existing UX Spec: `notes/ux-design-specification.md`

### Interactive Deliverables

- **Design Direction Mockups:** `notes/ux-time-tracking-mockups.html`

### Version History

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2026-01-10 | 1.0 | Initial UX Design Specification | Vishal |

---

_This UX Design Specification was created through collaborative design facilitation. All decisions integrate with the existing Today app design system for seamless feature addition._
